import { useCallback, useEffect, useRef, useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import {
  LocateSession,
  recognize,
  startLivePreview,
  stopLivePreview,
  type Point,
} from 'document-reader-cordova';
import { ensureCameraPermission } from '../cameraPermission';

export type DocumentCaptureProps = {
  onRecognized: (json: string) => void;
  onCancel?: () => void;
  authenticity?: boolean | string;
};

/** Live locate + Capture → recognize (native preview under transparent WebView). */
export default function DocumentCapture({
  onRecognized,
  onCancel,
  authenticity,
}: DocumentCaptureProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<LocateSession | null>(null);
  const latestUri = useRef<string | null>(null);
  const [scorePct, setScorePct] = useState(0);
  const [corners, setCorners] = useState<Point[] | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize({ w, h });
      sessionRef.current?.updateViewSize(w, h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        document.documentElement.classList.add('frs-live-camera');
        await ensureCameraPermission();
        await startLivePreview(false);
        if (cancelled) {
          await stopLivePreview().catch(() => undefined);
          return;
        }
        const session = new LocateSession({
          onFrame: (frame) => {
            setScorePct(frame.scorePct);
            setCorners(frame.corners);
            setEnabled(frame.scorePct >= 50);
            if (frame.scorePct >= 50) {
              latestUri.current = frame.path;
            }
          },
        });
        session.updateViewSize(size.w, size.h);
        sessionRef.current = session;
        session.start();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      document.documentElement.classList.remove('frs-live-camera');
      sessionRef.current?.dispose();
      sessionRef.current = null;
      void stopLivePreview().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCapture = useCallback(async () => {
    if (busy || !latestUri.current) return;
    setBusy(true);
    setError('');
    try {
      sessionRef.current?.stop();
      await stopLivePreview().catch(() => undefined);
      const json = await recognize(
        latestUri.current,
        null,
        authenticity ?? true
      );
      onRecognized(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      try {
        await startLivePreview(false);
        sessionRef.current?.start();
      } catch {
        // ignore restart failures
      }
    } finally {
      setBusy(false);
    }
  }, [busy, authenticity, onRecognized]);

  const points =
    corners && corners.length >= 3
      ? corners.map((p) => `${p.x},${p.y}`).join(' ')
      : '';

  return (
    <div className="live-page doc-capture" ref={stageRef}>
      <div className="doc-capture-hud">
        <div className={`doc-score ${enabled ? 'high' : ''}`}>
          {Math.round(scorePct)}%
        </div>
        {error && <div className="doc-error">{error}</div>}
      </div>
      {points && (
        <svg className="doc-corners" width={size.w} height={size.h}>
          <polygon
            points={points}
            fill="none"
            stroke={enabled ? '#4ade80' : '#fbbf24'}
            strokeWidth={3}
          />
        </svg>
      )}
      <div className="doc-capture-actions">
        {onCancel && (
          <IonButton fill="outline" color="light" onClick={onCancel} disabled={busy}>
            Cancel
          </IonButton>
        )}
        <IonButton
          color="primary"
          disabled={!enabled || busy}
          onClick={() => void onCapture()}
        >
          {busy ? <IonSpinner name="crescent" /> : 'Capture'}
        </IonButton>
      </div>
    </div>
  );
}
