import React, { useState, useRef } from 'react';
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
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonActionSheet,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonChip,
  IonToast,
  IonAlert
} from '@ionic/react';
import {
  peopleOutline,
  shareOutline,
  addOutline,
  trashOutline,
  cloudOutline,
  cloudOfflineOutline,
  arrowBackOutline,
  createOutline
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useGroceryList } from '../hooks/useGroceryList';
import { useServices } from '../contexts/ServicesContext';
import { Share } from '@capacitor/share';
import { recentListsUtils } from '../utils/recentLists';

const GroceryListPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const history = useHistory();
  const { deepLink } = useServices();
  const [newItemName, setNewItemName] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const listRef = useRef<HTMLIonListElement>(null);

  const {
    items,
    connected,
    peerCount,
    loading,
    addItem,
    toggleItem,
    updateItem,
    removeItem,
    clearList
  } = useGroceryList(roomId);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleEditItem = (itemId: string, newName: string) => {
    if (newName.trim()) {
      updateItem(itemId, { name: newName.trim() });
      setEditingItem(null);
      listRef.current?.closeSlidingItems();
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    listRef.current?.closeSlidingItems();
  };

  const handleShare = async () => {
    const deepLinkUrl = deepLink.generateDeepLink(roomId);
    const shareText = `Join my shopping list on Koinonia! Code: ${roomId}\n${deepLinkUrl}`;

    try {
      // Check if Share API is available
      const canShare = await Share.canShare();

      if (canShare.value) {
        await Share.share({
          title: 'Join my shopping list',
          text: shareText,
          dialogTitle: 'Share shopping list'
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        setToastMessage('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: try clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setToastMessage('Link copied to clipboard!');
      } catch {
        setToastMessage(`Share code: ${roomId}`);
      }
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
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Shopping List</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleShare}>
              <IonIcon slot="icon-only" icon={shareOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar color="light">
          <IonChip slot="start" color={connected ? 'success' : 'warning'} outline>
            <IonIcon icon={connected ? cloudOutline : cloudOfflineOutline} />
            <IonLabel>{connected ? 'Connected' : 'Connecting...'}</IonLabel>
          </IonChip>
          <IonChip slot="start" color={peerCount > 0 ? 'success' : 'medium'} outline>
            <IonIcon icon={peopleOutline} />
            <IonLabel>{peerCount} {peerCount === 1 ? 'peer' : 'peers'}</IonLabel>
          </IonChip>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Add item input */}
        <IonItem lines="full">
          <IonInput
            value={newItemName}
            placeholder="Add new item..."
            onIonInput={e => setNewItemName(e.detail.value || '')}
            onKeyPress={e => e.key === 'Enter' && handleAddItem()}
          />
          <IonButton
            slot="end"
            onClick={handleAddItem}
            disabled={!newItemName.trim()}
            fill="solid"
          >
            <IonIcon icon={addOutline} />
          </IonButton>
        </IonItem>

        {/* Grocery items list */}
        <IonList ref={listRef}>
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
                  <IonItemOption color="primary" onClick={() => setEditingItem({ id: item.id, name: item.name })}>
                    <IonIcon icon={createOutline} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => handleRemoveItem(item.id)}>
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

        {/* Edit Item Alert */}
        <IonAlert
          isOpen={!!editingItem}
          header="Edit Item"
          inputs={[
            {
              name: 'name',
              type: 'text',
              placeholder: 'Item name',
              value: editingItem?.name
            }
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setEditingItem(null)
            },
            {
              text: 'Save',
              handler: (data) => {
                if (editingItem) {
                  handleEditItem(editingItem.id, data.name);
                }
              }
            }
          ]}
          onDidDismiss={() => setEditingItem(null)}
        />

        {/* Action sheet for list actions */}
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
              text: 'Delete List & Go Back',
              role: 'destructive',
              handler: () => {
                clearList();
                recentListsUtils.removeRecentList(roomId);
                history.push('/home');
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Toast for share feedback */}
        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage('')}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default GroceryListPage;
