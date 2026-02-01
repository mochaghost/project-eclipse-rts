
import { ThreeElements } from '@react-three/fiber';

export enum Era {
  RUIN = 'RUIN',
  CAPTAIN = 'CAPTAIN',
  GENERAL = 'GENERAL',
  KING = 'KING'
}

export enum EntityType {
  HERO = 'HERO',
  ENEMY = 'ENEMY',
  VILLAGER = 'VILLAGER', 
  MINION = 'MINION', 
  BUILDING_BASE = 'BUILDING_BASE',
  DECORATION_TREE = 'DECORATION_TREE',
  DECORATION_ROCK = 'DECORATION_ROCK',
  ANIMAL = 'ANIMAL',
  PEASANT = 'PEASANT' // New entity for humiliation
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export enum AlertType {
  NONE = 'NONE',
  CRISIS = 'CRISIS',
  RITUAL_MORNING = 'RITUAL_MORNING',
  RITUAL_EVENING = 'RITUAL_EVENING',
  AEON_ENCOUNTER = 'AEON_ENCOUNTER'
}

export type MapEventType = 'NONE' | 'TITAN_GAZE' | 'VOID_STORM' | 'TREMOR' | 'MOCKING_RAID' | 'VISION_RITUAL' | 'PEASANT_RAID';
export type WeatherType = 'CLEAR' | 'RAIN' | 'ASH_STORM' | 'VOID_MIST';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface VisualEffect {
  id: string;
  type: 'TEXT_XP' | 'TEXT_DAMAGE' | 'TEXT_GOLD' | 'EXPLOSION' | 'TEXT_LOOT' | 'SPLAT_TOMATO' | 'SPLAT_MUD' | 'SPELL_CAST';
  position: Vector3;
  text?: string;
  timestamp: number;
}

// --- NEMESIS SYSTEM TYPES ---
export type RaceType = 'HUMAN' | 'DWARF' | 'ELF' | 'CONSTRUCT' | 'ORC' | 'DEMON';
export type FactionKey = 'SOL' | 'VAZAROTH' | 'UMBRA' | 'IRON' | 'FROST' | 'VERDANT' | 'SILVER' | 'ASH' | 'GEAR';
export type EnemyPersonality = 'SADISTIC' | 'HONORABLE' | 'COWARDLY' | 'FANATIC' | 'CALCULATING';

export interface EnemyEntity {
  id: string;
  name: string; 
  title: string;
  race: RaceType;
  factionId: FactionKey;
  clan: string; 
  personality: EnemyPersonality;
  rank: number; // 1-10
  
  // Lore & Memory
  lore: string; 
  memories: string[]; 
  lineage: string; 
  
  // Combat Stats
  hp: number;
  maxHp: number;
  priority: TaskPriority;
  
  // Render Props
  position: Vector3;
  initialPosition: Vector3; // Added for Deadline March calculation
  taskId: string; 
  subtaskId?: string; // If this enemy represents a subtask
  scale: number; 
}

export interface MinionEntity {
    id: string;
    type: 'WARRIOR' | 'MAGE';
    position: Vector3;
    targetEnemyId: string | null;
    createdAt: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  startTime?: number; // New: When this specific minion appears
  deadline?: number; // New: When this specific minion must die
}

export interface Task {
  id: string;
  title: string;
  description?: string; 
  startTime: number; // New: When the main enemy spawns
  deadline: number;
  estimatedDuration: number;
  createdAt: number;
  priority: TaskPriority;
  completed: boolean;
  failed: boolean;
  subtasks: Subtask[];
  parentId?: string; 
  crisisTriggered: boolean; 
  hubris: boolean; 
}

export interface HistoryLog {
    id: string;
    timestamp: number;
    type: 'VICTORY' | 'DEFEAT' | 'ERA_CHANGE' | 'RITUAL' | 'TRADE' | 'LORE' | 'WORLD_EVENT' | 'DIPLOMACY' | 'LOOT' | 'MAGIC';
    message: string;
    details?: string; 
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'HEAL_HERO' | 'HEAL_BASE' | 'MERCENARY' | 'UPGRADE_FORGE' | 'UPGRADE_WALLS' | 'UPGRADE_LIBRARY';
    value: number; 
}

// --- DEEP SIMULATION TYPES ---
export interface NPCRelationship {
    targetId: string;
    type: 'FRIEND' | 'RIVAL' | 'LOVER' | 'ENEMY';
    score: number; // -100 to 100
}

export interface NPC {
    id: string;
    name: string;
    role: 'Peasant' | 'Smith' | 'Guard' | 'Noble' | 'Scholar' | 'Cultist' | 'Beggar' | 'Artificer' | 'Ranger' | 'Militia';
    race: RaceType;
    factionId?: FactionKey; 
    traits: string[];
    stats: { strength: number, intellect: number, loyalty: number };
    status: 'ALIVE' | 'DEAD' | 'MARRIED' | 'EXILED' | 'HEROIC' | 'MAD';
    mood: 'HOPEFUL' | 'NEUTRAL' | 'TERRIFIED' | 'REBELLIOUS' | 'MANIC' | 'INSPIRED';
    sanity: number; // 0-100. At 0, they transform or die.
    
    // Deep Sim
    hunger: number; // 0-100
    fatigue: number; // 0-100
    currentAction: 'IDLE' | 'WORKING' | 'PRAYING' | 'COWERING' | 'RIOTING' | 'FIGHTING' | 'SLEEPING' | 'EATING' | 'SOCIALIZING';
    targetEntityId?: string; // What are they interacting with?
    
    age: number;
    relationships: NPCRelationship[]; 
    memories: string[]; 
}

export interface FactionReputation {
    id: FactionKey;
    name: string;
    reputation: number; // -100 to 100
    status: 'WAR' | 'HOSTILE' | 'NEUTRAL' | 'FRIENDLY' | 'ALLIED';
}

export interface Structures {
    forgeLevel: number; // Affects Hero Damage
    wallsLevel: number; // Affects Base HP Max
    libraryLevel: number; // Affects XP Gain
    marketLevel: number; // Affects Gold Gain
}

export interface HeroEquipment {
    weapon: string;
    armor: string;
    relic: string;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
    databaseURL: string;
}

export interface GameSettings {
    masterVolume: number; // 0.0 to 1.0
    graphicsQuality: 'LOW' | 'HIGH';
    googleSheetId?: string; // Custom sheet for Vision Mirror
    directVisionUrl?: string; // New field for single direct link
}

export interface RealmStats {
    hope: number; // 0-100
    fear: number; // 0-100
    order: number; // 0-100
}

export interface GameState {
  playerLevel: number;
  xp: number;
  gold: number; 
  heroHp: number;
  maxHeroHp: number;
  baseHp: number;
  maxBaseHp: number;
  
  // Magic System
  mana: number;
  maxMana: number;
  
  tasks: Task[];
  enemies: EnemyEntity[];
  minions: MinionEntity[];
  effects: VisualEffect[]; 
  era: Era;
  weather: WeatherType; // New Dynamic Weather State
  sageMessage: string;
  vazarothMessage: string; 
  winStreak: number;
  lossStreak: number;
  
  // Modals
  isGrimoireOpen: boolean;
  isProfileOpen: boolean;
  isMarketOpen: boolean; 
  isAuditOpen: boolean; 
  isSettingsOpen: boolean;
  isDiplomacyOpen: boolean; 
  selectedEnemyId: string | null; 
  
  // Alerts & Events
  activeAlert: AlertType;
  alertTaskId: string | null; 
  history: HistoryLog[]; 
  activeRumor: { id: string, message: string, details: string, timestamp: number } | null; 
  activeMapEvent: MapEventType;
  activeVisionVideo: string | null; 
  
  // Advanced Simulation
  population: NPC[];
  realmStats: RealmStats;
  structures: Structures; 
  factions: FactionReputation[]; 
  heroEquipment: HeroEquipment; 
  
  // Graveyard for Nemesis System
  nemesisGraveyard: { name: string, clan: string, deathTime: number, killer: 'HERO' | 'TIME' }[];

  worldGenerationDay: number; 
  syncConfig?: {
      firebase: FirebaseConfig;
      roomId: string; 
      isConnected: boolean;
  };
  lastSyncTimestamp?: number; 
  settings: GameSettings;
}

// Helper type for subtask creation
export interface SubtaskDraft {
    title: string;
    startTime?: number;
    deadline?: number;
}

export interface TaskUpdateData {
    title?: string;
    startTime?: number;
    deadline?: number;
    priority?: TaskPriority;
    subtasks?: SubtaskDraft[];
    description?: string;
    estimatedDuration?: number;
    parentId?: string;
}

export interface GameContextType {
  state: GameState;
  addTask: (title: string, startTime: number, deadline: number, priority: TaskPriority, subtasks: SubtaskDraft[], durationMinutes: number, description?: string, parentId?: string) => void;
  editTask: (taskId: string, data: TaskUpdateData) => void; 
  moveTask: (taskId: string, newDeadline: number) => void;
  completeTask: (taskId: string) => void;
  completeSubtask: (taskId: string, subtaskId: string) => void;
  failTask: (taskId: string) => void;
  selectEnemy: (enemyId: string | null) => void;
  resolveCrisisHubris: (taskId: string) => void;
  resolveCrisisHumility: (taskId: string) => void; 
  resolveAeonBattle: (taskId: string, newSubtasks: string[], success: boolean) => void; 
  triggerRitual: (type: AlertType) => void;
  triggerEvent: (type: MapEventType) => void; 
  completeRitual: () => void;
  toggleGrimoire: () => void;
  toggleProfile: () => void;
  toggleMarket: () => void;
  toggleAudit: () => void; 
  toggleSettings: () => void;
  toggleDiplomacy: () => void; 
  interactWithFaction: (factionId: FactionKey, action: 'GIFT' | 'TRADE' | 'INSULT' | 'PROPAGANDA') => void;
  buyItem: (itemId: string) => void;
  clearSave: () => void; 
  exportSave: () => string; 
  importSave: (data: string) => boolean; 
  connectToCloud: (config: FirebaseConfig, roomId: string) => Promise<boolean>; 
  disconnectCloud: () => void;
  addEffect: (type: VisualEffect['type'], position: {x:number, y:number, z:number}, text?: string) => void; 
  closeVision: () => void; 
  rerollVision: () => void; 
  interactWithNPC: (npcId: string) => void; 
  updateSettings: (settings: Partial<GameSettings>) => void;
  castSpell: (spellId: string) => void; 
}
