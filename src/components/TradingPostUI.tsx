import { useState } from 'react';
import { Shrine } from '../game/TradingPostSystem';
import { DollarSign, Package, X, Swords, ShoppingBag, Trash2 } from 'lucide-react';
import { Weapon } from '../types/game';

interface ShrineUIProps {
  shrine: Shrine | null;
  playerCurrency: number;
  playerResources: any;
  playerWeapons?: Weapon[];
  onRoll: () => void;
  onTrade?: (fromResource: string, toResource: string) => void;
  onSellWeapon?: (weaponId: string) => void;
  onClose: () => void;
}

export default function TradingPostUI({
  shrine,
  playerCurrency,
  playerResources,
  playerWeapons = [],
  onRoll,
  onTrade,
  onSellWeapon,
  onClose,
}: ShrineUIProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [rolledWeapon, setRolledWeapon] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'weapons' | 'trading' | 'sell'>('weapons');

  if (!shrine) return null;

  const canAfford = playerCurrency >= shrine.rollCost;
  const showWeapons = shrine.shrineType === 'weapon' || shrine.shrineType === 'mixed';
  const showTrading = shrine.shrineType === 'trading' || shrine.shrineType === 'mixed';

  const handleRoll = () => {
    if (!canAfford || isRolling) return;

    setIsRolling(true);
    const result = onRoll();
    setRolledWeapon(result);

    setTimeout(() => {
      setIsRolling(false);
    }, 500);
  };

  const calculateWeaponValue = (weapon: Weapon): number => {
    let value = 50;
    if (weapon.perks) {
      weapon.perks.forEach((perk: any) => {
        switch (perk.rarity) {
          case 'legendary': value += 100; break;
          case 'epic': value += 60; break;
          case 'rare': value += 30; break;
          case 'common': value += 10; break;
        }
      });
    }
    return value;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#fbbf24';
      case 'rare':
        return '#a78bfa';
      case 'common':
        return '#94a3b8';
      default:
        return '#ffffff';
    }
  };

  const getShrineTitle = () => {
    if (shrine.shrineType === 'weapon') return 'Weapon Shrine';
    if (shrine.shrineType === 'trading') return 'Trading Shrine';
    return 'Mystic Shrine';
  };

  const getShrineIcon = () => {
    if (shrine.shrineType === 'weapon') return <Swords className="w-6 h-6" style={{ color: shrine.crystalColor }} />;
    if (shrine.shrineType === 'trading') return <ShoppingBag className="w-6 h-6" style={{ color: shrine.crystalColor }} />;
    return <Package className="w-6 h-6" style={{ color: shrine.crystalColor }} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
      <div className="bg-slate-900 border-2 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl" style={{ borderColor: `${shrine.crystalColor}80`, boxShadow: `0 0 30px ${shrine.crystalColor}40` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getShrineIcon()}
            <h2 className="text-2xl font-bold text-white">{getShrineTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {shrine.shrineType === 'mixed' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('weapons')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'weapons'
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={activeTab === 'weapons' ? { backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor } : {}}
            >
              <Swords className="w-4 h-4 inline mr-2" />
              Weapons
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'sell'
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={activeTab === 'sell' ? { backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor } : {}}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Sell
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'trading'
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={activeTab === 'trading' ? { backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor } : {}}
            >
              <ShoppingBag className="w-4 h-4 inline mr-2" />
              Trading
            </button>
          </div>
        )}

        {showWeapons && shrine.shrineType !== 'mixed' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('weapons')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'weapons'
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={activeTab === 'weapons' ? { backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor } : {}}
            >
              <Swords className="w-4 h-4 inline mr-2" />
              Roll
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'sell'
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={activeTab === 'sell' ? { backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor } : {}}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Sell
            </button>
          </div>
        )}

        <div className="mb-6">
          {(showWeapons && (shrine.shrineType !== 'mixed' || activeTab === 'weapons')) && (
            <>
              <p className="text-slate-400 text-sm mb-4">
                Channel the shrine's energy to summon a random weapon from this biome's arsenal. Each biome offers unique powers!
              </p>

              {rolledWeapon && (
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-2 rounded-lg p-4 mb-4 animate-pulse-once" style={{ borderColor: shrine.crystalColor }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-6 h-6" style={{ color: shrine.crystalColor }} />
                    <h3 className="text-lg font-bold text-white">You Rolled:</h3>
                  </div>
                  <div className="bg-slate-900/80 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white" style={{ color: rolledWeapon.color }}>{rolledWeapon.name}</span>
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded">{rolledWeapon.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-2">
                      <div>Damage: <span className="font-bold">{rolledWeapon.damage}</span></div>
                      <div>Fire Rate: <span className="font-bold">{rolledWeapon.fireRate.toFixed(2)}</span></div>
                      <div>Speed: <span className="font-bold">{rolledWeapon.projectileSpeed}</span></div>
                      <div>Count: <span className="font-bold">{rolledWeapon.projectileCount}</span></div>
                    </div>
                    {rolledWeapon.perks && rolledWeapon.perks.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400">Perks:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rolledWeapon.perks.map((perk: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${getRarityColor(perk.rarity)}20`,
                                color: getRarityColor(perk.rarity),
                              }}
                            >
                              {perk.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setRolledWeapon(null)}
                    className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-300 font-semibold">Roll Cost</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    <span className="text-xl font-bold text-yellow-300">{shrine.rollCost}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Your Currency</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    <span className="text-xl font-bold text-yellow-300">{playerCurrency}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-slate-300 font-semibold mb-3">Available Weapons</h3>
                <div className="space-y-2">
                  {shrine.availableWeapons.map((roll, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-900/50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: roll.weapon.color }}
                        />
                        <span className="text-slate-200">{roll.weapon.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold uppercase px-2 py-1 rounded"
                          style={{
                            backgroundColor: `${getRarityColor(roll.rarity)}20`,
                            color: getRarityColor(roll.rarity),
                          }}
                        >
                          {roll.rarity}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {Math.round((roll.weight / shrine.availableWeapons.reduce((sum, r) => sum + r.weight, 0)) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(showTrading && (shrine.shrineType !== 'mixed' || activeTab === 'trading')) && (
            <>
              <p className="text-slate-400 text-sm mb-4">
                Exchange materials at this shrine. Trade common resources for rare ones!
              </p>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-slate-300 font-semibold mb-3">Material Trading</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/50 rounded">
                    <div className="text-slate-300 mb-2">Trade 10 Energy → 1 Core Dust</div>
                    <button
                      onClick={() => onTrade?.('energy', 'coreDust')}
                      disabled={!playerResources || playerResources.energy < 10}
                      className="w-full py-2 px-4 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor }}
                    >
                      Trade (Have: {playerResources?.energy || 0})
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded">
                    <div className="text-slate-300 mb-2">Trade 5 Core Dust → 1 Flux</div>
                    <button
                      onClick={() => onTrade?.('coreDust', 'flux')}
                      disabled={!playerResources || playerResources.coreDust < 5}
                      className="w-full py-2 px-4 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor }}
                    >
                      Trade (Have: {playerResources?.coreDust || 0})
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded">
                    <div className="text-slate-300 mb-2">Trade 3 Flux → 1 Alloy Fragment</div>
                    <button
                      onClick={() => onTrade?.('flux', 'alloyFragments')}
                      disabled={!playerResources || playerResources.flux < 3}
                      className="w-full py-2 px-4 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: `${shrine.crystalColor}40`, color: shrine.crystalColor }}
                    >
                      Trade (Have: {playerResources?.flux || 0})
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sell' && (
            <>
              <p className="text-slate-400 text-sm mb-4">
                Sell weapons you don't need for currency. Price is based on weapon rarity and perks!
              </p>

              {rolledWeapon && (
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-2 rounded-lg p-4 mb-4 animate-pulse-once" style={{ borderColor: shrine.crystalColor }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-6 h-6" style={{ color: shrine.crystalColor }} />
                    <h3 className="text-lg font-bold text-white">You Rolled:</h3>
                  </div>
                  <div className="bg-slate-900/80 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white" style={{ color: rolledWeapon.color }}>{rolledWeapon.name}</span>
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded">{rolledWeapon.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-2">
                      <div>Damage: <span className="font-bold">{rolledWeapon.damage}</span></div>
                      <div>Fire Rate: <span className="font-bold">{rolledWeapon.fireRate.toFixed(2)}</span></div>
                      <div>Speed: <span className="font-bold">{rolledWeapon.projectileSpeed}</span></div>
                      <div>Count: <span className="font-bold">{rolledWeapon.projectileCount}</span></div>
                    </div>
                    {rolledWeapon.perks && rolledWeapon.perks.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400">Perks:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rolledWeapon.perks.map((perk: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${getRarityColor(perk.rarity)}20`,
                                color: getRarityColor(perk.rarity),
                              }}
                            >
                              {perk.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setRolledWeapon(null)}
                    className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="text-slate-300 font-semibold mb-3">Your Weapons</h3>
                {playerWeapons.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No weapons to sell</p>
                ) : (
                  <div className="space-y-2">
                    {playerWeapons.map((weapon) => {
                      const value = calculateWeaponValue(weapon);
                      return (
                        <div
                          key={weapon.id}
                          className="flex items-center justify-between p-3 bg-slate-900/50 rounded hover:bg-slate-900/70 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: weapon.color }}
                              />
                              <span className="text-slate-200 font-semibold">{weapon.name}</span>
                              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">{weapon.type}</span>
                            </div>
                            {weapon.perks && weapon.perks.length > 0 && (
                              <div className="flex flex-wrap gap-1 ml-5">
                                {weapon.perks.map((perk: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${getRarityColor(perk.rarity)}15`,
                                      color: getRarityColor(perk.rarity),
                                    }}
                                  >
                                    {perk.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onSellWeapon?.(weapon.id)}
                            className="ml-3 px-4 py-2 rounded font-semibold text-sm transition-all flex items-center gap-2 hover:scale-105"
                            style={{
                              backgroundColor: `${shrine.crystalColor}30`,
                              color: shrine.crystalColor,
                              border: `1px solid ${shrine.crystalColor}50`,
                            }}
                          >
                            <DollarSign className="w-4 h-4" />
                            Sell {value}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {(showWeapons && (shrine.shrineType !== 'mixed' || activeTab === 'weapons')) && (
          <div className="flex gap-3">
            <button
              onClick={handleRoll}
              disabled={!canAfford || isRolling}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-all ${
                !canAfford || isRolling
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : ''
              }`}
              style={canAfford && !isRolling ? {
                background: `linear-gradient(to right, ${shrine.crystalColor}, ${shrine.crystalColor}dd)`,
                color: 'white',
                boxShadow: `0 4px 12px ${shrine.crystalColor}50`
              } : {}}
            >
              {isRolling ? 'Channeling...' : 'Channel Shrine'}
            </button>
            <button
              onClick={onClose}
              className="py-3 px-6 rounded-lg font-bold text-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {(showTrading && shrine.shrineType === 'trading') && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="py-3 px-6 rounded-lg font-bold text-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {shrine.shrineType === 'mixed' && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="py-3 px-6 rounded-lg font-bold text-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {showWeapons && (shrine.shrineType !== 'mixed' || activeTab === 'weapons') && !canAfford && (
          <p className="text-red-400 text-sm text-center mt-3">
            Not enough currency to roll
          </p>
        )}
      </div>
    </div>
  );
}
