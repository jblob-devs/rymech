export type WeaponType =
  | 'blaster'
  | 'shotgun'
  | 'laser'
  | 'missile'
  | 'railgun'
  | 'flamethrower'
  | 'arc_cannon'
  | 'gravity_well'
  | 'shuriken_launcher'
  | 'beam_laser'
  | 'charge_cannon'
  | 'grappling_hook'
  | 'void_blade'
  | 'crimson_scythe'
  | 'titan_hammer'
  | 'flowing_glaive'
  | 'shadow_daggers'
  | 'berserker_axe'
  | 'guardian_blade';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  size: number;
  rotation: number;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  shieldAbsorption?: number;
  damageBoost?: number;
  critChance?: number;
  detectionRangeBoost?: number;
  speed: number;
  isDashing: boolean;
  dashCooldown: number;
  dashDuration: number;
  hasBlinkEquipped: boolean;
  blinkCharges: number;
  blinkCooldowns: number[];
  blinkMaxCharges: number;
  currency: number;
  equippedWeapons: Weapon[];
  equippedDrones: DroneType[];
  activeWeaponIndex: number;
  portalCooldown?: number;
  isGrappling?: boolean;
  grappleTarget?: Vector2;
  grappleTargetId?: string;
  grappleTargetType?: 'enemy' | 'player' | 'obstacle';
  grappleProgress?: number;
  glideVelocity?: Vector2;
  isGliding?: boolean;
  resources: {
    energy: number;
    coreDust: number;
    flux: number;
    geoShards: number;
    alloyFragments: number;
    singularityCore: number;
    // Biome-specific
    cryoKelp: number;
    obsidianHeart: number;
    gloomRoot: number;
    resonantCrystal: number;
    voidEssence: number;
    bioluminescentPearl: number;
    sunpetalBloom: number;
    aetheriumShard: number;
    gravitonEssence: number;
    voidCore: number;
    // Keys
    crateKey: number;
  };
  consumables: Consumable[];
}

export type MinibossSubtype = 
  | 'angulodon'
  | 'cryostag_vanguard'
  | 'pyroclast_behemoth'
  | 'mirelurker_matron'
  | 'prism_guardian'
  | 'null_siren'
  | 'solstice_warden'
  | 'rift_revenant'
  | 'aether_leviathan'
  | 'bloom_warden';

export type DroneType = 
  | 'assault_drone'
  | 'shield_drone'
  | 'repair_drone'
  | 'scout_drone'
  | 'plasma_drone'
  | 'cryo_drone'
  | 'explosive_drone'
  | 'emp_drone'
  | 'sniper_drone'
  | 'laser_drone'
  | 'swarm_drone'
  | 'gravity_drone'
  | 'medic_drone'
  | 'tesla_drone'
  | 'void_drone';

export interface Drone extends Entity {
  droneType: DroneType;
  ownerId: string;
  damage: number;
  fireRate: number;
  attackCooldown: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  targetId?: string;
  color: string;
  secondaryColor: string;
  shape: 'circle' | 'triangle' | 'square' | 'hexagon' | 'diamond' | 'cross' | 'star' | 'emp';
  detectionRadius: number;
  aiState?: 'hovering' | 'orbiting' | 'spinning';
  aiTimer?: number;
  hoverOffset?: Vector2;
  activeEffectCooldown: number;
  activeEffectTimer: number;
  isActiveEffectActive?: boolean;
  activeEffectRemainingTime?: number;
  beamAngle?: number;
  beamWidth?: number;
}

export interface Enemy extends Entity {
  type: 'grunt' | 'speedy' | 'tank' | 'sniper' | 'artillery' | 'burst' | 'dasher' | 'weaver' | 'laser' | 'boss' | 'miniboss' | 'orbiter' | 'fragmenter' | 'pulsar' | 'spiraler' | 'replicator' | 'vortex';
  bossType?: 'void_subdivider';
  minibossSubtype?: MinibossSubtype;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  color: string;
  attackCooldown: number;
  currencyDrop: number;
  isAggro?: boolean;
  detectionRadius?: number;
  isDashing?: boolean;
  dashTimer?: number;
  dashCooldown?: number;
  wavePhase?: number;
  waveAmplitude?: number;
  wanderAngle?: number;
  wanderTimer?: number;
  modifiers?: string[];
  orbitalProjectiles?: any[];
  orbitalAngle?: number;
  orbitalRadius?: number;
  fragmentCount?: number;
  pulseTimer?: number;
  pulseRadius?: number;
  spiralAngle?: number;
  spiralPhase?: number;
  replicateTimer?: number;
  replicateCount?: number;
  vortexPullStrength?: number;
  vortexRadius?: number;
  phase?: string;
  behaviorState?: string;
  phaseTimer?: number;
  attackQueueTimer?: number;
  nextAttack?: string;
  isSubmerged?: boolean;
  shieldActive?: boolean;
  shieldHealth?: number;
  cloneIds?: string[];
  pullRadius?: number;
  telegraphTimer?: number;
  whirlpoolAngle?: number;
  jaws?: { isOpen: boolean; biteTimer: number; grabbedPlayerId?: string };
  segments?: Array<{ position: Vector2; rotation: number; size: number }>;
  empStunned?: boolean;
  empStunTimer?: number;
  behaviorTimer?: number;
  spawnDelay?: number;
}

export interface Projectile extends Entity {
  damage: number;
  color: string;
  owner: 'player' | 'enemy';
  playerId?: string;
  lifetime: number;
  maxLifetime?: number;
  piercing: boolean;
  piercingCount: number;
  homing?: boolean;
  homingStrength?: number;
  explosive?: boolean;
  explosionRadius?: number;
  ricochet?: boolean;
  ricochetCount?: number;
  maxRange?: number;
  travelDistance?: number;
  weaponType?: string;
  isCharged?: boolean;
  chargeLevel?: number;
  chainTarget?: string;
  chainCount?: number;
  chainedFrom?: string;
  splitCount?: number;
  isSplit?: boolean;
  isPortal?: boolean;
  portalPair?: string;
  isOrbital?: boolean;
  orbitRadius?: number;
  orbitAngle?: number;
  orbitSpeed?: number;
  parentId?: string;
  isBeam?: boolean;
  beamLength?: number;
  projectileSpeed?: number;
  isGravityWell?: boolean;
  gravityRadius?: number;
  gravityStrength?: number;
  wallPierce?: boolean;
  isChainLightning?: boolean;
  chainLightningTarget?: Vector2;
  killStreak?: number;
  killStreakTimer?: number;
  droneType?: string;
  isEMP?: boolean;
}

export interface Particle extends Entity {
  maxLifetime: number;
  lifetime: number;
  color: string;
}

export interface DamageNumber {
  id: string;
  position: Vector2;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  velocity: Vector2;
  color: string;
  text: string;
}

export interface CurrencyDrop extends Entity {
  value: number;
  lifetime: number;
}

export interface ResourceDrop extends Entity {
  resourceType: string;
  amount: number;
  lifetime: number;
  bobPhase: number;
}

export interface Chest {
  id: string;
  position: Vector2;
  size: number;
  rotation: number;
  type: 'regular' | 'timed' | 'locked';
  isOpen: boolean;
  radius?: number;
  timer?: number;
  maxTime?: number;
  requiresKey?: boolean;
}

export interface Weapon {
  id: string;
  name: string;
  type: string;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileSize: number;
  projectileCount: number;
  spread: number;
  color: string;
  cooldown: number;
  firingMode: 'auto' | 'semi' | 'charge' | 'hold' | 'beam' | 'manual';
  piercing?: boolean;
  homing?: boolean;
  homingStrength?: number;
  explosive?: boolean;
  explosionRadius?: number;
  ricochet?: boolean;
  maxRange?: number;
  chargeTime?: number;
  currentCharge?: number;
  isCharging?: boolean;
  holdTime?: number;
  holdTimer?: number;
  isHolding?: boolean;
  beamDuration?: number;
  beamCooldown?: number;
  beamTimer?: number;
  isBeaming?: boolean;
  beamHeat?: number;
  beamMaxHeat?: number;
  beamOverheated?: boolean;
  chainRange?: number;
  splitCount?: number;
  portalDuration?: number;
  orbitalCount?: number;
  perks?: any[];
  description?: string;
  wallPierce?: boolean;
  railgunBeamTimer?: number;
  grapplingStats?: {
    maxRange: number;
    cooldown: number;
    pullSpeed: number;
    slamDamage: number;
    slamRadius: number;
    attachBonus: number;
  };
  meleeStats?: {
    range: number;
    swingDuration: number;
    swingAngle: number;
    comboCount: number;
    comboDamageMultiplier: number;
    dashSlashBonus: number;
  };
  isSwinging?: boolean;
  swingTimer?: number;
  comboCounter?: number;
  comboResetTimer?: number;
  meleeFormId?: string;
}

export interface WeaponDrop extends Entity {
  weapon: Weapon;
  weaponPerks: any[];
  lifetime: number;
  bobPhase: number;
}

export interface UpgradeEffect {
  target: 'player' | 'weapon' | 'projectile';
  property: string;
  value: number;
  operation: 'add' | 'multiply' | 'set';
}

export interface Upgrade {
  id: string;
  name: string;
  type: 'stat' | 'ability';
  description: string;
  cost: number;
  icon: string;
  level: number;
  maxLevel: number;
  effects: UpgradeEffect[];
}

export interface Consumable {
  id: string;
  name: string;
  description: string;
  effect: string;
  value: number;
  stackable?: boolean;
  quantity?: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: { resource: string; amount: number }[];
  output: {
    type: 'consumable' | 'drone';
    item?: Consumable;
    droneType?: DroneType;
  };
  gridPattern: (string[] | null)[][];
  patternDescription?: string;
}

export interface RemotePlayer {
  id: string;
  peerId: string;
  player: Player;
  lastUpdate: number;
  username?: string;
  serverPosition?: Vector2;
  serverVelocity?: Vector2;
  interpolationAlpha?: number;
}

export interface WorldEvent {
  id: string;
  type: string;
  position: Vector2;
  radius: number;
  lifetime: number;
  maxLifetime: number;
  isActive: boolean;
  data: any;
}

export interface PlanarRemnant {
  id: string;
  position: Vector2;
  weapons: any[];
  drones: any[];
  consumables: any[];
  resources: Record<string, number>;
  currency: number;
  size: number;
  rotation: number;
  pulsePhase: number;
}

export interface BaseCampElement {
  id: string;
  position: Vector2;
  type: 'campfire' | 'vault_node' | 'info_sign';
  interactionRange: number;
  rotation?: number;
  pulsePhase?: number;
  text?: string;
}

export interface PlanarAnchor {
  id: string;
  position: Vector2;
  size: number;
  isActivated: boolean;
  isSetAsRespawn: boolean;
  type: 'base_camp' | 'field';
  rotation: number;
  pulsePhase: number;
  glowIntensity: number;
  baseCampElements?: BaseCampElement[];
}

export interface GameState {
  player: Player;
  remotePlayers: RemotePlayer[];
  enemies: Enemy[];
  drones: Drone[];
  projectiles: Projectile[];
  particles: Particle[];
  currencyDrops: CurrencyDrop[];
  resourceDrops: ResourceDrop[];
  chests: Chest[];
  weaponDrops: WeaponDrop[];
  score: number;
  isPaused: boolean;
  isGameOver: boolean;
  resourcesCollected: number;
  currentBiomeName: string;
  damageNumbers: DamageNumber[];
  pvpEnabled: boolean;
  worldEvents?: WorldEvent[];
  recentEventSpawns?: WorldEvent[];
  planarRemnants: PlanarRemnant[];
  planarAnchors: PlanarAnchor[];
  activeRespawnAnchor?: string;
}
