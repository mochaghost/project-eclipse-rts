
import { NPC, GameState, HistoryLog, RealmStats, Era, FactionReputation, EnemyEntity, TaskPriority, NPCRelationship, PsychProfile } from '../types';
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

// --- PSYCHOLOGY ENGINE ---

const generatePsychProfile = (race: string, role: string): PsychProfile => {
    const r = () => Math.floor(Math.random() * 100);
    
    // Base Baseline
    let profile: PsychProfile = {
        openness: r(),
        conscientiousness: r(),
        extroversion: r(),
        agreeableness: r(),
        neuroticism: r(),
        bravery: r(),
        greed: r(),
        faith: r()
    };

    // Racial Modifiers
    if (race === 'DWARF') { profile.conscientiousness += 20; profile.greed += 10; profile.bravery += 10; }
    if (race === 'ELF') { profile.openness += 20; profile.faith += 10; }
    if (race === 'ORC') { profile.agreeableness -= 30; profile.bravery += 30; profile.neuroticism -= 10; }
    if (race === 'CONSTRUCT') { profile.neuroticism = 0; profile.conscientiousness = 100; profile.faith = 0; }

    // Role Modifiers
    if (role === 'Guard') { profile.bravery += 20; profile.conscientiousness += 10; }
    if (role === 'Noble') { profile.greed += 30; profile.agreeableness -= 10; profile.neuroticism += 10; }
    if (role === 'Cultist') { profile.faith -= 50; profile.openness += 30; profile.neuroticism += 20; }
    if (role === 'Scholar') { profile.openness += 30; profile.extroversion -= 10; }

    // Clamp
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
        role,
        race,
        traits: [],
        psych: generatePsychProfile(race, role),
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

// --- DWARF FORTRESS LITE LOGIC ---

// 1. Social Ripple (Causalidad Emocional)
const propagateEmotion = (npcs: NPC[], sourceId: string, emotion: 'FEAR' | 'ANGER', intensity: number) => {
    return npcs.map(n => {
        if (n.id === sourceId || n.status !== 'ALIVE') return n;
        
        // Find if they know the source or are nearby (simulated by index proximity in array for now)
        const isFriend = n.relationships.some(r => r.targetId === sourceId && r.score > 20);
        // Random chance represents "physical proximity" in abstract simulation
        const isNearby = Math.random() > 0.8; 

        if (isFriend || isNearby) {
            let sanityDmg = intensity;
            if (n.psych) {
                // Bravery reduces fear impact
                if (emotion === 'FEAR') sanityDmg *= (1 - (n.psych.bravery / 200)); 
                // Neuroticism increases all emotional impact
                sanityDmg *= (1 + (n.psych.neuroticism / 200));
            }
            
            n.sanity = Math.max(0, n.sanity - sanityDmg);
            if (emotion === 'FEAR') n.memories.push(isFriend ? `Witnessed my friend ${sourceId} panic.` : `Heard screams nearby.`);
        }
        return n;
    });
};

// 2. Trait Mutation (El trauma cambia la personalidad)
const mutatePsychology = (npc: NPC): NPC => {
    if (!npc.psych) npc.psych = generatePsychProfile(npc.race, npc.role); // Polyfill for old saves

    if (npc.sanity < 20) {
        // Trauma increases neuroticism and decreases openness
        if (Math.random() > 0.8) {
            npc.psych.neuroticism = Math.min(100, npc.psych.neuroticism + 5);
            npc.psych.openness = Math.max(0, npc.psych.openness - 5);
            if (!npc.traits.includes('MAD')) npc.traits.push('MAD');
        }
    }
    // Hardened survivor logic
    if (npc.age > 40 && npc.sanity > 80 && npc.psych.bravery < 80) {
        if (Math.random() > 0.9) {
            npc.psych.bravery += 5;
            npc.psych.neuroticism -= 2;
            if (!npc.traits.includes('STOIC')) npc.traits.push('STOIC');
        }
    }
    return npc;
};

// 3. Complex Interaction (Causalidad Relacional)
const resolveSocialInteraction = (actor: NPC, target: NPC): { action: string, memoryActor: string, memoryTarget: string, relChange: number, relType?: NPCRelationship['type'] } => {
    const aPsych = actor.psych || generatePsychProfile(actor.race, actor.role);
    const tPsych = target.psych || generatePsychProfile(target.race, target.role);

    // Default: Chat
    let result: { action: string, memoryActor: string, memoryTarget: string, relChange: number, relType?: NPCRelationship['type'] } = { 
        action: 'Chatting', 
        memoryActor: `Spoke with ${target.name}.`, 
        memoryTarget: `Spoke with ${actor.name}.`, 
        relChange: 2 
    };

    // Scenario 1: Aggression (Low Agreeableness + High Strength/Bravery)
    if (aPsych.agreeableness < 30 && aPsych.bravery > 60) {
        result = {
            action: 'Insulting',
            memoryActor: `Mocked ${target.name} for their weakness.`,
            memoryTarget: `Was humiliated by ${actor.name}.`,
            relChange: -15,
            relType: 'RIVAL'
        };
    }
    // Scenario 2: Theft (High Greed + Low Conscientiousness)
    else if (aPsych.greed > 70 && aPsych.conscientiousness < 40) {
        if (target.role === 'Noble' || target.role === 'Guard') {
            result = {
                action: 'Stealing',
                memoryActor: `Stole a trinket from ${target.name}.`,
                memoryTarget: `Suspects ${actor.name} of theft.`,
                relChange: -30,
                relType: 'ENEMY'
            };
        }
    }
    // Scenario 3: Shared Faith (High Faith match)
    else if (aPsych.faith > 70 && tPsych.faith > 70) {
        result = {
            action: 'Praying',
            memoryActor: `Shared a holy vision with ${target.name}.`,
            memoryTarget: `Found spiritual kinship with ${actor.name}.`,
            relChange: 15,
            relType: 'FRIEND'
        };
    }
    // Scenario 4: Attraction (High Extroversion + High Openness)
    else if (aPsych.extroversion > 60 && tPsych.openness > 60 && Math.random() > 0.8) {
        result = {
            action: 'Flirting',
            memoryActor: `Admired ${target.name}.`,
            memoryTarget: `Was complimented by ${actor.name}.`,
            relChange: 10,
            relType: 'LOVER'
        };
    }

    return result;
};

export const simulateReactiveTurn = (state: GameState, triggerEvent?: 'VICTORY' | 'DEFEAT'): SimResult => {
    let pop = [...state.population];
    let logs: HistoryLog[] = [];
    let spawnedEnemies: EnemyEntity[] = [];
    let goldChange = 0;
    let hpChange = 0;
    let forgeProgress = 0;
    
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

    // 4. DEEP SIMULATION LOOP (Needs & Jobs & Traumas)
    let riotTriggered = false;
    let riotSourceId = '';

    pop = pop.map(npc => {
        if (npc.status !== 'ALIVE') return npc;
        let newNpc = { ...npc };
        if (!newNpc.psych) newNpc.psych = generatePsychProfile(newNpc.race, newNpc.role);

        // --- NEEDS SYSTEM ---
        newNpc.hunger += 2 + (Math.random() * 2);
        newNpc.fatigue += 1 + (Math.random() * 2);

        // Sanity check
        const sanityDrain = Math.max(0, (newStats.fear - newStats.hope) * 0.05);
        newNpc.sanity = Math.max(0, Math.min(100, newNpc.sanity - sanityDrain));

        // --- TRAIT EVOLUTION ---
        newNpc = mutatePsychology(newNpc);

        // --- BEHAVIOR TREE (PRIORITY QUEUE) ---
        
        // 1. CRITICAL NEEDS
        if (newNpc.hunger > 80) {
            newNpc.currentAction = 'EATING';
            newNpc.hunger = 0; 
        } else if (newNpc.fatigue > 90) {
            newNpc.currentAction = 'SLEEPING';
            newNpc.fatigue = 0;
        } 
        // 2. EMOTIONAL BREAKDOWNS (Causality Trigger)
        else if (newNpc.sanity < 20) {
            // Fight or Flight determined by Bravery
            if (newNpc.psych.bravery < 40 || newStats.fear > 80) {
                newNpc.currentAction = 'COWERING';
                newNpc.mood = 'TERRIFIED';
            } else {
                newNpc.currentAction = 'RIOTING';
                newNpc.mood = 'MANIC';
                riotTriggered = true;
                riotSourceId = newNpc.id;
                
                // Aggressive breakdown
                if (newNpc.psych.agreeableness < 30) {
                    goldChange -= 1;
                    logs.push({ id: generateId(), timestamp: Date.now(), type: 'WORLD_EVENT', message: 'Vandalism', details: `${newNpc.name} smashed a stall in a rage.` });
                }
            }
        }
        // 3. JOBS & PRODUCTIVITY (Determined by Conscientiousness)
        else if (newNpc.psych.conscientiousness > 40 || Math.random() > 0.5) {
            if (newNpc.role === 'Smith') {
                newNpc.currentAction = 'WORKING';
                forgeProgress += 1;
            } else if (newNpc.role === 'Guard') {
                newNpc.currentAction = 'WORKING';
                newStats.order += 0.1;
                if (newStats.order > 80) newNpc.mood = 'HOPEFUL';
            } else if (newNpc.role === 'Peasant') {
                newNpc.currentAction = 'WORKING'; 
                goldChange += 0.5;
            } else if (newNpc.role === 'Noble') {
                newNpc.currentAction = 'SOCIALIZING';
                if (Math.random() > 0.9) newStats.order += 0.5;
            } else {
                newNpc.currentAction = 'IDLE';
            }
        }
        // 4. SOCIALIZING (Fallback)
        else {
            newNpc.currentAction = 'IDLE';
        }

        // --- RELATIONSHIPS (The Gossip Engine) ---
        if (Math.random() > 0.90 && pop.length > 1) {
            const target = pop[Math.floor(Math.random() * pop.length)];
            if (target.id !== newNpc.id) {
                let rel = newNpc.relationships.find(r => r.targetId === target.id);
                if (!rel) {
                    rel = { targetId: target.id, type: 'FRIEND', score: 0, lastInteraction: Date.now() };
                    newNpc.relationships.push(rel);
                }
                
                // RUN INTERACTION MATRIX
                const interaction = resolveSocialInteraction(newNpc, target);
                
                rel.score += interaction.relChange;
                rel.lastInteraction = Date.now();
                if (interaction.relType) rel.type = interaction.relType;
                
                newNpc.memories.push(interaction.memoryActor);
            }
        }

        // --- THE APOSTLE TRANSFORMATION (Berserk Reference) ---
        // High despair + Low Faith = Transformation Risk
        if (newNpc.sanity <= 5 && newNpc.psych.faith < 20 && newNpc.status === 'ALIVE' && Math.random() > 0.9) {
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
            
            // Critical: Transformation causes MASSIVE fear ripple
            riotTriggered = true;
            riotSourceId = newNpc.id;
        }

        return newNpc;
    });

    // 5. SOCIAL RIPPLE EFFECT (Causalidad en Cadena)
    if (riotTriggered) {
        pop = propagateEmotion(pop, riotSourceId, 'FEAR', 20); // 20 Sanity damage to nearby
        newStats.fear += 5;
        newStats.order -= 5;
    }

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
