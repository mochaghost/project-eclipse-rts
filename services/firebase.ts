
// Using Import Map aliases defined in index.html
// @ts-ignore
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database';
// @ts-ignore
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

import { FirebaseConfig, GameState } from '../types';

let app: any = null;
let db: any = null;
let auth: any = null;
let currentUnsubscribe: any = null;

// PLACEHOLDER CONFIG - This is likely what is causing the "configuration-not-found" error
// The user MUST provide their own config via the Settings UI if this fails.
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
    // 1. Check LocalStorage for a User Override FIRST
    let activeConfig = config;
    try {
        const saved = localStorage.getItem('ECLIPSE_FIREBASE_CONFIG');
        if (saved) {
            activeConfig = JSON.parse(saved);
            console.log("[Cloud] Loaded Custom Config from LocalStorage");
        }
    } catch (e) {
        console.warn("[Cloud] Failed to load saved config", e);
    }

    // 2. Initialize
    try {
        const apps = getApps();
        if (apps.length === 0) {
            app = initializeApp(activeConfig);
            console.log("[Cloud] Firebase App Instance Created");
        } else {
            app = getApp(); // Use existing
        }
    } catch (e) {
        console.error("[Cloud] CRITICAL: App Init Failed. Your config might be invalid.", e);
        return false;
    }

    try {
        if (app && !db) {
            db = getDatabase(app);
        }
    } catch (e) {
        console.error("[Cloud] Database Service Failed", e);
    }

    try {
        if (app && !auth) {
            auth = getAuth(app);
        }
    } catch (e) {
        console.error("[Cloud] Auth Service Failed", e);
    }

    return !!app;
};

// --- AUTH FUNCTIONS ---

export const loginWithGoogle = async (): Promise<any> => {
    // Ensure we are initialized
    if (!auth) initFirebase();
    
    if (!auth) {
        throw new Error("Auth Service not initialized. Please check your API Config in Settings.");
    }

    const provider = new GoogleAuthProvider();
    
    try {
        console.log("[Auth] Requesting Popup...");
        const result = await signInWithPopup(auth, provider);
        console.log("[Auth] Success:", result.user.uid);
        return result.user;
    } catch (error: any) {
        console.error("[Auth] Login Error Full:", error);
        
        // Handle specific errors for the user
        if (error.code === 'auth/configuration-not-found') {
            throw new Error("CLOUD CONFIG ERROR: This project ID is not set up for Google Login. Please creating your own Firebase project, enable Google Auth, and paste the config in Settings > Cloud Save.");
        }
        if (error.code === 'auth/popup-blocked') {
            throw new Error("Popup blocked by browser. Please allow popups for this site.");
        }
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error("Login cancelled.");
        }
        if (error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
             throw new Error("INVALID API KEY. Please update your config in Settings.");
        }
        throw error;
    }
};

export const logout = async () => {
    if (auth) await signOut(auth);
};

export const subscribeToAuth = (callback: (user: any) => void) => {
    // Attempt init if not ready
    if (!auth) initFirebase();
    
    if (!auth) {
        // If still no auth, wait a bit or just return empty
        console.warn("[Auth] Cannot subscribe - Auth service missing");
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};

// --- DATA FUNCTIONS ---

export const pushToCloud = async (roomId: string, state: GameState) => {
    if (!db) {
        console.warn("[Cloud] Cannot push - Database service missing");
        return;
    }
    
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
    db = null;
};