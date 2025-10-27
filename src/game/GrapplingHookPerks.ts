export interface GrapplingHookPerk {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  effects: {
    property: 'maxRange' | 'cooldown' | 'pullSpeed' | 'slamDamage' | 'slamRadius' | 'attachBonus';
    value: number;
    operation: 'add' | 'multiply' | 'set';
  }[];
}

export const GRAPPLING_HOOK_PERKS: GrapplingHookPerk[] = [
  {
    id: 'extended_cable',
    name: 'Extended Cable',
    description: '+40% Grapple Range',
    rarity: 'common',
    icon: 'move-diagonal',
    effects: [{ property: 'maxRange', value: 0.4, operation: 'multiply' }],
  },
  {
    id: 'quick_retract',
    name: 'Quick Retract',
    description: '-30% Cooldown',
    rarity: 'rare',
    icon: 'rewind',
    effects: [{ property: 'cooldown', value: -0.3, operation: 'multiply' }],
  },
  {
    id: 'rapid_pull',
    name: 'Rapid Pull',
    description: '+50% Pull Speed',
    rarity: 'rare',
    icon: 'fast-forward',
    effects: [{ property: 'pullSpeed', value: 0.5, operation: 'multiply' }],
  },
  {
    id: 'impact_slam',
    name: 'Impact Slam',
    description: 'Create explosion when colliding with enemies',
    rarity: 'epic',
    icon: 'bomb',
    effects: [
      { property: 'slamDamage', value: 50, operation: 'set' },
      { property: 'slamRadius', value: 80, operation: 'set' },
    ],
  },
  {
    id: 'titanium_cable',
    name: 'Titanium Cable',
    description: '+80% Range, +20% Pull Speed',
    rarity: 'epic',
    icon: 'link',
    effects: [
      { property: 'maxRange', value: 0.8, operation: 'multiply' },
      { property: 'pullSpeed', value: 0.2, operation: 'multiply' },
    ],
  },
  {
    id: 'magnetic_lock',
    name: 'Magnetic Lock',
    description: 'Hook attaches to more distant targets',
    rarity: 'rare',
    icon: 'magnet',
    effects: [{ property: 'attachBonus', value: 100, operation: 'add' }],
  },
  {
    id: 'instant_recall',
    name: 'Instant Recall',
    description: '-60% Cooldown',
    rarity: 'legendary',
    icon: 'rotate-ccw',
    effects: [{ property: 'cooldown', value: -0.6, operation: 'multiply' }],
  },
  {
    id: 'kinetic_slam',
    name: 'Kinetic Slam',
    description: 'Massive explosion on impact',
    rarity: 'legendary',
    icon: 'zap',
    effects: [
      { property: 'slamDamage', value: 120, operation: 'set' },
      { property: 'slamRadius', value: 150, operation: 'set' },
    ],
  },
  {
    id: 'lightweight_hook',
    name: 'Lightweight Hook',
    description: '-40% Cooldown, +25% Range',
    rarity: 'common',
    icon: 'feather',
    effects: [
      { property: 'cooldown', value: -0.4, operation: 'multiply' },
      { property: 'maxRange', value: 0.25, operation: 'multiply' },
    ],
  },
  {
    id: 'momentum_boost',
    name: 'Momentum Boost',
    description: '+100% Pull Speed',
    rarity: 'epic',
    icon: 'gauge',
    effects: [{ property: 'pullSpeed', value: 1.0, operation: 'multiply' }],
  },
  {
    id: 'precision_targeting',
    name: 'Precision Targeting',
    description: '+200 Attach Range',
    rarity: 'common',
    icon: 'crosshair',
    effects: [{ property: 'attachBonus', value: 200, operation: 'add' }],
  },
  {
    id: 'double_cable',
    name: 'Double Cable',
    description: '+120% Range, Slower Pull',
    rarity: 'rare',
    icon: 'git-pull-request',
    effects: [
      { property: 'maxRange', value: 1.2, operation: 'multiply' },
      { property: 'pullSpeed', value: -0.2, operation: 'multiply' },
    ],
  },
  {
    id: 'shockwave_impact',
    name: 'Shockwave Impact',
    description: 'Medium explosion on collision',
    rarity: 'rare',
    icon: 'radio',
    effects: [
      { property: 'slamDamage', value: 80, operation: 'set' },
      { property: 'slamRadius', value: 100, operation: 'set' },
    ],
  },
  {
    id: 'ultra_range',
    name: 'Ultra Range',
    description: '+150% Grapple Range',
    rarity: 'legendary',
    icon: 'maximize-2',
    effects: [{ property: 'maxRange', value: 1.5, operation: 'multiply' }],
  },
  {
    id: 'chain_grapple',
    name: 'Chain Grapple',
    description: 'Near-instant cooldown for chaining',
    rarity: 'legendary',
    icon: 'link-2',
    effects: [{ property: 'cooldown', value: -0.8, operation: 'multiply' }],
  },
];

export function getRandomGrapplingPerks(count: number): GrapplingHookPerk[] {
  const shuffled = [...GRAPPLING_HOOK_PERKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, GRAPPLING_HOOK_PERKS.length));
}

export function applyGrapplingPerkToWeapon(stats: GrapplingHookStats, perk: GrapplingHookPerk): GrapplingHookStats {
  const modified = { ...stats };

  perk.effects.forEach((effect) => {
    const currentValue = modified[effect.property] as number;

    switch (effect.operation) {
      case 'add':
        (modified[effect.property] as number) = currentValue + effect.value;
        break;
      case 'multiply':
        (modified[effect.property] as number) = currentValue * (1 + effect.value);
        break;
      case 'set':
        (modified[effect.property] as any) = effect.value;
        break;
    }
  });

  return modified;
}

export interface GrapplingHookStats {
  maxRange: number;
  cooldown: number;
  pullSpeed: number;
  slamDamage: number;
  slamRadius: number;
  attachBonus: number;
}

export const DEFAULT_GRAPPLING_STATS: GrapplingHookStats = {
  maxRange: 400,
  cooldown: 1.2,
  pullSpeed: 10,
  slamDamage: 0,
  slamRadius: 0,
  attachBonus: 0,
};
