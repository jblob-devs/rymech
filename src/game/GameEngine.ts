import {
  GameState,
  Player,
  Enemy,
  Projectile,
  Weapon,
  Chest,
  WeaponDrop,
  Drone,
} from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  PLAYER_COLLISION_RADIUS,
  ENEMY_MELEE_STOP_DISTANCE,
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
import { findPathAroundObstacles, findBlockingObstacle } from './Pathfinding';
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
import { MinibossSystem } from './MinibossSystem';
import { MinibossSpawnManager } from './MinibossSpawnManager';
import { MinibossUpdateSystem } from './MinibossUpdateSystem';
import { MinibossLootSystem } from './MinibossLootSystem';
import type { MinibossSubtype } from '../types/game';
import { DroneSystem } from './DroneSystem';
import { WorldEventSystem } from './WorldEventSystem';
import { WorldEventRenderer } from './WorldEventRenderer';

export class GameEngine {
  private gameState: GameState;
  private keys: Set<string> = new Set();
  private mousePos = createVector();
  private lastMousePos = createVector();
  private mouseDown = false;
  private lastMouseDown = false;
  private usingArrowKeyAiming = false;
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
  private minibossSystem: MinibossSystem;
  private minibossSpawnManager: MinibossSpawnManager;
  private minibossUpdateSystem: MinibossUpdateSystem;
  private minibossLootSystem: MinibossLootSystem;
  private minibossSpawnCheckTimer: number = 0;
  private droneSystem: DroneSystem;
  private recentEnemyDeaths: Array<{ x: number; y: number; timestamp: number }> = [];
  private worldEventSystem: WorldEventSystem;
  private worldEventRenderer: WorldEventRenderer;

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
    this.minibossSystem = new MinibossSystem();
    this.minibossSpawnManager = new MinibossSpawnManager(this.minibossSystem);
    this.minibossUpdateSystem = new MinibossUpdateSystem();
    this.minibossLootSystem = new MinibossLootSystem();
    this.droneSystem = new DroneSystem();
    this.worldEventSystem = new WorldEventSystem();
    this.worldEventRenderer = new WorldEventRenderer();
    this.gameState = this.createInitialState();
    this.biomeManager.setWorldGenerator(this.worldGenerator);

    INITIAL_WEAPONS.forEach(weapon => {
      const weaponWithPerks = { ...weapon, perks: [] };
      this.inventory.addWeapon(weaponWithPerks);
      this.inventory.equipWeapon(weaponWithPerks.id);
    });
    this.syncEquippedWeapons();
    
    this.inventory.addDrone('assault_drone');
    this.inventory.addDrone('shield_drone');
    this.inventory.addDrone('repair_drone');
    this.inventory.equipDrone('assault_drone');
    this.inventory.equipDrone('shield_drone');
    this.syncDrones();

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
      hasBlinkEquipped: false,
      blinkCharges: 3,
      blinkCooldowns: [0, 0, 0],
      blinkMaxCharges: 3,
      currency: 0,
      equippedWeapons: [],
      equippedDrones: [],
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
      drones: [],
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
    return {
      ...this.gameState,
      worldEvents: this.worldEventSystem.getActiveEvents(),
      recentEventSpawns: this.worldEventSystem.getRecentlySpawnedEvents(),
    };
  }
  
  clearRecentEventSpawns(): void {
    this.worldEventSystem.clearRecentlySpawnedEvents();
  }
  
  getEventDisplayName(type: string): string {
    return this.worldEventSystem.getEventDisplayName(type as any);
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

  getWorldEvents() {
    return this.worldEventSystem.getActiveEvents();
  }

  getWorldEventRenderer() {
    return this.worldEventRenderer;
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
    let finalSpeedMult = speedMultiplier;
    const player = this.gameState.player;
    
    if ((player as any).scoutDroneSpeedBoost) {
      finalSpeedMult *= (1 + (player as any).scoutDroneSpeedBoost);
    }
    
    if ((player as any).sniperTacticalMode && Date.now() < ((player as any).sniperModeEndTime || 0)) {
      finalSpeedMult *= ((player as any).sniperSpeedMult || 1.0);
    } else if ((player as any).sniperTacticalMode) {
      (player as any).sniperTacticalMode = false;
    }
    
    this.gameState.player.speed = PLAYER_BASE_SPEED * finalSpeedMult;
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
    this.updateMinibosses(dt);
    this.checkMinibossSpawns(dt);
    this.updateDrones(dt);
    this.updateSlowingAreas(dt);
    this.updateExplosiveProjectiles(dt);
    this.updateRepairDroneHealing(dt);
    this.updateEmpWaves(dt);
    this.updateHealingPools(dt);
    this.updateScoutDroneStealth();
    this.updateShieldDroneActiveEffect();
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
    this.worldEventSystem.update(dt, this.gameState.player.position);
    this.applyWorldEventEffects(dt);
  }
  
  private applyWorldEventEffects(dt: number): void {
    const player = this.gameState.player;
    const events = this.worldEventSystem.getActiveEvents();
    
    for (const event of events) {
      const distance = Math.sqrt(
        Math.pow(player.position.x - event.position.x, 2) +
        Math.pow(player.position.y - event.position.y, 2)
      );
      
      // Apply effects based on event type
      if (distance < event.radius) {
        switch (event.type) {
          case 'warp_storm': {
            const data = event.data as any;
            player.health -= (data.damagePerSecond || 15) * dt;
            if (Math.random() < 0.1) {
              this.createParticles(player.position, 2, '#8b5cf6', 0.3);
            }
            break;
          }
          
          case 'temporal_rift': {
            // Slow down player in temporal rift
            if (player.velocity) {
              player.velocity.x *= 0.95;
              player.velocity.y *= 0.95;
            }
            break;
          }
          
          case 'gravitational_anomaly': {
            const data = event.data as any;
            const toCenter = {
              x: event.position.x - player.position.x,
              y: event.position.y - player.position.y
            };
            const dist = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
            if (dist > 0) {
              const strength = data.mode === 'pull' ? data.pullStrength : -data.pushStrength;
              const force = (strength || 200) / (dist + 1);
              player.velocity.x += (toCenter.x / dist) * force * dt;
              player.velocity.y += (toCenter.y / dist) * force * dt;
            }
            break;
          }
          
          case 'crystal_bloom': {
            const data = event.data as any;
            if (data.healAmount && Math.random() < 0.05) {
              player.health = Math.min(player.health + (data.healAmount || 5) * dt, player.maxHealth);
              this.createParticles(player.position, 1, '#a7f3d0', 0.3);
            }
            break;
          }
          
          case 'void_tear': {
            const data = event.data as any;
            const toCenter = {
              x: event.position.x - player.position.x,
              y: event.position.y - player.position.y
            };
            const dist = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
            if (dist > 0 && dist < (data.size || event.radius)) {
              const pullStrength = 300;
              const force = pullStrength / (dist + 1);
              player.velocity.x += (toCenter.x / dist) * force * dt;
              player.velocity.y += (toCenter.y / dist) * force * dt;
            }
            break;
          }
        }
      }
    }
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
    
    // Check if void drone is equipped to enable blink
    player.hasBlinkEquipped = player.equippedDrones.includes('void_drone');

    if (player.isGrappling) {
      // Resolve the grapple target position based on target type
      let currentTargetPosition: { x: number; y: number } | null = null;

      if (player.grappleTargetType === 'enemy' && player.grappleTargetId) {
        // Find the enemy by ID
        const targetEnemy = this.gameState.enemies.find(e => e.id === player.grappleTargetId);
        if (targetEnemy && targetEnemy.health > 0) {
          currentTargetPosition = targetEnemy.position;
        }
      } else if (player.grappleTargetType === 'player' && player.grappleTargetId) {
        // Find the remote player by ID
        const targetPlayer = this.gameState.remotePlayers.find(rp => rp.id === player.grappleTargetId);
        if (targetPlayer) {
          currentTargetPosition = targetPlayer.player.position;
        }
      } else if (player.grappleTargetType === 'obstacle') {
        // Use the static grapple target position for obstacles
        currentTargetPosition = player.grappleTarget || null;
      }

      // If target not found (died/removed), cancel the grapple
      if (!currentTargetPosition) {
        player.isGrappling = false;
        player.isGliding = true;
        // Preserve momentum when target is lost
        player.glideVelocity = player.velocity ? vectorScale(player.velocity, 1.0) : createVector(0, 0);
        player.grappleTarget = undefined;
        player.grappleTargetId = undefined;
        player.grappleTargetType = undefined;
      } else {
        // Update grapple target to current position (for moving targets)
        player.grappleTarget = currentTargetPosition;

        const toTarget = vectorSubtract(currentTargetPosition, player.position);
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
          player.grappleTarget = undefined;
          player.grappleTargetId = undefined;
          player.grappleTargetType = undefined;
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
      this.usingArrowKeyAiming = true;
    }
    if (this.keys.has('arrowright')) {
      player.rotation += dt * 4;
      this.usingArrowKeyAiming = true;
    }

    const mouseHasMoved = vectorDistance(this.mousePos, this.lastMousePos) > 5;
    if (mouseHasMoved) {
      this.usingArrowKeyAiming = false;
      this.lastMousePos = { ...this.mousePos };
    }

    if (!this.keys.has('arrowleft') && !this.keys.has('arrowright') && !this.usingArrowKeyAiming) {
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

    // Update blink charge cooldowns (4 seconds per charge)
    for (let i = 0; i < player.blinkCooldowns.length; i++) {
      if (player.blinkCooldowns[i] > 0) {
        player.blinkCooldowns[i] -= dt;
        if (player.blinkCooldowns[i] <= 0) {
          player.blinkCooldowns[i] = 0;
          player.blinkCharges = Math.min(player.blinkCharges + 1, player.blinkMaxCharges);
        }
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
            weapon.cooldown = this.getEffectiveFireRate(weapon.fireRate);
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
          weapon.cooldown = this.getEffectiveFireRate(weapon.grapplingStats?.cooldown || weapon.fireRate);
        } else {
          this.fireWeapon(weapon);
          weapon.cooldown = this.getEffectiveFireRate(weapon.fireRate);
        }
      }
    });
  }

  private getEffectiveFireRate(baseFireRate: number): number {
    const assaultDrone = this.gameState.drones.find(
      drone => drone.droneType === 'assault_drone' && drone.isActiveEffectActive
    );
    
    if (assaultDrone) {
      return baseFireRate * 0.5;
    }
    return baseFireRate;
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
      weapon.cooldown = this.getEffectiveFireRate(weapon.fireRate);
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
          this.applyDamageToPlayer(thornsDamage);
          this.createParticles(player.position, 8, '#ef4444', 0.4);
          if (player.health <= 0) {
            this.gameState.isGameOver = true;
          }
        }

        if (enemy.health <= 0) {
          let scoreValue = 10;
          if (enemy.type === 'boss') scoreValue = 500;
          if (enemy.type === 'miniboss') scoreValue = 1000;
          if (this.modifierSystem.isModifiedEnemy(enemy)) scoreValue = 150;

          this.gameState.score += scoreValue;
          
          if (enemy.type === 'miniboss') {
            this.handleMinibossDeath(enemy);
          } else {
            this.spawnCurrency(enemy.position, enemy.currencyDrop);
          }
          
          this.worldGenerator.registerEnemyKill(enemy.id);

          let particleCount = 20;
          if (enemy.type === 'boss') particleCount = 50;
          if (enemy.type === 'miniboss') particleCount = 100;
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
            this.applyDamageToPlayer(totalDamage, remotePlayer.player);
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
            this.applyDamageToPlayer(thornsDamage);
            this.createParticles(player.position, 8, '#ef4444', 0.4);
            if (player.health <= 0) {
              this.gameState.isGameOver = true;
            }
          }

          this.createParticles(enemy.position, 20, weapon.color, 0.4);

          if (enemy.health <= 0) {
            let scoreValue = 10;
            if (enemy.type === 'boss') scoreValue = 500;
            if (enemy.type === 'miniboss') scoreValue = 1000;
            if (this.modifierSystem.isModifiedEnemy(enemy)) scoreValue = 150;

            this.gameState.score += scoreValue;
            
            if (enemy.type === 'miniboss') {
              this.handleMinibossDeath(enemy);
            } else {
              this.spawnCurrency(enemy.position, enemy.currencyDrop);
            }
            
            this.worldGenerator.registerEnemyKill(enemy.id);

            let particleCount = 20;
            if (enemy.type === 'boss') particleCount = 50;
            if (enemy.type === 'miniboss') particleCount = 100;
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
    
    (player as any).lastShotTime = Date.now();

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
      
      if ((player as any).sniperTacticalMode && Date.now() < ((player as any).sniperModeEndTime || 0)) {
        damage *= ((player as any).sniperDamageMult || 1.0);
      }
      
      if ((player as any).assaultDroneFireRateBoost && Date.now() < ((player as any).assaultDroneBoostEndTime || 0)) {
        weapon.cooldown = weapon.fireRate / ((player as any).assaultDroneFireRateBoost || 1.0);
      }

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
        maxRange: ((player as any).sniperTacticalMode && Date.now() < ((player as any).sniperModeEndTime || 0)) 
          ? (weapon.maxRange || MAX_VISIBLE_RANGE) * ((player as any).sniperRangeMult || 1.0)
          : (weapon.maxRange || MAX_VISIBLE_RANGE),
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
    
    this.triggerDroneActiveAbilities('shoot');
  }

  private updateEnemies(dt: number): void {
    const player = this.gameState.player;

    this.gameState.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      if (enemy.empStunned && enemy.empStunTimer !== undefined) {
        enemy.empStunTimer -= dt;
        if (enemy.empStunTimer <= 0) {
          enemy.empStunned = false;
          enemy.empStunTimer = 0;
        } else {
          enemy.velocity = createVector(0, 0);
          enemy.attackCooldown = Math.max(enemy.attackCooldown, 0.1);
          this.createParticles(enemy.position, 2, '#eab308', 0.2);
          return;
        }
      }

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
        const deaggroDistance = 600;
        const shootRange = 350;
        const pathfindRange = 500;
        
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }
        
        if (distance > deaggroDistance) {
          enemy.isAggro = false;
        }

        if (enemy.isAggro) {
          const hasLineOfSight = !findBlockingObstacle(
            enemy.position,
            targetPlayer.position,
            this.obstacles,
            enemy.size / 2
          );
          
          if (hasLineOfSight && distance <= shootRange) {
            enemy.velocity = createVector();
            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              this.enemyFireProjectile(enemy, targetPlayer.position, 1, 8);
              enemy.attackCooldown = 2;
            }
          } else if (distance <= pathfindRange) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();
          }
        } else {
          enemy.velocity = createVector();
        }
      } else if (enemy.type === 'artillery') {
        const deaggroDistance = 700;
        const shootRange = 400;
        const pathfindRange = 550;
        
        if (distance < (enemy.detectionRadius || 100)) {
          enemy.isAggro = true;
        }
        
        if (distance > deaggroDistance) {
          enemy.isAggro = false;
        }

        if (enemy.isAggro) {
          const hasLineOfSight = !findBlockingObstacle(
            enemy.position,
            targetPlayer.position,
            this.obstacles,
            enemy.size / 2
          );
          
          if (hasLineOfSight && distance <= shootRange) {
            enemy.velocity = createVector();
            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
              this.enemyFireProjectile(enemy, targetPlayer.position, 1, 6, 0.15);
              enemy.attackCooldown = 3;
            }
          } else if (distance <= pathfindRange) {
            const directionToPlayer = findPathAroundObstacles(
              enemy.position,
              targetPlayer.position,
              this.obstacles,
              enemy.size / 2
            );
            enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
          } else {
            enemy.velocity = createVector();
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
            const meleeStopDistance = ENEMY_MELEE_STOP_DISTANCE + enemy.size / 2;
            if (distance > meleeStopDistance) {
              const directionToPlayer = findPathAroundObstacles(
                enemy.position,
                targetPlayer.position,
                this.obstacles,
                enemy.size / 2
              );
              enemy.velocity = vectorScale(directionToPlayer, enemy.speed);
            } else {
              enemy.velocity = createVector();
            }
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

  private updateMinibosses(dt: number): void {
    const player = this.gameState.player;
    const minibosses = this.gameState.enemies.filter(e => e.type === 'miniboss');

    minibosses.forEach(miniboss => {
      if (miniboss.health <= 0) return;

      const context = {
        createProjectile: (proj: any) => this.gameState.projectiles.push(proj),
        createParticles: (pos, count, color, lifetime) => this.createParticles(pos, count, color, lifetime),
        damagePlayer: (damage) => {
          this.applyDamageToPlayer(damage);
          this.checkPlayerDeath();
        },
        findNearestPlayer: (pos) => this.findNearestPlayer(pos).position,
        getAllPlayers: () => [this.gameState.player, ...this.gameState.remotePlayers.map(rp => rp.player)]
      };

      this.minibossUpdateSystem.update(miniboss, player.position, dt, context);

      const whirlpoolEffect = this.minibossUpdateSystem.applyWhirlpoolEffect(miniboss, player.position, dt);
      if (whirlpoolEffect) {
        player.position = vectorAdd(player.position, whirlpoolEffect);
      }
    });
  }

  private checkMinibossSpawns(dt: number): void {
    this.minibossSpawnCheckTimer += dt;

    if (this.minibossSpawnCheckTimer < 5.0) {
      return;
    }

    this.minibossSpawnCheckTimer = 0;

    const currentBiome = this.biomeManager.getCurrentBiome();
    if (currentBiome) {
      this.minibossSpawnManager.updateCurrentBiome(currentBiome.id);
    }

    const distanceFromOrigin = Math.sqrt(
      this.gameState.player.position.x * this.gameState.player.position.x +
      this.gameState.player.position.y * this.gameState.player.position.y
    );
    const approximateWave = Math.max(1, Math.floor(distanceFromOrigin / 500));

    const spawnedMiniboss = this.minibossSpawnManager.checkAndSpawnMiniboss(
      this.gameState.player.position,
      this.biomeFeatures,
      approximateWave,
      (subtype, position) => this.minibossSystem.createMiniboss(subtype, position)
    );

    if (spawnedMiniboss) {
      spawnedMiniboss.spawnDelay = 2.0;
      this.gameState.enemies.push(spawnedMiniboss);
      this.createParticles(spawnedMiniboss.position, 80, spawnedMiniboss.color, 1.2);
      
      const name = this.minibossLootSystem.getMinibossDisplayName(spawnedMiniboss.minibossSubtype!);
      console.log(`Miniboss spawned: ${name} (materializing...)`);
    }
  }

  private handleMinibossDeath(enemy: Enemy): void {
    if (enemy.type !== 'miniboss' || !enemy.minibossSubtype) return;

    const loot = this.minibossLootSystem.generateLoot(enemy);
    if (!loot) return;

    this.minibossLootSystem.spawnLootDrops(
      loot,
      (pos, amount) => this.spawnCurrency(pos, amount),
      (pos, type, amount) => this.spawnResourceDrop(pos, type, amount),
      (pos) => this.spawnWeaponDrop(pos)
    );

    this.minibossSpawnManager.onMinibossDefeated(enemy.id, enemy.minibossSubtype);

    const name = this.minibossLootSystem.getMinibossDisplayName(enemy.minibossSubtype);
    console.log(`Miniboss defeated: ${name}`);
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
        } else if (!projectile.wallPierce && projectile.owner === 'enemy') {
          for (const obstacle of this.obstacles) {
            if (checkProjectileObstacleCollision(projectile, obstacle)) {
              this.createParticles(projectile.position, 5, projectile.color, 0.2);
              return false;
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
                this.applyDamageToPlayer(thornsDamage);
                this.createParticles(player.position, 8, '#ef4444', 0.4);
                if (player.health <= 0) {
                  this.gameState.isGameOver = true;
                }
              }

              if (projectile.isEMP || (projectile as any).droneType === 'emp_drone') {
                enemy.empStunned = true;
                enemy.empStunTimer = 1.0;
                this.createParticles(enemy.position, 15, '#fde047', 0.6);
                this.createParticles(enemy.position, 10, '#eab308', 0.4);
              }

              if ((projectile as any).droneType === 'explosive_drone' && projectile.explosive) {
                this.createParticles(enemy.position, 30, '#fb923c', 0.8);
                this.createParticles(enemy.position, 20, '#ff6600', 0.6);
              } else {
                this.createParticles(enemy.position, 5, enemy.color, 0.3);
              }

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
                if (enemy.type === 'miniboss') scoreValue = 1000;
                if (this.modifierSystem.isModifiedEnemy(enemy)) scoreValue = 150;

                this.gameState.score += scoreValue;
                
                if (enemy.type === 'miniboss') {
                  this.handleMinibossDeath(enemy);
                } else {
                  this.spawnCurrency(enemy.position, enemy.currencyDrop);
                }
                
                this.worldGenerator.registerEnemyKill(enemy.id);

                let particleCount = 20;
                if (enemy.type === 'boss') particleCount = 50;
                if (enemy.type === 'miniboss') particleCount = 100;
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
                this.applyDamageToPlayer(projectile.damage, remotePlayer.player);
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
              this.applyDamageToPlayer(projectile.damage);
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
            this.applyDamageToPlayer(projectile.damage);
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
          this.applyDamageToPlayer(enemy.damage);
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
          this.applyDamageToPlayer(this.voidSubdivider.damage);
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
            this.applyDamageToPlayer(this.voidSubdivider.damage * 0.5 * dt);
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
    const now = Date.now();
    const deadEnemies = this.gameState.enemies.filter((enemy) => enemy.health <= 0);
    deadEnemies.forEach(enemy => {
      this.recentEnemyDeaths = this.recentEnemyDeaths.filter(
        death => now - death.timestamp < 3000
      );
      this.recentEnemyDeaths.push({ x: enemy.position.x, y: enemy.position.y, timestamp: now });
    });
    
    this.gameState.enemies = this.gameState.enemies.filter((enemy) => enemy.health > 0);

    const MAX_ENEMIES = 300;
    if (this.gameState.enemies.length > MAX_ENEMIES) {
      const playerPos = this.gameState.player.position;
      const SAFE_DISTANCE = 800;
      
      const distantEnemies = this.gameState.enemies.filter(enemy => {
        const dist = vectorDistance(enemy.position, playerPos);
        return dist > SAFE_DISTANCE;
      });
      
      if (distantEnemies.length > 0) {
        distantEnemies.sort((a, b) => {
          const distA = vectorDistance(a.position, playerPos);
          const distB = vectorDistance(b.position, playerPos);
          return distB - distA;
        });
        
        const enemiesToRemove = new Set(distantEnemies.slice(0, this.gameState.enemies.length - MAX_ENEMIES).map(e => e.id));
        this.gameState.enemies = this.gameState.enemies.filter(e => !enemiesToRemove.has(e.id));
      }
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
          const now = Date.now();
          const isTooCloseToRecentDeath = this.recentEnemyDeaths.some(death => {
            if (now - death.timestamp > 3000) return false;
            const dist = Math.sqrt(
              Math.pow(chunkEnemy.position.x - death.x, 2) +
              Math.pow(chunkEnemy.position.y - death.y, 2)
            );
            return dist < 100;
          });
          
          if (isTooCloseToRecentDeath) return;
          
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
    let targetId: string | undefined;
    let targetType: 'enemy' | 'player' | 'obstacle' | undefined;
    const attachAngle = 0.3 + (attachBonus / 1000);

    // Check for enemies
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
          targetId = enemy.id;
          targetType = 'enemy';
        }
      }
    }

    // Check for remote players (multiplayer)
    for (const remotePlayer of this.gameState.remotePlayers) {
      const toPlayer = vectorSubtract(remotePlayer.player.position, player.position);
      const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
      const angleDiff = Math.abs(angleToPlayer - angle);

      if (angleDiff < attachAngle) {
        const dist = vectorDistance(player.position, remotePlayer.player.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestTarget = remotePlayer.player.position;
          targetId = remotePlayer.id;
          targetType = 'player';
        }
      }
    }

    // Check for obstacles
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
          targetId = undefined;
          targetType = 'obstacle';
        }
      }
    }

    if (nearestTarget) {
      player.isGrappling = true;
      player.grappleTarget = { ...nearestTarget };
      player.grappleTargetId = targetId;
      player.grappleTargetType = targetType;
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
    
    // Use blink if equipped
    if (player.hasBlinkEquipped) {
      this.blink();
      return;
    }
    
    if (player.dashCooldown <= 0 && !player.isDashing) {
      // If grappling, detach and enter glide mode with full momentum
      if (player.isGrappling) {
        player.isGrappling = false;
        player.isGliding = true;

        // Calculate dash direction
        const dashDir = vectorFromAngle(player.rotation);

        // Preserve grappling momentum and add dash boost (reduced from 0.7 to 0.5)
        const currentSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
        const dashBoost = vectorScale(dashDir, PLAYER_DASH_SPEED * 0.5);

        // Keep all current momentum and add dash boost
        player.glideVelocity = vectorAdd(player.velocity, dashBoost);

        // Don't set isDashing to true when detaching from grapple
        // This allows continuous gliding instead of brief dash
        player.dashCooldown = PLAYER_DASH_COOLDOWN;
        this.createParticles(player.position, 20, '#00ffff', 0.5);
        return;
      }

      const hasVoidDrone = this.gameState.drones.some(d => d.droneType === 'void_drone');
      
      if (hasVoidDrone) {
        const blinkDistance = 100;
        
        let blinkDir;
        const currentSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
        
        if (currentSpeed > 0.1) {
          blinkDir = vectorNormalize(player.velocity);
        } else {
          blinkDir = vectorFromAngle(player.rotation);
        }
        
        const blinkTarget = vectorAdd(player.position, vectorScale(blinkDir, blinkDistance));
        
        this.createParticles(player.position, 30, '#a78bfa', 0.8);
        player.position = { ...blinkTarget };
        this.createParticles(player.position, 30, '#a78bfa', 0.8);
        
        if (currentSpeed > 0) {
          player.isGliding = true;
          player.glideVelocity = { ...player.velocity };
        }
        
        player.dashCooldown = PLAYER_DASH_COOLDOWN * 0.5;
        this.triggerDroneActiveAbilities('dash');
      } else {
        player.isDashing = true;
        player.dashCooldown = PLAYER_DASH_COOLDOWN;
        this.createParticles(player.position, 15, '#00ffff', 0.4);
        this.triggerDroneActiveAbilities('dash');
      }
    }
  }

  blink(): void {
    const player = this.gameState.player;
    
    // Check if we have charges available
    if (player.blinkCharges <= 0) {
      return;
    }
    
    const blinkDistance = 100;
    
    // Determine blink direction (prefer movement direction over facing direction)
    let blinkDir;
    const currentSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
    
    if (currentSpeed > 0.1) {
      blinkDir = vectorNormalize(player.velocity);
    } else {
      blinkDir = vectorFromAngle(player.rotation);
    }
    
    // If grappling, detach and preserve momentum in blink direction
    if (player.isGrappling) {
      player.isGrappling = false;
      player.isGliding = true;
      
      // Preserve grappling momentum and add blink boost (reduced from 1.2 to 0.8)
      const blinkBoost = vectorScale(blinkDir, PLAYER_DASH_SPEED * 0.8);
      player.glideVelocity = vectorAdd(player.velocity, blinkBoost);
      
      player.grappleTarget = undefined;
      player.grappleTargetId = undefined;
      player.grappleTargetType = undefined;
    }
    
    // Calculate blink target position
    const blinkTarget = vectorAdd(player.position, vectorScale(blinkDir, blinkDistance));
    
    // Create particles at start position
    this.createParticles(player.position, 30, '#a78bfa', 0.8);
    
    // Teleport player
    player.position = { ...blinkTarget };
    
    // Create particles at end position
    this.createParticles(player.position, 30, '#a78bfa', 0.8);
    
    // Preserve momentum if moving (and not already handled by grapple detach)
    if (currentSpeed > 0 && !player.isGliding) {
      player.isGliding = true;
      player.glideVelocity = { ...player.velocity };
    }
    
    // Use a charge - find the first available slot and set its cooldown
    player.blinkCharges--;
    const BLINK_CHARGE_COOLDOWN = 4.0; // 4 seconds per charge
    
    // Set cooldown on the first available slot (find first that's at 0)
    for (let i = 0; i < player.blinkCooldowns.length; i++) {
      if (player.blinkCooldowns[i] === 0) {
        player.blinkCooldowns[i] = BLINK_CHARGE_COOLDOWN;
        break;
      }
    }
    
    // Trigger drone abilities
    this.triggerDroneActiveAbilities('dash');
  }

  switchWeapon(index: number): void {
    if (index >= 0 && index < this.gameState.player.equippedWeapons.length) {
      this.gameState.player.activeWeaponIndex = index;
      this.triggerDroneActiveAbilities('weaponSwap');
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

  equipDrone(droneType: import('../types/game').DroneType): boolean {
    const success = this.inventory.equipDrone(droneType);
    if (success) {
      this.syncDrones();
    }
    return success;
  }

  unequipDrone(droneType: import('../types/game').DroneType): void {
    this.inventory.unequipDrone(droneType);
    this.syncDrones();
  }

  deleteDrone(droneType: import('../types/game').DroneType): void {
    this.inventory.removeDrone(droneType);
    this.syncDrones();
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

  private updateDrones(dt: number): void {
    const player = this.gameState.player;

    this.droneSystem.updateDrones(
      this.gameState.drones,
      player.position,
      this.gameState.enemies,
      dt,
      (projectile: Projectile) => {
        this.gameState.projectiles.push(projectile);
      }
    );

    this.updateDroneActiveEffects(dt);
    this.applyDronePassiveEffects(dt);
  }

  private applyDamageToPlayer(damage: number, player: import('../types/game').Player = this.gameState.player): number {
    const shieldReduction = (player as any).shieldDamageReduction || 0;
    const reducedDamage = damage * (1 - shieldReduction);
    player.health -= reducedDamage;
    if (reducedDamage > 0 && player === this.gameState.player) {
      this.triggerDroneActiveAbilities('takeDamage');
    }
    return reducedDamage;
  }

  private updateDroneActiveEffects(dt: number): void {
    this.gameState.drones.forEach(drone => {
      const definition = this.droneSystem.getDroneDefinition(drone.droneType);
      
      if (drone.activeEffectTimer > 0) {
        drone.activeEffectTimer -= dt;
      }
      
      if (drone.isActiveEffectActive && drone.activeEffectRemainingTime !== undefined) {
        drone.activeEffectRemainingTime -= dt;
        if (drone.activeEffectRemainingTime <= 0) {
          drone.isActiveEffectActive = false;
          drone.activeEffectRemainingTime = 0;
        }
      }
    });
  }

  triggerDroneActiveAbilities(trigger: 'shoot' | 'dash' | 'weaponSwap' | 'takeDamage'): void {
    const player = this.gameState.player;
    
    this.gameState.drones.forEach(drone => {
      const definition = this.droneSystem.getDroneDefinition(drone.droneType);
      
      if (definition.activeTrigger === trigger && drone.activeEffectTimer <= 0) {
        this.activateDroneAbility(drone, definition, player);
      }
    });
  }

  manuallyActivateDroneAbility(droneType: import('../types/game').DroneType): void {
    const player = this.gameState.player;
    const drone = this.gameState.drones.find(d => d.droneType === droneType);
    
    if (drone && drone.activeEffectTimer <= 0) {
      const definition = this.droneSystem.getDroneDefinition(drone.droneType);
      if (definition.activeTrigger === 'manual') {
        this.activateDroneAbility(drone, definition, player);
      }
    }
  }

  private activateDroneAbility(
    drone: Drone, 
    definition: any, 
    player: import('../types/game').Player
  ): void {
    drone.isActiveEffectActive = true;
    drone.activeEffectRemainingTime = definition.activeEffectDuration || 0;
    drone.activeEffectTimer = definition.activeEffectCooldown || 0;

    switch (drone.droneType) {
      case 'repair_drone':
        (player as any).repairDroneActiveRegen = true;
        (player as any).repairDroneActiveRegenEndTime = Date.now() + (definition.activeEffectDuration || 5) * 1000;
        (player as any).repairDroneStartTime = Date.now();
        (player as any).repairDroneRequiresStill = true;
        this.createParticles(player.position, 30, '#34d399', 0.6);
        break;
      
      case 'medic_drone':
        if (!this.gameState.healingPools) {
          this.gameState.healingPools = [];
        }
        this.gameState.healingPools.push({
          id: `heal_${Date.now()}`,
          position: { ...player.position },
          radius: 150,
          healPerSecond: 1,
          lifetime: definition.activeEffectDuration || 6,
          ownerId: player.id
        });
        this.createParticles(player.position, 40, '#4ade80', 0.8);
        break;
      
      case 'shield_drone':
        if (player.health <= player.maxHealth / 2) {
          (player as any).shieldDroneActiveReduction = 0.50;
          (player as any).shieldDroneActiveEndTime = Date.now() + (definition.activeEffectDuration || 4) * 1000;
          this.createParticles(player.position, 50, '#60a5fa', 0.9);
        }
        break;
      
      case 'sniper_drone':
        (player as any).sniperTacticalMode = true;
        (player as any).sniperModeEndTime = Date.now() + (definition.activeEffectDuration || 6) * 1000;
        (player as any).sniperSpeedMult = 0.5;
        (player as any).sniperDamageMult = 2.0;
        (player as any).sniperRangeMult = 2.0;
        this.createParticles(player.position, 30, '#94a3b8', 0.7);
        break;
      
      case 'cryo_drone':
        if (!this.gameState.slowingAreas) {
          this.gameState.slowingAreas = [];
        }
        const bombVelocity = {
          x: Math.cos(player.rotation) * 200,
          y: Math.sin(player.rotation) * 200
        };
        this.gameState.slowingAreas.push({
          id: `cryo_bomb_${Date.now()}`,
          position: { ...player.position },
          velocity: bombVelocity,
          radius: 0,
          maxRadius: 150,
          slowPercent: 0.6,
          lifetime: definition.activeEffectDuration || 6,
          ownerId: player.id,
          isExpanding: false
        });
        this.createParticles(player.position, 30, '#22d3ee', 0.8);
        break;
      
      case 'emp_drone':
        const currentHealthPercent = player.health / player.maxHealth;
        const lastEmpHealth = (player as any).lastEmpDroneHealth || 1.0;
        
        const shouldTriggerEmp = 
          (currentHealthPercent <= 0.75 && lastEmpHealth > 0.75) ||
          (currentHealthPercent <= 0.50 && lastEmpHealth > 0.50) ||
          (currentHealthPercent <= 0.25 && lastEmpHealth > 0.25);
        
        if (shouldTriggerEmp) {
          const empRadius = 350;
          this.gameState.enemies.forEach(enemy => {
            const dist = Math.sqrt(
              Math.pow(enemy.position.x - player.position.x, 2) +
              Math.pow(enemy.position.y - player.position.y, 2)
            );
            if (dist <= empRadius) {
              enemy.isStunned = true;
              enemy.stunnedEndTime = Date.now() + (definition.activeEffectDuration || 1) * 1000;
              this.createParticles(enemy.position, 12, '#fde047', 0.4);
            }
          });
          
          if (!this.gameState.empWaves) {
            this.gameState.empWaves = [];
          }
          this.gameState.empWaves.push({
            id: `emp_wave_${Date.now()}`,
            position: { ...player.position },
            radius: 0,
            maxRadius: empRadius,
            lifetime: 0.5,
            color: '#fde047'
          });
          
          this.createParticles(player.position, 60, '#fde047', 1.0);
          (player as any).lastEmpDroneHealth = currentHealthPercent;
        }
        break;
      
      case 'swarm_drone':
        // Deploy mini swarm drones
        if (!this.gameState.swarmDrones) {
          this.gameState.swarmDrones = [];
        }
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          this.gameState.swarmDrones.push({
            id: `swarm_${Date.now()}_${i}`,
            position: { 
              x: player.position.x + Math.cos(angle) * 30,
              y: player.position.y + Math.sin(angle) * 30
            },
            velocity: { x: 0, y: 0 },
            rotation: angle,
            lifetime: definition.activeEffectDuration || 6,
            damage: 2,
            ownerId: player.id
          });
        }
        this.createParticles(player.position, 40, '#2dd4bf', 0.8);
        break;
      
      case 'assault_drone':
        (player as any).assaultDroneFireRateBoost = 2.0;
        (player as any).assaultDroneBoostEndTime = Date.now() + (definition.activeEffectDuration || 3) * 1000;
        this.createParticles(player.position, 30, '#f87171', 0.7);
        break;
      
      case 'plasma_drone':
        drone.plasmaDroneBeamActive = true;
        drone.plasmaDroneBeamEndTime = Date.now() + (definition.activeEffectDuration || 4) * 1000;
        this.createParticles(drone.position, 30, '#a78bfa', 0.7);
        break;
      
      case 'explosive_drone':
        if (!this.gameState.explosiveProjectiles) {
          this.gameState.explosiveProjectiles = [];
        }
        const projVelocity = {
          x: Math.cos(player.rotation) * 150,
          y: Math.sin(player.rotation) * 150
        };
        (this.gameState as any).activeExplosiveProjectile = {
          id: `explosive_proj_${Date.now()}`,
          position: { ...player.position },
          velocity: projVelocity,
          size: 25,
          damage: 150,
          explosionRadius: 350,
          lifetime: definition.activeEffectDuration || 8,
          ownerId: player.id,
          droneType: 'explosive_drone'
        };
        this.createParticles(player.position, 40, '#fb923c', 0.9);
        break;
      
      case 'laser_drone':
        drone.overloadActive = true;
        drone.overloadEndTime = Date.now() + (definition.activeEffectDuration || 5) * 1000;
        this.createParticles(drone.position, 30, '#f472b6', 0.7);
        break;
      
      case 'gravity_drone':
        if (!this.gameState.gravityWells) {
          this.gameState.gravityWells = [];
        }
        this.gameState.gravityWells.push({
          id: `gravity_${Date.now()}`,
          position: { ...player.position },
          radius: 250,
          pullStrength: 150,
          lifetime: definition.activeEffectDuration || 4,
          ownerId: player.id
        });
        this.createParticles(player.position, 50, '#818cf8', 1.0);
        break;
      
      case 'tesla_drone':
        drone.teslaStormActive = true;
        drone.teslaStormEndTime = Date.now() + (definition.activeEffectDuration || 6) * 1000;
        this.createParticles(drone.position, 40, '#60a5fa', 0.8);
        break;
      
      case 'void_drone':
        if (!this.gameState.voidRifts) {
          this.gameState.voidRifts = [];
        }
        this.gameState.voidRifts.push({
          id: `void_rift_${Date.now()}`,
          position: { ...player.position },
          radius: 120,
          damagePerSecond: 25,
          lifetime: definition.activeEffectDuration || 5,
          ownerId: player.id
        });
        this.createParticles(player.position, 50, '#a78bfa', 1.0);
        break;
      
      case 'scout_drone':
        (player as any).scoutDroneStealthActive = true;
        (player as any).scoutDroneStealthEndTime = Date.now() + (definition.activeEffectDuration || 8) * 1000;
        (player as any).isInvisibleOnRadar = true;
        (player as any).detectionReduction = 0.7;
        this.createParticles(player.position, 60, '#fbbf24', 0.9);
        break;
    }
    
    this.createParticles(drone.position, 20, definition.color, 0.6);
  }

  private applyDronePassiveEffects(dt: number): void {
    const player = this.gameState.player;
    const drones = this.gameState.drones;

    (player as any).shieldDamageReduction = 0;
    (player as any).damageBoost = 1.0;
    (player as any).critChance = 0;
    (player as any).detectionRangeBoost = 0;
    (player as any).gravitySlowAura = 0;

    drones.forEach(drone => {
      const definition = this.droneSystem.getDroneDefinition(drone.droneType);
      
      switch (drone.droneType) {
        case 'repair_drone':
        case 'medic_drone':
          if (player.health < player.maxHealth && definition.passiveEffectValue) {
            player.health = Math.min(
              player.maxHealth,
              player.health + (definition.passiveEffectValue * dt)
            );
          }
          break;

        case 'shield_drone':
          if (definition.passiveEffectValue) {
            (player as any).shieldDamageReduction = ((player as any).shieldDamageReduction || 0) + definition.passiveEffectValue;
          }
          break;

        case 'assault_drone':
          if (definition.passiveEffectValue) {
            (player as any).damageBoost = ((player as any).damageBoost || 1.0) + definition.passiveEffectValue;
          }
          break;

        case 'sniper_drone':
          if (definition.passiveEffectValue) {
            (player as any).critChance = ((player as any).critChance || 0) + definition.passiveEffectValue;
          }
          break;

        case 'scout_drone':
          const timeSinceLastShot = Date.now() - (player.lastShotTime || 0);
          if (timeSinceLastShot >= 3000 && definition.passiveEffectValue) {
            (player as any).scoutDroneSpeedBoost = definition.passiveEffectValue;
          } else {
            (player as any).scoutDroneSpeedBoost = 0;
          }
          break;
      }
    });
  }

  private updateSlowingAreas(dt: number): void {
    if (!this.gameState.slowingAreas) return;
    
    this.gameState.slowingAreas = this.gameState.slowingAreas.filter(area => {
      area.lifetime -= dt;
      if (area.lifetime <= 0) return false;
      
      // Move the bomb if it has velocity and hasn't started expanding
      if (area.velocity && !area.isExpanding) {
        area.position.x += area.velocity.x * dt;
        area.position.y += area.velocity.y * dt;
        
        // Check if it traveled 300 units or hit obstacle
        const travelDist = Math.sqrt(area.velocity.x ** 2 + area.velocity.y ** 2) * dt;
        if (!area.traveledDistance) area.traveledDistance = 0;
        area.traveledDistance += travelDist;
        
        // Start expanding after traveling 300 units
        if (area.traveledDistance >= 300) {
          area.isExpanding = true;
          area.velocity = undefined;
        }
      }
      
      // Expand the area if it's expanding
      if (area.isExpanding && area.radius < area.maxRadius) {
        area.radius += 150 * dt; // Expand at 150 units/sec
        if (area.radius > area.maxRadius) {
          area.radius = area.maxRadius;
        }
      }
      
      // Apply slow effect to enemies in range
      if (area.radius > 0) {
        this.gameState.enemies.forEach(enemy => {
          const dist = Math.sqrt(
            (enemy.position.x - area.position.x) ** 2 +
            (enemy.position.y - area.position.y) ** 2
          );
          if (dist <= area.radius) {
            enemy.isSlow = true;
            enemy.slowPercent = area.slowPercent;
            enemy.slowEndTime = Date.now() + 500; // 0.5s slow duration
          }
        });
      }
      
      return true;
    });
  }

  private updateExplosiveProjectiles(dt: number): void {
    const activeProj = (this.gameState as any).activeExplosiveProjectile;
    if (!activeProj) return;
    
    // Move the projectile
    activeProj.position.x += activeProj.velocity.x * dt;
    activeProj.position.y += activeProj.velocity.y * dt;
    activeProj.lifetime -= dt;
    
    // Check collision with enemies
    let shouldExplode = activeProj.lifetime <= 0;
    this.gameState.enemies.forEach(enemy => {
      const dist = Math.sqrt(
        (enemy.position.x - activeProj.position.x) ** 2 +
        (enemy.position.y - activeProj.position.y) ** 2
      );
      if (dist <= activeProj.size) {
        shouldExplode = true;
      }
    });
    
    if (shouldExplode) {
      // Create explosion
      this.createExplosion(activeProj.position, activeProj.explosionRadius, activeProj.damage);
      this.createParticles(activeProj.position, 60, '#fb923c', 1.0);
      (this.gameState as any).activeExplosiveProjectile = null;
    }
  }

  detonateExplosiveProjectile(): void {
    const activeProj = (this.gameState as any).activeExplosiveProjectile;
    if (activeProj) {
      this.createExplosion(activeProj.position, activeProj.explosionRadius, activeProj.damage);
      this.createParticles(activeProj.position, 100, '#fb923c', 1.2);
      this.createParticles(activeProj.position, 80, '#ff4400', 1.0);
      this.createParticles(activeProj.position, 60, '#ffaa00', 0.8);
      (this.gameState as any).activeExplosiveProjectile = null;
    }
  }

  private updateRepairDroneHealing(dt: number): void {
    const player = this.gameState.player;
    const hasRepairDrone = this.gameState.drones.some(d => d.droneType === 'repair_drone');
    
    if (!hasRepairDrone) {
      (player as any).repairDroneStillTimer = 0;
      (player as any).repairDroneHealedAmount = 0;
      return;
    }
    
    const velocityMag = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
    const isStandingStill = velocityMag < 5;
    
    if (isStandingStill) {
      if (!(player as any).repairDroneStillTimer) {
        (player as any).repairDroneStillTimer = 0;
      }
      (player as any).repairDroneStillTimer += dt;
      
      if ((player as any).repairDroneStillTimer >= 3.0) {
        if (!(player as any).repairDroneHealedAmount) {
          (player as any).repairDroneHealedAmount = 0;
        }
        
        if ((player as any).repairDroneHealedAmount < 15 && player.health < player.maxHealth) {
          const healAmount = 7.5 * dt;
          const actualHealAmount = Math.min(healAmount, 15 - (player as any).repairDroneHealedAmount, player.maxHealth - player.health);
          player.health += actualHealAmount;
          (player as any).repairDroneHealedAmount += actualHealAmount;
          
          if (!this.gameState.lastRepairParticleTime) {
            this.gameState.lastRepairParticleTime = 0;
          }
          this.gameState.lastRepairParticleTime += dt;
          if (this.gameState.lastRepairParticleTime >= 0.3) {
            this.createParticles(player.position, 8, '#34d399', 0.5);
            this.gameState.lastRepairParticleTime = 0;
          }
        }
      }
    } else {
      (player as any).repairDroneStillTimer = 0;
      (player as any).repairDroneHealedAmount = 0;
    }
  }

  private updateEmpWaves(dt: number): void {
    if (!this.gameState.empWaves) return;
    
    this.gameState.empWaves = this.gameState.empWaves.filter((wave: any) => {
      wave.lifetime -= dt;
      return wave.lifetime > 0;
    });
  }

  private updateHealingPools(dt: number): void {
    if (!this.gameState.healingPools) return;
    
    this.gameState.healingPools = this.gameState.healingPools.filter((pool: any) => {
      pool.lifetime -= dt;
      
      if (pool.lifetime <= 0) return false;
      
      const player = this.gameState.player;
      const dist = Math.sqrt(
        Math.pow(player.position.x - pool.position.x, 2) +
        Math.pow(player.position.y - pool.position.y, 2)
      );
      
      if (dist <= pool.radius && player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + pool.healPerSecond * dt);
      }
      
      return true;
    });
  }

  private updateScoutDroneStealth(): void {
    const player = this.gameState.player;
    
    // Apply detection reduction to enemies if stealth is active
    if ((player as any).scoutDroneStealthActive) {
      const now = Date.now();
      const detectionReduction = (player as any).detectionReduction || 0.7;
      
      this.gameState.enemies.forEach(enemy => {
        // Reduce detection range by 70%
        const baseDetectionRange = 400; // Normal aggro range
        enemy.detectionRange = baseDetectionRange * (1 - detectionReduction);
      });
      
      // Check if effect expired
      if (now >= ((player as any).scoutDroneStealthEndTime || 0)) {
        (player as any).scoutDroneStealthActive = false;
        (player as any).isInvisibleOnRadar = false;
        (player as any).detectionReduction = 0;
        
        // Restore normal detection ranges
        this.gameState.enemies.forEach(enemy => {
          enemy.detectionRange = 400;
        });
      }
    }
  }

  private updateShieldDroneActiveEffect(): void {
    const player = this.gameState.player;
    
    // Apply shield drone active reduction to total reduction
    if ((player as any).shieldDroneActiveReduction) {
      const now = Date.now();
      
      if (now < ((player as any).shieldDroneActiveEndTime || 0)) {
        // Add active reduction on top of passive
        const activeReduction = (player as any).shieldDroneActiveReduction;
        (player as any).shieldDamageReduction = ((player as any).shieldDamageReduction || 0) + activeReduction;
      } else {
        // Clear active reduction when expired
        (player as any).shieldDroneActiveReduction = 0;
      }
    }
  }

  private syncDrones(): void {
    const player = this.gameState.player;
    const equippedDroneTypes = this.inventory.getEquippedDrones();
    player.equippedDrones = equippedDroneTypes;
    const currentDrones = this.gameState.drones;

    const dronesById = new Map(currentDrones.map(d => [d.droneType, d]));

    const newDrones: Drone[] = [];
    equippedDroneTypes.forEach((droneType, index) => {
      const existing = dronesById.get(droneType);
      if (existing) {
        newDrones.push(existing);
        dronesById.delete(droneType);
      } else {
        const startAngle = (index / equippedDroneTypes.length) * Math.PI * 2;
        const newDrone = this.droneSystem.createDrone(droneType, player.id, player.position, startAngle);
        newDrones.push(newDrone);
      }
    });

    this.gameState.drones = newDrones;
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

  spawnAdminDrone(droneType: import('../types/game').DroneType): void {
    this.inventory.addDrone(droneType);
    this.createParticles(this.gameState.player.position, 30, '#4ade80', 0.6);
  }

  addAdminResources(amount: number = 100): void {
    this.gameState.player.resources.energy += amount;
    this.gameState.player.resources.coreDust += amount;
    this.gameState.player.resources.flux += amount;
    this.gameState.player.resources.geoShards += amount;
    this.gameState.player.resources.alloyFragments += amount;
    this.createParticles(this.gameState.player.position, 50, '#fbbf24', 0.8);
  }

  addAdminCurrency(amount: number = 500): void {
    this.gameState.player.currency += amount;
    this.createParticles(this.gameState.player.position, 40, '#10b981', 0.7);
  }

  getMultiplayerState(hostPeerId: string): Partial<GameState> & { voidSubdivider?: any } {
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
      worldEvents: this.worldEventSystem.serializeEvents(),
      voidSubdivider: this.voidSubdivider,
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
    
    // Sync void subdivider boss for all players
    const stateWithBoss = state as any;
    if (stateWithBoss.voidSubdivider !== undefined) {
      this.voidSubdivider = stateWithBoss.voidSubdivider;
    }
    
    // Sync world events with proper deserialization
    if (stateWithBoss.worldEvents) {
      this.worldEventSystem.hydrateEvents(stateWithBoss.worldEvents);
    }
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
      hasBlinkEquipped: false,
      blinkCharges: 3,
      blinkCooldowns: [0, 0, 0],
      blinkMaxCharges: 3,
      currency: 0,
      equippedWeapons,
      equippedDrones: [],
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
        maxRange: ((player as any).sniperTacticalMode && Date.now() < ((player as any).sniperModeEndTime || 0)) 
          ? (weapon.maxRange || MAX_VISIBLE_RANGE) * ((player as any).sniperRangeMult || 1.0)
          : (weapon.maxRange || MAX_VISIBLE_RANGE),
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

  saveProgress(): void {
    const saveData = {
      player: {
        health: this.gameState.player.health,
        maxHealth: this.gameState.player.maxHealth,
        currency: this.gameState.player.currency,
        resources: this.gameState.player.resources,
        position: this.gameState.player.position,
      },
      inventory: {
        weapons: this.inventory.getWeapons(),
        drones: this.inventory.getDrones(),
      },
      score: this.gameState.score,
      resourcesCollected: this.gameState.resourcesCollected,
      craftingRecipes: Array.from(this.craftingSystem.getDiscoveredRecipes().map(r => r.id)),
      timestamp: Date.now(),
    };

    localStorage.setItem('shattered_expanse_save', JSON.stringify(saveData));
    console.log('Progress saved successfully');
  }

  loadProgress(): boolean {
    try {
      const savedData = localStorage.getItem('shattered_expanse_save');
      if (!savedData) return false;

      const saveData = JSON.parse(savedData);

      this.gameState.player.health = saveData.player.health || this.gameState.player.health;
      this.gameState.player.maxHealth = saveData.player.maxHealth || this.gameState.player.maxHealth;
      this.gameState.player.currency = saveData.player.currency || 0;
      this.gameState.player.resources = { ...this.gameState.player.resources, ...saveData.player.resources };
      
      if (saveData.player.position) {
        this.gameState.player.position = saveData.player.position;
        this.loadChunksAroundPlayer();
      }

      if (saveData.score) this.gameState.score = saveData.score;
      if (saveData.resourcesCollected) this.gameState.resourcesCollected = saveData.resourcesCollected;

      if (saveData.inventory) {
        if (saveData.inventory.weapons) {
          saveData.inventory.weapons.forEach((weaponData: any) => {
            this.inventory.addWeapon(weaponData.weapon, weaponData.level);
          });
        }
        if (saveData.inventory.drones) {
          saveData.inventory.drones.forEach((droneData: any) => {
            this.inventory.addDrone(droneData.droneType);
            if (droneData.equipped) {
              this.inventory.equipDrone(droneData.droneType);
            }
          });
        }
      }

      console.log('Progress loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return false;
    }
  }

  exportSave(): string {
    const saveData = {
      player: {
        health: this.gameState.player.health,
        maxHealth: this.gameState.player.maxHealth,
        currency: this.gameState.player.currency,
        resources: this.gameState.player.resources,
        position: this.gameState.player.position,
      },
      inventory: {
        weapons: this.inventory.getWeapons(),
        drones: this.inventory.getDrones(),
      },
      score: this.gameState.score,
      resourcesCollected: this.gameState.resourcesCollected,
      craftingRecipes: Array.from(this.craftingSystem.getDiscoveredRecipes().map(r => r.id)),
      timestamp: Date.now(),
      version: '1.0.0',
    };

    return JSON.stringify(saveData, null, 2);
  }

  importSave(saveDataString: string): boolean {
    try {
      const saveData = JSON.parse(saveDataString);

      if (!saveData.player || !saveData.version) {
        throw new Error('Invalid save data format');
      }

      this.gameState.player.health = saveData.player.health || this.gameState.player.health;
      this.gameState.player.maxHealth = saveData.player.maxHealth || this.gameState.player.maxHealth;
      this.gameState.player.currency = saveData.player.currency || 0;
      this.gameState.player.resources = { ...this.gameState.player.resources, ...saveData.player.resources };
      
      if (saveData.player.position) {
        this.gameState.player.position = saveData.player.position;
        this.loadChunksAroundPlayer();
      }

      if (saveData.score) this.gameState.score = saveData.score;
      if (saveData.resourcesCollected) this.gameState.resourcesCollected = saveData.resourcesCollected;

      if (saveData.inventory) {
        this.inventory = new PlayerInventory();
        
        if (saveData.inventory.weapons) {
          saveData.inventory.weapons.forEach((weaponData: any) => {
            this.inventory.addWeapon(weaponData.weapon, weaponData.level);
          });
        }
        if (saveData.inventory.drones) {
          saveData.inventory.drones.forEach((droneData: any) => {
            this.inventory.addDrone(droneData.droneType);
            if (droneData.equipped) {
              this.inventory.equipDrone(droneData.droneType);
            }
          });
        }
      }

      console.log('Save imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }
}
