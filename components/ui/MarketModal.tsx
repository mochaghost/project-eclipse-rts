
import React from 'react';
import { useGame, SHOP_ITEMS } from '../../context/GameContext';
import { X, ShoppingBag, Coins } from 'lucide-react';

export const MarketModal: React.FC = () => {
  const { state, toggleMarket, buyItem } = useGame();
  if (!state.isMarketOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-[#0c0a09] border-2 border-yellow-900 flex flex-col">
        <div className="bg-[#1c1917] p-6 border-b border-yellow-900/30 flex justify-between items-center">
            <h2 className="text-2xl text-yellow-600 font-serif font-bold flex items-center gap-3"><ShoppingBag size={24} /> MARKET</h2>
            <div className="flex items-center gap-4">
                 <div className="text-yellow-500 font-bold">{state.gold}g</div>
                 <button onClick={toggleMarket} className="text-stone-500"><X size={24} /></button>
            </div>
        </div>
        <div className="p-6 grid grid-cols-1 gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {SHOP_ITEMS.map((item) => (
                <button key={item.id} onClick={() => buyItem(item.id)} disabled={state.gold < item.cost} className={`p-4 border flex justify-between items-center ${state.gold >= item.cost ? 'bg-[#1c1917] border-stone-800 hover:border-yellow-600' : 'bg-black border-stone-900 opacity-50'}`}>
                    <div className="text-left">
                        <div className="font-serif font-bold text-stone-200">{item.name}</div>
                        <div className="text-xs text-stone-500">{item.description}</div>
                    </div>
                    <div className="text-yellow-500 font-mono">{item.cost}g</div>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
