import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  useIonViewWillEnter
} from '@ionic/react';
import { timeOutline, trashOutline, settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { recentListsUtils, RecentList } from '../utils/recentLists';

const HomePage: React.FC = () => {
  const history = useHistory();
  const [joinCode, setJoinCode] = useState('');
  const [recentLists, setRecentLists] = useState<RecentList[]>([]);

  useIonViewWillEnter(() => {
    // Load recent lists every time the page becomes visible
    setRecentLists(recentListsUtils.getRecentLists());
  });

  const createNewList = () => {
    const roomId = crypto.randomUUID();
    history.push(`/list/${roomId}`);
  };

  const joinExistingList = () => {
    if (joinCode.trim()) {
      history.push(`/list/${joinCode.trim()}`);
    }
  };

  const openRecentList = (roomId: string) => {
    history.push(`/list/${roomId}`);
  };

  const removeRecentList = (roomId: string) => {
    recentListsUtils.removeRecentList(roomId);
    setRecentLists(recentListsUtils.getRecentLists());
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Koinonia</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/settings')}>
              <IonIcon slot="icon-only" icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Recent Lists */}
        {recentLists.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Recent Lists</IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-no-padding">
              <IonList>
                {recentLists.map((list) => (
                  <IonItemSliding key={list.roomId}>
                    <IonItem button onClick={() => openRecentList(list.roomId)}>
                      <IonIcon icon={timeOutline} slot="start" color="medium" />
                      <IonLabel>
                        <h3>{list.roomId.substring(0, 8)}...</h3>
                        <p>{formatDate(list.lastAccessed)}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption
                        color="danger"
                        onClick={() => removeRecentList(list.roomId)}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {/* Create New List */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Create New List</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>Start a new shopping list and share it with others</p>
            </IonText>
            <IonButton expand="block" onClick={createNewList}>
              Create List
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Join Existing List */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Join Existing List</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel position="floating">List Code</IonLabel>
              <IonInput
                value={joinCode}
                onIonInput={e => setJoinCode(e.detail.value || '')}
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
