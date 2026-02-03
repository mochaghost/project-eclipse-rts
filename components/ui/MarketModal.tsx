
import React, { useState } from 'react';
import { useGame, SHOP_ITEMS } from '../../context/GameContext';
import { X, ShoppingBag, Coins, Hammer, FlaskConical, Archive, ArrowUpCircle } from 'lucide-react';

export const MarketModal: React.FC = () => {
  const { state, toggleMarket, buyItem, sellItem } = useGame();
  const [tab, setTab] = useState<'CONSUMABLES' | 'ARCHITECTURE' | 'SELL'>('CONSUMABLES');

  if (!state.isMarketOpen) return null;

  const consumables = SHOP_ITEMS.filter(i => i.tier === 0);
  const structures = SHOP_ITEMS.filter(i => i.tier && i.tier > 0);
  const inventory = state.inventory || [];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 pointer-events-auto">
      <div className="relative w-full max-w-4xl h-[80vh] bg-[#0c0a09] border-2 border-yellow-900/50 flex flex-col shadow-2xl">
        {/* HEADER */}
        <div className="bg-[#1c1917] p-6 border-b border-yellow-900/30 flex justify-between items-center">
            <h2 className="text-2xl text-yellow-600 font-serif font-bold flex items-center gap-3 tracking-widest"><ShoppingBag size={24} /> GUILD MARKET</h2>
            <div className="flex items-center gap-6">
                 <div className="text-yellow-500 font-bold font-serif text-xl flex items-center gap-2"><Coins className="text-yellow-700"/> {state.gold}g</div>
                 <button onClick={toggleMarket} className="text-stone-500 hover:text-white"><X size={24} /></button>
            </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-stone-800 bg-[#151210]">
            <button onClick={() => setTab('CONSUMABLES')} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${tab === 'CONSUMABLES' ? 'bg-[#1c1917] text-yellow-500 border-b-2 border-yellow-500' : 'text-stone-500 hover:text-stone-300'}`}>
                <FlaskConical size={14}/> Supplies
            </button>
            <button onClick={() => setTab('ARCHITECTURE')} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${tab === 'ARCHITECTURE' ? 'bg-[#1c1917] text-blue-400 border-b-2 border-blue-400' : 'text-stone-500 hover:text-stone-300'}`}>
                <Hammer size={14}/> Architecture
            </button>
            <button onClick={() => setTab('SELL')} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${tab === 'SELL' ? 'bg-[#1c1917] text-green-500 border-b-2 border-green-500' : 'text-stone-500 hover:text-stone-300'}`}>
                <Archive size={14}/> Sell Loot ({inventory.length})
            </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-[#0c0a09]">
            
            {/* CONSUMABLES TAB */}
            {tab === 'CONSUMABLES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {consumables.map((item) => (
                        <div key={item.id} className="border border-stone-800 bg-[#151210] p-4 flex flex-col justify-between group hover:border-yellow-700 transition-colors">
                            <div>
                                <div className="font-serif font-bold text-stone-200 mb-1">{item.name}</div>
                                <div className="text-xs text-stone-500 mb-4 h-10">{item.description}</div>
                            </div>
                            <button 
                                onClick={() => buyItem(item.id)} 
                                disabled={state.gold < item.cost}
                                className={`w-full py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${state.gold >= item.cost ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-800 hover:bg-yellow-900/40' : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'}`}
                            >
                                Buy {item.cost}g
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ARCHITECTURE TAB */}
            {tab === 'ARCHITECTURE' && (
                <div className="space-y-8">
                    <p className="text-stone-500 text-center italic text-sm font-serif">"Civilization is built on the ruins of the lazy."</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {structures.map((item) => {
                            // Check if already bought (logic dependent on item type)
                            let currentLevel = 0;
                            if (item.type === 'UPGRADE_FORGE') currentLevel = state.structures.forgeLevel;
                            if (item.type === 'UPGRADE_WALLS') currentLevel = state.structures.wallsLevel;
                            if (item.type === 'UPGRADE_LIBRARY') currentLevel = state.structures.libraryLevel;
                            
                            const isOwned = currentLevel >= (item.tier || 0);
                            const isNext = currentLevel === ((item.tier || 0) - 1);
                            
                            return (
                                <div key={item.id} className={`relative p-6 border-2 flex flex-col justify-between h-64 ${isOwned ? 'border-green-900/30 bg-green-950/5' : isNext ? 'border-blue-900 bg-blue-950/10' : 'border-stone-800 bg-black opacity-50'}`}>
                                    {isOwned && <div className="absolute top-2 right-2 text-green-500 text-[10px] uppercase font-bold border border-green-900 px-2 bg-black">Owned</div>}
                                    
                                    <div>
                                        <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Tier {item.tier} Structure</div>
                                        <h3 className={`text-xl font-serif font-bold mb-2 ${isOwned ? 'text-green-400' : isNext ? 'text-blue-300' : 'text-stone-500'}`}>{item.name}</h3>
                                        <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>
                                    </div>

                                    {!isOwned && (
                                        <button 
                                            onClick={() => buyItem(item.id)}
                                            disabled={!isNext || state.gold < item.cost}
                                            className={`w-full py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${
                                                !isNext ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed' :
                                                state.gold < item.cost ? 'bg-red-950/20 text-red-500 border border-red-900 cursor-not-allowed' :
                                                'bg-blue-900/20 text-blue-400 border border-blue-500 hover:bg-blue-900/40'
                                            }`}
                                        >
                                            {!isNext ? 'Locked' : <><ArrowUpCircle size={14} /> Construct {item.cost}g</>}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* SELL LOOT TAB */}
            {tab === 'SELL' && (
                <div>
                    {inventory.length === 0 ? (
                        <div className="text-center py-20 text-stone-600">
                            <Archive size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Your inventory is empty. Slay enemies to find loot.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inventory.map((item) => (
                                <div key={item.id} className="border border-stone-800 bg-[#151210] p-3 flex gap-3 group hover:border-red-900 transition-colors">
                                    <div className="w-12 h-12 bg-black border border-stone-800 flex items-center justify-center text-stone-600 font-serif font-bold text-xl">
                                        {item.type === 'WEAPON' ? 'W' : item.type === 'ARMOR' ? 'A' : 'R'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-stone-300 truncate">{item.name}</div>
                                        <div className="text-[10px] text-stone-500 truncate italic">"{item.lore.substring(0,30)}..."</div>
                                        <div className="mt-2 flex justify-between items-center">
                                            <span className="text-yellow-600 text-xs font-bold">{Math.floor(item.value / 2)}g</span>
                                            <button onClick={() => sellItem(item.id)} className="px-3 py-1 bg-stone-800 text-stone-400 text-[10px] uppercase hover:bg-red-900 hover:text-white transition-colors">Sell</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
