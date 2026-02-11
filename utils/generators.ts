
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

const VOID_LIBRARY_DEFAULTS = [
    "https://www.instagram.com/reel/DF3dhFat9Xe/",
];

export const convertToEmbedUrl = (rawInput: string): VisionContent | null => {
    if (!rawInput) return null;
    let cleanUrl = rawInput.trim();
    
    // Normalize Pinterest URLs to avoid regional redirection issues (ar.pinterest, mx.pinterest -> www.pinterest)
    if (cleanUrl.includes('pinterest.com')) {
        cleanUrl = cleanUrl.replace(/https?:\/\/[a-z]{2,3}\.pinterest\.com/, 'https://www.pinterest.com');
    }

    if (rawInput.includes('<blockquote') && rawInput.includes('instagram-media')) {
        const permalinkMatch = rawInput.match(/data-instgrm-permalink="([^"]+)"/);
        if (permalinkMatch && permalinkMatch[1]) {
            cleanUrl = permalinkMatch[1];
        } 
    } 
    else if (rawInput.includes('<') || rawInput.includes('>')) {
        const httpMatch = rawInput.match(/(https?:\/\/[^\s"<>]+)/);
        if (httpMatch && httpMatch[1]) {
            cleanUrl = httpMatch[1];
        }
    }
    cleanUrl = cleanUrl.replace(/&amp;/g, '&');
    
    try {
        const urlObj = new URL(cleanUrl);
        if (urlObj.hostname.includes('instagram.com') || urlObj.hostname.includes('facebook.com')) {
            urlObj.search = ''; 
            cleanUrl = urlObj.toString();
        }
        
        // Image Direct Links
        if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)($|\?)/) || urlObj.hostname.includes('i.pinimg.com')) {
             return { type: 'IMAGE', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'OTHER' };
        }
        
        // Platform Detection
        if (urlObj.hostname.includes('instagram.com')) {
            return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'INSTAGRAM' };
        }
        if (urlObj.hostname.includes('pinterest') || urlObj.hostname.includes('pin.it')) {
            return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'PINTEREST' };
        }
        if (urlObj.hostname.includes('tiktok')) {
            return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'TIKTOK' };
        }
        if (urlObj.hostname.includes('youtube') || urlObj.hostname.includes('youtu.be')) {
             return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'YOUTUBE' };
        }
        
        return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'OTHER' };
    } catch(e) {
        return null;
    }
};

const fetchGoogleSheetCsv = async (url: string): Promise<string[]> => {
    try {
        let fetchUrl = url;
        // Correctly handle "published to web" links
        if (url.includes('/pubhtml')) {
            fetchUrl = url.replace(/\/pubhtml.*$/, '/pub?output=csv');
        } else if (url.includes('/edit')) {
            fetchUrl = url.replace(/\/edit.*$/, '/export?format=csv');
        } else if (url.includes('/export') && !url.includes('format=csv')) {
             fetchUrl = url + (url.includes('?') ? '&' : '?') + 'format=csv';
        }

        const res = await fetch(fetchUrl);
        if (!res.ok) {
            console.warn("Sheet fetch failed status:", res.status);
            return [];
        }
        const text = await res.text();
        
        // Regex to find http(s) links, stopping at quotes, spaces, or commas
        // Improved regex to better handle raw CSV data
        const matches = text.match(/https?:\/\/[^"'\s,<>\\]+/g);
        if (matches) {
            // Remove potential trailing punctuation often caught by regex in CSVs
            return matches.map(m => m.replace(/[),;]+$/, ''));
        }
        return [];
    } catch (e) {
        console.warn("Failed to fetch/parse sheet:", url, e);
        return [];
    }
}

// Universal input processor for both Top (Sheet ID/List) and Bottom (Direct URL/List) boxes
// This handles mixed content: Sheet URLs, Sheet IDs, Direct URLs, Comma Separated lists.
const processSourceInput = async (input: string): Promise<string[]> => {
    if (!input || !input.trim()) return [];
    
    // Split by comma, newline, or semicolon to support multiple items
    const entries = input.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
    let collectedUrls: string[] = [];

    for (const entry of entries) {
        // Case 1: Google Sheet URL
        if (entry.includes('docs.google.com/spreadsheets')) {
            const sheetUrls = await fetchGoogleSheetCsv(entry);
            collectedUrls = collectedUrls.concat(sheetUrls);
        }
        // Case 2: Generic URL (Social or Image)
        else if (entry.startsWith('http://') || entry.startsWith('https://')) {
            collectedUrls.push(entry);
        }
        // Case 3: Raw Google Sheet ID (long alphanumeric, no dots/slashes) - Fallback
        else if (entry.length > 20 && !entry.includes('/') && !entry.includes('.')) {
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${entry}/export?format=csv`;
            const sheetUrls = await fetchGoogleSheetCsv(sheetUrl);
            collectedUrls = collectedUrls.concat(sheetUrls);
        }
    }
    return collectedUrls;
}

// UPDATED TO ACCEPT 3 SOURCES
export const fetchMotivationVideos = async (sheet1?: string, sheet2?: string, directUrl?: string): Promise<VisionContent[]> => {
    // Process "Source 1"
    const s1Urls = await processSourceInput(sheet1 || '');
    
    // Process "Source 2"
    const s2Urls = await processSourceInput(sheet2 || '');

    // Process "Direct"
    const directUrls = await processSourceInput(directUrl || '');
    
    // Combine ALL lists
    const allUrls = [...s1Urls, ...s2Urls, ...directUrls];
    
    // Deduplicate
    const uniqueUrls = [...new Set(allUrls)];
    
    // Convert to internal format
    let results: VisionContent[] = uniqueUrls
        .map(url => convertToEmbedUrl(url))
        .filter(item => item !== null) as VisionContent[];

    // Fallback if absolutely nothing found
    if (results.length === 0) {
        return VOID_LIBRARY_DEFAULTS.map(url => convertToEmbedUrl(url)).filter(item => item !== null) as VisionContent[];
    }

    return results;
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
