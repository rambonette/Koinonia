import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { ServicesProvider } from './contexts/ServicesContext';
import { useDeepLink } from './hooks/useDeepLink';
import HomePage from './pages/HomePage';
import GroceryListPage from './pages/GroceryListPage';

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
 * AppContent component with routing and deep link handling
 * Must be inside ServicesProvider to access services
 */
const AppContent: React.FC = () => {
  useDeepLink(); // Initialize deep link handling

  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/home" component={HomePage} exact />
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
  return (
    <IonApp>
      <ServicesProvider>
        <AppContent />
      </ServicesProvider>
    </IonApp>
  );
};

export default App;
