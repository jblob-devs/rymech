import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { Player, Consumable } from '../types/game';
import { CraftingSystem } from '../game/CraftingSystem';
import ResourceIcon from './ResourceIcon';
import PatternVisualizer from './PatternVisualizer';

interface CraftingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  craftingSystem: CraftingSystem;
  onUseConsumable: (consumableId: string) => void;
}

type ResourceType = keyof Player['resources'];

const RESOURCE_NAMES: Record<string, string> = {
  energy: 'Energy',
  coreDust: 'Core Dust',
  flux: 'Flux',
  geoShards: 'Geo Shards',
  alloyFragments: 'Alloy Fragments',
  singularityCore: 'Singularity Core',
  cryoKelp: 'Cryo Kelp',
  obsidianHeart: 'Obsidian Heart',
  gloomRoot: 'Gloom Root',
  resonantCrystal: 'Resonant Crystal',
  voidEssence: 'Void Essence',
  bioluminescentPearl: 'Bioluminescent Pearl',
  sunpetalBloom: 'Sunpetal Bloom',
  aetheriumShard: 'Aetherium Shard',
  gravitonEssence: 'Graviton Essence',
  crateKey: 'Crate Key',
};

const RESOURCE_COLORS: Record<string, string> = {
  energy: 'bg-blue-500',
  coreDust: 'bg-purple-500',
  flux: 'bg-cyan-500',
  geoShards: 'bg-amber-600',
  alloyFragments: 'bg-gray-500',
  singularityCore: 'bg-pink-500',
  cryoKelp: 'bg-teal-400',
  obsidianHeart: 'bg-red-900',
  gloomRoot: 'bg-indigo-700',
  resonantCrystal: 'bg-violet-400',
  voidEssence: 'bg-purple-900',
  bioluminescentPearl: 'bg-blue-300',
  sunpetalBloom: 'bg-yellow-400',
  aetheriumShard: 'bg-sky-400',
  gravitonEssence: 'bg-fuchsia-600',
  crateKey: 'bg-yellow-500',
};

export default function CraftingMenu({
  isOpen,
  onClose,
  player,
  craftingSystem,
  onUseConsumable,
}: CraftingMenuProps) {
  const [craftingGrid, setCraftingGrid] = useState<(string[] | null)[][]>([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [draggedResource, setDraggedResource] = useState<string | null>(null);

  if (!isOpen) return null;

  const discoveredRecipes = craftingSystem.getDiscoveredRecipes();

  const handleDragStart = (resource: string) => {
    setDraggedResource(resource);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (row: number, col: number) => {
    if (draggedResource) {
      const newGrid = craftingGrid.map((r) => [...r]);
      const currentCell = newGrid[row][col];
      if (currentCell === null) {
        newGrid[row][col] = [draggedResource];
      } else {
        newGrid[row][col] = [...currentCell, draggedResource];
      }
      setCraftingGrid(newGrid);
      setDraggedResource(null);
    }
  };

  const handleClearSlot = (row: number, col: number) => {
    const newGrid = craftingGrid.map((r) => [...r]);
    newGrid[row][col] = null;
    setCraftingGrid(newGrid);
  };

  const handleRemoveFromSlot = (row: number, col: number, index: number) => {
    const newGrid = craftingGrid.map((r) => [...r]);
    const currentCell = newGrid[row][col];
    if (currentCell) {
      const updated = currentCell.filter((_, i) => i !== index);
      newGrid[row][col] = updated.length > 0 ? updated : null;
      setCraftingGrid(newGrid);
    }
  };

  const handleCraft = () => {
    const result = craftingSystem.craftFromGrid(player, craftingGrid);
    if (result) {
      if (result.stackable) {
        const existingStack = player.consumables.find(
          (c) => c.name === result.name && c.stackable
        );
        if (existingStack) {
          existingStack.quantity = (existingStack.quantity || 1) + (result.quantity || 1);
        } else {
          player.consumables.push(result);
        }
      } else {
        player.consumables.push({ ...result, id: `${result.id}_${Date.now()}` });
      }
      setCraftingGrid([
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    }
  };

  const handleFillPattern = (recipeId: string) => {
    const pattern = craftingSystem.getRecipePattern(recipeId);
    if (pattern) {
      setCraftingGrid(pattern.map(row => row.map(cell => cell ? [...cell] : null)));
    }
  };

  const handleCraftRecipe = (recipeId: string) => {
    const result = craftingSystem.craftItem(player, recipeId);
    if (result) {
      if (result.stackable) {
        const existingStack = player.consumables.find(
          (c) => c.name === result.name && c.stackable
        );
        if (existingStack) {
          existingStack.quantity = (existingStack.quantity || 1) + (result.quantity || 1);
        } else {
          player.consumables.push(result);
        }
      } else {
        player.consumables.push({ ...result, id: `${result.id}_${Date.now()}` });
      }
    }
  };

  const availableResources = Object.entries(player.resources).filter(
    ([_, amount]) => amount > 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-4 border-cyan-500 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Package className="text-cyan-400" size={32} />
            <h2 className="text-3xl font-bold text-cyan-400">Crafting Station</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-3">Resources</h3>
            <div className="bg-gray-800 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
              {availableResources.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No resources available</p>
              ) : (
                availableResources.map(([resource, amount]) => (
                  <div
                    key={resource}
                    draggable
                    onDragStart={() => handleDragStart(resource)}
                    className="bg-gray-700 rounded p-3 flex items-center justify-between cursor-move hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ResourceIcon resourceType={resource} size={24} />
                      <span className="text-white font-medium">
                        {RESOURCE_NAMES[resource] || resource}
                      </span>
                    </div>
                    <span className="text-cyan-400 font-bold">{amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-3">Crafting Grid (3x3)</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {craftingGrid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(rowIndex, colIndex)}
                      className="aspect-square bg-gray-700 rounded border-2 border-gray-600 hover:border-cyan-500 transition-colors flex flex-wrap items-center justify-center p-1 relative gap-1"
                    >
                      {cell && cell.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-1 items-center justify-center">
                            {cell.map((resource, idx) => (
                              <div
                                key={idx}
                                className="relative group"
                                onClick={() => handleRemoveFromSlot(rowIndex, colIndex, idx)}
                              >
                                <div className="cursor-pointer hover:opacity-75 transition-opacity">
                                  <ResourceIcon resourceType={resource} size={cell.length === 1 ? 32 : 20} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleClearSlot(rowIndex, colIndex)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-600 text-xs">Drop</span>
                      )}
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={handleCraft}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded transition-colors"
              >
                Craft
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-3">Consumables</h3>
              <div className="bg-gray-800 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {player.consumables.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No consumables crafted yet
                  </p>
                ) : (
                  player.consumables.map((consumable, index) => (
                    <div
                      key={`${consumable.name}-${index}`}
                      className="bg-gray-700 rounded p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{consumable.name}</p>
                          {consumable.stackable && consumable.quantity && consumable.quantity > 1 && (
                            <span className="bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                              x{consumable.quantity}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{consumable.description}</p>
                      </div>
                      <button
                        onClick={() => onUseConsumable(consumable.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        Use
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-3">Discovered Recipes</h3>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {discoveredRecipes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No recipes discovered yet. Collect resources to discover recipes!
                </p>
              ) : (
                discoveredRecipes.map((recipe) => {
                  const canCraft = craftingSystem.canCraft(player, recipe.id);
                  return (
                    <div
                      key={recipe.id}
                      className="bg-gray-700 rounded p-4 border-2 border-gray-600"
                    >
                      <h4 className="text-white font-bold mb-2">{recipe.name}</h4>
                      <p className="text-gray-400 text-sm mb-3">{recipe.description}</p>
                      <div className="mb-3">
                        <p className="text-cyan-400 text-sm font-semibold mb-1">
                          Ingredients:
                        </p>
                        {recipe.ingredients.map((ingredient) => (
                          <div
                            key={ingredient.resource}
                            className="text-sm text-gray-300 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <ResourceIcon resourceType={ingredient.resource} size={16} />
                              <span>{RESOURCE_NAMES[ingredient.resource]}</span>
                            </div>
                            <span>
                              {player.resources[ingredient.resource as ResourceType]}/
                              {ingredient.amount}
                            </span>
                          </div>
                        ))}
                        {recipe.gridPattern && (
                          <div className="mt-2">
                            <p className="text-cyan-400 text-xs font-semibold mb-1">Pattern:</p>
                            <PatternVisualizer pattern={recipe.gridPattern} size={60} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleFillPattern(recipe.id)}
                          className="w-full py-2 rounded font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          Fill Pattern
                        </button>
                        <button
                          onClick={() => handleCraftRecipe(recipe.id)}
                          disabled={!canCraft}
                          className={`w-full py-2 rounded font-medium transition-colors ${
                            canCraft
                              ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {canCraft ? 'Craft' : 'Insufficient Resources'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
