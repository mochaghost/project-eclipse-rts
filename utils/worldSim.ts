
import { NPC, GameState, HistoryLog, RealmStats, Era, FactionReputation, EnemyEntity, TaskPriority, NPCRelationship } from '../types';
import { generateId, generateNemesis } from './generators';
import { RACES, TRAITS, FACTIONS } from '../constants';

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

const getRandomTrait = () => TRAITS[Math.floor(Math.random() * TRAITS.length)];

export const createNPC = (role: NPC['role'] = 'Peasant'): NPC => {
    const race = RACES[Math.floor(Math.random() * RACES.length)] as NPC['race'];
    
    return {
        id: generateId(),
        name: generateNPCName(race),
        role,
        race,
        traits: [getRandomTrait()],
        stats: {
            strength: Math.floor(Math.random() * 10) + 1,
            intellect: Math.floor(Math.random() * 10) + 1,
            loyalty: 50
        },
        status: 'ALIVE',
        mood: 'NEUTRAL',
        sanity: 80 + Math.floor(Math.random() * 20),
        currentAction: 'IDLE',
        age: 18 + Math.floor(Math.random() * 40),
        relationships: [],
        memories: [`Arrived seeking purpose.`],
        hunger: 0,
        fatigue: 0
    };
};

export const initializePopulation = (count: number): NPC[] => {
    const pop: NPC[] = [];
    for (let i = 0; i < count; i++) {
        const r = Math.random();
        let role: NPC['role'] = 'Peasant';
        if (r > 0.85) role = 'Guard';
        else if (r > 0.95) role = 'Noble';
        
        pop.push(createNPC(role));
    }
    return pop;
};

// --- SIMULATION ENGINE ---

export const updateRealmStats = (current: RealmStats, event: 'VICTORY' | 'DEFEAT' | 'NEGLECT' | 'TRADE'): RealmStats => {
    const next = { ...current };
    switch (event) {
        case 'VICTORY':
            next.hope = Math.min(100, next.hope + 5);
            next.fear = Math.max(0, next.fear - 3);
            next.order = Math.min(100, next.order + 2);
            break;
        case 'DEFEAT':
            next.hope = Math.max(0, next.hope - 10);
            next.fear = Math.min(100, next.fear + 15);
            next.order = Math.max(0, next.order - 5);
            break;
        case 'NEGLECT': 
            next.hope = Math.max(0, next.hope - 1);
            next.order = Math.max(0, next.order - 1);
            break;
        case 'TRADE':
            next.order = Math.min(100, next.order + 5);
            break;
    }
    return next;
};

export const updateFactions = (factions: FactionReputation[], event: 'VICTORY' | 'DEFEAT'): { factions: FactionReputation[], logs: HistoryLog[] } => {
    const logs: HistoryLog[] = [];
    const newFactions = factions.map(f => {
        let change = 0;
        if (event === 'VICTORY') {
            if (f.id === 'SOL') change = 2;
            if (f.id === 'IRON') change = 1;
            if (f.id === 'VAZAROTH') change = -5;
            if (f.id === 'UMBRA') change = -8;
        } else if (event === 'DEFEAT') {
            if (f.id === 'SOL') change = -3;
            if (f.id === 'VAZAROTH') change = 5;
            if (f.id === 'UMBRA') change = 10; // Demons love failure
        }
        
        if (f.id === 'VERDANT' && Math.random() > 0.8) change = Math.random() > 0.5 ? 2 : -2;

        const newRep = Math.max(-100, Math.min(100, f.reputation + change));
        
        let newStatus = f.status;
        if (newRep > 80) newStatus = 'ALLIED';
        else if (newRep > 20) newStatus = 'FRIENDLY';
        else if (newRep < -20) newStatus = 'HOSTILE';
        else if (newRep < -80) newStatus = 'WAR';
        else newStatus = 'NEUTRAL';

        if (newStatus !== f.status) {
            logs.push({
                id: generateId(),
                timestamp: Date.now(),
                type: 'DIPLOMACY',
                message: `Relations changed with ${f.name}`,
                details: `They now consider us ${newStatus}.`
            });
        }

        return { ...f, reputation: newRep, status: newStatus as any };
    });
    return { factions: newFactions, logs };
};

interface SimResult {
    newPopulation: NPC[]; 
    logs: HistoryLog[]; 
    newStats: RealmStats; 
    newFactions: FactionReputation[];
    spawnedEnemies?: EnemyEntity[];
    goldChange?: number;
    hpChange?: number;
    structuresChange?: { forge?: number, wall?: number };
}

export const simulateReactiveTurn = (state: GameState, triggerEvent?: 'VICTORY' | 'DEFEAT'): SimResult => {
    let pop = [...state.population];
    let logs: HistoryLog[] = [];
    let spawnedEnemies: EnemyEntity[] = [];
    let goldChange = 0;
    let hpChange = 0;
    let forgeProgress = 0;
    let wallProgress = 0;
    
    // 1. Update Global Stats
    let newStats = state.realmStats || { hope: 50, fear: 10, order: 50 };
    if (triggerEvent) {
        newStats = updateRealmStats(newStats, triggerEvent);
    } else {
        newStats = updateRealmStats(newStats, 'NEGLECT');
    }

    // 2. Faction Diplomacy
    let newFactions = state.factions || [];
    if (triggerEvent) {
        const facResult = updateFactions(newFactions, triggerEvent);
        newFactions = facResult.factions;
        logs = [...logs, ...facResult.logs];
    }

    const safetyBonus = (state.structures?.wallsLevel || 0) * 10;

    // 3. IMMIGRATION (Only if Hope is decent)
    if ((newStats.hope + safetyBonus) > 70 && pop.length < 30 && Math.random() > 0.8) {
        const newcomer = createNPC('Peasant');
        newcomer.memories.push("Seeking the safety of your high walls.");
        pop.push(newcomer);
        logs.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'WORLD_EVENT',
            message: `Immigrant Arrived`,
            details: `${newcomer.name} joins the citadel.`
        });
    }

    // 4. DEEP SIMULATION LOOP (Needs & Jobs)
    pop = pop.map(npc => {
        if (npc.status !== 'ALIVE') return npc;
        let newNpc = { ...npc };
        
        // --- NEEDS SYSTEM ---
        // Hunger increases every tick
        newNpc.hunger += 2 + (Math.random() * 2);
        newNpc.fatigue += 1 + (Math.random() * 2);

        // Sanity check
        const sanityDrain = Math.max(0, (newStats.fear - newStats.hope) * 0.05);
        newNpc.sanity = Math.max(0, Math.min(100, newNpc.sanity - sanityDrain));

        // --- BEHAVIOR TREE ---
        
        // 1. CRITICAL NEEDS
        if (newNpc.hunger > 80) {
            newNpc.currentAction = 'EATING';
            newNpc.hunger = 0; // Instant eat for simulation simplicity
            // Cost of food? Maybe subtract gold later
        } else if (newNpc.fatigue > 90) {
            newNpc.currentAction = 'SLEEPING';
            newNpc.fatigue = 0;
        } 
        // 2. EMOTIONAL BREAKDOWNS
        else if (newNpc.sanity < 20) {
            if (newStats.fear > 70) {
                newNpc.currentAction = 'COWERING';
                newNpc.mood = 'TERRIFIED';
            } else {
                newNpc.currentAction = 'RIOTING';
                newNpc.mood = 'MANIC';
                if (Math.random() > 0.9) {
                    goldChange -= 1;
                    logs.push({ id: generateId(), timestamp: Date.now(), type: 'WORLD_EVENT', message: 'Theft', details: `${newNpc.name} stole gold in a mania.` });
                }
            }
        }
        // 3. JOBS & PRODUCTIVITY
        else {
            if (newNpc.role === 'Smith') {
                newNpc.currentAction = 'WORKING';
                forgeProgress += 1;
            } else if (newNpc.role === 'Guard') {
                newNpc.currentAction = 'WORKING'; // Patrolling
                newStats.order += 0.1;
            } else if (newNpc.role === 'Peasant') {
                newNpc.currentAction = 'WORKING'; // Farming/Labor
                goldChange += 0.5;
            } else if (newNpc.role === 'Noble') {
                newNpc.currentAction = 'SOCIALIZING';
                // Nobles generate intrigue or order
                if (Math.random() > 0.9) newStats.order += 0.5;
            } else {
                newNpc.currentAction = 'IDLE';
            }
        }

        // --- RELATIONSHIPS (The Gossip Engine) ---
        // Pick a random other NPC to interact with
        if (Math.random() > 0.95 && pop.length > 1) {
            const target = pop[Math.floor(Math.random() * pop.length)];
            if (target.id !== newNpc.id) {
                let rel = newNpc.relationships.find(r => r.targetId === target.id);
                if (!rel) {
                    rel = { targetId: target.id, type: 'FRIEND', score: 0 };
                    newNpc.relationships.push(rel);
                }
                
                // Interaction Logic
                if (newNpc.traits.includes('ZEALOT') && target.role === 'Cultist') {
                    rel.score += 10;
                    newNpc.memories.push(`Discussed the Void with ${target.name}.`);
                } else if (newNpc.traits.includes('GREEDY') && target.role === 'Noble') {
                    rel.score += 5;
                    newNpc.memories.push(`Envied ${target.name}'s wealth.`);
                } else {
                    rel.score += 1;
                    newNpc.memories.push(`Chatted with ${target.name}.`);
                }
            }
        }

        // --- THE APOSTLE TRANSFORMATION (Berserk Reference) ---
        if (newNpc.sanity <= 0 && newNpc.status === 'ALIVE' && Math.random() > 0.8) {
            newNpc.status = 'DEAD'; 
            newNpc.memories.push("Succumbed to the Void and transformed.");
            
            logs.push({
                id: generateId(),
                timestamp: Date.now(),
                type: 'LORE',
                message: "A BEHELIT SCREAMS",
                details: `${newNpc.name} twisted into a demon!`
            });

            // Spawn the Enemy
            const demon = generateNemesis("TRANSFORMATION", TaskPriority.HIGH, [], 0);
            demon.race = 'DEMON';
            demon.factionId = 'UMBRA';
            demon.name = `Apostle ${newNpc.name}`;
            demon.title = `The Twisted Form of ${newNpc.name}`;
            demon.position = { x: 0, y: 0, z: 0 }; 
            spawnedEnemies.push(demon);
        }

        return newNpc;
    });

    // Handle Structure Upgrades via Labor
    // Note: Actual leveling requires huge numbers, this simulates progress
    // In a real game, this would fill a progress bar. Here we just abstract it.

    return { 
        newPopulation: pop, 
        logs, 
        newStats, 
        newFactions, 
        spawnedEnemies, 
        goldChange: Math.floor(goldChange), 
        hpChange 
    };
};
