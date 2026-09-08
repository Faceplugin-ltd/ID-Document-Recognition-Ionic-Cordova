/**
 * Hold recognize JSON across Ionic navigation.
 * Do not pass large DocSDK payloads via history.state — IonRouterOutlet drops it
 * and sessionStorage often hits quota when images are embedded as base64.
 */

let memoryJson = '';

const KEY = 'drs_recognize_result';

export function setRecognizeResult(json: string): void {
  memoryJson = typeof json === 'string' ? json : '';
  try {
    if (memoryJson.length > 0 && memoryJson.length < 1_500_000) {
      sessionStorage.setItem(KEY, memoryJson);
    } else {
      sessionStorage.removeItem(KEY);
    }
  } catch {
    // quota / private mode — memory still holds the payload
  }
}

export function getRecognizeResult(): string {
  if (memoryJson) return memoryJson;
  try {
    return sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearRecognizeResult(): void {
  memoryJson = '';
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
