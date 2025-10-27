import { Vector2, Enemy } from '../types/game';
import { generateId } from './utils';
import { WorldGenerator, CHUNK_SIZE, ResourceType } from './WorldGeneration';

export interface BiomeParticle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  size: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
  type: 'snow' | 'ember' | 'leaf' | 'spark' | 'spore' | 'dust' | 'bubble';
  opacity: number;
}

export interface BiomeConfig {
  id: string;
  name: string;
  backgroundColor: string;
  floorColor: string;
  gridColor: string;
  accentColor: string;
  particleColor: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    dangerColor: string;
  };
  obstacleColors: string[];
  resourceColors: {
    [key in ResourceType]?: string;
  };
  particleSystem: {
    type: BiomeParticle['type'];
    spawnRate: number;
    maxParticles: number;
  };
  environmentalEffects: {
    fog?: { density: number; color: string };
    wind?: { strength: number; direction: number };
    lighting?: { ambient: number; contrast: number };
  };
  uniqueEnemyTypes: Array<Enemy['type']>;
  uniqueResources: Array<ResourceType>;
  transitionDistance: number;
}

export const BIOMES: BiomeConfig[] = [
  {
    id: 'frozen-tundra',
    name: 'Frozen Tundra',
    backgroundColor: '#0a1929',
    floorColor: '#1a2942',
    gridColor: '#60a5fa40',
    accentColor: '#60a5fa',
    particleColor: '#93c5fd',
    theme: {
      primaryColor: '#60a5fa',
      secondaryColor: '#93c5fd',
      dangerColor: '#3b82f6',
    },
    obstacleColors: ['#475569', '#64748b', '#94a3b8', '#526A8A', '#3B597A'],
    resourceColors: {
      cryoKelp: '#7dd3fc',
      alloyFragments: '#94a3b8',
      energy: '#bae6fd',
    },
    particleSystem: {
      type: 'snow',
      spawnRate: 0.5,
      maxParticles: 80,
    },
    environmentalEffects: {
      wind: { strength: 0.5, direction: Math.PI / 4 },
      lighting: { ambient: 0.9, contrast: 1.2 },
    },
    uniqueEnemyTypes: ['tank', 'grunt', 'weaver'],
    uniqueResources: ['cryoKelp', 'alloyFragments'],
    transitionDistance: 2000,
  },
  {
    id: 'volcanic-wastes',
    name: 'Volcanic Wastes',
    backgroundColor: '#1f0a0a',
    floorColor: '#3f1a0a',
    gridColor: '#fb923c40',
    accentColor: '#f97316',
    particleColor: '#fb923c',
    theme: {
      primaryColor: '#f97316',
      secondaryColor: '#fdba74',
      dangerColor: '#dc2626',
    },
    obstacleColors: ['#7c2d12', '#9a3412', '#c2410c', '#5A1D0C', '#E55A0C'],
    resourceColors: {
      obsidianHeart: '#fb923c',
      alloyFragments: '#ea580c',
      energy: '#f97316',
    },
    particleSystem: { type: 'ember', spawnRate: 0.3, maxParticles: 60 },
    environmentalEffects: {
      fog: { density: 0.15, color: '#9a3412' },
      lighting: { ambient: 1.1, contrast: 1.3 },
    },
    uniqueEnemyTypes: ['artillery', 'dasher', 'grunt'],
    uniqueResources: ['obsidianHeart', 'alloyFragments'],
    transitionDistance: 2000,
  },
  {
    id: 'toxic-swamp',
    name: 'Toxic Swamp',
    backgroundColor: '#0f1a0a',
    floorColor: '#1a2a12',
    gridColor: '#a3e63540',
    accentColor: '#84cc16',
    particleColor: '#a3e635',
    theme: {
      primaryColor: '#84cc16',
      secondaryColor: '#bef264',
      dangerColor: '#65a30d',
    },
    obstacleColors: ['#365314', '#3f6212', '#4d7c0f', '#2A400F', '#6A9915'],
    resourceColors: { gloomRoot: '#a3e635', coreDust: '#4d7c0f', energy: '#bef264' },
    particleSystem: { type: 'spore', spawnRate: 0.4, maxParticles: 70 },
    environmentalEffects: {
      fog: { density: 0.25, color: '#365314' },
      lighting: { ambient: 0.85, contrast: 1.1 },
    },
    uniqueEnemyTypes: ['weaver', 'burst', 'laser'],
    uniqueResources: ['gloomRoot', 'coreDust'],
    transitionDistance: 2000,
  },
  {
    id: 'crystal-caverns',
    name: 'Crystal Caverns',
    backgroundColor: '#0a1a1f',
    floorColor: '#1a2a3f',
    gridColor: '#22d3ee40',
    accentColor: '#06b6d4',
    particleColor: '#22d3ee',
    theme: {
      primaryColor: '#06b6d4',
      secondaryColor: '#67e8f9',
      dangerColor: '#0e7490',
    },
    obstacleColors: ['#155e75', '#0e7490', '#0891b2', '#0E6A80', '#164e63'],
    resourceColors: { resonantCrystal: '#22d3ee', geoShards: '#67e8f9', energy: '#a5f3fc' },
    particleSystem: { type: 'spark', spawnRate: 0.35, maxParticles: 50 },
    environmentalEffects: { lighting: { ambient: 1.15, contrast: 1.4 } },
    uniqueEnemyTypes: ['sniper', 'speedy', 'burst'],
    uniqueResources: ['resonantCrystal', 'geoShards'],
    transitionDistance: 2000,
  },
  {
    id: 'void-nebula',
    name: 'Void Nebula',
    backgroundColor: '#1a0a2e',
    floorColor: '#2a1a3e',
    gridColor: '#c084fc40',
    accentColor: '#a855f7',
    particleColor: '#c084fc',
    theme: {
      primaryColor: '#a855f7',
      secondaryColor: '#c084fc',
      dangerColor: '#7e22ce',
    },
    obstacleColors: ['#6b21a8', '#7e22ce', '#9333ea', '#581c87', '#A040F0'],
    resourceColors: { voidEssence: '#c084fc', flux: '#a855f7', energy: '#e9d5ff' },
    particleSystem: { type: 'dust', spawnRate: 0.6, maxParticles: 90 },
    environmentalEffects: {
      fog: { density: 0.2, color: '#6b21a8' },
      lighting: { ambient: 0.95, contrast: 1.5 },
    },
    uniqueEnemyTypes: ['laser', 'tank', 'artillery'],
    uniqueResources: ['voidEssence', 'flux'],
    transitionDistance: 2000,
  },
  {
    id: 'coral-depths',
    name: 'Coral Depths',
    backgroundColor: '#0a1f29',
    floorColor: '#1a2f42',
    gridColor: '#5eead440',
    accentColor: '#14b8a6',
    particleColor: '#5eead4',
    theme: {
      primaryColor: '#14b8a6',
      secondaryColor: '#5eead4',
      dangerColor: '#0f766e',
    },
    obstacleColors: ['#115e59', '#0f766e', '#14b8a6', '#0C4B4A', '#2dd4bf'],
    resourceColors: { bioluminescentPearl: '#5eead4', coreDust: '#2dd4bf', energy: '#99f6e4' },
    particleSystem: { type: 'bubble', spawnRate: 0.25, maxParticles: 40 },
    environmentalEffects: {
      fog: { density: 0.3, color: '#115e59' },
      lighting: { ambient: 0.8, contrast: 1.0 },
    },
    uniqueEnemyTypes: ['weaver', 'speedy', 'dasher'],
    uniqueResources: ['bioluminescentPearl', 'coreDust'],
    transitionDistance: 2000,
  },
  {
    id: 'radiant-gardens',
    name: 'Radiant Gardens',
    backgroundColor: '#0a1f1a',
    floorColor: '#1a3f2a',
    gridColor: '#34d39940',
    accentColor: '#10b981',
    particleColor: '#6ee7b7',
    theme: {
      primaryColor: '#10b981',
      secondaryColor: '#6ee7b7',
      dangerColor: '#059669',
    },
    obstacleColors: ['#064e3b', '#047857', '#059669', '#065f46', '#022c22'],
    resourceColors: { sunpetalBloom: '#fde047', geoShards: '#6ee7b7', energy: '#a7f3d0' },
    particleSystem: { type: 'leaf', spawnRate: 0.4, maxParticles: 70 },
    environmentalEffects: {
      lighting: { ambient: 1.2, contrast: 1.1 },
    },
    uniqueEnemyTypes: ['speedy', 'burst', 'weaver'],
    uniqueResources: ['sunpetalBloom', 'geoShards'],
    transitionDistance: 2000,
  },
  {
    id: 'shattered-expanse',
    name: 'Shattered Expanse',
    backgroundColor: '#1e1b4b',
    floorColor: '#312e81',
    gridColor: '#818cf840',
    accentColor: '#6366f1',
    particleColor: '#a5b4fc',
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#a5b4fc',
      dangerColor: '#4338ca',
    },
    obstacleColors: ['#4338ca', '#4f46e5', '#6366f1', '#3730a3', '#312e81'],
    resourceColors: { aetheriumShard: '#a5b4fc', flux: '#818cf8', energy: '#c7d2fe' },
    particleSystem: { type: 'spark', spawnRate: 0.5, maxParticles: 60 },
    environmentalEffects: {
      wind: { strength: 0.8, direction: Math.PI },
      lighting: { ambient: 1.0, contrast: 1.6 },
    },
    uniqueEnemyTypes: ['dasher', 'sniper', 'laser'],
    uniqueResources: ['aetheriumShard', 'flux'],
    transitionDistance: 2000,
  },
];

export class BiomeManager {
  private currentBiomeIndex: number = 0;
  private previousBiomeIndex: number = 0;
  private transitionProgress: number = 1.0;
  private readonly transitionDuration: number = 3.0; // 3 seconds for a smoother transition
  private environmentalParticles: BiomeParticle[] = [];
  private particleSpawnTimer: number = 0;
  private lastNotifiedBiome: string | null = null;
  private worldGenerator?: WorldGenerator;

  public setWorldGenerator(worldGenerator: WorldGenerator) {
    this.worldGenerator = worldGenerator;
  }

  getBiomes(): BiomeConfig[] {
    return BIOMES;
  }

  getBiomeByIndex(index: number): BiomeConfig {
    return BIOMES[index] || BIOMES[0];
  }

  getCurrentBiome(): BiomeConfig {
    return BIOMES[this.currentBiomeIndex];
  }

  updateBiome(playerPosition: Vector2, onBiomeChange?: (biome: BiomeConfig) => void): void {
    if (!this.worldGenerator) return;

    const chunkX = Math.floor(playerPosition.x / CHUNK_SIZE);
    const chunkY = Math.floor(playerPosition.y / CHUNK_SIZE);

    const newBiomeIndex = this.worldGenerator.getOrAssignChunkBiomeIndex(chunkX, chunkY);

    if (newBiomeIndex !== this.currentBiomeIndex) {
      this.previousBiomeIndex = this.currentBiomeIndex;
      this.currentBiomeIndex = newBiomeIndex;
      this.transitionProgress = 0; // Start transition
      const newBiome = this.getCurrentBiome();

      if (this.lastNotifiedBiome !== newBiome.id) {
        if (onBiomeChange) {
          onBiomeChange(newBiome);
        }
        this.lastNotifiedBiome = newBiome.id;
      }

      this.environmentalParticles = [];
    }
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number, cameraOffset: Vector2): void {
    // Update transition
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + deltaTime / this.transitionDuration);
    }

    // Update particles
    const biome = this.getCurrentBiome();
    this.particleSpawnTimer += deltaTime;
    if (this.particleSpawnTimer >= biome.particleSystem.spawnRate && this.environmentalParticles.length < biome.particleSystem.maxParticles) {
      this.spawnEnvironmentalParticle(canvasWidth, canvasHeight, cameraOffset);
      this.particleSpawnTimer = 0;
    }

    this.environmentalParticles = this.environmentalParticles.filter(particle => {
      particle.position.x += particle.velocity.x * deltaTime * 60;
      particle.position.y += particle.velocity.y * deltaTime * 60;
      particle.lifetime -= deltaTime;
      const screenX = particle.position.x - cameraOffset.x;
      const screenY = particle.position.y - cameraOffset.y;
      if (screenX < -50 || screenX > canvasWidth + 50 || screenY < -50 || screenY > canvasHeight + 50) {
        return false;
      }
      return particle.lifetime > 0;
    });
  }

  private spawnEnvironmentalParticle(canvasWidth: number, canvasHeight: number, cameraOffset: Vector2): void {
    const biome = this.getCurrentBiome();
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;

    switch (side) {
      case 0: x = cameraOffset.x + Math.random() * canvasWidth; y = cameraOffset.y - 20; break;
      case 1: x = cameraOffset.x + canvasWidth + 20; y = cameraOffset.y + Math.random() * canvasHeight; break;
      case 2: x = cameraOffset.x + Math.random() * canvasWidth; y = cameraOffset.y + canvasHeight + 20; break;
      case 3: x = cameraOffset.x - 20; y = cameraOffset.y + Math.random() * canvasHeight; break;
    }

    let velocity = { x: 0, y: 0 };
    let size = 2;
    let lifetime = 5;

    switch (biome.particleSystem.type) {
      case 'snow': velocity = { x: (Math.random() - 0.5) * 0.5, y: Math.random() * 0.5 + 0.3 }; size = Math.random() * 3 + 1; lifetime = 10; break;
      case 'ember': velocity = { x: (Math.random() - 0.5) * 0.3, y: -Math.random() * 0.8 - 0.5 }; size = Math.random() * 4 + 2; lifetime = 4; break;
      case 'spore': velocity = { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 }; size = Math.random() * 3 + 2; lifetime = 8; break;
      case 'spark': velocity = { x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 }; size = Math.random() * 2 + 1; lifetime = 2; break;
      case 'dust': velocity = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2 }; size = Math.random() * 2 + 1; lifetime = 15; break;
      case 'bubble': velocity = { x: (Math.random() - 0.5) * 0.3, y: -Math.random() * 0.5 - 0.2 }; size = Math.random() * 5 + 3; lifetime = 6; break;
      case 'leaf': velocity = { x: (Math.random() - 0.5) * 0.6, y: Math.random() * 0.4 + 0.2 }; size = Math.random() * 4 + 2; lifetime = 7; break;
    }

    const particle: BiomeParticle = {
      id: generateId(),
      position: { x, y },
      velocity,
      size,
      color: biome.particleColor,
      lifetime,
      maxLifetime: lifetime,
      type: biome.particleSystem.type,
      opacity: 0.6,
    };
    this.environmentalParticles.push(particle);
  }

  getEnvironmentalParticles(): BiomeParticle[] {
    return this.environmentalParticles;
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: result[4] ? parseInt(result[4], 16) / 255 : 1
      } : { r: 0, g: 0, b: 0, a: 1 };
    };

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    const a = c1.a + factor * (c2.a - c1.a);

    const componentToHex = (c: number) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    
    const alphaToHex = (a: number) => {
        const hex = Math.round(a * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}${alphaToHex(a)}`;
  }

  getDisplayColors(): { backgroundColor: string; floorColor: string; gridColor: string } {
    if (this.transitionProgress >= 1.0) {
      const biome = this.getCurrentBiome();
      return {
        backgroundColor: biome.backgroundColor,
        floorColor: biome.floorColor,
        gridColor: biome.gridColor,
      };
    }

    const fromBiome = this.getBiomeByIndex(this.previousBiomeIndex);
    const toBiome = this.getCurrentBiome();
    const easeFactor = this.transitionProgress * this.transitionProgress * (3 - 2 * this.transitionProgress); // Ease-in-out

    return {
      backgroundColor: this.interpolateColor(fromBiome.backgroundColor, toBiome.backgroundColor, easeFactor),
      floorColor: this.interpolateColor(fromBiome.floorColor, toBiome.floorColor, easeFactor),
      gridColor: this.interpolateColor(fromBiome.gridColor, toBiome.gridColor, easeFactor),
    };
  }

  modifyEnemyForBiome(enemy: Enemy, biome: BiomeConfig): Enemy {
    // This function can be used later to apply biome-specific effects,
    // but for now, it just returns the enemy as-is to prevent color overrides.
    return {
      ...enemy,
      // Example of a potential future modifier:
      // speed: enemy.speed * (biome.speedModifier || 1),
    };
  }

  reset(): void {
    this.currentBiomeIndex = 0;
    this.environmentalParticles = [];
    this.particleSpawnTimer = 0;
    this.lastNotifiedBiome = null;
  }
}
