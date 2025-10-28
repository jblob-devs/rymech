import {
  GameState,
  Player,
  Enemy,
  Projectile,
  Weapon,
  Chest,
  WeaponDrop,
} from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  PLAYER_BASE_SPEED,
  PLAYER_DASH_SPEED,
  PLAYER_DASH_DURATION,
  PLAYER_DASH_COOLDOWN,
  PLAYER_MAX_HEALTH,
  INITIAL_WEAPONS,
  MAX_VISIBLE_RANGE,
} from './constants';
import {
  createVector,
  vectorAdd,
  vectorScale,
  vectorNormalize,
  vectorDistance,
  vectorFromAngle,
  vectorSubtract,
  generateId,
  checkCollision,
  randomRange,
} from './utils';
import { WorldGenerator, ResourceNode, ExtractionPoint, Portal, CHUNK_SIZE } from './WorldGeneration';
import { Obstacle } from './Environments';
import { Camera } from './Camera';
import { WeaponUpgradeManager } from './WeaponUpgradeManager';
import { AnyBiomeFeature } from './BiomeFeatures';
import {
  checkEntityObstacleCollision,
  resolveEntityObstacleCollision,
  checkProjectileObstacleCollision,
  calculateRicochetVelocity,
} from './CollisionSystem';
import { findPathAroundObstacles } from './Pathfinding';
import { PlayerInventory } from './PlayerInventory';
import { WeaponCrateSystem } from './WeaponCrateSystem';
import { BiomeManager, BiomeParticle, BiomeConfig } from './BiomeSystem';
import { BiomeFeatureInteraction } from './BiomeFeatureInteraction';
import { TradingPostSystem } from './TradingPostSystem';
import { EnemyModifierSystem, ModifiedEnemy } from './EnemyModifierSystem';
import { CraftingSystem } from './CraftingSystem';
import { VoidSubdivider, createVoidSubdivider, updateVoidSubdivider, checkVoidSubdividerCollision } from './VoidSubdivider';
import { MeleeWeaponRenderer } from './MeleeWeaponRenderer';
import { MELEE_FORMS, getFormForWeapon, MeleeForm } from './MeleeWeaponForms';

export class GameEngine {
  private gameState: GameState;
  private keys: Set<string> = new Set();
  private mousePos = createVector();
  private mouseDown = false;
  private lastMouseDown = false;
  private touchMoveInput: React.MutableRefObject<{ x: number; y: number }> | null = null;
  private touchShootInput: React.MutableRefObject<{ x: number; y: number; active: boolean }> | null = null;
  private worldGenerator: WorldGenerator;
  private camera: Camera;
  private weaponUpgradeManager: WeaponUpgradeManager;
  private inventory: PlayerInventory;
  private crateSystem: WeaponCrateSystem;
  private resourceNodes: ResourceNode[] = [];
  private obstacles: Obstacle[] = [];
  private portals: Portal[] = [];
  private extractionPoints: ExtractionPoint[] = [];
  private chests: Chest[] = [];
  private biomeFeatures: AnyBiomeFeature[] = [];
  private biomeManager: BiomeManager;
  private biomeChangeCallback?: (biomeName: string) => void;
  private featureInteraction: BiomeFeatureInteraction;
  private tradingPostSystem: TradingPostSystem;
  private modifierSystem: EnemyModifierSystem;
  private craftingSystem: CraftingSystem;
  private voidSubdivider: VoidSubdivider | null = null;
  private voidGapBossSpawned: Set<string> = new Set();
  private activeOminousTendril: { featureId: string; canInteract: boolean } | null = null;
  private meleeWeaponRenderer: MeleeWeaponRenderer;

  constructor() {
    this.worldGenerator = new WorldGenerator();
    this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT, 0.1);
    this.weaponUpgradeManager = new WeaponUpgradeManager();
    this.inventory = new PlayerInventory();
    this.crateSystem = new WeaponCrateSystem();
    this.biomeManager = new BiomeManager();
    this.featureInteraction = new BiomeFeatureInteraction();
    this.tradingPostSystem = new TradingPostSystem();
    this.modifierSystem = new EnemyModifierSystem();
    this.craftingSystem = new CraftingSystem();
    this.meleeWeaponRenderer = new MeleeWeaponRenderer();
    this.gameState = this.createInitialState();
    this.biomeManager.setWorldGenerator(this.worldGenerator);

    INITIAL_WEAPONS.forEach(weapon => {
      const weaponWithPerks = { ...weapon, perks: [] };
      this.inventory.addWeapon(weaponWithPerks);
      this.inventory.equipWeapon(weaponWithPerks.id);
    });
    this.syncEquippedWeapons();

    this.loadChunksAroundPlayer();
  }

  private createInitialState(): GameState {
    const player: Player = {
      id: 'player',
      position: createVector(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2),
      velocity: createVector(),
      size: PLAYER_SIZE,
      health: PLAYER_MAX_HEALTH,
      maxHealth: PLAYER_MAX_HEALTH,
      rotation: 0,
      speed: PLAYER_BASE_SPEED,
      dashCooldown: PLAYER_DASH_COOLDOWN,
      dashDuration: PLAYER_DASH_DURATION,
      isDashing: false,
      currency: 0,
      equippedWeapons: [],
      activeWeaponIndex: 0,
      portalCooldown: 0,
      isGrappling: false,
      grappleProgress: 0,
      isGliding: false,
      resources: {
        energy: 0,
        coreDust: 0,
        flux: 0,
        geoShards: 0,
        alloyFragments: 0,
        singularityCore: 0,
        cryoKelp: 0,
        obsidianHeart: 0,
        gloomRoot: 0,
        resonantCrystal: 0,
        voidEssence: 0,
        bioluminescentPearl: 0,
        sunpetalBloom: 0,
        aetheriumShard: 0,
        gravitonEssence: 0,
        voidCore: 0,
        crateKey: 0,
      },
      consumables: [],
    };

    return {
      player,
      remotePlayers: [],
      enemies: [],
      projectiles: [],
      particles: [],
      currencyDrops: [],
      resourceDrops: [],
      chests: [],
      weaponDrops: [],
      score: 0,
      isPaused: false,
      isGameOver: false,
      resourcesCollected: 0,
      currentBiomeName: 'Veridian Nexus',
      damageNumbers: [],
      pvpEnabled: false,
    };
  }

  getState(): GameState {
    return this.gameState;
  }

  getCamera(): Camera {
    return this.camera;
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  getResourceNodes(): ResourceNode[] {
    return this.resourceNodes;
  }

  getPortals(): Portal[] {
    return this.portals;
  }

  getExtractionPoints(): ExtractionPoint[] {
    return this.extractionPoints;
  }

  getChests(): Chest[] {
    return this.chests;
  }

  getBiomeManager(): BiomeManager {
    return this.biomeManager;
  }

  getEnvironmentalParticles(): BiomeParticle[] {
    return this.biomeManager.getEnvironmentalParticles();
  }

  getBiomeFeatures(): AnyBiomeFeature[] {
    return this.biomeFeatures;
  }

  getModifierSystem(): EnemyModifierSystem {
    return this.modifierSystem;
  }

  getCraftingSystem(): CraftingSystem {
    return this.craftingSystem;
  }

  getMeleeWeaponRenderer(): MeleeWeaponRenderer {
    return this.meleeWeaponRenderer;
  }

  useConsumable(consumableId: string): void {
    const consumable = this.gameState.player.consumables.find(c => c.id === consumableId);
    if (!consumable) return;

    if (consumable.effect === 'heal') {
      this.gameState.player.health = Math.min(
        this.gameState.player.health + consumable.value,
        this.gameState.player.maxHealth
      );
    }

    if (consumable.stackable && consumable.quantity && consumable.quantity > 1) {
      consumable.quantity -= 1;
    } else {
      this.gameState.player.consumables = this.gameState.player.consumables.filter(
        c => c.id !== consumableId
      );
    }
  }

  sellWeapon(weaponId: string): boolean {
    const inventoryWeapon = this.inventory.getWeapons().find(w => w.weapon.id === weaponId);
    if (!inventoryWeapon) return false;

    let value = 50;
    if (inventoryWeapon.weapon.perks) {
      inventoryWeapon.weapon.perks.forEach((perk: any) => {
        switch (perk.rarity) {
          case 'legendary': value += 100; break;
          case 'epic': value += 60; break;
          case 'rare': value += 30; break;
          case 'common': value += 10; break;
        }
      });
    }

    this.inventory.unequipWeapon(weaponId);
    this.inventory.removeWeapon(weaponId);
    this.gameState.player.currency += value;
    this.syncEquippedWeapons();
    return true;
  }

  tradeResources(fromResource: string, toResource: string): boolean {
    const player = this.gameState.player;
    const tradeRates: Record<string, { from: string; amount: number; to: string }> = {
      'energy-coreDust': { from: 'energy', amount: 10, to: 'coreDust' },
      'coreDust-flux': { from: 'coreDust', amount: 5, to: 'flux' },
      'flux-alloyFragments': { from: 'flux', amount: 3, to: 'alloyFragments' },
    };

    const tradeKey = `${fromResource}-${toResource}`;
    const trade = tradeRates[tradeKey];

    if (!trade) return false;

    const fromAmount = (player.resources as any)[trade.from];
    if (fromAmount < trade.amount) return false;

    (player.resources as any)[trade.from] -= trade.amount;
    (player.resources as any)[trade.to] += 1;

    return true;
  }

  getFeatureInteraction(): BiomeFeatureInteraction {
    return this.featureInteraction;
  }

  setBiomeChangeCallback(callback: (biomeName: string) => void): void {
    this.biomeChangeCallback = callback;
  }

  setKeys(keys: Set<string> | ((prev: Set<string>) => Set<string>)): void {
    if (typeof keys === 'function') {
      this.keys = keys(this.keys);
    } else {
      this.keys = keys;
    }
  }

  setMousePosition(pos: { x: number; y: number }): void {
    this.mousePos = pos;
  }

  setMouseDown(isDown: boolean): void {
    this.lastMouseDown = this.mouseDown;
    this.mouseDown = isDown;
  }

  setTouchInput(
    moveInput: React.MutableRefObject<{ x: number; y: number }>,
    shootInput: React.MutableRefObject<{ x: number; y: number; active: boolean }>
  ): void {
    this.touchMoveInput = moveInput;
    this.touchShootInput = shootInput;
  }

  update(deltaTime: number): void {
    if (this.gameState.isGameOver) return;

    const dt = Math.min(deltaTime, 0.05);

    // In multiplayer, pause only affects local player input, not world simulation
    // This allows host to pause while clients continue playing
    if (!this.gameState.isPaused) {
      this.updatePlayer(dt);
    }
    this.camera.follow(this.gameState.player.position);
    this.camera.update();
    this.biomeManager.updateBiome(this.gameState.player.position, (biome: BiomeConfig) => {
      this.gameState.currentBiomeName = biome.name;
      if (this.biomeChangeCallback) {
        this.biomeChangeCallback(biome.name);
      }
    });
    this.biomeManager.update(dt, CANVAS_WIDTH, CANVAS_HEIGHT, this.camera.position);
    this.loadChunksAroundPlayer();
    this.featureInteraction.updateFeatures(this.biomeFeatures, dt);
    this.updateObstacleOrbits(dt);
    const { speedMultiplier } = this.featureInteraction.applyFeatureEffects(
      this.gameState.player,
      this.biomeFeatures,
      dt,
      (pos) => { this.gameState.player.position = pos; },
      (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime)
    );
    this.gameState.player.speed = PLAYER_BASE_SPEED * speedMultiplier;
    this.checkPlayerDeath();
    this.featureInteraction.applyEnemyEffects(
      this.gameState.enemies,
      this.biomeFeatures,
      dt,
      (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime)
    );
    this.featureInteraction.collectGravitonResources(
      this.gameState.player,
      this.biomeFeatures,
      (amount) => { this.gameState.player.resources.gravitonEssence += amount; },
      (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime)
    );
    this.updateEnemies(dt);
    this.updateVoidSubdividerBoss(dt);
    this.checkVoidSubdividerSpawn();
    this.modifierSystem.updateModifiers(
      dt,
      this.gameState.player.position,
      (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime),
      (pos, radius, damage) => this.createExplosion(pos, radius, damage)
    );
    this.updateProjectiles(dt);
    this.featureInteraction.applyProjectileEffects(this.gameState.projectiles, this.biomeFeatures);
    this.updateParticles(dt);
    this.updateCurrencyDrops(dt);
    this.updateWeaponDrops(dt);
    this.updateResourceDrops(dt);
    this.craftingSystem.checkDiscoveredRecipes(this.gameState.player);
    this.handleCollisions(dt);
    this.cleanupDeadEntities();
    this.fireWeapons(dt);
    this.handlePortals();
    this.handleExtractionPoints();
    this.updateInteractables(dt);
    this.updateDamageNumbers(dt);
  }

  private updateObstacleOrbits(dt: number): void {
    this.obstacles.forEach(obstacle => {
      if (obstacle.orbitData) {
        obstacle.orbitData.angle += obstacle.orbitData.speed * obstacle.orbitData.direction * dt;

        const newX = obstacle.orbitData.centerX + Math.cos(obstacle.orbitData.angle) * obstacle.orbitData.distance;
        const newY = obstacle.orbitData.centerY + Math.sin(obstacle.orbitData.angle) * obstacle.orbitData.distance;

        obstacle.position.x = newX;
        obstacle.position.y = newY;

        obstacle.rotation += obstacle.orbitData.speed * obstacle.orbitData.direction * dt * 2;
      }
    });
  }

  private getPathfindingObstacles(): Obstacle[] {
    const obstacles = [...this.obstacles];

    for (const feature of this.biomeFeatures) {
      if (feature.type === 'coral-reef') {
        for (const waterPool of feature.data.waterPools) {
          const worldX = feature.position.x + waterPool.offset.x;
          const worldY = feature.position.y + waterPool.offset.y;

          obstacles.push({
            position: { x: worldX, y: worldY },
            size: { x: waterPool.radius * 2, y: waterPool.radius * 2 },
            rotation: 0,
            shape: 'circle',
            color: '#14b8a6',
          });
        }
      }
    }

    return obstacles;
  }

  private updatePlayer(dt: number): void {
    const player = this.gameState.player;

    if (player.isGrappling && player.grappleTarget) {
      const toTarget = vectorSubtract(player.grappleTarget, player.position);
      const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y);

      const activeWeapon = player.equippedWeapons[player.activeWeaponIndex];
      const pullSpeed = (activeWeapon?.grapplingStats?.pullSpeed || 10) * 0.4; // Slowed down to 40% of original
      const slamDamage = activeWeapon?.grapplingStats?.slamDamage || 0;
      const slamRadius = activeWeapon?.grapplingStats?.slamRadius || 0;

      if (distance < 20) {
        if (slamDamage > 0) {
          this.createGrappleSlamExplosion(player.position, slamDamage, slamRadius);
        }
        player.isGrappling = false;
        player.isGliding = true;
        player.glideVelocity = vectorScale(vectorNormalize(toTarget), 3);
      } else {
        const pullDir = vectorNormalize(toTarget);
        const baseVelocity = vectorScale(pullDir, pullSpeed);

        // Get screen-space input (always left = left, right = right)
        const screenSwing = createVector(0, 0);
        if (this.keys.has('a')) screenSwing.x -= 1; // Move left on screen
        if (this.keys.has('d')) screenSwing.x += 1; // Move right on screen
        if (this.keys.has('w')) screenSwing.y -= 1; // Move up on screen
        if (this.keys.has('s')) screenSwing.y += 1; // Move down on screen

        // Apply swing force in screen space, constrained to be perpendicular to rope
        const swingStrength = 3;
        // Project the screen input onto the perpendicular-to-rope direction
        const perpDir = createVector(-pullDir.y, pullDir.x);
        const swingDot = screenSwing.x * perpDir.x + screenSwing.y * perpDir.y;
        const swingVelocity = vectorScale(perpDir, swingDot * swingStrength);

        // Combine pull and swing with physics-based rope constraint
        let combinedVelocity = vectorAdd(baseVelocity, swingVelocity);

        // Add pendulum-like physics: preserve existing perpendicular momentum
        if (player.velocity) {
          const perpMomentum = (player.velocity.x * perpDir.x + player.velocity.y * perpDir.y) * 0.3;
          const perpVel = vectorScale(perpDir, perpMomentum);
          combinedVelocity = vectorAdd(combinedVelocity, perpVel);
        }

        player.velocity = combinedVelocity;
        player.position = vectorAdd(player.position, vectorScale(player.velocity, dt * 60));
      }
    } else if (player.isGliding && player.glideVelocity) {
      // Faster decay for shorter gliding
      player.glideVelocity = vectorScale(player.glideVelocity, 0.95);

      // Better air control during glide
      const lateralDir = createVector();
      if (this.keys.has('a')) lateralDir.x -= 1;
      if (this.keys.has('d')) lateralDir.x += 1;
      if (this.keys.has('w')) lateralDir.y -= 1;
      if (this.keys.has('s')) lateralDir.y += 1;

      const normalized = vectorNormalize(lateralDir);
      const lateralVelocity = vectorScale(normalized, 2); // Reduced air control

      player.velocity = vectorAdd(player.glideVelocity, lateralVelocity);
      player.position = vectorAdd(player.position, vectorScale(player.velocity, dt * 60));

      const glideSpeed = Math.sqrt(player.glideVelocity.x * player.glideVelocity.x + player.glideVelocity.y * player.glideVelocity.y);
      if (glideSpeed < 0.5) { // Lower threshold for smoother transition
        player.isGliding = false;
        player.glideVelocity = undefined;
      }
    } else {
      const direction = createVector();

      if (this.touchMoveInput && (Math.abs(this.touchMoveInput.current.x) > 0.01 || Math.abs(this.touchMoveInput.current.y) > 0.01)) {
        direction.x = this.touchMoveInput.current.x;
        direction.y = this.touchMoveInput.current.y;
      } else {
        if (this.keys.has('w')) direction.y -= 1;
        if (this.keys.has('s')) direction.y += 1;
        if (this.keys.has('a')) direction.x -= 1;
        if (this.keys.has('d')) direction.x += 1;
      }

      const normalized = vectorNormalize(direction);
      const speed = player.isDashing ? PLAYER_DASH_SPEED : player.speed;
      player.velocity = vectorScale(normalized, speed);

      player.position = vectorAdd(
        player.position,
        vectorScale(player.velocity, dt * 60)
      );
    }

    this.obstacles.forEach((obstacle) => {
      if (checkEntityObstacleCollision(player, obstacle)) {
        resolveEntityObstacleCollision(player, obstacle);
      }
    });

    if (this.keys.has('arrowleft')) {
      player.rotation -= dt * 4;
    }
    if (this.keys.has('arrowright')) {
      player.rotation += dt * 4;
    }

    if (!this.keys.has('arrowleft') && !this.keys.has('arrowright')) {
      if (this.touchShootInput && this.touchShootInput.current.active && (Math.abs(this.touchShootInput.current.x) > 0.01 || Math.abs(this.touchShootInput.current.y) > 0.01)) {
        player.rotation = Math.atan2(this.touchShootInput.current.y, this.touchShootInput.current.x);
      } else {
        const dirToMouse = vectorSubtract(this.mousePos, player.position);
        player.rotation = Math.atan2(dirToMouse.y, dirToMouse.x);
      }
    }

    if (player.portalCooldown && player.portalCooldown > 0) {
      player.portalCooldown -= dt;
    }

    if (player.dashCooldown > 0) {
      player.dashCooldown -= dt;
    }

    if (player.isDashing) {
      player.dashDuration -= dt;
      if (player.dashDuration <= 0) {
        player.isDashing = false;
        player.dashDuration = PLAYER_DASH_DURATION;
      }
    }

    player.equippedWeapons = player.equippedWeapons.map((weapon) => ({
      ...weapon,
      cooldown: Math.max(0, weapon.cooldown - dt),
      railgunBeamTimer: weapon.railgunBeamTimer ? Math.max(0, weapon.railgunBeamTimer - dt) : 0,
    }));
  }

  private fireWeapons(dt: number): void {
    const player = this.gameState.player;
    const arrowKeyFiring = this.keys.has('arrowup');
    const touchFiring = this.touchShootInput ? this.touchShootInput.current.active : false;

    player.equippedWeapons.forEach((weapon, index) => {
      if (weapon.meleeStats) {
        this.updateMeleeWeapon(weapon, dt, index);
        return;
      }
      if (weapon.firingMode === 'charge') {
        const isFiring = (this.mouseDown || arrowKeyFiring || touchFiring) && index === player.activeWeaponIndex;
        if (isFiring) {
          weapon.isCharging = true;
          weapon.currentCharge = Math.min(
            (weapon.currentCharge || 0) + dt,
            weapon.chargeTime || 2.0
          );
        } else if (weapon.isCharging && !(this.mouseDown || arrowKeyFiring || touchFiring)) {
          weapon.isCharging = false;
          if ((weapon.currentCharge || 0) > 0.2) {
            if (weapon.type === 'railgun') {
              this.fireRailgunBeam(weapon);
            } else {
              this.fireWeapon(weapon);
            }
          }
          weapon.currentCharge = 0;
        }
        return;
      }

      if (weapon.firingMode === 'hold') {
        const isFiring = (this.mouseDown || arrowKeyFiring || touchFiring) && index === player.activeWeaponIndex;
        if (isFiring && weapon.cooldown <= 0) {
          weapon.isHolding = true;
          weapon.holdTimer = (weapon.holdTimer || 0) + dt;
        } else if (weapon.isHolding && !(this.mouseDown || arrowKeyFiring || touchFiring)) {
          weapon.isHolding = false;
          if ((weapon.holdTimer || 0) >= (weapon.holdTime || 0.8)) {
            this.fireWeapon(weapon);
            weapon.cooldown = weapon.fireRate;
          }
          weapon.holdTimer = 0;
        }
        return;
      }

      if (weapon.firingMode === 'beam') {
        const isFiring = (this.mouseDown || arrowKeyFiring || touchFiring) && index === player.activeWeaponIndex;
        if (isFiring && !weapon.beamOverheated) {
          if (!weapon.isBeaming) {
            weapon.isBeaming = true;
            weapon.beamTimer = 0;
          }
          weapon.beamTimer = (weapon.beamTimer || 0) + dt;
          weapon.beamHeat = Math.min((weapon.beamHeat || 0) + dt * 35, weapon.beamMaxHeat || 100);

          if (weapon.beamHeat >= (weapon.beamMaxHeat || 100)) {
            weapon.beamOverheated = true;
            weapon.isBeaming = false;
          } else {
            this.fireBeam(weapon);
          }
        } else {
          weapon.isBeaming = false;
          if (weapon.beamOverheated) {
            weapon.beamHeat = Math.max((weapon.beamHeat || 0) - dt * 25, 0);
            if (weapon.beamHeat <= 0) {
              weapon.beamOverheated = false;
            }
          } else {
            weapon.beamHeat = Math.max((weapon.beamHeat || 0) - dt * 50, 0);
          }
        }
        return;
      }

      const mousePressed = this.mouseDown && !this.lastMouseDown;
      const arrowPressed = arrowKeyFiring;
      const touchPressed = touchFiring && !this.lastMouseDown;
      const shouldFire =
        ((weapon.firingMode === 'auto' ? (this.mouseDown || arrowKeyFiring || touchFiring) : (mousePressed || arrowPressed || touchPressed))) &&
        index === player.activeWeaponIndex;

      if (shouldFire && weapon.cooldown <= 0) {
        if (weapon.type === 'grappling_hook') {
          this.fireGrapplingHook();
          weapon.cooldown = weapon.grapplingStats?.cooldown || weapon.fireRate;
        } else {
          this.fireWeapon(weapon);
          weapon.cooldown = weapon.fireRate;
        }
      }
    });
  }

  private updateMeleeWeapon(weapon: Weapon, dt: number, index: number): void {
    const player = this.gameState.player;
    const touchFiring = this.touchShootInput ? this.touchShootInput.current.active : false;

    if (weapon.swingTimer && weapon.swingTimer > 0) {
      weapon.swingTimer -= dt;
      if (weapon.swingTimer <= 0) {
        weapon.isSwinging = false;
        weapon.swingTimer = 0;
      }
    }

    if (weapon.comboResetTimer && weapon.comboResetTimer > 0) {
      weapon.comboResetTimer -= dt;
      if (weapon.comboResetTimer <= 0) {
        weapon.comboCounter = 0;
        weapon.comboResetTimer = 0;
      }
    }

    const mousePressed = this.mouseDown && !this.lastMouseDown;
    const arrowPressed = this.keys.has('arrowup');
    const touchPressed = touchFiring && !this.lastMouseDown;

    if ((mousePressed || arrowPressed || touchPressed) && index === player.activeWeaponIndex && weapon.cooldown <= 0 && !weapon.isSwinging) {
      this.fireMeleeWeapon(weapon);
      weapon.cooldown = weapon.fireRate;
    }
  }

  private fireMeleeWeapon(weapon: Weapon): void {
    if (!weapon.meleeStats) return;

    const player = this.gameState.player;
    
    if (!weapon.meleeFormId) {
      weapon.meleeFormId = getFormForWeapon(weapon.type).id;
    }
    
    const form = MELEE_FORMS[weapon.meleeFormId] || MELEE_FORMS.basic_form;
    
    weapon.isSwinging = true;
    weapon.comboCounter = (weapon.comboCounter || 0) + 1;
    weapon.comboResetTimer = 1.0;

    if (weapon.comboCounter > form.comboPattern.length) {
      weapon.comboCounter = 1;
    }

    const strike = form.comboPattern[(weapon.comboCounter - 1) % form.comboPattern.length];
    weapon.swingTimer = weapon.meleeStats.swingDuration / strike.speedModifier;
    
    const angle = player.rotation + (strike.angleOffset * Math.PI / 180);

    const comboMultiplier = 1 + ((weapon.comboCounter || 1) - 1) * ((weapon.meleeStats.comboDamageMultiplier || 1.5) - 1) / (form.comboPattern.length - 1);
    const dashMultiplier = player.isDashing ? (weapon.meleeStats.dashSlashBonus || 2.0) : 1.0;
    const totalDamage = weapon.damage * comboMultiplier * dashMultiplier * strike.damageMultiplier;

    const swingAngle = (weapon.meleeStats.swingAngle || 90) * strike.swingAngleModifier * (Math.PI / 180);
    const halfAngle = swingAngle / 2;

    // Damage void subdivider boss
    if (this.voidSubdivider && this.voidSubdivider.health > 0) {
      const toBoss = vectorSubtract(this.voidSubdivider.position, player.position);
      const bossDistance = Math.sqrt(toBoss.x * toBoss.x + toBoss.y * toBoss.y);
      const angleToBoss = Math.atan2(toBoss.y, toBoss.x);

      let angleDiff = angleToBoss - angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const inRange = bossDistance <= (weapon.meleeStats.range || 80) + this.voidSubdivider.size / 2;
      const inAngle = Math.abs(angleDiff) <= halfAngle;

      if (inRange && inAngle) {
        this.voidSubdivider.health -= totalDamage;
        this.createDamageNumber(this.voidSubdivider.position, totalDamage, weapon.color);
        this.createParticles(this.voidSubdivider.position, 20, weapon.color, 0.5);
      }
    }

    // Damage enemies
    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      const toEnemy = vectorSubtract(enemy.position, player.position);
      const distance = Math.sqrt(toEnemy.x * toEnemy.x + toEnemy.y * toEnemy.y);
      const angleToEnemy = Math.atan2(toEnemy.y, toEnemy.x);

      let angleDiff = angleToEnemy - angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const inRange = distance <= (weapon.meleeStats.range || 80) + enemy.size / 2;
      const inAngle = Math.abs(angleDiff) <= halfAngle;

      if (inRange && inAngle) {
        let damageToApply = totalDamage;

        if (this.modifierSystem.isModifiedEnemy(enemy)) {
          const result = this.modifierSystem.handleDamage(
            enemy,
            totalDamage,
            enemy.position,
            createVector(),
            (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime),
            (projectiles) => this.gameState.projectiles.push(...projectiles),
            (spawnedEnemy) => this.gameState.enemies.push(spawnedEnemy)
          );

          if (result.shouldBlockDamage) {
            return;
          }
          damageToApply *= result.damageModifier;
        }

        enemy.health -= damageToApply;
        enemy.isAggro = true;

        this.createDamageNumber(enemy.position, damageToApply, weapon.color);
        this.createParticles(enemy.position, 15, weapon.color, 0.4);

        const knockback = vectorNormalize(toEnemy);
        enemy.velocity = vectorAdd(enemy.velocity || createVector(), vectorScale(knockback, 5));

        if (this.modifierSystem.isModifiedEnemy(enemy) && enemy.modifiers && enemy.modifiers.includes('thorns')) {
          const thornsDamage = (enemy as any).thornsDamage || (enemy.damage * 0.5);
          player.health -= thornsDamage;
          this.createParticles(player.position, 8, '#ef4444', 0.4);
          if (player.health <= 0) {
            this.gameState.isGameOver = true;
          }
        }

        if (enemy.health <= 0) {
          let scoreValue = 10;
          if (enemy.type === 'boss') scoreValue = 500;
          if (this.modifierSystem.isModifiedEnemy(enemy)) scoreValue = 150;

          this.gameState.score += scoreValue;
          this.spawnCurrency(enemy.position, enemy.currencyDrop);
          this.worldGenerator.registerEnemyKill(enemy.id);

          let particleCount = 20;
          if (enemy.type === 'boss') particleCount = 50;
          if (this.modifierSystem.isModifiedEnemy(enemy)) particleCount = 40;

          this.createParticles(enemy.position, particleCount, enemy.color, 0.6);

          if (this.modifierSystem.isModifiedEnemy(enemy)) {
            this.modifierSystem.removeEnemy(enemy.id);
          }
        }
      }
    });

    // PvP melee damage
    if (this.gameState.pvpEnabled) {
      this.gameState.remotePlayers.forEach((remotePlayer) => {
        if (!remotePlayer.player.isDashing) {
          const toRemote = vectorSubtract(remotePlayer.player.position, player.position);
          const remoteDistance = Math.sqrt(toRemote.x * toRemote.x + toRemote.y * toRemote.y);
          const angleToRemote = Math.atan2(toRemote.y, toRemote.x);

          let angleDiff = angleToRemote - angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          const inRange = remoteDistance <= (weapon.meleeStats.range || 80) + remotePlayer.player.size / 2;
          const inAngle = Math.abs(angleDiff) <= halfAngle;

          if (inRange && inAngle) {
            remotePlayer.player.health -= totalDamage;
            this.createDamageNumber(remotePlayer.player.position, totalDamage, weapon.color);
            this.createParticles(remotePlayer.player.position, 15, '#ff6600', 0.4);

            const knockback = vectorNormalize(toRemote);
            remotePlayer.player.velocity = vectorAdd(remotePlayer.player.velocity || createVector(), vectorScale(knockback, 5));
          }
        }
      });
    }

    const hasDeflection = weapon.perks?.some((perk: any) => perk.id === 'projectile_deflection');
    if (hasDeflection && weapon.isSwinging) {
      this.gameState.projectiles.forEach((projectile) => {
        if (projectile.owner === 'enemy') {
          const toProjectile = vectorSubtract(projectile.position, player.position);
          const distance = Math.sqrt(toProjectile.x * toProjectile.x + toProjectile.y * toProjectile.y);
          const angleToProjectile = Math.atan2(toProjectile.y, toProjectile.x);

          let angleDiff = angleToProjectile - angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          const inRange = distance <= (weapon.meleeStats.range || 80) + 20;
          const inAngle = Math.abs(angleDiff) <= halfAngle;

          if (inRange && inAngle) {
            projectile.owner = 'player';
            projectile.velocity = vectorScale(vectorNormalize(toProjectile), -projectile.projectileSpeed || 15);
            projectile.color = weapon.color;
            this.createParticles(projectile.position, 10, weapon.color, 0.3);
          }
        }
      });
    }

    const particleCount = 8 + (weapon.comboCounter || 1) * 2;
    this.createParticles(
      { x: player.position.x + Math.cos(angle) * 40, y: player.position.y + Math.sin(angle) * 40 },
      particleCount,
      weapon.color,
      0.3
    );
  }

  private fireBeam(weapon: Weapon): void {
    const player = this.gameState.player;
    const angle = player.rotation;

    const beamLength = weapon.maxRange || MAX_VISIBLE_RANGE;
    const endX = player.position.x + Math.cos(angle) * beamLength;
    const endY = player.position.y + Math.sin(angle) * beamLength;

    let actualBeamLength = beamLength;
    for (const obstacle of this.obstacles) {
      const collisionPoint = this.raycastObstacle(player.position, { x: endX, y: endY }, obstacle);
      if (collisionPoint) {
        const distToCollision = vectorDistance(player.position, collisionPoint);
        if (distToCollision < actualBeamLength) {
          actualBeamLength = distToCollision;
        }
      }
    }

    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      const distToBeam = this.pointToLineDistance(
        enemy.position,
        player.position,
        { x: player.position.x + Math.cos(angle) * actualBeamLength, y: player.position.y + Math.sin(angle) * actualBeamLength }
      );

      const enemyRadius = enemy.size / 2;
      if (distToBeam < enemyRadius + weapon.projectileSize) {
        const enemyDist = vectorDistance(player.position, enemy.position);
        if (enemyDist <= actualBeamLength) {
          const damageDealt = weapon.damage * 0.016;
          enemy.health -= damageDealt;
          enemy.isAggro = true;
          if (Math.random() < 0.05) {
            this.createDamageNumber(enemy.position, Math.floor(damageDealt), weapon.color);
          }
          if (Math.random() < 0.1) {
            this.createParticles(enemy.position, 2, weapon.color, 0.2);
          }
        }
      }
    });
  }

  private fireRailgunBeam(weapon: Weapon): void {
    const player = this.gameState.player;
    const angle = player.rotation;

    weapon.railgunBeamTimer = 0.15;

    const beamLength = weapon.maxRange || MAX_VISIBLE_RANGE;
    const endX = player.position.x + Math.cos(angle) * beamLength;
    const endY = player.position.y + Math.sin(angle) * beamLength;

    let actualBeamLength = beamLength;
    for (const obstacle of this.obstacles) {
      const collisionPoint = this.raycastObstacle(player.position, { x: endX, y: endY }, obstacle);
      if (collisionPoint) {
        const distToCollision = vectorDistance(player.position, collisionPoint);
        if (distToCollision < actualBeamLength) {
          actualBeamLength = distToCollision;
        }
      }
    }

    let damage = weapon.damage;
    if (weapon.currentCharge) {
      const chargeRatio = weapon.currentCharge / (weapon.chargeTime || 1.5);
      damage *= 1 + chargeRatio * 3;
    }

    // Damage void subdivider boss with railgun
    if (this.voidSubdivider && this.voidSubdivider.health > 0) {
      const distToBeam = this.pointToLineDistance(
        this.voidSubdivider.position,
        player.position,
        { x: player.position.x + Math.cos(angle) * actualBeamLength, y: player.position.y + Math.sin(angle) * actualBeamLength }
      );

      const bossRadius = this.voidSubdivider.size / 2;
      if (distToBeam < bossRadius + weapon.projectileSize * 1.5) {
        const bossDist = vectorDistance(player.position, this.voidSubdivider.position);
        if (bossDist <= actualBeamLength) {
          this.voidSubdivider.health -= damage;
          this.createDamageNumber(this.voidSubdivider.position, damage, '#00ff00');
          this.createParticles(this.voidSubdivider.position, 30, weapon.color, 0.5);
        }
      }
    }

    const hitEnemies = new Set<string>();
    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0 || hitEnemies.has(enemy.id)) return;

      const distToBeam = this.pointToLineDistance(
        enemy.position,
        player.position,
        { x: player.position.x + Math.cos(angle) * actualBeamLength, y: player.position.y + Math.sin(angle) * actualBeamLength }
      );

      const enemyRadius = enemy.size / 2;
      if (distToBeam < enemyRadius + weapon.projectileSize * 1.5) {
        const enemyDist = vectorDistance(player.position, enemy.position);
        if (enemyDist <= actualBeamLength) {
          let damageToApply = damage;

          if (this.modifierSystem.isModifiedEnemy(enemy)) {
            const result = this.modifierSystem.handleDamage(
              enemy,
              damage,
              enemy.position,
              createVector(),
              (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime),
              (projectiles) => this.gameState.projectiles.push(...projectiles),
              (spawnedEnemy) => this.gameState.enemies.push(spawnedEnemy)
            );

            if (result.shouldBlockDamage) {
              return;
            }
            damageToApply *= result.damageModifier;
          }

          enemy.health -= damageToApply;
          enemy.isAggro = true;
          hitEnemies.add(enemy.id);

          this.createDamageNumber(enemy.position, damageToApply, '#00ff00');

          if (this.modifierSystem.isModifiedEnemy(enemy) && enemy.modifiers && enemy.modifiers.includes('thorns')) {
            const thornsDamage = (enemy as any).thornsDamage || (enemy.damage * 0.5);
            player.health -= thornsDamage;
            this.createParticles(player.position, 8, '#ef4444', 0.4);
            if (player.health <= 0) {
              this.gameState.isGameOver = true;
            }
          }

          this.createParticles(enemy.position, 20, weapon.color, 0.4);

          if (enemy.health <= 0) {
            let scoreValue = 10;
            if (enemy.type === 'boss') scoreValue = 500;
            if (this.modifierSystem.isModifiedEnemy(enemy)) scoreValue = 150;

            this.gameState.score += scoreValue;
            this.spawnCurrency(enemy.position, enemy.currencyDrop);
            this.worldGenerator.registerEnemyKill(enemy.id);

            let particleCount = 20;
            if (enemy.type === 'boss') particleCount = 50;
            if (this.modifierSystem.isModifiedEnemy(enemy)) particleCount = 40;

            this.createParticles(enemy.position, particleCount, enemy.color, 0.6);

            if (this.modifierSystem.isModifiedEnemy(enemy)) {
              this.modifierSystem.removeEnemy(enemy.id);
            }
          }
        }
      }
    });

    this.createParticles(
      { x: player.position.x + Math.cos(angle) * 30, y: player.position.y + Math.sin(angle) * 30 },
      15,
      weapon.color,
      0.3
    );
  }

  private fireWeapon(weapon: Weapon): void {
    const player = this.gameState.player;
    const angle = player.rotation;

    const MAX_PROJECTILES = 300;
    if (this.gameState.projectiles.length >= MAX_PROJECTILES) {
      return;
    }

    for (let i = 0; i < weapon.projectileCount; i++) {
      const spreadOffset =
        (i - (weapon.projectileCount - 1) / 2) * weapon.spread;
      const projectileAngle = angle + spreadOffset;

      const velocity = vectorFromAngle(projectileAngle, weapon.projectileSpeed);

      let damage = weapon.damage;
      let size = weapon.projectileSize;

      if (weapon.firingMode === 'charge' && weapon.currentCharge) {
        const chargeRatio = weapon.currentCharge / (weapon.chargeTime || 2.0);
        damage *= 1 + chargeRatio * 4;
        size *= 1 + chargeRatio * 2;
      }

      if (weapon.firingMode === 'hold' && weapon.holdTimer) {
        const holdRatio = weapon.holdTimer / (weapon.holdTime || 0.8);
        damage *= 1 + holdRatio * 1.5;
      }

      const isGravityWell = weapon.type === 'gravity_well';

      const projectile: Projectile = {
        id: generateId(),
        position: { ...player.position },
        velocity,
        damage,
        size,
        color: weapon.color,
        owner: 'player',
        playerId: player.id,
        piercing: weapon.piercing || false,
        piercingCount: weapon.piercing ? 3 : 0,
        lifetime: 3,
        homing: weapon.homing,
        homingStrength: weapon.homingStrength,
        explosive: weapon.explosive,
        explosionRadius: weapon.explosionRadius,
        ricochet: weapon.ricochet,
        ricochetCount: weapon.ricochet ? 2 : 0,
        maxRange: weapon.maxRange || MAX_VISIBLE_RANGE,
        travelDistance: 0,
        weaponType: weapon.type,
        isCharged: weapon.firingMode === 'charge' && (weapon.currentCharge || 0) > 0.2,
        chargeLevel: weapon.currentCharge,
        chainTarget: weapon.chainRange ? undefined : undefined,
        chainCount: weapon.chainRange ? 3 : 0,
        splitCount: weapon.splitCount || 0,
        isPortal: weapon.portalDuration ? true : false,
        portalPair: weapon.portalDuration ? undefined : undefined,
        rotation: 0,
        isGravityWell: isGravityWell,
        gravityRadius: isGravityWell ? 150 : undefined,
        gravityStrength: isGravityWell ? 2.5 : undefined,
        wallPierce: weapon.wallPierce || false,
        isChainLightning: weapon.chainRange ? true : false,
      };

      this.gameState.projectiles.push(projectile);
    }
  }

  private updateEnemies(dt: number): void {
    const player = this.gameState.player;

    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      const targetPlayer = this.findNearestPlayer(enemy.position);
      const dirToPlayer = vectorSubtract(targetPlayer.position, enemy.position);
      const distance = vectorDistance(enemy.position, targetPlayer.position);

      const deaggroRadius = (enemy.detectionRadius || 100) * 2.5;
      if (enemy.isAggro && distance > deaggroRadius) {
        enemy.isAggro = false;
      }

      if (enemy.type === 'dasher') {
        enemy.dashTimer = (enemy.dashTimer || 0) + dt;
        enemy.dashCooldown = (enemy.dashCooldown || 2.0) - dt;

        if (enemy.dashCooldown <= 0 && distance < 200) {
          enemy.isDashing = true;
          enemy.dashTimer = 0;
          enemy.dashCooldown = 3.0;
        }

        if (enemy.isDashing && enemy.dashTimer < 0.3) {
          const normalized = vectorNormalize(dirToPlayer);
          enemy.velocity = vectorScale(normalized, enemy.speed * 4);
        } else {
          enemy.isDashing = false;
          if (distance < (enemy.detectionRadius || 100)) {
            enemy.isAggro = true;
            const normalized = vectorNormalize(dirToPlayer);
            enemy.velocity = vectorScale(normalized, enemy.speed);
          } else if (enemy.isAggro) {
            const normalized = vectorNormalize(dirToPlayer);
            enemy.velocity = vectorScale(normalized, enemy.speed);
          } else {
            enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;
            if (enemy.wanderTimer > 2) {
              enemy.wanderAngle = randomRange(0, Math.PI * 2);
              enemy.wanderTimer = 0;
            }
            const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
            enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
          }
        }
      } else if (enemy.type === 'weaver') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          enemy.wavePhase = (enemy.wavePhase || 0) + dt * 3;
          enemy.waveAmplitude = enemy.waveAmplitude || 50;

          const directionToPlayer = findPathAroundObstacles(
            enemy.position,
            targetPlayer.position,
            this.getPathfindingObstacles(),
            enemy.size / 2
          );

          const perpendicular = { x: -directionToPlayer.y, y: directionToPlayer.x };
          const waveOffset = Math.sin(enemy.wavePhase) * 2;

          const forward = vectorScale(directionToPlayer, enemy.speed);
          const sideways = vectorScale(perpendicular, waveOffset);

          enemy.velocity = vectorAdd(forward, sideways);
        } else {
          enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;
          if (enemy.wanderTimer > 2) {
            enemy.wanderAngle = randomRange(0, Math.PI * 2);
            enemy.wanderTimer = 0;
          }
          const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
          enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
        }
      } else if (enemy.type === 'laser') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 250) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              this.enemyFireLaser(enemy, targetPlayer.position);
              enemy.attackCooldown = 1.5;
            }
          }
        } else {
          enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;
          if (enemy.wanderTimer > 2) {
            enemy.wanderAngle = randomRange(0, Math.PI * 2);
            enemy.wanderTimer = 0;
          }
          const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
          enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
        }
      } else if (enemy.type === 'sniper') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 300) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              this.enemyFireProjectile(enemy, targetPlayer.position, 1, 8);
              enemy.attackCooldown = 2;
            }
          }
        } else {
          enemy.velocity = createVector();
        }
      } else if (enemy.type === 'artillery') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 350) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              this.enemyFireProjectile(enemy, targetPlayer.position, 1, 6, 0.15);
              enemy.attackCooldown = 3;
            }
          }
        } else {
          enemy.velocity = createVector();
        }
      } else if (enemy.type === 'burst') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 250) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                  if (this.gameState.enemies.includes(enemy)) {
                    this.enemyFireProjectile(enemy, targetPlayer.position, 1, 10);
                  }
                }, i * 150);
              }
              enemy.attackCooldown = 2.5;
            }
          }
        } else {
          enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;
          if (enemy.wanderTimer > 2) {
            enemy.wanderAngle = randomRange(0, Math.PI * 2);
            enemy.wanderTimer = 0;
          }
          const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
          enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
        }
      } else if (enemy.type === 'boss') {
        const directionToPlayer = findPathAroundObstacles(
          enemy.position,
          targetPlayer.position,
          this.getPathfindingObstacles(),
          enemy.size / 2
        );
        enemy.velocity = vectorScale(directionToPlayer, enemy.speed);

        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          const spreadCount = 8;
          for (let i = 0; i < spreadCount; i++) {
            const angle = (Math.PI * 2 * i) / spreadCount + enemy.rotation;
            const targetPos = {
              x: enemy.position.x + Math.cos(angle) * 100,
              y: enemy.position.y + Math.sin(angle) * 100,
            };
            this.enemyFireProjectile(enemy, targetPos, 1, 7);
          }
          enemy.attackCooldown = 1.5;
        }
      } else if (enemy.type === 'orbiter') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 280) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            enemy.orbitalAngle = (enemy.orbitalAngle || 0) + dt * 3;

            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              const orbitalCount = 5;
              for (let i = 0; i < orbitalCount; i++) {
                const angle = (Math.PI * 2 * i) / orbitalCount + (enemy.orbitalAngle || 0);
                const targetPos = {
                  x: enemy.position.x + Math.cos(angle) * 100,
                  y: enemy.position.y + Math.sin(angle) * 100,
                };
                this.enemyFireProjectile(enemy, targetPos, 1, 9, 0, true);
              }
              enemy.attackCooldown = 2;
            }
          }
        } else {
          enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;
          if (enemy.wanderTimer > 2) {
            enemy.wanderAngle = randomRange(0, Math.PI * 2);
            enemy.wanderTimer = 0;
          }
          const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
          enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
        }
      } else if (enemy.type === 'fragmenter') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 300) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              this.enemyFireProjectile(enemy, targetPlayer.position, 1, 10);
              setTimeout(() => {
                if (this.gameState.enemies.includes(enemy)) {
                  const fragmentTarget = this.findNearestPlayer(enemy.position);
                  const fragmentCount = 4;
                  for (let i = 0; i < fragmentCount; i++) {
                    const angle = (Math.PI * 2 * i) / fragmentCount;
                    const targetPos = {
                      x: fragmentTarget.position.x + Math.cos(angle) * 80,
                      y: fragmentTarget.position.y + Math.sin(angle) * 80,
                    };
                    this.enemyFireProjectile(enemy, targetPos, 1, 7);
                  }
                }
              }, 400);
              enemy.attackCooldown = 3;
            }
          }
        } else {
          enemy.velocity = createVector();
        }
      } else if (enemy.type === 'pulsar') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 350) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            enemy.pulseTimer = (enemy.pulseTimer || 0) + dt;
            enemy.attackCooldown -= dt;

            if (enemy.attackCooldown <= 0) {
              const waveCount = 12;
              for (let i = 0; i < waveCount; i++) {
                const angle = (Math.PI * 2 * i) / waveCount;
                const targetPos = {
                  x: enemy.position.x + Math.cos(angle) * 100,
                  y: enemy.position.y + Math.sin(angle) * 100,
                };
                this.enemyFireProjectile(enemy, targetPos, 1, 6);
              }
              enemy.attackCooldown = 2.5;
            }
          }
        } else {
          enemy.velocity = createVector();
        }
      } else if (enemy.type === 'spiraler') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          enemy.spiralPhase = (enemy.spiralPhase || 0) + dt * 4;
          enemy.spiralAngle = (enemy.spiralAngle || 0) + dt * 2;

          const spiralRadius = 150 + Math.sin(enemy.spiralPhase) * 50;
          const targetX = targetPlayer.position.x + Math.cos(enemy.spiralAngle) * spiralRadius;
          const targetY = targetPlayer.position.y + Math.sin(enemy.spiralAngle) * spiralRadius;
          const targetPos = { x: targetX, y: targetY };

          const directionToTarget = findPathAroundObstacles(
            enemy.position,
            targetPos,
            this.getPathfindingObstacles(),
            enemy.size / 2
          );
          enemy.velocity = vectorScale(directionToTarget, enemy.speed);

          enemy.attackCooldown -= dt;
          if (enemy.attackCooldown <= 0) {
            this.enemyFireProjectile(enemy, targetPlayer.position, 1, 8);
            enemy.attackCooldown = 1.2;
          }
        } else {
          enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;
          if (enemy.wanderTimer > 2) {
            enemy.wanderAngle = randomRange(0, Math.PI * 2);
            enemy.wanderTimer = 0;
          }
          const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
          enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
        }
      } else if (enemy.type === 'replicator') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          const directionToPlayer = findPathAroundObstacles(
            enemy.position,
            targetPlayer.position,
            this.getPathfindingObstacles(),
            enemy.size / 2
          );
          enemy.velocity = vectorScale(directionToPlayer, enemy.speed);

          enemy.replicateTimer = (enemy.replicateTimer || 0) + dt;
          if (enemy.replicateTimer >= 10 && (enemy.replicateCount || 0) < 1) {
            const replicaAngle = randomRange(0, Math.PI * 2);
            const replicaOffset = vectorFromAngle(replicaAngle, 60);
            const replicaPos = vectorAdd(enemy.position, replicaOffset);

            const replica: Enemy = {
              id: generateId(),
              position: replicaPos,
              velocity: createVector(),
              rotation: 0,
              health: enemy.maxHealth * 0.5,
              maxHealth: enemy.maxHealth * 0.5,
              damage: enemy.damage * 0.7,
              size: enemy.size * 0.8,
              speed: enemy.speed * 1.1,
              color: enemy.color,
              type: 'speedy',
              attackCooldown: 1,
              currencyDrop: Math.floor(enemy.currencyDrop * 0.5),
              isAggro: true,
            };

            this.gameState.enemies.push(replica);
            this.createParticles(replicaPos, 25, enemy.color, 0.7);
            enemy.replicateTimer = 0;
            enemy.replicateCount = (enemy.replicateCount || 0) + 1;
          }

          enemy.attackCooldown -= dt;
          if (enemy.attackCooldown <= 0) {
            this.enemyFireProjectile(enemy, targetPlayer.position, 1, 7);
            enemy.attackCooldown = 1.8;
          }
        } else {
          enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;
          if (enemy.wanderTimer > 2) {
            enemy.wanderAngle = randomRange(0, Math.PI * 2);
            enemy.wanderTimer = 0;
          }
          const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
          enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
        }
      } else if (enemy.type === 'vortex') {
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }

        if (enemy.isAggro) {
          if (distance > 250) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();

            this.gameState.projectiles.forEach((proj) => {
              if (proj.owner === 'player') {
                const distToProj = vectorDistance(enemy.position, proj.position);
                const pullRadius = enemy.vortexRadius || 200;
                if (distToProj < pullRadius) {
                  const pullDir = vectorNormalize(vectorSubtract(enemy.position, proj.position));
                  const pullStrength = (enemy.vortexPullStrength || 3) * (1 - distToProj / pullRadius);
                  proj.velocity = vectorAdd(proj.velocity, vectorScale(pullDir, pullStrength * dt * 60));
                }
              }
            });

            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              const spreadCount = 6;
              for (let i = 0; i < spreadCount; i++) {
                const angle = (Math.PI * 2 * i) / spreadCount + enemy.rotation;
                const targetPos = {
                  x: enemy.position.x + Math.cos(angle) * 100,
                  y: enemy.position.y + Math.sin(angle) * 100,
                };
                this.enemyFireProjectile(enemy, targetPos, 1, 8);
              }
              enemy.attackCooldown = 2;
            }
          }
        } else {
          enemy.velocity = createVector();
        }
      } else {
        if (enemy.isAggro) {
          if (distance > (enemy.detectionRadius || 100) * 1.5) {
            enemy.isAggro = false;
          } else {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          }
        } else {
          if (distance < (enemy.detectionRadius || 100)) {
            enemy.isAggro = true;
          }
        }

        if (!enemy.isAggro) {
          enemy.wanderTimer = (enemy.wanderTimer || 0) + dt;

          if (enemy.wanderTimer > 2) {
            enemy.wanderAngle = randomRange(0, Math.PI * 2);
            enemy.wanderTimer = 0;
          }

          const wanderDirection = vectorFromAngle(enemy.wanderAngle || 0, 1);
          enemy.velocity = vectorScale(wanderDirection, enemy.speed * 0.5);
        }
      }

      enemy.position = vectorAdd(
        enemy.position,
        vectorScale(enemy.velocity, dt * 60)
      );

      this.obstacles.forEach((obstacle) => {
        if (checkEntityObstacleCollision(enemy, obstacle)) {
          resolveEntityObstacleCollision(enemy, obstacle);
        }
      });

      enemy.rotation = Math.atan2(dirToPlayer.y, dirToPlayer.x);
      enemy.attackCooldown -= dt;
    });
  }

  private enemyFireProjectile(
    enemy: Enemy,
    targetPos: { x: number; y: number },
    count: number = 1,
    speed: number = 8,
    spread: number = 0,
    homing: boolean = false
  ): void {
    const direction = vectorNormalize(
      vectorSubtract(targetPos, enemy.position)
    );

    for (let i = 0; i < count; i++) {
      const spreadOffset = (i - (count - 1) / 2) * spread;
      const angle = Math.atan2(direction.y, direction.x) + spreadOffset;
      const velocity = vectorFromAngle(angle, speed);

      this.gameState.projectiles.push({
        id: generateId(),
        position: { ...enemy.position },
        velocity,
        damage: enemy.damage,
        size: enemy.type === 'boss' ? 8 : 6,
        color: enemy.type === 'boss' ? '#ff0000' : '#ff3333',
        owner: 'enemy',
        piercing: false,
        piercingCount: 0,
        lifetime: 4,
        rotation: 0,
        homing: homing,
        homingStrength: homing ? 0.03 : undefined,
      });
    }
  }

  private enemyFireLaser(
    enemy: Enemy,
    targetPos: { x: number; y: number }
  ): void {
    const direction = vectorNormalize(
      vectorSubtract(targetPos, enemy.position)
    );

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (this.gameState.enemies.includes(enemy)) {
          const velocity = vectorFromAngle(
            Math.atan2(direction.y, direction.x),
            12
          );

          this.gameState.projectiles.push({
            id: generateId(),
            position: { ...enemy.position },
            velocity,
            damage: enemy.damage,
            size: 4,
            color: '#8b5cf6',
            owner: 'enemy',
            piercing: true,
            piercingCount: 5,
            lifetime: 3,
            weaponType: 'laser',
            rotation: 0,
          });
        }
      }, i * 100);
    }
  }

  private findNearestEnemy(position: { x: number; y: number }): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      const dist = vectorDistance(position, enemy.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  private findNearestPlayer(position: { x: number; y: number }): Player {
    const allPlayers = [this.gameState.player, ...this.gameState.remotePlayers.map(rp => rp.player)];
    
    let nearest = allPlayers[0];
    let minDist = vectorDistance(position, nearest.position);

    for (let i = 1; i < allPlayers.length; i++) {
      const dist = vectorDistance(position, allPlayers[i].position);
      if (dist < minDist) {
        minDist = dist;
        nearest = allPlayers[i];
      }
    }

    return nearest;
  }

  private findNearestEnemyExcluding(position: { x: number; y: number }, excludeId: string): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    this.gameState.enemies.forEach((enemy) => {
      if (enemy.id === excludeId || enemy.health <= 0) return;

      const dist = vectorDistance(position, enemy.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  private raycastObstacle(start: { x: number; y: number }, end: { x: number; y: number }, obstacle: Obstacle): { x: number; y: number } | null {
    if (obstacle.shape === 'circle') {
      const radius = obstacle.size.x / 2;
      const d = vectorSubtract(end, start);
      const f = vectorSubtract(start, obstacle.position);
      const a = d.x * d.x + d.y * d.y;
      const b = 2 * (f.x * d.x + f.y * d.y);
      const c = (f.x * f.x + f.y * f.y) - radius * radius;
      const discriminant = b * b - 4 * a * c;

      if (discriminant >= 0) {
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (t >= 0 && t <= 1) {
          return {
            x: start.x + d.x * t,
            y: start.y + d.y * t
          };
        }
      }
    }
    return null;
  }

  private pointToLineDistance(point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateProjectiles(dt: number): void {
    const player = this.gameState.player;
    const allPlayers = [player, ...this.gameState.remotePlayers.map(rp => rp.player)];

    this.gameState.projectiles = this.gameState.projectiles.filter(
      (projectile) => {
        const screenEdgeDistance = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
        
        let shouldKeep = false;
        for (const p of allPlayers) {
          const distFromPlayer = vectorDistance(projectile.position, p.position);
          if (distFromPlayer <= screenEdgeDistance) {
            shouldKeep = true;
            break;
          }
        }
        
        if (!shouldKeep) {
          return false;
        }

        if (projectile.maxRange) {
          projectile.travelDistance = (projectile.travelDistance || 0) +
            Math.sqrt(
              projectile.velocity.x * projectile.velocity.x +
              projectile.velocity.y * projectile.velocity.y
            ) * dt * 60;

          if (projectile.travelDistance >= projectile.maxRange) {
            return false;
          }
        }

        if (projectile.isGravityWell && projectile.owner === 'player') {
          this.gameState.enemies.forEach((enemy) => {
            if (enemy.health <= 0) return;
            const dist = vectorDistance(enemy.position, projectile.position);
            if (dist < (projectile.gravityRadius || 150)) {
              const pullDir = vectorNormalize(vectorSubtract(projectile.position, enemy.position));
              const pullStrength = (projectile.gravityStrength || 2.5) * (1 - dist / (projectile.gravityRadius || 150));
              enemy.velocity = vectorAdd(enemy.velocity, vectorScale(pullDir, pullStrength * dt * 60));
            }
          });
        }

        if (projectile.homing) {
          if (projectile.owner === 'player') {
            const target = this.findNearestEnemy(projectile.position);
            if (target) {
              const toTarget = vectorSubtract(target.position, projectile.position);
              const targetDir = vectorNormalize(toTarget);
              const currentDir = vectorNormalize(projectile.velocity);

              const blended = {
                x: currentDir.x + targetDir.x * (projectile.homingStrength || 0.05),
                y: currentDir.y + targetDir.y * (projectile.homingStrength || 0.05),
              };

              const speed = Math.sqrt(
                projectile.velocity.x * projectile.velocity.x +
                projectile.velocity.y * projectile.velocity.y
              );

              projectile.velocity = vectorScale(vectorNormalize(blended), speed);
            }
          } else if (projectile.owner === 'enemy') {
            const target = this.gameState.player;
            const toTarget = vectorSubtract(target.position, projectile.position);
            const targetDir = vectorNormalize(toTarget);
            const currentDir = vectorNormalize(projectile.velocity);

            const blended = {
              x: currentDir.x + targetDir.x * (projectile.homingStrength || 0.05),
              y: currentDir.y + targetDir.y * (projectile.homingStrength || 0.05),
            };

            const speed = Math.sqrt(
              projectile.velocity.x * projectile.velocity.x +
              projectile.velocity.y * projectile.velocity.y
            );

            projectile.velocity = vectorScale(vectorNormalize(blended), speed);
          }
        }

        projectile.position = vectorAdd(
          projectile.position,
          vectorScale(projectile.velocity, dt * 60)
        );
        projectile.lifetime -= dt;

        if (!projectile.wallPierce && projectile.owner === 'player') {
          for (const obstacle of this.obstacles) {
            if (checkProjectileObstacleCollision(projectile, obstacle)) {
              if (projectile.ricochet && (projectile.ricochetCount || 0) > 0) {
                projectile.velocity = calculateRicochetVelocity(
                  projectile.velocity,
                  obstacle,
                  projectile.position
                );
                projectile.ricochetCount = (projectile.ricochetCount || 0) - 1;
                this.createParticles(projectile.position, 5, projectile.color, 0.2);
                break;
              } else {
                return false;
              }
            }
          }
        } else if (projectile.ricochet && projectile.owner === 'player') {
          for (const obstacle of this.obstacles) {
            if (checkProjectileObstacleCollision(projectile, obstacle)) {
              if ((projectile.ricochetCount || 0) > 0) {
                projectile.velocity = calculateRicochetVelocity(
                  projectile.velocity,
                  obstacle,
                  projectile.position
                );
                projectile.ricochetCount = (projectile.ricochetCount || 0) - 1;
                this.createParticles(projectile.position, 5, projectile.color, 0.2);
                break;
              } else {
                return false;
              }
            }
          }
        }

        return projectile.lifetime > 0;
      }
    );
  }

  private createExplosion(position: { x: number; y: number }, radius: number, damage: number): void {
    this.createParticles(position, 30, '#ff6600', 0.5);

    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      const dist = vectorDistance(enemy.position, position);
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        enemy.health -= damage * falloff;
        this.createParticles(enemy.position, 5, enemy.color, 0.3);
      }
    });
  }

  private updateParticles(dt: number): void {
    this.gameState.particles = this.gameState.particles.filter((particle) => {
      particle.position = vectorAdd(
        particle.position,
        vectorScale(particle.velocity, dt * 60)
      );
      particle.lifetime -= dt;
      particle.velocity = vectorScale(particle.velocity, 0.95);

      return particle.lifetime > 0;
    });
  }

  private updateCurrencyDrops(dt: number): void {
    const player = this.gameState.player;

    this.gameState.currencyDrops = this.gameState.currencyDrops.filter(
      (drop) => {
        const distToPlayer = vectorDistance(drop.position, player.position);

        if (distToPlayer < 100) {
          const pullDir = vectorNormalize(
            vectorSubtract(player.position, drop.position)
          );
          drop.velocity = vectorAdd(drop.velocity, vectorScale(pullDir, 0.5));
        }

        drop.position = vectorAdd(
          drop.position,
          vectorScale(drop.velocity, dt * 60)
        );
        drop.velocity = vectorScale(drop.velocity, 0.98);
        drop.lifetime -= dt;

        if (distToPlayer < 25) {
          player.currency += drop.value;
          this.createParticles(drop.position, 8, '#ffff00', 0.3);
          return false;
        }

        return drop.lifetime > 0;
      }
    );
  }

  private updateWeaponDrops(dt: number): void {
    const player = this.gameState.player;

    this.gameState.weaponDrops = this.gameState.weaponDrops.filter(
      (drop) => {
        drop.bobPhase += dt * 2;
        drop.rotation += dt * 1.5;

        drop.position = vectorAdd(
          drop.position,
          vectorScale(drop.velocity, dt * 60)
        );
        drop.velocity = vectorScale(drop.velocity, 0.95);
        drop.lifetime -= dt;

        const distToPlayer = vectorDistance(drop.position, player.position);
        if (distToPlayer < drop.size * 2 && this.keys.has('f')) {
          this.inventory.addWeapon(drop.weapon);
          this.createParticles(drop.position, 20, drop.weapon.color, 0.5);
          return false;
        }

        return drop.lifetime > 0;
      }
    );
  }

  private updateResourceDrops(dt: number): void {
    const player = this.gameState.player;

    this.gameState.resourceDrops = this.gameState.resourceDrops.filter(
      (drop) => {
        drop.bobPhase += dt * 2;
        drop.rotation += dt * 1.5;

        drop.position = vectorAdd(
          drop.position,
          vectorScale(drop.velocity, dt * 60)
        );
        drop.velocity = vectorScale(drop.velocity, 0.95);
        drop.lifetime -= dt;

        const distToPlayer = vectorDistance(drop.position, player.position);
        if (distToPlayer < drop.size * 2 && this.keys.has('f')) {
          (player.resources as any)[drop.resourceType] += drop.amount;
          this.createParticles(drop.position, 15, '#ffd700', 0.5);
          return false;
        }

        return drop.lifetime > 0;
      }
    );
  }

  private handleCollisions(dt: number = 0.016): void {
    const player = this.gameState.player;

    this.gameState.projectiles = this.gameState.projectiles.filter(
      (projectile) => {
        if (projectile.owner === 'player') {
          let hit = false;

          if (this.voidSubdivider && this.voidSubdivider.health > 0) {
            if (checkVoidSubdividerCollision(this.voidSubdivider, projectile.position, projectile.size)) {
              this.voidSubdivider.health -= projectile.damage;
              this.createDamageNumber(this.voidSubdivider.position, projectile.damage, '#ff6600');
              this.createParticles(projectile.position, 5, '#7c3aed', 0.3);

              if (projectile.explosive) {
                this.createExplosion(
                  projectile.position,
                  projectile.explosionRadius || 50,
                  projectile.damage * 0.5
                );
              }

              hit = true;
              if (!projectile.piercing || projectile.piercingCount <= 0) {
                return false;
              }
              projectile.piercingCount--;
            }
          }

          this.gameState.enemies.forEach((enemy) => {
            if (enemy.health <= 0) return;

            if (checkCollision(projectile, enemy)) {
              let damageToApply = projectile.damage;
              let shouldReflectProjectile = false;

              if (this.modifierSystem.isModifiedEnemy(enemy)) {
                const result = this.modifierSystem.handleDamage(
                  enemy,
                  projectile.damage,
                  projectile.position,
                  projectile.velocity,
                  (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime),
                  (projectiles) => this.gameState.projectiles.push(...projectiles),
                  (spawnedEnemy) => this.gameState.enemies.push(spawnedEnemy)
                );

                if (result.shouldBlockDamage) {
                  if (result.shouldReflect) {
                    projectile.velocity = vectorScale(projectile.velocity, -1);
                    projectile.owner = 'enemy';
                  }
                  return;
                }
                damageToApply *= result.damageModifier;
              }


              enemy.health -= damageToApply;
              enemy.isAggro = true;

              this.createDamageNumber(enemy.position, damageToApply, '#ff6600');

              if (this.modifierSystem.isModifiedEnemy(enemy) && enemy.modifiers && enemy.modifiers.includes('thorns')) {
                const thornsDamage = (enemy as any).thornsDamage || (enemy.damage * 0.5);
                player.health -= thornsDamage;
                this.createParticles(player.position, 8, '#ef4444', 0.4);
                if (player.health <= 0) {
                  this.gameState.isGameOver = true;
                }
              }

              this.createParticles(enemy.position, 5, enemy.color, 0.3);

              if (projectile.chainCount && projectile.chainCount > 0 && !projectile.chainedFrom) {
                const chainRange = projectile.maxRange ? Math.min(projectile.maxRange * 0.3, 200) : 200;
                const nearest = this.findNearestEnemyExcluding(projectile.position, enemy.id);
                if (nearest && vectorDistance(projectile.position, nearest.position) < chainRange) {
                  const chainDir = vectorNormalize(vectorSubtract(nearest.position, projectile.position));
                  const chainVelocity = vectorScale(chainDir, 18);

                  this.gameState.projectiles.push({
                    ...projectile,
                    id: generateId(),
                    position: { ...enemy.position },
                    velocity: chainVelocity,
                    chainCount: projectile.chainCount - 1,
                    chainedFrom: enemy.id,
                    isChainLightning: true,
                    chainLightningTarget: nearest.position,
                  });
                  this.createParticles(enemy.position, 15, '#a78bfa', 0.6);
                  this.createParticles(nearest.position, 10, '#8b5cf6', 0.4);
                }
              }

              if (projectile.splitCount && projectile.splitCount > 0 && !projectile.isSplit) {
                const splitCount = projectile.splitCount;
                for (let i = 0; i < splitCount; i++) {
                  const angle = (Math.PI * 2 * i) / splitCount;
                  const velocity = vectorFromAngle(angle, 10);

                  this.gameState.projectiles.push({
                    ...projectile,
                    id: generateId(),
                    position: { ...projectile.position },
                    velocity,
                    damage: projectile.damage * 0.5,
                    size: projectile.size * 0.7,
                    isSplit: true,
                    splitCount: 0,
                    lifetime: 1.5,
                  });
                }
                this.createParticles(projectile.position, 15, projectile.color, 0.5);
              }

              if (projectile.explosive) {
                this.createExplosion(
                  projectile.position,
                  projectile.explosionRadius || 50,
                  projectile.damage * 0.5
                );
                hit = true;
              }

              if (enemy.health <= 0) {
                let scoreValue = 10;
                if (enemy.type === 'boss') scoreValue = 500;
                if (this.modifierSystem.isModifiedEnemy(enemy)) scoreValue = 150;

                this.gameState.score += scoreValue;
                this.spawnCurrency(enemy.position, enemy.currencyDrop);
                this.worldGenerator.registerEnemyKill(enemy.id);

                let particleCount = 20;
                if (enemy.type === 'boss') particleCount = 50;
                if (this.modifierSystem.isModifiedEnemy(enemy)) particleCount = 40;

                this.createParticles(enemy.position, particleCount, enemy.color, 0.6);

                if (this.modifierSystem.isModifiedEnemy(enemy)) {
                  this.modifierSystem.removeEnemy(enemy.id);
                }
              }

              if (!projectile.piercing && !projectile.explosive) {
                hit = true;
              } else if (projectile.piercing && !projectile.explosive) {
                projectile.piercingCount--;
                if (projectile.piercingCount <= 0) hit = true;
              }
            }
          });

          if (this.gameState.pvpEnabled) {
            this.gameState.remotePlayers.forEach((remotePlayer) => {
              if (projectile.playerId !== remotePlayer.player.id && checkCollision(projectile, remotePlayer.player) && !remotePlayer.player.isDashing) {
                remotePlayer.player.health -= projectile.damage;
                this.createDamageNumber(remotePlayer.player.position, projectile.damage, '#ff6600');
                this.createParticles(remotePlayer.player.position, 8, '#ff0000', 0.4);
                
                if (projectile.explosive) {
                  this.createExplosion(
                    projectile.position,
                    projectile.explosionRadius || 50,
                    projectile.damage * 0.5
                  );
                  hit = true;
                }
                
                if (!projectile.piercing && !projectile.explosive) {
                  hit = true;
                } else if (projectile.piercing && !projectile.explosive) {
                  projectile.piercingCount--;
                  if (projectile.piercingCount <= 0) hit = true;
                }
              }
            });

            if (projectile.playerId && projectile.playerId !== player.id && checkCollision(projectile, player) && !player.isDashing) {
              player.health -= projectile.damage;
              this.checkPlayerDeath();
              this.createDamageNumber(player.position, projectile.damage, '#ff6600');
              this.createParticles(player.position, 8, '#ff0000', 0.4);
              
              if (projectile.explosive) {
                this.createExplosion(
                  projectile.position,
                  projectile.explosionRadius || 50,
                  projectile.damage * 0.5
                );
              }
              
              if (player.health <= 0) {
                this.gameState.isGameOver = true;
              }
              
              return false;
            }
          }

          return !hit;
        } else {
          if (checkCollision(projectile, player) && !player.isDashing) {
            player.health -= projectile.damage;
            this.checkPlayerDeath();
            this.createParticles(player.position, 8, '#ff0000', 0.4);

            return false;
          }
        }

        return true;
      }
    );

    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      if (checkCollision(enemy, player) && !player.isDashing) {
        if (enemy.attackCooldown <= 0) {
          player.health -= enemy.damage;
          enemy.attackCooldown = 1;
          this.createParticles(player.position, 5, '#ff0000', 0.3);
          this.checkPlayerDeath();
        }
      }
    });

    if (this.voidSubdivider && this.voidSubdivider.health > 0 && !player.isDashing) {
      if (checkVoidSubdividerCollision(this.voidSubdivider, player.position, player.size)) {
        const currentTime = Date.now();
        const lastHitTime = (this.voidSubdivider as any).lastPlayerHit || 0;

        if (currentTime - lastHitTime > 1000) {
          player.health -= this.voidSubdivider.damage;
          (this.voidSubdivider as any).lastPlayerHit = currentTime;
          this.createParticles(player.position, 8, '#7c3aed', 0.4);

          if (player.health <= 0) {
            this.gameState.isGameOver = true;
          }
        }
      }

      if (this.voidSubdivider.attackPhase === 'breath' && this.voidSubdivider.breathTimer && this.voidSubdivider.breathDirection !== undefined) {
        const headPos = this.voidSubdivider.segments[0].position;
        const breathLength = 600;
        const breathWidth = 80;

        const toPlayer = vectorSubtract(player.position, headPos);
        const distToHead = Math.sqrt(toPlayer.x ** 2 + toPlayer.y ** 2);

        if (distToHead < breathLength) {
          const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
          const angleDiff = Math.abs(angleToPlayer - this.voidSubdivider.breathDirection);

          const distToLine = Math.abs(distToHead * Math.sin(angleDiff));

          if (distToLine < breathWidth / 2) {
            player.health -= this.voidSubdivider.damage * 0.5 * dt;
            if (Math.random() < 0.1) {
              this.createParticles(player.position, 3, '#a78bfa', 0.3);
            }

            if (player.health <= 0) {
              this.gameState.isGameOver = true;
            }
          }
        }
      }
    }
  }

  private checkVoidSubdividerSpawn(): void {
    if (this.voidSubdivider) {
      this.activeOminousTendril = null;
      return;
    }

    let closestOminousTendril: { feature: any; distance: number } | null = null;

    for (const feature of this.biomeFeatures) {
      if (feature.type === 'void-gap' && feature.data.hasOminousTendril && !this.voidGapBossSpawned.has(feature.id)) {
        const distanceToFeature = vectorDistance(this.gameState.player.position, feature.position);

        if (distanceToFeature < 250 && (!closestOminousTendril || distanceToFeature < closestOminousTendril.distance)) {
          closestOminousTendril = { feature, distance: distanceToFeature };
        }
      }
    }

    if (closestOminousTendril && closestOminousTendril.distance < 150) {
      this.activeOminousTendril = {
        featureId: closestOminousTendril.feature.id,
        canInteract: true,
      };

      if (this.keys.has('f') || this.keys.has('F')) {
        this.spawnVoidSubdividerFromTendril(closestOminousTendril.feature);
      }
    } else {
      this.activeOminousTendril = null;
    }
  }

  private spawnVoidSubdividerFromTendril(feature: any): void {
    const angle = feature.data.ominousTendrilAngle || 0;
    const spawnDistance = Math.max(feature.data.width, feature.data.height) / 2 + 150;
    const spawnPos = {
      x: feature.position.x + Math.cos(angle) * spawnDistance,
      y: feature.position.y + Math.sin(angle) * spawnDistance,
    };

    this.voidSubdivider = createVoidSubdivider(spawnPos);
    this.voidGapBossSpawned.add(feature.id);
    this.activeOminousTendril = null;

    this.createParticles(feature.position, 100, '#7c3aed', 1.5);
    this.createParticles(spawnPos, 80, '#a78bfa', 1.2);
  }

  getActiveOminousTendril(): { featureId: string; canInteract: boolean } | null {
    return this.activeOminousTendril;
  }

  private updateVoidSubdividerBoss(dt: number): void {
    if (!this.voidSubdivider) return;

    updateVoidSubdivider(
      this.voidSubdivider,
      dt,
      this.gameState.player.position,
      (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime)
    );

    if (this.voidSubdivider.health <= 0) {
      this.handleVoidSubdividerDeath();
      this.voidSubdivider = null;
    }
  }

  private handleVoidSubdividerDeath(): void {
    if (!this.voidSubdivider) return;

    const dropPos = this.voidSubdivider.position;

    // Award unique boss resources
    this.gameState.player.resources.voidCore += 2 + Math.floor(Math.random() * 2);
    this.gameState.player.currency += this.voidSubdivider.currencyDrop * 2;

    // Enhanced resource drops
    const lootDrops = [
      { resource: 'voidEssence', amount: 80 + Math.floor(Math.random() * 50) },
      { resource: 'singularityCore', amount: 5 + Math.floor(Math.random() * 5) },
      { resource: 'flux', amount: 60 + Math.floor(Math.random() * 40) },
      { resource: 'energy', amount: 150 + Math.floor(Math.random() * 100) },
      { resource: 'aetheriumShard', amount: 8 + Math.floor(Math.random() * 7) },
      { resource: 'voidCore', amount: 1 },
    ];

    lootDrops.forEach((drop, index) => {
      const angle = (index / lootDrops.length) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      const dropPosition = {
        x: dropPos.x + Math.cos(angle) * distance,
        y: dropPos.y + Math.sin(angle) * distance,
      };

      this.gameState.resourceDrops.push({
        id: generateId(),
        position: dropPosition,
        velocity: createVector(0, 0),
        size: 20,
        rotation: 0,
        resourceType: drop.resource,
        amount: drop.amount,
        lifetime: 40,
        bobPhase: Math.random() * Math.PI * 2,
      });
    });

    // Drop 5 crate keys
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 60 + Math.random() * 60;
      const keyPos = {
        x: dropPos.x + Math.cos(angle) * distance,
        y: dropPos.y + Math.sin(angle) * distance,
      };

      this.gameState.resourceDrops.push({
        id: generateId(),
        position: keyPos,
        velocity: createVector(0, 0),
        size: 20,
        rotation: 0,
        resourceType: 'crateKey',
        amount: 1,
        lifetime: 40,
        bobPhase: Math.random() * Math.PI * 2,
      });
    }

    // Drop 3-4 high-tier weapons with multiple perks
    const weaponDropCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < weaponDropCount; i++) {
      const angle = (i / weaponDropCount) * Math.PI * 2 + Math.PI / 4;
      const distance = 100 + Math.random() * 50;
      const weaponPos = {
        x: dropPos.x + Math.cos(angle) * distance,
        y: dropPos.y + Math.sin(angle) * distance,
      };

      // Generate high-tier weapon with 2-4 perks
      const perkCount = 2 + Math.floor(Math.random() * 3);
      const weapon = this.crateSystem.generateWeapon();
      const perks = this.crateSystem.generatePerks(weapon, perkCount);

      // Apply perks to weapon
      perks.forEach(perk => {
        this.weaponUpgradeManager.applyPerkToWeapon(weapon, perk);
      });

      const velocityAngle = angle + (Math.random() - 0.5) * 0.5;
      const velocityMag = 2 + Math.random() * 3;
      this.spawnWeaponDrop(
        weaponPos,
        vectorFromAngle(velocityAngle, velocityMag),
        weapon,
        perks
      );
    }

    this.createParticles(dropPos, 150, '#7c3aed', 2.0);
    this.createParticles(dropPos, 120, '#a78bfa', 1.5);
    this.createParticles(dropPos, 80, '#5b21b6', 1.2);
    this.createParticles(dropPos, 60, '#fbbf24', 1.0);

    this.createDamageNumber(dropPos, 0, '#ffd700', 'VOID SUBDIVIDER DEFEATED!');
  }

  getVoidSubdivider(): VoidSubdivider | null {
    return this.voidSubdivider;
  }

  private cleanupDeadEntities(): void {
    this.gameState.enemies = this.gameState.enemies.filter((enemy) => enemy.health > 0);

    const MAX_ENEMIES = 150;
    if (this.gameState.enemies.length > MAX_ENEMIES) {
      const playerPos = this.gameState.player.position;
      this.gameState.enemies.sort((a, b) => {
        const distA = vectorDistance(a.position, playerPos);
        const distB = vectorDistance(b.position, playerPos);
        return distB - distA;
      });
      this.gameState.enemies = this.gameState.enemies.slice(0, MAX_ENEMIES);
    }

    this.resourceNodes = this.resourceNodes.filter((node) => node.health > 0);
    this.chests = this.chests.filter((chest) => !chest.isOpen);
    this.gameState.chests = this.chests;
  }

  private loadChunksAroundPlayer(): void {
    const newActiveChunks = this.worldGenerator.getActiveChunks(
      this.gameState.player.position.x,
      this.gameState.player.position.y,
      2
    );

    this.worldGenerator.unloadDistantChunks(
      this.gameState.player.position.x,
      this.gameState.player.position.y,
      4
    );

    const existingEnemies = this.gameState.enemies;
    const existingEnemyIds = new Set(existingEnemies.map(e => e.id));
    const existingChestIds = new Set(this.chests.map(c => c.id));

    const chunkEnemyIds = new Set<string>();
    const newEnemies: Enemy[] = [];
    const newChests: Chest[] = [];

    this.resourceNodes = [];
    this.obstacles = [];
    this.portals = [];
    this.extractionPoints = [];
    this.biomeFeatures = [];

    newActiveChunks.forEach(chunk => {
      chunk.enemies.forEach(chunkEnemy => {
        chunkEnemyIds.add(chunkEnemy.id);
        if (!existingEnemyIds.has(chunkEnemy.id)) {
          chunkEnemy.detectionRadius = 150;

          if (chunkEnemy.modifiers && chunkEnemy.modifiers.length > 0) {
            const modifiers = chunkEnemy.modifiers as any[];
            const modifiedEnemy = this.modifierSystem.applyModifiersToEnemy(chunkEnemy, modifiers);
            newEnemies.push(modifiedEnemy);
          } else {
            newEnemies.push(chunkEnemy);
          }
        }
      });
      chunk.chests.forEach(chunkChest => {
        if (!existingChestIds.has(chunkChest.id)) {
          newChests.push(chunkChest);
        }
      });
      this.resourceNodes.push(...chunk.resourceNodes);
      this.obstacles.push(...chunk.obstacles);
      this.portals.push(...chunk.portals);
      this.biomeFeatures.push(...chunk.biomeFeatures);
      if (chunk.extractionPoint) {
        this.extractionPoints.push(chunk.extractionPoint);
      }
    });

    this.chests.push(...newChests);
    this.gameState.chests = this.chests;

    const playerChunkX = Math.floor(this.gameState.player.position.x / CHUNK_SIZE);
    const playerChunkY = Math.floor(this.gameState.player.position.y / CHUNK_SIZE);

    const currentBiome = this.biomeManager.getCurrentBiome();
    this.gameState.enemies = [...existingEnemies, ...newEnemies].filter(enemy => {
      if (chunkEnemyIds.has(enemy.id)) {
        return true;
      }

      const enemyChunkX = Math.floor(enemy.position.x / CHUNK_SIZE);
      const enemyChunkY = Math.floor(enemy.position.y / CHUNK_SIZE);
      const chunkDistance = Math.max(Math.abs(enemyChunkX - playerChunkX), Math.abs(enemyChunkY - playerChunkY));

      if (chunkDistance > 2) {
        return false;
      }

      const distToPlayer = vectorDistance(enemy.position, this.gameState.player.position);
      const screenDistance = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
      if (!enemy.isAggro && distToPlayer > screenDistance * 1.5) {
        return false;
      }

      return true;
    }).map(enemy => this.biomeManager.modifyEnemyForBiome(enemy, currentBiome));
  }

  private updateInteractables(dt: number): void {
    const player = this.gameState.player;

    this.resourceNodes.forEach(node => {
      node.bobPhase += dt * 2;
      const distance = vectorDistance(player.position, node.position);
      if (distance < node.size * 2 && this.keys.has('f')) {
        player.resources[node.resourceType] += Math.floor(node.value);
        this.createParticles(node.position, 20, node.color, 0.6);
        node.health = 0;
      }
    });

    this.chests.forEach(chest => {
      if (chest.isOpen) return;

      chest.rotation += dt * 0.5;

      const distance = vectorDistance(player.position, chest.position);

      if (chest.type === 'timed' && chest.radius) {
        if (distance < chest.radius) {
          chest.timer = Math.min((chest.timer || 0) + dt, chest.maxTime || 5);
          if (chest.timer >= (chest.maxTime || 5)) {
            chest.isOpen = true;
            this.spawnLoot(chest);
          }
        } else {
          chest.timer = Math.max(0, (chest.timer || 0) - dt * 2);
        }
      } else if (chest.type === 'locked') {
        if (distance < chest.size * 2 && this.keys.has('f')) {
          if (player.resources.crateKey > 0) {
            player.resources.crateKey -= 1;
            chest.isOpen = true;
            this.spawnLoot(chest);
          }
        }
      } else if (chest.type === 'regular') {
        if (distance < chest.size * 2 && this.keys.has('f')) {
          chest.isOpen = true;
          this.spawnLoot(chest);
        }
      }
    });
  }

  private spawnResourceDrop(position: Vector2, resourceType: string, amount: number): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 2;
    const velocity = createVector(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 2
    );

    this.gameState.resourceDrops.push({
      id: generateId(),
      position: createVector(position.x, position.y),
      velocity,
      size: 20,
      rotation: 0,
      resourceType,
      amount,
      lifetime: 30,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  private spawnLoot(chest: Chest): void {
    this.createParticles(chest.position, 40, '#ffd700', 0.8);
    const lootRoll = Math.random();

    const keyDropChance = Math.random();
    if (keyDropChance < 0.15) {
      this.spawnResourceDrop(chest.position, 'crateKey', 1);
    }

    if (chest.type === 'timed') {
      if (lootRoll < 0.65) {
        const crate = this.crateSystem.generateWeaponCrate();
        this.spawnWeaponDrop(chest.position, crate.weapon, crate.perks);
      } else if (lootRoll < 0.85) {
        this.spawnCurrency(chest.position, randomRange(100, 250));
      } else {
        this.spawnResourceDrop(chest.position, 'coreDust', Math.floor(randomRange(5, 15)));
        this.spawnResourceDrop(chest.position, 'alloyFragments', Math.floor(randomRange(5, 15)));
        this.spawnResourceDrop(chest.position, 'energy', Math.floor(randomRange(5, 15)));
      }
    } else if (chest.type === 'locked') {
      if (lootRoll < 0.75) {
        const crate = this.crateSystem.generateWeaponCrate();
        this.spawnWeaponDrop(chest.position, crate.weapon, crate.perks);
      } else if (lootRoll < 0.9) {
        this.spawnCurrency(chest.position, randomRange(150, 350));
      } else {
        this.spawnResourceDrop(chest.position, 'coreDust', Math.floor(randomRange(15, 30)));
        this.spawnResourceDrop(chest.position, 'alloyFragments', Math.floor(randomRange(15, 30)));
        this.spawnResourceDrop(chest.position, 'energy', Math.floor(randomRange(15, 30)));
      }
    } else {
      if (lootRoll < 0.7) {
        this.spawnCurrency(chest.position, randomRange(25, 75));
      } else {
        const resourceType = ['geoShards', 'coreDust', 'energy'][Math.floor(Math.random() * 3)] as 'geoShards' | 'coreDust' | 'energy';
        this.spawnResourceDrop(chest.position, resourceType, Math.floor(randomRange(10, 20)));
      }
    }
  }

  private handlePortals(): void {
    const player = this.gameState.player;
    if ((player.portalCooldown || 0) > 0) return;

    const allPortals = this.worldGenerator.getAllPortals();
    for (const portal of allPortals) {
      const distance = vectorDistance(player.position, portal.position);
      if (distance < portal.size + player.size && this.keys.has('e')) {
        const linkedPortal = allPortals.find(p => p.id === portal.linkedPortalId);
        if (linkedPortal) {
          player.position = { ...linkedPortal.position };
          player.portalCooldown = 3; // 3 second cooldown
          this.createParticles(portal.position, 30, portal.color, 0.8);
          this.createParticles(linkedPortal.position, 30, linkedPortal.color, 0.8);
          break; // Exit loop after teleporting
        }
      }
    }
  }

  private handleExtractionPoints(): void {
    const player = this.gameState.player;

    this.extractionPoints.forEach(point => {
      const distance = vectorDistance(player.position, point.position);
      if (distance < point.size + player.size && this.keys.has('e')) {
        this.gameState.gameOver = true;
        this.gameState.victory = true;
        this.createParticles(point.position, 50, '#00ff00', 1.0);
      }
    });
  }

  private spawnWeaponDrop(
    position: { x: number; y: number },
    weapon: Weapon,
    perks: any[]
  ): void {
    const MAX_WEAPON_DROPS = 50;
    if (this.gameState.weaponDrops.length >= MAX_WEAPON_DROPS) {
      this.gameState.weaponDrops.shift();
    }

    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(3, 5);
    const velocity = vectorFromAngle(angle, speed);

    this.gameState.weaponDrops.push({
      id: generateId(),
      position: { ...position },
      velocity,
      size: 25,
      rotation: 0,
      weapon,
      weaponPerks: perks,
      lifetime: 30,
      bobPhase: randomRange(0, Math.PI * 2),
    });
  }

  private spawnCurrency(
    position: { x: number; y: number },
    value: number
  ): void {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(2, 4);
    const velocity = vectorFromAngle(angle, speed);

    this.gameState.currencyDrops.push({
      id: generateId(),
      position: { ...position },
      velocity,
      value: Math.floor(value),
      lifetime: 10,
      size: 10,
      rotation: 0,
    });
  }

  private createDamageNumber(position: { x: number; y: number }, damage: number, color: string): void {
    const MAX_DAMAGE_NUMBERS = 100;
    if (this.gameState.damageNumbers.length >= MAX_DAMAGE_NUMBERS) {
      return;
    }

    const dmg = Math.floor(damage);
    this.gameState.damageNumbers.push({
      id: generateId(),
      position: { x: position.x + randomRange(-10, 10), y: position.y - 20 },
      damage: dmg,
      lifetime: 1.2,
      maxLifetime: 1.2,
      velocity: createVector(randomRange(-0.5, 0.5), -1.5),
      color,
      text: dmg.toString(),
    });
  }

  private updateDamageNumbers(dt: number): void {
    this.gameState.damageNumbers = this.gameState.damageNumbers.filter((dmgNum) => {
      dmgNum.position = vectorAdd(dmgNum.position, vectorScale(dmgNum.velocity, dt * 60));
      dmgNum.velocity.y += dt * 3;
      dmgNum.lifetime -= dt;
      return dmgNum.lifetime > 0;
    });
  }

  private createParticles(
    position: { x: number; y: number },
    count: number,
    color: string,
    maxLifetime: number
  ): void {
    const MAX_PARTICLES = 500;
    if (this.gameState.particles.length >= MAX_PARTICLES) {
      return;
    }

    const particlesToCreate = Math.min(count, MAX_PARTICLES - this.gameState.particles.length);

    for (let i = 0; i < particlesToCreate; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(1, 4);
      const velocity = vectorFromAngle(angle, speed);

      this.gameState.particles.push({
        id: generateId(),
        position: { ...position },
        velocity,
        size: randomRange(2, 5),
        color,
        lifetime: maxLifetime,
        maxLifetime,
        rotation: 0,
      });
    }
  }

  private fireGrapplingHook(): void {
    const player = this.gameState.player;

    // Allow detaching from grapple by clicking again
    if (player.isGrappling) {
      player.isGrappling = false;
      player.isGliding = true;
      // Preserve current momentum when detaching
      player.glideVelocity = vectorScale(player.velocity, 1.0);
      return;
    }

    const angle = player.rotation;
    const activeWeapon = player.equippedWeapons[player.activeWeaponIndex];
    const maxRange = activeWeapon?.grapplingStats?.maxRange || 400;
    const attachBonus = activeWeapon?.grapplingStats?.attachBonus || 0;
    const endX = player.position.x + Math.cos(angle) * maxRange;
    const endY = player.position.y + Math.sin(angle) * maxRange;

    let nearestTarget: { x: number; y: number } | null = null;
    let nearestDist = maxRange;
    const attachAngle = 0.3 + (attachBonus / 1000);

    for (const enemy of this.gameState.enemies) {
      if (enemy.health <= 0) continue;
      const toEnemy = vectorSubtract(enemy.position, player.position);
      const angleToEnemy = Math.atan2(toEnemy.y, toEnemy.x);
      const angleDiff = Math.abs(angleToEnemy - angle);

      if (angleDiff < attachAngle) {
        const dist = vectorDistance(player.position, enemy.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestTarget = enemy.position;
        }
      }
    }

    for (const obstacle of this.obstacles) {
      const toObstacle = vectorSubtract(obstacle.position, player.position);
      const angleToObstacle = Math.atan2(toObstacle.y, toObstacle.x);
      const angleDiff = Math.abs(angleToObstacle - angle);

      if (angleDiff < attachAngle) {
        const dist = vectorDistance(player.position, obstacle.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          // Calculate intersection point on obstacle edge instead of center
          const rayDir = vectorFromAngle(angle);
          const intersectionPoint = this.calculateObstacleIntersection(player.position, rayDir, obstacle);
          nearestTarget = intersectionPoint;
        }
      }
    }

    if (nearestTarget) {
      player.isGrappling = true;
      player.grappleTarget = { ...nearestTarget };
      player.grappleProgress = 0;
      player.isGliding = false;
      this.createParticles(player.position, 15, '#888888', 0.3);
    }
  }

  private calculateObstacleIntersection(start: Vector2, direction: Vector2, obstacle: Obstacle): Vector2 {
    const dx = obstacle.position.x - start.x;
    const dy = obstacle.position.y - start.y;

    const t = (dx * direction.x + dy * direction.y);
    const closestX = start.x + direction.x * t;
    const closestY = start.y + direction.y * t;

    const toClosest = vectorSubtract({ x: closestX, y: closestY }, obstacle.position);
    const distToCenter = Math.sqrt(toClosest.x * toClosest.x + toClosest.y * toClosest.y);

    if (distToCenter > obstacle.size / 2) {
      const scale = (obstacle.size / 2) / distToCenter;
      return {
        x: obstacle.position.x + toClosest.x * scale,
        y: obstacle.position.y + toClosest.y * scale
      };
    }

    return { x: closestX, y: closestY };
  }

  private createGrappleSlamExplosion(position: { x: number; y: number }, damage: number, radius: number): void {
    // Create dramatic explosion particles
    this.createParticles(position, 40, '#ffaa00', 0.6);
    this.createParticles(position, 30, '#ff6600', 0.5);
    this.createParticles(position, 20, '#ffdd00', 0.4);
    this.createParticles(position, 15, '#ff3300', 0.7);

    // Create expanding shockwave particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const velocity = vectorScale(vectorFromAngle(angle), 8);
      this.gameState.particles.push({
        position: { ...position },
        velocity,
        size: 6,
        color: '#ff8800',
        lifetime: 0.4,
        maxLifetime: 0.4,
        rotation: 0,
      });
    }

    for (const enemy of this.gameState.enemies) {
      if (enemy.health <= 0) continue;
      const dist = vectorDistance(position, enemy.position);
      if (dist < radius) {
        const falloff = 1 - (dist / radius);
        const finalDamage = damage * falloff;
        enemy.health -= finalDamage;
        this.createDamageNumber(enemy.position, finalDamage, '#ffaa00');

        const knockbackStrength = 12 * falloff;
        const knockback = vectorScale(vectorNormalize(vectorSubtract(enemy.position, position)), knockbackStrength);
        enemy.velocity = vectorAdd(enemy.velocity, knockback);
      }
    }
  }

  dash(): void {
    const player = this.gameState.player;
    if (player.dashCooldown <= 0 && !player.isDashing) {
      // If grappling, detach and enter glide mode with full momentum
      if (player.isGrappling) {
        player.isGrappling = false;
        player.isGliding = true;

        // Calculate dash direction
        const dashDir = vectorFromAngle(player.rotation);

        // Preserve grappling momentum and add dash boost
        const currentSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
        const dashBoost = vectorScale(dashDir, PLAYER_DASH_SPEED * 0.7);

        // Keep all current momentum and add dash boost
        player.glideVelocity = vectorAdd(player.velocity, dashBoost);

        // Don't set isDashing to true when detaching from grapple
        // This allows continuous gliding instead of brief dash
        player.dashCooldown = PLAYER_DASH_COOLDOWN;
        this.createParticles(player.position, 20, '#00ffff', 0.5);
        return;
      }

      player.isDashing = true;
      player.dashCooldown = PLAYER_DASH_COOLDOWN;
      this.createParticles(player.position, 15, '#00ffff', 0.4);
    }
  }

  switchWeapon(index: number): void {
    if (index >= 0 && index < this.gameState.player.equippedWeapons.length) {
      this.gameState.player.activeWeaponIndex = index;
    }
  }

  getWeaponUpgradeManager(): WeaponUpgradeManager {
    return this.weaponUpgradeManager;
  }

  getInventory(): PlayerInventory {
    return this.inventory;
  }

  purchaseWeaponCrate(): boolean {
    const cost = this.crateSystem.getCrateCost();
    if (this.gameState.player.currency < cost) return false;

    this.gameState.player.currency -= cost;
    const crate = this.crateSystem.generateWeaponCrate();
    this.inventory.addWeapon(crate.weapon);

    return true;
  }

  equipWeapon(weaponId: string): boolean {
    const success = this.inventory.equipWeapon(weaponId);
    if (success) {
      this.syncEquippedWeapons();
    }
    return success;
  }

  unequipWeapon(weaponId: string): void {
    this.inventory.unequipWeapon(weaponId);
    this.syncEquippedWeapons();
  }

  deleteWeapon(weaponId: string): void {
    this.inventory.removeWeapon(weaponId);
    this.syncEquippedWeapons();
  }

  private syncEquippedWeapons(): void {
    this.gameState.player.equippedWeapons = this.inventory.getEquippedWeapons().map(weapon => {
      if (weapon.type === 'grappling_hook' && weapon.grapplingStats) {
        return {
          ...weapon,
          fireRate: weapon.grapplingStats.cooldown,
          maxRange: weapon.grapplingStats.maxRange,
        };
      }
      return weapon;
    });

    if (this.gameState.player.activeWeaponIndex >= this.gameState.player.equippedWeapons.length) {
      this.gameState.player.activeWeaponIndex = Math.max(0, this.gameState.player.equippedWeapons.length - 1);
    }
  }

  togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
  }

  togglePvP(): void {
    this.gameState.pvpEnabled = !this.gameState.pvpEnabled;
  }

  setPvP(enabled: boolean): void {
    this.gameState.pvpEnabled = enabled;
  }

  isPvPEnabled(): boolean {
    return this.gameState.pvpEnabled;
  }



  reset(): void {
    this.worldGenerator.reset();
    this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT, 0.1);
    this.inventory = new PlayerInventory();
    this.biomeManager = new BiomeManager();
    this.featureInteraction = new BiomeFeatureInteraction();
    this.tradingPostSystem.reset();
    this.modifierSystem.reset();
    this.gameState = this.createInitialState();
    this.biomeManager.setWorldGenerator(this.worldGenerator);

    INITIAL_WEAPONS.forEach(weapon => {
      const weaponWithPerks = { ...weapon, perks: [] };
      this.inventory.addWeapon(weaponWithPerks);
      this.inventory.equipWeapon(weaponWithPerks.id);
    });

    this.syncEquippedWeapons();
    this.loadChunksAroundPlayer();
  }

  respawnPlayer(spawnPosition?: { x: number; y: number }): void {
    this.gameState.player.health = this.gameState.player.maxHealth;
    this.gameState.player.isDashing = false;
    this.gameState.player.velocity = createVector();
    this.gameState.isGameOver = false;
    
    if (spawnPosition) {
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;
      this.gameState.player.position = {
        x: spawnPosition.x + offsetX,
        y: spawnPosition.y + offsetY,
      };
    } else {
      this.gameState.player.position = createVector(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }

  private checkPlayerDeath(): void {
    if (this.gameState.player.health <= 0 && !this.gameState.isGameOver) {
      this.gameState.isGameOver = true;
      this.createParticles(this.gameState.player.position, 20, '#ff0000', 1.0);
    }
  }

  spawnAdminEnemy(type: 'grunt' | 'tank' | 'speedy'): void {
    const player = this.gameState.player;
    const spawnDistance = 200;
    const angle = Math.random() * Math.PI * 2;
    const spawnPos = {
      x: player.position.x + Math.cos(angle) * spawnDistance,
      y: player.position.y + Math.sin(angle) * spawnDistance,
    };

    {
      const configs = {
        grunt: { health: 50, damage: 10, speed: 1.5, size: 20, color: '#ff4444' },
        tank: { health: 150, damage: 20, speed: 1.0, size: 30, color: '#4444ff' },
        speedy: { health: 30, damage: 8, speed: 3.0, size: 16, color: '#44ff44' },
      };
      const config = configs[type];

      const enemy: Enemy = {
        id: generateId(),
        position: spawnPos,
        velocity: createVector(),
        rotation: 0,
        health: config.health,
        maxHealth: config.health,
        damage: config.damage,
        size: config.size,
        speed: config.speed,
        color: config.color,
        type,
        attackCooldown: 0,
        currencyDrop: 10,
      };

      this.gameState.enemies.push(enemy);
      this.createParticles(spawnPos, 20, config.color, 0.5);
    }
  }

  spawnAdminWeapon(): void {
    const player = this.gameState.player;
    const spawnDistance = 150;
    const angle = Math.random() * Math.PI * 2;
    const spawnPos = {
      x: player.position.x + Math.cos(angle) * spawnDistance,
      y: player.position.y + Math.sin(angle) * spawnDistance,
    };

    const weaponCrate = this.crateSystem.generateWeaponCrate();
    this.spawnWeaponDrop(spawnPos, weaponCrate.weapon, weaponCrate.perks);
    this.createParticles(spawnPos, 40, '#fbbf24', 0.8);
  }

  getMultiplayerState(hostPeerId: string): Partial<GameState> {
    const allPlayers: import('../types/game').RemotePlayer[] = [
      {
        id: 'host',
        peerId: hostPeerId,
        player: this.gameState.player,
        lastUpdate: Date.now(),
      },
      ...this.gameState.remotePlayers,
    ];

    return {
      remotePlayers: allPlayers,
      enemies: this.gameState.enemies,
      projectiles: this.gameState.projectiles,
      particles: this.gameState.particles,
      currencyDrops: this.gameState.currencyDrops,
      resourceDrops: this.gameState.resourceDrops,
      chests: this.chests,
      weaponDrops: this.gameState.weaponDrops,
      score: this.gameState.score,
      // Do NOT sync isPaused - each client manages their own pause state
      isGameOver: this.gameState.isGameOver,
      resourcesCollected: this.gameState.resourcesCollected,
      damageNumbers: this.gameState.damageNumbers,
      currentBiomeName: this.gameState.currentBiomeName,
    };
  }

  applyMultiplayerState(state: Partial<GameState>, localPeerId: string): void {
    if (state.remotePlayers) {
      const newPlayers = state.remotePlayers.filter(rp => rp.peerId !== localPeerId);
      
      newPlayers.forEach(newPlayer => {
        const existing = this.gameState.remotePlayers.find(rp => rp.peerId === newPlayer.peerId);
        if (existing) {
          existing.serverPosition = { ...newPlayer.player.position };
          existing.serverVelocity = { ...newPlayer.player.velocity };
          existing.interpolationAlpha = 0;
          existing.player.rotation = newPlayer.player.rotation;
          existing.player.health = newPlayer.player.health;
          existing.player.maxHealth = newPlayer.player.maxHealth;
          existing.player.equippedWeapons = newPlayer.player.equippedWeapons;
          existing.player.activeWeaponIndex = newPlayer.player.activeWeaponIndex;
          existing.player.isDashing = newPlayer.player.isDashing;
          existing.player.isGrappling = newPlayer.player.isGrappling;
          existing.player.isGliding = newPlayer.player.isGliding;
          existing.lastUpdate = Date.now();
          if (newPlayer.username) existing.username = newPlayer.username;
        } else {
          const newRemote = { 
            ...newPlayer, 
            serverPosition: { ...newPlayer.player.position },
            serverVelocity: { ...newPlayer.player.velocity },
            interpolationAlpha: 1,
            lastUpdate: Date.now()
          };
          this.gameState.remotePlayers.push(newRemote);
        }
      });
      
      this.gameState.remotePlayers = this.gameState.remotePlayers.filter(
        rp => newPlayers.some(np => np.peerId === rp.peerId)
      );
    }
    
    if (state.enemies) this.gameState.enemies = state.enemies;
    if (state.projectiles) this.gameState.projectiles = state.projectiles;
    if (state.particles) this.gameState.particles = state.particles;
    if (state.currencyDrops) this.gameState.currencyDrops = state.currencyDrops;
    if (state.resourceDrops) this.gameState.resourceDrops = state.resourceDrops;
    if (state.chests) this.chests = state.chests;
    if (state.weaponDrops) this.gameState.weaponDrops = state.weaponDrops;
    if (state.damageNumbers) this.gameState.damageNumbers = state.damageNumbers;
    
    if (state.score !== undefined) this.gameState.score = state.score;
    if (state.isPaused !== undefined) this.gameState.isPaused = state.isPaused;
    if (state.resourcesCollected !== undefined) this.gameState.resourcesCollected = state.resourcesCollected;
  }

  updateRemotePlayers(remotePlayers: import('../types/game').RemotePlayer[]): void {
    this.gameState.remotePlayers = remotePlayers;
  }

  updateRemotePlayerFromInput(playerId: string, input: import('./MultiplayerManager').PlayerInput): void {
    let remotePlayer = this.gameState.remotePlayers.find(rp => rp.peerId === playerId);

    if (!remotePlayer) {
      remotePlayer = {
        id: `remote_${playerId}`,
        peerId: playerId,
        player: this.createRemotePlayer(playerId),
        lastUpdate: Date.now(),
        username: input.username || 'Player',
      };
      this.gameState.remotePlayers.push(remotePlayer);
    }

    if (input.username && remotePlayer.username !== input.username) {
      remotePlayer.username = input.username;
    }

    const player = remotePlayer.player;

    if (input.activeWeaponIndex !== undefined && input.activeWeaponIndex !== player.activeWeaponIndex) {
      player.activeWeaponIndex = Math.min(input.activeWeaponIndex, player.equippedWeapons.length - 1);
    }

    if (input.mousePos) {
      const dx = input.mousePos.x - player.position.x;
      const dy = input.mousePos.y - player.position.y;
      player.rotation = Math.atan2(dy, dx);
    }

    if (input.mouseDown && player.equippedWeapons.length > 0) {
      const weapon = player.equippedWeapons[player.activeWeaponIndex];
      if (weapon && weapon.cooldown <= 0) {
        this.fireWeaponForRemotePlayer(player, weapon);
      }
    }

    remotePlayer.lastUpdate = Date.now();
  }

  private createRemotePlayer(playerId: string): import('../types/game').Player {
    const equippedWeapons = INITIAL_WEAPONS.map(weapon => ({ ...weapon, perks: [] }));
    
    return {
      id: `remote_${playerId}`,
      position: createVector(CANVAS_WIDTH / 2 + Math.random() * 200 - 100, CANVAS_HEIGHT / 2 + Math.random() * 200 - 100),
      velocity: createVector(),
      size: PLAYER_SIZE,
      health: PLAYER_MAX_HEALTH,
      maxHealth: PLAYER_MAX_HEALTH,
      rotation: 0,
      speed: PLAYER_BASE_SPEED,
      dashCooldown: PLAYER_DASH_COOLDOWN,
      dashDuration: PLAYER_DASH_DURATION,
      isDashing: false,
      currency: 0,
      equippedWeapons,
      activeWeaponIndex: 0,
      portalCooldown: 0,
      isGrappling: false,
      grappleProgress: 0,
      isGliding: false,
      resources: {
        energy: 0,
        coreDust: 0,
        flux: 0,
        geoShards: 0,
        alloyFragments: 0,
        singularityCore: 0,
        cryoKelp: 0,
        obsidianHeart: 0,
        gloomRoot: 0,
        resonantCrystal: 0,
        voidEssence: 0,
        bioluminescentPearl: 0,
        sunpetalBloom: 0,
        aetheriumShard: 0,
        gravitonEssence: 0,
        voidCore: 0,
        crateKey: 0,
      },
      consumables: [],
    };
  }

  private fireWeaponForRemotePlayer(player: Player, weapon: Weapon): void {
    const angle = player.rotation;

    const MAX_PROJECTILES = 300;
    if (this.gameState.projectiles.length >= MAX_PROJECTILES) {
      return;
    }

    for (let i = 0; i < weapon.projectileCount; i++) {
      const spreadOffset =
        (i - (weapon.projectileCount - 1) / 2) * weapon.spread;
      const projectileAngle = angle + spreadOffset;

      const velocity = vectorFromAngle(projectileAngle, weapon.projectileSpeed);

      const projectile: Projectile = {
        id: generateId(),
        position: { ...player.position },
        velocity,
        damage: weapon.damage,
        size: weapon.projectileSize,
        color: weapon.color,
        owner: 'player',
        playerId: player.id,
        piercing: weapon.piercing || false,
        piercingCount: weapon.piercing ? 3 : 0,
        lifetime: 3,
        homing: weapon.homing,
        homingStrength: weapon.homingStrength,
        explosive: weapon.explosive,
        explosionRadius: weapon.explosionRadius,
        ricochet: weapon.ricochet,
        ricochetCount: weapon.ricochet ? 2 : 0,
        maxRange: weapon.maxRange || MAX_VISIBLE_RANGE,
        travelDistance: 0,
        weaponType: weapon.type,
        rotation: 0,
        wallPierce: weapon.wallPierce || false,
      };

      this.gameState.projectiles.push(projectile);
    }

    weapon.cooldown = weapon.fireRate;
  }

  updateRemotePlayerPositions(deltaTime: number): void {
    this.gameState.remotePlayers.forEach(remotePlayer => {
      const player = remotePlayer.player;
      
      if (remotePlayer.serverPosition && remotePlayer.interpolationAlpha !== undefined) {
        const INTERPOLATION_SPEED = 8;
        remotePlayer.interpolationAlpha = Math.min(1, remotePlayer.interpolationAlpha + deltaTime * INTERPOLATION_SPEED);
        
        const startPos = player.position;
        const targetPos = remotePlayer.serverPosition;
        const alpha = this.smoothStep(remotePlayer.interpolationAlpha);
        
        player.position = {
          x: startPos.x + (targetPos.x - startPos.x) * alpha,
          y: startPos.y + (targetPos.y - startPos.y) * alpha
        };
        
        if (remotePlayer.serverVelocity) {
          player.velocity = remotePlayer.serverVelocity;
        }
        
        if (remotePlayer.interpolationAlpha >= 1 && remotePlayer.serverVelocity) {
          const extrapolation = vectorScale(remotePlayer.serverVelocity, deltaTime * 60);
          player.position = vectorAdd(player.position, extrapolation);
          remotePlayer.serverPosition = player.position;
        }
      } else {
        player.position = vectorAdd(player.position, vectorScale(player.velocity, deltaTime * 60));
      }
      
      const obstacles = this.getObstacles();
      obstacles.forEach(obstacle => {
        if (checkEntityObstacleCollision(player, obstacle)) {
          resolveEntityObstacleCollision(player, obstacle);
        }
      });

      player.equippedWeapons.forEach(weapon => {
        if (weapon.cooldown > 0) {
          weapon.cooldown -= deltaTime;
        }
      });
    });
  }

  private smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  removeRemotePlayer(playerId: string): void {
    this.gameState.remotePlayers = this.gameState.remotePlayers.filter(rp => rp.peerId !== playerId);
  }

  teleportToPlayer(targetPeerId: string): void {
    const targetPlayer = this.gameState.remotePlayers.find(rp => rp.peerId === targetPeerId);
    if (targetPlayer) {
      this.gameState.player.position = { ...targetPlayer.player.position };
      this.loadChunksAroundPlayer();
    }
  }

  teleportRemotePlayerToMe(remotePeerId: string): void {
    const remotePlayer = this.gameState.remotePlayers.find(rp => rp.peerId === remotePeerId);
    if (remotePlayer) {
      remotePlayer.player.position = { ...this.gameState.player.position };
    }
  }

  getKeys(): Set<string> {
    return this.keys;
  }

  getMousePos(): import('../types/game').Vector2 {
    return this.mousePos;
  }

  getMouseDown(): boolean {
    return this.mouseDown;
  }

  getWorldState(): any {
    const worldGeneratorData = this.worldGenerator.serializeWorldData();
    
    return {
      worldGenerator: worldGeneratorData,
      chests: this.chests,
    };
  }

  applyWorldState(worldState: any): void {
    if (worldState.worldGenerator) {
      this.worldGenerator.hydrateWorldData(worldState.worldGenerator);
      this.biomeManager.setWorldGenerator(this.worldGenerator);
      this.featureInteraction = new BiomeFeatureInteraction();
    }

    if (worldState.chests) {
      this.chests = worldState.chests;
    }

    this.loadChunksAroundPlayer();
  }

  syncRemotePlayerPosition(playerId: string, position: Vector2, velocity: Vector2): void {
    const remotePlayer = this.gameState.remotePlayers.find(rp => rp.peerId === playerId);
    if (remotePlayer) {
      remotePlayer.player.position = { ...position };
      remotePlayer.player.velocity = { ...velocity };
      remotePlayer.serverPosition = { ...position };
      remotePlayer.serverVelocity = { ...velocity };
      remotePlayer.interpolationAlpha = 1;
      console.log('Synced remote player position:', playerId, position);
    }
  }
}
