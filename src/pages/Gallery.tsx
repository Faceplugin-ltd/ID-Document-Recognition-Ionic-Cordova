import { useState } from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { recognize } from 'document-reader-cordova';
import { useHistory } from 'react-router-dom';
import { displayUri, pickGalleryPhoto } from '../pickImage';
import { setRecognizeResult } from '../resultStore';

/**
 * Gallery UI aligned with DocumentReader-Flutter-App gallery_screen.dart:
 * Expanded tap-to-pick cards, cover fit, Clear text, full-width Recognize.
 */
export default function Gallery() {
  const history = useHistory();
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (side: 'front' | 'back') => {
    setError('');
    try {
      const uri = await pickGalleryPhoto();
      if (side === 'front') setFront(uri);
      else setBack(uri);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onRecognize = async () => {
    if (!front || busy) return;
    setBusy(true);
    setError('');
    try {
      const json = await recognize(front, back);
      setRecognizeResult(json);
      history.replace('/result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="gallery-page">
        <div className="gallery-body">
          <p className="muted gallery-hint">
            Front image is required. Back is optional (ID cards).
          </p>
          <div className="gallery-row gallery-row-expand">
            <SideCard
              label="Front"
              uri={front}
              onPick={() => void pick('front')}
              onClear={() => setFront(null)}
            />
            <SideCard
              label="Back (optional)"
              uri={back}
              onPick={() => void pick('back')}
              onClear={() => setBack(null)}
            />
          </div>
          {error && <p className="gallery-error">{error}</p>}
          <button
            type="button"
            className="gallery-recognize"
            disabled={!front || busy}
            onClick={() => void onRecognize()}
          >
            {busy ? <IonSpinner name="crescent" /> : 'Recognize'}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
}

function SideCard({
  label,
  uri,
  onPick,
  onClear,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="gallery-side">
      <div className="gallery-card-label">{label}</div>
      <button type="button" className="gallery-card-tap" onClick={onPick}>
        {uri ? (
          <img
            src={displayUri(uri) ?? uri}
            alt={label}
            className="gallery-thumb-cover"
          />
        ) : (
          <span className="gallery-placeholder-tap">Tap to pick</span>
        )}
      </button>
      {uri ? (
        <button type="button" className="gallery-clear" onClick={onClear}>
          Clear
        </button>
      ) : (
        <div className="gallery-clear-spacer" />
      )}
    </div>
  );
}
