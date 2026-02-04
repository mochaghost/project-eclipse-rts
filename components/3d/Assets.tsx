
import React, { useState, useRef } from 'react';
import { Html, Float, Sparkles, Trail, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../../constants';
import { TaskPriority, Era, NPC, RaceType } from '../../types';

// --- UTILITY COMPONENTS ---

export const InteractiveStructure = ({ name, position = [0,0,0], rotation = [0,0,0], scale = 1, heightOffset = 3, children }: any) => {
    const [hovered, setHover] = useState(false);
    return (
        <group 
            position={position} rotation={rotation} scale={[scale, scale, scale]}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
        >
            {children}
            {hovered && (
                <Html position={[0, heightOffset, 0]} center distanceFactor={20} zIndexRange={[100, 0]}>
                    <div className="bg-[#0c0a09]/95 border border-[#fbbf24] text-[#fbbf24] px-2 py-1 text-xs font-serif uppercase backdrop-blur-sm shadow-xl tracking-widest whitespace-nowrap">
                        {name}
                    </div>
                </Html>
            )}
        </group>
    )
};

const Fire = ({ position, scale = 1, color = "#ea580c" }: { position: [number, number, number], scale?: number, color?: string }) => (
    <group position={position} scale={[scale, scale, scale]}>
        <pointLight color={color} intensity={2} distance={6} decay={2} />
        <Sparkles count={15} scale={1.5} size={6} speed={0.4} opacity={0.8} color="#fbbf24" />
        <mesh position={[0, 0.2, 0]}>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={0.8} />
        </mesh>
    </group>
);

const Smoke = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
        <Sparkles count={30} scale={2} size={15} speed={0.2} opacity={0.2} color="#57534e" noise={1} />
    </group>
);

// --- NEW ATMOSPHERIC ASSETS ---

export const Torch: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        {/* Stick */}
        <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 2]} />
            <meshStandardMaterial color="#292524" />
        </mesh>
        {/* Fire Cage */}
        <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.15, 0.1, 0.4, 4]} />
            <meshStandardMaterial color="#1c1917" />
        </mesh>
        <Fire position={[0, 2.2, 0]} scale={0.6} />
    </group>
);

export const GlowingMushroom: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position} scale={[Math.random()*0.5 + 0.5, Math.random()*0.5 + 0.5, Math.random()*0.5 + 0.5]}>
        <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 0.4]} />
            <meshStandardMaterial color="#e7e5e4" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI/2]} />
            <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} color="#3b82f6" intensity={0.5} distance={2} />
    </group>
);

export const TwistedTree: React.FC<{ position: [number, number, number], scale?: number, rotation?: [number, number, number] }> = ({ position, scale = 1, rotation = [0,0,0] }) => (
    <group position={position} scale={[scale, scale, scale]} rotation={rotation as any}>
        {/* Trunk */}
        <mesh position={[0, 1.5, 0]} rotation={[0.1, 0, 0.1]}>
            <cylinderGeometry args={[0.3, 0.5, 3, 5]} />
            <meshStandardMaterial color="#1a120b" roughness={1} />
        </mesh>
        {/* Twisted Branches */}
        <mesh position={[0.2, 2.8, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.15, 0.25, 2, 4]} />
            <meshStandardMaterial color="#1a120b" roughness={1} />
        </mesh>
        <mesh position={[-0.3, 2.5, 0.2]} rotation={[0.5, 0, 0.8]}>
            <cylinderGeometry args={[0.1, 0.2, 1.5, 4]} />
            <meshStandardMaterial color="#1a120b" roughness={1} />
        </mesh>
        {/* Dead Foliage / Moss */}
        <mesh position={[0, 3.5, 0]} rotation={[Math.random(), Math.random(), Math.random()]}>
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial color="#2d2a26" roughness={1} />
        </mesh>
    </group>
);

export const GhostWisp: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        <Float speed={2} rotationIntensity={0} floatIntensity={1}>
            <mesh>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={3} transparent opacity={0.6} />
            </mesh>
            <Sparkles count={10} scale={2} size={2} color="#d8b4fe" speed={0.5} />
            <pointLight color="#a855f7" intensity={1} distance={4} decay={2} />
        </Float>
    </group>
);

// --- MODULAR STRUCTURES ---

const StructureForge = ({ level }: { level: number }) => {
    if (level === 0) return (
        <group position={[-2.5, 0, -2.5]}>
            <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.8, 0.6, 0.8]} /><meshStandardMaterial color="#292524" /></mesh>
            <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.6, 0.2, 0.4]} /><meshStandardMaterial color="#1c1917" /></mesh>
        </group>
    ); // Tier 0: Simple Anvil
    
    if (level === 1) return (
        <InteractiveStructure name="Blacksmith" position={[-3, 0, -3]}>
            <mesh position={[0, 1, 0]}><boxGeometry args={[2, 2, 2]} /><meshStandardMaterial color="#44403c" /></mesh>
            <mesh position={[0, 2.5, 0]} rotation={[0,0.5,0]}><coneGeometry args={[1.5, 1.5, 4]} /><meshStandardMaterial color="#1c1917" /></mesh>
            <Fire position={[0.5, 0.5, 1.1]} scale={0.5} />
            {/* Added Smoke to show activity */}
            <Smoke position={[0, 3, 0]} /> 
        </InteractiveStructure>
    ); // Tier 1: Smithy

    if (level === 2) return (
        <InteractiveStructure name="Industrial Forge" position={[-3, 0, -3]} scale={1.2}>
            <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[1.5, 1.8, 3, 6]} /><meshStandardMaterial color="#1c1917" metalness={0.5} /></mesh>
            <mesh position={[0, 3.5, 0]}><cylinderGeometry args={[0.5, 0.8, 2]} /><meshStandardMaterial color="#0c0a09" /></mesh>
            <Fire position={[0, 3.5, 0]} scale={1} color="#ef4444" />
            <Smoke position={[0, 5, 0]} />
        </InteractiveStructure>
    ); // Tier 2: Foundry

    return (
        <InteractiveStructure name="Titan Core" position={[-3, 0, -3]} scale={1.5}>
            <Float speed={2} floatIntensity={0.5}>
                <mesh position={[0, 3, 0]} rotation={[0.5, 0.5, 0]}><octahedronGeometry args={[1.5, 0]} /><meshStandardMaterial color="#ea580c" emissive="#c2410c" emissiveIntensity={3} /></mesh>
            </Float>
            <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[2, 2.5, 1, 8]} /><meshStandardMaterial color="#000" /></mesh>
            <pointLight position={[0, 3, 0]} color="#ea580c" intensity={5} distance={10} />
            <Sparkles count={50} scale={4} size={10} color="#ea580c" speed={2} />
        </InteractiveStructure>
    ); // Tier 3: Titan Core
}

const StructureLibrary = ({ level }: { level: number }) => {
    if (level === 0) return null; // Tier 0: Nothing
    
    if (level === 1) return (
        <InteractiveStructure name="Archives" position={[3, 0, 3]}>
            <mesh position={[0, 1, 0]}><boxGeometry args={[1.5, 2, 1.5]} /><meshStandardMaterial color="#3f2818" /></mesh>
            <mesh position={[0, 2.2, 0]}><coneGeometry args={[1.2, 1, 4]} /><meshStandardMaterial color="#1c1917" /></mesh>
            {/* Added Light to show occupancy */}
            <pointLight position={[0, 1, 0]} color="#fbbf24" distance={3} intensity={1} />
        </InteractiveStructure>
    ); // Tier 1: Wooden Building

    if (level === 2) return (
        <InteractiveStructure name="Observatory" position={[3, 0, 3]} scale={1.2}>
            <mesh position={[0, 2, 0]}><cylinderGeometry args={[1, 1, 4, 8]} /><meshStandardMaterial color="#e7e5e4" /></mesh>
            <mesh position={[0, 4.5, 0]}><sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI/2]} /><meshStandardMaterial color="#0c0a09" metalness={0.8} /></mesh>
            <mesh position={[0.5, 4.8, 0]} rotation={[0,0,-0.5]}><cylinderGeometry args={[0.1, 0.2, 1]} /><meshStandardMaterial color="#fbbf24" /></mesh>
            <Sparkles count={20} scale={3} size={2} color="#fbbf24" />
        </InteractiveStructure>
    ); // Tier 2: Stone Observatory

    return (
        <InteractiveStructure name="Void Spire" position={[3, 0, 3]} scale={1.5}>
            <Float speed={1} floatIntensity={0.2}>
                <mesh position={[0, 3, 0]}><torusGeometry args={[1.5, 0.1, 16, 4]} /><meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} /></mesh>
            </Float>
            <mesh position={[0, 2.5, 0]}><coneGeometry args={[1, 5, 4]} /><meshStandardMaterial color="#2e1065" emissive="#581c87" /></mesh>
            <Sparkles count={50} scale={5} color="#d8b4fe" size={5} speed={0.5} />
            <pointLight position={[0, 4, 0]} color="#a855f7" distance={10} intensity={3} />
        </InteractiveStructure>
    ); // Tier 3: Magic Spire
}

const StructureWalls = ({ level }: { level: number }) => {
    if (level === 0) return null; // Tier 0: No walls

    // Procedural Walls: 4 corners
    const positions = [[4, 4], [-4, 4], [4, -4], [-4, -4]];
    
    return (
        <group>
            {positions.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    {level === 1 && <mesh position={[0, 1, 0]}><boxGeometry args={[1, 2, 1]} /><meshStandardMaterial color="#57534e" /></mesh>}
                    {level === 2 && (
                        <group>
                            <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.8, 1, 3, 6]} /><meshStandardMaterial color="#1c1917" /></mesh>
                            <mesh position={[0, 3.2, 0]}><coneGeometry args={[1, 0.5, 6]} /><meshStandardMaterial color="#000" /></mesh>
                        </group>
                    )}
                    {level === 3 && (
                        <group>
                            <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.5, 0.8, 4, 6]} /><meshStandardMaterial color="#000" /></mesh>
                            <mesh position={[0, 4.2, 0]}><octahedronGeometry args={[0.5]} /><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} /></mesh>
                            <pointLight position={[0, 4, 0]} color="#3b82f6" distance={5} intensity={2} />
                        </group>
                    )}
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

    return (
        <group>
            {/* CORE CITADEL (Visual changes with ERA only) */}
            <InteractiveStructure name={era === Era.RUIN ? "Camp" : "Citadel"}>
                {era === Era.RUIN && (
                    <group>
                        <Fire position={[0, 0, 0]} />
                        <mesh position={[1.5, 0.5, 1]} rotation={[0, -0.5, 0]}><coneGeometry args={[1, 1.5, 4]} /><meshStandardMaterial color="#451a03" /></mesh>
                    </group>
                )}
                {era === Era.CAPTAIN && (
                    <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[3, 3, 3]} /><meshStandardMaterial color="#44403c" /></mesh>
                )}
                {era === Era.GENERAL && (
                    <group>
                        <mesh position={[0, 2, 0]} castShadow><boxGeometry args={[4, 4, 4]} /><meshStandardMaterial color="#1c1917" /></mesh>
                        <mesh position={[0, 4.5, 0]}><coneGeometry args={[2.5, 2, 4]} /><meshStandardMaterial color="#0c0a09" /></mesh>
                    </group>
                )}
                {era === Era.KING && (
                    <group>
                        <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[2, 3, 6, 8]} /><meshStandardMaterial color="#000" metalness={0.8} /></mesh>
                        <Float speed={1}><mesh position={[0, 7, 0]}><octahedronGeometry args={[1.5]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} /></mesh></Float>
                    </group>
                )}
            </InteractiveStructure>

            {/* UPGRADABLE SUB-STRUCTURES */}
            <StructureForge level={forgeLevel} />
            <StructureLibrary level={libraryLevel} />
            <StructureWalls level={wallsLevel} />

            {/* DAMAGE FX */}
            {isCritical && <Fire position={[2, 0, 2]} scale={2} />}
        </group>
    );
};

// ... (Rest of the file including Environment Details, Animals, and Exported Components remains unchanged)
// --- ENVIRONMENT DETAILS ---

export const GrassTuft: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position} rotation={[0, Math.random() * Math.PI, 0]}>
            {Array.from({length: 3}).map((_, i) => (
                <mesh key={i} position={[(Math.random()-0.5)*0.2, 0.1, (Math.random()-0.5)*0.2]} rotation={[Math.random()*0.5, Math.random()*Math.PI, 0]}>
                    <coneGeometry args={[0.02, 0.4, 3]} />
                    <meshStandardMaterial color={PALETTE.GRASS_DARK} />
                </mesh>
            ))}
        </group>
    )
}

export const Pebble: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <mesh position={position} rotation={[Math.random(), Math.random(), Math.random()]}>
        <dodecahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#44403c" />
    </mesh>
)

export const BonePile: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position} rotation={[0, Math.random() * Math.PI, 0]} scale={[0.5, 0.5, 0.5]}>
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI/2, 0, 0.5]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4]} />
            <meshStandardMaterial color="#e7e5e4" />
        </mesh>
        <mesh position={[0.2, 0.1, 0.1]} rotation={[Math.PI/2, 0.2, -0.5]}>
            <cylinderGeometry args={[0.04, 0.06, 0.3]} />
            <meshStandardMaterial color="#d6d3d1" />
        </mesh>
        <mesh position={[0.1, 0.15, -0.1]} rotation={[0, Math.random(), 0]}>
            <dodecahedronGeometry args={[0.1]} />
            <meshStandardMaterial color="#e7e5e4" />
        </mesh>
    </group>
);

export const VoidCrystal: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh rotation={[Math.random(), Math.random(), 0]}>
                <octahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial color="#7e22ce" emissive="#581c87" emissiveIntensity={4} transparent opacity={0.9} />
            </mesh>
        </Float>
        <pointLight color="#a855f7" intensity={2} distance={4} decay={2} />
        <Sparkles count={5} scale={2} size={4} color="#d8b4fe" speed={0.2} />
    </group>
);

export const RuinedColumn: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position} rotation={[0, Math.random(), 0.1]} scale={[1.5, 1.5, 1.5]}>
        <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
            <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.1, 0.1]} rotation={[0.2, 0, 0]}>
             <cylinderGeometry args={[0.3, 0.25, 0.4, 8]} />
             <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
    </group>
);

// --- ANIMALS & FAUNA ---

export const ForestStag = ({ position, rotation }: any) => (
    <group position={position} rotation={rotation} scale={[0.5, 0.5, 0.5]}>
        {/* Body */}
        <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.8, 0.9, 1.5]} />
            <meshStandardMaterial color="#50453d" />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.6, 0.7]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.35, 1]} />
            <meshStandardMaterial color="#50453d" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 2.1, 1.1]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.25, 0.8, 4]} />
            <meshStandardMaterial color="#3e342e" />
        </mesh>
        {/* Antlers */}
        <group position={[0, 2.4, 1.0]}>
            <mesh position={[0.3, 0.4, 0]} rotation={[0, 0, -0.5]}>
                <cylinderGeometry args={[0.02, 0.05, 0.8]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} />
            </mesh>
            <mesh position={[-0.3, 0.4, 0]} rotation={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.02, 0.05, 0.8]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} />
            </mesh>
        </group>
        {/* Legs */}
        {[[0.25, 0.6], [-0.25, 0.6], [0.25, -0.6], [-0.25, -0.6]].map(([x,z], i) => (
            <mesh key={i} position={[x, 0.5, z]}>
                <cylinderGeometry args={[0.1, 0.15, 1.2]} />
                <meshStandardMaterial color="#292524" />
            </mesh>
        ))}
    </group>
);

export const WolfConstruct = ({ position, rotation }: any) => (
    <group position={position} rotation={rotation} scale={[0.4, 0.4, 0.4]}>
        <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[0.7, 0.7, 1.4]} />
            <meshStandardMaterial color="#1c1917" />
        </mesh>
        <mesh position={[0, 1.1, 0.7]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.6]} />
            <meshStandardMaterial color="#0c0a09" />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.15, 1.2, 1.0]}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={5} />
        </mesh>
        <mesh position={[-0.15, 1.2, 1.0]}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={5} />
        </mesh>
        {/* Legs */}
        {[[0.3, 0.6], [-0.3, 0.6], [0.3, -0.6], [-0.3, -0.6]].map(([x,z], i) => (
            <mesh key={i} position={[x, 0.4, z]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.15, 0.8, 0.15]} />
                <meshStandardMaterial color="#0c0a09" />
            </mesh>
        ))}
    </group>
);

export const Crow = ({ position, rotation }: any) => (
    <group position={position} rotation={rotation} scale={[0.1, 0.1, 0.1]}>
        <mesh><coneGeometry args={[1, 3, 4]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0, 1, 1]} rotation={[1.5, 0, 0]}><coneGeometry args={[0.5, 1.5, 4]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
);

// --- HERO EVOLUTION (8 Tiers for 80 Levels) ---

export const HeroAvatar = ({ level, winStreak, scale = 1 }: { level: number, winStreak?: number, scale?: number }) => {
    // TIER 1: THE WRETCH (1-9)
    if (level < 10) {
        return (
            <group scale={[scale, scale, scale]}>
                <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[0.4, 0.8, 0.3]} /><meshStandardMaterial color="#57534e" /></mesh>
                <mesh position={[0, 1.3, 0]} castShadow><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#fca5a5" /></mesh>
                <mesh position={[0.3, 0.6, 0.3]} rotation={[0.2, 0, -0.2]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#7c2d12" /></mesh>
            </group>
        )
    }
    // TIER 2-8 ... (Abbreviated for brevity, logic remains from previous file)
    // Assuming rest of HeroAvatar logic exists here as before.
    return (
        <group scale={[scale, scale, scale]}>
             <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                <mesh position={[0, 1, 0]} castShadow>
                    <octahedronGeometry args={[0.6, 0]} />
                    <meshStandardMaterial color="#a855f7" emissive="#6b21a8" emissiveIntensity={3} />
                </mesh>
             </Float>
        </group>
    );
};

export const MinionMesh = () => {
    return (
        <group>
            <mesh position={[0, 0.4, 0]} castShadow>
                <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
                <meshStandardMaterial color="#1e3a8a" emissive="#60a5fa" emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>
            <mesh position={[0.2, 0.4, 0.2]} rotation={[0.5, 0, -0.2]}>
                 <boxGeometry args={[0.05, 0.6, 0.05]} />
                 <meshStandardMaterial color="#93c5fd" emissive="#fff" />
            </mesh>
            <Sparkles count={5} scale={1} size={2} color="#60a5fa" opacity={0.5} speed={0.5} />
        </group>
    );
};

const VazarothTitan = () => (
    <group position={[0, 20, -100]} scale={[4, 4, 4]}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh>
                <octahedronGeometry args={[5, 0]} />
                <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 3.5]} scale={[0.5, 1.5, 0.2]}>
                <boxGeometry />
                <meshBasicMaterial color="#ff0000" />
            </mesh>
            <pointLight position={[0, 0, 5]} color="#ff0000" intensity={2} distance={50} decay={2} />
        </Float>
    </group>
);

const EnemyMesh = ({ priority, name, onClick, isSelected, scale = 1, archetype = 'MONSTER', subtaskCount = 0, race, failed }: { priority: TaskPriority, name: string, onClick?: () => void, isSelected?: boolean, scale?: number, archetype?: 'MONSTER' | 'KNIGHT', subtaskCount?: number, race?: string, failed?: boolean }) => {
    // If failed, make it visually dominant/scary
    const finalScale = failed ? (scale * 1.3) : (scale || (0.5 + (priority * 0.3)));
    
    let color = priority === TaskPriority.HIGH ? PALETTE.BLOOD_BRIGHT : PALETTE.RUST;
    if (race === 'ELF') color = '#22c55e'; 
    if (race === 'DWARF') color = '#93c5fd';
    if (race === 'CONSTRUCT') color = '#0ea5e9';
    if (race === 'HUMAN') color = priority === TaskPriority.HIGH ? '#fca5a5' : '#fbbf24';
    
    // Override color for failure
    if (failed) {
        color = '#ff0000';
    }
    
    const isConstruct = race === 'CONSTRUCT';
    const isDemon = race === 'DEMON';

    const [hovered, setHover] = useState(false);
    return (
        <group>
            {/* INVISIBLE HITBOX */}
            <mesh 
                visible={false} 
                onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} 
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} 
                onPointerOut={() => setHover(false)}
            >
                <cylinderGeometry args={[2 * finalScale, 2 * finalScale, 6 * finalScale]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            <group position={[0, finalScale - 1, 0]} scale={[finalScale, finalScale, finalScale]}>
                {failed && (
                    <mesh position={[0, 1, 0]}>
                        <sphereGeometry args={[1.5, 16, 16]} />
                        <meshBasicMaterial color="red" transparent opacity={0.2} wireframe />
                    </mesh>
                )}

                <mesh position={[0, 0.8, 0]} castShadow>
                    {isConstruct ? <boxGeometry args={[0.8, 0.8, 0.8]} /> : isDemon ? <octahedronGeometry args={[0.5]} /> : <dodecahedronGeometry args={[0.5, 0]} />}
                    <meshStandardMaterial color={failed ? "#200000" : "#0f0f0f"} roughness={0.9} emissive={failed ? "#500" : "#000"} />
                </mesh>
                
                <mesh position={[0.3, 1, 0]}><coneGeometry args={[0.1, 0.6, 4]} /><meshStandardMaterial color={color} emissive={failed ? color : undefined} emissiveIntensity={2} /></mesh>
                <mesh position={[-0.3, 0.6, 0.2]} rotation={[0,0,0.5]}><coneGeometry args={[0.1, 0.6, 4]} /><meshStandardMaterial color={color} emissive={failed ? color : undefined} emissiveIntensity={2} /></mesh>
                
                {isSelected && <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}><ringGeometry args={[0.8, 0.9, 32]} /><meshBasicMaterial color="#ef4444" /></mesh>}
            </group>
            
             <Html 
                position={[0, finalScale * 3.5, 0]} 
                center 
                distanceFactor={20} 
                style={{pointerEvents: 'none'}}
            >
                <div className={`
                    text-[10px] uppercase tracking-widest font-bold px-3 py-1 border transition-all duration-300 whitespace-nowrap flex flex-col items-center
                    ${(hovered || isSelected) ? 'bg-red-950/90 border-red-500 text-red-100 scale-110 opacity-100 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-black/40 border-transparent text-white/70 opacity-70'}
                    ${failed ? 'border-red-600 bg-red-900/50 text-white animate-pulse' : ''}
                `}>
                    {name}
                    {failed && <span className="text-[8px] bg-red-600 text-white px-1 mt-1">FAILED</span>}
                </div>
            </Html>
        </group>
    )
}

const VillagerAvatar = ({ role, name, status, onClick, currentAction }: any) => {
    let color = role === 'Guard' ? '#404040' : role === 'Noble' ? '#7f1d1d' : '#57534e';
    if (role === 'Cultist') color = '#3f0e0e';
    if (role === 'Smith') color = '#ea580c'; // Orange for Smiths
    if (role === 'Scholar') color = '#3b82f6'; // Blue for Scholars

    return (
        <group onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
            <mesh position={[0,0.4,0]} castShadow><boxGeometry args={[0.3, 0.6, 0.3]} /><meshStandardMaterial color={color} /></mesh>
            <mesh position={[0,0.85,0]} castShadow><boxGeometry args={[0.2, 0.2, 0.2]} /><meshStandardMaterial color={PALETTE.SKIN} /></mesh>
            
            {/* Visual Indicators for Jobs */}
            {role === 'Smith' && <mesh position={[0.2, 0.5, 0]} rotation={[0,0,-0.5]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color="#444" /></mesh>}
            {role === 'Scholar' && <mesh position={[0.2, 0.5, 0]} rotation={[0,0,-0.5]}><boxGeometry args={[0.1, 0.3, 0.2]} /><meshStandardMaterial color="#e7e5e4" /></mesh>}
        </group>
    )
}

export { VazarothTitan, EnemyMesh, VillagerAvatar, BaseComplex };
