
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, CameraShake, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import { VisionMirror } from './VisionMirror';
import { FACTIONS } from '../../constants';
import { playSfx } from '../../utils/audio';

// --- COMBAT UNIT (MELEE) ---

interface CombatUnitProps {
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    color: string;
    role: 'ATTACKER' | 'DEFENDER';
    onDeath: () => void;
    survives: boolean; // Pre-calculated deterministic outcome
    killDelay: number; // Time until death (or victory animation)
}

const CombatUnit: React.FC<CombatUnitProps> = ({ startPos, targetPos, color, role, onDeath, survives, killDelay }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [state, setState] = useState<'CHARGE' | 'FIGHT' | 'DEAD' | 'VICTORY'>('CHARGE');
    
    // Random offset for the "clash point" so they don't merge perfectly
    const clashOffset = useMemo(() => new THREE.Vector3(
        (Math.random() - 0.5) * 1.5, 
        0, 
        (Math.random() - 0.5) * 1.5
    ), []);

    const actualTarget = useMemo(() => targetPos.clone().add(clashOffset), [targetPos, clashOffset]);

    useEffect(() => {
        // Schedule death or victory
        const timer = setTimeout(() => {
            if (!survives) {
                setState('DEAD');
                onDeath(); // Trigger particle effect in parent
            } else {
                setState('VICTORY');
            }
        }, killDelay);
        return () => clearTimeout(timer);
    }, [killDelay, survives]);

    useFrame((_, delta) => {
        if (!meshRef.current || state === 'DEAD') return;

        const pos = meshRef.current.position;

        if (state === 'CHARGE') {
            const dir = new THREE.Vector3().subVectors(actualTarget, pos).normalize();
            const dist = pos.distanceTo(actualTarget);
            
            // Move
            pos.add(dir.multiplyScalar(delta * 6)); // Fast charge
            meshRef.current.lookAt(actualTarget);

            // Bounce
            meshRef.current.position.y = Math.abs(Math.sin(_.clock.elapsedTime * 15)) * 0.3;

            if (dist < 1.0) {
                setState('FIGHT');
            }
        }

        if (state === 'FIGHT') {
            // Combat wobble
            meshRef.current.rotation.y += Math.sin(_.clock.elapsedTime * 20) * 0.1;
            meshRef.current.position.z += Math.sin(_.clock.elapsedTime * 30) * 0.02;
            
            // Lunges
            if (Math.random() > 0.95) {
                meshRef.current.position.add(new THREE.Vector3(0, 0.2, 0));
                setTimeout(() => {
                    if (meshRef.current) meshRef.current.position.y = 0;
                }, 100);
            }
        }

        if (state === 'VICTORY') {
            // Jump for joy
            meshRef.current.position.y = Math.abs(Math.sin(_.clock.elapsedTime * 5));
        }
    });

    if (state === 'DEAD') {
        return (
            <group position={meshRef.current?.position || startPos}>
                <mesh rotation={[-Math.PI/2, 0, Math.random()]}>
                    <planeGeometry args={[0.8, 0.8]} />
                    <meshBasicMaterial color="#450a0a" transparent opacity={0.8} />
                </mesh>
                <mesh position={[0, 0.1, 0]} rotation={[Math.PI/2, 0, 0]}>
                    <boxGeometry args={[0.4, 0.2, 0.4]} />
                    <meshStandardMaterial color="#292524" />
                </mesh>
            </group>
        )
    }

    return (
        <group ref={meshRef} position={startPos}>
            {/* Unit Body */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.4, 0.8, 0.4]} />
                <meshStandardMaterial color={role === 'DEFENDER' ? '#1e3a8a' : color} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1, 0]}>
                <sphereGeometry args={[0.25]} />
                <meshStandardMaterial color={role === 'DEFENDER' ? '#93c5fd' : '#d6d3d1'} />
            </mesh>
            {/* Weapon */}
            <mesh position={[0.3, 0.6, 0.3]} rotation={[0.5, 0, 0]}>
                <boxGeometry args={[0.1, 0.1, 0.8]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            {role === 'DEFENDER' && (
                <mesh position={[-0.3, 0.6, 0]} rotation={[0, -0.5, 0]}>
                    <boxGeometry args={[0.1, 0.6, 0.6]} />
                    <meshStandardMaterial color="#1e40af" />
                </mesh>
            )}
        </group>
    );
};

const AshRain: React.FC = () => (
    <Sparkles count={500} scale={100} size={8} speed={0.4} opacity={0.5} color="#450a0a" />
);

export const VazarothEffects: React.FC = () => {
    const { state, addEffect, takeBaseDamage } = useGame();
    const event = state.activeMapEvent;
    const isCinematic = event === 'BATTLE_CINEMATIC';
    const isFearful = (state.realmStats?.fear || 0) > 70;

    // --- BATTLE ORCHESTRATOR ---
    // Instead of random effects, we spawn actual pairs of fighters
    const [combatPairs, setCombatPairs] = useState<any[]>([]);

    useEffect(() => {
        if (isCinematic) {
            playSfx('ERROR'); // War Horn

            // Determine Faction Color
            let factionColor = "#ef4444"; 
            const sortedFactions = [...state.factions].sort((a, b) => a.reputation - b.reputation);
            const primaryEnemy = sortedFactions[0];
            if (primaryEnemy && primaryEnemy.reputation < 0) {
                const def = FACTIONS[primaryEnemy.id as keyof typeof FACTIONS];
                if (def) factionColor = def.color;
            }

            // Generate Matchups
            const newPairs = [];
            const defenderCount = (state.minions?.length || 0) + 2; // Always at least 2 guards
            const attackerCount = Math.floor(5 + (state.playerLevel / 2)); // Scales with level

            // Create 1v1 duels
            const fights = Math.max(defenderCount, attackerCount);
            
            for (let i = 0; i < fights; i++) {
                const angle = (i / fights) * Math.PI * 2;
                const spawnDist = 30;
                
                // Attacker Start
                const attStart = new THREE.Vector3(Math.cos(angle) * spawnDist, 0, Math.sin(angle) * spawnDist);
                // Defender Start (From Base)
                const defStart = new THREE.Vector3(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);
                
                // Meeting Point
                const meetPoint = new THREE.Vector3(Math.cos(angle) * 10, 0, Math.sin(angle) * 10);

                // Determine Winner (Simulated)
                // If we have more defenders, defenders win more often
                const defenderWins = i < defenderCount && (Math.random() > 0.4 || defenderCount > attackerCount);
                
                // Death time (staggered between 4s and 9s)
                const deathTime = 4000 + (Math.random() * 5000);

                newPairs.push({
                    id: i,
                    attStart,
                    defStart,
                    meetPoint,
                    factionColor,
                    defenderWins,
                    deathTime
                });
            }
            setCombatPairs(newPairs);

            // Cleanup
            const endTimer = setTimeout(() => {
                setCombatPairs([]);
            }, 12000);
            return () => clearTimeout(endTimer);
        }
    }, [isCinematic, state.playerLevel, state.minions]);

    if (event === 'VISION_RITUAL') return <VisionMirror />;

    return (
        <group>
            {isFearful && <AshRain />}
            
            {(event === 'NIGHT_BATTLE' || isCinematic) && (
                <group>
                    <fogExp2 attach="fog" args={['#1a0505', 0.08]} />
                    <CameraShake maxPitch={0.05} maxRoll={0.05} maxYaw={0.05} intensity={isCinematic ? 2 : 1} />
                    <SpotLight position={[0, 50, 0]} target-position={[0, 0, 0]} color="#ef4444" intensity={5} angle={0.8} />
                </group>
            )}

            {isCinematic && combatPairs.map(pair => (
                <group key={pair.id}>
                    {/* Attacker */}
                    <CombatUnit 
                        startPos={pair.attStart} 
                        targetPos={pair.meetPoint} 
                        color={pair.factionColor} 
                        role="ATTACKER"
                        survives={!pair.defenderWins}
                        killDelay={pair.deathTime}
                        onDeath={() => {
                            addEffect('EXPLOSION', pair.meetPoint);
                            addEffect('TEXT_XP', {x: pair.meetPoint.x, y: 3, z: pair.meetPoint.z}, "ENEMY SLAIN");
                        }}
                    />
                    {/* Defender */}
                    <CombatUnit 
                        startPos={pair.defStart} 
                        targetPos={pair.meetPoint} 
                        color="#3b82f6" 
                        role="DEFENDER"
                        survives={pair.defenderWins}
                        killDelay={pair.deathTime} // Same delay, synced fight
                        onDeath={() => {
                            addEffect('SPLAT_TOMATO', pair.meetPoint); // Blood splat on screen
                            addEffect('TEXT_DAMAGE', {x: pair.meetPoint.x, y: 3, z: pair.meetPoint.z}, "GUARD FELL");
                        }}
                    />
                </group>
            ))}

            {event === 'TITAN_GAZE' && (
                <group>
                    <SpotLight position={[0, 40, -100]} target-position={[4, 0, 4]} color="#ff0000" intensity={15} angle={0.15} castShadow />
                    <fogExp2 attach="fog" args={['#2a0505', 0.04]} />
                </group>
            )}
        </group>
    );
};
