export class ResourceIconRenderer {
  static renderIcon(
    ctx: CanvasRenderingContext2D,
    resourceType: string,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 12;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12);

    switch (resourceType) {
      case 'energy':
        ctx.strokeStyle = '#60a5fa';
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(12, 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.arc(12, 12, 3, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 / 6) * i;
          const x1 = 12 + Math.cos(angle) * 7;
          const y1 = 12 + Math.sin(angle) * 7;
          const x2 = 12 + Math.cos(angle) * 10;
          const y2 = 12 + Math.sin(angle) * 10;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        break;

      case 'coreDust':
        this.drawCircle(ctx, 8, 8, 2, '#a855f7');
        this.drawCircle(ctx, 16, 10, 1.5, '#9333ea');
        this.drawCircle(ctx, 12, 14, 2.5, '#c084fc');
        this.drawCircle(ctx, 18, 16, 1.5, '#a855f7');
        this.drawCircle(ctx, 10, 18, 2, '#9333ea');
        break;

      case 'flux':
        ctx.fillStyle = '#06b6d4';
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.lineTo(2, 8);
        ctx.lineTo(2, 16);
        ctx.lineTo(12, 22);
        ctx.lineTo(22, 16);
        ctx.lineTo(22, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.moveTo(12, 8);
        ctx.lineTo(7, 11);
        ctx.lineTo(7, 17);
        ctx.lineTo(12, 20);
        ctx.lineTo(17, 17);
        ctx.lineTo(17, 11);
        ctx.closePath();
        ctx.fill();
        break;

      case 'geoShards':
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 3);
        ctx.lineTo(15, 9);
        ctx.lineTo(21, 12);
        ctx.lineTo(15, 15);
        ctx.lineTo(12, 21);
        ctx.lineTo(9, 15);
        ctx.lineTo(3, 12);
        ctx.lineTo(9, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(12, 8);
        ctx.lineTo(14, 12);
        ctx.lineTo(12, 16);
        ctx.lineTo(10, 12);
        ctx.closePath();
        ctx.fill();
        break;

      case 'alloyFragments':
        ctx.fillStyle = '#6b7280';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.fillRect(4, 6, 6, 8);
        ctx.strokeRect(4, 6, 6, 8);
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(11, 10, 6, 6);
        ctx.strokeRect(11, 10, 6, 6);
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(8, 14, 5, 6);
        ctx.strokeRect(8, 14, 5, 6);
        break;

      case 'singularityCore':
        this.drawCircle(ctx, 12, 12, 8, '#ec4899', '#be185d', 2);
        this.drawCircle(ctx, 12, 12, 4, '#f9a8d4');
        this.drawCircle(ctx, 12, 12, 2, '#fce7f3');
        break;

      case 'cryoKelp':
        ctx.fillStyle = '#2dd4bf';
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.bezierCurveTo(10, 6, 8, 10, 8, 14);
        ctx.bezierCurveTo(8, 16, 9, 18, 12, 20);
        ctx.bezierCurveTo(15, 18, 16, 16, 16, 14);
        ctx.bezierCurveTo(16, 10, 14, 6, 12, 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'obsidianHeart':
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 21);
        ctx.bezierCurveTo(6.5, 15.4, 2, 12.3, 2, 8.5);
        ctx.bezierCurveTo(2, 5.4, 4.4, 3, 7.5, 3);
        ctx.bezierCurveTo(9.2, 3, 10.9, 3.9, 12, 5.3);
        ctx.bezierCurveTo(13.1, 3.9, 14.8, 3, 16.5, 3);
        ctx.bezierCurveTo(19.6, 3, 22, 5.4, 22, 8.5);
        ctx.bezierCurveTo(22, 12.3, 17.5, 15.4, 12, 21);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'gloomRoot':
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.lineTo(12, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.bezierCurveTo(10, 10, 8, 12, 8, 14);
        ctx.lineTo(8, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.bezierCurveTo(14, 10, 16, 12, 16, 14);
        ctx.lineTo(16, 20);
        ctx.stroke();
        this.drawCircle(ctx, 12, 2, 2, '#6366f1');
        this.drawCircle(ctx, 8, 14, 1.5, '#4338ca');
        this.drawCircle(ctx, 16, 14, 1.5, '#4338ca');
        break;

      case 'resonantCrystal':
        ctx.fillStyle = '#c084fc';
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.lineTo(6, 8);
        ctx.lineTo(12, 14);
        ctx.lineTo(18, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(6, 8);
        ctx.lineTo(12, 14);
        ctx.lineTo(12, 22);
        ctx.lineTo(6, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#d8b4fe';
        ctx.beginPath();
        ctx.moveTo(18, 8);
        ctx.lineTo(12, 14);
        ctx.lineTo(12, 22);
        ctx.lineTo(18, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'voidEssence':
        this.drawCircle(ctx, 12, 12, 9, '#581c87', '#3b0764', 2);
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(12, 6);
        ctx.bezierCurveTo(9, 6, 7, 8, 7, 11);
        ctx.bezierCurveTo(7, 12.5, 7.7, 14, 9, 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(12, 6);
        ctx.bezierCurveTo(15, 6, 17, 8, 17, 11);
        ctx.bezierCurveTo(17, 12.5, 16.3, 14, 15, 15);
        ctx.stroke();
        this.drawCircle(ctx, 9, 10, 1.5, '#a78bfa');
        this.drawCircle(ctx, 15, 10, 1.5, '#a78bfa');
        break;

      case 'bioluminescentPearl':
        this.drawCircle(ctx, 12, 12, 7, '#7dd3fc', '#0369a1', 2);
        this.drawCircle(ctx, 12, 12, 4, '#bae6fd');
        this.drawCircle(ctx, 10, 10, 2, '#e0f2fe');
        break;

      case 'sunpetalBloom':
        this.drawCircle(ctx, 12, 12, 3, '#fbbf24');
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const petalPositions = [
          [12, 5, 12, 8],
          [12, 16, 12, 19],
          [5, 12, 8, 12],
          [16, 12, 19, 12],
          [7.75, 7.75, 9.87, 9.87],
          [14.13, 14.13, 16.25, 16.25],
          [7.75, 16.25, 9.87, 14.13],
          [14.13, 9.87, 16.25, 7.75],
        ];
        petalPositions.forEach(([x1, y1, x2, y2]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
        break;

      case 'aetheriumShard':
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 3);
        ctx.lineTo(18, 9);
        ctx.lineTo(15, 12);
        ctx.lineTo(21, 18);
        ctx.lineTo(12, 21);
        ctx.lineTo(3, 18);
        ctx.lineTo(9, 12);
        ctx.lineTo(6, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.moveTo(12, 8);
        ctx.lineTo(15, 12);
        ctx.lineTo(12, 16);
        ctx.lineTo(9, 12);
        ctx.closePath();
        ctx.fill();
        break;

      case 'gravitonEssence':
        this.drawCircle(ctx, 12, 12, 2, '#c026d3');
        ctx.strokeStyle = '#c026d3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(12, 12, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(12, 12, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        this.drawCircle(ctx, 8, 8, 1.5, '#e879f9');
        this.drawCircle(ctx, 16, 8, 1.5, '#e879f9');
        this.drawCircle(ctx, 8, 16, 1.5, '#e879f9');
        this.drawCircle(ctx, 16, 16, 1.5, '#e879f9');
        break;

      case 'crateKey':
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        this.drawCircle(ctx, 12, 8, 3, '#fbbf24', '#d97706', 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(11, 8, 2, 10);
        ctx.strokeRect(11, 8, 2, 10);
        ctx.fillRect(13, 13, 4, 2);
        ctx.strokeRect(13, 13, 4, 2);
        ctx.fillRect(13, 16, 3, 2);
        ctx.strokeRect(13, 16, 3, 2);
        break;

      default:
        ctx.fillStyle = '#6b7280';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(4, 4, 16, 16, 2);
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();
  }

  private static drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fill: string,
    stroke?: string,
    strokeWidth?: number
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth || 1;
      ctx.stroke();
    }
  }
}
