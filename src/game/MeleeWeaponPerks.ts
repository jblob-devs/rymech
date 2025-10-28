import { Weapon } from '../types/game';

export interface MeleeWeaponPerk {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  effects: MeleePerkEffect[];
}

export interface MeleePerkEffect {
  property: string;
  value: number;
  operation: 'add' | 'multiply' | 'set';
}

export const MELEE_WEAPON_PERKS: MeleeWeaponPerk[] = [
  {
    id: 'cleaving_strikes',
    name: 'Cleaving Strikes',
    description: '+50% swing angle, hits multiple enemies',
    rarity: 'rare',
    icon: 'sword',
    effects: [{ property: 'meleeStats.swingAngle', value: 0.5, operation: 'multiply' }],
  },
  {
    id: 'lethal_tempo',
    name: 'Lethal Tempo',
    description: '+40% attack speed',
    rarity: 'rare',
    icon: 'zap',
    effects: [{ property: 'fireRate', value: -0.4, operation: 'multiply' }],
  },
  {
    id: 'executioner',
    name: 'Executioner',
    description: '+100% damage to enemies below 30% health',
    rarity: 'epic',
    icon: 'skull',
    effects: [{ property: 'damage', value: 0.3, operation: 'multiply' }],
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
  },
  {
    id: 'dash_assassin',
    name: 'Dash Assassin',
    description: '+150% damage on dash slash',
    rarity: 'epic',
    icon: 'wind',
    effects: [{ property: 'meleeStats.dashSlashBonus', value: 1.5, operation: 'multiply' }],
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
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: '360 degree swing, hits all around',
    rarity: 'legendary',
    icon: 'rotate-cw',
    effects: [{ property: 'meleeStats.swingAngle', value: 360, operation: 'set' }],
  },
  {
    id: 'life_steal',
    name: 'Life Steal',
    description: 'Heal for 15% of melee damage dealt',
    rarity: 'epic',
    icon: 'heart-pulse',
    effects: [{ property: 'damage', value: 0.1, operation: 'multiply' }],
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
  },
  {
    id: 'void_eruption',
    name: 'Void Eruption',
    description: 'Every 3rd hit creates a void explosion dealing area damage',
    rarity: 'legendary',
    icon: 'circle-dot',
    effects: [{ property: 'damage', value: 0.2, operation: 'multiply' }],
  },
  {
    id: 'phase_strike',
    name: 'Phase Strike',
    description: 'Melee attacks ignore 50% of distance, teleport slightly forward',
    rarity: 'epic',
    icon: 'move',
    effects: [{ property: 'meleeStats.range', value: 0.5, operation: 'multiply' }],
  },
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    description: '+5% attack speed per kill for 5 seconds (stacks)',
    rarity: 'rare',
    icon: 'droplet',
    effects: [{ property: 'damage', value: 0.15, operation: 'multiply' }],
  },
  {
    id: 'sharpened_edge',
    name: 'Sharpened Edge',
    description: '+30% damage',
    rarity: 'common',
    icon: 'triangle',
    effects: [{ property: 'damage', value: 0.3, operation: 'multiply' }],
  },
  {
    id: 'momentum_slash',
    name: 'Momentum Slash',
    description: 'Damage increases with movement speed',
    rarity: 'rare',
    icon: 'wind',
    effects: [{ property: 'damage', value: 0.25, operation: 'multiply' }],
  },
  {
    id: 'critical_edge',
    name: 'Critical Edge',
    description: '20% chance to deal triple damage',
    rarity: 'legendary',
    icon: 'star',
    effects: [{ property: 'damage', value: 0.4, operation: 'multiply' }],
  },
  {
    id: 'faster_combos',
    name: 'Faster Combos',
    description: 'Combo window extended by 50%',
    rarity: 'rare',
    icon: 'clock',
    effects: [{ property: 'fireRate', value: -0.2, operation: 'multiply' }],
  },
  {
    id: 'berserker_rage',
    name: 'Berserker Rage',
    description: '+2% damage per 1% missing health',
    rarity: 'epic',
    icon: 'flame',
    effects: [{ property: 'damage', value: 0.1, operation: 'multiply' }],
  },
  {
    id: 'projectile_deflection',
    name: 'Projectile Deflection',
    description: 'Melee swings deflect enemy projectiles back at them',
    rarity: 'legendary',
    icon: 'shield',
    effects: [{ property: 'damage', value: 0.15, operation: 'multiply' }],
  },
  {
    id: 'vampiric_blade',
    name: 'Vampiric Blade',
    description: 'Heal for 25% of damage dealt',
    rarity: 'legendary',
    icon: 'heart',
    effects: [{ property: 'damage', value: 0.2, operation: 'multiply' }],
  },
  {
    id: 'phantom_strikes',
    name: 'Phantom Strikes',
    description: 'Attacks hit twice in quick succession',
    rarity: 'legendary',
    icon: 'ghost',
    effects: [{ property: 'damage', value: 0.5, operation: 'multiply' }],
  },
  {
    id: 'elemental_fury',
    name: 'Elemental Fury',
    description: 'Attacks apply burning, freezing, or shocking effects',
    rarity: 'epic',
    icon: 'flame',
    effects: [{ property: 'damage', value: 0.3, operation: 'multiply' }],
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
  },
  {
    id: 'perfect_parry',
    name: 'Perfect Parry',
    description: 'Blocking attacks during swing grants +100% damage for next strike',
    rarity: 'legendary',
    icon: 'shield-check',
    effects: [{ property: 'meleeStats.dashSlashBonus', value: 0.5, operation: 'multiply' }],
  },
  {
    id: 'rending_strikes',
    name: 'Rending Strikes',
    description: 'Attacks reduce enemy armor, stacking up to 5 times',
    rarity: 'epic',
    icon: 'target',
    effects: [{ property: 'damage', value: 0.2, operation: 'multiply' }],
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
  },
  {
    id: 'relentless_assault',
    name: 'Relentless Assault',
    description: 'Each consecutive hit increases attack speed by 10%',
    rarity: 'rare',
    icon: 'repeat',
    effects: [{ property: 'fireRate', value: -0.3, operation: 'multiply' }],
  },
  {
    id: 'soul_reaper',
    name: 'Soul Reaper',
    description: 'Killing enemies grants temporary bonus damage',
    rarity: 'epic',
    icon: 'skull',
    effects: [{ property: 'damage', value: 0.25, operation: 'multiply' }],
  },
];

export function getRandomMeleePerks(count: number): MeleeWeaponPerk[] {
  const shuffled = [...MELEE_WEAPON_PERKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, MELEE_WEAPON_PERKS.length));
}

export function applyMeleePerkToWeapon(weapon: Weapon, perk: MeleeWeaponPerk): Weapon {
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
