
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Hammer, Sparkles, Anvil, Gem, ArrowUpCircle } from 'lucide-react';
import { MaterialType } from '../../types';

const MATERIALS: { id: MaterialType; name: string; color: string; desc: string }[] = [
    { id: 'IRON', name: 'Dark Iron', color: 'text-stone-400', desc: 'Basic metal forged in shadow.' },
    { id: 'WOOD', name: 'Void Wood', color: 'text-orange-900', desc: 'Timber from the twisted forest.' },
    { id: 'OBSIDIAN', name: 'Obsidian', color: 'text-purple-600', desc: 'Glass sharp enough to cut time.' },
    { id: 'ASTRAL', name: 'Astral Dust', color: 'text-blue-300', desc: 'Residue of a dead star.' },
];

export const ForgeModal: React.FC = () => {
    const { state, toggleForge, craftItem } = useGame();
    const [craftingTier, setCraftingTier] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);

    if (!state.isForgeOpen) return null;

    const materials = state.materials || { IRON: 0, WOOD: 0, OBSIDIAN: 0, ASTRAL: 0 };

    // Cost logic
    const getCost = (tier: number): Record<MaterialType, number> => {
        return {
            IRON: tier * 5,
            WOOD: tier * 5,
            OBSIDIAN: tier > 1 ? (tier - 1) * 2 : 0,
            ASTRAL: tier > 2 ? (tier - 2) * 1 : 0
        };
    };

    const cost = getCost(craftingTier);
    const canAfford = 
        materials.IRON >= cost.IRON && 
        materials.WOOD >= cost.WOOD && 
        materials.OBSIDIAN >= cost.OBSIDIAN && 
        materials.ASTRAL >= cost.ASTRAL;

    const handleCraft = () => {
        if (!canAfford) return;
        setIsAnimating(true);
        // Delay actual logic for dramatic effect
        setTimeout(() => {
            craftItem(craftingTier, cost);
            setIsAnimating(false);
        }, 3000);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 pointer-events-auto">
            <div className="relative w-full max-w-4xl h-[80vh] bg-[#0c0a09] border-2 border-orange-900/50 flex flex-col shadow-2xl overflow-hidden">
                <button onClick={toggleForge} className="absolute top-4 right-4 z-50 text-stone-500 hover:text-white"><X size={24} /></button>

                {/* ANIMATION OVERLAY */}
                {isAnimating && (
                    <div className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center">
                        <div className="relative">
                            <Anvil size={120} className="text-stone-700 animate-pulse" />
                            <Hammer size={80} className="text-orange-500 absolute -top-10 -right-10 animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-serif text-orange-500 font-bold mt-8 tracking-[0.5em] animate-pulse">FORGING DESTINY...</h2>
                    </div>
                )}

                {/* HEADER */}
                <div className="bg-[#1c1917] p-6 border-b border-orange-900/30 flex justify-between items-center">
                    <h2 className="text-2xl text-orange-600 font-serif font-bold flex items-center gap-3 tracking-widest"><Hammer size={24} /> THE IRON FORGE</h2>
                </div>

                <div className="flex-1 flex flex-col md:flex-row">
                    {/* INVENTORY SIDE */}
                    <div className="w-full md:w-1/3 bg-[#151210] border-r border-stone-800 p-6">
                        <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-4 border-b border-stone-800 pb-2">Material Stockpile</h3>
                        <div className="space-y-4">
                            {MATERIALS.map(mat => (
                                <div key={mat.id} className="bg-black/50 border border-stone-800 p-3 flex justify-between items-center">
                                    <div>
                                        <div className={`font-bold ${mat.color}`}>{mat.name}</div>
                                        <div className="text-[10px] text-stone-600">{mat.desc}</div>
                                    </div>
                                    <div className="text-xl font-mono text-stone-200">{materials[mat.id] || 0}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CRAFTING SIDE */}
                    <div className="flex-1 p-8 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]">
                        <div className="mb-8 text-center">
                            <h3 className="text-3xl font-serif text-stone-200 font-bold mb-2">TIER {craftingTier} EQUIPMENT</h3>
                            <p className="text-stone-500 text-sm">Forge random Weapons or Armor of this power level.</p>
                        </div>

                        {/* TIER SELECTOR */}
                        <div className="flex gap-4 mb-8">
                            <button onClick={() => setCraftingTier(Math.max(1, craftingTier - 1))} className="p-2 border border-stone-700 hover:bg-stone-800 text-stone-400"><ArrowUpCircle className="rotate-[-90deg]"/></button>
                            <div className="text-4xl font-black text-orange-600">{craftingTier}</div>
                            <button onClick={() => setCraftingTier(Math.min(5, craftingTier + 1))} className="p-2 border border-stone-700 hover:bg-stone-800 text-stone-400"><ArrowUpCircle className="rotate-90deg"/></button>
                        </div>

                        {/* COST DISPLAY */}
                        <div className="flex gap-6 mb-8 bg-black/80 p-4 border border-stone-800 rounded-lg">
                            {Object.entries(cost).map(([key, val]) => {
                                if (val === 0) return null;
                                const matDef = MATERIALS.find(m => m.id === key);
                                const current = materials[key as MaterialType] || 0;
                                const hasEnough = current >= val;
                                return (
                                    <div key={key} className="text-center">
                                        <div className={`text-xs font-bold mb-1 ${matDef?.color}`}>{matDef?.name}</div>
                                        <div className={`font-mono text-lg ${hasEnough ? 'text-green-500' : 'text-red-500'}`}>
                                            {current}/{val}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <button 
                            onClick={handleCraft}
                            disabled={!canAfford}
                            className={`
                                group relative px-12 py-6 font-serif font-black text-xl tracking-[0.2em] uppercase transition-all
                                ${canAfford ? 'bg-orange-900 text-orange-100 hover:bg-orange-800 hover:scale-105 shadow-[0_0_30px_rgba(124,45,18,0.5)]' : 'bg-stone-900 text-stone-600 cursor-not-allowed'}
                            `}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <Sparkles className={canAfford ? "animate-spin" : ""} /> STRIKE THE ANVIL
                            </span>
                            {canAfford && <div className="absolute inset-0 border-2 border-orange-500 blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
