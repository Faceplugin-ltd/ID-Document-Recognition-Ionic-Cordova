import {
  getMachineCode,
  setActivation,
  init,
  deinit,
  startNewSession,
  locateDocument,
  recognize,
  documentRecognition,
  documentLiveness,
  lastLicenseError,
  getLicenseStatus,
  writeStatus,
  startLivePreview,
  stopLivePreview,
  takeLiveSnapshot,
  DocumentReaderSdkNative,
  type ImageInput,
  type LiveCameraPhoto,
} from './sdkApi';
import {
  authenticityModeValue,
  type AuthenticityArg,
  type AuthenticityMode,
} from './authenticityMode';
import {
  normalizeResult,
  normalizeResultJson,
  extractImageQualityChecks,
  IMAGE_QA_ORDER,
  statusCode,
  type DocResult,
} from './normalizeResult';

export type { ImageInput, LiveCameraPhoto };

export {
  getMachineCode,
  setActivation,
  init,
  deinit,
  startNewSession,
  locateDocument,
  recognize,
  documentRecognition,
  documentLiveness,
  lastLicenseError,
  getLicenseStatus,
  writeStatus,
  startLivePreview,
  stopLivePreview,
  takeLiveSnapshot,
};

/** Typed recognize — same as `recognize` then `normalizeResult`. */
export async function recognizeResult(
  front: ImageInput,
  back?: ImageInput | null,
  authenticity: AuthenticityArg = true
): Promise<DocResult> {
  const json = await recognize(front, back, authenticity);
  return normalizeResult(json);
}

export { authenticityModeValue };
export type { AuthenticityArg, AuthenticityMode };
export {
  parseLicenseStatus,
  readyStatusMessage,
  NOT_LICENSED,
  type LicenseStatus,
} from './licenseStatus';

export const SDK_SUCCESS = 0;
export const SDK_LICENSE_INVALID = 1;
export const SDK_LICENSE_EXPIRED = 2;
export const SDK_NOT_ACTIVATED = 3;
export const SDK_INIT_FAILED = 4;

export {
  normalizeResult,
  normalizeResultJson,
  extractImageQualityChecks,
  IMAGE_QA_ORDER,
  statusCode,
};
export type {
  DocResult,
  DocVerification,
  DocImage,
} from './normalizeResult';
export {
  rows,
  summary,
  images,
  pretty,
  securityRows,
  securitySummary,
  documentPercent,
  documentCorners,
  locateImageSize,
  uprightSnapshotSize,
  mapUprightCornersToView,
} from './resultParser';
export type { FieldRow, ResultImage, Point, SecurityRow } from './resultParser';
export {
  LocateSession,
  type LocateFrame,
  type LocateSettings,
  type LocateSessionOptions,
} from './locate';
export type { DocumentReaderSdkPlugin } from './definitions';
export { DocumentReaderSdkNative as DocumentReaderSdk };
export {
  convertFileSrc,
  getCordovaPlatform,
  cordovaAvailable,
  nativeCall,
} from './cordovaExec';
