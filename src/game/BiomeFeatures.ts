import { Vector2 } from '../types/game';
import { generateId, createVector } from './utils';
import { BiomeConfig } from './BiomeSystem';

export interface BiomeFeature {
  id: string;
  type: string;
  position: Vector2;
  size: number;
  rotation: number;
  data: any;
}

export interface IslandFeature extends BiomeFeature {
  type: 'island';
  data: {
    width: number;
    height: number;
    shape: 'irregular' | 'circular' | 'elongated';
    edgeColor: string;
    surfaceColor: string;
    isFloating: boolean;
    stabilityBonus: number;
  };
}

export interface VoidGapFeature extends BiomeFeature {
  type: 'void-gap';
  data: {
    width: number;
    height: number;
    depth: number;
    voidDamage: number;
    voidPullStrength: number;
    voidTendrils: Array<{
      angle: number;
      length: number;
      speed: number;
    }>;
    hasOminousTendril?: boolean;
    ominousTendrilAngle?: number;
    ominousTendrilPulse?: number;
  };
}

export interface RealityTearFeature extends BiomeFeature {
  type: 'reality-tear';
  data: {
    width: number;
    height: number;
    pulseSpeed: number;
    targetPortalId?: string;
    isActive: boolean;
    isPortal: boolean;
    particles: Array<{
      offset: Vector2;
      speed: number;
      angle: number;
    }>;
  };
}

export interface GlacialSpireFeature extends BiomeFeature {
  type: 'glacial-spire';
  data: {
    height: number;
    baseWidth: number;
    segments: number;
    iceColor: string;
    shatterTimer: number;
    shatterCooldown: number;
    canShatter: boolean;
    shardCount: number;
    snowDrift: Array<{
      offset: Vector2;
      size: number;
      angle: number;
    }>;
  };
}

export interface LavaPillarFeature extends BiomeFeature {
  type: 'lava-pillar';
  data: {
    height: number;
    width: number;
    glowIntensity: number;
    bubblingSpeed: number;
    eruptionTimer: number;
    eruptionCooldown: number;
    isErupting: boolean;
    eruptionDuration: number;
    lavaParticles: Array<{
      offset: Vector2;
      velocity: Vector2;
      lifetime: number;
    }>;
  };
}

export interface ToxicPoolFeature extends BiomeFeature {
  type: 'toxic-pool';
  data: {
    radius: number;
    damagePerSecond: number;
    slowFactor: number;
    bubbles: Array<{
      offset: Vector2;
      size: number;
      speed: number;
    }>;
    miasma: Array<{
      offset: Vector2;
      radius: number;
      pulseSpeed: number;
    }>;
  };
}

export interface CrystalFormationFeature extends BiomeFeature {
  type: 'crystal-formation';
  data: {
    crystals: Array<{
      offset: Vector2;
      height: number;
      width: number;
      angle: number;
    }>;
    glowColor: string;
    resonanceTimer: number;
    resonanceCooldown: number;
    isResonating: boolean;
    damageAmplification: number;
  };
}

export interface CoralReefFeature extends BiomeFeature {
  type: 'coral-reef';
  data: {
    branches: Array<{
      offset: Vector2;
      length: number;
      angle: number;
      thickness: number;
    }>;
    swaySpeed: number;
    healingRate: number;
    healingRadius: number;
    waterPools: Array<{
      offset: Vector2;
      radius: number;
    }>;
    fishSchools: Array<{
      offset: Vector2;
      count: number;
      speed: number;
      angle: number;
    }>;
  };
}

export interface BloomTreeFeature extends BiomeFeature {
  type: 'bloom-tree';
  data: {
    trunkHeight: number;
    trunkWidth: number;
    canopyRadius: number;
    petalCount: number;
    glowColor: string;
    energyRegenRate: number;
    energyRadius: number;
    pulseTimer: number;
    fallingPetals: Array<{
      offset: Vector2;
      velocity: Vector2;
      rotation: number;
      size: number;
    }>;
  };
}

export interface GravityAnomalyFeature extends BiomeFeature {
  type: 'gravity-anomaly';
  data: {
    radius: number;
    strength: number;
    rotationSpeed: number;
    pullStrength: number;
    crushDamage: number;
    orbitingDebris: Array<{
      distance: number;
      angle: number;
      size: number;
      speed: number;
      orbitDirection: number;
    }>;
    gravitonResources: Array<{
      distance: number;
      angle: number;
      size: number;
      orbitSpeed: number;
    }>;
  };
}

export type AnyBiomeFeature =
  | IslandFeature
  | VoidGapFeature
  | RealityTearFeature
  | GlacialSpireFeature
  | LavaPillarFeature
  | ToxicPoolFeature
  | CrystalFormationFeature
  | CoralReefFeature
  | BloomTreeFeature
  | GravityAnomalyFeature;

export class BiomeFeatureGenerator {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  private seededRandom(x: number, y: number, offset: number = 0): number {
    const seed = this.seed + x * 73856093 + y * 19349663 + offset * 83492791;
    const value = Math.sin(seed) * 43758.5453123;
    return value - Math.floor(value);
  }

  generateFeaturesForChunk(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    biome: BiomeConfig
  ): AnyBiomeFeature[] {
    const features: AnyBiomeFeature[] = [];

    switch (biome.id) {
      case 'frozen-tundra':
        features.push(
          ...this.generateGlacialSpires(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;

      case 'volcanic-wastes':
        features.push(
          ...this.generateLavaPillars(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;

      case 'toxic-swamp':
        features.push(
          ...this.generateToxicPools(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;

      case 'crystal-caverns':
        features.push(
          ...this.generateCrystalFormations(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;

      case 'void-nebula':
        features.push(
          ...this.generateRealityTears(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;

      case 'coral-depths':
        features.push(
          ...this.generateCoralReefs(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;

      case 'radiant-gardens':
        features.push(
          ...this.generateBloomTrees(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;

      case 'shattered-expanse':
        features.push(
          ...this.generateShatteredIslands(
            chunkX,
            chunkY,
            worldX,
            worldY,
            chunkSize,
            biome
          )
        );
        break;
    }

    return features;
  }

  private generateShatteredIslands(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    biome: BiomeConfig
  ): (IslandFeature | VoidGapFeature | GravityAnomalyFeature)[] {
    const features: (IslandFeature | VoidGapFeature | GravityAnomalyFeature)[] =
      [];

    const islandCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 5000) * 2) + 1;

    for (let i = 0; i < islandCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 100 + 5000) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 100 + 5001) * chunkSize;
      const width =
        150 + this.seededRandom(chunkX, chunkY, i * 100 + 5002) * 200;
      const height =
        150 + this.seededRandom(chunkX, chunkY, i * 100 + 5003) * 200;

      const shapes: Array<'irregular' | 'circular' | 'elongated'> = [
        'irregular',
        'circular',
        'elongated',
      ];
      const shape =
        shapes[
          Math.floor(
            this.seededRandom(chunkX, chunkY, i * 100 + 5004) * shapes.length
          )
        ];

      features.push({
        id: generateId(),
        type: 'island',
        position: createVector(x, y),
        size: Math.max(width, height),
        rotation:
          this.seededRandom(chunkX, chunkY, i * 100 + 5005) * Math.PI * 2,
        data: {
          width,
          height,
          shape,
          edgeColor: biome.accentColor,
          surfaceColor: biome.floorColor,
          isFloating: true,
          stabilityBonus: 0.3,
        },
      });
    }

    const voidGapCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 5100) * 2) + 1;
    for (let i = 0; i < voidGapCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 110 + 5100) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 110 + 5101) * chunkSize;

      const tendrilCount = 3 + Math.floor(this.seededRandom(chunkX, chunkY, i * 110 + 5150) * 4);
      const voidTendrils = [];
      for (let j = 0; j < tendrilCount; j++) {
        voidTendrils.push({
          angle: (j / tendrilCount) * Math.PI * 2 + this.seededRandom(chunkX, chunkY, j * 115 + 5250) * 0.5,
          length: 60 + this.seededRandom(chunkX, chunkY, j * 115 + 5251) * 100,
          speed: 0.5 + this.seededRandom(chunkX, chunkY, j * 115 + 5252) * 1.0,
        });
      }

      const hasOminousTendril = this.seededRandom(chunkX, chunkY, i * 110 + 5160) > 0.65;

      features.push({
        id: generateId(),
        type: 'void-gap',
        position: createVector(x, y),
        size: 200,
        rotation: 0,
        data: {
          width: 150 + this.seededRandom(chunkX, chunkY, i * 110 + 5102) * 150,
          height: 150 + this.seededRandom(chunkX, chunkY, i * 110 + 5103) * 150,
          depth: 5,
          voidDamage: 15,
          voidPullStrength: 0.8,
          voidTendrils,
          hasOminousTendril,
          ominousTendrilAngle: hasOminousTendril ? this.seededRandom(chunkX, chunkY, i * 110 + 5161) * Math.PI * 2 : 0,
          ominousTendrilPulse: 0,
        },
      });
    }

    if (this.seededRandom(chunkX, chunkY, 5200) < 0.3) {
      const x = worldX + chunkSize / 2;
      const y = worldY + chunkSize / 2;

      const debrisCount =
        8 + Math.floor(this.seededRandom(chunkX, chunkY, 5201) * 10);
      const orbitingDebris = [];

      for (let i = 0; i < debrisCount; i++) {
        const orbitDirection = this.seededRandom(chunkX, chunkY, i * 120 + 5214) > 0.5 ? 1 : -1;
        orbitingDebris.push({
          distance:
            100 + this.seededRandom(chunkX, chunkY, i * 120 + 5210) * 150,
          angle:
            this.seededRandom(chunkX, chunkY, i * 120 + 5211) * Math.PI * 2,
          size: 10 + this.seededRandom(chunkX, chunkY, i * 120 + 5212) * 20,
          speed: 0.5 + this.seededRandom(chunkX, chunkY, i * 120 + 5213) * 1.5,
          orbitDirection,
        });
      }

      const resourceCount = 3 + Math.floor(this.seededRandom(chunkX, chunkY, 5220) * 5);
      const gravitonResources = [];

      for (let i = 0; i < resourceCount; i++) {
        gravitonResources.push({
          distance: 110 + this.seededRandom(chunkX, chunkY, i * 125 + 5225) * 180,
          angle: this.seededRandom(chunkX, chunkY, i * 125 + 5226) * Math.PI * 2,
          size: 15 + this.seededRandom(chunkX, chunkY, i * 125 + 5227) * 10,
          orbitSpeed: 0.3 + this.seededRandom(chunkX, chunkY, i * 125 + 5228) * 0.8,
        });
      }

      features.push({
        id: generateId(),
        type: 'gravity-anomaly',
        position: createVector(x, y),
        size: 100,
        rotation: 0,
        data: {
          radius: 80,
          strength: 1.5,
          rotationSpeed: 0.02,
          pullStrength: 1.2,
          crushDamage: 25,
          orbitingDebris,
          gravitonResources,
        },
      });
    }

    return features;
  }

  private generateRealityTears(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    _biome: BiomeConfig
  ): RealityTearFeature[] {
    const features: RealityTearFeature[] = [];

    if (this.seededRandom(chunkX, chunkY, 6000) < 0.4) {
      const x = worldX + this.seededRandom(chunkX, chunkY, 6001) * chunkSize;
      const y = worldY + this.seededRandom(chunkX, chunkY, 6002) * chunkSize;
      const width = 80 + this.seededRandom(chunkX, chunkY, 6003) * 120;
      const height = 150 + this.seededRandom(chunkX, chunkY, 6004) * 200;

      const particleCount =
        15 + Math.floor(this.seededRandom(chunkX, chunkY, 6005) * 20);
      const particles = [];

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          offset: createVector(
            (this.seededRandom(chunkX, chunkY, i * 130 + 6010) - 0.5) * width,
            (this.seededRandom(chunkX, chunkY, i * 130 + 6011) - 0.5) * height
          ),
          speed: 0.5 + this.seededRandom(chunkX, chunkY, i * 130 + 6012) * 2,
          angle:
            this.seededRandom(chunkX, chunkY, i * 130 + 6013) * Math.PI * 2,
        });
      }

      const isPortal = this.seededRandom(chunkX, chunkY, 6025) < 0.5;
      features.push({
        id: generateId(),
        type: 'reality-tear',
        position: createVector(x, y),
        size: Math.max(width, height),
        rotation: this.seededRandom(chunkX, chunkY, 6020) * Math.PI * 2,
        data: {
          width,
          height,
          pulseSpeed: 0.02 + this.seededRandom(chunkX, chunkY, 6021) * 0.03,
          isActive: true,
          isPortal,
          particles,
        },
      });
    }

    return features;
  }

  private generateGlacialSpires(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    biome: BiomeConfig
  ): GlacialSpireFeature[] {
    const features: GlacialSpireFeature[] = [];
    const spireCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 1000) * 2) + 1;

    for (let i = 0; i < spireCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 10 + 1000) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 10 + 1001) * chunkSize;

      const snowDriftCount = 2 + Math.floor(this.seededRandom(chunkX, chunkY, i * 10 + 1010) * 3);
      const snowDrift = [];
      for (let j = 0; j < snowDriftCount; j++) {
        const driftAngle = this.seededRandom(chunkX, chunkY, j * 15 + 1100) * Math.PI * 2;
        const driftDist = 40 + this.seededRandom(chunkX, chunkY, j * 15 + 1101) * 60;
        snowDrift.push({
          offset: createVector(
            Math.cos(driftAngle) * driftDist,
            Math.sin(driftAngle) * driftDist
          ),
          size: 20 + this.seededRandom(chunkX, chunkY, j * 15 + 1102) * 40,
          angle: this.seededRandom(chunkX, chunkY, j * 15 + 1103) * Math.PI * 2,
        });
      }

      features.push({
        id: generateId(),
        type: 'glacial-spire',
        position: createVector(x, y),
        size: 100,
        rotation:
          this.seededRandom(chunkX, chunkY, i * 10 + 1002) * Math.PI * 2,
        data: {
          height: 120 + this.seededRandom(chunkX, chunkY, i * 10 + 1003) * 180,
          baseWidth: 60 + this.seededRandom(chunkX, chunkY, i * 10 + 1004) * 80,
          segments:
            5 +
            Math.floor(this.seededRandom(chunkX, chunkY, i * 10 + 1005) * 4),
          iceColor: biome.accentColor,
          shatterTimer: 0,
          shatterCooldown: 10,
          canShatter: true,
          shardCount: 8,
          snowDrift,
        },
      });
    }

    return features;
  }

  private generateLavaPillars(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    _biome: BiomeConfig
  ): LavaPillarFeature[] {
    const features: LavaPillarFeature[] = [];
    const pillarCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 2000) * 2) + 1;

    for (let i = 0; i < pillarCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 20 + 2000) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 20 + 2001) * chunkSize;

      features.push({
        id: generateId(),
        type: 'lava-pillar',
        position: createVector(x, y),
        size: 80,
        rotation: 0,
        data: {
          height: 100 + this.seededRandom(chunkX, chunkY, i * 20 + 2002) * 150,
          width: 50 + this.seededRandom(chunkX, chunkY, i * 20 + 2003) * 50,
          glowIntensity:
            20 + this.seededRandom(chunkX, chunkY, i * 20 + 2004) * 20,
          bubblingSpeed:
            0.03 + this.seededRandom(chunkX, chunkY, i * 20 + 2005) * 0.02,
          eruptionTimer: this.seededRandom(chunkX, chunkY, i * 20 + 2006) * 5,
          eruptionCooldown:
            5 + this.seededRandom(chunkX, chunkY, i * 20 + 2007) * 3,
          isErupting: false,
          eruptionDuration: 1.5,
          lavaParticles: [],
        },
      });
    }

    return features;
  }

  private generateToxicPools(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    _biome: BiomeConfig
  ): ToxicPoolFeature[] {
    const features: ToxicPoolFeature[] = [];
    const poolCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 3000) * 2) + 1;

    for (let i = 0; i < poolCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 30 + 3000) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 30 + 3001) * chunkSize;
      const radius =
        60 + this.seededRandom(chunkX, chunkY, i * 30 + 3002) * 100;

      const bubbleCount =
        5 + Math.floor(this.seededRandom(chunkX, chunkY, i * 30 + 3003) * 6);
      const bubbles = [];

      for (let j = 0; j < bubbleCount; j++) {
        const angle =
          this.seededRandom(chunkX, chunkY, j * 40 + 3100) * Math.PI * 2;
        const dist =
          this.seededRandom(chunkX, chunkY, j * 40 + 3101) * radius * 0.8;

        bubbles.push({
          offset: createVector(Math.cos(angle) * dist, Math.sin(angle) * dist),
          size: 5 + this.seededRandom(chunkX, chunkY, j * 40 + 3102) * 15,
          speed: 0.5 + this.seededRandom(chunkX, chunkY, j * 40 + 3103) * 1.5,
        });
      }

      const miasmaCount = 2 + Math.floor(this.seededRandom(chunkX, chunkY, i * 30 + 3050) * 3);
      const miasma = [];
      for (let j = 0; j < miasmaCount; j++) {
        const miasmaAngle = this.seededRandom(chunkX, chunkY, j * 45 + 3200) * Math.PI * 2;
        const miasmaDist = this.seededRandom(chunkX, chunkY, j * 45 + 3201) * radius * 0.5;
        miasma.push({
          offset: createVector(Math.cos(miasmaAngle) * miasmaDist, Math.sin(miasmaAngle) * miasmaDist),
          radius: 30 + this.seededRandom(chunkX, chunkY, j * 45 + 3202) * 50,
          pulseSpeed: 0.5 + this.seededRandom(chunkX, chunkY, j * 45 + 3203) * 1.0,
        });
      }

      features.push({
        id: generateId(),
        type: 'toxic-pool',
        position: createVector(x, y),
        size: radius * 2,
        rotation: 0,
        data: {
          radius,
          damagePerSecond: 8,
          slowFactor: 0.6,
          bubbles,
          miasma,
        },
      });
    }

    return features;
  }

  private generateCrystalFormations(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    biome: BiomeConfig
  ): CrystalFormationFeature[] {
    const features: CrystalFormationFeature[] = [];
    const formationCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 4000) * 2) + 1;

    for (let i = 0; i < formationCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 50 + 4000) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 50 + 4001) * chunkSize;

      const crystalCount =
        4 + Math.floor(this.seededRandom(chunkX, chunkY, i * 50 + 4002) * 5);
      const crystals = [];

      for (let j = 0; j < crystalCount; j++) {
        const angle =
          this.seededRandom(chunkX, chunkY, j * 60 + 4100) * Math.PI * 2;
        const dist = this.seededRandom(chunkX, chunkY, j * 60 + 4101) * 80;

        crystals.push({
          offset: createVector(Math.cos(angle) * dist, Math.sin(angle) * dist),
          height: 60 + this.seededRandom(chunkX, chunkY, j * 60 + 4102) * 120,
          width: 20 + this.seededRandom(chunkX, chunkY, j * 60 + 4103) * 40,
          angle:
            (this.seededRandom(chunkX, chunkY, j * 60 + 4104) * Math.PI) / 6 -
            Math.PI / 12,
        });
      }

      features.push({
        id: generateId(),
        type: 'crystal-formation',
        position: createVector(x, y),
        size: 160,
        rotation: 0,
        data: {
          crystals,
          glowColor: biome.accentColor,
          resonanceTimer: 0,
          resonanceCooldown: 8,
          isResonating: false,
          damageAmplification: 1.5,
        },
      });
    }

    return features;
  }

  private generateCoralReefs(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    _biome: BiomeConfig
  ): CoralReefFeature[] {
    const features: CoralReefFeature[] = [];
    const reefCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 7000) * 2) + 1;

    for (let i = 0; i < reefCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 70 + 7000) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 70 + 7001) * chunkSize;

      const branchCount =
        4 + Math.floor(this.seededRandom(chunkX, chunkY, i * 70 + 7002) * 6);
      const branches = [];

      for (let j = 0; j < branchCount; j++) {
        const baseAngle = (j / branchCount) * Math.PI * 2;

        branches.push({
          offset: createVector(0, 0),
          length: 40 + this.seededRandom(chunkX, chunkY, j * 80 + 7101) * 80,
          angle:
            baseAngle +
            (this.seededRandom(chunkX, chunkY, j * 80 + 7102) - 0.5) * 0.5,
          thickness: 8 + this.seededRandom(chunkX, chunkY, j * 80 + 7103) * 12,
        });
      }

      const waterPoolCount = 1 + Math.floor(this.seededRandom(chunkX, chunkY, i * 70 + 7050) * 2);
      const waterPools = [];
      for (let j = 0; j < waterPoolCount; j++) {
        const poolAngle = this.seededRandom(chunkX, chunkY, j * 85 + 7150) * Math.PI * 2;
        const poolDist = this.seededRandom(chunkX, chunkY, j * 85 + 7151) * 150;
        waterPools.push({
          offset: createVector(
            Math.cos(poolAngle) * poolDist,
            Math.sin(poolAngle) * poolDist
          ),
          radius: 80 + this.seededRandom(chunkX, chunkY, j * 85 + 7152) * 120,
        });
      }

      const fishSchoolCount = 1 + Math.floor(this.seededRandom(chunkX, chunkY, i * 70 + 7060) * 2);
      const fishSchools = [];
      for (let j = 0; j < fishSchoolCount; j++) {
        const schoolAngle = this.seededRandom(chunkX, chunkY, j * 90 + 7200) * Math.PI * 2;
        const schoolDist = this.seededRandom(chunkX, chunkY, j * 90 + 7201) * 120;
        fishSchools.push({
          offset: createVector(
            Math.cos(schoolAngle) * schoolDist,
            Math.sin(schoolAngle) * schoolDist
          ),
          count: 3 + Math.floor(this.seededRandom(chunkX, chunkY, j * 90 + 7202) * 3),
          speed: 0.5 + this.seededRandom(chunkX, chunkY, j * 90 + 7203) * 1.0,
          angle: this.seededRandom(chunkX, chunkY, j * 90 + 7204) * Math.PI * 2,
        });
      }

      features.push({
        id: generateId(),
        type: 'coral-reef',
        position: createVector(x, y),
        size: 120,
        rotation:
          this.seededRandom(chunkX, chunkY, i * 70 + 7003) * Math.PI * 2,
        data: {
          branches,
          swaySpeed:
            0.015 + this.seededRandom(chunkX, chunkY, i * 70 + 7004) * 0.01,
          healingRate: 2,
          healingRadius: 100,
          waterPools,
          fishSchools,
        },
      });
    }

    return features;
  }

  private generateBloomTrees(
    chunkX: number,
    chunkY: number,
    worldX: number,
    worldY: number,
    chunkSize: number,
    _biome: BiomeConfig
  ): BloomTreeFeature[] {
    const features: BloomTreeFeature[] = [];
    const treeCount =
      Math.floor(this.seededRandom(chunkX, chunkY, 8000) * 2) + 1;

    for (let i = 0; i < treeCount; i++) {
      const x =
        worldX + this.seededRandom(chunkX, chunkY, i * 90 + 8000) * chunkSize;
      const y =
        worldY + this.seededRandom(chunkX, chunkY, i * 90 + 8001) * chunkSize;

      const fallingPetalCount = 3 + Math.floor(this.seededRandom(chunkX, chunkY, i * 90 + 8010) * 5);
      const fallingPetals = [];
      for (let j = 0; j < fallingPetalCount; j++) {
        const petalX = (this.seededRandom(chunkX, chunkY, j * 95 + 8100) - 0.5) * 200;
        const petalY = -this.seededRandom(chunkX, chunkY, j * 95 + 8101) * 100;
        fallingPetals.push({
          offset: createVector(petalX, petalY),
          velocity: createVector(
            (this.seededRandom(chunkX, chunkY, j * 95 + 8102) - 0.5) * 0.5,
            0.5 + this.seededRandom(chunkX, chunkY, j * 95 + 8103) * 0.5
          ),
          rotation: this.seededRandom(chunkX, chunkY, j * 95 + 8104) * Math.PI * 2,
          size: 5 + this.seededRandom(chunkX, chunkY, j * 95 + 8105) * 10,
        });
      }

      features.push({
        id: generateId(),
        type: 'bloom-tree',
        position: createVector(x, y),
        size: 150,
        rotation: 0,
        data: {
          trunkHeight:
            80 + this.seededRandom(chunkX, chunkY, i * 90 + 8002) * 80,
          trunkWidth:
            20 + this.seededRandom(chunkX, chunkY, i * 90 + 8003) * 20,
          canopyRadius:
            60 + this.seededRandom(chunkX, chunkY, i * 90 + 8004) * 60,
          petalCount:
            8 +
            Math.floor(this.seededRandom(chunkX, chunkY, i * 90 + 8005) * 8),
          glowColor: '#fde047',
          energyRegenRate: 0.5,
          energyRadius: 120,
          pulseTimer: 0,
          fallingPetals,
        },
      });
    }

    return features;
  }
}
