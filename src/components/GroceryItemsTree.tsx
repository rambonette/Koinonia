import React, { useMemo, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { IonList, IonItem, IonLabel, IonIcon, IonText } from '@ionic/react';
import { apps } from 'ionicons/icons';
import { HierarchicalItem } from '../hooks/useGroceryList';
import SortableGroceryItem, { FlattenedItem } from './SortableGroceryItem';

// Horizontal drag threshold (in pixels) to trigger nesting/unnesting
const NEST_DRAG_THRESHOLD = 40;

// Haptic feedback helper - only triggers on native platforms
const triggerHaptic = (style: ImpactStyle) => {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style });
  }
};

function flatten(
  items: HierarchicalItem[],
  collapsedParents: Set<string>
): FlattenedItem[] {
  const flattened: FlattenedItem[] = [];

  items.forEach((item, index) => {
    flattened.push({
      id: item.id,
      parentId: null,
      depth: 0,
      index,
      item: item,
      hasChildren: item.children && item.children.length > 0,
    });

    if (item.children && item.children.length > 0 && !collapsedParents.has(item.id)) {
      item.children.forEach((child, childIndex) => {
        flattened.push({
          id: child.id,
          item: child,
          parentId: item.id,
          depth: 1,
          index: childIndex,
          hasChildren: false,
        });
      });
    }
  });

  return flattened;
}

interface GroceryItemsTreeProps {
  items: HierarchicalItem[];
  onToggle: (id: string) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetParent: (itemId: string, newParentId: string | null) => void;
  onReorderPosition: (itemId: string, newOrder: number) => void;
  listRef: React.RefObject<HTMLIonListElement | null>;
}

const GroceryItemsTree: React.FC<GroceryItemsTreeProps> = ({
  items,
  onToggle,
  onEdit,
  onDelete,
  onSetParent,
  onReorderPosition,
  listRef
}) => {
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const lastDepthRef = useRef<number | null>(null);
  const lastOverIdRef = useRef<string | null>(null);

  const flattenedItems = useMemo(() => {
    return flatten(items, collapsedParents);
  }, [items, collapsedParents]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleCollapse = (id: string) => {
    setCollapsedParents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    setOffsetLeft(0);

    const draggedItem = flattenedItems.find(i => i.id === id);
    lastDepthRef.current = draggedItem?.depth ?? 0;
    lastOverIdRef.current = id;

    triggerHaptic(ImpactStyle.Medium);

    // Auto-collapse parent items when starting to drag
    if (draggedItem?.hasChildren && !collapsedParents.has(id)) {
      setCollapsedParents(prev => new Set([...prev, id]));
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const newOffset = event.delta.x;
    setOffsetLeft(newOffset);

    const overId = event.over?.id as string | undefined;

    // Haptic feedback when crossing past another item
    if (overId && overId !== lastOverIdRef.current) {
      triggerHaptic(ImpactStyle.Light);
      lastOverIdRef.current = overId;
    }

    // Haptic feedback when crossing the nesting threshold
    if (activeId) {
      const draggedItem = flattenedItems.find(i => i.id === activeId);
      if (draggedItem) {
        const dragDepth = Math.round(newOffset / NEST_DRAG_THRESHOLD);
        const projectedDepth = Math.max(0, Math.min(1, draggedItem.depth + dragDepth));

        if (lastDepthRef.current !== null && projectedDepth !== lastDepthRef.current) {
          triggerHaptic(ImpactStyle.Light);
          lastDepthRef.current = projectedDepth;
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOffsetLeft(0);
    lastDepthRef.current = null;
    lastOverIdRef.current = null;

    triggerHaptic(ImpactStyle.Light);

    if (!over) return;

    const activeIndex = flattenedItems.findIndex(({ id }) => id === active.id);
    const overIndex = flattenedItems.findIndex(({ id }) => id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    const movedItem = flattenedItems[activeIndex];

    // Calculate new depth based on horizontal drag offset
    const dragDepth = Math.round(offsetLeft / NEST_DRAG_THRESHOLD);
    let newDepth = Math.max(0, Math.min(1, movedItem.depth + dragDepth));

    // Simulate the array move to find neighbors
    const projectedArray = arrayMove(flattenedItems, activeIndex, overIndex);
    const itemAbove = overIndex > 0 ? projectedArray[overIndex - 1] : null;
    const itemBelow = overIndex + 1 < projectedArray.length ? projectedArray[overIndex + 1] : null;

    // Determine new parent based on depth and item above
    let newParentId: string | null = null;

    if (newDepth === 1) {
      if (itemAbove) {
        if (itemAbove.depth === 0) {
          newParentId = itemAbove.id;
        } else if (itemAbove.depth === 1) {
          newParentId = itemAbove.parentId;
        }
      } else {
        newDepth = 0;
      }
    }

    // Update parent if changed
    if (newParentId !== movedItem.parentId) {
      onSetParent(movedItem.id, newParentId);
    }

    // Calculate new order value
    let newOrderVal: number;
    if (!itemAbove && !itemBelow) {
      newOrderVal = Date.now();
    } else if (!itemAbove) {
      newOrderVal = itemBelow!.item.order - 1000;
    } else if (!itemBelow) {
      newOrderVal = itemAbove.item.order + 1000;
    } else {
      newOrderVal = (itemAbove.item.order + itemBelow.item.order) / 2;
    }

    if (newOrderVal !== movedItem.item.order) {
      onReorderPosition(movedItem.id, newOrderVal);
    }
  };

  if (flattenedItems.length === 0) {
    return (
      <IonList ref={listRef}>
        <IonItem>
          <IonLabel className="ion-text-center">
            <IonText color="medium">
              <p>No items yet. Add your first item above!</p>
            </IonText>
          </IonLabel>
        </IonItem>
      </IonList>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={flattenedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <IonList ref={listRef} className="ion-no-padding">
          {flattenedItems.map((item) => (
            <SortableGroceryItem
              key={item.id}
              item={item}
              onToggle={() => onToggle(item.id)}
              onEdit={() => onEdit(item.id, item.item.name)}
              onDelete={() => onDelete(item.id)}
              onCollapse={() => toggleCollapse(item.id)}
              collapsed={collapsedParents.has(item.id)}
              hasChildren={item.hasChildren}
            />
          ))}
        </IonList>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeId && (
          <IonItem className="ion-no-padding" color="light">
            <IonIcon icon={apps} slot="start" size="small" color="medium" className="ion-margin-start" />
            <IonLabel>{flattenedItems.find(i => i.id === activeId)?.item.name}</IonLabel>
          </IonItem>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default GroceryItemsTree;
