
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { GameState, GameContextType, TaskPriority, Task, Era, AlertType, VisualEffect, FirebaseConfig, MapEventType, ShopItem, EnemyEntity, GameSettings, FactionKey, MinionEntity, WeatherType } from '../types';
import { loadGame, saveGame } from '../utils/saveSystem';
import { generateId, generateNemesis, generateSpawnPosition, getSageWisdom, getVazarothLine, fetchMotivationVideos, generateWorldRumor, generateHeroEquipment, generateLoot } from '../utils/generators';
import { simulateReactiveTurn, initializePopulation, updateRealmStats } from '../utils/worldSim';
import { initFirebase, pushToCloud, subscribeToCloud, disconnect } from '../services/firebase';
import { ERA_CONFIG, LEVEL_THRESHOLDS } from '../constants';
import { playSfx, initAudio, startAmbientDrone, setVolume } from '../utils/audio';

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'POTION', name: 'Potion of Clarity', description: 'Restores 30 Hero HP.', cost: 50, type: 'HEAL_HERO', value: 30 },
    { id: 'MASONRY', name: 'Masonry Kit', description: 'Repairs 20 Base HP.', cost: 80, type: 'HEAL_BASE', value: 20 },
    { id: 'MERCENARY', name: 'Contract: Shadowblade', description: 'Hires a mercenary to auto-complete a low tier task.', cost: 150, type: 'MERCENARY', value: 1 },
    { id: 'FORGE_UP', name: 'Upgrade Forge', description: 'Better equipment for troops.', cost: 300, type: 'UPGRADE_FORGE', value: 1 },
    { id: 'WALL_UP', name: 'Reinforce Walls', description: 'Increases Base Max HP.', cost: 400, type: 'UPGRADE_WALLS', value: 1 }
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within GameProvider");
    return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(loadGame());
    const [lastTick, setLastTick] = useState<number>(Date.now());
    const [audioStarted, setAudioStarted] = useState(false);
    
    // IDLE SYSTEM REFS
    const lastInteractionTime = useRef<number>(Date.now());
    const idleStage = useRef<number>(0); // 0 = Active, 1 = Warning (45s), 2 = Punish (120s)

    const cloudUnsubRef = useRef<(() => void) | null>(null);

    // --- IDLE DETECTION ---
    const resetIdleTimer = useCallback(() => {
        lastInteractionTime.current = Date.now();
        if (idleStage.current !== 0) {
            idleStage.current = 0;
            // Clear Vazaroth's taunt when user returns
            setState(p => ({ ...p, activeMapEvent: 'NONE', vazarothMessage: getVazarothLine('IDLE') }));
        }
    }, []);

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        
        if(state.settings) {
            setVolume(state.settings.masterVolume);
        }
        if(state.population.length === 0) {
            setState(p => ({...p, population: initializePopulation(5)}));
        }

        return () => events.forEach(e => window.removeEventListener(e, resetIdleTimer));
    }, [resetIdleTimer]);

    // --- GAME LOOP ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setLastTick(now);
            
            // IDLE CHECK
            const idleTime = now - lastInteractionTime.current;
            
            // Only punish idle if no modal is open (user might be reading)
            const isSafe = state.isGrimoireOpen || state.isProfileOpen || state.isSettingsOpen;
            
            if (!isSafe) {
                // Stage 1: PEASANT RAID (Humiliation) (> 45s)
                if (idleTime > 45000 && idleStage.current === 0) {
                    idleStage.current = 1;
                    setState(p => ({ 
                        ...p, 
                        vazarothMessage: "My peasants mock your silence.",
                        activeMapEvent: 'PEASANT_RAID' // Vazaroth sends the plebs
                    }));
                    playSfx('ERROR'); 
                }
                // Stage 2: Manifestation (> 2m)
                if (idleTime > 120000 && idleStage.current === 1) {
                    idleStage.current = 2;
                    const eventType = Math.random() > 0.5 ? 'TREMOR' : 'VOID_STORM';
                    setState(p => ({ 
                        ...p, 
                        activeMapEvent: eventType as MapEventType,
                        vazarothMessage: "I am taking this world while you sleep.",
                        effects: [...p.effects, { id: generateId(), type: 'TEXT_DAMAGE', position: {x:0, y:5, z:0}, text: "WAKE UP", timestamp: now }]
                    }));
                    playSfx('FAILURE');
                }
            }

            setState(prev => {
                let newState = { ...prev };
                let needsSave = false;
                const effects: VisualEffect[] = [...prev.effects];
                
                // MINION LOGIC (The Army)
                let remainingEnemies = [...prev.enemies];
                let remainingMinions: MinionEntity[] = [];

                if (prev.minions && prev.minions.length > 0) {
                    prev.minions.forEach(minion => {
                        let newPos = { ...minion.position };
                        let target = minion.targetEnemyId ? remainingEnemies.find(e => e.id === minion.targetEnemyId) : null;
                        
                        if (!target && remainingEnemies.length > 0) {
                            target = remainingEnemies.reduce((closest, curr) => {
                                const distCurr = Math.hypot(curr.position.x - minion.position.x, curr.position.z - minion.position.z);
                                const distClosest = Math.hypot(closest.position.x - minion.position.x, closest.position.z - minion.position.z);
                                return distCurr < distClosest ? curr : closest;
                            });
                        }

                        if (target) {
                            const dx = target.position.x - minion.position.x;
                            const dz = target.position.z - minion.position.z;
                            const dist = Math.sqrt(dx*dx + dz*dz);
                            
                            if (dist > 1.5) {
                                newPos.x += (dx / dist) * 0.1;
                                newPos.z += (dz / dist) * 0.1;
                                remainingMinions.push({ ...minion, position: newPos, targetEnemyId: target.id });
                            } else {
                                remainingEnemies = remainingEnemies.map(e => {
                                    if (e.id === target!.id) {
                                        const dmg = 25 + (prev.structures.forgeLevel * 5);
                                        effects.push({ id: generateId(), type: 'TEXT_DAMAGE', position: { ...e.position, y: 2 }, text: `-${dmg}`, timestamp: now });
                                        effects.push({ id: generateId(), type: 'EXPLOSION', position: e.position, timestamp: now });
                                        return { ...e, hp: e.hp - dmg };
                                    }
                                    return e;
                                }).filter(e => e.hp > 0);
                                playSfx('COMBAT_HIT');
                            }
                        } else {
                            const angle = (now * 0.001) + (parseInt(minion.id.slice(-3), 36)); 
                            const radius = 6 + Math.sin(now * 0.0005) * 2;
                            newPos.x = Math.cos(angle) * radius;
                            newPos.z = Math.sin(angle) * radius;
                            remainingMinions.push({ ...minion, position: newPos });
                        }
                    });
                    newState.enemies = remainingEnemies;
                    newState.minions = remainingMinions;
                    newState.effects = [...newState.effects, ...effects];
                }

                // 1. Check Deadlines
                newState.tasks.forEach(task => {
                    if (task.completed || task.failed) return;
                    
                    if (now > task.deadline) {
                        task.failed = true;
                        newState.heroHp = Math.max(0, newState.heroHp - (10 * task.priority));
                        newState.lossStreak += 1;
                        newState.winStreak = 0;
                        newState.vazarothMessage = getVazarothLine("FAIL", newState.lossStreak);
                        newState.sageMessage = getSageWisdom("FAIL");
                        playSfx('FAILURE');
                        
                        const enemy = newState.enemies.find(e => e.taskId === task.id);
                        let graveyardUpdate = prev.nemesisGraveyard || [];
                        if (enemy) {
                             graveyardUpdate = [...graveyardUpdate, { name: enemy.name, clan: enemy.clan, deathTime: now, killer: 'TIME' }].slice(-10);
                        }

                        const sim = simulateReactiveTurn(newState, 'DEFEAT');
                        newState.population = sim.newPopulation;
                        newState.history = [...sim.logs, ...newState.history];
                        newState.realmStats = sim.newStats;
                        newState.factions = sim.newFactions;
                        
                        if (sim.spawnedEnemies && sim.spawnedEnemies.length > 0) {
                            newState.enemies = [...newState.enemies, ...sim.spawnedEnemies];
                            playSfx('ERROR'); 
                        }
                        newState.nemesisGraveyard = graveyardUpdate;
                        newState.enemies = newState.enemies.filter(e => e.taskId !== task.id); 
                        needsSave = true;
                    } 
                    else if (!task.crisisTriggered) {
                        const totalTime = task.deadline - task.createdAt;
                        const elapsed = now - task.createdAt;
                        if (elapsed / totalTime > 0.75) {
                            task.crisisTriggered = true;
                            if (prev.activeAlert === AlertType.NONE) {
                                newState.activeAlert = AlertType.CRISIS;
                                newState.alertTaskId = task.id;
                                newState.sageMessage = getSageWisdom("CRISIS");
                                playSfx('ERROR');
                            }
                            needsSave = true;
                        }
                    }
                });

                // 2. Passive World Simulation
                if (now - (prev.worldGenerationDay || 0) > 60000) { 
                    const sim = simulateReactiveTurn(prev);
                    newState.population = sim.newPopulation;
                    newState.history = [...sim.logs, ...prev.history];
                    newState.realmStats = sim.newStats;
                    newState.factions = sim.newFactions;
                    newState.worldGenerationDay = now;
                    
                    let nextWeather: WeatherType = 'CLEAR';
                    if (newState.realmStats.fear > 70) nextWeather = 'ASH_STORM';
                    else if (newState.realmStats.hope < 30) nextWeather = 'RAIN';
                    else if (newState.realmStats.order < 30) nextWeather = 'VOID_MIST';
                    else nextWeather = 'CLEAR';

                    if (nextWeather !== newState.weather) {
                        newState.weather = nextWeather;
                    }
                    
                    if (sim.spawnedEnemies && sim.spawnedEnemies.length > 0) {
                        newState.enemies = [...newState.enemies, ...sim.spawnedEnemies];
                    }
                    if (sim.goldChange) newState.gold = Math.max(0, newState.gold + sim.goldChange);
                    if (sim.hpChange) newState.heroHp = Math.max(0, newState.heroHp + sim.hpChange);

                    if (Math.random() > 0.6) {
                        const rumor = generateWorldRumor();
                        newState.activeRumor = { id: generateId(), ...rumor, timestamp: now };
                    }
                    needsSave = true;
                }

                if (newState.effects.length > 20) newState.effects = newState.effects.slice(-20);

                if (needsSave) saveGame(newState);
                
                if (newState.syncConfig?.isConnected && now - (prev.lastSyncTimestamp || 0) > 5000) {
                     pushToCloud(newState.syncConfig.roomId, newState);
                     newState.lastSyncTimestamp = now;
                }

                return newState;
            });
        }, 50); 

        return () => clearInterval(interval);
    }, []);

    const ensureAudio = () => {
        if (!audioStarted) {
            initAudio();
            startAmbientDrone();
            setVolume(state.settings.masterVolume);
            setAudioStarted(true);
        }
    };

    const addTask = (title: string, deadline: number, priority: TaskPriority, subtasks: string[], durationMinutes: number, description?: string, parentId?: string) => {
        ensureAudio();
        resetIdleTimer();
        playSfx('UI_CLICK');
        const taskId = generateId();
        const newTask: Task = {
            id: taskId,
            title,
            deadline,
            estimatedDuration: durationMinutes,
            createdAt: Date.now(),
            priority,
            subtasks: subtasks.map(s => ({ id: generateId(), title: s, completed: false })),
            completed: false,
            failed: false,
            crisisTriggered: false,
            hubris: false,
            description,
            parentId
        };

        const newEnemy: EnemyEntity = generateNemesis(taskId, priority, state.nemesisGraveyard || [], state.winStreak);
        const sageLine = getSageWisdom('GENERAL');

        setState(prev => {
            const next = {
                ...prev,
                tasks: [...prev.tasks, newTask],
                enemies: [...prev.enemies, newEnemy],
                sageMessage: sageLine,
                vazarothMessage: getVazarothLine("IDLE") // Reset Vazaroth
            };
            saveGame(next);
            return next;
        });
    };

    const completeTask = (taskId: string) => {
        ensureAudio();
        resetIdleTimer();
        playSfx('VICTORY');
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;

            const xpGain = 100 * task.priority;
            const goldGain = 50 * task.priority;
            const nextLevel = Math.floor((prev.xp + xpGain) / 1000) + 1;
            const didLevelUp = nextLevel > prev.playerLevel;
            const enemy = prev.enemies.find(e => e.taskId === taskId);
            
            let graveyardUpdate = prev.nemesisGraveyard || [];
            if (enemy) graveyardUpdate = [...graveyardUpdate, { name: enemy.name, clan: enemy.clan, deathTime: Date.now(), killer: 'HERO' }].slice(-10);

            const effects: VisualEffect[] = [];
            if (enemy) {
                effects.push({ id: generateId(), type: 'EXPLOSION', position: enemy.position, timestamp: Date.now() });
                effects.push({ id: generateId(), type: 'TEXT_XP', position: { ...enemy.position, y: 3 }, text: `+${xpGain} XP`, timestamp: Date.now() });
            }

            let newEquipment = { ...prev.heroEquipment };
            const loot = generateLoot(nextLevel);
            if (loot) {
                if (loot.type === 'WEAPON') newEquipment.weapon = loot.name;
                if (loot.type === 'ARMOR') newEquipment.armor = loot.name;
                if (loot.type === 'RELIC') newEquipment.relic = loot.name;
                effects.push({ id: generateId(), type: 'TEXT_LOOT', position: { x: 4, y: 3, z: 4 }, text: `FOUND: ${loot.name}`, timestamp: Date.now() });
            }
            if (didLevelUp && !loot) newEquipment = generateHeroEquipment(nextLevel);

            const newMinion: MinionEntity = { id: generateId(), type: 'WARRIOR', position: { x: 4, y: 0, z: 4 }, targetEnemyId: null, createdAt: Date.now() };
            const sim = simulateReactiveTurn(prev, 'VICTORY');

            let newEra = prev.era;
            if (nextLevel >= LEVEL_THRESHOLDS.KING) newEra = Era.KING;
            else if (nextLevel >= LEVEL_THRESHOLDS.GENERAL) newEra = Era.GENERAL;
            else if (nextLevel >= LEVEL_THRESHOLDS.CAPTAIN) newEra = Era.CAPTAIN;

            const next: GameState = {
                ...prev,
                playerLevel: nextLevel,
                xp: prev.xp + xpGain,
                gold: prev.gold + goldGain,
                winStreak: prev.winStreak + 1,
                lossStreak: 0,
                era: newEra,
                maxBaseHp: ERA_CONFIG[newEra].maxBaseHp + (prev.structures.wallsLevel * 50),
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                enemies: prev.enemies.filter(e => e.taskId !== taskId),
                minions: [...(prev.minions || []), newMinion], 
                effects: [...prev.effects, ...effects],
                sageMessage: didLevelUp ? "Ascension achieved." : getSageWisdom("STREAK"),
                vazarothMessage: getVazarothLine("WIN", prev.winStreak + 1),
                population: sim.newPopulation,
                realmStats: sim.newStats,
                factions: sim.newFactions,
                nemesisGraveyard: graveyardUpdate,
                heroEquipment: newEquipment,
                history: [{ id: generateId(), type: loot ? 'LOOT' : 'VICTORY', timestamp: Date.now(), message: `Vanquished ${task.title}`, details: "Glory to the realm." }, ...sim.logs, ...prev.history],
                selectedEnemyId: null,
                isProfileOpen: false 
            };
            saveGame(next);
            return next;
        });
    };

    const failTask = (taskId: string) => {
        ensureAudio();
        resetIdleTimer();
        playSfx('FAILURE');
        setState(prev => {
            const sim = simulateReactiveTurn(prev, 'DEFEAT');
            const enemy = prev.enemies.find(e => e.taskId === taskId);
            let graveyardUpdate = prev.nemesisGraveyard || [];
            if (enemy) graveyardUpdate = [...graveyardUpdate, { name: enemy.name, clan: enemy.clan, deathTime: Date.now(), killer: 'TIME' }].slice(-10);

            const next: GameState = {
                ...prev,
                heroHp: Math.max(0, prev.heroHp - 20),
                lossStreak: prev.lossStreak + 1,
                winStreak: 0,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, failed: true } : t),
                enemies: prev.enemies.filter(e => e.taskId !== taskId),
                vazarothMessage: getVazarothLine("FAIL"),
                sageMessage: getSageWisdom("FAIL"),
                population: sim.newPopulation,
                realmStats: sim.newStats,
                factions: sim.newFactions,
                nemesisGraveyard: graveyardUpdate,
                history: [{ id: generateId(), type: 'DEFEAT', timestamp: Date.now(), message: `Failed to stop the enemy.`, details: `The realm shudders in fear.` }, ...sim.logs, ...prev.history],
                selectedEnemyId: null
            };
            saveGame(next);
            return next;
        });
    };

    const completeSubtask = (taskId: string, subtaskId: string) => {
        ensureAudio();
        resetIdleTimer();
        playSfx('COMBAT_HIT');
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;
            const enemy = prev.enemies.find(e => e.taskId === taskId);
            const effects: VisualEffect[] = [];
            if (enemy) {
                const dmg = 10 + (prev.structures.forgeLevel * 2);
                enemy.hp = Math.max(0, enemy.hp - dmg);
                effects.push({ id: generateId(), type: 'TEXT_DAMAGE', position: { ...enemy.position, y: 2 }, text: `-${dmg}`, timestamp: Date.now() });
            }
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: true } : s) } : t),
                enemies: prev.enemies.map(e => e.taskId === taskId ? { ...e, hp: Math.max(0, e.hp - 10) } : e),
                effects: [...prev.effects, ...effects]
            };
        });
    };

    const interactWithFaction = (factionId: FactionKey, action: 'GIFT' | 'TRADE' | 'INSULT' | 'PROPAGANDA') => {
        ensureAudio();
        resetIdleTimer();
        playSfx('UI_CLICK');
        setState(prev => {
            const faction = prev.factions.find(f => f.id === factionId);
            if (!faction) return prev;
            let cost = 0; let repChange = 0; let msg = '';
            
            if (action === 'GIFT') { cost = 50; repChange = 10; msg = `Sent a gift to ${faction.name}.`; } 
            else if (action === 'TRADE') { cost = 20; repChange = 5; msg = `Established trade route with ${faction.name}.`; } 
            else if (action === 'INSULT') { repChange = -20; msg = `Insulted the emissary of ${faction.name}.`; } 
            else if (action === 'PROPAGANDA') { cost = 100; repChange = -30; msg = `Spread lies about ${faction.name}.`; }

            if (prev.gold < cost) { playSfx('ERROR'); return prev; }

            const newFactions = prev.factions.map(f => {
                if (f.id !== factionId) return f;
                const newRep = Math.max(-100, Math.min(100, f.reputation + repChange));
                let newStatus = f.status;
                if (newRep > 80) newStatus = 'ALLIED'; else if (newRep > 20) newStatus = 'FRIENDLY'; else if (newRep < -20) newStatus = 'HOSTILE'; else if (newRep < -80) newStatus = 'WAR'; else newStatus = 'NEUTRAL';
                return { ...f, reputation: newRep, status: newStatus as any };
            });
            const newStats = { ...prev.realmStats };
            if (action === 'PROPAGANDA') { newStats.hope = Math.min(100, newStats.hope + 10); newStats.order = Math.min(100, newStats.order + 5); }

            saveGame({ ...prev, gold: prev.gold - cost, factions: newFactions, realmStats: newStats, history: [{ id: generateId(), timestamp: Date.now(), type: 'DIPLOMACY', message: msg, details: `Reputation changed by ${repChange}.` }, ...prev.history] });
            return { ...prev, gold: prev.gold - cost, factions: newFactions, realmStats: newStats, history: [{ id: generateId(), timestamp: Date.now(), type: 'DIPLOMACY', message: msg, details: `Reputation changed by ${repChange}.` }, ...prev.history] };
        });
    };

    const buyItem = (itemId: string) => {
        ensureAudio();
        resetIdleTimer();
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return;
        if (state.gold < item.cost) { playSfx('ERROR'); return; }
        playSfx('UI_CLICK');
        setState(prev => {
            let updates: Partial<GameState> = { gold: prev.gold - item.cost };
            let newStructs = { ...prev.structures };
            const nextStats = updateRealmStats(prev.realmStats || {hope:50, fear:10, order:50}, 'TRADE');
            updates.realmStats = nextStats;
            if (item.type === 'HEAL_HERO') updates.heroHp = Math.min(prev.maxHeroHp, prev.heroHp + item.value);
            if (item.type === 'HEAL_BASE') updates.baseHp = Math.min(prev.maxBaseHp, prev.baseHp + item.value);
            if (item.type === 'UPGRADE_FORGE') newStructs.forgeLevel += 1;
            if (item.type === 'UPGRADE_WALLS') { newStructs.wallsLevel += 1; updates.maxBaseHp = prev.maxBaseHp + 50; }
            if (item.type === 'MERCENARY') { const target = prev.tasks.find(t => t.priority === TaskPriority.LOW && !t.completed && !t.failed); if (target) setTimeout(() => completeTask(target.id), 500); }
            updates.structures = newStructs;
            const next = { ...prev, ...updates, vazarothMessage: getVazarothLine('MARKET') };
            saveGame(next);
            return next;
        });
    };

    const connectToCloud = async (config: FirebaseConfig, roomId: string) => {
        ensureAudio();
        resetIdleTimer();
        playSfx('UI_CLICK');
        const success = initFirebase(config);
        if (success) {
            setState(prev => ({ ...prev, syncConfig: { firebase: config, roomId, isConnected: true } }));
            subscribeToCloud(roomId, (data) => { playSfx('UI_CLICK'); setState(current => ({ ...current, ...data, syncConfig: { ...current.syncConfig!, isConnected: true } })); });
            return true;
        }
        playSfx('ERROR'); return false;
    };

    const triggerEvent = (type: MapEventType) => {
        setState(prev => {
            if (type === 'VISION_RITUAL') {
                // PASS CUSTOM SHEET ID OR DIRECT URL
                fetchMotivationVideos(prev.settings?.googleSheetId, prev.settings?.directVisionUrl).then(videos => {
                    // videos is now array of objects { embed: string, original: string }
                    if (videos.length > 0) {
                        const vid = videos[Math.floor(Math.random() * videos.length)];
                        // Store it as a stringified object to pass both URLs through the single string state field
                        // This avoids breaking the GameState type definition which expects a string or null
                        const payload = JSON.stringify(vid);
                        setState(curr => ({ ...curr, activeVisionVideo: payload }));
                    } else {
                        // fallback
                        setState(curr => ({ ...curr, activeVisionVideo: "NO_SIGNAL" }));
                    }
                });
            }
            return { ...prev, activeMapEvent: type };
        });
    };

    const updateSettings = (newSettings: Partial<GameSettings>) => {
        setState(prev => {
            const nextSettings = { ...prev.settings, ...newSettings };
            if (newSettings.masterVolume !== undefined) setVolume(newSettings.masterVolume);
            const next = { ...prev, settings: nextSettings };
            saveGame(next);
            return next;
        });
    };

    const addEffect = (type: VisualEffect['type'], position: {x:number, y:number, z:number}, text?: string) => {
        setState(prev => ({ ...prev, effects: [...prev.effects, { id: generateId(), type, position, text, timestamp: Date.now() }] }));
    };

    const wrapUi = (fn: () => void) => {
        ensureAudio();
        resetIdleTimer();
        playSfx('UI_CLICK');
        fn();
    }

    const contextValue: GameContextType = {
        state,
        addTask,
        moveTask: (id, time) => wrapUi(() => setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, deadline: time } : t) }))),
        completeTask,
        completeSubtask,
        failTask,
        selectEnemy: (id) => wrapUi(() => setState(p => ({ ...p, selectedEnemyId: id }))),
        resolveCrisisHubris: (id) => wrapUi(() => setState(p => ({ ...p, activeAlert: AlertType.NONE, tasks: p.tasks.map(t => t.id === id ? { ...t, hubris: true } : t) }))),
        resolveCrisisHumility: (id) => wrapUi(() => setState(p => ({ ...p, activeAlert: AlertType.AEON_ENCOUNTER, alertTaskId: id }))),
        resolveAeonBattle: (taskId, newSubtasks, success) => wrapUi(() => {
            setState(prev => {
                if (success) {
                    const task = prev.tasks.find(t => t.id === taskId);
                    const newSubs = newSubtasks.map(s => ({ id: generateId(), title: s, completed: false }));
                    playSfx('VICTORY');
                    return {
                        ...prev,
                        activeAlert: AlertType.NONE,
                        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, ...newSubs], deadline: t.deadline + (60 * 60 * 1000) } : t),
                        history: [{ id: generateId(), timestamp: Date.now(), type: 'VICTORY', message: "Aeon Defeated", details: "Task broken down successfully." }, ...prev.history]
                    };
                } else {
                    playSfx('FAILURE');
                    return {
                        ...prev,
                        activeAlert: AlertType.NONE,
                        heroHp: Math.max(0, prev.heroHp - 30),
                        history: [{ id: generateId(), timestamp: Date.now(), type: 'DEFEAT', message: "Crushed by Aeon", details: "Failed to break down the task." }, ...prev.history]
                    }
                }
            })
        }),
        triggerRitual: (t) => wrapUi(() => setState(p => ({ ...p, activeAlert: t }))),
        triggerEvent,
        completeRitual: () => wrapUi(() => setState(p => ({ ...p, activeAlert: AlertType.NONE, isGrimoireOpen: false }))),
        toggleGrimoire: () => wrapUi(() => setState(p => ({ ...p, isGrimoireOpen: !p.isGrimoireOpen }))),
        toggleProfile: () => wrapUi(() => setState(p => ({ ...p, isProfileOpen: !p.isProfileOpen }))),
        toggleMarket: () => wrapUi(() => setState(p => ({ ...p, isMarketOpen: !p.isMarketOpen }))),
        toggleAudit: () => wrapUi(() => setState(p => ({ ...p, isAuditOpen: !p.isAuditOpen }))),
        toggleSettings: () => wrapUi(() => setState(p => ({ ...p, isSettingsOpen: !p.isSettingsOpen }))),
        toggleDiplomacy: () => wrapUi(() => setState(p => ({ ...p, isDiplomacyOpen: !p.isDiplomacyOpen }))),
        interactWithFaction,
        buyItem,
        clearSave: () => { localStorage.clear(); window.location.reload(); },
        exportSave: () => JSON.stringify(state),
        importSave: (d) => { try { const s = JSON.parse(d); saveGame(s); return true; } catch { return false; } },
        connectToCloud,
        disconnectCloud: () => { disconnect(); setState(p => ({ ...p, syncConfig: { ...p.syncConfig!, isConnected: false } })) },
        addEffect,
        closeVision: () => setState(p => ({ ...p, activeMapEvent: 'NONE', activeVisionVideo: null })),
        rerollVision: () => triggerEvent('VISION_RITUAL'),
        interactWithNPC: (id) => { ensureAudio(); playSfx('UI_HOVER'); },
        updateSettings
    };

    return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};
