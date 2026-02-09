
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
    GameState, GameContextType, TaskPriority, EntityType, Era, AlertType, 
    VisualEffect, Task, SubtaskDraft, TaskTemplate, FirebaseConfig, 
    FactionKey, MapEventType, WeatherType, ShopItem, HistoryLog, GameSettings 
} from '../types';
import { 
    generateId, generateNemesis, generateLoot, getSageWisdom, 
    getVazarothLine, fetchMotivationVideos, generateWorldRumor, generateSpawnPosition 
} from '../utils/generators';
import { saveGame, loadGame } from '../utils/saveSystem';
import { playSfx, initAudio } from '../utils/audio';
import { simulateReactiveTurn } from '../utils/worldSim';
import { 
    initFirebase, loginWithGoogle as firebaseLogin, logout as firebaseLogout, 
    subscribeToAuth, subscribeToCloud, pushToCloud, testConnection 
} from '../services/firebase';
import { FACTIONS, LEVEL_THRESHOLDS, ERA_CONFIG, SPELLS } from '../constants';

// --- SHOP CONSTANTS ---
export const SHOP_ITEMS: ShopItem[] = [
    { id: 'POTION_HP', name: "Elixir of Vitality", description: "Restores 50 HP to Hero.", cost: 40, type: 'HEAL_HERO', value: 50, tier: 0 },
    { id: 'POTION_BASE', name: "Mason's Brew", description: "Repairs 30 HP to Citadel Walls.", cost: 60, type: 'HEAL_BASE', value: 30, tier: 0 },
    { id: 'MERCENARY', name: "Void Mercenary", description: "Hires a guard for 1 day.", cost: 100, type: 'MERCENARY', value: 1, tier: 0 },
    { id: 'FORGE_1', name: "Iron Forge", description: "Unlock basic weapon upgrades.", cost: 200, type: 'UPGRADE_FORGE', value: 1, tier: 1 },
    { id: 'FORGE_2', name: "Titan Smelter", description: "Unlock advanced weaponry.", cost: 500, type: 'UPGRADE_FORGE', value: 1, tier: 2 },
    { id: 'FORGE_3', name: "Star Core", description: "Forge god-tier equipment.", cost: 1200, type: 'UPGRADE_FORGE', value: 1, tier: 3 },
    { id: 'WALLS_1', name: "Reinforced Walls", description: "Increase Max Base HP by 50.", cost: 150, type: 'UPGRADE_WALLS', value: 1, tier: 1 },
    { id: 'WALLS_2', name: "Rune Wards", description: "Increase Max Base HP by 150.", cost: 400, type: 'UPGRADE_WALLS', value: 1, tier: 2 },
    { id: 'WALLS_3', name: "Void Shield", description: "Increase Max Base HP by 500.", cost: 1000, type: 'UPGRADE_WALLS', value: 1, tier: 3 },
    { id: 'LIB_1', name: "Arcane Library", description: "Gain +10% XP from tasks.", cost: 300, type: 'UPGRADE_LIBRARY', value: 1, tier: 1 },
    { id: 'LIB_2', name: "Oracle Spire", description: "Gain +25% XP from tasks.", cost: 800, type: 'UPGRADE_LIBRARY', value: 1, tier: 2 },
    { id: 'LIB_3', name: "Akashic Record", description: "Gain +50% XP from tasks.", cost: 2000, type: 'UPGRADE_LIBRARY', value: 1, tier: 3 },
];

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

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(() => loadGame());
    const [lastTick, setLastTick] = useState<number>(Date.now());
    
    // Cloud Sync Refs
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // Initial Setup
    useEffect(() => {
        initAudio();
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Auth Listener
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
                // Auto-subscribe if we have a room
                if (user.uid) {
                    subscribeToCloud(user.uid, (cloudState) => {
                        // SANITIZE CLOUD DATA BEFORE MERGING
                        if (cloudState && typeof cloudState === 'object') {
                            const sanitizedCloud = {
                                ...cloudState,
                                tasks: Array.isArray(cloudState.tasks) ? cloudState.tasks : [],
                                enemies: Array.isArray(cloudState.enemies) ? cloudState.enemies : [],
                                population: Array.isArray(cloudState.population) ? cloudState.population : []
                            };

                            if (sanitizedCloud.lastSyncTimestamp && (!stateRef.current.lastSyncTimestamp || sanitizedCloud.lastSyncTimestamp > stateRef.current.lastSyncTimestamp)) {
                                console.log("Cloud state is newer, hydrating...");
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

        return () => unsub();
    }, []);

    // --- GAME LOOP (1 Second Tick) ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            
            setState(current => {
                // FAILSAFE: If state is corrupt, prevent crash
                if (!current || !Array.isArray(current.tasks) || !Array.isArray(current.enemies)) {
                    console.error("State corrupted in loop. Restoring default.");
                    return loadGame();
                }

                let updated = { ...current };
                let historyUpdate: HistoryLog[] = [];
                let alertUpdate: Partial<GameState> = {};
                let effectsUpdate: VisualEffect[] = [...(current.effects || [])];
                let enemiesUpdate = [...current.enemies];
                let tasksUpdate = [...current.tasks];

                // 1. Task Logic (Deadlines)
                tasksUpdate = tasksUpdate.map(t => {
                    if (!t.completed && !t.failed && now > t.deadline) {
                        // Task Failed
                        return { ...t, failed: true };
                    }
                    // Crisis Alerts (75% time elapsed)
                    if (!t.completed && !t.failed && !t.crisisTriggered) {
                        const duration = t.deadline - t.startTime;
                        const elapsed = now - t.startTime;
                        if (elapsed / duration > 0.75) {
                            if (current.activeAlert === AlertType.NONE) {
                                playSfx('FAILURE');
                                alertUpdate = { 
                                    activeAlert: AlertType.CRISIS, 
                                    alertTaskId: t.id, 
                                    sageMessage: getSageWisdom('CRISIS')
                                };
                            }
                            return { ...t, crisisTriggered: true };
                        }
                    }
                    return t;
                });

                // 2. Check for Newly Failed Tasks to Spawn Punishments
                const newlyFailed = tasksUpdate.filter(t => t.failed && !current.tasks.find(ot => ot.id === t.id)?.failed);
                newlyFailed.forEach(t => {
                    playSfx('FAILURE');
                    historyUpdate.push({
                        id: generateId(),
                        type: 'DEFEAT',
                        timestamp: now,
                        message: `Task Failed: ${t.title}`,
                        details: "The Void grows stronger.",
                        cause: "Deadline Missed"
                    });
                    
                    // Take Damage
                    const dmg = t.priority * 10;
                    updated.baseHp = Math.max(0, updated.baseHp - dmg);
                    effectsUpdate.push({ id: generateId(), type: 'TEXT_DAMAGE', position: {x:0, y:2, z:0}, text: `-${dmg} HP`, timestamp: now });
                    
                    // Reset streaks
                    updated.winStreak = 0;
                    updated.lossStreak += 1;
                    updated.vazarothMessage = getVazarothLine('FAIL');

                    sendNotification("Task Failed", `${t.title} has been consumed by the Void.`);
                });

                // 3. Regen Mana
                if (updated.mana < updated.maxMana) {
                    updated.mana = Math.min(updated.maxMana, updated.mana + 0.5);
                }

                // 4. SAGE INTERVENTION (Vision Ritual)
                if (current.activeMapEvent === 'NONE' && current.activeAlert === AlertType.NONE && !current.isGrimoireOpen && !alertUpdate?.activeMapEvent) {
                     const impendingTask = current.tasks.find(t => t.priority === TaskPriority.HIGH && !t.completed && !t.failed && t.startTime > now && (t.startTime - now) < 15 * 60 * 1000);
                     let triggerVision = false;
                     let sageMsg = current.sageMessage;

                     if (impendingTask) {
                         if (Math.random() > 0.95) {
                             triggerVision = true;
                             sageMsg = `The ${impendingTask.title} draws near. Clear your mind.`;
                         }
                     } else {
                         if (Math.random() > 0.999) {
                             triggerVision = true;
                             sageMsg = "The noise of the world is deafening. Silence it.";
                         }
                     }

                     if (triggerVision) {
                         playSfx('MAGIC');
                         sendNotification("👁️ Vision Ritual", "The Mirror beckons. Realign your focus.");
                         alertUpdate = {
                             ...alertUpdate,
                             activeMapEvent: 'VISION_RITUAL',
                             sageMessage: sageMsg,
                             history: [{ id: generateId(), type: 'MAGIC', timestamp: Date.now(), message: "Sage's Intervention", details: "A vision has been granted." } as HistoryLog, ...current.history].slice(0, 500)
                         };
                     }
                }

                // 5. NPC Simulation (Every tick run sim)
                const simResult = simulateReactiveTurn(updated);
                updated.population = simResult.newPopulation;
                updated.realmStats = simResult.newStats;
                updated.dailyNarrative = simResult.dailyNarrative; // SYNC DAILY NARRATIVE
                
                if (simResult.goldChange && simResult.goldChange !== 0) {
                    updated.gold += simResult.goldChange;
                    if (simResult.goldChange > 0 && Math.random() > 0.9) {
                        effectsUpdate.push({ id: generateId(), type: 'TEXT_GOLD', position: {x:0, y:2, z:0}, text: `+${simResult.goldChange}g`, timestamp: now });
                    }
                }

                // Handle Spawned Enemies (e.g. from NPC transforming)
                if (simResult.spawnedEnemies && simResult.spawnedEnemies.length > 0) {
                     updated.enemies = [...updated.enemies, ...simResult.spawnedEnemies];
                }

                // Clean up effects
                const cleanEffects = effectsUpdate.filter(e => now - e.timestamp < 3000);

                // Auto-save every minute
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

    const addTask = (title: string, startTime: number, deadline: number, priority: TaskPriority, subtasks: SubtaskDraft[], durationMinutes: number, description?: string, parentId?: string) => {
        const id = generateId();
        const newTask: Task = {
            id,
            title,
            description,
            startTime,
            deadline,
            estimatedDuration: durationMinutes,
            priority,
            completed: false,
            failed: false,
            subtasks: subtasks.map(s => ({ ...s, id: generateId(), completed: false })),
            parentId,
            createdAt: Date.now(),
            crisisTriggered: false,
            hubris: false
        };

        // Generate Enemy (Now with context!)
        const enemy = generateNemesis(
            id, 
            priority, 
            state.nemesisGraveyard, 
            state.winStreak, 
            undefined, 
            title, // Pass title for keyword matching
            durationMinutes,
            state.realmStats // Pass global stats for reactive spawning
        );

        // Generate Minions for subtasks
        const minionEnemies = newTask.subtasks.map(sub => 
            generateNemesis(id, TaskPriority.LOW, [], 0, sub.id, sub.title, durationMinutes / newTask.subtasks.length, state.realmStats)
        );

        setState(prev => {
            const next = {
                ...prev,
                tasks: [...prev.tasks, newTask],
                enemies: [...prev.enemies, enemy, ...minionEnemies],
                isGrimoireOpen: false
            };
            saveGame(next);
            return next;
        });
        playSfx('UI_CLICK');
    };

    const editTask = (taskId: string, data: any) => {
        setState(prev => {
            const tasks = prev.tasks.map(t => {
                if (t.id !== taskId) return t;
                
                // Logic for updating subtasks if provided
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
            
            const next = { ...prev, tasks, isGrimoireOpen: false };
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
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, startTime: newStartTime, deadline: newDeadline } : t)
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
                isGrimoireOpen: false
            };
            saveGame(next);
            return next;
        });
    };

    const completeTask = (taskId: string) => {
        playSfx('VICTORY');
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;

            const enemy = prev.enemies.find(e => e.taskId === taskId && !e.subtaskId);
            
            // Rewards
            const baseXp = task.priority * 100;
            const streakBonus = prev.winStreak * 10;
            const xpGain = baseXp + streakBonus;
            const goldGain = task.priority * 25;

            // Loot Roll
            const loot = generateLoot(prev.playerLevel);
            let newInventory = [...prev.inventory];
            let historyUpdate = [];
            
            if (loot) {
                const item = { ...loot, id: generateId(), acquiredAt: Date.now(), isEquipped: false, value: 50 * task.priority };
                newInventory.push(item);
                historyUpdate.push({ id: generateId(), type: 'LOOT', timestamp: Date.now(), message: `Loot Found: ${item.name}`, details: item.lore } as HistoryLog);
                playSfx('COINS');
            }

            // Graveyard
            let graveyard = [...prev.nemesisGraveyard];
            if (enemy) {
                graveyard.push({ name: enemy.name, clan: enemy.clan, deathTime: Date.now(), killer: 'HERO' });
                if (graveyard.length > 20) graveyard.shift();
            }

            // Level Up Check
            let newLevel = prev.playerLevel;
            let newXp = prev.xp + xpGain;
            const xpReq = newLevel * 1000;
            if (newXp >= xpReq) {
                newLevel++;
                newXp -= xpReq;
                playSfx('VICTORY');
                historyUpdate.push({ id: generateId(), type: 'VICTORY', timestamp: Date.now(), message: `Level Up! Rank ${newLevel}`, details: "The Hero grows stronger." } as HistoryLog);
            }

            const next = {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                enemies: prev.enemies.filter(e => e.taskId !== taskId), // Remove enemy on complete
                xp: newXp,
                playerLevel: newLevel,
                gold: prev.gold + goldGain,
                winStreak: prev.winStreak + 1,
                lossStreak: 0,
                nemesisGraveyard: graveyard,
                inventory: newInventory,
                history: [{ id: generateId(), type: 'VICTORY', timestamp: Date.now(), message: `Vanquished: ${task.title}`, details: `+${xpGain} XP, +${goldGain}g`, cause: "Combat Victory" } as HistoryLog, ...historyUpdate, ...prev.history],
                vazarothMessage: getVazarothLine('WIN', prev.winStreak + 1),
                sageMessage: getSageWisdom('STREAK'),
                // Visual FX
                effects: [...prev.effects, { id: generateId(), type: 'TEXT_XP', position: {x:0, y:2, z:0}, text: `+${xpGain} XP`, timestamp: Date.now() }] as VisualEffect[]
            };
            saveGame(next);
            return next;
        });
    };

    const completeSubtask = (taskId: string, subtaskId: string) => {
        playSfx('COMBAT_HIT');
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;
            
            const newSubtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, completed: true } : s);
            
            // Remove Minion
            const enemies = prev.enemies.filter(e => e.subtaskId !== subtaskId);
            
            const next = {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, subtasks: newSubtasks } : t),
                enemies,
                effects: [...prev.effects, { id: generateId(), type: 'EXPLOSION', position: {x:0,y:0,z:0}, timestamp: Date.now() }] as VisualEffect[] 
            };
            saveGame(next);
            return next;
        });
    };

    const failTask = (taskId: string) => {
        setState(prev => {
            // Trigger failure logic same as timeout
            const next = {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, failed: true } : t),
            };
            return next;
        });
    };

    const resolveFailedTask = (taskId: string, action: 'RESCHEDULE' | 'MERGE', newTime?: number) => {
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;

            let next = { ...prev };
            
            if (action === 'RESCHEDULE') {
                const duration = task.deadline - task.startTime;
                const startTime = newTime || Date.now();
                next.tasks = prev.tasks.map(t => t.id === taskId ? { 
                    ...t, 
                    failed: false, 
                    startTime, 
                    deadline: startTime + duration,
                    priority: t.priority < 3 ? t.priority + 1 : 3 as TaskPriority 
                } : t);
                playSfx('MAGIC');
            } else if (action === 'MERGE') {
                next.tasks = prev.tasks.filter(t => t.id !== taskId);
                next.enemies = prev.enemies.filter(e => e.taskId !== taskId);
            }
            
            saveGame(next);
            return next;
        });
    };

    // --- UI TOGGLES ---
    const toggleGrimoire = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isGrimoireOpen: !p.isGrimoireOpen, activeAlert: AlertType.NONE })); };
    const toggleProfile = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isProfileOpen: !p.isProfileOpen })); };
    const toggleMarket = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isMarketOpen: !p.isMarketOpen, vazarothMessage: getVazarothLine('MARKET') })); };
    const toggleAudit = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isAuditOpen: !p.isAuditOpen })); };
    const toggleSettings = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isSettingsOpen: !p.isSettingsOpen })); };
    const toggleDiplomacy = () => { playSfx('UI_CLICK'); setState(p => ({ ...p, isDiplomacyOpen: !p.isDiplomacyOpen })); };
    
    // --- CRISIS ---
    const resolveCrisisHubris = (taskId: string) => {
        setState(prev => ({ ...prev, activeAlert: AlertType.NONE, alertTaskId: null }));
    };
    const resolveCrisisHumility = (taskId: string) => {
        setState(prev => ({ ...prev, activeAlert: AlertType.AEON_ENCOUNTER }));
    };
    const resolveAeonBattle = (taskId: string, newSubtasks: string[], success: boolean) => {
        if (success) {
            playSfx('VICTORY');
            setState(prev => {
                const task = prev.tasks.find(t => t.id === taskId);
                if (!task) return prev;
                // Add subtasks
                const subs = newSubtasks.map(title => ({ id: generateId(), title, completed: false }));
                const minions = subs.map(s => generateNemesis(taskId, TaskPriority.LOW, [], 0, s.id, s.title, 30, prev.realmStats));
                
                return {
                    ...prev,
                    activeAlert: AlertType.NONE,
                    alertTaskId: null,
                    tasks: prev.tasks.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, ...subs] } : t),
                    enemies: [...prev.enemies, ...minions],
                    effects: [...prev.effects, { id: generateId(), type: 'TEXT_XP', text: "CRISIS AVERTED", position: {x:0,y:2,z:0}, timestamp: Date.now() }] as VisualEffect[]
                };
            });
        } else {
            failTask(taskId);
            setState(prev => ({ ...prev, activeAlert: AlertType.NONE, alertTaskId: null }));
        }
    };

    // --- SHOP ---
    const buyItem = (itemId: string) => {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return;
        if (state.gold < item.cost) { playSfx('ERROR'); return; }

        setState(prev => {
            let next = { ...prev, gold: prev.gold - item.cost };
            playSfx('COINS');
            
            if (item.type === 'HEAL_HERO') next.heroHp = Math.min(next.maxHeroHp, next.heroHp + item.value);
            if (item.type === 'HEAL_BASE') next.baseHp = Math.min(next.maxBaseHp, next.baseHp + item.value);
            if (item.type === 'MERCENARY') {
                 next.minions.push({ id: generateId(), type: 'WARRIOR', position: {x: 2, y:0, z:2}, createdAt: Date.now(), targetEnemyId: null });
            }
            if (item.type.startsWith('UPGRADE_')) {
                // Structure upgrades
                if (item.type === 'UPGRADE_FORGE') next.structures.forgeLevel = Math.min(3, next.structures.forgeLevel + 1);
                if (item.type === 'UPGRADE_WALLS') {
                    next.structures.wallsLevel = Math.min(3, next.structures.wallsLevel + 1);
                    next.maxBaseHp += item.value;
                    next.baseHp += item.value;
                }
                if (item.type === 'UPGRADE_LIBRARY') next.structures.libraryLevel = Math.min(3, next.structures.libraryLevel + 1);
            }

            next.history = [{ id: generateId(), type: 'TRADE', timestamp: Date.now(), message: `Purchased ${item.name}`, details: `-${item.cost}g` } as HistoryLog, ...next.history];
            saveGame(next);
            return next;
        });
    };

    const sellItem = (itemId: string) => {
        setState(prev => {
            const item = prev.inventory.find(i => i.id === itemId);
            if (!item) return prev;
            const val = Math.floor(item.value / 2);
            return {
                ...prev,
                inventory: prev.inventory.filter(i => i.id !== itemId),
                gold: prev.gold + val,
                history: [{ id: generateId(), type: 'TRADE', timestamp: Date.now(), message: `Sold ${item.name}`, details: `+${val}g` } as HistoryLog, ...prev.history]
            };
        });
        playSfx('COINS');
    };

    const equipItem = (itemId: string) => {
        setState(prev => {
            const item = prev.inventory.find(i => i.id === itemId);
            if (!item) return prev;
            
            let eq = { ...prev.heroEquipment };
            if (item.type === 'WEAPON') eq.weapon = item.name;
            if (item.type === 'ARMOR') eq.armor = item.name;
            if (item.type === 'RELIC') eq.relic = item.name;

            return { ...prev, heroEquipment: eq };
        });
        playSfx('UI_CLICK');
    };

    // --- VISION MIRROR ---
    const rerollVision = async () => {
        const settings = state.settings || {} as GameSettings; // Cast to avoid TS error on empty object
        const videos = await fetchMotivationVideos(settings.googleSheetId, settings.directVisionUrl);
        const video = videos[Math.floor(Math.random() * videos.length)];
        
        setState(prev => {
            let embedUrl = "NO_SIGNAL";
            if (video) {
                // Store serialized object for VisionMirror to parse
                embedUrl = JSON.stringify(video);
            }
            
            return {
                ...prev,
                activeVisionVideo: embedUrl
            };
        });
    };
    
    const closeVision = () => {
        setState(prev => ({ ...prev, activeMapEvent: 'NONE', activeVisionVideo: null }));
    };

    const triggerEvent = (type: MapEventType) => {
        setState(prev => ({ ...prev, activeMapEvent: type }));
    };

    // --- OTHER ---
    const selectEnemy = (id: string | null) => setState(p => ({ ...p, selectedEnemyId: id }));
    
    const interactWithFaction = (factionId: FactionKey, action: string) => {
        setState(prev => {
            let fs = prev.factions.map(f => {
                if (f.id === factionId) {
                    let change = 0;
                    if (action === 'GIFT') change = 10;
                    if (action === 'TRADE') change = 5;
                    if (action === 'INSULT') change = -20;
                    if (action === 'PROPAGANDA') change = -50; 
                    return { ...f, reputation: Math.max(-100, Math.min(100, f.reputation + change)) };
                }
                return f;
            });
            return { ...prev, factions: fs };
        });
        playSfx('UI_CLICK');
    };

    const interactWithNPC = (id: string) => {
        playSfx('UI_HOVER');
    };

    const castSpell = (spellId: string) => {
        const spell = SPELLS.find(s => s.id === spellId);
        if (!spell) return;
        if (state.mana < spell.cost) { playSfx('ERROR'); return; }
        
        setState(prev => {
            let next = { ...prev, mana: prev.mana - spell.cost };
            playSfx('MAGIC');
            
            if (spellId === 'SMITE' && prev.selectedEnemyId) {
                addEffect('EXPLOSION', {x:0,y:0,z:0}); 
            }
            if (spellId === 'HEAL') {
                next.heroHp = Math.min(next.maxHeroHp, next.heroHp + 30);
                addEffect('TEXT_GOLD', {x:0,y:2,z:0}, "+30 HP");
            }

            return next;
        });
    };
    
    // --- TEMPLATES ---
    const saveTemplate = (t: Omit<TaskTemplate, 'id'>) => {
        setState(prev => ({
            ...prev,
            templates: [...prev.templates, { ...t, id: generateId() }]
        }));
        saveGame(state);
    };
    
    const deleteTemplate = (id: string) => {
        setState(prev => ({
            ...prev,
            templates: prev.templates.filter(t => t.id !== id)
        }));
        saveGame(state);
    };

    // --- CLOUD ---
    const updateSettings = (s: any) => setState(p => ({ ...p, settings: { ...p.settings, ...s } }));
    const requestPermissions = async () => {
        if (typeof Notification !== 'undefined') {
            const res = await Notification.requestPermission();
            if (res === 'granted') sendNotification("System", "Neural Link Established.");
        }
    };

    const triggerRitual = (type: AlertType) => setState(p => ({ ...p, activeAlert: type }));
    const completeRitual = () => setState(p => ({ ...p, activeAlert: AlertType.NONE }));
    const clearSave = () => { localStorage.clear(); window.location.reload(); };
    const exportSave = () => JSON.stringify(state);
    const importSave = (data: string) => { 
        try { 
            const s = JSON.parse(data); 
            setState(s); 
            saveGame(s); 
            return true; 
        } catch { return false; } 
    };
    const connectToCloud = async () => false;
    const loginWithGoogle = async () => { await firebaseLogin(); };
    const logout = async () => { await firebaseLogout(); };
    const disconnectCloud = () => {};
    const testCloudConnection = () => testConnection(state.syncConfig?.roomId || 'test');
    const forcePull = () => {};
    const takeBaseDamage = (n: number) => setState(p => ({ ...p, baseHp: p.baseHp - n }));
    const resolveNightPhase = () => { triggerEvent('BATTLE_CINEMATIC'); };
    const closeBattleReport = () => setState(p => ({ ...p, activeAlert: AlertType.NONE, lastBattleReport: undefined }));

    return (
        <GameContext.Provider value={{
            state,
            addTask, editTask, moveTask, deleteTask, completeTask, completeSubtask, failTask,
            selectEnemy, resolveCrisisHubris, resolveCrisisHumility, resolveAeonBattle, resolveFailedTask,
            triggerRitual, triggerEvent, completeRitual,
            toggleGrimoire, toggleProfile, toggleMarket, toggleAudit, toggleSettings, toggleDiplomacy,
            interactWithFaction, buyItem, sellItem, equipItem,
            clearSave, exportSave, importSave,
            connectToCloud, loginWithGoogle, logout, disconnectCloud,
            addEffect, closeVision, rerollVision, interactWithNPC, updateSettings, castSpell,
            testCloudConnection, forcePull, saveTemplate, deleteTemplate, requestPermissions, takeBaseDamage,
            resolveNightPhase, closeBattleReport
        }}>
            {children}
        </GameContext.Provider>
    );
};
