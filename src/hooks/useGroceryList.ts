import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../contexts/ServicesContext';
import { GroceryItem } from '../interfaces/IStorageService';

interface UseGroceryListResult {
  items: GroceryItem[];
  connected: boolean;
  peerCount: number;
  loading: boolean;
  addItem: (name: string) => void;
  toggleItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
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

  // Connect to P2P network when roomId changes
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const connectToRoom = async () => {
      try {
        setLoading(true);
        await sync.connect(roomId);

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to connect:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    connectToRoom();

    return () => {
      mounted = false;
      sync.disconnect();
    };
  }, [roomId, sync]);

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
    storage.addItem({ name, checked: false });
  }, [storage]);

  const toggleItem = useCallback((itemId: string) => {
    storage.toggleItem(itemId);
  }, [storage]);

  const removeItem = useCallback((itemId: string) => {
    storage.removeItem(itemId);
  }, [storage]);

  const clearList = useCallback(() => {
    storage.clear();
  }, [storage]);

  return {
    items,
    connected,
    peerCount,
    loading,
    addItem,
    toggleItem,
    removeItem,
    clearList
  };
};
