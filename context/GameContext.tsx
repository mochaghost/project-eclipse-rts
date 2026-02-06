
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, Task, SubtaskDraft, TaskPriority, AlertType, MapEventType, 
  VisualEffect, GameContextType, FirebaseConfig, TaskUpdateData, 
  Era, GameSettings, EntityType, MinionEntity, HistoryLog, Subtask,
  EnemyEntity, Item, TaskTemplate, NPC, BattleReport, FactionKey, DefenseStats
} from '../types';
import { 
  generateId, generateNemesis, getSageWisdom, getVazarothLine, 
  generateLoot, generateHeroEquipment, generateSpawnPosition, 
  fetchMotivationVideos, convertToEmbedUrl, shuffleArray
} from '../utils/generators';
import { loadGame, saveGame } from '../utils/saveSystem';
import { simulateReactiveTurn, createNPC, updateRealmStats, updateFactions } from '../utils/worldSim';
import { 
  initFirebase, loginWithGoogle as firebaseLogin, logout as firebaseLogout, 
  subscribeToAuth, subscribeToCloud, pushToCloud, disconnect, testConnection 
} from '../services/firebase';
import { playSfx, initAudio, setVolume } from '../utils/audio';
import { LEVEL_THRESHOLDS, ERA_CONFIG, SPELLS, FACTIONS } from '../constants';

export const SHOP_ITEMS = [
    // CONSUMABLES
    { id: 'POTION', name: 'Potion of Clarity', description: 'Restores 50 HP to Hero.', cost: 50, type: 'HEAL_HERO', value: 50, tier: 0 },
    { id: 'REINFORCE', name: 'Field Repairs', description: 'Restores 50 HP to Base.', cost: 75, type: 'HEAL_BASE', value: 50, tier: 0 },
    { id: 'MERCENARY', name: 'Hire Mercenary', description: 'Summons a friendly unit.', cost: 100, type: 'MERCENARY', value: 1, tier: 0 },
    // NEW: BUY TIME
    { id: 'BUY_TIME', name: 'Decree of Leisure', description: 'Bribe Fate. Instantly creates a 1h completed task.', cost: 150, type: 'BUY_TIME', value: 60, tier: 0 },
    
    // ARCHITECTURE UPGRADES
    // FORGE
    { id: 'FORGE_1', name: 'Blacksmith', description: 'Build a dedicated forge. Hero Damage +1.', cost: 300, type: 'UPGRADE_FORGE', value: 1, tier: 1 },
    { id: 'FORGE_2', name: 'Industrial Smelter', description: 'Automate the heat. Hero Damage +2.', cost: 800, type: 'UPGRADE_FORGE', value: 2, tier: 2 },
    { id: 'FORGE_3', name: 'Titan Core', description: 'Harness the earth\'s blood. Hero Damage +3.', cost: 2000, type: 'UPGRADE_FORGE', value: 3, tier: 3 },
    
    // WALLS
    { id: 'WALLS_1', name: 'Stone Ramparts', description: 'Replace wood with stone. Max HP +100.', cost: 300, type: 'UPGRADE_WALLS', value: 1, tier: 1 },
    { id: 'WALLS_2', name: 'Iron Bastion', description: 'Reinforced with black iron. Max HP +300.', cost: 800, type: 'UPGRADE_WALLS', value: 2, tier: 2 },
    { id: 'WALLS_3', name: 'Aegis Field', description: 'Magical barriers. Max HP +600.', cost: 2000, type: 'UPGRADE_WALLS', value: 3, tier: 3 },
    
    // LIBRARY
    { id: 'LIB_1', name: 'Archives', description: 'Preserve knowledge. XP Gain +10%.', cost: 300, type: 'UPGRADE_LIBRARY', value: 1, tier: 1 },
    { id: 'LIB_2', name: 'Observatory', description: 'Study the stars. XP Gain +20%.', cost: 800, type: 'UPGRADE_LIBRARY', value: 2, tier: 2 },
    { id: 'LIB_3', name: 'Void Spire', description: 'Pierce the veil. XP Gain +40%.', cost: 2000, type: 'UPGRADE_LIBRARY', value: 3, tier: 3 },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};

// --- NOTIFICATION HELPER ---
const sendNotification = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
            new Notification(title, { 
                body, 
                icon: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' // Generic fantasy icon or shield
            });
        } catch (e) {
            console.warn("Notification failed to send:", e);
        }
    }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(loadGame());
    const stateRef = useRef(state); 
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTickRef = useRef<number>(Date.now());
    
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Manual permission request exposed for Settings Modal
    const requestPermissions = async () => {
        if (typeof Notification === 'undefined') return;
        try {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                sendNotification("System Link Established", "The Void whispers directly to your mind now.");
            }
        } catch (e) {
            console.warn("Permission request failed", e);
        }
        initAudio();
    };

    const ensurePermissions = () => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(err => console.warn(err));
        }
        initAudio();
        setVolume(state.settings?.masterVolume ?? 0.2);
    };

    const ensureAudio = () => {
        initAudio();
        setVolume(state.settings?.masterVolume ?? 0.2);
    };

    const resetIdleTimer = () => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
             if (Math.random() > 0.7) {
                 setState(prev => ({ ...prev, vazarothMessage: getVazarothLine('IDLE') }));
             }
        }, 120000); 
    };

    // --- DEFENSE CALCULATION HELPER ---
    const calculateDefense = (currentState: GameState): DefenseStats => {
        const wallDef = (currentState.structures.wallsLevel || 0) * 100;
        
        // Hero Equipment Bonus
        let itemBonus = 0;
        if (currentState.heroEquipment.weapon !== 'Fists') itemBonus += 10;
        if (currentState.heroEquipment.armor !== 'Rags') itemBonus += 10;
        if (currentState.heroEquipment.relic !== 'None') itemBonus += 20;
        
        const heroDef = (currentState.playerLevel * 15) + itemBonus;
        const minionDef = (currentState.minions?.length || 0) * 20; // Minions are valuable
        
        // Morale Bonus (Hope > Fear)
        const moraleRatio = (currentState.realmStats.hope || 50) / 100;
        const moraleBonus = Math.floor((wallDef + heroDef + minionDef) * (moraleRatio - 0.5)); // Can be negative

        return {
            total: Math.max(0, wallDef + heroDef + minionDef + moraleBonus),
            walls: wallDef,
            hero: heroDef,
            minions: minionDef,
            moraleBonus
        };
    };

    // --- GAME LOOP (HEARTBEAT) ---
    useEffect(() => {
        const tickRate = 2000; 
        const loop = setInterval(() => {
            const now = Date.now();
            const current = stateRef.current;
            
            if (current.isGrimoireOpen || current.isSettingsOpen) return;

            let baseDamage = 0;
            let needsUpdate = false;
            let alertUpdate: Partial<GameState> | null = null;

            // 1. COMBAT CALCULATION (Tasks vs Time)
            current.enemies.forEach(enemy => {
                const task = current.tasks.find(t => t.id === enemy.taskId);
                if (task && task.startTime <= now && !task.completed && !task.failed) {
                    const dps = (enemy.rank * 0.1) * (enemy.priority); 
                    baseDamage += dps;
                }
            });

            // 2. 75% ALERT MECHANIC
            const activeTasks = current.tasks.filter(t => !t.completed && !t.failed);
            let triggeringTaskId: string | null = null;

            activeTasks.forEach(task => {
                const total = task.deadline - task.startTime;
                const elapsed = now - task.startTime;
                
                if (elapsed > 0 && total > 0) {
                    const progress = elapsed / total;
                    if (progress >= 0.75 && !task.crisisTriggered) {
                        triggeringTaskId = task.id;
                        sendNotification("⚠️ The Void Approaches", `Task "${task.title}" is 75% complete. Intervene now!`);
                        playSfx('ERROR'); 
                        if (current.activeAlert === AlertType.NONE) {
                            alertUpdate = { activeAlert: AlertType.CRISIS, alertTaskId: task.id };
                        }
                    }
                }
            });

            const regen = (current.structures.wallsLevel || 0) * 0.2;
            baseDamage -= regen;

            // 3. RANDOM SIEGE EVENTS
            if (current.activeMapEvent === 'NONE' && Math.random() > 0.98) {
                const hostile = current.factions.filter(f => f.reputation < 0);
                const attacker = hostile.length > 0 ? hostile[Math.floor(Math.random() * hostile.length)] : null;
                
                alertUpdate = { 
                    ...alertUpdate, 
                    activeMapEvent: 'FACTION_SIEGE',
                    vazarothMessage: attacker ? `The ${attacker.name} marches on your walls!` : "They are coming. Hold the gate!",
                    history: [{ 
                        id: generateId(), 
                        type: 'SIEGE', 
                        timestamp: Date.now(), 
                        message: "Enemy Raid Detected", 
                        details: attacker ? `${attacker.name} forces spotted.` : "Unknown assailants." 
                    } as HistoryLog, ...current.history].slice(0, 500)
                };
                
                setTimeout(() => {
                    setState(prev => ({ ...prev, activeMapEvent: 'NONE' }));
                }, 20000);
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
                     alertUpdate = {
                         ...alertUpdate,
                         activeMapEvent: 'VISION_RITUAL',
                         sageMessage: sageMsg,
                         history: [{ id: generateId(), type: 'MAGIC', timestamp: Date.now(), message: "Sage's Intervention", details: "A vision has been granted." } as HistoryLog, ...current.history].slice(0, 500)
                     };
                 }
            }

            // NPC Simulation
            let newPop = current.population;
            if (Math.random() > 0.66) { 
                needsUpdate = true;
                const smiths = current.population.filter(p => p.role === 'Smith').length;
                if (smiths > 0) baseDamage -= (smiths * 0.05); 
                newPop = current.population.map(p => ({
                    ...p,
                    hunger: Math.min(100, p.hunger + 1),
                    fatigue: Math.min(100, p.fatigue + 0.5)
                }));
            }

            // Always update Defense Stats cache
            const defStats = calculateDefense(current);

            if (baseDamage !== 0 || needsUpdate || alertUpdate || triggeringTaskId || defStats.total !== current.defenseStats?.total) {
                setState(prev => {
                    const newBaseHp = Math.max(0, Math.min(prev.maxBaseHp, prev.baseHp - baseDamage));
                    let nextTasks = prev.tasks;
                    if (triggeringTaskId) {
                        nextTasks = prev.tasks.map(t => t.id === triggeringTaskId ? { ...t, crisisTriggered: true } : t);
                    }

                    return {
                        ...prev,
                        ...alertUpdate,
                        tasks: nextTasks,
                        baseHp: newBaseHp,
                        population: needsUpdate ? newPop : prev.population,
                        defenseStats: defStats
                    };
                });
            }

        }, tickRate);

        return () => clearInterval(loop);
    }, []);

    // Auto-save
    useEffect(() => {
        const t = setInterval(() => {
            saveGame(stateRef.current);
        }, 30000);
        return () => clearInterval(t);
    }, []);

    // Cleanup
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            setState(prev => {
                const now = Date.now();
                const activeEffects = prev.effects.filter(e => now - e.timestamp < 3000);
                
                let currentMinions = prev.minions || [];
                if (currentMinions.length > 20) currentMinions = currentMinions.slice(currentMinions.length - 20); 

                let currentHistory = prev.history;
                if (currentHistory.length > 100) currentHistory = currentHistory.slice(0, 100); 

                if (activeEffects.length !== prev.effects.length || 
                    currentMinions.length !== (prev.minions || []).length ||
                    currentHistory.length !== prev.history.length) {
                    return {
                        ...prev,
                        effects: activeEffects,
                        minions: currentMinions,
                        history: currentHistory
                    };
                }
                return prev;
            });
        }, 5000);
        return () => clearInterval(cleanupInterval);
    }, []);

    // Volume sync
    useEffect(() => {
        setVolume(state.settings?.masterVolume ?? 0.2);
    }, [state.settings?.masterVolume]);

    // Initial load effects
    useEffect(() => {
        if (state.syncConfig?.isConnected && state.syncConfig.roomId) {
            subscribeToCloud(state.syncConfig.roomId, (cloudState) => {
                setState(prev => ({
                   ...prev,
                   ...cloudState,
                   isGrimoireOpen: prev.isGrimoireOpen,
                   isSettingsOpen: prev.isSettingsOpen,
                   activeAlert: prev.activeAlert
                }));
            });
        }
    }, []);

    const syncNow = (newState: GameState) => {
        saveGame(newState);
        if (newState.syncConfig?.isConnected && newState.syncConfig.roomId) {
            pushToCloud(newState.syncConfig.roomId, newState);
        }
    };

    const addEffect = (type: VisualEffect['type'], position: {x:number, y:number, z:number}, text?: string) => {
        setState(prev => ({
            ...prev,
            effects: [...prev.effects, { id: generateId(), type, position, text, timestamp: Date.now() }]
        }));
    };

    // --- DAMAGE HANDLER FOR SIEGE MOBS ---
    const takeBaseDamage = (amount: number, reason: string = "Attack") => {
        setState(prev => {
            const defense = (prev.structures.wallsLevel || 0) * 10; 
            const actualDamage = Math.max(0, amount - defense);
            if (actualDamage <= 0) return prev;
            playSfx('COMBAT_HIT');
            const next = { ...prev, baseHp: Math.max(0, prev.baseHp - actualDamage) };
            if (prev.baseHp - next.baseHp > 5) syncNow(next);
            return next;
        });
    };

    // --- THE NIGHT CYCLE RESOLVER (FACTION BASED) ---
    const resolveNightPhase = () => {
        // Trigger Cinematic Mode
        playSfx('ERROR'); // War horn
        setState(prev => ({ ...prev, activeMapEvent: 'BATTLE_CINEMATIC' }));

        // 10 Second Delay for the battle animation
        setTimeout(() => {
            setState(prev => {
                // 1. IDENTIFY ATTACKER (Lowest Reputation)
                const sortedFactions = [...prev.factions].sort((a, b) => a.reputation - b.reputation);
                const primaryEnemy = sortedFactions[0];
                const attackerId = primaryEnemy.reputation < 0 ? primaryEnemy.id : 'VAZAROTH'; // Default bad guy if everyone likes you
                const factionDef = FACTIONS[attackerId];

                // 2. GENERATE SIEGE FLAVOR
                let siegeFlavor = "The enemy attacks.";
                if (attackerId === 'SOL') siegeFlavor = "The Kingdom of Sol demands you answer for your lack of Order. Their knights charge.";
                if (attackerId === 'VAZAROTH') siegeFlavor = "Cultists emerge from the fog. They seek to extinguish your hope.";
                if (attackerId === 'IRON') siegeFlavor = "Dwarven siege engines rumble. They come for the debts you owe.";
                if (attackerId === 'UMBRA') siegeFlavor = "Shadows coalesce into teeth. The Apostles are hungry.";
                if (attackerId === 'ASH') siegeFlavor = "Orc warhorns shatter the silence. They want only blood.";
                if (attackerId === 'VERDANT') siegeFlavor = "The forest itself turns against you. Roots and arrows strike.";

                // 3. CALCULATE THREAT
                // Base threat from unfinished tasks
                const activeEnemies = prev.enemies.filter(e => {
                    const task = prev.tasks.find(t => t.id === e.taskId);
                    return task && !task.completed && !task.failed;
                });
                const taskThreat = activeEnemies.reduce((acc, e) => acc + (e.rank * 10), 0);
                
                // Faction Wrath (Magnitude of negative rep)
                const wrath = Math.abs(Math.min(0, primaryEnemy.reputation)) * 2;
                
                const totalThreat = 50 + taskThreat + wrath;

                // 4. CALCULATE DEFENSE
                const defense = calculateDefense(prev);

                // 5. DETERMINE OUTCOME
                const diff = defense.total - totalThreat;
                
                let outcome: BattleReport['outcome'] = 'DEFEAT';
                let damageTaken = 0;
                let lootStolen = 0;
                let enemiesDefeated = 0;
                let conqueredFactionId: string | undefined = undefined;
                let vazarothMsg = "The darkness recedes, but you are weaker.";
                
                if (diff >= 0) {
                    // Victory
                    outcome = 'VICTORY';
                    enemiesDefeated = Math.floor(Math.random() * 5) + 1;
                    vazarothMsg = "You survived. Merely postponing the inevitable.";
                    
                    // OVERKILL / COUNTER-ATTACK (Only if strong enough)
                    if (prev.playerLevel >= 40 && diff > totalThreat * 0.5) {
                        outcome = 'CRUSHING_VICTORY';
                        // We counter-attack the specific faction that attacked us
                        if (primaryEnemy.reputation < 0) {
                            conqueredFactionId = primaryEnemy.id;
                            vazarothMsg = `You pushed back the ${primaryEnemy.name} and burned their camp.`;
                        }
                    }
                } else {
                    // Defeat
                    damageTaken = Math.abs(diff);
                    lootStolen = Math.floor(prev.gold * 0.1); 
                    vazarothMsg = "Your walls are paper. Your resolve is ash.";
                }

                // 6. APPLY RESULTS
                let newHp = Math.max(0, prev.baseHp - damageTaken);
                let newGold = Math.max(0, prev.gold - lootStolen);
                let newXp = prev.xp + (outcome !== 'DEFEAT' ? 100 + (enemiesDefeated*10) : 0);
                
                // Update Factions
                const newFactions = prev.factions.map(f => {
                    if (f.id === conqueredFactionId) {
                        // We beat them so bad they respect us (or fear us) -> Rep improves slightly towards Neutral (Fear)
                        return { ...f, reputation: Math.min(0, f.reputation + 15), status: 'HOSTILE' as any };
                    }
                    return f;
                });

                const report: BattleReport = {
                    timestamp: Date.now(),
                    attackerFactionId: attackerId,
                    siegeFlavor,
                    threatLevel: totalThreat,
                    defenseLevel: defense.total,
                    outcome,
                    damageTaken,
                    lootStolen,
                    enemiesDefeated,
                    conqueredFaction: conqueredFactionId ? factionDef.name : undefined
                };

                const historyEntry: HistoryLog = {
                    id: generateId(),
                    type: 'DAILY_REPORT',
                    timestamp: Date.now(),
                    message: outcome === 'DEFEAT' ? `Siege Lost: ${factionDef.name}` : `Siege Repelled: ${factionDef.name}`,
                    details: `Defended against ${totalThreat} threat. ${siegeFlavor}`
                };

                playSfx(outcome === 'DEFEAT' ? 'FAILURE' : 'VICTORY');

                const next = {
                    ...prev,
                    baseHp: newHp,
                    gold: newGold,
                    xp: newXp,
                    factions: newFactions,
                    lastBattleReport: report,
                    activeAlert: AlertType.BATTLE_REPORT,
                    activeMapEvent: 'NONE' as MapEventType, // Reset event to normal
                    vazarothMessage: vazarothMsg,
                    history: [historyEntry, ...prev.history].slice(0, 500)
                };
                
                syncNow(next);
                return next;
            });
        }, 12000); // 12 second cinematic duration
    };

    const closeBattleReport = () => {
        setState(prev => ({ 
            ...prev, 
            activeAlert: AlertType.NONE, 
            activeMapEvent: 'NONE' // Stop the battle visual
        }));
    };

    // ... (Existing addTask, editTask, etc. remain unchanged, just ensure takeBaseDamage is added to provider)
    
    const addTask = (title: string, startTime: number, deadline: number, priority: TaskPriority, subtasks: SubtaskDraft[], durationMinutes: number, description?: string, parentId?: string) => {
        ensurePermissions(); 
        resetIdleTimer();
        playSfx('UI_CLICK');

        const now = new Date();
        const start = new Date(startTime);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const taskDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        
        const diffTime = taskDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let foresightBonus = 0; 
        if (diffDays >= 1 && diffDays < 3) foresightBonus = 0.1; 
        else if (diffDays >= 3 && diffDays < 7) foresightBonus = 0.25; 
        else if (diffDays >= 7) foresightBonus = 0.5; 

        setState(prev => {
            const taskId = generateId();
            
            const newSubtasks: Subtask[] = subtasks.map(s => ({
                id: generateId(),
                title: s.title,
                completed: false,
                startTime: s.startTime,
                deadline: s.deadline
            }));

            const newTask: Task = {
                id: taskId,
                title,
                description,
                startTime,
                deadline,
                estimatedDuration: durationMinutes,
                createdAt: Date.now(),
                priority,
                completed: false,
                failed: false,
                subtasks: newSubtasks,
                parentId,
                crisisTriggered: false,
                hubris: false,
                foresightBonus 
            };

            const graveyard = prev.nemesisGraveyard || [];
            
            const enemy = generateNemesis(taskId, priority, graveyard, prev.winStreak, undefined, undefined, durationMinutes);

            const subEnemies = newSubtasks.map((st, index) => {
                const angle = (index / newSubtasks.length) * Math.PI * 2;
                const radius = 3 + (Math.random() * 2); 
                const offsetX = Math.cos(angle) * radius;
                const offsetZ = Math.sin(angle) * radius;
                
                const childPos = {
                    x: enemy.position.x + offsetX,
                    y: enemy.position.y,
                    z: enemy.position.z + offsetZ
                };

                const subEnemy = generateNemesis(taskId, TaskPriority.LOW, [], 0, st.id, st.title, durationMinutes / newSubtasks.length);
                subEnemy.position = childPos;
                subEnemy.initialPosition = childPos;
                return subEnemy;
            });

            const next: GameState = {
                ...prev,
                tasks: [...prev.tasks, newTask],
                enemies: [...prev.enemies, enemy, ...subEnemies],
                history: [{ 
                    id: generateId(), 
                    type: 'RITUAL', 
                    timestamp: Date.now(), 
                    message: `Oath Sworn: ${title}`, 
                    details: foresightBonus > 0 ? `Strategic Planning Bonus Active (+${foresightBonus*100}%)` : `A Commander and ${subEnemies.length} minions manifest.` 
                } as HistoryLog, ...prev.history].slice(0, 500),
                isGrimoireOpen: false
            };
            syncNow(next);
            return next;
        });
    };

    const editTask = (taskId: string, data: TaskUpdateData) => {
        ensureAudio();
        setState(prev => {
            const nextTasks = prev.tasks.map(t => {
                if (t.id !== taskId) return t;
                let updatedSubtasks = t.subtasks;
                if (data.subtasks) {
                    updatedSubtasks = data.subtasks.map(s => ({
                        id: generateId(),
                        title: s.title,
                        completed: false,
                        startTime: s.startTime,
                        deadline: s.deadline
                    }));
                }
                return { ...t, ...data, subtasks: updatedSubtasks };
            });
            const next = { ...prev, tasks: nextTasks };
            syncNow(next);
            return next;
        });
    };

    const deleteTask = (taskId: string) => {
        playSfx('UI_CLICK');
        setState(prev => {
            const nextTasks = prev.tasks.filter(t => t.id !== taskId);
            const nextEnemies = prev.enemies.filter(e => e.taskId !== taskId);
            
            const next: GameState = {
                ...prev,
                tasks: nextTasks,
                enemies: nextEnemies,
                selectedEnemyId: prev.selectedEnemyId === taskId ? null : prev.selectedEnemyId,
                history: [{ id: generateId(), type: 'RITUAL', timestamp: Date.now(), message: "Banishment", details: "A task was erased from existence." } as HistoryLog, ...prev.history].slice(0, 500)
            };
            syncNow(next);
            return next;
        });
    };

    const moveTask = (taskId: string, newStartTime: number) => {
        ensureAudio();
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;
            const duration = task.deadline - task.startTime;
            const newDeadline = newStartTime + duration;
            const nextTasks = prev.tasks.map(t => t.id === taskId ? { ...t, startTime: newStartTime, deadline: newDeadline } : t);
            const next = { ...prev, tasks: nextTasks };
            syncNow(next);
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

            sendNotification("⚔️ Victory!", `Enemy vanquished: ${task.title}`);

            const foresightMultiplier = 1.0 + (task.foresightBonus || 0);
            const xpGain = Math.floor((100 * task.priority) * foresightMultiplier);
            const goldGain = Math.floor((50 * task.priority) * foresightMultiplier);
            
            const nextLevel = Math.floor((prev.xp + xpGain) / 1000) + 1;
            const didLevelUp = nextLevel > prev.playerLevel;
            const mainEnemy = prev.enemies.find(e => e.taskId === taskId && !e.subtaskId);
            
            let graveyardUpdate = prev.nemesisGraveyard || [];
            if (mainEnemy) graveyardUpdate = [...graveyardUpdate, { name: mainEnemy.name, clan: mainEnemy.clan, deathTime: Date.now(), killer: 'HERO' as const }].slice(-10);

            const effects: VisualEffect[] = [];
            const pos = mainEnemy ? mainEnemy.position : { x: 0, y: 0, z: 0 };
            effects.push({ id: generateId(), type: 'EXPLOSION', position: pos, timestamp: Date.now() });
            
            if (foresightMultiplier > 1.0) {
                effects.push({ id: generateId(), type: 'TEXT_LOOT', position: { ...pos, y: 4.5 }, text: `BONUS ACTIVE`, timestamp: Date.now() });
            }
            effects.push({ id: generateId(), type: 'TEXT_XP', position: { ...pos, y: 3 }, text: `+${xpGain} XP`, timestamp: Date.now() });

            // --- LOOT SYSTEM IMPROVED ---
            const lootChanceBonus = (task.foresightBonus || 0) * 10; 
            const generatedLoot = generateLoot(nextLevel + lootChanceBonus);
            let inventoryUpdate = prev.inventory || [];
            
            if (generatedLoot) {
                const newItem: Item = {
                    id: generateId(),
                    type: generatedLoot.type,
                    name: generatedLoot.name,
                    lore: generatedLoot.lore,
                    value: 50 + (nextLevel * 10),
                    acquiredAt: Date.now(),
                    isEquipped: false
                };
                inventoryUpdate = [...inventoryUpdate, newItem];
                effects.push({ id: generateId(), type: 'TEXT_LOOT', position: { x: 4, y: 3, z: 4 }, text: `LOOT FOUND: ${newItem.name}`, timestamp: Date.now() });
                playSfx('MAGIC');
            }

            const newMinion: MinionEntity = { id: generateId(), type: 'WARRIOR', position: { x: 4, y: 0, z: 4 }, targetEnemyId: null, createdAt: Date.now() };
            const currentMinions = prev.minions || [];
            const nextMinions = currentMinions.length >= 30 ? [...currentMinions.slice(1), newMinion] : [...currentMinions, newMinion];

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
                minions: nextMinions, 
                effects: [...prev.effects, ...effects],
                sageMessage: didLevelUp ? "Ascension achieved." : getSageWisdom("STREAK"),
                vazarothMessage: getVazarothLine("WIN", prev.winStreak + 1),
                population: sim.newPopulation,
                realmStats: sim.newStats,
                factions: sim.newFactions,
                nemesisGraveyard: graveyardUpdate,
                inventory: inventoryUpdate,
                history: [{ 
                    id: generateId(), 
                    type: generatedLoot ? 'LOOT' : 'VICTORY', 
                    timestamp: Date.now(), 
                    message: `Vanquished ${task.title}`, 
                    details: generatedLoot ? `Acquired: ${generatedLoot.name}` : "Victory."
                } as HistoryLog, ...sim.logs, ...prev.history].slice(0, 500),
                selectedEnemyId: null,
                isProfileOpen: false 
            };
            syncNow(next); 
            return next;
        });
    };

    const completeSubtask = (taskId: string, subtaskId: string) => {
        playSfx('UI_CLICK');
        setState(prev => {
            const nextTasks = prev.tasks.map(t => {
                if (t.id !== taskId) return t;
                return {
                    ...t,
                    subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: true } : s)
                };
            });
            const nextEnemies = prev.enemies.filter(e => e.subtaskId !== subtaskId);
            
            const next = {
                ...prev,
                tasks: nextTasks,
                enemies: nextEnemies,
                xp: prev.xp + 20,
                gold: prev.gold + 5
            };
            syncNow(next);
            return next;
        });
    };

    const failTask = (taskId: string) => {
        playSfx('FAILURE');
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;
            
            sendNotification("⚔️ Defeat", `Task Failed: ${task.title}`);

            const next: GameState = {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, failed: true } : t),
                winStreak: 0,
                lossStreak: prev.lossStreak + 1,
                heroHp: Math.max(0, prev.heroHp - 10),
                vazarothMessage: getVazarothLine('FAIL'),
                history: [{ id: generateId(), type: 'DEFEAT', timestamp: Date.now(), message: `Failed: ${task.title}`, details: "The enemy holds the line." } as HistoryLog, ...prev.history].slice(0, 500)
            };
            syncNow(next);
            return next;
        });
    };

    const selectEnemy = (enemyId: string | null) => {
        playSfx('UI_HOVER');
        setState(prev => ({ ...prev, selectedEnemyId: enemyId }));
    };

    const resolveCrisisHubris = (taskId: string) => {
        playSfx('UI_CLICK');
        setState(prev => ({ ...prev, activeAlert: AlertType.NONE, alertTaskId: null, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, hubris: true } : t) }));
    };

    const resolveCrisisHumility = (taskId: string) => {
        playSfx('UI_CLICK');
        setState(prev => ({ ...prev, activeAlert: AlertType.AEON_ENCOUNTER }));
    };

    const resolveAeonBattle = (taskId: string, newSubtasks: string[], success: boolean) => {
        if (success) {
            playSfx('VICTORY');
            setState(prev => {
                const subtaskDrafts: Subtask[] = newSubtasks.map(t => ({ 
                    id: generateId(), 
                    title: t, 
                    completed: false,
                    startTime: Date.now(), 
                    deadline: Date.now() + 3600000 
                }));
                
                const updatedTasks = prev.tasks.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), ...subtaskDrafts] } : t);
                
                const next = {
                    ...prev,
                    activeAlert: AlertType.NONE,
                    alertTaskId: null,
                    tasks: updatedTasks,
                    enemies: [...prev.enemies, ...subtaskDrafts.map(st => generateNemesis(taskId, TaskPriority.LOW, [], 0, st.id, st.title))]
                };
                syncNow(next);
                return next;
            });
        } else {
            failTask(taskId);
            setState(prev => ({ ...prev, activeAlert: AlertType.NONE, alertTaskId: null }));
        }
    };

    const resolveFailedTask = (taskId: string, action: 'RESCHEDULE' | 'MERGE', newTime?: number) => {
        setState(prev => {
            let next = { ...prev };
            if (action === 'RESCHEDULE' && newTime) {
                next.tasks = prev.tasks.map(t => t.id === taskId ? { ...t, failed: false, startTime: newTime, deadline: newTime + (t.deadline - t.startTime) } : t);
            }
            if (action === 'MERGE') {
                next.tasks = prev.tasks.filter(t => t.id !== taskId);
                next.enemies = prev.enemies.filter(e => e.taskId !== taskId);
            }
            syncNow(next);
            return next;
        });
    };

    const triggerRitual = (type: AlertType) => { setState(prev => ({ ...prev, activeAlert: type })); };
    const triggerEvent = (type: MapEventType) => { setState(prev => ({ ...prev, activeMapEvent: type })); };

    const completeRitual = () => {
        playSfx('MAGIC');
        setState(prev => ({ ...prev, activeAlert: AlertType.NONE, xp: prev.xp + 50, mana: Math.min(prev.maxMana, prev.mana + 50) }));
    };

    const toggleGrimoire = () => { playSfx('UI_CLICK'); setState(prev => ({ ...prev, isGrimoireOpen: !prev.isGrimoireOpen })); };
    const toggleProfile = () => { playSfx('UI_CLICK'); setState(prev => ({ ...prev, isProfileOpen: !prev.isProfileOpen })); };
    const toggleMarket = () => { playSfx('UI_CLICK'); setState(prev => ({ ...prev, isMarketOpen: !prev.isMarketOpen })); };
    const toggleAudit = () => { playSfx('UI_CLICK'); setState(prev => ({ ...prev, isAuditOpen: !prev.isAuditOpen })); };
    const toggleSettings = () => { playSfx('UI_CLICK'); setState(prev => ({ ...prev, isSettingsOpen: !prev.isSettingsOpen })); };
    const toggleDiplomacy = () => { playSfx('UI_CLICK'); setState(prev => ({ ...prev, isDiplomacyOpen: !prev.isDiplomacyOpen })); };

    const interactWithFaction = (factionId: string, action: 'GIFT' | 'TRADE' | 'INSULT' | 'PROPAGANDA') => {
        setState(prev => {
            const faction = prev.factions.find(f => f.id === factionId);
            if (!faction) return prev;
            let goldCost = 0; let repChange = 0; let msg = '';
            if (action === 'GIFT') { goldCost = 50; repChange = 10; msg = `Sent gift to ${faction.name}`; }
            if (action === 'TRADE') { goldCost = 20; repChange = 5; msg = `Opened trade with ${faction.name}`; }
            if (action === 'INSULT') { goldCost = 0; repChange = -20; msg = `Insulted ${faction.name}`; }
            if (action === 'PROPAGANDA') { goldCost = 100; repChange = -30; msg = `Spread lies about ${faction.name}`; }
            if (prev.gold < goldCost) { playSfx('ERROR'); return prev; }
            const newFactions = prev.factions.map(f => f.id === factionId ? { ...f, reputation: Math.max(-100, Math.min(100, f.reputation + repChange)) } : f);
            const updatedFactions = newFactions.map(f => {
                let status = f.status;
                if (f.reputation > 80) status = 'ALLIED';
                else if (f.reputation > 20) status = 'FRIENDLY';
                else if (f.reputation < -20) status = 'HOSTILE';
                else if (f.reputation < -80) status = 'WAR';
                else status = 'NEUTRAL';
                return { ...f, status };
            });
            playSfx('UI_CLICK');
            const next: GameState = {
                ...prev,
                gold: prev.gold - goldCost,
                factions: updatedFactions as any,
                history: [{ id: generateId(), type: 'DIPLOMACY', timestamp: Date.now(), message: msg } as HistoryLog, ...prev.history].slice(0, 500)
            };
            syncNow(next);
            return next;
        });
    };

    const buyItem = (itemId: string) => {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return;
        
        setState(prev => {
            if (prev.gold < item.cost) {
                playSfx('ERROR');
                return prev;
            }
            playSfx('UI_CLICK');
            let next = { ...prev, gold: prev.gold - item.cost };
            const effects: VisualEffect[] = [];
            let populationUpdate = [...prev.population];
            let historyUpdate = [...prev.history];
            let vazarothMsg = prev.vazarothMessage;
            
            if (item.type === 'HEAL_HERO') next.heroHp = Math.min(next.maxHeroHp, next.heroHp + item.value);
            if (item.type === 'HEAL_BASE') next.baseHp = Math.min(next.maxBaseHp, next.baseHp + item.value);
            
            // --- NEW: BUY TIME MECHANIC ---
            if (item.type === 'BUY_TIME') {
                const now = Date.now();
                const taskId = generateId();
                const newTask: Task = {
                    id: taskId,
                    title: "Royal Leisure",
                    description: "Time bought with gold. The luxury of the idle king.",
                    startTime: now,
                    deadline: now + 3600000, // 1 Hour
                    estimatedDuration: 60,
                    createdAt: now,
                    priority: TaskPriority.LOW,
                    completed: true, // INSTANTLY COMPLETED
                    failed: false,
                    subtasks: [],
                    crisisTriggered: false,
                    hubris: false
                };
                
                next.tasks = [...next.tasks, newTask];
                next.xp += 20; // Small XP bonus for leisure
                next.winStreak += 1; // Maintains streak!
                
                effects.push({ id: generateId(), type: 'TEXT_XP', position: { x: 0, y: 3, z: 0 }, text: "TIME BOUGHT", timestamp: Date.now() });
                historyUpdate.unshift({
                    id: generateId(),
                    type: 'TRADE',
                    timestamp: Date.now(),
                    message: "Decree of Leisure",
                    details: "You bribed Fate for an hour of peace."
                });
                vazarothMsg = "Buying time? A coward's strategy, but effective.";
            }
            
            if (item.type.startsWith('UPGRADE')) {
                let structureName = "";
                let specialistRole: NPC['role'] | null = null;

                if (item.type === 'UPGRADE_FORGE') {
                    next.structures.forgeLevel = Math.max(next.structures.forgeLevel, item.value);
                    structureName = "Great Forge";
                    specialistRole = "Smith";
                    vazarothMsg = "You hammer steel while I hammer fate. Cute.";
                }
                if (item.type === 'UPGRADE_WALLS') {
                    next.structures.wallsLevel = Math.max(next.structures.wallsLevel, item.value);
                    structureName = "Bastion Walls";
                    specialistRole = "Guard";
                    vazarothMsg = "Walls only delay the inevitable.";
                }
                if (item.type === 'UPGRADE_LIBRARY') {
                    next.structures.libraryLevel = Math.max(next.structures.libraryLevel, item.value);
                    structureName = "Arcane Library";
                    specialistRole = "Scholar";
                    vazarothMsg = "Knowledge is a burden you cannot carry.";
                }
                
                if (specialistRole) {
                    const peasantIndex = populationUpdate.findIndex(p => p.role === 'Peasant');
                    if (peasantIndex >= 0) {
                        populationUpdate[peasantIndex] = {
                            ...populationUpdate[peasantIndex],
                            role: specialistRole,
                            memories: [...populationUpdate[peasantIndex].memories, `Assigned to work in the ${structureName}.`]
                        };
                        effects.push({ id: generateId(), type: 'TEXT_XP', position: { x: 0, y: 3, z: 0 }, text: "New Specialist!", timestamp: Date.now() });
                    }
                }

                historyUpdate.unshift({
                    id: generateId(),
                    type: 'WORLD_EVENT',
                    timestamp: Date.now(),
                    message: "Construction Complete",
                    details: `${structureName} established. The colony grows stronger.`
                });

                effects.push({ id: generateId(), type: 'TEXT_XP', position: { x: 0, y: 5, z: 0 }, text: "CONSTRUCTION COMPLETE", timestamp: Date.now() });
                effects.push({ id: generateId(), type: 'EXPLOSION', position: { x: 0, y: 2, z: 0 }, timestamp: Date.now() });
                playSfx('MAGIC');
            }
            
            if (item.type === 'MERCENARY') {
                const merc = { id: generateId(), type: 'WARRIOR', position: { x: 2, y: 0, z: 2 }, targetEnemyId: null, createdAt: Date.now() };
                next.minions = [...(next.minions || []), merc as any];
            }

            next.effects = [...prev.effects, ...effects];
            next.population = populationUpdate;
            next.history = historyUpdate.slice(0, 500);
            next.vazarothMessage = vazarothMsg;

            syncNow(next);
            return next;
        });
    };

    const sellItem = (itemId: string) => {
        setState(prev => {
            const item = prev.inventory?.find(i => i.id === itemId);
            if (!item) return prev;
            
            playSfx('COINS');
            const next = {
                ...prev,
                gold: prev.gold + Math.floor(item.value / 2),
                inventory: prev.inventory.filter(i => i.id !== itemId),
                heroEquipment: {
                    weapon: prev.heroEquipment.weapon === item.name ? "Bare Fists" : prev.heroEquipment.weapon,
                    armor: prev.heroEquipment.armor === item.name ? "Rags" : prev.heroEquipment.armor,
                    relic: prev.heroEquipment.relic === item.name ? "None" : prev.heroEquipment.relic
                }
            };
            syncNow(next);
            return next;
        });
    };

    const equipItem = (itemId: string) => {
        playSfx('UI_CLICK');
        setState(prev => {
            const item = prev.inventory?.find(i => i.id === itemId);
            if (!item) return prev;

            const nextEquipment = { ...prev.heroEquipment };
            if (item.type === 'WEAPON') nextEquipment.weapon = item.name;
            if (item.type === 'ARMOR') nextEquipment.armor = item.name;
            if (item.type === 'RELIC') nextEquipment.relic = item.name;

            const next = { ...prev, heroEquipment: nextEquipment };
            syncNow(next);
            return next;
        });
    };

    const clearSave = () => { localStorage.removeItem('PROJECT_ECLIPSE_SAVE_V1'); window.location.reload(); };
    const exportSave = () => JSON.stringify(state);
    const importSave = (data: string) => { try { const parsed = JSON.parse(data); setState(parsed); saveGame(parsed); return true; } catch(e) { console.error(e); return false; } };
    const connectToCloud = async (config: FirebaseConfig, roomId?: string) => { return false; };
    const loginWithGoogle = async () => { try { const user = await firebaseLogin(); if (user) { setState(prev => ({ ...prev, syncConfig: { ...prev.syncConfig!, user: { uid: user.uid, displayName: user.displayName, email: user.email }, isConnected: true, roomId: user.uid } })); } } catch (e) { console.error(e); } };
    const logout = async () => { await firebaseLogout(); setState(prev => ({ ...prev, syncConfig: { ...prev.syncConfig!, user: undefined, isConnected: false } })); };
    const disconnectCloud = () => { disconnect(); setState(prev => ({ ...prev, syncConfig: { ...prev.syncConfig!, isConnected: false } })); };
    const closeVision = () => { setState(prev => ({ ...prev, activeMapEvent: 'NONE', activeVisionVideo: null })); };
    
    const rerollVision = async () => { 
        let queue = [...(state.visionQueue || [])];

        if (queue.length === 0) {
            const videos = await fetchMotivationVideos(state.settings.googleSheetId, state.settings.directVisionUrl);
            const videoStrings = videos.map(v => v.type === 'VIDEO' ? v.embedUrl : JSON.stringify(v));
            queue = shuffleArray(videoStrings);
        }

        if (queue.length === 0) return; 

        const nextVideo = queue.pop(); 

        setState(prev => ({ 
            ...prev, 
            activeVisionVideo: nextVideo || null,
            visionQueue: queue
        })); 
    };

    const interactWithNPC = (npcId: string) => { playSfx('UI_CLICK'); setState(prev => { const npc = prev.population.find(n => n.id === npcId); if (!npc) return prev; return { ...prev, realmStats: { ...prev.realmStats, hope: Math.min(100, prev.realmStats.hope + 1) }, effects: [...prev.effects, { id: generateId(), type: 'TEXT_XP', position: { x: 0, y: 2, z: 0 }, text: "Hope +1", timestamp: Date.now() }] }; }); };
    
    const updateSettings = (settings: Partial<GameSettings>) => { 
        setState(prev => { 
            const next = { ...prev, settings: { ...prev.settings, ...settings } };
            if (settings.googleSheetId !== undefined || settings.directVisionUrl !== undefined) {
                next.visionQueue = []; 
            }
            setVolume(next.settings.masterVolume); 
            syncNow(next); 
            return next; 
        }); 
    };
    
    const castSpell = (spellId: string) => { const spell = SPELLS.find(s => s.id === spellId); if (!spell) return; setState(prev => { if (prev.mana < spell.cost) { playSfx('ERROR'); return prev; } playSfx('MAGIC'); let next = { ...prev, mana: prev.mana - spell.cost }; const effects: VisualEffect[] = []; if (spell.id === 'SMITE') { if (prev.selectedEnemyId) { const enemy = prev.enemies.find(e => e.id === prev.selectedEnemyId); if (enemy) { next.enemies = prev.enemies.map(e => e.id === prev.selectedEnemyId ? { ...e, hp: e.hp - 50 } : e); effects.push({ id: generateId(), type: 'SPELL_CAST', position: enemy.position, text: 'SMITE!', timestamp: Date.now() }); } } } else if (spell.id === 'HEAL') { next.heroHp = Math.min(next.maxHeroHp, next.heroHp + 30); effects.push({ id: generateId(), type: 'SPELL_CAST', position: {x:4, y:2, z:4}, text: 'HEALED', timestamp: Date.now() }); } return { ...next, effects: [...prev.effects, ...effects] }; }); };
    const testCloudConnection = async () => { if (!state.syncConfig?.roomId) return { success: false, message: "No Room ID" }; return await testConnection(state.syncConfig.roomId); };
    const forcePull = () => { if (state.syncConfig?.isConnected && state.syncConfig.roomId) { window.location.reload(); } };

    const saveTemplate = (templateData: Omit<TaskTemplate, 'id'>) => {
        playSfx('UI_CLICK');
        setState(prev => {
            const newTemplate: TaskTemplate = {
                ...templateData,
                id: generateId(),
                subtasks: (templateData.subtasks || []).map(s => ({...s}))
            };
            const next = {
                ...prev,
                templates: [...(prev.templates || []), newTemplate]
            };
            syncNow(next);
            return next;
        });
    };

    const deleteTemplate = (templateId: string) => {
        playSfx('UI_CLICK');
        setState(prev => {
            const next = {
                ...prev,
                templates: (prev.templates || []).filter(t => t.id !== templateId)
            };
            syncNow(next);
            return next;
        });
    };

    // Auto-trigger vision content when event starts
    useEffect(() => {
        if (state.activeMapEvent === 'VISION_RITUAL' && !state.activeVisionVideo) {
            rerollVision();
        }
    }, [state.activeMapEvent]);

    return (
        <GameContext.Provider value={{
            state,
            addTask, editTask, moveTask, deleteTask, completeTask, completeSubtask, failTask, selectEnemy,
            resolveCrisisHubris, resolveCrisisHumility, resolveAeonBattle, resolveFailedTask,
            triggerRitual, triggerEvent, completeRitual,
            toggleGrimoire, toggleProfile, toggleMarket, toggleAudit, toggleSettings, toggleDiplomacy,
            interactWithFaction, buyItem, sellItem, equipItem,
            clearSave, exportSave, importSave, connectToCloud, loginWithGoogle, logout, disconnectCloud,
            addEffect, closeVision, rerollVision, interactWithNPC, updateSettings, castSpell,
            testCloudConnection, forcePull,
            saveTemplate, deleteTemplate, requestPermissions, takeBaseDamage,
            resolveNightPhase, closeBattleReport
        }}>
            {children}
        </GameContext.Provider>
    );
};
