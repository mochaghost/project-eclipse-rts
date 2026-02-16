
import React from 'react';

// Extend JSX.IntrinsicElements to include Three.js elements
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
      ringGeometry: any;
      [elemName: string]: any;
    }
  }
}

// Augment React's internal JSX namespace for newer TS/React versions
declare module 'react' {
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
      ringGeometry: any;
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
  PEASANT = 'PEASANT',
  LOOT_ORB = 'LOOT_ORB' 
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
  type: 'TEXT_XP' | 'TEXT_DAMAGE' | 'TEXT_GOLD' | 'EXPLOSION' | 'TEXT_LOOT' | 'SPLAT_TOMATO' | 'SPLAT_MUD' | 'SPELL_CAST' | 'SHIELD_BLOCK' | 'SHOCKWAVE';
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
  lore: string; 
  memories: string[]; 
  lineage: string; 
  origin: string; 
  hp: number;
  maxHp: number;
  priority: TaskPriority;
  position: Vector3;
  initialPosition: Vector3; 
  taskId: string; 
  subtaskId?: string; 
  scale: number;
  executionReady?: boolean; // The "Broken" state waiting for click
}

export interface MinionEntity {
    id: string;
    type: 'WARRIOR' | 'MAGE';
    position: Vector3;
    targetEnemyId: string | null;
    createdAt: number;
}

export type MaterialType = 'IRON' | 'WOOD' | 'OBSIDIAN' | 'ASTRAL';

export interface LootOrb {
    id: string;
    type: 'GOLD' | 'XP' | 'MATERIAL';
    value: number;
    material?: MaterialType; // For MATERIAL type
    position: Vector3;
    velocity: Vector3;
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
  lastNotificationLevel?: number; 
}

export interface HistoryLog {
    id: string;
    timestamp: number;
    type: 'VICTORY' | 'DEFEAT' | 'ERA_CHANGE' | 'RITUAL' | 'TRADE' | 'LORE' | 'WORLD_EVENT' | 'DIPLOMACY' | 'LOOT' | 'MAGIC' | 'SIEGE' | 'DAILY_REPORT' | 'NARRATIVE' | 'CRAFT';
    message: string;
    details?: string;
    cause?: string; 
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'HEAL_HERO' | 'HEAL_BASE' | 'MERCENARY' | 'UPGRADE_FORGE' | 'UPGRADE_WALLS' | 'UPGRADE_LIBRARY' | 'UPGRADE_LIGHTS' | 'BUY_TIME';
    value: number; 
    tier?: number; 
}

export interface NPCRelationship {
    targetId: string;
    type: 'FRIEND' | 'RIVAL' | 'LOVER' | 'ENEMY' | 'VICTIM';
    score: number; 
    lastInteraction: number; 
}

export interface PsychProfile {
    openness: number;      
    conscientiousness: number; 
    extroversion: number;  
    agreeableness: number; 
    neuroticism: number;   
    bravery: number;       
    greed: number;         
    faith: number;         
}

export interface NPC {
    id: string;
    name: string;
    role: 'Peasant' | 'Smith' | 'Guard' | 'Noble' | 'Scholar' | 'Cultist' | 'Beggar' | 'Artificer' | 'Ranger' | 'Militia';
    race: RaceType;
    factionId?: FactionKey; 
    traits: string[]; 
    psych?: PsychProfile; 
    stats: { strength: number, intellect: number, loyalty: number };
    status: 'ALIVE' | 'DEAD' | 'MARRIED' | 'EXILED' | 'HEROIC' | 'MAD';
    mood: 'HOPEFUL' | 'NEUTRAL' | 'TERRIFIED' | 'REBELLIOUS' | 'MANIC' | 'INSPIRED' | 'VENGEFUL' | 'BROKEN';
    sanity: number; 
    hunger: number; 
    fatigue: number; 
    currentAction: 'IDLE' | 'WORKING' | 'PRAYING' | 'COWERING' | 'RIOTING' | 'FIGHTING' | 'SLEEPING' | 'EATING' | 'SOCIALIZING' | 'SCHEMING' | 'MOURNING';
    targetEntityId?: string; 
    age: number;
    relationships: NPCRelationship[]; 
    memories: string[]; 
}

export interface FactionReputation {
    id: FactionKey;
    name: string;
    reputation: number; 
    status: 'WAR' | 'HOSTILE' | 'NEUTRAL' | 'FRIENDLY' | 'ALLIED';
}

export interface Structures {
    forgeLevel: number; 
    wallsLevel: number; 
    libraryLevel: number; 
    marketLevel: number; 
    lightingLevel: number; 
}

export interface Item {
    id: string;
    type: 'WEAPON' | 'ARMOR' | 'RELIC';
    name: string;
    lore: string;
    value: number;
    acquiredAt: number;
    isEquipped: boolean;
    rarity?: 'COMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';
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
    measurementId?: string;
}

export interface GameSettings {
    masterVolume: number; 
    graphicsQuality: 'LOW' | 'HIGH';
    googleSheetId?: string; 
    googleSheetId2?: string; 
    directVisionUrl?: string; 
    uiScale?: number; 
    safeAreaPadding?: number; 
}

export interface RealmStats {
    hope: number; 
    fear: number; 
    order: number; 
}

export interface DefenseStats {
    total: number;
    walls: number;
    hero: number;
    minions: number;
    moraleBonus: number;
}

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

// NEW: NARRATIVE ENGINE TYPES
export type CharacterID = 'MARSHAL_THORNE' | 'RIVAL_KROG' | 'SENESCHAL_MORVATH' | 'ORACLE_ELARA' | 'RIVAL_VASHJ' | 'RIVAL_EMPEROR';

export interface CampaignCharacter {
    id: CharacterID;
    name: string;
    title: string;
    race: RaceType;
    role: 'ALLY' | 'RIVAL' | 'NEUTRAL';
    color: string;
    description: string;
    // Current mood towards player
    attitude: 'RESPECT' | 'DISDAIN' | 'HATRED' | 'FEAR' | 'NEUTRAL'; 
}

export interface DialoguePacket {
    id: string;
    characterId: CharacterID;
    text: string;
    mood: 'ANGRY' | 'HAPPY' | 'NEUTRAL' | 'MYSTERIOUS';
    timestamp: number;
    duration: number;
    context?: string; // e.g. "Task Complete", "Act 1 Start"
}

export interface DailyNarrative {
    dayId: string; 
    title: string; 
    theme: 'FEAR' | 'HOPE' | 'ORDER' | 'CHAOS' | 'GREED' | 'MAGIC' | 'WAR';
    currentStage: 'DAWN' | 'INCIDENT' | 'RISING' | 'CLIMAX' | 'NIGHTFALL'; 
    fullStory: string; // The coherent paragraph
    eventsTracked: string[]; // IDs of events already chronicled to avoid dupes
    intensity: number; 
}

export interface GameState {
  playerLevel: number;
  xp: number;
  gold: number; 
  heroHp: number;
  maxHeroHp: number;
  baseHp: number;
  maxBaseHp: number;
  mana: number;
  maxMana: number;
  
  tasks: Task[];
  enemies: EnemyEntity[];
  minions: MinionEntity[];
  lootOrbs: LootOrb[]; // NEW: Floating loot in the world
  effects: VisualEffect[]; 
  era: Era;
  weather: WeatherType; 
  
  // New: Crafting
  materials: Record<MaterialType, number>;

  // Legacy
  sageMessage: string;
  vazarothMessage: string; 
  
  winStreak: number;
  lossStreak: number;
  isGrimoireOpen: boolean;
  isProfileOpen: boolean;
  isMarketOpen: boolean; 
  isAuditOpen: boolean; 
  isSettingsOpen: boolean;
  isDiplomacyOpen: boolean; 
  isForgeOpen: boolean; // NEW
  selectedEnemyId: string | null; 
  activeAlert: AlertType;
  alertTaskId: string | null; 
  history: HistoryLog[]; 
  activeRumor: { id: string, message: string, details: string, timestamp: number } | null; 
  activeMapEvent: MapEventType;
  activeVisionVideo: string | null; 
  visionQueue: string[]; 
  seenVisionUrls: string[]; 
  population: NPC[];
  realmStats: RealmStats;
  structures: Structures; 
  factions: FactionReputation[]; 
  heroEquipment: HeroEquipment; 
  inventory: Item[]; 
  templates: TaskTemplate[]; 
  nemesisGraveyard: { name: string, clan: string, deathTime: number, killer: 'HERO' | 'TIME' }[];
  worldGenerationDay: number; 
  lastBattleReport?: BattleReport; 
  defenseStats?: DefenseStats;
  
  // NARRATIVE ENGINE
  dailyNarrative?: DailyNarrative;
  activeDialogue?: DialoguePacket; 
  activeRivalId?: CharacterID; // Who is the main antagonist of this era?
  activeAllyId?: CharacterID; // Who is your main advisor?

  syncConfig?: {
      firebase: FirebaseConfig;
      roomId: string; 
      isConnected: boolean;
      user?: { uid: string, displayName: string | null, email: string | null };
  };
  lastSyncTimestamp?: number; 
  settings: GameSettings;
}

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
  executeEnemy: (enemyId: string) => void; // NEW: The visceral kill action
  collectLoot: (orbId: string) => void; // NEW: The reward collection
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
  toggleForge: () => void; // NEW
  isChronosOpen: boolean;
  toggleChronos: () => void;
  interactWithFaction: (factionId: FactionKey, action: 'GIFT' | 'TRADE' | 'INSULT' | 'PROPAGANDA') => void;
  buyItem: (itemId: string) => void;
  sellItem: (itemId: string) => void; 
  equipItem: (itemId: string) => void; 
  craftItem: (tier: number, materialsCost: Record<MaterialType, number>) => void; // NEW
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
  dismissDialogue: () => void; 
}
