
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, CameraShake, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import { VisionMirror } from './VisionMirror';

// --- PEASANT MOB MECHANICS ---

interface PeasantMobProps {
    spawnPosition: [number, number, number];
    targetPosition: [number, number, number];
    onHit: (type: 'TOMATO' | 'ROCK') => void;
}

const PeasantMob: React.FC<PeasantMobProps> = ({ spawnPosition, targetPosition, onHit }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [phase, setPhase] = useState<'CHARGE' | 'THROW' | 'RETREAT'>('CHARGE');
    const [projectile, setProjectile] = useState<'NONE' | 'TOMATO' | 'ROCK'>('NONE');
    const projectileRef = useRef<THREE.Mesh>(null);
    const throwProgress = useRef(0);
    const speed = useRef(Math.random() * 2 + 3);
    
    // Choose ammo once
    const ammoType = useRef<'TOMATO' | 'ROCK'>(Math.random() > 0.5 ? 'TOMATO' : 'ROCK');

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const currentPos = meshRef.current.position;
        const target = new THREE.Vector3(...targetPosition);

        // Calculate distance to the Village Center (Base)
        const dist = currentPos.distanceTo(target);

        if (phase === 'CHARGE') {
            const dir = new THREE.Vector3().subVectors(target, currentPos).normalize();
            
            currentPos.add(dir.multiplyScalar(delta * speed.current));
            currentPos.y = Math.abs(Math.sin(state.clock.elapsedTime * 15)) * 0.2; // Bobbing
            meshRef.current.lookAt(target);

            // Stop at 6 units form center (Edge of the base) to throw
            if (dist < 6) { 
                setPhase('THROW');
                setProjectile(ammoType.current);
            }
        }

        if (phase === 'THROW') {
            if (projectileRef.current) {
                projectileRef.current.visible = true;
                throwProgress.current += delta * 3; // Throw speed
                
                // Parabolic Arc to the Base Center
                const start = new THREE.Vector3(0, 1, 0).applyMatrix4(meshRef.current.matrixWorld);
                // Aim somewhat randomly at the base structure height
                const end = new THREE.Vector3(target.x + (Math.random()-0.5), target.y + 1 + Math.random(), target.z + (Math.random()-0.5)); 
                
                const pos = new THREE.Vector3().lerpVectors(start, end, throwProgress.current);
                pos.y += Math.sin(throwProgress.current * Math.PI) * 2; // Arc height
                
                projectileRef.current.position.copy(pos);

                if (throwProgress.current >= 1) {
                    onHit(ammoType.current);
                    projectileRef.current.visible = false;
                    setPhase('RETREAT');
                }
            }
        }

        if (phase === 'RETREAT') {
            const away = new THREE.Vector3().subVectors(currentPos, target).normalize();
            currentPos.add(away.multiplyScalar(delta * (speed.current * 1.5)));
            meshRef.current.lookAt(currentPos.clone().add(away));
            
            if (dist > 40) {
                meshRef.current.visible = false;
            }
        }
    });

    return (
        <>
            <group ref={meshRef} position={spawnPosition}>
                {/* Peasant Body */}
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.2, 0.3, 1, 6]} />
                    <meshStandardMaterial color="#57534e" />
                </mesh>
                {/* Head */}
                <mesh position={[0, 1.1, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshStandardMaterial color="#d6d3d1" />
                </mesh>
                {/* Hood */}
                <mesh position={[0, 1.1, 0]} scale={[1.1, 1.1, 1.1]}>
                    <dodecahedronGeometry args={[0.2]} />
                    <meshStandardMaterial color="#44403c" side={THREE.DoubleSide} />
                </mesh>
            </group>
            
            {/* Projectile */}
            <mesh ref={projectileRef} visible={false}>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial color={ammoType.current === 'TOMATO' ? '#ef4444' : '#78716c'} />
            </mesh>
        </>
    )
}

const AshRain: React.FC = () => (
    <Sparkles count={500} scale={100} size={8} speed={0.4} opacity={0.5} color="#450a0a" />
);

export const VazarothEffects: React.FC = () => {
    const { state, addEffect } = useGame();
    const event = state.activeMapEvent;
    
    // Check Fear stat
    const isFearful = (state.realmStats?.fear || 0) > 70;

    const mobSpawns = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => {
            const angle = (i / 7) * Math.PI * 2;
            return [Math.cos(angle) * 30, 0, Math.sin(angle) * 30] as [number, number, number];
    }), [event]); 

    if (event === 'VISION_RITUAL') return <VisionMirror />;
    
    return (
        <group>
            {isFearful && <AshRain />}
            
            {event === 'TITAN_GAZE' && (
                <group>
                    <SpotLight position={[0, 40, -100]} target-position={[4, 0, 4]} color="#ff0000" intensity={15} angle={0.15} castShadow />
                    <fogExp2 attach="fog" args={['#2a0505', 0.04]} />
                    <CameraShake maxPitch={0.01} maxRoll={0.01} maxYaw={0.01} intensity={0.5} />
                </group>
            )}

            {/* Vazaroth sends the plebs to humiliate you by attacking your VILLAGE [0,0,0] */}
            {(event === 'PEASANT_RAID' || event === 'MOCKING_RAID') && (
                 <group>
                     {mobSpawns.map((spawnPos, i) => (
                         <PeasantMob 
                            key={`peasant-${i}`} 
                            spawnPosition={spawnPos} 
                            targetPosition={[0, 0, 0]} // Target the BASE, not the camera
                            onHit={(type) => {
                                // Add visible effect at the base impact point
                                addEffect('EXPLOSION', { x: 0, y: 1, z: 0 });
                                if (type === 'TOMATO') {
                                    // Maybe a text pop up saying "Disgrace!"
                                    addEffect('TEXT_DAMAGE', { x: 0, y: 3, z: 0 }, "DISGRACE!");
                                }
                            }} 
                         />
                     ))}
                 </group>
            )}
        </group>
    );
};
