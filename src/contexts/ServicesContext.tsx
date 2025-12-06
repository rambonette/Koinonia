import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import * as Y from 'yjs';
import { ISyncService } from '../interfaces/ISyncService';
import { IStorageService } from '../interfaces/IStorageService';
import { IDeepLinkService } from '../interfaces/IDeepLinkService';
import { WebRTCSyncService } from '../services/WebRTCSyncService';
import { YjsStorageService } from '../services/YjsStorageService';
import { DeepLinkService } from '../services/DeepLinkService';

interface Services {
  sync: ISyncService;
  storage: IStorageService;
  deepLink: IDeepLinkService;
  doc: Y.Doc;
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
    // Create Yjs document (shared between services)
    const doc = new Y.Doc();

    return {
      doc,
      sync: new WebRTCSyncService(doc),
      storage: new YjsStorageService(doc),
      deepLink: new DeepLinkService()
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
