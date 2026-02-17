
import { CampaignCharacter, CharacterID } from "./types";

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

// --- NARRATIVE PROCEDURAL POOLS (NEW) ---
export const NARRATIVE_TEMPLATES = {
    // Act 1: Setting the Scene
    DAWN: {
        CLEAR: [
            "The sun rose over a silent battlefield, casting long shadows across the camp.",
            "A rare moment of clarity pierced the Void as morning broke.",
            "The air was crisp and cold, smelling of iron and dew.",
            "Birds dared to sing today, a sign of defiance against the gloom."
        ],
        RAIN: [
            "Rain lashed against the stone walls, drumming a rhythm of war.",
            "Mud churned in the courtyard as a grey dawn wept over the realm.",
            "The sky was bruised purple, leaking cold rain onto the armor of the guard."
        ],
        ASH_STORM: [
            "Cinders fell like snow, choking the morning light.",
            "The horizon burned red. The day began with the taste of ash.",
            "Winds howled from the waste, carrying the whispers of dead gods."
        ],
        VOID_MIST: [
            "A thick fog swallowed the sunrise, hiding the horizon.",
            "Shapes moved in the mist. The day started blind.",
            "Silence reigned. The mist dampened every sound, isolating the citadel."
        ]
    },
    // Dynamic Events
    ACTIONS: {
        STEAL_GOLD: [
            "raided the supply caravans, making off with coin",
            "infiltrated the treasury under cover of noise",
            "extorted the local merchants, draining our coffers",
            "ambushed a tax collector on the king's road"
        ],
        DRAIN_MANA: [
            "corrupted a ley line, siphoning arcane power",
            "performed a dark ritual that dulled the air",
            "drank the essence of the surrounding spirits",
            "erected a null-field that weakened our spells"
        ],
        ATTACK_BASE: [
            "launched a probing strike against the western wall",
            "sabotaged the gate mechanism with brute force",
            "hurled stones and curses at the battlements",
            "set fire to the outer barricades"
        ],
        SUPPORT_HERO: [
            "rallied the despondent guards with a rousing speech",
            "found a cache of supplies hidden in the ruins",
            "patched the cracks in the defense with masterful skill",
            "intercepted an assassin before the blade could fall"
        ]
    },
    // Connectors
    CONNECTORS: [
        "Later that morning,",
        "As the sun climbed higher,",
        "Without warning,",
        "Amidst the chaos,",
        "Taking advantage of the distraction,"
    ],
    // Act 3: Climax / Resolution
    NIGHTFALL: [
        "As darkness fell, the realm held its breath, surviving another cycle.",
        "The stars watched coldly as the gates were barred for the night.",
        "Night brought no peace, only the promise of tomorrow's struggle.",
        "Fires burned low in the camp. We live to fight another dawn."
    ]
};

// --- WORLD EVENTS (THE WARCRAFT/GRIMDARK FLAVOR) ---
export const WORLD_EVENT_TEMPLATES = {
    WAR: [
        "The {F1} executes the ambassadors of {F2}. War is declared.",
        "{F1} legions cross the River of Woe, burning {F2} villages.",
        "The {F1} breaks the Obsidian Pact, launching a surprise raid on {F2}.",
        "Drums of war sound in the deep. {F1} marches on {F2}.",
        "A {F2} prince is assassinated by {F1} spies. Total war begins."
    ],
    ALLIANCE: [
        "A political marriage unites {F1} and {F2} against the darkness.",
        "{F1} sends grain ships to relieve the famine in {F2}.",
        "The {F1} and {F2} sign the Treaty of the Silver Moon.",
        "Generals from {F1} and {F2} meet to plan a joint crusade."
    ],
    MYSTIC: [
        "A Star-Eater is sighted over {F1}. Panic spreads.",
        "The Great Library of {F1} burns with blue fire. Ancient texts are lost.",
        "{F1} discovers a Titan artifact buried in the ice.",
        "A mana-storm ravages the lands of {F2}, mutating the wildlife."
    ],
    POLITICAL: [
        "The King of {F1} succumbs to the Void madness. Civil unrest begins.",
        "A usurper seizes the throne of {F1}, executing the old council.",
        "{F1} imposes a heavy trade tariff on {F2}, strangling the economy.",
        "Prophets in {F1} declare the end times are nigh."
    ]
};

// --- RECURRING WARLORDS ---
export const WARLORDS = [
    { name: "General Kael", faction: "SOL", title: "The Lightbringer" },
    { name: "Inquisitor Malakor", faction: "VAZAROTH", title: "The Hand of Eclipse" },
    { name: "Thorg Ironbelly", faction: "IRON", title: "Forge-Father" },
    { name: "Lady Sylvani", faction: "SILVER", title: "The Banshee Queen" },
    { name: "Grommash", faction: "ASH", title: "The World-Eater" },
    { name: "Unit-734", faction: "GEAR", title: "Prime Logic" },
    { name: "Archdruid Elowen", faction: "VERDANT", title: "Root-Mother" },
    { name: "Jarl Frostbeard", faction: "FROST", title: "King under the Mountain" }
];

// --- NARRATIVE CHARACTERS & DIALOGUE ---

export const CHARACTERS: Record<CharacterID, CampaignCharacter> = {
    MARSHAL_THORNE: {
        id: 'MARSHAL_THORNE',
        name: "Sergeant Thorne",
        title: "Camp Marshal",
        race: 'HUMAN',
        role: 'ALLY',
        color: '#3b82f6',
        description: "A battle-scarred soldier who keeps the men in line.",
        attitude: 'RESPECT'
    },
    RIVAL_KROG: {
        id: 'RIVAL_KROG',
        name: "Krog the Slaver",
        title: "Orc Warlord",
        race: 'ORC',
        role: 'RIVAL',
        color: '#ef4444',
        description: "A brutal overseer who mocks your productivity.",
        attitude: 'DISDAIN'
    },
    SENESCHAL_MORVATH: {
        id: 'SENESCHAL_MORVATH',
        name: "Seneschal Morvath",
        title: "Keeper of Coin",
        race: 'HUMAN',
        role: 'ALLY',
        color: '#fbbf24',
        description: "Obsessed with gold and citadel maintenance.",
        attitude: 'NEUTRAL'
    },
    ORACLE_ELARA: {
        id: 'ORACLE_ELARA',
        name: "Elara the Seer",
        title: "Void Oracle",
        race: 'ELF',
        role: 'NEUTRAL',
        color: '#a855f7',
        description: "She sees the timelines of your tasks.",
        attitude: 'MYSTERIOUS'
    } as any,
    RIVAL_VASHJ: {
        id: 'RIVAL_VASHJ',
        name: "Lady Vashj",
        title: "Abyssal Witch",
        race: 'ELF',
        role: 'RIVAL',
        color: '#22d3ee',
        description: "Drains your will with dark magic.",
        attitude: 'HATRED'
    },
    RIVAL_EMPEROR: {
        id: 'RIVAL_EMPEROR',
        name: "Vazaroth",
        title: "The Eclipse Emperor",
        race: 'DEMON',
        role: 'RIVAL',
        color: '#7f1d1d',
        description: "The end of all things.",
        attitude: 'DISDAIN'
    }
};

export const DIALOGUE_POOLS = {
    MARSHAL_THORNE: {
        GREETING: [
            "Morning, Commander. The troops are ready.",
            "Blade sharp? Good. We have work to do.",
            "Don't let them breach the walls today.",
            "Plan B is just Plan A with more violence. Adapt."
        ],
        VICTORY: [
            "Another one down! Keep pushing!",
            "Textbook execution, sir.",
            "The men are cheering your name!",
            "Momentum is our siege engine. Keep striking!"
        ],
        ACT_2: [
            "Enemy movement on the horizon. Stay focused.",
            "Sun's high. Sweat pays dividends now."
        ]
    },
    RIVAL_KROG: {
        TAUNT: [
            "IS THAT ALL YOU GOT, LITTLE HUMAN?",
            "MY WOLVES WORK HARDER THAN YOU!",
            "I WILL SMASH YOUR WALLS AND EAT YOUR GOLD!",
            "YOU CALL THIS A DEFENSE? HA!"
        ],
        DEFEAT: [
            "GRAAAH! YOU GOT LUCKY!",
            "THIS ISN'T OVER! I WILL RETURN!",
            "MY CLAN WILL AVENGE ME!"
        ],
        PLAYER_FAIL: [
            "PATHETIC! CRUMBLE BEFORE KROG!",
            "TOO SLOW! YOUR TIME IS MINE NOW!",
            "LOOK AT HIM STRUGGLE. DELICIOUS."
        ]
    },
    SENESCHAL_MORVATH: {
        GOLD_GAIN: [
            "The treasury grows. Excellent management.",
            "A wise investment of effort.",
            "Resources secured. The walls hold.",
            "Profit generated. We can reinvest this."
        ],
        GOLD_LOSS: [
            "We are bleeding coin! Do something!",
            "Inefficiency is a crime, Commander.",
            "My ledgers... they are weeping."
        ]
    },
    ORACLE_ELARA: {
        ACT_CHANGE: [
            "The shadow lengthens. The Second Act begins.",
            "Time weaves a cruel tapestry today.",
            "The climax approaches. Destiny is not yet written."
        ],
        VISION: [
            "I see a path... if you have the will to walk it.",
            "The Mirror reveals what you fear most: your own potential."
        ],
        // SPECIFIC CONCEPTS FROM USER TEXT FILE
        TIME_WISDOM: [
            "The 3-Hour Rule, Exile. Divide the chaos into micro-campaigns.",
            "Do not look at the Cronograma with dread. Look at the Output: The Kingdom you are building.",
            "Time has an economy. Minimize your input, maximize your profit.",
            "Spending 3 hours on a 15-minute task? That is a bad investment. Cut your losses.",
            "Visualize the next step. Only the next step. The rest is fog.",
            "Flow is a river. You must paddle to start, but then the current carries you.",
            "Do not be a perfectionist. That is a trap of the Void. Deliver the result.",
            "Plan B is essential. The timeline is fluid; adapt or die.",
            "If you stay too long in a task, you pay interest in Stress. Finish it.",
            "The 'Winner Effect'. Victory feeds the soul. Chain your wins.",
            "Separate the Planning from the Execution. Do not think while you fight."
        ]
    }
};

// Legacy alias for compatibility if needed, though we should migrate fully.
export const ADVISOR_DATA = {
    MARSHAL: CHARACTERS.MARSHAL_THORNE,
    SENESCHAL: CHARACTERS.SENESCHAL_MORVATH,
    ORACLE: CHARACTERS.ORACLE_ELARA
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
    { name: "The Red Hand", desc: "Warmongers who burn what they cannot rule." },
    { name: "Eaters of Minutes", desc: "Gluttons who devour lost time." },
    { name: "The Silent Choir", desc: "Mages seeking to silence your will." },
    { name: "Ironbound Legion", desc: "Undead soldiers of a forgotten war." },
    { name: "Cult of the Delay", desc: "Fanatics worshipping procrastination." },
    { name: "The God Hand", desc: "Executors of the causal flow." }
];
