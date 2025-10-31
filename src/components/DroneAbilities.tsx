import React from 'react';
import { Drone, DroneType, GameState } from '../types/game';
import { DRONE_DEFINITIONS } from '../game/DroneSystem';

interface DroneAbilitiesProps {
  drones: Drone[];
  onManualActivate: (droneType: DroneType) => void;
  gameState?: GameState;
  onDetonateExplosive?: () => void;
}

const MANUAL_KEYS = ['Q', 'E', 'R'] as const;

export const DroneAbilities: React.FC<DroneAbilitiesProps> = ({ drones, onManualActivate, gameState, onDetonateExplosive }) => {
  const hasActiveExplosiveProjectile = gameState && (gameState as any).activeExplosiveProjectile;
  const manualDrones = drones.filter(drone => {
    const def = DRONE_DEFINITIONS[drone.droneType];
    return def.activeTrigger === 'manual' && def.activeEffect;
  });

  const autoDrones = drones.filter(drone => {
    const def = DRONE_DEFINITIONS[drone.droneType];
    return def.activeTrigger !== 'manual' && def.activeEffect;
  });

  const getTriggerDisplay = (trigger?: string) => {
    switch (trigger) {
      case 'shoot': return 'On Shoot';
      case 'dash': return 'On Dash';
      case 'weaponSwap': return 'On Swap';
      case 'takeDamage': return 'On Damage';
      default: return '';
    }
  };

  const formatTime = (seconds: number) => {
    return seconds > 0 ? seconds.toFixed(1) + 's' : 'Ready';
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 space-y-2 pointer-events-none">
      {manualDrones.map((drone, index) => {
        const def = DRONE_DEFINITIONS[drone.droneType];
        const key = MANUAL_KEYS[index] || '?';
        const onCooldown = drone.activeEffectTimer > 0;
        const isActive = drone.isActiveEffectActive;
        
        return (
          <div
            key={drone.id}
            className={`
              bg-gray-900/90 border-2 rounded-lg p-3 w-[200px]
              ${isActive ? 'border-green-400 shadow-lg shadow-green-400/50' : 
                onCooldown ? 'border-gray-600' : 'border-cyan-400 shadow-md shadow-cyan-400/30'}
              transition-all duration-200
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className={`
                    w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${onCooldown ? 'bg-gray-700 text-gray-400' : 'bg-cyan-500 text-black'}
                  `}
                >
                  {key}
                </div>
                <span className="text-white font-semibold text-sm truncate">{def.name}</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-300 mb-1 break-words">{def.activeEffect}</div>
            
            <div className="flex items-center justify-between text-xs">
              {isActive && drone.activeEffectRemainingTime ? (
                <span className="text-green-400 font-bold">
                  Active: {formatTime(drone.activeEffectRemainingTime)}
                </span>
              ) : onCooldown ? (
                <span className="text-orange-400">
                  CD: {formatTime(drone.activeEffectTimer)}
                </span>
              ) : (
                <span className="text-cyan-400 font-bold">READY</span>
              )}
            </div>
          </div>
        );
      })}

      {hasActiveExplosiveProjectile && onDetonateExplosive && (
        <div className="pointer-events-auto">
          <button
            onClick={onDetonateExplosive}
            className="
              bg-orange-600 hover:bg-orange-500 active:bg-orange-700
              border-2 border-orange-400 rounded-lg p-3 w-[200px]
              shadow-lg shadow-orange-400/50
              transition-all duration-200
              animate-pulse
            "
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm bg-white text-orange-600">
                  X
                </div>
                <span className="text-white font-semibold text-sm">DETONATE</span>
              </div>
            </div>
            <div className="text-xs text-orange-100">
              Press X or click to detonate the giant explosive projectile
            </div>
          </button>
        </div>
      )}

      {autoDrones.length > 0 && (
        <div className="border-t-2 border-gray-700 pt-2 mt-2">
          {autoDrones.map((drone) => {
            const def = DRONE_DEFINITIONS[drone.droneType];
            const onCooldown = drone.activeEffectTimer > 0;
            const isActive = drone.isActiveEffectActive;
            
            return (
              <div
                key={drone.id}
                className={`
                  bg-gray-900/80 border rounded-lg p-2 mb-2 w-[200px]
                  ${isActive ? 'border-green-400' : onCooldown ? 'border-gray-700' : 'border-blue-400'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold text-xs truncate flex-1 mr-2">{def.name}</span>
                  <span className="text-blue-300 text-[10px] px-1.5 py-0.5 bg-blue-900/50 rounded flex-shrink-0">
                    {getTriggerDisplay(def.activeTrigger)}
                  </span>
                </div>
                
                <div className="text-[10px] text-gray-400 mb-1 break-words">{def.activeEffect}</div>
                
                {isActive && drone.activeEffectRemainingTime ? (
                  <span className="text-green-400 font-bold text-[10px]">
                    Active: {formatTime(drone.activeEffectRemainingTime)}
                  </span>
                ) : onCooldown ? (
                  <span className="text-orange-400 text-[10px]">
                    CD: {formatTime(drone.activeEffectTimer)}
                  </span>
                ) : (
                  <span className="text-blue-400 text-[10px]">Ready</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
