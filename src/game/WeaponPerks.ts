import { Weapon } from '../types/game';

export interface WeaponPerk {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  effects: PerkEffect[];
  weaponCategory: 'melee' | 'ranged';
}

export interface PerkEffect {
  property: string;
  value: number;
  operation: 'add' | 'multiply' | 'set';
}

export const WEAPON_PERKS: WeaponPerk[] = [
  {
    id: 'heavy_rounds',
    name: 'Heavy Rounds',
    description: '+25% Damage',
    rarity: 'rare',
    icon: 'zap',
    effects: [{ property: 'damage', value: 0.25, operation: 'multiply' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'explosive_payload',
    name: 'Explosive Payload',
    description: 'Projectiles explode on impact',
    rarity: 'epic',
    icon: 'bomb',
    effects: [
      { property: 'explosive', value: 1, operation: 'set' },
      { property: 'explosionRadius', value: 60, operation: 'set' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: '-30% Fire Rate',
    rarity: 'rare',
    icon: 'repeat',
    effects: [{ property: 'fireRate', value: -0.3, operation: 'multiply' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'velocity_boost',
    name: 'Velocity Boost',
    description: '+50% Projectile Speed',
    rarity: 'common',
    icon: 'rocket',
    effects: [{ property: 'projectileSpeed', value: 0.5, operation: 'multiply' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'piercing_shots',
    name: 'Piercing Shots',
    description: 'Projectiles pierce through enemies',
    rarity: 'epic',
    icon: 'crosshair',
    effects: [{ property: 'piercing', value: 1, operation: 'set' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'homing_guidance',
    name: 'Homing Guidance',
    description: 'Projectiles track enemies',
    rarity: 'legendary',
    icon: 'target',
    effects: [
      { property: 'homing', value: 1, operation: 'set' },
      { property: 'homingStrength', value: 0.08, operation: 'set' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'multi_shot',
    name: 'Multi-Shot',
    description: '+2 Projectiles',
    rarity: 'rare',
    icon: 'maximize-2',
    effects: [{ property: 'projectileCount', value: 2, operation: 'add' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'ricochet',
    name: 'Ricochet',
    description: 'Projectiles bounce off walls',
    rarity: 'epic',
    icon: 'corner-down-right',
    effects: [{ property: 'ricochet', value: 1, operation: 'set' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'giant_rounds',
    name: 'Giant Rounds',
    description: '+60% Projectile Size',
    rarity: 'rare',
    icon: 'circle',
    effects: [{ property: 'projectileSize', value: 0.6, operation: 'multiply' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'focused_beam',
    name: 'Focused Beam',
    description: '-50% Spread',
    rarity: 'common',
    icon: 'minimize-2',
    effects: [{ property: 'spread', value: -0.5, operation: 'multiply' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'wide_spread',
    name: 'Wide Spread',
    description: '+80% Spread',
    rarity: 'common',
    icon: 'maximize',
    effects: [{ property: 'spread', value: 0.8, operation: 'multiply' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'sniper_rounds',
    name: 'Sniper Rounds',
    description: '+60% Damage, -40% Fire Rate',
    rarity: 'epic',
    icon: 'scope',
    effects: [
      { property: 'damage', value: 0.6, operation: 'multiply' },
      { property: 'fireRate', value: 0.4, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'gatling_mode',
    name: 'Gatling Mode',
    description: '-50% Fire Rate, -20% Damage',
    rarity: 'rare',
    icon: 'disc',
    effects: [
      { property: 'fireRate', value: -0.5, operation: 'multiply' },
      { property: 'damage', value: -0.2, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'plasma_infusion',
    name: 'Plasma Infusion',
    description: '+15% Damage, +25% Speed',
    rarity: 'rare',
    icon: 'sparkles',
    effects: [
      { property: 'damage', value: 0.15, operation: 'multiply' },
      { property: 'projectileSpeed', value: 0.25, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'critical_strike',
    name: 'Critical Strike',
    description: '+45% Damage',
    rarity: 'legendary',
    icon: 'star',
    effects: [{ property: 'damage', value: 0.45, operation: 'multiply' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'triple_shot',
    name: 'Triple Shot',
    description: '+3 Projectiles',
    rarity: 'epic',
    icon: 'layers',
    effects: [{ property: 'projectileCount', value: 3, operation: 'add' }],
    weaponCategory: 'ranged',
  },
  {
    id: 'burst_fire',
    name: 'Burst Fire',
    description: '+1 Projectile, Faster Fire Rate',
    rarity: 'common',
    icon: 'circle-dot',
    effects: [
      { property: 'projectileCount', value: 1, operation: 'add' },
      { property: 'fireRate', value: -0.15, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'extended_range',
    name: 'Extended Range',
    description: '+40% Projectile Speed, +20% Size',
    rarity: 'common',
    icon: 'arrow-right',
    effects: [
      { property: 'projectileSpeed', value: 0.4, operation: 'multiply' },
      { property: 'projectileSize', value: 0.2, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    description: 'Chains to 3 nearby enemies with lightning arcs',
    rarity: 'legendary',
    icon: 'zap-off',
    effects: [
      { property: 'chainRange', value: 200, operation: 'set' },
      { property: 'projectileSpeed', value: 0.5, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'smart_tracking',
    name: 'Smart Tracking',
    description: 'Enhanced Homing',
    rarity: 'legendary',
    icon: 'radar',
    effects: [
      { property: 'homing', value: 1, operation: 'set' },
      { property: 'homingStrength', value: 0.12, operation: 'set' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'armor_piercing',
    name: 'Armor Piercing',
    description: '+30% Damage, Piercing',
    rarity: 'epic',
    icon: 'shield-off',
    effects: [
      { property: 'damage', value: 0.3, operation: 'multiply' },
      { property: 'piercing', value: 1, operation: 'set' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'compact_rounds',
    name: 'Compact Rounds',
    description: '-40% Fire Rate, +20% Speed',
    rarity: 'common',
    icon: 'minimize',
    effects: [
      { property: 'fireRate', value: -0.4, operation: 'multiply' },
      { property: 'projectileSpeed', value: 0.2, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'cluster_bomb',
    name: 'Cluster Bomb',
    description: 'Explosive + Multi-Shot',
    rarity: 'legendary',
    icon: 'hexagon',
    effects: [
      { property: 'explosive', value: 1, operation: 'set' },
      { property: 'explosionRadius', value: 50, operation: 'set' },
      { property: 'projectileCount', value: 2, operation: 'add' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'steady_aim',
    name: 'Steady Aim',
    description: '-70% Spread, +6% Damage',
    rarity: 'common',
    icon: 'crosshair',
    effects: [
      { property: 'spread', value: -0.7, operation: 'multiply' },
      { property: 'damage', value: 0.06, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'overclocked',
    name: 'Overclocked',
    description: '+20% Everything',
    rarity: 'legendary',
    icon: 'cpu',
    effects: [
      { property: 'damage', value: 0.2, operation: 'multiply' },
      { property: 'projectileSpeed', value: 0.2, operation: 'multiply' },
      { property: 'fireRate', value: -0.2, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'miniature_warhead',
    name: 'Miniature Warhead',
    description: 'Small Explosion',
    rarity: 'rare',
    icon: 'droplet',
    effects: [
      { property: 'explosive', value: 1, operation: 'set' },
      { property: 'explosionRadius', value: 40, operation: 'set' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'scatter_shot',
    name: 'Scatter Shot',
    description: '+4 Projectiles, +100% Spread',
    rarity: 'epic',
    icon: 'droplets',
    effects: [
      { property: 'projectileCount', value: 4, operation: 'add' },
      { property: 'spread', value: 1.0, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'precision_optics',
    name: 'Precision Optics',
    description: '+35% Speed, -60% Spread',
    rarity: 'rare',
    icon: 'eye',
    effects: [
      { property: 'projectileSpeed', value: 0.35, operation: 'multiply' },
      { property: 'spread', value: -0.6, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'unstable_core',
    name: 'Unstable Core',
    description: '+50% Damage, Random Spread',
    rarity: 'epic',
    icon: 'alert-triangle',
    effects: [
      { property: 'damage', value: 0.5, operation: 'multiply' },
      { property: 'spread', value: 0.5, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'quantum_bounce',
    name: 'Quantum Bounce',
    description: 'Ricochet + Speed Boost',
    rarity: 'legendary',
    icon: 'git-branch',
    effects: [
      { property: 'ricochet', value: 1, operation: 'set' },
      { property: 'projectileSpeed', value: 0.4, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'chain_lightning_strike',
    name: 'Chain Lightning',
    description: 'Projectiles chain to nearby enemies',
    rarity: 'epic',
    icon: 'zap',
    effects: [
      { property: 'chainRange', value: 150, operation: 'set' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'split_shot',
    name: 'Split Shot',
    description: 'Projectiles split into multiple on impact',
    rarity: 'epic',
    icon: 'git-fork',
    effects: [
      { property: 'splitCount', value: 3, operation: 'set' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'portal_rounds',
    name: 'Portal Rounds',
    description: 'Creates linked portals that projectiles travel through',
    rarity: 'legendary',
    icon: 'circle-dot-dashed',
    effects: [
      { property: 'portalDuration', value: 5, operation: 'set' },
      { property: 'projectileSpeed', value: 0.3, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'rampage',
    name: 'Rampage',
    description: 'Fire rate increases by 10% per kill, stacks for 3 seconds',
    rarity: 'epic',
    icon: 'flame',
    effects: [
      { property: 'damage', value: 0.1, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: '+3% damage per 1% missing health',
    rarity: 'rare',
    icon: 'heart-crack',
    effects: [
      { property: 'damage', value: 0.05, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'vampiric',
    name: 'Vampiric Rounds',
    description: 'Heal for 5% of damage dealt',
    rarity: 'legendary',
    icon: 'heart-pulse',
    effects: [
      { property: 'damage', value: 0.1, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'frost_rounds',
    name: 'Frost Rounds',
    description: 'Slows enemies by 40% for 2 seconds',
    rarity: 'epic',
    icon: 'snowflake',
    effects: [
      { property: 'projectileSpeed', value: -0.2, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'incendiary',
    name: 'Incendiary Rounds',
    description: 'Enemies burn for 50% damage over 3 seconds',
    rarity: 'epic',
    icon: 'flame',
    effects: [
      { property: 'damage', value: 0.15, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'long_barrel',
    name: 'Long Barrel',
    description: '+50% Max Range',
    rarity: 'rare',
    icon: 'arrow-up-right',
    effects: [
      { property: 'maxRange', value: 0.5, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'short_range',
    name: 'Point Blank',
    description: '-40% Max Range, +20% Damage',
    rarity: 'rare',
    icon: 'arrow-down',
    effects: [
      { property: 'maxRange', value: -0.4, operation: 'multiply' },
      { property: 'damage', value: 0.2, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'extended_barrel',
    name: 'Extended Barrel',
    description: '+80% Max Range, +20% Speed',
    rarity: 'epic',
    icon: 'move-right',
    effects: [
      { property: 'maxRange', value: 0.8, operation: 'multiply' },
      { property: 'projectileSpeed', value: 0.2, operation: 'multiply' },
    ],
    weaponCategory: 'ranged',
  },
  {
    id: 'cleaving_strikes',
    name: 'Cleaving Strikes',
    description: '+50% swing angle, hits multiple enemies',
    rarity: 'rare',
    icon: 'sword',
    effects: [{ property: 'meleeStats.swingAngle', value: 0.5, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'lethal_tempo',
    name: 'Lethal Tempo',
    description: '+40% attack speed',
    rarity: 'rare',
    icon: 'zap',
    effects: [{ property: 'fireRate', value: -0.4, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'executioner',
    name: 'Executioner',
    description: '+100% damage to enemies below 30% health',
    rarity: 'epic',
    icon: 'skull',
    effects: [{ property: 'damage', value: 0.3, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Max combo increased to 5, +100% combo damage bonus',
    rarity: 'legendary',
    icon: 'layers',
    effects: [
      { property: 'meleeStats.comboCount', value: 2, operation: 'add' },
      { property: 'meleeStats.comboDamageMultiplier', value: 0.5, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'dash_assassin',
    name: 'Dash Assassin',
    description: '+150% damage on dash slash',
    rarity: 'epic',
    icon: 'wind',
    effects: [{ property: 'meleeStats.dashSlashBonus', value: 1.5, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'extended_reach',
    name: 'Extended Reach',
    description: '+60% melee range',
    rarity: 'common',
    icon: 'arrow-right',
    effects: [
      { property: 'meleeStats.range', value: 0.6, operation: 'multiply' },
      { property: 'maxRange', value: 0.6, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: '360 degree swing, hits all around',
    rarity: 'legendary',
    icon: 'rotate-cw',
    effects: [{ property: 'meleeStats.swingAngle', value: 360, operation: 'set' }],
    weaponCategory: 'melee',
  },
  {
    id: 'life_steal',
    name: 'Life Steal',
    description: 'Heal for 15% of melee damage dealt',
    rarity: 'epic',
    icon: 'heart-pulse',
    effects: [{ property: 'damage', value: 0.1, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'brutal_force',
    name: 'Brutal Force',
    description: '+50% damage, -20% attack speed',
    rarity: 'rare',
    icon: 'hammer',
    effects: [
      { property: 'damage', value: 0.5, operation: 'multiply' },
      { property: 'fireRate', value: 0.2, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'lightning_blade',
    name: 'Lightning Blade',
    description: '+80% attack speed, -10% damage',
    rarity: 'rare',
    icon: 'zap',
    effects: [
      { property: 'fireRate', value: -0.8, operation: 'multiply' },
      { property: 'damage', value: -0.1, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'void_eruption',
    name: 'Void Eruption',
    description: 'Every 3rd hit creates a void explosion dealing area damage',
    rarity: 'legendary',
    icon: 'circle-dot',
    effects: [{ property: 'damage', value: 0.2, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'phase_strike',
    name: 'Phase Strike',
    description: 'Melee attacks ignore 50% of distance, teleport slightly forward',
    rarity: 'epic',
    icon: 'move',
    effects: [{ property: 'meleeStats.range', value: 0.5, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    description: '+5% attack speed per kill for 5 seconds (stacks)',
    rarity: 'rare',
    icon: 'droplet',
    effects: [{ property: 'damage', value: 0.15, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'sharpened_edge',
    name: 'Sharpened Edge',
    description: '+30% damage',
    rarity: 'common',
    icon: 'triangle',
    effects: [{ property: 'damage', value: 0.3, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'momentum_slash',
    name: 'Momentum Slash',
    description: 'Damage increases with movement speed',
    rarity: 'rare',
    icon: 'wind',
    effects: [{ property: 'damage', value: 0.25, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'critical_edge',
    name: 'Critical Edge',
    description: '20% chance to deal triple damage',
    rarity: 'legendary',
    icon: 'star',
    effects: [{ property: 'damage', value: 0.4, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'faster_combos',
    name: 'Faster Combos',
    description: 'Combo window extended by 50%',
    rarity: 'rare',
    icon: 'clock',
    effects: [{ property: 'fireRate', value: -0.2, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'berserker_rage',
    name: 'Berserker Rage',
    description: '+2% damage per 1% missing health',
    rarity: 'epic',
    icon: 'flame',
    effects: [{ property: 'damage', value: 0.1, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'projectile_deflection',
    name: 'Projectile Deflection',
    description: 'Melee swings deflect enemy projectiles back at them',
    rarity: 'legendary',
    icon: 'shield',
    effects: [{ property: 'damage', value: 0.15, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'vampiric_blade',
    name: 'Vampiric Blade',
    description: 'Heal for 25% of damage dealt',
    rarity: 'legendary',
    icon: 'heart',
    effects: [{ property: 'damage', value: 0.2, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'phantom_strikes',
    name: 'Phantom Strikes',
    description: 'Attacks hit twice in quick succession',
    rarity: 'legendary',
    icon: 'ghost',
    effects: [{ property: 'damage', value: 0.5, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'elemental_fury',
    name: 'Elemental Fury',
    description: 'Attacks apply burning, freezing, or shocking effects',
    rarity: 'epic',
    icon: 'flame',
    effects: [{ property: 'damage', value: 0.3, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'chain_massacre',
    name: 'Chain Massacre',
    description: 'Killing blows chain to nearby enemies',
    rarity: 'epic',
    icon: 'link',
    effects: [
      { property: 'damage', value: 0.25, operation: 'multiply' },
      { property: 'meleeStats.swingAngle', value: 0.3, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'perfect_parry',
    name: 'Perfect Parry',
    description: 'Blocking attacks during swing grants +100% damage for next strike',
    rarity: 'legendary',
    icon: 'shield-check',
    effects: [{ property: 'meleeStats.dashSlashBonus', value: 0.5, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'rending_strikes',
    name: 'Rending Strikes',
    description: 'Attacks reduce enemy armor, stacking up to 5 times',
    rarity: 'epic',
    icon: 'target',
    effects: [{ property: 'damage', value: 0.2, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'storm_cutter',
    name: 'Storm Cutter',
    description: 'Swings create lightning arcs that damage enemies in a line',
    rarity: 'legendary',
    icon: 'zap',
    effects: [
      { property: 'damage', value: 0.35, operation: 'multiply' },
      { property: 'meleeStats.range', value: 0.4, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'relentless_assault',
    name: 'Relentless Assault',
    description: 'Each consecutive hit increases attack speed by 10%',
    rarity: 'rare',
    icon: 'repeat',
    effects: [{ property: 'fireRate', value: -0.3, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'soul_reaper',
    name: 'Soul Reaper',
    description: 'Killing enemies grants temporary bonus damage',
    rarity: 'epic',
    icon: 'skull',
    effects: [{ property: 'damage', value: 0.25, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'riposte_master',
    name: 'Riposte Master',
    description: 'Taking damage within 0.5s grants +200% damage on next swing',
    rarity: 'legendary',
    icon: 'sword',
    effects: [{ property: 'damage', value: 0.4, operation: 'multiply' }],
    weaponCategory: 'melee',
  },
  {
    id: 'sweeping_fury',
    name: 'Sweeping Fury',
    description: '+120 degree swing angle, hits in wider arc',
    rarity: 'epic',
    icon: 'scan',
    effects: [{ property: 'meleeStats.swingAngle', value: 120, operation: 'add' }],
    weaponCategory: 'melee',
  },
  {
    id: 'precision_striker',
    name: 'Precision Striker',
    description: '-30 degree angle, +60% damage, focused strikes',
    rarity: 'rare',
    icon: 'crosshair',
    effects: [
      { property: 'meleeStats.swingAngle', value: -30, operation: 'add' },
      { property: 'damage', value: 0.6, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'finishing_blow',
    name: 'Finishing Blow',
    description: 'Final combo strike deals +300% damage',
    rarity: 'legendary',
    icon: 'shield-x',
    effects: [
      { property: 'meleeStats.comboDamageMultiplier', value: 1.0, operation: 'multiply' },
      { property: 'damage', value: 0.3, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'dance_of_blades',
    name: 'Dance of Blades',
    description: '+100% combo count, -15% damage per hit',
    rarity: 'epic',
    icon: 'sparkles',
    effects: [
      { property: 'meleeStats.comboCount', value: 3, operation: 'add' },
      { property: 'damage', value: -0.15, operation: 'multiply' },
      { property: 'fireRate', value: -0.3, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'heavy_impact',
    name: 'Heavy Impact',
    description: 'Swings knockback enemies further, +40% damage',
    rarity: 'rare',
    icon: 'hammer',
    effects: [
      { property: 'damage', value: 0.4, operation: 'multiply' },
      { property: 'fireRate', value: 0.15, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'whirling_dervish',
    name: 'Whirling Dervish',
    description: 'Continuous spinning attacks, +200% swing angle, +60% attack speed',
    rarity: 'legendary',
    icon: 'loader',
    effects: [
      { property: 'meleeStats.swingAngle', value: 200, operation: 'add' },
      { property: 'fireRate', value: -0.6, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'lunging_strike',
    name: 'Lunging Strike',
    description: 'Dash forward on each swing, +80% range',
    rarity: 'epic',
    icon: 'arrow-up-right',
    effects: [
      { property: 'meleeStats.range', value: 0.8, operation: 'multiply' },
      { property: 'meleeStats.dashSlashBonus', value: 0.5, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'steel_tempest',
    name: 'Steel Tempest',
    description: 'Creates a storm of blades, swinging hits 3 times',
    rarity: 'legendary',
    icon: 'wind',
    effects: [
      { property: 'damage', value: 0.8, operation: 'multiply' },
      { property: 'meleeStats.swingAngle', value: 0.5, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'feral_instinct',
    name: 'Feral Instinct',
    description: '+120% attack speed while below 50% health',
    rarity: 'epic',
    icon: 'activity',
    effects: [
      { property: 'fireRate', value: -0.4, operation: 'multiply' },
      { property: 'damage', value: 0.15, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'crushing_blow',
    name: 'Crushing Blow',
    description: 'Every 5th hit deals 500% damage, slower swing',
    rarity: 'legendary',
    icon: 'anvil',
    effects: [
      { property: 'damage', value: 0.5, operation: 'multiply' },
      { property: 'fireRate', value: 0.2, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'blade_echo',
    name: 'Blade Echo',
    description: 'Swings leave afterimages that damage enemies',
    rarity: 'epic',
    icon: 'copy',
    effects: [
      { property: 'damage', value: 0.35, operation: 'multiply' },
      { property: 'meleeStats.swingDuration', value: 0.15, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'masters_technique',
    name: "Master's Technique",
    description: '+2 combo count, +30% combo damage multiplier',
    rarity: 'rare',
    icon: 'award',
    effects: [
      { property: 'meleeStats.comboCount', value: 2, operation: 'add' },
      { property: 'meleeStats.comboDamageMultiplier', value: 0.3, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'vorpal_edge',
    name: 'Vorpal Edge',
    description: '10% chance to instantly kill non-boss enemies below 20% HP',
    rarity: 'legendary',
    icon: 'zap-off',
    effects: [
      { property: 'damage', value: 0.5, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
  {
    id: 'reaper_spin',
    name: 'Reaper Spin',
    description: '270 degree sweeping attacks, moderate damage boost',
    rarity: 'epic',
    icon: 'circle-slash',
    effects: [
      { property: 'meleeStats.swingAngle', value: 270, operation: 'set' },
      { property: 'damage', value: 0.25, operation: 'multiply' },
    ],
    weaponCategory: 'melee',
  },
];

export function getRandomPerks(count: number, category: 'melee' | 'ranged'): WeaponPerk[] {
  const categoryPerks = WEAPON_PERKS.filter(perk => perk.weaponCategory === category);
  const shuffled = [...categoryPerks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, categoryPerks.length));
}

export function applyPerkToWeapon(weapon: Weapon, perk: WeaponPerk): Weapon {
  const modifiedWeapon = { ...weapon };

  perk.effects.forEach((effect) => {
    const keys = effect.property.split('.');

    if (keys.length === 1) {
      const currentValue = modifiedWeapon[effect.property as keyof Weapon] as number;

      switch (effect.operation) {
        case 'add':
          (modifiedWeapon[effect.property as keyof Weapon] as number) = currentValue + effect.value;
          break;
        case 'multiply':
          (modifiedWeapon[effect.property as keyof Weapon] as number) = currentValue * (1 + effect.value);
          break;
        case 'set':
          (modifiedWeapon[effect.property as keyof Weapon] as any) = effect.value;
          break;
      }
    } else if (keys.length === 2 && keys[0] === 'meleeStats' && modifiedWeapon.meleeStats) {
      const currentValue = modifiedWeapon.meleeStats[keys[1] as keyof typeof modifiedWeapon.meleeStats] as number;

      switch (effect.operation) {
        case 'add':
          (modifiedWeapon.meleeStats[keys[1] as keyof typeof modifiedWeapon.meleeStats] as number) = currentValue + effect.value;
          break;
        case 'multiply':
          (modifiedWeapon.meleeStats[keys[1] as keyof typeof modifiedWeapon.meleeStats] as number) = currentValue * (1 + effect.value);
          break;
        case 'set':
          (modifiedWeapon.meleeStats[keys[1] as keyof typeof modifiedWeapon.meleeStats] as any) = effect.value;
          break;
      }
    }
  });

  return modifiedWeapon;
}

export function getRarityColor(rarity: WeaponPerk['rarity']): string {
  switch (rarity) {
    case 'common':
      return '#9ca3af';
    case 'rare':
      return '#3b82f6';
    case 'epic':
      return '#a855f7';
    case 'legendary':
      return '#f59e0b';
  }
}
