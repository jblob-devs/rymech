import { PlanarAnchor, PlanarRemnant, Vector2, BaseCampElement } from '../types/game';
import { PlayerInventory } from './PlayerInventory';
import { generateId, createVector } from './utils';

export class PlanarAnchorSystem {
  private anchors: Map<string, PlanarAnchor> = new Map();
  private remnants: Map<string, PlanarRemnant> = new Map();
  private activeRespawnAnchorId: string | null = null;
  private baseCampAnchorId: string | null = null;

  createBaseCampAnchor(position: Vector2): PlanarAnchor {
    const baseCampElements: BaseCampElement[] = [
      {
        id: generateId(),
        position: { x: position.x, y: position.y },
        type: 'campfire',
        interactionRange: 80,
        pulsePhase: 0,
      },
      {
        id: generateId(),
        position: { x: position.x + 90, y: position.y - 30 },
        type: 'vault_node',
        interactionRange: 60,
        pulsePhase: 0,
      },
      {
        id: generateId(),
        position: { x: position.x - 90, y: position.y + 40 },
        type: 'info_sign',
        interactionRange: 50,
        rotation: 0,
        text: 'HOW TO PLAY',
      },
      {
        id: generateId(),
        position: { x: position.x + 80, y: position.y + 60 },
        type: 'info_sign',
        interactionRange: 50,
        rotation: 0,
        text: 'LORE: THE SHATTERED EXPANSE',
      },
    ];

    const anchor: PlanarAnchor = {
      id: generateId(),
      position,
      size: 120,
      isActivated: true,
      isSetAsRespawn: true,
      type: 'base_camp',
      rotation: 0,
      pulsePhase: 0,
      glowIntensity: 1,
      baseCampElements,
    };
    this.anchors.set(anchor.id, anchor);
    this.activeRespawnAnchorId = anchor.id;
    this.baseCampAnchorId = anchor.id;
    return anchor;
  }

  createFieldAnchor(position: Vector2): PlanarAnchor {
    const anchor: PlanarAnchor = {
      id: generateId(),
      position,
      size: 50,
      isActivated: false,
      isSetAsRespawn: false,
      type: 'field',
      rotation: 0,
      pulsePhase: 0,
      glowIntensity: 0.5,
    };
    this.anchors.set(anchor.id, anchor);
    return anchor;
  }

  activateAnchor(anchorId: string): boolean {
    const anchor = this.anchors.get(anchorId);
    if (anchor && !anchor.isActivated) {
      anchor.isActivated = true;
      anchor.glowIntensity = 1;
      return true;
    }
    return false;
  }

  setRespawnAnchor(anchorId: string): boolean {
    const anchor = this.anchors.get(anchorId);
    if (anchor && anchor.isActivated) {
      this.anchors.forEach(a => {
        a.isSetAsRespawn = false;
      });
      anchor.isSetAsRespawn = true;
      this.activeRespawnAnchorId = anchorId;
      return true;
    }
    return false;
  }

  getRespawnPosition(): Vector2 {
    if (this.activeRespawnAnchorId) {
      const anchor = this.anchors.get(this.activeRespawnAnchorId);
      if (anchor) {
        return { ...anchor.position };
      }
    }
    if (this.baseCampAnchorId) {
      const baseAnchor = this.anchors.get(this.baseCampAnchorId);
      if (baseAnchor) {
        return { ...baseAnchor.position };
      }
    }
    return createVector(600, 400);
  }

  createPlanarRemnant(
    position: Vector2,
    inventory: PlayerInventory,
    resources: Record<string, number>,
    currency: number
  ): PlanarRemnant {
    // Deep clone inventory to prevent mutations from affecting the remnant
    const remnant: PlanarRemnant = {
      id: generateId(),
      position: { ...position },
      weapons: inventory.getWeapons().map(w => ({
        weapon: { ...w.weapon },
        equipped: w.equipped
      })),
      drones: inventory.getDrones().map(d => ({
        droneType: d.droneType,
        equipped: d.equipped
      })),
      consumables: inventory.getConsumables().map(c => ({ ...c })),
      resources: { ...resources },
      currency,
      size: 35,
      rotation: 0,
      pulsePhase: 0,
    };
    this.remnants.set(remnant.id, remnant);
    return remnant;
  }

  collectRemnant(remnantId: string): PlanarRemnant | null {
    const remnant = this.remnants.get(remnantId);
    if (remnant) {
      this.remnants.delete(remnantId);
      return remnant;
    }
    return null;
  }

  getActivatedAnchors(): PlanarAnchor[] {
    return Array.from(this.anchors.values()).filter(a => a.isActivated);
  }

  getAllAnchors(): PlanarAnchor[] {
    return Array.from(this.anchors.values());
  }

  getAllRemnants(): PlanarRemnant[] {
    return Array.from(this.remnants.values());
  }

  getActiveRespawnAnchorId(): string | null {
    return this.activeRespawnAnchorId;
  }

  getBaseCampAnchorId(): string | null {
    return this.baseCampAnchorId;
  }

  findNearbyAnchor(position: Vector2, maxDistance: number): PlanarAnchor | null {
    let closest: PlanarAnchor | null = null;
    let minDist = maxDistance;

    this.anchors.forEach(anchor => {
      const dx = anchor.position.x - position.x;
      const dy = anchor.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = anchor;
      }
    });

    return closest;
  }

  findNearbyRemnant(position: Vector2, maxDistance: number): PlanarRemnant | null {
    let closest: PlanarRemnant | null = null;
    let minDist = maxDistance;

    this.remnants.forEach(remnant => {
      const dx = remnant.position.x - position.x;
      const dy = remnant.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = remnant;
      }
    });

    return closest;
  }

  update(dt: number): void {
    this.anchors.forEach(anchor => {
      anchor.pulsePhase += dt * 2;
      anchor.rotation += dt * 0.5;
      
      if (anchor.baseCampElements) {
        anchor.baseCampElements.forEach(element => {
          if (element.pulsePhase !== undefined) {
            element.pulsePhase += dt * 2;
          }
          if (element.type === 'campfire') {
            element.rotation = (element.rotation || 0) + dt * 3;
          }
        });
      }
    });

    this.remnants.forEach(remnant => {
      remnant.pulsePhase += dt * 3;
      remnant.rotation += dt * 1.5;
    });
  }

  clear(): void {
    this.anchors.clear();
    this.remnants.clear();
    this.activeRespawnAnchorId = null;
    this.baseCampAnchorId = null;
  }
}
