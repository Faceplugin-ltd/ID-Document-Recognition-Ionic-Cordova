import { nativeCall } from 'document-reader-cordova';

/**
 * Request Android CAMERA runtime permission via the native Cordova plugin.
 * Throws if the user denies — live preview will not start silently.
 */
export async function ensureCameraPermission(): Promise<void> {
  try {
    await nativeCall('DocumentReaderSdk', 'requestCameraPermission');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not available|Cordova not available/i.test(msg)) {
      return;
    }
    throw e instanceof Error ? e : new Error(msg);
  }
}
