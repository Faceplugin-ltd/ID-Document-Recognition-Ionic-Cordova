package com.documentreadersdk

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Matrix
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import android.widget.FrameLayout
import androidx.camera.core.AspectRatio
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.core.UseCaseGroup
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.faceplugin.documentreadersdk.DocumentReaderSDK
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PermissionHelper
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.Executors

class DocumentReaderSdkPlugin : CordovaPlugin() {

  companion object {
    private const val REQ_CAMERA = 90211
    private const val LOCATE_MAX_EDGE = 480
  }

  private val executor = Executors.newSingleThreadExecutor()
  private val analysisExecutor = Executors.newSingleThreadExecutor()
  @Volatile private var lastLiveBitmap: Bitmap? = null
  @Volatile private var analysisBusy = false
  @Volatile private var lastAnalysisMs = 0L

  private var cameraProvider: ProcessCameraProvider? = null
  private var previewView: PreviewView? = null
  private var previewHost: FrameLayout? = null
  private var pendingCameraCallback: CallbackContext? = null
  private var pendingFrontCamera: Boolean = false
  /** When true, permission grant continues into beginLivePreview. */
  private var pendingStartAfterPermission: Boolean = false

  override fun execute(action: String, args: JSONArray, callbackContext: CallbackContext): Boolean {
    val opts = args.optJSONObject(0) ?: JSONObject()
    when (action) {
      "getMachineCode" -> getMachineCode(callbackContext)
      "setActivation" -> setActivation(opts, callbackContext)
      "init" -> init(callbackContext)
      "deinit" -> deinit(callbackContext)
      "startNewSession" -> startNewSession(opts, callbackContext)
      "locateDocument" -> locateDocument(opts, callbackContext)
      "recognize" -> recognize(opts, callbackContext)
      "documentRecognition" -> documentRecognition(opts, callbackContext)
      "documentLiveness" -> documentLiveness(opts, callbackContext)
      "lastLicenseError" -> lastLicenseError(callbackContext)
      "getLicenseStatus" -> getLicenseStatus(callbackContext)
      "writeStatus" -> writeStatus(opts, callbackContext)
      "startLivePreview" -> startLivePreview(opts, callbackContext)
      "stopLivePreview" -> stopLivePreview(callbackContext)
      "takeLiveSnapshot" -> takeLiveSnapshot(callbackContext)
      "requestCameraPermission" -> requestCameraPermission(callbackContext)
      else -> return false
    }
    return true
  }

  override fun onRequestPermissionResult(
    requestCode: Int,
    permissions: Array<out String>?,
    grantResults: IntArray?
  ) {
    if (requestCode != REQ_CAMERA) return
    val cb = pendingCameraCallback ?: return
    val startAfter = pendingStartAfterPermission
    pendingCameraCallback = null
    pendingStartAfterPermission = false
    val granted =
      grantResults != null &&
        grantResults.isNotEmpty() &&
        grantResults[0] == PackageManager.PERMISSION_GRANTED
    if (!granted) {
      cb.error("E_CAMERA: Camera permission denied")
      return
    }
    if (startAfter) {
      beginLivePreview(pendingFrontCamera, cb)
    } else {
      cb.success()
    }
  }

  fun requestCameraPermission(callbackContext: CallbackContext) {
    val activity = cordova.activity
    if (activity == null) {
      callbackContext.error("E_CAMERA: No activity")
      return
    }
    if (
      ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) ==
        PackageManager.PERMISSION_GRANTED
    ) {
      callbackContext.success()
      return
    }
    pendingStartAfterPermission = false
    pendingCameraCallback = callbackContext
    PermissionHelper.requestPermission(this, REQ_CAMERA, Manifest.permission.CAMERA)
  }

  fun getMachineCode(callbackContext: CallbackContext) {
    executor.execute {
      try {
        val mc = DocumentReaderSDK.getMachineCode(cordova.context.applicationContext) ?: ""
        val ret = JSONObject()
        ret.put("value", mc)
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_MACHINE_CODE", t)
      }
    }
  }

  fun setActivation(opts: JSONObject, callbackContext: CallbackContext) {
    val license = opts.stringOrNull("license")
    if (license.isNullOrBlank()) {
      callbackContext.error("E_ACTIVATION: license is required")
      return
    }
    executor.execute {
      try {
        val code = DocumentReaderSDK.setActivation(cordova.context.applicationContext, license)
        val ret = JSONObject()
        ret.put("value", code)
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_ACTIVATION", t)
      }
    }
  }

  fun init(callbackContext: CallbackContext) {
    executor.execute {
      try {
        val code = DocumentReaderSDK.init(cordova.context.applicationContext)
        val ret = JSONObject()
        ret.put("value", code)
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_INIT", t)
      }
    }
  }

  fun deinit(callbackContext: CallbackContext) {
    executor.execute {
      try {
        DocumentReaderSDK.deinit()
        callbackContext.success()
      } catch (t: Throwable) {
        reject(callbackContext, "E_DEINIT", t)
      }
    }
  }

  fun startNewSession(opts: JSONObject, callbackContext: CallbackContext) {
    val optionsJson = opts.stringOrNull("optionsJson")
    executor.execute {
      try {
        val json = if (optionsJson.isNullOrBlank()) {
          DocumentReaderSDK.startNewSession()
        } else {
          DocumentReaderSDK.startNewSession(optionsJson)
        }
        val ret = JSONObject()
        ret.put("value", json ?: "")
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_SESSION", t)
      }
    }
  }

  fun locateDocument(opts: JSONObject, callbackContext: CallbackContext) {
    val imageUri = opts.stringOrNull("image")
    if (imageUri.isNullOrBlank()) {
      callbackContext.error("E_IMAGE: image is required")
      return
    }
    executor.execute {
      try {
        val bitmap = loadBitmap(imageUri)
          ?: run {
            callbackContext.error("E_IMAGE: Could not decode image: $imageUri")
            return@execute
          }
        val upright = uprightPortrait(bitmap)
        val locateBmp = scaleMax(upright, LOCATE_MAX_EDGE)
        val json = DocumentReaderSDK.locateDocument(locateBmp)
        val scaled = rescaleLocateJson(
          json,
          locateBmp.width,
          locateBmp.height,
          upright.width,
          upright.height
        )
        val ret = JSONObject()
        ret.put("value", scaled)
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_LOCATE", t)
      }
    }
  }

  fun recognize(opts: JSONObject, callbackContext: CallbackContext) {
    val frontUri = opts.stringOrNull("front")
    if (frontUri.isNullOrBlank()) {
      callbackContext.error("E_IMAGE: front is required")
      return
    }
    val backUri = opts.stringOrNull("back")
    val authenticityMode =
      opts.stringOrNull("authenticityMode")
        ?: if (opts.has("authenticity") && !opts.getBoolean("authenticity")) "none" else "normal"
    executor.execute {
      try {
        val frontRaw = loadBitmap(frontUri)
          ?: run {
            callbackContext.error("E_IMAGE: Could not decode front image: $frontUri")
            return@execute
          }
        val front = uprightPortrait(frontRaw)
        val back: Bitmap? =
          if (backUri.isNullOrBlank()) {
            null
          } else {
            loadBitmap(backUri)?.let { uprightPortrait(it) }
          }
        DocumentReaderSDK.startNewSession("{\"scenario\":\"FullProcess\",\"series\":false}")
        val json = DocumentReaderSDK.recognize(front, back, authenticityMode)
        val ret = JSONObject()
        ret.put("value", json ?: "")
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_RECOGNIZE", t)
      }
    }
  }

  fun documentRecognition(opts: JSONObject, callbackContext: CallbackContext) {
    processStill(opts, callbackContext, livenessOnly = false)
  }

  fun documentLiveness(opts: JSONObject, callbackContext: CallbackContext) {
    processStill(opts, callbackContext, livenessOnly = true)
  }

  fun processStill(opts: JSONObject, callbackContext: CallbackContext, livenessOnly: Boolean) {
    val frontUri = opts.stringOrNull("front")
    if (frontUri.isNullOrBlank()) {
      callbackContext.error("E_IMAGE: front is required")
      return
    }
    val backUri = opts.stringOrNull("back")
    executor.execute {
      try {
        val frontRaw = loadBitmap(frontUri)
          ?: run {
            callbackContext.error("E_IMAGE: Could not decode front image: $frontUri")
            return@execute
          }
        val front = uprightPortrait(frontRaw)
        val back: Bitmap? =
          if (backUri.isNullOrBlank()) {
            null
          } else {
            loadBitmap(backUri)?.let { uprightPortrait(it) }
          }
        DocumentReaderSDK.startNewSession("{\"scenario\":\"FullProcess\",\"series\":false}")
        val json =
          if (livenessOnly) DocumentReaderSDK.documentLiveness(front, back)
          else DocumentReaderSDK.documentRecognition(front, back)
        val ret = JSONObject()
        ret.put("value", json ?: "")
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, if (livenessOnly) "E_LIVENESS" else "E_RECOGNITION", t)
      }
    }
  }

  fun lastLicenseError(callbackContext: CallbackContext) {
    try {
      val ret = JSONObject()
      ret.put("value", DocumentReaderSDK.lastLicenseError() ?: "")
      callbackContext.success(ret)
    } catch (t: Throwable) {
      reject(callbackContext, "E_LICENSE_ERROR", t)
    }
  }

  fun getLicenseStatus(callbackContext: CallbackContext) {
    executor.execute {
      try {
        val json = DocumentReaderSDK.getLicenseStatus() ?: "{}"
        val ret = JSONObject()
        ret.put("value", json)
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_LICENSE_STATUS", t)
      }
    }
  }

  fun writeStatus(opts: JSONObject, callbackContext: CallbackContext) {
    val json = opts.stringOrNull("payload") ?: "{}"
    try {
      val file = java.io.File(cordova.context.filesDir, "docreader_status.json")
      file.writeText(json)
      callbackContext.success()
    } catch (t: Throwable) {
      reject(callbackContext, "E_STATUS", t)
    }
  }

  fun startLivePreview(opts: JSONObject, callbackContext: CallbackContext) {
    // Documents default to rear camera when frontCamera is omitted.
    val front = if (opts.has("frontCamera")) opts.getBoolean("frontCamera") else false
    val activity = cordova.activity
    if (activity == null) {
      callbackContext.error("E_CAMERA: No activity")
      return
    }
    if (
      ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) !=
        PackageManager.PERMISSION_GRANTED
    ) {
      pendingFrontCamera = front
      pendingStartAfterPermission = true
      pendingCameraCallback = callbackContext
      PermissionHelper.requestPermission(this, REQ_CAMERA, Manifest.permission.CAMERA)
      return
    }
    beginLivePreview(front, callbackContext)
  }

  private fun beginLivePreview(front: Boolean, callbackContext: CallbackContext) {
    val activity = cordova.activity
    if (activity == null) {
      callbackContext.error("E_CAMERA: No activity")
      return
    }
    activity.runOnUiThread {
      try {
        attachPreviewHost()
        val previewView = previewView ?: run {
          callbackContext.error("E_CAMERA: Preview view missing")
          return@runOnUiThread
        }
        // Wait for layout so ViewPort matches the WebView / overlay size.
        previewView.post {
          bindCameraUseCases(front, callbackContext)
        }
      } catch (t: Throwable) {
        reject(callbackContext, "E_CAMERA", t)
      }
    }
  }

  private fun bindCameraUseCases(front: Boolean, callbackContext: CallbackContext) {
    val activity = cordova.activity ?: run {
      callbackContext.error("E_CAMERA: No activity")
      return
    }
    val previewView = previewView ?: run {
      callbackContext.error("E_CAMERA: Preview view missing")
      return
    }
    val appContext = cordova.context
    val future = ProcessCameraProvider.getInstance(appContext)
    future.addListener({
      try {
        val provider = future.get()
        cameraProvider?.unbindAll()
        cameraProvider = provider
        syncPreviewHostToWebView()

        val preview = Preview.Builder()
          .setTargetAspectRatio(AspectRatio.RATIO_4_3)
          .build()
          .also { it.setSurfaceProvider(previewView.surfaceProvider) }

        val analysis = ImageAnalysis.Builder()
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
          .setTargetAspectRatio(AspectRatio.RATIO_4_3)
          .build()
        analysis.setAnalyzer(analysisExecutor) { image ->
          ingestAnalysisFrame(image)
        }

        val selector = if (front) {
          CameraSelector.DEFAULT_FRONT_CAMERA
        } else {
          CameraSelector.DEFAULT_BACK_CAMERA
        }

        // Shared ViewPort = Preview and Analysis crop identically (FILL_CENTER).
        val viewPort = previewView.viewPort
        if (viewPort != null) {
          val group = UseCaseGroup.Builder()
            .addUseCase(preview)
            .addUseCase(analysis)
            .setViewPort(viewPort)
            .build()
          provider.bindToLifecycle(activity as LifecycleOwner, selector, group)
        } else {
          provider.bindToLifecycle(
            activity as LifecycleOwner,
            selector,
            preview,
            analysis
          )
        }
        setWebViewTransparent(true)
        callbackContext.success()
      } catch (t: Throwable) {
        reject(callbackContext, "E_CAMERA", t)
      }
    }, ContextCompat.getMainExecutor(appContext))
  }

  fun stopLivePreview(callbackContext: CallbackContext) {
    val activity = cordova.activity
    if (activity == null) {
      cameraProvider = null
      callbackContext.success()
      return
    }
    activity.runOnUiThread {
      try {
        cameraProvider?.unbindAll()
        setWebViewTransparent(false)
        detachPreviewHost()
        callbackContext.success()
      } catch (t: Throwable) {
        reject(callbackContext, "E_CAMERA", t)
      }
    }
  }

  fun takeLiveSnapshot(callbackContext: CallbackContext) {
    executor.execute {
      try {
        val prepared = lastLiveBitmap ?: run {
          callbackContext.error("E_CAMERA: Live preview is not running")
          return@execute
        }
        val uri = writeLiveJpeg(prepared)
        val ret = JSONObject()
        ret.put("uri", uri)
        ret.put("path", uri.removePrefix("file://"))
        callbackContext.success(ret)
      } catch (t: Throwable) {
        reject(callbackContext, "E_CAMERA", t)
      }
    }
  }

  /** Keep latest preview bitmap only — no document SDK frame ingest. */
  private fun ingestAnalysisFrame(image: androidx.camera.core.ImageProxy) {
    val now = SystemClock.elapsedRealtime()
    if (now - lastAnalysisMs < 120L || analysisBusy) {
      image.close()
      return
    }
    analysisBusy = true
    lastAnalysisMs = now
    try {
      val bitmap = ImageUtils.bitmapFromImageProxy(image) ?: return
      val prepared = applyLiveTransform(bitmap, 0f, 640)
      if (prepared !== bitmap && !bitmap.isRecycled) {
        bitmap.recycle()
      }
      lastLiveBitmap = prepared
    } catch (_: Throwable) {
      // Drop a bad preview frame.
    } finally {
      image.close()
      analysisBusy = false
    }
  }

  private fun androidWebView(): android.view.View? {
    return webView?.view as? android.view.View
  }

  private fun attachPreviewHost() {
    val activity = cordova.activity ?: return
    val webView = androidWebView() ?: return
    val parent = webView.parent as? ViewGroup ?: return
    if (previewHost != null) {
      syncPreviewHostToWebView()
      return
    }
    val host = FrameLayout(activity)
    host.setBackgroundColor(Color.BLACK)
    val view = PreviewView(activity)
    view.implementationMode = PreviewView.ImplementationMode.COMPATIBLE
    view.scaleType = PreviewView.ScaleType.FILL_CENTER
    host.addView(
      view,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )
    // Match WebView frame so FILL_CENTER crop matches the HTML overlay.
    val lp = ViewGroup.MarginLayoutParams(
      if (webView.width > 0) webView.width else ViewGroup.LayoutParams.MATCH_PARENT,
      if (webView.height > 0) webView.height else ViewGroup.LayoutParams.MATCH_PARENT
    )
    lp.leftMargin = webView.left
    lp.topMargin = webView.top
    parent.addView(host, 0, lp)
    host.isClickable = false
    host.isFocusable = false
    view.isClickable = false
    webView.bringToFront()
    previewHost = host
    previewView = view
    webView.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      syncPreviewHostToWebView()
    }
  }

  private fun syncPreviewHostToWebView() {
    val webView = androidWebView() ?: return
    val host = previewHost ?: return
    val lp = host.layoutParams as? ViewGroup.MarginLayoutParams ?: return
    if (webView.width <= 0 || webView.height <= 0) return
    if (
      lp.width == webView.width &&
      lp.height == webView.height &&
      lp.leftMargin == webView.left &&
      lp.topMargin == webView.top
    ) {
      return
    }
    lp.width = webView.width
    lp.height = webView.height
    lp.leftMargin = webView.left
    lp.topMargin = webView.top
    host.layoutParams = lp
  }

  private fun detachPreviewHost() {
    val host = previewHost ?: return
    (host.parent as? ViewGroup)?.removeView(host)
    previewHost = null
    previewView = null
  }

  private fun setWebViewTransparent(transparent: Boolean) {
    val webView = androidWebView() ?: return
    val color = if (transparent) Color.TRANSPARENT else Color.BLACK
    webView.setBackgroundColor(color)
    // HARDWARE layers often stay opaque; NONE lets the PreviewView show through.
    webView.setLayerType(
      if (transparent) View.LAYER_TYPE_NONE else View.LAYER_TYPE_HARDWARE,
      null
    )
    if (webView is android.webkit.WebView) {
      webView.setBackgroundColor(color)
    }
    var parent: ViewParent? = webView.parent
    var depth = 0
    while (parent is View && depth < 6) {
      val v = parent as View
      v.setBackgroundColor(color)
      parent = v.parent
      depth++
    }
    cordova.activity?.window?.decorView?.setBackgroundColor(color)
    webView.bringToFront()
  }

  private fun writeLiveJpeg(prepared: Bitmap): String {
    val file = File(cordova.context.cacheDir, "drs_live_${System.currentTimeMillis()}.jpg")
    file.outputStream().use { out ->
      prepared.compress(Bitmap.CompressFormat.JPEG, 85, out)
    }
    return "file://${file.absolutePath}"
  }

  private fun applyLiveTransform(src: Bitmap, rotateDegrees: Float, maxEdge: Int): Bitmap {
    var frame = src
    val deg = rotateDegrees % 360f
    if (kotlin.math.abs(deg) > 0.01f) {
      val matrix = Matrix().apply { postRotate(deg) }
      val rotated = Bitmap.createBitmap(frame, 0, 0, frame.width, frame.height, matrix, true)
      if (rotated !== frame && frame !== src) frame.recycle()
      frame = rotated
    }
    return scaleMax(frame, maxEdge)
  }

  private fun reject(cb: CallbackContext, code: String, t: Throwable) {
    val msg = t.message ?: code
    cb.error("$code: $msg")
  }

  private fun loadBitmap(uriOrBase64: String): Bitmap? {
    return if (uriOrBase64.startsWith("data:") || looksLikeBase64(uriOrBase64)) {
      ImageUtils.bitmapFromBase64(uriOrBase64)
    } else {
      ImageUtils.bitmapFromUri(cordova.context.applicationContext, uriOrBase64)
    }
  }

  private fun looksLikeBase64(value: String): Boolean {
    return value.length > 256 && !value.contains("://") && !value.startsWith("/") && !value.startsWith("file:")
  }

  private fun uprightPortrait(src: Bitmap): Bitmap {
    if (src.width <= src.height) return src
    val matrix = Matrix().apply { postRotate(90f) }
    return Bitmap.createBitmap(src, 0, 0, src.width, src.height, matrix, true)
  }

  private fun scaleMax(src: Bitmap, maxEdge: Int): Bitmap {
    val longest = maxOf(src.width, src.height)
    if (longest <= maxEdge) return src
    val scale = maxEdge.toFloat() / longest
    return Bitmap.createScaledBitmap(
      src,
      (src.width * scale).toInt().coerceAtLeast(1),
      (src.height * scale).toInt().coerceAtLeast(1),
      true
    )
  }

  private fun rescaleLocateJson(
    json: String,
    locateW: Int,
    locateH: Int,
    imageW: Int,
    imageH: Int
  ): String {
    if (json.isEmpty()) return json
    return try {
      val root = org.json.JSONObject(json)
      root.put("_locateImageWidth", imageW)
      root.put("_locateImageHeight", imageH)
      val pos = root.optJSONObject("position") ?: return root.toString()
      val sx = imageW.toFloat() / locateW.coerceAtLeast(1)
      val sy = imageH.toFloat() / locateH.coerceAtLeast(1)
      val corners = pos.optJSONArray("corners")
      if (corners != null && corners.length() >= 4) {
        for (i in 0 until corners.length()) {
          val p = corners.optJSONObject(i) ?: continue
          p.put("x", p.optDouble("x") * sx)
          p.put("y", p.optDouble("y") * sy)
        }
      } else {
        if (pos.has("left")) pos.put("left", pos.optDouble("left") * sx)
        if (pos.has("top")) pos.put("top", pos.optDouble("top") * sy)
        if (pos.has("right")) pos.put("right", pos.optDouble("right") * sx)
        if (pos.has("bottom")) pos.put("bottom", pos.optDouble("bottom") * sy)
      }
      root.toString()
    } catch (_: Throwable) {
      json
    }
  }

  private fun JSONObject.stringOrNull(key: String): String? {
    if (!has(key) || isNull(key)) return null
    return getString(key)
  }
}
