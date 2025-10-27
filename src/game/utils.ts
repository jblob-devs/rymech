import { Vector2, Entity } from '../types/game';

export function createVector(x: number = 0, y: number = 0): Vector2 {
  return { x, y };
}

export function vectorAdd(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vectorSubtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vectorScale(v: Vector2, scale: number): Vector2 {
  return { x: v.x * scale, y: v.y * scale };
}

export function vectorLength(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vectorNormalize(v: Vector2): Vector2 {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function vectorDistance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function vectorAngle(v: Vector2): number {
  return Math.atan2(v.y, v.x);
}

export function vectorFromAngle(angle: number, length: number = 1): Vector2 {
  return {
    x: Math.cos(angle) * length,
    y: Math.sin(angle) * length,
  };
}

export function checkCollision(
  a: Entity | { position: Vector2; size: number },
  b: Entity | { position: Vector2; size: number }
): boolean {
  const distance = vectorDistance(a.position, b.position);
  return distance < (a.size + b.size) / 2;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatResourceName(name: string): string {
  if (!name) return '';
  const result = name.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function getRandomAdjective() {
  // 1. Define a list of adjectives
  const adjectives = [
    'Crimson',
    'Arcane',
    'Luminous',
    'Silent',
    'Shattered',
    'Vicious',
    'Fierce',
    'Brilliant',
    'Cursed',
    'Warped',
    'Ancient',
    'Gilded',
    'Obsidian',
    'Mythic',
    'Hallowed',
    'Wobbly',
    'Squishy',
    'Electric',
    'Fluffy',
    'Invisible',
    'Suspicious',
    'Sparkly',
    'Gooey',
    'Clumsy',
    'Zany',
    'Tinkling',
    'Purple',
    'Unseen',
    'Sassy',
    'Glittering',
    'Fermented',
    'Chunky',
    'Gigantic',
    'Microscopic',
    'Existential',
    'Noodly',
    'Verbose',
    'Gaseous',
    'Slippery',
    'Bumbling',
    'Cosmic',
    'Timid',
    'Jolly',
    'Mysterious',
    'Velvety',
    'Obtuse',
    'Rambunctious',
    'Dapper',
    'Fibrous',
    'Quizzical',
    'Melancholy',
    'Kaleidoscopic',
    'Uncouth',
    'Wistful',
    'Perplexed',
    'Discombobulated',
    'Ephemeral',
    'Cantankerous',
    'Pneumatic',
    'Lethargic',
  ];

  // 2. Select a random index
  const randomIndex = Math.floor(Math.random() * adjectives.length);

  // 3. Return the word
  return adjectives[randomIndex];
}
