import { Weapon, Consumable, DroneType } from '../types/game';

export interface InventoryWeapon {
  weapon: Weapon;
  equipped: boolean;
}

export interface InventoryDrone {
  droneType: DroneType;
  equipped: boolean;
}

export class PlayerInventory {
  private weapons: InventoryWeapon[] = [];
  private drones: InventoryDrone[] = [];
  private consumables: Consumable[] = [];
  private readonly maxEquipped = 3;
  private readonly maxEquippedDrones = 2;

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

  addDrone(droneType: DroneType): void {
    const existingDrone = this.drones.find((d) => d.droneType === droneType);
    if (!existingDrone) {
      this.drones.push({
        droneType,
        equipped: false,
      });
    }
  }

  removeDrone(droneType: DroneType): void {
    this.drones = this.drones.filter((d) => d.droneType !== droneType);
  }

  getDrones(): InventoryDrone[] {
    return this.drones;
  }

  getEquippedDrones(): DroneType[] {
    return this.drones
      .filter((d) => d.equipped)
      .map((d) => d.droneType);
  }

  equipDrone(droneType: DroneType): boolean {
    const equippedCount = this.drones.filter((d) => d.equipped).length;

    if (equippedCount >= this.maxEquippedDrones) {
      return false;
    }

    const drone = this.drones.find((d) => d.droneType === droneType);
    if (drone && !drone.equipped) {
      drone.equipped = true;
      return true;
    }

    return false;
  }

  unequipDrone(droneType: DroneType): void {
    const drone = this.drones.find((d) => d.droneType === droneType);
    if (drone) {
      drone.equipped = false;
    }
  }

  isDroneEquipped(droneType: DroneType): boolean {
    const drone = this.drones.find((d) => d.droneType === droneType);
    return drone?.equipped || false;
  }

  getMaxEquippedDrones(): number {
    return this.maxEquippedDrones;
  }

  canEquipMoreDrones(): boolean {
    const equippedCount = this.drones.filter((d) => d.equipped).length;
    return equippedCount < this.maxEquippedDrones;
  }
}
