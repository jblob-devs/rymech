import { useEffect, useRef } from 'react';
import { GameState, Chest } from '../types/game';
import { ExtractionPoint, Portal } from '../game/WorldGeneration';

interface MinimapProps {
  gameState: GameState;
  chests: Chest[];
  extractionPoints: ExtractionPoint[];
  portals: Portal[];
}

const MINIMAP_SIZE = 200;
const MINIMAP_SCALE = 10; // 1 pixel on map = 10 game units
const BLIP_SIZE = 3;

export default function Minimap({ gameState, chests, extractionPoints, portals }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { player, enemies, worldEvents } = gameState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Center of the minimap
    const mapCenterX = MINIMAP_SIZE / 2;
    const mapCenterY = MINIMAP_SIZE / 2;

    // Translate context to center on player
    ctx.save();
    ctx.translate(mapCenterX, mapCenterY);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 500 / MINIMAP_SCALE; // Every 500 game units
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, -mapCenterY);
      ctx.lineTo(i * gridSize, mapCenterY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-mapCenterX, i * gridSize);
      ctx.lineTo(mapCenterX, i * gridSize);
      ctx.stroke();
    }

    // Draw entities
    const drawBlip = (entityPos: { x: number; y: number }, color: string, size: number = BLIP_SIZE, shape: 'circle' | 'square' = 'circle') => {
      const mapX = (entityPos.x - player.position.x) / MINIMAP_SCALE;
      const mapY = (entityPos.y - player.position.y) / MINIMAP_SCALE;

      // Cull blips outside the minimap radius
      if (Math.sqrt(mapX * mapX + mapY * mapY) > mapCenterX - size) {
        return;
      }

      ctx.fillStyle = color;
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(mapX, mapY, size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(mapX - size / 2, mapY - size / 2, size, size);
      }
    };

    // Draw enemies
    enemies.forEach(enemy => drawBlip(enemy.position, '#ef4444'));

    // Draw chests
    chests.forEach(chest => drawBlip(chest.position, '#f59e0b', BLIP_SIZE + 1, 'square'));

    // Draw extraction points
    extractionPoints.forEach(point => drawBlip(point.position, '#10b981', BLIP_SIZE + 2, 'square'));

    // Draw portals
    portals.forEach(portal => drawBlip(portal.position, '#a855f7', BLIP_SIZE + 2));

    // Draw world events with special indicators
    if (worldEvents) {
      worldEvents.forEach(event => {
        const mapX = (event.position.x - player.position.x) / MINIMAP_SCALE;
        const mapY = (event.position.y - player.position.y) / MINIMAP_SCALE;
        const distance = Math.sqrt(mapX * mapX + mapY * mapY);

        // If event is off screen, draw direction indicator
        if (distance > mapCenterX - 15) {
          const angle = Math.atan2(mapY, mapX);
          const indicatorX = Math.cos(angle) * (mapCenterX - 15);
          const indicatorY = Math.sin(angle) * (mapCenterY - 15);

          // Draw direction arrow
          ctx.save();
          ctx.translate(indicatorX, indicatorY);
          ctx.rotate(angle);
          
          ctx.fillStyle = '#ff8800';
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(-4, -5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else {
          // Draw on-screen event indicator
          ctx.fillStyle = '#ff8800';
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mapX, mapY, BLIP_SIZE + 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });
    }

    ctx.restore();

    // Draw player in the center
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(mapCenterX, mapCenterY - 5);
    ctx.lineTo(mapCenterX - 4, mapCenterY + 4);
    ctx.lineTo(mapCenterX + 4, mapCenterY + 4);
    ctx.closePath();
    ctx.fill();

  }, [gameState, chests, extractionPoints, portals, player.position, worldEvents]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border-2 border-cyan-500/30 rounded-full shadow-lg w-[200px] h-[200px] overflow-hidden relative">
      <canvas ref={canvasRef} width={MINIMAP_SIZE} height={MINIMAP_SIZE} />
      <div className="absolute inset-0 rounded-full border-2 border-slate-800 pointer-events-none" />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-cyan-300 tracking-widest">N</div>
    </div>
  );
}
