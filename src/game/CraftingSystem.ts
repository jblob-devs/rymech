import { CraftingRecipe, Consumable, Player, DroneType } from '../types/game';

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

    const assaultDroneRecipe: CraftingRecipe = {
      id: 'assault_drone_recipe',
      name: 'Assault Drone',
      description: 'Aggressive drone that fires rapid projectiles',
      ingredients: [
        { resource: 'energy', amount: 15 },
        { resource: 'alloyFragments', amount: 8 },
        { resource: 'coreDust', amount: 10 },
      ],
      output: {
        type: 'drone',
        droneType: 'assault_drone',
      },
      gridPattern: [
        [['alloyFragments'], ['coreDust'], ['alloyFragments']],
        [['energy', 'energy', 'energy'], ['coreDust', 'coreDust'], ['energy', 'energy', 'energy']],
        [['alloyFragments'], ['coreDust'], ['alloyFragments']],
      ],
      patternDescription: 'Row 1: [Alloy][Core Dust][Alloy] | Row 2: [Energy x3][Core Dust x2][Energy x3] | Row 3: [Alloy][Core Dust][Alloy]',
    };

    const shieldDroneRecipe: CraftingRecipe = {
      id: 'shield_drone_recipe',
      name: 'Shield Drone',
      description: 'Defensive drone that absorbs damage',
      ingredients: [
        { resource: 'energy', amount: 12 },
        { resource: 'geoShards', amount: 10 },
        { resource: 'alloyFragments', amount: 10 },
      ],
      output: {
        type: 'drone',
        droneType: 'shield_drone',
      },
      gridPattern: [
        [['geoShards'], ['alloyFragments'], ['geoShards']],
        [['energy', 'energy'], ['alloyFragments', 'alloyFragments'], ['energy', 'energy']],
        [['geoShards'], ['energy', 'energy'], ['geoShards']],
      ],
      patternDescription: 'Row 1: [Geo][Alloy][Geo] | Row 2: [Energy x2][Alloy x2][Energy x2] | Row 3: [Geo][Energy x2][Geo]',
    };

    const repairDroneRecipe: CraftingRecipe = {
      id: 'repair_drone_recipe',
      name: 'Repair Drone',
      description: 'Support drone that repairs player health',
      ingredients: [
        { resource: 'energy', amount: 10 },
        { resource: 'coreDust', amount: 8 },
        { resource: 'cryoKelp', amount: 3 },
      ],
      output: {
        type: 'drone',
        droneType: 'repair_drone',
      },
      gridPattern: [
        [['cryoKelp'], null, ['cryoKelp']],
        [['energy', 'energy'], ['coreDust', 'coreDust'], ['energy', 'energy']],
        [['coreDust'], ['cryoKelp'], ['coreDust']],
      ],
      patternDescription: 'Row 1: [Cryo Kelp][Empty][Cryo Kelp] | Row 2: [Energy x2][Core Dust x2][Energy x2] | Row 3: [Core Dust][Cryo Kelp][Core Dust]',
    };

    const scoutDroneRecipe: CraftingRecipe = {
      id: 'scout_drone_recipe',
      name: 'Scout Drone',
      description: 'Fast drone with extended detection',
      ingredients: [
        { resource: 'energy', amount: 8 },
        { resource: 'flux', amount: 12 },
        { resource: 'coreDust', amount: 6 },
      ],
      output: {
        type: 'drone',
        droneType: 'scout_drone',
      },
      gridPattern: [
        [['flux'], ['coreDust'], ['flux']],
        [['energy'], ['flux', 'flux'], ['energy']],
        [['flux'], ['energy', 'energy', 'energy', 'energy'], ['flux']],
      ],
      patternDescription: 'Row 1: [Flux][Core Dust][Flux] | Row 2: [Energy][Flux x2][Energy] | Row 3: [Flux][Energy x4][Flux]',
    };

    const plasmaDroneRecipe: CraftingRecipe = {
      id: 'plasma_drone_recipe',
      name: 'Plasma Drone',
      description: 'Fires piercing plasma bolts',
      ingredients: [
        { resource: 'energy', amount: 18 },
        { resource: 'flux', amount: 15 },
        { resource: 'voidEssence', amount: 5 },
      ],
      output: {
        type: 'drone',
        droneType: 'plasma_drone',
      },
      gridPattern: [
        [['voidEssence'], ['flux'], ['voidEssence']],
        [['energy', 'energy', 'energy'], ['flux', 'flux'], ['energy', 'energy', 'energy']],
        [['voidEssence'], ['flux', 'flux', 'flux'], ['voidEssence']],
      ],
      patternDescription: 'Row 1: [Void Essence][Flux][Void Essence] | Row 2: [Energy x3][Flux x2][Energy x3] | Row 3: [Void Essence][Flux x3][Void Essence]',
    };

    const cryoDroneRecipe: CraftingRecipe = {
      id: 'cryo_drone_recipe',
      name: 'Cryo Drone',
      description: 'Slows enemies with freezing projectiles',
      ingredients: [
        { resource: 'energy', amount: 12 },
        { resource: 'cryoKelp', amount: 8 },
        { resource: 'resonantCrystal', amount: 4 },
      ],
      output: {
        type: 'drone',
        droneType: 'cryo_drone',
      },
      gridPattern: [
        [['cryoKelp'], ['resonantCrystal'], ['cryoKelp']],
        [['energy', 'energy'], ['cryoKelp'], ['energy', 'energy']],
        [['cryoKelp'], ['resonantCrystal'], ['cryoKelp']],
      ],
      patternDescription: 'Row 1: [Cryo Kelp][Resonant Crystal][Cryo Kelp] | Row 2: [Energy x2][Cryo Kelp][Energy x2] | Row 3: [Cryo Kelp][Resonant Crystal][Cryo Kelp]',
    };

    const explosiveDroneRecipe: CraftingRecipe = {
      id: 'explosive_drone_recipe',
      name: 'Explosive Drone',
      description: 'Launches explosive rounds',
      ingredients: [
        { resource: 'energy', amount: 15 },
        { resource: 'obsidianHeart', amount: 6 },
        { resource: 'alloyFragments', amount: 10 },
      ],
      output: {
        type: 'drone',
        droneType: 'explosive_drone',
      },
      gridPattern: [
        [['obsidianHeart'], ['alloyFragments'], ['obsidianHeart']],
        [['energy', 'energy'], ['obsidianHeart'], ['energy', 'energy']],
        [['alloyFragments'], ['energy', 'energy', 'energy'], ['alloyFragments']],
      ],
      patternDescription: 'Row 1: [Obsidian Heart][Alloy][Obsidian Heart] | Row 2: [Energy x2][Obsidian Heart][Energy x2] | Row 3: [Alloy][Energy x3][Alloy]',
    };

    const medicDroneRecipe: CraftingRecipe = {
      id: 'medic_drone_recipe',
      name: 'Medic Drone',
      description: 'Advanced healing drone',
      ingredients: [
        { resource: 'energy', amount: 20 },
        { resource: 'bioluminescentPearl', amount: 8 },
        { resource: 'sunpetalBloom', amount: 5 },
      ],
      output: {
        type: 'drone',
        droneType: 'medic_drone',
      },
      gridPattern: [
        [['sunpetalBloom'], ['bioluminescentPearl'], ['sunpetalBloom']],
        [['energy', 'energy', 'energy'], ['bioluminescentPearl', 'bioluminescentPearl'], ['energy', 'energy', 'energy']],
        [['sunpetalBloom'], ['bioluminescentPearl'], ['sunpetalBloom']],
      ],
      patternDescription: 'Row 1: [Sunpetal Bloom][Pearl][Sunpetal Bloom] | Row 2: [Energy x3][Pearl x2][Energy x3] | Row 3: [Sunpetal Bloom][Pearl][Sunpetal Bloom]',
    };

    const empDroneRecipe: CraftingRecipe = {
      id: 'emp_drone_recipe',
      name: 'EMP Drone',
      description: 'Disrupts enemy shields and systems',
      ingredients: [
        { resource: 'energy', amount: 14 },
        { resource: 'flux', amount: 10 },
        { resource: 'singularityCore', amount: 4 },
      ],
      output: {
        type: 'drone',
        droneType: 'emp_drone',
      },
      gridPattern: [
        [['singularityCore'], ['flux'], ['singularityCore']],
        [['energy', 'energy'], ['flux', 'flux'], ['energy', 'energy']],
        [['singularityCore'], ['energy', 'energy', 'energy'], ['singularityCore']],
      ],
      patternDescription: 'Row 1: [Singularity Core][Flux][Singularity Core] | Row 2: [Energy x2][Flux x2][Energy x2] | Row 3: [Singularity Core][Energy x3][Singularity Core]',
    };

    const sniperDroneRecipe: CraftingRecipe = {
      id: 'sniper_drone_recipe',
      name: 'Sniper Drone',
      description: 'Precise long-range shots',
      ingredients: [
        { resource: 'energy', amount: 16 },
        { resource: 'resonantCrystal', amount: 8 },
        { resource: 'alloyFragments', amount: 12 },
      ],
      output: {
        type: 'drone',
        droneType: 'sniper_drone',
      },
      gridPattern: [
        [['resonantCrystal'], ['alloyFragments'], ['resonantCrystal']],
        [['energy', 'energy'], ['resonantCrystal'], ['energy', 'energy']],
        [['alloyFragments'], ['resonantCrystal'], ['alloyFragments']],
      ],
      patternDescription: 'Row 1: [Resonant Crystal][Alloy][Resonant Crystal] | Row 2: [Energy x2][Resonant Crystal][Energy x2] | Row 3: [Alloy][Resonant Crystal][Alloy]',
    };

    const laserDroneRecipe: CraftingRecipe = {
      id: 'laser_drone_recipe',
      name: 'Laser Drone',
      description: 'Continuous laser beam',
      ingredients: [
        { resource: 'energy', amount: 18 },
        { resource: 'resonantCrystal', amount: 10 },
        { resource: 'flux', amount: 8 },
      ],
      output: {
        type: 'drone',
        droneType: 'laser_drone',
      },
      gridPattern: [
        [['resonantCrystal'], ['flux'], ['resonantCrystal']],
        [['energy', 'energy', 'energy'], ['resonantCrystal', 'resonantCrystal'], ['energy', 'energy', 'energy']],
        [['flux'], ['resonantCrystal'], ['flux']],
      ],
      patternDescription: 'Row 1: [Resonant Crystal][Flux][Resonant Crystal] | Row 2: [Energy x3][Resonant Crystal x2][Energy x3] | Row 3: [Flux][Resonant Crystal][Flux]',
    };

    const swarmDroneRecipe: CraftingRecipe = {
      id: 'swarm_drone_recipe',
      name: 'Swarm Drone',
      description: 'Deploys mini-drones',
      ingredients: [
        { resource: 'energy', amount: 12 },
        { resource: 'coreDust', amount: 15 },
        { resource: 'gloomRoot', amount: 6 },
      ],
      output: {
        type: 'drone',
        droneType: 'swarm_drone',
      },
      gridPattern: [
        [['gloomRoot'], ['coreDust'], ['gloomRoot']],
        [['energy'], ['coreDust', 'coreDust', 'coreDust'], ['energy']],
        [['gloomRoot'], ['energy', 'energy', 'energy', 'energy', 'energy'], ['gloomRoot']],
      ],
      patternDescription: 'Row 1: [Gloom Root][Core Dust][Gloom Root] | Row 2: [Energy][Core Dust x3][Energy] | Row 3: [Gloom Root][Energy x5][Gloom Root]',
    };

    const gravityDroneRecipe: CraftingRecipe = {
      id: 'gravity_drone_recipe',
      name: 'Gravity Drone',
      description: 'Creates gravity wells',
      ingredients: [
        { resource: 'energy', amount: 20 },
        { resource: 'singularityCore', amount: 8 },
        { resource: 'voidEssence', amount: 6 },
      ],
      output: {
        type: 'drone',
        droneType: 'gravity_drone',
      },
      gridPattern: [
        [['voidEssence'], ['singularityCore'], ['voidEssence']],
        [['energy', 'energy', 'energy'], ['singularityCore', 'singularityCore'], ['energy', 'energy', 'energy']],
        [['voidEssence'], ['singularityCore', 'singularityCore'], ['voidEssence']],
      ],
      patternDescription: 'Row 1: [Void Essence][Singularity Core][Void Essence] | Row 2: [Energy x3][Singularity Core x2][Energy x3] | Row 3: [Void Essence][Singularity Core x2][Void Essence]',
    };

    const teslaDroneRecipe: CraftingRecipe = {
      id: 'tesla_drone_recipe',
      name: 'Tesla Drone',
      description: 'Chains lightning between enemies',
      ingredients: [
        { resource: 'energy', amount: 16 },
        { resource: 'flux', amount: 12 },
        { resource: 'aetheriumShard', amount: 6 },
      ],
      output: {
        type: 'drone',
        droneType: 'tesla_drone',
      },
      gridPattern: [
        [['aetheriumShard'], ['flux'], ['aetheriumShard']],
        [['energy', 'energy'], ['flux', 'flux'], ['energy', 'energy']],
        [['aetheriumShard'], ['energy', 'energy', 'energy', 'energy'], ['aetheriumShard']],
      ],
      patternDescription: 'Row 1: [Aetherium Shard][Flux][Aetherium Shard] | Row 2: [Energy x2][Flux x2][Energy x2] | Row 3: [Aetherium Shard][Energy x4][Aetherium Shard]',
    };

    const voidDroneRecipe: CraftingRecipe = {
      id: 'void_drone_recipe',
      name: 'Void Drone',
      description: 'Dark energy projectiles',
      ingredients: [
        { resource: 'energy', amount: 22 },
        { resource: 'voidEssence', amount: 10 },
        { resource: 'singularityCore', amount: 5 },
      ],
      output: {
        type: 'drone',
        droneType: 'void_drone',
      },
      gridPattern: [
        [['voidEssence'], ['singularityCore'], ['voidEssence']],
        [['energy', 'energy', 'energy', 'energy'], ['voidEssence', 'voidEssence'], ['energy', 'energy', 'energy', 'energy']],
        [['voidEssence'], ['singularityCore'], ['voidEssence']],
      ],
      patternDescription: 'Row 1: [Void Essence][Singularity Core][Void Essence] | Row 2: [Energy x4][Void Essence x2][Energy x4] | Row 3: [Void Essence][Singularity Core][Void Essence]',
    };

    this.recipes.push(
      healingPackRecipe,
      mediumHealingPackRecipe,
      largeHealingPackRecipe,
      energyBoostRecipe,
      shieldPackRecipe,
      biomeElixirRecipe,
      crateKeyRecipe,
      assaultDroneRecipe,
      shieldDroneRecipe,
      repairDroneRecipe,
      scoutDroneRecipe,
      plasmaDroneRecipe,
      cryoDroneRecipe,
      explosiveDroneRecipe,
      medicDroneRecipe,
      empDroneRecipe,
      sniperDroneRecipe,
      laserDroneRecipe,
      swarmDroneRecipe,
      gravityDroneRecipe,
      teslaDroneRecipe,
      voidDroneRecipe
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

  craftItem(player: Player, recipeId: string): Consumable | DroneType | null {
    const recipe = this.recipes.find((r) => r.id === recipeId);
    if (!recipe || !this.canCraft(player, recipeId)) {
      return null;
    }

    for (const ingredient of recipe.ingredients) {
      const resourceKey = ingredient.resource as keyof typeof player.resources;
      (player.resources[resourceKey] as number) -= ingredient.amount;
    }

    if (recipe.output.type === 'drone') {
      return recipe.output.droneType as DroneType;
    }

    const baseItem = recipe.output.item;
    if (!baseItem) return null;

    if (baseItem.effect === 'key') {
      player.resources.crateKey += 1;
      return null;
    }

    return { ...baseItem, id: baseItem.id, quantity: 1 };
  }

  craftFromGrid(player: Player, grid: (string[] | null)[][]): Consumable | DroneType | null {
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
