import { Upgrade, UpgradeEffect, Player, Weapon, Projectile } from '../types/game';

export class UpgradeSystem {
  private appliedUpgrades: Upgrade[] = [];

  applyUpgrade(upgrade: Upgrade, player: Player): Player {
    const existingIndex = this.appliedUpgrades.findIndex(u => u.id === upgrade.id);

    if (existingIndex >= 0) {
      this.appliedUpgrades[existingIndex] = { ...upgrade, level: upgrade.level + 1 };
    } else {
      this.appliedUpgrades.push({ ...upgrade, level: 1 });
    }

    return this.recalculatePlayerStats(player);
  }

  recalculatePlayerStats(player: Player): Player {
    
    let updatedPlayer = {...player};

    updatedPlayer.upgrades = [...this.appliedUpgrades];

    for (const upgrade of this.appliedUpgrades) {
      for (const effect of upgrade.effects) {
        if (effect.target === 'player') {
          updatedPlayer = this.applyEffectToPlayer(updatedPlayer, effect, upgrade.level);
        }
      }
    }

    updatedPlayer.equippedWeapons = updatedPlayer.equippedWeapons.map(weapon =>
      this.applyUpgradesToWeapon(weapon, this.appliedUpgrades)
    );

    return updatedPlayer;
  }

  private applyEffectToPlayer(player: Player, effect: UpgradeEffect, level: number): Player {
    const updated = { ...player };

    if (effect.condition && !effect.condition({ player })) {
      return updated;
    }

    const key = effect.property as keyof Player;
    const currentValue = player[key] as number;

    switch (effect.operation) {
      case 'add':
        (updated[key] as number) = currentValue + (effect.value * level);
        break;
      case 'multiply':
        (updated[key] as number) = currentValue * (1 + effect.value * level);
        break;
      case 'set':
        (updated[key] as number) = effect.value;
        break;
    }

    return updated;
  }

  applyUpgradesToWeapon(weapon: Weapon, upgrades: Upgrade[]): Weapon {
    let updated = { ...weapon };

    for (const upgrade of upgrades) {
      for (const effect of upgrade.effects) {
        if (effect.target === 'weapon') {
          updated = this.applyEffectToWeapon(updated, effect, upgrade.level);
        }
      }
    }

    return updated;
  }

  private applyEffectToWeapon(weapon: Weapon, effect: UpgradeEffect, level: number): Weapon {
    const updated = { ...weapon };

    if (effect.condition && !effect.condition({ weapon })) {
      return updated;
    }

    const key = effect.property as keyof Weapon;
    const currentValue = weapon[key] as number;

    switch (effect.operation) {
      case 'add':
        (updated[key] as number) = currentValue + (effect.value * level);
        break;
      case 'multiply':
        (updated[key] as number) = currentValue * (1 + effect.value * level);
        break;
      case 'set':
        (updated[key] as number) = effect.value;
        break;
    }

    return updated;
  }

  applyUpgradesToProjectile(projectile: Projectile, upgrades: Upgrade[]): Projectile {
    let updated = { ...projectile };

    for (const upgrade of upgrades) {
      for (const effect of upgrade.effects) {
        if (effect.target === 'projectile') {
          updated = this.applyEffectToProjectile(updated, effect);
        }
      }
    }

    return updated;
  }

  private applyEffectToProjectile(projectile: Projectile, effect: UpgradeEffect): Projectile {
    const updated = { ...projectile };

    if (effect.condition && !effect.condition({ projectile })) {
      return updated;
    }

    const key = effect.property as keyof Projectile;

    switch (effect.operation) {
      case 'add':
        (updated[key] as number) = (projectile[key] as number) + effect.value;
        break;
      case 'multiply':
        (updated[key] as number) = (projectile[key] as number) * (1 + effect.value);
        break;
      case 'set':
        if (key === 'piercing') {
          updated.piercing = effect.value === 1;
        } else {
          (updated[key] as number) = effect.value;
        }
        break;
    }

    return updated;
  }

  getAppliedUpgrades(): Upgrade[] {
    return [...this.appliedUpgrades];
  }

  reset(): void {
    this.appliedUpgrades = [];
  }
}
