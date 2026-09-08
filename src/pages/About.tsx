import { useState } from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { getLicenseStatus } from 'document-reader-cordova';
import FacePluginLogo from '../components/FacePluginLogo';

export default function About() {
  const [licenseText, setLicenseText] = useState('License: …');

  useIonViewWillEnter(() => {
    getLicenseStatus()
      .then((status) => setLicenseText(`License: ${status.label}`))
      .catch(() => setLicenseText('License: Not licensed'));
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <FacePluginLogo />
        <h1 className="page-title">FacePlugin</h1>
        <div className="product-sub">Document Reader SDK</div>
        <div className="about-license">{licenseText}</div>
        <div className="about-card">
          FacePlugin builds on-device identity technology — face recognition,
          liveness, and document reading — so biometric data never has to leave
          the phone.
        </div>
        <div className="about-card">
          This app demos the Document Reader SDK for Ionic Cordova: live
          locate camera, gallery recognize, and OCR / MRZ / barcode results.
          Everything runs fully on-premise.
        </div>
        <p className="about-link">
          <a href="https://faceplugin.com" target="_blank" rel="noreferrer">
            faceplugin.com
          </a>
        </p>
        <p className="muted" style={{ textAlign: 'center' }}>
          © 2026 FacePlugin. All rights reserved.
        </p>
      </IonContent>
    </IonPage>
  );
}
