import { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import { GameEngine } from './game/GameEngine';
import { GameState, Weapon } from './types/game';
import { X, Archive, ShoppingCart, FlaskConical, Users, Cpu } from 'lucide-react';
import Minimap from './components/Minimap';
import CraftingMenu from './components/CraftingMenu';
import TouchControls from './components/TouchControls';
import ConnectionMenu from './components/ConnectionMenu';
import { MultiplayerManager } from './game/MultiplayerManager';
import { DRONE_DEFINITIONS } from './game/DroneSystem';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameId = useRef<number>();
  const lastTime = useRef<number>(0);

  const [isInventoryOpen, setInventoryOpen] = useState(false);
  const [isCraftingOpen, setCraftingOpen] = useState(false);
  const [isAdminOpen, setAdminOpen] = useState(false);
  const [isAdminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [touchControlsVisible, setTouchControlsVisible] = useState(false);
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const touchShootRef = useRef({ x: 0, y: 0, active: false });
  
  const [isMultiplayerOpen, setMultiplayerOpen] = useState(false);
  const [multiplayerManager] = useState(() => new MultiplayerManager());
  const [multiplayerRole, setMultiplayerRole] = useState<'host' | 'client' | 'none'>('none');
  const [peerId, setPeerId] = useState('');
  const [connectionCount, setConnectionCount] = useState(0);
  const lastSyncTime = useRef(0);

  useEffect(() => {
    const engine = new GameEngine();
    gameEngineRef.current = engine;
    setGameState(engine.getState());
    lastTime.current = performance.now();

    multiplayerManager.onStateUpdate((state) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.applyMultiplayerState(state, multiplayerManager.getPeerId());
      }
    });

    multiplayerManager.onPlayerInput((input) => {
      if (gameEngineRef.current && multiplayerManager.getRole() === 'host') {
        gameEngineRef.current.updateRemotePlayerFromInput(input.playerId, input);
      }
    });

    multiplayerManager.onConnectionChange(() => {
      setConnectionCount(multiplayerManager.getConnectionCount());
    });

    multiplayerManager.onWorldInit((worldData) => {
      if (gameEngineRef.current) {
        console.log('Applying world state from host');
        gameEngineRef.current.applyWorldState(worldData);
      }
    });

    multiplayerManager.onClientConnected((peerId) => {
      if (gameEngineRef.current && multiplayerManager.getRole() === 'host') {
        console.log('Sending world state to new client:', peerId);
        const worldState = gameEngineRef.current.getWorldState();
        multiplayerManager.sendWorldInit(worldState, peerId);
      }
    });

    multiplayerManager.onPositionSync((playerId, position, velocity) => {
      if (gameEngineRef.current && multiplayerManager.getRole() === 'host') {
        gameEngineRef.current.syncRemotePlayerPosition(playerId, position, velocity);
      }
    });

    const gameLoop = (time: number) => {
      if (!gameEngineRef.current) return;
      const deltaTime = (time - lastTime.current) / 1000;
      lastTime.current = time;

      const role = multiplayerManager.getRole();
      
      if (role === 'host') {
        gameEngineRef.current.updateRemotePlayerPositions(deltaTime);
        gameEngineRef.current.update(deltaTime);
        
        if (time - lastSyncTime.current > 50) {
          const state = gameEngineRef.current.getMultiplayerState(multiplayerManager.getPeerId());
          multiplayerManager.broadcastGameState(state);
          lastSyncTime.current = time;
        }
      } else if (role === 'client') {
        if (multiplayerManager.isWorldInitialized()) {
          gameEngineRef.current.updateRemotePlayerPositions(deltaTime);
          gameEngineRef.current.update(deltaTime);

          const keys = Array.from(gameEngineRef.current.getKeys());
          const mousePos = gameEngineRef.current.getMousePos();
          const mouseDown = gameEngineRef.current.getMouseDown();
          const state = gameEngineRef.current.getState();
          const activeWeaponIndex = state.player.activeWeaponIndex;
          const username = localStorage.getItem('mp_username') || 'Player';

          multiplayerManager.sendPlayerInput({
            keys,
            mousePos,
            mouseDown,
            timestamp: Date.now(),
            playerId: multiplayerManager.getPeerId(),
            activeWeaponIndex,
            username,
          });

          if (time - lastSyncTime.current > 50) {
            multiplayerManager.sendPositionSync(state.player.position, state.player.velocity);
            lastSyncTime.current = time;
          }
        }
      } else {
        gameEngineRef.current.update(deltaTime);
      }

      setGameState({ ...gameEngineRef.current.getState() });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    engine.setTouchInput(touchMoveRef, touchShootRef);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameEngineRef.current) return;
      const key = e.key.toLowerCase();

      if (key === 'i') {
        setInventoryOpen(prev => !prev);
        gameEngineRef.current.togglePause();
        return;
      }
      if (key === 'c') {
        setCraftingOpen(prev => !prev);
        gameEngineRef.current.togglePause();
        return;
      }
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        gameEngineRef.current.dash();
      }
      if (key >= '1' && key <= '9') {
        gameEngineRef.current.switchWeapon(parseInt(key) - 1);
      }
      gameEngineRef.current.setKeys(prev => new Set(prev).add(key));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!gameEngineRef.current) return;
      const key = e.key.toLowerCase();
      gameEngineRef.current.setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(key);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleReset = () => {
    if (!gameEngineRef.current) return;
    
    const role = multiplayerManager.getRole();
    
    if (role === 'client') {
      const state = gameEngineRef.current.getState();
      const hostPlayer = state.remotePlayers.find(rp => rp.id === 'host');
      
      if (hostPlayer) {
        gameEngineRef.current.respawnPlayer(hostPlayer.player.position);
      } else {
        gameEngineRef.current.respawnPlayer();
      }
      
      const newState = gameEngineRef.current.getState();
      multiplayerManager.sendPositionSync(newState.player.position, newState.player.velocity);
    } else if (role === 'host') {
      const currentPos = gameEngineRef.current.getState().player.position;
      gameEngineRef.current.respawnPlayer(currentPos);
    } else {
      gameEngineRef.current.reset();
    }
    
    setInventoryOpen(false);
    setCraftingOpen(false);
  };

  const handleEquip = (weaponId: string) => {
    gameEngineRef.current?.equipWeapon(weaponId);
  };

  const handleUnequip = (weaponId: string) => {
    gameEngineRef.current?.unequipWeapon(weaponId);
  };

  const handleDelete = (weaponId: string) => {
    gameEngineRef.current?.deleteWeapon(weaponId);
  };

  const handleEquipDrone = (droneType: import('./types/game').DroneType) => {
    gameEngineRef.current?.equipDrone(droneType);
  };

  const handleUnequipDrone = (droneType: import('./types/game').DroneType) => {
    gameEngineRef.current?.unequipDrone(droneType);
  };

  const handleDeleteDrone = (droneType: import('./types/game').DroneType) => {
    gameEngineRef.current?.deleteDrone(droneType);
  };

  const handleUseConsumable = (consumableId: string) => {
    gameEngineRef.current?.useConsumable(consumableId);
  };

  const handleCreateGame = async () => {
    const id = await multiplayerManager.createGame();
    setPeerId(id);
    setMultiplayerRole('host');
    return id;
  };

  const handleJoinGame = async (hostId: string) => {
    await multiplayerManager.joinGame(hostId);
    setPeerId(multiplayerManager.getPeerId());
    setMultiplayerRole('client');
  };

  if (!gameState || !gameEngineRef.current) {
    return <div className="w-screen h-screen bg-gray-900 flex items-center justify-center text-white">Initializing Subsystems...</div>;
  }

  const inventory = gameEngineRef.current.getInventory();
  const allInventoryWeapons = inventory.getWeapons();
  const equippedWeapons = gameState.player.equippedWeapons;
  const equippedWeaponIds = new Set(equippedWeapons.map(w => w.id));
  const stowedWeapons = allInventoryWeapons.filter(invW => !equippedWeaponIds.has(invW.weapon.id));
  
  const allInventoryDrones = inventory.getDrones();
  const equippedDrones = allInventoryDrones.filter(d => d.equipped);
  const stowedDrones = allInventoryDrones.filter(d => !d.equipped);
  const maxEquippedDrones = inventory.getMaxEquippedDrones();

  return (
    <div className="relative w-screen h-screen bg-gray-900 flex items-center justify-center text-white overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <GameCanvas
        gameState={gameState}
        camera={gameEngineRef.current.getCamera()}
        obstacles={gameEngineRef.current.getObstacles()}
        resourceNodes={gameEngineRef.current.getResourceNodes()}
        portals={gameEngineRef.current.getPortals()}
        extractionPoints={gameEngineRef.current.getExtractionPoints()}
        chests={gameEngineRef.current.getChests()}
        biomeFeatures={gameEngineRef.current.getBiomeFeatures()}
        gameEngineRef={gameEngineRef}
      />
      <HUD
        gameState={gameState}
        interactionText={
          gameEngineRef.current?.getActiveOminousTendril()?.canInteract
            ? 'Press [F] to Awaken the Void Subdivider'
            : undefined
        }
      />

      <div className="absolute top-4 right-4 flex flex-col items-end space-y-4 z-10">
        <Minimap
          gameState={gameState}
          chests={gameEngineRef.current.getChests()}
          extractionPoints={gameEngineRef.current.getExtractionPoints()}
          portals={gameEngineRef.current.getPortals()}
        />
        <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3 shadow-lg w-64">
            <h2 className="text-xs font-bold text-slate-300 mb-2">SYSTEMS</h2>
            <div className="flex flex-col space-y-2">
                <button
                    onClick={() => {
                        setInventoryOpen(prev => !prev);
                        gameEngineRef.current?.togglePause();
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-700/70 rounded-md text-sm font-semibold transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-cyan-300" />
                        <span>INVENTORY</span>
                    </div>
                    <span className="text-xs bg-slate-700 px-2 py-1 rounded">I</span>
                </button>
                <button
                    onClick={() => {
                        setCraftingOpen(prev => !prev);
                        gameEngineRef.current?.togglePause();
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-700/70 rounded-md text-sm font-semibold transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-cyan-300" />
                        <span>CRAFTING</span>
                    </div>
                    <span className="text-xs bg-slate-700 px-2 py-1 rounded">C</span>
                </button>
                <button
                    onClick={() => setMultiplayerOpen(prev => !prev)}
                    className="flex items-center justify-between w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-700/70 rounded-md text-sm font-semibold transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-300" />
                        <span>MULTIPLAYER</span>
                    </div>
                    {multiplayerRole !== 'none' && <span className="text-xs bg-green-700 px-2 py-1 rounded">{connectionCount + 1}P</span>}
                </button>
                <button
                    onClick={() => setAdminOpen(prev => !prev)}
                    className="flex items-center justify-between w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-700/70 rounded-md text-sm font-semibold transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-cyan-300" />
                        <span>ADMIN</span>
                    </div>
                    {isAdminMode && <span className="text-xs bg-green-700 px-2 py-1 rounded">ACTIVE</span>}
                </button>
            </div>
        </div>
      </div>

      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
          <h1 className="text-6xl font-bold text-red-500 mb-4">SYSTEM FAILURE</h1>
          <p className="text-xl mb-8">Final Score: {gameState.score}</p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg shadow-lg hover:bg-cyan-400 transition-colors"
          >
            REINITIALIZE
          </button>
        </div>
      )}

      {isInventoryOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-40 p-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>          <button
              onClick={() => {
                  setInventoryOpen(false);
                  gameEngineRef.current?.togglePause();
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-50"
          >
              <X size={28} />
          </button>
          <h1 className="text-4xl font-bold text-cyan-300 mb-6 tracking-wide">INVENTORY</h1>
          <div className="w-full max-w-6xl h-[80vh] grid grid-cols-4 gap-6">
            <div className="col-span-1 bg-slate-900/80 border border-cyan-500/30 rounded-lg p-4 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">EQUIPPED</h2>
              <div className="space-y-3">
                {equippedWeapons.map(w => (
                  <WeaponCard key={w.id} weapon={w} onAction={handleUnequip} actionLabel="Unequip" />
                ))}
                {equippedWeapons.length < inventory.getMaxEquipped() && Array.from({ length: inventory.getMaxEquipped() - equippedWeapons.length }).map((_, i) => (
                  <div key={i} className="h-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-600">
                    EMPTY SLOT
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <h2 className="text-xl font-semibold text-slate-300 mb-3">RESOURCES</h2>
                <div className="space-y-2 text-xs">
                  {[
                    { name: 'Energy', value: Math.floor(gameState.player.resources.energy), color: '#60a5fa' },
                    { name: 'Core Dust', value: Math.floor(gameState.player.resources.coreDust), color: '#a78bfa' },
                    { name: 'Flux', value: Math.floor(gameState.player.resources.flux), color: '#c084fc' },
                    { name: 'Geo Shards', value: Math.floor(gameState.player.resources.geoShards), color: '#22d3ee' },
                    { name: 'Alloy Fragments', value: Math.floor(gameState.player.resources.alloyFragments), color: '#94a3b8' },
                    { name: 'Singularity Core', value: Math.floor(gameState.player.resources.singularityCore), color: '#fbbf24' },
                    { name: 'Cryo Kelp', value: Math.floor(gameState.player.resources.cryoKelp), color: '#7dd3fc' },
                    { name: 'Obsidian Heart', value: Math.floor(gameState.player.resources.obsidianHeart), color: '#fb923c' },
                    { name: 'Gloom Root', value: Math.floor(gameState.player.resources.gloomRoot), color: '#a3e635' },
                    { name: 'Resonant Crystal', value: Math.floor(gameState.player.resources.resonantCrystal), color: '#22d3ee' },
                    { name: 'Void Essence', value: Math.floor(gameState.player.resources.voidEssence), color: '#c084fc' },
                    { name: 'Bioluminescent Pearl', value: Math.floor(gameState.player.resources.bioluminescentPearl), color: '#5eead4' },
                    { name: 'Sunpetal Bloom', value: Math.floor(gameState.player.resources.sunpetalBloom), color: '#fde047' },
                    { name: 'Aetherium Shard', value: Math.floor(gameState.player.resources.aetheriumShard), color: '#a5b4fc' },
                  ].filter(r => r.value > 0).map(resource => (
                    <div key={resource.name} className="flex items-center justify-between">
                      <span className="text-slate-400">{resource.name}</span>
                      <span className="font-bold" style={{ color: resource.color }}>{resource.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <h2 className="text-xl font-semibold text-slate-300 mb-3">DRONES</h2>
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 mb-2">
                    Equipped: <span className="text-cyan-400 font-bold">{equippedDrones.length}/{maxEquippedDrones}</span>
                  </div>
                  {equippedDrones.map(invDrone => (
                    <DroneCard key={invDrone.droneType} droneType={invDrone.droneType} onAction={handleUnequipDrone} actionLabel="Unequip" />
                  ))}
                  {equippedDrones.length < maxEquippedDrones && Array.from({ length: maxEquippedDrones - equippedDrones.length }).map((_, i) => (
                    <div key={i} className="h-16 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-600 text-xs">
                      EMPTY SLOT
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-3 bg-slate-900/80 border border-cyan-500/30 rounded-lg p-4 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">STOWED</h2>
              <div className="grid grid-cols-2 gap-3">
                {stowedWeapons.map(invW => (
                  <WeaponCard key={invW.weapon.id} weapon={invW.weapon} onAction={inventory.canEquipMore() ? handleEquip : handleDelete} actionLabel={inventory.canEquipMore() ? "Equip" : "Delete"} />
                ))}
              </div>
              {stowedDrones.length > 0 && (
                <>
                  <h2 className="text-2xl font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2 mt-6">STOWED DRONES</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {stowedDrones.map(invDrone => (
                      <DroneCard key={invDrone.droneType} droneType={invDrone.droneType} onAction={inventory.canEquipMoreDrones() ? handleEquipDrone : handleDeleteDrone} actionLabel={inventory.canEquipMoreDrones() ? "Equip" : "Delete"} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="mt-4 text-slate-400 text-sm">Press 'I' to close</p>
        </div>
      )}

      {isAdminOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-40 p-8">
          <button
            onClick={() => setAdminOpen(false)}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-50"
          >
            <X size={28} />
          </button>
          <div className="bg-slate-900/90 border-2 border-red-500/50 rounded-lg p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold text-red-400 mb-6 tracking-wide text-center">ADMIN PANEL</h1>

            {!isAdminMode ? (
              <div>
                <p className="text-slate-300 mb-4">Enter admin password:</p>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && adminPassword === 'Windshark88affirm!') {
                      setAdminMode(true);
                      setAdminPassword('');
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white mb-4"
                  placeholder="Password"
                />
                <button
                  onClick={() => {
                    if (adminPassword === 'Windshark88affirm!') {
                      setAdminMode(true);
                      setAdminPassword('');
                    } else {
                      alert('Incorrect password');
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold text-white transition-colors"
                >
                  UNLOCK
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <span className="text-green-400 font-bold">ADMIN MODE ACTIVE</span>
                </div>

                <div>
                  <h3 className="text-slate-300 font-semibold mb-2">Spawn Enemies</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => gameEngineRef.current?.spawnAdminEnemy('grunt')}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                    >
                      Grunt
                    </button>
                    <button
                      onClick={() => gameEngineRef.current?.spawnAdminEnemy('tank')}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                    >
                      Tank
                    </button>
                    <button
                      onClick={() => gameEngineRef.current?.spawnAdminEnemy('speedy')}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                    >
                      Speedy
                    </button>
                    <button
                      onClick={() => gameEngineRef.current?.spawnAdminWeapon()}
                      className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded text-sm transition-colors"
                    >
                      Weapon Crate
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-300 font-semibold mb-2">Spawn Weapons</h3>
                  <button
                    onClick={() => gameEngineRef.current?.spawnAdminWeapon()}
                    className="w-full px-3 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-sm transition-colors"
                  >
                    Spawn Random Weapon Crate
                  </button>
                </div>

                <div>
                  <h3 className="text-slate-300 font-semibold mb-2">Resource Cheats</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => gameEngineRef.current?.addAdminResources(100)}
                      className="px-3 py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-sm transition-colors"
                    >
                      +100 Resources
                    </button>
                    <button
                      onClick={() => gameEngineRef.current?.addAdminCurrency(500)}
                      className="px-3 py-2 bg-green-700 hover:bg-green-600 rounded text-sm transition-colors"
                    >
                      +500 Currency
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  <h3 className="text-slate-300 font-semibold mb-2">Add Drones to Inventory</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['assault_drone', 'shield_drone', 'repair_drone', 'scout_drone', 'plasma_drone', 'cryo_drone', 'explosive_drone', 'emp_drone', 'sniper_drone', 'laser_drone', 'swarm_drone', 'gravity_drone', 'medic_drone', 'tesla_drone', 'void_drone'] as const).map((droneType) => (
                      <button
                        key={droneType}
                        onClick={() => gameEngineRef.current?.spawnAdminDrone(droneType)}
                        className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                      >
                        {droneType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setAdminMode(false)}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold text-white transition-colors"
                >
                  LOCK ADMIN MODE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <CraftingMenu
        isOpen={isCraftingOpen}
        onClose={() => {
          setCraftingOpen(false);
          gameEngineRef.current?.togglePause();
        }}
        player={gameState.player}
        craftingSystem={gameEngineRef.current.getCraftingSystem()}
        onUseConsumable={handleUseConsumable}
      />

      <TouchControls
        onMove={(x, y) => {
          touchMoveRef.current = { x, y };
        }}
        onShoot={(x, y, active) => {
          touchShootRef.current = { x, y, active };
        }}
        onDash={() => gameEngineRef.current?.dash()}
        onInteract={() => {
          if (gameEngineRef.current) {
            gameEngineRef.current.setKeys(prev => new Set(prev).add('f'));
            setTimeout(() => {
              gameEngineRef.current?.setKeys(prev => {
                const newKeys = new Set(prev);
                newKeys.delete('f');
                return newKeys;
              });
            }, 100);
          }
        }}
        onWeaponSwitch={(index) => gameEngineRef.current?.switchWeapon(index)}
        weaponCount={gameState.player.equippedWeapons.length}
        isVisible={touchControlsVisible}
        onToggleVisibility={() => setTouchControlsVisible(!touchControlsVisible)}
      />

      <ConnectionMenu
        isOpen={isMultiplayerOpen}
        onClose={() => setMultiplayerOpen(false)}
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        isConnected={multiplayerRole !== 'none'}
        connectionCount={connectionCount}
        peerId={peerId}
        role={multiplayerRole}
        remotePlayers={gameState.remotePlayers}
        onTeleportToPlayer={(targetPeerId) => gameEngineRef.current?.teleportToPlayer(targetPeerId)}
        onTeleportPlayerToMe={(targetPeerId) => gameEngineRef.current?.teleportRemotePlayerToMe(targetPeerId)}
        pvpEnabled={gameState.pvpEnabled}
        onTogglePvP={() => gameEngineRef.current?.togglePvP()}
      />
    </div>
  );
}

interface WeaponCardProps {
  weapon: Weapon;
  onAction: (id: string) => void;
  actionLabel: string;
}

const WeaponCard = ({ weapon, onAction, actionLabel }: WeaponCardProps) => {
  const [hoveredPerk, setHoveredPerk] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'epic': return '#a855f7';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handlePerkHover = (perk: any, e: React.MouseEvent) => {
    setHoveredPerk(perk);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex flex-col justify-between relative">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-base" style={{ color: weapon.color }}>{weapon.name}</h3>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded font-medium">{weapon.type}</span>
        </div>
        <p className="text-xs text-slate-400 mb-2">{weapon.description}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
          <p><span className="text-slate-400">Damage:</span> <span className="font-medium">{weapon.damage.toFixed(1)}</span></p>
          <p><span className="text-slate-400">Fire Rate:</span> <span className="font-medium">{(1 / weapon.fireRate).toFixed(2)}/s</span></p>
          <p><span className="text-slate-400">Projectiles:</span> <span className="font-medium">{weapon.projectileCount}</span></p>
          <p><span className="text-slate-400">Speed:</span> <span className="font-medium">{weapon.projectileSpeed.toFixed(1)}</span></p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-300 mb-1.5">Perks:</h4>
          <div className="flex flex-wrap gap-1.5">
            {weapon.perks && weapon.perks.length > 0 ? (
              weapon.perks.map((perk: any, idx: number) => (
                <span
                  key={perk.id || idx}
                  className="text-xs px-2 py-1 rounded font-medium cursor-help"
                  style={{
                    backgroundColor: `${getRarityColor(perk.rarity)}20`,
                    color: getRarityColor(perk.rarity),
                    border: `1px solid ${getRarityColor(perk.rarity)}50`
                  }}
                  onMouseEnter={(e) => handlePerkHover(perk, e)}
                  onMouseLeave={() => setHoveredPerk(null)}
                >
                  {perk.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">None</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onAction(weapon.id)}
        className="mt-3 w-full text-center py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-semibold transition-colors"
      >
        {actionLabel}
      </button>
      {hoveredPerk && (
        <div
          className="fixed z-[100] bg-slate-900 border-2 border-cyan-500/50 rounded-lg p-3 shadow-2xl max-w-xs pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-bold"
              style={{ color: getRarityColor(hoveredPerk.rarity) }}
            >
              {hoveredPerk.name}
            </span>
            <span
              className="text-xs uppercase px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${getRarityColor(hoveredPerk.rarity)}20`,
                color: getRarityColor(hoveredPerk.rarity),
              }}
            >
              {hoveredPerk.rarity}
            </span>
          </div>
          <p className="text-xs text-slate-300">{hoveredPerk.description}</p>
        </div>
      )}
    </div>
  );
};

interface DroneCardProps {
  droneType: import('./types/game').DroneType;
  onAction: (droneType: import('./types/game').DroneType) => void;
  actionLabel: string;
}

const DroneCard = ({ droneType, onAction, actionLabel }: DroneCardProps) => {
  const droneDef = DRONE_DEFINITIONS[droneType];
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 flex flex-col justify-between relative">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: droneDef.color, boxShadow: `0 0 10px ${droneDef.color}` }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm text-white truncate">{droneDef.name}</h4>
            </div>
          </div>
          <Cpu className="w-3 h-3 text-cyan-400 flex-shrink-0" />
        </div>
        <p className="text-[10px] text-slate-400 mb-2">{droneDef.description}</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] mb-2">
          <p><span className="text-slate-500">HP:</span> <span className="font-medium text-green-400">{droneDef.health}</span></p>
          <p><span className="text-slate-500">DMG:</span> <span className="font-medium text-red-400">{droneDef.damage}</span></p>
          <p><span className="text-slate-500">Range:</span> <span className="font-medium text-cyan-400">{droneDef.detectionRadius}</span></p>
          <p><span className="text-slate-500">Fire:</span> <span className="font-medium text-yellow-400">{(1/droneDef.fireRate).toFixed(1)}/s</span></p>
        </div>
        {droneDef.passiveEffect && (
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded px-2 py-1 mb-1.5">
            <p className="text-[9px] text-cyan-300 font-medium">
              <span className="text-slate-400">Passive:</span> {droneDef.passiveEffect}
            </p>
          </div>
        )}
        {droneDef.activeEffect && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded px-2 py-1">
            <p className="text-[9px] text-purple-300 font-medium">
              <span className="text-slate-400">Active:</span> {droneDef.activeEffect}
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() => onAction(droneType)}
        className="mt-2 w-full text-center py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs font-semibold transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
};

export default App;
