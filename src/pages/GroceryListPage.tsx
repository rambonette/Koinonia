import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonInput,
  IonButton,
  IonButtons,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonActionSheet,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/react';
import {
  peopleOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  shareOutline,
  addOutline,
  trashOutline
} from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { useGroceryList } from '../hooks/useGroceryList';
import { useServices } from '../contexts/ServicesContext';
import { Share } from '@capacitor/share';

const GroceryListPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { deepLink } = useServices();
  const [newItemName, setNewItemName] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);

  const {
    items,
    connected,
    peerCount,
    loading,
    addItem,
    toggleItem,
    removeItem,
    clearList
  } = useGroceryList(roomId);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleShare = async () => {
    const deepLinkUrl = deepLink.generateDeepLink(roomId);

    try {
      await Share.share({
        title: 'Join my shopping list',
        text: `Join my shopping list on Koinonia! Code: ${roomId}`,
        url: deepLinkUrl,
        dialogTitle: 'Share shopping list'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner />
          <IonText>
            <p>Connecting to network...</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Shopping List</IonTitle>
          <IonButtons slot="end">
            <IonBadge color={connected ? 'success' : 'danger'}>
              <IonIcon icon={connected ? cloudDoneOutline : cloudOfflineOutline} />
            </IonBadge>
            <IonBadge color="primary">
              <IonIcon icon={peopleOutline} /> {peerCount}
            </IonBadge>
            <IonButton onClick={handleShare}>
              <IonIcon icon={shareOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Add item input */}
        <IonItem>
          <IonInput
            value={newItemName}
            placeholder="Add new item..."
            onIonInput={e => setNewItemName(e.detail.value || '')}
            onKeyPress={e => e.key === 'Enter' && handleAddItem()}
          />
          <IonButton onClick={handleAddItem} disabled={!newItemName.trim()}>
            <IonIcon icon={addOutline} />
          </IonButton>
        </IonItem>

        {/* Grocery items list */}
        <IonList>
          {items.length === 0 ? (
            <IonItem>
              <IonLabel className="ion-text-center">
                <IonText color="medium">
                  <p>No items yet. Add your first item above!</p>
                </IonText>
              </IonLabel>
            </IonItem>
          ) : (
            items.map(item => (
              <IonItemSliding key={item.id}>
                <IonItem>
                  <IonCheckbox
                    slot="start"
                    checked={item.checked}
                    onIonChange={() => toggleItem(item.id)}
                  />
                  <IonLabel className={item.checked ? 'ion-text-strike' : ''}>
                    {item.name}
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => removeItem(item.id)}>
                    <IonIcon icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))
          )}
        </IonList>

        {/* Floating action button for options */}
        {items.length > 0 && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={trashOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Action sheet for clear list */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: 'Clear All Items',
              role: 'destructive',
              handler: () => {
                clearList();
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroceryListPage;
