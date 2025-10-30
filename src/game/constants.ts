import { Weapon, Upgrade } from '../types/game';
import { WEAPON_DEFINITIONS } from './WeaponDefinitions';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const TILE_SIZE = 40;
export const MAX_VISIBLE_TILES = 15;
export const MAX_VISIBLE_RANGE = MAX_VISIBLE_TILES * TILE_SIZE;
export const PLAYER_SIZE = 20;
export const PLAYER_COLLISION_RADIUS = 25;
export const ENEMY_MELEE_STOP_DISTANCE = 35;
export const PLAYER_BASE_SPEED = 3;
export const PLAYER_DASH_SPEED = 9;
export const PLAYER_DASH_DURATION = 0.1;
export const PLAYER_DASH_COOLDOWN = 1.5;
export const PLAYER_MAX_HEALTH = 100;

export const INITIAL_WEAPONS: Weapon[] = [
  {
    ...WEAPON_DEFINITIONS.blaster,
    id: 'starter-blaster',
    name: 'Plasma Blaster',
    fireRate: 0.25,
    spread: 0,
    description: 'Basic rapid-fire blaster',
    perks: [],
  },
  {
    ...WEAPON_DEFINITIONS.grappling_hook,
    id: 'starter-grappling-hook',
    name: 'Grappling Hook',
    perks: [],
  },
];

export const AVAILABLE_UPGRADES: Upgrade[] = [
  {
    id: 'health-boost',
    name: 'Reinforced Plating',
    type: 'stat',
    description: '+25 Max Health',
    cost: 50,
    icon: 'shield',
    level: 0,
    maxLevel: 5,
    effects: [
      { target: 'player', property: 'maxHealth', value: 25, operation: 'add' },
    ],
  },
  {
    id: 'speed-boost',
    name: 'Servo Upgrade',
    type: 'stat',
    description: '+15% Movement Speed',
    cost: 40,
    icon: 'zap',
    level: 0,
    maxLevel: 5,
    effects: [
      {
        target: 'player',
        property: 'speed',
        value: 0.15,
        operation: 'multiply',
      },
    ],
  },
  {
    id: 'damage-boost',
    name: 'Overcharge Core',
    type: 'stat',
    description: '+20% Weapon Damage',
    cost: 60,
    icon: 'flame',
    level: 0,
    maxLevel: 5,
    effects: [
      {
        target: 'weapon',
        property: 'damage',
        value: 0.2,
        operation: 'multiply',
      },
    ],
  },
  {
    id: 'fire-rate-boost',
    name: 'Rapid Loader',
    type: 'stat',
    description: '-15% Fire Rate Cooldown',
    cost: 50,
    icon: 'repeat',
    level: 0,
    maxLevel: 5,
    effects: [
      {
        target: 'weapon',
        property: 'fireRate',
        value: -0.15,
        operation: 'multiply',
      },
    ],
  },
  {
    id: 'piercing',
    name: 'Armor Piercer',
    type: 'ability',
    description: 'Projectiles pierce through enemies',
    cost: 100,
    icon: 'crosshair',
    level: 0,
    maxLevel: 1,
    effects: [
      {
        target: 'projectile',
        property: 'piercing',
        value: 1,
        operation: 'set',
      },
    ],
  },
  {
    id: 'multishot',
    name: 'Split Shot',
    type: 'ability',
    description: '+2 Projectiles per shot',
    cost: 80,
    icon: 'chevrons-right',
    level: 0,
    maxLevel: 3,
    effects: [
      {
        target: 'weapon',
        property: 'projectileCount',
        value: 2,
        operation: 'add',
      },
    ],
  },
  {
    id: 'dash-cooldown',
    name: 'Energy Recycler',
    type: 'ability',
    description: '-25% Dash Cooldown',
    cost: 70,
    icon: 'wind',
    level: 0,
    maxLevel: 3,
    effects: [
      {
        target: 'player',
        property: 'dashCooldown',
        value: -0.25,
        operation: 'multiply',
      },
    ],
  },
  {
    id: 'projectile-speed',
    name: 'Accelerator',
    type: 'stat',
    description: '+25% Projectile Speed',
    cost: 45,
    icon: 'rocket',
    level: 0,
    maxLevel: 4,
    effects: [
      {
        target: 'weapon',
        property: 'projectileSpeed',
        value: 0.25,
        operation: 'multiply',
      },
    ],
  },
];
