
import { NPC, GameState, HistoryLog, RealmStats, Era, FactionReputation, EnemyEntity, TaskPriority, NPCRelationship, PsychProfile, DailyNarrative } from '../types';
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

// --- DAILY NARRATIVE ENGINE ---

const NARRATIVE_TEMPLATES = {
    FEAR: {
        titles: ["The Whispering Mist", "Shadows in the Keep", "The Prophet's Warning"],
        incidents: ["Citizens report strange sounds from the sewers.", "A guard was found babbling nonsense.", "The crows are gathering in unusual numbers."],
        rising: ["Panic spreads. Production slows.", "Symbols of the Void appear on walls.", "The people demand safety."],
        climax: ["A Void manifestation attacks the market!", "A riot breaks out in fear!", "Mass hysteria threatens the gates."]
    },
    HOPE: {
        titles: ["The Golden Dawn", "A Gift from the Stars", "The Festival of Light"],
        incidents: ["A traveling bard sings of a great hero.", "A star fell near the mountains.", "Crops are blooming overnight."],
        rising: ["Morale is high. People work harder.", "Pilgrims arrive seeking blessing.", "A feast is prepared."],
        climax: ["A grand celebration unites the factions!", "An ancient relic is unearthed!", "A diplomatic breakthrough!"]
    },
    ORDER: {
        titles: ["The Iron Decree", "Inspection Day", "The Merchant's Guild"],
        incidents: ["A royal inspector arrives.", "The smiths demand better tools.", "A census is called."],
        rising: ["Efficiency improves, but tension rises.", "Strict laws are enforced.", "Gold flows, but freedom suffers."],
        climax: ["A guild strike must be resolved!", "The inspector judges your rule!", "A massive trade deal is struck!"]
    },
    CHAOS: {
        titles: ["The Wild Hunt", "Broken Chains", "The Storm"],
        incidents: ["A prisoner has escaped.", "Wild magic surges in the air.", "Beasts circle the walls."],
        rising: ["Laws are ignored. Looting begins.", "Magic goes haywire.", "The guards are overwhelmed."],
        climax: ["The prison is breached!", "An elemental storm strikes!", "Anarchy in the streets!"]
    }
};

const updateDailyNarrative = (current: DailyNarrative | undefined, stats: RealmStats): { narrative: DailyNarrative, log?: HistoryLog } => {
    const now = new Date();
    const hour = now.getHours();
    const todayId = now.toISOString().split('T')[0];

    // 1. INIT NEW DAY
    if (!current || current.dayId !== todayId) {
        // Pick theme based on dominant stat
        let theme: DailyNarrative['theme'] = 'ORDER';
        let cause = "Routine cycle.";
        
        if (stats.fear > 60) { theme = 'FEAR'; cause = `Triggered by high Fear (${stats.fear}%)`; }
        else if (stats.hope > 60) { theme = 'HOPE'; cause = `Triggered by high Hope (${stats.hope}%)`; }
        else if (Math.random() > 0.7) { theme = 'CHAOS'; cause = "Random entropic fluctuation."; }

        const template = NARRATIVE_TEMPLATES[theme];
        const title = template.titles[Math.floor(Math.random() * template.titles.length)];
        const incident = template.incidents[Math.floor(Math.random() * template.incidents.length)];

        return {
            narrative: {
                dayId: todayId,
                title,
                theme,
                stage: 'INCIDENT',
                logs: [incident],
                intensity: 20 + Math.floor(Math.random() * 20),
                resolved: false,
                cause
            },
            log: { id: generateId(), timestamp: Date.now(), type: 'NARRATIVE', message: `Dawn: ${title}`, details: incident, cause }
        };
    }

    // 2. PROGRESS NARRATIVE BASED ON TIME
    let next = { ...current };
    let log: HistoryLog | undefined;
    const template = NARRATIVE_TEMPLATES[next.theme];

    // RISING ACTION (11:00 - 17:00)
    if (next.stage === 'INCIDENT' && hour >= 11) {
        next.stage = 'RISING';
        const detail = template.rising[Math.floor(Math.random() * template.rising.length)];
        next.logs.push(detail);
        next.intensity += 20;
        log = { id: generateId(), timestamp: Date.now(), type: 'NARRATIVE', message: `Noon: Situation Develops`, details: detail, cause: `Progressing from '${current.title}'` };
    }
    // CLIMAX (17:00 - 21:00)
    else if (next.stage === 'RISING' && hour >= 17) {
        next.stage = 'CLIMAX';
        const detail = template.climax[Math.floor(Math.random() * template.climax.length)];
        next.logs.push(detail);
        next.intensity += 30;
        log = { id: generateId(), timestamp: Date.now(), type: 'NARRATIVE', message: `Dusk: The Climax`, details: detail, cause: "Narrative tension reached peak." };
    }
    // RESOLUTION (21:00+)
    else if (next.stage === 'CLIMAX' && hour >= 21 && !next.resolved) {
        next.stage = 'RESOLUTION';
        next.resolved = true;
        const outcome = next.intensity > 80 ? "The day ends in turmoil." : "Order is restored.";
        next.logs.push(outcome);
        log = { id: generateId(), timestamp: Date.now(), type: 'NARRATIVE', message: `Night: Resolution`, details: outcome, cause: "Day cycle concluding." };
    }

    return { narrative: next, log };
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
                details: `They now consider us ${newStatus}.`,
                cause: `Due to recent ${event.toLowerCase()} interactions.`
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
    dailyNarrative?: DailyNarrative;
}

// --- DWARF FORTRESS LITE LOGIC ---

// 1. Social Ripple (Causalidad Emocional)
const propagateEmotion = (npcs: NPC[], sourceId: string, emotion: 'FEAR' | 'ANGER', intensity: number) => {
    return npcs.map(n => {
        if (n.id === sourceId || n.status !== 'ALIVE') return n;
        
        // Find if they know the source or are nearby (simulated by index proximity in array for now)
        const isFriend = (n.relationships || []).some(r => r.targetId === sourceId && r.score > 20);
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
    const maxPop = 10 + (state.structures?.wallsLevel || 0) * 10;

    // 3. IMMIGRATION (BALANCED: Requires Gold + Space + Hope)
    const canAffordNewcomers = state.gold > 50; // Newcomers cost upkeep immediately
    // FIXED: Chance reduced, requires Gold check to prevent infinite loop
    if ((newStats.hope + safetyBonus) > 60 && pop.length < maxPop && canAffordNewcomers && Math.random() > 0.95) {
        const newcomer = createNPC('Peasant');
        newcomer.memories.push("Seeking the safety of your high walls.");
        pop.push(newcomer);
        logs.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'WORLD_EVENT',
            message: `Immigrant Arrived`,
            details: `${newcomer.name} joins the citadel.`,
            cause: `Attracted by high Hope (${Math.floor(newStats.hope)}%)`
        });
    }

    // 4. DAILY NARRATIVE PROGRESSION
    const narrativeResult = updateDailyNarrative(state.dailyNarrative, newStats);
    if (narrativeResult.log) logs.push(narrativeResult.log);

    // 5. DEEP SIMULATION LOOP (Needs & Jobs & Traumas)
    let riotTriggered = false;
    let riotSourceId = '';
    
    // ECONOMIC THERMOSTAT
    // Upkeep: roughly 1g per person every 20-30 seconds (probabilistic)
    // Production: Only conscientious peasants work
    
    pop = pop.map(npc => {
        if (npc.status !== 'ALIVE') return npc;
        let newNpc = { ...npc };
        // Sanitize: Ensure arrays exist
        if (!newNpc.relationships) newNpc.relationships = [];
        if (!newNpc.memories) newNpc.memories = [];
        if (!newNpc.traits) newNpc.traits = [];
        if (!newNpc.psych) newNpc.psych = generatePsychProfile(newNpc.race, newNpc.role);

        // --- UPKEEP (Food/Tax) ---
        // 3% chance per tick to consume 1g.
        if (Math.random() > 0.97) {
            goldChange -= 1; 
        }

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
                    goldChange -= 5; // Vandalism costs more now
                    logs.push({ 
                        id: generateId(), 
                        timestamp: Date.now(), 
                        type: 'WORLD_EVENT', 
                        message: 'Vandalism', 
                        details: `${newNpc.name} smashed a stall in a rage.`,
                        cause: "Breakdown due to low Sanity." 
                    });
                }
            }
        }
        // 3. JOBS & PRODUCTIVITY (Determined by Conscientiousness)
        // BALANCED GOLD GENERATION: Only high conscientiousness generates gold regularly.
        else if (newNpc.psych.conscientiousness > 40 || Math.random() > 0.8) {
            if (newNpc.role === 'Smith') {
                newNpc.currentAction = 'WORKING';
                forgeProgress += 1;
            } else if (newNpc.role === 'Guard') {
                newNpc.currentAction = 'WORKING';
                newStats.order += 0.1;
                if (newStats.order > 80) newNpc.mood = 'HOPEFUL';
            } else if (newNpc.role === 'Peasant') {
                newNpc.currentAction = 'WORKING'; 
                // Only generate gold if they work AND pass a check
                if (Math.random() > 0.92) {
                    goldChange += 1; // Slower income
                }
            } else if (newNpc.role === 'Noble') {
                newNpc.currentAction = 'SOCIALIZING';
                // Nobles generate more gold but rarely work
                if (Math.random() > 0.98) goldChange += 5;
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
                // Safe check logic
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
                
                // Crime check (Greed)
                if (interaction.action === 'Stealing') {
                    goldChange -= 2;
                }
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
                details: `${newNpc.name} twisted into a demon!`,
                cause: `Total Sanity collapse + Low Faith.`
            });

            // Spawn the Enemy
            const demon = generateNemesis("TRANSFORMATION", TaskPriority.HIGH, [], 0, undefined, undefined, 60, state.realmStats);
            demon.race = 'DEMON';
            demon.factionId = 'UMBRA';
            demon.name = `Apostle ${newNpc.name}`;
            demon.title = `The Twisted Form of ${newNpc.name}`;
            demon.position = { x: 0, y: 0, z: 0 }; 
            demon.origin = `Mutated form of villager ${newNpc.name}.`;
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
        hpChange,
        dailyNarrative: narrativeResult.narrative
    };
};
