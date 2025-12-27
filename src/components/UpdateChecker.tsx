import { useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { useToast } from '../contexts/ToastContext';

/**
 * Component that checks for updates on mount and shows a toast if available
 * Clicking the toast opens the release page
 * Must be rendered inside ToastProvider and ServicesProvider
 */
const UpdateChecker: React.FC = () => {
  const { availableUpdate, dismissUpdate } = useUpdateCheck();
  const { showToast } = useToast();

  useEffect(() => {
    if (availableUpdate) {
      showToast(
        `Update available: v${availableUpdate.version}${availableUpdate.isNightly ? ' (nightly)' : ''}`,
        {
          duration: 5000,
          button: {
            text: 'View',
            handler: async () => {
              if (Capacitor.isNativePlatform()) {
                await Browser.open({ url: availableUpdate.url });
              } else {
                window.open(availableUpdate.url, '_blank');
              }
              dismissUpdate();
            }
          }
        }
      );
    }
  }, [availableUpdate, dismissUpdate, showToast]);

  return null;
};

export default UpdateChecker;
