
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0c0a09] border-2 border-red-900/50 flex flex-col md:flex-row overflow-hidden shadow-2xl">
        <button onClick={() => selectEnemy(null)} className="absolute top-4 right-4 z-50 text-white/50"><X size={24} /></button>
        
        {/* 3D View */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-[#2a0a0a] to-black relative">
            <Canvas camera={{ position: [0, 2, 4], fov: 45 }}>
                 <ambientLight intensity={0.5} />
                 <pointLight position={[10, 10, 10]} intensity={1} />
                 <group position={[0, -0.5, 0]}>
                    <Suspense fallback={null}>
                        {/* Use Faction Archetype */}
                        <EnemyMesh priority={enemy.priority} name="" scale={1.5} archetype={factionData?.archetype as any || 'MONSTER'} race={enemy.race} />
                    </Suspense>
                    <ContactShadows opacity={0.8} scale={10} blur={2.5} far={4} color="#000000" />
                 </group>
                 <OrbitControls autoRotate />
            </Canvas>
            <div className="absolute bottom-4 left-4 text-xs font-mono text-red-800">
                HP: {enemy.hp} / {enemy.maxHp}
            </div>
        </div>

        {/* Info Panel */}
        <div className="w-full md:w-1/2 p-8 bg-[#1c1917] flex flex-col overflow-y-auto custom-scrollbar">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 uppercase tracking-widest flex items-center gap-1">
                        <Flag size={10} style={{ color: factionData?.color }} />
                        {factionData?.name}
                     </span>
                     <span className="text-[10px] bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 uppercase tracking-widest">{enemy.race}</span>
                </div>
                <h2 className="text-3xl text-white font-serif font-bold leading-tight">{enemy.title}</h2>
                <div className="text-yellow-700 italic font-serif text-sm mt-1">{enemy.lineage}</div>
            </div>

            <div className="space-y-6 flex-1">
                <div>
                    <h3 className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-2">Personality</h3>
                    <p className="text-stone-300 font-serif italic border-l-2 border-red-900 pl-3">"{enemy.lore}"</p>
                </div>

                <div>
                    <h3 className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-2 flex items-center gap-2"><Scroll size={12}/> Known Memories</h3>
                    <ul className="space-y-2">
                        {enemy.memories.map((mem, i) => (
                            <li key={i} className="text-xs text-stone-400 bg-black/40 p-2 rounded border border-stone-800 flex gap-2">
                                <Skull size={12} className="text-stone-600 shrink-0 mt-0.5" />
                                {mem}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-[#0c0a09] p-4 border border-stone-800">
                     <h3 className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-2">Task Bound</h3>
                     <div className="text-stone-200 font-bold">{task.title}</div>
                     <div className="text-stone-500 text-xs mt-1 font-mono">Deadline: {new Date(task.deadline).toLocaleString()}</div>
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                <button onClick={() => completeTask(task.id)} className="flex-1 bg-yellow-900/20 text-yellow-500 border border-yellow-800 py-3 uppercase font-bold flex items-center justify-center gap-2 hover:bg-yellow-900/40 transition-colors">
                    <Sword size={18} /> Vanquish
                </button>
                <button onClick={() => failTask(task.id)} className="px-6 bg-red-950/20 text-red-700 border border-red-900 hover:bg-red-900/40 transition-colors flex items-center justify-center">
                    <Ghost size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
