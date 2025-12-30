import { useEffect } from 'react';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { useToast } from '../contexts/ToastContext';
import { openUrl } from '../utils/browser';

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
              await openUrl(availableUpdate.url);
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
