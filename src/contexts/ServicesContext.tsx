import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ISyncService } from '../interfaces/ISyncService';
import { IStorageService } from '../interfaces/IStorageService';
import { IDeepLinkService } from '../interfaces/IDeepLinkService';
import { ISettingsService } from '../interfaces/ISettingsService';
import { IUpdateService } from '../interfaces/IUpdateService';
import { WebRTCSyncService } from '../services/WebRTCSyncService';
import { YjsStorageService } from '../services/YjsStorageService';
import { DeepLinkService } from '../services/DeepLinkService';
import { SettingsService } from '../services/SettingsService';
import { UpdateService } from '../services/UpdateService';
import { version as appVersion } from '../../package.json';

interface Services {
  sync: ISyncService;
  storage: IStorageService;
  deepLink: IDeepLinkService;
  settings: ISettingsService;
  update: IUpdateService;
}

const ServicesContext = createContext<Services | null>(null);

interface ServicesProviderProps {
  children: ReactNode;
}

/**
 * Services Provider using React Context
 * Provides dependency injection for services
 * Services are memoized to prevent recreation on re-renders
 */
export const ServicesProvider: React.FC<ServicesProviderProps> = ({ children }) => {
  const services = useMemo(() => {
    // Create settings service first (needed by sync service)
    const settings = new SettingsService();

    // Sync service creates and manages Y.Doc per room
    const sync = new WebRTCSyncService(settings);

    // Storage service listens to sync service for doc changes
    const storage = new YjsStorageService(sync);

    return {
      settings,
      sync,
      storage,
      deepLink: new DeepLinkService(),
      update: new UpdateService(settings, appVersion)
    };
  }, []); // Empty dependency array - create once and never recreate

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
};

/**
 * Hook to access services from context
 * Throws error if used outside ServicesProvider
 */
export const useServices = (): Services => {
  const context = useContext(ServicesContext);

  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }

  return context;
};
