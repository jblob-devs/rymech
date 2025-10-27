import { Weapon, Consumable } from '../types/game';

export interface InventoryWeapon {
  weapon: Weapon;
  equipped: boolean;
}

export class PlayerInventory {
  private weapons: InventoryWeapon[] = [];
  private consumables: Consumable[] = [];
  private readonly maxEquipped = 3;

  addWeapon(weapon: Weapon): void {
    this.weapons.push({
      weapon,
      equipped: false,
    });
  }

  removeWeapon(weaponId: string): void {
    this.weapons = this.weapons.filter((w) => w.weapon.id !== weaponId);
  }

  getWeapons(): InventoryWeapon[] {
    return this.weapons;
  }

  getEquippedWeapons(): Weapon[] {
    return this.weapons
      .filter((w) => w.equipped)
      .map((w) => w.weapon);
  }

  equipWeapon(weaponId: string): boolean {
    const equippedCount = this.weapons.filter((w) => w.equipped).length;

    if (equippedCount >= this.maxEquipped) {
      return false;
    }

    const weapon = this.weapons.find((w) => w.weapon.id === weaponId);
    if (weapon && !weapon.equipped) {
      weapon.equipped = true;
      return true;
    }

    return false;
  }

  unequipWeapon(weaponId: string): void {
    const weapon = this.weapons.find((w) => w.weapon.id === weaponId);
    if (weapon) {
      weapon.equipped = false;
    }
  }

  isWeaponEquipped(weaponId: string): boolean {
    const weapon = this.weapons.find((w) => w.weapon.id === weaponId);
    return weapon?.equipped || false;
  }

  getMaxEquipped(): number {
    return this.maxEquipped;
  }

  canEquipMore(): boolean {
    const equippedCount = this.weapons.filter((w) => w.equipped).length;
    return equippedCount < this.maxEquipped;
  }

  addConsumable(consumable: Consumable): void {
    if (consumable.stackable) {
      const existingStack = this.consumables.find(
        (c) => c.name === consumable.name && c.stackable
      );
      if (existingStack) {
        existingStack.quantity = (existingStack.quantity || 1) + (consumable.quantity || 1);
        return;
      }
      this.consumables.push({ ...consumable, quantity: consumable.quantity || 1 });
    } else {
      this.consumables.push({ ...consumable, id: `${consumable.id}_${Date.now()}` });
    }
  }

  removeConsumable(consumableId: string): void {
    const index = this.consumables.findIndex((c) => c.id === consumableId);
    if (index !== -1) {
      const consumable = this.consumables[index];
      if (consumable.stackable && consumable.quantity && consumable.quantity > 1) {
        consumable.quantity -= 1;
      } else {
        this.consumables.splice(index, 1);
      }
    }
  }

  getConsumables(): Consumable[] {
    return this.consumables;
  }

  getConsumable(consumableId: string): Consumable | undefined {
    return this.consumables.find((c) => c.id === consumableId);
  }
}
