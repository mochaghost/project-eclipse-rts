
import { ENEMY_CLANS, FACTIONS, NAME_POOLS, TITLES_BY_FACTION, EQUIPMENT_LORE } from '../constants';
import { Vector3, TaskPriority, EnemyEntity, RaceType, EnemyPersonality, FactionKey, HeroEquipment, RealmStats } from '../types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const generateSpawnPosition = (minRadius: number, maxRadius: number): Vector3 => {
  const angle = Math.random() * Math.PI * 2;
  const distance = minRadius + (Math.random() * (maxRadius - minRadius));
  return {
    x: Math.cos(angle) * distance,
    y: 0,
    z: Math.sin(angle) * distance
  };
};

export const shuffleArray = <T>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const generateHeroEquipment = (level: number): HeroEquipment => {
    const weapon = [...EQUIPMENT_LORE.WEAPONS].reverse().find(w => level >= w.min) || EQUIPMENT_LORE.WEAPONS[0];
    const armor = [...EQUIPMENT_LORE.ARMOR].reverse().find(a => level >= a.min) || EQUIPMENT_LORE.ARMOR[0];
    
    return {
        weapon: weapon.name,
        armor: armor.name,
        relic: "Pendant of the Exile" 
    };
};

// --- LOOT GENERATION ---
const PREFIXES = ["Cursed", "Blessed", "Ancient", "Rusting", "Void-Touched", "Royal", "Shattered", "Glowing", "Timeworn", "Astral"];
const RELICS = ["Tear of the Titan", "Chronos Shard", "Behelit Fragment", "Old King's Ring", "Vial of Pure Will", "Essence of Focus"];

export const generateLoot = (level: number): { type: 'WEAPON' | 'ARMOR' | 'RELIC', name: string, lore: string } | null => {
    const roll = Math.random();
    const chance = 0.4 + (level * 0.005);
    
    if (roll > chance) return null; 

    const typeRoll = Math.random();
    if (typeRoll < 0.45) {
        const base = [...EQUIPMENT_LORE.WEAPONS].reverse().find(w => level >= (w.min - 5)) || EQUIPMENT_LORE.WEAPONS[0];
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        return { type: 'WEAPON', name: `${prefix} ${base.name}`, lore: `A variant of the ${base.name}, modified by the ${prefix} energy of the realm.` };
    } else if (typeRoll < 0.9) {
        const base = [...EQUIPMENT_LORE.ARMOR].reverse().find(a => level >= (a.min - 5)) || EQUIPMENT_LORE.ARMOR[0];
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        return { type: 'ARMOR', name: `${prefix} ${base.name}`, lore: `The ${base.name}, reinforced with ${prefix} materials found in the void.` };
    } else {
        const relic = RELICS[Math.floor(Math.random() * RELICS.length)];
        return { type: 'RELIC', name: relic, lore: "A rare artifact humming with strange power." };
    }
};

export const getEquipmentLore = (itemName: string) => {
    const w = EQUIPMENT_LORE.WEAPONS.find(x => itemName.includes(x.name));
    if (w) return w.desc;
    const a = EQUIPMENT_LORE.ARMOR.find(x => itemName.includes(x.name));
    if (a) return a.desc;
    return "A unique artifact found in the battlefield.";
};

const PERSONALITIES: EnemyPersonality[] = ['SADISTIC', 'HONORABLE', 'COWARDLY', 'FANATIC', 'CALCULATING'];

const generateName = (race: RaceType): string => {
    const pool = NAME_POOLS[race];
    if (!pool) return "Unknown";
    return pool.FIRST[Math.floor(Math.random() * pool.FIRST.length)] + " " + pool.LAST[Math.floor(Math.random() * pool.LAST.length)];
};

export interface NemesisContext {
    realmStats: RealmStats;
    graveyard: {name: string, clan: string}[];
    taskTitle: string;
    priority: TaskPriority;
    winStreak: number;
}

// --- REACTIVE SPAWNING LOGIC ---
export const generateNemesis = (
    taskId: string, 
    priority: TaskPriority, 
    graveyard: {name: string, clan: string}[], 
    previousWinStreak: number, 
    subtaskId?: string, 
    subtaskName?: string, 
    durationMinutes: number = 60,
    realmStats: RealmStats = { hope: 50, fear: 10, order: 50 } // Default for safety
): EnemyEntity => {
    let factionKey: FactionKey = 'SOL'; // Default
    let originReason = "Randomly encountered in the Void.";
    
    // 1. DETERMINE FACTION BASED ON CONTEXT (The "Why")
    const isSubtask = !!subtaskId;
    
    if (isSubtask) {
        // Subtasks match their parent's faction usually, or are mercenaries
        // For simplicity here, random low tier
        const keys = ['ASH', 'FROST', 'IRON'] as FactionKey[];
        factionKey = keys[Math.floor(Math.random() * keys.length)];
        originReason = "A minion summoned to block your path.";
    } else {
        // MAIN NEMESIS LOGIC
        const roll = Math.random();
        
        // A. REVENGE SPAWN (15% Chance if graveyard exists)
        const recentDead = graveyard[graveyard.length - 1];
        if (graveyard.length > 0 && roll < 0.15) {
            // Find faction of dead guy? For now we assume clan maps to faction loosely or pick random
            // Let's make it simple: Revenge spawns are usually Vazaroth or Umbra exploiting grief
            factionKey = 'VAZAROTH';
            originReason = `Seeking revenge for ${recentDead.name}.`;
        }
        // B. STAT BASED SPAWN
        else if (realmStats.fear > 70) {
            factionKey = 'UMBRA'; // Demons feed on fear
            originReason = "Manifested from the realm's high Fear.";
        }
        else if (realmStats.order > 80) {
            factionKey = Math.random() > 0.5 ? 'SOL' : 'GEAR'; // Too much order attracts lawbringers
            originReason = "Sent to enforce strict Order.";
        }
        else if (realmStats.hope < 20) {
            factionKey = 'ASH'; // Despair attracts raiders
            originReason = "Scavenging on your crumbling Hope.";
        }
        // C. TASK BASED (Simple keyword matching)
        else {
            const t = (subtaskName || "task").toLowerCase();
            if (t.includes("code") || t.includes("logic") || t.includes("math")) {
                factionKey = 'GEAR'; // Constructs hate logic? or test it?
                originReason = "Drawn to the logic of your task.";
            } else if (t.includes("write") || t.includes("design") || t.includes("art")) {
                factionKey = 'SILVER'; // Elves hate bad art?
                originReason = "Critiquing your creative spirit.";
            } else if (t.includes("email") || t.includes("call") || t.includes("meeting")) {
                factionKey = 'VAZAROTH'; // Bureaucracy is evil
                originReason = "Feeding on administrative soul-drain.";
            } else {
                // Fallback to random weighted by priority
                const keys = Object.keys(FACTIONS) as FactionKey[];
                factionKey = keys[Math.floor(Math.random() * keys.length)];
            }
        }
    }

    const factionData = FACTIONS[factionKey];
    const race = factionData.race as RaceType;
    const name = generateName(race);
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    
    const rank = isSubtask ? 1 : Math.min(10, priority + Math.floor(previousWinStreak / 3));
    
    const titles = TITLES_BY_FACTION[factionKey];
    const baseTitle = titles[Math.floor(Math.random() * titles.length)];
    
    let title = `${baseTitle} ${name}`;
    if (rank > 5 && !isSubtask) title = `Grand ${baseTitle} ${name}`;
    if (isSubtask) title = `Lieutenant ${subtaskName || 'Minion'}`;

    let lineage = `Sworn to the ${factionData.name}.`;
    let memories: string[] = [`I serve the ${factionData.name}.`];
    
    const clan = ENEMY_CLANS[Math.floor(Math.random() * ENEMY_CLANS.length)];
    
    // Lore generation
    let lore = factionKey === 'VAZAROTH' ? `A corrupted noble. ${originReason}` : 
               factionKey === 'SOL' ? `A zealous knight. ${originReason}` : 
               `${factionData.desc} ${originReason}`;

    let scale = 0.6;
    if (!isSubtask) {
        const priorityBonus = (priority - 1) * 1.5;
        const timeBonus = durationMinutes / 60;
        scale = 1.0 + priorityBonus + timeBonus;
        scale = Math.min(15, scale); 
    }

    const spawnPos = generateSpawnPosition(45, 60); 

    return {
        id: generateId(), 
        taskId, 
        subtaskId,
        name, 
        title, 
        race, 
        factionId: factionKey, 
        clan: clan.name, 
        personality,
        rank, 
        lore, 
        memories, 
        lineage, 
        origin: originReason,
        hp: 100 * rank, 
        maxHp: 100 * rank, 
        priority,
        position: spawnPos, 
        initialPosition: spawnPos,
        scale
    };
};

// --- DIALOGUE ENGINES ---
const VAZAROTH_LINES = {
    IDLE: [
        "Your citadel stands silent. My armies are already marching.",
        "A king who sleeps on the throne wakes up in chains.",
        "The silence of your realm disgusts me.",
        "Do you hear it? The Void is gnawing at your foundations.",
        "Stagnation is the scent of a dying god.",
        "I expected a challenge, not a statue.",
        "My peasants are more active than your knights."
    ],
    FAIL: [
        "Your walls crumble. As expected.",
        "Another province lost to the shadow.",
        "You bleed, little king. And the sharks are circling.",
        "Is this the power of the 'Chosen'? Pathetic.",
        "The Eclipse swallows your failures.",
        "Kneel. It is all you are good for."
    ],
    WIN_SMALL: [
        "A minor skirmish. Do not celebrate yet.",
        "You delayed the inevitable by a breath.",
        "The Void flinches, but does not retreat.",
        "Luck. Pure luck."
    ],
    WIN_STREAK: [
        "So... the ember tries to become a fire?",
        "You are annoying me, mortal.",
        "I will break that momentum like a twig.",
        "Do you think you can outrun the night forever?",
        "Build your tower high. The fall will be sweeter."
    ],
    MARKET: [
        "Trading gold for courage? How quaint.",
        "Armies are bought, but victory is forged.",
        "Waste your coin. It will be mine soon enough."
    ]
};

const SAGE_LINES = {
    GENERAL: [
        "View the day not as a mountain, but as a series of stepping stones.",
        "The 'Three Hour Siege' is the heartbeat of conquest. Master the micro-campaign.",
        "Do not drown in the ocean of the future. Swim to the next buoy.",
        "Time is the only coin that cannot be minted. Spend it on the forge.",
        "Inertia is a river. You must paddle, or you will drift to the waterfall.",
        "Perfection is a trap laid by the enemy. A dull blade still cuts if swung with force.",
        "Visualize the banner on the hill. That is your destination. The mud in between is irrelevant."
    ],
    CRISIS_75: [
        "The 75% mark is where the spirit falters. This is the test of the Alchemist.",
        "Do not trust the whisper of 'enough'. The finish line demands your last breath.",
        "If the burden is too heavy, cast aside the stone, but keep walking.",
        "Adaptability is the armor of the survivor. Rigid steel breaks."
    ],
    STREAK: [
        "You have entered the Flow of Kings. The world bends to your rhythm.",
        "Momentum is a siege engine. Keep it rolling.",
        "This is the 'Winner Effect'. Your soul feeds on victory.",
        "The profit of time is compounding. You are building an empire of seconds."
    ],
    FAILURE: [
        "A lost battle is not a lost war. Realign your forces.",
        "You overspent your spiritual budget. Learn the economy of the soul.",
        "The past is ash. The future is unwritten. The present is the pen.",
        "Do not grieve the spilled time. Fill the cup again."
    ]
};

export const getVazarothLine = (context: 'IDLE' | 'FAIL' | 'WIN' | 'MARKET', streak: number = 0): string => {
    if (context === 'WIN' && streak > 2) {
        return VAZAROTH_LINES.WIN_STREAK[Math.floor(Math.random() * VAZAROTH_LINES.WIN_STREAK.length)];
    }
    if (context === 'WIN') {
        return VAZAROTH_LINES.WIN_SMALL[Math.floor(Math.random() * VAZAROTH_LINES.WIN_SMALL.length)];
    }
    const pool = VAZAROTH_LINES[context] || VAZAROTH_LINES.IDLE;
    return pool[Math.floor(Math.random() * pool.length)];
};

export const getSageWisdom = (context: 'GENERAL' | 'CRISIS' | 'STREAK' | 'FAIL' = 'GENERAL'): string => {
    const pool = SAGE_LINES[context] || SAGE_LINES.GENERAL;
    return pool[Math.floor(Math.random() * pool.length)];
};

// --- VISION MIRROR LOGIC ---
export interface VisionContent {
    type: 'VIDEO' | 'IMAGE' | 'SOCIAL';
    embedUrl: string;
    originalUrl: string;
    platform: 'YOUTUBE' | 'INSTAGRAM' | 'PINTEREST' | 'TIKTOK' | 'OTHER';
}

const VOID_LIBRARY_DEFAULTS: VisionContent[] = [
    { type: 'SOCIAL', embedUrl: "https://www.instagram.com/reel/DF3dhFat9Xe/", originalUrl: "https://www.instagram.com/reel/DF3dhFat9Xe/", platform: 'INSTAGRAM' },
    { type: 'SOCIAL', embedUrl: "https://www.pinterest.com/pin/2111131068832367/", originalUrl: "https://www.pinterest.com/pin/2111131068832367/", platform: 'PINTEREST' },
    { type: 'IMAGE', embedUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba", originalUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba", platform: 'OTHER' },
    { type: 'IMAGE', embedUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401", originalUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401", platform: 'OTHER' }
];

const fetchGoogleSheetCsv = async (url: string): Promise<string> => {
    try {
        let fetchUrl = url;
        if (url.includes('/pubhtml')) fetchUrl = url.replace(/\/pubhtml.*$/, '/pub?output=csv');
        else if (url.includes('/edit')) fetchUrl = url.replace(/\/edit.*$/, '/export?format=csv');
        else if (url.includes('/export') && !url.includes('format=csv')) fetchUrl = url + '&format=csv';

        const res = await fetch(fetchUrl);
        if (!res.ok) return "";
        return await res.text();
    } catch (e) {
        console.warn("Sheet fetch failed:", e);
        return "";
    }
}

// THE MINING ENGINE: Extracts valuable IDs from messy raw text
const extractVisionContent = (rawText: string): VisionContent[] => {
    if (!rawText) return [];
    
    const results: VisionContent[] = [];
    const seen = new Set<string>();

    // 1. INSTAGRAM (Reels & Posts)
    const instaMatches = rawText.matchAll(/(?:instagram\.com\/|href=".*?)(?:reel|p)\/([a-zA-Z0-9_-]+)/g);
    for (const match of instaMatches) {
        const id = match[1];
        const cleanUrl = `https://www.instagram.com/p/${id}/`; // Normalized URL
        if (!seen.has(cleanUrl)) {
            seen.add(cleanUrl);
            results.push({
                type: 'SOCIAL',
                embedUrl: cleanUrl,
                originalUrl: cleanUrl,
                platform: 'INSTAGRAM'
            });
        }
    }

    // 2. PINTEREST (ID HUNTING - THE FIX)
    const pinMatches = rawText.matchAll(/\/pin\/(\d+)/g);
    for (const match of pinMatches) {
        const id = match[1];
        if (id.length > 5) {
            const cleanUrl = `https://www.pinterest.com/pin/${id}/`; 
            if (!seen.has(cleanUrl)) {
                seen.add(cleanUrl);
                results.push({
                    type: 'SOCIAL',
                    embedUrl: cleanUrl,
                    originalUrl: cleanUrl,
                    platform: 'PINTEREST'
                });
            }
        }
    }

    // 3. PINTEREST SHORTLINKS (pin.it)
    const pinShortMatches = rawText.matchAll(/pin\.it\/([a-zA-Z0-9]+)/g);
    for (const match of pinShortMatches) {
        const id = match[1];
        const cleanUrl = `https://pin.it/${id}`;
        if (!seen.has(cleanUrl)) {
            seen.add(cleanUrl);
            results.push({
                type: 'SOCIAL',
                embedUrl: cleanUrl,
                originalUrl: cleanUrl,
                platform: 'PINTEREST'
            });
        }
    }

    // 4. DIRECT IMAGES (Pinterest CDN or others)
    const imgMatches = rawText.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi);
    for (const match of imgMatches) {
        const url = match[0];
        if (!seen.has(url)) {
            seen.add(url);
            results.push({
                type: 'IMAGE',
                embedUrl: url,
                originalUrl: url,
                platform: 'OTHER'
            });
        }
    }

    return results;
};

const processSourceInput = async (input: string): Promise<string> => {
    if (!input || !input.trim()) return "";
    
    // Check if it's a Google Sheet URL
    if (input.includes('docs.google.com/spreadsheets')) {
        return await fetchGoogleSheetCsv(input);
    } 
    // Check if it's a Raw Sheet ID
    else if (input.length > 20 && !input.includes('/') && !input.includes('.') && !input.includes(' ')) {
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${input}/export?format=csv`;
        return await fetchGoogleSheetCsv(sheetUrl);
    }
    
    // Otherwise, treat as raw text/html
    return input;
}

// MAIN FETCH FUNCTION
export const fetchMotivationVideos = async (sheet1?: string, sheet2?: string, directUrl?: string): Promise<VisionContent[]> => {
    // Fetch all raw data first
    const raw1 = await processSourceInput(sheet1 || '');
    const raw2 = await processSourceInput(sheet2 || '');
    const rawDirect = directUrl || ''; // Direct input is already text

    // Combine into one giant soup
    const combinedRaw = `${raw1} \n ${raw2} \n ${rawDirect}`;

    // Mine the soup for diamonds (IDs)
    const extractedContent = extractVisionContent(combinedRaw);

    // Fallback logic
    if (extractedContent.length === 0) {
        // If we found nothing, merge with defaults to avoid "NO SIGNAL" unless absolutely necessary
        return VOID_LIBRARY_DEFAULTS; 
    }

    return extractedContent;
};

export const generateWorldRumor = (): { message: string, details: string } => {
    const rumors = [
        { m: "Drums in the Deep", d: "The Iron Clan is forging engines of war." },
        { m: "A Star Fell", d: "Witnesses saw a streak of blue fire near the Spire." },
        { m: "The Void Expands", d: "Vazaroth's fog has swallowed another village." },
        { m: "Silence in the Woods", d: "The elves have stopped singing." },
        { m: "Market Crash", d: "Gold has lost value in the southern holds." }
    ];
    const r = rumors[Math.floor(Math.random() * rumors.length)];
    return { message: r.m, details: r.d };
};
