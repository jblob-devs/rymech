import { Vector2, Enemy, Chest, Player } from '../types/game';
import { createVector, generateId, randomRange } from './utils';
import { BASE_ENEMY_CONFIGS } from './WaveSystem';
import { Obstacle as EnvObstacle } from './Environments';
import { BiomeManager, BiomeConfig } from './BiomeSystem';
import { BiomeFeatureGenerator, AnyBiomeFeature } from './BiomeFeatures';
import { EnemyModifierSystem } from './EnemyModifierSystem';

export type ResourceType = keyof Player['resources'];

export interface Chunk {
  x: number;
  y: number;
  id: string;
  biomeId: string;
  obstacles: EnvObstacle[];
  enemies: Enemy[];
  resourceNodes: ResourceNode[];
  portals: Portal[];
  extractionPoint?: ExtractionPoint;
  chests: Chest[];
  biomeFeatures: AnyBiomeFeature[];
  fieldAnchors: Array<{ x: number; y: number }>;
}

export interface ResourceNode {
  id: string;
  position: Vector2;
  size: number;
  health: number;
  maxHealth: number;
  resourceType: ResourceType;
  shape: 'crystal' | 'boulder' | 'geode' | 'kelp' | 'heart' | 'root' | 'pearl' | 'bloom' | 'shard' | 'graviton';
  color: string;
  value: number;
  bobPhase: number;
}

export interface Portal {
  id: string;
  position: Vector2;
  size: number;
  color: string;
  linkedPortalId?: string;
}

export interface ExtractionPoint {
  id: string;
  position: Vector2;
  size: number;
  active: boolean;
}

export const CHUNK_SIZE = 1200;

export class WorldGenerator {
  private chunks: Map<string, Chunk> = new Map();
  private chunkBiomeMap: Map<string, number> = new Map();
  private seed: number;
  private biomeManager: BiomeManager;
  private allPortals: Portal[] = [];
  private unlinkedPortal: Portal | null = null;
  private killedEnemyIds: Set<string> = new Set();
  private featureGenerator: BiomeFeatureGenerator;
  private modifierSystem: EnemyModifierSystem;

  constructor(seed?: number) {
    this.seed = seed || Math.random() * 10000;
    this.biomeManager = new BiomeManager();
    this.featureGenerator = new BiomeFeatureGenerator(this.seed);
    this.modifierSystem = new EnemyModifierSystem();
  }

  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  private seededRandom(x: number, y: number, offset: number = 0): number {
    const seed = this.seed + x * 73856093 + y * 19349663 + offset * 83492791;
    const value = Math.sin(seed) * 43758.5453123;
    return value - Math.floor(value);
  }

  public getOrAssignChunkBiomeIndex(chunkX: number, chunkY: number): number {
    const key = this.getChunkKey(chunkX, chunkY);
    if (this.chunkBiomeMap.has(key)) {
      return this.chunkBiomeMap.get(key)!;
    }

    const BIOMES_COUNT = this.biomeManager.getBiomes().length;
    const availableBiomeIndices = Array.from({ length: BIOMES_COUNT }, (_, i) => i);

    const neighbors = [
      { x: chunkX - 1, y: chunkY }, { x: chunkX + 1, y: chunkY },
      { x: chunkX, y: chunkY - 1 }, { x: chunkX, y: chunkY + 1 },
    ];

    const neighborBiomes = neighbors
      .map(n => this.chunkBiomeMap.get(this.getChunkKey(n.x, n.y)))
      .filter(b => b !== undefined && availableBiomeIndices.includes(b!)) as number[];

    let biomeIndex: number;
    if (neighborBiomes.length > 0 && this.seededRandom(chunkX, chunkY, 1000) < 0.9) {
      biomeIndex = neighborBiomes[Math.floor(this.seededRandom(chunkX, chunkY, 1001) * neighborBiomes.length)];
    } else {
      const randIndex = Math.floor(this.seededRandom(chunkX, chunkY, 1002) * availableBiomeIndices.length);
      biomeIndex = availableBiomeIndices[randIndex];
    }

    this.chunkBiomeMap.set(key, biomeIndex);
    return biomeIndex;
  }

  getOrGenerateChunk(chunkX: number, chunkY: number): Chunk {
    const key = this.getChunkKey(chunkX, chunkY);
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!;
    }
    const chunk = this.generateChunk(chunkX, chunkY);
    this.chunks.set(key, chunk);
    return chunk;
  }

  private generateChunk(chunkX: number, chunkY: number): Chunk {
    const worldX = chunkX * CHUNK_SIZE;
    const worldY = chunkY * CHUNK_SIZE;

    const biomeIndex = this.getOrAssignChunkBiomeIndex(chunkX, chunkY);
    const biome = this.biomeManager.getBiomeByIndex(biomeIndex);

    const biomeFeatures = this.featureGenerator.generateFeaturesForChunk(chunkX, chunkY, worldX, worldY, CHUNK_SIZE, biome);
    const obstacles = this.generateObstacles(chunkX, chunkY, worldX, worldY, biome, biomeFeatures);
    const enemies = this.generateEnemies(chunkX, chunkY, worldX, worldY, biome);
    const resourceNodes = this.generateResourceNodes(chunkX, chunkY, worldX, worldY, biome, biomeFeatures);
    const portals = this.generatePortals(chunkX, chunkY, worldX, worldY, biome);
    const extractionPoint = this.generateExtractionPoint(chunkX, chunkY, worldX, worldY, biome);
    const chests = this.generateChests(chunkX, chunkY, worldX, worldY, biome);
    const fieldAnchors = this.generateFieldAnchors(chunkX, chunkY, worldX, worldY);

    return {
      x: chunkX,
      y: chunkY,
      id: this.getChunkKey(chunkX, chunkY),
      biomeId: biome.id,
      obstacles,
      enemies,
      resourceNodes,
      portals,
      extractionPoint,
      chests,
      biomeFeatures,
      fieldAnchors,
    };
  }

  private generateObstacles(chunkX: number, chunkY: number, worldX: number, worldY: number, biome: BiomeConfig, biomeFeatures: AnyBiomeFeature[]): EnvObstacle[] {
    const obstacles: EnvObstacle[] = [];
    const obstacleCount = Math.floor(this.seededRandom(chunkX, chunkY, 1) * 8) + 3;

    for (let i = 0; i < obstacleCount; i++) {
      const x = worldX + this.seededRandom(chunkX, chunkY, i * 2) * CHUNK_SIZE;
      const y = worldY + this.seededRandom(chunkX, chunkY, i * 2 + 1) * CHUNK_SIZE;
      const typeRand = this.seededRandom(chunkX, chunkY, i * 3);
      const color = biome.obstacleColors[Math.floor(this.seededRandom(chunkX, chunkY, i * 6) * biome.obstacleColors.length)];
      let size: number;
      let shape: 'rectangle' | 'circle';

      if (typeRand < 0.5) {
        size = 30 + this.seededRandom(chunkX, chunkY, i * 4) * 40;
        shape = 'circle';
      } else {
        size = 40 + this.seededRandom(chunkX, chunkY, i * 4) * 60;
        shape = 'rectangle';
      }

      const obstacle: EnvObstacle = {
        id: generateId(),
        position: createVector(x, y),
        size: shape === 'circle' ? { x: size, y: size } : { x: size, y: size * 0.6 },
        rotation: this.seededRandom(chunkX, chunkY, i * 5) * Math.PI * 2,
        color,
        shape,
      };

      const gravityAnomalies = biomeFeatures.filter(f => f.type === 'gravity-anomaly');
      for (const anomaly of gravityAnomalies) {
        const dx = x - anomaly.position.x;
        const dy = y - anomaly.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 120 && distance < 300) {
          const angle = Math.atan2(dy, dx);
          const direction = this.seededRandom(chunkX, chunkY, i * 7 + 500) > 0.5 ? 1 : -1;
          const speed = 0.3 + this.seededRandom(chunkX, chunkY, i * 8 + 600) * 0.8;

          obstacle.orbitData = {
            centerX: anomaly.position.x,
            centerY: anomaly.position.y,
            distance,
            angle,
            speed,
            direction,
          };
          break;
        }
      }

      obstacles.push(obstacle);
    }
    return obstacles;
  }

  private generateEnemies(chunkX: number, chunkY: number, worldX: number, worldY: number, biome: BiomeConfig): Enemy[] {
    const potentialEnemies: Enemy[] = [];
    const distanceFromOrigin = Math.sqrt(chunkX * chunkX + chunkY * chunkY);
    const enemyCount = Math.floor(this.seededRandom(chunkX, chunkY, 10) * 5) + Math.floor(distanceFromOrigin * 0.5);

    let enemyTypes = [...biome.uniqueEnemyTypes];

    if (distanceFromOrigin > 3) {
      enemyTypes.push('orbiter', 'fragmenter', 'pulsar', 'spiraler', 'replicator', 'vortex');
    }

    const MIN_SPAWN_SPACING = 200;

    for (let i = 0; i < enemyCount; i++) {
      let x: number;
      let y: number;
      let attempts = 0;
      let validPosition = false;

      do {
        x = worldX + this.seededRandom(chunkX, chunkY, i * 20 + 100 + attempts * 7777) * (CHUNK_SIZE * 0.8) + (CHUNK_SIZE * 0.1);
        y = worldY + this.seededRandom(chunkX, chunkY, i * 20 + 101 + attempts * 7777) * (CHUNK_SIZE * 0.8) + (CHUNK_SIZE * 0.1);

        validPosition = true;
        for (const existing of potentialEnemies) {
          const dist = Math.sqrt(Math.pow(x - existing.position.x, 2) + Math.pow(y - existing.position.y, 2));
          if (dist < MIN_SPAWN_SPACING) {
            validPosition = false;
            break;
          }
        }

        attempts++;
      } while (!validPosition && attempts < 20);

      if (!validPosition) continue;

      const typeIndex = Math.floor(this.seededRandom(chunkX, chunkY, i * 21) * enemyTypes.length);
      const enemyType = enemyTypes[typeIndex];
      const config = BASE_ENEMY_CONFIGS[enemyType];
      const scaleFactor = 1 + distanceFromOrigin * 0.05;

      let detectionRadius: number;
      if (enemyType === 'sniper' || enemyType === 'artillery') {
        detectionRadius = 180 + this.seededRandom(chunkX, chunkY, i * 22) * 20;
      } else if (enemyType === 'tank') {
        detectionRadius = 50 + this.seededRandom(chunkX, chunkY, i * 22) * 20;
      } else {
        detectionRadius = 80 + this.seededRandom(chunkX, chunkY, i * 22) * 30;
      }

      const uniqueSeed = this.seededRandom(chunkX, chunkY, i * 99 + 777);
      let enemy: Enemy = {
        id: `enemy-${chunkX}-${chunkY}-${i}-${Math.floor(uniqueSeed * 10000)}`,
        position: createVector(x, y),
        velocity: createVector(),
        rotation: 0,
        health: Math.floor(config.health * scaleFactor),
        maxHealth: Math.floor(config.health * scaleFactor),
        damage: Math.floor(config.damage * scaleFactor),
        size: config.size,
        speed: config.speed,
        color: config.color,
        type: enemyType,
        attackCooldown: 1,
        currencyDrop: Math.floor(config.currency * (1 + distanceFromOrigin * 0.1)),
        detectionRadius: detectionRadius,
        isAggro: false,
      };

      enemy = this.biomeManager.modifyEnemyForBiome(enemy, biome);

      if (this.modifierSystem.shouldApplyModifier() && distanceFromOrigin > 1) {
        const modifierCount = distanceFromOrigin > 4 ? 2 : 1;
        const modifiers = this.modifierSystem.getRandomModifiers(modifierCount);
        enemy.modifiers = modifiers;
      }

      potentialEnemies.push(enemy);
    }


    const eliteRoll = this.seededRandom(chunkX, chunkY, 9997);
    if (eliteRoll < 0.08 && distanceFromOrigin > 2) {
      const x = worldX + this.seededRandom(chunkX, chunkY, 9996) * CHUNK_SIZE;
      const y = worldY + this.seededRandom(chunkX, chunkY, 9995) * CHUNK_SIZE;
      const wave = Math.floor(distanceFromOrigin);
    }

    return potentialEnemies.filter(e => !this.killedEnemyIds.has(e.id));
  }

  private generateResourceNodes(chunkX: number, chunkY: number, worldX: number, worldY: number, biome: BiomeConfig, biomeFeatures: AnyBiomeFeature[]): ResourceNode[] {
    const nodes: ResourceNode[] = [];
    const nodeCount = Math.floor(this.seededRandom(chunkX, chunkY, 50) * 4) + 2;

    const availableResources = ['energy', 'geoShards', ...biome.uniqueResources];
    if (this.seededRandom(chunkX, chunkY, 51) < 0.5) availableResources.push('coreDust');
    if (this.seededRandom(chunkX, chunkY, 52) < 0.6) availableResources.push('alloyFragments');
    if (this.seededRandom(chunkX, chunkY, 53) < 0.05) availableResources.push('singularityCore');

    for (let i = 0; i < nodeCount; i++) {
      const resourceType = availableResources[Math.floor(this.seededRandom(chunkX, chunkY, i * 31) * availableResources.length)] as ResourceType;

      let x: number;
      let y: number;
      let positioned = false;

      if (resourceType === 'cryoKelp') {
        const glacialSpires = biomeFeatures.filter(f => f.type === 'glacial-spire');
        if (glacialSpires.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 5000) < 0.95) {
          const spire = glacialSpires[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 5001) * glacialSpires.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 5002) * Math.PI * 2;
          const distance = 30 + this.seededRandom(chunkX, chunkY, i * 103 + 5003) * 60;
          x = spire.position.x + Math.cos(angle) * distance;
          y = spire.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'voidEssence') {
        const gravityAnomalies = biomeFeatures.filter(f => f.type === 'gravity-anomaly');
        if (gravityAnomalies.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 6000) < 0.75) {
          const anomaly = gravityAnomalies[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 6001) * gravityAnomalies.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 6002) * Math.PI * 2;
          const distance = 50 + this.seededRandom(chunkX, chunkY, i * 103 + 6003) * 100;
          x = anomaly.position.x + Math.cos(angle) * distance;
          y = anomaly.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'obsidianHeart') {
        const lavaPillars = biomeFeatures.filter(f => f.type === 'lava-pillar');
        if (lavaPillars.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 7000) < 0.7) {
          const pillar = lavaPillars[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 7001) * lavaPillars.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 7002) * Math.PI * 2;
          const distance = 60 + this.seededRandom(chunkX, chunkY, i * 103 + 7003) * 70;
          x = pillar.position.x + Math.cos(angle) * distance;
          y = pillar.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'gloomRoot') {
        const voidGaps = biomeFeatures.filter(f => f.type === 'void-gap');
        if (voidGaps.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 8000) < 0.65) {
          const voidGap = voidGaps[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 8001) * voidGaps.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 8002) * Math.PI * 2;
          const distance = 80 + this.seededRandom(chunkX, chunkY, i * 103 + 8003) * 90;
          x = voidGap.position.x + Math.cos(angle) * distance;
          y = voidGap.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'resonantCrystal') {
        const crystalFormations = biomeFeatures.filter(f => f.type === 'crystal-formation');
        if (crystalFormations.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 9000) < 0.8) {
          const formation = crystalFormations[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 9001) * crystalFormations.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 9002) * Math.PI * 2;
          const distance = 70 + this.seededRandom(chunkX, chunkY, i * 103 + 9003) * 100;
          x = formation.position.x + Math.cos(angle) * distance;
          y = formation.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'bioluminescentPearl') {
        const coralReefs = biomeFeatures.filter(f => f.type === 'coral-reef');
        if (coralReefs.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 10000) < 0.95) {
          const reef = coralReefs[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 10001) * coralReefs.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 10002) * Math.PI * 2;
          const distance = 20 + this.seededRandom(chunkX, chunkY, i * 103 + 10003) * 50;
          x = reef.position.x + Math.cos(angle) * distance;
          y = reef.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'sunpetalBloom') {
        const bloomTrees = biomeFeatures.filter(f => f.type === 'bloom-tree');
        if (bloomTrees.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 11000) < 0.75) {
          const tree = bloomTrees[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 11001) * bloomTrees.length)];
          const ringIndex = Math.floor(this.seededRandom(chunkX, chunkY, i * 102 + 11002) * 3);
          const angle = this.seededRandom(chunkX, chunkY, i * 103 + 11003) * Math.PI * 2;
          const distance = 80 + ringIndex * 50 + this.seededRandom(chunkX, chunkY, i * 104 + 11004) * 30;
          x = tree.position.x + Math.cos(angle) * distance;
          y = tree.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'aetheriumShard') {
        const realityTears = biomeFeatures.filter(f => f.type === 'reality-tear');
        if (realityTears.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 12000) < 0.7) {
          const tear = realityTears[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 12001) * realityTears.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 12002) * Math.PI * 2;
          const distance = 100 + this.seededRandom(chunkX, chunkY, i * 103 + 12003) * 150;
          x = tear.position.x + Math.cos(angle) * distance;
          y = tear.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      } else if (resourceType === 'gravitonEssence') {
        const gravityAnomalies = biomeFeatures.filter(f => f.type === 'gravity-anomaly');
        if (gravityAnomalies.length > 0 && this.seededRandom(chunkX, chunkY, i * 100 + 13000) < 0.9) {
          const anomaly = gravityAnomalies[Math.floor(this.seededRandom(chunkX, chunkY, i * 101 + 13001) * gravityAnomalies.length)];
          const angle = this.seededRandom(chunkX, chunkY, i * 102 + 13002) * Math.PI * 2;
          const distance = 120 + this.seededRandom(chunkX, chunkY, i * 103 + 13003) * 80;
          x = anomaly.position.x + Math.cos(angle) * distance;
          y = anomaly.position.y + Math.sin(angle) * distance;
          positioned = true;
        }
      }

      if (!positioned) {
        x = worldX + this.seededRandom(chunkX, chunkY, i * 30 + 200) * CHUNK_SIZE;
        y = worldY + this.seededRandom(chunkX, chunkY, i * 30 + 201) * CHUNK_SIZE;
      }

      const color = biome.resourceColors[resourceType] || '#ffffff';
      let shape: ResourceNode['shape'] = 'boulder';

      if (resourceType === 'energy') shape = 'crystal';
      if (resourceType === 'coreDust') shape = 'shard';
      if (resourceType === 'flux') shape = 'crystal';
      if (resourceType === 'geoShards') shape = 'geode';
      if (resourceType === 'alloyFragments') shape = 'shard';
      if (resourceType === 'singularityCore') shape = 'boulder';
      if (resourceType === 'cryoKelp') shape = 'kelp';
      if (resourceType === 'obsidianHeart') shape = 'heart';
      if (resourceType === 'gloomRoot') shape = 'root';
      if (resourceType === 'resonantCrystal') shape = 'crystal';
      if (resourceType === 'voidEssence') shape = 'shard';
      if (resourceType === 'bioluminescentPearl') shape = 'pearl';
      if (resourceType === 'sunpetalBloom') shape = 'bloom';
      if (resourceType === 'aetheriumShard') shape = 'crystal';
      if (resourceType === 'gravitonEssence') shape = 'graviton';

      const health = 1;
      nodes.push({
        id: generateId(),
        position: createVector(x, y),
        size: 30,
        health,
        maxHealth: health,
        resourceType,
        shape,
        color,
        value: randomRange(1, 5),
        bobPhase: randomRange(0, Math.PI * 2),
      });
    }
    return nodes;
  }

  private generateChests(chunkX: number, chunkY: number, worldX: number, worldY: number, biome: BiomeConfig): Chest[] {
    const chests: Chest[] = [];
    const chestCount = Math.floor(this.seededRandom(chunkX, chunkY, 300) * 3);

    for (let i = 0; i < chestCount; i++) {
      const x = worldX + this.seededRandom(chunkX, chunkY, i * 40 + 300) * CHUNK_SIZE;
      const y = worldY + this.seededRandom(chunkX, chunkY, i * 40 + 301) * CHUNK_SIZE;
      const typeRand = this.seededRandom(chunkX, chunkY, i * 41);

      if (typeRand < 0.2) {
        chests.push({
          id: generateId(),
          position: createVector(x, y),
          size: 30,
          type: 'timed',
          isOpen: false,
          timer: 0,
          maxTime: 5,
          radius: 120,
          rotation: 0,
        });
      } else if (typeRand < 0.4) {
        chests.push({
          id: generateId(),
          position: createVector(x, y),
          size: 28,
          type: 'locked',
          isOpen: false,
          rotation: 0,
          requiresKey: true,
        });
      } else {
        chests.push({
          id: generateId(),
          position: createVector(x, y),
          size: 25,
          type: 'regular',
          isOpen: false,
          rotation: 0,
        });
      }
    }
    return chests;
  }

  private generatePortals(chunkX: number, chunkY: number, worldX: number, worldY: number, biome: BiomeConfig): Portal[] {
    const portals: Portal[] = [];
    const distanceFromOrigin = Math.sqrt(chunkX * chunkX + chunkY * chunkY);
    if (distanceFromOrigin > 2 && this.seededRandom(chunkX, chunkY, 80) < 0.1) {
      const x = worldX + this.seededRandom(chunkX, chunkY, 81) * (CHUNK_SIZE - 400) + 200;
      const y = worldY + this.seededRandom(chunkX, chunkY, 82) * (CHUNK_SIZE - 400) + 200;
      
      const newPortal: Portal = {
        id: generateId(),
        position: createVector(x, y),
        size: 40,
        color: biome.accentColor,
      };

      this.allPortals.push(newPortal);
      portals.push(newPortal);

      if (this.unlinkedPortal) {
        newPortal.linkedPortalId = this.unlinkedPortal.id;
        this.unlinkedPortal.linkedPortalId = newPortal.id;
        this.unlinkedPortal = null;
      } else {
        this.unlinkedPortal = newPortal;
      }
    }
    return portals;
  }

  private generateFieldAnchors(chunkX: number, chunkY: number, worldX: number, worldY: number): Array<{ x: number; y: number }> {
    const anchors: Array<{ x: number; y: number }> = [];
    const distanceFromOrigin = Math.sqrt(chunkX * chunkX + chunkY * chunkY);
    
    // Spawn field anchors with 15% chance in chunks that are at least 3 chunks away from origin
    if (distanceFromOrigin > 3 && this.seededRandom(chunkX, chunkY, 95) < 0.15) {
      const x = worldX + this.seededRandom(chunkX, chunkY, 96) * (CHUNK_SIZE - 300) + 150;
      const y = worldY + this.seededRandom(chunkX, chunkY, 97) * (CHUNK_SIZE - 300) + 150;
      
      anchors.push({ x, y });
    }
    
    return anchors;
  }

  private generateExtractionPoint(chunkX: number, chunkY: number, worldX: number, worldY: number, biome: BiomeConfig): ExtractionPoint | undefined {
    const distanceFromOrigin = Math.sqrt(chunkX * chunkX + chunkY * chunkY);
    if (distanceFromOrigin > 2 && this.seededRandom(chunkX, chunkY, 90) < 0.1) {
      const x = worldX + CHUNK_SIZE / 2;
      const y = worldY + CHUNK_SIZE / 2;
      return {
        id: generateId(),
        position: createVector(x, y),
        size: 50,
        active: true,
      };
    }
    return undefined;
  }

  getActiveChunks(centerX: number, centerY: number, radius: number = 2): Chunk[] {
    const chunkX = Math.floor(centerX / CHUNK_SIZE);
    const chunkY = Math.floor(centerY / CHUNK_SIZE);
    const chunks: Chunk[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        chunks.push(this.getOrGenerateChunk(chunkX + dx, chunkY + dy));
      }
    }
    return chunks;
  }

  unloadDistantChunks(centerX: number, centerY: number, unloadRadius: number = 4): void {
    const chunkX = Math.floor(centerX / CHUNK_SIZE);
    const chunkY = Math.floor(centerY / CHUNK_SIZE);
    const toRemove: string[] = [];
    this.chunks.forEach((chunk, key) => {
      const dx = Math.abs(chunk.x - chunkX);
      const dy = Math.abs(chunk.y - chunkY);
      if (dx > unloadRadius || dy > unloadRadius) {
        toRemove.push(key);
      }
    });
    toRemove.forEach(key => this.chunks.delete(key));
  }

  public getAllPortals(): Portal[] {
    return this.allPortals;
  }

  public registerEnemyKill(enemyId: string): void {
    this.killedEnemyIds.add(enemyId);
  }

  public getSeed(): number {
    return this.seed;
  }

  public reset(): void {
    this.chunks.clear();
    this.chunkBiomeMap.clear();
    this.allPortals = [];
    this.unlinkedPortal = null;
    this.killedEnemyIds.clear();
  }

  public serializeWorldData(): any {
    const chunksArray = Array.from(this.chunks.entries()).map(([key, chunk]) => ({
      key,
      chunk,
    }));

    const chunkBiomeMapArray = Array.from(this.chunkBiomeMap.entries()).map(([key, value]) => ({
      key,
      value,
    }));

    return {
      seed: this.seed,
      chunks: chunksArray,
      chunkBiomeMap: chunkBiomeMapArray,
      allPortals: this.allPortals,
      unlinkedPortal: this.unlinkedPortal,
      killedEnemyIds: Array.from(this.killedEnemyIds),
    };
  }

  public hydrateWorldData(worldData: any): void {
    this.seed = worldData.seed;
    
    this.featureGenerator = new BiomeFeatureGenerator(this.seed);
    
    this.chunks.clear();
    worldData.chunks.forEach(({ key, chunk }: any) => {
      this.chunks.set(key, chunk);
    });

    this.chunkBiomeMap.clear();
    worldData.chunkBiomeMap.forEach(({ key, value }: any) => {
      this.chunkBiomeMap.set(key, value);
    });

    this.allPortals = worldData.allPortals || [];
    this.unlinkedPortal = worldData.unlinkedPortal || null;
    this.killedEnemyIds = new Set(worldData.killedEnemyIds || []);
  }
}
