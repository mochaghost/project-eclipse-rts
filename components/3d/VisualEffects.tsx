
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import { VisualEffect } from '../../types';

const FloatingText: React.FC<{ effect: VisualEffect }> = ({ effect }) => {
    let color = 'text-[#fbbf24]';
    let scale = 'scale(1)';
    let zIndex = 100;

    if (effect.type === 'TEXT_DAMAGE') color = 'text-red-600';
    if (effect.type === 'TEXT_GOLD') color = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    if (effect.type === 'TEXT_LOOT') {
        color = 'text-white drop-shadow-[0_0_15px_rgba(234,179,8,1)] text-lg';
        scale = 'scale(1.5)';
        zIndex = 200;
    }

    return (
        <Html position={[effect.position.x, effect.position.y, effect.position.z]} center zIndexRange={[zIndex, 0]}>
            <div className={`
                pointer-events-none text-2xl font-black font-serif tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]
                animate-float-up opacity-0 ${color}
            `} style={{ transform: scale }}>
                {effect.text}
            </div>
            <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(0.5); opacity: 0; }
                    20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                    100% { transform: translateY(-80px) scale(1); opacity: 0; }
                }
                .animate-float-up {
                    animation: floatUp 3s forwards ease-out; /* Slower animation for Loot */
                }
            `}</style>
        </Html>
    );
};

const Particle: React.FC<{ velocity: {x:number, y:number, z:number, rotX:number, rotY:number} }> = ({ velocity }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.x += velocity.x;
            ref.current.position.y += velocity.y;
            ref.current.position.z += velocity.z;
            ref.current.rotation.x += velocity.rotX;
            ref.current.rotation.y += velocity.rotY;
            ref.current.scale.multiplyScalar(0.95); 
            velocity.y -= 0.01;
        }
    });

    return (
        <mesh ref={ref}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
    );
};

const Explosion: React.FC<{ position: { x: number, y: number, z: number } }> = ({ position }) => {
    const velocities = useMemo(() => new Array(8).fill(0).map(() => ({ // Reduced count 12->8
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() * 0.4) + 0.1,
        z: (Math.random() - 0.5) * 0.3,
        rotX: Math.random() * 0.2,
        rotY: Math.random() * 0.2
    })), []);

    return (
        <group position={[position.x, position.y, position.z]}>
            {velocities.map((v, i) => <Particle key={i} velocity={v} />)}
        </group>
    )
}

const Shockwave: React.FC<{ position: { x: number, y: number, z: number } }> = ({ position }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.scale.multiplyScalar(1.05); // Expand
            const mat = ref.current.material as THREE.MeshBasicMaterial;
            if (mat.opacity > 0) mat.opacity -= delta * 0.8; // Fade
        }
    });

    return (
        <mesh ref={ref} position={[position.x, 0.5, position.z]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[1, 1.5, 32]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
    );
}

export const VisualEffectsRenderer: React.FC = () => {
    const { state } = useGame();
    
    // SAFETY LIMIT: Only render the last 8 text effects to prevent DOM overflow on mobile/iOS
    // This is crucial to prevent the "Bridge" crash in React Fiber on iOS
    const textEffects = state.effects.filter(e => e.type.startsWith('TEXT')).slice(-8);
    const explosions = state.effects.filter(e => e.type === 'EXPLOSION').slice(-4);
    const shockwaves = state.effects.filter(e => e.type === 'SHOCKWAVE').slice(-2);

    return (
        <>
            {textEffects.map(effect => (
                <FloatingText key={effect.id} effect={effect} />
            ))}
            {explosions.map(effect => (
                <Explosion key={effect.id} position={effect.position} />
            ))}
            {shockwaves.map(effect => (
                <Shockwave key={effect.id} position={effect.position} />
            ))}
        </>
    );
};
