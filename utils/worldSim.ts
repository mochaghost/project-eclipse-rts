
import { NPC, GameState, HistoryLog, RealmStats, Era, FactionReputation, EnemyEntity, TaskPriority, NPCRelationship, PsychProfile, DailyNarrative, CharacterID, DialoguePacket } from '../types';
import { generateId, generateNemesis } from './generators';
import { RACES, TRAITS, FACTIONS, CHARACTERS } from '../constants';

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

// --- AUTONOMOUS FACTION AI ---
const simulateFactionTurn = (factions: FactionReputation[]): { updatedFactions: FactionReputation[], log?: HistoryLog } => {
    let log: HistoryLog | undefined;
    const updatedFactions = factions.map(f => {
        // Random Event Chance (5% per tick per faction)
        if (Math.random() > 0.995) {
            const roll = Math.random();
            if (roll < 0.3) {
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
                log = {
                    id: generateId(),
                    timestamp: Date.now(),
                    type: 'WORLD_EVENT',
                    message: `${f.name} enters a Golden Age`,
                    details: "Trade flows freely. Market prices may drop.",
                    cause: "Economic Surplus"
                };
            } else {
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

// --- NARRATIVE CHARACTER INTERVENTION ENGINE ---
// This system makes the Rival/Ally actively change game state, not just talk.
const generateCharacterEvent = (state: GameState): { log?: HistoryLog, dialogue?: DialoguePacket, goldMod?: number, manaMod?: number, hpMod?: number } => {
    if (Math.random() > 0.05) return {}; // 5% chance per tick to check, further reduced inside

    const rivalId = state.activeRivalId || 'RIVAL_KROG';
    const allyId = state.activeAllyId || 'MARSHAL_THORNE';
    
    // RIVAL ACTION (If player is weak or just random harassment)
    if (Math.random() > 0.98) {
        if (rivalId === 'RIVAL_KROG') {
            const theft = Math.floor(Math.random() * 20) + 10;
            return {
                log: { id: generateId(), timestamp: Date.now(), type: 'DEFEAT', message: "Krog's Raiders stole supplies", details: `-${theft} Gold`, cause: "Rival Action" },
                dialogue: { id: generateId(), characterId: rivalId, text: "I take what you cannot defend!", mood: 'ANGRY', timestamp: Date.now(), duration: 5000 },
                goldMod: -theft
            };
        } else if (rivalId === 'RIVAL_VASHJ') {
            const drain = 15;
            return {
                log: { id: generateId(), timestamp: Date.now(), type: 'MAGIC', message: "Vashj drains the ley lines", details: `-${drain} Mana`, cause: "Rival Spell" },
                dialogue: { id: generateId(), characterId: rivalId, text: "Your magic is... clumsy. I shall repurpose it.", mood: 'MYSTERIOUS', timestamp: Date.now(), duration: 5000 },
                manaMod: -drain
            };
        }
    }

    // ALLY ACTION (If player is struggling or randomly)
    if (Math.random() > 0.99 && state.baseHp < state.maxBaseHp * 0.5) {
        if (allyId === 'MARSHAL_THORNE') {
            return {
                log: { id: generateId(), timestamp: Date.now(), type: 'VICTORY', message: "Thorne rallies the guard", details: "+20 Base HP", cause: "Ally Support" },
                dialogue: { id: generateId(), characterId: allyId, text: "Hold the line! I've brought reinforcements!", mood: 'HAPPY', timestamp: Date.now(), duration: 5000 },
                hpMod: 20
            };
        }
    }

    return {};
};

// --- CAUSALITY ENGINE (DWARF FORTRESS STYLE) ---
const updateDailyNarrative = (current: DailyNarrative | undefined, state: GameState, logs: HistoryLog[]): DailyNarrative => {
    const todayId = new Date().toISOString().split('T')[0];
    
    // Initialize if missing or new day
    let narrative = current;
    if (!narrative || narrative.dayId !== todayId) {
        narrative = {
            dayId: todayId,
            title: "The Silent Morning",
            theme: 'ORDER',
            stage: 'INCIDENT',
            acts: {},
            logs: [],
            intensity: 0,
            resolved: false,
            cause: "A new dawn breaks."
        };
    }

    // ACT 1: INCIDENT (The first significant event sets the timeline)
    if (narrative.stage === 'INCIDENT') {
        const trigger = logs.find(l => l.type === 'DEFEAT' || l.type === 'VICTORY' || l.type === 'WORLD_EVENT' || (l.type === 'NARRATIVE' && l.cause?.includes('Crime')));
        
        if (trigger) {
            narrative.stage = 'RISING';
            narrative.acts.act1 = trigger.message;
            narrative.cause = trigger.cause || "Unknown Origin";
            
            // Set Theme based on Causality, not just Type
            if (trigger.cause?.includes('Greed') || trigger.type === 'TRADE') narrative.theme = 'GREED';
            else if (trigger.type === 'VICTORY') narrative.theme = 'HOPE';
            else if (trigger.type === 'DEFEAT') narrative.theme = 'FEAR';
            else if (trigger.cause?.includes('Magic')) narrative.theme = 'MAGIC';
            else narrative.theme = 'CHAOS';
            
            narrative.title = `The Day of ${trigger.cause || 'Change'}`;
            narrative.logs.push(`ACT I: It began when ${trigger.message}.`);
        }
    }

    // ACT 2: RISING ACTION (Escalation based on Stats)
    if (narrative.stage === 'RISING') {
        // Tension calculation based on accumulated state
        const tension = (100 - state.realmStats.hope) + state.realmStats.fear + (state.enemies.length * 10);
        
        if (tension > 150 || state.baseHp < state.maxBaseHp * 0.6) {
            narrative.stage = 'CLIMAX';
            narrative.intensity = Math.min(100, tension / 2);
            
            let escalationMsg = "Tensions boil over.";
            if (narrative.theme === 'GREED') escalationMsg = "Markets collapse and riots begin.";
            if (narrative.theme === 'FEAR') escalationMsg = "Shadows lengthen, hiding monsters.";
            if (narrative.theme === 'HOPE') escalationMsg = "The people rally for a final push.";
            
            narrative.acts.act2 = escalationMsg;
            narrative.logs.push(`ACT II: ${escalationMsg} The realm prepares for the worst.`);
        }
    }

    // ACT 3: CLIMAX (The inevitable conclusion)
    if (narrative.stage === 'CLIMAX') {
        const threatLevel = state.enemies.reduce((acc, e) => acc + e.rank, 0);
        narrative.intensity = threatLevel + (100 - state.realmStats.order);
        
        let climaxMsg = "A storm approaches.";
        if (narrative.theme === 'GREED') climaxMsg = "A Golden Horde marches to collect debts.";
        if (narrative.theme === 'FEAR') climaxMsg = "Nightmares manifest in the courtyard.";
        
        narrative.acts.act3 = `${climaxMsg} Threat Level: ${narrative.intensity}.`;
    }

    return narrative;
};

export const simulateReactiveTurn = (state: GameState, triggerEvent?: 'VICTORY' | 'DEFEAT'): any => {
    let pop = [...state.population];
    let logs: HistoryLog[] = [];
    let spawnedEnemies: EnemyEntity[] = [];
    let goldChange = 0;
    let manaChange = 0;
    let hpChange = 0;
    let activeDialogue = undefined;
    
    // 1. Update Global Stats
    let newStats = updateRealmStats(state.realmStats || { hope: 50, fear: 10, order: 50 }, triggerEvent || 'NEGLECT');

    // 2. Run Faction AI
    const factionSim = simulateFactionTurn(state.factions || []);
    const newFactions = factionSim.updatedFactions;
    if (factionSim.log) logs.push(factionSim.log);

    // 3. CAMPAIGN CHARACTER EVENTS (ACTIVE INTERVENTION)
    // This connects the specific Rival/Ally to the game economy
    const charEvent = generateCharacterEvent(state);
    if (charEvent.log) logs.push(charEvent.log);
    if (charEvent.dialogue) activeDialogue = charEvent.dialogue;
    if (charEvent.goldMod) goldChange += charEvent.goldMod;
    if (charEvent.manaMod) manaChange += charEvent.manaMod;
    if (charEvent.hpMod) hpChange += charEvent.hpMod;

    // 4. GOLD DECAY & UPKEEP (Standard)
    if (Math.random() > 0.998) { 
        const s = state.structures;
        const upkeep = 1 + (s.forgeLevel * 2) + s.wallsLevel + s.libraryLevel + s.lightingLevel + Math.ceil(state.minions.length / 2);
        goldChange -= upkeep;
    }

    // 5. NPC Deep Simulation
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

    // 6. Update Narrative State
    const dailyNarrative = updateDailyNarrative(state.dailyNarrative, state, logs);

    return { 
        newPopulation: pop, 
        logs, 
        newStats, 
        newFactions, 
        spawnedEnemies, 
        goldChange,
        manaChange, // NEW
        hpChange, // NEW
        activeDialogue, // NEW
        dailyNarrative 
    };
};
