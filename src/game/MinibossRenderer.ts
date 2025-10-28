import { Enemy, MinibossSubtype, Vector2 } from '../types/game';
import { Camera } from './Camera';

export function renderMiniboss(
  ctx: CanvasRenderingContext2D,
  miniboss: Enemy,
  camera: Camera
): void {
  if (!miniboss.minibossSubtype) return;

  const screenPos = camera.worldToScreen(miniboss.position);

  switch (miniboss.minibossSubtype) {
    case 'angulodon':
      renderAngulodon(ctx, miniboss, screenPos);
      break;
    case 'cryostag_vanguard':
      renderCryostagVanguard(ctx, miniboss, screenPos);
      break;
    case 'pyroclast_behemoth':
      renderPyroclastBehemoth(ctx, miniboss, screenPos);
      break;
    case 'mirelurker_matron':
      renderMirelurkerMatron(ctx, miniboss, screenPos);
      break;
    case 'prism_guardian':
      renderPrismGuardian(ctx, miniboss, screenPos);
      break;
    case 'null_siren':
      renderNullSiren(ctx, miniboss, screenPos);
      break;
    case 'solstice_warden':
      renderSolsticeWarden(ctx, miniboss, screenPos);
      break;
    case 'aether_leviathan':
      renderAetherLeviathan(ctx, miniboss, screenPos);
      break;
    case 'bloom_warden':
      renderBloomWarden(ctx, miniboss, screenPos);
      break;
    case 'rift_revenant':
      renderRiftRevenant(ctx, miniboss, screenPos);
      break;
    default:
      renderDefaultMiniboss(ctx, miniboss, screenPos);
  }

  renderMinibossName(ctx, miniboss, screenPos);
  renderMinibossHealthBar(ctx, miniboss, screenPos);
}

function renderAngulodon(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation);

  if (miniboss.segments && miniboss.segments.length > 0) {
    for (let i = miniboss.segments.length - 1; i >= 0; i--) {
      const segment = miniboss.segments[i];
      const alpha = 1 - (i * 0.08);
      
      ctx.globalAlpha = alpha;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, segment.size / 2);
      gradient.addColorStop(0, '#22d3ee');
      gradient.addColorStop(0.6, '#0891b2');
      gradient.addColorStop(1, '#164e63');
      ctx.fillStyle = gradient;
      
      ctx.beginPath();
      ctx.ellipse(0, 0, segment.size / 2, segment.size / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const headGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 2);
  headGradient.addColorStop(0, '#67e8f9');
  headGradient.addColorStop(0.5, '#06b6d4');
  headGradient.addColorStop(1, '#0891b2');
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, miniboss.size / 2, miniboss.size / 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#164e63';
  ctx.beginPath();
  ctx.moveTo(miniboss.size / 2, 0);
  ctx.lineTo(miniboss.size / 2 + 15, -8);
  ctx.lineTo(miniboss.size / 2 + 15, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-miniboss.size / 4, -miniboss.size / 8, 3, 0, Math.PI * 2);
  ctx.fill();

  const jawOpen = miniboss.jaws?.isOpen ? 0.3 : 0;
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(miniboss.size / 3, -miniboss.size / 6 - jawOpen * 10);
  ctx.lineTo(miniboss.size / 2 + 10, -jawOpen * 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(miniboss.size / 3, miniboss.size / 6 + jawOpen * 10);
  ctx.lineTo(miniboss.size / 2 + 10, jawOpen * 15);
  ctx.stroke();

  ctx.restore();
}

function renderCryostagVanguard(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation);

  const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 2);
  bodyGradient.addColorStop(0, '#bae6fd');
  bodyGradient.addColorStop(0.5, '#60a5fa');
  bodyGradient.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, miniboss.size / 2, miniboss.size / 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#dbeafe';
  ctx.beginPath();
  ctx.arc(-miniboss.size / 4, -miniboss.size / 6, 4, 0, Math.PI * 2);
  ctx.fill();

  const antlerCount = 6;
  for (let i = 0; i < antlerCount; i++) {
    const side = i < antlerCount / 2 ? -1 : 1;
    const angleOffset = (i % (antlerCount / 2)) * 0.4 - 0.4;
    const angle = -Math.PI / 2 * side + angleOffset;
    const length = miniboss.size * (0.4 + (i % (antlerCount / 2)) * 0.15);
    
    ctx.save();
    ctx.rotate(angle);
    
    const gradient = ctx.createLinearGradient(0, -miniboss.size / 3, 0, -miniboss.size / 3 - length);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(0.5, '#93c5fd');
    gradient.addColorStop(1, '#e0f2fe');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4 - i * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, -miniboss.size / 3);
    ctx.lineTo(0, -miniboss.size / 3 - length);
    ctx.stroke();
    
    const branches = 2;
    for (let j = 0; j < branches; j++) {
      const branchY = -miniboss.size / 3 - length * (0.4 + j * 0.3);
      const branchLength = length * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(-branchLength * 0.7, branchY - branchLength * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(branchLength * 0.7, branchY - branchLength * 0.5);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  ctx.fillStyle = '#1e3a8a';
  const legOffsets = [-miniboss.size / 3, -miniboss.size / 6, miniboss.size / 6, miniboss.size / 3];
  legOffsets.forEach(offset => {
    ctx.beginPath();
    ctx.ellipse(offset, miniboss.size / 3, 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function renderPyroclastBehemoth(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation);

  ctx.shadowBlur = 25;
  ctx.shadowColor = '#f97316';

  const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 2);
  bodyGradient.addColorStop(0, '#fbbf24');
  bodyGradient.addColorStop(0.3, '#f97316');
  bodyGradient.addColorStop(0.7, '#b45309');
  bodyGradient.addColorStop(1, '#451a03');
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.arc(0, 0, miniboss.size / 2, 0, Math.PI * 2);
  ctx.fill();

  const crackCount = 8;
  for (let i = 0; i < crackCount; i++) {
    const angle = (i / crackCount) * Math.PI * 2;
    const startRadius = miniboss.size * 0.15;
    const endRadius = miniboss.size * 0.45;
    
    const gradient = ctx.createLinearGradient(
      Math.cos(angle) * startRadius,
      Math.sin(angle) * startRadius,
      Math.cos(angle) * endRadius,
      Math.sin(angle) * endRadius
    );
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(1, '#f97316');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius);
    ctx.lineTo(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius);
    ctx.stroke();
  }

  const lavaPoolCount = 5;
  for (let i = 0; i < lavaPoolCount; i++) {
    const angle = (i / lavaPoolCount) * Math.PI * 2 + Date.now() * 0.001;
    const radius = miniboss.size * 0.2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    const poolGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
    poolGradient.addColorStop(0, '#fef08a');
    poolGradient.addColorStop(0.5, '#fb923c');
    poolGradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = poolGradient;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (miniboss.shieldActive && miniboss.shieldHealth) {
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, miniboss.size / 2 + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function renderMirelurkerMatron(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation);

  const shellGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 2);
  shellGradient.addColorStop(0, '#a3e635');
  shellGradient.addColorStop(0.5, '#84cc16');
  shellGradient.addColorStop(1, '#4d7c0f');
  ctx.fillStyle = shellGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, miniboss.size / 2, miniboss.size / 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#65a30d';
  ctx.lineWidth = 3;
  const ridgeCount = 5;
  for (let i = 0; i < ridgeCount; i++) {
    const radiusRatio = 0.3 + (i / ridgeCount) * 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, miniboss.size / 2 * radiusRatio, miniboss.size / 2.2 * radiusRatio, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(-miniboss.size / 4, -miniboss.size / 6, 5, 0, Math.PI * 2);
  ctx.fill();

  const tentacleCount = 6;
  for (let i = 0; i < tentacleCount; i++) {
    const angle = (i / tentacleCount) * Math.PI * 2;
    const waveOffset = Math.sin(Date.now() * 0.003 + i) * 0.3;
    
    ctx.save();
    ctx.rotate(angle);
    
    const gradient = ctx.createLinearGradient(0, miniboss.size / 2, 0, miniboss.size / 2 + 30);
    gradient.addColorStop(0, '#84cc16');
    gradient.addColorStop(1, '#65a30d');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, miniboss.size / 2);
    ctx.quadraticCurveTo(
      waveOffset * 15, miniboss.size / 2 + 15,
      -waveOffset * 10, miniboss.size / 2 + 30
    );
    ctx.stroke();
    
    ctx.restore();
  }

  ctx.fillStyle = '#a3e635';
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = miniboss.size / 3;
    const size = 4 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function renderPrismGuardian(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation + Date.now() * 0.0005);

  ctx.shadowBlur = 20;
  ctx.shadowColor = '#22d3ee';

  const facetCount = 8;
  for (let i = 0; i < facetCount; i++) {
    const angle = (i / facetCount) * Math.PI * 2;
    const nextAngle = ((i + 1) / facetCount) * Math.PI * 2;
    
    const colors = ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2'];
    const colorIndex = i % colors.length;
    
    const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * miniboss.size / 2, Math.sin(angle) * miniboss.size / 2);
    gradient.addColorStop(0, colors[colorIndex]);
    gradient.addColorStop(1, colors[(colorIndex + 1) % colors.length]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * miniboss.size / 2, Math.sin(angle) * miniboss.size / 2);
    ctx.lineTo(Math.cos(nextAngle) * miniboss.size / 2, Math.sin(nextAngle) * miniboss.size / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = '#06b6d4';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, miniboss.size / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const orbitCount = 3;
  for (let i = 0; i < orbitCount; i++) {
    const angle = (Date.now() * 0.002 + i * (Math.PI * 2 / orbitCount));
    const radius = miniboss.size * 0.6;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
    orbGradient.addColorStop(0, '#e0f2fe');
    orbGradient.addColorStop(0.5, '#22d3ee');
    orbGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderNullSiren(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation);

  ctx.shadowBlur = 25;
  ctx.shadowColor = '#581c87';

  const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 3);
  coreGradient.addColorStop(0, '#1e1b4b');
  coreGradient.addColorStop(0.5, '#4c1d95');
  coreGradient.addColorStop(1, '#7e22ce');
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(0, 0, miniboss.size / 3, 0, Math.PI * 2);
  ctx.fill();

  const fragmentCount = 5;
  for (let i = 0; i < fragmentCount; i++) {
    const angle = (Date.now() * 0.001 + i * (Math.PI * 2 / fragmentCount));
    const radius = miniboss.size * 0.5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    
    const fragGradient = ctx.createLinearGradient(-10, 0, 10, 0);
    fragGradient.addColorStop(0, 'rgba(124, 58, 237, 0)');
    fragGradient.addColorStop(0.5, '#7c3aed');
    fragGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = fragGradient;
    
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(8, -5);
    ctx.lineTo(6, 15);
    ctx.lineTo(-6, 15);
    ctx.lineTo(-8, -5);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }

  const waveCount = 3;
  for (let i = 0; i < waveCount; i++) {
    const phase = (Date.now() * 0.002 + i * 0.7) % 1;
    const radius = miniboss.size / 3 + phase * miniboss.size * 0.5;
    
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.8 - phase * 0.8})`;
    ctx.lineWidth = 4 - phase * 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#e0e7ff';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#7c3aed';
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + Date.now() * 0.0015;
    const x = Math.cos(angle) * (miniboss.size / 5);
    const y = Math.sin(angle) * (miniboss.size / 5);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderSolsticeWarden(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  const rotationSpeed = Date.now() * 0.001;
  ctx.rotate(rotationSpeed);

  ctx.shadowBlur = 20;
  ctx.shadowColor = '#f59e0b';

  const segmentCount = 8;
  for (let i = 0; i < segmentCount; i++) {
    const angle = (i / segmentCount) * Math.PI * 2;
    const nextAngle = ((i + 1) / segmentCount) * Math.PI * 2;
    
    const isDark = i % 2 === 0;
    const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * miniboss.size / 2, Math.sin(angle) * miniboss.size / 2);
    
    if (isDark) {
      gradient.addColorStop(0, '#1e3a8a');
      gradient.addColorStop(1, '#3b82f6');
    } else {
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(1, '#fbbf24');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * miniboss.size / 2, Math.sin(angle) * miniboss.size / 2);
    ctx.lineTo(Math.cos(nextAngle) * miniboss.size / 2, Math.sin(nextAngle) * miniboss.size / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = isDark ? '#60a5fa' : '#fde047';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const centerGradient = ctx.createRadialGradient(-miniboss.size / 4, 0, 0, -miniboss.size / 4, 0, miniboss.size / 4);
  centerGradient.addColorStop(0, '#fef3c7');
  centerGradient.addColorStop(1, '#f59e0b');
  ctx.fillStyle = centerGradient;
  ctx.beginPath();
  ctx.arc(-miniboss.size / 4, 0, miniboss.size / 4, 0, Math.PI * 2);
  ctx.fill();

  const moonGradient = ctx.createRadialGradient(miniboss.size / 4, 0, 0, miniboss.size / 4, 0, miniboss.size / 4);
  moonGradient.addColorStop(0, '#dbeafe');
  moonGradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = moonGradient;
  ctx.beginPath();
  ctx.arc(miniboss.size / 4, 0, miniboss.size / 4, 0, Math.PI * 2);
  ctx.fill();

  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 - rotationSpeed * 0.5;
    const length = miniboss.size * 0.4;
    const startRadius = miniboss.size * 0.5;
    
    const isDarkSide = i < rayCount / 2;
    ctx.strokeStyle = isDarkSide ? 'rgba(96, 165, 250, 0.6)' : 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius);
    ctx.lineTo(Math.cos(angle) * (startRadius + length), Math.sin(angle) * (startRadius + length));
    ctx.stroke();
  }

  ctx.restore();
}

function renderAetherLeviathan(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation);

  ctx.shadowBlur = 18;
  ctx.shadowColor = '#8b5cf6';

  const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 2);
  bodyGradient.addColorStop(0, '#c4b5fd');
  bodyGradient.addColorStop(0.4, '#8b5cf6');
  bodyGradient.addColorStop(0.8, '#6d28d9');
  bodyGradient.addColorStop(1, '#4c1d95');
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, miniboss.size / 2, miniboss.size / 2.3, 0, 0, Math.PI * 2);
  ctx.fill();

  const wingCount = 4;
  for (let i = 0; i < wingCount; i++) {
    const side = i < wingCount / 2 ? -1 : 1;
    const index = i % (wingCount / 2);
    const yOffset = (index - 0.5) * miniboss.size / 3;
    const pulse = Math.sin(Date.now() * 0.003 + i) * 0.2 + 1;
    
    ctx.save();
    ctx.translate(0, yOffset);
    
    const wingGradient = ctx.createLinearGradient(0, 0, side * miniboss.size * 0.7 * pulse, 0);
    wingGradient.addColorStop(0, '#8b5cf6');
    wingGradient.addColorStop(0.6, '#a78bfa');
    wingGradient.addColorStop(1, 'rgba(167, 139, 250, 0.2)');
    
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      side * miniboss.size * 0.4 * pulse, -miniboss.size / 6,
      side * miniboss.size * 0.7 * pulse, 0
    );
    ctx.quadraticCurveTo(
      side * miniboss.size * 0.4 * pulse, miniboss.size / 6,
      0, 0
    );
    ctx.fill();
    
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
  }

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(-miniboss.size / 5, -miniboss.size / 8, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c4b5fd';
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = miniboss.size / 3;
    const pulseRadius = Math.sin(Date.now() * 0.004 + i * 0.5) * 2 + 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function renderBloomWarden(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#fde047';

  const rotation = Date.now() * 0.001;

  const petalCount = 12;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 + rotation;
    const petalLength = miniboss.size * 0.6;
    const petalWidth = miniboss.size * 0.25;
    
    ctx.save();
    ctx.rotate(angle);
    
    const petalGradient = ctx.createLinearGradient(0, 0, 0, petalLength);
    petalGradient.addColorStop(0, '#fef08a');
    petalGradient.addColorStop(0.5, '#fde047');
    petalGradient.addColorStop(1, '#facc15');
    
    ctx.fillStyle = petalGradient;
    ctx.beginPath();
    ctx.ellipse(0, petalLength / 2, petalWidth / 2, petalLength / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
  }

  const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 3);
  centerGradient.addColorStop(0, '#fbbf24');
  centerGradient.addColorStop(0.6, '#f59e0b');
  centerGradient.addColorStop(1, '#d97706');
  ctx.fillStyle = centerGradient;
  ctx.beginPath();
  ctx.arc(0, 0, miniboss.size / 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fed7aa';
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + rotation * 0.5;
    const radius = miniboss.size / 5 + Math.sin(i * 2) * 5;
    const size = 2 + Math.sin(i * 3) * 1;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderRiftRevenant(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  
  ctx.shadowBlur = 22;
  ctx.shadowColor = '#a855f7';

  const phase = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
  const glitchOffset = Math.random() * 2 - 1;

  ctx.globalAlpha = 0.9 + phase * 0.1;
  
  const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 2);
  bodyGradient.addColorStop(0, '#e9d5ff');
  bodyGradient.addColorStop(0.3, '#c084fc');
  bodyGradient.addColorStop(0.7, '#a855f7');
  bodyGradient.addColorStop(1, '#7e22ce');
  ctx.fillStyle = bodyGradient;
  
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const radius = miniboss.size / 2 + (i % 2 === 0 ? 10 : 0);
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

  ctx.strokeStyle = '#ddd6fe';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (Math.random() > 0.9) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(glitchOffset * 5, glitchOffset * 3);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  const runeCount = 4;
  for (let i = 0; i < runeCount; i++) {
    const angle = (i / runeCount) * Math.PI * 2 + Date.now() * 0.002;
    const radius = miniboss.size * 0.35;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(5, 5);
    ctx.moveTo(-5, 5);
    ctx.lineTo(5, -5);
    ctx.stroke();
    
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderDefaultMiniboss(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(miniboss.rotation);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, miniboss.size / 2);
  gradient.addColorStop(0, miniboss.color);
  gradient.addColorStop(0.7, miniboss.secondaryColor || miniboss.color);
  gradient.addColorStop(1, '#000');
  
  ctx.fillStyle = gradient;
  ctx.shadowBlur = 15;
  ctx.shadowColor = miniboss.color;
  
  ctx.beginPath();
  ctx.arc(0, 0, miniboss.size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderMinibossName(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  if (!miniboss.minibossSubtype) return;

  const names: Record<MinibossSubtype, string> = {
    angulodon: 'ANGULODON',
    cryostag_vanguard: 'CRYOSTAG VANGUARD',
    pyroclast_behemoth: 'PYROCLAST BEHEMOTH',
    mirelurker_matron: 'MIRELURKER MATRON',
    prism_guardian: 'PRISM GUARDIAN',
    null_siren: 'NULL SIREN',
    solstice_warden: 'SOLSTICE WARDEN',
    aether_leviathan: 'AETHER LEVIATHAN',
    bloom_warden: 'BLOOM WARDEN',
    rift_revenant: 'RIFT REVENANT',
  };

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 6;
  ctx.shadowColor = miniboss.color;
  
  const name = names[miniboss.minibossSubtype] || 'MINIBOSS';
  const yOffset = -miniboss.size / 2 - 25;
  
  ctx.strokeText(name, screenPos.x, screenPos.y + yOffset);
  ctx.fillText(name, screenPos.x, screenPos.y + yOffset);
  
  ctx.restore();
}

function renderMinibossHealthBar(ctx: CanvasRenderingContext2D, miniboss: Enemy, screenPos: Vector2): void {
  const barWidth = miniboss.size * 1.2;
  const barHeight = 8;
  const yOffset = -miniboss.size / 2 - 40;
  
  ctx.save();
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y + yOffset, barWidth, barHeight);
  
  const healthPercent = Math.max(0, miniboss.health / miniboss.maxHealth);
  const healthBarWidth = barWidth * healthPercent;
  
  const gradient = ctx.createLinearGradient(
    screenPos.x - barWidth / 2,
    0,
    screenPos.x - barWidth / 2 + barWidth,
    0
  );
  gradient.addColorStop(0, '#ef4444');
  gradient.addColorStop(0.5, '#f59e0b');
  gradient.addColorStop(1, '#10b981');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y + yOffset, healthBarWidth, barHeight);
  
  ctx.strokeStyle = miniboss.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(screenPos.x - barWidth / 2, screenPos.y + yOffset, barWidth, barHeight);
  
  ctx.restore();
}
