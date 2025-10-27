import { CraftingRecipe, Consumable, Player } from '../types/game';

export class CraftingSystem {
  private recipes: CraftingRecipe[] = [];
  private discoveredRecipes: Set<string> = new Set();

  constructor() {
    this.initializeRecipes();
  }

  private initializeRecipes(): void {
    const healingPackRecipe: CraftingRecipe = {
      id: 'healing_pack',
      name: 'Minor Healing Pack',
      description: 'Restores 10 HP when used',
      ingredients: [
        { resource: 'energy', amount: 3 },
        { resource: 'coreDust', amount: 1 },
        { resource: 'flux', amount: 2 },
      ],
      output: {
        type: 'consumable',
        item: {
          id: 'healing_pack',
          name: 'Minor Healing Pack',
          description: 'Restores 10 HP',
          effect: 'heal',
          value: 10,
          stackable: true,
        },
      },
      gridPattern: [
        [['energy', 'energy'], ['coreDust'], ['energy']],
        [['flux'], null, ['flux']],
        [null, null, null],
      ],
      patternDescription: 'Row 1: [Energy x2][Core Dust][Energy] | Row 2: [Flux][Empty][Flux]',
    };

    const mediumHealingPackRecipe: CraftingRecipe = {
      id: 'medium_healing_pack',
      name: 'Medium Healing Pack',
      description: 'Restores 25 HP when used',
      ingredients: [
        { resource: 'energy', amount: 3 },
        { resource: 'coreDust', amount: 3 },
        { resource: 'flux', amount: 3 },
      ],
      output: {
        type: 'consumable',
        item: {
          id: 'medium_healing_pack',
          name: 'Medium Healing Pack',
          description: 'Restores 25 HP',
          effect: 'heal',
          value: 25,
          stackable: true,
        },
      },
      gridPattern: [
        [['flux'], ['coreDust'], ['flux']],
        [['energy'], ['coreDust'], ['energy']],
        [['flux'], ['coreDust'], ['energy']],
      ],
      patternDescription: 'Row 1: [Flux][Core Dust][Flux] | Row 2: [Energy][Core Dust][Energy] | Row 3: [Flux][Core Dust][Energy]',
    };

    const largeHealingPackRecipe: CraftingRecipe = {
      id: 'large_healing_pack',
      name: 'Large Healing Pack',
      description: 'Restores 50 HP when used',
      ingredients: [
        { resource: 'energy', amount: 5 },
        { resource: 'coreDust', amount: 5 },
        { resource: 'alloyFragments', amount: 3 },
        { resource: 'geoShards', amount: 2 },
      ],
      output: {
        type: 'consumable',
        item: {
          id: 'large_healing_pack',
          name: 'Large Healing Pack',
          description: 'Restores 50 HP',
          effect: 'heal',
          value: 50,
          stackable: true,
        },
      },
      gridPattern: [
        [['geoShards'], ['alloyFragments'], ['geoShards']],
        [['energy'], ['coreDust', 'coreDust'], ['energy']],
        [['energy'], ['alloyFragments'], ['energy']],
      ],
      patternDescription: 'Row 1: [Geo Shards][Alloy][Geo Shards] | Row 2: [Energy][Core Dust x2][Energy] | Row 3: [Energy][Alloy][Energy]',
    };

    const energyBoostRecipe: CraftingRecipe = {
      id: 'energy_boost',
      name: 'Energy Boost',
      description: 'Restores 5 HP over time',
      ingredients: [
        { resource: 'energy', amount: 8 },
        { resource: 'flux', amount: 2 },
      ],
      output: {
        type: 'consumable',
        item: {
          id: 'energy_boost',
          name: 'Energy Boost',
          description: 'Restores 5 HP',
          effect: 'heal',
          value: 5,
          stackable: true,
        },
      },
      gridPattern: [
        [['energy'], ['energy'], ['energy']],
        [['energy'], ['flux'], ['energy']],
        [['energy'], ['flux'], ['energy']],
      ],
      patternDescription: 'Row 1: [Energy][Energy][Energy] | Row 2: [Energy][Flux][Energy] | Row 3: [Energy][Flux][Energy]',
    };

    const shieldPackRecipe: CraftingRecipe = {
      id: 'shield_pack',
      name: 'Shield Pack',
      description: 'Provides temporary shield (Coming Soon)',
      ingredients: [
        { resource: 'alloyFragments', amount: 5 },
        { resource: 'geoShards', amount: 3 },
        { resource: 'flux', amount: 4 },
      ],
      output: {
        type: 'consumable',
        item: {
          id: 'shield_pack',
          name: 'Shield Pack',
          description: 'Adds +10 temporary HP',
          effect: 'heal',
          value: 10,
          stackable: true,
        },
      },
      gridPattern: [
        [['alloyFragments'], ['geoShards'], ['alloyFragments']],
        [['flux'], ['geoShards'], ['flux']],
        [['alloyFragments'], ['flux', 'flux'], ['alloyFragments']],
      ],
      patternDescription: 'Row 1: [Alloy][Geo Shards][Alloy] | Row 2: [Flux][Geo Shards][Flux] | Row 3: [Alloy][Flux x2][Alloy]',
    };

    const biomeElixirRecipe: CraftingRecipe = {
      id: 'biome_elixir',
      name: 'Biome Elixir',
      description: 'Restores 15 HP using rare biome resources',
      ingredients: [
        { resource: 'cryoKelp', amount: 2 },
        { resource: 'obsidianHeart', amount: 1 },
        { resource: 'gloomRoot', amount: 2 },
      ],
      output: {
        type: 'consumable',
        item: {
          id: 'biome_elixir',
          name: 'Biome Elixir',
          description: 'Restores 15 HP',
          effect: 'heal',
          value: 15,
          stackable: true,
        },
      },
      gridPattern: [
        [['cryoKelp'], null, ['cryoKelp']],
        [null, ['obsidianHeart'], null],
        [['gloomRoot'], null, ['gloomRoot']],
      ],
      patternDescription: 'Row 1: [Cryo Kelp][Empty][Cryo Kelp] | Row 2: [Empty][Obsidian Heart][Empty] | Row 3: [Gloom Root][Empty][Gloom Root]',
    };

    const crateKeyRecipe: CraftingRecipe = {
      id: 'crate_key',
      name: 'Crate Key',
      description: 'Unlocks locked crates',
      ingredients: [
        { resource: 'alloyFragments', amount: 3 },
        { resource: 'geoShards', amount: 2 },
        { resource: 'energy', amount: 5 },
      ],
      output: {
        type: 'consumable',
        item: {
          id: 'crate_key_item',
          name: 'Crate Key',
          description: 'Used to unlock locked crates',
          effect: 'key',
          value: 1,
          stackable: true,
        },
      },
      gridPattern: [
        [null, ['alloyFragments'], null],
        [['geoShards'], ['alloyFragments'], ['geoShards']],
        [['energy', 'energy'], ['alloyFragments'], ['energy', 'energy', 'energy']],
      ],
      patternDescription: 'Row 1: [Empty][Alloy][Empty] | Row 2: [Geo][Alloy][Geo] | Row 3: [Energy x2][Alloy][Energy x3]',
    };

    this.recipes.push(
      healingPackRecipe,
      mediumHealingPackRecipe,
      largeHealingPackRecipe,
      energyBoostRecipe,
      shieldPackRecipe,
      biomeElixirRecipe,
      crateKeyRecipe
    );
  }

  checkDiscoveredRecipes(player: Player): void {
    for (const recipe of this.recipes) {
      if (!this.discoveredRecipes.has(recipe.id)) {
        if (this.hasRequiredResources(player, recipe)) {
          this.discoveredRecipes.add(recipe.id);
        }
      }
    }
  }

  private hasRequiredResources(player: Player, recipe: CraftingRecipe): boolean {
    return recipe.ingredients.every((ingredient) => {
      const resourceAmount = player.resources[ingredient.resource as keyof typeof player.resources];
      return resourceAmount >= ingredient.amount;
    });
  }

  canCraft(player: Player, recipeId: string): boolean {
    const recipe = this.recipes.find((r) => r.id === recipeId);
    if (!recipe) return false;
    return this.hasRequiredResources(player, recipe);
  }

  craftItem(player: Player, recipeId: string): Consumable | null {
    const recipe = this.recipes.find((r) => r.id === recipeId);
    if (!recipe || !this.canCraft(player, recipeId)) {
      return null;
    }

    for (const ingredient of recipe.ingredients) {
      const resourceKey = ingredient.resource as keyof typeof player.resources;
      (player.resources[resourceKey] as number) -= ingredient.amount;
    }

    const baseItem = recipe.output.item;

    if (baseItem.effect === 'key') {
      player.resources.crateKey += 1;
      return null;
    }

    return { ...baseItem, id: baseItem.id, quantity: 1 };
  }

  craftFromGrid(player: Player, grid: (string[] | null)[][]): Consumable | null {
    for (const recipe of this.recipes) {
      if (this.matchesPattern(grid, recipe.gridPattern)) {
        return this.craftItem(player, recipe.id);
      }
    }
    return null;
  }

  private matchesPattern(grid: (string[] | null)[][], pattern: (string[] | null)[][]): boolean {
    if (grid.length !== pattern.length) return false;

    for (let row = 0; row < grid.length; row++) {
      if (grid[row].length !== pattern[row].length) return false;
      for (let col = 0; col < grid[row].length; col++) {
        const gridCell = grid[row][col];
        const patternCell = pattern[row][col];

        if (patternCell === null) {
          if (gridCell !== null && gridCell.length > 0) return false;
        } else if (gridCell === null || gridCell.length === 0) {
          return false;
        } else {
          const sortedGrid = [...gridCell].sort();
          const sortedPattern = [...patternCell].sort();
          if (sortedGrid.length !== sortedPattern.length) return false;
          for (let i = 0; i < sortedGrid.length; i++) {
            if (sortedGrid[i] !== sortedPattern[i]) return false;
          }
        }
      }
    }
    return true;
  }

  getRecipePattern(recipeId: string): (string[] | null)[][] | null {
    const recipe = this.recipes.find((r) => r.id === recipeId);
    return recipe ? recipe.gridPattern : null;
  }

  getDiscoveredRecipes(): CraftingRecipe[] {
    return this.recipes.filter((recipe) => this.discoveredRecipes.has(recipe.id));
  }

  getAllRecipes(): CraftingRecipe[] {
    return this.recipes;
  }

  isRecipeDiscovered(recipeId: string): boolean {
    return this.discoveredRecipes.has(recipeId);
  }
}
