import { Weapon, DroneType, Consumable } from '../types/game';
import { PlayerInventory } from './PlayerInventory';
import { VaultSystem } from './VaultSystem';

export interface SaveData {
  version: string;
  timestamp: number;
  inventory: {
    weapons: Array<{ weapon: Weapon; equipped: boolean }>;
    drones: Array<{ droneType: DroneType; equipped: boolean }>;
    consumables: Consumable[];
  };
  vault: {
    weapons: Array<{ weapon: Weapon; equipped: boolean }>;
    drones: Array<{ droneType: DroneType; equipped: boolean }>;
    resources: Array<[string, number]>;
  };
  resources: {
    energy: number;
    coreDust: number;
    flux: number;
    geoShards: number;
    alloyFragments: number;
    singularityCore: number;
    cryoKelp: number;
    obsidianHeart: number;
    gloomRoot: number;
    resonantCrystal: number;
    voidEssence: number;
    bioluminescentPearl: number;
    sunpetalBloom: number;
    aetheriumShard: number;
    gravitonEssence: number;
    voidCore: number;
    crateKey: number;
  };
  currency: number;
  equippedWeaponIds: string[];
  equippedDroneTypes: DroneType[];
  activeRespawnAnchor?: string;
}

export class SaveSystem {
  private static readonly SAVE_KEY = 'shattered_expanse_save';
  private static readonly VERSION = '1.0.0';
  private autoSaveInterval: number | null = null;

  startAutoSave(saveCallback: () => void, intervalMs: number = 30000): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = window.setInterval(saveCallback, intervalMs);
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  save(
    inventory: PlayerInventory,
    vault: VaultSystem,
    resources: SaveData['resources'],
    currency: number,
    equippedWeaponIds: string[],
    equippedDroneTypes: DroneType[],
    activeRespawnAnchor?: string
  ): boolean {
    try {
      const vaultData = vault.exportData();
      const saveData: SaveData = {
        version: SaveSystem.VERSION,
        timestamp: Date.now(),
        inventory: {
          weapons: inventory.getWeapons(),
          drones: inventory.getDrones(),
          consumables: inventory.getConsumables(),
        },
        vault: {
          weapons: vaultData.weapons,
          drones: vaultData.drones,
          resources: Array.from(vaultData.resources.entries()),
        },
        resources,
        currency,
        equippedWeaponIds,
        equippedDroneTypes,
        activeRespawnAnchor,
      };

      const jsonData = JSON.stringify(saveData);
      localStorage.setItem(SaveSystem.SAVE_KEY, jsonData);
      console.log('[SaveSystem] Game saved successfully');
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to save game:', error);
      return false;
    }
  }

  load(): SaveData | null {
    try {
      const jsonData = localStorage.getItem(SaveSystem.SAVE_KEY);
      if (!jsonData) {
        console.log('[SaveSystem] No save data found');
        return null;
      }

      const saveData = JSON.parse(jsonData) as SaveData;
      
      // Version checking can be added here for migration
      if (saveData.version !== SaveSystem.VERSION) {
        console.warn('[SaveSystem] Save data version mismatch. Attempting to load anyway...');
      }

      console.log('[SaveSystem] Game loaded successfully');
      return saveData;
    } catch (error) {
      console.error('[SaveSystem] Failed to load game:', error);
      return null;
    }
  }

  exportToFile(): void {
    try {
      const jsonData = localStorage.getItem(SaveSystem.SAVE_KEY);
      if (!jsonData) {
        console.warn('[SaveSystem] No save data to export');
        return;
      }

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shattered_expanse_save_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('[SaveSystem] Save file exported successfully');
    } catch (error) {
      console.error('[SaveSystem] Failed to export save file:', error);
    }
  }

  importFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          const saveData = JSON.parse(jsonData) as SaveData;
          
          // Validate the save data structure
          if (!saveData.version || !saveData.inventory) {
            console.error('[SaveSystem] Invalid save file format');
            resolve(false);
            return;
          }

          localStorage.setItem(SaveSystem.SAVE_KEY, jsonData);
          console.log('[SaveSystem] Save file imported successfully');
          resolve(true);
        } catch (error) {
          console.error('[SaveSystem] Failed to import save file:', error);
          resolve(false);
        }
      };

      reader.onerror = () => {
        console.error('[SaveSystem] Failed to read save file');
        resolve(false);
      };

      reader.readAsText(file);
    });
  }

  deleteSave(): boolean {
    try {
      localStorage.removeItem(SaveSystem.SAVE_KEY);
      console.log('[SaveSystem] Save data deleted');
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to delete save data:', error);
      return false;
    }
  }

  hasSaveData(): boolean {
    return localStorage.getItem(SaveSystem.SAVE_KEY) !== null;
  }
}
