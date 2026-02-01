
import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Zap, Shield, Coins, ShoppingBag, Eye, User, PieChart, Settings, Cloud, Map as MapIcon, ScrollText, AlertOctagon, Maximize2, Minimize2, Heart, Snowflake, Sword, Clock, BookOpen } from 'lucide-react';
import { VazarothHUD } from './VazarothHUD';
import { WorldRumorHUD } from './WorldRumorHUD';
import { SPELLS } from '../../constants';

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
    const [logs, setLogs] = useState(state.history.slice(0, 5));

    useEffect(() => {
        setLogs(state.history.slice(0, 5));
    }, [state.history]);

    return (
        <div className="absolute bottom-24 left-6 z-20 pointer-events-none max-w-sm hidden md:block">
            <h3 className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><ScrollText size={12}/> The Chronicle</h3>
            <div className="flex flex-col gap-1">
                {logs.map((log) => {
                    let color = 'text-stone-400';
                    if (log.type === 'LOOT') color = 'text-yellow-400 font-bold';
                    if (log.type === 'WORLD_EVENT') color = 'text-blue-300 italic';
                    if (log.type === 'DEFEAT') color = 'text-red-500';
                    if (log.type === 'VICTORY') color = 'text-green-400';
                    if (log.type === 'MAGIC') color = 'text-purple-400';

                    return (
                        <div key={log.id} className={`text-xs font-serif bg-black/60 px-2 py-1 border-l-2 border-stone-800 ${color} animate-pulse-slow`}>
                            <span className="opacity-70 text-[9px] mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
                            {log.message}
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
        <div className="absolute top-20 md:top-24 left-4 md:left-6 pointer-events-none z-20 flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 border bg-black/80 ${statusColor} border-current`}>
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{statusText}</span>
            </div>
        </div>
    );
};

const RealTimeClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center">
            <div className="bg-[#0c0a09]/90 border border-stone-700 px-3 py-1 md:px-4 md:py-2 flex items-center gap-3 rounded-sm shadow-lg">
                <Clock size={14} className="text-stone-400" />
                <span className="text-sm md:text-xl font-mono font-bold text-stone-200 tracking-widest">
                    {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                </span>
            </div>
            <div className="hidden md:block text-[10px] text-stone-500 uppercase tracking-[0.3em] mt-1 bg-black/50 px-2">Local Time</div>
        </div>
    )
}

const SpellBar: React.FC = () => {
    const { state, castSpell } = useGame();
    const manaPercent = (state.mana / state.maxMana) * 100;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2">
            {/* Mana Bar */}
            <div className="w-48 md:w-64 h-2 bg-stone-900 border border-stone-700 relative overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-blue-900/50"></div>
                <div className="absolute inset-0 bg-blue-500 transition-all duration-300" style={{ width: `${manaPercent}%` }}></div>
            </div>
            <div className="text-[8px] md:text-[10px] text-blue-300 font-bold tracking-widest uppercase">Mana: {Math.floor(state.mana)}</div>

            {/* Spells */}
            <div className="flex gap-2 p-1 md:p-2 bg-black/80 border border-stone-800 rounded-lg scale-90 md:scale-100 origin-bottom">
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
                                relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border transition-all group
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
  const { state, toggleGrimoire, toggleProfile, toggleMarket, toggleAudit, toggleSettings, closeVision, toggleDiplomacy } = useGame();
  const [cinematic, setCinematic] = useState(false);
  
  const isConnected = state.syncConfig?.isConnected;
  const hpPercent = (state.heroHp / state.maxHeroHp) * 100;
  const basePercent = (state.baseHp / state.maxBaseHp) * 100;

  if (cinematic) {
      return (
          <div className="absolute inset-0 pointer-events-none z-50">
               <button onClick={() => setCinematic(false)} className="absolute bottom-6 right-6 pointer-events-auto text-stone-500 hover:text-white bg-black/50 p-2 rounded-full border border-stone-700">
                   <Minimize2 size={24} />
               </button>
               {state.activeMapEvent === 'VISION_RITUAL' && (
                <div className="absolute top-24 right-6 z-50 pointer-events-auto">
                    <button onClick={closeVision} className="bg-purple-900 text-white border border-purple-400 px-4 py-2 rounded shadow-lg flex items-center gap-2">
                        <Eye size={16} /> Exit Vision
                    </button>
                </div>
              )}
          </div>
      )
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between z-10">
      <VazarothHUD />
      <WorldRumorHUD />
      <RealmStatusWidget />
      <RealTimeClock />
      <EventTicker />
      <SplatterOverlay />
      <SpellBar />

      {state.activeMapEvent === 'VISION_RITUAL' && (
        <div className="absolute top-24 right-6 z-50 pointer-events-auto">
            <button onClick={closeVision} className="bg-purple-900 text-white border border-purple-400 px-4 py-2 rounded shadow-lg flex items-center gap-2">
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
             {isConnected && <span className="text-green-500 flex items-center gap-1 animate-pulse"><Cloud size={10} /> SYNC</span>}
          </div>
        </div>
        
        {/* TOOLBAR */}
        <div className="flex gap-1 md:gap-2">
             <button onClick={() => setCinematic(true)} className="bg-stone-950 border border-stone-800 text-stone-500 p-2 md:p-3 hover:bg-stone-900 hover:text-white" title="Cinematic Mode"><Maximize2 size={16} /></button>
             <button onClick={toggleSettings} className="bg-stone-900 border border-stone-600 text-stone-400 p-2 md:p-3 hover:bg-stone-800" title="Settings"><Settings size={16} /></button>
             <button onClick={toggleAudit} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800" title="Audit"><PieChart size={16} /></button>
             <button onClick={toggleDiplomacy} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800" title="Map & Diplomacy"><MapIcon size={16} /></button>
             <button onClick={toggleMarket} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800" title="Market"><ShoppingBag size={16} /></button>
             <button onClick={toggleProfile} className="bg-stone-900 border border-stone-600 text-stone-200 p-2 md:p-3 hover:bg-stone-800" title="Hero"><User size={16} /></button>
            <button onClick={toggleGrimoire} className="bg-stone-900 border border-stone-600 text-stone-200 px-3 py-2 md:px-4 md:py-2 font-serif hover:bg-stone-800 uppercase tracking-widest text-xs md:text-sm flex items-center gap-2">
                <BookOpen size={16} className="md:hidden" />
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
    </div>
  );
};
