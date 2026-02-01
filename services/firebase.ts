
// Using Import Map aliases defined in index.html
// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database';
// @ts-ignore
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

import { FirebaseConfig, GameState } from '../types';

let app: any = null;
let db: any = null;
let auth: any = null;
let currentUnsubscribe: any = null;

// User provided default config - HARDCODED FOR CONVENIENCE
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAC0BL8gZCzOZeHuSBXTljs2Zs0v4MA070",
  authDomain: "project-eclipse-fa3c3.firebaseapp.com",
  databaseURL: "https://project-eclipse-fa3c3-default-rtdb.firebaseio.com",
  projectId: "project-eclipse-fa3c3",
  storageBucket: "project-eclipse-fa3c3.firebasestorage.app",
  messagingSenderId: "288248063684",
  appId: "1:288248063684:web:a59717db1d5995be8c0b91",
  measurementId: "G-SH8WKF3ZGH"
};

export const initFirebase = (config: FirebaseConfig = DEFAULT_FIREBASE_CONFIG) => {
    try {
        if (!app) {
            app = initializeApp(config);
            db = getDatabase(app);
            auth = getAuth(app);
            console.log("[Cloud] Firebase & Auth Initialized via CDN");
        }
        return true;
    } catch (e) {
        console.error("[Cloud] Init Failed", e);
        return false;
    }
};

// --- AUTH FUNCTIONS ---

export const loginWithGoogle = async (): Promise<any> => {
    if (!auth) initFirebase();
    if (!auth) {
        console.error("Auth not initialized");
        throw new Error("Firebase Auth not initialized");
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Auth Error", error);
        throw error;
    }
};

export const logout = async () => {
    if (auth) await signOut(auth);
};

export const subscribeToAuth = (callback: (user: any) => void) => {
    if (!auth) initFirebase();
    if (!auth) {
        console.warn("Auth initialization failed - cannot subscribe");
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};

// --- DATA FUNCTIONS ---

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
        lastSyncTimestamp: Date.now()
    };

    try {
        // We use JSON parse/stringify to sanitize undefined values which Firebase hates
        const sanitized = JSON.parse(JSON.stringify(cleanState));
        await set(ref(db, `timelines/${roomId}`), sanitized);
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
    // We don't nullify app/auth to allow reconnection without full reload if needed
    db = null;
};
