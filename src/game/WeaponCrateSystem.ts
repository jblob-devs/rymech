import { Weapon, WeaponType } from '../types/game';
import { generateId, getRandomAdjective } from './utils';
import { WeaponPerk, getRandomPerks, applyPerkToWeapon } from './WeaponPerks';
import { GrapplingHookPerk, getRandomGrapplingPerks, applyGrapplingPerkToWeapon, DEFAULT_GRAPPLING_STATS } from './GrapplingHookPerks';
import { WEAPON_DEFINITIONS } from './WeaponDefinitions';

export interface WeaponCrate {
  id: string;
  weapon: Weapon;
  perks: (WeaponPerk | GrapplingHookPerk)[];
}

const MELEE_WEAPON_TYPES: WeaponType[] = [
  'void_blade',
  'crimson_scythe',
  'titan_hammer',
  'flowing_glaive',
  'shadow_daggers',
  'berserker_axe',
  'guardian_blade',
];

export class WeaponCrateSystem {
  generateWeaponCrate(): WeaponCrate {
    const weaponTypes = Object.keys(WEAPON_DEFINITIONS) as WeaponType[];
    const randomType =
      weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

    const baseWeapon = WEAPON_DEFINITIONS[randomType];

    const perkCount = this.rollPerkCount();

    let weapon: Weapon = {
      ...baseWeapon,
      id: generateId(),
      perks: [],
    };

    let perks: (WeaponPerk | GrapplingHookPerk)[];

    if (randomType === 'grappling_hook') {
      const grapplingPerks = getRandomGrapplingPerks(perkCount);
      perks = grapplingPerks;

      let stats = weapon.grapplingStats || { ...DEFAULT_GRAPPLING_STATS };
      grapplingPerks.forEach((perk) => {
        stats = applyGrapplingPerkToWeapon(stats, perk);
      });
      weapon.grapplingStats = stats;
      weapon.maxRange = stats.maxRange;
      weapon.fireRate = stats.cooldown;
    } else if (MELEE_WEAPON_TYPES.includes(randomType)) {
      const meleePerks = getRandomPerks(perkCount, 'melee');
      perks = meleePerks;
      meleePerks.forEach((perk) => {
        weapon = applyPerkToWeapon(weapon, perk);
      });
    } else {
      const weaponPerks = getRandomPerks(perkCount, 'ranged');
      perks = weaponPerks;
      weaponPerks.forEach((perk) => {
        weapon = applyPerkToWeapon(weapon, perk);
      });
    }

    weapon.perks = perks;

    //const perkNames = perks.map(p => p.name).join(' + ');
    const adj = getRandomAdjective();
    // 2. Only rename if a valid adjective was successfully fetched
    console.log(adj);
    weapon.name = `${adj} ${weapon.name}`;

    return {
      id: generateId(),
      weapon,
      perks,
    };
  }

  private rollPerkCount(): number {
    const roll = Math.random();

    if (roll < 0.15) return 1;
    if (roll < 0.35) return 2;
    if (roll < 0.6) return 3;
    if (roll < 0.85) return 4;
    return 5;
  }

  getCrateCost(): number {
    return 1;
  }
}
