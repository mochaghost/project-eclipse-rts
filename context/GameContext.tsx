
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, Task, SubtaskDraft, TaskPriority, AlertType, MapEventType, 
  VisualEffect, GameContextType, FirebaseConfig, TaskUpdateData, 
  Era, GameSettings, EntityType, MinionEntity, HistoryLog, Subtask,
  EnemyEntity, Item, TaskTemplate
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
import { LEVEL_THRESHOLDS, ERA_CONFIG, SPELLS } from '../constants';

export const SHOP_ITEMS = [
    // CONSUMABLES
    { id: 'POTION', name: 'Potion of Clarity', description: 'Restores 50 HP to Hero.', cost: 50, type: 'HEAL_HERO', value: 50, tier: 0 },
    { id: 'REINFORCE', name: 'Field Repairs', description: 'Restores 50 HP to Base.', cost: 75, type: 'HEAL_BASE', value: 50, tier: 0 },
    { id: 'MERCENARY', name: 'Hire Mercenary', description: 'Summons a friendly unit.', cost: 100, type: 'MERCENARY', value: 1, tier: 0 },
    
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

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(loadGame());
    const stateRef = useRef(state); 
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTickRef = useRef<number>(Date.now());
    
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

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

    // --- GAME LOOP (HEARTBEAT) - OPTIMIZED ---
    useEffect(() => {
        const tickRate = 2000; 
        const loop = setInterval(() => {
            const now = Date.now();
            const current = stateRef.current;
            
            if (current.isGrimoireOpen || current.isSettingsOpen) return;

            let hpDamage = 0;
            let baseDamage = 0;
            let needsUpdate = false;

            // Combat calculation (compensated for slower tick rate)
            current.enemies.forEach(enemy => {
                const task = current.tasks.find(t => t.id === enemy.taskId);
                if (task && task.startTime <= now && !task.completed && !task.failed) {
                    const dps = (enemy.rank * 0.1) * (enemy.priority); 
                    baseDamage += dps;
                }
            });

            const regen = (current.structures.wallsLevel || 0) * 0.2;
            baseDamage -= regen;

            // NPC Simulation - Only run if sufficient time passed
            let newPop = current.population;
            if (Math.random() > 0.66) { 
                needsUpdate = true;
                newPop = current.population.map(p => ({
                    ...p,
                    hunger: Math.min(100, p.hunger + 1),
                    fatigue: Math.min(100, p.fatigue + 0.5)
                }));
            }

            if (baseDamage !== 0 || needsUpdate) {
                setState(prev => {
                    const newBaseHp = Math.max(0, Math.min(prev.maxBaseHp, prev.baseHp - baseDamage));
                    return {
                        ...prev,
                        baseHp: newBaseHp,
                        population: needsUpdate ? newPop : prev.population
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

    const addTask = (title: string, startTime: number, deadline: number, priority: TaskPriority, subtasks: SubtaskDraft[], durationMinutes: number, description?: string, parentId?: string) => {
        ensureAudio();
        resetIdleTimer();
        playSfx('UI_CLICK');

        // --- CALCULATE FORESIGHT BONUS ---
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

            // --- LOOT SYSTEM ---
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
                effects.push({ id: generateId(), type: 'TEXT_LOOT', position: { x: 4, y: 3, z: 4 }, text: `LOOT: ${newItem.name}`, timestamp: Date.now() });
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
                inventory: inventoryUpdate, // SAVE LOOT TO INVENTORY
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
                const subtaskDrafts: Subtask[] = newSubtasks.map(t => ({ id: generateId(), title: t, completed: false }));
                const updatedTasks = prev.tasks.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, ...subtaskDrafts] } : t);
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
            
            if (item.type === 'HEAL_HERO') next.heroHp = Math.min(next.maxHeroHp, next.heroHp + item.value);
            if (item.type === 'HEAL_BASE') next.baseHp = Math.min(next.maxBaseHp, next.baseHp + item.value);
            
            // ARCHITECTURE UPGRADES
            if (item.type === 'UPGRADE_FORGE') next.structures.forgeLevel = Math.max(next.structures.forgeLevel, item.value);
            if (item.type === 'UPGRADE_WALLS') next.structures.wallsLevel = Math.max(next.structures.wallsLevel, item.value);
            if (item.type === 'UPGRADE_LIBRARY') next.structures.libraryLevel = Math.max(next.structures.libraryLevel, item.value);
            
            if (item.type === 'MERCENARY') {
                const merc = { id: generateId(), type: 'WARRIOR', position: { x: 2, y: 0, z: 2 }, targetEnemyId: null, createdAt: Date.now() };
                next.minions = [...(next.minions || []), merc as any];
            }

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
                // Unequip if selling currently equipped
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
    
    // --- SHUFFLE DECK ALGORITHM FOR VISIONS ---
    const rerollVision = async () => { 
        let queue = [...(state.visionQueue || [])];

        // If Queue empty, refill it
        if (queue.length === 0) {
            const videos = await fetchMotivationVideos(state.settings.googleSheetId, state.settings.directVisionUrl);
            // Convert to string format for storage
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
            
            // If Vision settings changed, clear the queue to force re-fetch on next usage
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

    // --- TEMPLATE SYSTEM ---
    const saveTemplate = (templateData: Omit<TaskTemplate, 'id'>) => {
        playSfx('UI_CLICK');
        setState(prev => {
            const newTemplate: TaskTemplate = {
                ...templateData,
                id: generateId(),
                // DEEP COPY: Map over subtasks to break reference to form state
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
            saveTemplate, deleteTemplate
        }}>
            {children}
        </GameContext.Provider>
    );
};
