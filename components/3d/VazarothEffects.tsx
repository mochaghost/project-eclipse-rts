
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, CameraShake, SpotLight, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import { VisionMirror } from './VisionMirror';
import { FACTIONS } from '../../constants';
import { playSfx } from '../../utils/audio';

// --- BATTLE VISUAL COMPONENTS ---

const DefenseProjectile: React.FC<{ start: THREE.Vector3, end: THREE.Vector3, color: string, delay: number }> = ({ start, end, color, delay }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [active, setActive] = useState(false);
    const progress = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => setActive(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    useFrame((_, delta) => {
        if (!active || !meshRef.current) return;
        progress.current += delta * 2; // Speed
        
        if (progress.current >= 1) {
            setActive(false); // Hit
            return;
        }

        const pos = new THREE.Vector3().lerpVectors(start, end, progress.current);
        pos.y += Math.sin(progress.current * Math.PI) * 3; // Arc
        meshRef.current.position.copy(pos);
    });

    if (!active) return null;

    return (
        <mesh ref={meshRef} position={start}>
            <sphereGeometry args={[0.2]} />
            <meshBasicMaterial color={color} />
            <Trail width={0.5} length={4} color={new THREE.Color(color)} attenuation={(t) => t * t} />
        </mesh>
    );
};

const HeroUltimate: React.FC<{ type: 'SMITE' | 'NOVA' | 'ARROWS' }> = ({ type }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if(ref.current) {
            ref.current.rotation.y += delta * 5;
            ref.current.scale.multiplyScalar(1.05);
        }
    });

    if (type === 'SMITE') {
        return (
            <group position={[0, 0, 0]}>
                <mesh position={[0, 10, 0]}>
                    <cylinderGeometry args={[0.5, 4, 20]} />
                    <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
                </mesh>
                <Sparkles count={50} scale={10} color="yellow" speed={2} />
            </group>
        )
    }
    
    // NOVA (Shockwave)
    return (
        <group ref={ref} position={[0, 1, 0]}>
            <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[4, 5, 32]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} />
            </mesh>
        </group>
    )
};

// --- SIEGE MOB MECHANICS ---

interface SiegeMobProps {
    spawnPosition: [number, number, number];
    targetPosition: [number, number, number];
    onHit: (type: 'PROJECTILE' | 'MELEE', damage: number) => void;
    factionColor: string;
    wallLevel: number; // 0 to 3
    isCinematic?: boolean; // New prop for battle mode
}

const SiegeMob: React.FC<SiegeMobProps> = ({ spawnPosition, targetPosition, onHit, factionColor, wallLevel, isCinematic }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [phase, setPhase] = useState<'CHARGE' | 'ATTACK' | 'RETREAT' | 'DIE'>('CHARGE');
    const [projectile, setProjectile] = useState(false);
    const projectileRef = useRef<THREE.Mesh>(null);
    const throwProgress = useRef(0);
    const speed = useRef(Math.random() * 2 + 4);
    const attackCount = useRef(0);
    
    // Determine Attack Strength based on randomness (simulates different unit ranks)
    const attackStrength = useRef(10 + Math.random() * 20); 
    const defense = wallLevel * 10; // 0, 10, 20, 30

    // Is this unit strong enough to hurt the wall?
    const isFutile = defense > attackStrength.current;

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        if (phase === 'DIE') {
            meshRef.current.scale.multiplyScalar(0.9);
            meshRef.current.rotation.x += 0.1;
            if (meshRef.current.scale.x < 0.1) meshRef.current.visible = false;
            return;
        }

        const currentPos = meshRef.current.position;
        const target = new THREE.Vector3(...targetPosition);
        const dist = currentPos.distanceTo(target);

        if (phase === 'CHARGE') {
            const dir = new THREE.Vector3().subVectors(target, currentPos).normalize();
            currentPos.add(dir.multiplyScalar(delta * speed.current));
            currentPos.y = Math.abs(Math.sin(state.clock.elapsedTime * 15)) * 0.2; // Running bob
            meshRef.current.lookAt(target);

            // Stop at wall range (radius 8 for base)
            if (dist < 8) { 
                setPhase('ATTACK');
                setProjectile(true);
            }
        }

        if (phase === 'ATTACK') {
            if (projectileRef.current) {
                projectileRef.current.visible = true;
                throwProgress.current += delta * 2.5; 
                
                // Arc calculation
                const start = new THREE.Vector3(0, 1, 0).applyMatrix4(meshRef.current.matrixWorld);
                const end = new THREE.Vector3(target.x + (Math.random()-0.5), target.y + 2 + Math.random(), target.z + (Math.random()-0.5)); 
                
                const pos = new THREE.Vector3().lerpVectors(start, end, throwProgress.current);
                pos.y += Math.sin(throwProgress.current * Math.PI) * 2; 
                
                projectileRef.current.position.copy(pos);

                if (throwProgress.current >= 1) {
                    // Impact!
                    if (isFutile && !isCinematic) { // In cinematic, we allow chaos regardless of outcome
                        onHit('PROJECTILE', 0); 
                        setPhase('RETREAT');
                    } else {
                        onHit('PROJECTILE', attackStrength.current);
                        attackCount.current += 1;
                        if (attackCount.current > 3 && !isCinematic) {
                            setPhase('RETREAT'); 
                        } else {
                            throwProgress.current = 0;
                        }
                    }
                }
            }
        }

        if (phase === 'RETREAT') {
            const away = new THREE.Vector3().subVectors(currentPos, target).normalize();
            currentPos.add(away.multiplyScalar(delta * (speed.current * 1.5))); 
            meshRef.current.lookAt(currentPos.clone().add(away));
            if (dist > 50) meshRef.current.visible = false;
        }
    });

    // Kill trigger for Cinematic
    useEffect(() => {
        if (isCinematic) {
            // Random death time between 6s and 9s (Hero Ult phase)
            const deathTimer = setTimeout(() => {
                if(Math.random() > 0.3) setPhase('DIE');
                else setPhase('RETREAT');
            }, 6000 + Math.random() * 3000);
            return () => clearTimeout(deathTimer);
        }
    }, [isCinematic]);

    return (
        <>
            <group ref={meshRef} position={spawnPosition}>
                {/* Body */}
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.3, 0.6, 0.3]} />
                    <meshStandardMaterial color={factionColor} />
                </mesh>
                {/* Head */}
                <mesh position={[0, 0.9, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshStandardMaterial color="#d6d3d1" />
                </mesh>
                {/* Weapon Arm */}
                <mesh position={[0.25, 0.6, 0.2]} rotation={[0.5, 0, 0]}>
                    <boxGeometry args={[0.1, 0.1, 0.6]} />
                    <meshStandardMaterial color="#57534e" />
                </mesh>
            </group>
            
            {/* Projectile (Rock/Fireball) */}
            <mesh ref={projectileRef} visible={false}>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial color={factionColor === '#000000' ? '#a855f7' : '#ef4444'} emissiveIntensity={0.5} />
            </mesh>
        </>
    )
}

const AshRain: React.FC = () => (
    <Sparkles count={500} scale={100} size={8} speed={0.4} opacity={0.5} color="#450a0a" />
);

export const VazarothEffects: React.FC = () => {
    const { state, addEffect, takeBaseDamage } = useGame();
    const event = state.activeMapEvent;
    const isCinematic = event === 'BATTLE_CINEMATIC';
    const isFearful = (state.realmStats?.fear || 0) > 70;

    // --- BATTLE SEQUENCER ---
    const [ultActive, setUltActive] = useState(false);
    const [defenseVolley, setDefenseVolley] = useState<any[]>([]);

    useEffect(() => {
        if (isCinematic) {
            // 1. Audio Start
            playSfx('ERROR'); 

            // 2. Defense Volley Sequence (3s - 6s)
            const volleyTimer = setTimeout(() => {
                playSfx('UI_CLICK'); // Arrows firing sound placeholder
                // Spawn 20 projectiles targeting random directions
                const projectiles = Array.from({length: 20}).map((_, i) => ({
                    id: i,
                    start: new THREE.Vector3(0, 3, 0),
                    end: new THREE.Vector3((Math.random()-0.5)*40, 0, (Math.random()-0.5)*40),
                    delay: Math.random() * 2000,
                    color: state.playerLevel > 20 ? '#3b82f6' : '#fff' // Blue magic vs arrows
                }));
                setDefenseVolley(projectiles);
            }, 3000);

            // 3. Hero Ultimate (6s)
            const ultTimer = setTimeout(() => {
                setUltActive(true);
                playSfx('MAGIC');
                addEffect('EXPLOSION', {x:0, y:2, z:0});
            }, 6000);

            // Cleanup
            const endTimer = setTimeout(() => {
                setUltActive(false);
                setDefenseVolley([]);
            }, 10000);

            return () => {
                clearTimeout(volleyTimer);
                clearTimeout(ultTimer);
                clearTimeout(endTimer);
                setUltActive(false);
                setDefenseVolley([]);
            };
        }
    }, [isCinematic, state.playerLevel]);

    // Generate Mob Spawn Points
    const mobSpawns = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2;
            return [Math.cos(angle) * 40, 0, Math.sin(angle) * 40] as [number, number, number];
    }), [event]); // Re-roll positions on new event

    if (event === 'VISION_RITUAL') return <VisionMirror />;
    
    // Determine Faction Color for Siege
    let factionColor = "#ef4444"; // Default Red (Vazaroth)
    
    if (event === 'FACTION_SIEGE' || event === 'NIGHT_BATTLE' || isCinematic) {
        const sortedFactions = [...state.factions].sort((a, b) => a.reputation - b.reputation);
        const primaryEnemy = sortedFactions[0];
        
        if (primaryEnemy && primaryEnemy.reputation < 0) {
            const def = FACTIONS[primaryEnemy.id as keyof typeof FACTIONS];
            if (def) factionColor = def.color;
        }
    }

    return (
        <group>
            {isFearful && <AshRain />}
            
            {/* NIGHT BATTLE INTENSITY */}
            {(event === 'NIGHT_BATTLE' || isCinematic) && (
                <group>
                    <fogExp2 attach="fog" args={['#1a0505', 0.08]} />
                    <CameraShake 
                        maxPitch={0.05} maxRoll={0.05} maxYaw={0.05} 
                        intensity={isCinematic ? 2 : 1} // Double shake in cinematic
                        decay={isCinematic ? false : true}
                    />
                    <SpotLight position={[0, 50, 0]} target-position={[0, 0, 0]} color={factionColor} intensity={10} angle={0.5} />
                </group>
            )}

            {/* CINEMATIC EFFECTS */}
            {isCinematic && (
                <group>
                    {/* Defense Projectiles */}
                    {defenseVolley.map(p => (
                        <DefenseProjectile key={p.id} start={p.start} end={p.end} color={p.color} delay={p.delay} />
                    ))}
                    
                    {/* Hero Ultimate */}
                    {ultActive && (
                        <HeroUltimate type={state.playerLevel > 40 ? 'SMITE' : 'NOVA'} />
                    )}
                </group>
            )}

            {event === 'TITAN_GAZE' && (
                <group>
                    <SpotLight position={[0, 40, -100]} target-position={[4, 0, 4]} color="#ff0000" intensity={15} angle={0.15} castShadow />
                    <fogExp2 attach="fog" args={['#2a0505', 0.04]} />
                    <CameraShake maxPitch={0.01} maxRoll={0.01} maxYaw={0.01} intensity={0.5} />
                </group>
            )}

            {/* SIEGE MECHANIC */}
            {(event === 'FACTION_SIEGE' || event === 'PEASANT_RAID' || event === 'NIGHT_BATTLE' || isCinematic) && (
                 <group>
                     {mobSpawns.map((spawnPos, i) => (
                         <SiegeMob 
                            key={`siege-${i}`} 
                            spawnPosition={spawnPos} 
                            targetPosition={[0, 0, 0]} 
                            factionColor={factionColor}
                            wallLevel={state.structures.wallsLevel || 0}
                            isCinematic={isCinematic} // Pass cinematic flag to control death/behavior
                            onHit={(type, dmg) => {
                                // Only take real damage if NOT cinematic, or add specific cinematic logic
                                if (!isCinematic) {
                                    if (dmg > 0) {
                                        addEffect('EXPLOSION', { x: 0, y: 1, z: 0 });
                                        addEffect('TEXT_DAMAGE', { x: (Math.random()-0.5)*2, y: 3, z: (Math.random()-0.5)*2 }, `-${Math.floor(dmg)}`);
                                        takeBaseDamage(dmg, "Siege");
                                    } else {
                                        addEffect('TEXT_XP', { x: (Math.random()-0.5)*4, y: 4, z: (Math.random()-0.5)*4 }, "BLOCKED");
                                    }
                                } else {
                                    // Visuals only for cinematic
                                    addEffect('EXPLOSION', { x: (Math.random()-0.5)*2, y: 1, z: (Math.random()-0.5)*2 });
                                }
                            }} 
                         />
                     ))}
                 </group>
            )}
        </group>
    );
};
