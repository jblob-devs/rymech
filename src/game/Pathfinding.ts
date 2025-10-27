import { Vector2 } from '../types/game';
import { Obstacle } from './Environments';
import { vectorDistance, vectorNormalize, vectorSubtract, createVector } from './utils';
import { checkCircleRectCollision, checkCircleCircleCollision } from './CollisionSystem';

export function findPathAroundObstacles(
  start: Vector2,
  target: Vector2,
  obstacles: Obstacle[],
  entityRadius: number
): Vector2 {
  const directPath = vectorSubtract(target, start);
  const distance = Math.sqrt(directPath.x * directPath.x + directPath.y * directPath.y);

  if (distance === 0) return createVector();

  const normalized = vectorNormalize(directPath);

  const blockingObstacle = findBlockingObstacle(start, target, obstacles, entityRadius);

  if (!blockingObstacle) {
    return normalized;
  }

  const avoidanceDirection = calculateAvoidanceDirection(
    start,
    target,
    blockingObstacle,
    entityRadius
  );

  return vectorNormalize(avoidanceDirection);
}

function findBlockingObstacle(
  start: Vector2,
  target: Vector2,
  obstacles: Obstacle[],
  entityRadius: number
): Obstacle | null {
  const direction = vectorSubtract(target, start);
  const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

  if (distance === 0) return null;

  const steps = Math.ceil(distance / 10);

  for (const obstacle of obstacles) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const checkPoint = {
        x: start.x + direction.x * t,
        y: start.y + direction.y * t,
      };

      const collides =
        obstacle.shape === 'circle'
          ? checkCircleCircleCollision(
              checkPoint,
              entityRadius,
              obstacle.position,
              obstacle.size.x / 2
            )
          : checkCircleRectCollision(
              checkPoint,
              entityRadius,
              obstacle.position,
              obstacle.size,
              obstacle.rotation
            );

      if (collides) {
        return obstacle;
      }
    }
  }

  return null;
}

function calculateAvoidanceDirection(
  start: Vector2,
  target: Vector2,
  obstacle: Obstacle,
  entityRadius: number
): Vector2 {
  const toTarget = vectorSubtract(target, start);
  const toObstacle = vectorSubtract(obstacle.position, start);

  const perpendicular = { x: -toObstacle.y, y: toObstacle.x };

  const dotProduct = toTarget.x * perpendicular.x + toTarget.y * perpendicular.y;
  const avoidDirection = dotProduct >= 0 ? perpendicular : { x: -perpendicular.x, y: -perpendicular.y };

  const obstacleSize = obstacle.shape === 'circle'
    ? obstacle.size.x / 2
    : Math.max(obstacle.size.x, obstacle.size.y) / 2;

  const avoidanceWeight = 1 / (vectorDistance(start, obstacle.position) / (obstacleSize + entityRadius + 50));

  const blended = {
    x: toTarget.x * 0.3 + avoidDirection.x * avoidanceWeight * 0.7,
    y: toTarget.y * 0.3 + avoidDirection.y * avoidanceWeight * 0.7,
  };

  return blended;
}
