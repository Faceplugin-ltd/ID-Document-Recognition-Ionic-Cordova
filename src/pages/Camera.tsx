import { IonPage, useIonViewWillLeave } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { stopLivePreview } from 'document-reader-cordova';
import DocumentCapture from '../components/DocumentCapture';
import { goHome } from '../nav';
import { setRecognizeResult } from '../resultStore';

export default function CameraPage() {
  const history = useHistory();

  useIonViewWillLeave(() => {
    document.documentElement.classList.remove('frs-live-camera');
    void stopLivePreview().catch(() => undefined);
  });

  return (
    <IonPage className="live-page">
      <DocumentCapture
        onCancel={() => goHome(history)}
        onRecognized={(json) => {
          setRecognizeResult(json);
          history.replace('/result');
        }}
      />
    </IonPage>
  );
}
