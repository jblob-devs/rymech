import { Shield, Zap } from 'lucide-react';
import { GameState } from '../types/game';
import { useEffect, useState, useRef } from 'react';

interface HUDProps {
  gameState: GameState;
  interactionText?: string;
}

export default function HUD({ gameState, interactionText }: HUDProps) {
  const { player, currentBiomeName } = gameState;
  const healthPercent = (player.health / player.maxHealth) * 100;
  const dashPercent = player.dashCooldown > 0 
    ? Math.max(0, (1 - player.dashCooldown / 1.5) * 100) 
    : 100;
  
  // Calculate blink charge percentages (each charge takes 4 seconds to recharge)
  const blinkChargePercents = player.blinkCooldowns.map(cooldown => 
    cooldown > 0 ? Math.max(0, (1 - cooldown / 4.0) * 100) : 100
  );

  const [notification, setNotification] = useState<{ name: string; key: number } | null>(null);
  const prevBiomeNameRef = useRef(currentBiomeName);

  useEffect(() => {
    if (currentBiomeName && currentBiomeName !== prevBiomeNameRef.current) {
      setNotification({ name: currentBiomeName, key: Date.now() });
      prevBiomeNameRef.current = currentBiomeName;
    }
  }, [currentBiomeName]);

  return (
    <>
      {notification && (
        <div
          key={notification.key}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-8 py-4 shadow-2xl shadow-cyan-500/10 text-center animate-fade-slide-down">
            <p className="text-sm text-slate-400 tracking-widest uppercase">Entering</p>
            <h2 className="text-3xl font-bold text-white tracking-wide">{notification.name}</h2>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 space-y-2 pointer-events-none select-none">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-2 shadow-lg w-52">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-slate-300 tracking-wide">HULL</span>
            <span className="text-[10px] text-slate-400 ml-auto">{Math.ceil(player.health)} / {player.maxHealth}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          
          {player.hasBlinkEquipped ? (
            <>
              <div className="flex items-center gap-2 mb-1.5 mt-2">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-slate-300 tracking-wide">BLINK</span>
                <span className="text-[10px] text-slate-400 ml-auto">{player.blinkCharges}/3</span>
              </div>
              <div className="flex gap-1">
                {blinkChargePercents.map((percent, index) => (
                  <div key={index} className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-100 ${
                        percent === 100
                          ? 'bg-gradient-to-r from-purple-500 to-purple-300 shadow-lg shadow-purple-400/50'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1.5 mt-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold text-slate-300 tracking-wide">DASH</span>
                <span className="text-[10px] text-slate-400 ml-auto">{dashPercent === 100 ? 'READY' : 'RECHARGING'}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-100 ${
                    dashPercent === 100
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-300 shadow-lg shadow-cyan-400/50'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${dashPercent}%` }}
                />
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-2 shadow-lg">
          <div className="text-xs text-slate-400 mb-1">EQUIPPED WEAPONS</div>
          <div className="space-y-1">
            {player.equippedWeapons.map((weapon, index) => (
              <div key={weapon.id}>
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    index === player.activeWeaponIndex
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <span className="font-bold">[{index + 1}]</span> {weapon.name}
                  {weapon.firingMode === 'auto' && (
                    <span className="ml-1 text-green-400 text-[10px]">AUTO</span>
                  )}
                  {weapon.firingMode === 'beam' && (
                    <span className="ml-1 text-yellow-400 text-[10px]">BEAM</span>
                  )}
                  {weapon.firingMode === 'charge' && (
                    <span className="ml-1 text-purple-400 text-[10px]">CHARGE</span>
                  )}
                </div>
                {index === player.activeWeaponIndex && weapon.firingMode === 'charge' && weapon.isCharging && (
                  <div className="mt-1 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-75"
                      style={{ width: `${((weapon.currentCharge || 0) / (weapon.chargeTime || 2.0)) * 100}%` }}
                    />
                  </div>
                )}
                {index === player.activeWeaponIndex && weapon.firingMode === 'beam' && weapon.beamMaxHeat && (
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">HEAT</span>
                      <span className={weapon.beamOverheated ? 'text-red-400 font-bold' : 'text-slate-400'}>
                        {weapon.beamOverheated ? 'OVERHEATED!' : `${Math.round((weapon.beamHeat || 0) / weapon.beamMaxHeat * 100)}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${
                          weapon.beamOverheated
                            ? 'bg-red-500'
                            : (weapon.beamHeat || 0) > weapon.beamMaxHeat * 0.8
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : 'bg-gradient-to-r from-green-500 to-yellow-500'
                        }`}
                        style={{ width: `${((weapon.beamHeat || 0) / weapon.beamMaxHeat) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {interactionText && (
        <div className="absolute bottom-8 left-4 pointer-events-none select-none">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/20 rounded px-3 py-1.5 shadow-lg">
            <p className="text-xs text-slate-300">
              {interactionText}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
