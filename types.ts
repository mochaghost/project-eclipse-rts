
// Extend JSX.IntrinsicElements to include Three.js elements
// Explicitly declaring common elements to ensure TypeScript picks them up
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      pointLight: any;
      dodecahedronGeometry: any;
      meshStandardMaterial: any;
      cylinderGeometry: any;
      boxGeometry: any;
      sphereGeometry: any;
      coneGeometry: any;
      planeGeometry: any;
      torusGeometry: any;
      octahedronGeometry: any;
      instancedMesh: any;
      fog: any;
      directionalLight: any;
      hemisphereLight: any;
      ambientLight: any;
      meshBasicMaterial: any;
      fogExp2: any;
      spotLight: any;
      primitive: any;
      [elemName: string]: any;
    }
  }
}

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
  PEASANT = 'PEASANT'
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
  AEON_ENCOUNTER = 'AEON_ENCOUNTER',
  BATTLE_REPORT = 'BATTLE_REPORT'
}

export type MapEventType = 'NONE' | 'TITAN_GAZE' | 'VOID_STORM' | 'TREMOR' | 'MOCKING_RAID' | 'VISION_RITUAL' | 'PEASANT_RAID' | 'FACTION_SIEGE' | 'NIGHT_BATTLE' | 'BATTLE_CINEMATIC'; 
export type WeatherType = 'CLEAR' | 'RAIN' | 'ASH_STORM' | 'VOID_MIST';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface VisualEffect {
  id: string;
  type: 'TEXT_XP' | 'TEXT_DAMAGE' | 'TEXT_GOLD' | 'EXPLOSION' | 'TEXT_LOOT' | 'SPLAT_TOMATO' | 'SPLAT_MUD' | 'SPELL_CAST' | 'SHIELD_BLOCK';
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
  
  // NEW: The Reason for their existence
  origin: string; // e.g., "Spawned by High Fear", "Avenging Kin", "Attracted by Gold"

  // Combat Stats
  hp: number;
  maxHp: number;
  priority: TaskPriority;
  
  // Render Props
  position: Vector3;
  initialPosition: Vector3; 
  taskId: string; 
  subtaskId?: string; 
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
  startTime?: number; 
  deadline?: number; 
}

export interface TaskTemplate {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    subtasks: SubtaskDraft[];
    estimatedDuration: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string; 
  startTime: number; 
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
  foresightBonus?: number;
  lastNotificationLevel?: number; // 0=None, 1=25%, 2=50%, 3=75%, 4=90% 
}

export interface HistoryLog {
    id: string;
    timestamp: number;
    type: 'VICTORY' | 'DEFEAT' | 'ERA_CHANGE' | 'RITUAL' | 'TRADE' | 'LORE' | 'WORLD_EVENT' | 'DIPLOMACY' | 'LOOT' | 'MAGIC' | 'SIEGE' | 'DAILY_REPORT' | 'NARRATIVE';
    message: string;
    details?: string;
    cause?: string; // NEW: The causality link (e.g. "Triggered by Low Order")
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'HEAL_HERO' | 'HEAL_BASE' | 'MERCENARY' | 'UPGRADE_FORGE' | 'UPGRADE_WALLS' | 'UPGRADE_LIBRARY' | 'UPGRADE_LIGHTS' | 'BUY_TIME';
    value: number; 
    tier?: number; // 1, 2, 3
}

// --- DEEP SIMULATION TYPES ---
export interface NPCRelationship {
    targetId: string;
    type: 'FRIEND' | 'RIVAL' | 'LOVER' | 'ENEMY' | 'VICTIM';
    score: number; // -100 to 100
    lastInteraction: number; // timestamp
}

export interface PsychProfile {
    openness: number;      // 0-100: Curiosity vs Consistency
    conscientiousness: number; // 0-100: Duty vs Laziness
    extroversion: number;  // 0-100: Social vs Solitary
    agreeableness: number; // 0-100: Compassion vs Aggression
    neuroticism: number;   // 0-100: Stability vs Anxiety
    
    // Hidden stats
    bravery: number;       // 0-100: Fight vs Flight
    greed: number;         // 0-100: Crime probability
    faith: number;         // 0-100: Resistance to Void corruption
}

export interface NPC {
    id: string;
    name: string;
    role: 'Peasant' | 'Smith' | 'Guard' | 'Noble' | 'Scholar' | 'Cultist' | 'Beggar' | 'Artificer' | 'Ranger' | 'Militia';
    race: RaceType;
    factionId?: FactionKey; 
    traits: string[]; // Legacy descriptive tags
    psych?: PsychProfile; // NEW: The Brain
    stats: { strength: number, intellect: number, loyalty: number };
    status: 'ALIVE' | 'DEAD' | 'MARRIED' | 'EXILED' | 'HEROIC' | 'MAD';
    mood: 'HOPEFUL' | 'NEUTRAL' | 'TERRIFIED' | 'REBELLIOUS' | 'MANIC' | 'INSPIRED' | 'VENGEFUL' | 'BROKEN';
    sanity: number; // 0-100.
    
    // Deep Sim States
    hunger: number; // 0-100
    fatigue: number; // 0-100
    currentAction: 'IDLE' | 'WORKING' | 'PRAYING' | 'COWERING' | 'RIOTING' | 'FIGHTING' | 'SLEEPING' | 'EATING' | 'SOCIALIZING' | 'SCHEMING' | 'MOURNING';
    targetEntityId?: string; // What are they interacting with?
    
    age: number;
    relationships: NPCRelationship[]; 
    memories: string[]; // Log of events
}

export interface FactionReputation {
    id: FactionKey;
    name: string;
    reputation: number; // -100 to 100
    status: 'WAR' | 'HOSTILE' | 'NEUTRAL' | 'FRIENDLY' | 'ALLIED';
}

export interface Structures {
    forgeLevel: number; // Affects Hero Damage. Infinite
    wallsLevel: number; // Affects Base HP Max. Infinite
    libraryLevel: number; // Affects XP Gain. Infinite
    marketLevel: number; // Affects Gold Gain. Infinite
    lightingLevel: number; // Affects Aesthetic/Hope. Infinite
}

export interface Item {
    id: string;
    type: 'WEAPON' | 'ARMOR' | 'RELIC';
    name: string;
    lore: string;
    value: number;
    acquiredAt: number;
    isEquipped: boolean;
}

export interface HeroEquipment {
    weapon: string; // Legacy String for backward compatibility (display name)
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
    measurementId?: string;
}

export interface GameSettings {
    masterVolume: number; // 0.0 to 1.0
    graphicsQuality: 'LOW' | 'HIGH';
    googleSheetId?: string; // Primary Sheet Source
    googleSheetId2?: string; // Secondary Sheet Source (NEW)
    directVisionUrl?: string; // Direct text links
    uiScale?: number; // 0.8 to 1.2
    safeAreaPadding?: number; // 0 to 50px
}

export interface RealmStats {
    hope: number; // 0-100
    fear: number; // 0-100
    order: number; // 0-100
}

export interface DefenseStats {
    total: number;
    walls: number;
    hero: number;
    minions: number;
    moraleBonus: number;
}

// NEW: Store the last battle results
export interface BattleReport {
    timestamp: number;
    attackerFactionId: FactionKey | 'UNKNOWN';
    siegeFlavor: string;
    threatLevel: number;
    defenseLevel: number;
    outcome: 'VICTORY' | 'DEFEAT' | 'CRUSHING_VICTORY';
    damageTaken: number;
    lootStolen: number;
    enemiesDefeated: number;
    conqueredFaction?: string;
}

// NEW: Daily Narrative System - The 3 Acts
export interface DailyNarrative {
    dayId: string; // YYYY-MM-DD
    title: string; // Dynamic Title
    theme: 'FEAR' | 'HOPE' | 'ORDER' | 'CHAOS' | 'GREED' | 'MAGIC' | 'WAR';
    stage: 'INCIDENT' | 'RISING' | 'CLIMAX' | 'RESOLUTION'; 
    acts: {
        act1?: string; // Summary of the Incident (Morning)
        act2?: string; // Summary of the Rising Action (Midday)
        act3?: string; // Summary of the Climax (Evening)
    };
    logs: string[]; // Raw event logs used to build the narrative
    intensity: number; // 0-100, determines difficulty of Climax
    resolved: boolean;
    cause: string; // The root cause string
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
  weather: WeatherType; 
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
  visionQueue: string[]; 
  seenVisionUrls: string[]; // NEW: Tracks history of seen videos to prevent repeats
  
  // Advanced Simulation
  population: NPC[];
  realmStats: RealmStats;
  structures: Structures; 
  factions: FactionReputation[]; 
  heroEquipment: HeroEquipment; 
  inventory: Item[]; 
  templates: TaskTemplate[]; 
  
  // Graveyard for Nemesis System
  nemesisGraveyard: { name: string, clan: string, deathTime: number, killer: 'HERO' | 'TIME' }[];

  // CYCLE OF THE ECLIPSE
  worldGenerationDay: number; 
  lastBattleReport?: BattleReport; 
  defenseStats?: DefenseStats;
  
  // NEW: Narrative Engine
  dailyNarrative?: DailyNarrative;

  syncConfig?: {
      firebase: FirebaseConfig;
      roomId: string; 
      isConnected: boolean;
      user?: { uid: string, displayName: string | null, email: string | null };
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
  moveTask: (taskId: string, newStartTime: number) => void;
  deleteTask: (taskId: string) => void; 
  completeTask: (taskId: string) => void;
  partialCompleteTask: (taskId: string, percentage: number) => void; 
  completeSubtask: (taskId: string, subtaskId: string) => void;
  failTask: (taskId: string) => void;
  selectEnemy: (enemyId: string | null) => void;
  resolveCrisisHubris: (taskId: string) => void;
  resolveCrisisHumility: (taskId: string) => void; 
  resolveAeonBattle: (taskId: string, newSubtasks: string[], success: boolean) => void; 
  resolveFailedTask: (taskId: string, action: 'RESCHEDULE' | 'MERGE', newTime?: number) => void;
  triggerRitual: (type: AlertType) => void;
  triggerEvent: (type: MapEventType) => void; 
  completeRitual: () => void;
  toggleGrimoire: () => void;
  toggleProfile: () => void;
  toggleMarket: () => void;
  toggleAudit: () => void; 
  toggleSettings: () => void;
  toggleDiplomacy: () => void; 
  
  // NEW: CHRONOS
  isChronosOpen: boolean;
  toggleChronos: () => void;

  interactWithFaction: (factionId: FactionKey, action: 'GIFT' | 'TRADE' | 'INSULT' | 'PROPAGANDA') => void;
  buyItem: (itemId: string) => void;
  sellItem: (itemId: string) => void; 
  equipItem: (itemId: string) => void; 
  clearSave: () => void; 
  exportSave: () => string; 
  importSave: (data: string) => boolean; 
  connectToCloud: (config: FirebaseConfig, roomId?: string) => Promise<boolean>; 
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  disconnectCloud: () => void;
  addEffect: (type: VisualEffect['type'], position: {x:number, y:number, z:number}, text?: string) => void; 
  closeVision: () => void; 
  rerollVision: () => void; 
  interactWithNPC: (npcId: string) => void; 
  updateSettings: (settings: Partial<GameSettings>) => void;
  castSpell: (spellId: string) => void; 
  testCloudConnection: () => Promise<{success: boolean, message: string}>;
  forcePull: () => void;
  saveTemplate: (template: Omit<TaskTemplate, 'id'>) => void;
  deleteTemplate: (templateId: string) => void;
  requestPermissions: () => Promise<void>;
  takeBaseDamage: (amount: number, reason?: string) => void;
  resolveNightPhase: () => void;
  closeBattleReport: () => void;
}
