
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EntityType, Era, TaskPriority, NPC, RaceType } from '../../types';
import { HeroAvatar, BaseComplex, EnemyMesh, VillagerAvatar, MinionMesh, ForestStag, WolfConstruct, Crow } from './Assets';

interface EntityRendererProps {
  type: EntityType;
  variant?: Era | TaskPriority | NPC['role'] | string; 
  position: [number, number, number];
  name?: string;
  isDamaged?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  stats?: { hp: number, maxHp: number };
  winStreak?: number; 
  npcStatus?: NPC['status']; 
  scale?: number; 
  archetype?: 'MONSTER' | 'KNIGHT';
  race?: RaceType; 
  subtaskCount?: number;
  npcAction?: NPC['currentAction']; 
  failed?: boolean;
}

const MovingEntityWrapper = ({ children, initialPos, type, speed = 1 }: { children?: React.ReactNode, initialPos: [number,number,number], type: EntityType, speed?: number }) => {
    const group = useRef<THREE.Group>(null);
    const target = useRef(new THREE.Vector3(...initialPos));
    const [state, setState] = useState<'IDLE' | 'MOVING'>('IDLE');
    const waitTime = useRef(0);

    useFrame((_, delta) => {
        if (!group.current) return;
        
        // Simple breathing animation
        const breath = Math.sin(_.clock.elapsedTime * 2) * 0.05;
        group.current.scale.y = 1 + breath;

        // Only Villagers and Animals wander autonomously
        if (type !== EntityType.VILLAGER && type !== EntityType.ANIMAL) {
            // Smooth lerp to prop position update for non-autonomous entities (like Hero)
            group.current.position.lerp(new THREE.Vector3(...initialPos), delta * 2);
            return;
        }

        // Autonomous Wandering Logic
        if (state === 'IDLE') {
            waitTime.current -= delta;
            if (waitTime.current <= 0) {
                // Pick new target nearby original spawn to keep them local
                const range = type === EntityType.ANIMAL ? 15 : 8;
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * range;
                target.current.set(
                    initialPos[0] + Math.cos(angle) * dist,
                    0,
                    initialPos[2] + Math.sin(angle) * dist
                );
                setState('MOVING');
            }
        } else {
            const pos = group.current.position;
            const dist = pos.distanceTo(target.current);
            
            if (dist < 0.2) {
                setState('IDLE');
                waitTime.current = 2 + Math.random() * 5; // Wait 2-7 seconds
            } else {
                // Move towards target
                const dir = new THREE.Vector3().subVectors(target.current, pos).normalize();
                // Face target
                const lookTarget = new THREE.Vector3(target.current.x, pos.y, target.current.z);
                group.current.lookAt(lookTarget);
                
                // Move
                pos.add(dir.multiplyScalar(delta * speed));
            }
        }
    });

    return <group ref={group} position={initialPos}>{children}</group>;
}

export const EntityRenderer: React.FC<EntityRendererProps> = ({ type, variant, position, name, isDamaged, onClick, isSelected, stats, winStreak, npcStatus, scale, archetype, race, subtaskCount, npcAction, failed }) => {
  const content = useMemo(() => {
    switch (type) {
      case EntityType.HERO:
        return <HeroAvatar level={variant === Era.RUIN ? 0 : 3} winStreak={winStreak || 0} />;
      case EntityType.BUILDING_BASE:
        return <BaseComplex era={variant as Era} currentHp={stats?.hp || 100} maxHp={stats?.maxHp || 100} />;
      case EntityType.ENEMY:
        let visualArchetype = archetype || 'MONSTER';
        if (race === 'HUMAN' && archetype === 'KNIGHT') visualArchetype = 'KNIGHT';
        return <EnemyMesh priority={variant as TaskPriority} name={name || 'Unknown'} onClick={onClick} isSelected={isSelected} scale={scale} archetype={visualArchetype} subtaskCount={subtaskCount} race={race} failed={failed} />;
      case EntityType.MINION:
          return <MinionMesh />;
      case EntityType.VILLAGER:
        return <VillagerAvatar role={variant as NPC['role']} name={name || 'Villager'} status={npcStatus || 'ALIVE'} onClick={onClick} currentAction={npcAction} />;
      case EntityType.ANIMAL:
          if (variant === 'WOLF') return <WolfConstruct />;
          if (variant === 'CROW') return <Crow />;
          return <ForestStag />;
      default:
        return null;
    }
  }, [type, variant, name, isDamaged, onClick, isSelected, stats, winStreak, npcStatus, scale, archetype, race, subtaskCount, npcAction, failed]);

  if (type === EntityType.DECORATION_TREE || type === EntityType.DECORATION_ROCK) return null; // Handled by Scene Instances now

  return (
    <MovingEntityWrapper initialPos={position} type={type} speed={type === EntityType.ANIMAL ? 2 : 0.8}>
      {content}
    </MovingEntityWrapper>
  );
};
