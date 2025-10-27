import { X, ShoppingCart, Package, Trash2, CheckCircle, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { GameState } from '../types/game';
import { useState } from 'react';
import { WeaponCrate, WeaponCrateSystem } from '../game/WeaponCrateSystem';
import { getRarityColor } from '../game/WeaponPerks';
import { PlayerInventory } from '../game/PlayerInventory';

interface UpgradeShopProps {
  gameState: GameState;
  inventory: PlayerInventory;
  onPurchaseCrate: () => void;
  onEquipWeapon: (weaponId: string) => void;
  onUnequipWeapon: (weaponId: string) => void;
  onDeleteWeapon: (weaponId: string) => void;
  onClose: () => void;
}

export default function UpgradeShop({
  gameState,
  inventory,
  onPurchaseCrate,
  onEquipWeapon,
  onUnequipWeapon,
  onDeleteWeapon,
  onClose
}: UpgradeShopProps) {
  const { player } = gameState;
  const [previewCrate, setPreviewCrate] = useState<WeaponCrate | null>(null);
  const crateSystem = new WeaponCrateSystem();
  const crateCost = crateSystem.getCrateCost();

  const handleGeneratePreview = () => {
    const crate = crateSystem.generateWeaponCrate();
    setPreviewCrate(crate);
  };

  const handlePurchase = () => {
    if (player.currency >= crateCost) {
      onPurchaseCrate();
      setPreviewCrate(null);
    }
  };

  const weapons = inventory.getWeapons();
  const equippedCount = weapons.filter((w) => w.equipped).length;
  const maxEquipped = inventory.getMaxEquipped();

  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName.split('-').map((word: string) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')];
    return Icon ? <Icon className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-cyan-500/30 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 flex items-center justify-between border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-cyan-300">WEAPON CRATE SHOP</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-4 py-2">
              <span className="text-yellow-300 font-bold text-lg">{player.currency} Credits</span>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-red-500/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
            >
              <X className="w-6 h-6 text-red-400" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
          <div className="bg-slate-800/50 border-2 border-cyan-500/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Purchase Weapon Crate
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Each crate contains a random weapon with 1-5 random perks. Preview before you buy!
            </p>

            {!previewCrate ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Package className="w-16 h-16 text-cyan-400 mb-4 opacity-50" />
                <p className="text-slate-400 mb-4">Generate a preview to see what you'll get</p>
                <button
                  onClick={handleGeneratePreview}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg font-bold transition-all shadow-lg"
                >
                  Generate Preview
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: previewCrate.weapon.color, boxShadow: `0 0 15px ${previewCrate.weapon.color}` }}
                      />
                      <div>
                        <h4 className="font-bold text-white text-lg">{previewCrate.weapon.name}</h4>
                        <p className="text-xs text-slate-400">{previewCrate.weapon.description}</p>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      previewCrate.weapon.firingMode === 'auto'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {previewCrate.weapon.firingMode.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                    <div className="bg-slate-800/50 p-2 rounded">
                      <div className="text-slate-400">Damage</div>
                      <div className="text-red-400 font-bold text-lg">{previewCrate.weapon.damage.toFixed(1)}</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <div className="text-slate-400">Fire Rate</div>
                      <div className="text-yellow-400 font-bold text-lg">{(1/previewCrate.weapon.fireRate).toFixed(1)}/s</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <div className="text-slate-400">Speed</div>
                      <div className="text-cyan-400 font-bold text-lg">{previewCrate.weapon.projectileSpeed.toFixed(1)}</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <div className="text-slate-400">Count</div>
                      <div className="text-green-400 font-bold text-lg">{previewCrate.weapon.projectileCount}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-bold text-cyan-300 mb-2">Perks ({previewCrate.perks.length})</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {previewCrate.perks.map((perk) => (
                        <div
                          key={perk.id}
                          className="bg-slate-800/30 border rounded p-2"
                          style={{ borderColor: getRarityColor(perk.rarity) }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div style={{ color: getRarityColor(perk.rarity) }}>
                              {renderIcon(perk.icon)}
                            </div>
                            <div className="font-bold text-xs" style={{ color: getRarityColor(perk.rarity) }}>
                              {perk.name}
                            </div>
                            <div className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold" style={{
                              backgroundColor: `${getRarityColor(perk.rarity)}20`,
                              color: getRarityColor(perk.rarity),
                              border: `1px solid ${getRarityColor(perk.rarity)}40`
                            }}>
                              {perk.rarity}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">{perk.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGeneratePreview}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-bold transition-all"
                  >
                    Re-Roll Preview
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={player.currency < crateCost}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${
                      player.currency >= crateCost
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {player.currency >= crateCost
                      ? `Purchase Crate - ${crateCost} Credits`
                      : 'Insufficient Credits'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
                <LucideIcons.Backpack className="w-5 h-5" />
                Your Arsenal ({weapons.length} weapons)
              </h3>
              <div className="text-sm text-slate-400">
                Equipped: <span className="text-cyan-400 font-bold">{equippedCount}/{maxEquipped}</span>
              </div>
            </div>

            {weapons.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No weapons yet. Purchase a crate to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weapons.map(({ weapon, equipped }) => (
                  <div
                    key={weapon.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      equipped
                        ? 'bg-cyan-900/20 border-cyan-500/50'
                        : 'bg-slate-900/30 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: weapon.color, boxShadow: `0 0 10px ${weapon.color}` }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-white text-sm truncate">{weapon.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{weapon.type}</p>
                        </div>
                      </div>
                      {equipped && (
                        <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mb-2 text-[10px]">
                      <div className="bg-slate-800/50 p-1 rounded text-center">
                        <div className="text-red-400 font-bold">{weapon.damage.toFixed(0)}</div>
                        <div className="text-slate-500">DMG</div>
                      </div>
                      <div className="bg-slate-800/50 p-1 rounded text-center">
                        <div className="text-yellow-400 font-bold">{(1/weapon.fireRate).toFixed(1)}</div>
                        <div className="text-slate-500">RoF</div>
                      </div>
                      <div className="bg-slate-800/50 p-1 rounded text-center">
                        <div className="text-cyan-400 font-bold">{weapon.projectileSpeed.toFixed(0)}</div>
                        <div className="text-slate-500">SPD</div>
                      </div>
                      <div className="bg-slate-800/50 p-1 rounded text-center">
                        <div className="text-green-400 font-bold">{weapon.projectileCount}</div>
                        <div className="text-slate-500">CNT</div>
                      </div>
                    </div>

                    {weapon.perks && weapon.perks.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {weapon.perks.slice(0, 2).map((perkId, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800/30 px-2 py-1 rounded text-[10px] text-cyan-300 border border-cyan-500/20"
                          >
                            {perkId}
                          </div>
                        ))}
                        {weapon.perks.length > 2 && (
                          <div className="text-[9px] text-slate-500 px-2">+{weapon.perks.length - 2} more</div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {equipped ? (
                        <button
                          onClick={() => onUnequipWeapon(weapon.id)}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
                        >
                          Unequip
                        </button>
                      ) : (
                        <button
                          onClick={() => onEquipWeapon(weapon.id)}
                          disabled={!inventory.canEquipMore()}
                          className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                            inventory.canEquipMore()
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Equip
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteWeapon(weapon.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
