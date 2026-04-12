import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonLabel,
  IonIcon,
  IonText,
  IonButton,
  IonButtons,
  IonModal,
  IonInput,
  IonFab,
  IonFabButton,
  IonList,
  IonItem,
  useIonViewWillEnter
} from '@ionic/react';
import {
  timeOutline,
  chevronForwardOutline,
  listOutline,
  addOutline,
  addCircleOutline,
  linkOutline,
  closeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { recentListsUtils, RecentList } from '../utils/recentLists';
import './ListsPage.css';

const ListsPage: React.FC = () => {
  const history = useHistory();
  const [lists, setLists] = useState<RecentList[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useIonViewWillEnter(() => {
    setLists(recentListsUtils.getRecentLists());
  });

  const openList = (roomId: string) => {
    history.push(`/list/${roomId}`);
  };

  const createNewList = () => {
    const trimmedName = newListName.trim();
    if (!trimmedName) return;
    const roomId = crypto.randomUUID();
    recentListsUtils.addRecentList(roomId, trimmedName);
    closeModal();
    history.push(`/list/${roomId}`);
  };

  const joinExistingList = () => {
    if (joinCode.trim()) {
      closeModal();
      history.push(`/list/${joinCode.trim()}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewListName('');
    setJoinCode('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Adesso';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m fa`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="toolbar--branded">
          <IonButtons slot="start">
            <img src="/koinonia_logo.png" alt="Koinonia" className="toolbar-logo" />
          </IonButtons>
          <IonTitle>Le mie liste</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="lists-content">
        {lists.length === 0 ? (
          <div className="lists-empty">
            <IonIcon icon={listOutline} className="lists-empty__icon" color="medium" />
            <IonText color="medium">
              <h3>Nessuna lista</h3>
              <p>Crea una nuova lista o unisciti a una esistente</p>
            </IonText>
          </div>
        ) : (
          <div className="lists-cards">
            {lists.map((list, index) => (
              <IonCard key={list.roomId} className="list-card" button onClick={() => openList(list.roomId)}>
                <IonCardContent className="list-card__content">
                  <div className="list-card__row">
                    <div className="lists-avatar">
                      {(list.name ?? list.roomId).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="list-card__info">
                      <span className="lists-item__name">{list.name ?? `Lista ${index + 1}`}</span>
                      <span className="lists-item__code">{list.roomId}</span>
                      <span className="lists-item__time">
                        <IonIcon icon={timeOutline} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        {formatDate(list.lastAccessed)}
                      </span>
                    </div>
                    <IonIcon icon={chevronForwardOutline} color="medium" className="list-card__chevron" />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}

        {/* FAB always visible */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)} color="primary">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* New / Join modal */}
      <IonModal isOpen={showModal} onDidDismiss={closeModal} breakpoints={[0, 1]} initialBreakpoint={1}>
        <IonHeader>
          <IonToolbar className="toolbar--branded">
            <IonTitle>Aggiungi lista</IonTitle>
            <IonButton slot="end" onClick={closeModal} fill="clear">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content ion-padding">
          {/* Create section */}
          <div className="modal-section">
            <div className="modal-section__icon-wrap modal-section__icon-wrap--create">
              <IonIcon icon={addCircleOutline} />
            </div>
            <h2 className="modal-section__title">Crea nuova lista</h2>
            <p className="modal-section__desc">Scegli un nome, avvia la lista e condividi il codice</p>
            <IonInput
              label="Nome della lista"
              labelPlacement="floating"
              fill="outline"
              value={newListName}
              onIonInput={e => setNewListName(e.detail.value || '')}
              onKeyPress={e => e.key === 'Enter' && createNewList()}
              placeholder="es. Spesa settimanale"
              className="modal-input"
            />
            <IonButton
              expand="block"
              color="primary"
              onClick={createNewList}
              disabled={!newListName.trim()}
              className="ion-margin-top"
            >
              <IonIcon slot="start" icon={addCircleOutline} />
              Crea lista
            </IonButton>
          </div>

          <div className="modal-divider">
            <span>oppure</span>
          </div>

          {/* Join section */}
          <div className="modal-section">
            <div className="modal-section__icon-wrap modal-section__icon-wrap--join">
              <IonIcon icon={linkOutline} />
            </div>
            <h2 className="modal-section__title">Unisciti con codice</h2>
            <p className="modal-section__desc">Inserisci il codice condiviso da qualcuno per aprire la sua lista</p>
            <IonInput
              label="Codice lista"
              labelPlacement="floating"
              fill="outline"
              value={joinCode}
              onIonInput={e => setJoinCode(e.detail.value || '')}
              onKeyPress={e => e.key === 'Enter' && joinExistingList()}
              className="modal-input"
            />
            <IonButton
              expand="block"
              color="secondary"
              onClick={joinExistingList}
              disabled={!joinCode.trim()}
              className="ion-margin-top"
            >
              <IonIcon slot="start" icon={linkOutline} />
              Unisciti
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default ListsPage;
