import { Enemy } from '../types/game';
import { createVector, generateId, randomRange } from './utils';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export interface WaveConfig {
  wave: number;
  enemyCount: number;
  enemyTypes: Array<{
    type: Enemy['type'];
    weight: number;
  }>;
  hasBoss: boolean;
  spawnRate: number;
}

export interface EnemyConfig {
  health: number;
  speed: number;
  damage: number;
  size: number;
  currency: number;
  color: string;
}
type EnemyType = keyof typeof BASE_ENEMY_CONFIGS;
export const BASE_ENEMY_CONFIGS: Record<Enemy['type'], EnemyConfig> = {
  grunt: {
    health: 30,
    speed: 2,
    damage: 10,
    size: 18,
    currency: 5,
    color: '#ef4444',
  },
  speedy: {
    health: 15,
    speed: 4.5,
    damage: 8,
    size: 14,
    currency: 8,
    color: '#22c55e',
  },
  tank: {
    health: 80,
    speed: 1,
    damage: 20,
    size: 28,
    currency: 15,
    color: '#3b82f6',
  },
  sniper: {
    health: 25,
    speed: 1.5,
    damage: 15,
    size: 16,
    currency: 12,
    color: '#a855f7',
  },
  artillery: {
    health: 40,
    speed: 0.8,
    damage: 25,
    size: 22,
    currency: 18,
    color: '#f97316',
  },
  burst: {
    health: 20,
    speed: 3,
    damage: 12,
    size: 16,
    currency: 10,
    color: '#06b6d4',
  },
  dasher: {
    health: 35,
    speed: 2.5,
    damage: 15,
    size: 16,
    currency: 14,
    color: '#facc15',
  },
  weaver: {
    health: 22,
    speed: 2,
    damage: 10,
    size: 15,
    currency: 11,
    color: '#ec4899',
  },
  laser: {
    health: 30,
    speed: 1.8,
    damage: 18,
    size: 18,
    currency: 16,
    color: '#8b5cf6',
  },
  boss: {
    health: 500,
    speed: 1.2,
    damage: 30,
    size: 50,
    currency: 100,
    color: '#dc2626',
  },
  orbiter: {
    health: 55,
    speed: 1.5,
    damage: 14,
    size: 20,
    currency: 22,
    color: '#06b6d4',
  },
  fragmenter: {
    health: 45,
    speed: 1.8,
    damage: 16,
    size: 22,
    currency: 24,
    color: '#f97316',
  },
  pulsar: {
    health: 60,
    speed: 1.2,
    damage: 18,
    size: 24,
    currency: 26,
    color: '#a855f7',
  },
  spiraler: {
    health: 40,
    speed: 2.2,
    damage: 15,
    size: 18,
    currency: 23,
    color: '#ec4899',
  },
  replicator: {
    health: 50,
    speed: 1.6,
    damage: 12,
    size: 19,
    currency: 28,
    color: '#10b981',
  },
  vortex: {
    health: 70,
    speed: 1.0,
    damage: 20,
    size: 26,
    currency: 30,
    color: '#8b5cf6',
  },
};

function getScaledStats(type: EnemyType, wave: number): EnemyConfig {
  const stats = BASE_ENEMY_CONFIGS[type];

  // Wave 0 should usually use base stats, or wave 1 if no wave 0 exists.
  // We use max(1, wave) to prevent multiplying by zero if the wave starts at 0.
  const w = Math.max(1, wave);

  // Fast Scaling for Health: Base * (1 + 15% per wave) + 5 flat health per wave
  const scaledHealth = Math.floor(stats.health * (1 + 0.15 * w) + w * 5);

  // Fast Scaling for Damage: Base * (1 + 10% per wave) + 2 flat damage per wave
  const scaledDamage = Math.floor(stats.damage * (1 + 0.1 * w) + w * 2);
  return {
    ...stats,
    health: scaledHealth,
    damage: scaledDamage,
  };
}

export class WaveSystem {
  private currentWave: number = 1;
  private enemiesSpawned: number = 0;
  private enemiesInWave: number = 0;
  private spawnTimer: number = 0;
  private waveComplete: boolean = false;
  private modifierChance: number = 0.15;
  private recentDeathPositions: Array<{ x: number; y: number; timestamp: number }> = [];
  private readonly DEATH_EXCLUSION_RADIUS = 100;
  private readonly DEATH_EXCLUSION_TIME = 3000;

  getWaveConfig(wave: number): WaveConfig {
    var hasBoss = wave % 5 === 0;
    const baseCount = 2 + Math.floor(wave * 0.6);

    let enemyTypes: Array<{ type: Enemy['type']; weight: number }>;
    if (wave == 0) {
      hasBoss = true;
    }
    if (wave <= 2) {
      enemyTypes = [
        { type: 'grunt', weight: 70 },
        { type: 'speedy', weight: 30 },
      ];
    } else if (wave <= 5) {
      enemyTypes = [
        { type: 'grunt', weight: 50 },
        { type: 'speedy', weight: 30 },
        { type: 'sniper', weight: 20 },
      ];
    } else if (wave <= 10) {
      enemyTypes = [
        { type: 'grunt', weight: 35 },
        { type: 'speedy', weight: 25 },
        { type: 'tank', weight: 15 },
        { type: 'sniper', weight: 15 },
        { type: 'burst', weight: 10 },
      ];
    } else if (wave <= 20) {
      enemyTypes = [
        { type: 'grunt', weight: 20 },
        { type: 'speedy', weight: 15 },
        { type: 'tank', weight: 12 },
        { type: 'sniper', weight: 12 },
        { type: 'burst', weight: 12 },
        { type: 'artillery', weight: 10 },
        { type: 'dasher', weight: 10 },
        { type: 'weaver', weight: 1 },
        { type: 'laser', weight: 3 },
      ];
    } else {
      enemyTypes = [
        { type: 'grunt', weight: 10 },
        { type: 'speedy', weight: 8 },
        { type: 'tank', weight: 8 },
        { type: 'sniper', weight: 8 },
        { type: 'burst', weight: 8 },
        { type: 'artillery', weight: 7 },
        { type: 'dasher', weight: 7 },
        { type: 'weaver', weight: 1 },
        { type: 'laser', weight: 5 },
        { type: 'orbiter', weight: 10 },
        { type: 'fragmenter', weight: 9 },
        { type: 'pulsar', weight: 8 },
        { type: 'spiraler', weight: 8 },
        { type: 'replicator', weight: 6 },
        { type: 'vortex', weight: 7 },
      ];
    }

    const spawnRate = Math.max(1.0, 3.0 - wave * 0.05);

    return {
      wave,
      enemyCount: baseCount,
      enemyTypes,
      hasBoss,
      spawnRate,
    };
  }

  startWave(wave: number): void {
    this.currentWave = wave;
    const config = this.getWaveConfig(wave);
    this.enemiesInWave = config.enemyCount;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.waveComplete = false;
  }

  shouldSpawnEnemy(deltaTime: number): boolean {
    var config = this.getWaveConfig(this.currentWave);
    this.spawnTimer += deltaTime;

    if (this.enemiesSpawned >= this.enemiesInWave) {
      return false;
    }

    if (this.spawnTimer >= config.spawnRate) {
      this.spawnTimer = 0;
      this.enemiesSpawned++;
      return true;
    }

    return false;
  }

  allEnemiesDestroyed(enemiesAlive: number): void {
    if (this.enemiesSpawned == this.enemiesInWave && enemiesAlive === 0) {
      console.log('compelete');
      this.markWaveComplete();
    }
  }

  shouldSpawnBoss(enemiesAlive: number): boolean {
    const config = this.getWaveConfig(this.currentWave);
    return (
      config.hasBoss &&
      enemiesAlive === 0 &&
      this.enemiesSpawned >= this.enemiesInWave &&
      !this.waveComplete
    );
  }

  markWaveComplete(): void {
    this.waveComplete = true;
  }

  recordEnemyDeath(position: { x: number; y: number }): void {
    const now = Date.now();
    this.recentDeathPositions = this.recentDeathPositions.filter(
      death => now - death.timestamp < this.DEATH_EXCLUSION_TIME
    );
    this.recentDeathPositions.push({ ...position, timestamp: now });
  }

  private isPositionNearRecentDeath(x: number, y: number): boolean {
    const now = Date.now();
    return this.recentDeathPositions.some(death => {
      if (now - death.timestamp > this.DEATH_EXCLUSION_TIME) return false;
      const dist = Math.sqrt(Math.pow(x - death.x, 2) + Math.pow(y - death.y, 2));
      return dist < this.DEATH_EXCLUSION_RADIUS;
    });
  }

  createEnemy(type?: Enemy['type'], playerPosition?: { x: number; y: number }): Enemy {
    const config = this.getWaveConfig(this.currentWave);

    let enemyType: Enemy['type'];
    if (type) {
      enemyType = type;
    } else {
      const totalWeight = config.enemyTypes.reduce(
        (sum, t) => sum + t.weight,
        0
      );
      let random = Math.random() * totalWeight;

      enemyType = 'grunt';
      for (const typeConfig of config.enemyTypes) {
        random -= typeConfig.weight;
        if (random <= 0) {
          enemyType = typeConfig.type;
          break;
        }
      }
    }

    const scaledStats = getScaledStats(enemyType, this.currentWave);

    let x = 0, y = 0;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const side = Math.floor(Math.random() * 4);

      if (playerPosition) {
        switch (side) {
          case 0:
            x = playerPosition.x + randomRange(-CANVAS_WIDTH / 2, CANVAS_WIDTH / 2);
            y = playerPosition.y - CANVAS_HEIGHT / 2 - 30;
            break;
          case 1:
            x = playerPosition.x + CANVAS_WIDTH / 2 + 30;
            y = playerPosition.y + randomRange(-CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2);
            break;
          case 2:
            x = playerPosition.x + randomRange(-CANVAS_WIDTH / 2, CANVAS_WIDTH / 2);
            y = playerPosition.y + CANVAS_HEIGHT / 2 + 30;
            break;
          case 3:
            x = playerPosition.x - CANVAS_WIDTH / 2 - 30;
            y = playerPosition.y + randomRange(-CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2);
            break;
        }
      } else {
        switch (side) {
          case 0:
            x = randomRange(0, CANVAS_WIDTH);
            y = -30;
            break;
          case 1:
            x = CANVAS_WIDTH + 30;
            y = randomRange(0, CANVAS_HEIGHT);
            break;
          case 2:
            x = randomRange(0, CANVAS_WIDTH);
            y = CANVAS_HEIGHT + 30;
            break;
          case 3:
            x = -30;
            y = randomRange(0, CANVAS_HEIGHT);
            break;
        }
      }
      attempts++;
    } while (this.isPositionNearRecentDeath(x, y) && attempts < maxAttempts);

    const enemy: Enemy = {
      id: generateId(),
      position: createVector(x, y),
      velocity: createVector(), // createVector() defaults to (0, 0)
      rotation: 0,

      // Core Stats (Scaled)
      health: scaledStats.health,
      maxHealth: scaledStats.health, // Max health is equal to current health on spawn
      damage: scaledStats.damage,

      // Inherited Stats
      size: scaledStats.size,
      speed: scaledStats.speed,
      color: scaledStats.color,
      type: enemyType,

      // Custom Game Properties
      attackCooldown: enemyType === 'boss' ? 0.5 : 1, // Example boss check
      currencyDrop: Math.floor(
        scaledStats.currency * (1 + this.currentWave * 0.05) // Currency gets a slight wave-based multiplier
      ),
    };

    if (Math.random() < this.modifierChance && enemyType !== 'boss') {
      enemy.modifiers = [];
    }

    return enemy;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  isWaveComplete(): boolean {
    return this.waveComplete;
  }

  reset(): void {
    this.currentWave = 1;
    this.enemiesSpawned = 0;
    this.enemiesInWave = 0;
    this.spawnTimer = 0;
    this.waveComplete = false;
  }
}
