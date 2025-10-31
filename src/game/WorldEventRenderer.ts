import { WorldEvent, AltarBossData, WarpStormData, ResourceAsteroidData, CrystalBloomData } from './WorldEventSystem';
import { Camera } from './Camera';

export class WorldEventRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    events: WorldEvent[],
    camera: Camera
  ): void {
    for (const event of events) {
      const screenPos = camera.worldToScreen(event.position);
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      
      switch (event.type) {
        case 'altar_boss':
          this.renderAltarBoss(ctx, event);
          break;
        case 'warp_storm':
          this.renderWarpStorm(ctx, event);
          break;
        case 'resource_asteroid':
          this.renderResourceAsteroid(ctx, event);
          break;
        case 'planar_raiders':
          this.renderPlanarRaiders(ctx, event);
          break;
        case 'enemy_ambush':
          this.renderEnemyAmbush(ctx, event);
          break;
        case 'temporal_rift':
          this.renderTemporalRift(ctx, event);
          break;
        case 'void_tear':
          this.renderVoidTear(ctx, event);
          break;
        case 'crystal_bloom':
          this.renderCrystalBloom(ctx, event);
          break;
        case 'gravitational_anomaly':
          this.renderGravitationalAnomaly(ctx, event);
          break;
        case 'phase_beacon':
          this.renderPhaseBeacon(ctx, event);
          break;
      }
      
      ctx.restore();
    }
  }

  private renderAltarBoss(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    const data = event.data as AltarBossData;
    
    if (data.bossSpawned) return; // Don't render altar if boss is spawned
    
    // Draw altar base
    ctx.fillStyle = '#4a1a4a';
    ctx.beginPath();
    ctx.rect(-30, -20, 60, 40);
    ctx.fill();
    
    // Draw altar pillar
    ctx.fillStyle = '#6a2a6a';
    ctx.beginPath();
    ctx.rect(-15, -40, 30, 40);
    ctx.fill();
    
    // Draw glowing crystal on top
    const glowIntensity = data.altarGlowIntensity;
    ctx.fillStyle = `rgba(200, 100, 255, ${glowIntensity})`;
    ctx.shadowBlur = 20 * glowIntensity;
    ctx.shadowColor = '#c864ff';
    ctx.beginPath();
    ctx.arc(0, -45, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw interaction hint
    if (!data.altarInteracted) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Summon Boss', 0, 30);
    }
  }

  private renderWarpStorm(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    const data = event.data as WarpStormData;
    
    // Draw swirling void tornado
    ctx.save();
    ctx.rotate(data.rotation);
    
    const layers = 8;
    for (let i = 0; i < layers; i++) {
      const layerRadius = event.radius * (1 - i / layers);
      const alpha = (1 - i / layers) * 0.6;
      
      ctx.strokeStyle = `rgba(138, 43, 226, ${alpha})`;
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.arc(0, 0, layerRadius, 0, Math.PI * 1.5);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(75, 0, 130, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(0, 0, layerRadius * 0.8, Math.PI, Math.PI * 2.5);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Draw center void core
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(75, 0, 130, 0.3)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Warning particles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + data.rotation * 2;
      const dist = event.radius + Math.sin(data.rotation * 3 + i) * 20;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderResourceAsteroid(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    const data = event.data as ResourceAsteroidData;
    
    if (data.harvested) return;
    
    // Draw asteroid body
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    
    // Create irregular asteroid shape
    const points = 8;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = data.size * (0.8 + Math.random() * 0.4);
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
    
    // Draw resource crystals
    const resourceColors: Record<string, string> = {
      energy: '#ffff00',
      coreDust: '#ff6b00',
      flux: '#00ffff',
      singularityCore: '#ff00ff',
      voidCore: '#8b00ff',
    };
    
    const color = resourceColors[data.resourceType] || '#ffffff';
    
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const dist = data.size * 0.5;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      
      ctx.fillStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x - 5, y + 4);
      ctx.lineTo(x + 5, y + 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    
    // Draw interaction hint
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`[E] Harvest ${data.resourceType}`, 0, data.size + 20);
  }

  private renderPlanarRaiders(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    // Draw portal spawn marker
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, event.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw raid marker
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚔ RAID', 0, -event.radius - 15);
  }

  private renderEnemyAmbush(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    // Draw subtle warning circle
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, event.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private renderTemporalRift(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    // Draw swirling time distortion
    const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
    
    ctx.save();
    ctx.scale(pulseScale, pulseScale);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, event.radius);
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(150, 100, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, event.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw clock-like markers
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x1 = Math.cos(angle) * event.radius * 0.8;
      const y1 = Math.sin(angle) * event.radius * 0.8;
      const x2 = Math.cos(angle) * event.radius * 0.9;
      const y2 = Math.sin(angle) * event.radius * 0.9;
      
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  private renderVoidTear(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    const data = event.data;
    
    // Draw void tear with gravitational lensing effect
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, data.size);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.7, 'rgba(50, 0, 100, 0.8)');
    gradient.addColorStop(1, 'rgba(100, 0, 200, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, data.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw swirling edge
    ctx.strokeStyle = '#8b00ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, data.size, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderCrystalBloom(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    const data = event.data as CrystalBloomData;
    
    // Draw bloom center
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    gradient.addColorStop(0, 'rgba(100, 255, 200, 0.6)');
    gradient.addColorStop(1, 'rgba(100, 255, 200, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw crystal shards
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 30;
      const y = Math.sin(angle) * 30;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      
      ctx.fillStyle = '#64ffc8';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#64ffc8';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(-7, 10);
      ctx.lineTo(7, 10);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  private renderGravitationalAnomaly(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    const data = event.data;
    const isPull = data.mode === 'pull';
    
    // Draw anomaly core
    ctx.fillStyle = isPull ? '#ff6b00' : '#00b4ff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = isPull ? '#ff6b00' : '#00b4ff';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw field lines
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = event.radius;
      
      ctx.strokeStyle = isPull ? 'rgba(255, 107, 0, 0.4)' : 'rgba(0, 180, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      if (isPull) {
        // Arrows pointing inward
        const x1 = Math.cos(angle) * dist;
        const y1 = Math.sin(angle) * dist;
        const x2 = Math.cos(angle) * dist * 0.5;
        const y2 = Math.sin(angle) * dist * 0.5;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      } else {
        // Arrows pointing outward
        const x1 = Math.cos(angle) * dist * 0.5;
        const y1 = Math.sin(angle) * dist * 0.5;
        const x2 = Math.cos(angle) * dist;
        const y2 = Math.sin(angle) * dist;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      
      ctx.stroke();
    }
  }

  private renderPhaseBeacon(ctx: CanvasRenderingContext2D, event: WorldEvent): void {
    const data = event.data;
    
    const alpha = data.beaconPhased ? 0.3 : 1.0;
    
    // Draw beacon
    ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
    ctx.shadowBlur = data.beaconPhased ? 5 : 15;
    ctx.shadowColor = '#ffc800';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw phase indicator
    ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
    ctx.lineWidth = 3;
    ctx.setLineDash(data.beaconPhased ? [5, 5] : []);
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
