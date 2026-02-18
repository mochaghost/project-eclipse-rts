
import React, { useState } from 'react';
import { useGame, getDynamicShopItems } from '../../context/GameContext';
import { X, ShoppingBag, Coins, Hammer, FlaskConical, Archive, ArrowUpCircle, Dna } from 'lucide-react';

export const MarketModal: React.FC = () => {
  const { state, toggleMarket, buyItem, sellItem } = useGame();
  const [tab, setTab] = useState<'CONSUMABLES' | 'ARCHITECTURE' | 'SELL'>('CONSUMABLES');

  if (!state.isMarketOpen) return null;

  // Use Dynamic Generator for infinite progression
  const shopItems = getDynamicShopItems(state);
  const consumables = shopItems.filter(i => i.tier === 0);
  const structures = shopItems.filter(i => i.tier && i.tier > 0);
  const inventory = state.inventory || [];

  const handleBuyStructure = (itemId: string) => {
      buyItem(itemId);
      // Close market to show the construction effect/visual
      toggleMarket();
  };

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
                <FlaskConical size={14}/> Supplies & Mercs
            </button>
            <button onClick={() => setTab('ARCHITECTURE')} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${tab === 'ARCHITECTURE' ? 'bg-[#1c1917] text-blue-400 border-b-2 border-blue-400' : 'text-stone-500 hover:text-stone-300'}`}>
                <Hammer size={14}/> Infrastructure
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
                        <div key={item.id} className={`border p-4 flex flex-col justify-between group transition-colors ${item.id === 'MYSTERY_BOX' ? 'border-purple-900 bg-purple-950/10' : 'border-stone-800 bg-[#151210] hover:border-yellow-700'}`}>
                            <div>
                                <div className={`font-serif font-bold mb-1 ${item.id === 'MYSTERY_BOX' ? 'text-purple-400 flex items-center gap-2' : 'text-stone-200'}`}>
                                    {item.id === 'MYSTERY_BOX' && <Dna size={14} className="animate-spin-slow"/>}
                                    {item.name}
                                </div>
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

            {/* ARCHITECTURE TAB - INFINITE SCALING */}
            {tab === 'ARCHITECTURE' && (
                <div className="space-y-8">
                    <p className="text-stone-500 text-center italic text-sm font-serif">"The city grows ever upwards, defying the void."</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {structures.map((item) => {
                            // Infinite upgrades: We just check if they can afford the next tier
                            // The `item` object already contains the NEXT tier info from context generator
                            const canAfford = state.gold >= item.cost;
                            
                            return (
                                <div key={item.id} className="relative p-6 border-2 flex flex-col justify-between h-64 border-blue-900/30 bg-blue-950/10 hover:border-blue-500 transition-colors">
                                    <div>
                                        <div className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Upgrade Available</div>
                                        <h3 className="text-xl font-serif font-bold mb-2 text-blue-200">{item.name}</h3>
                                        <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>
                                    </div>

                                    <button 
                                        onClick={() => handleBuyStructure(item.id)}
                                        disabled={!canAfford}
                                        className={`w-full py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${
                                            !canAfford ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed' :
                                            'bg-blue-600 text-white border border-blue-400 hover:bg-blue-500 shadow-lg'
                                        }`}
                                    >
                                        <ArrowUpCircle size={14} /> Construct {item.cost}g
                                    </button>
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
