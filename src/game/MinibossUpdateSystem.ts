import { Enemy, Vector2, Projectile } from '../types/game';
import { MINIBOSS_DEFINITIONS, MinibossAttackContext } from './MinibossSystem';
import { vectorDistance, vectorSubtract, vectorNormalize, vectorScale, vectorAdd, createVector, generateId } from './utils';

export class MinibossUpdateSystem {
  update(
    miniboss: Enemy,
    playerPos: Vector2,
    dt: number,
    context: MinibossAttackContext
  ): void {
    if (!miniboss.minibossSubtype) return;

    const definition = MINIBOSS_DEFINITIONS[miniboss.minibossSubtype];
    if (!definition) return;

    this.updatePhase(miniboss, definition, dt);
    this.updateBehavior(miniboss, playerPos, dt, context);
    this.updateAttacks(miniboss, playerPos, dt, context, definition);
    this.updateSpecialMechanics(miniboss, playerPos, dt, context);
    
    if (miniboss.segments && miniboss.minibossSubtype === 'angulodon') {
      this.updateSegments(miniboss, dt);
    }
  }

  private updatePhase(miniboss: Enemy, definition: any, dt: number): void {
    miniboss.phaseTimer = (miniboss.phaseTimer || 0) + dt;

    const healthPercent = miniboss.health / miniboss.maxHealth;

    if (healthPercent > 0.6 && miniboss.phase !== definition.phases[0]) {
      miniboss.phase = definition.phases[0];
    } else if (healthPercent <= 0.6 && healthPercent > 0.3 && miniboss.phase !== definition.phases[1]) {
      miniboss.phase = definition.phases[1];
      miniboss.speed *= 1.2;
    } else if (healthPercent <= 0.3 && miniboss.phase !== definition.phases[2]) {
      miniboss.phase = definition.phases[2];
      miniboss.speed *= 1.3;
      miniboss.damage *= 1.2;
    }
  }

  private updateBehavior(
    miniboss: Enemy,
    playerPos: Vector2,
    dt: number,
    context: MinibossAttackContext
  ): void {
    if (!miniboss.minibossSubtype) return;

    const distance = vectorDistance(miniboss.position, playerPos);

    if (miniboss.minibossSubtype === 'angulodon') {
      if (miniboss.isSubmerged) {
        if (distance < 150) {
          miniboss.isSubmerged = false;
          context.createParticles(miniboss.position, 50, '#22d3ee', 0.8);
        }
      }
    }

    if (miniboss.jaws && miniboss.jaws.isOpen) {
      miniboss.jaws.biteTimer = Math.max(0, miniboss.jaws.biteTimer - dt);
      if (miniboss.jaws.biteTimer <= 0) {
        miniboss.jaws.isOpen = false;
        miniboss.jaws.grabbedPlayerId = undefined;
      }
    }

    if (miniboss.isDashing && miniboss.dashTimer !== undefined) {
      miniboss.dashTimer += dt;
      if (miniboss.dashTimer > 0.5) {
        miniboss.isDashing = false;
        miniboss.velocity = createVector(0, 0);
      }
    } else if (!miniboss.isSubmerged) {
      miniboss.behaviorTimer = (miniboss.behaviorTimer || 0) + dt;
      
      const optimalRange = this.getOptimalRange(miniboss);
      const tooCloseRange = optimalRange * 0.5;
      const tooFarRange = optimalRange * 1.5;
      
      let targetVelocity: Vector2;
      
      if (miniboss.telegraphTimer && miniboss.telegraphTimer > 0) {
        const slowFactor = 0.3;
        const dir = vectorSubtract(playerPos, miniboss.position);
        const normalized = vectorNormalize(dir);
        targetVelocity = vectorScale(normalized, miniboss.speed * slowFactor);
      } else if (distance < tooCloseRange) {
        const retreatDir = vectorSubtract(miniboss.position, playerPos);
        const normalized = vectorNormalize(retreatDir);
        const angle = Math.atan2(normalized.y, normalized.x) + (Math.sin(miniboss.behaviorTimer * 2) * 0.5);
        targetVelocity = {
          x: Math.cos(angle) * miniboss.speed * 0.8,
          y: Math.sin(angle) * miniboss.speed * 0.8
        };
      } else if (distance > tooFarRange) {
        const dir = vectorSubtract(playerPos, miniboss.position);
        const normalized = vectorNormalize(dir);
        targetVelocity = vectorScale(normalized, miniboss.speed * 1.2);
      } else {
        const dir = vectorSubtract(playerPos, miniboss.position);
        const angle = Math.atan2(dir.y, dir.x) + (Math.PI / 2) * Math.sin(miniboss.behaviorTimer);
        const circleRadius = 0.7;
        targetVelocity = {
          x: (Math.cos(angle) * circleRadius + dir.x / distance * (1 - circleRadius)) * miniboss.speed,
          y: (Math.sin(angle) * circleRadius + dir.y / distance * (1 - circleRadius)) * miniboss.speed
        };
      }
      
      miniboss.velocity = vectorAdd(
        vectorScale(miniboss.velocity, 0.85),
        vectorScale(targetVelocity, 0.15)
      );
    }

    if (miniboss.shieldActive && miniboss.shieldHealth !== undefined) {
      if (miniboss.shieldHealth <= 0) {
        miniboss.shieldActive = false;
        context.createParticles(miniboss.position, 40, '#fb923c', 0.6);
      }
    }

    if (miniboss.whirlpoolAngle !== undefined) {
      miniboss.whirlpoolAngle += dt * 3;
      if (miniboss.whirlpoolAngle > Math.PI * 4) {
        miniboss.whirlpoolAngle = undefined;
        miniboss.pullRadius = undefined;
      }
    }

    miniboss.position = vectorAdd(miniboss.position, vectorScale(miniboss.velocity, dt * 60));
    
    const toPlayer = vectorSubtract(playerPos, miniboss.position);
    miniboss.rotation = Math.atan2(toPlayer.y, toPlayer.x);
  }

  private updateAttacks(
    miniboss: Enemy,
    playerPos: Vector2,
    dt: number,
    context: MinibossAttackContext,
    definition: any
  ): void {
    if (miniboss.isSubmerged) return;

    miniboss.attackCooldown = Math.max(0, miniboss.attackCooldown - dt);
    miniboss.telegraphTimer = Math.max(0, (miniboss.telegraphTimer || 0) - dt);

    if (miniboss.attackCooldown <= 0 && !miniboss.telegraphTimer) {
      const availableAttacks = definition.attacks.filter((attack: any) => {
        if (attack.id === 'heal_sanctum' && miniboss.health > miniboss.maxHealth * 0.7) {
          return false;
        }
        return true;
      });

      if (availableAttacks.length > 0) {
        const attack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
        
        miniboss.nextAttack = attack.id;
        miniboss.telegraphTimer = attack.telegraphDuration;
        context.createParticles(miniboss.position, 15, definition.secondaryColor, 0.4);
      }
    }

    if (miniboss.telegraphTimer && miniboss.telegraphTimer <= 0.05 && miniboss.nextAttack) {
      const attack = definition.attacks.find((a: any) => a.id === miniboss.nextAttack);
      if (attack && attack.execute) {
        attack.execute(miniboss, playerPos, dt, context);
        miniboss.attackCooldown = attack.cooldown;
        miniboss.nextAttack = undefined;
      }
    }
  }

  private updateSpecialMechanics(
    miniboss: Enemy,
    playerPos: Vector2,
    dt: number,
    context: MinibossAttackContext
  ): void {
    if (miniboss.pullRadius) {
      const distance = vectorDistance(miniboss.position, playerPos);
      if (distance < miniboss.pullRadius) {
        const pullStrength = (1 - distance / miniboss.pullRadius) * 2;
        context.createParticles(playerPos, 2, '#8b5cf6', 0.2);
      }
    }

    if (miniboss.orbitalProjectiles && miniboss.orbitalProjectiles.length > 0) {
      miniboss.orbitalAngle = (miniboss.orbitalAngle || 0) + dt * 2;
    }
  }

  private getOptimalRange(miniboss: Enemy): number {
    if (!miniboss.minibossSubtype) return 150;
    
    switch (miniboss.minibossSubtype) {
      case 'angulodon':
        return 120;
      case 'cryostag_vanguard':
        return 200;
      case 'pyroclast_behemoth':
        return 180;
      case 'mirelurker_matron':
        return 220;
      case 'prism_guardian':
        return 250;
      case 'null_siren':
        return 200;
      case 'solstice_warden':
        return 190;
      case 'rift_revenant':
        return 210;
      default:
        return 150;
    }
  }

  private updateSegments(miniboss: Enemy, dt: number): void {
    if (!miniboss.segments || miniboss.segments.length === 0) return;

    const headPos = miniboss.position;
    const segmentSpacing = 35;

    for (let i = 0; i < miniboss.segments.length; i++) {
      const segment = miniboss.segments[i];
      
      if (i === 0) {
        segment.position = { ...headPos };
      } else {
        const prevSegment = miniboss.segments[i - 1];
        const dir = vectorSubtract(prevSegment.position, segment.position);
        const dist = vectorDistance(prevSegment.position, segment.position);
        
        if (dist > segmentSpacing) {
          const normalized = vectorNormalize(dir);
          segment.position = vectorAdd(
            prevSegment.position,
            vectorScale(normalized, -segmentSpacing)
          );
        }
      }
      
      if (i < miniboss.segments.length - 1) {
        const nextSegment = miniboss.segments[i + 1];
        const dir = vectorSubtract(nextSegment.position, segment.position);
        segment.rotation = Math.atan2(dir.y, dir.x);
      } else {
        segment.rotation = miniboss.rotation;
      }
    }
  }

  applyWhirlpoolEffect(miniboss: Enemy, playerPos: Vector2, dt: number): Vector2 | null {
    if (!miniboss.whirlpoolAngle || !miniboss.pullRadius) return null;

    const distance = vectorDistance(miniboss.position, playerPos);
    if (distance < miniboss.pullRadius) {
      const pullDir = vectorSubtract(miniboss.position, playerPos);
      const normalized = vectorNormalize(pullDir);
      const pullStrength = (1 - distance / miniboss.pullRadius) * 3;
      
      const tangentAngle = Math.atan2(pullDir.y, pullDir.x) + Math.PI / 2;
      const tangent = { x: Math.cos(tangentAngle), y: Math.sin(tangentAngle) };
      
      return vectorAdd(
        vectorScale(normalized, pullStrength * dt * 60),
        vectorScale(tangent, pullStrength * 0.5 * dt * 60)
      );
    }

    return null;
  }

  damageShield(miniboss: Enemy, damage: number): boolean {
    if (miniboss.shieldActive && miniboss.shieldHealth !== undefined) {
      miniboss.shieldHealth -= damage;
      return true;
    }
    return false;
  }
}
