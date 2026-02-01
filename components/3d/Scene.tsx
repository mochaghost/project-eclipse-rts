
import React, { useMemo, Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Stars, PerspectiveCamera, Ring, Sparkles, Instances, Instance, Html, Float, Cloud } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { EntityRenderer } from './EntityRenderer';
import { VisualEffectsRenderer } from './VisualEffects';
import { VazarothEffects } from './VazarothEffects'; 
import { EntityType, Era, AlertType, WeatherType } from '../../types';
import { PALETTE } from '../../constants';
import { VazarothTitan, AncientRuin, ResourceNode, GrassTuft, Pebble, BonePile, VoidCrystal, RuinedColumn, RuinedArch } from './Assets'; 
import * as THREE from 'three';

// Improved Noise for clumping
const noise = (x: number, z: number) => Math.sin(x * 0.05) * Math.cos(z * 0.05) + Math.sin(x * 0.1 + z * 0.1) * 0.5;

const VegetationSystem = () => {
    // 1. TREES (Dead Forest)
    const trees = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 300; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 100; // Push further out
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const n = noise(x, z);
            if (n > 0.3) { // Clumping
                temp.push({ position: [x, 0, z], scale: 1 + Math.random() * 1.5, rotation: [0, Math.random() * Math.PI, 0] });
            }
        }
        return temp;
    }, []);

    // 2. DENSE GRASS (The Carpet)
    const grass = useMemo(() => {
        const temp = [];
        const count = 15000; // Massive increase for density
        for (let i = 0; i < count; i++) { 
            const x = (Math.random() - 0.5) * 250;
            const z = (Math.random() - 0.5) * 250;
            // Clear spawn area slightly
            if (Math.abs(x) < 8 && Math.abs(z) < 8) continue; 
            
            const n = noise(x * 2, z * 2);
            if (n > -0.4) { // Grow almost everywhere except specific noise hollows
                temp.push({ position: [x, 0, z], rotation: [0, Math.random() * Math.PI, 0], scale: 0.6 + Math.random() * 0.8 });
            }
        }
        return temp;
    }, []);

    // 3. GROUND CLUTTER (Rocks/Debris)
    const rocks = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 800; i++) {
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
            temp.push({ position: [x, 0, z], scale: 0.3 + Math.random() * 0.5, rotation: [Math.random(), Math.random(), Math.random()] });
        }
        return temp;
    }, []);

    return (
        <group>
            {/* TREES */}
            <Instances range={1000}>
                <cylinderGeometry args={[0.2, 0.6, 6, 6]} />
                <meshStandardMaterial color="#0f0505" roughness={1} />
                {trees.map((data, i) => (
                    <Instance key={`tree-${i}`} position={[data.position[0], 3, data.position[2]]} scale={data.scale} rotation={data.rotation as any} />
                ))}
            </Instances>
            {/* TREE TOPS */}
            <Instances range={1000}>
                <dodecahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial color="#081008" roughness={1} />
                {trees.map((data, i) => (
                    <Instance key={`top-${i}`} position={[data.position[0], 6, data.position[2]]} scale={data.scale} rotation={data.rotation as any} />
                ))}
            </Instances>

            {/* ROCKS */}
            <Instances range={1000}>
                <dodecahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#1c1917" roughness={0.8} />
                {rocks.map((data, i) => (
                    <Instance key={`rock-${i}`} position={data.position as any} scale={data.scale} rotation={data.rotation as any} />
                ))}
            </Instances>

            {/* GRASS BLADES (Simple Planes for Performance) */}
            <Instances range={20000}>
                <planeGeometry args={[0.15, 0.8]} />
                <meshStandardMaterial color="#1a2e10" side={THREE.DoubleSide} />
                {grass.map((data, i) => (
                    <Instance key={`grass-${i}`} position={data.position as any} rotation={data.rotation as any} scale={data.scale} />
                ))}
            </Instances>
        </group>
    );
};

// Adds texture to the floor without loading an image by using lots of flat geometry noise
const GroundDetail = () => {
    const patches = useMemo(() => {
        const p = [];
        for(let i=0; i<500; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            const scale = 2 + Math.random() * 5;
            p.push({ x, z, scale, rot: Math.random() * Math.PI });
        }
        return p;
    }, []);

    return (
        <Instances range={1000}>
            <circleGeometry args={[1, 8]} />
            <meshStandardMaterial color="#22201e" transparent opacity={0.6} depthWrite={false} />
            {patches.map((p, i) => (
                <Instance 
                    key={i} 
                    position={[p.x, 0.02, p.z]} 
                    rotation={[-Math.PI/2, 0, p.rot]} 
                    scale={[p.scale, p.scale, 1]} 
                />
            ))}
        </Instances>
    )
}

const ProceduralMap = ({ level, era, groundColor }: { level: number, era: Era, groundColor: string }) => {
    const viewRadius = 60 + (level * 2);
    
    const chunks = useMemo(() => {
        const items: {x: number, z: number, dist: number, type: number, rotation: number}[] = [];
        for(let x = -120; x <= 120; x+=15) { 
            for(let z = -120; z <= 120; z+=15) {
                if (Math.abs(x) < 20 && Math.abs(z) < 20) continue; 
                const dist = Math.sqrt(x*x + z*z);
                const type = Math.random();
                items.push({ x: x + (Math.random() * 5), z: z + (Math.random() * 5), dist, type, rotation: Math.random() * Math.PI });
            }
        }
        return items;
    }, []);

    const specialClutter = useMemo(() => {
        const items: {x: number, z: number, type: string, scale?: number}[] = [];
        for(let i=0; i<200; i++) { 
             const angle = Math.random() * Math.PI * 2;
             const dist = 15 + (Math.random() * 100); 
             const x = Math.cos(angle) * dist;
             const z = Math.sin(angle) * dist;
             
             let type = 'GRASS';
             const r = Math.random();

             if (r > 0.98) type = 'RUIN_COLUMN';
             else if (r > 0.96) type = 'BONE_PILE';
             else if (r > 0.94) type = 'VOID_CRYSTAL'; 
             else if (r > 0.8) type = 'PEBBLE';
             else continue;

             items.push({ x, z, type, scale: 0.8 + Math.random() * 0.4 });
        }
        return items;
    }, []);

    return (
        <group>
            {/* Base Floor */}
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[500, 500, 64, 64]} />
                <meshStandardMaterial 
                    color={groundColor} 
                    roughness={1} 
                    metalness={0.0}
                />
            </mesh>
            
            <GroundDetail />
            <VegetationSystem />

            {/* Special Non-Instanced Clutter */}
            {specialClutter.map((item, i) => {
                 if (item.type === 'PEBBLE') return <Pebble key={`c-${i}`} position={[item.x, 0, item.z]} />
                 if (item.type === 'BONE_PILE') return <BonePile key={`c-${i}`} position={[item.x, 0, item.z]} />
                 if (item.type === 'RUIN_COLUMN') return <RuinedColumn key={`c-${i}`} position={[item.x, 0, item.z]} />
                 if (item.type === 'VOID_CRYSTAL') return <VoidCrystal key={`c-${i}`} position={[item.x, 0, item.z]} />
                 return null;
            })}

            {/* Distant Procedural Features */}
            {chunks.map((chunk, i) => {
                if (chunk.dist > viewRadius + 30) return null;
                const isVisible = chunk.dist < viewRadius;
                
                // Fog of War / Unexplored Areas
                if (!isVisible) {
                    return (
                        <mesh key={i} position={[chunk.x, 0.5, chunk.z]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[10, 10]} />
                            <meshBasicMaterial color="#000" transparent opacity={0.8} />
                        </mesh>
                    )
                }

                if (chunk.type > 0.98) return <AncientRuin key={i} position={[chunk.x, 0, chunk.z]} />;
                if (chunk.type > 0.95) return <ResourceNode key={i} position={[chunk.x, 0, chunk.z]} type="GOLD" />;
                if (chunk.type > 0.92) return <ResourceNode key={i} position={[chunk.x, 0, chunk.z]} type="IRON" />;
                
                return null;
            })}
        </group>
    )
}

const WeatherSystem = ({ type }: { type: WeatherType }) => {
    if (type === 'CLEAR') return (
        <group>
             {/* Subtle Dust Motes in Clear Weather */}
             <Sparkles count={200} scale={50} size={2} speed={0.2} opacity={0.3} color="#fff" />
        </group>
    );

    if (type === 'RAIN') {
        return (
            <group position={[0, 10, 0]}>
                <Sparkles count={2000} scale={[50, 20, 50]} size={2} speed={5} opacity={0.4} color="#60a5fa" noise={0} />
                <fogExp2 attach="fog" args={['#1e293b', 0.03]} />
                <directionalLight position={[10, 10, 5]} intensity={0.2} color="#60a5fa" />
            </group>
        );
    }

    if (type === 'ASH_STORM') {
        return (
            <group position={[0, 10, 0]}>
                <Sparkles count={1000} scale={60} size={6} speed={0.5} opacity={0.6} color="#450a0a" noise={1} />
                <fogExp2 attach="fog" args={['#2a0a0a', 0.05]} />
                <ambientLight intensity={0.5} color="#7f1d1d" />
            </group>
        );
    }

    if (type === 'VOID_MIST') {
        return (
            <group>
                <fogExp2 attach="fog" args={['#0f0518', 0.08]} />
                <Sparkles count={500} scale={40} size={10} speed={0.1} opacity={0.2} color="#a855f7" />
            </group>
        );
    }

    return null;
}

const GlobalSceneController = () => {
    const { state } = useGame();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const isEclipse = state.era === Era.KING;
    const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;
    const weather = state.weather || 'CLEAR';
    
    // --- REAL TIME CALCULATIONS ---
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    
    const sunAngle = ((hours - 6) / 24) * Math.PI * 2; 
    
    const sunRadius = 100;
    const sunX = Math.cos(sunAngle) * sunRadius;
    const sunY = Math.sin(sunAngle) * sunRadius;
    const sunZ = 20; 

    const isNight = sunY < -5; 
    const isDawn = hours >= 5 && hours < 7;
    const isDusk = hours >= 17 && hours < 19;

    // --- COLOR PALETTES & INTENSITIES ---
    let sunColor = '#fbbf24'; 
    let skyColor = '#7dd3fc'; 
    let fogColor = '#bae6fd'; 
    let intensity = 3.5; 
    let ambientIntensity = 0.8; 
    let bgColor = '#38bdf8'; 
    let groundColor = '#57534e'; // Darker base for grimdark feel

    if (isDawn) {
        sunColor = '#f97316'; 
        skyColor = '#fdba74';
        fogColor = '#fed7aa';
        bgColor = '#ffedd5';
        intensity = 2.0;
        ambientIntensity = 0.6;
        groundColor = '#78350f';
    } else if (isDusk) {
        sunColor = '#ef4444'; 
        skyColor = '#c084fc';
        fogColor = '#4c1d95';
        bgColor = '#581c87';
        intensity = 1.5;
        ambientIntensity = 0.5;
        groundColor = '#451a03';
    } else if (isNight) {
        sunColor = '#bfdbfe'; 
        skyColor = '#1e3a8a'; 
        fogColor = '#0f172a'; 
        bgColor = '#050202';
        intensity = 0.5; 
        ambientIntensity = 0.2; 
        groundColor = '#1c1917'; 
    }

    if (isRitual) {
        sunColor = '#a855f7'; 
        fogColor = '#2e1065';
        bgColor = '#2e1065';
        intensity = 0.8;
        groundColor = '#2e1065';
    } else if (isEclipse) {
        sunColor = '#ff0000'; 
        fogColor = '#110000';
        bgColor = '#000000';
        intensity = 0.2; 
        groundColor = '#000000';
    }

    // Closer fog for more atmosphere
    const fogDist = 35 + (state.playerLevel * 2); 

    return (
        <>
            <color attach="background" args={[bgColor]} />
            <WeatherSystem type={weather} />
            {weather === 'CLEAR' && <fog attach="fog" args={[fogColor, 10, isNight ? fogDist * 1.5 : fogDist]} />}
            <hemisphereLight intensity={ambientIntensity} color={skyColor} groundColor={isNight ? '#1e1b4b' : '#44403c'} />
            <directionalLight position={[sunX, sunY, sunZ]} intensity={intensity} castShadow shadow-mapSize={[2048, 2048]} color={sunColor} shadow-bias={-0.0005} />
            {isEclipse && <pointLight position={[0, 20, 0]} intensity={2} color="#ff0000" distance={100} decay={2} />}
            <ProceduralMap level={state.playerLevel} era={state.era} groundColor={groundColor} />
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
            <Ring args={[8, 8.5, 64]} rotation={[-Math.PI/2, 0, 0]}><meshStandardMaterial color="#c084fc" emissive="#7e22ce" emissiveIntensity={2} transparent opacity={0.6} side={THREE.DoubleSide} /></Ring>
             <Ring args={[12, 12.2, 64]} rotation={[-Math.PI/2, 0, 0]}><meshStandardMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={1} transparent opacity={0.4} side={THREE.DoubleSide} /></Ring>
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
                    <meshStandardMaterial color="#4c1d95" emissive="#7e22ce" emissiveIntensity={2} side={THREE.DoubleSide} transparent opacity={0.8} />
                </mesh>
                {/* Inner Ring */}
                <mesh ref={r2} rotation={[0,0,Math.PI/4]}>
                    <ringGeometry args={[1.0, 1.1, 4]} />
                    <meshStandardMaterial color="#c084fc" emissive="#fff" emissiveIntensity={1} side={THREE.DoubleSide} />
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
    <Canvas shadows={false} dpr={[1, 1.5]} gl={{ antialias: true }} camera={{ position: [15, 15, 15], fov: 45 }}>
      <ambientLight intensity={0.2} />
      
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
      </Suspense>
    </Canvas>
  );
};
