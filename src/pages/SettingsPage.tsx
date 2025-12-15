import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton,
  IonTextarea,
  IonNote,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonIcon
} from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import { useServices } from '../contexts/ServicesContext';

const SettingsPage: React.FC = () => {
  const { settings, sync } = useServices();
  const [signalingServers, setSignalingServers] = useState('');
  const [iceServers, setIceServers] = useState('');

  useEffect(() => {
    const currentSettings = settings.getSettings();
    setSignalingServers(currentSettings.signalingServers.join('\n'));
    setIceServers(JSON.stringify(currentSettings.iceServers, null, 2));
  }, [settings]);

  const handleSave = () => {
    try {
      const signalingArray = signalingServers
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const iceArray = JSON.parse(iceServers);

      if (!Array.isArray(iceArray)) {
        throw new Error('ICE servers must be an array');
      }

      settings.updateSettings({
        signalingServers: signalingArray,
        iceServers: iceArray
      });

      // Disconnect current sync so new settings apply on next connection
      sync.disconnect();

      alert('Settings saved! New servers will be used on next list.');
    } catch (error) {
      alert('Error saving settings: ' + (error as Error).message);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      settings.resetToDefaults();
      sync.disconnect();
      const defaults = settings.getSettings();
      setSignalingServers(defaults.signalingServers.join('\n'));
      setIceServers(JSON.stringify(defaults.iceServers, null, 2));
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Signaling Servers</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>WebRTC signaling servers (one per line)</p>
            </IonText>
            <IonTextarea
              value={signalingServers}
              onIonInput={e => setSignalingServers(e.detail.value || '')}
              placeholder="ws://localhost:4444"
              rows={6}
              className="ion-margin-top"
            />
            <IonNote color="medium">
              <small>Use ws:// for local, wss:// for secure connections</small>
            </IonNote>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>ICE Servers</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>STUN/TURN servers (JSON format)</p>
            </IonText>
            <IonTextarea
              value={iceServers}
              onIonInput={e => setIceServers(e.detail.value || '')}
              placeholder='[{"urls": "stun:stun.l.google.com:19302"}]'
              rows={10}
              className="ion-margin-top"
            />
            <IonNote color="medium">
              <small>Must be valid JSON array of RTCIceServer objects</small>
            </IonNote>
          </IonCardContent>
        </IonCard>

        <IonList>
          <IonItem>
            <IonButton expand="block" onClick={handleSave}>
              Save Settings
            </IonButton>
          </IonItem>
          <IonItem>
            <IonButton expand="block" fill="outline" onClick={handleReset}>
              <IonIcon slot="start" icon={refreshOutline} />
              Reset to Defaults
            </IonButton>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
