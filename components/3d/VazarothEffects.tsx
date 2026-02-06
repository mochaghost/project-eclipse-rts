
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, CameraShake, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import { VisionMirror } from './VisionMirror';
import { FACTIONS } from '../../constants';

// --- SIEGE MOB MECHANICS ---

interface SiegeMobProps {
    spawnPosition: [number, number, number];
    targetPosition: [number, number, number];
    onHit: (type: 'PROJECTILE' | 'MELEE', damage: number) => void;
    factionColor: string;
    wallLevel: number; // 0 to 3
}

const SiegeMob: React.FC<SiegeMobProps> = ({ spawnPosition, targetPosition, onHit, factionColor, wallLevel }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [phase, setPhase] = useState<'CHARGE' | 'ATTACK' | 'RETREAT'>('CHARGE');
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
                    if (isFutile) {
                        // Attack does nothing
                        onHit('PROJECTILE', 0); // 0 damage triggers "Shield Block" effect in parent
                        // Retreat immediately if futile
                        setPhase('RETREAT');
                    } else {
                        // Attack hits
                        onHit('PROJECTILE', attackStrength.current);
                        attackCount.current += 1;
                        
                        // Continue attacking if brave enough
                        if (attackCount.current > 3) {
                            setPhase('RETREAT'); // Eventually leave
                        } else {
                            // Reset for next throw
                            throwProgress.current = 0;
                        }
                    }
                }
            }
        }

        if (phase === 'RETREAT') {
            const away = new THREE.Vector3().subVectors(currentPos, target).normalize();
            currentPos.add(away.multiplyScalar(delta * (speed.current * 1.5))); // Run away fast
            meshRef.current.lookAt(currentPos.clone().add(away));
            
            if (dist > 50) {
                meshRef.current.visible = false;
            }
        }
    });

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
    
    const isFearful = (state.realmStats?.fear || 0) > 70;

    // Generate Mob Spawn Points
    const mobSpawns = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2;
            return [Math.cos(angle) * 40, 0, Math.sin(angle) * 40] as [number, number, number];
    }), [event]); 

    if (event === 'VISION_RITUAL') return <VisionMirror />;
    
    // Determine Faction Color for Siege
    let factionColor = "#ef4444"; // Default Red (Vazaroth)
    if (event === 'FACTION_SIEGE' || event === 'NIGHT_BATTLE') {
        const hostile = state.factions.filter(f => f.reputation < 0);
        if (hostile.length > 0) {
            // Pick based on time/random seeded by event
            const f = hostile[Math.floor(Date.now() / 10000) % hostile.length];
            const def = FACTIONS[f.id as keyof typeof FACTIONS];
            if (def) factionColor = def.color;
        }
    }

    return (
        <group>
            {isFearful && <AshRain />}
            
            {/* NIGHT BATTLE INTENSITY */}
            {event === 'NIGHT_BATTLE' && (
                <group>
                    <fogExp2 attach="fog" args={['#1a0505', 0.08]} />
                    <CameraShake maxPitch={0.05} maxRoll={0.05} maxYaw={0.05} intensity={1} />
                    <SpotLight position={[0, 50, 0]} target-position={[0, 0, 0]} color="#ff0000" intensity={10} angle={0.5} />
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
            {(event === 'FACTION_SIEGE' || event === 'PEASANT_RAID' || event === 'NIGHT_BATTLE') && (
                 <group>
                     {mobSpawns.map((spawnPos, i) => (
                         <SiegeMob 
                            key={`siege-${i}`} 
                            spawnPosition={spawnPos} 
                            targetPosition={[0, 0, 0]} 
                            factionColor={factionColor}
                            wallLevel={state.structures.wallsLevel || 0}
                            onHit={(type, dmg) => {
                                if (dmg > 0) {
                                    addEffect('EXPLOSION', { x: 0, y: 1, z: 0 });
                                    addEffect('TEXT_DAMAGE', { x: (Math.random()-0.5)*2, y: 3, z: (Math.random()-0.5)*2 }, `-${Math.floor(dmg)}`);
                                    takeBaseDamage(dmg, "Siege");
                                } else {
                                    // Deflected!
                                    addEffect('TEXT_XP', { x: (Math.random()-0.5)*4, y: 4, z: (Math.random()-0.5)*4 }, "BLOCKED");
                                    // TODO: Add shield visual effect if possible
                                }
                            }} 
                         />
                     ))}
                 </group>
            )}
        </group>
    );
};
