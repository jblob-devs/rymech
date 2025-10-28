import { Enemy, MinibossSubtype, Vector2 } from '../types/game';
import { createVector, generateId } from './utils';
import type { ResourceType } from './WorldGeneration';

export interface MinibossAttack {
  id: string;
  name: string;
  damage: number;
  cooldown: number;
  telegraphDuration: number;
  description: string;
  execute: (
    miniboss: Enemy,
    playerPos: Vector2,
    dt: number,
    context: MinibossAttackContext
  ) => void;
}

export interface MinibossAttackContext {
  createProjectile: (proj: any) => void;
  createParticles: (pos: Vector2, count: number, color: string, lifetime: number) => void;
  damagePlayer: (damage: number) => void;
  findNearestPlayer: (pos: Vector2) => Vector2;
  getAllPlayers: () => Array<{ position: Vector2; id: string }>;
}

export interface MinibossLootTable {
  guaranteedSingularityCores: number;
  uniqueResource: {
    type: ResourceType;
    minAmount: number;
    maxAmount: number;
  };
  currencyMin: number;
  currencyMax: number;
  additionalResources: Array<{
    type: ResourceType;
    minAmount: number;
    maxAmount: number;
    chance: number;
  }>;
  weaponDropChance: number;
}

export interface MinibossDefinition {
  subtype: MinibossSubtype;
  name: string;
  description: string;
  biomeId: string;
  requiredFeatureType?: string;
  health: number;
  damage: number;
  speed: number;
  size: number;
  color: string;
  secondaryColor: string;
  detectionRadius: number;
  phases: string[];
  attacks: MinibossAttack[];
  lootTable: MinibossLootTable;
  spawnCondition?: (featureData: any, playerPosition: Vector2) => boolean;
}

export const MINIBOSS_DEFINITIONS: Record<MinibossSubtype, MinibossDefinition> = {
  angulodon: {
    subtype: 'angulodon',
    name: 'Angulodon',
    description: 'A geometric shark lurking in coral reef waters',
    biomeId: 'coral-depths',
    requiredFeatureType: 'coral-reef',
    health: 3500,
    damage: 35,
    speed: 3.5,
    size: 45,
    color: '#0891b2',
    secondaryColor: '#06b6d4',
    detectionRadius: 300,
    phases: ['fin_patrol', 'engaged', 'enraged'],
    attacks: [
      {
        id: 'dash_attack',
        name: 'Hydroblitz Dash',
        damage: 40,
        cooldown: 4.0,
        telegraphDuration: 0.8,
        description: 'Charges forward with tremendous speed',
        execute: (miniboss, playerPos, dt, ctx) => {
          if (!miniboss.isDashing) {
            miniboss.isDashing = true;
            miniboss.dashTimer = 0;
            const dir = { 
              x: playerPos.x - miniboss.position.x, 
              y: playerPos.y - miniboss.position.y 
            };
            const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
            miniboss.velocity = { x: (dir.x / len) * miniboss.speed * 5, y: (dir.y / len) * miniboss.speed * 5 };
            ctx.createParticles(miniboss.position, 30, '#22d3ee', 0.5);
          }
        }
      },
      {
        id: 'bite_grab',
        name: 'Jaw Lock',
        damage: 50,
        cooldown: 8.0,
        telegraphDuration: 1.2,
        description: 'Lunges and grabs player in its jaws',
        execute: (miniboss, playerPos, dt, ctx) => {
          const dir = { 
            x: playerPos.x - miniboss.position.x, 
            y: playerPos.y - miniboss.position.y 
          };
          const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
          
          if (len < 80) {
            if (!miniboss.jaws) {
              miniboss.jaws = { isOpen: false, biteTimer: 0 };
            }
            miniboss.jaws.isOpen = true;
            miniboss.jaws.biteTimer = 2.5;
            miniboss.jaws.grabbedPlayerId = ctx.getAllPlayers()[0]?.id;
            ctx.damagePlayer(50);
            ctx.createParticles(miniboss.position, 25, '#dc2626', 0.6);
          }
        }
      },
      {
        id: 'tail_splash',
        name: 'Hydrosonic Wave',
        damage: 25,
        cooldown: 5.5,
        telegraphDuration: 0.6,
        description: 'Creates water projectiles with tail splash',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 },
              damage: 25,
              size: 12,
              color: '#22d3ee',
              owner: 'enemy' as const,
              lifetime: 3,
              piercing: false,
              piercingCount: 0,
              rotation: 0
            });
          }
          ctx.createParticles(miniboss.position, 40, '#06b6d4', 0.7);
        }
      },
      {
        id: 'whirlpool',
        name: 'Vortex Maelstrom',
        damage: 15,
        cooldown: 12.0,
        telegraphDuration: 2.0,
        description: 'Creates a pulling whirlpool',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.whirlpoolAngle = 0;
          miniboss.pullRadius = 250;
          ctx.createParticles(miniboss.position, 60, '#3b82f6', 1.5);
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 3,
      uniqueResource: {
        type: 'bioluminescentPearl',
        minAmount: 15,
        maxAmount: 30
      },
      currencyMin: 250,
      currencyMax: 500,
      additionalResources: [
        { type: 'energy', minAmount: 50, maxAmount: 100, chance: 1.0 },
        { type: 'coreDust', minAmount: 20, maxAmount: 40, chance: 0.8 },
        { type: 'flux', minAmount: 10, maxAmount: 25, chance: 0.6 }
      ],
      weaponDropChance: 0.4
    },
    spawnCondition: (featureData, playerPosition) => {
      if (!featureData || !featureData.position) return false;
      const dist = Math.sqrt(
        Math.pow(playerPosition.x - featureData.position.x, 2) +
        Math.pow(playerPosition.y - featureData.position.y, 2)
      );
      return dist < (featureData.size || 200);
    }
  },

  cryostag_vanguard: {
    subtype: 'cryostag_vanguard',
    name: 'Cryostag Vanguard',
    description: 'An icy sentinel with crystalline antlers guarding frozen lands',
    biomeId: 'frozen-tundra',
    requiredFeatureType: 'glacial-spire',
    health: 4000,
    damage: 38,
    speed: 2.8,
    size: 50,
    color: '#60a5fa',
    secondaryColor: '#93c5fd',
    detectionRadius: 350,
    phases: ['dormant', 'active', 'frostrage'],
    attacks: [
      {
        id: 'ice_lance',
        name: 'Glacial Spear',
        damage: 45,
        cooldown: 3.5,
        telegraphDuration: 0.7,
        description: 'Fires sharp ice projectiles from antlers',
        execute: (miniboss, playerPos, dt, ctx) => {
          const dir = { 
            x: playerPos.x - miniboss.position.x, 
            y: playerPos.y - miniboss.position.y 
          };
          const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
          const angle = Math.atan2(dir.y, dir.x);
          
          for (let i = -1; i <= 1; i++) {
            const spreadAngle = angle + (i * 0.3);
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(spreadAngle) * 6, y: Math.sin(spreadAngle) * 6 },
              damage: 45,
              size: 14,
              color: '#7dd3fc',
              owner: 'enemy' as const,
              lifetime: 4,
              piercing: true,
              piercingCount: 2,
              rotation: 0
            });
          }
          ctx.createParticles(miniboss.position, 20, '#60a5fa', 0.4);
        }
      },
      {
        id: 'blizzard_breath',
        name: 'Frozen Gale',
        damage: 20,
        cooldown: 7.0,
        telegraphDuration: 1.5,
        description: 'Exhales a cone of freezing wind',
        execute: (miniboss, playerPos, dt, ctx) => {
          const dir = { 
            x: playerPos.x - miniboss.position.x, 
            y: playerPos.y - miniboss.position.y 
          };
          const baseAngle = Math.atan2(dir.y, dir.x);
          
          for (let i = 0; i < 12; i++) {
            const spreadAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 3;
            const speed = 3 + Math.random() * 2;
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(spreadAngle) * speed, y: Math.sin(spreadAngle) * speed },
              damage: 20,
              size: 8,
              color: '#bae6fd',
              owner: 'enemy' as const,
              lifetime: 2,
              piercing: false,
              piercingCount: 0,
              rotation: 0
            });
          }
          ctx.createParticles(miniboss.position, 50, '#93c5fd', 0.8);
        }
      },
      {
        id: 'frost_prison',
        name: 'Crystalline Cage',
        damage: 30,
        cooldown: 10.0,
        telegraphDuration: 1.8,
        description: 'Creates ice crystals that trap the player',
        execute: (miniboss, playerPos, dt, ctx) => {
          const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
          angles.forEach(angle => {
            const distance = 120;
            const pos = {
              x: playerPos.x + Math.cos(angle) * distance,
              y: playerPos.y + Math.sin(angle) * distance
            };
            ctx.createParticles(pos, 15, '#60a5fa', 1.0);
          });
        }
      },
      {
        id: 'charge_trample',
        name: 'Avalanche Rush',
        damage: 55,
        cooldown: 8.5,
        telegraphDuration: 1.0,
        description: 'Charges in a straight line, trampling everything',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.isDashing = true;
          miniboss.dashTimer = 0;
          const dir = { 
            x: playerPos.x - miniboss.position.x, 
            y: playerPos.y - miniboss.position.y 
          };
          const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
          miniboss.velocity = { x: (dir.x / len) * miniboss.speed * 6, y: (dir.y / len) * miniboss.speed * 6 };
          ctx.createParticles(miniboss.position, 35, '#dbeafe', 0.6);
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 3,
      uniqueResource: {
        type: 'cryoKelp',
        minAmount: 20,
        maxAmount: 35
      },
      currencyMin: 300,
      currencyMax: 550,
      additionalResources: [
        { type: 'alloyFragments', minAmount: 25, maxAmount: 45, chance: 1.0 },
        { type: 'energy', minAmount: 40, maxAmount: 80, chance: 0.9 }
      ],
      weaponDropChance: 0.45
    }
  },

  pyroclast_behemoth: {
    subtype: 'pyroclast_behemoth',
    name: 'Pyroclast Behemoth',
    description: 'A molten colossus of living magma and stone',
    biomeId: 'volcanic-wastes',
    requiredFeatureType: 'lava-pillar',
    health: 4500,
    damage: 42,
    speed: 2.2,
    size: 55,
    color: '#f97316',
    secondaryColor: '#fb923c',
    detectionRadius: 320,
    phases: ['dormant', 'erupting', 'molten_core'],
    attacks: [
      {
        id: 'magma_eruption',
        name: 'Volcanic Burst',
        damage: 50,
        cooldown: 5.0,
        telegraphDuration: 1.5,
        description: 'Causes magma to erupt from the ground',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 150;
            const pos = {
              x: playerPos.x + Math.cos(angle) * distance,
              y: playerPos.y + Math.sin(angle) * distance
            };
            ctx.createParticles(pos, 25, '#f97316', 0.8);
            
            setTimeout(() => {
              for (let j = 0; j < 6; j++) {
                const eruptAngle = (Math.PI * 2 / 6) * j;
                ctx.createProjectile({
                  id: generateId(),
                  position: pos,
                  velocity: { x: Math.cos(eruptAngle) * 3.5, y: Math.sin(eruptAngle) * 3.5 },
                  damage: 35,
                  size: 10,
                  color: '#fb923c',
                  owner: 'enemy' as const,
                  lifetime: 2.5,
                  piercing: false,
                  piercingCount: 0,
                  rotation: 0
                });
              }
            }, 1000);
          }
        }
      },
      {
        id: 'lava_wave',
        name: 'Pyroclastic Tide',
        damage: 40,
        cooldown: 6.5,
        telegraphDuration: 1.0,
        description: 'Sends waves of lava outward',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
              for (let i = 0; i < 16; i++) {
                const angle = (Math.PI * 2 / 16) * i;
                const speed = 4 + wave * 0.5;
                ctx.createProjectile({
                  id: generateId(),
                  position: { ...miniboss.position },
                  velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                  damage: 40,
                  size: 11,
                  color: '#f97316',
                  owner: 'enemy' as const,
                  lifetime: 3,
                  piercing: false,
                  piercingCount: 0,
                  rotation: 0,
                  explosive: true,
                  explosionRadius: 40
                });
              }
              ctx.createParticles(miniboss.position, 30, '#fb923c', 0.5);
            }, wave * 500);
          }
        }
      },
      {
        id: 'meteor_slam',
        name: 'Cataclysm Drop',
        damage: 70,
        cooldown: 12.0,
        telegraphDuration: 2.5,
        description: 'Leaps and crashes down like a meteor',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.velocity = { x: 0, y: -15 };
          ctx.createParticles(miniboss.position, 50, '#dc2626', 1.0);
          
          setTimeout(() => {
            ctx.createParticles(miniboss.position, 80, '#f97316', 1.2);
            for (let i = 0; i < 20; i++) {
              const angle = (Math.PI * 2 / 20) * i;
              ctx.createProjectile({
                id: generateId(),
                position: { ...miniboss.position },
                velocity: { x: Math.cos(angle) * 5, y: Math.sin(angle) * 5 },
                damage: 45,
                size: 12,
                color: '#fb923c',
                owner: 'enemy' as const,
                lifetime: 2,
                piercing: false,
                piercingCount: 0,
                rotation: 0
              });
            }
          }, 1500);
        }
      },
      {
        id: 'heat_shield',
        name: 'Magma Barrier',
        damage: 0,
        cooldown: 15.0,
        telegraphDuration: 0.5,
        description: 'Activates a shield of molten rock',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.shieldActive = true;
          miniboss.shieldHealth = 800;
          ctx.createParticles(miniboss.position, 40, '#fdba74', 0.7);
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 4,
      uniqueResource: {
        type: 'obsidianHeart',
        minAmount: 18,
        maxAmount: 32
      },
      currencyMin: 350,
      currencyMax: 600,
      additionalResources: [
        { type: 'alloyFragments', minAmount: 30, maxAmount: 50, chance: 1.0 },
        { type: 'energy', minAmount: 60, maxAmount: 100, chance: 0.85 }
      ],
      weaponDropChance: 0.5
    }
  },

  mirelurker_matron: {
    subtype: 'mirelurker_matron',
    name: 'Mirelurker Matron',
    description: 'Toxic mother of the swamp depths',
    biomeId: 'toxic-swamp',
    requiredFeatureType: 'toxic-pool',
    health: 3800,
    damage: 36,
    speed: 2.6,
    size: 48,
    color: '#84cc16',
    secondaryColor: '#a3e635',
    detectionRadius: 300,
    phases: ['lurking', 'aggressive', 'spawning'],
    attacks: [
      {
        id: 'acid_spit',
        name: 'Caustic Volley',
        damage: 38,
        cooldown: 4.0,
        telegraphDuration: 0.6,
        description: 'Spits globs of corrosive acid',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let i = 0; i < 5; i++) {
            const dir = { 
              x: playerPos.x - miniboss.position.x, 
              y: playerPos.y - miniboss.position.y 
            };
            const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
            const angle = Math.atan2(dir.y, dir.x) + (i - 2) * 0.2;
            
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(angle) * 5, y: Math.sin(angle) * 5 },
              damage: 38,
              size: 13,
              color: '#a3e635',
              owner: 'enemy' as const,
              lifetime: 3.5,
              piercing: false,
              piercingCount: 0,
              rotation: 0
            });
          }
          ctx.createParticles(miniboss.position, 20, '#84cc16', 0.5);
        }
      },
      {
        id: 'spore_cloud',
        name: 'Toxic Miasma',
        damage: 25,
        cooldown: 8.0,
        telegraphDuration: 1.2,
        description: 'Releases a cloud of poisonous spores',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
              damage: 15,
              size: 6,
              color: '#bef264',
              owner: 'enemy' as const,
              lifetime: 5,
              piercing: false,
              piercingCount: 0,
              rotation: 0
            });
          }
          ctx.createParticles(miniboss.position, 60, '#a3e635', 1.0);
        }
      },
      {
        id: 'minion_hatch',
        name: 'Spawn Brood',
        damage: 0,
        cooldown: 15.0,
        telegraphDuration: 2.0,
        description: 'Hatches smaller toxic enemies',
        execute: (miniboss, playerPos, dt, ctx) => {
          ctx.createParticles(miniboss.position, 40, '#4d7c0f', 0.8);
        }
      },
      {
        id: 'root_snare',
        name: 'Ensnaring Vines',
        damage: 30,
        cooldown: 9.0,
        telegraphDuration: 1.5,
        description: 'Roots burst from ground to trap player',
        execute: (miniboss, playerPos, dt, ctx) => {
          const angles = [0, Math.PI / 3, (Math.PI * 2) / 3, Math.PI, (Math.PI * 4) / 3, (Math.PI * 5) / 3];
          angles.forEach((angle, idx) => {
            setTimeout(() => {
              const pos = {
                x: playerPos.x + Math.cos(angle) * 80,
                y: playerPos.y + Math.sin(angle) * 80
              };
              ctx.createParticles(pos, 20, '#65a30d', 0.7);
            }, idx * 150);
          });
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 3,
      uniqueResource: {
        type: 'gloomRoot',
        minAmount: 16,
        maxAmount: 28
      },
      currencyMin: 280,
      currencyMax: 520,
      additionalResources: [
        { type: 'coreDust', minAmount: 25, maxAmount: 40, chance: 1.0 },
        { type: 'energy', minAmount: 45, maxAmount: 85, chance: 0.8 }
      ],
      weaponDropChance: 0.42
    }
  },

  prism_guardian: {
    subtype: 'prism_guardian',
    name: 'Prism Guardian',
    description: 'A crystalline sentinel that bends light itself',
    biomeId: 'crystal-caverns',
    requiredFeatureType: 'crystal-formation',
    health: 3600,
    damage: 40,
    speed: 3.0,
    size: 46,
    color: '#06b6d4',
    secondaryColor: '#22d3ee',
    detectionRadius: 340,
    phases: ['scanning', 'combat', 'refraction'],
    attacks: [
      {
        id: 'beam_lattice',
        name: 'Prismatic Matrix',
        damage: 42,
        cooldown: 5.5,
        telegraphDuration: 1.0,
        description: 'Creates a grid of laser beams',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            for (let j = 0; j < 3; j++) {
              setTimeout(() => {
                ctx.createProjectile({
                  id: generateId(),
                  position: { ...miniboss.position },
                  velocity: { x: Math.cos(angle) * 4.5, y: Math.sin(angle) * 4.5 },
                  damage: 42,
                  size: 10,
                  color: '#22d3ee',
                  owner: 'enemy' as const,
                  lifetime: 4,
                  piercing: true,
                  piercingCount: 3,
                  rotation: 0,
                  isBeam: true,
                  beamLength: 100
                });
              }, j * 300);
            }
          }
          ctx.createParticles(miniboss.position, 35, '#06b6d4', 0.6);
        }
      },
      {
        id: 'clone_prism',
        name: 'Refraction Doubles',
        damage: 0,
        cooldown: 14.0,
        telegraphDuration: 1.5,
        description: 'Creates illusory clones',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.cloneIds = [];
          const angles = [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4];
          angles.forEach(angle => {
            const distance = 120;
            const pos = {
              x: miniboss.position.x + Math.cos(angle) * distance,
              y: miniboss.position.y + Math.sin(angle) * distance
            };
            ctx.createParticles(pos, 25, '#67e8f9', 0.8);
          });
        }
      },
      {
        id: 'resonance_nova',
        name: 'Crystal Shockwave',
        damage: 55,
        cooldown: 10.0,
        telegraphDuration: 2.0,
        description: 'Explodes in a resonating shockwave',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
              const radius = 80 + ring * 60;
              const count = 12 + ring * 4;
              for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                ctx.createProjectile({
                  id: generateId(),
                  position: { ...miniboss.position },
                  velocity: { x: Math.cos(angle) * (3 + ring), y: Math.sin(angle) * (3 + ring) },
                  damage: 35,
                  size: 9,
                  color: '#a5f3fc',
                  owner: 'enemy' as const,
                  lifetime: 2.5,
                  piercing: false,
                  piercingCount: 0,
                  rotation: 0
                });
              }
              ctx.createParticles(miniboss.position, 30, '#22d3ee', 0.5);
            }, ring * 400);
          }
        }
      },
      {
        id: 'shard_orbital',
        name: 'Orbiting Shards',
        damage: 32,
        cooldown: 7.0,
        telegraphDuration: 0.8,
        description: 'Surrounds itself with rotating crystal shards',
        execute: (miniboss, playerPos, dt, ctx) => {
          if (!miniboss.orbitalProjectiles) miniboss.orbitalProjectiles = [];
          const count = 6;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            miniboss.orbitalProjectiles.push({
              angle,
              radius: 60,
              damage: 32,
              size: 10,
              color: '#67e8f9'
            });
          }
          ctx.createParticles(miniboss.position, 30, '#06b6d4', 0.6);
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 3,
      uniqueResource: {
        type: 'resonantCrystal',
        minAmount: 18,
        maxAmount: 30
      },
      currencyMin: 290,
      currencyMax: 530,
      additionalResources: [
        { type: 'geoShards', minAmount: 28, maxAmount: 45, chance: 1.0 },
        { type: 'energy', minAmount: 50, maxAmount: 90, chance: 0.85 }
      ],
      weaponDropChance: 0.46
    }
  },

  null_siren: {
    subtype: 'null_siren',
    name: 'Null Siren',
    description: 'A void entity that manipulates space itself',
    biomeId: 'void-nebula',
    requiredFeatureType: 'void-gap',
    health: 4200,
    damage: 44,
    speed: 3.2,
    size: 52,
    color: '#8b5cf6',
    secondaryColor: '#a78bfa',
    detectionRadius: 360,
    phases: ['dormant', 'warping', 'void_tear'],
    attacks: [
      {
        id: 'gravity_well',
        name: 'Singularity Pulse',
        damage: 35,
        cooldown: 6.0,
        telegraphDuration: 1.2,
        description: 'Creates gravity wells that pull players',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.pullRadius = 200;
          ctx.createParticles(miniboss.position, 45, '#8b5cf6', 1.0);
          
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 / 10) * i;
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(angle) * 3.5, y: Math.sin(angle) * 3.5 },
              damage: 30,
              size: 11,
              color: '#a78bfa',
              owner: 'enemy' as const,
              lifetime: 3,
              piercing: false,
              piercingCount: 0,
              rotation: 0,
              isGravityWell: true,
              gravityRadius: 80,
              gravityStrength: 1.5
            });
          }
        }
      },
      {
        id: 'void_scream',
        name: 'Dimensional Shriek',
        damage: 48,
        cooldown: 8.5,
        telegraphDuration: 1.8,
        description: 'Unleashes a cone of void energy',
        execute: (miniboss, playerPos, dt, ctx) => {
          const dir = { 
            x: playerPos.x - miniboss.position.x, 
            y: playerPos.y - miniboss.position.y 
          };
          const baseAngle = Math.atan2(dir.y, dir.x);
          
          for (let i = 0; i < 15; i++) {
            const spreadAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 2.5;
            const speed = 4 + Math.random() * 2;
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(spreadAngle) * speed, y: Math.sin(spreadAngle) * speed },
              damage: 38,
              size: 12,
              color: '#c4b5fd',
              owner: 'enemy' as const,
              lifetime: 2.5,
              piercing: true,
              piercingCount: 2,
              rotation: 0
            });
          }
          ctx.createParticles(miniboss.position, 55, '#8b5cf6', 0.9);
        }
      },
      {
        id: 'teleport_strike',
        name: 'Void Step Assault',
        damage: 52,
        cooldown: 9.0,
        telegraphDuration: 0.5,
        description: 'Teleports behind player and strikes',
        execute: (miniboss, playerPos, dt, ctx) => {
          const dir = { 
            x: miniboss.position.x - playerPos.x, 
            y: miniboss.position.y - playerPos.y 
          };
          const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
          
          miniboss.position = {
            x: playerPos.x + (dir.x / len) * 80,
            y: playerPos.y + (dir.y / len) * 80
          };
          
          ctx.createParticles(miniboss.position, 40, '#a78bfa', 0.7);
          ctx.damagePlayer(52);
        }
      },
      {
        id: 'phase_shift',
        name: 'Ethereal Form',
        damage: 0,
        cooldown: 13.0,
        telegraphDuration: 0.6,
        description: 'Becomes invulnerable and intangible',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.isSubmerged = true;
          ctx.createParticles(miniboss.position, 50, '#ddd6fe', 0.8);
          
          setTimeout(() => {
            miniboss.isSubmerged = false;
            ctx.createParticles(miniboss.position, 35, '#8b5cf6', 0.6);
          }, 3000);
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 4,
      uniqueResource: {
        type: 'voidEssence',
        minAmount: 22,
        maxAmount: 38
      },
      currencyMin: 340,
      currencyMax: 580,
      additionalResources: [
        { type: 'flux', minAmount: 32, maxAmount: 52, chance: 1.0 },
        { type: 'voidCore', minAmount: 2, maxAmount: 5, chance: 0.6 }
      ],
      weaponDropChance: 0.5
    }
  },

  solstice_warden: {
    subtype: 'solstice_warden',
    name: 'Solstice Warden',
    description: 'Guardian of radiant gardens, wielder of solar power',
    biomeId: 'radiant-gardens',
    requiredFeatureType: 'bloom-tree',
    health: 3900,
    damage: 39,
    speed: 3.1,
    size: 49,
    color: '#eab308',
    secondaryColor: '#fbbf24',
    detectionRadius: 330,
    phases: ['patrol', 'radiant', 'supernova'],
    attacks: [
      {
        id: 'solar_flare',
        name: 'Sunburst Lance',
        damage: 43,
        cooldown: 4.5,
        telegraphDuration: 0.9,
        description: 'Fires concentrated solar beams',
        execute: (miniboss, playerPos, dt, ctx) => {
          const dir = { 
            x: playerPos.x - miniboss.position.x, 
            y: playerPos.y - miniboss.position.y 
          };
          const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
          const angle = Math.atan2(dir.y, dir.x);
          
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              ctx.createProjectile({
                id: generateId(),
                position: { ...miniboss.position },
                velocity: { x: Math.cos(angle) * 6, y: Math.sin(angle) * 6 },
                damage: 43,
                size: 14,
                color: '#fbbf24',
                owner: 'enemy' as const,
                lifetime: 3.5,
                piercing: true,
                piercingCount: 4,
                rotation: 0,
                isBeam: true
              });
              ctx.createParticles(miniboss.position, 15, '#eab308', 0.4);
            }, i * 200);
          }
        }
      },
      {
        id: 'seed_bomb',
        name: 'Bloom Barrage',
        damage: 36,
        cooldown: 7.5,
        telegraphDuration: 1.3,
        description: 'Launches explosive seed pods',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.3;
            const speed = 3 + Math.random() * 1.5;
            ctx.createProjectile({
              id: generateId(),
              position: { ...miniboss.position },
              velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
              damage: 36,
              size: 12,
              color: '#84cc16',
              owner: 'enemy' as const,
              lifetime: 2.5,
              piercing: false,
              piercingCount: 0,
              rotation: 0,
              explosive: true,
              explosionRadius: 60
            });
          }
          ctx.createParticles(miniboss.position, 30, '#a3e635', 0.6);
        }
      },
      {
        id: 'healing_sanctum',
        name: 'Verdant Regeneration',
        damage: 0,
        cooldown: 16.0,
        telegraphDuration: 2.0,
        description: 'Creates a healing zone',
        execute: (miniboss, playerPos, dt, ctx) => {
          ctx.createParticles(miniboss.position, 60, '#86efac', 1.2);
          miniboss.health = Math.min(miniboss.maxHealth, miniboss.health + 400);
        }
      },
      {
        id: 'radiant_dash',
        name: 'Photon Blitz',
        damage: 50,
        cooldown: 8.0,
        telegraphDuration: 1.0,
        description: 'Dashes in a trail of light',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.isDashing = true;
          miniboss.dashTimer = 0;
          const dir = { 
            x: playerPos.x - miniboss.position.x, 
            y: playerPos.y - miniboss.position.y 
          };
          const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
          miniboss.velocity = { x: (dir.x / len) * miniboss.speed * 5.5, y: (dir.y / len) * miniboss.speed * 5.5 };
          ctx.createParticles(miniboss.position, 40, '#fef08a', 0.7);
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 3,
      uniqueResource: {
        type: 'sunpetalBloom',
        minAmount: 17,
        maxAmount: 29
      },
      currencyMin: 310,
      currencyMax: 540,
      additionalResources: [
        { type: 'geoShards', minAmount: 24, maxAmount: 42, chance: 1.0 },
        { type: 'energy', minAmount: 55, maxAmount: 95, chance: 0.88 }
      ],
      weaponDropChance: 0.44
    }
  },

  rift_revenant: {
    subtype: 'rift_revenant',
    name: 'Rift Revenant',
    description: 'A temporal anomaly torn between dimensions',
    biomeId: 'shattered-expanse',
    requiredFeatureType: 'reality-tear',
    health: 4100,
    damage: 41,
    speed: 3.4,
    size: 51,
    color: '#a855f7',
    secondaryColor: '#c084fc',
    detectionRadius: 350,
    phases: ['stable', 'fractured', 'temporal_collapse'],
    attacks: [
      {
        id: 'time_skip',
        name: 'Temporal Echoes',
        damage: 40,
        cooldown: 5.0,
        telegraphDuration: 1.0,
        description: 'Creates afterimages that attack',
        execute: (miniboss, playerPos, dt, ctx) => {
          for (let i = 0; i < 4; i++) {
            setTimeout(() => {
              const angle = Math.random() * Math.PI * 2;
              const distance = 100 + Math.random() * 50;
              const pos = {
                x: miniboss.position.x + Math.cos(angle) * distance,
                y: miniboss.position.y + Math.sin(angle) * distance
              };
              
              const dir = { 
                x: playerPos.x - pos.x, 
                y: playerPos.y - pos.y 
              };
              const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
              
              ctx.createProjectile({
                id: generateId(),
                position: pos,
                velocity: { x: (dir.x / len) * 5, y: (dir.y / len) * 5 },
                damage: 35,
                size: 10,
                color: '#c084fc',
                owner: 'enemy' as const,
                lifetime: 3,
                piercing: false,
                piercingCount: 0,
                rotation: 0
              });
              ctx.createParticles(pos, 20, '#a855f7', 0.5);
            }, i * 300);
          }
        }
      },
      {
        id: 'blade_vortex',
        name: 'Dimensional Blades',
        damage: 45,
        cooldown: 7.0,
        telegraphDuration: 1.2,
        description: 'Summons spinning energy blades',
        execute: (miniboss, playerPos, dt, ctx) => {
          if (!miniboss.orbitalProjectiles) miniboss.orbitalProjectiles = [];
          const count = 8;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            miniboss.orbitalProjectiles.push({
              angle,
              radius: 70,
              damage: 38,
              size: 12,
              color: '#e9d5ff',
              rotationSpeed: 0.15
            });
          }
          ctx.createParticles(miniboss.position, 35, '#a855f7', 0.7);
        }
      },
      {
        id: 'rift_pull',
        name: 'Void Attraction',
        damage: 28,
        cooldown: 9.0,
        telegraphDuration: 1.5,
        description: 'Pulls players toward dimensional rifts',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.pullRadius = 250;
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const distance = 180;
            const pos = {
              x: miniboss.position.x + Math.cos(angle) * distance,
              y: miniboss.position.y + Math.sin(angle) * distance
            };
            ctx.createParticles(pos, 18, '#ddd6fe', 0.8);
          }
        }
      },
      {
        id: 'phase_split',
        name: 'Reality Fracture',
        damage: 0,
        cooldown: 14.0,
        telegraphDuration: 2.0,
        description: 'Splits into multiple phase copies',
        execute: (miniboss, playerPos, dt, ctx) => {
          miniboss.cloneIds = [];
          const positions = [
            { x: miniboss.position.x + 100, y: miniboss.position.y },
            { x: miniboss.position.x - 100, y: miniboss.position.y },
            { x: miniboss.position.x, y: miniboss.position.y + 100 },
            { x: miniboss.position.x, y: miniboss.position.y - 100 }
          ];
          
          positions.forEach(pos => {
            ctx.createParticles(pos, 30, '#c084fc', 0.9);
          });
        }
      }
    ],
    lootTable: {
      guaranteedSingularityCores: 4,
      uniqueResource: {
        type: 'aetheriumShard',
        minAmount: 20,
        maxAmount: 35
      },
      currencyMin: 330,
      currencyMax: 570,
      additionalResources: [
        { type: 'flux', minAmount: 30, maxAmount: 50, chance: 1.0 },
        { type: 'energy', minAmount: 58, maxAmount: 98, chance: 0.87 }
      ],
      weaponDropChance: 0.48
    }
  }
};

export class MinibossSystem {
  private activeMinibosses: Map<string, Enemy> = new Map();
  private spawnCooldowns: Map<MinibossSubtype, number> = new Map();
  private defeatedMinibosses: Set<string> = new Set();

  getDefinition(subtype: MinibossSubtype): MinibossDefinition | undefined {
    return MINIBOSS_DEFINITIONS[subtype];
  }

  createMiniboss(subtype: MinibossSubtype, position: Vector2): Enemy {
    const def = MINIBOSS_DEFINITIONS[subtype];
    if (!def) {
      throw new Error(`Unknown miniboss subtype: ${subtype}`);
    }

    const segments: Array<{ position: Vector2; rotation: number; size: number }> = [];
    if (subtype === 'angulodon') {
      for (let i = 0; i < 8; i++) {
        segments.push({
          position: { ...position },
          rotation: 0,
          size: def.size - i * 4
        });
      }
    }

    const miniboss: Enemy = {
      id: generateId(),
      type: 'miniboss',
      minibossSubtype: subtype,
      position: { ...position },
      velocity: createVector(0, 0),
      rotation: 0,
      size: def.size,
      health: def.health,
      maxHealth: def.health,
      damage: def.damage,
      speed: def.speed,
      color: def.color,
      attackCooldown: 0,
      currencyDrop: 0,
      detectionRadius: def.detectionRadius,
      phase: def.phases[0],
      behaviorState: 'idle',
      phaseTimer: 0,
      attackQueueTimer: 0,
      isSubmerged: subtype === 'angulodon',
      segments: segments.length > 0 ? segments : undefined,
      jaws: subtype === 'angulodon' ? { isOpen: false, biteTimer: 0 } : undefined
    };

    this.activeMinibosses.set(miniboss.id, miniboss);
    return miniboss;
  }

  isMinibossActive(subtype: MinibossSubtype): boolean {
    for (const miniboss of this.activeMinibosses.values()) {
      if (miniboss.minibossSubtype === subtype) {
        return true;
      }
    }
    return false;
  }

  removeMiniboss(id: string): void {
    this.activeMinibosses.delete(id);
  }

  markDefeated(id: string): void {
    this.defeatedMinibosses.add(id);
    this.removeMiniboss(id);
  }

  canSpawn(subtype: MinibossSubtype): boolean {
    const cooldown = this.spawnCooldowns.get(subtype) || 0;
    return cooldown <= 0 && !this.isMinibossActive(subtype);
  }

  setSpawnCooldown(subtype: MinibossSubtype, duration: number): void {
    this.spawnCooldowns.set(subtype, duration);
  }

  updateCooldowns(dt: number): void {
    for (const [subtype, cooldown] of this.spawnCooldowns.entries()) {
      if (cooldown > 0) {
        this.spawnCooldowns.set(subtype, cooldown - dt);
      }
    }
  }

  getActiveMinibosses(): Enemy[] {
    return Array.from(this.activeMinibosses.values());
  }
}
