
import { NPC, GameState, HistoryLog, RealmStats, Era, FactionReputation, EnemyEntity, TaskPriority, NPCRelationship, PsychProfile, DailyNarrative } from '../types';
import { generateId, generateNemesis } from './generators';
import { RACES, TRAITS, FACTIONS } from '../constants';

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

// ... (Keep existing stat updates) ...
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

// --- NEW: AUTONOMOUS FACTION AI ---
const simulateFactionTurn = (factions: FactionReputation[]): { updatedFactions: FactionReputation[], log?: HistoryLog } => {
    let log: HistoryLog | undefined;
    const updatedFactions = factions.map(f => {
        // Random Event Chance (5% per tick per faction)
        if (Math.random() > 0.995) {
            const roll = Math.random();
            if (roll < 0.3) {
                // WAR EVENT
                const target = factions[Math.floor(Math.random() * factions.length)];
                if (target.id !== f.id && f.status !== 'WAR') {
                    log = {
                        id: generateId(),
                        timestamp: Date.now(),
                        type: 'WORLD_EVENT',
                        message: `${f.name} declares WAR on ${target.name}`,
                        details: "Armies are marching on the borders.",
                        cause: "Geopolitical Tension"
                    };
                }
            } else if (roll < 0.6) {
                // ECONOMIC BOOM
                log = {
                    id: generateId(),
                    timestamp: Date.now(),
                    type: 'WORLD_EVENT',
                    message: `${f.name} enters a Golden Age`,
                    details: "Trade flows freely. Market prices may drop.",
                    cause: "Economic Surplus"
                };
            } else {
                // INTERNAL COLLAPSE
                log = {
                    id: generateId(),
                    timestamp: Date.now(),
                    type: 'WORLD_EVENT',
                    message: `Plague strikes ${f.name}`,
                    details: "Refugees may arrive at your gates soon.",
                    cause: "Natural Disaster"
                };
            }
        }
        return f;
    });
    return { updatedFactions, log };
};

export const simulateReactiveTurn = (state: GameState, triggerEvent?: 'VICTORY' | 'DEFEAT'): any => {
    let pop = [...state.population];
    let logs: HistoryLog[] = [];
    let spawnedEnemies: EnemyEntity[] = [];
    let goldChange = 0;
    
    // 1. Update Global Stats
    let newStats = updateRealmStats(state.realmStats || { hope: 50, fear: 10, order: 50 }, triggerEvent || 'NEGLECT');

    // 2. Run Faction AI (Autonomous World)
    const factionSim = simulateFactionTurn(state.factions || []);
    const newFactions = factionSim.updatedFactions;
    if (factionSim.log) logs.push(factionSim.log);

    // 3. NPC Deep Simulation
    pop = pop.map(npc => {
        if (npc.status !== 'ALIVE') return npc;
        let newNpc = { ...npc };
        
        // Income Logic
        if (Math.random() > 0.97) goldChange -= 1; // Upkeep
        if (newNpc.role === 'Peasant' && Math.random() > 0.92) goldChange += 1; // Tax

        // Mood Logic
        const sanityDrain = Math.max(0, (newStats.fear - newStats.hope) * 0.05);
        newNpc.sanity = Math.max(0, Math.min(100, newNpc.sanity - sanityDrain));

        // Generate Gossip (Lore)
        if (Math.random() > 0.999) {
            logs.push({
                id: generateId(),
                timestamp: Date.now(),
                type: 'LORE',
                message: `Rumor from ${newNpc.name}`,
                details: `"I heard the shadows moving... something big is coming."`,
                cause: "Villager Gossip"
            });
        }

        return newNpc;
    });

    return { 
        newPopulation: pop, 
        logs, 
        newStats, 
        newFactions, 
        spawnedEnemies, 
        goldChange, 
        dailyNarrative: state.dailyNarrative 
    };
};
