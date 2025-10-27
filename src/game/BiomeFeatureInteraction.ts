import { Player, Enemy, Projectile } from '../types/game';
import {
  AnyBiomeFeature,
  RealityTearFeature,
  LavaPillarFeature,
  ToxicPoolFeature,
  GlacialSpireFeature,
  CrystalFormationFeature,
  CoralReefFeature,
  BloomTreeFeature,
  GravityAnomalyFeature,
  VoidGapFeature
} from './BiomeFeatures';
import { vectorDistance, vectorSubtract, vectorNormalize, vectorScale, vectorAdd, createVector } from './utils';

export interface FeatureEffect {
  type: 'damage' | 'heal' | 'slow' | 'speed' | 'teleport' | 'pull' | 'push';
  value: number;
  duration?: number;
}

export class BiomeFeatureInteraction {
  private time: number = 0;

  updateFeatures(features: AnyBiomeFeature[], deltaTime: number): void {
    this.time += deltaTime;
    features.forEach(feature => {
      switch (feature.type) {
        case 'lava-pillar':
          this.updateLavaPillar(feature as LavaPillarFeature, deltaTime);
          break;
        case 'glacial-spire':
          this.updateGlacialSpire(feature as GlacialSpireFeature, deltaTime);
          break;
        case 'crystal-formation':
          this.updateCrystalFormation(feature as CrystalFormationFeature, deltaTime);
          break;
        case 'bloom-tree':
          this.updateBloomTree(feature as BloomTreeFeature, deltaTime);
          break;
        case 'gravity-anomaly':
          this.updateGravityAnomaly(feature as GravityAnomalyFeature, deltaTime);
          break;
        case 'void-gap':
          this.updateVoidGap(feature as VoidGapFeature, deltaTime);
          break;
      }
    });
  }

  private updateLavaPillar(feature: LavaPillarFeature, deltaTime: number): void {
    feature.data.eruptionTimer += deltaTime;

    if (feature.data.isErupting) {
      feature.data.eruptionDuration -= deltaTime;

      if (Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 2;
        feature.data.lavaParticles.push({
          offset: createVector(
            Math.cos(angle) * (feature.data.width / 2),
            -feature.data.height / 2
          ),
          velocity: createVector(
            Math.cos(angle) * speed,
            -8 - Math.random() * 4
          ),
          lifetime: 1.5,
        });
      }

      feature.data.lavaParticles = feature.data.lavaParticles
        .map(p => ({
          ...p,
          offset: vectorAdd(p.offset, vectorScale(p.velocity, deltaTime * 60)),
          velocity: vectorAdd(p.velocity, createVector(0, 9.8 * deltaTime)),
          lifetime: p.lifetime - deltaTime,
        }))
        .filter(p => p.lifetime > 0);

      if (feature.data.eruptionDuration <= 0) {
        feature.data.isErupting = false;
        feature.data.eruptionDuration = 1.5;
        feature.data.eruptionTimer = 0;
      }
    } else if (feature.data.eruptionTimer >= feature.data.eruptionCooldown) {
      feature.data.isErupting = true;
      feature.data.eruptionTimer = 0;
    }
  }

  private updateGlacialSpire(feature: GlacialSpireFeature, deltaTime: number): void {
    if (feature.data.canShatter) {
      feature.data.shatterTimer += deltaTime;
    }
  }

  private updateCrystalFormation(feature: CrystalFormationFeature, deltaTime: number): void {
    if (feature.data.isResonating) {
      feature.data.resonanceTimer -= deltaTime;
      if (feature.data.resonanceTimer <= 0) {
        feature.data.isResonating = false;
        feature.data.resonanceTimer = 0;
      }
    }
  }

  private updateBloomTree(feature: BloomTreeFeature, deltaTime: number): void {
    feature.data.pulseTimer += deltaTime;
  }

  private updateGravityAnomaly(feature: GravityAnomalyFeature, deltaTime: number): void {
    feature.data.orbitingDebris.forEach(debris => {
      debris.angle += debris.speed * debris.orbitDirection * deltaTime;
    });
  }

  private updateVoidGap(feature: VoidGapFeature, deltaTime: number): void {
    if (feature.data.hasOminousTendril) {
      feature.data.ominousTendrilPulse = (feature.data.ominousTendrilPulse || 0) + deltaTime;
    }
  }

  applyFeatureEffects(
    player: Player,
    features: AnyBiomeFeature[],
    deltaTime: number,
    onTeleport?: (position: { x: number; y: number }) => void,
    createParticles?: (position: { x: number; y: number }, count: number, color: string, lifetime: number) => void
  ): { speedMultiplier: number } {
    let speedMultiplier = 1.0;
    let isInToxic = false;
    let toxicSlow = 1.0;
    let isInWater = false;

    features.forEach(feature => {
      const distance = vectorDistance(player.position, feature.position);

      switch (feature.type) {
        case 'reality-tear': {
          const tear = feature as RealityTearFeature;
          if (tear.data.isPortal && distance < feature.size / 2) {
            const target = features.find(f =>
              f.type === 'reality-tear' &&
              f.id !== feature.id &&
              (f as RealityTearFeature).data.isPortal
            ) as RealityTearFeature | undefined;

            if (target && onTeleport) {
              onTeleport(target.position);
              if (createParticles) {
                createParticles(player.position, 30, '#c084fc', 0.8);
                createParticles(target.position, 30, '#c084fc', 0.8);
              }
            }
          } else if (!tear.data.isPortal && distance < feature.size * 1.5) {
            speedMultiplier = Math.max(speedMultiplier, 1.35);
          }
          break;
        }

        case 'toxic-pool': {
          const pool = feature as ToxicPoolFeature;
          if (distance < pool.data.radius) {
            isInToxic = true;
            toxicSlow = Math.min(toxicSlow, pool.data.slowFactor);
            player.health -= pool.data.damagePerSecond * deltaTime;
            if (createParticles && Math.random() < 0.1) {
              createParticles(player.position, 2, '#84cc16', 0.3);
            }
          }
          break;
        }

        case 'lava-pillar': {
          const pillar = feature as LavaPillarFeature;
          if (pillar.data.isErupting && distance < pillar.data.width * 2) {
            player.health -= 20 * deltaTime;
            if (createParticles && Math.random() < 0.2) {
              createParticles(player.position, 3, '#f97316', 0.4);
            }
          }
          break;
        }

        case 'glacial-spire': {
          const spire = feature as GlacialSpireFeature;
          if (distance < spire.data.baseWidth * 1.5) {
            speedMultiplier = Math.min(speedMultiplier, 0.75);
          }
          break;
        }

        case 'crystal-formation': {
          const crystal = feature as CrystalFormationFeature;
          if (distance < 100) {
            if (!crystal.data.isResonating && crystal.data.resonanceTimer <= 0) {
              crystal.data.isResonating = true;
              crystal.data.resonanceTimer = 3;
            }
          }
          break;
        }

        case 'coral-reef': {
          const reef = feature as CoralReefFeature;
          if (distance < reef.data.healingRadius) {
            player.health = Math.min(player.maxHealth, player.health + reef.data.healingRate * deltaTime);
          }

          reef.data.waterPools.forEach(pool => {
            const poolWorldX = feature.position.x + pool.offset.x;
            const poolWorldY = feature.position.y + pool.offset.y;
            const distToPool = Math.sqrt(
              Math.pow(player.position.x - poolWorldX, 2) +
              Math.pow(player.position.y - poolWorldY, 2)
            );

            if (distToPool < pool.radius) {
              isInWater = true;

              if (createParticles && Math.random() < 0.1) {
                const angle = Math.random() * Math.PI * 2;
                const offset = Math.random() * player.size;
                createParticles(
                  {
                    x: player.position.x + Math.cos(angle) * offset,
                    y: player.position.y + Math.sin(angle) * offset
                  },
                  1,
                  '#5eead4',
                  0.8
                );
              }
            }
          });
          break;
        }

        case 'bloom-tree': {
          const tree = feature as BloomTreeFeature;
          if (distance < tree.data.energyRadius) {
            speedMultiplier = Math.max(speedMultiplier, 1.2);
            if (Math.random() < 0.05 && createParticles) {
              createParticles(player.position, 1, '#fde047', 0.5);
            }
          }
          break;
        }

        case 'gravity-anomaly': {
          const anomaly = feature as GravityAnomalyFeature;
          if (distance < anomaly.data.radius * 2) {
            const pullDir = vectorNormalize(vectorSubtract(feature.position, player.position));
            const pullForce = anomaly.data.pullStrength * (1 - distance / (anomaly.data.radius * 2));
            player.position = vectorAdd(player.position, vectorScale(pullDir, pullForce * deltaTime * 60));

            if (distance < anomaly.data.radius * 0.5) {
              player.health -= anomaly.data.crushDamage * deltaTime;
              if (createParticles && Math.random() < 0.15) {
                createParticles(player.position, 2, '#6366f1', 0.4);
              }
            }
          }
          break;
        }

        case 'void-gap': {
          const gap = feature as VoidGapFeature;
          if (distance < Math.max(gap.data.width, gap.data.height) / 2) {
            const pullDir = vectorNormalize(vectorSubtract(feature.position, player.position));
            player.position = vectorAdd(player.position, vectorScale(pullDir, gap.data.voidPullStrength * deltaTime * 60));
            player.health -= gap.data.voidDamage * deltaTime;
            if (createParticles && Math.random() < 0.1) {
              createParticles(player.position, 2, '#6d28d9', 0.3);
            }
          }
          break;
        }
      }
    });

    if (isInToxic) {
      speedMultiplier = Math.min(speedMultiplier, toxicSlow);
    }

    if (isInWater) {
      speedMultiplier = Math.min(speedMultiplier, 0.7);
    }

    return { speedMultiplier };
  }

  applyProjectileEffects(
    projectiles: Projectile[],
    features: AnyBiomeFeature[]
  ): void {
    projectiles.forEach(projectile => {
      if (projectile.owner !== 'player') return;

      features.forEach(feature => {
        if (feature.type === 'crystal-formation') {
          const crystal = feature as CrystalFormationFeature;
          const distance = vectorDistance(projectile.position, feature.position);

          if (crystal.data.isResonating && distance < 100) {
            projectile.damage *= crystal.data.damageAmplification;
          }
        }
      });
    });
  }

  applyEnemyEffects(
    enemies: Enemy[],
    features: AnyBiomeFeature[],
    deltaTime: number,
    createParticles?: (position: { x: number; y: number }, count: number, color: string, lifetime: number) => void
  ): void {
    enemies.forEach(enemy => {
      features.forEach(feature => {
        const distance = vectorDistance(enemy.position, feature.position);

        switch (feature.type) {
          case 'lava-pillar': {
            const pillar = feature as LavaPillarFeature;
            if (pillar.data.isErupting && distance < pillar.data.width * 2.5) {
              enemy.health -= 15 * deltaTime;
              if (createParticles && Math.random() < 0.1) {
                createParticles(enemy.position, 2, '#f97316', 0.3);
              }
            }
            break;
          }

          case 'gravity-anomaly': {
            const anomaly = feature as GravityAnomalyFeature;
            if (distance < anomaly.data.radius * 2) {
              const pullDir = vectorNormalize(vectorSubtract(feature.position, enemy.position));
              const pullForce = anomaly.data.pullStrength * 0.7;
              enemy.position = vectorAdd(enemy.position, vectorScale(pullDir, pullForce * deltaTime * 60));

              if (distance < anomaly.data.radius * 0.5) {
                enemy.health -= anomaly.data.crushDamage * deltaTime;
              }
            }
            break;
          }

          case 'void-gap': {
            const gap = feature as VoidGapFeature;
            if (distance < Math.max(gap.data.width, gap.data.height) / 2) {
              const pullDir = vectorNormalize(vectorSubtract(feature.position, enemy.position));
              enemy.position = vectorAdd(enemy.position, vectorScale(pullDir, gap.data.voidPullStrength * 0.6 * deltaTime * 60));
              enemy.health -= gap.data.voidDamage * 0.7 * deltaTime;
            }
            break;
          }
        }
      });
    });
  }

  getLavaParticles(feature: LavaPillarFeature): Array<{ offset: { x: number; y: number }; velocity: { x: number; y: number }; lifetime: number }> {
    return feature.data.lavaParticles;
  }

  collectGravitonResources(
    player: Player,
    features: AnyBiomeFeature[],
    onCollect: (amount: number) => void,
    createParticles?: (position: { x: number; y: number }, count: number, color: string, lifetime: number) => void
  ): void {
    features.forEach(feature => {
      if (feature.type === 'gravity-anomaly') {
        const anomaly = feature as GravityAnomalyFeature;
        anomaly.data.gravitonResources = anomaly.data.gravitonResources.filter(resource => {
          const currentAngle = resource.angle + this.time * resource.orbitSpeed;
          const resourceWorldX = feature.position.x + Math.cos(currentAngle) * resource.distance;
          const resourceWorldY = feature.position.y + Math.sin(currentAngle) * resource.distance;

          const distToPlayer = Math.sqrt(
            Math.pow(player.position.x - resourceWorldX, 2) +
            Math.pow(player.position.y - resourceWorldY, 2)
          );

          if (distToPlayer < resource.size + player.size) {
            onCollect(Math.floor(5 + Math.random() * 10));
            if (createParticles) {
              createParticles({ x: resourceWorldX, y: resourceWorldY }, 20, '#9333ea', 0.6);
            }
            return false;
          }
          return true;
        });
      }
    });
  }
}
