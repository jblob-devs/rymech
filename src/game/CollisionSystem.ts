import { Vector2, Entity, Projectile } from '../types/game';
import { Obstacle } from './Environments';
import { vectorAdd, vectorScale, vectorNormalize, vectorSubtract } from './utils';

export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function getEntityAABB(entity: Entity): AABB {
  const halfSize = entity.size / 2;
  return {
    minX: entity.position.x - halfSize,
    maxX: entity.position.x + halfSize,
    minY: entity.position.y - halfSize,
    maxY: entity.position.y + halfSize,
  };
}

export function getObstacleAABB(obstacle: Obstacle): AABB {
  if (obstacle.shape === 'circle') {
    const radius = obstacle.size.x / 2;
    return {
      minX: obstacle.position.x - radius,
      maxX: obstacle.position.x + radius,
      minY: obstacle.position.y - radius,
      maxY: obstacle.position.y + radius,
    };
  }

  const halfWidth = obstacle.size.x / 2;
  const halfHeight = obstacle.size.y / 2;

  if (obstacle.rotation === 0) {
    return {
      minX: obstacle.position.x - halfWidth,
      maxX: obstacle.position.x + halfWidth,
      minY: obstacle.position.y - halfHeight,
      maxY: obstacle.position.y + halfHeight,
    };
  }

  const cos = Math.cos(obstacle.rotation);
  const sin = Math.sin(obstacle.rotation);
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: -halfWidth, y: halfHeight },
    { x: halfWidth, y: halfHeight },
  ];

  const rotatedCorners = corners.map((c) => ({
    x: obstacle.position.x + c.x * cos - c.y * sin,
    y: obstacle.position.y + c.x * sin + c.y * cos,
  }));

  return {
    minX: Math.min(...rotatedCorners.map((c) => c.x)),
    maxX: Math.max(...rotatedCorners.map((c) => c.x)),
    minY: Math.min(...rotatedCorners.map((c) => c.y)),
    maxY: Math.max(...rotatedCorners.map((c) => c.y)),
  };
}

export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

export function checkCircleRectCollision(
  circlePos: Vector2,
  radius: number,
  rectPos: Vector2,
  rectSize: Vector2,
  rectRotation: number
): boolean {
  const localCircle = {
    x: circlePos.x - rectPos.x,
    y: circlePos.y - rectPos.y,
  };

  const cos = Math.cos(-rectRotation);
  const sin = Math.sin(-rectRotation);
  const rotatedCircle = {
    x: localCircle.x * cos - localCircle.y * sin,
    y: localCircle.x * sin + localCircle.y * cos,
  };

  const halfWidth = rectSize.x / 2;
  const halfHeight = rectSize.y / 2;

  const closestX = Math.max(-halfWidth, Math.min(halfWidth, rotatedCircle.x));
  const closestY = Math.max(-halfHeight, Math.min(halfHeight, rotatedCircle.y));

  const distX = rotatedCircle.x - closestX;
  const distY = rotatedCircle.y - closestY;

  return distX * distX + distY * distY < radius * radius;
}

export function checkCircleCircleCollision(
  pos1: Vector2,
  radius1: number,
  pos2: Vector2,
  radius2: number
): boolean {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distSq = dx * dx + dy * dy;
  const radSum = radius1 + radius2;
  return distSq < radSum * radSum;
}

export function checkEntityObstacleCollision(
  entity: Entity,
  obstacle: Obstacle
): boolean {
  const entityRadius = entity.size / 2;

  if (obstacle.shape === 'circle') {
    return checkCircleCircleCollision(
      entity.position,
      entityRadius,
      obstacle.position,
      obstacle.size.x / 2
    );
  }

  return checkCircleRectCollision(
    entity.position,
    entityRadius,
    obstacle.position,
    obstacle.size,
    obstacle.rotation
  );
}

export function resolveEntityObstacleCollision(
  entity: Entity,
  obstacle: Obstacle
): void {
  const entityRadius = entity.size / 2;

  if (obstacle.shape === 'circle') {
    const obstacleRadius = obstacle.size.x / 2;
    const direction = vectorNormalize(
      vectorSubtract(entity.position, obstacle.position)
    );
    const targetDist = entityRadius + obstacleRadius;
    entity.position = vectorAdd(
      obstacle.position,
      vectorScale(direction, targetDist)
    );
  } else {
    const localPos = {
      x: entity.position.x - obstacle.position.x,
      y: entity.position.y - obstacle.position.y,
    };

    const cos = Math.cos(-obstacle.rotation);
    const sin = Math.sin(-obstacle.rotation);
    const rotatedPos = {
      x: localPos.x * cos - localPos.y * sin,
      y: localPos.x * sin + localPos.y * cos,
    };

    const halfWidth = obstacle.size.x / 2;
    const halfHeight = obstacle.size.y / 2;

    const closestX = Math.max(-halfWidth, Math.min(halfWidth, rotatedPos.x));
    const closestY = Math.max(-halfHeight, Math.min(halfHeight, rotatedPos.y));

    const dx = rotatedPos.x - closestX;
    const dy = rotatedPos.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < entityRadius && dist > 0) {
      const pushX = (dx / dist) * (entityRadius - dist);
      const pushY = (dy / dist) * (entityRadius - dist);

      const worldPushX = pushX * cos + pushY * sin;
      const worldPushY = -pushX * sin + pushY * cos;

      entity.position.x += worldPushX;
      entity.position.y += worldPushY;
    }
  }
}

export function checkProjectileObstacleCollision(
  projectile: Projectile,
  obstacle: Obstacle
): boolean {
  const projectileRadius = projectile.size / 2;

  if (obstacle.shape === 'circle') {
    return checkCircleCircleCollision(
      projectile.position,
      projectileRadius,
      obstacle.position,
      obstacle.size.x / 2
    );
  }

  return checkCircleRectCollision(
    projectile.position,
    projectileRadius,
    obstacle.position,
    obstacle.size,
    obstacle.rotation
  );
}

export function calculateRicochetVelocity(
  velocity: Vector2,
  obstacle: Obstacle,
  projectilePos: Vector2
): Vector2 {
  if (obstacle.shape === 'circle') {
    const normal = vectorNormalize(
      vectorSubtract(projectilePos, obstacle.position)
    );
    const dot = velocity.x * normal.x + velocity.y * normal.y;
    return {
      x: velocity.x - 2 * dot * normal.x,
      y: velocity.y - 2 * dot * normal.y,
    };
  }

  const localPos = {
    x: projectilePos.x - obstacle.position.x,
    y: projectilePos.y - obstacle.position.y,
  };

  const cos = Math.cos(-obstacle.rotation);
  const sin = Math.sin(-obstacle.rotation);
  const rotatedPos = {
    x: localPos.x * cos - localPos.y * sin,
    y: localPos.x * sin + localPos.y * cos,
  };

  const halfWidth = obstacle.size.x / 2;
  const halfHeight = obstacle.size.y / 2;

  const dx = Math.abs(rotatedPos.x) - halfWidth;
  const dy = Math.abs(rotatedPos.y) - halfHeight;

  let normal: Vector2;
  if (dx > dy) {
    normal = { x: rotatedPos.x > 0 ? 1 : -1, y: 0 };
  } else {
    normal = { x: 0, y: rotatedPos.y > 0 ? 1 : -1 };
  }

  const worldNormal = {
    x: normal.x * cos + normal.y * sin,
    y: -normal.x * sin + normal.y * cos,
  };

  const dot = velocity.x * worldNormal.x + velocity.y * worldNormal.y;
  return {
    x: velocity.x - 2 * dot * worldNormal.x,
    y: velocity.y - 2 * dot * worldNormal.y,
  };
}
