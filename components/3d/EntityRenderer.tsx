
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EntityType, Era, TaskPriority, NPC, RaceType, Structures, HeroEquipment, Task } from '../../types';
import { HeroAvatar, BaseComplex, EnemyMesh, VillagerAvatar, MinionMesh, ForestStag, WolfConstruct, Crow } from './Assets';

interface EntityRendererProps {
  type: EntityType;
  variant?: Era | TaskPriority | NPC['role'] | string | number;
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
  structures?: Structures; 
  equipment?: HeroEquipment;
  task?: Task; // New Prop for passing task data to enemies
  isFuture?: boolean; // Prop to indicate future timeline status
}

// Moves entities randomly (Villagers, Animals)
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
            group.current.position.lerp(new THREE.Vector3(...initialPos), delta * 2);
            return;
        }

        // Autonomous Wandering Logic
        if (state === 'IDLE') {
            waitTime.current -= delta;
            if (waitTime.current <= 0) {
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
                waitTime.current = 2 + Math.random() * 5; 
            } else {
                const dir = new THREE.Vector3().subVectors(target.current, pos).normalize();
                const lookTarget = new THREE.Vector3(target.current.x, pos.y, target.current.z);
                group.current.lookAt(lookTarget);
                pos.add(dir.multiplyScalar(delta * speed));
            }
        }
    });

    return <group ref={group} position={initialPos}>{children}</group>;
}

// Moves Enemies closer to the center based on Deadline
const ApproachingEnemyWrapper = ({ children, initialPos, task }: { children?: React.ReactNode, initialPos: [number,number,number], task?: Task }) => {
    const group = useRef<THREE.Group>(null);
    
    // Constants for map size
    const SPAWN_RADIUS = 60; // Far edge of map
    const WALL_RADIUS = 8;   // Where the base walls are

    useFrame((_, delta) => {
        if (!group.current || !task) return;

        // Breathing animation
        const breath = Math.sin(_.clock.elapsedTime * 2) * 0.05;
        group.current.scale.y = 1 + breath;

        const now = Date.now();
        const startTime = task.startTime;
        const deadline = task.deadline;
        
        let targetRadius = SPAWN_RADIUS;

        if (now < startTime) {
            // Future Task: Stay at Spawn Radius (Spatial representation of Future Time)
            targetRadius = SPAWN_RADIUS;
        } else if (task.failed) {
            // If failed, they are bashing the walls
            targetRadius = WALL_RADIUS - 1; 
        } else if (task.completed) {
            // Should be removed, but just in case
            targetRadius = SPAWN_RADIUS;
        } else {
            // Calculate progress 0.0 to 1.0
            const totalDuration = Math.max(1, deadline - startTime);
            const elapsed = Math.max(0, now - startTime);
            const progress = Math.min(1, elapsed / totalDuration);
            
            // Linear interpolation from Spawn to Wall
            // Progress 0 = 60, Progress 1 = 8
            targetRadius = SPAWN_RADIUS - (progress * (SPAWN_RADIUS - WALL_RADIUS));
        }

        // Determine angle from initial Spawn Position (Keep them in their lane)
        const initialVector = new THREE.Vector3(...initialPos);
        const angle = Math.atan2(initialVector.z, initialVector.x);

        const targetX = Math.cos(angle) * targetRadius;
        const targetZ = Math.sin(angle) * targetRadius;
        const targetPos = new THREE.Vector3(targetX, 0, targetZ);

        // Move towards calculate position smoothly
        const currentPos = group.current.position;
        currentPos.lerp(targetPos, delta * 1); // Smooth movement updates

        // Always face the center (0,0,0)
        group.current.lookAt(0, 0, 0);
    });

    return <group ref={group} position={initialPos}>{children}</group>;
}

export const EntityRenderer: React.FC<EntityRendererProps> = ({ type, variant, position, name, isDamaged, onClick, isSelected, stats, winStreak, npcStatus, scale, archetype, race, subtaskCount, npcAction, failed, structures, equipment, task, isFuture }) => {
  const content = useMemo(() => {
    switch (type) {
      case EntityType.HERO:
        return <HeroAvatar level={typeof variant === 'number' ? variant : 1} equipment={equipment} />;
      case EntityType.BUILDING_BASE:
        return <BaseComplex era={variant as Era} currentHp={stats?.hp || 100} maxHp={stats?.maxHp || 100} structures={structures} />;
      case EntityType.ENEMY:
        let visualArchetype = archetype || 'MONSTER';
        if (race === 'HUMAN' && archetype === 'KNIGHT') visualArchetype = 'KNIGHT';
        // Pass task down to EnemyMesh for the Label, pass isFuture for styling
        return <EnemyMesh priority={variant as TaskPriority} name={name || 'Unknown'} onClick={onClick} isSelected={isSelected} scale={scale} archetype={visualArchetype} subtaskCount={subtaskCount} race={race} failed={failed} task={task} isFuture={isFuture} />;
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
  }, [type, variant, name, isDamaged, onClick, isSelected, stats, winStreak, npcStatus, scale, archetype, race, subtaskCount, npcAction, failed, structures, equipment, task, isFuture]);

  if (type === EntityType.DECORATION_TREE || type === EntityType.DECORATION_ROCK) return null;

  // VISUAL SYNC SAFEGUARD: Force hide enemy if task is completed
  if (type === EntityType.ENEMY && task && task.completed) {
      return null;
  }

  // Use specialized wrapper for Enemies to handle the "Approaching" mechanic
  if (type === EntityType.ENEMY && task) {
      return (
          <ApproachingEnemyWrapper initialPos={position} task={task}>
              {content}
          </ApproachingEnemyWrapper>
      )
  }

  return (
    <MovingEntityWrapper initialPos={position} type={type} speed={type === EntityType.ANIMAL ? 2 : 0.8}>
      {content}
    </MovingEntityWrapper>
  );
};
