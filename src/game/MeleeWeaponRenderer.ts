import { Player, Weapon } from '../types/game';
import { Camera } from './Camera';

export interface MeleeSwipeTrail {
  positions: { x: number; y: number; alpha: number }[];
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export class MeleeWeaponRenderer {
  private swipeTrails: MeleeSwipeTrail[] = [];

  drawMeleeWeapon(
    ctx: CanvasRenderingContext2D,
    player: Player,
    weapon: Weapon,
    camera: Camera,
    isLocalPlayer: boolean = true
  ): void {
    if (!weapon.meleeStats) return;

    const screenPos = camera.worldToScreen(player.position);
    const angle = player.rotation;
    const isSwinging = weapon.isSwinging || false;
    const swingTimer = weapon.swingTimer || 0;
    const swingDuration = weapon.meleeStats.swingDuration;
    const range = weapon.meleeStats.range;

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    if (isSwinging && swingTimer > 0) {
      const swingProgress = 1 - swingTimer / swingDuration;
      const swingAngle = weapon.meleeStats.swingAngle * (Math.PI / 180);
      const startAngle = angle - swingAngle / 2;
      const currentSwingAngle = startAngle + swingAngle * swingProgress;

      this.drawSwipe(ctx, weapon, range, startAngle, currentSwingAngle, swingAngle, swingProgress);
      this.drawSword(ctx, weapon, range, currentSwingAngle, swingProgress);
    } else {
      this.drawSword(ctx, weapon, range, angle, 0);
    }

    ctx.restore();
  }

  private drawSword(
    ctx: CanvasRenderingContext2D,
    weapon: Weapon,
    range: number,
    angle: number,
    swingProgress: number
  ): void {
    ctx.save();
    ctx.rotate(angle);

    const swordLength = range * 0.9;
    const swordWidth = 8;
    const handleLength = 15;
    const bladeWidth = swordWidth * (1 + swingProgress * 0.3);

    const gradient = ctx.createLinearGradient(handleLength, 0, swordLength, 0);
    gradient.addColorStop(0, weapon.color);
    gradient.addColorStop(0.5, this.lightenColor(weapon.color, 40));
    gradient.addColorStop(1, this.lightenColor(weapon.color, 80));

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, -swordWidth / 2, handleLength, swordWidth);

    ctx.beginPath();
    ctx.moveTo(handleLength, 0);
    ctx.lineTo(swordLength - 10, -bladeWidth / 2);
    ctx.lineTo(swordLength, 0);
    ctx.lineTo(swordLength - 10, bladeWidth / 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = this.lightenColor(weapon.color, 100);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowColor = weapon.color;
    ctx.shadowBlur = 15 + swingProgress * 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.stroke();

    ctx.restore();
  }

  private drawSwipe(
    ctx: CanvasRenderingContext2D,
    weapon: Weapon,
    range: number,
    startAngle: number,
    currentAngle: number,
    totalSwingAngle: number,
    progress: number
  ): void {
    const trailRadius = range * 0.85;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, trailRadius, startAngle, currentAngle, false);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, trailRadius);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.7, weapon.color + '40');
    gradient.addColorStop(1, weapon.color + '80');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.shadowColor = weapon.color;
    ctx.shadowBlur = 25;
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      const offset = (i + 1) * 8;
      const alpha = Math.floor((1 - i * 0.3) * progress * 128).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(0, 0, trailRadius - offset, startAngle, currentAngle, false);
      ctx.strokeStyle = weapon.color + alpha;
      ctx.lineWidth = 15 - i * 4;
      ctx.stroke();
    }

    const steps = Math.ceil(totalSwingAngle * 10);
    for (let i = 0; i <= steps * progress; i++) {
      const a = startAngle + (totalSwingAngle * progress * (i / steps));
      const particleAlpha = Math.floor((1 - i / steps) * 128).toString(16).padStart(2, '0');
      const x = Math.cos(a) * trailRadius;
      const y = Math.sin(a) * trailRadius;
      
      ctx.fillStyle = weapon.color + particleAlpha;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  drawSwipeTrails(ctx: CanvasRenderingContext2D, camera: Camera): void {
    this.swipeTrails = this.swipeTrails.filter(trail => trail.lifetime > 0);

    this.swipeTrails.forEach(trail => {
      const alpha = trail.lifetime / trail.maxLifetime;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = trail.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (trail.positions.length > 1) {
        ctx.beginPath();
        const firstPos = camera.worldToScreen(trail.positions[0]);
        ctx.moveTo(firstPos.x, firstPos.y);

        for (let i = 1; i < trail.positions.length; i++) {
          const pos = camera.worldToScreen(trail.positions[i]);
          ctx.lineTo(pos.x, pos.y);
        }

        ctx.stroke();
      }

      ctx.restore();
    });
  }

  updateSwipeTrails(deltaTime: number): void {
    this.swipeTrails.forEach(trail => {
      trail.lifetime -= deltaTime;
    });
  }

  addSwipeTrail(startPos: { x: number; y: number }, endPos: { x: number; y: number }, color: string): void {
    const positions: { x: number; y: number; alpha: number }[] = [];
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      positions.push({
        x: startPos.x + (endPos.x - startPos.x) * t,
        y: startPos.y + (endPos.y - startPos.y) * t,
        alpha: 1 - t * 0.5,
      });
    }

    this.swipeTrails.push({
      positions,
      color,
      lifetime: 0.3,
      maxLifetime: 0.3,
    });
  }

  clearTrails(): void {
    this.swipeTrails = [];
  }
}
