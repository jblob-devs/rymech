import { Weapon } from '../types/game';

export interface WeaponPerk {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  effects: PerkEffect[];
}

export interface PerkEffect {
  property: keyof Weapon;
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
  },
  {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: '-30% Fire Rate',
    rarity: 'rare',
    icon: 'repeat',
    effects: [{ property: 'fireRate', value: -0.3, operation: 'multiply' }],
  },
  {
    id: 'velocity_boost',
    name: 'Velocity Boost',
    description: '+50% Projectile Speed',
    rarity: 'common',
    icon: 'rocket',
    effects: [{ property: 'projectileSpeed', value: 0.5, operation: 'multiply' }],
  },
  {
    id: 'piercing_shots',
    name: 'Piercing Shots',
    description: 'Projectiles pierce through enemies',
    rarity: 'epic',
    icon: 'crosshair',
    effects: [{ property: 'piercing', value: 1, operation: 'set' }],
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
  },
  {
    id: 'multi_shot',
    name: 'Multi-Shot',
    description: '+2 Projectiles',
    rarity: 'rare',
    icon: 'maximize-2',
    effects: [{ property: 'projectileCount', value: 2, operation: 'add' }],
  },
  {
    id: 'ricochet',
    name: 'Ricochet',
    description: 'Projectiles bounce off walls',
    rarity: 'epic',
    icon: 'corner-down-right',
    effects: [{ property: 'ricochet', value: 1, operation: 'set' }],
  },
  {
    id: 'giant_rounds',
    name: 'Giant Rounds',
    description: '+60% Projectile Size',
    rarity: 'rare',
    icon: 'circle',
    effects: [{ property: 'projectileSize', value: 0.6, operation: 'multiply' }],
  },
  {
    id: 'focused_beam',
    name: 'Focused Beam',
    description: '-50% Spread',
    rarity: 'common',
    icon: 'minimize-2',
    effects: [{ property: 'spread', value: -0.5, operation: 'multiply' }],
  },
  {
    id: 'wide_spread',
    name: 'Wide Spread',
    description: '+80% Spread',
    rarity: 'common',
    icon: 'maximize',
    effects: [{ property: 'spread', value: 0.8, operation: 'multiply' }],
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
  },
  {
    id: 'critical_strike',
    name: 'Critical Strike',
    description: '+45% Damage',
    rarity: 'legendary',
    icon: 'star',
    effects: [{ property: 'damage', value: 0.45, operation: 'multiply' }],
  },
  {
    id: 'triple_shot',
    name: 'Triple Shot',
    description: '+3 Projectiles',
    rarity: 'epic',
    icon: 'layers',
    effects: [{ property: 'projectileCount', value: 3, operation: 'add' }],
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
  },
];

export function getRandomPerks(count: number): WeaponPerk[] {
  const shuffled = [...WEAPON_PERKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, WEAPON_PERKS.length));
}

export function applyPerkToWeapon(weapon: Weapon, perk: WeaponPerk): Weapon {
  const modifiedWeapon = { ...weapon };

  perk.effects.forEach((effect) => {
    const currentValue = modifiedWeapon[effect.property] as number;

    switch (effect.operation) {
      case 'add':
        (modifiedWeapon[effect.property] as number) = currentValue + effect.value;
        break;
      case 'multiply':
        (modifiedWeapon[effect.property] as number) = currentValue * (1 + effect.value);
        break;
      case 'set':
        (modifiedWeapon[effect.property] as any) = effect.value;
        break;
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
