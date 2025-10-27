import { Vector2, Enemy } from '../types/game';
import { createVector, generateId, vectorDistance, vectorNormalize, vectorScale, vectorAdd, vectorSubtract, vectorFromAngle } from './utils';

export interface VoidSubdivider extends Enemy {
  type: 'boss';
  bossType: 'void_subdivider';
  segments: VoidSegment[];
  attackTimer: number;
  attackPhase: 'idle' | 'dash' | 'teleport' | 'breath' | 'coil' | 'tendril_strike';
  phaseTimer: number;
  breathDirection?: number;
  breathTimer?: number;
  dashDirection?: Vector2;
  dashSpeed?: number;
  dashDuration?: number;
  teleportCooldown: number;
  tendrilAttacks: TendrilAttack[];
  spawnAnimation: number;
  isFullySpawned: boolean;
}

export interface VoidSegment {
  position: Vector2;
  targetPosition: Vector2;
  rotation: number;
  size: number;
  offset: Vector2;
}

export interface TendrilAttack {
  id: string;
  startPos: Vector2;
  endPos: Vector2;
  progress: number;
  damage: number;
  width: number;
}

export function createVoidSubdivider(spawnPos: Vector2): VoidSubdivider {
  const segmentCount = 24;
  const segments: VoidSegment[] = [];

  for (let i = 0; i < segmentCount; i++) {
    const offsetDistance = i * 45;
    const angle = Math.PI * 1.5;
    const offset = createVector(
      Math.cos(angle) * offsetDistance,
      Math.sin(angle) * offsetDistance
    );

    segments.push({
      position: createVector(spawnPos.x, spawnPos.y),
      targetPosition: createVector(spawnPos.x, spawnPos.y),
      rotation: 0,
      size: 50 - (i * 1.5),
      offset,
    });
  }

  return {
    id: generateId(),
    type: 'boss',
    bossType: 'void_subdivider',
    position: createVector(spawnPos.x, spawnPos.y),
    velocity: createVector(0, 0),
    size: 60,
    health: 15000,
    maxHealth: 15000,
    damage: 40,
    speed: 2.5,
    rotation: 0,
    color: '#1a0a2e',
    attackCooldown: 0,
    currencyDrop: 2500,
    segments,
    attackTimer: 0,
    attackPhase: 'idle',
    phaseTimer: 0,
    teleportCooldown: 0,
    tendrilAttacks: [],
    spawnAnimation: 0,
    isFullySpawned: false,
  };
}

export function updateVoidSubdivider(
  boss: VoidSubdivider,
  dt: number,
  playerPos: Vector2,
  createParticlesFn: (pos: Vector2, count: number, color: string, lifetime: number) => void
): void {
  if (!boss.isFullySpawned) {
    boss.spawnAnimation += dt * 0.8;

    if (boss.spawnAnimation >= 1) {
      boss.isFullySpawned = true;
    }

    for (let i = 0; i < boss.segments.length; i++) {
      const segment = boss.segments[i];
      const targetY = boss.position.y + i * 45;
      const progress = Math.min(boss.spawnAnimation, 1);
      segment.position.y = boss.position.y + (targetY - boss.position.y) * progress;
      segment.position.x = boss.position.x;
    }

    if (Math.random() < 0.1) {
      createParticlesFn(boss.segments[0].position, 3, '#7c3aed', 0.4);
    }

    return;
  }

  boss.attackTimer += dt;
  boss.phaseTimer += dt;
  boss.teleportCooldown = Math.max(0, boss.teleportCooldown - dt);

  const distanceToPlayer = vectorDistance(boss.position, playerPos);

  if (boss.phaseTimer >= 2 && boss.attackPhase === 'idle') {
    const rand = Math.random();

    if (boss.teleportCooldown <= 0 && rand < 0.15) {
      boss.attackPhase = 'teleport';
      boss.phaseTimer = 0;
    } else if (rand < 0.3) {
      boss.attackPhase = 'dash';
      boss.phaseTimer = 0;
      const dirToPlayer = vectorNormalize(vectorSubtract(playerPos, boss.position));
      boss.dashDirection = dirToPlayer;
      boss.dashSpeed = 18;
      boss.dashDuration = 0.6;
    } else if (rand < 0.5) {
      boss.attackPhase = 'breath';
      boss.phaseTimer = 0;
      boss.breathTimer = 0;
      boss.breathDirection = Math.atan2(
        playerPos.y - boss.position.y,
        playerPos.x - boss.position.x
      );
    } else if (rand < 0.7) {
      boss.attackPhase = 'coil';
      boss.phaseTimer = 0;
    } else {
      boss.attackPhase = 'tendril_strike';
      boss.phaseTimer = 0;
    }
  }

  switch (boss.attackPhase) {
    case 'idle':
      if (distanceToPlayer > 100) {
        const dirToPlayer = vectorNormalize(vectorSubtract(playerPos, boss.position));
        boss.velocity = vectorScale(dirToPlayer, boss.speed * 0.7);
      } else {
        const angle = Math.atan2(
          playerPos.y - boss.position.y,
          playerPos.x - boss.position.x
        );
        const orbitDir = vectorFromAngle(angle + Math.PI / 2);
        boss.velocity = vectorScale(orbitDir, boss.speed * 0.5);
      }
      break;

    case 'dash':
      if (boss.dashDirection && boss.dashSpeed && boss.dashDuration) {
        boss.velocity = vectorScale(boss.dashDirection, boss.dashSpeed);

        if (boss.phaseTimer >= boss.dashDuration) {
          boss.attackPhase = 'idle';
          boss.phaseTimer = 0;
          boss.velocity = createVector(0, 0);
        }

        if (Math.random() < 0.3) {
          createParticlesFn(boss.position, 4, '#7c3aed', 0.3);
        }
      }
      break;

    case 'teleport':
      if (boss.phaseTimer < 0.5) {
        boss.velocity = createVector(0, 0);
        if (Math.random() < 0.4) {
          createParticlesFn(boss.position, 8, '#a78bfa', 0.5);
        }
      } else if (boss.phaseTimer >= 0.5 && boss.phaseTimer < 0.6) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 300 + Math.random() * 200;
        boss.position.x = playerPos.x + Math.cos(angle) * distance;
        boss.position.y = playerPos.y + Math.sin(angle) * distance;

        createParticlesFn(boss.position, 30, '#7c3aed', 0.8);

        for (const segment of boss.segments) {
          segment.position = { ...boss.position };
        }
      } else if (boss.phaseTimer >= 1.2) {
        boss.attackPhase = 'idle';
        boss.phaseTimer = 0;
        boss.teleportCooldown = 8;
      }
      break;

    case 'breath':
      boss.velocity = createVector(0, 0);
      boss.breathTimer = (boss.breathTimer || 0) + dt;

      if (boss.breathTimer >= 2.5) {
        boss.attackPhase = 'idle';
        boss.phaseTimer = 0;
      }
      break;

    case 'coil':
      const coilCenter = {
        x: playerPos.x + Math.cos(boss.phaseTimer * 2) * 150,
        y: playerPos.y + Math.sin(boss.phaseTimer * 2) * 150,
      };
      const dirToCoil = vectorNormalize(vectorSubtract(coilCenter, boss.position));
      boss.velocity = vectorScale(dirToCoil, boss.speed * 1.5);

      if (boss.phaseTimer >= 3) {
        boss.attackPhase = 'idle';
        boss.phaseTimer = 0;
      }
      break;

    case 'tendril_strike':
      if (boss.phaseTimer < 0.8) {
        boss.velocity = createVector(0, 0);

        if (boss.phaseTimer > 0.3 && boss.tendrilAttacks.length === 0) {
          const attackCount = 5 + Math.floor(Math.random() * 4);
          for (let i = 0; i < attackCount; i++) {
            const angle = (i / attackCount) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 400 + Math.random() * 300;
            const endPos = {
              x: boss.position.x + Math.cos(angle) * distance,
              y: boss.position.y + Math.sin(angle) * distance,
            };

            boss.tendrilAttacks.push({
              id: generateId(),
              startPos: { ...boss.position },
              endPos,
              progress: 0,
              damage: 30,
              width: 20,
            });
          }
        }
      } else if (boss.phaseTimer >= 2) {
        boss.attackPhase = 'idle';
        boss.phaseTimer = 0;
        boss.tendrilAttacks = [];
      }
      break;
  }

  boss.position = vectorAdd(boss.position, vectorScale(boss.velocity, dt * 60));

  updateBossSegments(boss, dt);
  updateTendrilAttacks(boss, dt);
}

function updateBossSegments(boss: VoidSubdivider, dt: number): void {
  if (boss.segments.length === 0) return;

  boss.segments[0].targetPosition = { ...boss.position };

  for (let i = 0; i < boss.segments.length; i++) {
    const segment = boss.segments[i];

    if (i === 0) {
      const distance = vectorDistance(segment.position, segment.targetPosition);
      if (distance > 5) {
        const dir = vectorNormalize(vectorSubtract(segment.targetPosition, segment.position));
        const moveSpeed = Math.min(distance * 8, 600);
        segment.position = vectorAdd(segment.position, vectorScale(dir, moveSpeed * dt));
      } else {
        segment.position = { ...segment.targetPosition };
      }
    } else {
      const prevSegment = boss.segments[i - 1];
      const idealDistance = 45;
      const dir = vectorSubtract(prevSegment.position, segment.position);
      const currentDistance = Math.sqrt(dir.x * dir.x + dir.y * dir.y);

      if (currentDistance > 0) {
        const normalizedDir = {
          x: dir.x / currentDistance,
          y: dir.y / currentDistance,
        };

        const targetPos = {
          x: prevSegment.position.x - normalizedDir.x * idealDistance,
          y: prevSegment.position.y - normalizedDir.y * idealDistance,
        };

        const moveAmount = 0.3;
        segment.position.x += (targetPos.x - segment.position.x) * moveAmount;
        segment.position.y += (targetPos.y - segment.position.y) * moveAmount;
      }

      segment.rotation = Math.atan2(dir.y, dir.x);
    }
  }
}

function updateTendrilAttacks(boss: VoidSubdivider, dt: number): void {
  boss.tendrilAttacks = boss.tendrilAttacks.filter(attack => {
    attack.progress += dt * 1.5;
    return attack.progress < 1;
  });
}

export function checkVoidSubdividerCollision(
  boss: VoidSubdivider,
  point: Vector2,
  size: number
): boolean {
  if (!boss.isFullySpawned) return false;

  for (const segment of boss.segments) {
    const distance = vectorDistance(segment.position, point);
    if (distance < segment.size / 2 + size / 2) {
      return true;
    }
  }

  for (const tendril of boss.tendrilAttacks) {
    if (tendril.progress < 0.2 || tendril.progress > 0.9) continue;

    const currentEnd = {
      x: tendril.startPos.x + (tendril.endPos.x - tendril.startPos.x) * tendril.progress,
      y: tendril.startPos.y + (tendril.endPos.y - tendril.startPos.y) * tendril.progress,
    };

    const distToLine = pointToLineDistance(point, tendril.startPos, currentEnd);
    if (distToLine < tendril.width / 2 + size / 2) {
      return true;
    }
  }

  return false;
}

function pointToLineDistance(point: Vector2, lineStart: Vector2, lineEnd: Vector2): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return vectorDistance(point, lineStart);
  }

  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return vectorDistance(point, { x: projX, y: projY });
}
