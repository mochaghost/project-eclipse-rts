
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
    // Robust Initialization: Try each service independently
    try {
        if (!app) {
            app = initializeApp(config);
            console.log("[Cloud] Firebase App Instance Created");
        }
    } catch (e) {
        console.error("[Cloud] CRITICAL: App Init Failed", e);
        return false;
    }

    try {
        if (!db && app) {
            db = getDatabase(app);
        }
    } catch (e) {
        console.error("[Cloud] Database Service Failed", e);
    }

    try {
        if (!auth && app) {
            auth = getAuth(app);
        }
    } catch (e) {
        console.error("[Cloud] Auth Service Failed", e);
    }

    return !!app;
};

// --- AUTH FUNCTIONS ---

export const loginWithGoogle = async (): Promise<any> => {
    if (!auth) initFirebase();
    
    if (!auth) {
        console.error("Auth object is null even after init attempt.");
        throw new Error("Auth Service Unavailable. Check console for CSP/Network errors.");
    }

    const provider = new GoogleAuthProvider();
    
    try {
        console.log("[Auth] Requesting Popup...");
        const result = await signInWithPopup(auth, provider);
        console.log("[Auth] Success:", result.user.uid);
        return result.user;
    } catch (error: any) {
        console.error("[Auth] Login Error:", error);
        if (error.code === 'auth/popup-blocked') {
            throw new Error("Popup blocked by browser. Please allow popups for this site.");
        }
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error("Login cancelled by user.");
        }
        throw error;
    }
};

export const logout = async () => {
    if (auth) await signOut(auth);
};

export const subscribeToAuth = (callback: (user: any) => void) => {
    if (!auth) initFirebase();
    if (!auth) {
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
