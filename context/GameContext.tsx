
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
    GameState, GameContextType, TaskPriority, EntityType, Era, AlertType, 
    VisualEffect, Task, SubtaskDraft, TaskTemplate, FirebaseConfig, 
    FactionKey, MapEventType, WeatherType, ShopItem, HistoryLog, GameSettings, CharacterID, DialoguePacket, LootOrb, MaterialType, Item, MinionEntity, EnemyEntity 
} from '../types';
import { 
    generateId, generateNemesis, generateLoot, getSageWisdom, 
    getVazarothLine, fetchMotivationVideos, generateWorldRumor, generateSpawnPosition, getEquipmentLore
} from '../utils/generators';
import { saveGame, loadGame } from '../utils/saveSystem';
import { playSfx, initAudio } from '../utils/audio';
import { simulateReactiveTurn } from '../utils/worldSim';
import { 
    initFirebase, loginWithGoogle as firebaseLogin, logout as firebaseLogout, 
    subscribeToAuth, subscribeToCloud, pushToCloud, testConnection 
} from '../services/firebase';
import { FACTIONS, LEVEL_THRESHOLDS, ERA_CONFIG, SPELLS, DIALOGUE_POOLS, CHARACTERS } from '../constants';

// --- DYNAMIC SHOP GENERATOR ---
export const getDynamicShopItems = (state: GameState): ShopItem[] => {
    const s = state.structures || { forgeLevel: 0, wallsLevel: 0, libraryLevel: 0, marketLevel: 0, lightingLevel: 0 };
    const tech = state.militaryTech || 1;

    const forgeCost = Math.floor(200 * Math.pow(1.5, s.forgeLevel));
    const wallsCost = Math.floor(150 * Math.pow(1.5, s.wallsLevel));
    const libCost = Math.floor(300 * Math.pow(1.5, s.libraryLevel));
    const lightsCost = Math.floor(100 * Math.pow(1.5, s.lightingLevel));
    
    const mercCost = Math.floor(100 + (tech * 10)); 

    return [
        { id: 'POTION_HP', name: "Elixir of Vitality", description: "Restores 50 HP to Hero.", cost: 40, type: 'HEAL_HERO', value: 50, tier: 0 },
        { id: 'POTION_BASE', name: "Mason's Brew", description: "Repairs 30 HP to Citadel Walls.", cost: 60, type: 'HEAL_BASE', value: 30, tier: 0 },
        { id: 'MERCENARY', name: `Void Mercenary (Tier ${tech})`, description: `Hires a guard. Stats scale with Military Tech (${tech}).`, cost: mercCost, type: 'MERCENARY', value: 1, tier: 0 },
        { id: 'MYSTERY_BOX', name: "Crate of the Unknown", description: "Contains a random item of your level.", cost: 150 + (state.playerLevel * 10), type: 'BUY_TIME', value: 0, tier: 0 },
        { id: 'UPGRADE_FORGE', name: `Forge Expansion (Lvl ${s.forgeLevel + 1})`, description: "Increase production capabilities.", cost: forgeCost, type: 'UPGRADE_FORGE', value: 1, tier: s.forgeLevel + 1 },
        { id: 'UPGRADE_WALLS', name: `Reinforce Walls (Lvl ${s.wallsLevel + 1})`, description: "Increase Max Base HP (+50).", cost: wallsCost, type: 'UPGRADE_WALLS', value: 50, tier: s.wallsLevel + 1 },
        { id: 'UPGRADE_LIBRARY', name: `Arcane Archive (Lvl ${s.libraryLevel + 1})`, description: "Gain +5% XP from tasks.", cost: libCost, type: 'UPGRADE_LIBRARY', value: 5, tier: s.libraryLevel + 1 },
        { id: 'UPGRADE_LIGHTS', name: `City Lights (Lvl ${s.lightingLevel + 1})`, description: "Push back the visual darkness.", cost: lightsCost, type: 'UPGRADE_LIGHTS', value: 1, tier: s.lightingLevel + 1 },
    ];
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};

// Notification Helper
const sendNotification = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
};

// --- HELPER: Distance Calc ---
const getDist = (p1: {x:number, z:number}, p2: {x:number, z:number}) => {
    const dx = p1.x - p2.x;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx*dx + dz*dz);
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(() => loadGame());
    const [lastTick, setLastTick] = useState<number>(Date.now());
    const [isChronosOpen, setIsChronosOpen] = useState(false);

    // Cloud Sync Refs
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // --- DIALOGUE TRIGGER HELPER ---
    const triggerDialogue = (charId: CharacterID, textPool: string[], mood: 'NEUTRAL'|'ANGRY'|'HAPPY' = 'NEUTRAL', duration = 5000) => {
        const text = textPool[Math.floor(Math.random() * textPool.length)];
        const packet: DialoguePacket = {
            id: generateId(),
            characterId: charId,
            text,
            mood,
            timestamp: Date.now(),
            duration
        };
        setState(prev => ({ ...prev, activeDialogue: packet }));
        playSfx('UI_CLICK'); 
    };

    // Initial Setup
    useEffect(() => {
        initAudio();
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        const unsub = subscribeToAuth((user) => {
            if (user) {
                setState(prev => ({ 
                    ...prev, 
                    syncConfig: { 
                        ...prev.syncConfig, 
                        isConnected: true,
                        user: { uid: user.uid, displayName: user.displayName, email: user.email },
                        roomId: prev.syncConfig?.roomId || user.uid,
                        firebase: prev.syncConfig?.firebase || {} as FirebaseConfig 
                    } as any
                }));
                if (user.uid) {
                    subscribeToCloud(user.uid, (cloudState) => {
                        if (cloudState && typeof cloudState === 'object') {
                            const localTime = stateRef.current.lastSyncTimestamp || 0;
                            const cloudTime = cloudState.lastSyncTimestamp || 0;

                            if (cloudTime > localTime) {
                                console.log(`[Cloud] Hydrating newer state`);
                                const sanitizedCloud = {
                                    ...cloudState,
                                    tasks: Array.isArray(cloudState.tasks) ? cloudState.tasks : [],
                                    enemies: Array.isArray(cloudState.enemies) ? cloudState.enemies : [],
                                    population: Array.isArray(cloudState.population) ? cloudState.population : []
                                };
                                setState(prev => ({ ...prev, ...sanitizedCloud }));
                            }
                        }
                    });
                }
            } else {
                setState(prev => ({ 
                    ...prev, 
                    syncConfig: { ...prev.syncConfig, isConnected: false, user: undefined } as any 
                }));
            }
        });

        setState(p => {
            if (!p.activeAllyId) return { ...p, activeAllyId: 'MARSHAL_THORNE', activeRivalId: 'RIVAL_KROG' };
            return p;
        });

        return () => unsub();
    }, []);

    // --- PHYSICS LOOP ---
    useEffect(() => {
        const physicsInterval = setInterval(() => {
            setState(prev => {
                if (!prev.lootOrbs || prev.lootOrbs.length === 0) return prev;
                const nextOrbs = prev.lootOrbs.map(orb => {
                    const newPos = { ...orb.position };
                    let newVel = { ...orb.velocity };
                    newVel.y -= 0.02;
                    newPos.x += newVel.x;
                    newPos.y += newVel.y;
                    newPos.z += newVel.z;
                    if (newPos.y <= 0.5) {
                        newPos.y = 0.5;
                        newVel.y *= -0.6; 
                        newVel.x *= 0.9;  
                        newVel.z *= 0.9;
                    }
                    return { ...orb, position: newPos, velocity: newVel };
                }).filter(orb => Date.now() - orb.createdAt < 30000); 
                return { ...prev, lootOrbs: nextOrbs };
            });
        }, 33); 
        return () => clearInterval(physicsInterval);
    }, []);

    // --- GAME LOOP ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            
            setState(current => {
                if (!current || !Array.isArray(current.tasks) || !Array.isArray(current.enemies)) {
                    return loadGame();
                }

                let updated = { ...current };
                let historyUpdate: HistoryLog[] = [];
                let alertUpdate: Partial<GameState> = {};
                let effectsUpdate: VisualEffect[] = [...(current.effects || [])];
                let enemiesUpdate = [...current.enemies];
                let tasksUpdate = [...current.tasks];
                let minionsUpdate = [...current.minions];

                // Narrative Modifiers
                const stats = current.realmStats || { hope: 50, fear: 10, order: 50 };
                const minionDmgMod = stats.hope > 70 ? 1.5 : 1;
                const enemyDmgMod = stats.fear > 70 ? 1.5 : 1;
                const minionArmorMod = stats.order > 70 ? 0.8 : 1;

                // A. Minions Attack Enemies
                minionsUpdate = minionsUpdate.map(minion => {
                    const target = enemiesUpdate.find(e => getDist(minion.position, e.position) < (minion.combat?.range || 2));
                    if (target) {
                        const dmg = (minion.combat?.damage || 10) * minionDmgMod;
                        target.hp -= dmg;
                        if (Math.random() > 0.5) {
                            effectsUpdate.push({ id: generateId(), type: 'COMBAT_HIT' as any, position: target.position, text: '', timestamp: now });
                        }
                    }
                    return minion;
                });

                // B. Enemies Attack Minions
                enemiesUpdate = enemiesUpdate.map(enemy => {
                    if (enemy.executionReady) return enemy; 
                    const targetMinion = minionsUpdate.find(m => getDist(enemy.position, m.position) < (enemy.combat?.range || 2));
                    if (targetMinion) {
                        const dmg = (enemy.combat?.damage || 10) * enemyDmgMod * minionArmorMod;
                        targetMinion.hp -= dmg;
                        if (Math.random() > 0.5) {
                            effectsUpdate.push({ id: generateId(), type: 'COMBAT_HIT' as any, position: targetMinion.position, text: '', timestamp: now });
                        }
                    } else if (getDist(enemy.position, {x:0, z:0}) < 15) {
                        updated.baseHp = Math.max(0, updated.baseHp - 0.5); 
                    }
                    return enemy;
                });

                // C. Handle Deaths (Minions)
                const deadMinions = minionsUpdate.filter(m => m.hp <= 0);
                if (deadMinions.length > 0) {
                    playSfx('FAILURE'); 
                    deadMinions.forEach(m => {
                        effectsUpdate.push({ id: generateId(), type: 'SPLAT_TOMATO', position: m.position, timestamp: now });
                        effectsUpdate.push({ id: generateId(), type: 'TEXT_DAMAGE', position: {x:m.position.x, y:2, z:m.position.z}, text: "FALLEN", timestamp: now });
                    });
                    minionsUpdate = minionsUpdate.filter(m => m.hp > 0);
                }

                // D. Handle Routs (Enemies)
                enemiesUpdate = enemiesUpdate.map(e => {
                    if (e.hp <= 0 && !e.executionReady) {
                        playSfx('VICTORY');
                        updated.gold = (updated.gold || 0) + 75; 
                        effectsUpdate.push({ id: generateId(), type: 'EXPLOSION', position: e.position, timestamp: now });
                        effectsUpdate.push({ id: generateId(), type: 'TEXT_GOLD', position: e.position, text: "+75g (Routed)", timestamp: now });
                        const newPos = generateSpawnPosition(50, 60);
                        return { ...e, hp: e.maxHp, position: newPos };
                    }
                    return e;
                });

                updated.minions = minionsUpdate;
                updated.enemies = enemiesUpdate;

                // Task Logic
                tasksUpdate = tasksUpdate.map(t => {
                    if (!t.completed && !t.failed) {
                        if (now > t.deadline) return { ...t, failed: true };
                        const duration = t.deadline - t.startTime;
                        const elapsed = now - t.startTime;
                        const progress = elapsed / duration;
                        const currentLevel = t.lastNotificationLevel || 0;

                        if (progress > 0.75 && currentLevel < 3) {
                            if (current.activeAlert === AlertType.NONE) {
                                playSfx('FAILURE');
                                alertUpdate = { activeAlert: AlertType.CRISIS, alertTaskId: t.id, sageMessage: getSageWisdom('CRISIS') };
                            }
                            sendNotification("URGENT: 75% Elapsed", `${t.title} is critical.`);
                            return { ...t, crisisTriggered: true, lastNotificationLevel: 3 };
                        }
                        if (progress > 0.50 && currentLevel < 2) return { ...t, lastNotificationLevel: 2 };
                        if (progress > 0.25 && currentLevel < 1) return { ...t, lastNotificationLevel: 1 };
                    }
                    return t;
                });

                const newlyFailed = tasksUpdate.filter(t => t.failed && !current.tasks.find(ot => ot.id === t.id)?.failed);
                newlyFailed.forEach(t => {
                    playSfx('FAILURE');
                    historyUpdate.push({ id: generateId(), type: 'DEFEAT', timestamp: now, message: `Task Failed: ${t.title}`, details: "The Void grows stronger." });
                    const dmg = t.priority * 10;
                    updated.baseHp = Math.max(0, updated.baseHp - dmg);
                    effectsUpdate.push({ id: generateId(), type: 'TEXT_DAMAGE', position: {x:0, y:2, z:0}, text: `-${dmg} HP`, timestamp: now });
                    updated.winStreak = 0;
                    updated.lossStreak += 1;
                    updated.vazarothMessage = getVazarothLine('FAIL');
                    sendNotification("Task Failed", `${t.title} has been consumed by the Void.`);
                });
                
                if (newlyFailed.length > 0) {
                    const rival = updated.activeRivalId || 'RIVAL_KROG';
                    const pool = (DIALOGUE_POOLS[rival as keyof typeof DIALOGUE_POOLS] as any)?.PLAYER_FAIL || DIALOGUE_POOLS.RIVAL_KROG.PLAYER_FAIL;
                    const text = pool[Math.floor(Math.random() * pool.length)];
                    updated.activeDialogue = { id: generateId(), characterId: rival, text, mood: 'ANGRY', timestamp: now, duration: 6000 };
                }

                if (updated.mana < updated.maxMana) updated.mana = Math.min(updated.maxMana, updated.mana + 0.5);

                const simResult = simulateReactiveTurn(updated);
                updated.population = simResult.newPopulation;
                updated.realmStats = simResult.newStats;
                
                if (simResult.activeDialogue) {
                    updated.activeDialogue = simResult.activeDialogue;
                    playSfx('UI_HOVER'); 
                }
                
                if (simResult.goldChange !== 0) {
                    updated.gold = Math.max(0, (updated.gold || 0) + simResult.goldChange);
                    if (simResult.goldChange < 0 && Math.random() > 0.5) effectsUpdate.push({ id: generateId(), type: 'TEXT_DAMAGE', position: {x:0, y:3, z:0}, text: `${simResult.goldChange}g`, timestamp: now });
                    if (simResult.goldChange > 0) effectsUpdate.push({ id: generateId(), type: 'TEXT_GOLD', position: {x:0, y:2, z:0}, text: `+${simResult.goldChange}g`, timestamp: now });
                }
                if (simResult.manaChange !== 0) updated.mana = Math.max(0, Math.min(updated.maxMana, updated.mana + simResult.manaChange));
                if (simResult.hpChange !== 0) updated.baseHp = Math.min(updated.maxBaseHp, updated.baseHp + simResult.hpChange);

                updated.dailyNarrative = simResult.dailyNarrative; 

                if (simResult.spawnedEnemies && simResult.spawnedEnemies.length > 0) {
                     updated.enemies = [...updated.enemies, ...simResult.spawnedEnemies];
                }
                
                if (updated.activeDialogue && now - updated.activeDialogue.timestamp > updated.activeDialogue.duration) {
                    updated.activeDialogue = undefined;
                }

                const cleanEffects = effectsUpdate.filter(e => now - e.timestamp < 3000);

                if (Math.random() > 0.99) {
                    saveGame(updated);
                    if (updated.syncConfig?.isConnected && updated.syncConfig.roomId) {
                        pushToCloud(updated.syncConfig.roomId, updated);
                    }
                }

                return {
                    ...updated,
                    tasks: tasksUpdate,
                    history: [...historyUpdate, ...simResult.logs, ...updated.history].slice(0, 500),
                    effects: cleanEffects,
                    ...alertUpdate
                };
            });
            setLastTick(now);
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    // --- ACTIONS ---

    const addEffect = (type: VisualEffect['type'], position: {x:number, y:number, z:number}, text?: string) => {
        setState(prev => ({
            ...prev,
            effects: [...prev.effects, { id: generateId(), type, position, text, timestamp: Date.now() }]
        }));
    };
    
    // --- TASK ACTIONS ---

    const addTask = (title: string, startTime: number, deadline: number, priority: TaskPriority, subtasks: SubtaskDraft[], durationMinutes: number, description?: string, parentId?: string) => {
        const id = generateId();
        const newTask: Task = {
            id, title, description, startTime, deadline, estimatedDuration: durationMinutes, priority,
            completed: false, failed: false, subtasks: subtasks.map(s => ({ ...s, id: generateId(), completed: false })),
            parentId, createdAt: Date.now(), crisisTriggered: false, hubris: false
        };

        const enemy = generateNemesis(id, priority, state.nemesisGraveyard, state.winStreak, undefined, title, durationMinutes, state.realmStats || { hope: 50, fear: 10, order: 50 });
        
        if (priority === TaskPriority.HIGH) {
            enemy.factionId = CHARACTERS[state.activeRivalId || 'RIVAL_KROG'].race === 'ORC' ? 'ASH' : 'VAZAROTH'; 
            enemy.title = `${state.activeRivalId === 'RIVAL_KROG' ? 'Krog' : 'Vazaroth'}'s Chosen: ${enemy.name}`;
        }

        const minionEnemies = newTask.subtasks.map(sub => 
            generateNemesis(id, TaskPriority.LOW, [], 0, sub.id, sub.title, durationMinutes / newTask.subtasks.length, state.realmStats || { hope: 50, fear: 10, order: 50 })
        );

        setState(prev => {
            const next = {
                ...prev,
                tasks: [...prev.tasks, newTask],
                enemies: [...prev.enemies, enemy, ...minionEnemies],
                isGrimoireOpen: false,
                lastSyncTimestamp: Date.now() 
            };
            saveGame(next); 
            return next;
        });
        triggerDialogue(state.activeAllyId || 'MARSHAL_THORNE', DIALOGUE_POOLS.MARSHAL_THORNE.GREETING, 'NEUTRAL');
        playSfx('UI_CLICK');
    };

    const editTask = (taskId: string, data: any) => {
        setState(prev => {
            const tasks = prev.tasks.map(t => {
                if (t.id !== taskId) return t;
                let newSubtasks = t.subtasks;
                if (data.subtasks) {
                    newSubtasks = data.subtasks.map((s: any) => ({
                        ...s,
                        id: s.id || generateId(),
                        completed: s.completed || false
                    }));
                }
                return { ...t, ...data, subtasks: newSubtasks };
            });
            const next = { ...prev, tasks, isGrimoireOpen: false, lastSyncTimestamp: Date.now() };
            saveGame(next);
            return next;
        });
    };

    const moveTask = (taskId: string, newStartTime: number) => {
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;
            const duration = task.deadline - task.startTime;
            const newDeadline = newStartTime + duration;
            const next = {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, startTime: newStartTime, deadline: newDeadline } : t),
                lastSyncTimestamp: Date.now()
            };
            saveGame(next);
            return next;
        });
    };

    const deleteTask = (taskId: string) => {
        setState(prev => {
            const next = {
                ...prev,
                tasks: prev.tasks.filter(t => t.id !== taskId),
                enemies: prev.enemies.filter(e => e.taskId !== taskId),
                isGrimoireOpen: false,
                lastSyncTimestamp: Date.now()
            };
            saveGame(next);
            return next;
        });
    };

    const completeTask = (taskId: string) => {
        playSfx('VICTORY');
        const linkedEnemy = state.enemies.find(e => e.taskId === taskId && !e.subtaskId);
        if (state.isGrimoireOpen && linkedEnemy) {
            executeEnemy(linkedEnemy.id);
        }

        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            const rewardBase = task ? (task.priority || 1) * 150 : 150; 
            const newGold = (prev.gold || 0) + rewardBase;

            const enemies = prev.enemies.map(e => {
                if (e.taskId === taskId) return { ...e, executionReady: true };
                return e;
            });

            const next = {
                ...prev,
                militaryTech: (prev.militaryTech || 1) + 1,
                gold: newGold,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                enemies: enemies, 
                winStreak: prev.winStreak + 1,
                lossStreak: 0,
                lastSyncTimestamp: Date.now(),
                effects: [
                    ...prev.effects, 
                    { id: generateId(), type: 'SHOCKWAVE' as const, position: {x:0, y:0, z:0}, timestamp: Date.now() }, 
                    { id: generateId(), type: 'TEXT_GOLD' as const, position: {x:0, y:0, z:0}, text: `+${rewardBase}g`, timestamp: Date.now() } 
                ]
            };
            
            saveGame(next);
            return next;
        });
        
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.priority === TaskPriority.HIGH) {
            triggerDialogue(state.activeAllyId || 'MARSHAL_THORNE', DIALOGUE_POOLS.MARSHAL_THORNE.VICTORY, 'HAPPY');
        }
    };

    const executeEnemy = (enemyId: string) => {
        const enemy = state.enemies.find(e => e.id === enemyId);
        if (!enemy) return;

        playSfx('EXECUTION');

        const orbs: LootOrb[] = [];
        const orbCount = 3 + enemy.rank; 
        
        for (let i=0; i<orbCount; i++) {
            const isMaterial = Math.random() < 0.3;
            let type: any = Math.random() > 0.7 ? 'XP' : 'GOLD';
            let materialType: MaterialType | undefined = undefined;

            if (isMaterial) {
                type = 'MATERIAL';
                const roll = Math.random();
                if (state.winStreak > 5 && roll > 0.9) materialType = 'ASTRAL';
                else if (enemy.priority === TaskPriority.HIGH && roll > 0.7) materialType = 'OBSIDIAN';
                else materialType = Math.random() > 0.5 ? 'IRON' : 'WOOD';
            }

            orbs.push({
                id: generateId(), type, material: materialType,
                value: (enemy.priority * 50) + Math.floor(Math.random() * 50),
                position: { ...enemy.position, y: 1.5 },
                velocity: { x: (Math.random() - 0.5) * 0.4, y: 0.3 + (Math.random() * 0.4), z: (Math.random() - 0.5) * 0.4 },
                createdAt: Date.now()
            });
        }

        addEffect('EXPLOSION', enemy.position);
        addEffect('TEXT_DAMAGE', { ...enemy.position, y: 3 }, "EXECUTED!");

        setState(prev => ({
            ...prev,
            enemies: prev.enemies.filter(e => e.id !== enemyId),
            lootOrbs: [...(prev.lootOrbs || []), ...orbs],
            nemesisGraveyard: [...prev.nemesisGraveyard, { name: enemy.name, clan: enemy.clan, deathTime: Date.now(), killer: 'HERO' }]
        }));
    };

    const collectLoot = (orbId: string) => {
        const orb = state.lootOrbs?.find(o => o.id === orbId);
        if (!orb) return;

        playSfx('LOOT_COLLECT');

        setState(prev => {
            let next = { ...prev };
            next.lootOrbs = next.lootOrbs.filter(o => o.id !== orbId);
            
            if (orb.type === 'GOLD') {
                next.gold = (next.gold || 0) + orb.value;
                next.effects = [...next.effects, { id: generateId(), type: 'TEXT_GOLD' as const, position: orb.position, text: `+${orb.value}g`, timestamp: Date.now() }];
            } else if (orb.type === 'XP') {
                next.xp += orb.value;
                const xpReq = next.playerLevel * 1000;
                if (next.xp >= xpReq) {
                    next.playerLevel++;
                    next.xp -= xpReq;
                    playSfx('VICTORY');
                    next.history = [{ id: generateId(), type: 'VICTORY', timestamp: Date.now(), message: `Level Up! Rank ${next.playerLevel}`, details: "The Hero grows stronger." } as HistoryLog, ...next.history];
                }
                next.effects = [...next.effects, { id: generateId(), type: 'TEXT_XP' as const, position: orb.position, text: `+${orb.value} XP`, timestamp: Date.now() }];
            } else if (orb.type === 'MATERIAL' && orb.material) {
                next.materials = { ...next.materials, [orb.material]: (next.materials[orb.material] || 0) + 1 };
                next.effects = [...next.effects, { id: generateId(), type: 'TEXT_LOOT' as const, position: orb.position, text: `${orb.material}`, timestamp: Date.now() }];
            }
            
            return next;
        });
    };

    const buyItem = (itemId: string) => {
        const dynamicItems = getDynamicShopItems(state);
        const item = dynamicItems.find(i => i.id === itemId);
        if (!item) return;
        if (state.gold < item.cost) { playSfx('ERROR'); return; }
        
        setState(prev => {
            let next = { ...prev, gold: prev.gold - item.cost };
            playSfx('COINS');
            
            if (item.type === 'HEAL_HERO') next.heroHp = Math.min(next.maxHeroHp, next.heroHp + item.value);
            if (item.type === 'HEAL_BASE') next.baseHp = Math.min(next.maxBaseHp, next.baseHp + item.value);
            
            if (item.type === 'MERCENARY') {
                const combatStats = { damage: 15 + (prev.militaryTech || 0), range: 2, attackSpeed: 1, lastAttack: 0 };
                next.minions.push({ 
                    id: generateId(), type: 'WARRIOR', hp: 50 + (prev.militaryTech * 5), maxHp: 50 + (prev.militaryTech * 5),
                    combat: combatStats, position: {x: 2, y:0, z:2}, createdAt: Date.now(), targetEnemyId: null 
                });
            }

            if (item.id === 'MYSTERY_BOX') {
                const loot = generateLoot(prev.playerLevel + 5); 
                if (loot) {
                    const newItem: Item = {
                        id: generateId(), type: loot.type as any, name: loot.name, lore: loot.lore,
                        value: (prev.playerLevel * 50) + 100, acquiredAt: Date.now(), isEquipped: false, rarity: 'RARE'
                    };
                    next.inventory.push(newItem);
                    next.effects.push({ id: generateId(), type: 'TEXT_LOOT', position: {x:0, y:0, z:0}, text: "RARE ITEM!", timestamp: Date.now() });
                }
            }

            if (item.type.startsWith('UPGRADE_')) {
                if (item.type === 'UPGRADE_FORGE') next.structures.forgeLevel += 1;
                if (item.type === 'UPGRADE_WALLS') { next.structures.wallsLevel += 1; next.maxBaseHp += item.value; next.baseHp += item.value; }
                if (item.type === 'UPGRADE_LIBRARY') next.structures.libraryLevel += 1;
                if (item.type === 'UPGRADE_LIGHTS') next.structures.lightingLevel = (next.structures.lightingLevel || 0) + 1;
            }
            next.history = [{ id: generateId(), type: 'TRADE', timestamp: Date.now(), message: `Purchased ${item.name}`, details: `-${item.cost}g` } as HistoryLog, ...next.history];
            next.lastSyncTimestamp = Date.now();
            saveGame(next);
            return next;
        });
        triggerDialogue('SENESCHAL_MORVATH', DIALOGUE_POOLS.SENESCHAL_MORVATH.GOLD_GAIN, 'HAPPY'); 
    };

    const craftItem = (tier: number, materialsCost: Record<MaterialType, number>) => {
        setState(prev => {
            const mats = { ...prev.materials };
            for (const [key, cost] of Object.entries(materialsCost)) {
                if ((mats[key as MaterialType] || 0) < cost) { playSfx('ERROR'); return prev; }
            }
            for (const [key, cost] of Object.entries(materialsCost)) {
                mats[key as MaterialType] -= cost;
            }

            const level = tier * 20; 
            const loot = generateLoot(level) || { type: 'WEAPON', name: `Forged Blade T${tier}`, lore: "A simple weapon forged in desperation." };
            const newItem: Item = {
                id: generateId(), type: loot.type as any, name: loot.name, lore: loot.lore,
                value: tier * 50, acquiredAt: Date.now(), isEquipped: false, rarity: tier >= 4 ? 'LEGENDARY' : tier >= 3 ? 'RARE' : 'COMMON'
            };

            playSfx('MAGIC');
            return {
                ...prev, materials: mats, inventory: [...prev.inventory, newItem],
                history: [{ id: generateId(), type: 'CRAFT', timestamp: Date.now(), message: `Crafted ${newItem.name}`, details: `Used ${materialsCost.IRON || 0} Iron...` } as HistoryLog, ...prev.history],
                lastSyncTimestamp: Date.now()
            };
        });
    };

    // --- VISION MIRROR LOGIC ---
    const fetchSheetData = async (sheetIdOrUrl: string): Promise<string[]> => {
        if (!sheetIdOrUrl) return [];
        let url = sheetIdOrUrl;
        if (!url.startsWith('http')) {
            url = `https://docs.google.com/spreadsheets/d/${sheetIdOrUrl}/export?format=csv`;
        } else if (url.includes('/edit')) {
            url = url.replace(/\/edit.*$/, '/export?format=csv');
        }
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Sheet fetch failed');
            const text = await res.text();
            const urls: string[] = [];
            const rows = text.split('\n');
            rows.forEach(row => {
                const cols = row.split(',');
                cols.forEach(cell => {
                    const clean = cell.replace(/['"]+/g, '').trim();
                    if (clean.startsWith('http')) urls.push(clean);
                });
            });
            return urls;
        } catch (e) {
            console.warn("Failed to fetch sheet:", e);
            return [];
        }
    };

    const rerollVision = async () => {
        // Safe access to settings
        const settings = (state.settings || {}) as GameSettings; 
        let pool: string[] = []; 

        // 1. Collect Manual List
        if (settings.directVisionUrl) {
            const manual = settings.directVisionUrl.split(/[\n,\s]+/).filter(u => u.startsWith('http'));
            pool = [...pool, ...manual];
        }

        // 2. Collect Sheet Data
        if (settings.googleSheetId) {
            const sheet1 = await fetchSheetData(settings.googleSheetId);
            pool = [...pool, ...sheet1];
        }
        if (settings.googleSheetId2) {
            const sheet2 = await fetchSheetData(settings.googleSheetId2);
            pool = [...pool, ...sheet2];
        }

        // 3. Fallback to STATIC if empty
        if (pool.length === 0) {
            setState(prev => ({
                ...prev,
                activeVisionVideo: "NO_SIGNAL", // TRIGGER STATIC
                seenVisionUrls: [] // Reset seen list if empty
            }));
            return;
        }

        // 4. Cycle Logic (No Repeats)
        const seen = new Set(state.seenVisionUrls || []);
        let available = pool.filter(url => !seen.has(url));

        let resetSeen = false;
        if (available.length === 0) {
            available = pool; // Restart Cycle
            resetSeen = true;
        }

        // 5. Pick Random
        const pick = available[Math.floor(Math.random() * available.length)];

        // 6. Update State
        setState(prev => ({
            ...prev,
            activeVisionVideo: pick,
            seenVisionUrls: resetSeen ? [pick] : [...(prev.seenVisionUrls || []), pick]
        }));
    };

    const closeVision = () => setState(prev => ({ ...prev, activeMapEvent: 'NONE', activeVisionVideo: null }));
    const triggerEvent = (type: MapEventType) => setState(prev => ({ ...prev, activeMapEvent: type }));
    
    // --- BOILERPLATE HELPERS ---
    const partialCompleteTask = (taskId: string, percentage: number) => { /* ... existing logic ... */ };
    const completeSubtask = (taskId: string, subtaskId: string) => { /* ... existing logic ... */ };
    const failTask = (taskId: string) => { 
        setState(prev => {
            const next = { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, failed: true } : t), lastSyncTimestamp: Date.now() };
            saveGame(next);
            return next;
        });
        triggerDialogue('ORACLE_ELARA', DIALOGUE_POOLS.ORACLE_ELARA.ACT_CHANGE); 
    };
    const resolveFailedTask = (taskId: string, action: 'RESCHEDULE' | 'MERGE', newTime?: number) => { /* ... existing logic ... */ };
    const toggleGrimoire = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isGrimoireOpen: !p.isGrimoireOpen, activeAlert: AlertType.NONE })); };
    const toggleProfile = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isProfileOpen: !p.isProfileOpen })); };
    const toggleMarket = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isMarketOpen: !p.isMarketOpen, vazarothMessage: getVazarothLine('MARKET') })); };
    const toggleAudit = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isAuditOpen: !p.isAuditOpen })); };
    const toggleSettings = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isSettingsOpen: !p.isSettingsOpen })); };
    const toggleDiplomacy = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isDiplomacyOpen: !p.isDiplomacyOpen })); };
    const toggleForge = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isForgeOpen: !p.isForgeOpen })); };
    const toggleChronos = () => { playSfx('MAGIC'); setIsChronosOpen(prev => !prev); };
    const resolveCrisisHubris = (taskId: string) => setState(prev => ({ ...prev, activeAlert: AlertType.NONE, alertTaskId: null }));
    const resolveCrisisHumility = (taskId: string) => setState(prev => ({ ...prev, activeAlert: AlertType.AEON_ENCOUNTER }));
    const resolveAeonBattle = (taskId: string, newSubtasks: string[], success: boolean) => { /* ... existing logic ... */ };
    
    const sellItem = (itemId: string) => { 
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return;
        setState(prev => ({
            ...prev,
            gold: prev.gold + Math.floor(item.value / 2),
            inventory: prev.inventory.filter(i => i.id !== itemId),
            history: [{ id: generateId(), type: 'TRADE', timestamp: Date.now(), message: `Sold ${item.name}`, details: `+${Math.floor(item.value/2)}g` } as HistoryLog, ...prev.history]
        }));
        playSfx('COINS');
    };
    const equipItem = (itemId: string) => { 
        const item = state.inventory.find(i => i.id === itemId);
        if(!item) return;
        setState(prev => {
            let nextEquip = { ...prev.heroEquipment };
            if(item.type === 'WEAPON') nextEquip.weapon = item.name;
            if(item.type === 'ARMOR') nextEquip.armor = item.name;
            if(item.type === 'RELIC') nextEquip.relic = item.name;
            return { ...prev, heroEquipment: nextEquip };
        });
        playSfx('UI_CLICK');
    };
    const selectEnemy = (id: string | null) => setState(p => ({ ...p, selectedEnemyId: id }));
    const interactWithFaction = (factionId: FactionKey, action: string) => { /* ... existing logic ... */ };
    const interactWithNPC = (id: string) => playSfx('UI_HOVER');
    const castSpell = (spellId: string) => { /* ... existing logic ... */ };
    const saveTemplate = (t: Omit<TaskTemplate, 'id'>) => { /* ... existing logic ... */ };
    const deleteTemplate = (id: string) => { /* ... existing logic ... */ };
    const updateSettings = (s: any) => setState(p => ({ ...p, settings: { ...p.settings, ...s } }));
    const requestPermissions = async () => { if (typeof Notification !== 'undefined') { const res = await Notification.requestPermission(); if (res === 'granted') sendNotification("System", "Neural Link Established."); } };
    const triggerRitual = (type: AlertType) => setState(p => ({ ...p, activeAlert: type }));
    const completeRitual = () => setState(p => ({ ...p, activeAlert: AlertType.NONE }));
    const clearSave = () => { localStorage.clear(); window.location.reload(); };
    const exportSave = () => JSON.stringify(state);
    const importSave = (data: string) => { try { const s = JSON.parse(data); setState(s); saveGame(s); return true; } catch { return false; } };
    const connectToCloud = async () => false;
    const loginWithGoogle = async () => { await firebaseLogin(); };
    const logout = async () => { await firebaseLogout(); };
    const disconnectCloud = () => {};
    const testCloudConnection = () => testConnection(state.syncConfig?.roomId || 'test');
    const forcePull = () => {};
    const takeBaseDamage = (n: number) => setState(p => ({ ...p, baseHp: p.baseHp - n }));
    const resolveNightPhase = () => { triggerEvent('BATTLE_CINEMATIC'); };
    const closeBattleReport = () => setState(p => ({ ...p, activeAlert: AlertType.NONE, lastBattleReport: undefined }));
    const dismissDialogue = () => setState(p => ({ ...p, activeDialogue: undefined }));

    const extendedContext = {
        state,
        isChronosOpen, 
        toggleChronos, 
        addTask, editTask, moveTask, deleteTask, completeTask, partialCompleteTask, completeSubtask, failTask,
        selectEnemy, resolveCrisisHubris, resolveCrisisHumility, resolveAeonBattle, resolveFailedTask,
        triggerRitual, triggerEvent, completeRitual,
        toggleGrimoire, toggleProfile, toggleMarket, toggleAudit, toggleSettings, toggleDiplomacy, toggleForge,
        interactWithFaction, buyItem, sellItem, equipItem, craftItem,
        clearSave, exportSave, importSave,
        connectToCloud, loginWithGoogle, logout, disconnectCloud,
        addEffect, closeVision, rerollVision, interactWithNPC, updateSettings, castSpell,
        testCloudConnection, forcePull, saveTemplate, deleteTemplate, requestPermissions, takeBaseDamage,
        resolveNightPhase, closeBattleReport, dismissDialogue,
        executeEnemy, collectLoot 
    };

    return (
        <GameContext.Provider value={extendedContext as any}>
            {children}
        </GameContext.Provider>
    );
};
