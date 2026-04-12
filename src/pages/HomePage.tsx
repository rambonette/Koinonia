import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonIcon,
  IonText,
  IonSkeletonText,
  IonModal,
  useIonViewWillEnter
} from '@ionic/react';
// IonHeader/IonToolbar/IonTitle/IonButtons still used by the modal below
import {
  addCircleOutline,
  linkOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  ellipseOutline,
  lockClosedOutline,
  closeOutline,
  addOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { recentListsUtils, RecentList } from '../utils/recentLists';
import { readListItems } from '../utils/readListItems';
import { GroceryItem } from '../interfaces/IStorageService';
import './HomePage.css';

const HomePage: React.FC = () => {
  const history = useHistory();
  const [recentLists, setRecentLists] = useState<RecentList[]>([]);
  const [previewItems, setPreviewItems] = useState<GroceryItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useIonViewWillEnter(() => {
    setRecentLists(recentListsUtils.getRecentLists());
  });

  const mostRecent = recentLists[0] ?? null;

  useEffect(() => {
    if (!mostRecent) {
      setPreviewItems([]);
      return;
    }
    setPreviewLoading(true);
    readListItems(mostRecent.roomId)
      .then(items => setPreviewItems(items.slice(0, 3)))
      .finally(() => setPreviewLoading(false));
  }, [mostRecent?.roomId]);

  const closeModal = () => {
    setShowModal(false);
    setNewListName('');
    setJoinCode('');
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

  return (
    <IonPage>
      <IonContent className="home-content" fullscreen>

        {/* ── Banner ── */}
        <div className="home-banner">
          <img src="/koinonia_logo.png" alt="Koinonia" className="home-banner__logo" />
          <span className="home-banner__name">Koinonia</span>
          <p className="home-banner__claim">
            <IonIcon icon={lockClosedOutline} className="home-banner__claim-icon" />
            Crea liste private e criptate con i tuoi amici
          </p>
        </div>

        {/* ── Single action card ── */}
        <IonCard className="action-card action-card--add" button onClick={() => setShowModal(true)}>
          <IonCardHeader>
            <div className="action-card__header-row">
              <div className="action-card__icon-wrap">
                <IonIcon icon={addOutline} className="action-card__icon" />
              </div>
              <div>
                <IonCardTitle className="action-card__title">Aggiungi lista</IonCardTitle>
                <p className="action-card__desc">Crea una nuova lista o unisciti con un codice</p>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* ── Last modified list card ── */}
        {mostRecent && (
          <>
          <p className="last-list-card__label">Ultima lista modificata</p>
          <IonCard
            className="last-list-card"
            button
            onClick={() => history.push(`/list/${mostRecent.roomId}`)}
          >
            <IonCardHeader className="last-list-card__header">
              <div className="last-list-card__title-row">
                <div className="last-list-card__avatar">
                  {(mostRecent.name ?? mostRecent.roomId).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <IonCardTitle className="last-list-card__name">
                    {mostRecent.name ?? mostRecent.roomId}
                  </IonCardTitle>
                </div>
              </div>
            </IonCardHeader>

            <IonCardContent className="last-list-card__content">
              {previewLoading ? (
                <>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="last-list-card__skeleton-row">
                      <IonSkeletonText animated style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                      <IonSkeletonText animated style={{ flex: 1, height: '14px', borderRadius: '6px' }} />
                    </div>
                  ))}
                </>
              ) : previewItems.length > 0 ? (
                <>
                  {previewItems.map(item => (
                    <div key={item.id} className="last-list-card__item">
                      <IonIcon
                        icon={item.checked ? checkmarkCircleOutline : ellipseOutline}
                        className={`last-list-card__item-icon ${item.checked ? 'last-list-card__item-icon--checked' : ''}`}
                      />
                      <span className={`last-list-card__item-name ${item.checked ? 'last-list-card__item-name--checked' : ''}`}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <IonText color="medium">
                  <p className="last-list-card__empty">Lista vuota</p>
                </IonText>
              )}

              <div className="last-list-card__footer">
                <span>Apri lista</span>
                <IonIcon icon={arrowForwardOutline} />
              </div>
            </IonCardContent>
          </IonCard>
          </>
        )}

      </IonContent>

      {/* ── Add / Join modal (same as ListsPage) ── */}
      <IonModal isOpen={showModal} onDidDismiss={closeModal} breakpoints={[0, 1]} initialBreakpoint={1}>
        <IonHeader>
          <IonToolbar className="toolbar--branded">
            <IonButtons slot="start">
              <img src="/koinonia_logo.png" alt="Koinonia" className="toolbar-logo" />
            </IonButtons>
            <IonTitle>Aggiungi lista</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeModal} fill="clear">
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            </IonButtons>
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

export default HomePage;
