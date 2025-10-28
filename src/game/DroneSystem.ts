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
    drone.orbitAngle += drone.orbitSpeed * dt;
    if (drone.orbitAngle > Math.PI * 2) {
      drone.orbitAngle -= Math.PI * 2;
    }

    const targetX = ownerPosition.x + Math.cos(drone.orbitAngle) * drone.orbitRadius;
    const targetY = ownerPosition.y + Math.sin(drone.orbitAngle) * drone.orbitRadius;

    const smoothingFactor = 0.15;
    drone.position.x += (targetX - drone.position.x) * smoothingFactor;
    drone.position.y += (targetY - drone.position.y) * smoothingFactor;

    const toTarget = vectorSubtract({ x: targetX, y: targetY }, drone.position);
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
