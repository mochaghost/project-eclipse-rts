
import React, { Suspense } from 'react';
import { User, Shield, Sword, Crown, X, Scroll } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { HeroAvatar } from '../3d/Assets';
import { useGame } from '../../context/GameContext';
import { getEquipmentLore } from '../../utils/generators';

interface HeroProfileProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
}

const HeroScene = ({ level }: { level: number }) => (
    <>
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 10, 10]} angle={0.15} intensity={1} castShadow />
      <group position={[0, -1.2, 0]}>
        <HeroAvatar level={level} scale={2} />
        <ContactShadows opacity={0.5} scale={10} blur={2} far={4} color="#000000" />
      </group>
      <OrbitControls autoRotate />
    </>
);

export const HeroProfile: React.FC<HeroProfileProps> = ({ isOpen, onClose, level }) => {
  const { state } = useGame();
  if (!isOpen) return null;

  const equip = state.heroEquipment || { weapon: "Unknown", armor: "Unknown", relic: "Unknown" };
  const weaponLore = getEquipmentLore(equip.weapon);
  const armorLore = getEquipmentLore(equip.armor);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl h-[70vh] bg-[#0c0a09] border border-[#44403c] flex">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/50"><X size={24} /></button>
        
        {/* 3D View */}
        <div className="w-1/3 h-full bg-gradient-to-b from-[#1c1917] to-black relative border-r border-stone-800">
            <div className="w-full h-full">
                <Canvas camera={{ position: [0, 2, 4], fov: 40 }}>
                    <Suspense fallback={null}><HeroScene level={level} /></Suspense>
                </Canvas>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="text-3xl font-serif font-bold text-white">LVL {level}</div>
            </div>
        </div>

        {/* Stats & Lore */}
        <div className="w-2/3 p-8 bg-[#1c1917] overflow-y-auto custom-scrollbar">
            <h1 className="text-2xl font-bold text-stone-200 font-serif mb-6 flex items-center gap-2">
                <User size={24} /> Soul Record
            </h1>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-[#0c0a09] p-4 border border-stone-800">
                    <div className="flex justify-between mb-2">
                        <span className="text-stone-500 text-xs uppercase tracking-widest">Strength</span>
                        <Sword size={14} className="text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">{5 + level * 5}</div>
                 </div>
                 <div className="bg-[#0c0a09] p-4 border border-stone-800">
                    <div className="flex justify-between mb-2">
                         <span className="text-stone-500 text-xs uppercase tracking-widest">Defense</span>
                         <Shield size={14} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-500">{5 + level * 5}</div>
                 </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-2 border-b border-stone-800 pb-1">Equipped Weapon</h3>
                    <div className="text-xl font-serif text-white mb-1">{equip.weapon}</div>
                    <p className="text-stone-400 italic text-sm font-serif border-l-2 border-yellow-900 pl-3">"{weaponLore}"</p>
                </div>

                <div>
                    <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-2 border-b border-stone-800 pb-1">Equipped Armor</h3>
                    <div className="text-xl font-serif text-white mb-1">{equip.armor}</div>
                    <p className="text-stone-400 italic text-sm font-serif border-l-2 border-stone-600 pl-3">"{armorLore}"</p>
                </div>

                 <div>
                    <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-2 border-b border-stone-800 pb-1">Titles Earned</h3>
                    <div className="flex flex-wrap gap-2">
                        {level >= 1 && <span className="bg-stone-900 text-stone-500 px-2 py-1 text-xs border border-stone-800">The Exile</span>}
                        {level >= 10 && <span className="bg-stone-900 text-stone-400 px-2 py-1 text-xs border border-stone-800">Mercenary</span>}
                        {level >= 40 && <span className="bg-yellow-900/20 text-yellow-600 px-2 py-1 text-xs border border-yellow-900">Warlord</span>}
                        {level >= 60 && <span className="bg-purple-900/20 text-purple-400 px-2 py-1 text-xs border border-purple-900">King</span>}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
