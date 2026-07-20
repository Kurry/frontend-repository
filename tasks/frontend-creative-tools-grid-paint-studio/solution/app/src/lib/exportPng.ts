// Renders the board artwork from store state (grid overlay intentionally omitted)
// and appends the branded black footer strip for grid_paint.png exports.
import { drawCell } from './qrGlyph';
import type { CellValue } from './types';

export function renderBoardCanvas(cells: CellValue[][], cellPx: number): HTMLCanvasElement {
  const rows = cells.length;
  const cols = rows > 0 ? cells[0].length : 0;
  const out = document.createElement('canvas');
  out.width = Math.max(1, cols * cellPx);
  out.height = Math.max(1, rows * cellPx);
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      if (cell) {
        drawCell(ctx, cell, c * cellPx, r * cellPx, cellPx);
      }
    }
  }
  return out;
}

export function renderBrandedCanvas(cells: CellValue[][], cellPx: number): HTMLCanvasElement {
  const grid = renderBoardCanvas(cells, cellPx);
  const footerHeight = 48;
  const padding = 16;
  const merged = document.createElement('canvas');
  merged.width = grid.width;
  merged.height = grid.height + footerHeight;
  const m = merged.getContext('2d')!;
  m.drawImage(grid, 0, 0);
  m.fillStyle = '#000000';
  m.fillRect(0, grid.height, merged.width, footerHeight);
  m.fillStyle = '#ffffff';
  m.font = '16px "Arial Narrow", Arial, sans-serif';
  m.textBaseline = 'middle';
  m.fillText('/MADE WITH GRID PAINT STUDIO', padding, grid.height + footerHeight / 2);
  const rightText = '<GRIDPAINT.STUDIO>';
  m.fillText(rightText, merged.width - m.measureText(rightText).width - padding, grid.height + footerHeight / 2);
  return merged;
}

export function brandedPngBlob(cells: CellValue[][], cellPx: number): Promise<Blob | null> {
  return new Promise(resolve => renderBrandedCanvas(cells, cellPx).toBlob(resolve, 'image/png'));
}

export async function downloadBrandedPng(cells: CellValue[][], cellPx: number): Promise<void> {
  const blob = await brandedPngBlob(cells, cellPx);
  if (!blob) return;
  const a = document.createElement('a');
  a.download = 'grid_paint.png';
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}
