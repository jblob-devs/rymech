import { PlanarAnchor, PlanarRemnant } from '../types/game';
import { Camera } from './Camera';

export class PlanarRenderer {
  renderAnchor(ctx: CanvasRenderingContext2D, anchor: PlanarAnchor, camera: Camera): void {
    if (!camera.isInView(anchor.position, anchor.size * 2)) return;

    const screenPos = camera.worldToScreen(anchor.position);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(anchor.rotation);

    // Outer pulsing ring
    const pulseSize = anchor.size + Math.sin(anchor.pulsePhase) * 5;
    const glowAlpha = 0.3 + Math.sin(anchor.pulsePhase) * 0.2;
    
    const gradient = ctx.createRadialGradient(0, 0, anchor.size * 0.5, 0, 0, pulseSize);
    const color = anchor.type === 'base_camp' ? '#4ADE80' : '#60A5FA';
    const isRespawn = anchor.isSetAsRespawn;
    
    gradient.addColorStop(0, `${color}${Math.floor(anchor.glowIntensity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.7, `${color}${Math.floor(glowAlpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Core geometric shape
    const sides = anchor.type === 'base_camp' ? 6 : 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * anchor.size;
      const y = Math.sin(angle) * anchor.size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Inner activated/respawn marker
    if (anchor.isActivated) {
      ctx.fillStyle = `${color}40`;
      ctx.beginPath();
      ctx.arc(0, 0, anchor.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isRespawn) {
      // Respawn indicator
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, anchor.size * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 0);
    }

    // Type indicator
    ctx.fillStyle = '#fff';
    ctx.font = anchor.type === 'base_camp' ? 'bold 10px monospace' : '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(anchor.type === 'base_camp' ? 'BASE' : 'ANCHOR', 0, anchor.size + 10);

    ctx.restore();
  }

  renderRemnant(ctx: CanvasRenderingContext2D, remnant: PlanarRemnant, camera: Camera): void {
    if (!camera.isInView(remnant.position, remnant.size * 2)) return;

    const screenPos = camera.worldToScreen(remnant.position);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(remnant.rotation);

    // Pulsing ominous glow
    const pulseSize = remnant.size + Math.sin(remnant.pulsePhase) * 3;
    const pulseAlpha = 0.4 + Math.sin(remnant.pulsePhase * 1.5) * 0.3;
    
    const gradient = ctx.createRadialGradient(0, 0, remnant.size * 0.3, 0, 0, pulseSize);
    gradient.addColorStop(0, `rgba(220, 38, 38, ${pulseAlpha})`);
    gradient.addColorStop(0.6, `rgba(220, 38, 38, ${pulseAlpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Skull-like shape (simplified)
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
    
    // Main circle (skull)
    ctx.beginPath();
    ctx.arc(0, -5, remnant.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cross marker
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-remnant.size * 0.5, -remnant.size * 0.5);
    ctx.lineTo(remnant.size * 0.5, remnant.size * 0.5);
    ctx.moveTo(remnant.size * 0.5, -remnant.size * 0.5);
    ctx.lineTo(-remnant.size * 0.5, remnant.size * 0.5);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('REMNANT', 0, remnant.size + 5);

    ctx.restore();
  }

  renderAnchors(ctx: CanvasRenderingContext2D, anchors: PlanarAnchor[], camera: Camera): void {
    anchors.forEach(anchor => {
      this.renderAnchor(ctx, anchor, camera);
    });
  }

  renderRemnants(ctx: CanvasRenderingContext2D, remnants: PlanarRemnant[], camera: Camera): void {
    remnants.forEach(remnant => {
      this.renderRemnant(ctx, remnant, camera);
    });
  }
}
