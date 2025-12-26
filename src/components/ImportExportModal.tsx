import React, { useState, useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonText,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  closeOutline,
  copyOutline,
  shareOutline,
  folderOpenOutline,
  saveOutline
} from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { GroceryItem } from '../interfaces/IStorageService';
import { parseImportText, formatExportText } from '../utils/groceryListExport';

interface ImportExportModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  items: GroceryItem[];
  onImport: (names: string[]) => void;
  onToast: (message: string) => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onDismiss,
  items,
  onImport,
  onToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [segment, setSegment] = useState<'import' | 'export'>('import');
  const [importText, setImportText] = useState('');
  const [exportIncludeChecked, setExportIncludeChecked] = useState(true);

  const handleImport = () => {
    const names = parseImportText(importText);
    if (names.length === 0) return;
    onImport(names);
    setImportText('');
    onDismiss();
    onToast(`Imported ${names.length} item${names.length === 1 ? '' : 's'}`);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setImportText(text);
    } catch (err) {
      console.error('Failed to read file:', err);
      onToast('Failed to read file');
    }
    event.target.value = '';
  };

  const handleCopy = async () => {
    const text = formatExportText(items, exportIncludeChecked);
    try {
      await navigator.clipboard.writeText(text);
      onToast('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      onToast('Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    const text = formatExportText(items, exportIncludeChecked);
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: 'Shopping List',
          text: text,
          dialogTitle: 'Share shopping list items'
        });
      } else {
        await navigator.clipboard.writeText(text);
        onToast('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleSaveToFile = async () => {
    const text = formatExportText(items, exportIncludeChecked);
    const filename = `shopping-list-${new Date().toISOString().slice(0, 10)}.txt`;
    try {
      await Filesystem.writeFile({
        path: filename,
        data: text,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      onToast(`Saved to Documents/${filename}`);
    } catch (err) {
      console.error('Failed to save file:', err);
      onToast('Failed to save file');
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Import & Export</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={segment}
            onIonChange={e => setSegment(e.detail.value as 'import' | 'export')}
          >
            <IonSegmentButton value="import">
              <IonLabel>Import</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="export">
              <IonLabel>Export</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {segment === 'import' ? (
          <div>
            <IonText color="medium">
              <p>Paste items below (one per line) or import from a file:</p>
            </IonText>
            <IonTextarea
              value={importText}
              onIonInput={e => setImportText(e.detail.value || '')}
              placeholder="Milk&#10;Eggs&#10;Bread&#10;..."
              fill='outline'
              rows={10}
              className="ion-margin-bottom"
            />
            <input
              type="file"
              accept=".txt,text/plain"
              ref={fileInputRef}
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
            <IonButton expand="block" fill="outline" onClick={() => fileInputRef.current?.click()}>
              <IonIcon icon={folderOpenOutline} slot="start" />
              Import from File
            </IonButton>
            <IonButton
              expand="block"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="ion-margin-top"
            >
              Import Items
            </IonButton>
          </div>
        ) : (
          <div>
            <IonRadioGroup
              value={exportIncludeChecked ? 'all' : 'unchecked'}
              onIonChange={e => setExportIncludeChecked(e.detail.value === 'all')}
            >
              <IonItem lines="none">
                <IonRadio value="all" labelPlacement="end" justify="start">All items</IonRadio>
              </IonItem>
              <IonItem lines="none">
                <IonRadio value="unchecked" labelPlacement="end" justify="start">Unchecked only</IonRadio>
              </IonItem>
            </IonRadioGroup>
            <IonTextarea
              value={formatExportText(items, exportIncludeChecked)}
              readonly
              rows={10}
              fill='outline'
              className="ion-margin-top ion-margin-bottom"
              placeholder={items.length === 0 ? 'No items to export' : ''}
            />
            <IonGrid className="ion-no-padding">
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={handleSaveToFile} disabled={items.length === 0}>
                    <IonIcon icon={saveOutline} slot="start" />
                    Save to File
                  </IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" fill="outline" onClick={handleCopy} disabled={items.length === 0}>
                    <IonIcon icon={copyOutline} slot="start" />
                    Copy
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton expand="block" fill="outline" onClick={handleShare} disabled={items.length === 0}>
                    <IonIcon icon={shareOutline} slot="start" />
                    Share
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ImportExportModal;
