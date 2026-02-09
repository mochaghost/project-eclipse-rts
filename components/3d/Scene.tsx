
import React, { useMemo, Suspense, useRef, useLayoutEffect, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls, Stars, Ring, Sparkles, Html, Float, Line, Cloud, Billboard } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { useGame } from '../../context/GameContext';
import { EntityRenderer } from './EntityRenderer';
import { VisualEffectsRenderer } from './VisualEffects';
import { VazarothEffects } from './VazarothEffects'; 
import { EntityType, Era, AlertType, WeatherType, Vector3, EnemyEntity, NPC, Task, MinionEntity, GameState } from '../../types';
import { VazarothTitan, BonePile, VoidCrystal, RuinedColumn, Torch, TwistedTree, GlowingMushroom, GhostWisp } from './Assets'; 
import * as THREE from 'three';

// --- MATH HELPERS ---
const noise = (x: number, z: number) => Math.sin(x * 0.05) * Math.cos(z * 0.05) + Math.sin(x * 0.1 + z * 0.1) * 0.5;

// --- OPTIMIZED VEGETATION SYSTEM (NATIVE INSTANCING) ---
const VegetationSystem = React.memo(() => {
    const grassRef = useRef<THREE.InstancedMesh>(null);
    const rockRef = useRef<THREE.InstancedMesh>(null);
    
    const GRASS_COUNT = 1500; 
    const ROCK_COUNT = 150;

    useLayoutEffect(() => {
        const dummy = new THREE.Object3D();

        if (grassRef.current) {
            let index = 0;
            for (let i = 0; i < GRASS_COUNT; i++) {
                const x = (Math.random() - 0.5) * 200;
                const z = (Math.random() - 0.5) * 200;
                
                if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

                const n = noise(x * 2, z * 2);
                if (n > -0.3) { 
                    dummy.position.set(x, 0, z);
                    dummy.rotation.set(0, Math.random() * Math.PI, 0);
                    dummy.scale.setScalar(0.8 + Math.random() * 1.2);
                    dummy.updateMatrix();
                    grassRef.current.setMatrixAt(index++, dummy.matrix);
                }
            }
            grassRef.current.count = index;
            grassRef.current.instanceMatrix.needsUpdate = true;
        }

        if (rockRef.current) {
            let index = 0;
            for (let i = 0; i < ROCK_COUNT; i++) {
                const x = (Math.random() - 0.5) * 150;
                const z = (Math.random() - 0.5) * 150;
                if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;

                dummy.position.set(x, 0, z);
                dummy.rotation.set(Math.random(), Math.random(), Math.random());
                dummy.scale.setScalar(0.4 + Math.random() * 0.6);
                dummy.updateMatrix();
                rockRef.current.setMatrixAt(index++, dummy.matrix);
            }
            rockRef.current.count = index;
            rockRef.current.instanceMatrix.needsUpdate = true;
        }
    }, []);

    return (
        <group>
            <instancedMesh ref={rockRef} args={[undefined, undefined, ROCK_COUNT]} castShadow receiveShadow>
                <dodecahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#1c1917" roughness={0.9} />
            </instancedMesh>

            <instancedMesh ref={grassRef} args={[undefined, undefined, GRASS_COUNT]} receiveShadow>
                <planeGeometry args={[0.15, 0.8]} />
                <meshStandardMaterial color="#1a2e10" side={THREE.DoubleSide} />
            </instancedMesh>
        </group>
    );
});

const StaticDecorations = React.memo(({ level }: { level: number }) => {
    const viewRadius = 60 + (level * 2);
    
    const decorations = useMemo(() => {
        const items = [];
        for(let i=0; i<50; i++) { 
             const angle = Math.random() * Math.PI * 2;
             const dist = 15 + (Math.random() * 120); 
             const x = Math.cos(angle) * dist;
             const z = Math.sin(angle) * dist;
             
             if (Math.abs(x) > viewRadius || Math.abs(z) > viewRadius) continue;

             let type = 'TREE';
             const r = Math.random();

             if (r > 0.95) type = 'RUIN_COLUMN';
             else if (r > 0.90) type = 'TORCH';
             else if (r > 0.85) type = 'MUSHROOM';
             else if (r > 0.82) type = 'VOID_CRYSTAL'; 
             else if (r > 0.78) type = 'BONE_PILE';
             else if (r > 0.75) type = 'WISP';
             
             items.push({ x, z, type, rotation: Math.random() * Math.PI, scale: 1 + Math.random() * 1.5 });
        }
        return items;
    }, [viewRadius]);

    return (
        <group>
            {decorations.map((item, i) => {
                 const pos: [number, number, number] = [item.x, 0, item.z];
                 if (item.type === 'TREE') return <TwistedTree key={i} position={pos} scale={item.scale} rotation={[0, item.rotation, 0]} />
                 if (item.type === 'TORCH') return <Torch key={i} position={pos} />
                 if (item.type === 'MUSHROOM') return <GlowingMushroom key={i} position={pos} />
                 if (item.type === 'WISP') return <GhostWisp key={i} position={[item.x, 2, item.z]} />
                 if (item.type === 'BONE_PILE') return <BonePile key={i} position={pos} />
                 if (item.type === 'RUIN_COLUMN') return <RuinedColumn key={i} position={pos} />
                 if (item.type === 'VOID_CRYSTAL') return <VoidCrystal key={i} position={pos} />
                 return null;
            })}
        </group>
    );
});

const WeatherSystem = React.memo(({ type }: { type: WeatherType }) => {
    // Subtle realistic particles
    if (type === 'CLEAR') return (
        <group>
            {/* Dust motes */}
            <Sparkles count={30} scale={40} size={1} opacity={0.2} color="#fff7ed" speed={0.1} />
        </group>
    );
    
    if (type === 'RAIN') return (
        <group position={[0, 15, 0]}>
            <Sparkles count={400} scale={[40, 20, 40]} size={2} speed={8} opacity={0.3} color="#94a3b8" noise={0} />
            {/* @ts-ignore */}
            <Cloud opacity={0.3} speed={0.4} width={20} depth={1.5} segments={20} position={[0, 10, -20]} color="#475569" />
        </group>
    );
    
    if (type === 'ASH_STORM') return (
        <group position={[0, 10, 0]}>
            {/* Heavy Ash */}
            <Sparkles count={300} scale={50} size={4} speed={0.8} opacity={0.7} color="#1c1917" noise={1} />
            {/* Embers */}
            <Sparkles count={50} scale={40} size={6} speed={1.2} opacity={0.8} color="#ea580c" noise={2} />
        </group>
    );
    
    if (type === 'VOID_MIST') return (
        <group>
            <Sparkles count={150} scale={40} size={8} speed={0.2} opacity={0.1} color="#a855f7" />
            {/* @ts-ignore */}
            <Cloud opacity={0.2} speed={0.1} width={30} depth={5} segments={10} position={[0, 5, 0]} color="#2e1065" />
        </group>
    );
    
    return null;
});

// --- REALISTIC ATMOSPHERIC LIGHTING ENGINE ---
const RealTimeLighting = ({ isRitual, weather }: { isRitual: boolean, weather: WeatherType }) => {
    const lightRef = useRef<THREE.DirectionalLight>(null);
    const sunMeshRef = useRef<THREE.Mesh>(null);
    
    // Use refs for values that change every frame to avoid React render cycles
    const targetValues = useRef({
        sky: new THREE.Color('#000000'),
        light: new THREE.Color('#000000'),
        intensity: 0,
        pos: new THREE.Vector3(0, 50, 0),
        fogDensity: 0.01,
        sunColor: new THREE.Color('#000000'),
        sunScale: 1
    });

    const currentValues = useRef({
        sky: new THREE.Color('#0f172a'),
        light: new THREE.Color('#fbbf24'),
        intensity: 1,
        fogDensity: 0.01,
        sunColor: new THREE.Color('#fbbf24')
    });

    // Update Targets based on Time & Weather
    useFrame((state, delta) => {
        const now = new Date();
        const hour = now.getHours() + (now.getMinutes() / 60);
        
        // 1. CALCULATE BASE TIME-OF-DAY PALETTE (Realistic Grimdark)
        let baseSky = '#0f172a';
        let baseLight = '#fbbf24';
        let baseIntensity = 1.0;
        let sunPos = [50, 50, 20];
        let baseFog = 0.015;
        let sunColor = '#fbbf24';
        let sunScale = 1;

        // Night (20:00 - 05:00)
        if (hour < 5 || hour >= 20) {
            baseSky = '#020617'; // Deepest Slate
            baseLight = '#64748b'; // Moon Silver (Cold)
            baseIntensity = 0.3;
            sunPos = [20, 60, -20]; // Moon high
            baseFog = 0.035; // Night fog
            sunColor = '#e2e8f0'; // Pale moon
            sunScale = 0.8;
        }
        // Dawn (05:00 - 08:00)
        else if (hour >= 5 && hour < 8) {
            baseSky = '#451a03'; // Deep Bronze/Brown
            baseLight = '#fb923c'; // Warm Orange
            baseIntensity = 0.8;
            sunPos = [50, 20, 50]; // Low horizon
            baseFog = 0.025; // Morning mist
            sunColor = '#ea580c'; // Red sun
            sunScale = 1.5;
        }
        // Morning (08:00 - 11:00)
        else if (hour >= 8 && hour < 11) {
            baseSky = '#334155'; // Slate Grey (Transition)
            baseLight = '#fde68a'; // Pale Yellow
            baseIntensity = 1.2;
            sunPos = [30, 40, 30]; 
            baseFog = 0.015;
            sunColor = '#fcd34d';
        }
        // HIGH NOON (11:00 - 15:00) - THE CRUCIBLE
        else if (hour >= 11 && hour < 15) {
            baseSky = '#475569'; // Steel Blue-Grey (Brighter but cold)
            baseLight = '#fffff0'; // Harsh White/Gold
            baseIntensity = 2.5; // Blinding intensity
            sunPos = [10, 80, 10]; // Overhead
            baseFog = 0.008; // Clear, harsh air
            sunColor = '#ffffff'; // White hot
            sunScale = 1.2;
        }
        // Afternoon (15:00 - 17:00)
        else if (hour >= 15 && hour < 17) {
            baseSky = '#334155'; // Returning to slate
            baseLight = '#fbbf24'; // Gold returns
            baseIntensity = 1.5;
            sunPos = [-10, 50, 10]; 
            baseFog = 0.012;
            sunColor = '#fbbf24';
        }
        // Dusk (17:00 - 20:00)
        else if (hour >= 17 && hour < 20) {
            baseSky = '#271a2e'; // Bruised Purple/Grey
            baseLight = '#be123c'; // Dying Sun Red
            baseIntensity = 0.7;
            sunPos = [-50, 20, 20]; // Setting
            baseFog = 0.02;
            sunColor = '#dc2626'; // Blood sun
            sunScale = 1.8;
        }

        // 2. APPLY WEATHER MODIFIERS (Physical accuracy approximation)
        if (weather === 'RAIN') {
            baseSky = '#1e293b'; // Darker Slate
            baseLight = '#94a3b8'; // Cold Grey Light
            baseIntensity *= 0.5; // Sun obscured
            baseFog = 0.04; // Heavy rain fog
            sunScale = 0; // Sun hidden
        }
        else if (weather === 'ASH_STORM') {
            baseSky = '#292524'; // Warm Black
            baseLight = '#ea580c'; // Fire Orange (diffused)
            baseIntensity *= 0.6;
            baseFog = 0.055; // Very dense ash
            sunColor = '#ef4444'; // Red disk through smoke
            sunScale = 2; // Diffused large sun
        }
        else if (weather === 'VOID_MIST') {
            baseSky = '#2e1065'; // Void Purple
            baseLight = '#a855f7';
            baseIntensity *= 0.4;
            baseFog = 0.08; // Impenetrable
            sunScale = 0;
        }

        // 3. RITUAL OVERRIDE
        if (isRitual) {
            baseSky = '#2e1065';
            baseLight = '#d8b4fe';
            baseIntensity = 0.5;
            baseFog = 0.06;
            sunScale = 0;
        }

        // 4. CLOUD SHADOW SIMULATION (Noise)
        const cloudNoise = noise(state.clock.elapsedTime * 0.1, 0); // Slow moving clouds
        const shadowFactor = 0.8 + (cloudNoise * 0.2); // Light varies between 80% and 120%
        baseIntensity *= shadowFactor;

        // 5. UPDATE TARGETS
        targetValues.current.sky.set(baseSky);
        targetValues.current.light.set(baseLight);
        targetValues.current.intensity = baseIntensity;
        targetValues.current.pos.set(sunPos[0], sunPos[1], sunPos[2]);
        targetValues.current.fogDensity = baseFog;
        targetValues.current.sunColor.set(sunColor);
        targetValues.current.sunScale = sunScale;

        // 6. LERP CURRENT VALUES (Smooth Transitions)
        const lerpSpeed = delta * 0.5; // Slow transition for realism
        currentValues.current.sky.lerp(targetValues.current.sky, lerpSpeed);
        currentValues.current.light.lerp(targetValues.current.light, lerpSpeed);
        currentValues.current.intensity = THREE.MathUtils.lerp(currentValues.current.intensity, targetValues.current.intensity, lerpSpeed);
        currentValues.current.fogDensity = THREE.MathUtils.lerp(currentValues.current.fogDensity, targetValues.current.fogDensity, lerpSpeed);
        currentValues.current.sunColor.lerp(targetValues.current.sunColor, lerpSpeed);

        // 7. APPLY TO SCENE
        state.scene.background = currentValues.current.sky;
        if (state.scene.fog) {
            // @ts-ignore
            state.scene.fog.color.copy(currentValues.current.sky);
            // @ts-ignore
            state.scene.fog.density = currentValues.current.fogDensity;
        }
        if (lightRef.current) {
            lightRef.current.color.copy(currentValues.current.light);
            lightRef.current.intensity = currentValues.current.intensity;
            lightRef.current.position.lerp(targetValues.current.pos, lerpSpeed);
        }
        
        // 8. UPDATE VISIBLE SUN MESH
        if (sunMeshRef.current && lightRef.current) {
            // Position the sun mesh far away in the direction of the light
            const direction = lightRef.current.position.clone().normalize();
            sunMeshRef.current.position.copy(direction.multiplyScalar(400)); // 400 units away (skybox distance)
            sunMeshRef.current.lookAt(0,0,0);
            
            // @ts-ignore
            sunMeshRef.current.material.color.copy(currentValues.current.sunColor);
            
            // Lerp scale
            sunMeshRef.current.scale.lerp(new THREE.Vector3(targetValues.current.sunScale, targetValues.current.sunScale, targetValues.current.sunScale).multiplyScalar(20), lerpSpeed);
        }
    });

    return (
        <>
            <fogExp2 attach="fog" args={['#000', 0.01]} /> {/* Initial placeholder, updated by useFrame */}
            <directionalLight 
                ref={lightRef}
                position={[50, 50, 20]} 
                castShadow 
                shadow-mapSize={[2048, 2048]} // Higher res shadows for harsh sun
                shadow-bias={-0.0005} 
            />
            {/* Ambient light simulates sky scattering (GI approximation) */}
            <ambientLight intensity={0.2} color="#475569" /> 
            
            {/* Ground Plane receives shadows */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#1c1917" roughness={1} metalness={0} />
            </mesh>

            {/* THE SUN/MOON OBJECT */}
            <mesh ref={sunMeshRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#fbbf24" toneMapped={false} />
            </mesh>
        </>
    );
};

const PortalRift: React.FC<{ position: Vector3 }> = ({ position }) => {
    const r1 = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => { if(r1.current) r1.current.rotation.z += delta; });
    return (
        <group position={[position.x, 2, position.z]}>
            <Float speed={4} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh ref={r1} rotation={[0,0,0]}>
                    <ringGeometry args={[1.5, 1.8, 32]} />
                    <meshBasicMaterial color="#a855f7" transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
                <mesh><circleGeometry args={[0.8, 16]} /><meshBasicMaterial color="#000" /></mesh>
            </Float>
            <Html position={[0, -2.5, 0]} center distanceFactor={15}>
                <div className="text-[9px] text-purple-300 font-serif bg-black/80 px-2 border border-purple-900">MANIFESTING</div>
            </Html>
        </group>
    )
}

const HierarchyLines = React.memo(({ enemies, tasks }: { enemies: EnemyEntity[], tasks: Task[] }) => {
    const links = useMemo(() => {
        const lines: any[] = [];

        const minions = enemies.filter(e => e.subtaskId);
        minions.forEach(minion => {
            const commander = enemies.find(e => e.taskId === minion.taskId && !e.subtaskId);
            if (commander) {
                lines.push({
                    start: new THREE.Vector3(commander.position.x, 2, commander.position.z),
                    end: new THREE.Vector3(minion.position.x, 1, minion.position.z),
                    key: `minion-${minion.id}`,
                    color: '#4c1d95' 
                });
            }
        });

        const commanders = enemies.filter(e => !e.subtaskId);
        commanders.forEach(childCmdr => {
            const task = tasks.find(t => t.id === childCmdr.taskId);
            if (task && task.parentId) {
                const parentCmdr = enemies.find(e => e.taskId === task.parentId && !e.subtaskId);
                if (parentCmdr) {
                    lines.push({
                        start: new THREE.Vector3(parentCmdr.position.x, 4, parentCmdr.position.z), 
                        end: new THREE.Vector3(childCmdr.position.x, 2, childCmdr.position.z),
                        key: `overlord-${childCmdr.id}`,
                        color: '#b91c1c' 
                    });
                }
            }
        });

        return lines;
    }, [enemies, tasks]);

    return (
        <group>
            {links.map(l => (
                <Line 
                    key={l.key} 
                    points={[l.start, l.end]} 
                    color={l.color} 
                    lineWidth={1} 
                    dashed 
                    dashScale={2} 
                    opacity={0.4} 
                    transparent 
                />
            ))}
        </group>
    )
});

const LoaderFallback = () => <Html center><div className="text-yellow-600 font-serif text-sm animate-pulse">LOADING WORLD...</div></Html>;

// --- ISOLATED GAME WORLD COMPONENT ---
const GameWorld = React.memo(({ 
    state, 
    selectEnemy, 
    interactWithNPC 
}: { 
    state: GameState, 
    selectEnemy: any, 
    interactWithNPC: any 
}) => {
    const { camera } = useThree();
    const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;
    const isHighQuality = (state.settings?.graphicsQuality || 'HIGH') === 'HIGH';
    const isBattle = state.activeMapEvent === 'BATTLE_CINEMATIC';
    const now = Date.now();

    // CINEMATIC CAMERA CONTROLLER
    useFrame((_, delta) => {
        if (isBattle) {
            const targetPos = new THREE.Vector3(0, 8, 12);
            camera.position.lerp(targetPos, delta * 0.5);
            camera.lookAt(0, 0, 0);
        }
    });

    return (
        <>
            <RealTimeLighting isRitual={isRitual} weather={state.weather || 'CLEAR'} />
            <WeatherSystem type={state.weather || 'CLEAR'} />
            
            <VegetationSystem />
            <StaticDecorations level={state.playerLevel} />
            
            {isHighQuality && <Stars radius={150} depth={50} count={1000} factor={4} saturation={0} fade speed={0.2} />}
            <VazarothTitan />

            {/* DYNAMIC ENTITIES */}
            <EntityRenderer 
                type={EntityType.BUILDING_BASE} 
                variant={state.era} 
                position={[0, 0, 0]} 
                stats={{ hp: state.baseHp || 100, maxHp: state.maxBaseHp || 100 }}
                structures={state.structures} 
            />

            <EntityRenderer 
                type={EntityType.HERO} 
                variant={state.playerLevel as any} 
                position={[4, 0, 4]} 
                winStreak={state.winStreak}
                equipment={state.heroEquipment} 
            />

            {(state.minions || []).map(minion => (
                <EntityRenderer key={minion.id} type={EntityType.MINION} position={[minion.position.x, minion.position.y, minion.position.z]} />
            ))}

            {(state.enemies || []).map(enemy => {
                const task = (state.tasks || []).find(t => t.id === enemy.taskId);
                let startTime = task ? task.startTime : 0;
                
                if (enemy.subtaskId && task && task.subtasks) { 
                    const sub = task.subtasks.find(s => s.id === enemy.subtaskId);
                    if (sub && sub.startTime) startTime = sub.startTime;
                }

                if (now < startTime) return <PortalRift key={enemy.id} position={enemy.position} />;

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
                        failed={task?.failed}
                        task={task} 
                    />
                );
            })}
            
            <HierarchyLines enemies={state.enemies || []} tasks={state.tasks || []} />

            {(state.population || []).map((npc, i) => {
                const angle = (i * 137.5) * (Math.PI / 180);
                const r = 6 + (i % 5); 
                return (
                    <EntityRenderer
                        key={npc.id}
                        type={EntityType.VILLAGER}
                        variant={npc.role}
                        name={npc.name}
                        position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]}
                        npcStatus={npc.status}
                        npcAction={npc.currentAction} 
                        onClick={() => interactWithNPC(npc.id)}
                    />
                );
            })}

            <VisualEffectsRenderer />
            <VazarothEffects />
            
            <MapControls makeDefault maxPolarAngle={Math.PI / 2.2} enabled={!isBattle} />

            {isHighQuality && (
                <EffectComposer enableNormalPass={false}>
                    <Bloom luminanceThreshold={1.5} mipmapBlur intensity={0.6} radius={0.4} />
                    <Vignette eskil={false} offset={0.1} darkness={0.5} />
                    <Noise opacity={0.05} />
                </EffectComposer>
            )}
        </>
    )
}, (prev, next) => {
    return (
        prev.state.enemies === next.state.enemies &&
        prev.state.tasks === next.state.tasks &&
        prev.state.population === next.state.population &&
        prev.state.baseHp === next.state.baseHp &&
        prev.state.weather === next.state.weather &&
        prev.state.effects === next.state.effects &&
        prev.state.activeMapEvent === next.state.activeMapEvent &&
        prev.state.selectedEnemyId === next.state.selectedEnemyId &&
        prev.state.structures === next.state.structures &&
        prev.state.heroEquipment === next.state.heroEquipment
    );
});

export const Scene: React.FC = () => {
  const { state, selectEnemy, interactWithNPC } = useGame();

  if (!state) return null;

  return (
    <Canvas shadows={false} dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }} camera={{ position: [15, 15, 15], fov: 45 }}>
      <Suspense fallback={<LoaderFallback />}>
          <GameWorld state={state} selectEnemy={selectEnemy} interactWithNPC={interactWithNPC} />
      </Suspense>
    </Canvas>
  );
};
