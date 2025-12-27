import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useIonToast } from '@ionic/react';

interface ToastButton {
  text: string;
  handler: () => void | Promise<void>;
}

interface ToastOptions {
  duration?: number;
  button?: ToastButton;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'medium';
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [present] = useIonToast();

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const { duration = 2000, button, color } = options || {};

    present({
      message,
      duration,
      position: 'bottom',
      color,
      buttons: button ? [{ text: button.text, handler: button.handler }] : undefined
    });
  }, [present]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
};
