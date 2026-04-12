/**
 * Reads grocery items from a list's local IndexedDB storage
 * without initialising the full WebRTC sync.
 * Returns items sorted by `order` (ascending), roots only (parentId === null).
 */
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { GroceryItem } from '../interfaces/IStorageService';

const ITEMS_MAP_KEY = 'groceryItemsV2';

export function readListItems(roomId: string): Promise<GroceryItem[]> {
  return new Promise((resolve) => {
    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(roomId, doc);

    const cleanup = (items: GroceryItem[]) => {
      persistence.destroy();
      resolve(items);
    };

    persistence.once('synced', () => {
      const map = doc.getMap<Y.Map<unknown>>(ITEMS_MAP_KEY);
      const items: GroceryItem[] = [];

      map.forEach((val) => {
        try {
          items.push({
            id:       val.get('id') as string,
            name:     val.get('name') as string,
            checked:  val.get('checked') as boolean,
            addedAt:  val.get('addedAt') as number,
            parentId: (val.get('parentId') as string | null) ?? null,
            order:    val.get('order') as number,
          });
        } catch {
          // skip malformed entries
        }
      });

      // Return only root items, sorted by order
      const roots = items
        .filter(i => i.parentId === null)
        .sort((a, b) => a.order - b.order);

      cleanup(roots);
    });

    // Fallback: if the DB doesn't exist or takes too long, resolve empty
    setTimeout(() => cleanup([]), 2000);
  });
}
