import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useServices } from '../contexts/ServicesContext';

/**
 * Custom hook for deep link handling
 * Listens for app URL open events and navigates to the appropriate room
 * Automatically cleans up listener on unmount
 */
export const useDeepLink = (): void => {
  const { deepLink } = useServices();
  const history = useHistory();

  useEffect(() => {
    const cleanup = deepLink.initialize((roomId) => {
      // Navigate to grocery list page with room ID
      history.push(`/list/${roomId}`);
    });

    return cleanup;
  }, [deepLink, history]);
};
