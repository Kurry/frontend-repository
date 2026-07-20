// Shared QR-glyph rendering used by the paint canvas and by PNG export so
// both surfaces draw QR Brush cells identically: each painted cell shows the
// actual QR module shape (a mask of a fixed studio string), not a flat
// color swatch. Mirrors the approach in the reference app.js drawBoard().
import QRious from 'qrious';
import type { CellValue } from './types';

const MASK_SIZE = 64;
const QR_VALUE = 'GRIDPAINT.STUDIO';

let qrMaskCanvas: HTMLCanvasElement | null = null;

function buildQrMask(): HTMLCanvasElement {
  const tmp = document.createElement('canvas');
  tmp.width = MASK_SIZE;
  tmp.height = MASK_SIZE;
  // eslint-disable-next-line no-new -- QRious renders into `element` as a side effect
  new QRious({
    element: tmp,
    size: MASK_SIZE,
    value: QR_VALUE,
    level: 'H',
    background: '#ffffff',
    foreground: '#000000'
  });

  const srcCtx = tmp.getContext('2d')!;
  const src = srcCtx.getImageData(0, 0, MASK_SIZE, MASK_SIZE);

  const mask = document.createElement('canvas');
  mask.width = MASK_SIZE;
  mask.height = MASK_SIZE;
  const maskCtx = mask.getContext('2d')!;
  const dst = maskCtx.createImageData(MASK_SIZE, MASK_SIZE);
  for (let i = 0; i < src.data.length; i += 4) {
    const luminance = 0.2126 * src.data[i] + 0.7152 * src.data[i + 1] + 0.0722 * src.data[i + 2];
    dst.data[i] = 0;
    dst.data[i + 1] = 0;
    dst.data[i + 2] = 0;
    dst.data[i + 3] = luminance < 128 ? 255 : 0; // opaque where the QR module is dark
  }
  maskCtx.putImageData(dst, 0, 0);
  return mask;
}

function getQrMask(): HTMLCanvasElement {
  if (!qrMaskCanvas) qrMaskCanvas = buildQrMask();
  return qrMaskCanvas;
}

export function qrGlyphColors(swatch: string): { fg: string; bg: string } {
  const isWhite = swatch.toLowerCase() === '#ffffff';
  const isBlack = swatch.toLowerCase() === '#000000';
  return {
    fg: isWhite ? '#000000' : isBlack ? '#ffffff' : swatch,
    bg: isWhite ? '#ffffff' : isBlack ? '#000000' : '#ffffff'
  };
}

export function drawQrCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, swatch: string) {
  const mask = getQrMask();
  const { fg, bg } = qrGlyphColors(swatch);
  const w = Math.max(1, Math.round(size));
  const h = Math.max(1, Math.round(size));
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext('2d')!;
  t.imageSmoothingEnabled = false;
  t.fillStyle = fg;
  t.fillRect(0, 0, w, h);
  t.globalCompositeOperation = 'destination-in';
  t.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, w, h);
  t.globalCompositeOperation = 'destination-over';
  t.fillStyle = bg;
  t.fillRect(0, 0, w, h);
  ctx.drawImage(tmp, x, y);
}

export function drawCell(ctx: CanvasRenderingContext2D, cell: CellValue, x: number, y: number, size: number) {
  if (!cell) return;
  if (cell.kind === 'color') {
    ctx.fillStyle = cell.color;
    ctx.fillRect(x, y, size, size);
  } else {
    drawQrCell(ctx, x, y, size, cell.color);
  }
}
