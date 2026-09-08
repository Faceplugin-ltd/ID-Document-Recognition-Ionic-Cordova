import { useMemo, useState } from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  images,
  pretty,
  rows,
  securityRows,
  securitySummary,
  summary,
} from 'document-reader-cordova';
import { getRecognizeResult } from '../resultStore';

type Tab = 'result' | 'security' | 'images' | 'raw';

export default function Result() {
  const [json, setJson] = useState(() => getRecognizeResult());
  const [tab, setTab] = useState<Tab>('result');

  // IonRouterOutlet keeps pages mounted — refresh when entering Result.
  useIonViewWillEnter(() => {
    setJson(getRecognizeResult());
  });

  const fieldRows = useMemo(() => rows(json), [json]);
  const secRows = useMemo(() => securityRows(json), [json]);
  const imgs = useMemo(() => images(json), [json]);
  const summaryText = useMemo(() => summary(json), [json]);
  const securityText = useMemo(() => securitySummary(json), [json]);
  const rawText = useMemo(() => pretty(json), [json]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Result</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '8px 12px' }}>
          <IonSegment
            scrollable
            value={tab}
            onIonChange={(e) => setTab((e.detail.value as Tab) || 'result')}
          >
            <IonSegmentButton value="result">
              <IonLabel>Result</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="security">
              <IonLabel>Liveness</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="images">
              <IonLabel>Images</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="raw">
              <IonLabel>Raw JSON</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {tab === 'result' && (
          <div className="ion-padding">
            <p className="result-summary">{summaryText}</p>
            <div className="result-header-row">
              <span>Src</span>
              <span>Field</span>
              <span>Value</span>
            </div>
            {fieldRows.map((r, i) => (
              <div
                key={`${r.source}-${r.key}-${i}`}
                className={`result-row ${i % 2 === 0 ? 'alt' : ''}`}
              >
                <span className="col-src">{r.source}</span>
                <span className="col-key">{r.key}</span>
                <span className="col-val">{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'security' && (
          <div className="ion-padding">
            <p className="result-summary">{securityText}</p>
            <div className="security-header-row">
              <span>Page</span>
              <span>Check</span>
              <span>Status</span>
            </div>
            {secRows.length === 0 ? (
              <p className="muted">No liveness checks in this response</p>
            ) : (
              secRows.map((r, i) => (
                <div
                  key={`${r.page}-${r.check}-${i}`}
                  className={`security-row ${i % 2 === 0 ? 'alt' : ''}`}
                >
                  <span className="col-page">{r.page}</span>
                  <span className="col-check">{r.check}</span>
                  <span className="col-status">{r.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'images' && (
          <div className="ion-padding">
            {imgs.length === 0 ? (
              <p className="muted">No images in response.</p>
            ) : (
              imgs.map((img, i) => (
                <div key={`${img.category}-${i}`} className="result-img-card">
                  <div className="result-img-title">
                    {img.category}
                    {img.source ? ` · ${img.source}` : ''}
                  </div>
                  <img src={img.uri} alt={img.category} className="result-img" />
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'raw' && (
          <div className="ion-padding">
            <pre className="result-raw">{rawText}</pre>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
