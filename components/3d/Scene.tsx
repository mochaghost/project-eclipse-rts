
import React, { useMemo, Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Stars, PerspectiveCamera, Ring, Sparkles, Instances, Instance, Html } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { EntityRenderer } from './EntityRenderer';
import { VisualEffectsRenderer } from './VisualEffects';
import { VazarothEffects } from './VazarothEffects'; 
import { EntityType, Era, AlertType, WeatherType } from '../../types';
import { PALETTE } from '../../constants';
import { VazarothTitan, AncientRuin, ResourceNode, GrassTuft, Pebble, BonePile, VoidCrystal, RuinedColumn, RuinedArch } from './Assets'; 
import * as THREE from 'three';

// Simple pseudo-noise function for forest clumping
const noise = (x: number, z: number) => Math.sin(x * 0.1) * Math.cos(z * 0.1) + Math.sin(x * 0.3 + z * 0.2);

const VegetationSystem = () => {
    const trees = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 400; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 80;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const n = noise(x, z);
            if (n > 0.2) { // Forest clump
                temp.push({ position: [x, 0, z], scale: 0.8 + Math.random() * 0.5, rotation: [0, Math.random() * Math.PI, 0] });
            }
        }
        return temp;
    }, []);

    const grass = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 2000; i++) { // 2000 blades, 1 draw call
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue; // Clear spawn
            const n = noise(x*2, z*2);
            if (n > -0.2) {
                temp.push({ position: [x, 0, z], rotation: [0, Math.random(), 0], scale: 0.5 + Math.random() });
            }
        }
        return temp;
    }, []);

    const rocks = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
            temp.push({ position: [x, 0, z], scale: 0.5 + Math.random(), rotation: [Math.random(), Math.random(), Math.random()] });
        }
        return temp;
    }, []);

    return (
        <group>
            {/* INSTANCED TREE TRUNKS */}
            <Instances range={1000}>
                <cylinderGeometry args={[0.1, 0.4, 3, 5]} />
                <meshStandardMaterial color="#0f0505" roughness={0.9} />
                {trees.map((data, i) => (
                    <Instance key={i} position={[data.position[0], 1.5, data.position[2]]} scale={data.scale} rotation={data.rotation as any} />
                ))}
            </Instances>

            {/* INSTANCED TREE TOPS (Foliage) */}
            <Instances range={1000}>
                <dodecahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#0a1f0a" roughness={1} />
                {trees.map((data, i) => (
                    <Instance key={i} position={[data.position[0], 3, data.position[2]]} scale={[data.scale * 1.5, data.scale * 1.5, data.scale * 1.5]} rotation={data.rotation as any} />
                ))}
            </Instances>

            {/* INSTANCED ROCKS */}
            <Instances range={200}>
                <dodecahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial color="#1c1917" roughness={0.8} />
                {rocks.map((data, i) => (
                    <Instance key={i} position={data.position as any} scale={data.scale} rotation={data.rotation as any} />
                ))}
            </Instances>

            {/* INSTANCED GRASS */}
            <Instances range={2500}>
                <planeGeometry args={[0.1, 0.5]} />
                <meshStandardMaterial color="#1a2e10" side={THREE.DoubleSide} />
                {grass.map((data, i) => (
                    <Instance key={i} position={data.position as any} rotation={data.rotation as any} scale={data.scale} />
                ))}
            </Instances>
        </group>
    );
};

const ProceduralMap = ({ level, era }: { level: number, era: Era }) => {
    // Visibility Radius based on Level. 
    const viewRadius = 40 + (level * 2);
    
    // Distant Chunks
    const chunks = useMemo(() => {
        const items: {x: number, z: number, dist: number, type: number, rotation: number}[] = [];
        for(let x = -100; x <= 100; x+=10) { 
            for(let z = -100; z <= 100; z+=10) {
                if (Math.abs(x) < 15 && Math.abs(z) < 15) continue; 
                const dist = Math.sqrt(x*x + z*z);
                const type = Math.random();
                items.push({ x: x + (Math.random() * 5), z: z + (Math.random() * 5), dist, type, rotation: Math.random() * Math.PI });
            }
        }
        return items;
    }, []);

    const specialClutter = useMemo(() => {
        const items: {x: number, z: number, type: string, scale?: number}[] = [];
        for(let i=0; i<150; i++) { 
             const angle = Math.random() * Math.PI * 2;
             const dist = 10 + (Math.random() * 90); 
             const x = Math.cos(angle) * dist;
             const z = Math.sin(angle) * dist;
             
             let type = 'GRASS';
             const r = Math.random();

             if (r > 0.98) type = 'RUIN_COLUMN';
             else if (r > 0.96) type = 'BONE_PILE';
             else if (r > 0.94) type = 'VOID_CRYSTAL'; 
             else if (r > 0.8) type = 'PEBBLE';
             else continue; // Skip if not special

             items.push({ x, z, type, scale: 0.8 + Math.random() * 0.4 });
        }
        return items;
    }, []);

    return (
        <group>
            {/* Infinite Floor Plane - Darker, richer ground */}
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[400, 400, 128, 128]} />
                <meshStandardMaterial 
                    color={era === Era.KING ? '#0a0505' : '#1c1917'} 
                    roughness={1} 
                    metalness={0.1}
                />
            </mesh>

            {/* Vegetation System (Optimized Instancing) */}
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
                if (chunk.dist > viewRadius + 20) return null;
                const isVisible = chunk.dist < viewRadius;
                if (!isVisible) {
                    return (
                        <mesh key={i} position={[chunk.x, 0.5, chunk.z]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[2, 2]} />
                            <meshBasicMaterial color="#000" transparent opacity={0.5} />
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
    if (type === 'CLEAR') return null;

    if (type === 'RAIN') {
        return (
            <group position={[0, 10, 0]}>
                <Sparkles count={1000} scale={30} size={2} speed={3} opacity={0.4} color="#60a5fa" noise={0} />
                <fogExp2 attach="fog" args={['#1e293b', 0.02]} />
                <directionalLight position={[10, 10, 5]} intensity={0.2} color="#60a5fa" />
            </group>
        );
    }

    if (type === 'ASH_STORM') {
        return (
            <group position={[0, 10, 0]}>
                <Sparkles count={500} scale={40} size={5} speed={0.5} opacity={0.6} color="#450a0a" noise={1} />
                <fogExp2 attach="fog" args={['#2a0a0a', 0.04]} />
                <ambientLight intensity={0.5} color="#7f1d1d" />
            </group>
        );
    }

    if (type === 'VOID_MIST') {
        return (
            <group>
                <fogExp2 attach="fog" args={['#0f0518', 0.06]} />
                <Sparkles count={200} scale={20} size={8} speed={0.1} opacity={0.2} color="#a855f7" />
            </group>
        );
    }

    return null;
}

const AtmosphericController = () => {
    const { state } = useGame();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
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
    const sunZ = 20; // Slight offset

    const isNight = sunY < -5; // Below horizon
    const isDawn = hours >= 5 && hours < 7;
    const isDusk = hours >= 17 && hours < 19;

    // --- COLOR PALETTES & INTENSITIES ---
    // Default: BRIGHT DAY (e.g. 9:47 AM)
    let sunColor = '#fbbf24'; // Warm Sunlight
    let skyColor = '#7dd3fc'; // Bright Sky Blue
    let fogColor = '#bae6fd'; // Light Blue Fog
    let intensity = 2.5; // Very bright sun
    let ambientIntensity = 0.8; // Bright shadows
    let bgColor = '#38bdf8'; // Blue Background

    if (isDawn) {
        sunColor = '#f97316'; // Orange
        skyColor = '#fdba74';
        fogColor = '#fed7aa';
        bgColor = '#ffedd5';
        intensity = 1.5;
        ambientIntensity = 0.5;
    } else if (isDusk) {
        sunColor = '#ef4444'; // Red/Pink
        skyColor = '#c084fc';
        fogColor = '#4c1d95';
        bgColor = '#581c87';
        intensity = 1.2;
        ambientIntensity = 0.4;
    } else if (isNight) {
        sunColor = '#bfdbfe'; // Moon
        skyColor = '#1e3a8a'; 
        fogColor = '#0f172a'; 
        bgColor = '#050202';
        intensity = 1.0; 
        ambientIntensity = 0.2; 
    }

    // --- OVERRIDES (Magic takes precedence over Time) ---
    if (isRitual) {
        sunColor = '#a855f7'; 
        fogColor = '#2e1065';
        bgColor = '#2e1065';
        intensity = 0.5;
    } else if (isEclipse) {
        sunColor = '#ff0000'; 
        fogColor = '#110000';
        bgColor = '#000000';
        intensity = 0.1; // Dark sun
    }

    const fogDist = 40 + (state.playerLevel * 4);

    return (
        <>
            <color attach="background" args={[bgColor]} />
            
            <WeatherSystem type={weather} />
            
            {weather === 'CLEAR' && <fog attach="fog" args={[fogColor, 10, isNight ? fogDist * 1.5 : fogDist]} />}
            
            <hemisphereLight 
                intensity={ambientIntensity} 
                color={skyColor} 
                groundColor={isNight ? '#334155' : '#78716c'} 
            />
            
            <directionalLight 
                position={[sunX, sunY, sunZ]} 
                intensity={intensity} 
                castShadow 
                shadow-mapSize={[2048, 2048]} 
                color={sunColor} 
                shadow-bias={-0.0005}
            />
            
            {isEclipse && (
                 <pointLight position={[0, 20, 0]} intensity={2} color="#ff0000" distance={100} decay={2} />
            )}
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
            <Ring args={[8, 8.5, 64]} rotation={[-Math.PI/2, 0, 0]}>
                <meshStandardMaterial color="#c084fc" emissive="#7e22ce" emissiveIntensity={2} transparent opacity={0.6} side={THREE.DoubleSide} />
            </Ring>
             <Ring args={[12, 12.2, 64]} rotation={[-Math.PI/2, 0, 0]}>
                <meshStandardMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={1} transparent opacity={0.4} side={THREE.DoubleSide} />
            </Ring>
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
  
  if (!state) return null;

  const isBaseDamaged = (state.baseHp || 0) < (state.maxBaseHp || 100) * 0.5;
  const enemies = state.enemies || [];
  const minions = state.minions || [];
  const population = state.population || [];
  const isHighQuality = (state.settings?.graphicsQuality || 'HIGH') === 'HIGH';
  const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;

  return (
    <Canvas shadows={false} dpr={[1, 1.5]} gl={{ antialias: true }} camera={{ position: [15, 15, 15], fov: 45 }}>
      {/* Dynamic background controlled by AtmosphericController, no static color here */}
      
      {/* Backup Lights - Guarantees scene visibility even if Atmos fails */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 20, 10]} intensity={0.5} />
      
      <Suspense fallback={<LoaderFallback />}>
          <AtmosphericController />
          {isHighQuality && <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />}
          
          <VazarothTitan />
          
          <ProceduralMap level={state.playerLevel} era={state.era} />
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
              // Initial scattering, EntityRenderer will handle wandering from here
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

          {/* Add some ambient animals */}
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
