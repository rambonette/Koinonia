import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const HomePage: React.FC = () => {
  const history = useHistory();
  const [joinCode, setJoinCode] = useState('');

  const createNewList = () => {
    const roomId = crypto.randomUUID();
    history.push(`/list/${roomId}`);
  };

  const joinExistingList = () => {
    if (joinCode.trim()) {
      history.push(`/list/${joinCode.trim()}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Koinonia</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Create New List</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>Start a new shopping list and share it with others</p>
            </IonText>
            <IonButton expand="block" onClick={createNewList}>
              Create List
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Join Existing List</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="floating">List Code</IonLabel>
              <IonInput
                value={joinCode}
                onIonInput={e => setJoinCode(e.detail.value || '')}
                placeholder="Enter list code"
              />
            </IonItem>
            <IonButton
              expand="block"
              onClick={joinExistingList}
              disabled={!joinCode.trim()}
              className="ion-margin-top"
            >
              Join List
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
