
import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Zap, Shield, Coins, ShoppingBag, Eye, User, PieChart, Settings, Cloud, Map as MapIcon, ScrollText, AlertOctagon, Maximize2, Minimize2, Heart, Snowflake, Sword, Clock, BookOpen, Wifi, WifiOff, Moon, Flag, Info, Hourglass } from 'lucide-react';
import { VazarothHUD } from './VazarothHUD';
import { WorldRumorHUD } from './WorldRumorHUD';
import { SPELLS, FACTIONS } from '../../constants';

// --- NEW COMPONENT: CYCLE HUD ---
const CycleHUD = () => {
    const { state, resolveNightPhase } = useGame();
    
    // Calculate attacker based on logic (replicated from Context for UI)
    const sortedFactions = [...state.factions].sort((a, b) => a.reputation - b.reputation);
    const primaryEnemy = sortedFactions[0];
    const attackerId = primaryEnemy && primaryEnemy.reputation < 0 ? primaryEnemy.id : 'VAZAROTH';
    const attackerDef = FACTIONS[attackerId] || FACTIONS['VAZAROTH']; // Safe fallback

    // Stats
    const activeEnemies = state.enemies.filter(e => {
        const task = state.tasks.find(t => t.id === e.taskId);
        return task && !task.completed && !task.failed;
    });
    
    let threat = 50 + activeEnemies.reduce((acc, e) => acc + (e.rank * 10), 0) + (Math.abs(Math.min(0, primaryEnemy?.reputation || 0)) * 2);
    
    // Defense breakdown from cached stats
    const defense = state.defenseStats?.total || 0;
    const walls = state.defenseStats?.walls || 0;
    const hero = state.defenseStats?.hero || 0;
    const minions = state.defenseStats?.minions || 0;
    
    // Ratio
    const total = Math.max(1, threat + defense);
    const threatPct = (threat / total) * 100;
    const defensePct = (defense / total) * 100;
    const isSafe = defense >= threat;
    const isOverkill = defense > threat * 1.5;

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto z-30 flex flex-col items-center gap-2 group">
            
            {/* The Cycle Meter - Compact Mode */}
            <div className="bg-[#0c0a09]/90 border border-stone-700 p-2 rounded shadow-lg w-64 transition-all duration-300 opacity-80 group-hover:opacity-100">
                
                {/* Attacker Info */}
                <div className="flex justify-between items-center mb-1 border-b border-stone-800 pb-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Next Raid</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: attackerDef.color }}>
                        <Flag size={10} /> {attackerDef.name}
                    </div>
                </div>

                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                    <span className="text-red-500">Threat {Math.floor(threat)}</span>
                    <span className="text-blue-500">Def {defense}</span>
                </div>
                
                <div className="h-1.5 w-full bg-stone-900 rounded-full flex overflow-hidden mb-1">
                    <div className="h-full bg-red-700 transition-all duration-500" style={{ width: `${threatPct}%` }}></div>
                    <div className="h-full bg-blue-700 transition-all duration-500" style={{ width: `${defensePct}%` }}></div>
                </div>

                <div className={`text-center text-[9px] font-bold ${isOverkill ? 'text-yellow-500' : isSafe ? 'text-green-500' : 'text-red-500'}`}>
                    {isOverkill ? 'TOTAL DOMINANCE' : isSafe ? 'DEFENSES READY' : 'PREPARE FOR IMPACT'}
                </div>
            </div>

            {/* End Day Button */}
            <button 
                onClick={resolveNightPhase}
                className="group relative overflow-hidden bg-red-950 border border-red-800 text-red-200 px-6 py-2 font-serif font-bold uppercase text-sm tracking-widest hover:bg-red-900 transition-all shadow-[0_0_15px_rgba(153,27,27,0.3)] hover:shadow-[0_0_25px_rgba(153,27,27,0.6)] cursor-pointer"
            >
                <div className="flex items-center gap-2 relative z-10">
                    <Moon size={16} className="group-hover:rotate-12 transition-transform" />
                    <span>Face the Night</span>
                </div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
        </div>
    )
}

const SplatterOverlay = () => {
    const { state } = useGame();
    const [splats, setSplats] = useState<{id: string, x: number, y: number, scale: number}[]>([]);

    useEffect(() => {
        const lastEffect = state.effects[state.effects.length - 1];
        if (lastEffect && lastEffect.type === 'SPLAT_TOMATO') {
            const newSplat = {
                id: lastEffect.id,
                x: 20 + Math.random() * 60, // Random position on screen
                y: 20 + Math.random() * 60,
                scale: 0.8 + Math.random() * 0.5
            };
            setSplats(prev => [...prev, newSplat]);
            
            // Auto clean after 5 seconds
            setTimeout(() => {
                setSplats(prev => prev.filter(s => s.id !== newSplat.id));
            }, 5000);
        }
    }, [state.effects]);

    if (splats.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
            {splats.map(s => (
                <div 
                    key={s.id}
                    className="absolute bg-red-600/80 rounded-full blur-md opacity-90 animate-pulse"
                    style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: `${100 * s.scale}px`,
                        height: `${100 * s.scale}px`,
                        transform: `translate(-50%, -50%) scale(${s.scale})`,
                        boxShadow: 'inset 0 0 20px #7f1d1d'
                    }}
                >
                    {/* Drips */}
                    <div className="absolute top-full left-1/2 w-2 h-12 bg-red-600/80 rounded-full blur-sm -ml-1"></div>
                    <div className="absolute top-full left-1/3 w-1 h-8 bg-red-600/80 rounded-full blur-sm"></div>
                </div>
            ))}
            <div className="absolute bottom-10 w-full text-center">
                <div className="inline-block bg-black/80 text-red-500 font-serif px-4 py-2 border border-red-900 animate-bounce">
                    WIPE THE FILTH (Click Splats to Clean)
                </div>
            </div>
        </div>
    )
}

const EventTicker: React.FC = () => {
    const { state } = useGame();
    const [logs, setLogs] = useState(state.history.slice(0, 6));

    useEffect(() => {
        setLogs(state.history.slice(0, 6));
    }, [state.history]);

    return (
        <div className="absolute top-24 left-6 z-20 pointer-events-none max-w-sm hidden md:block">
            <h3 className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><ScrollText size={12}/> The Chronicle</h3>
            <div className="flex flex-col gap-1">
                {logs.map((log) => {
                    let color = 'text-stone-400';
                    if (log.type === 'LOOT') color = 'text-yellow-400 font-bold';
                    if (log.type === 'WORLD_EVENT') color = 'text-blue-300 italic';
                    if (log.type === 'DEFEAT') color = 'text-red-500';
                    if (log.type === 'VICTORY') color = 'text-green-400';
                    if (log.type === 'MAGIC') color = 'text-purple-400';
                    if (log.type === 'NARRATIVE') color = 'text-orange-400 border-l-4 border-orange-600 pl-2 bg-orange-950/20';

                    return (
                        <div key={log.id} className={`text-xs font-serif bg-black/60 px-2 py-1 border-l-2 border-stone-800 ${color} animate-pulse-slow relative group`}>
                            <span className="opacity-70 text-[9px] mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
                            {log.message}
                            
                            {/* CAUSE TOOLTIP - SHOWS WHY IT HAPPENED */}
                            {log.cause && (
                                <div className="absolute left-0 -top-6 hidden group-hover:flex bg-black border border-stone-600 text-stone-300 text-[10px] px-2 py-1 items-center gap-1 z-30 whitespace-nowrap">
                                    <Info size={10} className="text-blue-400" /> Cause: {log.cause}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const RealmStatusWidget: React.FC = () => {
    const { state } = useGame();
    const stats = state.realmStats;
    if (!stats) return null;

    let statusText = "STABLE";
    let statusColor = "text-stone-500";
    let icon = <Shield size={14} />;

    if (stats.fear > 70) { statusText = "CRISIS"; statusColor = "text-red-500"; icon = <AlertOctagon size={14} />; }
    else if (stats.hope > 70) { statusText = "GOLDEN AGE"; statusColor = "text-yellow-500"; }
    else if (stats.order < 30) { statusText = "ANARCHY"; statusColor = "text-orange-500"; }

    return (
        <div className="absolute top-24 right-6 pointer-events-none z-20 flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 border bg-black/80 ${statusColor} border-current`}>
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{statusText}</span>
            </div>
        </div>
    );
};

const RealTimeClock: React.FC = () => {
    const { state, isChronosOpen, toggleChronos } = useGame();
    const [displayTime, setDisplayTime] = useState("");
    const [subText, setSubText] = useState("Local Time");
    const [isCountdown, setIsCountdown] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();

            if (isChronosOpen) {
                // UNIFIED LOGIC: Match the ChronosProjection logic exactly
                const validTasks = state.tasks.filter(t => 
                    t && 
                    !t.completed && 
                    !t.failed && 
                    typeof t.deadline === 'number' &&
                    t.deadline > now
                );

                // Priority sort: Active Tasks First, then Future Tasks
                const nearestTask = validTasks.sort((a,b) => {
                    const aActive = a.startTime <= now;
                    const bActive = b.startTime <= now;
                    if (aActive && !bActive) return -1;
                    if (!aActive && bActive) return 1;
                    if (aActive && bActive) return a.deadline - b.deadline;
                    return a.startTime - b.startTime;
                })[0];

                if (nearestTask) {
                    const diff = nearestTask.deadline - now;
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    
                    setDisplayTime(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
                    setSubText(`DUE: ${nearestTask.title.substring(0, 15)}...`);
                    setIsCountdown(true);
                } else {
                    setDisplayTime("--:--:--");
                    setSubText("NO IMMINENT THREATS");
                    setIsCountdown(true); 
                }
            } else {
                // Standard Clock
                setDisplayTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
                setSubText("Local Time");
                setIsCountdown(false);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isChronosOpen, state.tasks]);

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto z-[60] flex flex-col items-center">
            {/* The visual style remains minimal unless in countdown mode */}
            <div className={`bg-[#0c0a09]/90 border px-3 py-1 md:px-4 md:py-2 flex items-center gap-3 rounded-sm shadow-lg transition-colors duration-300 ${isCountdown ? 'border-yellow-600' : 'border-stone-700'}`}>
                <Clock size={14} className={isCountdown ? "text-yellow-500" : "text-stone-400"} />
                <span className={`text-sm md:text-xl font-mono font-bold tracking-widest ${isCountdown ? 'text-yellow-400' : 'text-stone-200'}`}>
                    {displayTime}
                </span>
                
                {/* CHRONOS TOGGLE */}
                <div className="h-4 w-px bg-stone-700 mx-1"></div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleChronos();
                    }}
                    className={`hover:text-yellow-500 transition-colors cursor-pointer ${isChronosOpen ? 'text-yellow-500 animate-pulse' : 'text-stone-500'}`}
                    title="Toggle Chronos Projection (Next Task Countdown)"
                >
                    <Hourglass size={16} />
                </button>
            </div>
            <div className={`hidden md:block text-[10px] uppercase tracking-[0.3em] mt-1 bg-black/50 px-2 ${isCountdown ? 'text-yellow-600 font-bold' : 'text-stone-500'}`}>
                {subText}
            </div>
        </div>
    )
}

const SpellBar: React.FC = () => {
    const { state, castSpell } = useGame();
    const manaPercent = (state.mana / state.maxMana) * 100;

    return (
        <div className="absolute bottom-6 right-6 z-30 pointer-events-auto flex flex-col items-end gap-2">
            {/* Mana Bar */}
            <div className="w-32 h-2 bg-stone-900 border border-stone-700 relative overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-blue-900/50"></div>
                <div className="absolute inset-0 bg-blue-500 transition-all duration-300" style={{ width: `${manaPercent}%` }}></div>
            </div>
            <div className="text-[8px] md:text-[10px] text-blue-300 font-bold tracking-widest uppercase">Mana: {Math.floor(state.mana)}</div>

            {/* Spells */}
            <div className="flex gap-2 p-1 md:p-2 bg-black/80 border border-stone-800 rounded-lg scale-90 md:scale-100 origin-bottom-right">
                {SPELLS.map(spell => {
                    const canAfford = state.mana >= spell.cost;
                    const needsTarget = spell.targetReq && !state.selectedEnemyId;
                    const disabled = !canAfford || needsTarget;
                    
                    let Icon = Zap;
                    if (spell.icon === 'Heart') Icon = Heart;
                    if (spell.icon === 'Snowflake') Icon = Snowflake;
                    if (spell.icon === 'Sword') Icon = Sword;

                    return (
                        <button 
                            key={spell.id}
                            onClick={() => castSpell(spell.id)}
                            disabled={disabled}
                            className={`
                                relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border transition-all group cursor-pointer
                                ${disabled ? 'border-stone-800 text-stone-700 bg-stone-950 cursor-not-allowed' : 'border-blue-800 text-blue-400 bg-blue-950/30 hover:bg-blue-900/50 hover:border-blue-400 hover:scale-105 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]'}
                            `}
                            title={`${spell.name} (${spell.cost} Mana) - ${spell.desc}`}
                        >
                            <Icon size={18} />
                            <div className="absolute bottom-0.5 right-1 text-[8px] font-mono">{spell.cost}</div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export const HUD: React.FC = () => {
  const { state, toggleGrimoire, toggleProfile, toggleMarket, toggleAudit, toggleSettings, closeVision, rerollVision, triggerEvent, toggleDiplomacy } = useGame();
  const [cinematic, setCinematic] = useState(false);
  
  const isConnected = state.syncConfig?.isConnected;
  const hpPercent = (state.heroHp / state.maxHeroHp) * 100;
  const basePercent = (state.baseHp / state.maxBaseHp) * 100;

  const handleSummonMirror = () => {
      rerollVision(); // Pre-fetch content
      triggerEvent('VISION_RITUAL');
  };

  if (cinematic) {
      return (
          <div className="absolute inset-0 pointer-events-none z-50">
               <button onClick={() => setCinematic(false)} className="absolute bottom-6 right-6 pointer-events-auto text-stone-500 hover:text-white bg-black/50 p-2 rounded-full border border-stone-700 cursor-pointer">
                   <Minimize2 size={24} />
               </button>
               {state.activeMapEvent === 'VISION_RITUAL' && (
                <div className="absolute top-24 right-6 z-50 pointer-events-auto">
                    <button onClick={closeVision} className="bg-purple-900 text-white border border-purple-400 px-4 py-2 rounded shadow-lg flex items-center gap-2 cursor-pointer">
                        <Eye size={16} /> Exit Vision
                    </button>
                </div>
              )}
          </div>
      )
  }

  // Ensure visibility even if a modal was previously open
  const containerClass = "absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between z-40";

  return (
    <div className={containerClass}>
      <VazarothHUD />
      <WorldRumorHUD />
      <RealmStatusWidget />
      <RealTimeClock />
      <CycleHUD />
      <EventTicker />
      <SplatterOverlay />
      <SpellBar />

      {state.activeMapEvent === 'VISION_RITUAL' && (
        <div className="absolute top-24 right-6 z-50 pointer-events-auto">
            <button onClick={closeVision} className="bg-purple-900 text-white border border-purple-400 px-4 py-2 rounded shadow-lg flex items-center gap-2 cursor-pointer">
                <Eye size={16} /> Exit Vision
            </button>
        </div>
      )}

      {/* HEADER BAR (Stats & Tools) */}
      <div className="flex flex-wrap justify-between items-start pointer-events-auto gap-2 md:gap-4 relative z-20">
        <div>
          <h1 className="text-lg md:text-3xl font-serif tracking-widest text-white drop-shadow-lg">PROJECT ECLIPSE</h1>
          <div className="flex flex-wrap gap-2 md:gap-3 mt-1 text-[10px] md:text-sm text-stone-400 font-serif tracking-widest">
             <span>ERA: <span className="text-yellow-500">{state.era}</span></span>
             <span>LVL {state.playerLevel}</span>
             <span className="text-[#fbbf24] flex items-center gap-1 font-bold"><Coins size={10} /> {state.gold}g</span>
             {isConnected ? (
                 <span className="text-green-500 flex items-center gap-1 animate-pulse border border-green-900/50 px-2 bg-green-950/20 rounded cursor-pointer" title="Connected to Cloud" onClick={toggleSettings}>
                     <Wifi size={10} /> {state.syncConfig?.roomId?.substring(0,6)}...
                 </span>
             ) : (
                 <span className="text-red-500 flex items-center gap-1 border border-red-900/50 px-2 bg-red-950/20 rounded cursor-pointer" title="Offline - Click to Connect" onClick={toggleSettings}>
                     <WifiOff size={10} /> OFFLINE
                 </span>
             )}
          </div>
        </div>
        
        {/* TOOLBAR */}
        <div className="flex gap-1 md:gap-2">
             <button onClick={handleSummonMirror} className="bg-purple-950/50 border border-purple-800 text-purple-300 p-2 md:p-3 hover:bg-purple-900 hover:text-white cursor-pointer" title="Summon Vision Mirror (Focus)"><Eye size={16} /></button>
             <div className="w-px bg-stone-800 mx-1"></div>
             <button onClick={() => setCinematic(true)} className="bg-stone-950 border border-stone-800 text-stone-500 p-2 md:p-3 hover:bg-stone-900 hover:text-white cursor-pointer" title="Cinematic Mode"><Maximize2 size={16} /></button>
             <button onClick={toggleSettings} className={`border p-2 md:p-3 hover:bg-stone-800 cursor-pointer ${isConnected ? 'bg-stone-900 border-stone-600 text-stone-400' : 'bg-red-950/30 border-red-900 text-red-500 animate-pulse'}`} title="Settings"><Settings size={16} /></button>
             <button onClick={toggleAudit} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800 cursor-pointer" title="Audit"><PieChart size={16} /></button>
             <button onClick={toggleDiplomacy} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800 cursor-pointer" title="Map & Diplomacy"><MapIcon size={16} /></button>
             <button onClick={toggleMarket} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800 cursor-pointer" title="Market"><ShoppingBag size={16} /></button>
             <button onClick={toggleProfile} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800 cursor-pointer" title="Hero"><User size={16} /></button>
            <button onClick={toggleGrimoire} className="hidden md:flex bg-stone-900 border border-stone-600 text-stone-200 px-3 py-2 md:px-4 md:py-2 font-serif hover:bg-stone-800 uppercase tracking-widest text-xs md:text-sm items-center gap-2 cursor-pointer">
                <span className="hidden md:inline">Grimoire</span>
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-end gap-4 pointer-events-auto">
        <div className="hidden md:block flex-1 bg-black/80 backdrop-blur-sm p-4 border-l-4 border-l-yellow-600 max-w-2xl">
           <p className="text-stone-200 font-serif italic text-sm leading-relaxed">"{state.sageMessage}"</p>
        </div>

        <div className="w-48 md:w-64 space-y-2 bg-black/80 p-2 md:p-3 border border-stone-800">
           <div>
             <div className="flex justify-between text-[10px] text-stone-400 mb-1">
               <span className="flex items-center gap-1"><Zap size={10}/> HERO</span>
               <span>{Math.floor(state.heroHp)}</span>
             </div>
             <div className="w-full h-1.5 bg-stone-800"><div className="h-full bg-blue-700 transition-all" style={{ width: `${hpPercent}%` }}></div></div>
           </div>
           <div>
             <div className="flex justify-between text-[10px] text-stone-400 mb-1">
               <span className="flex items-center gap-1"><Shield size={10}/> BASE</span>
               <span>{Math.floor(state.baseHp)}</span>
             </div>
             <div className="w-full h-1.5 bg-stone-800"><div className={`h-full transition-all ${basePercent < 30 ? 'bg-red-600' : 'bg-stone-500'}`} style={{ width: `${basePercent}%` }}></div></div>
           </div>
        </div>
      </div>

      {/* MOBILE FAB FOR GRIMOIRE */}
      <div className="absolute bottom-28 right-0 z-50 pointer-events-auto md:hidden">
          <button 
            onClick={toggleGrimoire} 
            className="w-16 h-16 rounded-full bg-yellow-900/90 border-2 border-yellow-500 shadow-2xl flex items-center justify-center text-yellow-100 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          >
              <BookOpen size={28} />
          </button>
      </div>
    </div>
  );
};
