import { Vector2 } from '../types/game';
import { vectorAdd, vectorDistance, randomRange, generateId } from './utils';

export type ResourceType = 'energy' | 'coreDust' | 'flux' | 'geoShards' | 'alloyFragments' | 'singularityCore' | 'voidCore' | 'cryoKelp' | 'obsidianHeart' | 'gloomRoot' | 'resonantCrystal' | 'voidEssence' | 'bioluminescentPearl' | 'sunpetalBloom' | 'aetheriumShard' | 'gravitonEssence' | 'crateKey';

// Event Types
export type WorldEventType =
  | 'planar_raiders'
  | 'altar_boss'
  | 'warp_storm'
  | 'resource_asteroid'
  | 'enemy_ambush'
  | 'temporal_rift'
  | 'void_tear'
  | 'crystal_bloom'
  | 'gravitational_anomaly'
  | 'phase_beacon';

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  position: Vector2;
  radius: number;
  lifetime: number;
  maxLifetime: number;
  isActive: boolean;
  data: any; // Event-specific data
}

// Planar Raiders Event
export interface PlanarRaidersData {
  enemies: string[]; // Enemy IDs
  enemiesRemaining: number;
  portalSpawned: boolean;
  portalPosition?: Vector2;
  portalLifetime?: number;
  targetBiome?: string;
}

// Altar Boss Event
export interface AltarBossData {
  altarInteracted: boolean;
  bossSpawned: boolean;
  bossId?: string;
  bossType: 'void_dragon' | 'reality_hydra' | 'temporal_serpent' | 'crystal_titan';
  altarGlowIntensity: number;
}

// Warp Storm Event
export interface WarpStormData {
  rotation: number;
  rotationSpeed: number;
  intensity: number;
  damagePerSecond: number;
  visionObscureRadius: number;
  resourceDropChance: number;
  lastDamageTick: number;
}

// Resource Asteroid Event
export interface ResourceAsteroidData {
  resourceType: ResourceType;
  resourceAmount: number;
  harvestable: boolean;
  harvested: boolean;
  size: number;
  harvestProgress: number;
  harvestTime: number;
  isBeingHarvested: boolean;
  enemySpawnTimer: number;
  enemiesSpawned: number;
  maxEnemySpawns: number;
  craterRadius: number;
}

// Enemy Ambush Event
export interface EnemyAmbushData {
  ambushed: boolean;
  enemies: string[];
  triggerRadius: number;
}

// Temporal Rift Event
export interface TemporalRiftData {
  timeScale: number;
  affectedEnemies: Set<string>;
  affectedProjectiles: Set<string>;
  pulseTimer: number;
}

// Void Tear Event
export interface VoidTearData {
  pullStrength: number;
  damagePerSecond: number;
  lastDamageTick: number;
  size: number;
  growing: boolean;
}

// Crystal Bloom Event
export interface CrystalBloomData {
  crystalsSpawned: boolean;
  crystalPositions: Vector2[];
  damageBoostAmount: number;
  healAmount: number;
}

// Gravitational Anomaly Event
export interface GravitationalAnomalyData {
  pullStrength: number;
  pushStrength: number;
  mode: 'pull' | 'push';
  switchTimer: number;
}

// Phase Beacon Event
export interface PhaseBeaconData {
  phaseTime: number;
  phaseCooldown: number;
  nextPhaseIn: number;
  beaconPhased: boolean;
}

export class WorldEventSystem {
  private events: Map<string, WorldEvent> = new Map();
  private recentlySpawnedEvents: WorldEvent[] = [];
  private spawnTimer: number = 0;
  private readonly MIN_SPAWN_INTERVAL = 15; // Spawn events frequently (every 15 seconds min)
  private readonly MAX_SPAWN_INTERVAL = 45;
  private readonly MIN_DISTANCE_FROM_PLAYER = 300;
  private readonly MAX_DISTANCE_FROM_PLAYER = 800;
  private readonly EVENT_WEIGHTS: Record<WorldEventType, number> = {
    planar_raiders: 20,
    altar_boss: 5,
    warp_storm: 15,
    resource_asteroid: 25,
    enemy_ambush: 20,
    temporal_rift: 10,
    void_tear: 12,
    crystal_bloom: 18,
    gravitational_anomaly: 15,
    phase_beacon: 10,
  };

  constructor() {
    this.spawnTimer = randomRange(this.MIN_SPAWN_INTERVAL, this.MAX_SPAWN_INTERVAL);
  }

  update(dt: number, playerPosition: Vector2): void {
    // Update existing events
    for (const [id, event] of this.events) {
      event.lifetime -= dt;
      
      if (event.lifetime <= 0) {
        this.events.delete(id);
        continue;
      }

      // Update event-specific logic
      this.updateEvent(event, dt, playerPosition);
    }

    // Spawn new events
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnRandomEvent(playerPosition);
      this.spawnTimer = randomRange(this.MIN_SPAWN_INTERVAL, this.MAX_SPAWN_INTERVAL);
    }
  }

  private updateEvent(event: WorldEvent, dt: number, playerPosition: Vector2): void {
    switch (event.type) {
      case 'warp_storm':
        this.updateWarpStorm(event, dt);
        break;
      case 'temporal_rift':
        this.updateTemporalRift(event, dt);
        break;
      case 'void_tear':
        this.updateVoidTear(event, dt);
        break;
      case 'gravitational_anomaly':
        this.updateGravitationalAnomaly(event, dt);
        break;
      case 'phase_beacon':
        this.updatePhaseBeacon(event, dt);
        break;
      case 'altar_boss':
        this.updateAltarBoss(event, dt);
        break;
    }
  }

  private updateWarpStorm(event: WorldEvent, dt: number): void {
    const data = event.data as WarpStormData;
    data.rotation += data.rotationSpeed * dt;
    data.intensity = Math.sin(event.lifetime * 2) * 0.3 + 0.7;
  }

  private updateTemporalRift(event: WorldEvent, dt: number): void {
    const data = event.data as TemporalRiftData;
    data.pulseTimer += dt;
  }

  private updateVoidTear(event: WorldEvent, dt: number): void {
    const data = event.data as VoidTearData;
    if (data.growing && data.size < event.radius) {
      data.size += dt * 20;
    }
  }

  private updateGravitationalAnomaly(event: WorldEvent, dt: number): void {
    const data = event.data as GravitationalAnomalyData;
    data.switchTimer -= dt;
    if (data.switchTimer <= 0) {
      data.mode = data.mode === 'pull' ? 'push' : 'pull';
      data.switchTimer = randomRange(3, 7);
    }
  }

  private updatePhaseBeacon(event: WorldEvent, dt: number): void {
    const data = event.data as PhaseBeaconData;
    data.nextPhaseIn -= dt;
    if (data.nextPhaseIn <= 0) {
      data.beaconPhased = !data.beaconPhased;
      data.nextPhaseIn = data.beaconPhased ? data.phaseTime : data.phaseCooldown;
    }
  }

  private updateAltarBoss(event: WorldEvent, dt: number): void {
    const data = event.data as AltarBossData;
    data.altarGlowIntensity = Math.sin(event.lifetime * 3) * 0.5 + 0.5;
  }

  private spawnRandomEvent(playerPosition: Vector2): void {
    const eventType = this.selectEventType();
    const position = this.getSpawnPosition(playerPosition);
    
    const event = this.createEvent(eventType, position);
    if (event) {
      this.events.set(event.id, event);
      this.recentlySpawnedEvents.push(event);
    }
  }

  private selectEventType(): WorldEventType {
    const totalWeight = Object.values(this.EVENT_WEIGHTS).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [type, weight] of Object.entries(this.EVENT_WEIGHTS)) {
      random -= weight;
      if (random <= 0) {
        return type as WorldEventType;
      }
    }
    
    return 'resource_asteroid';
  }

  private getSpawnPosition(playerPosition: Vector2): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const distance = randomRange(this.MIN_DISTANCE_FROM_PLAYER, this.MAX_DISTANCE_FROM_PLAYER);
    return vectorAdd(
      playerPosition,
      vectorFromAngle(angle, distance)
    );
  }

  private createEvent(type: WorldEventType, position: Vector2): WorldEvent | null {
    const id = generateId();
    
    switch (type) {
      case 'planar_raiders':
        return this.createPlanarRaidersEvent(id, position);
      case 'altar_boss':
        return this.createAltarBossEvent(id, position);
      case 'warp_storm':
        return this.createWarpStormEvent(id, position);
      case 'resource_asteroid':
        return this.createResourceAsteroidEvent(id, position);
      case 'enemy_ambush':
        return this.createEnemyAmbushEvent(id, position);
      case 'temporal_rift':
        return this.createTemporalRiftEvent(id, position);
      case 'void_tear':
        return this.createVoidTearEvent(id, position);
      case 'crystal_bloom':
        return this.createCrystalBloomEvent(id, position);
      case 'gravitational_anomaly':
        return this.createGravitationalAnomalyEvent(id, position);
      case 'phase_beacon':
        return this.createPhaseBeaconEvent(id, position);
      default:
        return null;
    }
  }

  private createPlanarRaidersEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'planar_raiders',
      position,
      radius: 150,
      lifetime: 180, // 3 minutes
      maxLifetime: 180,
      isActive: true,
      data: {
        enemies: [],
        enemiesRemaining: randomRange(4, 8),
        portalSpawned: false,
      } as PlanarRaidersData,
    };
  }

  private createAltarBossEvent(id: string, position: Vector2): WorldEvent {
    const bossTypes: AltarBossData['bossType'][] = ['void_dragon', 'reality_hydra', 'temporal_serpent', 'crystal_titan'];
    return {
      id,
      type: 'altar_boss',
      position,
      radius: 60,
      lifetime: 300, // 5 minutes to interact
      maxLifetime: 300,
      isActive: true,
      data: {
        altarInteracted: false,
        bossSpawned: false,
        bossType: bossTypes[Math.floor(Math.random() * bossTypes.length)],
        altarGlowIntensity: 1.0,
      } as AltarBossData,
    };
  }

  private createWarpStormEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'warp_storm',
      position,
      radius: 250,
      lifetime: 120, // 2 minutes
      maxLifetime: 120,
      isActive: true,
      data: {
        rotation: 0,
        rotationSpeed: 2.0,
        intensity: 1.0,
        damagePerSecond: 15,
        visionObscureRadius: 200,
        resourceDropChance: 0.1,
        lastDamageTick: 0,
      } as WarpStormData,
    };
  }

  private createResourceAsteroidEvent(id: string, position: Vector2): WorldEvent {
    const resourceTypes: ResourceType[] = ['energy', 'coreDust', 'flux', 'singularityCore', 'voidCore'];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const size = randomRange(30, 50);
    
    return {
      id,
      type: 'resource_asteroid',
      position,
      radius: 60,
      lifetime: 180,
      maxLifetime: 180,
      isActive: true,
      data: {
        resourceType,
        resourceAmount: randomRange(30, 100),
        harvestable: true,
        harvested: false,
        size,
        harvestProgress: 0,
        harvestTime: 5.0, // Takes 5 seconds to harvest
        isBeingHarvested: false,
        enemySpawnTimer: 0,
        enemiesSpawned: 0,
        maxEnemySpawns: 3,
        craterRadius: size * 1.5,
      } as ResourceAsteroidData,
    };
  }

  private createEnemyAmbushEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'enemy_ambush',
      position,
      radius: 80,
      lifetime: 120,
      maxLifetime: 120,
      isActive: true,
      data: {
        ambushed: false,
        enemies: [],
        triggerRadius: 120,
      } as EnemyAmbushData,
    };
  }

  private createTemporalRiftEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'temporal_rift',
      position,
      radius: 180,
      lifetime: 90,
      maxLifetime: 90,
      isActive: true,
      data: {
        timeScale: 0.5, // Slows time for enemies
        affectedEnemies: new Set<string>(),
        affectedProjectiles: new Set<string>(),
        pulseTimer: 0,
      } as TemporalRiftData,
    };
  }

  private createVoidTearEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'void_tear',
      position,
      radius: 150,
      lifetime: 60,
      maxLifetime: 60,
      isActive: true,
      data: {
        pullStrength: 100,
        damagePerSecond: 20,
        lastDamageTick: 0,
        size: 20,
        growing: true,
      } as VoidTearData,
    };
  }

  private createCrystalBloomEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'crystal_bloom',
      position,
      radius: 100,
      lifetime: 120,
      maxLifetime: 120,
      isActive: true,
      data: {
        crystalsSpawned: false,
        crystalPositions: [],
        damageBoostAmount: 1.5,
        healAmount: 25,
      } as CrystalBloomData,
    };
  }

  private createGravitationalAnomalyEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'gravitational_anomaly',
      position,
      radius: 200,
      lifetime: 90,
      maxLifetime: 90,
      isActive: true,
      data: {
        pullStrength: 80,
        pushStrength: 120,
        mode: Math.random() > 0.5 ? 'pull' : 'push',
        switchTimer: randomRange(3, 7),
      } as GravitationalAnomalyData,
    };
  }

  private createPhaseBeaconEvent(id: string, position: Vector2): WorldEvent {
    return {
      id,
      type: 'phase_beacon',
      position,
      radius: 50,
      lifetime: 150,
      maxLifetime: 150,
      isActive: true,
      data: {
        phaseTime: 3.0,
        phaseCooldown: 5.0,
        nextPhaseIn: 5.0,
        beaconPhased: false,
      } as PhaseBeaconData,
    };
  }

  getEvents(): Map<string, WorldEvent> {
    return this.events;
  }

  getActiveEvents(): WorldEvent[] {
    return Array.from(this.events.values()).filter(e => e.isActive);
  }

  getEventById(id: string): WorldEvent | undefined {
    return this.events.get(id);
  }

  removeEvent(id: string): void {
    this.events.delete(id);
  }

  clearAll(): void {
    this.events.clear();
    this.recentlySpawnedEvents = [];
  }

  getRecentlySpawnedEvents(): WorldEvent[] {
    return this.recentlySpawnedEvents;
  }

  clearRecentlySpawnedEvents(): void {
    this.recentlySpawnedEvents = [];
  }

  getEventDisplayName(type: WorldEventType): string {
    const names: Record<WorldEventType, string> = {
      planar_raiders: 'Planar Raiders',
      altar_boss: 'Altar Boss',
      warp_storm: 'Warp Storm',
      resource_asteroid: 'Resource Asteroid',
      enemy_ambush: 'Enemy Ambush',
      temporal_rift: 'Temporal Rift',
      void_tear: 'Void Tear',
      crystal_bloom: 'Crystal Bloom',
      gravitational_anomaly: 'Gravitational Anomaly',
      phase_beacon: 'Phase Beacon',
    };
    return names[type] || type;
  }

  serializeEvents(): any[] {
    return Array.from(this.events.values()).map(event => {
      const serializedEvent: any = { ...event };
      
      if (event.type === 'temporal_rift' && event.data) {
        const data = event.data as TemporalRiftData;
        serializedEvent.data = {
          ...data,
          affectedEnemies: Array.from(data.affectedEnemies || []),
          affectedProjectiles: Array.from(data.affectedProjectiles || []),
        };
      }
      
      return serializedEvent;
    });
  }

  hydrateEvents(serializedEvents: any[]): void {
    this.events.clear();
    
    serializedEvents.forEach(eventData => {
      const event: WorldEvent = { ...eventData };
      
      if (event.type === 'temporal_rift' && event.data) {
        const data = event.data as any;
        event.data = {
          ...data,
          affectedEnemies: new Set(data.affectedEnemies || []),
          affectedProjectiles: new Set(data.affectedProjectiles || []),
        } as TemporalRiftData;
      }
      
      this.events.set(event.id, event);
    });
  }

  getHarvestableAsteroidNear(position: Vector2, maxDistance: number = 80): WorldEvent | null {
    for (const event of this.events.values()) {
      if (event.type === 'resource_asteroid') {
        const data = event.data as ResourceAsteroidData;
        const distance = vectorDistance(event.position, position);
        
        if (distance <= maxDistance && data.harvestable && !data.harvested) {
          return event;
        }
      }
    }
    return null;
  }

  startHarvestingAsteroid(eventId: string): boolean {
    const event = this.events.get(eventId);
    if (!event || event.type !== 'resource_asteroid') return false;
    
    const data = event.data as ResourceAsteroidData;
    if (!data.harvestable || data.harvested) return false;
    
    data.isBeingHarvested = true;
    return true;
  }

  stopHarvestingAsteroid(eventId: string): void {
    const event = this.events.get(eventId);
    if (!event || event.type !== 'resource_asteroid') return;
    
    const data = event.data as ResourceAsteroidData;
    data.isBeingHarvested = false;
  }

  updateAsteroidHarvest(
    eventId: string, 
    dt: number, 
    onEnemySpawn: (position: Vector2) => void,
    onHarvestComplete: (resourceType: ResourceType, amount: number) => void
  ): void {
    const event = this.events.get(eventId);
    if (!event || event.type !== 'resource_asteroid') return;
    
    const data = event.data as ResourceAsteroidData;
    
    if (!data.isBeingHarvested || data.harvested) return;
    
    // Update harvest progress
    data.harvestProgress += dt;
    
    // Spawn enemies periodically during harvest
    data.enemySpawnTimer += dt;
    const spawnInterval = data.harvestTime / data.maxEnemySpawns;
    
    if (data.enemySpawnTimer >= spawnInterval && data.enemiesSpawned < data.maxEnemySpawns) {
      data.enemySpawnTimer = 0;
      data.enemiesSpawned++;
      
      // Spawn enemy near asteroid
      const angle = Math.random() * Math.PI * 2;
      const spawnDistance = 100 + Math.random() * 50;
      const spawnPos = vectorAdd(
        event.position,
        vectorFromAngle(angle, spawnDistance)
      );
      onEnemySpawn(spawnPos);
    }
    
    // Check if harvest is complete
    if (data.harvestProgress >= data.harvestTime) {
      data.harvested = true;
      data.isBeingHarvested = false;
      onHarvestComplete(data.resourceType, data.resourceAmount);
    }
  }

  stopAllHarvesting(): void {
    for (const event of this.events.values()) {
      if (event.type === 'resource_asteroid') {
        const data = event.data as ResourceAsteroidData;
        data.isBeingHarvested = false;
      }
    }
  }
}

function vectorFromAngle(angle: number, magnitude: number = 1): Vector2 {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
  };
}
