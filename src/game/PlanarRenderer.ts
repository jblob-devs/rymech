import { PlanarAnchor, PlanarRemnant, BaseCampElement } from '../types/game';
import { Camera } from './Camera';

export class PlanarRenderer {
  renderAnchor(ctx: CanvasRenderingContext2D, anchor: PlanarAnchor, camera: Camera): void {
    if (!camera.isInView(anchor.position, anchor.size * 2)) return;

    const screenPos = camera.worldToScreen(anchor.position);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    if (anchor.type === 'base_camp') {
      this.renderBaseCamp(ctx, anchor);
    } else {
      ctx.rotate(anchor.rotation);
      this.renderFieldAnchor(ctx, anchor);
    }

    ctx.restore();

    if (anchor.baseCampElements) {
      anchor.baseCampElements.forEach(element => {
        this.renderBaseCampElement(ctx, element, camera);
      });
    }
  }

  private renderBaseCamp(ctx: CanvasRenderingContext2D, anchor: PlanarAnchor): void {
    const pulseSize = anchor.size + Math.sin(anchor.pulsePhase) * 8;
    const glowAlpha = 0.2 + Math.sin(anchor.pulsePhase) * 0.15;
    
    const gradient = ctx.createRadialGradient(0, 0, anchor.size * 0.3, 0, 0, pulseSize);
    const color = '#4ADE80';
    
    gradient.addColorStop(0, `${color}${Math.floor(anchor.glowIntensity * 100).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `${color}${Math.floor(glowAlpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    const sides = 6;
    ctx.strokeStyle = `${color}60`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2 + anchor.rotation;
      const x = Math.cos(angle) * anchor.size;
      const y = Math.sin(angle) * anchor.size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    if (anchor.isSetAsRespawn) {
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, anchor.size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 0);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BASE CAMP', 0, anchor.size + 15);
  }

  private renderFieldAnchor(ctx: CanvasRenderingContext2D, anchor: PlanarAnchor): void {
    const pulseSize = anchor.size + Math.sin(anchor.pulsePhase) * 5;
    const glowAlpha = 0.3 + Math.sin(anchor.pulsePhase) * 0.2;
    
    const gradient = ctx.createRadialGradient(0, 0, anchor.size * 0.5, 0, 0, pulseSize);
    const color = '#60A5FA';
    const isRespawn = anchor.isSetAsRespawn;
    
    gradient.addColorStop(0, `${color}${Math.floor(anchor.glowIntensity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.7, `${color}${Math.floor(glowAlpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    const sides = 8;
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

    if (anchor.isActivated) {
      ctx.fillStyle = `${color}40`;
      ctx.beginPath();
      ctx.arc(0, 0, anchor.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isRespawn) {
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

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ANCHOR', 0, anchor.size + 10);
  }

  private renderBaseCampElement(ctx: CanvasRenderingContext2D, element: BaseCampElement, camera: Camera): void {
    if (!camera.isInView(element.position, 50)) return;

    const screenPos = camera.worldToScreen(element.position);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    switch (element.type) {
      case 'campfire':
        this.renderCampfire(ctx, element);
        break;
      case 'vault_node':
        this.renderVaultNode(ctx, element);
        break;
      case 'info_sign':
        this.renderInfoSign(ctx, element);
        break;
    }

    ctx.restore();
  }

  private renderCampfire(ctx: CanvasRenderingContext2D, element: BaseCampElement): void {
    const phase = element.pulsePhase || 0;
    
    const flameHeight = 25 + Math.sin(phase * 3) * 5;
    const flameWidth = 15 + Math.sin(phase * 2.5) * 3;
    
    const gradient = ctx.createRadialGradient(0, -10, 5, 0, -flameHeight, flameWidth);
    gradient.addColorStop(0, '#FF6B00');
    gradient.addColorStop(0.3, '#FF8800');
    gradient.addColorStop(0.6, '#FFAA00');
    gradient.addColorStop(0.9, 'rgba(255, 200, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 220, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, -10, flameWidth, flameHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const particlePhase = phase + i;
      const particleHeight = -15 - (particlePhase % 2) * 20;
      const particleX = Math.sin(particlePhase * 2) * 8;
      const particleAlpha = 1 - ((particlePhase % 2) / 2);
      
      ctx.fillStyle = `rgba(255, ${100 + Math.floor(Math.random() * 100)}, 0, ${particleAlpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(particleX, particleHeight, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-12, 5, 24, 3);
    ctx.fillRect(-10, 8, 20, 3);
    ctx.fillRect(-8, 11, 16, 3);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('CAMPFIRE', 0, 20);
  }

  private renderVaultNode(ctx: CanvasRenderingContext2D, element: BaseCampElement): void {
    const phase = element.pulsePhase || 0;
    const pulseAlpha = 0.3 + Math.sin(phase) * 0.2;
    
    const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 30);
    gradient.addColorStop(0, `rgba(168, 85, 247, ${pulseAlpha})`);
    gradient.addColorStop(0.7, `rgba(168, 85, 247, ${pulseAlpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.beginPath();
    ctx.rect(-20, -25, 40, 50);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -15);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(10, -15);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 10, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('VAULT', 0, 30);
    ctx.font = '7px monospace';
    ctx.fillText('[E] to access', 0, 41);
  }

  private renderInfoSign(ctx: CanvasRenderingContext2D, element: BaseCampElement): void {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, -10, 4, 30);

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.roundRect(-25, -25, 50, 30, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3F2F1F';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = (element.text || '').split(':');
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, -15 + i * 10);
    });

    ctx.fillStyle = '#fff';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('[E] to read', 0, 25);
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
