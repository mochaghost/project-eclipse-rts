
import { NPC, GameState, HistoryLog, RealmStats, Era, FactionReputation, EnemyEntity, TaskPriority, NPCRelationship, PsychProfile, DailyNarrative, CharacterID, DialoguePacket } from '../types';
import { generateId, generateNemesis } from './generators';
import { RACES, TRAITS, FACTIONS, CHARACTERS, NARRATIVE_TEMPLATES, WORLD_EVENT_TEMPLATES, WARLORDS } from '../constants';

// ... (Keep existing Name/NPC generators) ...
const NAMES_FIRST = ["Ael", "Bor", "Cael", "Dun", "Ela", "Fen", "Gor", "Hul", "Ion", "Jur", "Kal", "Lom", "Mara", "Nia", "Oren", "Pia", "Quin", "Ren", "Sola", "Tor", "Ul", "Vea", "Wyn", "Xan", "Yor", "Zen", "Kael", "Thar", "Isol"];
const NAMES_LAST = ["smith", "ward", "light", "shade", "stone", "wood", "river", "field", "cross", "fall", "grim", "hope", "blood", "iron", "gold", "pyre", "ash", "vane", "morn", "dusk"];

const generateNPCName = (race: string) => {
    const base = NAMES_FIRST[Math.floor(Math.random() * NAMES_FIRST.length)] + NAMES_LAST[Math.floor(Math.random() * NAMES_LAST.length)];
    if (race === 'DWARF') return "Thorg " + base;
    if (race === 'ELF') return "Syl " + base;
    if (race === 'ORC') return "Grom " + base;
    if (race === 'CONSTRUCT') return "Unit-" + Math.floor(Math.random()*999);
    if (race === 'DEMON') return "Zodd " + base;
    return base;
};

// ... (Keep Psychology Engine) ...
const generatePsychProfile = (race: string, role: string): PsychProfile => {
    const r = () => Math.floor(Math.random() * 100);
    let profile: PsychProfile = { openness: r(), conscientiousness: r(), extroversion: r(), agreeableness: r(), neuroticism: r(), bravery: r(), greed: r(), faith: r() };
    if (race === 'DWARF') { profile.conscientiousness += 20; profile.greed += 10; profile.bravery += 10; }
    if (race === 'ELF') { profile.openness += 20; profile.faith += 10; }
    if (race === 'ORC') { profile.agreeableness -= 30; profile.bravery += 30; profile.neuroticism -= 10; }
    if (race === 'CONSTRUCT') { profile.neuroticism = 0; profile.conscientiousness = 100; profile.faith = 0; }
    // Role Modifiers
    if (role === 'Guard') { profile.bravery += 20; profile.conscientiousness += 10; }
    if (role === 'Noble') { profile.greed += 30; profile.agreeableness -= 10; profile.neuroticism += 10; }
    if (role === 'Cultist') { profile.faith -= 50; profile.openness += 30; profile.neuroticism += 20; }
    if (role === 'Scholar') { profile.openness += 30; profile.extroversion -= 10; }
    Object.keys(profile).forEach(k => {
        // @ts-ignore
        profile[k] = Math.max(0, Math.min(100, profile[k]));
    });
    return profile;
};

export const createNPC = (role: NPC['role'] = 'Peasant'): NPC => {
    const race = RACES[Math.floor(Math.random() * RACES.length)] as NPC['race'];
    return {
        id: generateId(),
        name: generateNPCName(race),
        role, race, traits: [],
        psych: generatePsychProfile(race, role),
        stats: { strength: Math.floor(Math.random() * 10) + 1, intellect: Math.floor(Math.random() * 10) + 1, loyalty: 50 },
        status: 'ALIVE', mood: 'NEUTRAL', sanity: 80 + Math.floor(Math.random() * 20),
        currentAction: 'IDLE', age: 18 + Math.floor(Math.random() * 40), relationships: [], memories: [`Arrived seeking purpose.`], hunger: 0, fatigue: 0
    };
};

export const updateRealmStats = (current: RealmStats, event: 'VICTORY' | 'DEFEAT' | 'NEGLECT' | 'TRADE'): RealmStats => {
    const next = { ...current };
    switch (event) {
        case 'VICTORY': next.hope = Math.min(100, next.hope + 5); next.fear = Math.max(0, next.fear - 3); next.order = Math.min(100, next.order + 2); break;
        case 'DEFEAT': next.hope = Math.max(0, next.hope - 10); next.fear = Math.min(100, next.fear + 15); next.order = Math.max(0, next.order - 5); break;
        case 'NEGLECT': next.hope = Math.max(0, next.hope - 1); next.order = Math.max(0, next.order - 1); break;
        case 'TRADE': next.order = Math.min(100, next.order + 5); break;
    }
    return next;
};

// --- DEEP LORE GENERATOR (The "Warcraft" Engine) ---
const generateDeepWorldEvent = (factions: FactionReputation[]): { updatedFactions: FactionReputation[], log?: HistoryLog } => {
    if (Math.random() > 0.08) return { updatedFactions: factions }; // 8% chance per tick

    const newFactions = [...factions];
    let log: HistoryLog | undefined;

    // Pick two factions to interact
    const f1Index = Math.floor(Math.random() * newFactions.length);
    let f2Index = Math.floor(Math.random() * newFactions.length);
    while(f2Index === f1Index) f2Index = Math.floor(Math.random() * newFactions.length);

    const f1 = newFactions[f1Index];
    const f2 = newFactions[f2Index];

    // Determine Logic
    const isWar = f1.status === 'WAR' || f1.status === 'HOSTILE';
    const isAlly = f1.status === 'ALLIED' || f1.status === 'FRIENDLY';
    
    let category = 'POLITICAL';
    if (isWar && Math.random() > 0.4) category = 'WAR';
    else if (isAlly && Math.random() > 0.4) category = 'ALLIANCE';
    else if (Math.random() > 0.7) category = 'MYSTIC';

    // Pick a Template
    const templates = WORLD_EVENT_TEMPLATES[category as keyof typeof WORLD_EVENT_TEMPLATES] || WORLD_EVENT_TEMPLATES.POLITICAL;
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Warlord Injection (30% chance)
    let warlordName = "The leader";
    if (Math.random() > 0.7) {
        const warlord = WARLORDS.find(w => w.faction === f1.id);
        if (warlord) warlordName = `${warlord.title} ${warlord.name}`;
    }

    // Process String
    let message = template
        .replace('{F1}', f1.name)
        .replace('{F2}', f2.name)
        .replace('{WARLORD}', warlordName);

    // Apply Effects
    if (category === 'WAR') {
        newFactions[f1Index].reputation -= 5;
        newFactions[f2Index].reputation -= 5;
    } else if (category === 'ALLIANCE') {
        newFactions[f1Index].reputation += 2;
        newFactions[f2Index].reputation += 2;
    }

    log = {
        id: generateId(),
        timestamp: Date.now(),
        type: 'WORLD_EVENT',
        message: message,
        details: "The balance of power shifts.",
        cause: category
    };

    return { updatedFactions: newFactions, log };
};

// --- NARRATIVE CHARACTER INTERVENTION ENGINE (PNE 1.0) ---
const generateCharacterEvent = (state: GameState): { log?: HistoryLog, dialogue?: DialoguePacket, goldMod?: number, manaMod?: number, hpMod?: number, storyFragment?: string } => {
    if (Math.random() > 0.05) return {}; 

    const rivalId = state.activeRivalId || 'RIVAL_KROG';
    const allyId = state.activeAllyId || 'MARSHAL_THORNE';
    const rivalName = CHARACTERS[rivalId].name;
    const allyName = CHARACTERS[allyId].name;
    
    // RIVAL ACTION
    if (Math.random() > 0.99) { // Reduced frequency
        const actionPool = NARRATIVE_TEMPLATES.ACTIONS.STEAL_GOLD;
        const action = actionPool[Math.floor(Math.random() * actionPool.length)];
        
        if (rivalId === 'RIVAL_KROG') {
            const theft = Math.floor(Math.random() * 10) + 5; 
            return {
                log: { id: generateId(), timestamp: Date.now(), type: 'DEFEAT', message: `${rivalName} raids supplies`, details: `-${theft} Gold`, cause: "Rival Action" },
                dialogue: { id: generateId(), characterId: rivalId, text: "I take what you cannot defend!", mood: 'ANGRY', timestamp: Date.now(), duration: 5000 },
                goldMod: -theft,
                storyFragment: `${rivalName} ${action}, seizing ${theft} gold from the stockpile.`
            };
        } else if (rivalId === 'RIVAL_VASHJ') {
            const actionPoolMagic = NARRATIVE_TEMPLATES.ACTIONS.DRAIN_MANA;
            const actionMagic = actionPoolMagic[Math.floor(Math.random() * actionPoolMagic.length)];
            const drain = 10;
            return {
                log: { id: generateId(), timestamp: Date.now(), type: 'MAGIC', message: `${rivalName} corrupts mana`, details: `-${drain} Mana`, cause: "Rival Spell" },
                dialogue: { id: generateId(), characterId: rivalId, text: "Your magic is... clumsy. I shall repurpose it.", mood: 'MYSTERIOUS', timestamp: Date.now(), duration: 5000 },
                manaMod: -drain,
                storyFragment: `${rivalName} ${actionMagic}, draining ${drain} mana from the citadels reserves.`
            };
        }
    }

    // ALLY ACTION
    if (Math.random() > 0.99 && state.baseHp < state.maxBaseHp * 0.5) {
        if (allyId === 'MARSHAL_THORNE') {
            const actionPool = NARRATIVE_TEMPLATES.ACTIONS.SUPPORT_HERO;
            const action = actionPool[Math.floor(Math.random() * actionPool.length)];
            return {
                log: { id: generateId(), timestamp: Date.now(), type: 'VICTORY', message: `${allyName} rallies guard`, details: "+20 Base HP", cause: "Ally Support" },
                dialogue: { id: generateId(), characterId: allyId, text: "Hold the line! I've brought reinforcements!", mood: 'HAPPY', timestamp: Date.now(), duration: 5000 },
                hpMod: 20,
                storyFragment: `Seeing the defenses falter, ${allyName} ${action}, restoring 20 integrity to the walls.`
            };
        }
    }

    return {};
};

// --- CAUSALITY ENGINE V2 (NARRATIVE BUILDER) ---
const updateDailyNarrative = (current: DailyNarrative | undefined, state: GameState, logs: HistoryLog[], extraFragment?: string): DailyNarrative => {
    const todayId = new Date().toISOString().split('T')[0];
    
    // 1. Initialize or Reset
    let narrative = current;
    if (!narrative || narrative.dayId !== todayId) {
        // ACT 1: DAWN (Procedural Start)
        const weather = state.weather || 'CLEAR';
        const templates = NARRATIVE_TEMPLATES.DAWN[weather] || NARRATIVE_TEMPLATES.DAWN.CLEAR;
        const openingLine = templates[Math.floor(Math.random() * templates.length)];

        narrative = {
            dayId: todayId,
            title: "The Unwritten Day",
            theme: 'ORDER',
            currentStage: 'DAWN',
            fullStory: openingLine, // Start the story string
            eventsTracked: [],
            intensity: 0,
        };
    }

    // 2. Append Story Fragments based on significant events
    let newStory = narrative.fullStory;
    let newStage = narrative.currentStage;
    let newIntensity = narrative.intensity;
    const tracked = new Set(narrative.eventsTracked);

    // Inject Character Events (from generateCharacterEvent)
    if (extraFragment) {
        const connectors = NARRATIVE_TEMPLATES.CONNECTORS;
        const conn = connectors[Math.floor(Math.random() * connectors.length)];
        newStory += ` ${conn} ${extraFragment}`;
        newStage = 'RISING'; // Any event pushes us towards rising action
    }

    // Process logs for Major Events (only if not already tracked)
    logs.forEach(log => {
        if (!tracked.has(log.id)) {
            // Task Completion
            if (log.type === 'VICTORY' && log.message.includes('Vanquished')) {
                const taskName = log.message.replace('Vanquished: ', '');
                newStory += ` The Commander successfully purged "${taskName}", driving back the shadows.`;
                newIntensity += 10;
                tracked.add(log.id);
            }
            // Task Failure
            if (log.type === 'DEFEAT' && log.message.includes('Failed')) {
                newStory += ` However, discipline faltered. The task "${log.message.replace('Task Failed: ', '')}" was lost to the Void, damaging morale.`;
                newIntensity += 15;
                newStage = 'CLIMAX'; // Failures escalate quickly
                tracked.add(log.id);
            }
            // Major World Events
            if (log.type === 'WORLD_EVENT') {
                newStory += ` News arrived from the border: ${log.message}.`;
                tracked.add(log.id);
            }
        }
    });

    // 3. Stage Progression Logic
    if (newStage === 'DAWN' && newIntensity > 10) newStage = 'INCIDENT';
    if (newStage === 'INCIDENT' && newIntensity > 30) newStage = 'RISING';
    if (newStage === 'RISING' && newIntensity > 60) newStage = 'CLIMAX';

    return {
        ...narrative,
        fullStory: newStory,
        currentStage: newStage,
        intensity: newIntensity,
        eventsTracked: Array.from(tracked)
    };
};

export const simulateReactiveTurn = (state: GameState, triggerEvent?: 'VICTORY' | 'DEFEAT'): any => {
    let pop = [...state.population];
    let logs: HistoryLog[] = [];
    let spawnedEnemies: EnemyEntity[] = [];
    let goldChange = 0;
    let manaChange = 0;
    let hpChange = 0;
    let activeDialogue = undefined;
    let storyFragment = undefined;
    
    let newStats = updateRealmStats(state.realmStats || { hope: 50, fear: 10, order: 50 }, triggerEvent || 'NEGLECT');

    // Replaced simple faction sim with Deep World Event Generator
    const factionSim = generateDeepWorldEvent(state.factions || []);
    const newFactions = factionSim.updatedFactions;
    if (factionSim.log) logs.push(factionSim.log);

    const charEvent = generateCharacterEvent(state);
    if (charEvent.log) logs.push(charEvent.log);
    if (charEvent.dialogue) activeDialogue = charEvent.dialogue;
    if (charEvent.goldMod) goldChange += charEvent.goldMod;
    if (charEvent.manaMod) manaChange += charEvent.manaMod;
    if (charEvent.hpMod) hpChange += charEvent.hpMod;
    if (charEvent.storyFragment) storyFragment = charEvent.storyFragment;

    // 4. GOLD DECAY & UPKEEP (SIGNIFICANTLY REDUCED)
    if (Math.random() > 0.999) { 
        const s = state.structures;
        const rawUpkeep = 1 + (s.forgeLevel * 1) + (s.wallsLevel * 1) + Math.ceil(state.minions.length / 4);
        const upkeep = Math.min(10, rawUpkeep); // Cap upkeep at 10g
        goldChange -= upkeep;
    }

    pop = pop.map(npc => {
        if (npc.status !== 'ALIVE') return npc;
        let newNpc = { ...npc };
        
        const sanityDrain = Math.max(0, (newStats.fear - newStats.hope) * 0.05);
        newNpc.sanity = Math.max(0, Math.min(100, newNpc.sanity - sanityDrain));

        if (newNpc.sanity < 10 && newNpc.status !== 'MAD') {
            newNpc.status = 'MAD';
            logs.push({
                id: generateId(),
                timestamp: Date.now(),
                type: 'NARRATIVE',
                message: `${newNpc.name} has gone MAD`,
                details: "The pressure of the void broke their mind.",
                cause: "Sanity Collapse"
            });
            spawnedEnemies.push(generateNemesis('MADNESS_SPAWN', TaskPriority.HIGH, [], 0, undefined, 'Broken Mind', 60, newStats));
        }

        return newNpc;
    });

    const dailyNarrative = updateDailyNarrative(state.dailyNarrative, state, logs, storyFragment);

    return { 
        newPopulation: pop, 
        logs, 
        newStats, 
        newFactions, 
        spawnedEnemies, 
        goldChange,
        manaChange,
        hpChange,
        activeDialogue,
        dailyNarrative 
    };
};
