/** Browser stub — native Document Reader APIs require a Cordova device build. */
export class DocumentReaderSdkWeb {
  private fail(): never {
    throw new Error('DocumentReaderSdk is not implemented on web. Use a Cordova Android/iOS build.');
  }
  getMachineCode() { return this.fail(); }
  setActivation() { return this.fail(); }
  init() { return this.fail(); }
  deinit() { return this.fail(); }
  startNewSession() { return this.fail(); }
  locateDocument() { return this.fail(); }
  recognize() { return this.fail(); }
  documentRecognition() { return this.fail(); }
  documentLiveness() { return this.fail(); }
  lastLicenseError() { return this.fail(); }
  getLicenseStatus() { return this.fail(); }
  writeStatus() { return this.fail(); }
  startLivePreview() { return this.fail(); }
  stopLivePreview() { return this.fail(); }
  takeLiveSnapshot() { return this.fail(); }
}
