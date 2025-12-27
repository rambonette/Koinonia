import React, { useEffect } from 'react';
import { useIonToast } from '@ionic/react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useUpdateCheck } from '../hooks/useUpdateCheck';

/**
 * Component that checks for updates on mount and shows a toast if available
 * Clicking the toast opens the release page
 * Must be rendered inside ServicesProvider
 */
const UpdateChecker: React.FC = () => {
  const { availableUpdate, dismissUpdate } = useUpdateCheck();
  const [present] = useIonToast();

  useEffect(() => {
    if (availableUpdate) {
      const handleClick = async () => {
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url: availableUpdate.url });
        } else {
          window.open(availableUpdate.url, '_blank');
        }
        dismissUpdate();
      };

      present({
        message: `Update available: v${availableUpdate.version}${availableUpdate.isNightly ? ' (nightly)' : ''}`,
        duration: 5000,
        position: 'bottom',
        buttons: [
          {
            text: 'View',
            handler: handleClick
          }
        ]
      });
    }
  }, [availableUpdate, dismissUpdate, present]);

  return null;
};

export default UpdateChecker;
