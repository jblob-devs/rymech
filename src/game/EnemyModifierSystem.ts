import { Enemy, Vector2 } from '../types/game';
import { generateId, vectorFromAngle, vectorDistance, vectorNormalize, vectorSubtract, vectorAdd, vectorScale, createVector } from './utils';

export type EnemyModifier =
  | 'shield'
  | 'phase'
  | 'mirror'
  | 'absorb'
  | 'split'
  | 'temporal'
  | 'reactive'
  | 'volatile'
  | 'anchored'
  | 'blink'
  | 'enrage'
  | 'teleport'
  | 'regenerate'
  | 'gravity'
  | 'magnet'
  | 'thorns'
  | 'barrier'
  | 'overcharge';

export interface Shield {
  id: string;
  angle: number;
  health: number;
  maxHealth: number;
  size: number;
}

export interface ModifiedEnemy extends Enemy {
  modifiers: EnemyModifier[];
  shields?: Shield[];
  phaseTimer?: number;
  isPhased?: boolean;
  mirrorCharges?: number;
  absorbedDamage?: number;
  absorbCooldown?: number;
  maxAbsorbCharges?: number;
  absorbCharges?: number;
  splitCount?: number;
  hasSplit?: boolean;
  temporalStack?: number;
  temporalCooldown?: number;
  reactiveCounter?: number;
  volatileThreshold?: number;
  anchoredPosition?: Vector2;
  anchorRadius?: number;
  blinkCooldown?: number;
  blinkCharges?: number;
  enrageThreshold?: number;
  isEnraged?: boolean;
  teleportCooldown?: number;
  teleportCharges?: number;
  modifierParticleTimer?: number;
  baseSpeed?: number;
  baseDamage?: number;
  regenRate?: number;
  regenTimer?: number;
  gravityPullRadius?: number;
  gravityStrength?: number;
  magnetRadius?: number;
  magnetStrength?: number;
  thornsDamage?: number;
  barriersActive?: boolean;
  barrierHealth?: number;
  overchargeStacks?: number;
  overchargeTimer?: number;
}

const MODIFIER_DESCRIPTIONS: Record<EnemyModifier, string> = {
  shield: 'Protected by rotating shields',
  phase: 'Phases in and out, invulnerable when phased',
  mirror: 'Reflects projectiles back',
  absorb: 'Absorbs damage and releases explosion',
  split: 'Splits into smaller enemies when damaged',
  temporal: 'Rewinds time to restore health',
  reactive: 'Becomes faster and stronger when hit',
  volatile: 'Explodes violently when health is low',
  anchored: 'Tethered to position, pulls players',
  blink: 'Teleports short distances',
  enrage: 'Becomes stronger at low health',
  teleport: 'Teleports around the battlefield',
  regenerate: 'Slowly regenerates health over time',
  gravity: 'Creates gravity well that pulls projectiles',
  magnet: 'Attracts nearby currency and items',
  thorns: 'Damages attackers when hit',
  barrier: 'Protected by energy barrier',
  overcharge: 'Gains power stacks over time',
};

export class EnemyModifierSystem {
  private modifiedEnemies: Map<string, ModifiedEnemy> = new Map();
  private readonly SPAWN_CHANCE = 0.15;

  shouldApplyModifier(): boolean {
    return Math.random() < this.SPAWN_CHANCE;
  }

  getRandomModifier(): EnemyModifier {
    const modifiers: EnemyModifier[] = [
      'shield', 'phase', 'mirror', 'absorb', 'split',
      'temporal', 'reactive', 'volatile', 'anchored', 'blink',
      'enrage', 'teleport', 'regenerate', 'gravity', 'magnet',
      'thorns', 'barrier', 'overcharge'
    ];
    return modifiers[Math.floor(Math.random() * modifiers.length)];
  }

  getRandomModifiers(count: number = 1): EnemyModifier[] {
    const modifiers: EnemyModifier[] = [];
    const available: EnemyModifier[] = [
      'shield', 'phase', 'mirror', 'absorb', 'split',
      'temporal', 'reactive', 'volatile', 'anchored', 'blink',
      'enrage', 'teleport', 'regenerate', 'gravity', 'magnet',
      'thorns', 'barrier', 'overcharge'
    ];

    for (let i = 0; i < count && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      modifiers.push(available[index]);
      available.splice(index, 1);
    }

    return modifiers;
  }

  applyModifiersToEnemy(enemy: Enemy, modifiers: EnemyModifier[]): ModifiedEnemy {
    const modified: ModifiedEnemy = {
      ...enemy,
      modifiers,
      modifierParticleTimer: 0,
      baseSpeed: enemy.speed,
      baseDamage: enemy.damage,
    };

    modified.health = Math.floor(enemy.health * (1 + modifiers.length * 0.3));
    modified.maxHealth = modified.health;
    modified.currencyDrop = Math.floor(enemy.currencyDrop * (1 + modifiers.length * 0.5));

    modifiers.forEach(modifier => {
      this.initializeModifier(modified, modifier);
    });

    this.modifiedEnemies.set(modified.id, modified);
    return modified;
  }

  private initializeModifier(enemy: ModifiedEnemy, modifier: EnemyModifier): void {
    switch (modifier) {
      case 'shield':
        enemy.shields = [
          { id: generateId(), angle: 0, health: 50, maxHealth: 50, size: enemy.size * 1.5 },
          { id: generateId(), angle: 2.094, health: 50, maxHealth: 50, size: enemy.size * 1.5 },
          { id: generateId(), angle: 4.188, health: 50, maxHealth: 50, size: enemy.size * 1.5 },
        ];
        break;
      case 'phase':
        enemy.phaseTimer = 0;
        enemy.isPhased = false;
        break;
      case 'mirror':
        enemy.mirrorCharges = 5;
        break;
      case 'absorb':
        enemy.absorbedDamage = 0;
        enemy.absorbCooldown = 0;
        enemy.maxAbsorbCharges = 2;
        enemy.absorbCharges = 2;
        break;
      case 'split':
        enemy.splitCount = 2;
        enemy.hasSplit = false;
        break;
      case 'temporal':
        enemy.temporalStack = 0;
        enemy.temporalCooldown = 0;
        break;
      case 'reactive':
        enemy.reactiveCounter = 0;
        break;
      case 'volatile':
        enemy.volatileThreshold = enemy.maxHealth * 0.3;
        break;
      case 'anchored':
        enemy.anchoredPosition = { ...enemy.position };
        enemy.anchorRadius = 250;
        break;
      case 'blink':
        enemy.blinkCooldown = 0;
        enemy.blinkCharges = 3;
        break;
      case 'enrage':
        enemy.enrageThreshold = enemy.maxHealth * 0.3;
        enemy.isEnraged = false;
        break;
      case 'teleport':
        enemy.teleportCooldown = 0;
        enemy.teleportCharges = 3;
        break;
      case 'regenerate':
        enemy.regenRate = enemy.maxHealth * 0.05;
        enemy.regenTimer = 0;
        break;
      case 'gravity':
        enemy.gravityPullRadius = 200;
        enemy.gravityStrength = 1.5;
        break;
      case 'magnet':
        enemy.magnetRadius = 150;
        enemy.magnetStrength = 2;
        break;
      case 'thorns':
        enemy.thornsDamage = enemy.damage * 0.5;
        break;
      case 'barrier':
        enemy.barriersActive = true;
        enemy.barrierHealth = 100;
        break;
      case 'overcharge':
        enemy.overchargeStacks = 0;
        enemy.overchargeTimer = 0;
        break;
    }
  }

  updateModifiers(
    dt: number,
    playerPosition: Vector2,
    onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void,
    onExplosion?: (position: Vector2, radius: number, damage: number) => void
  ): void {
    this.modifiedEnemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      enemy.modifiers.forEach(modifier => {
        this.updateModifier(enemy, modifier, dt, playerPosition, onParticleCreate, onExplosion);
      });
    });
  }

  private updateModifier(
    enemy: ModifiedEnemy,
    modifier: EnemyModifier,
    dt: number,
    playerPosition: Vector2,
    onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void,
    onExplosion?: (position: Vector2, radius: number, damage: number) => void
  ): void {
    switch (modifier) {
      case 'shield':
        this.updateShield(enemy, dt);
        break;
      case 'phase':
        this.updatePhase(enemy, dt, onParticleCreate);
        break;
      case 'temporal':
        this.updateTemporal(enemy, dt, onParticleCreate);
        break;
      case 'reactive':
        this.updateReactive(enemy);
        break;
      case 'volatile':
        this.updateVolatile(enemy, onExplosion);
        break;
      case 'anchored':
        this.updateAnchored(enemy);
        break;
      case 'blink':
        this.updateBlink(enemy, dt, playerPosition, onParticleCreate);
        break;
      case 'enrage':
        this.updateEnrage(enemy);
        break;
      case 'teleport':
        this.updateTeleport(enemy, dt, playerPosition, onParticleCreate);
        break;
      case 'regenerate':
        this.updateRegenerate(enemy, dt, onParticleCreate);
        break;
      case 'overcharge':
        this.updateOvercharge(enemy, dt, onParticleCreate);
        break;
      case 'gravity':
        this.updateGravity(enemy);
        break;
      case 'magnet':
        this.updateMagnet(enemy);
        break;
    }
  }

  private updateShield(enemy: ModifiedEnemy, dt: number): void {
    if (!enemy.shields) return;
    enemy.shields.forEach(shield => {
      shield.angle += dt * 1.5;
    });
  }

  private updatePhase(enemy: ModifiedEnemy, dt: number, onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void): void {
    enemy.phaseTimer = (enemy.phaseTimer || 0) + dt;
    if (enemy.phaseTimer > 2.5) {
      enemy.isPhased = !enemy.isPhased;
      enemy.phaseTimer = 0;
      onParticleCreate(enemy.position, 15, enemy.isPhased ? '#a78bfa' : enemy.color, 0.5);
    }
  }

  private updateTemporal(enemy: ModifiedEnemy, dt: number, onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void): void {
    if (enemy.temporalCooldown !== undefined && enemy.temporalCooldown > 0) {
      enemy.temporalCooldown -= dt;
    }

    if ((enemy.temporalCooldown || 0) <= 0 && enemy.health < enemy.maxHealth * 0.5 && (enemy.temporalStack || 0) < 3) {
      const healAmount = enemy.maxHealth * 0.25;
      enemy.health = Math.min(enemy.maxHealth, enemy.health + healAmount);
      enemy.temporalCooldown = 10;
      enemy.temporalStack = (enemy.temporalStack || 0) + 1;
      onParticleCreate(enemy.position, 30, '#60a5fa', 0.8);
    }
  }

  private updateReactive(enemy: ModifiedEnemy): void {
    if (enemy.reactiveCounter === undefined) enemy.reactiveCounter = 0;
    const counter = Math.min(enemy.reactiveCounter, 10);
    const baseSpeed = enemy.baseSpeed || enemy.speed;
    const baseDamage = enemy.baseDamage || enemy.damage;
    enemy.speed = baseSpeed * (1 + counter * 0.08);
    enemy.damage = Math.floor(baseDamage * (1 + counter * 0.1));
  }

  private updateVolatile(enemy: ModifiedEnemy, onExplosion?: (position: Vector2, radius: number, damage: number) => void): void {
    if (enemy.health <= (enemy.volatileThreshold || 0) && onExplosion) {
      onExplosion(enemy.position, 100, enemy.damage * 2);
      enemy.health = 0;
    }
  }

  private updateAnchored(enemy: ModifiedEnemy): void {
    if (!enemy.anchoredPosition) return;
    const distFromAnchor = vectorDistance(enemy.position, enemy.anchoredPosition);
    if (distFromAnchor > (enemy.anchorRadius || 250)) {
      const pullDir = vectorNormalize(vectorSubtract(enemy.anchoredPosition, enemy.position));
      enemy.position = vectorAdd(enemy.position, vectorScale(pullDir, 2));
    }
  }

  private updateBlink(enemy: ModifiedEnemy, dt: number, playerPosition: Vector2, onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void): void {
    if (enemy.blinkCooldown !== undefined && enemy.blinkCooldown > 0) {
      enemy.blinkCooldown -= dt;
    }

    if ((enemy.blinkCooldown || 0) <= 0 && (enemy.blinkCharges || 0) > 0) {
      const distToPlayer = vectorDistance(enemy.position, playerPosition);
      if (distToPlayer > 150 && distToPlayer < 400) {
        const dirToPlayer = vectorNormalize(vectorSubtract(playerPosition, enemy.position));
        const blinkDistance = 80;
        const newPosition = vectorAdd(enemy.position, vectorScale(dirToPlayer, blinkDistance));

        onParticleCreate(enemy.position, 15, enemy.color, 0.4);
        enemy.position = newPosition;
        onParticleCreate(enemy.position, 15, enemy.color, 0.4);

        enemy.blinkCharges = (enemy.blinkCharges || 0) - 1;
        enemy.blinkCooldown = 2.5;
      }
    }
  }

  private updateEnrage(enemy: ModifiedEnemy): void {
    if (enemy.isEnraged === undefined) enemy.isEnraged = false;
    if (!enemy.isEnraged && enemy.health <= (enemy.enrageThreshold || 0)) {
      enemy.isEnraged = true;
      const baseSpeed = enemy.baseSpeed || enemy.speed;
      const baseDamage = enemy.baseDamage || enemy.damage;
      enemy.speed = baseSpeed * 1.5;
      enemy.damage = Math.floor(baseDamage * 1.5);
      enemy.size = enemy.size * 1.1;
    }
  }

  private updateTeleport(enemy: ModifiedEnemy, dt: number, playerPosition: Vector2, onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void): void {
    if (enemy.teleportCooldown !== undefined && enemy.teleportCooldown > 0) {
      enemy.teleportCooldown -= dt;
    }

    if ((enemy.teleportCooldown || 0) <= 0) {
      const distToPlayer = Math.sqrt(
        Math.pow(enemy.position.x - playerPosition.x, 2) +
        Math.pow(enemy.position.y - playerPosition.y, 2)
      );

      const shouldTeleport = Math.random() < 0.3 && distToPlayer > 100;

      if (shouldTeleport) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        const newPosition = {
          x: enemy.position.x + Math.cos(angle) * distance,
          y: enemy.position.y + Math.sin(angle) * distance,
        };

        onParticleCreate(enemy.position, 20, enemy.color, 0.5);
        enemy.position = newPosition;
        onParticleCreate(enemy.position, 20, enemy.color, 0.5);

        enemy.teleportCooldown = 1.5 + Math.random() * 1.5;
      }
    }
  }

  private updateRegenerate(enemy: ModifiedEnemy, dt: number, onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void): void {
    enemy.regenTimer = (enemy.regenTimer || 0) + dt;

    if (enemy.regenTimer >= 0.5 && enemy.health < enemy.maxHealth) {
      const healAmount = enemy.regenRate || (enemy.maxHealth * 0.05);
      enemy.health = Math.min(enemy.maxHealth, enemy.health + healAmount);
      enemy.regenTimer = 0;
      onParticleCreate(enemy.position, 5, '#10b981', 0.5);
    }
  }

  private updateOvercharge(enemy: ModifiedEnemy, dt: number, onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void): void {
    enemy.overchargeTimer = (enemy.overchargeTimer || 0) + dt;

    if (enemy.overchargeTimer >= 3 && (enemy.overchargeStacks || 0) < 5) {
      enemy.overchargeStacks = (enemy.overchargeStacks || 0) + 1;
      enemy.overchargeTimer = 0;

      const baseSpeed = enemy.baseSpeed || enemy.speed;
      const baseDamage = enemy.baseDamage || enemy.damage;
      const stacks = enemy.overchargeStacks || 0;

      enemy.speed = baseSpeed * (1 + stacks * 0.15);
      enemy.damage = Math.floor(baseDamage * (1 + stacks * 0.2));

      onParticleCreate(enemy.position, 10, '#fbbf24', 0.5);
    }
  }

  private updateGravity(enemy: ModifiedEnemy): void {
    if (!enemy.gravityPullRadius || !enemy.gravityStrength) return;
  }

  private updateMagnet(enemy: ModifiedEnemy): void {
    if (!enemy.magnetRadius || !enemy.magnetStrength) return;
  }

  handleDamage(
    enemy: ModifiedEnemy,
    damage: number,
    projectilePosition: Vector2,
    projectileVelocity: Vector2,
    onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void,
    onProjectileFire?: (projectiles: any[]) => void,
    onEnemySpawn?: (enemy: Enemy) => void
  ): { shouldBlockDamage: boolean; shouldReflect: boolean; damageModifier: number } {
    let shouldBlockDamage = false;
    let shouldReflect = false;
    let damageModifier = 1;

    enemy.modifiers.forEach(modifier => {
      const result = this.handleModifierDamage(
        enemy,
        modifier,
        damage,
        projectilePosition,
        projectileVelocity,
        onParticleCreate,
        onProjectileFire,
        onEnemySpawn
      );

      if (result.shouldBlockDamage) shouldBlockDamage = true;
      if (result.shouldReflect) shouldReflect = true;
      damageModifier *= result.damageModifier;
    });

    return { shouldBlockDamage, shouldReflect, damageModifier };
  }

  private handleModifierDamage(
    enemy: ModifiedEnemy,
    modifier: EnemyModifier,
    damage: number,
    projectilePosition: Vector2,
    projectileVelocity: Vector2,
    onParticleCreate: (position: Vector2, count: number, color: string, lifetime: number) => void,
    onProjectileFire?: (projectiles: any[]) => void,
    onEnemySpawn?: (enemy: Enemy) => void
  ): { shouldBlockDamage: boolean; shouldReflect: boolean; damageModifier: number } {
    let shouldBlockDamage = false;
    let shouldReflect = false;
    let damageModifier = 1;

    switch (modifier) {
      case 'shield':
        if (enemy.shields && enemy.shields.length > 0) {
          const hitShield = this.checkShieldHit(enemy, projectilePosition);
          if (hitShield) {
            hitShield.health -= damage;
            onParticleCreate(projectilePosition, 10, '#60a5fa', 0.3);
            if (hitShield.health <= 0) {
              enemy.shields = enemy.shields.filter(s => s.id !== hitShield.id);
              onParticleCreate(hitShield.health <= 0 ? projectilePosition : enemy.position, 20, '#ef4444', 0.5);
            }
            shouldBlockDamage = true;
          }
        }
        break;

      case 'phase':
        if (enemy.isPhased === undefined) enemy.isPhased = false;
        if (enemy.isPhased) {
          shouldBlockDamage = true;
          onParticleCreate(projectilePosition, 5, '#a78bfa', 0.2);
        }
        break;

      case 'mirror':
        if ((enemy.mirrorCharges || 0) > 0) {
          shouldBlockDamage = true;
          shouldReflect = true;
          enemy.mirrorCharges = (enemy.mirrorCharges || 0) - 1;
          onParticleCreate(projectilePosition, 15, '#38bdf8', 0.4);
        }
        break;

      case 'absorb':
        if (enemy.absorbedDamage === undefined) enemy.absorbedDamage = 0;
        if (enemy.absorbCharges === undefined) enemy.absorbCharges = 2;
        if (enemy.maxAbsorbCharges === undefined) enemy.maxAbsorbCharges = 2;

        const currentAbsorbed = enemy.absorbedDamage;
        const absorbLimit = 200;

        if (currentAbsorbed < absorbLimit && enemy.absorbCharges > 0) {
          const damageToAbsorb = Math.min(damage, absorbLimit - currentAbsorbed);
          enemy.absorbedDamage = currentAbsorbed + damageToAbsorb;
          shouldBlockDamage = true;
          onParticleCreate(enemy.position, 5, '#fbbf24', 0.2);

          if (enemy.absorbedDamage >= absorbLimit) {
            if (onProjectileFire) {
              const explosionProjectiles: any[] = [];
              const burstCount = 8;
              for (let i = 0; i < burstCount; i++) {
                const angle = (Math.PI * 2 * i) / burstCount;
                const velocity = {
                  x: Math.cos(angle) * 8,
                  y: Math.sin(angle) * 8
                };

                explosionProjectiles.push({
                  id: `absorb-burst-${enemy.id}-${i}`,
                  position: { ...enemy.position },
                  velocity,
                  damage: absorbLimit / 4,
                  size: 8,
                  color: '#fbbf24',
                  owner: 'enemy',
                  piercing: false,
                  piercingCount: 0,
                  lifetime: 2,
                  rotation: 0,
                });
              }
              onProjectileFire(explosionProjectiles);
            }
            onParticleCreate(enemy.position, 40, '#ef4444', 0.8);
            enemy.absorbedDamage = 0;
            enemy.absorbCharges = Math.max(0, enemy.absorbCharges - 1);
          }
        } else {
          shouldBlockDamage = false;
        }
        break;

      case 'split':
        if (!enemy.hasSplit && enemy.health < enemy.maxHealth * 0.5 && onEnemySpawn) {
          enemy.hasSplit = true;
          const splitCount = enemy.splitCount || 2;

          for (let i = 0; i < splitCount; i++) {
            const angle = (Math.PI * 2 * i) / splitCount;
            const offset = vectorFromAngle(angle, 50);
            const spawnPos = vectorAdd(enemy.position, offset);

            const splitEnemy: Enemy = {
              id: generateId(),
              position: spawnPos,
              velocity: createVector(),
              rotation: 0,
              health: enemy.maxHealth * 0.3,
              maxHealth: enemy.maxHealth * 0.3,
              damage: enemy.damage * 0.6,
              size: enemy.size * 0.6,
              speed: enemy.speed * 1.2,
              color: enemy.color,
              type: 'speedy',
              attackCooldown: 1,
              currencyDrop: 15,
            };

            onEnemySpawn(splitEnemy);
          }

          onParticleCreate(enemy.position, 40, enemy.color, 0.8);
        }
        break;

      case 'reactive':
        if (enemy.reactiveCounter === undefined) enemy.reactiveCounter = 0;
        const maxReactiveStacks = 10;
        if (enemy.reactiveCounter < maxReactiveStacks) {
          enemy.reactiveCounter = enemy.reactiveCounter + 1;
          this.updateReactive(enemy);
          onParticleCreate(enemy.position, 5, '#ef4444', 0.3);
        }
        break;

      case 'gravity':
        onParticleCreate(projectilePosition, 3, '#8b5cf6', 0.2);
        break;

      case 'thorns':
        if (enemy.thornsDamage === undefined) enemy.thornsDamage = enemy.damage * 0.5;
        onParticleCreate(enemy.position, 8, '#ef4444', 0.4);
        damageModifier = 1;
        break;

      case 'barrier':
        if (enemy.barrierHealth === undefined) enemy.barrierHealth = 100;
        if (enemy.barriersActive === undefined) enemy.barriersActive = true;
        if (enemy.barriersActive && enemy.barrierHealth > 0) {
          enemy.barrierHealth = enemy.barrierHealth - damage;
          onParticleCreate(projectilePosition, 12, '#3b82f6', 0.4);

          if (enemy.barrierHealth <= 0) {
            enemy.barriersActive = false;
            onParticleCreate(enemy.position, 30, '#ef4444', 0.6);
          }
          shouldBlockDamage = true;
        }
        break;
    }

    return { shouldBlockDamage, shouldReflect, damageModifier };
  }

  private checkShieldHit(enemy: ModifiedEnemy, projectilePosition: Vector2): Shield | null {
    if (!enemy.shields) return null;

    for (const shield of enemy.shields) {
      const shieldDistance = enemy.size * 0.8;
      const shieldX = enemy.position.x + Math.cos(shield.angle) * shieldDistance;
      const shieldY = enemy.position.y + Math.sin(shield.angle) * shieldDistance;
      const shieldPos = { x: shieldX, y: shieldY };

      const dist = vectorDistance(projectilePosition, shieldPos);
      const shieldRadius = shield.size * 0.7;

      if (dist < shieldRadius) {
        return shield;
      }
    }

    return null;
  }

  isModifiedEnemy(enemy: Enemy): enemy is ModifiedEnemy {
    return 'modifiers' in enemy && Array.isArray((enemy as ModifiedEnemy).modifiers);
  }

  getModifiedEnemy(enemyId: string): ModifiedEnemy | undefined {
    return this.modifiedEnemies.get(enemyId);
  }

  removeEnemy(enemyId: string): void {
    this.modifiedEnemies.delete(enemyId);
  }

  getShields(enemy: ModifiedEnemy): Shield[] {
    return enemy.shields || [];
  }

  getModifierDescription(modifier: EnemyModifier): string {
    return MODIFIER_DESCRIPTIONS[modifier];
  }

  reset(): void {
    this.modifiedEnemies.clear();
  }
}
