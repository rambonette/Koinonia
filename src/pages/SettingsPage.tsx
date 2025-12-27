import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonButtons,
  IonBackButton,
  IonTextarea,
  IonNote,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonIcon,
  IonToggle,
  IonButton
} from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import { useServices } from '../contexts/ServicesContext';

const SettingsPage: React.FC = () => {
  const { settings, sync } = useServices();
  const [signalingServers, setSignalingServers] = useState('');
  const [iceServers, setIceServers] = useState('');
  const [checkForStableUpdates, setCheckForStableUpdates] = useState(true);
  const [checkForNightlyUpdates, setCheckForNightlyUpdates] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentSettings = settings.getSettings();
    setSignalingServers(currentSettings.signalingServers.join('\n'));
    setIceServers(JSON.stringify(currentSettings.iceServers, null, 2));
    setCheckForStableUpdates(currentSettings.checkForStableUpdates);
    setCheckForNightlyUpdates(currentSettings.checkForNightlyUpdates);
  }, [settings]);

  // Debounced save for text inputs
  const saveServerSettings = useCallback((signalingText: string, iceText: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      try {
        const signalingArray = signalingText
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        const iceArray = JSON.parse(iceText);

        if (!Array.isArray(iceArray)) {
          return; // Invalid JSON, don't save
        }

        settings.updateSettings({
          signalingServers: signalingArray,
          iceServers: iceArray
        });
        sync.disconnect();
      } catch {
        // Invalid JSON, don't save
      }
    }, 500);
  }, [settings, sync]);

  const handleSignalingChange = (value: string) => {
    setSignalingServers(value);
    saveServerSettings(value, iceServers);
  };

  const handleIceChange = (value: string) => {
    setIceServers(value);
    saveServerSettings(signalingServers, value);
  };

  const handleStableToggle = (checked: boolean) => {
    setCheckForStableUpdates(checked);
    settings.updateSettings({ checkForStableUpdates: checked });
  };

  const handleNightlyToggle = (checked: boolean) => {
    setCheckForNightlyUpdates(checked);
    settings.updateSettings({ checkForNightlyUpdates: checked });
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      settings.resetToDefaults();
      sync.disconnect();
      const defaults = settings.getSettings();
      setSignalingServers(defaults.signalingServers.join('\n'));
      setIceServers(JSON.stringify(defaults.iceServers, null, 2));
      setCheckForStableUpdates(defaults.checkForStableUpdates);
      setCheckForNightlyUpdates(defaults.checkForNightlyUpdates);
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
            <IonCardTitle>Updates</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonToggle
                  checked={checkForStableUpdates}
                  onIonChange={e => handleStableToggle(e.detail.checked)}
                >
                  Check for stable releases
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonToggle
                  checked={checkForNightlyUpdates}
                  onIonChange={e => handleNightlyToggle(e.detail.checked)}
                >
                  Check for nightly releases
                </IonToggle>
              </IonItem>
            </IonList>
            <IonNote color="medium">
              <small>Updates are checked on app startup</small>
            </IonNote>
          </IonCardContent>
        </IonCard>

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
              onIonInput={e => handleSignalingChange(e.detail.value || '')}
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
              onIonInput={e => handleIceChange(e.detail.value || '')}
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
