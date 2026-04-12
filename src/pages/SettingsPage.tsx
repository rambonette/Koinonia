import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonTextarea,
  IonNote,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonIcon,
  IonToggle,
  IonButton,
  IonButtons
} from '@ionic/react';
import { refreshOutline, logoGithub, bugOutline, bulbOutline, notificationsOutline, wifiOutline, globeOutline } from 'ionicons/icons';
import { useServices } from '../contexts/ServicesContext';
import { openUrl } from '../utils/browser';
import { version as appVersion } from '../../package.json';
import './SettingsPage.css';

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
    if (confirm('Ripristinare tutte le impostazioni ai valori predefiniti?')) {
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
        <IonToolbar className="toolbar--branded">
          <IonButtons slot="start">
            <img src="/koinonia_logo.png" alt="Koinonia" className="toolbar-logo" />
          </IonButtons>
          <IonTitle>Impostazioni</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="page-content ion-padding">
        {/* Updates card */}
        <IonCard className="settings-card">
          <IonCardHeader>
            <div className="settings-card__header">
              <IonIcon icon={notificationsOutline} className="settings-card__icon" />
              <IonCardTitle>Aggiornamenti</IonCardTitle>
            </div>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonToggle
                  checked={checkForStableUpdates}
                  onIonChange={e => handleStableToggle(e.detail.checked)}
                >
                  Controlla release stabili
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonToggle
                  checked={checkForNightlyUpdates}
                  onIonChange={e => handleNightlyToggle(e.detail.checked)}
                >
                  Controlla release nightly
                </IonToggle>
              </IonItem>
            </IonList>
            <IonNote color="medium">
              <small>Gli aggiornamenti vengono controllati all'avvio</small>
            </IonNote>
          </IonCardContent>
        </IonCard>

        {/* Signaling servers card */}
        <IonCard className="settings-card">
          <IonCardHeader>
            <div className="settings-card__header">
              <IonIcon icon={wifiOutline} className="settings-card__icon" />
              <IonCardTitle>Signaling Servers</IonCardTitle>
            </div>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>Server WebRTC per la segnalazione (uno per riga)</p>
            </IonText>
            <IonTextarea
              value={signalingServers}
              onIonInput={e => handleSignalingChange(e.detail.value || '')}
              placeholder="ws://localhost:4444"
              rows={6}
              className="ion-margin-top"
            />
            <IonNote color="medium">
              <small>Usa ws:// per locale, wss:// per connessioni sicure</small>
            </IonNote>
          </IonCardContent>
        </IonCard>

        {/* ICE servers card */}
        <IonCard className="settings-card">
          <IonCardHeader>
            <div className="settings-card__header">
              <IonIcon icon={globeOutline} className="settings-card__icon" />
              <IonCardTitle>ICE Servers</IonCardTitle>
            </div>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>Server STUN/TURN (formato JSON)</p>
            </IonText>
            <IonTextarea
              value={iceServers}
              onIonInput={e => handleIceChange(e.detail.value || '')}
              placeholder='[{"urls": "stun:stun.l.google.com:19302"}]'
              rows={10}
              className="ion-margin-top"
            />
            <IonNote color="medium">
              <small>Deve essere un array JSON valido di oggetti RTCIceServer</small>
            </IonNote>
          </IonCardContent>
        </IonCard>

        {/* About card */}
        <IonCard className="settings-card about-card">
          <div className="about-card__hero">
            <span className="about-card__app-name">Koinonia</span>
            <span className="about-card__version">v{appVersion}</span>
          </div>
          <IonCardContent className="ion-no-padding">
            <IonList lines="none">
              <IonItem button onClick={() => openUrl('https://github.com/rambonette/Koinonia')}>
                <IonIcon slot="start" icon={logoGithub} />
                Vedi su GitHub
              </IonItem>
              <IonItem button onClick={() => openUrl('https://github.com/rambonette/Koinonia/issues/new?template=bug_report.yml')}>
                <IonIcon slot="start" icon={bugOutline} />
                Segnala un Bug
              </IonItem>
              <IonItem button onClick={() => openUrl('https://github.com/rambonette/Koinonia/issues/new?template=feature_request.yml')}>
                <IonIcon slot="start" icon={bulbOutline} />
                Richiedi una Funzione
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Reset card */}
        <IonCard className="settings-card danger-card">
          <IonCardContent>
            <IonText color="medium">
              <p>Ripristina tutte le impostazioni ai valori predefiniti.</p>
            </IonText>
            <IonButton expand="block" fill="outline" color="danger" onClick={handleReset} className="ion-margin-top">
              <IonIcon slot="start" icon={refreshOutline} />
              Ripristina Impostazioni
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
