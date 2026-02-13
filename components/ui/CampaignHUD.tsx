
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { CHARACTERS } from '../../constants';
import { HeroAvatar, EnemyMesh, VillagerAvatar } from '../3d/Assets';
import { MessageSquare, Shield, Swords } from 'lucide-react';

const PortraitScene = ({ characterId }: { characterId: string }) => {
    const char = CHARACTERS[characterId as keyof typeof CHARACTERS];
    if (!char) return null;

    let content = null;
    
    // Select model based on ID/Race
    if (char.race === 'ORC' || char.race === 'DEMON' || char.race === 'ELF') {
        // Use Enemy Mesh for Rivals
        content = <EnemyMesh priority={3} name={char.name} race={char.race} scale={2.5} archetype={char.race === 'ORC' ? 'MONSTER' : 'KNIGHT'} />;
    } else if (char.id === 'MARSHAL_THORNE') {
        // Use Villager Guard model for Thorne
        content = <VillagerAvatar role="Guard" name={char.name} />;
    } else {
        // Fallback or Human Hero model
        content = <HeroAvatar level={50} scale={2} />;
    }

    return (
        <>
            <ambientLight intensity={1.5} />
            <spotLight position={[5, 5, 5]} angle={0.3} intensity={3} />
            <Environment preset="city" />
            <group position={[0, -1.8, 0]}>
                {content}
            </group>
            {/* Limit controls to just slight rotation for effect */}
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI/2} minPolarAngle={Math.PI/2.5} autoRotate autoRotateSpeed={2} />
        </>
    );
};

export const CampaignHUD: React.FC = () => {
    const { state, dismissDialogue } = useGame();
    const activeDialogue = state.activeDialogue;
    
    // Default to displaying the Ally or Rival if no active dialogue
    const defaultChar = state.activeAllyId || 'MARSHAL_THORNE';
    const displayCharId = activeDialogue ? activeDialogue.characterId : defaultChar;
    const charData = CHARACTERS[displayCharId];

    const [isTalking, setIsTalking] = useState(false);

    useEffect(() => {
        if (activeDialogue) {
            setIsTalking(true);
            const t = setTimeout(() => {
                setIsTalking(false);
            }, activeDialogue.duration || 5000);
            return () => clearTimeout(t);
        }
    }, [activeDialogue]);

    // Border color based on allegiance
    const borderColor = charData.role === 'RIVAL' ? 'border-red-900' : charData.role === 'ALLY' ? 'border-blue-900' : 'border-purple-900';
    const bgColor = charData.role === 'RIVAL' ? 'bg-red-950/80' : charData.role === 'ALLY' ? 'bg-blue-950/80' : 'bg-purple-950/80';

    return (
        <div className="absolute bottom-36 left-4 z-40 flex items-end gap-4 pointer-events-auto">
            {/* 3D PORTRAIT FRAME */}
            <div className={`w-32 h-32 md:w-40 md:h-40 bg-black border-4 ${borderColor} relative shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden shrink-0`}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10 pointer-events-none"></div>
                <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
                    <Suspense fallback={null}>
                        <PortraitScene characterId={displayCharId} />
                    </Suspense>
                </Canvas>
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-center py-1 z-20 border-t border-stone-800">
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">{charData.name}</span>
                </div>
            </div>

            {/* DIALOGUE BOX */}
            <div className={`
                flex-1 max-w-xl transition-all duration-300 origin-bottom-left
                ${activeDialogue ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            `}>
                <div 
                    className={`
                        p-4 border-2 ${borderColor} ${bgColor} text-white shadow-xl backdrop-blur-md relative
                        before:content-[''] before:absolute before:left-[-10px] before:bottom-8 before:border-[10px] before:border-transparent before:border-r-current
                    `}
                    style={{ color: charData.color }}
                    onClick={dismissDialogue} // Click to dismiss
                >
                    <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-1">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{charData.title}</span>
                        {charData.role === 'RIVAL' ? <Swords size={14} className="text-red-400"/> : <Shield size={14} className="text-blue-400"/>}
                    </div>
                    
                    <p className="font-serif text-lg leading-relaxed text-white drop-shadow-md">
                        "{activeDialogue?.text}"
                    </p>

                    <div className="absolute bottom-2 right-2 text-[9px] text-white/40 uppercase tracking-widest animate-pulse">
                        Click to Dismiss
                    </div>
                </div>
            </div>
        </div>
    );
};
