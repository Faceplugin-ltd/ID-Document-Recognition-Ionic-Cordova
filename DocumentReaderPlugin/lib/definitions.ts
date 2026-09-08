export interface DocumentReaderSdkPlugin {
  getMachineCode(): Promise<{ value: string }>;
  setActivation(options: { license: string }): Promise<{ value: number }>;
  init(): Promise<{ value: number }>;
  deinit(): Promise<void>;
  startNewSession(options?: {
    optionsJson?: string;
  }): Promise<{ value: string }>;
  locateDocument(options: { image: string }): Promise<{ value: string }>;
  recognize(options: {
    front: string;
    back?: string | null;
    authenticity?: boolean;
    authenticityMode?: string;
  }): Promise<{ value: string }>;
  documentRecognition(options: {
    front: string;
    back?: string | null;
  }): Promise<{ value: string }>;
  documentLiveness(options: {
    front: string;
    back?: string | null;
  }): Promise<{ value: string }>;
  lastLicenseError(): Promise<{ value: string }>;
  getLicenseStatus(): Promise<{ value: string }>;
  writeStatus(options: { payload: string }): Promise<void>;
  /** Native camera under transparent WebView. Default rear for documents. */
  startLivePreview(options?: { frontCamera?: boolean }): Promise<void>;
  stopLivePreview(): Promise<void>;
  takeLiveSnapshot(): Promise<{ uri: string; path: string }>;
}
