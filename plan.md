# P2P Grocery List App - Implementation Plan

## Instructions for Claude Code

**CRITICAL: Before implementing ANY code in this plan, you MUST:**

1. **Verify ALL official documentation** listed in Phase 0 for accuracy and current best practices
2. **Report your findings** including:
   - Current stable versions of each library
   - Any API changes or deprecations since the plan was created
   - Platform-specific limitations or requirements
   - Breaking changes that affect the implementation
3. **Flag any uncertainties** where documentation is unclear or contradictory
4. **Propose modifications** to the plan if documentation reveals better approaches
5. **State your confidence level** (High/Medium/Low) for each technology integration

**Your implementation must:**
- Follow SOLID principles strictly (each service has single responsibility)
- Fix problems at their source (no workarounds without documenting why)
- Include comprehensive error handling at all layers
- Prevent memory leaks (all observers/listeners cleaned up)
- Use TypeScript strictly (no `any` types without explicit justification)
- Never use `sudo` - Node.js is managed via nvm
- Preserve the existing README.md file throughout

**Starting environment:**
- Empty git repository named `koinonia`
- `README.md` already exists with project description
- Node.js managed via nvm (verify with `nvm --version`)
- No other files present

**When uncertain:**
- Search official documentation rather than proceeding with assumptions
- Ask for clarification rather than making architectural decisions
- Propose multiple solutions with tradeoffs rather than picking one arbitrarily

---

## Project Overview

Build an offline-first, P2P synchronized grocery list application called **Koinonia** using Ionic React + Capacitor with Yjs CRDT library and WebRTC for synchronization. The app enables parallel shopping - multiple people can shop simultaneously from the same list with real-time updates.

**Starting State:**
- Git repository named `koinonia` already initialized
- `README.md` already exists with project description
- Node.js managed via nvm (no sudo required)
- Empty otherwise - all code to be generated

---

## Phase 0: Documentation Review & Environment Setup

### 0.1 Verify Official Documentation
**CRITICAL: Before writing any code, review the official documentation for each technology to validate assumptions and ensure compatibility.**

**Action Items:**
1. **Ionic React Documentation**
   - URL: https://ionicframework.com/docs/react
   - Verify: Latest version, React compatibility, Capacitor integration
   - Check: CLI commands, project structure, routing setup

2. **Capacitor Documentation**
   - URL: https://capacitorjs.com/docs
   - Verify: Latest version, deep links plugin capabilities
   - Check: App plugin API, URL scheme configuration
   - Review: Platform-specific configurations (iOS/Android)

3. **Yjs Documentation**
   - URL: https://docs.yjs.dev/
   - Verify: Core API, data types (Y.Array, Y.Map), document structure
   - Check: Persistence options, offline behavior
   - Review: TypeScript support and type definitions

4. **y-webrtc Documentation**
   - URL: https://github.com/yjs/y-webrtc
   - Verify: Provider API, configuration options
   - Check: Signaling server requirements, peer discovery mechanism
   - Review: Connection lifecycle events, error handling

5. **WebRTC Fundamentals**
   - URL: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
   - Verify: Browser/WebView support in Capacitor
   - Check: STUN/TURN server configuration
   - Review: NAT traversal limitations on mobile

**Deliverable:** Create a compatibility matrix document with:
- Confirmed versions of each library
- Known limitations or constraints
- Platform-specific considerations
- Any breaking changes or deprecations

### 0.2 Project Initialization

**Starting Point:** Empty git repository named `koinonia` with only `README.md`

**Prerequisites Check:**
```bash
# Verify Node.js is managed via nvm (no sudo required)
nvm --version
node --version  # Should be >= 18.x (verify Ionic requirements)

# Verify Ionic CLI is installed
ionic --version  # Should show @ionic/cli version

# If node version needs update:
# nvm install 20
# nvm use 20
```

**Initialize Ionic Project:**
```bash
# You're already in the koinonia directory with README.md
# Initialize as Ionic React app with Capacitor in current directory
ionic start . blank --type=react --capacitor

# IMPORTANT: When prompted by Ionic CLI:
# - Confirm overwrite/merge with existing directory: Yes
# - Framework: React
# - Project name: Koinonia
# - Package ID: org.koinonia.app (or your preferred reverse domain)
# - Install dependencies: Yes

# The CLI will add Ionic files while preserving README.md

# Install Capacitor plugins
npm install @capacitor/app @capacitor/share @capacitor/network

# Add mobile platforms
npx cap add ios
npx cap add android

# Install P2P dependencies
npm install yjs y-webrtc y-indexeddb

# Install development dependencies
npm install --save-dev @types/node @types/react vitest @testing-library/react @testing-library/jest-dom
```

**Git Configuration:**
```bash
# Verify README.md is still intact after Ionic initialization
cat README.md  # Should contain the Koinonia description

# Ensure .gitignore is properly configured
# Ionic CLI should create this, but verify it includes:
cat >> .gitignore << EOF
node_modules/
dist/
build/
.DS_Store
*.swp
*.swo
*~
.capacitor/
EOF

# Create LICENSE file (AGPLv3 for FOSS)
# You can get the license text from: https://www.gnu.org/licenses/agpl-3.0.txt
# Or use: npx license agpl-3.0

# Initial commit (README already exists)
git add .
git commit -m "chore: initialize Ionic React project with Capacitor

- Add Ionic React framework
- Configure Capacitor for iOS/Android
- Set up project structure
- Preserve README.md with project description"
```

**Validation:**
- [ ] `package.json` exists with correct name: "koinonia"
- [ ] `README.md` still contains original Koinonia description
- [ ] `LICENSE` file created with AGPLv3
- [ ] Project builds successfully: `npm run build`
- [ ] iOS platform added: `ls ios/` shows App directory
- [ ] Android platform added: `ls android/` shows app directory
- [ ] No sudo was needed for any command (nvm manages node)
- [ ] Git history is clean with descriptive commit message
- [ ] `.gitignore` includes all necessary exclusions

---

## Phase 1: Core Architecture Setup (SOLID Principles)

### 1.1 Define Service Interfaces

**File: `src/interfaces/ISyncService.ts`**

```typescript
/**
 * Sync service interface following Dependency Inversion Principle
 * Allows swapping implementations (Yjs, Gun, Mock) without changing consumers
 */
export interface ISyncService {
  /**
   * Connect to a P2P room
   * @param roomId - Unique room identifier
   * @returns Promise that resolves when connection is established
   */
  connect(roomId: string): Promise<void>;

  /**
   * Disconnect from the P2P network
   */
  disconnect(): void;

  /**
   * Check if currently connected to peers
   */
  isConnected(): boolean;

  /**
   * Get number of connected peers
   */
  getPeerCount(): number;

  /**
   * Subscribe to connection status changes
   * @param callback - Called when connection status changes
   * @returns Unsubscribe function
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void;

  /**
   * Subscribe to peer count changes
   * @param callback - Called when peer count changes
   * @returns Unsubscribe function
   */
  onPeersChange(callback: (count: number) => void): () => void;
}
```

**File: `src/interfaces/IStorageService.ts`**

```typescript
export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  addedAt: number;
  addedBy?: string;
}

/**
 * Storage service interface for grocery list data
 * Abstracts the underlying CRDT or storage mechanism
 */
export interface IStorageService {
  /**
   * Get all items in the grocery list
   */
  getItems(): GroceryItem[];

  /**
   * Add a new item to the list
   */
  addItem(item: Omit<GroceryItem, 'id' | 'addedAt'>): void;

  /**
   * Toggle the checked state of an item
   */
  toggleItem(itemId: string): void;

  /**
   * Remove an item from the list
   */
  removeItem(itemId: string): void;

  /**
   * Subscribe to item changes
   * @param callback - Called when items change
   * @returns Unsubscribe function
   */
  onChange(callback: (items: GroceryItem[]) => void): () => void;

  /**
   * Clear all items
   */
  clear(): void;
}
```

**File: `src/interfaces/IDeepLinkService.ts`**

```typescript
/**
 * Deep link service interface
 * Handles app URL scheme and navigation
 */
export interface IDeepLinkService {
  /**
   * Initialize deep link listener
   * @param callback - Called when app is opened via deep link
   * @returns Cleanup function
   */
  initialize(callback: (roomId: string) => void): () => void;

  /**
   * Generate a shareable deep link for a room
   */
  generateDeepLink(roomId: string): string;

  /**
   * Extract room ID from a deep link URL
   */
  parseDeepLink(url: string): string | null;
}
```

**Validation:**
- [ ] All interfaces compile without errors
- [ ] Interfaces follow Single Responsibility Principle
- [ ] No implementation details leak into interfaces

### 1.2 Implement Yjs Storage Service

**File: `src/services/YjsStorageService.ts`**

**Before implementation, verify:**
- [ ] Yjs Y.Array API documentation
- [ ] Proper way to handle updates and observers
- [ ] Transaction handling for atomic operations

```typescript
import * as Y from 'yjs';
import { IStorageService, GroceryItem } from '../interfaces/IStorageService';

export class YjsStorageService implements IStorageService {
  private doc: Y.Doc;
  private items: Y.Array<GroceryItem>;
  private observers: Set<(items: GroceryItem[]) => void>;

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.items = this.doc.getArray<GroceryItem>('groceryItems');
    this.observers = new Set();

    // Set up observer for changes
    this.items.observe(() => {
      const currentItems = this.getItems();
      this.observers.forEach(callback => callback(currentItems));
    });
  }

  getItems(): GroceryItem[] {
    return this.items.toArray();
  }

  addItem(item: Omit<GroceryItem, 'id' | 'addedAt'>): void {
    const newItem: GroceryItem = {
      ...item,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
    };

    this.items.push([newItem]);
  }

  toggleItem(itemId: string): void {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === itemId);

    if (index === -1) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    const item = items[index];
    
    // Yjs requires delete + insert for updates
    this.doc.transact(() => {
      this.items.delete(index, 1);
      this.items.insert(index, [{
        ...item,
        checked: !item.checked
      }]);
    });
  }

  removeItem(itemId: string): void {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === itemId);

    if (index !== -1) {
      this.items.delete(index, 1);
    }
  }

  onChange(callback: (items: GroceryItem[]) => void): () => void {
    this.observers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.observers.delete(callback);
    };
  }

  clear(): void {
    this.items.delete(0, this.items.length);
  }
}
```

**Validation:**
- [ ] Service implements all interface methods
- [ ] CRDT operations are atomic (use transactions)
- [ ] Memory leaks prevented (observers cleanup)
- [ ] Unit tests pass (see Phase 4)

### 1.3 Implement WebRTC Sync Service

**File: `src/services/WebRTCSyncService.ts`**

**Before implementation, verify:**
- [ ] y-webrtc provider options and events
- [ ] Signaling server requirements
- [ ] STUN/TURN server configuration

```typescript
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { ISyncService } from '../interfaces/ISyncService';

export class WebRTCSyncService implements ISyncService {
  private provider: WebrtcProvider | null = null;
  private doc: Y.Doc;
  private connected: boolean = false;
  private peerCount: number = 0;
  private connectionCallbacks: Set<(connected: boolean) => void>;
  private peerCallbacks: Set<(count: number) => void>;

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.connectionCallbacks = new Set();
    this.peerCallbacks = new Set();
  }

  async connect(roomId: string): Promise<void> {
    if (this.provider) {
      console.warn('Already connected, disconnecting first');
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        this.provider = new WebrtcProvider(
          roomId,
          this.doc,
          {
            signaling: [
              'wss://signaling.yjs.dev',
              'wss://y-webrtc-signaling-eu.herokuapp.com'
            ],
            peerOpts: {
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' }
                ]
              }
            },
            maxConns: 10,
            filterBcConns: true
          }
        );

        // Listen for connection status
        this.provider.on('status', (event: { status: string }) => {
          this.connected = event.status === 'connected';
          this.connectionCallbacks.forEach(cb => cb(this.connected));
        });

        // Listen for peer changes
        this.provider.on('peers', (event: { webrtcPeers: any[] }) => {
          this.peerCount = event.webrtcPeers.length;
          this.peerCallbacks.forEach(cb => cb(this.peerCount));
        });

        // Resolve after a short delay to allow initial connection
        setTimeout(() => resolve(), 1000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this.connected = false;
      this.peerCount = 0;
      this.connectionCallbacks.forEach(cb => cb(false));
      this.peerCallbacks.forEach(cb => cb(0));
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPeerCount(): number {
    return this.peerCount;
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onPeersChange(callback: (count: number) => void): () => void {
    this.peerCallbacks.add(callback);
    return () => this.peerCallbacks.delete(callback);
  }
}
```

**Validation:**
- [ ] Provider initializes correctly
- [ ] Connection events fire properly
- [ ] Cleanup prevents memory leaks
- [ ] Error handling covers network failures

### 1.4 Implement Deep Link Service

**File: `src/services/DeepLinkService.ts`**

**Before implementation, verify:**
- [ ] Capacitor App plugin documentation
- [ ] Platform-specific URL scheme configuration
- [ ] Deep link event structure

```typescript
import { App } from '@capacitor/app';
import { IDeepLinkService } from '../interfaces/IDeepLinkService';

export class DeepLinkService implements IDeepLinkService {
  private readonly scheme = 'koinonia';
  private listener: any = null;

  initialize(callback: (roomId: string) => void): () => void {
    this.listener = App.addListener('appUrlOpen', (event) => {
      const roomId = this.parseDeepLink(event.url);
      if (roomId) {
        callback(roomId);
      }
    });

    return () => {
      if (this.listener) {
        this.listener.remove();
        this.listener = null;
      }
    };
  }

  generateDeepLink(roomId: string): string {
    return `${this.scheme}://list/${roomId}`;
  }

  parseDeepLink(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol !== `${this.scheme}:`) {
        return null;
      }

      // Extract room ID from path
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length > 0 && pathParts[0] === 'list' && pathParts[1]) {
        return pathParts[1];
      }

      return null;
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return null;
    }
  }
}
```

**Validation:**
- [ ] Deep link parsing handles edge cases
- [ ] URL generation follows platform conventions
- [ ] Listener cleanup prevents memory leaks

---

## Phase 2: React Integration Layer

### 2.1 Create Service Context Provider

**File: `src/contexts/ServicesContext.tsx`**

**Before implementation, verify:**
- [ ] React Context API best practices
- [ ] TypeScript typing for context values
- [ ] Proper cleanup in useEffect hooks

```typescript
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
  }, []);

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = (): Services => {
  const context = useContext(ServicesContext);
  
  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  
  return context;
};
```

**Validation:**
- [ ] Context provides all services
- [ ] Services are memoized (don't recreate on re-render)
- [ ] Error thrown if used outside provider

### 2.2 Create Grocery List Hook

**File: `src/hooks/useGroceryList.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../contexts/ServicesContext';
import { GroceryItem } from '../interfaces/IStorageService';

interface UseGroceryListResult {
  items: GroceryItem[];
  connected: boolean;
  peerCount: number;
  loading: boolean;
  addItem: (name: string) => void;
  toggleItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  clearList: () => void;
}

export const useGroceryList = (roomId: string | null): UseGroceryListResult => {
  const { storage, sync } = useServices();
  
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Connect to P2P network
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const connectToRoom = async () => {
      try {
        setLoading(true);
        await sync.connect(roomId);
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to connect:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    connectToRoom();

    return () => {
      mounted = false;
      sync.disconnect();
    };
  }, [roomId, sync]);

  // Subscribe to connection status
  useEffect(() => {
    const unsubscribe = sync.onConnectionChange(setConnected);
    return unsubscribe;
  }, [sync]);

  // Subscribe to peer count
  useEffect(() => {
    const unsubscribe = sync.onPeersChange(setPeerCount);
    return unsubscribe;
  }, [sync]);

  // Subscribe to item changes
  useEffect(() => {
    // Initial load
    setItems(storage.getItems());

    // Subscribe to changes
    const unsubscribe = storage.onChange(setItems);
    
    return unsubscribe;
  }, [storage]);

  const addItem = useCallback((name: string) => {
    storage.addItem({ name, checked: false });
  }, [storage]);

  const toggleItem = useCallback((itemId: string) => {
    storage.toggleItem(itemId);
  }, [storage]);

  const removeItem = useCallback((itemId: string) => {
    storage.removeItem(itemId);
  }, [storage]);

  const clearList = useCallback(() => {
    storage.clear();
  }, [storage]);

  return {
    items,
    connected,
    peerCount,
    loading,
    addItem,
    toggleItem,
    removeItem,
    clearList
  };
};
```

**Validation:**
- [ ] Hook properly cleans up subscriptions
- [ ] Loading state managed correctly
- [ ] No race conditions in async operations

### 2.3 Create Deep Link Hook

**File: `src/hooks/useDeepLink.ts`**

```typescript
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useServices } from '../contexts/ServicesContext';

export const useDeepLink = () => {
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
```

---

## Phase 3: UI Implementation (Ionic Components)

### 3.1 Home Page (List Creation & Joining)

**File: `src/pages/HomePage.tsx`**

**Before implementation, verify:**
- [ ] Ionic React component API
- [ ] IonRouter usage and navigation
- [ ] Share API availability on mobile platforms

```typescript
import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useServices } from '../contexts/ServicesContext';
import { Share } from '@capacitor/share';

const HomePage: React.FC = () => {
  const history = useHistory();
  const { deepLink } = useServices();
  const [joinCode, setJoinCode] = useState('');

  const createNewList = () => {
    const roomId = crypto.randomUUID();
    history.push(`/list/${roomId}`);
  };

  const joinExistingList = () => {
    if (joinCode.trim()) {
      history.push(`/list/${joinCode.trim()}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Koinonia</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Create New List</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>Start a new shopping list and share it with others</p>
            </IonText>
            <IonButton expand="block" onClick={createNewList}>
              Create List
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Join Existing List</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="floating">List Code</IonLabel>
              <IonInput
                value={joinCode}
                onIonInput={e => setJoinCode(e.detail.value || '')}
                placeholder="Enter list code"
              />
            </IonItem>
            <IonButton 
              expand="block" 
              onClick={joinExistingList}
              disabled={!joinCode.trim()}
              className="ion-margin-top"
            >
              Join List
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
```

### 3.2 Grocery List Page

**File: `src/pages/GroceryListPage.tsx`**

```typescript
import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonInput,
  IonButton,
  IonButtons,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonActionSheet,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/react';
import {
  peopleOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  shareOutline,
  addOutline,
  trashOutline
} from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { useGroceryList } from '../hooks/useGroceryList';
import { useServices } from '../contexts/ServicesContext';
import { Share } from '@capacitor/share';

const GroceryListPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { deepLink } = useServices();
  const [newItemName, setNewItemName] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);

  const {
    items,
    connected,
    peerCount,
    loading,
    addItem,
    toggleItem,
    removeItem,
    clearList
  } = useGroceryList(roomId);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleShare = async () => {
    const deepLinkUrl = deepLink.generateDeepLink(roomId);
    
    try {
      await Share.share({
        title: 'Join my shopping list',
        text: `Join my shopping list on Koinonia! Code: ${roomId}`,
        url: deepLinkUrl,
        dialogTitle: 'Share shopping list'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner />
          <IonText>
            <p>Connecting to network...</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Shopping List</IonTitle>
          <IonButtons slot="end">
            <IonBadge color={connected ? 'success' : 'danger'}>
              <IonIcon icon={connected ? cloudDoneOutline : cloudOfflineOutline} />
            </IonBadge>
            <IonBadge color="primary">
              <IonIcon icon={peopleOutline} /> {peerCount}
            </IonBadge>
            <IonButton onClick={handleShare}>
              <IonIcon icon={shareOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Add item input */}
        <IonItem>
          <IonInput
            value={newItemName}
            placeholder="Add new item..."
            onIonInput={e => setNewItemName(e.detail.value || '')}
            onKeyPress={e => e.key === 'Enter' && handleAddItem()}
          />
          <IonButton onClick={handleAddItem} disabled={!newItemName.trim()}>
            <IonIcon icon={addOutline} />
          </IonButton>
        </IonItem>

        {/* Grocery items list */}
        <IonList>
          {items.length === 0 ? (
            <IonItem>
              <IonLabel className="ion-text-center">
                <IonText color="medium">
                  <p>No items yet. Add your first item above!</p>
                </IonText>
              </IonLabel>
            </IonItem>
          ) : (
            items.map(item => (
              <IonItemSliding key={item.id}>
                <IonItem>
                  <IonCheckbox
                    slot="start"
                    checked={item.checked}
                    onIonChange={() => toggleItem(item.id)}
                  />
                  <IonLabel className={item.checked ? 'ion-text-strike' : ''}>
                    {item.name}
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => removeItem(item.id)}>
                    <IonIcon icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))
          )}
        </IonList>

        {/* Floating action button for options */}
        {items.length > 0 && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={trashOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Action sheet for clear list */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: 'Clear All Items',
              role: 'destructive',
              handler: () => {
                clearList();
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroceryListPage;
```

### 3.3 App Component (Routing & Deep Links)

**File: `src/App.tsx`**

```typescript
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { ServicesProvider } from './contexts/ServicesContext';
import { useDeepLink } from './hooks/useDeepLink';
import HomePage from './pages/HomePage';
import GroceryListPage from './pages/GroceryListPage';

/* Core CSS required for Ionic components */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

setupIonicReact();

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
```

---

## Phase 4: Testing & Validation

### 4.1 Unit Tests Setup

**Install testing dependencies:**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest
```

### 4.2 Service Tests

**File: `src/services/__tests__/YjsStorageService.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { YjsStorageService } from '../YjsStorageService';

describe('YjsStorageService', () => {
  let doc: Y.Doc;
  let service: YjsStorageService;

  beforeEach(() => {
    doc = new Y.Doc();
    service = new YjsStorageService(doc);
  });

  it('should add items correctly', () => {
    service.addItem({ name: 'Milk', checked: false });
    const items = service.getItems();

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Milk');
    expect(items[0].checked).toBe(false);
    expect(items[0].id).toBeDefined();
  });

  it('should toggle item checked state', () => {
    service.addItem({ name: 'Bread', checked: false });
    const items = service.getItems();
    const itemId = items[0].id;

    service.toggleItem(itemId);
    const updatedItems = service.getItems();

    expect(updatedItems[0].checked).toBe(true);
  });

  it('should notify observers on changes', (done) => {
    const unsubscribe = service.onChange((items) => {
      expect(items).toHaveLength(1);
      unsubscribe();
      done();
    });

    service.addItem({ name: 'Eggs', checked: false });
  });

  it('should remove items correctly', () => {
    service.addItem({ name: 'Butter', checked: false });
    const items = service.getItems();
    const itemId = items[0].id;

    service.removeItem(itemId);
    const updatedItems = service.getItems();

    expect(updatedItems).toHaveLength(0);
  });
});
```

### 4.3 Integration Tests

**File: `src/__tests__/integration/P2PSync.test.ts`**

Test two Yjs documents syncing (simulated P2P):

```typescript
import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { YjsStorageService } from '../../services/YjsStorageService';

describe('P2P Synchronization', () => {
  it('should sync items between two documents', () => {
    // Simulate two devices
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();
    
    const storage1 = new YjsStorageService(doc1);
    const storage2 = new YjsStorageService(doc2);

    // Simulate sync by applying updates
    doc1.on('update', (update: Uint8Array) => {
      Y.applyUpdate(doc2, update);
    });
    
    doc2.on('update', (update: Uint8Array) => {
      Y.applyUpdate(doc1, update);
    });

    // Add item on device 1
    storage1.addItem({ name: 'Coffee', checked: false });

    // Check if it appears on device 2
    const items2 = storage2.getItems();
    expect(items2).toHaveLength(1);
    expect(items2[0].name).toBe('Coffee');
  });
});
```

**Validation Checklist:**
- [ ] All unit tests pass
- [ ] Integration tests demonstrate sync
- [ ] Edge cases handled (empty lists, concurrent edits)
- [ ] Memory leaks checked (observers cleaned up)

---

## Phase 5: Platform Configuration

### 5.1 Configure Deep Links for iOS

**File: `ios/App/App/Info.plist`**

**Before editing, verify:**
- [ ] Apple URL scheme documentation
- [ ] Associated domains requirements (if using universal links)

Add to `Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>koinonia</string>
    </array>
    <key>CFBundleURLName</key>
    <string>org.koinonia.app</string>
  </dict>
</array>
```

### 5.2 Configure Deep Links for Android

**File: `android/app/src/main/AndroidManifest.xml`**

**Before editing, verify:**
- [ ] Android intent filter documentation
- [ ] App Links configuration (if needed)

Add inside `<activity>` tag:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="koinonia" />
</intent-filter>
```

### 5.3 Update Capacitor Configuration

**File: `capacitor.config.ts`**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.koinonia.app',
  appName: 'Koinonia',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

**Validation:**
- [ ] Build succeeds: `npm run build`
- [ ] iOS build: `npx cap sync ios`
- [ ] Android build: `npx cap sync android`
- [ ] Deep links open app correctly on both platforms

---

## Phase 6: Offline Persistence & Edge Cases

### 6.1 IndexedDB Persistence for Yjs

**Before implementation, verify:**
- [ ] y-indexeddb provider documentation
- [ ] Browser/WebView IndexedDB support

```bash
npm install y-indexeddb
```

**File: `src/services/WebRTCSyncService.ts` (updated)**

```typescript
import { IndexeddbPersistence } from 'y-indexeddb';

export class WebRTCSyncService implements ISyncService {
  private provider: WebrtcProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  // ... rest of the code

  async connect(roomId: string): Promise<void> {
    // ... existing code

    // Add IndexedDB persistence
    this.persistence = new IndexeddbPersistence(roomId, this.doc);
    
    await this.persistence.whenSynced;
    
    // Then connect to WebRTC
    this.provider = new WebrtcProvider(/* ... */);
  }

  disconnect(): void {
    if (this.persistence) {
      this.persistence.destroy();
      this.persistence = null;
    }
    // ... rest of cleanup
  }
}
```

### 6.2 Handle Network Reconnection

**File: `src/hooks/useNetworkStatus.ts`**

```typescript
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkStatus();

    const listener = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return isOnline;
};
```

Update `GroceryListPage` to show network status.

---

## Phase 7: Optimization & Production Readiness

### 7.1 Performance Optimization

**Action Items:**
1. **Verify**: React rendering performance with React DevTools
2. **Optimize**: Use React.memo for list items
3. **Check**: Yjs document size doesn't grow unbounded
4. **Implement**: Garbage collection for deleted items

### 7.2 Error Handling

**File: `src/components/ErrorBoundary.tsx`**

```typescript
import React, { Component, ReactNode } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonText } from '@ionic/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Error</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonText color="danger">
              <h2>Something went wrong</h2>
              <p>{this.state.error?.message}</p>
            </IonText>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}
```

### 7.3 Security Considerations

**Action Items:**
1. **Review**: Room ID generation (crypto.randomUUID() is secure)
2. **Consider**: Optional password protection for rooms
3. **Verify**: No sensitive data logged to console
4. **Check**: WebRTC encryption (enabled by default)

---

## Phase 8: Testing on Real Devices

### 8.1 Multi-Device Testing Protocol

**Test Scenarios:**
1. **Two devices, both online:**
   - Add items on device A → verify appears on device B
   - Toggle item on device B → verify on device A
   - Concurrent edits → verify CRDT merges correctly

2. **Offline/Online transitions:**
   - Device A offline, add items → bring online → verify sync
   - Device B offline during changes → reconnect → verify updates

3. **Deep link sharing:**
   - Share from device A → open on device B → verify joins same room

4. **Edge cases:**
   - Delete while offline → sync → verify consistency
   - Clear list on one device → verify on all
   - App backgrounded/foregrounded → verify reconnection

**Validation Checklist:**
- [ ] Items sync within 1-2 seconds when both online
- [ ] No data loss during offline periods
- [ ] Deep links open app and join correct room
- [ ] Battery usage acceptable (< 5% per hour)
- [ ] No crashes or memory leaks during extended use

---

## Documentation Requirements

### README.md

The README.md already exists with project overview. As development progresses, update it with:
- Installation instructions (building from source)
- Quick start guide (creating and sharing lists)
- Architecture diagram (consider using Mermaid in markdown)
- How P2P sync works (simplified explanation)
- Troubleshooting guide (common issues)
- Contributing guidelines
- Known limitations
- Link to F-Droid listing (when published)

**Keep README updated as you implement features** - it's the first thing contributors and users see.

### F-Droid Metadata

Create `fastlane/metadata/android/en-US/` directory structure for F-Droid:

```bash
mkdir -p fastlane/metadata/android/en-US
```

**File: `fastlane/metadata/android/en-US/full_description.txt`**
```
Koinonia enables parallel grocery shopping with real-time P2P synchronization.

Multiple people can shop the same list simultaneously - as items are found and checked off, everyone sees updates instantly. Perfect for households splitting up between store sections or roommates coordinating shopping.

FEATURES:
• Real-time peer-to-peer sync (no central server)
• Parallel shopping - multiple people shop simultaneously
• Instant updates - check off items and everyone sees it
• Share via deep links - send a link to join your list
• Offline-first - works without internet, syncs when reconnected
• Privacy-focused - no tracking, no accounts, no data collection

HOW IT WORKS:
Create a list, share the link with household members, and shop together. The app uses WebRTC for direct peer-to-peer connections and CRDTs to ensure all changes merge correctly, even when made simultaneously.

Your data never touches a server - it stays on your devices and syncs directly between peers.
```

**File: `fastlane/metadata/android/en-US/short_description.txt`**
```
Parallel shopping with real-time P2P sync. No server needed.
```

**File: `fastlane/metadata/android/en-US/title.txt`**
```
Koinonia
```

### Code Documentation

- [ ] JSDoc comments for all public methods
- [ ] Interface documentation with examples
- [ ] Complex algorithms explained with comments
- [ ] Architecture decision records (ADRs) for key choices

### Contributing Guide

**File: `CONTRIBUTING.md`**

Create a contributing guide that includes:
- Code of conduct (or reference to one)
- How to set up development environment
- Code style guidelines (following SOLID principles)
- How to run tests
- Pull request process
- How to report bugs
- Feature request process

This is important for FOSS projects to welcome contributors.

---

## Success Criteria

**MVP Complete When:**
- [ ] All documentation verified for each technology
- [ ] All interfaces implemented following SOLID principles
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests demonstrate P2P sync
- [ ] App runs on iOS and Android devices
- [ ] Deep links work on both platforms
- [ ] Offline persistence functional
- [ ] Two devices can sync in real-time
- [ ] No memory leaks or performance issues
- [ ] Code documented and reviewed
- [ ] README.md comprehensive and accurate
- [ ] CONTRIBUTING.md created
- [ ] F-Droid metadata prepared

**Future Enhancements (Post-MVP):**
- Shopping categories/sections
- Item quantities and units
- Recipe integration
- Multiple lists per user
- Custom signaling server deployment
- End-to-end encryption
- List sharing via QR codes
- Dark mode
- Multi-language support

---

## Phase 9: F-Droid Publishing

### 9.1 Prepare for F-Droid Submission

**Before submitting, verify:**
- [ ] F-Droid inclusion policy: https://f-droid.org/docs/Inclusion_Policy/
- [ ] F-Droid build requirements: https://f-droid.org/docs/Building_Applications/

**Action Items:**

1. **Ensure build reproducibility:**
   ```bash
   # F-Droid builds from source, so ensure:
   # - All dependencies are in package.json
   # - No binary files in repo (except essential assets)
   # - Build process is fully automated
   ```

2. **Add F-Droid build metadata:**
   
   Create `metadata/org.koinonia.app.yml` (this goes in F-Droid's data repo, not yours):
   ```yaml
   Categories:
     - Internet
     - Shopping
   License: AGPL-3.0-or-later
   AuthorName: Your Name
   AuthorEmail: your-email@example.com
   SourceCode: https://github.com/yourusername/koinonia
   IssueTracker: https://github.com/yourusername/koinonia/issues
   
   AutoName: Koinonia
   
   RepoType: git
   Repo: https://github.com/yourusername/koinonia.git
   
   Builds:
     - versionName: '1.0.0'
       versionCode: 1
       commit: v1.0.0
       subdir: android/app
       gradle:
         - yes
   
   AutoUpdateMode: Version v%v
   UpdateCheckMode: Tags
   CurrentVersion: '1.0.0'
   CurrentVersionCode: 1
   ```

3. **Verify no anti-features:**
   - [ ] No tracking (confirmed)
   - [ ] No ads (confirmed)
   - [ ] No non-free dependencies
   - [ ] No non-free network services (public STUN/signaling are OK)

4. **Tag a release:**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0 - Initial F-Droid release"
   git push origin v1.0.0
   ```

### 9.2 Submit to F-Droid

**Process:**
1. Fork F-Droid's data repository: https://gitlab.com/fdroid/fdroiddata
2. Add your app's metadata file
3. Test the build locally using `fdroid build`
4. Submit merge request to F-Droid
5. Wait for review (can take weeks)
6. Respond to any feedback from F-Droid maintainers

**Alternative: Use F-Droid submission form:**
- https://f-droid.org/docs/Submitting_to_F-Droid_Quick_Start_Guide/

### 9.3 Post-Publication

**When published:**
- [ ] Add F-Droid badge to README
- [ ] Update documentation with F-Droid link
- [ ] Announce on social media / forums
- [ ] Monitor issue tracker for user feedback
- [ ] Set up automated releases (consider using fastlane)

---

## Appendix: Useful Commands Reference

### Development
```bash
# Start dev server
npm start

# Build for production
npm run build

# Run on iOS (using native-run - already installed)
npx cap run ios
# Or: ionic cap run ios

# Run on Android (using native-run - already installed)
npx cap run android
# Or: ionic cap run android

# Sync native projects
npx cap sync

# Open native IDEs
npx cap open ios
npx cap open android
```

### Asset Generation
```bash
# Generate app icons and splash screens (cordova-res - already installed)
# First, create source files:
# - resources/icon.png (1024x1024px)
# - resources/splash.png (2732x2732px)

cordova-res ios --skip-config --copy
cordova-res android --skip-config --copy
```

### Testing
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/parallel-shopping-indicator
git commit -m "feat: add visual indicator for parallel shoppers"
git push origin feature/parallel-shopping-indicator

# Conventional commits format:
# feat: new feature
# fix: bug fix
# docs: documentation changes
# chore: maintenance tasks
# refactor: code refactoring
# test: test additions/changes
```

### Debugging
```bash
# View Capacitor logs (Android)
npx cap run android -l

# View Capacitor logs (iOS)
npx cap run ios -l

# Chrome DevTools for WebView debugging
# Android: chrome://inspect
# iOS: Safari > Develop > Simulator
```