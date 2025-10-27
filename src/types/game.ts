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
  | 'void_blade';

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
  speed: number;
  isDashing: boolean;
  dashCooldown: number;
  dashDuration: number;
  currency: number;
  equippedWeapons: Weapon[];
  activeWeaponIndex: number;
  portalCooldown?: number;
  isGrappling?: boolean;
  grappleTarget?: Vector2;
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

export interface Enemy extends Entity {
  type: 'grunt' | 'speedy' | 'tank' | 'sniper' | 'artillery' | 'burst' | 'dasher' | 'weaver' | 'laser' | 'boss' | 'orbiter' | 'fragmenter' | 'pulsar' | 'spiraler' | 'replicator' | 'vortex';
  bossType?: 'void_subdivider';
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
}

export interface Projectile extends Entity {
  damage: number;
  color: string;
  owner: 'player' | 'enemy';
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
    type: 'consumable';
    item: Consumable;
  };
  gridPattern: (string[] | null)[][];
  patternDescription?: string;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
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
}
