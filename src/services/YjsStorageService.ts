import * as Y from 'yjs';
import { IStorageService, GroceryItem } from '../interfaces/IStorageService';
import { ISyncService } from '../interfaces/ISyncService';

/**
 * Yjs-based storage service implementation
 * Uses Y.Map for each item to enable property-level conflict resolution
 * Concurrent edits to the same property use LWW (last-write-wins)
 */
export class YjsStorageService implements IStorageService {
  private doc: Y.Doc;
  private itemsMap: Y.Map<Y.Map<unknown>>;
  private observers: Set<(items: GroceryItem[]) => void>;
  private itemsObserver: () => void;

  constructor(syncService: ISyncService) {
    this.doc = syncService.getDoc();
    this.itemsMap = this.doc.getMap<Y.Map<unknown>>('groceryItemsV2');
    this.observers = new Set();

    // Set up observer for changes
    this.itemsObserver = () => {
      const currentItems = this.getItems();
      this.observers.forEach(callback => callback(currentItems));
    };
    this.itemsMap.observeDeep(this.itemsObserver);

    // Listen for doc changes (when switching rooms)
    syncService.onDocChange((newDoc) => {
      // Unobserve old map
      this.itemsMap.unobserveDeep(this.itemsObserver);

      // Rebind to new doc
      this.doc = newDoc;
      this.itemsMap = this.doc.getMap<Y.Map<unknown>>('groceryItemsV2');
      this.itemsMap.observeDeep(this.itemsObserver);

      // Notify observers of the change
      this.observers.forEach(callback => callback(this.getItems()));
    });
  }

  private yMapToItem(id: string, yMap: Y.Map<unknown>): GroceryItem {
    const addedAt = yMap.get('addedAt') as number;
    return {
      id,
      name: yMap.get('name') as string,
      checked: yMap.get('checked') as boolean,
      addedAt,
      addedBy: yMap.get('addedBy') as string | undefined,
      parentId: (yMap.get('parentId') as string | null) ?? null,
      order: (yMap.get('order') as number) ?? addedAt,  // Migration: use addedAt if no order
    };
  }

  getItems(): GroceryItem[] {
    const items: GroceryItem[] = [];
    this.itemsMap.forEach((yMap, id) => {
      items.push(this.yMapToItem(id, yMap));
    });
    // Sort by checked state (unchecked first), then by order
    return items.sort((a, b) => {
      if (a.checked === b.checked) {
        return a.order - b.order;
      }
      return a.checked ? 1 : -1;
    });
  }

  addItem(item: Omit<GroceryItem, 'id' | 'addedAt' | 'order'>): void {
    const id = crypto.randomUUID();
    const yMap = new Y.Map<unknown>();
    const now = Date.now();

    this.doc.transact(() => {
      yMap.set('name', item.name);
      yMap.set('checked', item.checked);
      yMap.set('addedAt', now);
      yMap.set('order', now);  // New items get order = timestamp
      yMap.set('parentId', item.parentId);
      if (item.addedBy) {
        yMap.set('addedBy', item.addedBy);
      }
      this.itemsMap.set(id, yMap);
    });
  }

  toggleItem(itemId: string): void {
    const yMap = this.itemsMap.get(itemId);

    if (!yMap) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    const currentChecked = yMap.get('checked') as boolean;
    const newChecked = !currentChecked;

    this.doc.transact(() => {
      yMap.set('checked', newChecked);

      // Cascade to children if this is a parent item
      this.itemsMap.forEach((childYMap) => {
        if (childYMap.get('parentId') === itemId) {
          childYMap.set('checked', newChecked);
        }
      });
    });
  }

  updateItem(itemId: string, updates: Partial<Omit<GroceryItem, 'id' | 'addedAt'>>): void {
    const yMap = this.itemsMap.get(itemId);

    if (!yMap) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    this.doc.transact(() => {
      if (updates.name !== undefined) {
        yMap.set('name', updates.name);
      }
      if (updates.checked !== undefined) {
        yMap.set('checked', updates.checked);
      }
      if (updates.addedBy !== undefined) {
        yMap.set('addedBy', updates.addedBy);
      }
    });
  }

  removeItem(itemId: string): void {
    this.doc.transact(() => {
      // Cascade delete: remove all children first
      this.itemsMap.forEach((childYMap, childId) => {
        if (childYMap.get('parentId') === itemId) {
          this.itemsMap.delete(childId);
        }
      });
      // Then remove the item itself
      this.itemsMap.delete(itemId);
    });
  }

  onChange(callback: (items: GroceryItem[]) => void): () => void {
    this.observers.add(callback);

    // Return unsubscribe function to prevent memory leaks
    return () => {
      this.observers.delete(callback);
    };
  }

  setParent(itemId: string, parentId: string | null): void {
    const yMap = this.itemsMap.get(itemId);

    if (!yMap) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    // Validate: cannot set parent to self
    if (itemId === parentId) {
      console.warn('Cannot set item as its own parent');
      return;
    }

    if (parentId !== null) {
      const parentYMap = this.itemsMap.get(parentId);

      if (!parentYMap) {
        console.warn(`Parent item ${parentId} not found`);
        return;
      }

      // Validate: target parent must be a root item (1 level nesting only)
      if (parentYMap.get('parentId') !== null) {
        console.warn('Cannot nest under a sub-item (1 level max)');
        return;
      }

      // Validate: cannot move a parent item that has children (would create 2+ levels)
      let hasChildren = false;
      this.itemsMap.forEach((childYMap) => {
        if (childYMap.get('parentId') === itemId) {
          hasChildren = true;
        }
      });

      if (hasChildren) {
        console.warn('Cannot move item with children under another item');
        return;
      }
    }

    yMap.set('parentId', parentId);
  }

  getChildren(parentId: string): GroceryItem[] {
    const children: GroceryItem[] = [];
    this.itemsMap.forEach((yMap, id) => {
      if (yMap.get('parentId') === parentId) {
        children.push(this.yMapToItem(id, yMap));
      }
    });
    return children.sort((a, b) => a.order - b.order);
  }

  reorderItem(itemId: string, newOrder: number): void {
    const yMap = this.itemsMap.get(itemId);

    if (!yMap) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    const oldOrder = (yMap.get('order') as number) ?? (yMap.get('addedAt') as number);
    const orderDelta = newOrder - oldOrder;

    this.doc.transact(() => {
      // Update the item's order
      yMap.set('order', newOrder);

      // Also update children's order to maintain relative positioning
      this.itemsMap.forEach((childYMap) => {
        if (childYMap.get('parentId') === itemId) {
          const childOrder = (childYMap.get('order') as number) ?? (childYMap.get('addedAt') as number);
          childYMap.set('order', childOrder + orderDelta);
        }
      });
    });
  }

  clear(): void {
    this.doc.transact(() => {
      const keys = Array.from(this.itemsMap.keys());
      keys.forEach(key => this.itemsMap.delete(key));
    });
  }
}
