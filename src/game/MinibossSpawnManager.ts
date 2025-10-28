import { Enemy, MinibossSubtype, Vector2 } from '../types/game';
import { MinibossSystem, MINIBOSS_DEFINITIONS } from './MinibossSystem';
import type { AnyBiomeFeature } from './BiomeFeatures';
import { vectorDistance } from './utils';

interface MinibossSpawnState {
  subtype: MinibossSubtype;
  featureId: string;
  lastSpawnTime: number;
  spawnCount: number;
}

export class MinibossSpawnManager {
  private minibossSystem: MinibossSystem;
  private spawnStates: Map<string, MinibossSpawnState> = new Map();
  private readonly MIN_SPAWN_COOLDOWN = 180;
  private readonly MIN_PLAYER_LEVEL = 5;
  private currentBiomeId: string = '';

  constructor(minibossSystem: MinibossSystem) {
    this.minibossSystem = minibossSystem;
  }

  updateCurrentBiome(biomeId: string): void {
    this.currentBiomeId = biomeId;
  }

  checkAndSpawnMiniboss(
    playerPosition: Vector2,
    biomeFeatures: AnyBiomeFeature[],
    currentWave: number,
    createMiniboss: (subtype: MinibossSubtype, position: Vector2) => Enemy
  ): Enemy | null {
    if (currentWave < this.MIN_PLAYER_LEVEL) {
      return null;
    }

    this.minibossSystem.updateCooldowns(1/60);

    const eligibleFeatures = this.findEligibleFeatures(
      playerPosition,
      biomeFeatures,
      currentWave
    );

    if (eligibleFeatures.length === 0) {
      return null;
    }

    const selectedFeature = eligibleFeatures[Math.floor(Math.random() * eligibleFeatures.length)];
    const minibossSubtype = this.getMinibossForBiome(this.currentBiomeId, selectedFeature.type);

    if (!minibossSubtype || !this.minibossSystem.canSpawn(minibossSubtype)) {
      return null;
    }

    const spawnKey = `${minibossSubtype}-${selectedFeature.id}`;
    const spawnState = this.spawnStates.get(spawnKey);
    const now = Date.now();

    if (spawnState && (now - spawnState.lastSpawnTime) / 1000 < this.MIN_SPAWN_COOLDOWN) {
      return null;
    }

    const spawnChance = this.calculateSpawnChance(currentWave, spawnState?.spawnCount || 0);
    if (Math.random() > spawnChance) {
      return null;
    }

    const spawnPosition = this.getSpawnPosition(selectedFeature, playerPosition);
    const miniboss = createMiniboss(minibossSubtype, spawnPosition);

    this.spawnStates.set(spawnKey, {
      subtype: minibossSubtype,
      featureId: selectedFeature.id,
      lastSpawnTime: now,
      spawnCount: (spawnState?.spawnCount || 0) + 1
    });

    this.minibossSystem.setSpawnCooldown(minibossSubtype, this.MIN_SPAWN_COOLDOWN);

    return miniboss;
  }

  private findEligibleFeatures(
    playerPosition: Vector2,
    biomeFeatures: AnyBiomeFeature[],
    currentWave: number
  ): AnyBiomeFeature[] {
    const eligible: AnyBiomeFeature[] = [];

    for (const feature of biomeFeatures) {
      const minibossSubtype = this.getMinibossForBiome(this.currentBiomeId, feature.type);
      if (!minibossSubtype) continue;

      const definition = MINIBOSS_DEFINITIONS[minibossSubtype];
      if (!definition) continue;

      if (definition.requiredFeatureType && definition.requiredFeatureType !== feature.type) {
        continue;
      }

      const distance = vectorDistance(playerPosition, feature.position);
      const detectionRange = 400;

      if (distance < detectionRange) {
        const spawnConditionMet = definition.spawnCondition
          ? definition.spawnCondition(feature.data, playerPosition)
          : distance < 300;

        if (spawnConditionMet) {
          eligible.push(feature);
        }
      }
    }

    return eligible;
  }

  private getMinibossForBiome(biomeId: string, featureType: string): MinibossSubtype | null {
    const mapping: Record<string, Record<string, MinibossSubtype>> = {
      'coral-depths': {
        'coral-reef': 'angulodon'
      },
      'frozen-tundra': {
        'glacial-spire': 'cryostag_vanguard'
      },
      'volcanic-wastes': {
        'lava-pillar': 'pyroclast_behemoth'
      },
      'toxic-swamp': {
        'toxic-pool': 'mirelurker_matron'
      },
      'crystal-caverns': {
        'crystal-formation': 'prism_guardian'
      },
      'void-nebula': {
        'void-gap': 'null_siren'
      },
      'radiant-gardens': {
        'bloom-tree': 'solstice_warden'
      },
      'shattered-expanse': {
        'reality-tear': 'rift_revenant'
      }
    };

    return mapping[biomeId]?.[featureType] || null;
  }

  private calculateSpawnChance(currentWave: number, previousSpawns: number): number {
    let baseChance = 0.02;
    
    baseChance += Math.min(currentWave / 100, 0.08);
    
    baseChance *= Math.pow(0.7, previousSpawns);

    return Math.min(baseChance, 0.15);
  }

  private getSpawnPosition(feature: AnyBiomeFeature, playerPosition: Vector2): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 100;
    
    return {
      x: feature.position.x + Math.cos(angle) * distance,
      y: feature.position.y + Math.sin(angle) * distance
    };
  }

  onMinibossDefeated(minibossId: string, subtype: MinibossSubtype): void {
    this.minibossSystem.markDefeated(minibossId);
    
    for (const [key, state] of this.spawnStates.entries()) {
      if (state.subtype === subtype) {
        state.lastSpawnTime = Date.now();
      }
    }
  }

  reset(): void {
    this.spawnStates.clear();
  }

  getSpawnState(subtype: MinibossSubtype): MinibossSpawnState | undefined {
    for (const state of this.spawnStates.values()) {
      if (state.subtype === subtype) {
        return state;
      }
    }
    return undefined;
  }
}
