import { Vector2 } from '../types/game';

export interface Obstacle {
  id: string;
  position: Vector2;
  size: Vector2;
  rotation: number;
  color: string;
  shape: 'rectangle' | 'circle';
  orbitData?: {
    centerX: number;
    centerY: number;
    distance: number;
    angle: number;
    speed: number;
    direction: number;
  };
}

export interface Environment {
  id: string;
  name: string;
  backgroundColor: string;
  gridColor: string;
  accentColor: string;
  particleColor: string;
  obstacles: Obstacle[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    dangerColor: string;
  };
}

const createObstacles = (pattern: 'sparse' | 'moderate' | 'dense' | 'corridor' | 'arena'): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  let id = 0;

  switch (pattern) {
    case 'sparse':
      obstacles.push(
        { id: `obs-${id++}`, position: { x: 300, y: 200 }, size: { x: 60, y: 60 }, rotation: 0, color: '#4a5568', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 900, y: 600 }, size: { x: 60, y: 60 }, rotation: 0, color: '#4a5568', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 600, y: 400 }, size: { x: 45, y: 45 }, rotation: 0, color: '#4a5568', shape: 'circle' }
      );
      break;

    case 'moderate':
      obstacles.push(
        { id: `obs-${id++}`, position: { x: 250, y: 150 }, size: { x: 80, y: 40 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 950, y: 150 }, size: { x: 80, y: 40 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 250, y: 650 }, size: { x: 80, y: 40 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 950, y: 650 }, size: { x: 80, y: 40 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 600, y: 400 }, size: { x: 70, y: 70 }, rotation: 0.785, color: '#2d3748', shape: 'rectangle' }
      );
      break;

    case 'dense':
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          obstacles.push({
            id: `obs-${id++}`,
            position: { x: 300 + i * 300, y: 250 + j * 300 },
            size: { x: 60, y: 60 },
            rotation: Math.random() * Math.PI,
            color: '#1a202c',
            shape: 'rectangle'
          });
        }
      }
      break;

    case 'corridor':
      obstacles.push(
        { id: `obs-${id++}`, position: { x: 400, y: 200 }, size: { x: 30, y: 200 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 800, y: 200 }, size: { x: 30, y: 200 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 400, y: 600 }, size: { x: 30, y: 200 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 800, y: 600 }, size: { x: 30, y: 200 }, rotation: 0, color: '#2d3748', shape: 'rectangle' }
      );
      break;

    case 'arena':
      obstacles.push(
        { id: `obs-${id++}`, position: { x: 200, y: 400 }, size: { x: 100, y: 20 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 1000, y: 400 }, size: { x: 100, y: 20 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 600, y: 200 }, size: { x: 20, y: 100 }, rotation: 0, color: '#2d3748', shape: 'rectangle' },
        { id: `obs-${id++}`, position: { x: 600, y: 600 }, size: { x: 20, y: 100 }, rotation: 0, color: '#2d3748', shape: 'rectangle' }
      );
      break;
  }

  return obstacles;
};

export const ENVIRONMENTS: Environment[] = [
  {
    id: 'void-station',
    name: 'Void Station',
    backgroundColor: '#0a0e1a',
    gridColor: '#1e293b33',
    accentColor: '#38bdf8',
    particleColor: '#60a5fa',
    obstacles: createObstacles('sparse'),
    theme: {
      primaryColor: '#38bdf8',
      secondaryColor: '#818cf8',
      dangerColor: '#ef4444'
    }
  },
  {
    id: 'neon-city',
    name: 'Neon City',
    backgroundColor: '#1a0a1f',
    gridColor: '#db277733',
    accentColor: '#db2777',
    particleColor: '#ec4899',
    obstacles: createObstacles('moderate'),
    theme: {
      primaryColor: '#db2777',
      secondaryColor: '#f472b6',
      dangerColor: '#f97316'
    }
  },
  {
    id: 'toxic-waste',
    name: 'Toxic Waste',
    backgroundColor: '#0f1a0a',
    gridColor: '#84cc1633',
    accentColor: '#84cc16',
    particleColor: '#a3e635',
    obstacles: createObstacles('dense'),
    theme: {
      primaryColor: '#84cc16',
      secondaryColor: '#bef264',
      dangerColor: '#dc2626'
    }
  },
  {
    id: 'inferno-core',
    name: 'Inferno Core',
    backgroundColor: '#1f0a0a',
    gridColor: '#f9731633',
    accentColor: '#f97316',
    particleColor: '#fb923c',
    obstacles: createObstacles('corridor'),
    theme: {
      primaryColor: '#f97316',
      secondaryColor: '#fdba74',
      dangerColor: '#dc2626'
    }
  },
  {
    id: 'crystal-mines',
    name: 'Crystal Mines',
    backgroundColor: '#0a1a1f',
    gridColor: '#06b6d433',
    accentColor: '#06b6d4',
    particleColor: '#22d3ee',
    obstacles: createObstacles('arena'),
    theme: {
      primaryColor: '#06b6d4',
      secondaryColor: '#67e8f9',
      dangerColor: '#e11d48'
    }
  }
];

export const getEnvironmentForWave = (wave: number): Environment => {
  const index = Math.floor((wave - 1) / 5) % ENVIRONMENTS.length;
  return ENVIRONMENTS[index];
};
