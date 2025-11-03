import { useState } from 'react';
import { X, ArrowDown, ArrowUp, Package2 } from 'lucide-react';
import { Player, DroneType } from '../types/game';
import { VaultSystem } from '../game/VaultSystem';
import { PlayerInventory } from '../game/PlayerInventory';

interface VaultUIProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  vaultSystem: VaultSystem;
  inventory: PlayerInventory;
}

export function VaultUI({ isOpen, onClose, player, vaultSystem, inventory }: VaultUIProps) {
  const [selectedTab, setSelectedTab] = useState<'weapons' | 'drones' | 'resources'>('weapons');
  const [updateToken, setUpdateToken] = useState(0);

  if (!isOpen) return null;

  const forceUpdate = () => setUpdateToken(prev => prev + 1);

  const vaultWeapons = vaultSystem.getWeapons();
  const vaultDrones = vaultSystem.getDrones();
  const vaultResources = vaultSystem.getAllResources();
  
  const inventoryWeapons = inventory.getWeapons();
  const inventoryDrones = inventory.getDrones();

  const handleDepositWeapon = (weaponId: string) => {
    const weapon = inventoryWeapons.find(w => w.weapon.id === weaponId);
    if (weapon) {
      vaultSystem.addWeapon(weapon.weapon, false);
      inventory.removeWeapon(weaponId);
      forceUpdate();
    }
  };

  const handleWithdrawWeapon = (weaponId: string) => {
    const weapon = vaultSystem.removeWeapon(weaponId);
    if (weapon) {
      inventory.addWeapon(weapon.weapon);
      forceUpdate();
    }
  };

  const handleDepositDrone = (droneType: DroneType) => {
    const drone = inventoryDrones.find(d => d.droneType === droneType);
    if (drone && !drone.equipped) {
      vaultSystem.addDrone(droneType, false);
      inventory.removeDrone(droneType);
      forceUpdate();
    }
  };

  const handleWithdrawDrone = (droneType: DroneType) => {
    const drone = vaultSystem.removeDrone(droneType);
    if (drone) {
      inventory.addDrone(droneType);
      forceUpdate();
    }
  };

  const handleDepositResource = (resourceType: string, amount: number) => {
    const currentAmount = (player.resources as any)[resourceType] || 0;
    if (currentAmount >= amount) {
      vaultSystem.addResource(resourceType as any, amount);
      (player.resources as any)[resourceType] -= amount;
      forceUpdate();
    }
  };

  const handleWithdrawResource = (resourceType: string, amount: number) => {
    const vaultAmount = vaultSystem.getResource(resourceType as any);
    const actualAmount = Math.min(amount, vaultAmount);
    if (vaultSystem.removeResource(resourceType as any, actualAmount)) {
      (player.resources as any)[resourceType] = ((player.resources as any)[resourceType] || 0) + actualAmount;
      forceUpdate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border-2 border-purple-500 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <Package2 size={28} />
            Vault Storage
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedTab('weapons')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedTab === 'weapons'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Weapons
          </button>
          <button
            onClick={() => setSelectedTab('drones')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedTab === 'drones'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Drones
          </button>
          <button
            onClick={() => setSelectedTab('resources')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedTab === 'resources'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Resources
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border border-slate-700 rounded p-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Inventory</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedTab === 'weapons' && inventoryWeapons.map((w) => (
                <div key={w.weapon.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                  <span className="text-sm font-mono text-white truncate">{w.weapon.name}</span>
                  <button
                    onClick={() => handleDepositWeapon(w.weapon.id)}
                    className="bg-blue-600 hover:bg-blue-500 p-1 rounded"
                    title="Deposit to Vault"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              ))}
              {selectedTab === 'drones' && inventoryDrones.map((d) => (
                <div key={d.droneType} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                  <span className="text-sm font-mono text-white">{d.droneType}</span>
                  <button
                    onClick={() => handleDepositDrone(d.droneType)}
                    disabled={d.equipped}
                    className={`p-1 rounded ${
                      d.equipped
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                    title={d.equipped ? 'Unequip first' : 'Deposit to Vault'}
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              ))}
              {selectedTab === 'resources' && Object.entries(player.resources).map(([key, value]) => {
                if (value > 0) {
                  return (
                    <div key={key} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                      <span className="text-sm font-mono text-white">{key}: {value}</span>
                      <button
                        onClick={() => handleDepositResource(key, Math.min(10, value))}
                        className="bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs"
                      >
                        +10
                      </button>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          <div className="border border-purple-700 rounded p-4">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">Vault</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedTab === 'weapons' && vaultWeapons.map((w) => (
                <div key={w.weapon.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                  <span className="text-sm font-mono text-white truncate">{w.weapon.name}</span>
                  <button
                    onClick={() => handleWithdrawWeapon(w.weapon.id)}
                    className="bg-green-600 hover:bg-green-500 p-1 rounded"
                    title="Withdraw to Inventory"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              ))}
              {selectedTab === 'drones' && vaultDrones.map((d) => (
                <div key={d.droneType} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                  <span className="text-sm font-mono text-white">{d.droneType}</span>
                  <button
                    onClick={() => handleWithdrawDrone(d.droneType)}
                    className="bg-green-600 hover:bg-green-500 p-1 rounded"
                    title="Withdraw to Inventory"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              ))}
              {selectedTab === 'resources' && Array.from(vaultResources.entries()).map(([key, value]) => {
                if (value > 0) {
                  return (
                    <div key={key} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                      <span className="text-sm font-mono text-white">{key}: {value}</span>
                      <button
                        onClick={() => handleWithdrawResource(key, Math.min(10, value))}
                        className="bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-xs"
                      >
                        -10
                      </button>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-800 rounded border border-slate-700">
          <p className="text-sm text-slate-300">
            The vault persists between runs and deaths. Store your valuables here for safekeeping!
          </p>
        </div>
      </div>
    </div>
  );
}
