
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Html, Float, Sparkles, Trail, useTexture, Instance, Instances, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../../constants';
import { TaskPriority, Era, NPC, RaceType, HeroEquipment, Task } from '../../types';
import { Clock, AlertTriangle, Crown, Shield } from 'lucide-react';
import { useGame } from '../../context/GameContext';

// --- UTILITY COMPONENTS ---

export const InteractiveStructure = ({ name, position = [0,0,0], rotation = [0,0,0], scale = 1, heightOffset = 8, children }: any) => {
    const [hovered, setHover] = useState(false);
    return (
        <group 
            position={position} rotation={rotation} scale={[scale, scale, scale]}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
        >
            {children}
            {hovered && (
                <Html position={[0, heightOffset, 0]} center distanceFactor={40} zIndexRange={[100, 0]}>
                    <div className="bg-[#0c0a09]/95 border border-[#fbbf24] text-[#fbbf24] px-4 py-2 text-sm font-serif uppercase backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] tracking-widest whitespace-nowrap pointer-events-none">
                        {name}
                    </div>
                </Html>
            )}
        </group>
    )
};

const Fire = ({ position, scale = 1, color = "#ea580c" }: { position: [number, number, number], scale?: number, color?: string }) => (
    <group position={position} scale={[scale, scale, scale]}>
        <pointLight color={color} intensity={3} distance={8} decay={2} />
        <Sparkles count={15} scale={1.5} size={6} speed={0.4} opacity={0.8} color="#fbbf24" noise={0.2} />
        <mesh position={[0, 0.2, 0]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={0.8} />
        </mesh>
    </group>
);

const Smoke = ({ position, color = "#57534e", scale=1 }: { position: [number, number, number], color?: string, scale?: number }) => (
    <group position={position} scale={[scale, scale, scale]}>
        <Sparkles count={20} scale={[2, 6, 2]} size={15} speed={0.2} opacity={0.4} color={color} noise={1} />
    </group>
);

// --- NEW: CHRONOS PROJECTION (GIANT TIMER) ---
export const ChronosProjection = ({ isOpen, tasks }: { isOpen: boolean, tasks: Task[] }) => {
    const groupRef = useRef<THREE.Group>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);
    const [timeLeft, setTimeLeft] = useState("00:00:00");
    const [taskTitle, setTaskTitle] = useState("");

    // Find nearest deadline
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const todayStr = new Date().toDateString();
            
            // STRICT FILTER: Only tasks expiring TODAY
            const activeTasks = tasks.filter(t => 
                !t.completed && 
                !t.failed && 
                t.deadline > now && 
                new Date(t.deadline).toDateString() === todayStr
            );
            
            if (activeTasks.length === 0) {
                setTimeLeft("NO FATE TODAY");
                setTaskTitle("Rest, Exile");
                return;
            }

            const nearest = activeTasks.sort((a,b) => a.deadline - b.deadline)[0];
            const diff = nearest.deadline - now;
            
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            
            setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
            setTaskTitle(nearest.title);
        }, 1000);
        return () => clearInterval(interval);
    }, [tasks, isOpen]);

    useFrame((state, delta) => {
        if (!isOpen || !groupRef.current) return;
        
        // Spin Rings
        if (ring1Ref.current) {
            ring1Ref.current.rotation.z += delta * 0.2;
            ring1Ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.z -= delta * 0.15;
            ring2Ref.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
        }
        
        // Bobbing
        groupRef.current.position.y = 15 + Math.sin(state.clock.elapsedTime) * 0.5;
    });

    if (!isOpen) return null;

    return (
        <group ref={groupRef} position={[0, 15, 0]}>
            {/* Holographic Rings */}
            <mesh ref={ring1Ref} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[8, 0.1, 16, 64]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={ring2Ref} rotation={[Math.PI/2.2, 0, 0]}>
                <torusGeometry args={[6, 0.05, 16, 64]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>

            {/* Central Pillar of Light */}
            <mesh position={[0, -10, 0]}>
                <cylinderGeometry args={[0.5, 0, 20, 16, 1, true]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Particles */}
            <Sparkles count={50} scale={12} size={10} speed={0.4} opacity={0.5} color="#fbbf24" />

            {/* The Text Billboard */}
            <Billboard>
                <Html transform center position={[0, 0, 0]} scale={1}>
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-[80px] font-mono font-black text-[#fbbf24] tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] leading-none whitespace-nowrap">
                            {timeLeft}
                        </div>
                        <div className="text-xl font-serif text-white uppercase tracking-[0.5em] mt-2 bg-black/50 px-4 py-1 border-t border-b border-yellow-600/50 whitespace-nowrap">
                            {taskTitle}
                        </div>
                        <div className="text-xs text-yellow-600 mt-1 animate-pulse font-serif">CHRONOS PROTOCOL ACTIVE</div>
                    </div>
                </Html>
            </Billboard>
        </group>
    );
};

// --- HERO PROGRESSION VISUALS ---

const WeaponMesh = ({ name, tier }: { name: string, tier: number }) => {
    // Determine weapon type based on name
    const isGreatsword = name.toLowerCase().includes("great") || name.toLowerCase().includes("void");
    const isMagic = name.toLowerCase().includes("void") || name.toLowerCase().includes("eclipse");
    
    const bladeColor = isMagic ? "#a855f7" : "#cbd5e1";
    const emissive = isMagic ? "#a855f7" : "#000000";

    return (
        <group position={[0.55, 1.2, 0.4]} rotation={[0.2, 0, -0.2]}>
            {/* Hilt */}
            <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.4]} />
                <meshStandardMaterial color="#451a03" />
            </mesh>
            {/* Guard */}
            <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI/2]}>
                <boxGeometry args={[0.05, 0.4 + (tier * 0.05), 0.05]} />
                <meshStandardMaterial color={tier > 2 ? "#d4af37" : "#57534e"} metalness={1} roughness={0.3} />
            </mesh>
            {/* Blade */}
            <mesh position={[0, 0.5 + (isGreatsword ? 0.3 : 0), 0]}>
                <boxGeometry args={[isGreatsword ? 0.15 : 0.08, 1.5 + (tier * 0.2), 0.02]} />
                <meshStandardMaterial color={bladeColor} metalness={0.9} roughness={0.2} emissive={emissive} emissiveIntensity={isMagic ? 2 : 0} />
            </mesh>
            {isMagic && <Sparkles count={10} scale={1.5} size={2} color="#d8b4fe" speed={2} />}
        </group>
    );
};

export const HeroAvatar = ({ level, scale = 1, equipment }: { level: number, scale?: number, equipment?: HeroEquipment }) => {
    // Calculate visual tier (1 to 4)
    const tier = level < 10 ? 1 : level < 30 ? 2 : level < 60 ? 3 : 4;
    
    // Palette based on Tier
    const armorColor = tier === 1 ? "#78350f" : tier === 2 ? "#525252" : tier === 3 ? "#1e293b" : "#0f172a";
    const detailColor = tier === 1 ? "#57534e" : tier === 2 ? "#a3a3a3" : tier === 3 ? "#d4af37" : "#a855f7"; // Leather -> Iron -> Gold -> Void
    const capeColor = tier === 1 ? null : tier === 2 ? "#7f1d1d" : "#450a0a";

    return (
        <group scale={[scale, scale, scale]}>
            {/* --- BODY --- */}
            {/* Legs */}
            <mesh position={[-0.2, 0.4, 0]} castShadow>
                <boxGeometry args={[0.18, 0.8, 0.2]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
            <mesh position={[0.2, 0.4, 0]} castShadow>
                <boxGeometry args={[0.18, 0.8, 0.2]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>

            {/* Torso */}
            <mesh position={[0, 1.1, 0]} castShadow>
                <boxGeometry args={[0.5, 0.7, 0.35]} />
                <meshStandardMaterial color={armorColor} metalness={tier > 1 ? 0.6 : 0} roughness={0.7} />
            </mesh>

            {/* Armor Plates (Tier 2+) */}
            {tier >= 2 && (
                <mesh position={[0, 1.1, 0.18]} castShadow>
                    <boxGeometry args={[0.4, 0.5, 0.05]} />
                    <meshStandardMaterial color={detailColor} metalness={0.8} roughness={0.3} />
                </mesh>
            )}

            {/* Shoulders (Tier 2+) */}
            {tier >= 2 && (
                <>
                    <mesh position={[-0.35, 1.35, 0]} castShadow>
                        <boxGeometry args={[0.3, 0.3, 0.35]} />
                        <meshStandardMaterial color={detailColor} metalness={0.8} />
                    </mesh>
                    <mesh position={[0.35, 1.35, 0]} castShadow>
                        <boxGeometry args={[0.3, 0.3, 0.35]} />
                        <meshStandardMaterial color={detailColor} metalness={0.8} />
                    </mesh>
                </>
            )}

            {/* Head */}
            <group position={[0, 1.65, 0]}>
                {/* Base Head */}
                <mesh castShadow>
                    <boxGeometry args={[0.3, 0.35, 0.3]} />
                    <meshStandardMaterial color={tier === 1 ? PALETTE.SKIN : detailColor} metalness={tier > 1 ? 0.7 : 0} />
                </mesh>
                
                {/* Helmet Features (Tier 3+) */}
                {tier >= 3 && (
                    <mesh position={[0, 0.1, 0]}>
                        <boxGeometry args={[0.32, 0.1, 0.32]} />
                        <meshStandardMaterial color={tier === 4 ? "#a855f7" : "#d4af37"} emissive={tier === 4 ? "#a855f7" : "#000"} emissiveIntensity={2} />
                    </mesh>
                )}
                
                {/* Eyes/Visor */}
                <mesh position={[0, 0.05, 0.16]}>
                    <planeGeometry args={[0.2, 0.05]} />
                    <meshStandardMaterial color={tier >= 3 ? "#3b82f6" : "#000"} emissive={tier >= 3 ? "#3b82f6" : "#000"} emissiveIntensity={5} />
                </mesh>
            </group>

            {/* Crown (Tier 4) */}
            {tier === 4 && (
                <group position={[0, 1.9, 0]}>
                    <Float speed={4} rotationIntensity={0.5} floatIntensity={0.2}>
                        <mesh>
                            <torusGeometry args={[0.2, 0.02, 16, 32]} />
                            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
                        </mesh>
                    </Float>
                </group>
            )}

            {/* Cape */}
            {capeColor && (
                <group position={[0, 1.4, -0.2]}>
                    <mesh rotation={[0.1, 0, 0]}>
                        <boxGeometry args={[0.6, tier >= 3 ? 1.6 : 1.0, 0.05]} />
                        <meshStandardMaterial color={capeColor} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}

            {/* Weapon */}
            <WeaponMesh name={equipment?.weapon || "Sword"} tier={tier} />

        </group>
    );
};

// --- NPC & ENEMY VISUALS ---

export const VillagerAvatar = ({ role, name, status, onClick, currentAction }: any) => {
    // Different visuals based on Role
    let hatColor = "#57534e";
    let bodyColor = "#44403c";
    let tool = null;

    if (role === 'Guard') {
        hatColor = "#1e293b"; bodyColor = "#334155";
        tool = (
            <mesh position={[0.3, 0.6, 0.2]} rotation={[0,0,-0.2]}>
                <cylinderGeometry args={[0.02, 0.02, 1.5]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
        );
    } else if (role === 'Smith') {
        hatColor = "#451a03"; bodyColor = "#78350f";
        tool = (
            <group position={[0.3, 0.6, 0]}>
                <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.2, 0.1, 0.1]} /><meshStandardMaterial color="#525252" metalness={0.8} /></mesh>
                <mesh><cylinderGeometry args={[0.03, 0.03, 0.4]} /><meshStandardMaterial color="#451a03" /></mesh>
            </group>
        );
    } else if (role === 'Scholar') {
        hatColor = "#1e3a8a"; bodyColor = "#172554";
        tool = (
            <mesh position={[0.3, 0.6, 0.2]} rotation={[0.5, 0.5, 0]}>
                <boxGeometry args={[0.2, 0.25, 0.05]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
        );
    }

    return (
        <group onClick={onClick}>
            {/* Body */}
            <mesh position={[0, 0.6, 0]} castShadow>
                <boxGeometry args={[0.35, 0.7, 0.25]} />
                <meshStandardMaterial color={bodyColor} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.1, 0]} castShadow>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial color={PALETTE.SKIN} />
            </mesh>
            {/* Hat/Helm */}
            {role !== 'Peasant' && (
                <mesh position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.16, 0.18, 0.15]} />
                    <meshStandardMaterial color={hatColor} />
                </mesh>
            )}
            {/* Tool */}
            {tool}
            {/* Action Indicator */}
            {currentAction && currentAction !== 'IDLE' && (
                <Html position={[0, 1.8, 0]} center>
                    <div className="text-[8px] bg-black/50 text-white px-1 rounded">{currentAction}</div>
                </Html>
            )}
        </group>
    )
}

export const EnemyMesh = ({ priority, name, onClick, isSelected, scale = 1, archetype = 'MONSTER', subtaskCount = 0, race, failed, task, isFuture }: any) => {
    const finalScale = failed ? (scale * 1.3) : (scale || 1);
    
    // Color Logic
    let baseColor = priority === TaskPriority.HIGH ? PALETTE.BLOOD_BRIGHT : PALETTE.RUST;
    if (failed) baseColor = '#ff0000';
    if (race === 'ORC') baseColor = "#4d7c0f";
    if (race === 'ELF') baseColor = "#1e1b4b"; // Dark Indigo
    if (race === 'DEMON') baseColor = "#000000";
    if (race === 'CONSTRUCT') baseColor = "#475569";

    // Ghost Mode (Future)
    const matProps = isFuture ? { 
        transparent: true, 
        opacity: 0.4, 
        wireframe: true, 
        color: '#d8b4fe',
        emissive: '#a855f7',
        emissiveIntensity: 2
    } : { 
        color: baseColor,
        roughness: 0.7,
        metalness: race === 'CONSTRUCT' || race === 'HUMAN' ? 0.6 : 0.1
    };

    // --- PROCEDURAL SHAPE BASED ON RACE ---
    const RenderShape = () => {
        if (race === 'ORC') {
            return (
                <group scale={[1.2, 1, 1.2]}>
                    {/* Bulky Body */}
                    <mesh position={[0, 0.6, 0]} castShadow={!isFuture}><boxGeometry args={[0.6, 0.7, 0.4]} /><meshStandardMaterial {...matProps} /></mesh>
                    {/* Head */}
                    <mesh position={[0, 1.1, 0.1]} castShadow={!isFuture}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshStandardMaterial {...matProps} /></mesh>
                    {/* Pauldrons */}
                    <mesh position={[0.4, 1, 0]} rotation={[0,0,-0.2]}><boxGeometry args={[0.2, 0.2, 0.3]} /><meshStandardMaterial color="#1c1917" /></mesh>
                    <mesh position={[-0.4, 1, 0]} rotation={[0,0,0.2]}><boxGeometry args={[0.2, 0.2, 0.3]} /><meshStandardMaterial color="#1c1917" /></mesh>
                </group>
            )
        }
        if (race === 'ELF' || race === 'HUMAN') {
            return (
                <group scale={[0.8, 1.1, 0.8]}>
                    <mesh position={[0, 0.6, 0]} castShadow={!isFuture}><cylinderGeometry args={[0.2, 0.15, 0.8]} /><meshStandardMaterial {...matProps} /></mesh>
                    <mesh position={[0, 1.15, 0]} castShadow={!isFuture}><sphereGeometry args={[0.15]} /><meshStandardMaterial {...matProps} /></mesh>
                    {/* Weapon */}
                    <mesh position={[0.3, 0.6, 0.2]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.05, 1.2, 0.05]} /><meshStandardMaterial color="#94a3b8" emissive={failed ? "red" : "black"} /></mesh>
                </group>
            )
        }
        if (race === 'DEMON') {
            return (
                <group>
                    <mesh position={[0, 0.7, 0]} castShadow={!isFuture}><dodecahedronGeometry args={[0.4]} /><meshStandardMaterial {...matProps} /></mesh>
                    {/* Horns */}
                    <mesh position={[0.2, 1.1, 0]} rotation={[0,0,-0.5]}><coneGeometry args={[0.05, 0.3]} /><meshStandardMaterial color="white" /></mesh>
                    <mesh position={[-0.2, 1.1, 0]} rotation={[0,0,0.5]}><coneGeometry args={[0.05, 0.3]} /><meshStandardMaterial color="white" /></mesh>
                    {/* Glowing Eyes */}
                    <mesh position={[0.1, 0.8, 0.3]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="red" /></mesh>
                    <mesh position={[-0.1, 0.8, 0.3]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="red" /></mesh>
                </group>
            )
        }
        // Construct / Default (Prism-like but detailed)
        return (
            <group>
                <mesh position={[0, 0.6, 0]} castShadow={!isFuture}><octahedronGeometry args={[0.4]} /><meshStandardMaterial {...matProps} /></mesh>
                <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" /></mesh>
            </group>
        );
    };

    return (
        <group onClick={onClick}>
            {task && !task.completed && !task.failed && <EnemyTimer deadline={task.deadline} isFuture={isFuture} />}
            <group scale={[finalScale, finalScale, finalScale]}>
                <RenderShape />
            </group>
            
            {/* Future Beacon - KEEP THIS for visibility */}
            {isFuture && (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 10, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 20]} />
                        <meshBasicMaterial color="#a855f7" transparent opacity={0.2} />
                    </mesh>
                    <pointLight position={[0, 2, 0]} color="#a855f7" intensity={2} distance={10} />
                </group>
            )}
        </group>
    )
}

export const MinionMesh = () => (
    <group>
        <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.6]} />
            <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0.2, 0.4, 0.1]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.05, 0.6, 0.05]} />
            <meshStandardMaterial color="#cbd5e1" />
        </mesh>
    </group>
);

// --- STRUCTURES (Keep existing but ensure materials match) ---

const StructureForge = ({ level }: { level: number }) => {
    if (level === 0) return (
        <group position={[-15, 0, 0]}>
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#1c1917" roughness={1} />
            </mesh>
            <mesh position={[0, 1, 0]} castShadow>
                <boxGeometry args={[3, 2, 3]} />
                <meshStandardMaterial color="#292524" />
            </mesh>
        </group>
    ); 
    const scale = 1.5 + (level * 0.2); 
    const isTitan = level >= 2;
    const isStarCore = level >= 3;

    return (
        <InteractiveStructure name={isStarCore ? "Star Core Reactor" : isTitan ? "Titan Smelter" : "The Great Forge"} position={[-18, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            <mesh position={[0, 3, 0]} castShadow receiveShadow>
                <boxGeometry args={[8, 6, 6]} />
                <meshStandardMaterial color="#1c1917" roughness={0.7} metalness={0.5} />
            </mesh>
            <mesh position={[0, 4, 3.1]}>
                <boxGeometry args={[6, 2, 0.2]} />
                <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={2} />
            </mesh>
            <group position={[2, 6, 0]}>
                <mesh><cylinderGeometry args={[1, 1.5, 6]} /><meshStandardMaterial color="#0c0a09" /></mesh>
                <Smoke position={[0, 4, 0]} scale={2} />
            </group>
            <group position={[-2, 6, 0]}>
                <mesh><cylinderGeometry args={[1, 1.5, 6]} /><meshStandardMaterial color="#0c0a09" /></mesh>
                <Smoke position={[0, 4, 0]} scale={2} />
            </group>
            {isStarCore && (
                <group position={[0, 10, 0]}>
                    <Float speed={5} rotationIntensity={2} floatIntensity={1}>
                        <mesh><octahedronGeometry args={[2, 0]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={5} /></mesh>
                    </Float>
                    <pointLight color="#fbbf24" intensity={10} distance={50} decay={2} />
                </group>
            )}
            <pointLight position={[4, 1, 4]} color="#ea580c" intensity={5} distance={20} />
        </InteractiveStructure>
    );
}

const StructureLibrary = ({ level }: { level: number }) => {
    if (level === 0) return null;
    const isOracle = level >= 2;
    const isAkashic = level >= 3;

    return (
        <InteractiveStructure name={isAkashic ? "Akashic Record" : isOracle ? "Oracle Spire" : "Grand Library"} position={[18, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
            <mesh position={[0, 6, 0]} castShadow>
                <cylinderGeometry args={[3, 4, 12, 8]} />
                <meshStandardMaterial color="#e7e5e4" roughness={0.2} metalness={0.1} />
            </mesh>
            {isOracle && (
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh position={[0, 10, 0]} rotation={[Math.PI/4, 0, 0]}>
                        <torusGeometry args={[5, 0.2, 16, 32]} />
                        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={3} />
                    </mesh>
                </Float>
            )}
            <group position={[0, 14, 0]}>
                <mesh>
                    <coneGeometry args={[3, 6, 4]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={1} opacity={0.8} transparent />
                </mesh>
                <pointLight color="#3b82f6" distance={40} intensity={5} />
            </group>
        </InteractiveStructure>
    );
}

const StructureWalls = ({ level }: { level: number }) => {
    if (level === 0) return null;
    const radius = 25; 
    const height = 4 + (level * 2);
    const segmentCount = 16;

    return (
        <group>
            {Array.from({ length: segmentCount }).map((_, i) => {
                const angle = (i / segmentCount) * Math.PI * 2;
                if (i % (segmentCount/4) === 0) return null; 
                return (
                    <group key={i} position={[Math.cos(angle)*radius, height/2, Math.sin(angle)*radius]} rotation={[0, -angle, 0]}>
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[2, height, (radius * 6) / segmentCount]} />
                            <meshStandardMaterial color="#1c1917" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, height/2 + 0.5, 0]}>
                            <boxGeometry args={[2.2, 1, (radius * 6) / segmentCount]} />
                            <meshStandardMaterial color="#292524" />
                        </mesh>
                        {level >= 3 && (
                            <mesh position={[0, 0, 0]}>
                                <boxGeometry args={[2.5, height, (radius * 6) / segmentCount]} />
                                <meshStandardMaterial color="#3b82f6" transparent opacity={0.1} side={THREE.DoubleSide} />
                            </mesh>
                        )}
                    </group>
                )
            })}
            {[0, Math.PI/2, Math.PI, -Math.PI/2].map((angle, i) => (
                <group key={`gate-${i}`} position={[Math.cos(angle)*radius, 0, Math.sin(angle)*radius]} rotation={[0, -angle, 0]}>
                    <mesh position={[0, height/2, 6]}><boxGeometry args={[6, height+4, 6]} /><meshStandardMaterial color="#0c0a09" /></mesh>
                    <mesh position={[0, height/2, -6]}><boxGeometry args={[6, height+4, 6]} /><meshStandardMaterial color="#0c0a09" /></mesh>
                    <mesh position={[0, height, 0]}><boxGeometry args={[4, 4, 14]} /><meshStandardMaterial color="#1c1917" /></mesh>
                    {level >= 2 && <pointLight position={[0, height-2, 0]} color="#fbbf24" intensity={2} distance={10} />}
                </group>
            ))}
        </group>
    )
}

const CityLighting = ({ lightingLevel }: { lightingLevel: number }) => {
    if (lightingLevel <= 0) return null;

    const lights = useMemo(() => {
        const positions = [];
        const radius = 25; 
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            for (let d = 6; d < radius; d += 8) {
                positions.push({ x: Math.cos(angle) * d + 2, z: Math.sin(angle) * d + 2 });
                positions.push({ x: Math.cos(angle) * d - 2, z: Math.sin(angle) * d - 2 });
            }
        }
        return positions;
    }, []);

    const lightColor = lightingLevel < 3 ? "#fbbf24" : lightingLevel < 5 ? "#3b82f6" : "#a855f7"; 
    const intensity = 2.0 + (lightingLevel * 0.5);

    return (
        <group>
            {lights.map((pos, i) => (
                <group key={i} position={[pos.x, 0, pos.z]}>
                    <mesh position={[0, 2, 0]}>
                        <cylinderGeometry args={[0.1, 0.15, 4]} />
                        <meshStandardMaterial color="#1c1917" />
                    </mesh>
                    <mesh position={[0, 4, 0]}>
                        <octahedronGeometry args={[0.5]} />
                        <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={5} />
                    </mesh>
                    <pointLight position={[0, 4.5, 0]} color={lightColor} intensity={intensity} distance={15} decay={2} />
                </group>
            ))}
        </group>
    )
}

const BaseComplex = ({ era, currentHp, maxHp, structures }: any) => {
    const healthPercent = currentHp / maxHp;
    const isCritical = healthPercent < 0.2;
    const forgeLevel = structures?.forgeLevel || 0;
    const libraryLevel = structures?.libraryLevel || 0;
    const wallsLevel = structures?.wallsLevel || 0;
    const lightingLevel = structures?.lightingLevel || 0;

    let cityTier = 0;
    if (era === Era.CAPTAIN) cityTier = 1;
    if (era === Era.GENERAL) cityTier = 2;
    if (era === Era.KING) cityTier = 3;

    return (
        <group>
            <CityLighting lightingLevel={lightingLevel} />
            <InteractiveStructure name="The Keep">
                {cityTier === 0 ? (
                    <group>
                        <mesh position={[0, 2, 0]} castShadow>
                            <coneGeometry args={[4, 4, 4]} />
                            <meshStandardMaterial color="#451a03" />
                        </mesh>
                        <Fire position={[2, 0, 2]} />
                    </group>
                ) : (
                    <group>
                        <mesh position={[0, 8, 0]} castShadow receiveShadow>
                            <boxGeometry args={[10, 16, 10]} />
                            <meshStandardMaterial color="#0c0a09" roughness={0.6} />
                        </mesh>
                        <mesh position={[0, 12, 5.1]}><planeGeometry args={[2, 4]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} /></mesh>
                        <pointLight position={[0, 12, 6]} color="#fbbf24" intensity={5} distance={20} />
                    </group>
                )}
            </InteractiveStructure>
            <StructureForge level={forgeLevel} />
            <StructureLibrary level={libraryLevel} />
            <StructureWalls level={wallsLevel} />
            {isCritical && <Fire position={[0, 5, 5]} scale={3} />}
        </group>
    );
};

export const EnemyTimer = ({ deadline, isFuture }: { deadline: number, isFuture?: boolean }) => {
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = deadline - now;
            if (diff <= 0) { setTimeLeft("00:00:00"); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    if (isFuture) {
        return (
            <Html position={[0, 4.5, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
                <div className="bg-purple-950/80 border border-purple-500 text-purple-200 px-3 py-1 rounded-full font-mono text-[10px] tracking-widest animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    MANIFESTING...
                </div>
            </Html>
        )
    }
    return (
        <Html position={[0, 3.5, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
            <div className="bg-black/80 border border-stone-600 text-stone-200 flex items-center gap-1 px-3 py-1 rounded-full font-mono text-sm font-black tracking-widest backdrop-blur-md">
                <Clock size={12} /> {timeLeft}
            </div>
        </Html>
    );
}

// Re-exports
export const Torch = ({ position }: any) => <group position={position}><mesh position={[0,1,0]}><cylinderGeometry args={[0.05,0.08,2]}/><meshStandardMaterial color="#222"/></mesh><Fire position={[0,2.2,0]} scale={0.6}/></group>;
export const GlowingMushroom = ({position}: any) => <group position={position}><mesh><sphereGeometry args={[0.2]}/><meshStandardMaterial color="#3b82f6" emissive="blue" emissiveIntensity={2}/></mesh></group>;
export const TwistedTree = ({position, scale}: any) => <group position={position} scale={[scale,scale,scale]}><mesh position={[0,1.5,0]}><cylinderGeometry args={[0.3,0.5,3]}/><meshStandardMaterial color="#1a120b"/></mesh></group>;
export const GhostWisp = ({position}: any) => <group position={position}><pointLight color="#a855f7" intensity={1}/><Sparkles color="#d8b4fe" count={5}/></group>;
export const VazarothTitan = () => <group position={[0,20,-100]}><mesh><sphereGeometry args={[5]}/><meshBasicMaterial color="black"/></mesh></group>;
export const ForestStag = () => <group><mesh><boxGeometry/></mesh></group>;
export const WolfConstruct = () => <group><mesh><boxGeometry/></mesh></group>;
export const Crow = () => <group><mesh><boxGeometry/></mesh></group>;
export const BonePile = ({position}:any) => <group position={position}><mesh><sphereGeometry args={[0.2]}/></mesh></group>;
export const VoidCrystal = ({position}:any) => <group position={position}><mesh><octahedronGeometry/></mesh></group>;
export const RuinedColumn = ({position}:any) => <group position={position}><mesh><cylinderGeometry args={[0.4,0.4,2]}/></mesh></group>;
export { BaseComplex };
