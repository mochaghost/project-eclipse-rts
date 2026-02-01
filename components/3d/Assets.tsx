
import React, { useState } from 'react';
import { Html, Float, Sparkles, Trail } from '@react-three/drei';
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

const Fire = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
    <group position={position} scale={[scale, scale, scale]}>
        <pointLight color="#ea580c" intensity={3} distance={8} decay={2} />
        <Sparkles count={20} scale={1} size={4} speed={0.4} opacity={1} color="#fbbf24" />
        <mesh position={[0, 0.2, 0]}>
            <coneGeometry args={[0.2, 0.5, 5]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={2} transparent opacity={0.8} />
        </mesh>
    </group>
);

const Smoke = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
        <Sparkles count={30} scale={1} size={10} speed={0.2} opacity={0.3} color="#57534e" noise={1} />
    </group>
);

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
                <meshStandardMaterial color="#7e22ce" emissive="#581c87" emissiveIntensity={2} transparent opacity={0.8} />
            </mesh>
        </Float>
        <pointLight color="#a855f7" intensity={1} distance={3} decay={2} />
        <Sparkles count={5} scale={2} size={2} color="#d8b4fe" speed={0.2} />
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

export const RuinedArch: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position} rotation={[0, Math.random(), 0]} scale={[2, 2, 2]}>
         <mesh position={[-1, 1.5, 0]}>
            <boxGeometry args={[0.5, 3, 0.5]} />
            <meshStandardMaterial color="#1c1917" roughness={1} />
         </mesh>
         <mesh position={[1, 1, 0]}>
            <boxGeometry args={[0.5, 2, 0.5]} />
            <meshStandardMaterial color="#1c1917" roughness={1} />
         </mesh>
         <mesh position={[0, 2.5, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[3, 0.5, 0.5]} />
            <meshStandardMaterial color="#292524" roughness={1} />
         </mesh>
    </group>
);

// --- ANIMALS & FAUNA ---

export const ForestStag = ({ position, rotation }: any) => (
    <group position={position} rotation={rotation} scale={[0.5, 0.5, 0.5]}>
        {/* Body */}
        <mesh position={[0, 1, 0]}>
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
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[-0.3, 0.4, 0]} rotation={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.02, 0.05, 0.8]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
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
        <mesh position={[0, 0.8, 0]}>
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
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.15, 1.2, 1.0]}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
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

// --- CITADEL EVOLUTION STAGES ---

const CitadelRuin = () => (
    <group>
        <Fire position={[0, 0, 2]} />
        <mesh position={[0, 0.1, 2]} rotation={[-Math.PI/2, 0, 0]}>
            <circleGeometry args={[0.8, 16]} />
            <meshStandardMaterial color="#0c0a09" />
        </mesh>
        <group position={[-1.5, 0, -1]} rotation={[0, 0.5, 0]}>
            <mesh position={[0, 0.7, 0]}>
                <coneGeometry args={[1.2, 1.4, 4]} />
                <meshStandardMaterial color="#451a03" roughness={1} />
            </mesh>
            <mesh position={[0, 0.5, 0.9]} rotation={[0.5, 0, 0]}>
                <planeGeometry args={[0.8, 1]} />
                <meshStandardMaterial color="#292524" side={THREE.DoubleSide} />
            </mesh>
        </group>
        <mesh position={[2, 0.2, -2]} rotation={[0.5, 0.5, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#292524" />
        </mesh>
        <mesh position={[1.8, 0.4, 1]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#1a0f0a" />
        </mesh>
    </group>
);

const CitadelVillage = () => (
    <group>
        {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            if (angle > 0.5 && angle < 2.5) return null;
            return (
                <mesh key={i} position={[Math.cos(angle) * 5, 1, Math.sin(angle) * 5]}>
                    <cylinderGeometry args={[0.2, 0.2, 2.5, 6]} />
                    <meshStandardMaterial color="#451a03" />
                </mesh>
            )
        })}
        <group position={[0, 0, -1]}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[3, 2, 2]} />
                <meshStandardMaterial color="#3f2818" />
            </mesh>
            <mesh position={[0, 2.5, 0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[2.5, 1.5, 4]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
            <Fire position={[0, 1, 1.2]} scale={0.5} />
        </group>
        <group position={[3, 0, 3]}>
            <mesh position={[0, 2, 0]}>
                <boxGeometry args={[1, 4, 1]} />
                <meshStandardMaterial color="#3f2818" />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
                <boxGeometry args={[1.2, 0.5, 1.2]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
        </group>
    </group>
);

const CitadelFortress = () => (
    <group>
        <mesh position={[0, 1.5, 0]}>
            <torusGeometry args={[6, 0.5, 16, 4]} />
            <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        <group position={[0, 0, -2]}>
            <mesh position={[0, 2, 0]} castShadow>
                <boxGeometry args={[4, 4, 3]} />
                <meshStandardMaterial color="#44403c" />
            </mesh>
            <mesh position={[-1.5, 3, 1.6]}>
                <planeGeometry args={[0.8, 2]} />
                <meshStandardMaterial color="#7f1d1d" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[1.5, 3, 1.6]}>
                <planeGeometry args={[0.8, 2]} />
                <meshStandardMaterial color="#fbbf24" side={THREE.DoubleSide} />
            </mesh>
        </group>
        {[[-4, -4], [4, -4], [-4, 4], [4, 4]].map(([x, z], i) => (
            <mesh key={i} position={[x, 2.5, z]} castShadow>
                <cylinderGeometry args={[0.8, 1, 5, 6]} />
                <meshStandardMaterial color="#292524" />
            </mesh>
        ))}
    </group>
);

const CitadelEclipse = () => (
    <group>
        <Float speed={1} rotationIntensity={0.05} floatIntensity={0.1}>
            <mesh position={[0, 4, 0]} castShadow>
                <octahedronGeometry args={[3, 0]} />
                <meshStandardMaterial color="#050202" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 6, 0]} rotation={[Math.PI/4, 0, 0]}>
                <torusGeometry args={[5, 0.1, 16, 100]} />
                <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" />
            </mesh>
             <mesh position={[0, 2, 0]} rotation={[-Math.PI/4, 0, 0]}>
                <torusGeometry args={[4, 0.2, 16, 6]} />
                <meshStandardMaterial color="#1c1917" metalness={1} />
            </mesh>
            <mesh position={[0, 4, 2.5]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
            </mesh>
            <pointLight position={[0, 4, 3]} color="#ef4444" intensity={5} distance={20} />
        </Float>
        {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
                <mesh key={i} position={[Math.cos(angle) * 6, 0, Math.sin(angle) * 6]} rotation={[0, -angle, 0]}>
                    <coneGeometry args={[1, 6, 4]} />
                    <meshStandardMaterial color="#000" />
                </mesh>
            )
        })}
    </group>
);

const BaseComplex = ({ era, currentHp, maxHp }: any) => {
    // Determine visuals based on Health %
    const healthPercent = currentHp / maxHp;
    const isDamaged = healthPercent < 0.5;
    const isCritical = healthPercent < 0.2;

    let Structure = CitadelRuin;
    if (era === Era.CAPTAIN) Structure = CitadelVillage;
    if (era === Era.GENERAL) Structure = CitadelFortress;
    if (era === Era.KING) Structure = CitadelEclipse;
    
    // Degradation Logic
    if (isCritical && era !== Era.RUIN) {
        // Fallback to simpler structure if critically damaged
        if (era === Era.KING) Structure = CitadelFortress;
        else Structure = CitadelRuin;
    }

    return (
        <group>
            <InteractiveStructure name={era === Era.RUIN ? "Camp" : "Citadel"}>
                <Structure />
                {/* Visual Feedback for Damage */}
                {isDamaged && <Smoke position={[2, 2, 2]} />}
                {isCritical && <Fire position={[-2, 0, 2]} scale={2} />}
                {isCritical && <Fire position={[2, 0, -2]} scale={2} />}
            </InteractiveStructure>
        </group>
    );
};

// --- HERO EVOLUTION (8 Tiers for 80 Levels) ---

export const HeroAvatar = ({ level, winStreak }: { level: number, winStreak?: number, scale?: number }) => {
    // TIER 1: THE WRETCH (1-9)
    if (level < 10) {
        return (
            <group>
                <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[0.4, 0.8, 0.3]} /><meshStandardMaterial color="#57534e" /></mesh>
                <mesh position={[0, 1.3, 0]} castShadow><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#fca5a5" /></mesh>
                <mesh position={[0.3, 0.6, 0.3]} rotation={[0.2, 0, -0.2]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#7c2d12" /></mesh>
            </group>
        )
    }
    // TIER 2: THE MERCENARY (10-19)
    if (level < 20) {
        return (
            <group>
                <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[0.5, 0.9, 0.35]} /><meshStandardMaterial color="#451a03" /></mesh>
                <mesh position={[0, 1.35, 0]} castShadow><boxGeometry args={[0.25, 0.3, 0.25]} /><meshStandardMaterial color="#a8a29e" /></mesh>
                <mesh position={[0.4, 0.8, 0]} rotation={[0.4, 0, 0]}><boxGeometry args={[0.1, 1.2, 0.1]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
            </group>
        )
    }
    // TIER 3: THE CAPTAIN (20-29)
    if (level < 30) {
        return (
            <group>
                <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[0.6, 1.0, 0.4]} /><meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.2} /></mesh>
                <mesh position={[0, 0.8, -0.25]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.7, 1.2, 0.1]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
                <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[0.3, 0.35, 0.3]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
                <mesh position={[0.5, 0.8, 0.2]} rotation={[0.5, 0, -0.2]}><boxGeometry args={[0.15, 1.5, 0.05]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.2} /></mesh>
            </group>
        )
    }
    // TIER 4: THE INQUISITOR (30-39)
    if (level < 40) {
        return (
            <group>
                <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[0.6, 1.1, 0.4]} /><meshStandardMaterial color="#334155" metalness={0.8} /></mesh>
                <mesh position={[0, 1.4, 0]} castShadow><dodecahedronGeometry args={[0.25]} /><meshStandardMaterial color="#475569" /></mesh>
                <mesh position={[0.6, 1.0, 0]} rotation={[0, 0, -0.4]}><boxGeometry args={[0.1, 1.8, 0.1]} /><meshStandardMaterial color="#94a3b8" emissive="#cbd5e1" emissiveIntensity={0.4} /></mesh>
            </group>
        )
    }
    // TIER 5: THE WARLORD (40-49)
    if (level < 50) {
         return (
            <group>
                <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[0.7, 1.2, 0.5]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
                <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[0.3, 0.4, 0.3]} /><meshStandardMaterial color="#000" /></mesh>
                <mesh position={[0.4, 1.6, 0.2]}><boxGeometry args={[0.1, 0.5, 0.1]} /><meshStandardMaterial color="#fbbf24" /></mesh>
                <mesh position={[-0.4, 1.6, 0.2]}><boxGeometry args={[0.1, 0.5, 0.1]} /><meshStandardMaterial color="#fbbf24" /></mesh>
                <mesh position={[0.6, 0.8, 0]} rotation={[0.2, 0, -0.2]}><boxGeometry args={[0.2, 2.0, 0.1]} /><meshStandardMaterial color="#1c1917" /></mesh>
            </group>
        )
    }
    // TIER 6: THE SOVEREIGN (50-59)
    if (level < 60) {
        return (
            <group>
                <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[0.6, 1.2, 0.4]} /><meshStandardMaterial color="#d97706" metalness={1} roughness={0.1} /></mesh>
                <mesh position={[0, 0.9, -0.3]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.8, 1.4, 0.1]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
                <mesh position={[0, 1.5, 0]} castShadow><sphereGeometry args={[0.25]} /><meshStandardMaterial color="#d97706" /></mesh>
                <Sparkles count={5} scale={1} color="#fbbf24" />
            </group>
        )
    }
    // TIER 7: THE ECLIPSE KING (60-79)
    if (level < 80) {
        return (
            <group>
                <Sparkles count={15} scale={2} color="#ef4444" />
                <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[0.7, 1.2, 0.5]} /><meshStandardMaterial color="#000" metalness={0.8} roughness={0.2} /></mesh> 
                <mesh position={[0, 0.9, -0.3]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.8, 1.4, 0.1]} /><meshStandardMaterial color="#000" /></mesh> 
                <group position={[0.6, 1.0, 0.2]} rotation={[0.2, 0, -0.4]}>
                    <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.3, 2.5, 0.1]} /><meshStandardMaterial color="#1c1917" metalness={0.9} /></mesh>
                </group>
                <mesh position={[0.1, 1.5, 0.25]}>
                    <sphereGeometry args={[0.05]} />
                    <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={5} />
                </mesh>
                <Trail width={0.2} length={4} color="#ef4444" attenuation={(t) => t * t}>
                    <mesh position={[0.1, 1.5, 0.25]} />
                </Trail>
            </group>
        );
    }
    // TIER 8: THE ASCENDED (80+)
    return (
        <group>
             <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                <mesh position={[0, 1, 0]} castShadow>
                    <octahedronGeometry args={[0.6, 0]} />
                    <meshStandardMaterial color="#a855f7" emissive="#6b21a8" emissiveIntensity={3} />
                </mesh>
                <mesh position={[0, 1, 0]} rotation={[0, Math.PI/4, 0]}>
                    <torusGeometry args={[0.8, 0.05, 16, 32]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" />
                </mesh>
             </Float>
             <Sparkles count={30} scale={3} size={4} speed={0.2} color="#d8b4fe" />
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

const House = () => (
    <group>
        <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.2, 1, 1.2]} /><meshStandardMaterial color="#1f1d1b" /></mesh>
        <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI/4, 0]} castShadow><coneGeometry args={[1.1, 0.8, 4]} /><meshStandardMaterial color="#0f0f0f" /></mesh>
        <mesh position={[0, 0.3, 0.61]}><boxGeometry args={[0.3, 0.6, 0.1]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0.3, 0.5, 0.61]}>
             <planeGeometry args={[0.2, 0.2]} />
             <meshStandardMaterial color="#d97706" emissive="#d97706" emissiveIntensity={0.5} />
        </mesh>
    </group>
);

const EnemyMesh = ({ priority, name, onClick, isSelected, scale = 1, archetype = 'MONSTER', subtaskCount = 0, race }: { priority: TaskPriority, name: string, onClick?: () => void, isSelected?: boolean, scale?: number, archetype?: 'MONSTER' | 'KNIGHT', subtaskCount?: number, race?: string }) => {
    const finalScale = scale || (0.5 + (priority * 0.3));
    let color = priority === TaskPriority.HIGH ? PALETTE.BLOOD_BRIGHT : PALETTE.RUST;
    if (race === 'ELF') color = '#22c55e'; 
    if (race === 'DWARF') color = '#93c5fd';
    if (race === 'CONSTRUCT') color = '#0ea5e9';
    if (race === 'HUMAN') color = priority === TaskPriority.HIGH ? '#fca5a5' : '#fbbf24';
    const [hovered, setHover] = useState(false);
    return (
        <group>
            {/* INVISIBLE HITBOX for easier hovering */}
            <mesh 
                visible={false} 
                onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} 
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} 
                onPointerOut={() => setHover(false)}
            >
                <cylinderGeometry args={[1 * finalScale, 1 * finalScale, 3 * finalScale]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            <group position={[0, 0, 0]} scale={[finalScale, finalScale, finalScale]}>
                <mesh position={[0, 0.8, 0]} castShadow><dodecahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color="#0f0f0f" roughness={0.9} /></mesh>
                <mesh position={[0.3, 1, 0]}><coneGeometry args={[0.1, 0.6, 4]} /><meshStandardMaterial color={color} /></mesh>
                <mesh position={[-0.3, 0.6, 0.2]} rotation={[0,0,0.5]}><coneGeometry args={[0.1, 0.6, 4]} /><meshStandardMaterial color={color} /></mesh>
                {isSelected && <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}><ringGeometry args={[0.8, 0.9, 32]} /><meshBasicMaterial color="#ef4444" /></mesh>}
            </group>
            
            {/* NAME TAG */}
             <Html 
                position={[0, finalScale * 2.5 + 0.5, 0]} 
                center 
                distanceFactor={15} 
                style={{pointerEvents: 'none'}}
            >
                <div className={`
                    text-[10px] uppercase tracking-widest font-bold px-3 py-1 border transition-all duration-300 whitespace-nowrap
                    ${(hovered || isSelected) ? 'bg-red-950/90 border-red-500 text-red-100 scale-110 opacity-100 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-black/40 border-transparent text-white/70 opacity-70'}
                `}>
                    {name}
                </div>
            </Html>
        </group>
    )
}

const VillagerAvatar = ({ role, name, status, onClick, currentAction }: any) => {
    let color = role === 'Guard' ? '#404040' : role === 'Noble' ? '#7f1d1d' : '#57534e';
    if (role === 'Cultist') color = '#3f0e0e';
    return (
        <group onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
            <mesh position={[0,0.4,0]} castShadow><boxGeometry args={[0.3, 0.6, 0.3]} /><meshStandardMaterial color={color} /></mesh>
            <mesh position={[0,0.85,0]} castShadow><boxGeometry args={[0.2, 0.2, 0.2]} /><meshStandardMaterial color={PALETTE.SKIN} /></mesh>
        </group>
    )
}

// --- WORLD MAP CHUNKS ---
export const AncientRuin = ({ position }: any) => (
    <group position={position} scale={[2, 2, 2]}>
        <mesh position={[0, 1, 0]}><boxGeometry args={[1, 2, 1]} /><meshStandardMaterial color="#1c1917" /></mesh>
        <mesh position={[1.2, 0.5, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.5, 1, 0.5]} /><meshStandardMaterial color="#1c1917" /></mesh>
        <pointLight position={[0, 2, 0]} color="cyan" distance={3} intensity={0.5} />
    </group>
);

export const ResourceNode: React.FC<{ position: any, type: 'GOLD' | 'IRON' }> = ({ position, type }) => (
    <group position={position}>
        <mesh rotation={[-Math.PI/2, 0, 0]}>
            <coneGeometry args={[1, 1.5, 5]} />
            <meshStandardMaterial color={type === 'GOLD' ? '#fbbf24' : '#94a3b8'} metalness={0.8} roughness={0.2} />
        </mesh>
        <Sparkles count={5} scale={2} color={type === 'GOLD' ? '#fbbf24' : '#94a3b8'} />
    </group>
);

// Exports at the bottom to avoid Temporal Dead Zone (TDZ) issues
export { VazarothTitan, EnemyMesh, VillagerAvatar, House, BaseComplex };
