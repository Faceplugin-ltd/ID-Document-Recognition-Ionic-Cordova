import { locateDocument, takeLiveSnapshot } from '../sdkApi';
import {
  documentCorners,
  documentPercent,
  locateImageSize,
  mapUprightCornersToView,
  type Point,
} from '../resultParser';

export type LocateSettings = {
  showThreshold?: number;
  highThreshold?: number;
  keepCaptureMin?: number;
  pollMs?: number;
};

export type LocateFrame = {
  scorePct: number;
  corners: Point[] | null;
  path: string;
  high: boolean;
  show: boolean;
};

export type LocateSessionOptions = {
  settings?: LocateSettings;
  onFrame: (frame: LocateFrame) => void;
};

/**
 * Poll native live snapshots + locateDocument (Cordova live preview).
 * Same thresholds as DocumentReader React Native LocateSession.
 */
export class LocateSession {
  readonly settings: Required<LocateSettings>;
  readonly onFrame: (frame: LocateFrame) => void;

  viewSize = { w: 0, h: 0 };

  private timer: ReturnType<typeof setInterval> | null = null;
  private locating = false;
  private stopped = false;

  constructor(opts: LocateSessionOptions) {
    this.settings = {
      showThreshold: opts.settings?.showThreshold ?? 50,
      highThreshold: opts.settings?.highThreshold ?? 85,
      keepCaptureMin: opts.settings?.keepCaptureMin ?? 50,
      pollMs: opts.settings?.pollMs ?? 450,
    };
    this.onFrame = opts.onFrame;
  }

  updateViewSize(w: number, h: number): void {
    this.viewSize = { w, h };
  }

  start(): void {
    this.stopped = false;
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.settings.pollMs);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.stop();
  }

  private async tick(): Promise<void> {
    if (this.stopped || this.locating) return;
    this.locating = true;
    try {
      const snap = await takeLiveSnapshot();
      const uri = snap.uri.startsWith('file://')
        ? snap.uri
        : `file://${snap.path || snap.uri}`;

      const locateJson = await locateDocument(uri);
      const pct = documentPercent(locateJson);
      const pts = documentCorners(locateJson);
      const show = pct >= this.settings.showThreshold && pts != null;
      const high = pct >= this.settings.highThreshold;

      const imageSize = locateImageSize(locateJson);

      const mapped =
        show && pts && imageSize
          ? mapUprightCornersToView(
              pts,
              imageSize.width,
              imageSize.height,
              this.viewSize.w,
              this.viewSize.h
            )
          : show && pts
            ? pts
            : null;

      this.onFrame({
        scorePct: pct,
        corners: mapped,
        path: uri,
        high,
        show,
      });
    } catch {
      // Transient snapshot/locate errors while framing.
    } finally {
      this.locating = false;
    }
  }
}
