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
    const size = drone.size;
    
    // Outer ring
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();

    // Mid ring with pattern
    ctx.strokeStyle = drone.secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.fillStyle = drone.secondaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Rotating segments
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.fillStyle = drone.color;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * size * 0.5, Math.sin(angle) * size * 0.5, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center core
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderTriangle(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    
    // Main triangle
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 2;
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
    ctx.moveTo(size * 0.5, 0);
    ctx.lineTo(-size * 0.4, -size * 0.5);
    ctx.lineTo(-size * 0.4, size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Side accents
    ctx.fillStyle = drone.secondaryColor;
    ctx.beginPath();
    ctx.arc(size * 0.3, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Energy lines
    ctx.strokeStyle = drone.color + '80';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.6, 0);
    ctx.lineTo(-size * 0.5, -size * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.6, 0);
    ctx.lineTo(-size * 0.5, size * 0.4);
    ctx.stroke();
  }

  private renderSquare(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size * 0.9;
    
    // Outer square rotated
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = drone.color + '40';
    ctx.fillRect(-size * 0.9, -size * 0.9, size * 1.8, size * 1.8);
    ctx.restore();

    // Main square
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.fillRect(-size, -size, size * 2, size * 2);

    // Inner square
    ctx.fillStyle = drone.color;
    ctx.fillRect(-size * 0.5, -size * 0.5, size, size);

    // Corner accents
    const cornerSize = size * 0.3;
    ctx.fillStyle = drone.secondaryColor;
    [[-size, -size], [size - cornerSize, -size], [-size, size - cornerSize], [size - cornerSize, size - cornerSize]].forEach(([x, y]) => {
      ctx.fillRect(x, y, cornerSize, cornerSize);
    });
  }

  private renderHexagon(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    const sides = 6;
    
    // Outer hexagon
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 2;
    
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

    // Mid hexagon
    ctx.fillStyle = drone.color + '60';
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size * 0.7;
      const y = Math.sin(angle) * size * 0.7;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Inner hexagon
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size * 0.4;
      const y = Math.sin(angle) * size * 0.4;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Corner dots
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size * 0.85;
      const y = Math.sin(angle) * size * 0.85;
      ctx.fillStyle = drone.secondaryColor;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderDiamond(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    
    // Outer diamond glow
    ctx.fillStyle = drone.color + '30';
    ctx.beginPath();
    ctx.moveTo(size * 1.2, 0);
    ctx.lineTo(0, -size * 1.2);
    ctx.lineTo(-size * 1.2, 0);
    ctx.lineTo(0, size * 1.2);
    ctx.closePath();
    ctx.fill();

    // Main diamond
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(0, -size);
    ctx.lineTo(-size, 0);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mid diamond
    ctx.fillStyle = drone.color + '80';
    ctx.beginPath();
    ctx.moveTo(size * 0.6, 0);
    ctx.lineTo(0, -size * 0.6);
    ctx.lineTo(-size * 0.6, 0);
    ctx.lineTo(0, size * 0.6);
    ctx.closePath();
    ctx.fill();

    // Inner diamond
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.moveTo(size * 0.35, 0);
    ctx.lineTo(0, -size * 0.35);
    ctx.lineTo(-size * 0.35, 0);
    ctx.lineTo(0, size * 0.35);
    ctx.closePath();
    ctx.fill();

    // Edge accents
    ctx.fillStyle = drone.secondaryColor;
    [[size * 0.7, 0], [0, -size * 0.7], [-size * 0.7, 0], [0, size * 0.7]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderCross(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    const thickness = size * 0.35;
    
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 2;
    
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

    // Center circle outer
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    ctx.arc(0, 0, thickness * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Center circle inner
    ctx.fillStyle = drone.secondaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, thickness * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // End caps
    ctx.fillStyle = drone.color;
    [[0, -size], [size, 0], [0, size], [-size, 0]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, thickness * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderStar(ctx: CanvasRenderingContext2D, drone: Drone): void {
    const size = drone.size;
    const points = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    // Background star (slightly larger)
    ctx.fillStyle = drone.secondaryColor + '40';
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius * 1.1 : innerRadius * 1.1;
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

    // Main star
    ctx.fillStyle = drone.secondaryColor;
    ctx.strokeStyle = drone.color;
    ctx.lineWidth = 2;
    
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

    // Inner star
    ctx.fillStyle = drone.color;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius * 0.5 : innerRadius * 0.6;
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

    // Center core
    ctx.fillStyle = drone.secondaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
