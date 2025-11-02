import { Weapon, DroneType } from '../types/game';
import { InventoryWeapon, InventoryDrone } from './PlayerInventory';
import type { ResourceType } from './WorldGeneration';

export interface VaultData {
  weapons: InventoryWeapon[];
  drones: InventoryDrone[];
  resources: Map<ResourceType, number>;
}

export class VaultSystem {
  private weapons: InventoryWeapon[] = [];
  private drones: InventoryDrone[] = [];
  private resources: Map<ResourceType, number> = new Map();

  addWeapon(weapon: Weapon, equipped: boolean = false): void {
    this.weapons.push({ weapon, equipped });
  }

  removeWeapon(weaponId: string): InventoryWeapon | undefined {
    const index = this.weapons.findIndex(w => w.weapon.id === weaponId);
    if (index !== -1) {
      return this.weapons.splice(index, 1)[0];
    }
    return undefined;
  }

  getWeapons(): InventoryWeapon[] {
    return this.weapons;
  }

  addDrone(droneType: DroneType, equipped: boolean = false): void {
    this.drones.push({ droneType, equipped });
  }

  removeDrone(droneType: DroneType): InventoryDrone | undefined {
    const index = this.drones.findIndex(d => d.droneType === droneType);
    if (index !== -1) {
      return this.drones.splice(index, 1)[0];
    }
    return undefined;
  }

  getDrones(): InventoryDrone[] {
    return this.drones;
  }

  addResource(resourceType: ResourceType, amount: number): void {
    const current = this.resources.get(resourceType) || 0;
    this.resources.set(resourceType, current + amount);
  }

  removeResource(resourceType: ResourceType, amount: number): boolean {
    const current = this.resources.get(resourceType) || 0;
    if (current >= amount) {
      this.resources.set(resourceType, current - amount);
      return true;
    }
    return false;
  }

  getResource(resourceType: ResourceType): number {
    return this.resources.get(resourceType) || 0;
  }

  getAllResources(): Map<ResourceType, number> {
    return new Map(this.resources);
  }

  clear(): void {
    this.weapons = [];
    this.drones = [];
    this.resources.clear();
  }

  exportData(): VaultData {
    return {
      weapons: [...this.weapons],
      drones: [...this.drones],
      resources: new Map(this.resources),
    };
  }

  importData(data: VaultData): void {
    this.weapons = [...data.weapons];
    this.drones = [...data.drones];
    this.resources = new Map(data.resources);
  }
}
