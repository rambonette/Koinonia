import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

import { ServicesProvider } from './contexts/ServicesContext';
import { ToastProvider } from './contexts/ToastContext';
import { useDeepLink } from './hooks/useDeepLink';
import UpdateChecker from './components/UpdateChecker';
import HomePage from './pages/HomePage';
import GroceryListPage from './pages/GroceryListPage';
import SettingsPage from './pages/SettingsPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

/**
 * Component to handle deep link side effects
 * Must be rendered inside IonReactRouter to have access to history
 */
const DeepLinkListener: React.FC = () => {
  useDeepLink();
  return null;
};

/**
 * AppContent component with routing
 * Must be inside ServicesProvider to access services
 */
const AppContent: React.FC = () => {
  return (
    <IonReactRouter>
      <DeepLinkListener />
      <UpdateChecker />
      <IonRouterOutlet>
        <Route path="/home" component={HomePage} exact />
        <Route path="/settings" component={SettingsPage} exact />
        <Route path="/list/:roomId" component={GroceryListPage} exact />
        <Redirect exact from="/" to="/home" />
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

/**
 * Main App component
 * Wraps everything in ServicesProvider for dependency injection
 */
const App: React.FC = () => {
  useEffect(() => {
    // Configure status bar for Android/iOS - don't overlay to avoid notch issues
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setStyle({ style: Style.Dark });
    }
  }, []);

  return (
    <IonApp>
      <ToastProvider>
        <ServicesProvider>
          <AppContent />
        </ServicesProvider>
      </ToastProvider>
    </IonApp>
  );
};

export default App;
