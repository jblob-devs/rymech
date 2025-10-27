import { Weapon } from '../types/game';

export interface WeaponUpgradeNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  prerequisite?: string;
  icon: string;
  effects: {
    property: keyof Weapon;
    value: number;
    operation: 'add' | 'multiply' | 'set';
  }[];
}

export interface WeaponUpgradeTree {
  weaponId: string;
  nodes: WeaponUpgradeNode[];
}

export const WEAPON_UPGRADE_TREES: { [key: string]: WeaponUpgradeTree } = {
  'w_rifle_01': {
    weaponId: 'w_rifle_01',
    nodes: [
      {
        id: 'rifle_dmg_1',
        name: 'High-Caliber Rounds',
        description: 'Increases damage by 15%.',
        cost: 100,
        icon: 'dmg',
        effects: [{ property: 'damage', value: 0.15, operation: 'multiply' }],
      },
      {
        id: 'rifle_firerate_1',
        name: 'Improved Gas System',
        description: 'Increases fire rate by 20%.',
        cost: 120,
        prerequisite: 'rifle_dmg_1',
        icon: 'fire-rate',
        effects: [{ property: 'fireRate', value: -0.20, operation: 'multiply' }],
      },
      {
        id: 'rifle_pierce_1',
        name: 'Armor Piercing',
        description: 'Projectiles pierce one enemy.',
        cost: 250,
        prerequisite: 'rifle_firerate_1',
        icon: 'pierce',
        effects: [{ property: 'piercing', value: 1, operation: 'set' }],
      },
    ],
  },
  'w_shotgun_01': {
    weaponId: 'w_shotgun_01',
    nodes: [
      {
        id: 'shotgun_pellets_1',
        name: 'Extra Barrel',
        description: 'Increases projectile count by 2.',
        cost: 150,
        icon: 'pellets',
        effects: [{ property: 'projectileCount', value: 2, operation: 'add' }],
      },
      {
        id: 'shotgun_spread_1',
        name: 'Choke System',
        description: 'Reduces spread by 25%.',
        cost: 100,
        prerequisite: 'shotgun_pellets_1',
        icon: 'spread',
        effects: [{ property: 'spread', value: -0.25, operation: 'multiply' }],
      },
      {
        id: 'shotgun_ricochet_1',
        name: 'Ricochet Rounds',
        description: 'Projectiles can bounce off walls.',
        cost: 300,
        prerequisite: 'shotgun_spread_1',
        icon: 'ricochet',
        effects: [{ property: 'ricochet', value: 1, operation: 'set' }],
      },
    ],
  },
  'w_sniper_01': {
    weaponId: 'w_sniper_01',
    nodes: [
       {
        id: 'sniper_dmg_1',
        name: 'Magnetic Accelerator',
        description: 'Increases damage by 30%.',
        cost: 200,
        icon: 'dmg',
        effects: [{ property: 'damage', value: 0.30, operation: 'multiply' }],
      },
      {
        id: 'sniper_range_1',
        name: 'Rangefinder Scope',
        description: 'Increases projectile range significantly.',
        cost: 150,
        prerequisite: 'sniper_dmg_1',
        icon: 'range',
        effects: [{ property: 'maxRange', value: 0.50, operation: 'multiply' }],
      },
    ]
  }
};
