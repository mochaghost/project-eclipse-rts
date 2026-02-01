

export const PALETTE = {
  VOID: "#050202",
  GRASS_DARK: "#142808",
  GRASS_LIGHT: "#2d4a0e",
  DIRT: "#3f2818", 
  STONE_DARK: "#1c1917",
  STONE_BASE: "#292524",
  STONE_HIGHLIGHT: "#57534e",
  WOOD_DARK: "#1a0f0a",
  WOOD_RED: "#450a0a",
  ROOF_SLATE: "#0f172a",
  ROOF_WAR: "#7f1d1d",
  GOLD: "#d97706",
  MAGIC: "#3b82f6",
  FIRE: "#ea580c",
  SKIN: "#fca5a5",
  STEEL: "#cbd5e1",
  LEATHER: "#451a03",
  RAGS: "#78350f",
  PLATE_DARK: "#334155",
  BLOOD: "#7f1d1d",
  BLOOD_BRIGHT: "#ef4444",
  BONE: "#e7e5e4",
  RUST: "#7c2d12",
  DEMON_SKIN: "#450a0a",
  DEMON_EYE: "#fef08a"
};

export const ERA_CONFIG: Record<string, { maxBaseHp: number, title: string }> = {
  'RUIN': { maxBaseHp: 50, title: "The Forgotten Exile" },
  'CAPTAIN': { maxBaseHp: 150, title: "Captain of the Watch" },
  'GENERAL': { maxBaseHp: 500, title: "Warlord of the North" },
  'KING': { maxBaseHp: 1000, title: "The Eclipse King" }
};

export const LEVEL_THRESHOLDS = {
  CAPTAIN: 20,
  GENERAL: 40,
  KING: 60,
  GOD: 80
};

// --- SPELLS ---
export const SPELLS = [
  { id: 'SMITE', name: 'Void Smite', cost: 25, cooldown: 5000, icon: 'Zap', desc: 'Deals 50 damage to target.', targetReq: true },
  { id: 'HEAL', name: 'Mend Flesh', cost: 40, cooldown: 10000, icon: 'Heart', desc: 'Restores 30 HP to Hero.', targetReq: false },
  { id: 'FREEZE', name: 'Chronos Lock', cost: 60, cooldown: 60000, icon: 'Snowflake', desc: 'Adds 30 mins to target task.', targetReq: true },
  { id: 'RAGE', name: 'Titan Strength', cost: 80, cooldown: 30000, icon: 'Sword', desc: 'Next completed task gives 2x XP.', targetReq: false }
];

// --- DARK SOULS STYLE ITEM LORE (TIERS 1-8) ---
export const EQUIPMENT_LORE = {
    WEAPONS: [
        { min: 0, name: "Broken Straight Sword", desc: "A rusted shard of iron. It remembers nothing of glory, only the desperation of its wielder." },
        { min: 10, name: "Mercenary's Falchion", desc: "Standard issue for those who sell their loyalty. Notched from battles that were never recorded in history." },
        { min: 20, name: "Captain's Claymore", desc: "Heavy steel meant to hold a line. It hums with the disciplined resolve of a leader who refuses to yield." },
        { min: 30, name: "Inquisitor's Blade", desc: "Etched with runes that burn the eyes. It was forged to execute ideas before they become actions." },
        { min: 40, name: "General's Greatsword", desc: "A massive slab of iron used to command armies. Its weight alone crushes the will of lesser beings." },
        { min: 50, name: "King's Oathkeeper", desc: "Gilded in gold that never tarnishes. A weapon for one who has conquered their own demons." },
        { min: 60, name: "Eclipse Edge", desc: "Forged from the silence between seconds. It cuts not flesh, but the timeline itself." },
        { min: 75, name: "Void-Eater", desc: "It does not reflect light; it consumes it. A weapon for a god who has outlived their universe." }
    ],
    ARMOR: [
        { min: 0, name: "Tattered Rags", desc: "Cloth that smells of ash and failure. It offers no protection against the cold truth." },
        { min: 10, name: "Hardened Leather", desc: "Cured in the smoke of burning tasks. Flexible enough to run, tough enough to survive." },
        { min: 20, name: "Chainmail of the Watch", desc: "Thousands of rings linked by patience. Each ring represents a minute reclaimed from the void." },
        { min: 30, name: "Plate of the Bulwark", desc: "Steel polished to a mirror finish, reflecting the futility of your enemies' attacks." },
        { min: 40, name: "Warlord's Pauldrons", desc: "Adorned with the skulls of procrastination. The mantle of one who leads by example." },
        { min: 50, name: "Sovereign's Regalia", desc: "Silk and steel woven together. The armor of a ruler whose word is absolute law." },
        { min: 60, name: "Armor of the Eclipse", desc: "Blacker than night, bleeding red light. It pulses in sync with your heartbeat." },
        { min: 75, name: "Cosmic Mantle", desc: "Starlight woven into fabric. You are no longer part of the world; you are its observer." }
    ]
};

// --- GEOPOLITICS & KINGDOMS ---

export const FACTIONS = {
  // HUMAN FACTIONS
  SOL: { 
      name: "Kingdom of Sol", 
      race: "HUMAN", 
      color: "#fbbf24", 
      desc: "The last bastion of Order. Knights, Paladins, and Clerics.", 
      archetype: "KNIGHT" 
  },
  VAZAROTH: { 
      name: "Empire of Vazaroth", 
      race: "HUMAN", 
      color: "#7f1d1d", 
      desc: "Corrupted humans serving the Void Emperor. Inquisitors and Blood Mages.", 
      archetype: "KNIGHT" 
  },
  
  // DEMON FACTION (The Apostles)
  UMBRA: {
      name: "The Hollow Court",
      race: "DEMON",
      color: "#000000",
      desc: "Monstrosities born of human despair. They feast on sanity.", 
      archetype: "MONSTER"
  },
  
  // DWARF FACTIONS
  IRON: { 
      name: "Iron Deep Clan", 
      race: "DWARF", 
      color: "#9ca3af", 
      desc: "Industrialists of the deep earth. Masters of siege engines.", 
      archetype: "KNIGHT" 
  },
  FROST: {
      name: "Frostpeak Raiders",
      race: "DWARF", 
      color: "#60a5fa",
      desc: "Savage dwarves of the frozen peaks. Barbarians and Runesmiths.",
      archetype: "KNIGHT"
  },

  // ELF FACTIONS
  VERDANT: { 
      name: "Verdant Conclave", 
      race: "ELF", 
      color: "#15803d", 
      desc: "Protectors of the deep wilds. Rangers and Druids.", 
      archetype: "MONSTER" 
  },
  SILVER: {
      name: "Silver Spire",
      race: "ELF", 
      color: "#c084fc",
      desc: "High Elves obsessed with arcane perfection and time magic.",
      archetype: "MONSTER" 
  },

  // ORC FACTIONS
  ASH: { 
      name: "Blood-Ash Horde", 
      race: "ORC", 
      color: "#ea580c", 
      desc: "Conquerors who burn what they cannot rule.", 
      archetype: "MONSTER" 
  },
  
  // CONSTRUCTS
  GEAR: { 
      name: "The Machina", 
      race: "CONSTRUCT", 
      color: "#0ea5e9", 
      desc: "Sentient machines from a fallen age. Logic above all.", 
      archetype: "MONSTER" 
  }
};

export const RACES = ['HUMAN', 'DWARF', 'ELF', 'CONSTRUCT', 'ORC', 'DEMON'];

export const TRAITS = [
  'STOIC', 'COWARDLY', 'ZEALOT', 'GREEDY', 'BERSERKER', 'MYSTIC', 'GLUTTON', 'LOYAL', 'MAD', 'DOOMED'
];

// --- GENERATION POOLS ---

export const NAME_POOLS = {
    HUMAN: {
        FIRST: ["Val", "Thorn", "Garr", "Mara", "Cor", "Silen", "Vance", "Elara", "Griff"],
        LAST: ["Vane", "Kael", "Thorne", "Light", "Ash", "Ward", "Pyre", "Gambit"]
    },
    DWARF: {
        FIRST: ["Gor", "Thrak", "Brun", "Hilda", "Orik", "Dwalin", "Magni"],
        LAST: ["Ironfist", "Stonehelm", "Deepdelver", "Anvilbreaker"]
    },
    ELF: {
        FIRST: ["Syl", "Lyra", "Fae", "Ael", "Thal", "Nyx", "Elowen"],
        LAST: ["Moonwhisper", "Starlight", "Verdant", "Nightshade"]
    },
    ORC: {
        FIRST: ["Grom", "Zul", "Thok", "Drak", "Mok", "Gar", "Zodd"],
        LAST: ["Hellscream", "Bloodaxe", "Skullcrusher", "Doomhammer"]
    },
    CONSTRUCT: {
        FIRST: ["Unit", "Core", "Gear", "Mech", "Null"],
        LAST: ["Alpha", "Beta", "Prime", "Zero", "Omege"]
    },
    DEMON: {
        FIRST: ["Zodd", "Femto", "Void", "Slan", "Conrad", "Ubik", "Grun", "Rak"],
        LAST: ["the Immortal", "of the Hand", "the Blessed", "of the Eclipse", "the Beast"]
    }
};

export const TITLES_BY_FACTION: Record<string, string[]> = {
    SOL: ["Paladin", "Cleric", "Captain", "Justicar", "Lightbringer"],
    VAZAROTH: ["Inquisitor", "Cultist", "Blood Knight", "Void Walker", "Executioner"],
    UMBRA: ["Apostle", "Archdemon", "Devourer", "Nightmare", "Herald"],
    IRON: ["Siege Master", "Ironbreaker", "Forge Lord", "Engineer"],
    FROST: ["Berserker", "Rune Caller", "Ice Reaver", "Mountain King"],
    VERDANT: ["Ranger", "Druid", "Warden", "Beastmaster"],
    SILVER: ["Arcanist", "Spellweaver", "Time Keeper", "High Mage"],
    ASH: ["Warlord", "Raider", "Pyromancer", "Slaughterer"],
    GEAR: ["Automaton", "Logic Engine", "Sentinel", "Processor"]
};

export const ENEMY_CLANS = [
    { name: "The Red Hand", desc: "Warmongers who feed on conflict." },
    { name: "Eaters of Minutes", desc: "Gluttons who devour lost time." },
    { name: "The Silent Choir", desc: "Mages seeking to silence your will." },
    { name: "Ironbound Legion", desc: "Undead soldiers of a forgotten war." },
    { name: "Cult of the Delay", desc: "Fanatics worshipping procrastination." },
    { name: "The God Hand", desc: "Executors of the causal flow." }
];
