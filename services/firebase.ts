
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

// PLACEHOLDER CONFIG
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

    // 2. Initialize App
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

    // 3. Initialize Services
    try {
        // Init DB if not ready
        if (app && !db) {
            if (!activeConfig.databaseURL) {
                console.warn("[Cloud] Config is missing databaseURL. Cloud Save Disabled.");
                db = null;
            } else {
                // Pass URL explicitly to ensure correct shard connection
                db = getDatabase(app, activeConfig.databaseURL);
                console.log("[Cloud] Database Service Initialized");
            }
        }
    } catch (e) {
        console.error("[Cloud] Database Service Failed to Start.", e);
        db = null; 
    }

    try {
        if (app && !auth) {
            auth = getAuth(app);
            console.log("[Cloud] Auth Service Initialized");
        }
    } catch (e) {
        console.error("[Cloud] Auth Service Failed to Start.", e);
        auth = null;
    }

    return !!app && (!!db || !!auth);
};

// --- AUTH FUNCTIONS ---

export const loginWithGoogle = async (): Promise<any> => {
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
        
        if (error.code === 'auth/configuration-not-found') {
            throw new Error("CLOUD CONFIG ERROR: Project not set up. Check Firebase Console.");
        }
        if (error.code === 'auth/popup-blocked') {
            throw new Error("Popup blocked by browser.");
        }
        if (error.code === 'auth/unauthorized-domain') {
             throw new Error("DOMAIN UNAUTHORIZED. Add vercel.app to Firebase Console > Auth > Settings.");
        }
        throw error;
    }
};

export const logout = async () => {
    if (auth) await signOut(auth);
};

export const subscribeToAuth = (callback: (user: any) => void) => {
    if (!auth) initFirebase();
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
};

// --- DATA FUNCTIONS ---

export const pushToCloud = async (roomId: string, state: GameState) => {
    if (!db) return; // Silent fail
    
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
    if (!db) initFirebase(); // Try init if missing
    if (!db) return;

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
    if (db && currentUnsubscribe) currentUnsubscribe = null;
    db = null;
};

export const testConnection = async (roomId: string): Promise<{success: boolean, message: string}> => {
    if (!db) {
        console.log("[Test] DB missing, attempting re-init...");
        initFirebase();
    }
    
    if (!db) return { success: false, message: "DB Service not running. Config might be missing databaseURL." };
    
    try {
        await set(ref(db, `timelines/${roomId}/_connection_test`), Date.now());
        return { success: true, message: "Write successful" };
    } catch (e: any) {
        console.error("Test Connection Failed", e);
        return { success: false, message: e.message || "Write failed (Check Rules)" };
    }
}
