import { Vector2, Weapon } from '../types/game';
import { generateId, vectorDistance } from './utils';
import { BiomeConfig } from './BiomeSystem';
import { CHUNK_SIZE } from './WorldGeneration';

export interface Shrine {
  id: string;
  position: Vector2;
  size: number;
  crystalBobPhase: number;
  biomeId: string;
  availableWeapons: WeaponRoll[];
  rollCost: number;
  obstacles: ShrineObstacle[];
  crystalColor: string;
  shrineType: 'weapon' | 'trading' | 'mixed';
}

export interface ShrineObstacle {
  position: Vector2;
  size: number;
  rotation: number;
  shape: 'rectangle' | 'circle';
}

export interface WeaponRoll {
  weapon: Weapon;
  rarity: 'common' | 'rare' | 'legendary';
  weight: number;
}

export class TradingPostSystem {
  private shrines: Map<string, Shrine> = new Map();
  private readonly spawnChance: number = 0;

  generateTradingPostForChunk(chunkX: number, chunkY: number, biome: BiomeConfig, seed: number): Shrine | null {
    return null;

    const chunkWorldX = chunkX * CHUNK_SIZE;
    const chunkWorldY = chunkY * CHUNK_SIZE;

    const offsetX = (random() * 0.6 + 0.2) * CHUNK_SIZE;
    const offsetY = (random() * 0.6 + 0.2) * CHUNK_SIZE;

    const position = {
      x: chunkWorldX + offsetX,
      y: chunkWorldY + offsetY,
    };

    const availableWeapons = this.getWeaponsForBiome(biome);
    const rollCost = 150;

    const shrineType = random() < 0.5 ? 'weapon' : (random() < 0.7 ? 'mixed' : 'trading');
    const crystalColors = ['#22d3ee', '#a855f7', '#fde047', '#06b6d4', '#f97316', '#10b981'];
    const crystalColor = crystalColors[Math.floor(random() * crystalColors.length)];

    const obstacles: ShrineObstacle[] = [];
    const obstacleDistance = 60;
    const obstacleSize = 25;

    obstacles.push(
      {
        position: { x: position.x - obstacleDistance, y: position.y - obstacleDistance },
        size: obstacleSize,
        rotation: Math.PI / 4,
        shape: 'rectangle',
      },
      {
        position: { x: position.x + obstacleDistance, y: position.y - obstacleDistance },
        size: obstacleSize,
        rotation: Math.PI / 4,
        shape: 'rectangle',
      },
      {
        position: { x: position.x - obstacleDistance, y: position.y + obstacleDistance },
        size: obstacleSize,
        rotation: Math.PI / 4,
        shape: 'rectangle',
      },
      {
        position: { x: position.x + obstacleDistance, y: position.y + obstacleDistance },
        size: obstacleSize,
        rotation: Math.PI / 4,
        shape: 'rectangle',
      }
    );

    const shrine: Shrine = {
      id: generateId(),
      position,
      size: 30,
      crystalBobPhase: random() * Math.PI * 2,
      biomeId: biome.id,
      availableWeapons,
      rollCost,
      obstacles,
      crystalColor,
      shrineType,
    };

    this.shrines.set(shrine.id, shrine);
    return shrine;
  }

  private getWeaponsForBiome(biome: BiomeConfig): WeaponRoll[] {
    const rolls: WeaponRoll[] = [];

    switch (biome.id) {
      case 'volcanic-wastes':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Flamethrower',
              type: 'flamethrower',
              damage: 8,
              fireRate: 0.08,
              projectileSpeed: 10,
              projectileSize: 8,
              projectileCount: 3,
              spread: 0.15,
              color: '#ff6600',
              cooldown: 0,
              firingMode: 'auto',
              piercing: false,
              maxRange: 80,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Magma Cannon',
              type: 'magma_cannon',
              damage: 45,
              fireRate: 1.2,
              projectileSpeed: 8,
              projectileSize: 18,
              projectileCount: 1,
              spread: 0,
              color: '#ff4500',
              cooldown: 0,
              firingMode: 'semi',
              explosive: true,
              explosionRadius: 70,
              maxRange: 440,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Ember Rifle',
              type: 'ember_rifle',
              damage: 18,
              fireRate: 0.25,
              projectileSpeed: 18,
              projectileSize: 6,
              projectileCount: 1,
              spread: 0,
              color: '#ff8800',
              cooldown: 0,
              firingMode: 'auto',
              piercing: true,
              maxRange: 520,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      case 'frozen-tundra':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Cryo Launcher',
              type: 'cryo_launcher',
              damage: 35,
              fireRate: 0.8,
              projectileSpeed: 12,
              projectileSize: 14,
              projectileCount: 1,
              spread: 0,
              color: '#60a5fa',
              cooldown: 0,
              firingMode: 'semi',
              explosive: true,
              explosionRadius: 60,
              maxRange: 440,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Frost Shards',
              type: 'frost_shards',
              damage: 12,
              fireRate: 0.15,
              projectileSpeed: 16,
              projectileSize: 7,
              projectileCount: 3,
              spread: 0.1,
              color: '#93c5fd',
              cooldown: 0,
              firingMode: 'auto',
              piercing: true,
              maxRange: 500,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Ice Pistol',
              type: 'ice_pistol',
              damage: 15,
              fireRate: 0.3,
              projectileSpeed: 14,
              projectileSize: 6,
              projectileCount: 1,
              spread: 0,
              color: '#bae6fd',
              cooldown: 0,
              firingMode: 'semi',
              maxRange: 400,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      case 'toxic-swamp':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Plague Spreader',
              type: 'plague_spreader',
              damage: 15,
              fireRate: 0.4,
              projectileSpeed: 10,
              projectileSize: 10,
              projectileCount: 5,
              spread: 0.25,
              color: '#a3e635',
              cooldown: 0,
              firingMode: 'semi',
              explosive: true,
              explosionRadius: 50,
              maxRange: 400,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Toxic Sprayer',
              type: 'toxic_sprayer',
              damage: 10,
              fireRate: 0.12,
              projectileSpeed: 11,
              projectileSize: 8,
              projectileCount: 2,
              spread: 0.2,
              color: '#84cc16',
              cooldown: 0,
              firingMode: 'auto',
              piercing: false,
              maxRange: 100,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Spore Gun',
              type: 'spore_gun',
              damage: 14,
              fireRate: 0.35,
              projectileSpeed: 12,
              projectileSize: 7,
              projectileCount: 1,
              spread: 0,
              color: '#bef264',
              cooldown: 0,
              firingMode: 'semi',
              maxRange: 400,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      case 'crystal-caverns':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Prismatic Ray',
              type: 'prismatic_ray',
              damage: 25,
              fireRate: 0.05,
              projectileSpeed: 20,
              projectileSize: 5,
              projectileCount: 1,
              spread: 0,
              color: '#22d3ee',
              cooldown: 0,
              firingMode: 'beam',
              beamDuration: 3,
              beamMaxHeat: 100,
              beamHeat: 0,
              beamOverheated: false,
              maxRange: 560,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Crystal Launcher',
              type: 'crystal_launcher',
              damage: 28,
              fireRate: 0.6,
              projectileSpeed: 15,
              projectileSize: 10,
              projectileCount: 3,
              spread: 0.12,
              color: '#06b6d4',
              cooldown: 0,
              firingMode: 'semi',
              piercing: true,
              maxRange: 480,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Shard Rifle',
              type: 'shard_rifle',
              damage: 16,
              fireRate: 0.22,
              projectileSpeed: 17,
              projectileSize: 6,
              projectileCount: 1,
              spread: 0,
              color: '#67e8f9',
              cooldown: 0,
              firingMode: 'auto',
              maxRange: 500,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      case 'void-nebula':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Void Cannon',
              type: 'void_cannon',
              damage: 60,
              fireRate: 1.5,
              projectileSpeed: 10,
              projectileSize: 20,
              projectileCount: 1,
              spread: 0,
              color: '#a855f7',
              cooldown: 0,
              firingMode: 'charge',
              chargeTime: 2,
              currentCharge: 0,
              isCharging: false,
              maxRange: 560,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Void Bolter',
              type: 'void_bolter',
              damage: 22,
              fireRate: 0.4,
              projectileSpeed: 14,
              projectileSize: 9,
              projectileCount: 1,
              spread: 0,
              color: '#c084fc',
              cooldown: 0,
              firingMode: 'semi',
              homing: true,
              homingStrength: 0.1,
              maxRange: 500,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Dark Pulse',
              type: 'dark_pulse',
              damage: 14,
              fireRate: 0.28,
              projectileSpeed: 13,
              projectileSize: 7,
              projectileCount: 1,
              spread: 0,
              color: '#e9d5ff',
              cooldown: 0,
              firingMode: 'auto',
              maxRange: 480,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      case 'coral-depths':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Tidal Cannon',
              type: 'tidal_cannon',
              damage: 40,
              fireRate: 1.0,
              projectileSpeed: 12,
              projectileSize: 16,
              projectileCount: 1,
              spread: 0,
              color: '#14b8a6',
              cooldown: 0,
              firingMode: 'semi',
              explosive: true,
              explosionRadius: 65,
              maxRange: 440,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Coral Spear',
              type: 'coral_spear',
              damage: 30,
              fireRate: 0.5,
              projectileSpeed: 18,
              projectileSize: 8,
              projectileCount: 1,
              spread: 0,
              color: '#5eead4',
              cooldown: 0,
              firingMode: 'semi',
              piercing: true,
              maxRange: 560,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Aqua Blaster',
              type: 'aqua_blaster',
              damage: 13,
              fireRate: 0.18,
              projectileSpeed: 15,
              projectileSize: 6,
              projectileCount: 2,
              spread: 0.08,
              color: '#2dd4bf',
              cooldown: 0,
              firingMode: 'auto',
              maxRange: 480,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      case 'radiant-gardens':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Solar Eruption',
              type: 'solar_eruption',
              damage: 50,
              fireRate: 1.3,
              projectileSpeed: 11,
              projectileSize: 18,
              projectileCount: 1,
              spread: 0,
              color: '#fde047',
              cooldown: 0,
              firingMode: 'hold',
              holdTime: 1,
              holdTimer: 0,
              isHolding: false,
              explosive: true,
              explosionRadius: 75,
              maxRange: 400,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Thorn Launcher',
              type: 'thorn_launcher',
              damage: 18,
              fireRate: 0.35,
              projectileSpeed: 16,
              projectileSize: 7,
              projectileCount: 4,
              spread: 0.15,
              color: '#10b981',
              cooldown: 0,
              firingMode: 'semi',
              piercing: true,
              maxRange: 480,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Bloom Rifle',
              type: 'bloom_rifle',
              damage: 15,
              fireRate: 0.25,
              projectileSpeed: 14,
              projectileSize: 6,
              projectileCount: 1,
              spread: 0,
              color: '#6ee7b7',
              cooldown: 0,
              firingMode: 'auto',
              maxRange: 500,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      case 'shattered-expanse':
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Gravity Cannon',
              type: 'gravity_cannon',
              damage: 55,
              fireRate: 1.4,
              projectileSpeed: 9,
              projectileSize: 19,
              projectileCount: 1,
              spread: 0,
              color: '#6366f1',
              cooldown: 0,
              firingMode: 'semi',
              maxRange: 480,
            },
            rarity: 'legendary',
            weight: 10,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Aether Rifle',
              type: 'aether_rifle',
              damage: 24,
              fireRate: 0.45,
              projectileSpeed: 17,
              projectileSize: 8,
              projectileCount: 2,
              spread: 0.1,
              color: '#818cf8',
              cooldown: 0,
              firingMode: 'semi',
              piercing: true,
              maxRange: 520,
            },
            rarity: 'rare',
            weight: 25,
          },
          {
            weapon: {
              id: generateId(),
              name: 'Flux Pistol',
              type: 'flux_pistol',
              damage: 17,
              fireRate: 0.3,
              projectileSpeed: 15,
              projectileSize: 6,
              projectileCount: 1,
              spread: 0,
              color: '#a5b4fc',
              cooldown: 0,
              firingMode: 'semi',
              maxRange: 440,
            },
            rarity: 'common',
            weight: 65,
          }
        );
        break;

      default:
        rolls.push(
          {
            weapon: {
              id: generateId(),
              name: 'Standard Rifle',
              type: 'rifle',
              damage: 15,
              fireRate: 0.2,
              projectileSpeed: 15,
              projectileSize: 6,
              projectileCount: 1,
              spread: 0,
              color: '#888888',
              cooldown: 0,
              firingMode: 'auto',
              maxRange: 480,
            },
            rarity: 'common',
            weight: 100,
          }
        );
    }

    return rolls;
  }

  rollWeapon(shrineId: string): Weapon | null {
    const shrine = this.shrines.get(shrineId);
    if (!shrine) return null;

    const totalWeight = shrine.availableWeapons.reduce((sum, roll) => sum + roll.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const roll of shrine.availableWeapons) {
      currentWeight += roll.weight;
      if (random <= currentWeight) {
        return { ...roll.weapon, id: generateId() };
      }
    }

    return null;
  }

  getShrine(shrineId: string): Shrine | null {
    return this.shrines.get(shrineId) || null;
  }

  getAllShrines(): Shrine[] {
    return Array.from(this.shrines.values());
  }

  getNearbyShrine(playerPos: Vector2, maxDistance: number = 50): Shrine | null {
    for (const shrine of this.shrines.values()) {
      const distance = vectorDistance(playerPos, shrine.position);
      if (distance < maxDistance) {
        return shrine;
      }
    }
    return null;
  }

  removeShrine(shrineId: string): void {
    this.shrines.delete(shrineId);
  }

  updateShrines(dt: number): void {
    for (const shrine of this.shrines.values()) {
      shrine.crystalBobPhase += dt * 2;
    }
  }

  reset(): void {
    this.shrines.clear();
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }
}
