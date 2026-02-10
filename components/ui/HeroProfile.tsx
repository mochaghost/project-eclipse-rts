
import React, { Suspense, useState } from 'react';
import { User, Shield, Sword, Crown, X, Scroll, Backpack, Check, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { HeroAvatar } from '../3d/Assets';
import { useGame } from '../../context/GameContext';
import { getEquipmentLore } from '../../utils/generators';
import { HeroEquipment } from '../../types';
import { EQUIPMENT_LORE } from '../../constants';

interface HeroProfileProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
}

const HeroScene = ({ level, equipment }: { level: number, equipment: HeroEquipment }) => (
    <>
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 10, 10]} angle={0.15} intensity={1} castShadow />
      <group position={[0, -1.2, 0]}>
        <HeroAvatar level={level} scale={2} equipment={equipment} />
        <ContactShadows opacity={0.5} scale={10} blur={2} far={4} color="#000000" />
      </group>
      <OrbitControls autoRotate />
    </>
);

// Helper to calculate Item Tier based on Lore Index (since index roughly equals power level in our constant)
const getItemTier = (name: string, type: 'WEAPON' | 'ARMOR') => {
    const list = type === 'WEAPON' ? EQUIPMENT_LORE.WEAPONS : EQUIPMENT_LORE.ARMOR;
    // We check if the name *contains* the base name, because loot has prefixes like "Cursed"
    const index = list.findIndex(i => name.includes(i.name));
    return index !== -1 ? index + 1 : 1; // 1-based Tier
};

export const HeroProfile: React.FC<HeroProfileProps> = ({ isOpen, onClose, level }) => {
  const { state, equipItem } = useGame();
  const [tab, setTab] = useState<'STATS' | 'INVENTORY'>('STATS');

  if (!isOpen) return null;

  const equip = state.heroEquipment || { weapon: "Unknown", armor: "Unknown", relic: "Unknown" };
  const weaponLore = getEquipmentLore(equip.weapon);
  const armorLore = getEquipmentLore(equip.armor);
  const inventory = state.inventory || [];

  // Calculate current equipped tiers
  const currentWeaponTier = getItemTier(equip.weapon, 'WEAPON');
  const currentArmorTier = getItemTier(equip.armor, 'ARMOR');

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="relative w-full max-w-5xl h-[70vh] bg-[#0c0a09] border border-[#44403c] flex">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/50 hover:text-white"><X size={24} /></button>
        
        {/* 3D View */}
        <div className="w-1/3 h-full bg-gradient-to-b from-[#1c1917] to-black relative border-r border-stone-800">
            <div className="w-full h-full">
                <Canvas camera={{ position: [0, 2, 4], fov: 40 }}>
                    <Suspense fallback={null}><HeroScene level={level} equipment={equip} /></Suspense>
                </Canvas>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="text-3xl font-serif font-bold text-white">LVL {level}</div>
            </div>
        </div>

        {/* Content Side */}
        <div className="w-2/3 bg-[#1c1917] flex flex-col">
            {/* Header Tabs */}
            <div className="flex border-b border-stone-800">
                <button onClick={() => setTab('STATS')} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${tab === 'STATS' ? 'bg-[#1c1917] text-stone-200 border-b-2 border-stone-500' : 'bg-[#151210] text-stone-500 hover:text-stone-300'}`}>
                    <User size={14}/> Soul Record
                </button>
                <button onClick={() => setTab('INVENTORY')} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${tab === 'INVENTORY' ? 'bg-[#1c1917] text-stone-200 border-b-2 border-stone-500' : 'bg-[#151210] text-stone-500 hover:text-stone-300'}`}>
                    <Backpack size={14}/> Arsenal ({inventory.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {tab === 'STATS' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-[#0c0a09] p-4 border border-stone-800">
                                <div className="flex justify-between mb-2">
                                    <span className="text-stone-500 text-xs uppercase tracking-widest">Strength</span>
                                    <Sword size={14} className="text-yellow-600" />
                                </div>
                                <div className="text-2xl font-bold text-yellow-500">{5 + level * 5 + (currentWeaponTier * 2)}</div>
                            </div>
                            <div className="bg-[#0c0a09] p-4 border border-stone-800">
                                <div className="flex justify-between mb-2">
                                    <span className="text-stone-500 text-xs uppercase tracking-widest">Defense</span>
                                    <Shield size={14} className="text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-blue-500">{5 + level * 5 + (currentArmorTier * 2)}</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-2 border-b border-stone-800 pb-1 flex justify-between">
                                <span>Equipped Weapon</span>
                                <span className="text-yellow-600">Tier {currentWeaponTier}</span>
                            </h3>
                            <div className="text-xl font-serif text-white mb-1">{equip.weapon}</div>
                            <p className="text-stone-400 italic text-sm font-serif border-l-2 border-yellow-900 pl-3">"{weaponLore}"</p>
                        </div>

                        <div>
                            <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-2 border-b border-stone-800 pb-1 flex justify-between">
                                <span>Equipped Armor</span>
                                <span className="text-blue-600">Tier {currentArmorTier}</span>
                            </h3>
                            <div className="text-xl font-serif text-white mb-1">{equip.armor}</div>
                            <p className="text-stone-400 italic text-sm font-serif border-l-2 border-stone-600 pl-3">"{armorLore}"</p>
                        </div>
                    </div>
                )}

                {tab === 'INVENTORY' && (
                    <div className="space-y-4">
                        {inventory.length === 0 ? (
                            <div className="text-center text-stone-600 py-10">No items found. Complete tasks to earn loot.</div>
                        ) : (
                            inventory.map(item => {
                                const isEquipped = equip.weapon === item.name || equip.armor === item.name || equip.relic === item.name;
                                
                                // Comparison Logic
                                let comparison = null;
                                let itemTier = 0;
                                
                                if (item.type === 'WEAPON') {
                                    itemTier = getItemTier(item.name, 'WEAPON');
                                    if (itemTier > currentWeaponTier) comparison = <span className="text-green-500 flex items-center gap-1"><ArrowUp size={12}/> Tier {itemTier}</span>;
                                    else if (itemTier < currentWeaponTier) comparison = <span className="text-red-500 flex items-center gap-1"><ArrowDown size={12}/> Tier {itemTier}</span>;
                                    else comparison = <span className="text-stone-500 flex items-center gap-1"><Minus size={12}/> Equal</span>;
                                }
                                if (item.type === 'ARMOR') {
                                    itemTier = getItemTier(item.name, 'ARMOR');
                                    if (itemTier > currentArmorTier) comparison = <span className="text-green-500 flex items-center gap-1"><ArrowUp size={12}/> Tier {itemTier}</span>;
                                    else if (itemTier < currentArmorTier) comparison = <span className="text-red-500 flex items-center gap-1"><ArrowDown size={12}/> Tier {itemTier}</span>;
                                    else comparison = <span className="text-stone-500 flex items-center gap-1"><Minus size={12}/> Equal</span>;
                                }

                                return (
                                    <div key={item.id} className={`p-4 border flex justify-between items-center ${isEquipped ? 'border-green-900 bg-green-950/10' : 'border-stone-800 bg-[#151210] hover:border-stone-600'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 flex items-center justify-center border font-bold text-lg ${isEquipped ? 'border-green-700 text-green-700' : 'border-stone-700 text-stone-700'}`}>
                                                {item.type[0]}
                                            </div>
                                            <div>
                                                <div className={`font-serif font-bold flex items-center gap-2 ${isEquipped ? 'text-green-400' : 'text-stone-300'}`}>
                                                    {item.name}
                                                    {!isEquipped && comparison && <div className="text-[10px] font-mono opacity-80">{comparison}</div>}
                                                </div>
                                                <div className="text-xs text-stone-500 italic truncate max-w-xs">{item.lore}</div>
                                            </div>
                                        </div>
                                        {isEquipped ? (
                                            <div className="text-xs text-green-600 font-bold uppercase tracking-widest flex items-center gap-1"><Check size={12}/> Equipped</div>
                                        ) : (
                                            <button onClick={() => equipItem(item.id)} className="px-4 py-2 border border-stone-600 text-stone-400 text-xs font-bold uppercase hover:bg-stone-800 hover:text-white">
                                                Equip
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
