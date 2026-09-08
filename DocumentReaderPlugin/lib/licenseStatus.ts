/** Parsed DocumentReaderSDK.getLicenseStatus JSON — same contract as native LicenseStatus. */

export type LicenseStatus = {
  licensed: boolean;
  level: number;
  levelName: string;
  recognition: boolean;
  authenticity: boolean;
  label: string;
};

export const NOT_LICENSED: LicenseStatus = {
  licensed: false,
  level: -1,
  levelName: 'None',
  recognition: false,
  authenticity: false,
  label: 'Not licensed',
};

export function parseLicenseStatus(
  json?: string | Record<string, unknown> | null
): LicenseStatus {
  try {
    let payload: unknown = json;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const rec = payload as Record<string, unknown>;
      if (
        rec.value != null &&
        !('label' in rec) &&
        !('licensed' in rec)
      ) {
        payload = rec.value;
      }
    }
    let o: Record<string, unknown>;
    if (typeof payload === 'string') {
      o = JSON.parse(payload || '{}') as Record<string, unknown>;
    } else if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      o = payload as Record<string, unknown>;
    } else {
      return NOT_LICENSED;
    }
    if (!o || typeof o !== 'object' || Array.isArray(o)) return NOT_LICENSED;
    const label =
      typeof o.label === 'string' && o.label.trim() ? o.label : 'Not licensed';
    return {
      licensed: Boolean(o.licensed),
      level: typeof o.level === 'number' ? o.level : -1,
      levelName: typeof o.levelName === 'string' ? o.levelName : 'None',
      recognition: Boolean(o.recognition),
      authenticity: Boolean(o.authenticity),
      label,
    };
  } catch {
    return NOT_LICENSED;
  }
}

/** Home status bar after a successful init — Android `Ready · %s`. */
export function readyStatusMessage(label: string): string {
  const t = (label || '').trim();
  return t ? `Ready · ${t}` : 'Ready';
}
