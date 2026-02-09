
import { GameState, AlertType, Era, TaskPriority, MapEventType } from '../types';
import { generateId } from './generators';
import { FACTIONS } from '../constants';

const SAVE_KEY = 'PROJECT_ECLIPSE_SAVE_V1';
const CURRENT_VERSION = 12; // Increment version to force deep sanitization

interface SaveFile {
    version: number;
    timestamp: number;
    data: GameState;
}

const DEFAULT_STATE: GameState = {
  playerLevel: 1,
  xp: 0,
  gold: 150,
  heroHp: 100,
  maxHeroHp: 100,
  baseHp: 50,
  maxBaseHp: 50,
  mana: 100,
  maxMana: 100,
  tasks: [],
  enemies: [],
  minions: [],
  effects: [],
  era: Era.RUIN,
  weather: 'CLEAR',
  sageMessage: "Welcome back, Exile.",
  vazarothMessage: "You persist?",
  winStreak: 0,
  lossStreak: 0,
  isGrimoireOpen: false,
  isProfileOpen: false,
  isMarketOpen: false,
  selectedEnemyId: null,
  activeAlert: AlertType.NONE,
  alertTaskId: null,
  history: [],
  activeRumor: null,
  activeMapEvent: 'NONE',
  activeVisionVideo: null,
  visionQueue: [],
  population: [],
  realmStats: { hope: 50, fear: 10, order: 50 },
  structures: { forgeLevel: 0, wallsLevel: 0, libraryLevel: 0, marketLevel: 0 },
  factions: [
      { id: 'SOL', name: 'Kingdom of Sol', reputation: 0, status: 'NEUTRAL' },
      { id: 'VAZAROTH', name: 'Empire of Vazaroth', reputation: -50, status: 'HOSTILE' },
      { id: 'IRON', name: 'Iron Deep Clan', reputation: 0, status: 'NEUTRAL' },
      { id: 'FROST', name: 'Frostpeak Raiders', reputation: -20, status: 'HOSTILE' },
      { id: 'VERDANT', name: 'Verdant Conclave', reputation: 10, status: 'FRIENDLY' },
      { id: 'SILVER', name: 'Silver Spire', reputation: 0, status: 'NEUTRAL' },
      { id: 'ASH', name: 'Blood-Ash Horde', reputation: -80, status: 'WAR' },
      { id: 'GEAR', name: 'The Machina', reputation: 0, status: 'NEUTRAL' }
  ],
  heroEquipment: { weapon: 'Rusty Blade', armor: 'Tattered Rags', relic: 'None' },
  inventory: [],
  templates: [],
  nemesisGraveyard: [],
  worldGenerationDay: 0,
  isAuditOpen: false,
  isSettingsOpen: false,
  isDiplomacyOpen: false,
  settings: {
      masterVolume: 0.2, 
      graphicsQuality: 'HIGH'
  }
};

export const saveGame = (state: GameState) => {
    try {
        const cleanState = {
            ...state,
            effects: [],
            activeAlert: AlertType.NONE,
            activeRumor: null,
            activeMapEvent: 'NONE' as MapEventType,
            activeVisionVideo: null,
            isGrimoireOpen: false,
            isProfileOpen: false,
            isMarketOpen: false,
            isAuditOpen: false,
            isSettingsOpen: false,
            isDiplomacyOpen: false
        };

        const saveFile: SaveFile = {
            version: CURRENT_VERSION,
            timestamp: Date.now(),
            data: cleanState
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveFile));
        console.log(`[System] Game saved. Version ${CURRENT_VERSION}`);
    } catch (e) {
        console.error("[System] Save failed:", e);
    }
};

export const loadGame = (): GameState => {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return DEFAULT_STATE;

        const saveFile: any = JSON.parse(raw); 
        
        // CRITICAL FIX: Ensure 'data' exists
        if (!saveFile || typeof saveFile !== 'object' || !saveFile.data) {
            console.warn("[System] Corrupt save file structure. Resetting to Default.");
            return DEFAULT_STATE;
        }

        let loadedState = saveFile.data;
        let loadedVersion = saveFile.version || 1;

        if (loadedVersion < CURRENT_VERSION) {
            console.log(`[System] Migrating save from V${loadedVersion} to V${CURRENT_VERSION}...`);
            loadedState = performMigration(loadedState, loadedVersion);
        }

        // DEEP SANITIZATION: Force arrays to be arrays, never undefined/null
        return {
            ...DEFAULT_STATE,
            ...loadedState,
            tasks: Array.isArray(loadedState.tasks) ? loadedState.tasks.map((t: any) => ({
                ...t,
                subtasks: Array.isArray(t.subtasks) ? t.subtasks : []
            })) : [],
            enemies: Array.isArray(loadedState.enemies) ? loadedState.enemies : [],
            minions: Array.isArray(loadedState.minions) ? loadedState.minions : [],
            history: Array.isArray(loadedState.history) ? loadedState.history : [],
            population: Array.isArray(loadedState.population) ? loadedState.population : [],
            realmStats: loadedState.realmStats || DEFAULT_STATE.realmStats,
            structures: loadedState.structures || DEFAULT_STATE.structures,
            factions: Array.isArray(loadedState.factions) ? loadedState.factions : DEFAULT_STATE.factions,
            heroEquipment: loadedState.heroEquipment || DEFAULT_STATE.heroEquipment,
            nemesisGraveyard: Array.isArray(loadedState.nemesisGraveyard) ? loadedState.nemesisGraveyard : [],
            settings: loadedState.settings || DEFAULT_STATE.settings,
            inventory: Array.isArray(loadedState.inventory) ? loadedState.inventory : [],
            visionQueue: Array.isArray(loadedState.visionQueue) ? loadedState.visionQueue : [],
            templates: Array.isArray(loadedState.templates) ? loadedState.templates : []
        };

    } catch (e) {
        console.error("[System] Load crash. Data is likely malformed JSON.", e);
        return DEFAULT_STATE;
    }
};

const performMigration = (state: any, fromVersion: number): GameState => {
    let migrated = { ...state };
    
    // Safety check for base object
    if (!migrated) return DEFAULT_STATE;

    if (fromVersion < 2) {
        migrated.gold = migrated.gold ?? 100;
        migrated.isMarketOpen = false;
    }
    // ... previous migrations ...
    
    // Ensure critical arrays exist for migration steps
    migrated.tasks = Array.isArray(migrated.tasks) ? migrated.tasks : [];
    migrated.enemies = Array.isArray(migrated.enemies) ? migrated.enemies : [];
    migrated.population = Array.isArray(migrated.population) ? migrated.population : [];

    return migrated;
};
