
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Activity, Skull, Heart, Shield, Scroll, Users, Globe, Flag, Hammer, BookOpen, Clock, Info, Feather } from 'lucide-react';
import { FACTIONS } from '../../constants';

export const AuditModal: React.FC = () => {
    const { state, toggleAudit } = useGame();
    const [tab, setTab] = useState<'LOG' | 'POPULATION' | 'GEOPOLITICS' | 'STORY'>('LOG');

    if (!state.isAuditOpen) return null;

    const stats = state.realmStats || { hope: 50, fear: 10, order: 50 };
    const narrative = state.dailyNarrative;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 pointer-events-auto">
            <div className="relative w-full max-w-6xl h-[85vh] bg-[#0c0a09] border-2 border-stone-800 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-[#1c1917]">
                    <div className="flex items-center gap-4">
                         <h2 className="text-2xl text-stone-200 font-serif font-bold flex items-center gap-2"><Activity /> CHRONICLES</h2>
                         <div className="flex gap-2">
                             <button onClick={() => setTab('LOG')} className={`px-4 py-1 text-xs border ${tab === 'LOG' ? 'border-yellow-600 text-yellow-500' : 'border-stone-700 text-stone-500'}`}>EVENTS</button>
                             <button onClick={() => setTab('STORY')} className={`px-4 py-1 text-xs border ${tab === 'STORY' ? 'border-yellow-600 text-yellow-500' : 'border-stone-700 text-stone-500'}`}>NARRATIVE</button>
                             <button onClick={() => setTab('POPULATION')} className={`px-4 py-1 text-xs border ${tab === 'POPULATION' ? 'border-yellow-600 text-yellow-500' : 'border-stone-700 text-stone-500'}`}>CENSUS</button>
                             <button onClick={() => setTab('GEOPOLITICS')} className={`px-4 py-1 text-xs border ${tab === 'GEOPOLITICS' ? 'border-yellow-600 text-yellow-500' : 'border-stone-700 text-stone-500'}`}>GEOPOLITICS</button>
                         </div>
                    </div>
                    <button onClick={toggleAudit} className="text-stone-500"><X size={24} /></button>
                </div>

                {/* REALM STATS HEADER */}
                <div className="grid grid-cols-4 border-b border-stone-800 bg-black text-xs">
                    <div className="p-4 flex items-center gap-3 border-r border-stone-800">
                        <Heart className="text-yellow-600" size={20} />
                        <div><div className="uppercase text-stone-500">Hope</div><div className="text-lg font-bold text-stone-200">{stats.hope}%</div></div>
                    </div>
                    <div className="p-4 flex items-center gap-3 border-r border-stone-800">
                        <Skull className="text-red-800" size={20} />
                        <div><div className="uppercase text-stone-500">Fear</div><div className="text-lg font-bold text-stone-200">{stats.fear}%</div></div>
                    </div>
                    <div className="p-4 flex items-center gap-3 border-r border-stone-800">
                        <Shield className="text-blue-700" size={20} />
                        <div><div className="uppercase text-stone-500">Order</div><div className="text-lg font-bold text-stone-200">{stats.order}%</div></div>
                    </div>
                    <div className="p-4 flex items-center gap-3">
                        <Hammer className="text-stone-400" size={20} />
                        <div>
                             <div className="uppercase text-stone-500">Infrastructure</div>
                             <div className="text-[10px] text-stone-400">Forge: {state.structures?.forgeLevel || 0} | Walls: {state.structures?.wallsLevel || 0}</div>
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#0c0a09]">
                    {tab === 'LOG' && (
                        <div className="space-y-4">
                            {state.history.map(log => (
                                <div key={log.id} className={`border-l-2 pl-4 py-2 ${log.type === 'VICTORY' ? 'border-yellow-600' : log.type === 'DEFEAT' ? 'border-red-600' : log.type === 'DIPLOMACY' ? 'border-blue-500' : 'border-stone-700'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-bold ${log.type === 'VICTORY' ? 'text-yellow-500' : log.type === 'DEFEAT' ? 'text-red-500' : log.type === 'DIPLOMACY' ? 'text-blue-400' : 'text-stone-300'}`}>
                                            {log.message}
                                        </span>
                                        <span className="text-[10px] text-stone-600 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-stone-500 text-xs mt-1 italic font-serif">"{log.details}"</p>
                                    {log.cause && (
                                        <div className="mt-1 flex items-center gap-1 text-[9px] text-stone-600 uppercase tracking-widest">
                                            <Info size={10} /> Origin: {log.cause}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'STORY' && (
                        <div className="flex flex-col h-full max-w-4xl mx-auto">
                            <div className="text-center mb-8 border-b border-stone-800 pb-4">
                                <h3 className="text-3xl font-serif text-stone-200 font-bold tracking-[0.2em] uppercase">{narrative?.title || "The Unwritten Day"}</h3>
                                <div className="text-xs text-stone-500 mt-2 font-mono">
                                    {new Date().toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                                </div>
                                <div className="flex justify-center gap-4 mt-4 text-xs font-mono text-stone-500">
                                    <span>Theme: <span className="text-yellow-600">{narrative?.theme || "PENDING"}</span></span>
                                    <span>Current Stage: <span className="text-blue-400 animate-pulse">{narrative?.currentStage || "DAWN"}</span></span>
                                    <span>Intensity: <span className="text-red-500">{narrative?.intensity || 0}%</span></span>
                                </div>
                            </div>

                            {/* THE STORY PARAGRAPH */}
                            <div className="flex-1 bg-[#151210] p-8 border border-stone-800 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Feather size={120} className="text-stone-500" />
                                </div>
                                <p className="font-serif text-lg text-stone-300 leading-loose indent-8 first-letter:text-5xl first-letter:font-bold first-letter:text-yellow-600 first-letter:mr-3 first-letter:float-left">
                                    {narrative?.fullStory || "The ink is dry. The scribe waits for the first event..."}
                                </p>
                                <div className="mt-8 flex justify-center">
                                    <div className="w-16 h-1 bg-stone-800 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'POPULATION' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {state.population.map(npc => (
                                <div key={npc.id} className={`bg-[#151210] p-4 border ${npc.status === 'MAD' ? 'border-purple-900/50' : 'border-stone-800'} group relative`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-stone-200 font-bold font-serif">{npc.name}</div>
                                            <div className="text-[10px] text-stone-500 uppercase tracking-widest">{npc.race} {npc.role}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            {(npc.traits || []).map(t => <span key={t} className="px-1 bg-stone-800 text-[9px] text-stone-400 border border-stone-700">{t}</span>)}
                                        </div>
                                    </div>

                                    {/* Stats Bar */}
                                    <div className="flex gap-2 text-[10px] font-mono text-stone-600 mb-2">
                                        <span title="Strength">STR:{npc.stats?.strength || 1}</span>
                                        <span title="Intellect">INT:{npc.stats?.intellect || 1}</span>
                                        <span title="Loyalty">LOY:{npc.stats?.loyalty || 50}</span>
                                    </div>
                                    
                                    <div className="space-y-1 mt-3 pt-3 border-t border-stone-800/50">
                                        {(npc.memories || []).slice(-3).map((mem, i) => (
                                            <div key={i} className="text-[10px] text-stone-600 italic flex gap-2">
                                                <span className="text-stone-700">-</span> {mem}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'GEOPOLITICS' && (
                        <div className="space-y-8">
                             <h3 className="text-xl font-serif text-stone-300 border-b border-stone-800 pb-2">Known World Factions</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(state.factions || []).map(faction => {
                                    const def = FACTIONS[faction.id as keyof typeof FACTIONS];
                                    const statusColor = faction.status === 'ALLIED' ? 'text-green-500' : faction.status === 'HOSTILE' ? 'text-red-500' : faction.status === 'WAR' ? 'text-red-700 font-black' : 'text-stone-400';
                                    
                                    return (
                                        <div key={faction.id} className="bg-[#151210] border border-stone-800 p-6 flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <Flag size={24} style={{ color: def?.color || '#fff' }} />
                                                    <div>
                                                        <h4 className="text-lg font-bold text-stone-200 font-serif">{faction.name}</h4>
                                                        <div className="text-xs text-stone-500">{def?.desc}</div>
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-bold uppercase tracking-widest ${statusColor}`}>
                                                    {faction.status}
                                                </div>
                                            </div>
                                            
                                            {/* Rep Bar */}
                                            <div>
                                                <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                                                    <span>Hostility</span>
                                                    <span>Reputation: {faction.reputation}</span>
                                                    <span>Alliance</span>
                                                </div>
                                                <div className="h-2 w-full bg-stone-900 rounded-full relative overflow-hidden">
                                                     <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-stone-600"></div>
                                                     <div 
                                                        className={`absolute top-0 bottom-0 transition-all duration-500 ${faction.reputation > 0 ? 'bg-green-700 left-1/2' : 'bg-red-800 right-1/2'}`}
                                                        style={{ 
                                                            width: `${Math.abs(faction.reputation)/2}%`, 
                                                            left: faction.reputation > 0 ? '50%' : 'auto',
                                                            right: faction.reputation < 0 ? '50%' : 'auto'
                                                        }}
                                                     ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
