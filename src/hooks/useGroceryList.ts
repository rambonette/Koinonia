import { useState, useEffect, useCallback, useMemo } from 'react';
import { useIonViewWillEnter, useIonViewWillLeave } from '@ionic/react';
import { useServices } from '../contexts/ServicesContext';
import { GroceryItem } from '../interfaces/IStorageService';
import { recentListsUtils } from '../utils/recentLists';

export interface HierarchicalItem extends GroceryItem {
  children: GroceryItem[];
}

interface UseGroceryListResult {
  items: GroceryItem[];
  hierarchicalItems: HierarchicalItem[];
  connected: boolean;
  peerCount: number;
  loading: boolean;
  addItem: (name: string) => void;
  toggleItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<Omit<GroceryItem, 'id' | 'addedAt'>>) => void;
  removeItem: (itemId: string) => void;
  setItemParent: (itemId: string, parentId: string | null) => void;
  reorderItem: (itemId: string, newOrder: number) => void;
  clearList: () => void;
}

/**
 * Custom hook for grocery list operations
 * Manages P2P connection, item state, and provides CRUD operations
 * Automatically handles cleanup of subscriptions
 */
export const useGroceryList = (roomId: string | null): UseGroceryListResult => {
  const { storage, sync } = useServices();

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Connect to P2P network when view enters
  useIonViewWillEnter(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    // Add to recent lists
    recentListsUtils.addRecentList(roomId);

    const connectToRoom = async () => {
      try {
        setLoading(true);
        await sync.connect(roomId);
        setLoading(false);
      } catch (error) {
        console.error('Failed to connect:', error);
        setLoading(false);
      }
    };

    connectToRoom();
  });

  // Disconnect when view leaves
  useIonViewWillLeave(() => {
    sync.disconnect();
  });

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = sync.onConnectionChange(setConnected);
    return unsubscribe;
  }, [sync]);

  // Subscribe to peer count changes
  useEffect(() => {
    const unsubscribe = sync.onPeersChange(setPeerCount);
    return unsubscribe;
  }, [sync]);

  // Subscribe to item changes
  useEffect(() => {
    // Initial load
    setItems(storage.getItems());

    // Subscribe to changes
    const unsubscribe = storage.onChange(setItems);

    return unsubscribe;
  }, [storage]);

  // CRUD operations (memoized to prevent unnecessary re-renders)
  const addItem = useCallback((name: string) => {
    storage.addItem({ name, checked: false, parentId: null });
  }, [storage]);

  const toggleItem = useCallback((itemId: string) => {
    storage.toggleItem(itemId);
  }, [storage]);

  const updateItem = useCallback((itemId: string, updates: Partial<Omit<GroceryItem, 'id' | 'addedAt'>>) => {
    storage.updateItem(itemId, updates);
  }, [storage]);

  const removeItem = useCallback((itemId: string) => {
    storage.removeItem(itemId);
  }, [storage]);

  const clearList = useCallback(() => {
    storage.clear();
  }, [storage]);

  const setItemParent = useCallback((itemId: string, parentId: string | null) => {
    storage.setParent(itemId, parentId);
  }, [storage]);

  const reorderItem = useCallback((itemId: string, newOrder: number) => {
    storage.reorderItem(itemId, newOrder);
  }, [storage]);

  // Compute hierarchical items from flat list
  const hierarchicalItems = useMemo((): HierarchicalItem[] => {
    // Get root items (parentId is null)
    const rootItems = items.filter(item => item.parentId === null);

    // Build map of children for each parent
    const childrenMap = new Map<string, GroceryItem[]>();
    items.forEach(item => {
      if (item.parentId !== null) {
        const children = childrenMap.get(item.parentId) || [];
        children.push(item);
        childrenMap.set(item.parentId, children);
      }
    });

    // Transform root items to hierarchical items with children
    return rootItems.map(item => ({
      ...item,
      children: (childrenMap.get(item.id) || []).sort((a, b) => a.order - b.order)
    }));
  }, [items]);

  return {
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
  };
};
