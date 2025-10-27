import { Camera } from './Camera';
import {
  AnyBiomeFeature,
  IslandFeature,
  VoidGapFeature,
  RealityTearFeature,
  GlacialSpireFeature,
  LavaPillarFeature,
  ToxicPoolFeature,
  CrystalFormationFeature,
  CoralReefFeature,
  BloomTreeFeature,
  GravityAnomalyFeature,
} from './BiomeFeatures';

export class BiomeFeatureRenderer {
  private time: number = 0;

  update(deltaTime: number): void {
    this.time += deltaTime;
  }

  private computeConvexHull(points: Array<{x: number, y: number}>): Array<{x: number, y: number}> {
    if (points.length < 3) return points;

    const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const cross = (o: {x: number, y: number}, a: {x: number, y: number}, b: {x: number, y: number}) => {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    };

    const lower: Array<{x: number, y: number}> = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper: Array<{x: number, y: number}> = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  renderFeature(
    ctx: CanvasRenderingContext2D,
    feature: AnyBiomeFeature,
    camera: Camera
  ): void {
    if (!camera.isInView(feature.position, feature.size * 2)) return;

    switch (feature.type) {
      case 'island':
        this.renderIsland(ctx, feature as IslandFeature, camera);
        break;
      case 'void-gap':
        this.renderVoidGap(ctx, feature as VoidGapFeature, camera);
        break;
      case 'reality-tear':
        this.renderRealityTear(ctx, feature as RealityTearFeature, camera);
        break;
      case 'glacial-spire':
        this.renderGlacialSpire(ctx, feature as GlacialSpireFeature, camera);
        break;
      case 'lava-pillar':
        this.renderLavaPillar(ctx, feature as LavaPillarFeature, camera);
        break;
      case 'toxic-pool':
        this.renderToxicPool(ctx, feature as ToxicPoolFeature, camera);
        break;
      case 'crystal-formation':
        this.renderCrystalFormation(
          ctx,
          feature as CrystalFormationFeature,
          camera
        );
        break;
      case 'coral-reef':
        this.renderCoralReef(ctx, feature as CoralReefFeature, camera);
        break;
      case 'bloom-tree':
        this.renderBloomTree(ctx, feature as BloomTreeFeature, camera);
        break;
      case 'gravity-anomaly':
        this.renderGravityAnomaly(
          ctx,
          feature as GravityAnomalyFeature,
          camera
        );
        break;
    }
  }

  private renderIsland(
    ctx: CanvasRenderingContext2D,
    feature: IslandFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(feature.rotation);

    ctx.fillStyle = feature.data.surfaceColor;
    ctx.strokeStyle = feature.data.edgeColor;
    ctx.lineWidth = 4;

    ctx.beginPath();

    if (feature.data.shape === 'circular') {
      ctx.arc(0, 0, feature.data.width / 2, 0, Math.PI * 2);
    } else if (feature.data.shape === 'elongated') {
      ctx.ellipse(
        0,
        0,
        feature.data.width / 2,
        feature.data.height / 2,
        0,
        0,
        Math.PI * 2
      );
    } else {
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const variance = 0.8 + Math.sin(i * 2.5) * 0.2;
        const radius = (feature.data.width / 2) * variance;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * (feature.data.height / 2) * variance;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 30;
    ctx.shadowColor = feature.data.edgeColor;
    ctx.stroke();

    ctx.restore();
  }

  private renderVoidGap(
    ctx: CanvasRenderingContext2D,
    feature: VoidGapFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    feature.data.voidTendrils.forEach((tendril, index) => {
      const tendrilAngle = tendril.angle + this.time * tendril.speed;
      const waveAmplitude = Math.sin(this.time * 2 + index) * 15;

      ctx.strokeStyle = `rgba(138, 43, 226, ${0.4 + Math.sin(this.time * 3 + index) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let i = 0; i <= 10; i++) {
        const segmentLength = (tendril.length / 10) * i;
        const waveOffset = Math.sin((i / 10) * Math.PI * 2 + this.time * 2) * waveAmplitude * (i / 10);
        const x = Math.cos(tendrilAngle) * segmentLength + Math.cos(tendrilAngle + Math.PI / 2) * waveOffset;
        const y = Math.sin(tendrilAngle) * segmentLength + Math.sin(tendrilAngle + Math.PI / 2) * waveOffset;
        ctx.lineTo(x, y);
      }

      ctx.stroke();

      const tipX = Math.cos(tendrilAngle) * tendril.length;
      const tipY = Math.sin(tendrilAngle) * tendril.length;
      const tipPulse = Math.sin(this.time * 4 + index) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(168, 85, 247, ${tipPulse})`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a855f7';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    const gradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      feature.data.width / 2
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    gradient.addColorStop(0.7, 'rgba(10, 5, 20, 0.7)');
    gradient.addColorStop(1, 'rgba(30, 15, 60, 0.2)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      feature.data.width / 2,
      feature.data.height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const pulse = Math.sin(this.time * 2) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(100, 50, 200, ${pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (feature.data.hasOminousTendril && feature.data.ominousTendrilAngle !== undefined) {
      const ominousAngle = feature.data.ominousTendrilAngle;
      const ominousLength = Math.max(feature.data.width, feature.data.height) * 0.8;
      const pulse = feature.data.ominousTendrilPulse || 0;
      const glowIntensity = Math.sin(pulse * 2) * 0.3 + 0.7;

      ctx.shadowBlur = 30 * glowIntensity;
      ctx.shadowColor = '#7c3aed';
      ctx.strokeStyle = `rgba(124, 58, 237, ${0.8 * glowIntensity})`;
      ctx.lineWidth = 8;

      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let i = 0; i <= 15; i++) {
        const segmentLength = (ominousLength / 15) * i;
        const waveOffset = Math.sin((i / 15) * Math.PI * 4 + pulse * 3) * 25 * (i / 15);
        const x = Math.cos(ominousAngle) * segmentLength + Math.cos(ominousAngle + Math.PI / 2) * waveOffset;
        const y = Math.sin(ominousAngle) * segmentLength + Math.sin(ominousAngle + Math.PI / 2) * waveOffset;
        ctx.lineTo(x, y);
      }

      ctx.stroke();

      const tipX = Math.cos(ominousAngle) * ominousLength;
      const tipY = Math.sin(ominousAngle) * ominousLength;

      ctx.shadowBlur = 40;
      ctx.fillStyle = `rgba(167, 139, 250, ${glowIntensity})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(124, 58, 237, ${glowIntensity})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderRealityTear(
    ctx: CanvasRenderingContext2D,
    feature: RealityTearFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(feature.rotation);

    const baseColor = feature.data.isPortal
      ? 'rgba(192, 132, 252, '
      : 'rgba(138, 43, 226, ';
    const gradient = ctx.createLinearGradient(
      -feature.data.width / 2,
      0,
      feature.data.width / 2,
      0
    );
    gradient.addColorStop(0, baseColor + '0)');
    gradient.addColorStop(0.5, baseColor + '0.8)');
    gradient.addColorStop(1, baseColor + '0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(
      -feature.data.width / 2,
      -feature.data.height / 2,
      feature.data.width,
      feature.data.height
    );

    const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
    const strokeColor = feature.data.isPortal
      ? `rgba(232, 121, 249, ${pulse})`
      : `rgba(200, 100, 255, ${pulse})`;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = feature.data.isPortal ? 3 : 2;

    ctx.beginPath();
    ctx.moveTo(-feature.data.width / 2, 0);
    ctx.quadraticCurveTo(
      0,
      -feature.data.height / 3,
      feature.data.width / 2,
      0
    );
    ctx.quadraticCurveTo(
      0,
      feature.data.height / 3,
      -feature.data.width / 2,
      0
    );
    ctx.stroke();

    if (feature.data.isPortal) {
      ctx.fillStyle = `rgba(192, 132, 252, ${pulse * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        feature.data.width * 0.3,
        feature.data.height * 0.3,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    feature.data.particles.forEach((particle, index) => {
      const particleTime = this.time * particle.speed + index;
      const x = particle.offset.x + Math.cos(particleTime) * 20;
      const y = particle.offset.y + Math.sin(particleTime * 1.5) * 30;

      const particleColor = feature.data.isPortal
        ? `rgba(232, 121, 249, ${0.7 * pulse})`
        : `rgba(200, 150, 255, ${0.6 * pulse})`;
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private renderGlacialSpire(
    ctx: CanvasRenderingContext2D,
    feature: GlacialSpireFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(feature.rotation);

    feature.data.snowDrift.forEach((drift) => {
      ctx.save();
      ctx.translate(drift.offset.x, drift.offset.y);
      ctx.rotate(drift.angle);

      const driftGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, drift.size);
      driftGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      driftGradient.addColorStop(0.6, 'rgba(160, 196, 255, 0.2)');
      driftGradient.addColorStop(1, 'rgba(160, 196, 255, 0)');

      ctx.fillStyle = driftGradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, drift.size, drift.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    const segmentHeight = feature.data.height / feature.data.segments;

    for (let i = feature.data.segments - 1; i >= 0; i--) {
      const y = -feature.data.height / 2 + i * segmentHeight;
      const widthFactor = 1 - i / feature.data.segments;
      const width = feature.data.baseWidth * widthFactor;

      const gradient = ctx.createLinearGradient(-width / 2, y, width / 2, y);
      if (i % 2 === 0) {
        gradient.addColorStop(0, '#a0c4ff');
        gradient.addColorStop(0.5, feature.data.iceColor);
        gradient.addColorStop(1, '#a0c4ff');
      } else {
        gradient.addColorStop(0, '#d0e7ff');
        gradient.addColorStop(0.5, '#c7d2fe');
        gradient.addColorStop(1, '#d0e7ff');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(-width / 2, y + segmentHeight);
      ctx.lineTo(width / 2, y + segmentHeight);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const sparkle = Math.sin(this.time * 3) * 0.5 + 0.5;
    for (let i = 0; i < 5; i++) {
      const sparkleY = -feature.data.height / 2 + (i / 5) * feature.data.height;
      const sparkleX = (Math.sin(this.time * 2 + i) * feature.data.baseWidth) / 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.8})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 40;
    ctx.shadowColor = feature.data.iceColor;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(0, -feature.data.height / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = feature.data.iceColor;
    ctx.beginPath();
    ctx.arc(0, -feature.data.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /*
  private renderGlacialSpire(
    ctx: CanvasRenderingContext2D,
    feature: GlacialSpireFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(Math.round(screenPos.x), Math.round(screenPos.y));
    ctx.rotate(feature.rotation);

    const segmentHeight = feature.data.height / feature.data.segments;
    const baseWidth = feature.data.baseWidth;
    const iceColor = feature.data.iceColor;
    const lightColor = '#c7d2fe'; // A light, slightly blue-ish color
    const shadowColor = 'rgba(0, 50, 100, 0.2)'; // A dark, subtle blue for the shadow

    // --- 1. Draw Segments (Back to Front) ---
    for (let i = feature.data.segments - 1; i >= 0; i--) {
      const y = -feature.data.height / 2 + i * segmentHeight;

      // Introduce randomness for a jagged, natural look
      const taperFactor = 1 - i / feature.data.segments;
      // Random variation: up to 20% of the baseWidth
      const jaggedness =
        ((Math.random() - 0.5) * 0.4 * baseWidth) / feature.data.segments;
      const currentWidth = baseWidth * taperFactor + jaggedness;

      const nextY = y + segmentHeight;

      // --- Shadow Pass (Gives it a 3D effect) ---
      // Draw a slightly darker, slightly offset version of the segment
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      // Shift points slightly to the right (assuming light is from the top-left)
      const shadowOffset = 3;
      ctx.moveTo(shadowOffset, y);
      ctx.lineTo(-currentWidth / 2 + shadowOffset, nextY);
      ctx.lineTo(currentWidth / 2 + shadowOffset, nextY);
      ctx.closePath();
      ctx.fill();

      // --- Main Segment Pass ---
      // Alternating colors for depth/texture
      ctx.fillStyle = i % 2 === 0 ? iceColor : lightColor;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(-currentWidth / 2, nextY);
      ctx.lineTo(currentWidth / 2, nextY);
      ctx.closePath();
      ctx.fill();

      // --- Outline/Highlight (Optional: Adds more definition) ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // --- 2. Dramatic Tip Glow and Cap ---
    const tipY = -feature.data.height / 2;

    // Stronger, wider outer glow effect
    ctx.shadowBlur = 50; // Increased blur for a more ethereal glow
    ctx.shadowColor = iceColor;

    // Draw a larger, semi-transparent circle for the intense core light
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, tipY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw the final, sharp tip with the main ice color
    ctx.shadowBlur = 0; // Turn off shadow for the absolute tip
    ctx.fillStyle = iceColor;
    ctx.beginPath();
    ctx.arc(0, tipY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
*/
  private renderLavaPillar(
    ctx: CanvasRenderingContext2D,
    feature: LavaPillarFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    const bubble = feature.data.isErupting
      ? 1.2
      : Math.sin(this.time * 10 + feature.position.x) * 0.1 + 0.9;

    const gradient = ctx.createLinearGradient(
      0,
      -feature.data.height / 2,
      0,
      feature.data.height / 2
    );
    gradient.addColorStop(0, '#ffdd00');
    gradient.addColorStop(0.2, '#ff6600');
    gradient.addColorStop(0.5, '#f97316');
    gradient.addColorStop(0.8, '#9a3412');
    gradient.addColorStop(1, '#7c2d12');

    ctx.fillStyle = gradient;
    ctx.fillRect(
      -feature.data.width / 2,
      -feature.data.height / 2,
      feature.data.width,
      feature.data.height * bubble
    );

    const glowIntensity = feature.data.isErupting
      ? feature.data.glowIntensity * 3
      : feature.data.glowIntensity;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = '#ff6600';

    ctx.strokeStyle = feature.data.isErupting ? '#fff5e6' : '#fdba74';
    ctx.lineWidth = feature.data.isErupting ? 3 : 2;
    ctx.strokeRect(
      -feature.data.width / 2,
      -feature.data.height / 2,
      feature.data.width,
      feature.data.height
    );

    if (feature.data.isErupting) {
      feature.data.lavaParticles.forEach((particle) => {
        ctx.fillStyle = `rgba(251, 146, 60, ${particle.lifetime / 1.5})`;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(particle.offset.x, particle.offset.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      for (let i = 0; i < 5; i++) {
        const bubbleY =
          ((this.time * 50 + i * 100) % feature.data.height) -
          feature.data.height / 2;
        const bubbleX = (Math.sin(this.time + i) * feature.data.width) / 4;

        ctx.fillStyle = 'rgba(251, 146, 60, 0.6)';
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderToxicPool(
    ctx: CanvasRenderingContext2D,
    feature: ToxicPoolFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    const gradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      feature.data.radius
    );
    gradient.addColorStop(0, 'rgba(132, 204, 22, 0.6)');
    gradient.addColorStop(0.5, 'rgba(132, 204, 22, 0.4)');
    gradient.addColorStop(1, 'rgba(132, 204, 22, 0.1)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, feature.data.radius, 0, Math.PI * 2);
    ctx.fill();

    feature.data.miasma.forEach((miasma, index) => {
      const miasmaPulse = Math.sin(this.time * miasma.pulseSpeed + index) * 0.3 + 0.7;
      const miasmaGradient = ctx.createRadialGradient(
        miasma.offset.x,
        miasma.offset.y,
        0,
        miasma.offset.x,
        miasma.offset.y,
        miasma.radius * miasmaPulse
      );
      miasmaGradient.addColorStop(0, 'rgba(163, 230, 53, 0.3)');
      miasmaGradient.addColorStop(0.7, 'rgba(101, 163, 13, 0.2)');
      miasmaGradient.addColorStop(1, 'rgba(101, 163, 13, 0)');

      ctx.fillStyle = miasmaGradient;
      ctx.beginPath();
      ctx.arc(miasma.offset.x, miasma.offset.y, miasma.radius * miasmaPulse, 0, Math.PI * 2);
      ctx.fill();
    });

    feature.data.bubbles.forEach((bubble, index) => {
      const bubblePhase = (this.time * bubble.speed + index) % 3;
      const scale =
        bubblePhase < 1.5 ? bubblePhase / 1.5 : 1 - (bubblePhase - 1.5) / 1.5;

      if (scale > 0.1) {
        ctx.fillStyle = `rgba(163, 230, 53, ${0.5 * scale})`;
        ctx.beginPath();
        ctx.arc(
          bubble.offset.x,
          bubble.offset.y,
          bubble.size * scale,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = `rgba(190, 242, 100, ${0.7 * scale})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  private renderCrystalFormation(
    ctx: CanvasRenderingContext2D,
    feature: CrystalFormationFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    if (feature.data.isResonating) {
      const resonancePulse = Math.sin(this.time * 8) * 0.5 + 0.5;
      ctx.shadowBlur = 40 * resonancePulse;
      ctx.shadowColor = feature.data.glowColor;
      ctx.strokeStyle = feature.data.glowColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 120, 0, Math.PI * 2);
      ctx.stroke();
    }

    feature.data.crystals.forEach((crystal) => {
      ctx.save();
      ctx.translate(crystal.offset.x, crystal.offset.y);
      ctx.rotate(crystal.angle);

      const gradient = ctx.createLinearGradient(
        0,
        -crystal.height / 2,
        0,
        crystal.height / 2
      );
      gradient.addColorStop(0, feature.data.glowColor);
      gradient.addColorStop(0.5, '#67e8f9');
      gradient.addColorStop(1, '#0891b2');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -crystal.height / 2);
      ctx.lineTo(-crystal.width / 2, crystal.height / 2);
      ctx.lineTo(crystal.width / 2, crystal.height / 2);
      ctx.closePath();
      ctx.fill();

      const pulse =
        Math.sin(this.time * 2 + crystal.offset.x * 0.1) * 0.3 + 0.7;
      const glowMultiplier = feature.data.isResonating ? 1.5 : 1;
      ctx.shadowBlur = 20 * glowMultiplier;
      ctx.shadowColor = feature.data.glowColor;
      ctx.strokeStyle = `rgba(34, 211, 238, ${pulse * glowMultiplier})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });

    ctx.restore();
  }

  private renderCoralReef(
    ctx: CanvasRenderingContext2D,
    feature: CoralReefFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(feature.rotation);

    if (feature.data.waterPools.length > 0) {
      const avgX = feature.data.waterPools.reduce((sum, p) => sum + p.offset.x, 0) / feature.data.waterPools.length;
      const avgY = feature.data.waterPools.reduce((sum, p) => sum + p.offset.y, 0) / feature.data.waterPools.length;
      const maxRadius = Math.max(...feature.data.waterPools.map(p => p.radius));

      const waterGradient = ctx.createRadialGradient(avgX, avgY, 0, avgX, avgY, maxRadius * 1.5);
      waterGradient.addColorStop(0, 'rgba(34, 211, 238, 0.5)');
      waterGradient.addColorStop(0.5, 'rgba(20, 184, 166, 0.35)');
      waterGradient.addColorStop(1, 'rgba(20, 184, 166, 0.05)');

      ctx.fillStyle = waterGradient;
      ctx.beginPath();

      const points: Array<{x: number, y: number}> = [];
      const segments = 32;

      feature.data.waterPools.forEach((pool) => {
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const blobVariation = 0.95 + Math.sin(angle * 3 + this.time * 0.3) * 0.05;
          const x = pool.offset.x + Math.cos(angle) * pool.radius * blobVariation;
          const y = pool.offset.y + Math.sin(angle) * pool.radius * blobVariation;
          points.push({x, y});
        }
      });

      if (points.length > 0) {
        const hull = this.computeConvexHull(points);

        if (hull.length > 0) {
          ctx.moveTo(hull[0].x, hull[0].y);
          for (let i = 0; i < hull.length; i++) {
            const current = hull[i];
            const next = hull[(i + 1) % hull.length];
            const nextNext = hull[(i + 2) % hull.length];

            const cpX = next.x + (nextNext.x - current.x) * 0.15;
            const cpY = next.y + (nextNext.y - current.y) * 0.15;

            ctx.quadraticCurveTo(next.x, next.y, cpX, cpY);
          }
          ctx.closePath();
          ctx.fill();

          const ripple = Math.sin(this.time * 2) * 0.3 + 0.7;
          ctx.strokeStyle = `rgba(94, 234, 212, ${ripple * 0.5})`;
          ctx.lineWidth = 3;
          ctx.stroke();

          for (let sandPatch = 0; sandPatch < 3; sandPatch++) {
            const patchAngle = (sandPatch / 3) * Math.PI * 2;
            const patchDist = maxRadius * 1.2 + sandPatch * 30;
            const patchX = avgX + Math.cos(patchAngle) * patchDist;
            const patchY = avgY + Math.sin(patchAngle) * patchDist;

            const sandGradient = ctx.createRadialGradient(patchX, patchY, 0, patchX, patchY, 40);
            sandGradient.addColorStop(0, 'rgba(222, 184, 135, 0.6)');
            sandGradient.addColorStop(0.7, 'rgba(210, 170, 120, 0.3)');
            sandGradient.addColorStop(1, 'rgba(210, 170, 120, 0)');

            ctx.fillStyle = sandGradient;
            ctx.beginPath();
            ctx.ellipse(patchX, patchY, 45 + sandPatch * 10, 30 + sandPatch * 5, patchAngle, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    const sway = Math.sin(this.time * feature.data.swaySpeed) * 0.15;

    feature.data.branches.forEach((branch, index) => {
      ctx.save();
      ctx.translate(branch.offset.x, branch.offset.y);
      ctx.rotate(branch.angle + sway * (1 + index * 0.1));

      const gradient = ctx.createLinearGradient(0, 0, 0, branch.length);
      gradient.addColorStop(0, '#14b8a6');
      gradient.addColorStop(0.5, '#2dd4bf');
      gradient.addColorStop(1, '#5eead4');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = branch.thickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, branch.length);
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const subBranchY = (branch.length * (i + 1)) / 4;
        const subBranchLength = branch.length * 0.3;
        const subAngle = (i % 2 === 0 ? 0.5 : -0.5) + sway * 0.5;

        ctx.save();
        ctx.translate(0, subBranchY);
        ctx.rotate(subAngle);
        ctx.lineWidth = branch.thickness * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, subBranchLength);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    });

    feature.data.fishSchools.forEach((school, schoolIndex) => {
      for (let i = 0; i < school.count; i++) {
        const turnTime = this.time * 0.3 + i * 2.5 + schoolIndex * 3.7;
        const turnAngle = Math.sin(turnTime) * 0.8;

        const baseAngle = school.angle + turnAngle;
        const swimSpeed = school.speed * 0.4;
        const swimDistance = 60 + i * 20;

        const pathX = Math.cos(baseAngle) * swimDistance;
        const pathY = Math.sin(baseAngle) * swimDistance;
        const offsetX = Math.sin(this.time * swimSpeed + i) * 15;
        const offsetY = Math.cos(this.time * swimSpeed * 0.7 + i) * 10;

        const x = school.offset.x + pathX + offsetX;
        const y = school.offset.y + pathY + offsetY;

        const prevX = school.offset.x + Math.cos(baseAngle - 0.1) * swimDistance + Math.sin((this.time - 0.05) * swimSpeed + i) * 15;
        const prevY = school.offset.y + Math.sin(baseAngle - 0.1) * swimDistance + Math.cos((this.time - 0.05) * swimSpeed * 0.7 + i) * 10;

        const swimAngle = Math.atan2(y - prevY, x - prevX);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(swimAngle);

        const fishPulse = Math.sin(this.time * 4 + i) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(94, 234, 212, ${fishPulse * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-12, -3);
        ctx.lineTo(-12, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    });

    ctx.restore();
  }

  private renderBloomTree(
    ctx: CanvasRenderingContext2D,
    feature: BloomTreeFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    feature.data.fallingPetals.forEach((petal, index) => {
      const animatedY = petal.offset.y + (this.time * 30 + index * 10) % 200;
      const animatedX = petal.offset.x + Math.sin(this.time * 2 + index) * 20;
      const rotation = petal.rotation + this.time * 2;

      ctx.save();
      ctx.translate(animatedX, animatedY);
      ctx.rotate(rotation);

      const petalPulse = Math.sin(this.time * 3 + index) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(253, 224, 71, ${petalPulse * 0.8})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#fde047';

      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size, petal.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    const gradient = ctx.createLinearGradient(
      0,
      0,
      0,
      feature.data.trunkHeight
    );
    gradient.addColorStop(0, '#065f46');
    gradient.addColorStop(0.5, '#047857');
    gradient.addColorStop(1, '#064e3b');

    ctx.fillStyle = gradient;
    ctx.fillRect(
      -feature.data.trunkWidth / 2,
      0,
      feature.data.trunkWidth,
      feature.data.trunkHeight
    );

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      -feature.data.trunkWidth / 2,
      0,
      feature.data.trunkWidth,
      feature.data.trunkHeight
    );

    ctx.translate(0, -feature.data.trunkHeight * 0.2);

    const pulse = Math.sin(this.time * 2) * 0.2 + 0.8;
    const canopyGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      feature.data.canopyRadius
    );
    canopyGradient.addColorStop(0, '#fde047');
    canopyGradient.addColorStop(0.3, '#10b981');
    canopyGradient.addColorStop(0.6, '#059669');
    canopyGradient.addColorStop(1, 'rgba(5, 150, 105, 0.2)');

    ctx.shadowBlur = 30 * pulse;
    ctx.shadowColor = '#fde047';
    ctx.fillStyle = canopyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, feature.data.canopyRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < feature.data.petalCount; i++) {
      const angle = (i / feature.data.petalCount) * Math.PI * 2;
      const pulse = Math.sin(this.time * 2 + i) * 0.2 + 0.8;
      const distance = feature.data.canopyRadius * 0.7;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      ctx.fillStyle = feature.data.glowColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = feature.data.glowColor;
      ctx.beginPath();
      ctx.arc(x, y, 8 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderGravityAnomaly(
    ctx: CanvasRenderingContext2D,
    feature: GravityAnomalyFeature,
    camera: Camera
  ): void {
    const screenPos = camera.worldToScreen(feature.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    const gradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      feature.data.radius
    );
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
    gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, feature.data.radius, 0, Math.PI * 2);
    ctx.fill();

    const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(165, 180, 252, ${pulse})`;
    ctx.lineWidth = 3;

    for (let i = 0; i < 3; i++) {
      const ringRadius = feature.data.radius * (0.3 + i * 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    feature.data.orbitingDebris.forEach((debris, index) => {
      const currentAngle = debris.angle + this.time * debris.speed * debris.orbitDirection;
      const x = Math.cos(currentAngle) * debris.distance;
      const y = Math.sin(currentAngle) * debris.distance;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(currentAngle * 3);

      ctx.fillStyle = '#818cf8';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#6366f1';

      ctx.beginPath();
      ctx.moveTo(-debris.size, -debris.size * 0.5);
      ctx.lineTo(debris.size, -debris.size * 0.3);
      ctx.lineTo(debris.size * 0.7, debris.size);
      ctx.lineTo(-debris.size * 0.8, debris.size * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      if (index === 0) {
        ctx.strokeStyle = 'rgba(165, 180, 252, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, debris.distance, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    feature.data.gravitonResources.forEach((resource, index) => {
      const currentAngle = resource.angle + this.time * resource.orbitSpeed;
      const x = Math.cos(currentAngle) * resource.distance;
      const y = Math.sin(currentAngle) * resource.distance;

      const pulse = Math.sin(this.time * 3 + index) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(147, 51, 234, ${pulse})`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a855f7';
      ctx.beginPath();
      ctx.arc(x, y, resource.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(216, 180, 254, ${pulse * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      const innerPulse = Math.sin(this.time * 5 + index * 1.5) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(253, 224, 71, ${innerPulse * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, resource.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}
