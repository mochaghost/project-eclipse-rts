
import React, { useMemo, Suspense, useRef, useLayoutEffect, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls, Stars, Ring, Sparkles, Html, Float, Line, Cloud, Billboard } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { useGame } from '../../context/GameContext';
import { EntityRenderer } from './EntityRenderer';
import { VisualEffectsRenderer } from './VisualEffects';
import { VazarothEffects } from './VazarothEffects'; 
import { EntityType, Era, AlertType, WeatherType, Vector3, EnemyEntity, NPC, Task, MinionEntity, GameState, Structures } from '../../types';
import { VazarothTitan, BonePile, VoidCrystal, RuinedColumn, Torch, TwistedTree, GlowingMushroom, GhostWisp } from './Assets'; 
import * as THREE from 'three';

// --- MATH HELPERS ---
const noise = (x: number, z: number) => Math.sin(x * 0.05) * Math.cos(z * 0.05) + Math.sin(x * 0.1 + z * 0.1) * 0.5;

// --- OPTIMIZED VEGETATION SYSTEM ---
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
                if (Math.abs(x) < 20 && Math.abs(z) < 20) continue; // Clear base area

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
                if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

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
             const dist = 25 + (Math.random() * 120); 
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
    if (type === 'CLEAR') return <Sparkles count={50} scale={50} size={2} opacity={0.3} color="#fff7ed" speed={0.2} />;
    if (type === 'RAIN') return (
        <group position={[0, 15, 0]}>
            <Sparkles count={400} scale={[40, 20, 40]} size={2} speed={8} opacity={0.3} color="#94a3b8" noise={0} />
            <Cloud opacity={0.3} speed={0.4} bounds={[20, 2, 1.5]} segments={20} position={[0, 10, -20]} color="#475569" />
        </group>
    );
    if (type === 'ASH_STORM') return (
        <group position={[0, 10, 0]}>
            <Sparkles count={300} scale={50} size={4} speed={0.8} opacity={0.7} color="#1c1917" noise={1} />
            <Sparkles count={50} scale={40} size={6} speed={1.2} opacity={0.8} color="#ea580c" noise={2} />
        </group>
    );
    if (type === 'VOID_MIST') return (
        <group>
            <Sparkles count={150} scale={40} size={8} speed={0.2} opacity={0.1} color="#a855f7" />
            <Cloud opacity={0.2} speed={0.1} bounds={[30, 4, 5]} segments={10} position={[0, 5, 0]} color="#2e1065" />
        </group>
    );
    return null;
});

// --- ENHANCED LIGHTING ENGINE ---
const RealTimeLighting = ({ isRitual, weather, structures }: { isRitual: boolean, weather: WeatherType, structures: Structures }) => {
    const lightRef = useRef<THREE.DirectionalLight>(null);
    const sunMeshRef = useRef<THREE.Mesh>(null);
    
    // Artificial light level from player upgrades (0, 1, 2, 3...)
    const artificialLightLevel = structures?.lightingLevel || 0;

    const currentValues = useRef({
        sky: new THREE.Color('#0f172a'),
        light: new THREE.Color('#fbbf24'),
        intensity: 1,
        ambient: 0.2, // Base ambient logic
        fogDensity: 0.01,
        sunColor: new THREE.Color('#fbbf24')
    });

    useFrame((state, delta) => {
        const now = new Date();
        const hour = now.getHours() + (now.getMinutes() / 60);
        
        let baseSky = '#0f172a';
        let baseLight = '#fbbf24';
        let baseIntensity = 1.0;
        let sunPos = [50, 50, 20];
        let baseFog = 0.015;
        let sunColor = '#fbbf24';
        let sunScale = 1;
        let baseAmbient = 0.4; // Significantly raised base floor so nothing is ever invisible

        // --- TIME OF DAY LOGIC ---
        if (hour < 5 || hour >= 20) { // NIGHT
            baseSky = '#050208'; 
            baseLight = '#64748b'; 
            // If user has bought lights, night is BRIGHTER near base
            const lightBonus = artificialLightLevel * 0.2; 
            baseIntensity = 0.3 + lightBonus; 
            baseAmbient = 0.2 + (artificialLightLevel * 0.1); 
            
            sunPos = [20, 60, -20]; 
            baseFog = 0.025; 
            sunColor = '#e2e8f0'; 
            sunScale = 0.8;
        }
        else if (hour >= 5 && hour < 8) { // DAWN
            baseSky = '#451a03'; baseLight = '#fb923c'; baseIntensity = 1.2; sunPos = [50, 20, 50]; baseFog = 0.02; sunColor = '#ea580c'; sunScale = 1.5; baseAmbient = 0.5;
        }
        else if (hour >= 8 && hour < 17) { // DAY
            baseSky = '#475569'; baseLight = '#fffff0'; baseIntensity = 2.0; sunPos = [10, 80, 10]; baseFog = 0.005; sunColor = '#ffffff'; sunScale = 1.2; baseAmbient = 0.7;
        }
        else if (hour >= 17 && hour < 20) { // DUSK
            baseSky = '#271a2e'; baseLight = '#be123c'; baseIntensity = 1.0; sunPos = [-50, 20, 20]; baseFog = 0.02; sunColor = '#dc2626'; sunScale = 1.8; baseAmbient = 0.5;
        }

        // Apply Weather
        if (weather === 'RAIN') { baseSky = '#1e293b'; baseIntensity *= 0.6; baseFog = 0.04; sunScale = 0; }
        if (weather === 'ASH_STORM') { baseSky = '#292524'; baseIntensity *= 0.6; baseFog = 0.05; sunColor = '#ef4444'; sunScale = 2; }
        if (weather === 'VOID_MIST') { baseSky = '#2e1065'; baseIntensity *= 0.4; baseFog = 0.08; sunScale = 0; }

        if (isRitual) { baseSky = '#2e1065'; baseLight = '#d8b4fe'; baseIntensity = 0.5; baseFog = 0.06; sunScale = 0; }

        // Lerp Values
        const lerpSpeed = delta * 0.5;
        currentValues.current.sky.lerp(new THREE.Color(baseSky), lerpSpeed);
        currentValues.current.light.lerp(new THREE.Color(baseLight), lerpSpeed);
        currentValues.current.intensity = THREE.MathUtils.lerp(currentValues.current.intensity, baseIntensity, lerpSpeed);
        currentValues.current.ambient = THREE.MathUtils.lerp(currentValues.current.ambient, baseAmbient, lerpSpeed);
        currentValues.current.fogDensity = THREE.MathUtils.lerp(currentValues.current.fogDensity, baseFog, lerpSpeed);
        currentValues.current.sunColor.lerp(new THREE.Color(sunColor), lerpSpeed);

        // Apply
        state.scene.background = currentValues.current.sky;
        // @ts-ignore
        if (state.scene.fog) { state.scene.fog.color.copy(currentValues.current.sky); state.scene.fog.density = currentValues.current.fogDensity; }
        if (lightRef.current) {
            lightRef.current.color.copy(currentValues.current.light);
            lightRef.current.intensity = currentValues.current.intensity;
            lightRef.current.position.set(sunPos[0], sunPos[1], sunPos[2]);
        }
        if (sunMeshRef.current) {
            sunMeshRef.current.position.copy(new THREE.Vector3(...sunPos).normalize().multiplyScalar(400));
            sunMeshRef.current.scale.setScalar(20 * sunScale);
            // @ts-ignore
            sunMeshRef.current.material.color.copy(currentValues.current.sunColor);
        }
    });

    return (
        <>
            <fogExp2 attach="fog" args={['#000', 0.01]} />
            
            {/* Main Sun/Moon */}
            <directionalLight ref={lightRef} position={[50, 50, 20]} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
            
            {/* Hemisphere Light ensures nothing is ever completely black (Ground reflection) */}
            <hemisphereLight args={['#ffffff', '#222222', 0.4]} />
            
            {/* Dynamic Ambient Light based on time of day */}
            <ambientLight intensity={0.4} color="#a1a1aa" /> 

            {/* Visual Sun */}
            <mesh ref={sunMeshRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#fbbf24" toneMapped={false} />
            </mesh>
        </>
    );
};

const HierarchyLines = React.memo(({ enemies, tasks }: { enemies: EnemyEntity[], tasks: Task[] }) => {
    const links = useMemo(() => {
        const lines: any[] = [];
        const minions = enemies.filter(e => e.subtaskId);
        minions.forEach(minion => {
            const commander = enemies.find(e => e.taskId === minion.taskId && !e.subtaskId);
            if (commander) {
                lines.push({ start: new THREE.Vector3(commander.position.x, 2, commander.position.z), end: new THREE.Vector3(minion.position.x, 1, minion.position.z), key: `minion-${minion.id}`, color: '#4c1d95' });
            }
        });
        return lines;
    }, [enemies, tasks]);

    return (
        <group>
            {links.map(l => <Line key={l.key} points={[l.start, l.end]} color={l.color} lineWidth={1} dashed dashScale={2} opacity={0.4} transparent />)}
        </group>
    )
});

const LoaderFallback = () => <Html center><div className="text-yellow-600 font-serif text-sm animate-pulse">LOADING WORLD...</div></Html>;

const GameWorld = React.memo(({ state, selectEnemy, interactWithNPC }: { state: GameState, selectEnemy: any, interactWithNPC: any }) => {
    const { camera } = useThree();
    const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;
    const isHighQuality = (state.settings?.graphicsQuality || 'HIGH') === 'HIGH';
    const isBattle = state.activeMapEvent === 'BATTLE_CINEMATIC';
    const now = Date.now();

    useFrame((_, delta) => {
        if (isBattle) {
            camera.position.lerp(new THREE.Vector3(0, 8, 12), delta * 0.5);
            camera.lookAt(0, 0, 0);
        }
    });

    return (
        <>
            <RealTimeLighting isRitual={isRitual} weather={state.weather || 'CLEAR'} structures={state.structures} />
            <WeatherSystem type={state.weather || 'CLEAR'} />
            <VegetationSystem />
            <StaticDecorations level={state.playerLevel} />
            {isHighQuality && <Stars radius={150} depth={50} count={1000} factor={4} saturation={0} fade speed={0.2} />}
            <VazarothTitan />

            {/* ENTITIES */}
            <EntityRenderer type={EntityType.BUILDING_BASE} variant={state.era} position={[0, 0, 0]} stats={{ hp: state.baseHp, maxHp: state.maxBaseHp }} structures={state.structures} />
            <EntityRenderer type={EntityType.HERO} variant={state.playerLevel as any} position={[4, 0, 4]} winStreak={state.winStreak} equipment={state.heroEquipment} />

            {(state.minions || []).map(m => <EntityRenderer key={m.id} type={EntityType.MINION} position={[m.position.x, m.position.y, m.position.z]} />)}

            {(state.enemies || []).map(enemy => {
                const task = (state.tasks || []).find(t => t.id === enemy.taskId);
                let startTime = task ? task.startTime : 0;
                if (enemy.subtaskId && task?.subtasks) { 
                    const sub = task.subtasks.find(s => s.id === enemy.subtaskId);
                    if (sub?.startTime) startTime = sub.startTime;
                }
                const isFuture = now < startTime;

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
                        archetype={enemy.race === 'HUMAN' ? 'KNIGHT' : 'MONSTER'}
                        race={enemy.race}
                        failed={task?.failed}
                        task={task} 
                        isFuture={isFuture}
                    />
                );
            })}
            
            <HierarchyLines enemies={state.enemies || []} tasks={state.tasks || []} />
            
            {(state.population || []).map((npc, i) => {
                const angle = (i * 137.5) * (Math.PI / 180);
                const r = 6 + (i % 5); 
                return <EntityRenderer key={npc.id} type={EntityType.VILLAGER} variant={npc.role} name={npc.name} position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]} onClick={() => interactWithNPC(npc.id)} />;
            })}

            <VisualEffectsRenderer />
            <VazarothEffects />
            <MapControls makeDefault maxPolarAngle={Math.PI / 2.2} enabled={!isBattle} />
            
            {isHighQuality && (
                <EffectComposer enableNormalPass={false}>
                    <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.5} radius={0.4} />
                    <Vignette eskil={false} offset={0.1} darkness={0.5} />
                    <Noise opacity={0.05} />
                </EffectComposer>
            )}
        </>
    )
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
