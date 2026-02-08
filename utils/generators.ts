
import { ENEMY_CLANS, FACTIONS, NAME_POOLS, TITLES_BY_FACTION, EQUIPMENT_LORE } from '../constants';
import { Vector3, TaskPriority, EnemyEntity, RaceType, EnemyPersonality, FactionKey, HeroEquipment } from '../types';

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

export const generateNemesis = (taskId: string, priority: TaskPriority, graveyard: {name: string, clan: string}[], previousWinStreak: number, subtaskId?: string, subtaskName?: string, durationMinutes: number = 60): EnemyEntity => {
    const factionKeys = Object.keys(FACTIONS) as FactionKey[];
    const factionKey = factionKeys[Math.floor(Math.random() * factionKeys.length)];
    const factionData = FACTIONS[factionKey];
    
    const race = factionData.race as RaceType;
    const name = generateName(race);
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    
    const isSubtask = !!subtaskId;
    const rank = isSubtask ? 1 : Math.min(10, priority + Math.floor(previousWinStreak / 3));
    
    const titles = TITLES_BY_FACTION[factionKey];
    const baseTitle = titles[Math.floor(Math.random() * titles.length)];
    
    let title = `${baseTitle} ${name}`;
    if (rank > 5 && !isSubtask) title = `Grand ${baseTitle} ${name}`;
    if (isSubtask) title = `Lieutenant ${subtaskName || 'Minion'}`;

    let lineage = `Sworn to the ${factionData.name}.`;
    let memories: string[] = [`I serve the ${factionData.name}.`];
    
    const clan = ENEMY_CLANS[Math.floor(Math.random() * ENEMY_CLANS.length)];
    
    if (!isSubtask) {
        const deadKin = graveyard.find(d => d.clan === clan.name);
        if (deadKin && Math.random() > 0.5) {
            lineage = `Avenging kin of ${deadKin.name}`;
            memories.push(`You slaughtered ${deadKin.name} of ${clan.name}. The ${factionData.name} demands justice.`);
            title = `${name} the Avenger`;
        }
    }

    let lore = factionKey === 'VAZAROTH' ? `A corrupted human noble seeking to offer your time to the Void Emperor.` : 
               factionKey === 'SOL' ? `A zealous knight who believes your procrastination is a sin against Order.` : 
               `${factionData.desc} (${personality.toLowerCase()})`;

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

const DEFAULT_SHEET_ID = "1Hhfl7Cq28FvcyNrH_hodeNlIz9SCunUY5eJw67sWSM4"; 

// --- USER PROVIDED LIBRARY ---
// This list contains only the valid links provided by the user.
const VOID_LIBRARY_DEFAULTS = [
    "https://www.instagram.com/reel/DF3dhFat9Xe/",
    "https://pin.it/5LurwnARZ",
    "https://www.instagram.com/p/DFna0CKoGyB/",
    "https://www.instagram.com/reel/DFxZM3oxxVw/",
    "https://www.instagram.com/reel/DF616FUOpfd/",
    "https://www.instagram.com/reel/DGgYY0Is4Km/",
    "https://www.instagram.com/reel/DA7OSduNpUW/",
    "https://www.instagram.com/p/DHJF6WOsxlm/",
    "https://www.instagram.com/reel/DHbwnEfgO98/",
    "https://www.instagram.com/p/DHjxZdVxb4b/",
    "https://www.instagram.com/p/DHtSx6Fp8lr/",
    "https://www.instagram.com/p/DHtF1nhzf0i/", // Extracted from HTML Block
    "https://www.instagram.com/p/DH4Sd4dx4Op/",
    "https://www.instagram.com/p/DH4ZOaTod_e/",
    "https://www.instagram.com/reel/DIFApuXxUvj/",
    "https://www.instagram.com/p/DJxJjQLh9tF/",
    "https://www.instagram.com/reel/DJ4aCOOpn7_/",
    "https://www.instagram.com/p/DJ1fzKNMd4n/",
    "https://www.instagram.com/reel/DJqdFCMR0La/",
    "https://www.instagram.com/p/DKE7AXbxruF/",
    "https://www.instagram.com/p/DKFDgDZoGC8/",
    "https://www.instagram.com/p/DJki1bOMmWN/",
    "https://www.instagram.com/reel/DQEK1piCI5Y/",
    "https://www.instagram.com/reel/DPw7tlYCKGd/",
    "https://pin.it/Qo3Sh44UO",
    "https://pin.it/4PUd6Kf3t",
    "https://i.pinimg.com/736x/05/af/1c/05af1c3f6c5c7deecfe543c4568b696f.jpg"
];

export const convertToEmbedUrl = (rawInput: string): VisionContent | null => {
    if (!rawInput) return null;
    
    // 1. EXTRACT URL FROM TEXT BLOB (HTML Embed Code handling)
    let cleanUrl = rawInput.trim();
    
    // Special handling for Instagram HTML Embeds
    if (rawInput.includes('<blockquote') && rawInput.includes('instagram-media')) {
        const permalinkMatch = rawInput.match(/data-instgrm-permalink="([^"]+)"/);
        if (permalinkMatch && permalinkMatch[1]) {
            cleanUrl = permalinkMatch[1];
        } 
    } 
    // Generic URL extractor if not blockquote but still messy
    else if (rawInput.includes('<') || rawInput.includes('>')) {
        const httpMatch = rawInput.match(/(https?:\/\/[^\s"<>]+)/);
        if (httpMatch && httpMatch[1]) {
            cleanUrl = httpMatch[1];
        }
    }

    // 2. CLEANUP & PARSE
    cleanUrl = cleanUrl.replace(/&amp;/g, '&');
    
    // Remove query parameters for cleaner storage/display (except for images where they might be needed)
    try {
        const urlObj = new URL(cleanUrl);
        // We keep query params for now as some CDNs need them, but for social we strip tracking
        if (urlObj.hostname.includes('instagram.com') || urlObj.hostname.includes('facebook.com')) {
            urlObj.search = ''; 
            cleanUrl = urlObj.toString();
        }
        
        // 3. DETECT PLATFORM
        
        // --- DIRECT IMAGE ---
        if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)($|\?)/) || urlObj.hostname.includes('i.pinimg.com')) {
             return { type: 'IMAGE', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'OTHER' };
        }

        // --- INSTAGRAM ---
        if (urlObj.hostname.includes('instagram.com')) {
            // Ensure trailing slash removed for consistency if needed, but standardizing
            return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'INSTAGRAM' };
        }

        // --- PINTEREST (Social Link) ---
        // Support both short links (pin.it) and standard (pinterest.com/pin/...)
        if (urlObj.hostname.includes('pinterest') || urlObj.hostname.includes('pin.it')) {
            return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'PINTEREST' };
        }

        // --- TIKTOK ---
        if (urlObj.hostname.includes('tiktok')) {
            return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'TIKTOK' };
        }

        // Default Fallback
        return { type: 'SOCIAL', embedUrl: cleanUrl, originalUrl: cleanUrl, platform: 'OTHER' };

    } catch(e) {
        return null;
    }
};

// SMART PARSING FOR MIXED CONTENT BLOCKS
export const fetchMotivationVideos = async (customSheetId?: string, directUrl?: string): Promise<VisionContent[]> => {
    // 1. Try Direct URL Input First
    if (directUrl && directUrl.trim().length > 0) {
        const results: VisionContent[] = [];
        
        // Extract HTML embeds first
        const instaMatches = directUrl.matchAll(/data-instgrm-permalink="([^"]+)"/g);
        for (const match of instaMatches) {
            const res = convertToEmbedUrl(match[1]);
            if (res) results.push(res);
        }

        // Extract Standard URLs
        const urlRegex = /(https?:\/\/[^\s,;"'<]+)/g;
        const allUrls = directUrl.matchAll(urlRegex);
        
        for (const match of allUrls) {
            const raw = match[1];
            // Avoid duplicates from HTML extract
            if (!results.some(r => r.originalUrl.includes(raw) || raw.includes(r.originalUrl))) {
                const res = convertToEmbedUrl(raw);
                if (res) results.push(res);
            }
        }

        if (results.length > 0) {
            // Deduplicate by original URL
            const unique = results.filter((v,i,a)=>a.findIndex(t=>(t.originalUrl === v.originalUrl))===i);
            return unique;
        }
    }

    // 2. Try Google Sheet (Existing logic)
    let fetchUrl = "";
    let sheetInput = customSheetId;
    
    // Only attempt fetch if ID is provided and valid length
    if (sheetInput && sheetInput.length > 10) {
        if (sheetInput.includes("2PACX-")) {
            if (sheetInput.includes("http")) {
                 const parts = sheetInput.split('/pub');
                 fetchUrl = `${parts[0]}/pub?output=csv`;
            } else {
                 fetchUrl = `https://docs.google.com/spreadsheets/d/e/${sheetInput}/pub?output=csv`;
            }
        } 
        else if (!sheetInput.includes("http")) {
            fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetInput}/gviz/tq?tqx=out:csv`;
        } 
        else if (sheetInput.includes("/d/")) {
             const match = sheetInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
             const id = match ? match[1] : sheetInput;
             fetchUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
        }

        try {
            console.log("[Vision] Fetching from Sheet:", fetchUrl);
            const response = await fetch(fetchUrl);
            if (response.ok) {
                const text = await response.text();
                // Broad regex to capture URLs in CSV cells (handles quotes)
                const urlRegex = /(https?:\/\/[^\s",<]+)/g;
                const allMatches = text.match(urlRegex);
                const validItems: VisionContent[] = [];
                
                if (allMatches) {
                    allMatches.forEach(rawUrl => {
                        // Clean quotes if present
                        const clean = rawUrl.replace(/^"|"$/g, '');
                        const result = convertToEmbedUrl(clean);
                        if (result && !validItems.some(v => v.originalUrl === result.originalUrl)) {
                            validItems.push(result);
                        }
                    });
                }

                if (validItems.length > 0) {
                    console.log(`[Vision] Found ${validItems.length} items in sheet.`);
                    return validItems;
                }
            } else {
                console.warn(`[Vision] Sheet fetch failed: ${response.status}`);
            }
        } catch (e) { 
            console.warn("[Vision] Network error fetching sheet", e); 
        }
    }

    // 3. FALLBACK TO CLEANED USER LIBRARY
    // If no sheet or sheet failed, use the static list
    return VOID_LIBRARY_DEFAULTS.map(url => convertToEmbedUrl(url)).filter(item => item !== null) as VisionContent[];
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
