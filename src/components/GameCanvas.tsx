import { useEffect, useRef } from 'react';
import { GameState, Particle, Enemy, Chest, WeaponDrop, ResourceDrop, Drone } from '../types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { Camera } from '../game/Camera';
import { ResourceNode, Portal, ExtractionPoint } from '../game/WorldGeneration';
import { Obstacle } from '../game/Environments';
import { GameEngine } from '../game/GameEngine';
import { BiomeParticle } from '../game/BiomeSystem';
import { formatResourceName } from '../game/utils';
import { AnyBiomeFeature } from '../game/BiomeFeatures';
import { BiomeFeatureRenderer } from '../game/BiomeFeatureRenderer';
import { ResourceIconRenderer } from '../game/ResourceIconRenderer';
import { renderVoidSubdivider } from '../game/VoidSubdividerRenderer';

interface GameCanvasProps {
  gameState: GameState;
  camera: Camera;
  obstacles: Obstacle[];
  resourceNodes: ResourceNode[];
  portals: Portal[];
  extractionPoints: ExtractionPoint[];
  chests: Chest[];
  biomeFeatures: AnyBiomeFeature[];
  gameEngineRef: React.RefObject<GameEngine | null>;
}


export default function GameCanvas({
  gameState,
  camera,
  obstacles,
  resourceNodes,
  portals,
  extractionPoints,
  chests,
  biomeFeatures,
  gameEngineRef
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const featureRendererRef = useRef<BiomeFeatureRenderer>(new BiomeFeatureRenderer());
  const lastFrameTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getMouseWorldPos = (e: MouseEvent) => {
      const engine = gameEngineRef.current;
      if (!engine || !canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      return engine.getCamera().screenToWorld({ x: mouseX, y: mouseY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const worldPos = getMouseWorldPos(e);
      if (worldPos) gameEngineRef.current?.setMousePosition(worldPos);
    };
    const handleMouseDown = (e: MouseEvent) => {
      const worldPos = getMouseWorldPos(e);
      if (worldPos) {
        gameEngineRef.current?.setMousePosition(worldPos);
        gameEngineRef.current?.setMouseDown(true);
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      const worldPos = getMouseWorldPos(e);
      if (worldPos) {
        gameEngineRef.current?.setMousePosition(worldPos);
        gameEngineRef.current?.setMouseDown(false);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameEngineRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = gameEngineRef.current;
    if (!engine) return;

    const now = performance.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = now;

    featureRendererRef.current.update(deltaTime);

    const biomeManager = engine.getBiomeManager();
    const displayColors = biomeManager.getDisplayColors();
    const currentBiome = biomeManager.getCurrentBiome();
    const envParticles = engine.getEnvironmentalParticles();

    ctx.fillStyle = displayColors.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const floorGradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    floorGradient.addColorStop(0, displayColors.floorColor);
    floorGradient.addColorStop(1, displayColors.backgroundColor);
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (currentBiome.environmentalEffects.fog) {
      const fog = currentBiome.environmentalEffects.fog;
      ctx.fillStyle = fog.color;
      ctx.globalAlpha = fog.density;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1.0;
    }

    drawGrid(ctx, camera, displayColors.gridColor);

    biomeFeatures.forEach(feature => {
      featureRendererRef.current.renderFeature(ctx, feature, camera);
    });

    drawOminousTendrilInteract(ctx, gameEngineRef, camera, gameState);

    drawObstacles(ctx, obstacles, camera, currentBiome);
    drawResourceNodes(ctx, resourceNodes, camera, gameState, currentBiome);
    drawChests(ctx, chests, camera, gameState);
    drawWeaponDrops(ctx, gameState.weaponDrops, camera, gameState);
    drawPortals(ctx, portals, camera, currentBiome, gameState);
    drawExtractionPoints(ctx, extractionPoints, camera, currentBiome);
    drawEnvironmentalParticles(ctx, envParticles, camera);

    const activeWeapon = gameState.player.equippedWeapons[gameState.player.activeWeaponIndex];
    if (activeWeapon?.firingMode === 'beam' && activeWeapon.isBeaming && !activeWeapon.beamOverheated) {
      drawBeamLaser(ctx, gameState.player, activeWeapon, camera, obstacles);
    }

    if (activeWeapon?.type === 'railgun' && (activeWeapon.railgunBeamTimer || 0) > 0) {
      drawRailgunBeam(ctx, gameState.player, activeWeapon, camera, obstacles);
    }

    gameState.particles.forEach(particle => drawParticle(ctx, particle, camera));
    gameState.currencyDrops.forEach(drop => drawCurrency(ctx, drop, camera));
    gameState.resourceDrops.forEach(drop => drawResourceDrop(ctx, drop, camera));
    gameState.projectiles.forEach(projectile => {
      const screenPos = camera.worldToScreen(projectile.position);
      if (!camera.isInView(projectile.position)) return;

      if (projectile.isChainLightning && projectile.chainLightningTarget) {
        const targetScreenPos = camera.worldToScreen(projectile.chainLightningTarget);
        ctx.save();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8b5cf6';

        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y);

        const segments = 8;
        const dx = (targetScreenPos.x - screenPos.x) / segments;
        const dy = (targetScreenPos.y - screenPos.y) / segments;
        const jitter = 15;

        for (let i = 1; i <= segments; i++) {
          const x = screenPos.x + dx * i + (Math.random() - 0.5) * jitter;
          const y = screenPos.y + dy * i + (Math.random() - 0.5) * jitter;
          ctx.lineTo(x, y);
        }

        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = projectile.color;

      if (projectile.isChainLightning) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#8b5cf6';
      } else if (projectile.isCharged && projectile.chargeLevel) {
        const glowSize = 20 + (projectile.chargeLevel * 15);
        ctx.shadowBlur = glowSize;
      } else if (projectile.homing) {
        ctx.shadowBlur = 20;
      } else if (projectile.explosive) {
        ctx.shadowBlur = 18;
      } else {
        ctx.shadowBlur = 15;
      }

      ctx.shadowColor = projectile.color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, projectile.size / 2, 0, Math.PI * 2);
      ctx.fill();

      if (projectile.homing) {
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    });

    const modifierSystem = engine.getModifierSystem();

    gameState.enemies.forEach(enemy => {
      drawEnemy(ctx, enemy, camera);
      if (modifierSystem.isModifiedEnemy(enemy)) {
        drawModifiedEnemyVisuals(ctx, enemy, camera, modifierSystem);
        drawModifierTags(ctx, enemy, camera);
      }
    });

    gameState.drones.forEach(drone => {
      drawDrone(ctx, drone, camera);
    });

    const voidBoss = engine.getVoidSubdivider();
    if (voidBoss) {
      renderVoidSubdivider(ctx, voidBoss, camera);
    }

    drawGrapplingHook(ctx, gameState.player, camera);
    
    const meleeRenderer = engine.getMeleeWeaponRenderer();
    if (activeWeapon?.meleeStats) {
      meleeRenderer.drawMeleeWeapon(ctx, gameState.player, activeWeapon, camera, true);
    }
    
    drawPlayer(ctx, gameState.player, camera);
    
    gameState.remotePlayers?.forEach((remotePlayer) => {
      const remoteActiveWeapon = remotePlayer.player.equippedWeapons[remotePlayer.player.activeWeaponIndex];
      if (remoteActiveWeapon?.meleeStats) {
        meleeRenderer.drawMeleeWeapon(ctx, remotePlayer.player, remoteActiveWeapon, camera, false);
      }
      drawRemotePlayer(ctx, remotePlayer.player, camera, remotePlayer.peerId.substring(0, 8));
    });
    
    drawDamageNumbers(ctx, gameState.damageNumbers, camera);

  }, [gameState, camera, obstacles, resourceNodes, portals, extractionPoints, chests, biomeFeatures, gameEngineRef]);

  const drawOminousTendrilInteract = (ctx: CanvasRenderingContext2D, engineRef: React.RefObject<any>, camera: Camera, gameState: GameState) => {
    if (!engineRef.current) return;

    const activeOminous = engineRef.current.getActiveOminousTendril();
    if (!activeOminous || !activeOminous.canInteract) return;

    const biomeFeatures = engineRef.current.getBiomeFeatures();
    const feature = biomeFeatures.find((f: any) => f.id === activeOminous.featureId);
    if (!feature || feature.type !== 'void-gap' || !feature.data.hasOminousTendril) return;

    const tendrilAngle = feature.data.ominousTendrilAngle;
    if (tendrilAngle === undefined) return;

    const ominousLength = Math.max(feature.data.width, feature.data.height) * 0.8;
    const tipWorldX = feature.position.x + Math.cos(tendrilAngle) * ominousLength;
    const tipWorldY = feature.position.y + Math.sin(tendrilAngle) * ominousLength;

    const screenPos = camera.worldToScreen({ x: tipWorldX, y: tipWorldY });
    const distance = Math.sqrt(
      Math.pow(gameState.player.position.x - tipWorldX, 2) +
      Math.pow(gameState.player.position.y - tipWorldY, 2)
    );

    if (distance < 150) {
      const alpha = Math.max(0, 1 - (distance - 50) / 100);
      if (alpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.font = 'italic 12px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        ctx.fillText('This plane deserves to be divided [F]', screenPos.x, screenPos.y - 25);
        ctx.restore();
      }
    }
  };

  const drawGrapplingHook = (ctx: CanvasRenderingContext2D, player: typeof gameState.player, camera: Camera) => {
    if (!player.isGrappling || !player.grappleTarget) return;

    const playerScreenPos = camera.worldToScreen(player.position);
    const targetScreenPos = camera.worldToScreen(player.grappleTarget);

    ctx.save();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(playerScreenPos.x, playerScreenPos.y);
    ctx.lineTo(targetScreenPos.x, targetScreenPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(targetScreenPos.x, targetScreenPos.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawDamageNumbers = (ctx: CanvasRenderingContext2D, damageNumbers: typeof gameState.damageNumbers, camera: Camera) => {
    damageNumbers.forEach(dn => {
      if (!camera.isInView(dn.position)) return;

      const screenPos = camera.worldToScreen(dn.position);
      const alpha = (dn.lifetime / dn.maxLifetime) * 0.6;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dn.color;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeText(dn.text, screenPos.x, screenPos.y);
      ctx.fillText(dn.text, screenPos.x, screenPos.y);
      ctx.restore();
    });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, camera: Camera, gridColor: string) => {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    const bounds = camera.getVisibleBounds();
    const gridSize = 40;

    const startX = Math.floor(bounds.minX / gridSize) * gridSize;
    const startY = Math.floor(bounds.minY / gridSize) * gridSize;
    const endX = Math.ceil(bounds.maxX / gridSize) * gridSize;
    const endY = Math.ceil(bounds.maxY / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      const screenStart = camera.worldToScreen({ x, y: bounds.minY });
      const screenEnd = camera.worldToScreen({ x, y: bounds.maxY });
      ctx.beginPath();
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const screenStart = camera.worldToScreen({ x: bounds.minX, y });
      const screenEnd = camera.worldToScreen({ x: bounds.maxX, y });
      ctx.beginPath();
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
      ctx.stroke();
    }
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D, obstacles: Obstacle[], camera: Camera, biome: any) => {
    obstacles.forEach(obstacle => {
      const maxSize = Math.max(obstacle.size.x, obstacle.size.y);
      if (!camera.isInView(obstacle.position, maxSize)) return;

      const screenPos = camera.worldToScreen(obstacle.position);
      const pulse = Math.sin(Date.now() / 400 + screenPos.x * 0.1) * 4 + 6;
      const obstacleColor = obstacle.color;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(obstacle.rotation);

      ctx.fillStyle = obstacleColor;
      ctx.shadowBlur = pulse;
      ctx.shadowColor = obstacleColor;

      if (obstacle.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.size.x / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-obstacle.size.x / 2, -obstacle.size.y / 2, obstacle.size.x, obstacle.size.y);
      }

      ctx.strokeStyle = `${obstacleColor}80`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });
  };

  const drawResourceNodes = (ctx: CanvasRenderingContext2D, nodes: ResourceNode[], camera: Camera, gameState: GameState, biome: any) => {
    nodes.forEach(node => {
      if (!camera.isInView(node.position, node.size)) return;

      const screenPos = camera.worldToScreen(node.position);
      const healthPercent = node.health / node.maxHealth;
      const pulse = Math.sin(Date.now() / 350 + screenPos.y * 0.1) * 5 + 15;
      const resourceColor = node.color;
      const bobOffset = Math.sin(node.bobPhase + Date.now() / 1000) * 5;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y + bobOffset);

      const shapeRadius = node.size * 0.85;
      const colorWithAlpha = resourceColor.includes('rgb')
        ? resourceColor.replace(')', ', 0.15)').replace('rgb', 'rgba')
        : resourceColor + '26';
      ctx.strokeStyle = colorWithAlpha;
      ctx.lineWidth = 2;
      ctx.shadowBlur = pulse * 0.6;
      ctx.shadowColor = resourceColor;

      if (node.shape === 'crystal') {
        const sides = 6;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const x = Math.cos(angle) * shapeRadius;
          const y = Math.sin(angle) * shapeRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (node.shape === 'geode') {
        const sides = 8;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2 + Math.PI / 8;
          const x = Math.cos(angle) * shapeRadius;
          const y = Math.sin(angle) * shapeRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (node.shape === 'kelp') {
        const sides = 5;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const x = Math.cos(angle) * shapeRadius;
          const y = Math.sin(angle) * shapeRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (node.shape === 'heart') {
        const sides = 7;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const x = Math.cos(angle) * shapeRadius;
          const y = Math.sin(angle) * shapeRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (node.shape === 'root') {
        ctx.beginPath();
        ctx.arc(0, 0, shapeRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (node.shape === 'pearl') {
        ctx.beginPath();
        ctx.arc(0, 0, shapeRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (node.shape === 'bloom') {
        const sides = 8;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const x = Math.cos(angle) * shapeRadius;
          const y = Math.sin(angle) * shapeRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (node.shape === 'shard') {
        const sides = 4;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2 + Math.PI / 4;
          const x = Math.cos(angle) * shapeRadius;
          const y = Math.sin(angle) * shapeRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (node.shape === 'graviton') {
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
          const ringPulse = Math.sin(Date.now() / 400 + i * 0.5) * 0.2 + 0.8;
          const radius = shapeRadius * (0.5 + i * 0.25) * ringPulse;
          ctx.globalAlpha = 0.8 - i * 0.2;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, shapeRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ResourceIconRenderer.renderIcon(ctx, node.resourceType, 0, 0, node.size * 0.35);

      ctx.restore();

      const playerPos = gameState.player.position;
      const distance = Math.sqrt(Math.pow(playerPos.x - node.position.x, 2) + Math.pow(playerPos.y - node.position.y, 2));
      
      if (distance < 150) {
          const alpha = Math.max(0, 1 - (distance - 50) / 100);
          if (alpha > 0) {
              ctx.save();
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.font = 'bold 14px monospace';
              ctx.textAlign = 'center';
              ctx.shadowColor = '#000';
              ctx.shadowBlur = 5;
              ctx.fillText(`${formatResourceName(node.resourceType)} [F]`, screenPos.x, screenPos.y - node.size - 20);
              ctx.restore();
          }
      }
    });
  };

  const drawWeaponDrops = (ctx: CanvasRenderingContext2D, drops: WeaponDrop[], camera: Camera, gameState: GameState) => {
    drops.forEach(drop => {
      if (!camera.isInView(drop.position, drop.size * 2)) return;

      const screenPos = camera.worldToScreen(drop.position);
      const bobOffset = Math.sin(drop.bobPhase) * 8;
      const pulse = Math.sin(Date.now() / 300) * 5 + 15;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y + bobOffset);
      ctx.rotate(drop.rotation);

      ctx.fillStyle = drop.weapon.color;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = drop.weapon.color;
      ctx.shadowBlur = pulse;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(drop.size / 2, 0);
      ctx.lineTo(0, -drop.size / 3);
      ctx.lineTo(-drop.size / 2, 0);
      ctx.lineTo(0, drop.size / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(drop.weapon.type.toUpperCase(), 0, 3);

      ctx.restore();

      const playerPos = gameState.player.position;
      const distance = Math.sqrt(Math.pow(playerPos.x - drop.position.x, 2) + Math.pow(playerPos.y - drop.position.y, 2));

      if (distance < drop.size * 3) {
        const alpha = Math.max(0, 1 - (distance - drop.size) / (drop.size * 2));
        if (alpha > 0) {
          ctx.save();
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;

          const tooltipWidth = 220;
          const tooltipHeight = 70 + (drop.weaponPerks.length * 18);
          const tooltipX = screenPos.x - tooltipWidth / 2;
          const tooltipY = screenPos.y - drop.size - tooltipHeight - 20;

          ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

          ctx.strokeStyle = drop.weapon.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(drop.weapon.name, screenPos.x, tooltipY + 20);

          ctx.font = '11px monospace';
          ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
          ctx.fillText(`${drop.weapon.type} | DMG: ${Math.floor(drop.weapon.damage)} | FR: ${drop.weapon.fireRate.toFixed(2)}`, screenPos.x, tooltipY + 38);

          let yOffset = tooltipY + 58;
          drop.weaponPerks.forEach((perk) => {
            const rarityColors: Record<string, string> = {
              'common': '#9ca3af',
              'rare': '#3b82f6',
              'epic': '#a855f7',
              'legendary': '#f59e0b'
            };
            ctx.fillStyle = `rgba(${hexToRgb(rarityColors[perk.rarity])}, ${alpha})`;
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`• ${perk.name}`, tooltipX + 10, yOffset);
            yOffset += 18;
          });

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('[F] Pick Up', screenPos.x, tooltipY + tooltipHeight - 10);
          ctx.restore();
        }
      }
    });
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '255, 255, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  const drawChests = (ctx: CanvasRenderingContext2D, chests: Chest[], camera: Camera, gameState: GameState) => {
    chests.forEach(chest => {
      if (chest.isOpen || !camera.isInView(chest.position, chest.size * 2)) return;

      const screenPos = camera.worldToScreen(chest.position);
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(chest.rotation);

      if (chest.type === 'timed') {
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#facc15';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(0, -chest.size / 2);
        ctx.lineTo(chest.size / 2, 0);
        ctx.lineTo(0, chest.size / 2);
        ctx.lineTo(-chest.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (chest.type === 'locked') {
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = '#4f46e5';
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3;
        ctx.fillRect(-chest.size / 2, -chest.size / 2, chest.size, chest.size);
        ctx.strokeRect(-chest.size / 2, -chest.size / 2, chest.size, chest.size);

        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -chest.size / 6, chest.size / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(-chest.size / 12, -chest.size / 6, chest.size / 6, chest.size / 3);
        ctx.strokeRect(-chest.size / 12, -chest.size / 6, chest.size / 6, chest.size / 3);
      } else {
        ctx.fillStyle = '#a3a3a3';
        ctx.strokeStyle = '#737373';
        ctx.lineWidth = 2;
        ctx.fillRect(-chest.size / 2, -chest.size / 2, chest.size, chest.size);
        ctx.strokeRect(-chest.size / 2, -chest.size / 2, chest.size, chest.size);
      }
      ctx.restore();

      // Draw UI elements
      if (chest.type === 'timed' && chest.radius) {
        ctx.save();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, chest.radius, 0, Math.PI * 2);
        ctx.stroke();

        const progress = (chest.timer || 0) / (chest.maxTime || 5);
        if (progress > 0) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, chest.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
          ctx.stroke();
        }
        ctx.restore();
      }

      const playerPos = gameState.player.position;
      const distance = Math.sqrt(Math.pow(playerPos.x - chest.position.x, 2) + Math.pow(playerPos.y - chest.position.y, 2));
      if ((chest.type === 'regular' || chest.type === 'locked') && distance < chest.size * 2) {
        const alpha = Math.max(0, 1 - (distance - chest.size) / chest.size);
        if (alpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            if (chest.type === 'locked') {
              const keyCount = gameState.player.resources.crateKey || 0;
              if (keyCount > 0) {
                ctx.fillText(`[F] Unlock (Keys: ${keyCount})`, screenPos.x, screenPos.y - chest.size - 15);
              } else {
                ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
                ctx.fillText('Locked (Need Key)', screenPos.x, screenPos.y - chest.size - 15);
              }
            } else {
              ctx.fillText('[F] Open', screenPos.x, screenPos.y - chest.size - 15);
            }
            ctx.restore();
        }
      }
    });
  };

  const drawPortals = (ctx: CanvasRenderingContext2D, portals: Portal[], camera: Camera, biome: any, gameState: GameState) => {
    const time = Date.now();

    portals.forEach(portal => {
      if (!camera.isInView(portal.position, portal.size * 2)) return;

      const screenPos = camera.worldToScreen(portal.position);
      const portalColor = portal.color || biome.accentColor;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);

      // Glowing core
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.size / 2);
      gradient.addColorStop(0, `${portalColor}ff`);
      gradient.addColorStop(0.5, `${portalColor}80`);
      gradient.addColorStop(1, `${portalColor}00`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, portal.size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Swirling accretion disk
      const rings = 5;
      for (let i = 0; i < rings; i++) {
        ctx.save();
        const rotation = (time / (2000 + i * 500)) * (i % 2 === 0 ? 1 : -1);
        ctx.rotate(rotation);
        ctx.strokeStyle = portalColor;
        ctx.lineWidth = 1 + (i * 0.5);
        ctx.globalAlpha = 0.2 + (i / rings) * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, portal.size / 2 + i * 4, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
      }

      // In-flowing particles
      const particleCount = 30;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 * 5 + (time / 2000);
        const maxDist = portal.size * 1.5;
        const dist = maxDist - ((time / 10 + i * 50) % maxDist);
        const alpha = (dist / maxDist);
        const size = 1 + alpha * 2;

        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        ctx.fillStyle = portalColor;
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Interaction hint
      const playerPos = gameState.player.position;
      const distance = Math.sqrt(Math.pow(playerPos.x - portal.position.x, 2) + Math.pow(playerPos.y - portal.position.y, 2));
      if (distance < portal.size + gameState.player.size) {
          const alpha = Math.max(0, 1 - (distance - portal.size) / gameState.player.size);
          if (alpha > 0) {
              ctx.save();
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.font = 'bold 16px monospace';
              ctx.textAlign = 'center';
              ctx.shadowColor = '#000';
              ctx.shadowBlur = 5;
              ctx.fillText('[E] Enter', screenPos.x, screenPos.y - portal.size - 15);
              ctx.restore();
          }
      }
    });
  };

  const drawExtractionPoints = (ctx: CanvasRenderingContext2D, points: ExtractionPoint[], camera: Camera, biome: any) => {
    points.forEach(point => {
      if (!camera.isInView(point.position, point.size)) return;

      const screenPos = camera.worldToScreen(point.position);
      const pulse = Math.sin(Date.now() / 500) * 10 + 20;
      const extractionColor = biome.theme.secondaryColor;

      ctx.save();
      ctx.strokeStyle = extractionColor;
      ctx.lineWidth = 4;
      ctx.shadowBlur = pulse;
      ctx.shadowColor = extractionColor;

      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, point.size / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `${extractionColor}1a`;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXTRACT [E]', screenPos.x, screenPos.y + 5);

      ctx.restore();
    });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: typeof gameState.player, camera: Camera) => {
    const screenPos = camera.worldToScreen(player.position);

    const activeWeapon = player.equippedWeapons[player.activeWeaponIndex];
    if (activeWeapon && activeWeapon.firingMode === 'charge' && activeWeapon.isCharging && activeWeapon.currentCharge) {
      const chargePercent = activeWeapon.currentCharge / (activeWeapon.chargeTime || 2.0);
      const meterRadius = player.size;
      const meterStartAngle = Math.PI * 0.7;
      const meterEndAngle = Math.PI * 1.3;
      const chargeAngle = meterStartAngle + (meterEndAngle - meterStartAngle) * chargePercent;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(player.rotation);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, meterRadius, meterStartAngle, meterEndAngle);
      ctx.stroke();

      const chargeColor = chargePercent > 0.95 ? '#f59e0b' : '#fde047';
      ctx.strokeStyle = chargeColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = chargeColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, meterRadius, meterStartAngle, chargeAngle);
      ctx.stroke();

      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(player.rotation);

    if (player.isDashing) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#00ffff';
    }

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(player.size / 2, 0);
    ctx.lineTo(-player.size / 2, -player.size / 3);
    ctx.lineTo(-player.size / 3, 0);
    ctx.lineTo(-player.size / 2, player.size / 3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#00ffffdd';
    ctx.lineWidth = 2;
    ctx.stroke();

    const eyeOffset = player.size / 4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeOffset, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const healthBarWidth = player.size * 1.5;
    const healthBarHeight = 4;
    const healthPercent = player.health / player.maxHealth;

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - player.size / 2 - 10,
      healthBarWidth,
      healthBarHeight
    );

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - player.size / 2 - 10,
      healthBarWidth * healthPercent,
      healthBarHeight
    );
  };

  const drawRemotePlayer = (ctx: CanvasRenderingContext2D, player: typeof gameState.player, camera: Camera, playerLabel: string) => {
    const screenPos = camera.worldToScreen(player.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(player.rotation);

    if (player.isDashing) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ff00ff';
    }

    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.moveTo(player.size / 2, 0);
    ctx.lineTo(-player.size / 2, -player.size / 3);
    ctx.lineTo(-player.size / 3, 0);
    ctx.lineTo(-player.size / 2, player.size / 3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ff00ffdd';
    ctx.lineWidth = 2;
    ctx.stroke();

    const eyeOffset = player.size / 4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeOffset, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const healthBarWidth = player.size * 1.5;
    const healthBarHeight = 4;
    const healthPercent = player.health / player.maxHealth;

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - player.size / 2 - 10,
      healthBarWidth,
      healthBarHeight
    );

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - player.size / 2 - 10,
      healthBarWidth * healthPercent,
      healthBarHeight
    );

    ctx.fillStyle = '#ff00ff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(playerLabel, screenPos.x, screenPos.y - player.size / 2 - 18);
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy, camera: Camera) => {
    if (!camera.isInView(enemy.position, 500)) return;

    const screenPos = camera.worldToScreen(enemy.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(enemy.rotation);

    ctx.fillStyle = enemy.color;
    ctx.shadowBlur = enemy.type === 'boss' ? 20 : 10;
    ctx.shadowColor = enemy.color;

    if (enemy.type === 'grunt') {
      ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
    } else if (enemy.type === 'speedy') {
      ctx.beginPath();
      ctx.moveTo(enemy.size / 2, 0);
      ctx.lineTo(-enemy.size / 2, -enemy.size / 2);
      ctx.lineTo(-enemy.size / 2, enemy.size / 2);
      ctx.closePath();
      ctx.fill();
    } else if (enemy.type === 'tank') {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-enemy.size / 3, -2, enemy.size / 1.5, 4);
    } else if (enemy.type === 'sniper') {
      ctx.fillRect(-enemy.size / 2, -enemy.size / 3, enemy.size, enemy.size / 1.5);
      ctx.fillRect(enemy.size / 3, -2, enemy.size / 2, 4);
    } else if (enemy.type === 'artillery') {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-enemy.size / 4, -enemy.size / 2, enemy.size / 2, enemy.size);
      ctx.fillRect(enemy.size / 4, -3, enemy.size / 1.5, 6);
    } else if (enemy.type === 'burst') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x = Math.cos(angle) * enemy.size / 2;
        const y = Math.sin(angle) * enemy.size / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    } else if (enemy.type === 'dasher') {
      ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
      if (enemy.isDashing) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
      }
    } else if (enemy.type === 'weaver') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x = Math.cos(angle) * enemy.size / 2;
        const y = Math.sin(angle) * enemy.size / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    } else if (enemy.type === 'laser') {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(-enemy.size / 4, -enemy.size / 2, enemy.size / 2, enemy.size);

      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * enemy.size / 3;
        ctx.fillRect(enemy.size / 3, offset - 1, enemy.size / 4, 2);
      }
    } else if (enemy.type === 'boss') {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8b0000';
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size / 3, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.size / 3, -3, enemy.size / 4, 6);
        ctx.restore();
      }
    } else if (enemy.type === 'orbiter') {
      ctx.beginPath();
      ctx.moveTo(enemy.size / 2, 0);
      ctx.lineTo(-enemy.size / 2, -enemy.size / 2);
      ctx.lineTo(-enemy.size / 2, enemy.size / 2);
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + ((enemy as any).orbitalAngle || 0);
        const orbitRadius = enemy.size * 0.8;
        const orbitX = Math.cos(angle) * orbitRadius;
        const orbitY = Math.sin(angle) * orbitRadius;
        ctx.beginPath();
        ctx.arc(orbitX, orbitY, enemy.size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }
    } else if (enemy.type === 'fragmenter') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x = Math.cos(angle) * enemy.size / 2;
        const y = Math.sin(angle) * enemy.size / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * enemy.size * 0.35, Math.sin(angle) * enemy.size * 0.35);
        ctx.stroke();
      }
    } else if (enemy.type === 'pulsar') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x = Math.cos(angle) * enemy.size / 2;
        const y = Math.sin(angle) * enemy.size / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      const pulsePhase = (enemy as any).pulseTimer || 0;
      for (let i = 0; i < 3; i++) {
        const pulseRadius = enemy.size * (0.6 + i * 0.2 + (pulsePhase % 1) * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = enemy.color;
        ctx.globalAlpha = 0.3 - (i * 0.1);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    } else if (enemy.type === 'spiraler') {
      ctx.beginPath();
      ctx.moveTo(enemy.size / 2, 0);
      ctx.lineTo(-enemy.size / 2, -enemy.size / 2);
      ctx.lineTo(-enemy.size / 2, enemy.size / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = enemy.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const spiralPoints = 20;
      for (let i = 0; i < spiralPoints; i++) {
        const t = i / spiralPoints;
        const angle = t * Math.PI * 4 + ((enemy as any).spiralPhase || 0);
        const radius = enemy.size * 0.3 * (1 - t * 0.8);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    } else if (enemy.type === 'replicator') {
      ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const offset = enemy.size * 0.15;
      ctx.strokeRect(-enemy.size / 2 + offset, -enemy.size / 2 + offset, enemy.size * 0.7, enemy.size * 0.7);
      ctx.strokeRect(-enemy.size / 2 - offset, -enemy.size / 2 - offset, enemy.size * 0.3, enemy.size * 0.3);
    } else if (enemy.type === 'vortex') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x = Math.cos(angle) * enemy.size / 2;
        const y = Math.sin(angle) * enemy.size / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      const time = Date.now() / 1000;
      for (let i = 0; i < 3; i++) {
        const spiralAngle = time * 2 + (i / 3) * Math.PI * 2;
        const spiralRadius = enemy.size * 0.5;
        ctx.beginPath();
        for (let j = 0; j < 15; j++) {
          const t = j / 15;
          const angle = spiralAngle + t * Math.PI * 2;
          const r = spiralRadius * (1 - t * 0.5);
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (enemy.type === 'miniboss') {
      if (enemy.minibossSubtype === 'angulodon') {
        if (enemy.segments && enemy.segments.length > 0) {
          for (let i = enemy.segments.length - 1; i >= 0; i--) {
            const segment = enemy.segments[i];
            const segmentScreenPos = camera.worldToScreen(segment.position);
            
            ctx.save();
            ctx.translate(segmentScreenPos.x, segmentScreenPos.y);
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, segment.size / 2);
            gradient.addColorStop(0, enemy.secondaryColor || '#06b6d4');
            gradient.addColorStop(0.5, enemy.color);
            gradient.addColorStop(1, '#064e5e');
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.ellipse(0, 0, segment.size / 2, segment.size / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            if (i === 0) {
              const jawOpenAmount = (enemy.jaws && enemy.jaws.isOpen) ? 0.4 : 0.1;
              
              ctx.fillStyle = '#0e7490';
              ctx.beginPath();
              ctx.moveTo(segment.size * 0.4, -jawOpenAmount * segment.size * 0.3);
              ctx.lineTo(segment.size * 0.5, -jawOpenAmount * segment.size * 0.5);
              ctx.lineTo(segment.size * 0.6, -jawOpenAmount * segment.size * 0.3);
              ctx.closePath();
              ctx.fill();
              
              ctx.beginPath();
              ctx.moveTo(segment.size * 0.4, jawOpenAmount * segment.size * 0.3);
              ctx.lineTo(segment.size * 0.5, jawOpenAmount * segment.size * 0.5);
              ctx.lineTo(segment.size * 0.6, jawOpenAmount * segment.size * 0.3);
              ctx.closePath();
              ctx.fill();
              
              for (let j = 0; j < 6; j++) {
                ctx.fillStyle = '#ffffff';
                const toothY = (j % 2 === 0 ? -1 : 1) * (0.25 + (j / 12)) * segment.size;
                ctx.fillRect(segment.size * 0.45 + j * 3, toothY - 2, 2, 6);
              }
              
              ctx.fillStyle = '#22d3ee';
              ctx.shadowBlur = 5;
              ctx.shadowColor = '#22d3ee';
              ctx.beginPath();
              ctx.arc(-segment.size * 0.25, -segment.size * 0.15, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-segment.size * 0.25, segment.size * 0.15, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            
            if (i === enemy.segments.length - 1) {
              ctx.fillStyle = '#0891b2';
              ctx.beginPath();
              ctx.moveTo(-segment.size * 0.4, 0);
              ctx.lineTo(-segment.size * 0.6, -segment.size * 0.4);
              ctx.lineTo(-segment.size * 0.5, 0);
              ctx.lineTo(-segment.size * 0.6, segment.size * 0.4);
              ctx.closePath();
              ctx.fill();
            }
            
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, segment.size / 2, segment.size / 2.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
          }
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, enemy.size / 2, enemy.size / 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (enemy.whirlpoolAngle !== undefined && enemy.pullRadius) {
          const whirlpoolScreenPos = camera.worldToScreen(enemy.position);
          ctx.save();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.4;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(whirlpoolScreenPos.x, whirlpoolScreenPos.y, enemy.pullRadius * (0.5 + i * 0.25), 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1.0;
          ctx.restore();
        }
      } else if (enemy.minibossSubtype === 'cryostag_vanguard') {
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size / 2);
        bodyGradient.addColorStop(0, '#93c5fd');
        bodyGradient.addColorStop(0.5, '#60a5fa');
        bodyGradient.addColorStop(1, '#2563eb');
        ctx.fillStyle = bodyGradient;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.size / 2, enemy.size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const antlerCount = 2;
        for (let side = -1; side <= 1; side += 2) {
          for (let i = 0; i < antlerCount; i++) {
            const antlerAngle = (i / antlerCount) * 0.5 - 0.25;
            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            const baseX = side * enemy.size * 0.2;
            const baseY = -enemy.size * 0.35;
            const tipX = baseX + side * enemy.size * 0.4 * Math.cos(antlerAngle);
            const tipY = baseY - enemy.size * 0.5 * Math.abs(Math.sin(antlerAngle));
            
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            
            ctx.fillStyle = '#bfdbfe';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.fillStyle = '#dbeafe';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#60a5fa';
        ctx.beginPath();
        ctx.arc(-enemy.size * 0.15, -enemy.size * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(enemy.size * 0.15, -enemy.size * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        if (enemy.orbitalCannons && enemy.orbitalCannons.length > 0) {
          enemy.orbitalCannons.forEach((cannon: any) => {
            const cannonScreenPos = camera.worldToScreen(cannon.position);
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#3b82f6';
            ctx.fillStyle = '#3b82f6';
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cannonScreenPos.x, cannonScreenPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });
        }
        
        if (enemy.shieldActive) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.size * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    const isLargeBoss = enemy.type === 'boss' || enemy.type === 'miniboss';
    const healthBarWidth = isLargeBoss ? enemy.size * 1.5 : enemy.size * 1.2;
    const healthBarHeight = isLargeBoss ? 5 : 3;
    const healthPercent = enemy.health / enemy.maxHealth;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - enemy.size / 2 - (isLargeBoss ? 12 : 8),
      healthBarWidth,
      healthBarHeight
    );

    ctx.fillStyle = enemy.color;
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - enemy.size / 2 - (isLargeBoss ? 12 : 8),
      healthBarWidth * healthPercent,
      healthBarHeight
    );

    if (enemy.type === 'boss') {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', screenPos.x, screenPos.y - enemy.size / 2 - 20);
      ctx.restore();
    } else if (enemy.type === 'miniboss') {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 4;
      ctx.shadowColor = enemy.color;
      ctx.fillText('MINIBOSS', screenPos.x, screenPos.y - enemy.size / 2 - 20);
      ctx.restore();
    }
  };

  const drawDrone = (ctx: CanvasRenderingContext2D, drone: Drone, camera: Camera) => {
    if (!camera.isInView(drone.position, 100)) return;

    const screenPos = camera.worldToScreen(drone.position);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(drone.rotation);

    if (drone.droneType === 'assault_drone') {
      ctx.fillStyle = drone.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = drone.color;
      ctx.beginPath();
      ctx.moveTo(drone.size / 2, 0);
      ctx.lineTo(-drone.size / 2, -drone.size / 2);
      ctx.lineTo(-drone.size / 3, 0);
      ctx.lineTo(-drone.size / 2, drone.size / 2);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = drone.secondaryColor;
      ctx.fillRect(-drone.size / 4, -1, drone.size / 3, 2);
    } else if (drone.droneType === 'shield_drone') {
      ctx.fillStyle = drone.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = drone.color;
      ctx.beginPath();
      ctx.arc(0, 0, drone.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      if (drone.shieldActive) {
        ctx.strokeStyle = drone.secondaryColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, drone.size * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    } else if (drone.droneType === 'repair_drone') {
      ctx.fillStyle = drone.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = drone.color;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI * 2) / 4;
        const x = Math.cos(angle) * drone.size / 2;
        const y = Math.sin(angle) * drone.size / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-drone.size / 4, -1, drone.size / 2, 2);
      ctx.fillRect(-1, -drone.size / 4, 2, drone.size / 2);
    } else if (drone.droneType === 'scout_drone') {
      ctx.fillStyle = drone.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = drone.color;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const x = Math.cos(angle) * drone.size / 2;
        const y = Math.sin(angle) * drone.size / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = drone.secondaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, drone.size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    const healthBarWidth = drone.size * 1.2;
    const healthBarHeight = 2;
    const healthPercent = drone.health / drone.maxHealth;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - drone.size / 2 - 6,
      healthBarWidth,
      healthBarHeight
    );

    ctx.fillStyle = drone.color;
    ctx.fillRect(
      screenPos.x - healthBarWidth / 2,
      screenPos.y - drone.size / 2 - 6,
      healthBarWidth * healthPercent,
      healthBarHeight
    );
  };

  const drawModifierTags = (ctx: CanvasRenderingContext2D, enemy: any, camera: Camera) => {
    if (!enemy.modifiers || enemy.modifiers.length === 0) return;

    const screenPos = camera.worldToScreen(enemy.position);
    const modifierColors: Record<string, string> = {
      shield: '#60a5fa',
      phase: '#a78bfa',
      mirror: '#38bdf8',
      absorb: '#fbbf24',
      split: '#f87171',
      temporal: '#60a5fa',
      reactive: '#ef4444',
      volatile: '#ff6600',
      anchored: '#8b5cf6',
      blink: '#06b6d4',
      enrage: '#dc2626',
      teleport: '#a855f7'
    };

    const modifierNames: Record<string, string> = {
      shield: 'SHIELD',
      phase: 'PHASE',
      mirror: 'MIRROR',
      absorb: 'ABSORB',
      split: 'SPLIT',
      temporal: 'TEMPORAL',
      reactive: 'REACTIVE',
      volatile: 'VOLATILE',
      anchored: 'ANCHOR',
      blink: 'BLINK',
      enrage: 'ENRAGE',
      teleport: 'TELEPORT'
    };

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';

    const tagSpacing = 12;
    const startY = screenPos.y - enemy.size / 2 - 18;

    enemy.modifiers.forEach((modifier: string, index: number) => {
      const tagY = startY - (index * tagSpacing);
      const color = modifierColors[modifier] || '#ffffff';
      const name = modifierNames[modifier] || modifier.toUpperCase();

      ctx.shadowBlur = 4;
      ctx.shadowColor = color;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(name).width;
      ctx.fillRect(screenPos.x - textWidth / 2 - 3, tagY - 8, textWidth + 6, 10);

      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.fillText(name, screenPos.x, tagY);
    });

    ctx.restore();
  };


  const drawModifiedEnemyVisuals = (ctx: CanvasRenderingContext2D, enemy: any, camera: Camera, modifierSystem: any) => {
    const screenPos = camera.worldToScreen(enemy.position);

    if (enemy.modifiers && enemy.modifiers.includes('absorb') && enemy.absorbedDamage && enemy.absorbedDamage > 0) {
      const absorbLimit = 200;
      const absorbPercent = Math.min(enemy.absorbedDamage / absorbLimit, 1);
      const ringRadius = enemy.size / 2 + 5;

      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.3 + absorbPercent * 0.5})`;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 10 + absorbPercent * 10;
      ctx.shadowColor = '#fbbf24';

      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, ringRadius, 0, Math.PI * 2 * absorbPercent);
      ctx.stroke();

      if (absorbPercent >= 0.9) {
        ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.sin(Date.now() / 100) * 0.3 + 0.4})`;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, ringRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    const shields = modifierSystem.getShields(enemy);
    shields.forEach((shield: any) => {
      const shieldX = enemy.position.x + Math.cos(shield.angle) * (enemy.size + 10);
      const shieldY = enemy.position.y + Math.sin(shield.angle) * (enemy.size + 10);
      const shieldScreenPos = camera.worldToScreen({ x: shieldX, y: shieldY });

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.fillStyle = `rgba(96, 165, 250, ${shield.health / shield.maxHealth * 0.5})`;
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shieldScreenPos.x, shieldScreenPos.y, shield.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    if (enemy.isPhased) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a78bfa';
      ctx.restore();
    }

    if (enemy.modifiers && enemy.modifiers.includes('mirror') && enemy.mirrorCharges && enemy.mirrorCharges > 0) {
      const chargeSpacing = 8;
      const startX = screenPos.x - ((enemy.mirrorCharges - 1) * chargeSpacing) / 2;
      const chargeY = screenPos.y + enemy.size / 2 + 10;

      ctx.save();
      for (let i = 0; i < enemy.mirrorCharges; i++) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(startX + i * chargeSpacing, chargeY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (enemy.isEnraged) {
      const pulseSize = Math.sin(Date.now() / 100) * 3 + enemy.size / 2 + 8;
      ctx.save();
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#dc2626';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (enemy.modifiers && enemy.modifiers.length > 0) {
      const modifierColors: Record<string, string> = {
        shield: '#60a5fa',
        phase: '#a78bfa',
        mirror: '#38bdf8',
        absorb: '#fbbf24',
        split: '#f87171',
        temporal: '#60a5fa',
        reactive: '#ef4444',
        volatile: '#ff6600',
        anchored: '#8b5cf6',
        blink: '#06b6d4',
        enrage: '#dc2626',
        teleport: '#a855f7'
      };

      const time = Date.now() / 1000;
      const particleCount = 3 + enemy.modifiers.length;

      for (let i = 0; i < particleCount; i++) {
        const angle = (time * 2 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
        const radius = enemy.size / 2 + 12 + Math.sin(time * 3 + i) * 3;
        const particleX = enemy.position.x + Math.cos(angle) * radius;
        const particleY = enemy.position.y + Math.sin(angle) * radius;
        const particleScreenPos = camera.worldToScreen({ x: particleX, y: particleY });

        const modifierIndex = i % enemy.modifiers.length;
        const color = modifierColors[enemy.modifiers[modifierIndex]] || '#ffffff';

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6 + Math.sin(time * 4 + i) * 0.2;
        ctx.beginPath();
        ctx.arc(particleScreenPos.x, particleScreenPos.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const trailCount = 2;
      for (let i = 0; i < trailCount; i++) {
        const angle = (time * 1.5 + i * Math.PI) % (Math.PI * 2);
        const radius = enemy.size / 2 + 8;
        const trailX = enemy.position.x + Math.cos(angle) * radius;
        const trailY = enemy.position.y + Math.sin(angle) * radius;
        const trailScreenPos = camera.worldToScreen({ x: trailX, y: trailY });

        const modifierIndex = i % enemy.modifiers.length;
        const color = modifierColors[enemy.modifiers[modifierIndex]] || '#ffffff';

        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(trailScreenPos.x, trailScreenPos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle, camera: Camera) => {
    if (!camera.isInView(particle.position)) return;

    const screenPos = camera.worldToScreen(particle.position);
    const alpha = particle.lifetime / particle.maxLifetime;
    ctx.save();
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, particle.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawCurrency = (ctx: CanvasRenderingContext2D, drop: typeof gameState.currencyDrops[0], camera: Camera) => {
    if (!camera.isInView(drop.position)) return;

    const screenPos = camera.worldToScreen(drop.position);
    ctx.save();
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffff00';
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const drawResourceDrop = (ctx: CanvasRenderingContext2D, drop: ResourceDrop, camera: Camera) => {
    if (!camera.isInView(drop.position, drop.size * 2)) return;

    const screenPos = camera.worldToScreen(drop.position);
    const bobOffset = Math.sin(drop.bobPhase) * 6;
    const pulse = Math.sin(Date.now() / 300) * 0.15 + 0.85;
    const distToPlayer = Math.sqrt(
      Math.pow(gameState.player.position.x - drop.position.x, 2) +
      Math.pow(gameState.player.position.y - drop.position.y, 2)
    );
    const isNearby = distToPlayer < drop.size * 2;

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y + bobOffset);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10 * pulse;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, drop.size, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ResourceIconRenderer.renderIcon(ctx, drop.resourceType, 0, 0, drop.size * 0.8);

    if (drop.amount > 1) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`x${drop.amount}`, 10, 10);
      ctx.fillText(`x${drop.amount}`, 10, 10);
    }

    ctx.restore();

    if (isNearby) {
      const resourceName = formatResourceName(drop.resourceType);
      ctx.save();
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(resourceName, screenPos.x, screenPos.y - drop.size - 20);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(resourceName, screenPos.x, screenPos.y - drop.size - 20);

      ctx.font = 'bold 12px monospace';
      ctx.strokeText('[F] Collect', screenPos.x, screenPos.y - drop.size - 35);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('[F] Collect', screenPos.x, screenPos.y - drop.size - 35);

      ctx.restore();
    }
  };

  const drawBeamLaser = (ctx: CanvasRenderingContext2D, player: typeof gameState.player, weapon: typeof gameState.player.equippedWeapons[0], camera: Camera, obstacles: Obstacle[]) => {
    const playerScreenPos = camera.worldToScreen(player.position);
    const angle = player.rotation;
    const beamLength = weapon.maxRange || 480;

    let endX = player.position.x + Math.cos(angle) * beamLength;
    let endY = player.position.y + Math.sin(angle) * beamLength;
    let actualBeamLength = beamLength;

    for (const obstacle of obstacles) {
      const dx = endX - player.position.x;
      const dy = endY - player.position.y;
      const lineLength = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(lineLength / 5);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const checkX = player.position.x + dx * t;
        const checkY = player.position.y + dy * t;

        let collides = false;
        if (obstacle.shape === 'circle') {
          const distToObstacle = Math.sqrt(
            Math.pow(checkX - obstacle.position.x, 2) +
            Math.pow(checkY - obstacle.position.y, 2)
          );
          collides = distToObstacle < obstacle.size.x / 2;
        } else {
          const halfWidth = obstacle.size.x / 2;
          const halfHeight = obstacle.size.y / 2;
          collides = checkX >= obstacle.position.x - halfWidth &&
                    checkX <= obstacle.position.x + halfWidth &&
                    checkY >= obstacle.position.y - halfHeight &&
                    checkY <= obstacle.position.y + halfHeight;
        }

        if (collides) {
          const distToCollision = Math.sqrt(
            Math.pow(checkX - player.position.x, 2) +
            Math.pow(checkY - player.position.y, 2)
          );
          if (distToCollision < actualBeamLength) {
            actualBeamLength = distToCollision;
            endX = checkX;
            endY = checkY;
          }
          break;
        }
      }
    }

    const endScreenPos = camera.worldToScreen({ x: endX, y: endY });

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = weapon.color;
    ctx.strokeStyle = weapon.color;
    ctx.lineWidth = weapon.projectileSize * 2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(playerScreenPos.x, playerScreenPos.y);
    ctx.lineTo(endScreenPos.x, endScreenPos.y);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = weapon.projectileSize;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(playerScreenPos.x, playerScreenPos.y);
    ctx.lineTo(endScreenPos.x, endScreenPos.y);
    ctx.stroke();

    ctx.restore();
  };

  const drawRailgunBeam = (ctx: CanvasRenderingContext2D, player: typeof gameState.player, weapon: typeof gameState.player.equippedWeapons[0], camera: Camera, obstacles: Obstacle[]) => {
    const playerScreenPos = camera.worldToScreen(player.position);
    const angle = player.rotation;
    const beamLength = weapon.maxRange || 700;

    let endX = player.position.x + Math.cos(angle) * beamLength;
    let endY = player.position.y + Math.sin(angle) * beamLength;
    let actualBeamLength = beamLength;

    for (const obstacle of obstacles) {
      const dx = endX - player.position.x;
      const dy = endY - player.position.y;
      const lineLength = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(lineLength / 5);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const checkX = player.position.x + dx * t;
        const checkY = player.position.y + dy * t;

        let collides = false;
        if (obstacle.shape === 'circle') {
          const distToObstacle = Math.sqrt(
            Math.pow(checkX - obstacle.position.x, 2) +
            Math.pow(checkY - obstacle.position.y, 2)
          );
          collides = distToObstacle < obstacle.size.x / 2;
        } else {
          const halfWidth = obstacle.size.x / 2;
          const halfHeight = obstacle.size.y / 2;
          collides = checkX >= obstacle.position.x - halfWidth &&
                    checkX <= obstacle.position.x + halfWidth &&
                    checkY >= obstacle.position.y - halfHeight &&
                    checkY <= obstacle.position.y + halfHeight;
        }

        if (collides) {
          const distToCollision = Math.sqrt(
            Math.pow(checkX - player.position.x, 2) +
            Math.pow(checkY - player.position.y, 2)
          );
          if (distToCollision < actualBeamLength) {
            actualBeamLength = distToCollision;
            endX = checkX;
            endY = checkY;
          }
          break;
        }
      }
    }

    const endScreenPos = camera.worldToScreen({ x: endX, y: endY });

    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = weapon.color;
    ctx.strokeStyle = weapon.color;
    ctx.lineWidth = weapon.projectileSize * 3;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(playerScreenPos.x, playerScreenPos.y);
    ctx.lineTo(endScreenPos.x, endScreenPos.y);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = weapon.projectileSize * 1.5;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.moveTo(playerScreenPos.x, playerScreenPos.y);
    ctx.lineTo(endScreenPos.x, endScreenPos.y);
    ctx.stroke();

    ctx.strokeStyle = weapon.color;
    ctx.lineWidth = weapon.projectileSize * 0.5;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.moveTo(playerScreenPos.x, playerScreenPos.y);
    ctx.lineTo(endScreenPos.x, endScreenPos.y);
    ctx.stroke();

    ctx.restore();
  };

  const drawEnvironmentalParticles = (ctx: CanvasRenderingContext2D, particles: BiomeParticle[], camera: Camera) => {
    particles.forEach(particle => {
      const screenPos = camera.worldToScreen(particle.position);
      const alpha = (particle.lifetime / particle.maxLifetime) * particle.opacity;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (particle.type === 'snow' || particle.type === 'dust') {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'ember') {
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'spore') {
        ctx.fillStyle = particle.color;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (particle.type === 'spark') {
        ctx.strokeStyle = particle.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenPos.x - particle.size, screenPos.y);
        ctx.lineTo(screenPos.x + particle.size, screenPos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y - particle.size);
        ctx.lineTo(screenPos.x, screenPos.y + particle.size);
        ctx.stroke();
      } else if (particle.type === 'bubble') {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.size / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (particle.type === 'leaf') {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.ellipse(screenPos.x, screenPos.y, particle.size / 2, particle.size, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-2 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20"
    />
  );
}
