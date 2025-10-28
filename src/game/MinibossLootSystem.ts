import { Enemy, MinibossSubtype, Vector2 } from '../types/game';
import { MINIBOSS_DEFINITIONS } from './MinibossSystem';
import { randomRange } from './utils';
import type { ResourceType } from './WorldGeneration';

export interface LootDrop {
  position: Vector2;
  currency: number;
  resources: Array<{ type: ResourceType; amount: number }>;
  weaponDrop: boolean;
}

export class MinibossLootSystem {
  generateLoot(miniboss: Enemy): LootDrop | null {
    if (!miniboss.minibossSubtype) return null;

    const definition = MINIBOSS_DEFINITIONS[miniboss.minibossSubtype];
    if (!definition) return null;

    const lootTable = definition.lootTable;

    const currency = Math.floor(
      randomRange(lootTable.currencyMin, lootTable.currencyMax)
    );

    const resources: Array<{ type: ResourceType; amount: number }> = [];

    resources.push({
      type: 'singularityCore',
      amount: lootTable.guaranteedSingularityCores
    });

    const uniqueAmount = Math.floor(
      randomRange(lootTable.uniqueResource.minAmount, lootTable.uniqueResource.maxAmount)
    );
    resources.push({
      type: lootTable.uniqueResource.type,
      amount: uniqueAmount
    });

    for (const additionalResource of lootTable.additionalResources) {
      if (Math.random() < additionalResource.chance) {
        const amount = Math.floor(
          randomRange(additionalResource.minAmount, additionalResource.maxAmount)
        );
        resources.push({
          type: additionalResource.type,
          amount
        });
      }
    }

    const weaponDrop = Math.random() < lootTable.weaponDropChance;

    return {
      position: { ...miniboss.position },
      currency,
      resources,
      weaponDrop
    };
  }

  spawnLootDrops(
    loot: LootDrop,
    spawnCurrency: (pos: Vector2, amount: number) => void,
    spawnResource: (pos: Vector2, type: ResourceType, amount: number) => void,
    spawnWeapon: (pos: Vector2) => void
  ): void {
    spawnCurrency(loot.position, loot.currency);

    loot.resources.forEach((resource, index) => {
      const angle = (Math.PI * 2 / loot.resources.length) * index;
      const distance = 40 + Math.random() * 20;
      const pos = {
        x: loot.position.x + Math.cos(angle) * distance,
        y: loot.position.y + Math.sin(angle) * distance
      };
      spawnResource(pos, resource.type, resource.amount);
    });

    if (loot.weaponDrop) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 60;
      const pos = {
        x: loot.position.x + Math.cos(angle) * distance,
        y: loot.position.y + Math.sin(angle) * distance
      };
      spawnWeapon(pos);
    }
  }

  getMinibossDisplayName(subtype: MinibossSubtype): string {
    const definition = MINIBOSS_DEFINITIONS[subtype];
    return definition ? definition.name : 'Unknown Miniboss';
  }

  getMinibossDescription(subtype: MinibossSubtype): string {
    const definition = MINIBOSS_DEFINITIONS[subtype];
    return definition ? definition.description : '';
  }
}
