import { VoidSubdivider } from './VoidSubdivider';
import { Camera } from './Camera';

export function renderVoidSubdivider(
  ctx: CanvasRenderingContext2D,
  boss: VoidSubdivider,
  camera: Camera
): void {
  ctx.save();

  if (!boss.isFullySpawned) {
    const alpha = Math.min(boss.spawnAnimation, 1);
    ctx.globalAlpha = alpha;

    for (let i = boss.segments.length - 1; i >= 0; i--) {
      const segment = boss.segments[i];
      const screenPos = camera.worldToScreen(segment.position);

      const gradient = ctx.createRadialGradient(
        screenPos.x, screenPos.y, 0,
        screenPos.x, screenPos.y, segment.size / 2
      );
      gradient.addColorStop(0, '#7c3aed');
      gradient.addColorStop(0.5, '#5b21b6');
      gradient.addColorStop(1, '#1a0a2e');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, segment.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  for (let i = boss.segments.length - 1; i >= 0; i--) {
    const segment = boss.segments[i];
    const screenPos = camera.worldToScreen(segment.position);
    const isHead = i === 0;

    if (isHead) {
      renderDragonHead(ctx, screenPos, segment, boss);
    } else {
      renderBodySegment(ctx, screenPos, segment, i);
    }
  }

  if (boss.attackPhase === 'breath' && boss.breathTimer && boss.breathDirection !== undefined) {
    renderBreathAttack(ctx, camera, boss);
  }

  for (const tendril of boss.tendrilAttacks) {
    if (tendril.progress < 0.1) continue;
    renderVoidTendril(ctx, camera, tendril);
  }

  renderHealthBar(ctx, camera, boss);

  ctx.restore();
}

function renderDragonHead(
  ctx: CanvasRenderingContext2D,
  screenPos: { x: number; y: number },
  segment: any,
  boss: VoidSubdivider
): void {
  const headSize = segment.size;
  const jawOpenAmount = boss.attackPhase === 'breath' ? 0.3 : 0;
  const time = Date.now() * 0.001;

  const bodyGradient = ctx.createRadialGradient(
    screenPos.x, screenPos.y, 0,
    screenPos.x, screenPos.y, headSize / 2
  );
  bodyGradient.addColorStop(0, '#7c3aed');
  bodyGradient.addColorStop(0.4, '#5b21b6');
  bodyGradient.addColorStop(0.8, '#2d1b4e');
  bodyGradient.addColorStop(1, '#1a0a2e');

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(screenPos.x + headSize * 0.6, screenPos.y);
  ctx.lineTo(screenPos.x + headSize * 0.1, screenPos.y - headSize * 0.5);
  ctx.lineTo(screenPos.x - headSize * 0.6, screenPos.y - headSize * 0.2);
  ctx.lineTo(screenPos.x - headSize * 0.6, screenPos.y + headSize * 0.2);
  ctx.lineTo(screenPos.x + headSize * 0.1, screenPos.y + headSize * 0.5);
  ctx.closePath();
  ctx.fill();

  const eyeSpacing = headSize * 0.25;
  const eyeWidth = headSize * 0.03;
  const eyeLength = headSize * 0.45;
  const pupilPulse = Math.sin(time * 3) * 0.1 + 0.9;

  [-1, 1].forEach(side => {
    const eyePairX = side * eyeSpacing;
    const startY = screenPos.y - headSize * 0.3;
    const endY = screenPos.y + headSize * 0.15;

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#c084fc';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = eyeWidth * pupilPulse;
    ctx.lineCap = 'butt';

    ctx.beginPath();
    ctx.moveTo(screenPos.x + eyePairX, startY);
    ctx.lineTo(screenPos.x + eyePairX, endY);
    ctx.stroke();

    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = eyeWidth * 0.4 * pupilPulse;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(screenPos.x + eyePairX, startY);
    ctx.lineTo(screenPos.x + eyePairX, endY);
    ctx.stroke();
  });

  ctx.shadowBlur = 0;

  const mandibleLength = headSize * 0.5;
  const mandibleWidth = headSize * 0.12;

  [-1, 1].forEach(side => {
    ctx.save();
    ctx.translate(screenPos.x + side * headSize * 0.15, screenPos.y + headSize * 0.35);
    ctx.rotate(side * jawOpenAmount * 0.5);

    const mandibleGradient = ctx.createLinearGradient(0, 0, 0, mandibleLength);
    mandibleGradient.addColorStop(0, '#5b21b6');
    mandibleGradient.addColorStop(1, '#2d1b4e');
    ctx.fillStyle = mandibleGradient;

    ctx.beginPath();
    ctx.moveTo(-mandibleWidth / 2, 0);
    ctx.lineTo(-mandibleWidth / 4, mandibleLength * 0.5);
    ctx.lineTo(0, mandibleLength);
    ctx.lineTo(mandibleWidth / 4, mandibleLength * 0.5);
    ctx.lineTo(mandibleWidth / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.stroke();

    const bladeCount = 6;
    for (let i = 0; i < bladeCount; i++) {
      const bladeY = mandibleLength * 0.15 + (mandibleLength * 0.75 * i) / bladeCount;
      const bladeLength = 12 - i * 1.5;

      ctx.fillStyle = '#c4b5fd';
      ctx.beginPath();
      ctx.moveTo(side * mandibleWidth * 0.3, bladeY);
      ctx.lineTo(side * (mandibleWidth * 0.3 + bladeLength), bladeY - 2);
      ctx.lineTo(side * (mandibleWidth * 0.3 + bladeLength), bladeY + 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  });

  const hornCount = 4;
  for (let j = 0; j < hornCount; j++) {
    const angle = (j / hornCount) * Math.PI - Math.PI / 2 + Math.PI / 8;
    const hornLength = headSize * 0.8;
    const hornBase = headSize * 0.45;

    const baseX = screenPos.x + Math.cos(angle) * hornBase;
    const baseY = screenPos.y + Math.sin(angle) * hornBase;
    const tipX = baseX + Math.cos(angle) * hornLength;
    const tipY = baseY + Math.sin(angle) * hornLength;

    const hornGradient = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
    hornGradient.addColorStop(0, '#7c3aed');
    hornGradient.addColorStop(0.5, '#5b21b6');
    hornGradient.addColorStop(1, '#2d1b4e');

    ctx.strokeStyle = hornGradient;
    ctx.lineWidth = 8 - j;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#7c3aed';
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;

  const smallTendrilCount = 6;
  for (let i = 0; i < smallTendrilCount; i++) {
    const baseAngle = (i / smallTendrilCount) * Math.PI * 2;
    const tendrilLength = headSize * 0.4;
    const wave = Math.sin(time * 2 + i) * 0.3;

    ctx.strokeStyle = `rgba(124, 58, 237, ${0.6 + wave * 0.2})`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y);

    for (let seg = 1; seg <= 8; seg++) {
      const t = seg / 8;
      const segmentAngle = baseAngle + Math.sin(time * 3 + seg * 0.5 + i) * 0.5;
      const segmentDist = (headSize / 2) + tendrilLength * t;
      const x = screenPos.x + Math.cos(segmentAngle) * segmentDist;
      const y = screenPos.y + Math.sin(segmentAngle) * segmentDist;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  const glowGradient = ctx.createRadialGradient(
    screenPos.x, screenPos.y, 0,
    screenPos.x, screenPos.y, headSize / 2 + 20
  );
  glowGradient.addColorStop(0, 'rgba(124, 58, 237, 0)');
  glowGradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.2)');
  glowGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, headSize / 2 + 20, 0, Math.PI * 2);
  ctx.fill();
}

function renderBodySegment(
  ctx: CanvasRenderingContext2D,
  screenPos: { x: number; y: number },
  segment: any,
  index: number
): void {
  const baseGradient = ctx.createRadialGradient(
    screenPos.x, screenPos.y, 0,
    screenPos.x, screenPos.y, segment.size / 2
  );
  baseGradient.addColorStop(0, '#7c3aed');
  baseGradient.addColorStop(0.4, '#5b21b6');
  baseGradient.addColorStop(0.8, '#2d1b4e');
  baseGradient.addColorStop(1, '#1a0a2e');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();

  const segmentCount = 8;
  for (let i = 0; i < segmentCount; i++) {
    const angle = (i / segmentCount) * Math.PI * 2;
    const radius = segment.size / 2;
    const x = screenPos.x + Math.cos(angle) * radius;
    const y = screenPos.y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();

  if (index % 2 === 0) {
    const spikeCount = 6;
    for (let j = 0; j < spikeCount; j++) {
      const angle = (j / spikeCount) * Math.PI * 2 + Date.now() * 0.0005 * (index % 2 === 0 ? 1 : -1);
      const spikeLength = segment.size * 0.4 + Math.sin(Date.now() * 0.003 + j) * segment.size * 0.1;

      const baseX = screenPos.x + Math.cos(angle) * segment.size * 0.38;
      const baseY = screenPos.y + Math.sin(angle) * segment.size * 0.38;
      const tipX = baseX + Math.cos(angle) * spikeLength;
      const tipY = baseY + Math.sin(angle) * spikeLength;

      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 4;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.fillStyle = '#c4b5fd';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  for (let i = 0; i < segmentCount; i++) {
    const angle = (i / segmentCount) * Math.PI * 2;
    const radius = segment.size / 2;
    const x = screenPos.x + Math.cos(angle) * radius;
    const y = screenPos.y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;

  const glowGradient = ctx.createRadialGradient(
    screenPos.x, screenPos.y, 0,
    screenPos.x, screenPos.y, segment.size / 2 + 15
  );
  glowGradient.addColorStop(0, 'rgba(124, 58, 237, 0)');
  glowGradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.1)');
  glowGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, segment.size / 2 + 15, 0, Math.PI * 2);
  ctx.fill();
}

function renderBreathAttack(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  boss: VoidSubdivider
): void {
  const headSegment = boss.segments[0];
  const screenPos = camera.worldToScreen(headSegment.position);

  const breathLength = 600;
  const breathWidth = 80;
  const pulsePhase = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;

  const endX = screenPos.x + Math.cos(boss.breathDirection!) * breathLength;
  const endY = screenPos.y + Math.sin(boss.breathDirection!) * breathLength;

  const gradient = ctx.createLinearGradient(screenPos.x, screenPos.y, endX, endY);
  gradient.addColorStop(0, 'rgba(124, 58, 237, 0.8)');
  gradient.addColorStop(0.3, 'rgba(91, 33, 182, 0.6)');
  gradient.addColorStop(0.6, 'rgba(49, 0, 98, 0.4)');
  gradient.addColorStop(1, 'rgba(26, 10, 46, 0)');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = breathWidth * pulsePhase;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(screenPos.x, screenPos.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const particleCount = 20;
  for (let i = 0; i < particleCount; i++) {
    const progress = (i / particleCount) + (boss.breathTimer! % 0.5) * 2;
    if (progress > 1) continue;

    const particleX = screenPos.x + Math.cos(boss.breathDirection!) * breathLength * progress;
    const particleY = screenPos.y + Math.sin(boss.breathDirection!) * breathLength * progress;
    const offset = (Math.sin(Date.now() * 0.01 + i) * breathWidth * 0.3);

    const perpAngle = boss.breathDirection! + Math.PI / 2;
    const px = particleX + Math.cos(perpAngle) * offset;
    const py = particleY + Math.sin(perpAngle) * offset;

    ctx.fillStyle = `rgba(167, 139, 250, ${0.8 * (1 - progress)})`;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderVoidTendril(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  tendril: any
): void {
  const currentEnd = {
    x: tendril.startPos.x + (tendril.endPos.x - tendril.startPos.x) * Math.min(tendril.progress, 1),
    y: tendril.startPos.y + (tendril.endPos.y - tendril.startPos.y) * Math.min(tendril.progress, 1),
  };

  const screenStart = camera.worldToScreen(tendril.startPos);
  const screenEnd = camera.worldToScreen(currentEnd);

  const gradient = ctx.createLinearGradient(screenStart.x, screenStart.y, screenEnd.x, screenEnd.y);
  gradient.addColorStop(0, 'rgba(124, 58, 237, 0.9)');
  gradient.addColorStop(0.5, 'rgba(91, 33, 182, 0.7)');
  gradient.addColorStop(1, 'rgba(167, 139, 250, 0.5)');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = tendril.width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(screenStart.x, screenStart.y);
  ctx.lineTo(screenEnd.x, screenEnd.y);
  ctx.stroke();

  ctx.strokeStyle = '#c4b5fd';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderHealthBar(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  boss: VoidSubdivider
): void {
  const headSegment = boss.segments[0];
  const headScreenPos = camera.worldToScreen(headSegment.position);
  const healthBarWidth = 200;
  const healthBarHeight = 12;
  const healthBarX = headScreenPos.x - healthBarWidth / 2;
  const healthBarY = headScreenPos.y - headSegment.size / 2 - 30;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(healthBarX - 2, healthBarY - 2, healthBarWidth + 4, healthBarHeight + 4);

  const healthPercent = boss.health / boss.maxHealth;
  const healthBarFillWidth = healthBarWidth * healthPercent;

  const healthGradient = ctx.createLinearGradient(healthBarX, 0, healthBarX + healthBarWidth, 0);
  healthGradient.addColorStop(0, '#7c3aed');
  healthGradient.addColorStop(1, '#a78bfa');

  ctx.fillStyle = healthGradient;
  ctx.fillRect(healthBarX, healthBarY, healthBarFillWidth, healthBarHeight);

  ctx.strokeStyle = '#c4b5fd';
  ctx.lineWidth = 2;
  ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('VOID SUBDIVIDER', headScreenPos.x, healthBarY - 8);

  ctx.font = '11px Arial';
  ctx.fillText(`${Math.ceil(boss.health)} / ${boss.maxHealth}`, headScreenPos.x, healthBarY + healthBarHeight + 15);
}
