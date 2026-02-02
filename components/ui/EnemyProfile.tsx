
import React, { Suspense } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Sword, Ghost, Scroll, Skull, Flag } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { EnemyMesh } from '../3d/Assets';
import { FACTIONS } from '../../constants';

export const EnemyProfile: React.FC = () => {
  const { state, selectEnemy, completeTask, failTask } = useGame();
  if (!state.selectedEnemyId) return null;
  const enemy = state.enemies.find(e => e.id === state.selectedEnemyId);
  if (!enemy) return null; 
  const task = state.tasks.find(t => t.id === enemy.taskId);
  if (!task) return null;

  const factionData = FACTIONS[enemy.factionId as keyof typeof FACTIONS];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* MINI WINDOW CARD - NOT FULL SCREEN */}
      <div className="relative w-96 max-h-[80vh] bg-[#0c0a09] border-2 border-red-900/50 flex flex-col shadow-2xl pointer-events-auto rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button onClick={() => selectEnemy(null)} className="absolute top-2 right-2 z-50 text-white/50 hover:text-white bg-black/50 rounded-full p-1"><X size={16} /></button>
        
        {/* 3D View Header */}
        <div className="h-48 bg-gradient-to-b from-[#2a0a0a] to-[#0c0a09] relative">
            <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
                 <ambientLight intensity={0.6} />
                 <pointLight position={[10, 10, 10]} intensity={1} />
                 <group position={[0, -0.8, 0]}>
                    <Suspense fallback={null}>
                        <EnemyMesh priority={enemy.priority} name="" scale={1.2} archetype={factionData?.archetype as any || 'MONSTER'} race={enemy.race} failed={task.failed} />
                    </Suspense>
                    <ContactShadows opacity={0.6} scale={5} blur={2} far={2} color="#000000" />
                 </group>
                 <OrbitControls autoRotate enableZoom={false} />
            </Canvas>
            <div className="absolute bottom-2 left-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 border uppercase tracking-widest ${task.failed ? 'bg-red-600 text-white border-red-400' : 'bg-stone-900 text-stone-300 border-stone-700'}`}>
                    {task.failed ? 'FAILED - DANGER' : 'ACTIVE THREAT'}
                </span>
            </div>
        </div>

        {/* Mini Info Panel */}
        <div className="p-5 bg-[#151210] flex flex-col gap-3 overflow-y-auto">
            <div>
                <h2 className="text-xl text-white font-serif font-bold leading-tight">{enemy.title}</h2>
                <div className="text-[10px] text-yellow-700 italic font-serif mt-0.5">{enemy.lineage}</div>
            </div>

            <p className="text-xs text-stone-400 italic border-l-2 border-red-900 pl-2">"{enemy.lore}"</p>

            <div className="bg-black/30 p-2 border border-stone-800 rounded">
                 <div className="text-[10px] text-stone-500 uppercase font-bold mb-1">Objective</div>
                 <div className="text-sm text-stone-200 font-bold">{task.title}</div>
                 <div className="text-[10px] text-stone-500 font-mono mt-1 flex justify-between">
                     <span>Due: {new Date(task.deadline).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                     <span className={task.failed ? 'text-red-500' : 'text-green-500'}>{task.failed ? 'OVERDUE' : 'PENDING'}</span>
                 </div>
            </div>

            <div className="flex gap-2 mt-2">
                <button onClick={() => { completeTask(task.id); selectEnemy(null); }} className="flex-1 bg-yellow-900/20 text-yellow-500 border border-yellow-800 py-2 text-xs uppercase font-bold flex items-center justify-center gap-2 hover:bg-yellow-900/40">
                    <Sword size={14} /> Vanquish
                </button>
                {!task.failed && (
                    <button onClick={() => { failTask(task.id); selectEnemy(null); }} className="px-3 bg-red-950/20 text-red-700 border border-red-900 hover:bg-red-900/40">
                        <Ghost size={14} />
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
