import { Weapon } from '../types/game';

/**
 * This class is a placeholder for a potential future upgrade system.
 * The previous implementation was based on obsolete static trees and has been disabled
 * to resolve critical errors and remove legacy code.
 */
export class WeaponUpgradeManager {
  /**
   * This method is deprecated. It previously returned a list of all possible upgrades for a weapon.
   * @returns An empty array.
   */
  getAllUpgrades(weapon: Weapon): any[] {
    console.warn('WeaponUpgradeManager.getAllUpgrades is deprecated.');
    return [];
  }

  /**
   * This method is deprecated. It previously checked if an upgrade could be purchased.
   * @returns Always returns `false`.
   */
  canPurchaseUpgrade(weapon: Weapon, upgradeId: string): boolean {
    console.warn('WeaponUpgradeManager.canPurchaseUpgrade is deprecated.');
    return false;
  }

  /**
   * This method is deprecated. It previously applied an upgrade to a weapon.
   * @returns The original, unmodified weapon.
   */
  purchaseUpgrade(weapon: Weapon, upgradeId: string): Weapon {
    console.warn('WeaponUpgradeManager.purchaseUpgrade is deprecated.');
    return weapon;
  }
}
