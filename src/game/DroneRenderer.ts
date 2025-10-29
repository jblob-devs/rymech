import { Drone } from '../types/game';
import { Camera } from './Camera';

export class DroneRenderer {
  renderDrone(
    ctx: CanvasRenderingContext2D,
    drone: Drone,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(drone.position);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(drone.rotation);

    // Draw glow effect
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, drone.size * 1.5);
    gradient.addColorStop(0, drone.color + '80');
    gradient.addColorStop(0.5, drone.color + '40');
    gradient.addColorStop(1, drone.color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, drone.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw shape based on drone type
    switch (drone.shape) {
      case 'circle':
        this.renderCircle(ctx, drone);
        break;
      case 'triangle':
        this.renderTriangle(ctx, drone);
        break;
      case 'square':
        this.renderSquare(ctx, drone);
        break;
      case 'hexagon':
        this.renderHexagon(ctx, drone);
        break;
      case 'diamond':
        this.renderDiamond(ctx, drone);
        break;
      case 'cross':
        this.renderCross(ctx, drone);
        break;
      case 'star':
        this.renderStar(ctx, drone);
        break;
    }

    ctx.restore();
  }

  private renderCircle(ctx: CanvasRenderingContext2D, drone: Drone): void {
    // Outer ring
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, drone.size, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.fillStyle = drone.secondaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, drone.size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Center core
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.arc(0, 0, drone.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderTriangle(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    
    // Main triangle
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.8);
    ctx.lineTo(-size * 0.7, size * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner triangle
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.moveTo(size * 0.4, 0);
    ctx.lineTo(-size * 0.3, -size * 0.4);
    ctx.lineTo(-size * 0.3, size * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  private renderSquare(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size * 0.9;
    
    // Outer square
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(-size, -size, size * 2, size * 2);

    // Fill
    ctx.fillStyle = drone.secondaryColor;
    ctx.fillRect(-size, -size, size * 2, size * 2);

    // Inner square
    ctx.fillStyle = drone.color;
    ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
  }

  private renderHexagon(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    const sides = 6;
    
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner hexagon
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size * 0.5;
      const y = Math.sin(angle) * size * 0.5;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderDiamond(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    
    // Main diamond
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(0, -size);
    ctx.lineTo(-size, 0);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner diamond
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, 0);
    ctx.lineTo(0, -size * 0.5);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  private renderCross(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    const thickness = size * 0.4;
    
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 3;
    
    // Vertical bar
    ctx.beginPath();
    ctx.rect(-thickness / 2, -size, thickness, size * 2);
    ctx.fill();
    ctx.stroke();
    
    // Horizontal bar
    ctx.beginPath();
    ctx.rect(-size, -thickness / 2, size * 2, thickness);
    ctx.fill();
    ctx.stroke();

    // Center circle
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.arc(0, 0, thickness * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderStar(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    const points = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center core
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}
