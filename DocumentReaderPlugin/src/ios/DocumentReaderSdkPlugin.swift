import Foundation
import Cordova
import AVFoundation
import UIKit
import WebKit
import CoreImage
import CoreVideo

@objc(DocumentReaderSdkPlugin)
public class DocumentReaderSdkPlugin: CDVPlugin, AVCaptureVideoDataOutputSampleBufferDelegate {
  private var captureSession: AVCaptureSession?
  private var previewContainer: UIView?
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var videoOutput: AVCaptureVideoDataOutput?
  private var boundsObserver: NSKeyValueObservation?
  private let videoQueue = DispatchQueue(label: "com.documentreadersdk.camera")
  private let frameLock = NSLock()
  private let ciContext = CIContext(options: nil)
  private var lastFrameTime: CFTimeInterval = 0
  private var capturing = false
  private var usingFrontCamera = false
  private var originalWebViewOpaque: Bool?
  private var lastLiveImage: UIImage?

  private var wkWebView: WKWebView? {
    self.webViewEngine?.engineWebView as? WKWebView
  }

  @objc(getMachineCode:)
  func getMachineCode(_ command: CDVInvokedUrlCommand) {
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked. Drop frameworks into ios/Frameworks/.", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      let mc = DocSdkBridge.getMachineCode()
      self.success(command, ["value": mc])
    }
  }

  @objc(setActivation:)
  func setActivation(_ command: CDVInvokedUrlCommand) {
    let opts = command.arguments.first as? [String: Any] ?? [:]
    guard let license = opts["license"] as? String, !license.isEmpty else {
      fail(command, "license is required", code: "E_ACTIVATION")
      return
    }
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      let code = DocSdkBridge.setActivation(license)
      self.success(command, ["value": code])
    }
  }

  @objc(init:)
  func initSdk(_ command: CDVInvokedUrlCommand) {
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      let code = DocSdkBridge.initSDK()
      self.success(command, ["value": code])
    }
  }

  @objc(deinit:)
  func deinitSdk(_ command: CDVInvokedUrlCommand) {
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      DocSdkBridge.deinitSDK()
      self.success(command)
    }
  }

  @objc(startNewSession:)
  func startNewSession(_ command: CDVInvokedUrlCommand) {
    let opts = command.arguments.first as? [String: Any] ?? [:]
    let optionsJson = opts["optionsJson"] as? String
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      let json = DocSdkBridge.startNewSession(optionsJson)
      self.success(command, ["value": json])
    }
  }

  @objc(locateDocument:)
  func locateDocument(_ command: CDVInvokedUrlCommand) {
    let opts = command.arguments.first as? [String: Any] ?? [:]
    guard let image = opts["image"] as? String, !image.isEmpty else {
      fail(command, "image is required", code: "E_IMAGE")
      return
    }
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let json = try DocSdkBridge.locateDocument(image)
        self.success(command, ["value": json])
      } catch {
        self.fail(command, error.localizedDescription, code: "E_LOCATE")
      }
    }
  }

  @objc(recognize:)
  func recognize(_ command: CDVInvokedUrlCommand) {
    let opts = command.arguments.first as? [String: Any] ?? [:]
    guard let front = opts["front"] as? String, !front.isEmpty else {
      fail(command, "front is required", code: "E_IMAGE")
      return
    }
    let back = opts["back"] as? String
    let authenticityMode = (opts["authenticityMode"] as? String)
      ?? (((opts["authenticity"] as? Bool) ?? true) ? "normal" : "none")
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let json = try DocSdkBridge.recognizeFront(
          front,
          back: back,
          authenticityMode: authenticityMode
        )
        self.success(command, ["value": json])
      } catch {
        self.fail(command, error.localizedDescription, code: "E_RECOGNIZE")
      }
    }
  }

  @objc(documentRecognition:)
  func documentRecognition(_ command: CDVInvokedUrlCommand) {
    processStill(command, livenessOnly: false)
  }

  @objc(documentLiveness:)
  func documentLiveness(_ command: CDVInvokedUrlCommand) {
    processStill(command, livenessOnly: true)
  }

  private func processStill(_ command: CDVInvokedUrlCommand, livenessOnly: Bool) {
    let opts = command.arguments.first as? [String: Any] ?? [:]
    guard let front = opts["front"] as? String, !front.isEmpty else {
      fail(command, "front is required", code: "E_IMAGE")
      return
    }
    let back = opts["back"] as? String
    guard DocSdkBridge.isAvailable() else {
      fail(command, "docsdk.framework not linked", code: "E_SDK")
      return
    }
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let json = try DocSdkBridge.processStill(
          front,
          back: back,
          livenessOnly: livenessOnly
        )
        self.success(command, ["value": json])
      } catch {
        self.fail(
          command,
          error.localizedDescription,
          code: livenessOnly ? "E_LIVENESS" : "E_RECOGNITION"
        )
      }
    }
  }

  @objc(lastLicenseError:)
  func lastLicenseError(_ command: CDVInvokedUrlCommand) {
    success(command, ["value": DocSdkBridge.lastLicenseError()])
  }

  @objc(getLicenseStatus:)
  func getLicenseStatus(_ command: CDVInvokedUrlCommand) {
    success(command, ["value": DocSdkBridge.getLicenseStatus()])
  }

  @objc(writeStatus:)
  func writeStatus(_ command: CDVInvokedUrlCommand) {
    let opts = command.arguments.first as? [String: Any] ?? [:]
    let payload = (opts["payload"] as? String) ?? "{}"
    DocSdkBridge.writeStatusRaw(payload)
    success(command)
  }

  @objc(requestCameraPermission:)
  func requestCameraPermission(_ command: CDVInvokedUrlCommand) {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
      success(command)
    case .notDetermined:
      AVCaptureDevice.requestAccess(for: .video) { granted in
        DispatchQueue.main.async {
          if granted {
            self.success(command)
          } else {
            self.fail(command, "Camera permission denied", code: "E_CAMERA")
          }
        }
      }
    case .denied, .restricted:
      fail(command, "Camera permission denied", code: "E_CAMERA")
    @unknown default:
      fail(command, "Camera permission denied", code: "E_CAMERA")
    }
  }

  @objc(startLivePreview:)
  func startLivePreview(_ command: CDVInvokedUrlCommand) {
    let opts = command.arguments.first as? [String: Any] ?? [:]
    // Documents default to rear camera when frontCamera is omitted.
    let front = (opts["frontCamera"] as? Bool) ?? false
    DispatchQueue.main.async {
      self.stopSession()
      self.usingFrontCamera = front
      let session = AVCaptureSession()
      // 4:3 matches typical analysis frames and FILL_CENTER overlay math.
      session.sessionPreset = .photo
      let position: AVCaptureDevice.Position = front ? .front : .back
      guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
        ?? AVCaptureDevice.default(for: .video) else {
        self.fail(command, "No camera", code: "E_CAMERA")
        return
      }
      do {
        let input = try AVCaptureDeviceInput(device: device)
        if session.canAddInput(input) {
          session.addInput(input)
        }
        let output = AVCaptureVideoDataOutput()
        output.alwaysDiscardsLateVideoFrames = true
        output.videoSettings = [
          kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        output.setSampleBufferDelegate(self, queue: self.videoQueue)
        if session.canAddOutput(output) {
          session.addOutput(output)
        }
        if let conn = output.connection(with: .video) {
          if conn.isVideoOrientationSupported {
            conn.videoOrientation = .portrait
          }
          if conn.isVideoMirroringSupported {
            conn.isVideoMirrored = false
          }
        }
        self.videoOutput = output
        self.captureSession = session
        guard self.attachPreview(session: session, front: front) else {
          self.stopSession()
          self.fail(command, "Could not attach camera preview", code: "E_CAMERA")
          return
        }
        self.setWebViewTransparent(true)
        DispatchQueue.global(qos: .userInitiated).async {
          session.startRunning()
          DispatchQueue.main.async {
            self.layoutPreview()
            self.applyPreviewConnection()
          }
          self.success(command)
        }
      } catch {
        self.fail(command, error.localizedDescription, code: "E_CAMERA")
      }
    }
  }

  @objc(stopLivePreview:)
  func stopLivePreview(_ command: CDVInvokedUrlCommand) {
    DispatchQueue.main.async {
      self.stopSession()
      self.success(command)
    }
  }

  @objc(takeLiveSnapshot:)
  func takeLiveSnapshot(_ command: CDVInvokedUrlCommand) {
    DispatchQueue.global(qos: .userInitiated).async {
      self.frameLock.lock()
      let image = self.lastLiveImage
      self.frameLock.unlock()
      guard let image = image else {
        self.fail(command, "Live preview is not running", code: "E_CAMERA")
        return
      }
      guard let uri = self.writeLiveJpeg(image) else {
        self.fail(command, "Could not write snapshot", code: "E_CAMERA")
        return
      }
      self.success(command, [
        "uri": uri,
        "path": uri.replacingOccurrences(of: "file://", with: ""),
      ])
    }
  }

  public func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    let now = CACurrentMediaTime()
    if now - lastFrameTime < 0.12 || capturing {
      return
    }
    lastFrameTime = now
    capturing = true
    defer { capturing = false }
    guard let image = imageFromSampleBuffer(sampleBuffer) else { return }
    let prepared = scaleMax(image, maxEdge: 640)
    frameLock.lock()
    lastLiveImage = prepared
    frameLock.unlock()
  }

  private func imageFromSampleBuffer(_ sampleBuffer: CMSampleBuffer) -> UIImage? {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return nil }
    let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
    guard let cgImage = ciContext.createCGImage(ciImage, from: ciImage.extent) else { return nil }
    return UIImage(cgImage: cgImage, scale: 1, orientation: .up)
  }

  private func scaleMax(_ image: UIImage, maxEdge: CGFloat) -> UIImage {
    let size = image.size
    let edge = max(size.width, size.height)
    if edge <= maxEdge || edge <= 0 {
      return image
    }
    let scale = maxEdge / edge
    let target = CGSize(width: max(1, floor(size.width * scale)), height: max(1, floor(size.height * scale)))
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1
    format.opaque = true
    let renderer = UIGraphicsImageRenderer(size: target, format: format)
    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: target))
    }
  }

  private func writeLiveJpeg(_ image: UIImage) -> String? {
    guard let data = image.jpegData(compressionQuality: 0.85) else { return nil }
    let name = "drs_live_\(Int(Date().timeIntervalSince1970 * 1000)).jpg"
    let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(name)
    do {
      try data.write(to: url, options: .atomic)
      return url.absoluteString
    } catch {
      return nil
    }
  }

  private func attachPreview(session: AVCaptureSession, front: Bool) -> Bool {
    guard let webView = self.webView else { return false }
    guard let host = webView.superview ?? self.viewController?.view else {
      return false
    }
    // Pin to the WebView frame (not the full host) so FILL_CENTER crop matches
    // the HTML overlay inside the Cordova WebView.
    let frame = webView.frame.isEmpty ? host.bounds : webView.frame
    let container = UIView(frame: frame)
    container.isUserInteractionEnabled = false
    container.backgroundColor = .black
    container.clipsToBounds = true

    let layer = AVCaptureVideoPreviewLayer(session: session)
    layer.videoGravity = .resizeAspectFill
    layer.frame = container.bounds
    if let conn = layer.connection {
      if conn.isVideoOrientationSupported {
        conn.videoOrientation = .portrait
      }
      if conn.isVideoMirroringSupported {
        conn.automaticallyAdjustsVideoMirroring = false
        conn.isVideoMirrored = front
      }
    }
    container.layer.addSublayer(layer)
    previewLayer = layer
    previewContainer = container

    if let idx = host.subviews.firstIndex(of: webView) {
      host.insertSubview(container, at: idx)
    } else {
      host.insertSubview(container, at: 0)
    }
    host.bringSubviewToFront(webView)

    boundsObserver?.invalidate()
    boundsObserver = webView.observe(\.frame, options: [.new, .initial]) { [weak self] view, _ in
      guard let self = self else { return }
      self.previewContainer?.frame = view.frame
      self.layoutPreview()
    }
    layoutPreview()
    return true
  }

  private func layoutPreview() {
    guard let container = previewContainer else { return }
    if let webView = webView, !webView.frame.isEmpty {
      container.frame = webView.frame
    }
    previewLayer?.frame = container.bounds
    applyPreviewConnection()
  }

  private func applyPreviewConnection() {
    guard let conn = previewLayer?.connection else { return }
    if conn.isVideoOrientationSupported {
      conn.videoOrientation = .portrait
    }
    if conn.isVideoMirroringSupported {
      conn.automaticallyAdjustsVideoMirroring = false
      conn.isVideoMirrored = usingFrontCamera
    }
  }

  private func setWebViewTransparent(_ transparent: Bool) {
    guard let webView = self.webView else { return }
    if originalWebViewOpaque == nil {
      originalWebViewOpaque = webView.isOpaque
    }
    webView.isOpaque = !transparent && (originalWebViewOpaque ?? true)
    webView.backgroundColor = transparent ? .clear : nil
    if let wk = wkWebView {
      wk.scrollView.isOpaque = !transparent
      wk.scrollView.backgroundColor = transparent ? .clear : nil
      wk.scrollView.subviews.forEach { sub in
        if transparent {
          sub.backgroundColor = .clear
        }
      }
    }
  }

  private func stopSession() {
    boundsObserver?.invalidate()
    boundsObserver = nil
    captureSession?.stopRunning()
    captureSession = nil
    videoOutput?.setSampleBufferDelegate(nil, queue: nil)
    videoOutput = nil
    previewLayer?.removeFromSuperlayer()
    previewLayer = nil
    previewContainer?.removeFromSuperview()
    previewContainer = nil
    setWebViewTransparent(false)
  }

  private func success(_ command: CDVInvokedUrlCommand, _ message: [String: Any]? = nil) {
    let result: CDVPluginResult
    if let message = message {
      result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: message)
    } else {
      result = CDVPluginResult(status: CDVCommandStatus_OK)
    }
    self.commandDelegate.send(result, callbackId: command.callbackId)
  }

  private func fail(_ command: CDVInvokedUrlCommand, _ message: String, code: String? = nil) {
    let text: String
    if let code = code {
      text = "\(code): \(message)"
    } else {
      text = message
    }
    let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: text)
    self.commandDelegate.send(result, callbackId: command.callbackId)
  }
}
