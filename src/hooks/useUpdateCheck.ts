import { useEffect, useState } from 'react';
import { useServices } from '../contexts/ServicesContext';
import { ReleaseInfo } from '../interfaces/IUpdateService';

interface UseUpdateCheckResult {
  checking: boolean;
  availableUpdate: ReleaseInfo | null;
  dismissUpdate: () => void;
}

/**
 * Hook to check for app updates on mount
 * Returns info about available updates and provides dismiss function
 */
export const useUpdateCheck = (): UseUpdateCheckResult => {
  const { update } = useServices();
  const [checking, setChecking] = useState(true);
  const [availableUpdate, setAvailableUpdate] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const result = await update.checkForUpdates();
        if (result.hasUpdate && result.release) {
          setAvailableUpdate(result.release);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      } finally {
        setChecking(false);
      }
    };

    checkForUpdates();
  }, [update]);

  const dismissUpdate = () => {
    setAvailableUpdate(null);
  };

  return {
    checking,
    availableUpdate,
    dismissUpdate
  };
};
