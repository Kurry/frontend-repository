import { Annotation, StrokeWidth, TextStyle } from './store';

export function getStrokeWidth(sw: StrokeWidth): number {
  switch (sw) {
    case 'thin': return 1.5;
    case 'medium': return 3;
    case 'thick': return 5;
    default: return 3;
  }
}

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  ann: Annotation,
  isSelected: boolean,
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  sourceImage?: HTMLImageElement | HTMLCanvasElement | null
) {
  const scaleX = canvasWidth / (imageWidth || 1);
  const scaleY = canvasHeight / (imageHeight || 1);
  
  const x = (ann.x ?? 0) * scaleX;
  const y = (ann.y ?? 0) * scaleY;
  const x2 = (ann.x2 ?? ann.x ?? 0) * scaleX;
  const y2 = (ann.y2 ?? ann.y ?? 0) * scaleY;
  
  const sw = getStrokeWidth(ann.strokeWidth) * Math.min(scaleX, scaleY);
  ctx.lineWidth = sw;
  ctx.strokeStyle = ann.color;
  ctx.fillStyle = ann.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  switch (ann.type) {
    case 'rectangle': {
      ctx.strokeRect(x, y, x2 - x, y2 - y);
      break;
    }
    case 'oval': {
      const cx = (x + x2) / 2;
      const cy = (y + y2) / 2;
      const rx = Math.abs(x2 - x) / 2;
      const ry = Math.abs(y2 - y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      break;
    }
    case 'arrow': {
      const headLen = 14 * Math.min(scaleX, scaleY);
      const angle = Math.atan2(y2 - y, x2 - x);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = ann.color;
      ctx.fill();
      break;
    }
    case 'text': {
      const fontSize = (ann.fontSize ?? 16) * Math.min(scaleX, scaleY);
      const isBold = ann.textStyle === 'bold-caption';
      ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px 'Segoe UI', sans-serif`;
      
      if (ann.textStyle === 'outline') {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = Math.max(1, sw * 0.5);
        ctx.strokeText(ann.text ?? 'Text', x, y);
      } else if (ann.textStyle === 'highlight-box') {
        const metrics = ctx.measureText(ann.text ?? 'Text');
        const padding = 4 * Math.min(scaleX, scaleY);
        ctx.fillStyle = ann.color + '33';
        ctx.fillRect(x - padding, y - fontSize - padding, metrics.width + padding * 2, fontSize + padding * 2);
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.text ?? 'Text', x, y);
      } else if (ann.textStyle === 'shadow') {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4 * Math.min(scaleX, scaleY);
        ctx.shadowOffsetX = 2 * Math.min(scaleX, scaleY);
        ctx.shadowOffsetY = 2 * Math.min(scaleX, scaleY);
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.text ?? 'Text', x, y);
        ctx.restore();
      } else {
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.text ?? 'Text', x, y);
      }
      break;
    }
    case 'highlighter': {
      ctx.fillStyle = (ann.highlightColor ?? ann.color) + '55';
      ctx.fillRect(x, y, x2 - x, y2 - y);
      break;
    }
    case 'loupe': {
      // Draw connecting line from source point to loupe center
      const loupeRadius = 40 * Math.min(scaleX, scaleY);
      const offset = 80 * Math.min(scaleX, scaleY);
      const lx = x + offset;
      const ly = y - offset;
      
      // Source point marker
      ctx.beginPath();
      ctx.arc(x, y, 5 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = ann.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5 * Math.min(scaleX, scaleY);
      ctx.stroke();
      
      // Connecting line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = '#FFFFFF88';
      ctx.lineWidth = 1 * Math.min(scaleX, scaleY);
      ctx.stroke();
      
      // Loupe background
      ctx.beginPath();
      ctx.arc(lx, ly, loupeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000AA';
      ctx.fill();
      
      // Clip and draw zoomed area from source image
      if (sourceImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, loupeRadius - 1, 0, Math.PI * 2);
        ctx.clip();
        
        const zoom = ann.loupeZoom ?? 2;
        // Calculate source region in image coordinates
        const srcX = (ann.x ?? 0);
        const srcY = (ann.y ?? 0);
        const srcSize = loupeRadius / zoom / Math.min(scaleX, scaleY);
        
        ctx.drawImage(
          sourceImage,
          srcX - srcSize, srcY - srcSize, srcSize * 2, srcSize * 2,
          lx - loupeRadius + 1, ly - loupeRadius + 1, (loupeRadius - 1) * 2, (loupeRadius - 1) * 2
        );
        ctx.restore();
      }
      
      // Loupe border
      ctx.beginPath();
      ctx.arc(lx, ly, loupeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5 * Math.min(scaleX, scaleY);
      ctx.stroke();
      
      // Crosshair in loupe
      ctx.strokeStyle = '#FFFFFF44';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(lx - loupeRadius * 0.3, ly);
      ctx.lineTo(lx + loupeRadius * 0.3, ly);
      ctx.moveTo(lx, ly - loupeRadius * 0.3);
      ctx.lineTo(lx, ly + loupeRadius * 0.3);
      ctx.stroke();
      
      break;
    }
    default:
      break;
  }
  
  // Selection indicator
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#0079FD';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    const pad = 6;
    if (ann.type === 'text') {
      const fontSize = (ann.fontSize ?? 16) * Math.min(scaleX, scaleY);
      ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
      const metrics = ctx.measureText(ann.text ?? 'Text');
      ctx.strokeRect(x - pad, y - fontSize - pad, metrics.width + pad * 2, fontSize + pad * 2);
    } else if (ann.type === 'line' || ann.type === 'arrow') {
      ctx.strokeRect(Math.min(x, x2) - pad, Math.min(y, y2) - pad, Math.abs(x2 - x) + pad * 2, Math.abs(y2 - y) + pad * 2);
    } else if (ann.type === 'loupe') {
      const s = 8 * Math.min(scaleX, scaleY);
      ctx.strokeRect(x - pad, y - pad, s + pad * 2, s + pad * 2);
    } else {
      ctx.strokeRect(Math.min(x, x2) - pad, Math.min(y, y2) - pad, Math.abs(x2 - x) + pad * 2, Math.abs(y2 - y) + pad * 2);
    }
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export function applyBlurEffect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  canvasWidth: number, canvasHeight: number
) {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.min(Math.ceil(Math.abs(w)), canvasWidth - sx);
  const sh = Math.min(Math.ceil(Math.abs(h)), canvasHeight - sy);
  
  if (sw <= 0 || sh <= 0) return;
  
  try {
    const imageData = ctx.getImageData(sx, sy, sw, sh);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const radius = 6;
    const copy = new Uint8ClampedArray(data);
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = py + dy;
            const nx = px + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const idx = (ny * width + nx) * 4;
              r += copy[idx];
              g += copy[idx + 1];
              b += copy[idx + 2];
              count++;
            }
          }
        }
        
        const idx = (py * width + px) * 4;
        data[idx] = Math.round(r / count);
        data[idx + 1] = Math.round(g / count);
        data[idx + 2] = Math.round(b / count);
      }
    }
    
    ctx.putImageData(imageData, sx, sy);
  } catch (e) {
    console.warn('Blur effect failed:', e);
  }
}

export function applyPixelateEffect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  canvasWidth: number, canvasHeight: number,
  pixelSize: number = 8
) {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.min(Math.ceil(Math.abs(w)), canvasWidth - sx);
  const sh = Math.min(Math.ceil(Math.abs(h)), canvasHeight - sy);
  
  if (sw <= 0 || sh <= 0) return;
  
  try {
    const imageData = ctx.getImageData(sx, sy, sw, sh);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const ps = Math.max(2, Math.floor(pixelSize));
    
    for (let py = 0; py < height; py += ps) {
      for (let px = 0; px < width; px += ps) {
        let r = 0, g = 0, b = 0, count = 0;
        
        const blockW = Math.min(ps, width - px);
        const blockH = Math.min(ps, height - py);
        
        for (let by = 0; by < blockH; by++) {
          for (let bx = 0; bx < blockW; bx++) {
            const idx = ((py + by) * width + (px + bx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        for (let by = 0; by < blockH; by++) {
          for (let bx = 0; bx < blockW; bx++) {
            const idx = ((py + by) * width + (px + bx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }
    
    ctx.putImageData(imageData, sx, sy);
  } catch (e) {
    console.warn('Pixelate effect failed:', e);
  }
}

export function applySpotlightEffect(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
  canvasWidth: number, canvasHeight: number
) {
  try {
    ctx.save();
    // Dim everything outside
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Cut out oval
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fill();
    
    // Soft edge
    ctx.globalCompositeOperation = 'destination-out';
    const gradient = ctx.createRadialGradient(cx, cy, Math.min(Math.abs(rx), Math.abs(ry)) * 0.7, cx, cy, Math.max(Math.abs(rx), Math.abs(ry)) * 1.1);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(rx) * 1.15, Math.abs(ry) * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  } catch (e) {
    console.warn('Spotlight effect failed:', e);
  }
}
