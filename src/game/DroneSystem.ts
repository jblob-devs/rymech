import { Drone, DroneType, Vector2, Enemy, Projectile } from '../types/game';
import { generateId, vectorDistance, vectorNormalize, vectorSubtract, vectorScale, vectorAdd } from './utils';

export type DroneShape = 'circle' | 'triangle' | 'square' | 'hexagon' | 'diamond' | 'cross' | 'star';

export interface DroneDefinition {
  type: DroneType;
  name: string;
  description: string;
  canAttack: boolean;
  damage: number;
  fireRate: number;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  shape: DroneShape;
  color: string;
  secondaryColor: string;
  detectionRadius: number;
  projectileSpeed: number;
  projectileSize: number;
  projectileColor: string;
  passiveEffect?: string;
  passiveEffectValue?: number;
  activeEffect?: string;
  activeTrigger?: 'shoot' | 'dash' | 'weaponSwap' | 'takeDamage' | 'manual';
  activeEffectDuration?: number;
  activeEffectCooldown?: number;
}

export const DRONE_DEFINITIONS: Record<DroneType, DroneDefinition> = {
  assault_drone: {
    type: 'assault_drone',
    name: 'Assault Drone',
    description: 'Aggressive drone that fires rapid projectiles at enemies',
    canAttack: true,
    damage: 5,
    fireRate: 0.5,
    orbitRadius: 85,
    orbitSpeed: 2.0,
    size: 7,
    shape: 'diamond',
    color: '#ef4444',
    secondaryColor: '#dc2626',
    detectionRadius: 300,
    projectileSpeed: 12,
    projectileSize: 6,
    projectileColor: '#f87171',
    passiveEffect: '+15% damage to all player weapons',
    passiveEffectValue: 0.15,
    activeEffect: 'Manual: +100% fire rate for 3s',
    activeTrigger: 'manual',
    activeEffectDuration: 3,
    activeEffectCooldown: 10,
  },
  shield_drone: {
    type: 'shield_drone',
    name: 'Shield Drone',
    description: 'Defensive drone that absorbs damage for the player',
    canAttack: false,
    damage: 0,
    fireRate: 1.0,
    orbitRadius: 80,
    orbitSpeed: 1.5,
    size: 8,
    shape: 'hexagon',
    color: '#3b82f6',
    secondaryColor: '#2563eb',
    detectionRadius: 250,
    projectileSpeed: 0,
    projectileSize: 0,
    projectileColor: '#60a5fa',
    passiveEffect: '10% damage reduction',
    passiveEffectValue: 0.10,
    activeEffect: '50% damage reduction at <50% HP',
    activeTrigger: 'takeDamage',
    activeEffectDuration: 4,
    activeEffectCooldown: 30,
  },
  repair_drone: {
    type: 'repair_drone',
    name: 'Repair Drone',
    description: 'Support drone that slowly repairs player health',
    canAttack: false,
    damage: 0,
    fireRate: 0,
    orbitRadius: 90,
    orbitSpeed: 1.8,
    size: 7,
    shape: 'cross',
    color: '#10b981',
    secondaryColor: '#059669',
    detectionRadius: 200,
    projectileSpeed: 0,
    projectileSize: 0,
    projectileColor: '#34d399',
    passiveEffect: 'Regenerates 1 HP every 3 seconds',
    passiveEffectValue: 0.333,
    activeEffect: 'Auto: Stand still 3s to heal 15 HP max',
    activeTrigger: 'manual',
    activeEffectDuration: 5,
    activeEffectCooldown: 20,
  },
  scout_drone: {
    type: 'scout_drone',
    name: 'Scout Drone',
    description: 'Fast drone with extended detection range',
    canAttack: false,
    damage: 0,
    fireRate: 0,
    orbitRadius: 110,
    orbitSpeed: 3.0,
    size: 6,
    shape: 'triangle',
    color: '#f59e0b',
    secondaryColor: '#d97706',
    detectionRadius: 500,
    projectileSpeed: 0,
    projectileSize: 0,
    projectileColor: '#fbbf24',
    passiveEffect: '+33% speed when not shooting (3s)',
    passiveEffectValue: 0.33,
    activeEffect: 'Radar stealth: Invisible + reduced detection',
    activeTrigger: 'manual',
    activeEffectDuration: 8,
    activeEffectCooldown: 20,
  },
  plasma_drone: {
    type: 'plasma_drone',
    name: 'Plasma Drone',
    description: 'Fires laser beams at enemies with powerful beam attack',
    canAttack: true,
    damage: 3,
    fireRate: 0.15,
    orbitRadius: 95,
    orbitSpeed: 2.2,
    size: 7,
    shape: 'diamond',
    color: '#8b5cf6',
    secondaryColor: '#7c3aed',
    detectionRadius: 320,
    projectileSpeed: 25,
    projectileSize: 4,
    projectileColor: '#a78bfa',
    passiveEffect: 'Fires continuous laser beams',
    passiveEffectValue: 1,
    activeEffect: 'Manual: Large beam laser for 4s',
    activeTrigger: 'manual',
    activeEffectDuration: 4,
    activeEffectCooldown: 14,
  },
  cryo_drone: {
    type: 'cryo_drone',
    name: 'Cryo Drone',
    description: 'Slows enemies with freezing projectiles',
    canAttack: true,
    damage: 4,
    fireRate: 0.9,
    orbitRadius: 88,
    orbitSpeed: 1.9,
    size: 7,
    shape: 'hexagon',
    color: '#06b6d4',
    secondaryColor: '#0891b2',
    detectionRadius: 280,
    projectileSpeed: 11,
    projectileSize: 7,
    projectileColor: '#22d3ee',
    passiveEffect: 'Drone shots slow enemies by 30% for 2s',
    passiveEffectValue: 0.30,
    activeEffect: 'Slowing bomb: Creates slowing area',
    activeTrigger: 'manual',
    activeEffectDuration: 6,
    activeEffectCooldown: 18,
  },
  explosive_drone: {
    type: 'explosive_drone',
    name: 'Explosive Drone',
    description: 'Launches explosive rounds that deal area damage',
    canAttack: true,
    damage: 10,
    fireRate: 1.8,
    orbitRadius: 86,
    orbitSpeed: 1.7,
    size: 8,
    shape: 'square',
    color: '#f97316',
    secondaryColor: '#ea580c',
    detectionRadius: 290,
    projectileSpeed: 9,
    projectileSize: 9,
    projectileColor: '#fb923c',
    passiveEffect: 'Drone shots explode for AoE damage',
    passiveEffectValue: 1,
    activeEffect: 'Giant projectile, reactivate to explode',
    activeTrigger: 'manual',
    activeEffectDuration: 8,
    activeEffectCooldown: 22,
  },
  emp_drone: {
    type: 'emp_drone',
    name: 'EMP Drone',
    description: 'Disrupts enemy shields and systems with EMP',
    canAttack: true,
    damage: 8,
    fireRate: 3.0,
    orbitRadius: 92,
    orbitSpeed: 2.1,
    size: 7,
    shape: 'cross',
    color: '#eab308',
    secondaryColor: '#ca8a04',
    detectionRadius: 310,
    projectileSpeed: 13,
    projectileSize: 6,
    projectileColor: '#fde047',
    passiveEffect: 'Shots disable enemies for 1s with EMP',
    passiveEffectValue: 1,
    activeEffect: 'Auto: EMP blast at 75%/50%/25% HP',
    activeTrigger: 'takeDamage',
    activeEffectDuration: 1,
    activeEffectCooldown: 1,
  },
  sniper_drone: {
    type: 'sniper_drone',
    name: 'Sniper Drone',
    description: 'Precise long-range shots with high damage',
    canAttack: true,
    damage: 15,
    fireRate: 2.5,
    orbitRadius: 115,
    orbitSpeed: 1.4,
    size: 6,
    shape: 'triangle',
    color: '#64748b',
    secondaryColor: '#475569',
    detectionRadius: 500,
    projectileSpeed: 20,
    projectileSize: 5,
    projectileColor: '#94a3b8',
    passiveEffect: '+30% critical hit chance for player weapons',
    passiveEffectValue: 0.30,
    activeEffect: 'Tactical: -50% speed, +100% dmg/range',
    activeTrigger: 'manual',
    activeEffectDuration: 6,
    activeEffectCooldown: 20,
  },
  laser_drone: {
    type: 'laser_drone',
    name: 'Laser Drone',
    description: 'Continuous laser beam that tracks enemies',
    canAttack: true,
    damage: 3,
    fireRate: 0.1,
    orbitRadius: 94,
    orbitSpeed: 2.0,
    size: 7,
    shape: 'diamond',
    color: '#ec4899',
    secondaryColor: '#db2777',
    detectionRadius: 300,
    projectileSpeed: 25,
    projectileSize: 4,
    projectileColor: '#f472b6',
    passiveEffect: 'Continuous beam, damage ramps over time',
    passiveEffectValue: 1,
    activeEffect: 'Overload: Triple damage for 5 seconds',
    activeTrigger: 'shoot',
    activeEffectDuration: 5,
    activeEffectCooldown: 15,
  },
  swarm_drone: {
    type: 'swarm_drone',
    name: 'Swarm Drone',
    description: 'Deploys mini-drones that swarm enemies',
    canAttack: true,
    damage: 2,
    fireRate: 0.6,
    orbitRadius: 84,
    orbitSpeed: 2.5,
    size: 6,
    shape: 'circle',
    color: '#14b8a6',
    secondaryColor: '#0d9488',
    detectionRadius: 270,
    projectileSpeed: 10,
    projectileSize: 3,
    projectileColor: '#2dd4bf',
    passiveEffect: 'Drone shots split into 3 mini-projectiles',
    passiveEffectValue: 3,
    activeEffect: 'Swarm deploy: 20 mini-drones attack',
    activeTrigger: 'manual',
    activeEffectDuration: 6,
    activeEffectCooldown: 20,
  },
  gravity_drone: {
    type: 'gravity_drone',
    name: 'Gravity Drone',
    description: 'Creates gravity wells that pull enemies together',
    canAttack: false,
    damage: 0,
    fireRate: 0,
    orbitRadius: 87,
    orbitSpeed: 1.6,
    size: 8,
    shape: 'hexagon',
    color: '#6366f1',
    secondaryColor: '#4f46e5',
    detectionRadius: 350,
    projectileSpeed: 0,
    projectileSize: 0,
    projectileColor: '#818cf8',
    passiveEffect: 'Slows nearby enemies by 15%',
    passiveEffectValue: 0.15,
    activeEffect: 'Black hole: Pulls all enemies to center for 4s',
    activeTrigger: 'manual',
    activeEffectDuration: 4,
    activeEffectCooldown: 25,
  },
  medic_drone: {
    type: 'medic_drone',
    name: 'Medic Drone',
    description: 'Advanced healing with shield regeneration',
    canAttack: false,
    damage: 0,
    fireRate: 0,
    orbitRadius: 82,
    orbitSpeed: 1.5,
    size: 8,
    shape: 'cross',
    color: '#22c55e',
    secondaryColor: '#16a34a',
    detectionRadius: 200,
    projectileSpeed: 0,
    projectileSize: 0,
    projectileColor: '#4ade80',
    passiveEffect: 'Regenerates 4 HP/sec',
    passiveEffectValue: 4,
    activeEffect: 'Healing pool: 1HP/s area heal for 6s',
    activeTrigger: 'manual',
    activeEffectDuration: 6,
    activeEffectCooldown: 30,
  },
  tesla_drone: {
    type: 'tesla_drone',
    name: 'Tesla Drone',
    description: 'Chains lightning between nearby enemies',
    canAttack: true,
    damage: 7,
    fireRate: 1.3,
    orbitRadius: 91,
    orbitSpeed: 2.0,
    size: 7,
    shape: 'star',
    color: '#3b82f6',
    secondaryColor: '#2563eb',
    detectionRadius: 300,
    projectileSpeed: 16,
    projectileSize: 6,
    projectileColor: '#60a5fa',
    passiveEffect: 'Lightning chains to 3 nearby enemies',
    passiveEffectValue: 3,
    activeEffect: 'Tesla storm: Continuous chain for 6 seconds',
    activeTrigger: 'shoot',
    activeEffectDuration: 6,
    activeEffectCooldown: 22,
  },
  void_drone: {
    type: 'void_drone',
    name: 'Void Drone',
    description: 'Dark energy projectiles that phase through obstacles',
    canAttack: true,
    damage: 9,
    fireRate: 1.4,
    orbitRadius: 98,
    orbitSpeed: 1.9,
    size: 7,
    shape: 'diamond',
    color: '#7c3aed',
    secondaryColor: '#6d28d9',
    detectionRadius: 330,
    projectileSpeed: 12,
    projectileSize: 8,
    projectileColor: '#a78bfa',
    passiveEffect: 'Projectiles ignore obstacles and terrain',
    passiveEffectValue: 1,
    activeEffect: 'Void Blink: Teleport in movement direction, preserving momentum. Works perfectly with grapple.',
    activeTrigger: 'dash',
    activeEffectDuration: 0,
    activeEffectCooldown: 8,
  },
};

export class DroneSystem {
  createDrone(droneType: DroneType, ownerId: string, ownerPosition: Vector2, startAngle: number = 0): Drone {
    const definition = DRONE_DEFINITIONS[droneType];
    
    return {
      id: generateId(),
      droneType,
      ownerId,
      position: { ...ownerPosition },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      size: definition.size,
      shape: definition.shape,
      damage: definition.damage,
      fireRate: definition.fireRate,
      attackCooldown: 0,
      orbitRadius: definition.orbitRadius,
      orbitAngle: startAngle,
      orbitSpeed: definition.orbitSpeed,
      color: definition.color,
      secondaryColor: definition.secondaryColor,
      detectionRadius: definition.detectionRadius,
      activeEffectCooldown: definition.activeEffectCooldown || 0,
      activeEffectTimer: 0,
      isActiveEffectActive: false,
      activeEffectRemainingTime: 0,
    };
  }

  updateDrones(
    drones: Drone[],
    ownerPosition: Vector2,
    enemies: Enemy[],
    dt: number,
    createProjectile: (projectile: Projectile) => void
  ): void {
    drones.forEach(drone => {
      this.updateDronePosition(drone, ownerPosition, dt);
      this.updateDroneAttack(drone, enemies, dt, createProjectile);
    });
  }

  private updateDronePosition(drone: Drone, ownerPosition: Vector2, dt: number): void {
    if (!drone.aiState) {
      drone.aiState = 'hovering';
      drone.aiTimer = 0;
      drone.hoverOffset = { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 };
    }

    drone.aiTimer = (drone.aiTimer || 0) + dt;

    if (drone.aiState === 'hovering') {
      if (drone.aiTimer > 3 + Math.random() * 2) {
        drone.aiState = Math.random() < 0.7 ? 'orbiting' : 'spinning';
        drone.aiTimer = 0;
      }
      
      const hoverX = ownerPosition.x + (drone.hoverOffset?.x || 0);
      const hoverY = ownerPosition.y + (drone.hoverOffset?.y || 0);
      
      const smoothingFactor = 0.12;
      drone.position.x += (hoverX - drone.position.x) * smoothingFactor;
      drone.position.y += (hoverY - drone.position.y) * smoothingFactor;

      const distance = vectorDistance(drone.position, ownerPosition);
      if (distance > drone.orbitRadius + 40) {
        const toOwner = vectorNormalize(vectorSubtract(ownerPosition, drone.position));
        drone.position.x += toOwner.x * 3;
        drone.position.y += toOwner.y * 3;
      }
    } 
    else if (drone.aiState === 'orbiting') {
      if (drone.aiTimer > 2 + Math.random() * 1.5) {
        drone.aiState = 'hovering';
        drone.aiTimer = 0;
        drone.hoverOffset = { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 };
      }

      drone.orbitAngle = (drone.orbitAngle || 0) + drone.orbitSpeed * dt;
      if (drone.orbitAngle > Math.PI * 2) {
        drone.orbitAngle -= Math.PI * 2;
      }

      const targetX = ownerPosition.x + Math.cos(drone.orbitAngle) * drone.orbitRadius;
      const targetY = ownerPosition.y + Math.sin(drone.orbitAngle) * drone.orbitRadius;

      const smoothingFactor = 0.18;
      drone.position.x += (targetX - drone.position.x) * smoothingFactor;
      drone.position.y += (targetY - drone.position.y) * smoothingFactor;
    }
    else if (drone.aiState === 'spinning') {
      if (drone.aiTimer > 1.5) {
        drone.aiState = 'hovering';
        drone.aiTimer = 0;
        drone.hoverOffset = { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 };
      }

      const spinSpeed = 8;
      drone.orbitAngle = (drone.orbitAngle || 0) + spinSpeed * dt;
      const spinRadius = 70;

      const targetX = ownerPosition.x + Math.cos(drone.orbitAngle) * spinRadius;
      const targetY = ownerPosition.y + Math.sin(drone.orbitAngle) * spinRadius;

      const smoothingFactor = 0.25;
      drone.position.x += (targetX - drone.position.x) * smoothingFactor;
      drone.position.y += (targetY - drone.position.y) * smoothingFactor;
    }

    const toTarget = drone.targetId 
      ? vectorSubtract(drone.position, ownerPosition)
      : vectorSubtract({ x: ownerPosition.x, y: ownerPosition.y }, drone.position);
    drone.rotation = Math.atan2(toTarget.y, toTarget.x);
  }

  private updateDroneAttack(
    drone: Drone,
    enemies: Enemy[],
    dt: number,
    createProjectile: (projectile: Projectile) => void
  ): void {
    const definition = DRONE_DEFINITIONS[drone.droneType];
    
    // Only attack if this drone type can attack
    if (!definition.canAttack) {
      drone.targetId = undefined;
      return;
    }

    drone.attackCooldown = Math.max(0, drone.attackCooldown - dt);

    if (drone.attackCooldown > 0) return;

    const nearestEnemy = this.findNearestEnemy(drone, enemies);
    
    if (!nearestEnemy) {
      drone.targetId = undefined;
      return;
    }

    const distance = vectorDistance(drone.position, nearestEnemy.position);
    if (distance > drone.detectionRadius) {
      drone.targetId = undefined;
      return;
    }

    drone.targetId = nearestEnemy.id;
    this.fireDroneProjectile(drone, nearestEnemy.position, createProjectile);
    drone.attackCooldown = drone.fireRate;
  }

  private findNearestEnemy(drone: Drone, enemies: Enemy[]): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    enemies.forEach(enemy => {
      if (enemy.health <= 0) return;
      
      const dist = vectorDistance(drone.position, enemy.position);
      if (dist < minDist && dist <= drone.detectionRadius) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  private fireDroneProjectile(
    drone: Drone,
    targetPosition: Vector2,
    createProjectile: (projectile: Projectile) => void
  ): void {
    const definition = DRONE_DEFINITIONS[drone.droneType];
    const direction = vectorNormalize(vectorSubtract(targetPosition, drone.position));
    const velocity = vectorScale(direction, definition.projectileSpeed);

    const projectile: any = {
      id: generateId(),
      position: { ...drone.position },
      velocity,
      rotation: Math.atan2(velocity.y, velocity.x),
      size: definition.projectileSize,
      damage: drone.damage,
      color: definition.projectileColor,
      owner: 'player',
      lifetime: 2.5,
      piercing: false,
      piercingCount: 0,
      droneType: drone.droneType,
    };

    if (drone.droneType === 'explosive_drone') {
      projectile.explosive = true;
      projectile.explosionRadius = 80;
    }

    if (drone.droneType === 'plasma_drone') {
      projectile.piercing = true;
      projectile.piercingCount = 999;
    }

    createProjectile(projectile);
  }

  getDroneDefinition(droneType: DroneType): DroneDefinition {
    return DRONE_DEFINITIONS[droneType];
  }
}
