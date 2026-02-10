
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Html, Float, Sparkles, Trail, useTexture, Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../../constants';
import { TaskPriority, Era, NPC, RaceType, HeroEquipment, Task } from '../../types';
import { Clock, AlertTriangle } from 'lucide-react';

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

const Smoke = ({ position, color = "#57534e", scale=1 }: { position: [number, number, number], color?: string, scale?: number }) => (
    <group position={position} scale={[scale, scale, scale]}>
        <Sparkles count={20} scale={2} size={15} speed={0.2} opacity={0.2} color={color} noise={1} />
    </group>
);

// --- NEW ATMOSPHERIC ASSETS ---

export const Torch: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 2]} />
            <meshStandardMaterial color="#292524" />
        </mesh>
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
        <mesh position={[0, 1.5, 0]} rotation={[0.1, 0, 0.1]}>
            <cylinderGeometry args={[0.3, 0.5, 3, 5]} />
            <meshStandardMaterial color="#1a120b" roughness={1} />
        </mesh>
        <mesh position={[0.2, 2.8, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.15, 0.25, 2, 4]} />
            <meshStandardMaterial color="#1a120b" roughness={1} />
        </mesh>
        <mesh position={[-0.3, 2.5, 0.2]} rotation={[0.5, 0, 0.8]}>
            <cylinderGeometry args={[0.1, 0.2, 1.5, 4]} />
            <meshStandardMaterial color="#1a120b" roughness={1} />
        </mesh>
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

// --- ARCHITECTURAL ELEMENTS ---

const CityStreets = ({ level }: { level: number }) => {
    // Level 0: Nothing
    if (level === 0) return null;

    const roadColor = level === 1 ? "#57534e" : level === 2 ? "#292524" : "#0f172a";
    const roadWidth = level === 1 ? 1.5 : 2.5;
    const districtRadius = 8; // Extended for better spacing

    return (
        <group position={[0, 0.02, 0]}>
            {/* Central Plaza */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[level === 1 ? 4 : 5, 32]} />
                <meshStandardMaterial color={roadColor} roughness={0.9} />
            </mesh>
            
            {/* Roads to Districts (Cardinal Directions) */}
            {[0, Math.PI/2, Math.PI, -Math.PI/2].map((rot, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, rot]} position={[Math.sin(rot)*districtRadius, 0, Math.cos(rot)*districtRadius]}>
                    <planeGeometry args={[roadWidth, districtRadius * 2]} />
                    <meshStandardMaterial color={roadColor} roughness={0.9} />
                </mesh>
            ))}

            {/* Connecting Ring (Outer Road) - Only for higher tiers */}
            {level >= 2 && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[12, 15, 32]} />
                    <meshStandardMaterial color={roadColor} roughness={0.9} />
                </mesh>
            )}
        </group>
    )
}

const ProceduralHousing = ({ count, radius, level, seedOffset = 0 }: { count: number, radius: number, level: number, seedOffset?: number }) => {
    if (level === 0) return null;
    
    // Deterministic placement based on count + seed
    const houses = useMemo(() => {
        return Array.from({length: count}).map((_, i) => {
            const seed = i + seedOffset;
            const angle = (i / count) * Math.PI * 2 + (Math.sin(seed) * 0.5);
            // Random variance in radius
            const r = radius + (Math.cos(seed * 3.33) * 2);
            return {
                x: Math.cos(angle) * r,
                z: Math.sin(angle) * r,
                scale: 0.6 + Math.abs(Math.sin(seed)) * 0.6,
                rot: Math.atan2(Math.sin(angle), Math.cos(angle)) + Math.PI, // Face inward
                height: 1 + (Math.abs(Math.cos(seed)) * (level * 0.5)) // Taller with level
            }
        });
    }, [count, radius, level, seedOffset]);

    const houseColor = level === 1 ? "#3f2818" : "#1c1917"; // Wood vs Stone

    return (
        <group>
            {houses.map((h, i) => (
                <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.rot, 0]} scale={[h.scale, h.scale, h.scale]}>
                    <mesh position={[0, h.height/2, 0]} castShadow>
                        <boxGeometry args={[1, h.height, 1]} />
                        <meshStandardMaterial color={houseColor} />
                    </mesh>
                    <mesh position={[0, h.height + 0.5, 0]}>
                        <coneGeometry args={[0.8, 1, 4]} />
                        <meshStandardMaterial color="#0f0f0f" />
                    </mesh>
                    {level >= 3 && <pointLight position={[0, 1, 0]} color="#fbbf24" distance={2} intensity={0.5} />}
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
        const radius = 10;
        // 4 cardinal roads
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            for (let d = 4; d < radius * 2; d += 6) {
                positions.push({
                    x: Math.cos(angle) * d + 1.5, // Offset from road center
                    z: Math.sin(angle) * d + 1.5
                });
                positions.push({
                    x: Math.cos(angle) * d - 1.5, // Other side
                    z: Math.sin(angle) * d - 1.5
                });
            }
        }
        return positions;
    }, []);

    // Color shift based on level
    const lightColor = lightingLevel < 3 ? "#fbbf24" : lightingLevel < 5 ? "#3b82f6" : "#a855f7"; // Fire -> Magic -> Void
    const intensity = 0.5 + (lightingLevel * 0.2);

    return (
        <group>
            {lights.map((pos, i) => (
                <group key={i} position={[pos.x, 0, pos.z]}>
                    <mesh position={[0, 1.5, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 3]} />
                        <meshStandardMaterial color="#1c1917" />
                    </mesh>
                    {lightingLevel < 3 ? (
                        <Fire position={[0, 3, 0]} scale={0.5} color={lightColor} />
                    ) : (
                        <group position={[0, 3, 0]}>
                            <mesh>
                                <sphereGeometry args={[0.3]} />
                                <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={2} />
                            </mesh>
                            <pointLight color={lightColor} intensity={intensity} distance={8} />
                            <Sparkles count={5} scale={1} size={2} color={lightColor} />
                        </group>
                    )}
                </group>
            ))}
        </group>
    )
}

// --- MODULAR STRUCTURES (INFINITE SCALING) ---

const StructureForge = ({ level }: { level: number }) => {
    // Positioned WEST (-X) - INDUSTRIAL DISTRICT
    if (level === 0) return (
        <group position={[-12, 0, 0]}>
            <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.8, 0.6, 0.8]} /><meshStandardMaterial color="#292524" /></mesh>
            <Smoke position={[0, 1, 0]} />
        </group>
    ); 
    
    // Scale visual complexity with level
    const scale = 1 + (level * 0.15); // Grow 15% per level
    const chimneyCount = Math.min(5, Math.ceil(level / 2));
    const hasLava = level >= 3;

    return (
        <InteractiveStructure name={`Forge Lv.${level}`} position={[-12, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            {/* Main Factory Floor */}
            <mesh position={[0, 1.5 * scale, 0]} scale={[scale, scale, scale]} castShadow receiveShadow>
                <boxGeometry args={[4, 3, 3]} />
                <meshStandardMaterial color="#1c1917" roughness={0.8} />
            </mesh>
            
            {/* Dynamic Chimneys */}
            {Array.from({length: chimneyCount}).map((_, i) => (
                <group key={i} position={[(i - chimneyCount/2) * 1.2, (3 * scale), 0]}>
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.4, 0.6, 2 * scale]} />
                        <meshStandardMaterial color="#0c0a09" />
                    </mesh>
                    <Smoke position={[0, 2 * scale + 1, 0]} color="#000" scale={scale} />
                </group>
            ))}

            {/* Molten Core (Infinite Glow Scaling) */}
            {hasLava && (
                <group position={[2.5 * scale, 0, 0]}>
                    <mesh position={[0, 1, 0]}>
                        <sphereGeometry args={[1.5 * (scale * 0.5)]} />
                        <meshStandardMaterial color="#ea580c" emissive="#c2410c" emissiveIntensity={level} wireframe />
                    </mesh>
                    <pointLight position={[0, 2, 0]} color="#ea580c" intensity={level * 2} distance={15 * scale} />
                </group>
            )}
        </InteractiveStructure>
    );
}

const StructureLibrary = ({ level }: { level: number }) => {
    // Positioned EAST (+X) - ARCANE DISTRICT
    if (level === 0) return null;
    
    const height = 2 + (level * 1.5);
    const floaters = Math.floor(level / 2);

    return (
        <InteractiveStructure name={`Library Lv.${level}`} position={[12, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
            {/* Main Tower Base */}
            <mesh position={[0, height/2, 0]} castShadow>
                <cylinderGeometry args={[1.5 + (level * 0.2), 2 + (level * 0.3), height, 6]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            
            {/* Infinite Floating Rings */}
            {Array.from({length: floaters}).map((_, i) => (
                <Float key={i} speed={2 + i} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh position={[0, height + (i*2) + 2, 0]} rotation={[Math.random(), 0, 0]}>
                        <torusGeometry args={[3 + i, 0.1 + (level * 0.05), 16, 32]} />
                        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} />
                    </mesh>
                </Float>
            ))}

            {/* Crystal Top */}
            <mesh position={[0, height + 1, 0]}>
                <octahedronGeometry args={[1 + (level * 0.2)]} />
                <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={1.5 + (level * 0.2)} />
            </mesh>
            <pointLight position={[0, height + 2, 0]} color="#3b82f6" distance={10 + level} intensity={2 + level} />
        </InteractiveStructure>
    );
}

const StructureWalls = ({ level }: { level: number }) => {
    if (level === 0) return null;

    const radius = 15 + (level * 2); // Walls expand outward
    const height = 3 + level;
    const segmentCount = 12 + Math.floor(level/2);

    // Procedural Ring Wall
    return (
        <group>
            {Array.from({ length: segmentCount }).map((_, i) => {
                const angle = (i / segmentCount) * Math.PI * 2;
                // Leave gaps for cardinal gates
                if (i % (segmentCount/4) < 1) return null; 

                return (
                    <group key={i} position={[Math.cos(angle)*radius, height/2, Math.sin(angle)*radius]} rotation={[0, -angle, 0]}>
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[1, height, (radius * 6) / segmentCount]} />
                            <meshStandardMaterial color="#1c1917" />
                        </mesh>
                        {/* Battlements */}
                        <mesh position={[0, height/2 + 0.2, 0]}>
                            <boxGeometry args={[1.2, 0.4, (radius * 6) / segmentCount]} />
                            <meshStandardMaterial color="#292524" />
                        </mesh>
                        {/* Towers for high levels */}
                        {level >= 5 && i % 2 === 0 && (
                             <mesh position={[0, 2, 0]}>
                                 <boxGeometry args={[2, height + 2, 2]} />
                                 <meshStandardMaterial color="#0f0f0f" />
                             </mesh>
                        )}
                    </group>
                )
            })}
            
            {/* Gatehouses at cardinal points */}
            {[0, Math.PI/2, Math.PI, -Math.PI/2].map((angle, i) => (
                <group key={`gate-${i}`} position={[Math.cos(angle)*radius, 0, Math.sin(angle)*radius]} rotation={[0, -angle, 0]}>
                    <mesh position={[0, height/2, 4]}><boxGeometry args={[3, height+2, 3]} /><meshStandardMaterial color="#0c0a09" /></mesh>
                    <mesh position={[0, height/2, -4]}><boxGeometry args={[3, height+2, 3]} /><meshStandardMaterial color="#0c0a09" /></mesh>
                    {/* Arch */}
                    <mesh position={[0, height - 1, 0]}><boxGeometry args={[2, 2, 10]} /><meshStandardMaterial color="#1c1917" /></mesh>
                </group>
            ))}
        </group>
    )
}

// --- MAIN BASE COMPLEX (The Citadel) ---

const BaseComplex = ({ era, currentHp, maxHp, structures }: any) => {
    const healthPercent = currentHp / maxHp;
    const isCritical = healthPercent < 0.2;

    const forgeLevel = structures?.forgeLevel || 0;
    const libraryLevel = structures?.libraryLevel || 0;
    const wallsLevel = structures?.wallsLevel || 0;
    const lightingLevel = structures?.lightingLevel || 0;

    // Determine visual tier based on Era + Levels (for the central castle only)
    let cityTier = 0;
    if (era === Era.CAPTAIN) cityTier = 1;
    if (era === Era.GENERAL) cityTier = 2;
    if (era === Era.KING) cityTier = 3;

    return (
        <group>
            {/* 1. URBAN LAYOUT (The Foundation) */}
            <CityStreets level={Math.max(cityTier, 1)} /> {/* Always show at least tier 1 street layout if base exists */}
            <CityLighting lightingLevel={lightingLevel} />

            {/* 2. THE SEAT OF POWER (The Citadel) */}
            <InteractiveStructure name={cityTier === 3 ? "The Dark Palace" : cityTier === 2 ? "High Command" : "The Citadel"}>
                
                {/* TIER 0: The Exile's Camp (Survival Mode) */}
                {cityTier === 0 && (
                    <group>
                        {/* Main Tent */}
                        <mesh position={[0, 1, 0]} castShadow>
                            <coneGeometry args={[2, 2.5, 6]} />
                            <meshStandardMaterial color="#451a03" roughness={1} />
                        </mesh>
                        {/* Entrance Flap */}
                        <mesh position={[0, 0.5, 1.5]} rotation={[0.2, 0, 0]}>
                            <boxGeometry args={[1, 1.5, 0.1]} />
                            <meshStandardMaterial color="#292524" />
                        </mesh>
                        <Fire position={[1.5, 0, 1.5]} scale={0.8} />
                        {/* Scattered Crates */}
                        <mesh position={[-1.5, 0.25, 0]} rotation={[0, 0.5, 0]}>
                            <boxGeometry args={[0.5, 0.5, 0.5]} />
                            <meshStandardMaterial color="#57534e" />
                        </mesh>
                    </group>
                )}
                
                {/* TIER 1: The Bastion (Martial Law) */}
                {cityTier === 1 && (
                    <group>
                        {/* Main Block - Brutalist */}
                        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                            <boxGeometry args={[4, 3, 4]} />
                            <meshStandardMaterial color="#292524" roughness={0.9} />
                        </mesh>
                        {/* Battlements */}
                        <mesh position={[0, 3.1, 0]}>
                            <boxGeometry args={[4.2, 0.4, 4.2]} />
                            <meshStandardMaterial color="#1c1917" />
                        </mesh>
                        {/* Iron Door */}
                        <mesh position={[0, 1, 2.05]}>
                            <planeGeometry args={[1.5, 2]} />
                            <meshStandardMaterial color="#0c0a09" metalness={0.8} roughness={0.4} />
                        </mesh>
                        {/* Corner Torches */}
                        <Torch position={[1.8, 3.2, 1.8]} />
                        <Torch position={[-1.8, 3.2, 1.8]} />
                    </group>
                )}

                {/* TIER 2: The Fortress (Gothic Industrial) */}
                {cityTier === 2 && (
                    <group>
                        {/* Central Spire Base */}
                        <mesh position={[0, 3, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[2, 3, 6, 8]} />
                            <meshStandardMaterial color="#1c1917" roughness={0.8} />
                        </mesh>
                        {/* Upper Tower */}
                        <mesh position={[0, 7, 0]} castShadow>
                            <cylinderGeometry args={[1.5, 1.8, 4, 8]} />
                            <meshStandardMaterial color="#292524" />
                        </mesh>
                        {/* Roof */}
                        <mesh position={[0, 10, 0]}>
                            <coneGeometry args={[2, 3, 8]} />
                            <meshStandardMaterial color="#0f172a" />
                        </mesh>
                        {/* Buttresses (The structural expansion) */}
                        {[0, Math.PI/2, Math.PI, -Math.PI/2].map((r, i) => (
                            <group key={i} rotation={[0, r, 0]}>
                                <mesh position={[2.5, 2, 0]}>
                                    <boxGeometry args={[2, 4, 1]} />
                                    <meshStandardMaterial color="#292524" />
                                </mesh>
                                {/* Banners */}
                                <mesh position={[2.5, 3, 0.6]} rotation={[0.1, 0, 0]}>
                                    <planeGeometry args={[0.8, 2]} />
                                    <meshStandardMaterial color={PALETTE.BLOOD} side={THREE.DoubleSide} />
                                </mesh>
                            </group>
                        ))}
                        {/* Glowing Windows */}
                        <pointLight position={[0, 6, 0]} color="#fbbf24" intensity={2} distance={8} />
                    </group>
                )}

                {/* TIER 3: The Dark Palace (Supreme Authority) */}
                {cityTier === 3 && (
                    <group>
                        {/* Massive Foundation */}
                        <mesh position={[0, 2, 0]} castShadow receiveShadow>
                            <boxGeometry args={[8, 4, 6]} />
                            <meshStandardMaterial color="#0c0a09" roughness={0.6} />
                        </mesh>
                        
                        {/* Central Cathedral Nave */}
                        <mesh position={[0, 6, 0]} castShadow>
                            <boxGeometry args={[4, 8, 4]} />
                            <meshStandardMaterial color="#1c1917" />
                        </mesh>

                        {/* Floating Crown Structure (Politics/Magic) */}
                        <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.2}>
                            <group position={[0, 12, 0]}>
                                <mesh>
                                    <torusGeometry args={[3, 0.2, 16, 6]} />
                                    <meshStandardMaterial color={PALETTE.GOLD} emissive={PALETTE.GOLD} emissiveIntensity={1} />
                                </mesh>
                                <mesh rotation={[Math.PI/2, 0, 0]}>
                                    <torusGeometry args={[2.5, 0.1, 16, 6]} />
                                    <meshStandardMaterial color={PALETTE.GOLD} emissive={PALETTE.GOLD} emissiveIntensity={0.5} />
                                </mesh>
                                {/* The Eye of the State */}
                                <mesh position={[0, 0, 0]}>
                                    <octahedronGeometry args={[1]} />
                                    <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={3} />
                                </mesh>
                                <pointLight color="#a855f7" intensity={10} distance={40} />
                            </group>
                        </Float>

                        {/* Side Spires */}
                        <mesh position={[3, 5, 2]}>
                            <cylinderGeometry args={[0.5, 1, 8]} />
                            <meshStandardMaterial color="#292524" />
                        </mesh>
                        <mesh position={[-3, 5, 2]}>
                            <cylinderGeometry args={[0.5, 1, 8]} />
                            <meshStandardMaterial color="#292524" />
                        </mesh>

                        {/* Grand Entrance */}
                        <mesh position={[0, 1, 3.1]}>
                            <boxGeometry args={[2, 3, 0.5]} />
                            <meshStandardMaterial color="#000" metalness={1} roughness={0} />
                        </mesh>
                        <pointLight position={[0, 2, 4]} color="#fbbf24" intensity={2} distance={5} />
                    </group>
                )}
            </InteractiveStructure>

            {/* 3. FUNCTIONAL DISTRICTS (INFINITE SCALING) */}
            <StructureForge level={forgeLevel} />
            <StructureLibrary level={libraryLevel} />
            <StructureWalls level={wallsLevel} />

            {/* 4. POPULATION DENSITY (DISTRICTS) */}
            
            {/* South District: RESIDENTIAL */}
            <group position={[0, 0, 10]}>
                <ProceduralHousing count={5 + (cityTier * 5)} radius={4} level={cityTier} />
            </group>
            
            {/* North District: GATE WARD */}
            <group position={[0, 0, -10]}>
                <ProceduralHousing count={3 + (cityTier * 2)} radius={3} level={cityTier} seedOffset={100} />
            </group>

            {/* West District: INDUSTRIAL HOUSING (Workers near Forge) */}
            {forgeLevel > 0 && (
                <group position={[-12, 0, 5]}>
                    <ProceduralHousing count={Math.min(20, forgeLevel * 3)} radius={3} level={1} seedOffset={200} />
                </group>
            )}

            {/* DAMAGE FX */}
            {isCritical && <Fire position={[2, 0, 2]} scale={2} />}
        </group>
    );
};

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

export const EquippedWeapon = ({ name }: { name: string }) => {
    // Simple visual logic based on name keywords
    const isGold = name.toLowerCase().includes('gold') || name.toLowerCase().includes('king');
    const isVoid = name.toLowerCase().includes('void') || name.toLowerCase().includes('eclipse');
    const isBig = name.toLowerCase().includes('great') || name.toLowerCase().includes('claymore');
    
    let color = "#cbd5e1"; // Steel
    if (isGold) color = "#fbbf24";
    if (isVoid) color = "#a855f7";
    if (name.toLowerCase().includes('rust')) color = "#7c2d12";

    return (
        <group position={[0.4, 0.8, 0.2]} rotation={[0, 0, -0.5]} scale={isBig ? 1.5 : 1}>
            {/* Hilt */}
            <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.03, 0.04, 0.4]} />
                <meshStandardMaterial color="#451a03" />
            </mesh>
            {/* Guard */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.3, 0.05, 0.1]} />
                <meshStandardMaterial color={isGold ? "#d97706" : "#334155"} />
            </mesh>
            {/* Blade */}
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[0.08, 1.2, 0.02]} />
                <meshStandardMaterial color={color} emissive={isVoid ? color : undefined} emissiveIntensity={isVoid ? 2 : 0} metalness={0.8} roughness={0.2} />
            </mesh>
            {isVoid && <Sparkles count={5} scale={1} size={2} color="#d8b4fe" />}
        </group>
    );
};

export const HeroAvatar = ({ level, winStreak, scale = 1, equipment }: { level: number, winStreak?: number, scale?: number, equipment?: HeroEquipment }) => {
    const armorName = equipment?.armor || "Rags";
    
    const isPlate = armorName.toLowerCase().includes('plate') || armorName.toLowerCase().includes('mail') || armorName.toLowerCase().includes('iron');
    const isRoyal = armorName.toLowerCase().includes('king') || armorName.toLowerCase().includes('sovereign') || armorName.toLowerCase().includes('regalia');
    const isVoid = armorName.toLowerCase().includes('void') || armorName.toLowerCase().includes('eclipse') || armorName.toLowerCase().includes('cosmic');

    let bodyColor = "#fca5a5"; // Skin
    let torsoColor = "#78716c"; // Rags
    
    if (armorName.toLowerCase().includes('leather')) torsoColor = "#451a03";
    if (isPlate) torsoColor = "#334155"; // Dark Steel
    if (isRoyal) torsoColor = "#fbbf24"; // Gold
    if (isVoid) torsoColor = "#000000";

    return (
        <group scale={[scale, scale, scale]}>
            {/* Halo for streaks */}
            {winStreak && winStreak > 3 && (
                <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
                    <mesh position={[0, 1.8, 0]} rotation={[Math.PI/2, 0, 0]}>
                        <torusGeometry args={[0.3, 0.02, 8, 16]} />
                        <meshBasicMaterial color="#fbbf24" />
                    </mesh>
                </Float>
            )}

            {/* Head */}
            <mesh position={[0, 1.3, 0]} castShadow>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color={bodyColor} />
            </mesh>
            
            {/* Crown/Helm */}
            {(isRoyal || isVoid) && (
                <mesh position={[0, 1.45, 0]}>
                    <cylinderGeometry args={[0.22, 0.22, 0.1, 6]} />
                    <meshStandardMaterial color={isVoid ? "#000" : "#fbbf24"} />
                </mesh>
            )}

            {/* Torso */}
            <mesh position={[0, 0.7, 0]} castShadow>
                <boxGeometry args={[0.4, 0.8, 0.3]} />
                <meshStandardMaterial color={torsoColor} />
            </mesh>

            {/* Pauldrons (Shoulders) for Plate+ */}
            {(isPlate || isRoyal || isVoid) && (
                <>
                    <mesh position={[0.25, 1, 0]}>
                        <boxGeometry args={[0.2, 0.2, 0.3]} />
                        <meshStandardMaterial color={torsoColor} />
                    </mesh>
                    <mesh position={[-0.25, 1, 0]}>
                        <boxGeometry args={[0.2, 0.2, 0.3]} />
                        <meshStandardMaterial color={torsoColor} />
                    </mesh>
                </>
            )}

            {/* Cape for Royal */}
            {isRoyal && (
                <mesh position={[0, 0.7, -0.16]} rotation={[0.1, 0, 0]}>
                    <boxGeometry args={[0.4, 0.9, 0.05]} />
                    <meshStandardMaterial color="#7f1d1d" />
                </mesh>
            )}

            {/* Legs */}
            <mesh position={[-0.1, 0.2, 0]}>
                <boxGeometry args={[0.15, 0.4, 0.15]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
            <mesh position={[0.1, 0.2, 0]}>
                <boxGeometry args={[0.15, 0.4, 0.15]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>

            {/* Weapon */}
            <EquippedWeapon name={equipment?.weapon || "Fists"} />
        </group>
    )
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

// --- ENEMY TIMER COMPONENT ---
const EnemyTimer = ({ deadline }: { deadline: number }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = deadline - now;
            
            if (diff <= 0) {
                setTimeLeft("00:00:00");
                setIsUrgent(true);
                return;
            }

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            
            setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
            
            // Urgent if less than 1 hour or negative
            if (diff < 3600000) setIsUrgent(true);
            else setIsUrgent(false);

        }, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return (
        <Html position={[0, 3.5, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
            <div className={`
                flex items-center gap-1 px-3 py-1 rounded-full font-mono text-sm font-black tracking-widest backdrop-blur-md border-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] transition-all duration-500
                ${isUrgent 
                    ? 'bg-red-950/90 border-red-500 text-red-100 animate-pulse scale-110' 
                    : 'bg-black/80 border-stone-600 text-stone-200'}
            `}>
                <Clock size={12} className={isUrgent ? 'animate-spin' : ''} />
                {timeLeft}
            </div>
        </Html>
    );
}

const EnemyMesh = ({ priority, name, onClick, isSelected, scale = 1, archetype = 'MONSTER', subtaskCount = 0, race, failed, task }: { priority: TaskPriority, name: string, onClick?: () => void, isSelected?: boolean, scale?: number, archetype?: 'MONSTER' | 'KNIGHT', subtaskCount?: number, race?: string, failed?: boolean, task?: Task }) => {
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

            {/* COUNTDOWN TIMER OVERHEAD - RENDERED ALWAYS IF TASK EXISTS */}
            {task && !task.completed && !task.failed && <EnemyTimer deadline={task.deadline} />}

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
                position={[0, finalScale * 4.5, 0]} // Moved up to make room for Timer
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
                    {failed && <span className="text-[8px] bg-red-600 text-white px-1 mt-1 flex items-center gap-1"><AlertTriangle size={8} /> FAILED</span>}
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
