import React, { useMemo, Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Stars, PerspectiveCamera, Ring, Sparkles, Instances, Instance, Html, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { useGame } from '../../context/GameContext';
import { EntityRenderer } from './EntityRenderer';
import { VisualEffectsRenderer } from './VisualEffects';
import { VazarothEffects } from './VazarothEffects'; 
import { EntityType, Era, AlertType, WeatherType } from '../../types';
import { PALETTE } from '../../constants';
import { VazarothTitan, GrassTuft, Pebble, BonePile, VoidCrystal, RuinedColumn, RuinedArch, Torch, TwistedTree, GlowingMushroom, GhostWisp } from './Assets'; 
import * as THREE from 'three';

// Improved Noise for clumping
const noise = (x: number, z: number) => Math.sin(x * 0.05) * Math.cos(z * 0.05) + Math.sin(x * 0.1 + z * 0.1) * 0.5;

const VegetationSystem = () => {
    // 1. DENSE GRASS (The Carpet)
    const grass = useMemo(() => {
        const temp = [];
        const count = 8000; // Reduced slightly for better performance with PP
        for (let i = 0; i < count; i++) { 
            const x = (Math.random() - 0.5) * 250;
            const z = (Math.random() - 0.5) * 250;
            // Clear spawn area slightly
            if (Math.abs(x) < 8 && Math.abs(z) < 8) continue; 
            
            const n = noise(x * 2, z * 2);
            if (n > -0.4) { 
                temp.push({ position: [x, 0, z], rotation: [0, Math.random() * Math.PI, 0], scale: 0.6 + Math.random() * 0.8 });
            }
        }
        return temp;
    }, []);

    // 2. GROUND CLUTTER (Rocks/Debris)
    const rocks = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 600; i++) {
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
            temp.push({ position: [x, 0, z], scale: 0.3 + Math.random() * 0.5, rotation: [Math.random(), Math.random(), Math.random()] });
        }
        return temp;
    }, []);

    return (
        <group>
            {/* ROCKS */}
            <Instances range={1000}>
                <dodecahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#1c1917" roughness={0.8} />
                {rocks.map((data, i) => (
                    <Instance key={`rock-${i}`} position={data.position as any} scale={data.scale} rotation={data.rotation as any} />
                ))}
            </Instances>

            {/* GRASS BLADES (Simple Planes for Performance) */}
            <Instances range={10000}>
                <planeGeometry args={[0.15, 0.8]} />
                <meshStandardMaterial color="#1a2e10" side={THREE.DoubleSide} />
                {grass.map((data, i) => (
                    <Instance key={`grass-${i}`} position={data.position as any} rotation={data.rotation as any} scale={data.scale} />
                ))}
            </Instances>
        </group>
    );
};

const ProceduralMap = ({ level, era, groundColor }: { level: number, era: Era, groundColor: string }) => {
    const viewRadius = 60 + (level * 2);
    
    // Decoration Distributions
    const decorations = useMemo(() => {
        const items: {x: number, z: number, type: string, scale?: number, rotation?: number}[] = [];
        for(let i=0; i<250; i++) { 
             const angle = Math.random() * Math.PI * 2;
             const dist = 15 + (Math.random() * 120); 
             const x = Math.cos(angle) * dist;
             const z = Math.sin(angle) * dist;
             
             let type = 'TREE';
             const r = Math.random();

             if (r > 0.96) type = 'RUIN_COLUMN';
             else if (r > 0.93) type = 'TORCH';
             else if (r > 0.88) type = 'MUSHROOM';
             else if (r > 0.85) type = 'VOID_CRYSTAL'; 
             else if (r > 0.82) type = 'BONE_PILE';
             else if (r > 0.80) type = 'WISP';
             
             // Scale trees based on distance to feel overwhelming
             const scale = type === 'TREE' ? 1 + Math.random() * 2 : 1;

             items.push({ x, z, type, scale, rotation: Math.random() * Math.PI });
        }
        return items;
    }, []);

    return (
        <group>
            {/* Clean Dark Floor to reduce Z-fighting noise */}
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[500, 500, 64, 64]} />
                <meshStandardMaterial 
                    color="#0c0a09" 
                    roughness={1} 
                    metalness={0.0}
                />
            </mesh>
            
            <VegetationSystem />

            {/* Special Assets */}
            {decorations.map((item, i) => {
                 if (Math.abs(item.x) > viewRadius || Math.abs(item.z) > viewRadius) return null;

                 if (item.type === 'TREE') return <TwistedTree key={`d-${i}`} position={[item.x, 0, item.z]} scale={item.scale} rotation={[0, item.rotation || 0, 0]} />
                 if (item.type === 'TORCH') return <Torch key={`d-${i}`} position={[item.x, 0, item.z]} />
                 if (item.type === 'MUSHROOM') return <GlowingMushroom key={`d-${i}`} position={[item.x, 0, item.z]} />
                 if (item.type === 'WISP') return <GhostWisp key={`d-${i}`} position={[item.x, 2, item.z]} />
                 if (item.type === 'BONE_PILE') return <BonePile key={`d-${i}`} position={[item.x, 0, item.z]} />
                 if (item.type === 'RUIN_COLUMN') return <RuinedColumn key={`d-${i}`} position={[item.x, 0, item.z]} />
                 if (item.type === 'VOID_CRYSTAL') return <VoidCrystal key={`d-${i}`} position={[item.x, 0, item.z]} />
                 return null;
            })}
        </group>
    )
}

const WeatherSystem = ({ type }: { type: WeatherType }) => {
    if (type === 'CLEAR') return (
        <group>
             <Sparkles count={300} scale={60} size={2} speed={0.2} opacity={0.3} color="#fff" />
        </group>
    );

    if (type === 'RAIN') {
        return (
            <group position={[0, 10, 0]}>
                <Sparkles count={2000} scale={[50, 20, 50]} size={2} speed={5} opacity={0.4} color="#60a5fa" noise={0} />
                <directionalLight position={[10, 10, 5]} intensity={0.2} color="#60a5fa" />
            </group>
        );
    }

    if (type === 'ASH_STORM') {
        return (
            <group position={[0, 10, 0]}>
                <Sparkles count={1000} scale={60} size={6} speed={0.5} opacity={0.6} color="#450a0a" noise={1} />
                <ambientLight intensity={0.5} color="#7f1d1d" />
            </group>
        );
    }

    if (type === 'VOID_MIST') {
        return (
            <group>
                <Sparkles count={500} scale={40} size={10} speed={0.1} opacity={0.2} color="#a855f7" />
            </group>
        );
    }

    return null;
}

const GlobalSceneController = () => {
    const { state } = useGame();
    
    const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;
    const weather = state.weather || 'CLEAR';
    
    // --- GRIM DARK LIGHTING ---
    // Darker ambient, specific rim lights
    const fogColor = isRitual ? '#2e1065' : '#050202';
    const fogDensity = weather === 'VOID_MIST' ? 0.08 : 0.04;

    return (
        <>
            <color attach="background" args={['#050202']} />
            <fogExp2 attach="fog" args={[fogColor, fogDensity]} />
            
            <WeatherSystem type={weather} />
            
            {/* Moonlight (Blue/Cold) */}
            <directionalLight position={[50, 50, 20]} intensity={0.5} color="#60a5fa" castShadow shadow-mapSize={[2048, 2048]} />
            
            {/* Ambient (Very Low) */}
            <ambientLight intensity={0.1} color="#4c1d95" />
            
            {/* Rim Light (Dramatic) */}
            <spotLight position={[-30, 10, -30]} angle={0.5} intensity={2} color="#c084fc" />

            <ProceduralMap level={state.playerLevel} era={state.era} groundColor="#0c0a09" />
        </>
    )
}

const RitualCircle = () => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (ref.current) ref.current.rotation.y += delta * 0.5;
    });

    return (
        <group ref={ref} position={[0, 0.1, 0]}>
            <Ring args={[8, 8.5, 64]} rotation={[-Math.PI/2, 0, 0]}><meshStandardMaterial color="#c084fc" emissive="#7e22ce" emissiveIntensity={4} transparent opacity={0.6} side={THREE.DoubleSide} /></Ring>
             <Ring args={[12, 12.2, 64]} rotation={[-Math.PI/2, 0, 0]}><meshStandardMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={2} transparent opacity={0.4} side={THREE.DoubleSide} /></Ring>
        </group>
    )
}

// Visual for FUTURE enemies (Fixed Geometry from Triangle to Portal)
const PortalRift = ({ position }: { position: {x:number, y:number, z:number} }) => {
    const r1 = useRef<THREE.Mesh>(null);
    const r2 = useRef<THREE.Mesh>(null);
    
    useFrame((state, delta) => {
        if(r1.current) r1.current.rotation.z += delta * 0.5;
        if(r2.current) r2.current.rotation.z -= delta * 0.8;
    });

    return (
        <group position={[position.x, 2, position.z]}>
            <Float speed={4} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Main Ring - Explicitly 32 segments so it is circular, NOT 3 */}
                <mesh ref={r1} rotation={[0,0,0]}>
                    <ringGeometry args={[1.5, 1.8, 32]} />
                    <meshStandardMaterial color="#4c1d95" emissive="#7e22ce" emissiveIntensity={4} side={THREE.DoubleSide} transparent opacity={0.8} />
                </mesh>
                {/* Inner Ring */}
                <mesh ref={r2} rotation={[0,0,Math.PI/4]}>
                    <ringGeometry args={[1.0, 1.1, 4]} />
                    <meshStandardMaterial color="#c084fc" emissive="#fff" emissiveIntensity={2} side={THREE.DoubleSide} />
                </mesh>
                {/* Core */}
                <mesh>
                    <circleGeometry args={[0.8, 32]} />
                    <meshBasicMaterial color="#000" transparent opacity={0.9} />
                </mesh>
            </Float>
            <Sparkles count={40} scale={4} size={3} speed={0.5} opacity={0.8} color="#a855f7" />
            <Html position={[0, -2.5, 0]} center distanceFactor={15}>
                <div className="text-[9px] text-purple-300 font-serif tracking-[0.2em] bg-black/80 px-3 py-1 border border-purple-900 whitespace-nowrap">
                    MANIFESTING...
                </div>
            </Html>
        </group>
    )
}

const LoaderFallback = () => (
    <Html center>
        <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-yellow-600 font-serif text-sm tracking-widest animate-pulse">MANIFESTING REALITY...</div>
        </div>
    </Html>
)

export const Scene: React.FC = () => {
  const { state, selectEnemy, interactWithNPC } = useGame();
  const [now, setNow] = useState(Date.now());

  // Update local time for portal logic
  useEffect(() => {
      const t = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(t);
  }, []);
  
  if (!state) return null;

  const isBaseDamaged = (state.baseHp || 0) < (state.maxBaseHp || 100) * 0.5;
  const enemies = state.enemies || [];
  const minions = state.minions || [];
  const population = state.population || [];
  const isHighQuality = (state.settings?.graphicsQuality || 'HIGH') === 'HIGH';
  const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;

  return (
    <Canvas shadows={false} dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }} camera={{ position: [15, 15, 15], fov: 45 }}>
      <ambientLight intensity={0.1} />
      
      <Suspense fallback={<LoaderFallback />}>
          <GlobalSceneController />
          {isHighQuality && <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />}
          
          <VazarothTitan />
          {isRitual && <RitualCircle />}

          <EntityRenderer 
            type={EntityType.BUILDING_BASE} 
            variant={state.era} 
            position={[0, 0, 0]} 
            stats={{ hp: state.baseHp || 100, maxHp: state.maxBaseHp || 100 }}
            isDamaged={isBaseDamaged}
          />

          <EntityRenderer 
            type={EntityType.HERO} 
            variant={state.playerLevel as any} 
            position={[4, 0, 4]} 
            winStreak={state.winStreak}
          />

          {minions.map(minion => (
              <EntityRenderer 
                key={minion.id}
                type={EntityType.MINION}
                position={[minion.position.x, minion.position.y, minion.position.z]}
              />
          ))}

          {enemies.map(enemy => {
            const task = state.tasks.find(t => t.id === enemy.taskId);
            
            // Check Start Time logic
            let startTime = task ? task.startTime : 0;
            if (enemy.subtaskId && task) {
                const sub = task.subtasks.find(s => s.id === enemy.subtaskId);
                if (sub && sub.startTime) startTime = sub.startTime;
            }

            // If not yet started, show Portal instead of Enemy
            if (now < startTime) {
                return <PortalRift key={enemy.id} position={enemy.position} />;
            }

            const activeSubtasks = task ? task.subtasks.filter(s => !s.completed).length : 0;
            return (
                <EntityRenderer
                    key={enemy.id}
                    type={EntityType.ENEMY}
                    variant={enemy.priority}
                    position={[enemy.position.x, enemy.position.y, enemy.position.z]}
                    name={enemy.name}
                    onClick={() => selectEnemy(enemy.id)}
                    isSelected={state.selectedEnemyId === enemy.id}
                    scale={enemy.scale || 1}
                    archetype={enemy.race === 'HUMAN' || enemy.race === 'DWARF' ? 'KNIGHT' : 'MONSTER'}
                    race={enemy.race}
                    subtaskCount={activeSubtasks}
                />
            );
          })}

          {population.map((npc, i) => {
              const angle = (i * 137.5) * (Math.PI / 180);
              const r = 6 + (i % 5); 
              const x = Math.cos(angle)*r;
              const z = Math.sin(angle)*r;
              return (
                <EntityRenderer
                    key={npc.id}
                    type={EntityType.VILLAGER}
                    variant={npc.role}
                    name={npc.name}
                    position={[x, 0, z]}
                    npcStatus={npc.status}
                    npcAction={npc.currentAction} 
                    onClick={() => interactWithNPC(npc.id)}
                />
              );
          })}

          {Array.from({length: 5}).map((_, i) => (
              <EntityRenderer 
                key={`stag-${i}`}
                type={EntityType.ANIMAL}
                variant="STAG"
                position={[15 + i*5, 0, 15 - i*2]}
              />
          ))}

          <VisualEffectsRenderer />
          <VazarothEffects />
          
          <MapControls makeDefault maxPolarAngle={Math.PI / 2.2} />

          {/* POST PROCESSING FOR GLOW/BLOOM */}
          {isHighQuality && (
              <EffectComposer>
                  <Bloom luminanceThreshold={1.5} mipmapBlur intensity={1.5} radius={0.6} />
                  <Vignette eskil={false} offset={0.1} darkness={1.1} />
                  <Noise opacity={0.05} />
              </EffectComposer>
          )}
      </Suspense>
    </Canvas>
  );
};