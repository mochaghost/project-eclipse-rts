
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { FACTIONS } from '../../constants';
import { X, HandCoins, MessageSquare, Sword, Scroll, Map as MapIcon, Flag } from 'lucide-react';
import { FactionKey } from '../../types';

export const DiplomacyMap: React.FC = () => {
    const { state, toggleDiplomacy, interactWithFaction } = useGame();
    const [selectedFaction, setSelectedFaction] = useState<FactionKey | null>(null);

    if (!state.isDiplomacyOpen) return null;

    const factionList = state.factions || [];
    const activeFaction = selectedFaction ? factionList.find(f => f.id === selectedFaction) : null;
    const activeDef = activeFaction ? FACTIONS[activeFaction.id] : null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 pointer-events-auto">
            <div className="relative w-full max-w-6xl h-[80vh] bg-[#0c0a09] border-2 border-stone-800 flex shadow-2xl overflow-hidden">
                <button onClick={toggleDiplomacy} className="absolute top-4 right-4 z-50 text-stone-500 hover:text-white"><X size={24} /></button>

                {/* Left: The Map / List */}
                <div className="w-1/3 border-r border-stone-800 bg-[#151210] flex flex-col">
                    <div className="p-6 border-b border-stone-800 bg-[#1c1917]">
                        <h2 className="text-xl font-serif font-bold text-stone-200 flex items-center gap-2"><MapIcon size={20} /> WAR ROOM</h2>
                        <div className="text-xs text-stone-500 mt-1 uppercase tracking-widest">Select a Kingdom</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {factionList.map(f => {
                             const def = FACTIONS[f.id];
                             const isSelected = selectedFaction === f.id;
                             return (
                                 <div 
                                    key={f.id}
                                    onClick={() => setSelectedFaction(f.id)}
                                    className={`p-4 border mb-2 cursor-pointer transition-all ${isSelected ? 'bg-stone-800 border-yellow-600' : 'bg-black border-stone-800 hover:border-stone-600'}`}
                                 >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-serif font-bold text-stone-200" style={{ color: isSelected ? def.color : undefined }}>{f.name}</span>
                                        <Flag size={14} style={{ color: def.color }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-stone-500 uppercase tracking-widest">
                                        <span>{f.status}</span>
                                        <span>Rep: {f.reputation}</span>
                                    </div>
                                 </div>
                             )
                        })}
                    </div>
                </div>

                {/* Right: Interaction Panel */}
                <div className="flex-1 bg-[#0c0a09] relative flex flex-col">
                    {activeFaction && activeDef ? (
                        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
                            {/* Header */}
                            <div className="mb-8 text-center border-b border-stone-800 pb-6">
                                <div className="inline-block p-4 border-2 rounded-full mb-4" style={{ borderColor: activeDef.color }}>
                                    <Flag size={48} style={{ color: activeDef.color }} />
                                </div>
                                <h1 className="text-4xl font-serif font-bold text-white mb-2">{activeFaction.name}</h1>
                                <p className="text-stone-400 italic font-serif">"{activeDef.desc}"</p>
                                <div className={`inline-block px-4 py-1 mt-4 text-xs font-bold border uppercase tracking-[0.2em] ${activeFaction.reputation > 0 ? 'border-green-800 text-green-500 bg-green-950/20' : 'border-red-800 text-red-500 bg-red-950/20'}`}>
                                    Status: {activeFaction.status}
                                </div>
                            </div>

                            {/* Actions Grid */}
                            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                                <button 
                                    onClick={() => interactWithFaction(activeFaction.id, 'GIFT')}
                                    disabled={state.gold < 50}
                                    className={`p-6 border flex flex-col items-center gap-2 hover:bg-[#151210] transition-colors ${state.gold < 50 ? 'opacity-50 border-stone-800 cursor-not-allowed' : 'border-stone-700 cursor-pointer'}`}
                                >
                                    <HandCoins size={24} className="text-yellow-500" />
                                    <span className="font-serif font-bold text-stone-200">Send Gift</span>
                                    <span className="text-xs text-yellow-600">Cost: 50g | +10 Rep</span>
                                </button>

                                <button 
                                    onClick={() => interactWithFaction(activeFaction.id, 'TRADE')}
                                    disabled={state.gold < 20}
                                    className={`p-6 border flex flex-col items-center gap-2 hover:bg-[#151210] transition-colors ${state.gold < 20 ? 'opacity-50 border-stone-800 cursor-not-allowed' : 'border-stone-700 cursor-pointer'}`}
                                >
                                    <Scroll size={24} className="text-blue-500" />
                                    <span className="font-serif font-bold text-stone-200">Trade Route</span>
                                    <span className="text-xs text-yellow-600">Cost: 20g | +5 Rep</span>
                                </button>

                                <button 
                                    onClick={() => interactWithFaction(activeFaction.id, 'INSULT')}
                                    className="p-6 border border-stone-700 flex flex-col items-center gap-2 hover:bg-red-950/20 transition-colors cursor-pointer"
                                >
                                    <Sword size={24} className="text-red-500" />
                                    <span className="font-serif font-bold text-stone-200">Insult</span>
                                    <span className="text-xs text-stone-500">Free | -20 Rep</span>
                                </button>

                                <button 
                                    onClick={() => interactWithFaction(activeFaction.id, 'PROPAGANDA')}
                                    disabled={state.gold < 100}
                                    className={`p-6 border flex flex-col items-center gap-2 hover:bg-[#151210] transition-colors ${state.gold < 100 ? 'opacity-50 border-stone-800 cursor-not-allowed' : 'border-stone-700 cursor-pointer'}`}
                                >
                                    <MessageSquare size={24} className="text-purple-500" />
                                    <span className="font-serif font-bold text-stone-200">Spread Lies</span>
                                    <span className="text-xs text-yellow-600">Cost: 100g | -30 Rep | +Hope</span>
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-stone-600">
                            <MapIcon size={64} className="mb-4 opacity-20" />
                            <p className="font-serif tracking-widest uppercase">Select a Kingdom to begin diplomacy</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
