import React, { useState, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonText,
  IonChip,
  IonLabel,
  IonAlert,
  IonModal,
  IonPopover,
  IonList,
  IonItem
} from '@ionic/react';
import {
  peopleOutline,
  shareOutline,
  addOutline,
  trashOutline,
  cloudOutline,
  cloudOfflineOutline,
  arrowBackOutline,
  qrCodeOutline,
  closeOutline,
  settingsOutline,
  documentTextOutline,
  cartOutline,
  pencilOutline,
  linkOutline
} from 'ionicons/icons';
import ImportExportModal from '../components/ImportExportModal';
import GroceryItemsTree from '../components/GroceryItemsTree';
import { useParams, useHistory } from 'react-router-dom';
import { useGroceryList } from '../hooks/useGroceryList';
import { useServices } from '../contexts/ServicesContext';
import { useToast } from '../contexts/ToastContext';
import { Share } from '@capacitor/share';
import { recentListsUtils, RecentList } from '../utils/recentLists';
import QRCode from 'qrcode';
import './GroceryListPage.css';

const GroceryListPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const history = useHistory();
  const { deepLink } = useServices();
  const { showToast } = useToast();
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const listRef = useRef<HTMLIonListElement>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [listMeta, setListMeta] = useState<RecentList | null>(null);
  const [showRenameAlert, setShowRenameAlert] = useState(false);

  // Popover events
  const [sharePopoverEvent, setSharePopoverEvent] = useState<MouseEvent | null>(null);
  const [settingsPopoverEvent, setSettingsPopoverEvent] = useState<MouseEvent | null>(null);

  React.useEffect(() => {
    const meta = recentListsUtils.getRecentLists().find(l => l.roomId === roomId) ?? null;
    setListMeta(meta);
  }, [roomId]);

  const handleRename = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    recentListsUtils.updateListName(roomId, trimmed);
    setListMeta(prev => prev ? { ...prev, name: trimmed } : { roomId, lastAccessed: Date.now(), name: trimmed });
  };

  const {
    items,
    hierarchicalItems,
    connected,
    peerCount,
    loading,
    addItem,
    toggleItem,
    updateItem,
    removeItem,
    setItemParent,
    reorderItem,
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

  const handleShareLink = async () => {
    setSharePopoverEvent(null);
    const deepLinkUrl = deepLink.generateDeepLink(roomId);
    const shareText = `Unisciti alla mia lista su Koinonia! Codice: ${roomId}\n${deepLinkUrl}`;
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({ title: 'Unisciti alla lista', text: shareText, dialogTitle: 'Condividi lista' });
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast('Link copiato!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('Link copiato!');
      } catch {
        showToast(`Codice: ${roomId}`);
      }
    }
  };

  const handleShowQR = async () => {
    setSharePopoverEvent(null);
    try {
      const deepLinkUrl = deepLink.generateDeepLink(roomId);
      const url = await QRCode.toDataURL(deepLinkUrl, {
        width: 300, margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrCodeDataUrl(url);
      setShowQRModal(true);
    } catch (err) {
      console.error(err);
      showToast('Impossibile generare il QR Code');
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="loading-screen ion-text-center">
          <div className="loading-inner">
            <IonIcon icon={cartOutline} className="loading-icon" color="primary" />
            <IonSpinner name="crescent" color="primary" />
            <IonText color="medium"><p>Connessione alla rete...</p></IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="toolbar--branded">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
            <img src="/koinonia_logo.png" alt="Koinonia" className="toolbar-logo" />
          </IonButtons>
          <IonTitle>{listMeta?.name ?? 'Lista della Spesa'}</IonTitle>
          <IonButtons slot="end">
            {/* Share popover trigger */}
            <IonButton onClick={(e) => setSharePopoverEvent(e.nativeEvent)}>
              <IonIcon slot="icon-only" icon={shareOutline} />
            </IonButton>
            {/* Settings popover trigger */}
            <IonButton onClick={(e) => setSettingsPopoverEvent(e.nativeEvent)}>
              <IonIcon slot="icon-only" icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar className="status-toolbar">
          <IonChip slot="start" color={connected ? 'success' : 'warning'} outline>
            <IonIcon icon={connected ? cloudOutline : cloudOfflineOutline} />
            <IonLabel>{connected ? 'Connesso' : 'Connessione...'}</IonLabel>
          </IonChip>
          <IonChip slot="start" color={peerCount > 0 ? 'success' : 'medium'} outline>
            <IonIcon icon={peopleOutline} />
            <IonLabel>{peerCount} {peerCount === 1 ? 'peer' : 'peers'}</IonLabel>
          </IonChip>
        </IonToolbar>
      </IonHeader>

      <IonContent className="page-content">
        {/* Add item input bar */}
        <div className="add-item-bar">
          <IonInput
            className="add-item-input"
            value={newItemName}
            placeholder="Aggiungi un articolo..."
            onIonInput={e => setNewItemName(e.detail.value || '')}
            onKeyPress={e => e.key === 'Enter' && handleAddItem()}
          />
          <IonButton
            className="add-item-btn"
            onClick={handleAddItem}
            disabled={!newItemName.trim()}
            shape="round"
            color="primary"
          >
            <IonIcon slot="icon-only" icon={addOutline} />
          </IonButton>
        </div>

        {/* Grocery items list */}
        <GroceryItemsTree
          items={hierarchicalItems}
          onToggle={toggleItem}
          onEdit={(id, name) => setEditingItem({ id, name })}
          onDelete={handleRemoveItem}
          onSetParent={setItemParent}
          onReorderPosition={reorderItem}
          listRef={listRef}
        />

        {/* ── Share popover ── */}
        <IonPopover
          isOpen={!!sharePopoverEvent}
          event={sharePopoverEvent ?? undefined}
          onDidDismiss={() => setSharePopoverEvent(null)}
          dismissOnSelect
        >
          <IonList lines="none" className="popover-list">
            <IonItem button detail={false} onClick={handleShareLink} className="popover-item">
              <IonIcon slot="start" icon={linkOutline} color="primary" />
              <IonLabel>Condividi con link</IonLabel>
            </IonItem>
            <IonItem button detail={false} onClick={handleShowQR} className="popover-item">
              <IonIcon slot="start" icon={qrCodeOutline} color="primary" />
              <IonLabel>Mostra QR Code</IonLabel>
            </IonItem>
          </IonList>
        </IonPopover>

        {/* ── Settings popover ── */}
        <IonPopover
          isOpen={!!settingsPopoverEvent}
          event={settingsPopoverEvent ?? undefined}
          onDidDismiss={() => setSettingsPopoverEvent(null)}
          dismissOnSelect
        >
          <IonList lines="none" className="popover-list">
            <IonItem button detail={false} className="popover-item" onClick={() => { setSettingsPopoverEvent(null); setShowRenameAlert(true); }}>
              <IonIcon slot="start" icon={pencilOutline} color="primary" />
              <IonLabel>Rinomina</IonLabel>
            </IonItem>
            <IonItem button detail={false} className="popover-item" onClick={() => { setSettingsPopoverEvent(null); setShowImportExportModal(true); }}>
              <IonIcon slot="start" icon={documentTextOutline} color="primary" />
              <IonLabel>Importa &amp; Esporta</IonLabel>
            </IonItem>
            <IonItem lines="full" className="popover-separator" />
            <IonItem button detail={false} className="popover-item popover-item--danger" onClick={() => { setSettingsPopoverEvent(null); clearList(); }}>
              <IonIcon slot="start" icon={trashOutline} color="danger" />
              <IonLabel color="danger">Cancella tutto</IonLabel>
            </IonItem>
            <IonItem button detail={false} className="popover-item popover-item--danger" onClick={() => { setSettingsPopoverEvent(null); clearList(); recentListsUtils.removeRecentList(roomId); history.goBack(); }}>
              <IonIcon slot="start" icon={trashOutline} color="danger" />
              <IonLabel color="danger">Elimina lista</IonLabel>
            </IonItem>
          </IonList>
        </IonPopover>

        {/* Edit Item Alert */}
        <IonAlert
          isOpen={!!editingItem}
          header="Modifica Articolo"
          inputs={[{ name: 'name', type: 'text', placeholder: 'Nome articolo', value: editingItem?.name }]}
          buttons={[
            { text: 'Annulla', role: 'cancel', handler: () => setEditingItem(null) },
            { text: 'Salva', handler: (data) => { if (editingItem) handleEditItem(editingItem.id, data.name); } }
          ]}
          onDidDismiss={() => setEditingItem(null)}
        />

        {/* Rename list alert */}
        <IonAlert
          isOpen={showRenameAlert}
          header="Rinomina lista"
          inputs={[{ name: 'name', type: 'text', placeholder: 'Nome della lista', value: listMeta?.name ?? '' }]}
          buttons={[
            { text: 'Annulla', role: 'cancel', handler: () => setShowRenameAlert(false) },
            { text: 'Salva', handler: (data) => { handleRename(data.name); setShowRenameAlert(false); } }
          ]}
          onDidDismiss={() => setShowRenameAlert(false)}
        />

        {/* QR Code Modal */}
        <IonModal isOpen={showQRModal} onDidDismiss={() => setShowQRModal(false)}>
          <IonHeader>
            <IonToolbar className="toolbar--branded">
              <IonTitle>Condividi Lista</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowQRModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding ion-text-center">
            <div className="qr-modal-inner">
              <IonText><h3>Scansiona per unirti</h3></IonText>
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="List QR Code" className="qr-image" />}
              <IonText color="medium" className="ion-margin-top"><p>Codice: {roomId}</p></IonText>
            </div>
          </IonContent>
        </IonModal>

        {/* Import/Export Modal */}
        <ImportExportModal
          isOpen={showImportExportModal}
          onDismiss={() => setShowImportExportModal(false)}
          items={items}
          onImport={(names) => names.forEach(name => addItem(name))}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroceryListPage;
