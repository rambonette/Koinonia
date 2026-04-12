import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IonItem,
  IonLabel,
  IonCheckbox,
  IonIcon,
  IonButton,
  IonPopover,
  IonList,
  IonItem as IonPopoverItem
} from '@ionic/react';
import {
  chevronDownOutline,
  chevronForwardOutline,
  createOutline,
  trashOutline,
  reorderTwoOutline,
  ellipsisVerticalOutline
} from 'ionicons/icons';
import { GroceryItem } from '../interfaces/IStorageService';
import './SortableGroceryItem.css';

export interface FlattenedItem {
  id: string;
  depth: number;
  item: GroceryItem;
  parentId: string | null;
  index: number;
  hasChildren: boolean;
}

interface SortableGroceryItemProps {
  item: FlattenedItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCollapse: () => void;
  collapsed: boolean;
  hasChildren: boolean;
}

const SortableGroceryItem: React.FC<SortableGroceryItemProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  onCollapse,
  collapsed,
  hasChildren,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [menuEvent, setMenuEvent] = useState<MouseEvent | null>(null);

  const itemClasses = [
    'grocery-item',
    item.item.checked ? 'grocery-item--checked' : '',
    item.depth > 0 ? 'grocery-item--child' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <IonItem
        ref={setNodeRef}
        lines="full"
        className={itemClasses}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          '--koi-item-indent': `${item.depth * 24}px`,
        } as React.CSSProperties}
      >
        {/* Drag Handle */}
        <IonButton
          fill="clear"
          slot="start"
          style={{ touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <IonIcon slot="icon-only" icon={reorderTwoOutline} color="medium" />
        </IonButton>

        {/* Checkbox */}
        <IonCheckbox
          slot="start"
          checked={item.item.checked}
          onIonChange={() => onToggle()}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Item name */}
        <IonLabel>
          {item.item.name}
        </IonLabel>

        {/* Collapse button */}
        {hasChildren && (
          <IonButton
            fill="clear"
            slot="end"
            onClick={(e) => { e.stopPropagation(); onCollapse(); }}
          >
            <IonIcon
              slot="icon-only"
              icon={collapsed ? chevronForwardOutline : chevronDownOutline}
              color="medium"
            />
          </IonButton>
        )}

        {/* Menu button */}
        <IonButton
          fill="clear"
          slot="end"
          className="item-menu-btn"
          onClick={(e) => { e.stopPropagation(); setMenuEvent(e.nativeEvent); }}
        >
          <IonIcon slot="icon-only" icon={ellipsisVerticalOutline} color="medium" />
        </IonButton>
      </IonItem>

      {/* Dropdown menu */}
      <IonPopover
        isOpen={!!menuEvent}
        event={menuEvent ?? undefined}
        onDidDismiss={() => setMenuEvent(null)}
        dismissOnSelect
      >
        <IonList lines="none" className="item-menu-list">
          <IonPopoverItem
            button
            detail={false}
            className="item-menu-option"
            onClick={() => { onEdit(); setMenuEvent(null); }}
          >
            <IonIcon slot="start" icon={createOutline} color="primary" />
            <IonLabel>Rinomina</IonLabel>
          </IonPopoverItem>
          <IonPopoverItem
            button
            detail={false}
            className="item-menu-option"
            onClick={() => { onDelete(); setMenuEvent(null); }}
          >
            <IonIcon slot="start" icon={trashOutline} color="danger" />
            <IonLabel color="danger">Cancella</IonLabel>
          </IonPopoverItem>
        </IonList>
      </IonPopover>
    </>
  );
};

export default SortableGroceryItem;
