
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
const PREFIXES = ["Cursed", "Blessed", "Ancient", "Rusting", "Void-Touched", "Royal", "Shattered", "Glowing"];
const RELICS = ["Tear of the Titan", "Chronos Shard", "Behelit Fragment", "Old King's Ring", "Vial of Pure Will"];

export const generateLoot = (level: number): { type: 'WEAPON' | 'ARMOR' | 'RELIC', name: string, lore: string } | null => {
    const roll = Math.random();
    const chance = 0.3 + (level * 0.005);
    if (roll > chance) return null; 

    const typeRoll = Math.random();
    if (typeRoll < 0.4) {
        const base = [...EQUIPMENT_LORE.WEAPONS].reverse().find(w => level >= (w.min - 5)) || EQUIPMENT_LORE.WEAPONS[0];
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        return { type: 'WEAPON', name: `${prefix} ${base.name}`, lore: `A variant of the ${base.name}, modified by the ${prefix} energy of the realm.` };
    } else if (typeRoll < 0.8) {
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

export const generateNemesis = (taskId: string, priority: TaskPriority, graveyard: {name: string, clan: string}[], previousWinStreak: number): EnemyEntity => {
    const factionKeys = Object.keys(FACTIONS) as FactionKey[];
    const factionKey = factionKeys[Math.floor(Math.random() * factionKeys.length)];
    const factionData = FACTIONS[factionKey];
    
    const race = factionData.race as RaceType;
    const name = generateName(race);
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    const rank = Math.min(10, priority + Math.floor(previousWinStreak / 3));
    
    const titles = TITLES_BY_FACTION[factionKey];
    const baseTitle = titles[Math.floor(Math.random() * titles.length)];
    let title = `${baseTitle} ${name}`;
    if (rank > 5) title = `Grand ${baseTitle} ${name}`;

    let lineage = `Sworn to the ${factionData.name}.`;
    let memories: string[] = [`I serve the ${factionData.name}.`];
    
    const clan = ENEMY_CLANS[Math.floor(Math.random() * ENEMY_CLANS.length)];
    const deadKin = graveyard.find(d => d.clan === clan.name);
    if (deadKin && Math.random() > 0.5) {
        lineage = `Avenging kin of ${deadKin.name}`;
        memories.push(`You slaughtered ${deadKin.name} of ${clan.name}. The ${factionData.name} demands justice.`);
        title = `${name} the Avenger`;
    }

    let lore = factionKey === 'VAZAROTH' ? `A corrupted human noble seeking to offer your time to the Void Emperor.` : 
               factionKey === 'SOL' ? `A zealous knight who believes your procrastination is a sin against Order.` : 
               `${factionData.desc} (${personality.toLowerCase()})`;

    return {
        id: generateId(), taskId, name, title, race, factionId: factionKey, clan: clan.name, personality,
        rank, lore, memories, lineage, hp: 100 * rank, maxHp: 100 * rank, priority,
        position: generateSpawnPosition(15, 45), scale: 0.5 + (rank * 0.1)
    };
};

// --- DIALOGUE ENGINES (DIEGETIC & REACTIVE) ---

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

// --- VISION MIRROR ---
const DEFAULT_SHEET_ID = "1Hhfl7Cq28FvcyNrH_hodeNlIz9SCunUY5eJw67sWSM4"; 

const VOID_LIBRARY_DEFAULTS = [
    "https://www.youtube.com/embed/S2qT6w04x18?autoplay=1&controls=0&mute=0&loop=1&playlist=S2qT6w04x18", 
    "https://www.youtube.com/embed/I5gMv2sM7yM?autoplay=1&controls=0&mute=0&loop=1&playlist=I5gMv2sM7yM",
    "https://www.youtube.com/embed/7I0D-aN5tJE?autoplay=1&controls=0&mute=0&loop=1&playlist=7I0D-aN5tJE"
];

// Content Type Definition
export interface VisionContent {
    type: 'VIDEO' | 'IMAGE' | 'SOCIAL';
    embedUrl: string;
    originalUrl: string;
    platform: 'YOUTUBE' | 'INSTAGRAM' | 'PINTEREST' | 'TIKTOK' | 'OTHER';
}

export const convertToEmbedUrl = (rawUrl: string): VisionContent | null => {
    if (!rawUrl) return null;
    let clean = rawUrl.trim();
    if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
    
    // Auto-fix missing protocol
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
    }

    try {
        const urlObj = new URL(clean);

        // 1. IMAGE DIRECT LINK CHECK
        if (clean.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) {
             return { type: 'IMAGE', embedUrl: clean, originalUrl: clean, platform: 'OTHER' };
        }

        // 2. YOUTUBE (Whitelisted as VIDEO)
        // Only YouTube is trusted to be embeddable via iframe cleanly
        if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
            let id = '';
            if (urlObj.pathname.includes('/shorts/')) {
                id = urlObj.pathname.split('/shorts/')[1]?.split('/')[0];
            } else if (urlObj.hostname.includes('youtu.be')) {
                id = urlObj.pathname.slice(1);
            } else if (urlObj.searchParams.has('v')) {
                id = urlObj.searchParams.get('v') || '';
            }

            if (id) {
                return {
                    type: 'VIDEO',
                    embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${id}&playsinline=1`,
                    originalUrl: clean,
                    platform: 'YOUTUBE'
                };
            }
        }

        // 3. SOCIAL / PORTAL FALLBACK
        // EVERYTHING ELSE defaults to a Social Card. 
        // We do NOT attempt to iframe Instagram, Pinterest, TikTok, etc. directly.
        let platform: any = 'OTHER';
        if (urlObj.hostname.includes('instagram')) platform = 'INSTAGRAM';
        else if (urlObj.hostname.includes('pinterest') || urlObj.hostname.includes('pin.it')) platform = 'PINTEREST';
        else if (urlObj.hostname.includes('tiktok')) platform = 'TIKTOK';
        else if (urlObj.hostname.includes('twitter') || urlObj.hostname.includes('x.com')) platform = 'TWITTER';

        return {
            type: 'SOCIAL',
            embedUrl: clean, // We store the link to open it in a new tab
            originalUrl: clean,
            platform: platform
        };

    } catch (e) { 
        // If URL parsing fails, we still return a generic social card with the raw text
        // This ensures we never fallback to default YouTube videos if the user provided SOMETHING.
        return { type: 'SOCIAL', embedUrl: clean, originalUrl: clean, platform: 'OTHER' };
    }
};

export const fetchMotivationVideos = async (customSheetId?: string, directUrl?: string): Promise<VisionContent[]> => {
    // 1. Direct URL has ABSOLUTE priority.
    // If user provided a link, we attempt to use it, even if it's broken text.
    // We only skip this if the string is empty.
    if (directUrl && directUrl.trim().length > 0) {
        const result = convertToEmbedUrl(directUrl);
        if (result) return [result];
    }

    // 2. Resolve the Google Sheet URL
    let fetchUrl = "";
    const sheetInput = customSheetId || DEFAULT_SHEET_ID;

    if (sheetInput.includes("/e/2PACX-")) {
        const parts = sheetInput.split('/pubhtml');
        const base = parts[0]; 
        fetchUrl = `${base}/pub?output=csv`;
    } 
    else if (!sheetInput.includes("http") && sheetInput.length > 20) {
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetInput}/gviz/tq?tqx=out:csv`;
    } 
    else if (sheetInput.includes("/d/")) {
         const match = sheetInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
         const id = match ? match[1] : sheetInput;
         fetchUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
    }
    else {
        fetchUrl = `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/gviz/tq?tqx=out:csv`;
    }

    try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
            const text = await response.text();
            
            // Regex to find http/https links
            const urlRegex = /(https?:\/\/[^\s",]+)/g;
            const allMatches = text.match(urlRegex);
            const validItems: VisionContent[] = [];
            
            if (allMatches) {
                allMatches.forEach(rawUrl => {
                    const result = convertToEmbedUrl(rawUrl);
                    if (result) validItems.push(result);
                });
            }

            if (validItems.length > 0) return validItems;
        } 
    } catch (e) { 
        console.warn("[Vision] Network error", e); 
    }

    // Fallback defaults ONLY if Google Sheet fails AND no direct URL was provided.
    return VOID_LIBRARY_DEFAULTS.map(url => ({ 
        type: 'VIDEO', 
        embedUrl: url, 
        originalUrl: url, 
        platform: 'YOUTUBE' 
    }));
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
