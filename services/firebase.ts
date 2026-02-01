// Using Import Map aliases defined in index.html
// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database';
import { FirebaseConfig, GameState } from '../types';

let app: any = null;
let db: any = null;
let currentUnsubscribe: any = null;

export const initFirebase = (config: FirebaseConfig) => {
    try {
        if (!app) {
            app = initializeApp(config);
            db = getDatabase(app);
            console.log("[Cloud] Firebase Initialized via CDN");
        }
        return true;
    } catch (e) {
        console.error("[Cloud] Init Failed", e);
        return false;
    }
};

export const pushToCloud = async (roomId: string, state: GameState) => {
    if (!db) return;
    
    // Clean transient state before pushing to cloud
    const cleanState = {
        ...state,
        effects: [],
        activeAlert: 'NONE',
        activeMapEvent: 'NONE',
        activeVisionVideo: null,
        isGrimoireOpen: false,
        isProfileOpen: false,
        isMarketOpen: false,
        isAuditOpen: false,
        isSettingsOpen: false,
        lastSyncTimestamp: Date.now() // Critical for conflict resolution
    };

    try {
        await set(ref(db, `timelines/${roomId}`), cleanState);
        console.log(`[Cloud] Synced to Room: ${roomId}`);
    } catch (e) {
        console.error("[Cloud] Push Failed", e);
    }
};

export const subscribeToCloud = (roomId: string, onData: (data: GameState) => void) => {
    if (!db) return;

    // Unsubscribe previous if exists
    if (currentUnsubscribe) {
        off(ref(db, `timelines/${roomId}`));
    }

    const roomRef = ref(db, `timelines/${roomId}`);
    
    onValue(roomRef, (snapshot: any) => {
        const data = snapshot.val();
        if (data) {
            console.log("[Cloud] Received update from Cloud");
            onData(data);
        }
    });
};

export const disconnect = () => {
    if (db && currentUnsubscribe) {
        currentUnsubscribe = null;
    }
    app = null;
    db = null;
};