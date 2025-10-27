import { Vector2 } from '../types/game';
import { createVector, vectorAdd, vectorScale, vectorSubtract } from './utils';

export class Camera {
  position: Vector2;
  targetPosition: Vector2;
  smoothing: number;
  viewportWidth: number;
  viewportHeight: number;

  constructor(viewportWidth: number, viewportHeight: number, smoothing: number = 0.1) {
    this.position = createVector(0, 0);
    this.targetPosition = createVector(0, 0);
    this.smoothing = smoothing;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  follow(target: Vector2): void {
    this.targetPosition = { ...target };
  }

  update(): void {
    const offset = vectorSubtract(this.targetPosition, this.position);
    const movement = vectorScale(offset, this.smoothing);
    this.position = vectorAdd(this.position, movement);
  }

  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: worldPos.x - this.position.x + this.viewportWidth / 2,
      y: worldPos.y - this.position.y + this.viewportHeight / 2,
    };
  }

  screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: screenPos.x + this.position.x - this.viewportWidth / 2,
      y: screenPos.y + this.position.y - this.viewportHeight / 2,
    };
  }

  isInView(worldPos: Vector2, padding: number = 100): boolean {
    const screenPos = this.worldToScreen(worldPos);
    return (
      screenPos.x > -padding &&
      screenPos.x < this.viewportWidth + padding &&
      screenPos.y > -padding &&
      screenPos.y < this.viewportHeight + padding
    );
  }

  getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const topLeft = this.screenToWorld(createVector(0, 0));
    const bottomRight = this.screenToWorld(createVector(this.viewportWidth, this.viewportHeight));

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y,
    };
  }
}
