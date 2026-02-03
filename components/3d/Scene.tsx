
import React, { useMemo, Suspense, useRef, useLayoutEffect, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Stars, Ring, Sparkles, Html, Float, Line } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
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
    
    // REDUCED COUNT FOR STABILITY
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
        // REDUCED DECORATION COUNT
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
    if (type === 'CLEAR') return <Sparkles count={50} scale={60} size={2} opacity={0.3} color="#fff" />;
    if (type === 'RAIN') return (
        <group position={[0, 10, 0]}>
            <Sparkles count={200} scale={[50, 20, 50]} size={2} speed={5} opacity={0.4} color="#60a5fa" noise={0} />
            <directionalLight position={[10, 10, 5]} intensity={0.2} color="#60a5fa" />
        </group>
    );
    if (type === 'ASH_STORM') return (
        <group position={[0, 10, 0]}>
            <Sparkles count={150} scale={60} size={6} speed={0.5} opacity={0.6} color="#450a0a" noise={1} />
            <ambientLight intensity={0.5} color="#7f1d1d" />
        </group>
    );
    if (type === 'VOID_MIST') return <Sparkles count={100} scale={40} size={10} speed={0.1} opacity={0.2} color="#a855f7" />;
    return null;
});

const GlobalLighting = React.memo(({ isRitual, weather }: { isRitual: boolean, weather: WeatherType }) => {
    // Memoized to prevent rapid light updates
    return (
        <>
            <color attach="background" args={isRitual ? ['#2e1065'] : ['#0f172a']} />
            <fogExp2 attach="fog" args={[isRitual ? '#2e1065' : '#0f172a', weather === 'VOID_MIST' ? 0.05 : 0.015]} />
            <directionalLight 
                position={[50, 50, 20]} 
                intensity={isRitual ? 0.5 : 1.2} 
                castShadow 
                shadow-mapSize={[1024, 1024]} 
                color={isRitual ? '#a855f7' : '#fbbf24'} 
                shadow-bias={-0.0005} 
            />
            <ambientLight intensity={0.4} color={isRitual ? '#a855f7' : '#93c5fd'} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#1c1917" roughness={1} metalness={0} />
            </mesh>
        </>
    );
});

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

const HierarchyLines = React.memo(({ enemies }: { enemies: EnemyEntity[] }) => {
    const links = useMemo(() => {
        const lines: any[] = [];
        const children = enemies.filter(e => e.subtaskId);
        
        children.forEach(child => {
            const parent = enemies.find(e => e.taskId === child.taskId && !e.subtaskId);
            if (parent) {
                const start = new THREE.Vector3(parent.position.x, 2, parent.position.z);
                const end = new THREE.Vector3(child.position.x, 1, child.position.z);
                lines.push({ start, end, key: child.id });
            }
        });
        return lines;
    }, [enemies]);

    return (
        <group>
            {links.map(l => (
                <Line 
                    key={l.key} 
                    points={[l.start, l.end]} 
                    color="#4c1d95" 
                    lineWidth={1} 
                    dashed 
                    dashScale={2} 
                    opacity={0.3} 
                    transparent 
                />
            ))}
        </group>
    )
});

const LoaderFallback = () => <Html center><div className="text-yellow-600 font-serif text-sm animate-pulse">LOADING WORLD...</div></Html>;

// --- ISOLATED GAME WORLD COMPONENT ---
// This component only re-renders when GAMEPLAY data changes, not UI state.
const GameWorld = React.memo(({ 
    state, 
    selectEnemy, 
    interactWithNPC 
}: { 
    state: GameState, 
    selectEnemy: any, 
    interactWithNPC: any 
}) => {
    
    const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;
    const isHighQuality = (state.settings?.graphicsQuality || 'HIGH') === 'HIGH';
    const now = Date.now();

    return (
        <>
            <GlobalLighting isRitual={isRitual} weather={state.weather || 'CLEAR'} />
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
            />

            <EntityRenderer 
                type={EntityType.HERO} 
                variant={state.playerLevel as any} 
                position={[4, 0, 4]} 
                winStreak={state.winStreak}
            />

            {state.minions?.map(minion => (
                <EntityRenderer key={minion.id} type={EntityType.MINION} position={[minion.position.x, minion.position.y, minion.position.z]} />
            ))}

            {state.enemies?.map(enemy => {
                const task = state.tasks.find(t => t.id === enemy.taskId);
                let startTime = task ? task.startTime : 0;
                if (enemy.subtaskId && task) {
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
                    />
                );
            })}
            
            <HierarchyLines enemies={state.enemies} />

            {state.population?.map((npc, i) => {
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
            
            <MapControls makeDefault maxPolarAngle={Math.PI / 2.2} />

            {isHighQuality && (
                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.8} radius={0.4} />
                    <Vignette eskil={false} offset={0.1} darkness={0.5} />
                </EffectComposer>
            )}
        </>
    )
}, (prev, next) => {
    // CUSTOM COMPARISON FUNCTION TO PREVENT RE-RENDERS ON UI CHANGES
    // Only re-render if gameplay-affecting state changes
    return (
        prev.state.enemies === next.state.enemies &&
        prev.state.population === next.state.population &&
        prev.state.baseHp === next.state.baseHp &&
        prev.state.weather === next.state.weather &&
        prev.state.effects === next.state.effects &&
        prev.state.activeMapEvent === next.state.activeMapEvent &&
        prev.state.selectedEnemyId === next.state.selectedEnemyId
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
