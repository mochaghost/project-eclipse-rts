
import { GameState, AlertType, Era, TaskPriority, MapEventType } from '../types';
import { generateId } from './generators';
import { FACTIONS } from '../constants';

const SAVE_KEY = 'PROJECT_ECLIPSE_SAVE_V1';
const CURRENT_VERSION = 15; // Bump version to force migration check

interface SaveFile {
    version: number;
    timestamp: number;
    data: GameState;
}

const DEFAULT_STATE: GameState = {
  playerLevel: 1,
  militaryTech: 1,
  xp: 0,
  gold: 150, // Default start
  heroHp: 100,
  maxHeroHp: 100,
  baseHp: 50,
  maxBaseHp: 50,
  mana: 100,
  maxMana: 100,
  tasks: [],
  enemies: [],
  minions: [],
  lootOrbs: [], 
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
  seenVisionUrls: [],
  population: [],
  realmStats: { hope: 50, fear: 10, order: 50 },
  structures: { forgeLevel: 0, wallsLevel: 0, libraryLevel: 0, marketLevel: 0, lightingLevel: 0 },
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
  materials: { IRON: 0, WOOD: 0, OBSIDIAN: 0, ASTRAL: 0 },
  templates: [],
  nemesisGraveyard: [],
  worldGenerationDay: 0,
  isAuditOpen: false,
  isSettingsOpen: false,
  isDiplomacyOpen: false,
  isForgeOpen: false,
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
            isDiplomacyOpen: false,
            isForgeOpen: false
        };

        const saveFile: SaveFile = {
            version: CURRENT_VERSION,
            timestamp: Date.now(),
            data: cleanState
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveFile));
    } catch (e) {
        console.error("[System] Save failed:", e);
    }
};

export const loadGame = (): GameState => {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return DEFAULT_STATE;

        const saveFile: any = JSON.parse(raw); 
        
        if (!saveFile || typeof saveFile !== 'object' || !saveFile.data) {
            return DEFAULT_STATE;
        }

        let loadedState = saveFile.data;
        let loadedVersion = saveFile.version || 1;

        if (loadedVersion < CURRENT_VERSION) {
            console.log(`[System] Migrating save from V${loadedVersion} to V${CURRENT_VERSION}...`);
            loadedState = performMigration(loadedState, loadedVersion);
        }

        // DEEP SANITIZATION FOR GOLD
        // Ensure gold is a valid number. If NaN or undefined, reset to 150.
        const safeGold = (typeof loadedState.gold === 'number' && !isNaN(loadedState.gold)) ? loadedState.gold : 150;

        return {
            ...DEFAULT_STATE,
            ...loadedState,
            gold: safeGold,
            militaryTech: loadedState.militaryTech || 1,
            tasks: Array.isArray(loadedState.tasks) ? loadedState.tasks : [],
            enemies: Array.isArray(loadedState.enemies) ? loadedState.enemies : [],
            minions: Array.isArray(loadedState.minions) ? loadedState.minions : [],
            lootOrbs: Array.isArray(loadedState.lootOrbs) ? loadedState.lootOrbs : [], 
            history: Array.isArray(loadedState.history) ? loadedState.history : [],
            population: Array.isArray(loadedState.population) ? loadedState.population : [],
            realmStats: loadedState.realmStats || DEFAULT_STATE.realmStats,
            structures: { ...DEFAULT_STATE.structures, ...(loadedState.structures || {}) },
            factions: Array.isArray(loadedState.factions) ? loadedState.factions : DEFAULT_STATE.factions,
            heroEquipment: loadedState.heroEquipment || DEFAULT_STATE.heroEquipment,
            nemesisGraveyard: Array.isArray(loadedState.nemesisGraveyard) ? loadedState.nemesisGraveyard : [],
            settings: loadedState.settings || DEFAULT_STATE.settings,
            inventory: Array.isArray(loadedState.inventory) ? loadedState.inventory : [],
            materials: loadedState.materials || DEFAULT_STATE.materials,
            templates: Array.isArray(loadedState.templates) ? loadedState.templates : []
        };

    } catch (e) {
        console.error("[System] Load crash.", e);
        return DEFAULT_STATE;
    }
};

const performMigration = (state: any, fromVersion: number): GameState => {
    let migrated = { ...state };
    if (!migrated) return DEFAULT_STATE;

    // FORCE FIX FOR NAN GOLD
    if (migrated.gold === null || migrated.gold === undefined || isNaN(migrated.gold)) {
        migrated.gold = 150;
    }

    if (fromVersion < 2) {
        migrated.gold = 150;
        migrated.isMarketOpen = false;
    }
    
    return migrated;
};
