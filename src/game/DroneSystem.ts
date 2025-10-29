import { Drone, DroneType, Vector2, Enemy, Projectile } from '../types/game';
import { generateId, vectorDistance, vectorNormalize, vectorSubtract, vectorScale, vectorAdd } from './utils';

export interface DroneDefinition {
  type: DroneType;
  name: string;
  description: string;
  health: number;
  damage: number;
  fireRate: number;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  color: string;
  secondaryColor: string;
  detectionRadius: number;
  projectileSpeed: number;
  projectileSize: number;
  projectileColor: string;
  specialAbility?: string;
  shieldStrength?: number;
  repairRate?: number;
  passiveEffect?: string;
  activeEffect?: string;
  effectCooldown?: number;
}

export const DRONE_DEFINITIONS: Record<DroneType, DroneDefinition> = {
  assault_drone: {
    type: 'assault_drone',
    name: 'Assault Drone',
    description: 'Aggressive drone that fires rapid projectiles at enemies',
    health: 80,
    damage: 15,
    fireRate: 0.5,
    orbitRadius: 60,
    orbitSpeed: 2.0,
    size: 12,
    color: '#ef4444',
    secondaryColor: '#dc2626',
    detectionRadius: 300,
    projectileSpeed: 12,
    projectileSize: 6,
    projectileColor: '#f87171',
    passiveEffect: '+15% player damage when active',
    activeEffect: 'Burst fire mode for 3 seconds',
    effectCooldown: 12,
  },
  shield_drone: {
    type: 'shield_drone',
    name: 'Shield Drone',
    description: 'Defensive drone that absorbs damage for the player',
    health: 120,
    damage: 8,
    fireRate: 1.0,
    orbitRadius: 50,
    orbitSpeed: 1.5,
    size: 14,
    color: '#3b82f6',
    secondaryColor: '#2563eb',
    detectionRadius: 250,
    projectileSpeed: 10,
    projectileSize: 5,
    projectileColor: '#60a5fa',
    specialAbility: 'shield',
    shieldStrength: 50,
    passiveEffect: 'Absorbs 20% of damage taken',
    activeEffect: 'Emergency shield bubble for 5 seconds',
    effectCooldown: 20,
  },
  repair_drone: {
    type: 'repair_drone',
    name: 'Repair Drone',
    description: 'Support drone that slowly repairs player health',
    health: 60,
    damage: 5,
    fireRate: 1.5,
    orbitRadius: 55,
    orbitSpeed: 1.8,
    size: 11,
    color: '#10b981',
    secondaryColor: '#059669',
    detectionRadius: 200,
    projectileSpeed: 8,
    projectileSize: 4,
    projectileColor: '#34d399',
    specialAbility: 'repair',
    repairRate: 2,
    passiveEffect: 'Regenerates 2 HP per second',
    activeEffect: 'Instant heal burst (30 HP)',
    effectCooldown: 15,
  },
  scout_drone: {
    type: 'scout_drone',
    name: 'Scout Drone',
    description: 'Fast drone with extended detection range',
    health: 50,
    damage: 10,
    fireRate: 0.8,
    orbitRadius: 70,
    orbitSpeed: 3.0,
    size: 10,
    color: '#f59e0b',
    secondaryColor: '#d97706',
    detectionRadius: 400,
    projectileSpeed: 15,
    projectileSize: 5,
    projectileColor: '#fbbf24',
    passiveEffect: '+50% detection range, reveals cloaked enemies',
    activeEffect: 'Marks all enemies for 8 seconds (+20% damage)',
    effectCooldown: 18,
  },
  plasma_drone: {
    type: 'plasma_drone',
    name: 'Plasma Drone',
    description: 'Fires superheated plasma bolts that pierce enemies',
    health: 70,
    damage: 25,
    fireRate: 1.2,
    orbitRadius: 65,
    orbitSpeed: 2.2,
    size: 13,
    color: '#8b5cf6',
    secondaryColor: '#7c3aed',
    detectionRadius: 320,
    projectileSpeed: 14,
    projectileSize: 8,
    projectileColor: '#a78bfa',
    specialAbility: 'piercing',
    passiveEffect: 'Projectiles pierce through enemies',
    activeEffect: 'Overcharge: Triple damage shots for 4 seconds',
    effectCooldown: 14,
  },
  cryo_drone: {
    type: 'cryo_drone',
    name: 'Cryo Drone',
    description: 'Slows enemies with freezing projectiles',
    health: 65,
    damage: 12,
    fireRate: 0.9,
    orbitRadius: 60,
    orbitSpeed: 1.9,
    size: 12,
    color: '#06b6d4',
    secondaryColor: '#0891b2',
    detectionRadius: 280,
    projectileSpeed: 11,
    projectileSize: 7,
    projectileColor: '#22d3ee',
    specialAbility: 'slow',
    passiveEffect: 'Slows hit enemies by 30% for 2 seconds',
    activeEffect: 'Freeze wave: Freeze all nearby enemies for 3 seconds',
    effectCooldown: 16,
  },
  explosive_drone: {
    type: 'explosive_drone',
    name: 'Explosive Drone',
    description: 'Launches explosive rounds that deal area damage',
    health: 75,
    damage: 30,
    fireRate: 1.8,
    orbitRadius: 58,
    orbitSpeed: 1.7,
    size: 13,
    color: '#f97316',
    secondaryColor: '#ea580c',
    detectionRadius: 290,
    projectileSpeed: 9,
    projectileSize: 9,
    projectileColor: '#fb923c',
    specialAbility: 'explosive',
    passiveEffect: 'Explosions deal 150% AoE damage',
    activeEffect: 'Carpet bomb: Rapid fire explosives for 4 seconds',
    effectCooldown: 18,
  },
  emp_drone: {
    type: 'emp_drone',
    name: 'EMP Drone',
    description: 'Disrupts enemy shields and systems',
    health: 68,
    damage: 18,
    fireRate: 1.1,
    orbitRadius: 62,
    orbitSpeed: 2.1,
    size: 12,
    color: '#eab308',
    secondaryColor: '#ca8a04',
    detectionRadius: 310,
    projectileSpeed: 13,
    projectileSize: 6,
    projectileColor: '#fde047',
    specialAbility: 'emp',
    passiveEffect: 'Disables enemy shields on hit',
    activeEffect: 'EMP blast: Stuns all enemies in range for 4 seconds',
    effectCooldown: 24,
  },
  sniper_drone: {
    type: 'sniper_drone',
    name: 'Sniper Drone',
    description: 'Precise long-range shots with high damage',
    health: 55,
    damage: 45,
    fireRate: 2.5,
    orbitRadius: 75,
    orbitSpeed: 1.4,
    size: 11,
    color: '#64748b',
    secondaryColor: '#475569',
    detectionRadius: 500,
    projectileSpeed: 20,
    projectileSize: 5,
    projectileColor: '#94a3b8',
    specialAbility: 'precision',
    passiveEffect: '30% critical hit chance for bonus damage',
    activeEffect: 'Perfect shot: Next shot deals 500% damage',
    effectCooldown: 10,
  },
  laser_drone: {
    type: 'laser_drone',
    name: 'Laser Drone',
    description: 'Continuous laser beam that tracks enemies',
    health: 62,
    damage: 8,
    fireRate: 0.1,
    orbitRadius: 63,
    orbitSpeed: 2.0,
    size: 12,
    color: '#ec4899',
    secondaryColor: '#db2777',
    detectionRadius: 300,
    projectileSpeed: 25,
    projectileSize: 4,
    projectileColor: '#f472b6',
    specialAbility: 'beam',
    passiveEffect: 'Continuous laser beam, damage ramps up over time',
    activeEffect: 'Overload: 3x beam width and damage for 5 seconds',
    effectCooldown: 15,
  },
  swarm_drone: {
    type: 'swarm_drone',
    name: 'Swarm Drone',
    description: 'Deploys mini-drones that swarm enemies',
    health: 58,
    damage: 6,
    fireRate: 0.6,
    orbitRadius: 55,
    orbitSpeed: 2.5,
    size: 10,
    color: '#14b8a6',
    secondaryColor: '#0d9488',
    detectionRadius: 270,
    projectileSpeed: 10,
    projectileSize: 3,
    projectileColor: '#2dd4bf',
    specialAbility: 'swarm',
    passiveEffect: 'Each shot splits into 3 mini-drones',
    activeEffect: 'Deploy swarm: 20 mini-drones attack all enemies',
    effectCooldown: 20,
  },
  gravity_drone: {
    type: 'gravity_drone',
    name: 'Gravity Drone',
    description: 'Creates gravity wells that pull enemies together',
    health: 72,
    damage: 14,
    fireRate: 2.0,
    orbitRadius: 58,
    orbitSpeed: 1.6,
    size: 13,
    color: '#6366f1',
    secondaryColor: '#4f46e5',
    detectionRadius: 350,
    projectileSpeed: 8,
    projectileSize: 10,
    projectileColor: '#818cf8',
    specialAbility: 'gravity',
    passiveEffect: 'Slows nearby enemies by 15%',
    activeEffect: 'Black hole: Pulls all enemies to center',
    effectCooldown: 25,
  },
  medic_drone: {
    type: 'medic_drone',
    name: 'Medic Drone',
    description: 'Advanced healing with shield regeneration',
    health: 85,
    damage: 3,
    fireRate: 2.0,
    orbitRadius: 52,
    orbitSpeed: 1.5,
    size: 13,
    color: '#22c55e',
    secondaryColor: '#16a34a',
    detectionRadius: 200,
    projectileSpeed: 7,
    projectileSize: 5,
    projectileColor: '#4ade80',
    specialAbility: 'medic',
    repairRate: 4,
    passiveEffect: 'Regenerates 4 HP/sec + 10% shield regen',
    activeEffect: 'Revive: Restore 50% HP instantly',
    effectCooldown: 30,
  },
  tesla_drone: {
    type: 'tesla_drone',
    name: 'Tesla Drone',
    description: 'Chains lightning between nearby enemies',
    health: 66,
    damage: 20,
    fireRate: 1.3,
    orbitRadius: 61,
    orbitSpeed: 2.0,
    size: 12,
    color: '#3b82f6',
    secondaryColor: '#2563eb',
    detectionRadius: 300,
    projectileSpeed: 16,
    projectileSize: 6,
    projectileColor: '#60a5fa',
    specialAbility: 'chain',
    passiveEffect: 'Lightning chains to 3 nearby enemies',
    activeEffect: 'Tesla storm: Continuous chain lightning for 6 seconds',
    effectCooldown: 22,
  },
  void_drone: {
    type: 'void_drone',
    name: 'Void Drone',
    description: 'Dark energy projectiles that phase through obstacles',
    health: 60,
    damage: 28,
    fireRate: 1.4,
    orbitRadius: 68,
    orbitSpeed: 1.9,
    size: 12,
    color: '#7c3aed',
    secondaryColor: '#6d28d9',
    detectionRadius: 330,
    projectileSpeed: 12,
    projectileSize: 8,
    projectileColor: '#a78bfa',
    specialAbility: 'void',
    passiveEffect: 'Projectiles ignore obstacles and terrain',
    activeEffect: 'Void rift: Creates damaging portal for 5 seconds',
    effectCooldown: 20,
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
      health: definition.health,
      maxHealth: definition.health,
      damage: definition.damage,
      fireRate: definition.fireRate,
      attackCooldown: 0,
      orbitRadius: definition.orbitRadius,
      orbitAngle: startAngle,
      orbitSpeed: definition.orbitSpeed,
      color: definition.color,
      secondaryColor: definition.secondaryColor,
      detectionRadius: definition.detectionRadius,
      shieldActive: definition.specialAbility === 'shield',
      repairRate: definition.repairRate,
      lastRepairTime: 0,
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
      drone.hoverOffset = { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 };
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
      if (distance > drone.orbitRadius + 30) {
        const toOwner = vectorNormalize(vectorSubtract(ownerPosition, drone.position));
        drone.position.x += toOwner.x * 3;
        drone.position.y += toOwner.y * 3;
      }
    } 
    else if (drone.aiState === 'orbiting') {
      if (drone.aiTimer > 2 + Math.random() * 1.5) {
        drone.aiState = 'hovering';
        drone.aiTimer = 0;
        drone.hoverOffset = { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 };
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
        drone.hoverOffset = { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 };
      }

      const spinSpeed = 8;
      drone.orbitAngle = (drone.orbitAngle || 0) + spinSpeed * dt;
      const spinRadius = 30;

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
    drone.attackCooldown = Math.max(0, drone.attackCooldown - dt);

    if (drone.attackCooldown > 0) return;

    const nearestEnemy = this.findNearestEnemy(drone, enemies);
    
    if (!nearestEnemy) {
      drone.targetId = undefined;
      return;
    }

    const distance = vectorDistance(drone.position, nearestEnemy.position);
    if (distance > (drone.detectionRadius || 300)) {
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
      if (dist < minDist && dist <= (drone.detectionRadius || 300)) {
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

    createProjectile({
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
    });
  }

  applyDroneSpecialAbilities(
    drones: Drone[],
    playerHealth: number,
    playerMaxHealth: number,
    dt: number
  ): { healthRepaired: number; shieldAbsorbed: number } {
    let healthRepaired = 0;
    let shieldAbsorbed = 0;

    drones.forEach(drone => {
      const definition = DRONE_DEFINITIONS[drone.droneType];
      
      if (definition.specialAbility === 'repair' && definition.repairRate) {
        const timeSinceLastRepair = dt;
        if (!drone.lastRepairTime) drone.lastRepairTime = 0;
        
        drone.lastRepairTime += timeSinceLastRepair;
        
        if (drone.lastRepairTime >= 1.0 && playerHealth < playerMaxHealth) {
          healthRepaired += definition.repairRate;
          drone.lastRepairTime = 0;
        }
      }
      
      if (definition.specialAbility === 'shield' && drone.shieldActive && definition.shieldStrength) {
        shieldAbsorbed += definition.shieldStrength;
      }
    });

    return { healthRepaired, shieldAbsorbed };
  }

  getDroneDefinition(droneType: DroneType): DroneDefinition {
    return DRONE_DEFINITIONS[droneType];
  }
}
