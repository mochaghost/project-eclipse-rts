
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Html, Float, Sparkles, Trail, useTexture, Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../../constants';
import { TaskPriority, Era, NPC, RaceType, HeroEquipment, Task } from '../../types';
import { Clock, AlertTriangle } from 'lucide-react';

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
                    <div className="bg-[#0c0a09]/95 border border-[#fbbf24] text-[#fbbf24] px-4 py-2 text-sm font-serif uppercase backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] tracking-widest whitespace-nowrap">
                        {name}
                    </div>
                </Html>
            )}
        </group>
    )
};

const Fire = ({ position, scale = 1, color = "#ea580c" }: { position: [number, number, number], scale?: number, color?: string }) => (
    <group position={position} scale={[scale, scale, scale]}>
        <pointLight color={color} intensity={3} distance={10} decay={2} />
        <Sparkles count={20} scale={2} size={8} speed={0.4} opacity={0.8} color="#fbbf24" />
        <mesh position={[0, 0.2, 0]}>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={0.8} />
        </mesh>
    </group>
);

const Smoke = ({ position, color = "#57534e", scale=1 }: { position: [number, number, number], color?: string, scale?: number }) => (
    <group position={position} scale={[scale, scale, scale]}>
        <Sparkles count={30} scale={[3, 8, 3]} size={20} speed={0.2} opacity={0.3} color={color} noise={1} />
    </group>
);

// --- MODULAR STRUCTURES (VISUALLY OVERHAULED) ---

const StructureForge = ({ level }: { level: number }) => {
    // Positioned WEST (-X)
    if (level === 0) return (
        <group position={[-15, 0, 0]}>
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#1c1917" roughness={1} />
            </mesh>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color="#292524" wireframe />
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
    // Positioned EAST (+X)
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
        // Generate positions along main roads
        const positions = [];
        const radius = 25; // Match wall radius roughly
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
                    {/* VISIBLE LANTERN MESH */}
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

// --- MAIN BASE COMPLEX ---

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

// ... existing smaller assets ...
export const GrassTuft: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position} rotation={[0, Math.random() * Math.PI, 0]}>
        {Array.from({length: 3}).map((_, i) => (
            <mesh key={i} position={[(Math.random()-0.5)*0.2, 0.1, (Math.random()-0.5)*0.2]} rotation={[Math.random()*0.5, Math.random()*Math.PI, 0]}>
                <coneGeometry args={[0.02, 0.4, 3]} />
                <meshStandardMaterial color={PALETTE.GRASS_DARK} />
            </mesh>
        ))}
    </group>
);

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

export const EnemyMesh = ({ priority, name, onClick, isSelected, scale = 1, archetype = 'MONSTER', subtaskCount = 0, race, failed, task, isFuture }: any) => {
    const finalScale = failed ? (scale * 1.3) : (scale || (0.5 + (priority * 0.3)));
    let color = priority === TaskPriority.HIGH ? PALETTE.BLOOD_BRIGHT : PALETTE.RUST;
    if (failed) color = '#ff0000';
    
    // VISIBLE GHOST MODE
    const matProps = isFuture ? { 
        transparent: true, 
        opacity: 0.6, // Increased from 0.3
        wireframe: true, 
        color: '#d8b4fe', 
        emissive: '#a855f7',
        emissiveIntensity: 3 
    } : { 
        color: color 
    };

    return (
        <group onClick={onClick}>
            {task && !task.completed && !task.failed && <EnemyTimer deadline={task.deadline} isFuture={isFuture} />}
            <mesh position={[0, finalScale, 0]} scale={[finalScale, finalScale, finalScale]} castShadow={!isFuture}>
                <dodecahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial {...matProps} />
            </mesh>
            {isFuture && <pointLight position={[0, finalScale, 0]} color="#a855f7" intensity={2} distance={5} />}
        </group>
    )
}

// Re-exports
export const Torch = ({ position }: any) => <group position={position}><mesh position={[0,1,0]}><cylinderGeometry args={[0.05,0.08,2]}/><meshStandardMaterial color="#222"/></mesh><Fire position={[0,2.2,0]} scale={0.6}/></group>;
export const GlowingMushroom = ({position}: any) => <group position={position}><mesh><sphereGeometry args={[0.2]}/><meshStandardMaterial color="#3b82f6" emissive="blue" emissiveIntensity={2}/></mesh></group>;
export const TwistedTree = ({position, scale}: any) => <group position={position} scale={[scale,scale,scale]}><mesh position={[0,1.5,0]}><cylinderGeometry args={[0.3,0.5,3]}/><meshStandardMaterial color="#1a120b"/></mesh></group>;
export const GhostWisp = ({position}: any) => <group position={position}><pointLight color="#a855f7" intensity={1}/><Sparkles color="#d8b4fe" count={5}/></group>;
export const HeroAvatar = ({level}: any) => <group><mesh position={[0,1,0]}><capsuleGeometry args={[0.3,1]}/><meshStandardMaterial color="gold"/></mesh></group>;
export const VazarothTitan = () => <group position={[0,20,-100]}><mesh><sphereGeometry args={[5]}/><meshBasicMaterial color="black"/></mesh></group>;
export const VillagerAvatar = ({onClick}:any) => <group onClick={onClick}><mesh position={[0,0.5,0]}><boxGeometry args={[0.3,1,0.3]}/><meshStandardMaterial color="gray"/></mesh></group>;
export const MinionMesh = () => <mesh><boxGeometry args={[0.5,0.5,0.5]}/></mesh>;
export const ForestStag = () => <group><mesh><boxGeometry/></mesh></group>;
export const WolfConstruct = () => <group><mesh><boxGeometry/></mesh></group>;
export const Crow = () => <group><mesh><boxGeometry/></mesh></group>;
export const BonePile = ({position}:any) => <group position={position}><mesh><sphereGeometry args={[0.2]}/></mesh></group>;
export const VoidCrystal = ({position}:any) => <group position={position}><mesh><octahedronGeometry/></mesh></group>;
export const RuinedColumn = ({position}:any) => <group position={position}><mesh><cylinderGeometry args={[0.4,0.4,2]}/></mesh></group>;
export { BaseComplex };
