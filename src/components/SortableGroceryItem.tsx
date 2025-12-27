import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IonItem,
  IonLabel,
  IonCheckbox,
  IonIcon,
  IonButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/react';
import {
  chevronDownOutline,
  chevronForwardOutline,
  createOutline,
  trashOutline,
  appsOutline
} from 'ionicons/icons';
import { GroceryItem } from '../interfaces/IStorageService';

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

  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);

  const itemClasses = [
    item.item.checked ? 'item-checked' : '',
    item.depth > 0 ? 'ion-padding-start' : '',
    isDragging ? 'item-dragging' : '',
  ].filter(Boolean).join(' ');

  const combinedRef = (node: HTMLIonItemSlidingElement | null) => {
    slidingRef.current = node;
    setNodeRef(node);
  };

  return (
    <IonItemSliding
      ref={combinedRef}
      disabled={isDragging}
      className={itemClasses}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
      }}
    >
      <IonItem lines="full">
        {/* Drag Handle - Left side */}
        <IonButton
          fill="clear"
          slot="start"
          {...attributes}
          {...listeners}
        >
          <IonIcon slot="icon-only" icon={appsOutline} color="medium" size="medium" />
        </IonButton>

        {/* Checkbox */}
        <IonCheckbox
          slot="start"
          checked={item.item.checked}
          onIonChange={() => onToggle()}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Item name */}
        <IonLabel className={item.item.checked ? 'ion-text-strike' : ''}>
          {item.item.name}
        </IonLabel>

        {/* Collapse button for parents - Right side */}
        {hasChildren && (
          <IonButton
            fill="clear"
            slot="end"
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
          >
            <IonIcon
              slot="icon-only"
              icon={collapsed ? chevronForwardOutline : chevronDownOutline}
              color="medium"
            />
          </IonButton>
        )}
      </IonItem>

      <IonItemOptions side="end">
        <IonItemOption color="primary" onClick={() => { onEdit(); slidingRef.current?.close(); }}>
          <IonIcon icon={createOutline} />
        </IonItemOption>
        <IonItemOption color="danger" onClick={() => { onDelete(); slidingRef.current?.close(); }}>
          <IonIcon icon={trashOutline} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default SortableGroceryItem;
