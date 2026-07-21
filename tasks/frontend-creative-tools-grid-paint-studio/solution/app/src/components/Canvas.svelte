<script lang="ts">
  import { onMount } from 'svelte';
  import {
    boardCells, displayCells, toolMode, activeColor, cellSize, pushHistory,
    showGrid, mirrorMode, visionMode, selectedCell
  } from '../lib/store';
  import { drawCell } from '../lib/qrGlyph';
  import type { CellValue } from '../lib/types';

  let canvas: HTMLCanvasElement;
  let overlay: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let octx: CanvasRenderingContext2D;

  let drawing = false;
  let hasPaintedInStroke = false;
  let hover: { r: number; c: number } | null = null;

  $: cols = Math.floor(1024 / $cellSize);
  $: rows = Math.floor(1024 / $cellSize);
  $: width = cols * $cellSize;
  $: height = rows * $cellSize;

  const visionFilters: Record<string, string> = {
    off: 'none',
    protanopia: 'url(#protanopia)',
    deuteranopia: 'url(#deuteranopia)',
    tritanopia: 'url(#tritanopia)'
  };

  // Coalesce rapid store updates (drag strokes) into one redraw per frame so
  // a fast pointer never queues more paint work than the display can show.
  let renderQueued = false;
  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  }

  // Re-render whenever any visual input changes. Referencing the stores inside
  // this block (not just inside render()) is what registers them as deps, so a
  // drag stroke, grid toggle, resolution change, or selection all redraw.
  $: {
    $displayCells; $showGrid; $selectedCell; $cellSize;
    if (ctx) queueRender();
  }

  function render() {
    if (!ctx) return;
    const cells = $displayCells;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cells[r]?.[c];
        if (cell) drawCell(ctx, cell, c * $cellSize, r * $cellSize, $cellSize);
      }
    }

    if ($showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * $cellSize + 0.5); ctx.lineTo(width, r * $cellSize + 0.5); ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * $cellSize + 0.5, 0); ctx.lineTo(c * $cellSize + 0.5, height); ctx.stroke();
      }
    }

    if ($selectedCell) {
      const { r, c } = $selectedCell;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(c * $cellSize + 1.5, r * $cellSize + 1.5, $cellSize - 3, $cellSize - 3);
      }
    }

    drawGhost();
  }

  function cellsEqual(a: CellValue, b: CellValue): boolean {
    if (a === null || b === null) return a === b;
    return a.kind === b.kind && a.color === b.color;
  }

  function mirrorTargets(r: number, col: number): { r: number; c: number }[] {
    const mirrors = [{ r, c: col }];
    if ($mirrorMode === 'horizontal' || $mirrorMode === 'both') mirrors.push({ r, c: cols - 1 - col });
    if ($mirrorMode === 'vertical' || $mirrorMode === 'both') mirrors.push({ r: rows - 1 - r, c: col });
    if ($mirrorMode === 'both') mirrors.push({ r: rows - 1 - r, c: cols - 1 - col });
    return mirrors.filter(p => p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols);
  }

  // Live preview of the cells a stroke would affect (including mirror pairs) —
  // a creative-tool affordance shown on a transparent overlay above the board.
  function drawGhost() {
    if (!octx) return;
    octx.clearRect(0, 0, width, height);
    if (!hover || drawing) return;
    if ($toolMode === 'fill') return;
    const targets = mirrorTargets(hover.r, hover.c);
    octx.globalAlpha = 0.35;
    for (const t of targets) {
      if ($toolMode === 'erase') {
        octx.fillStyle = '#ffffff';
      } else {
        octx.fillStyle = $activeColor;
      }
      octx.fillRect(t.c * $cellSize, t.r * $cellSize, $cellSize, $cellSize);
    }
    octx.globalAlpha = 1;
  }

  onMount(() => {
    ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    octx = overlay.getContext('2d')!;
    render();
  });

  function getCoords(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { c: Math.floor((x * scaleX) / $cellSize), r: Math.floor((y * scaleY) / $cellSize) };
  }

  function applyMirror(r: number, col: number, newCells: CellValue[][], setColor: CellValue, originalTargetColor?: CellValue) {
    let changed = false;
    for (const pos of mirrorTargets(r, col)) {
      const current = newCells[pos.r][pos.c] ?? null;
      if (originalTargetColor !== undefined && !cellsEqual(current, originalTargetColor)) continue;
      if (!cellsEqual(current, setColor)) {
        newCells[pos.r][pos.c] = setColor;
        changed = true;
      }
    }
    return changed;
  }

  function paint(e: PointerEvent) {
    const { r, c } = getCoords(e);
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;

    if ($toolMode === 'fill' && cellsEqual($boardCells[r]?.[c] ?? null, { kind: 'color', color: $activeColor })) return;

    if (!hasPaintedInStroke) {
      pushHistory($boardCells);
      hasPaintedInStroke = true;
    }

    boardCells.update(cells => {
      const newCells = cells.map(row => row.map(x => (x ? { ...x } : null)));
      if ($toolMode === 'qr') applyMirror(r, c, newCells, { kind: 'qr', color: $activeColor });
      else if ($toolMode === 'color') applyMirror(r, c, newCells, { kind: 'color', color: $activeColor });
      else if ($toolMode === 'erase') applyMirror(r, c, newCells, null);
      else if ($toolMode === 'fill') {
        const targetColor = newCells[r][c] ?? null;
        const fillValue: CellValue = { kind: 'color', color: $activeColor };
        if (cellsEqual(targetColor, fillValue)) return cells;
        const stack = [{ r, c }];
        while (stack.length > 0) {
          const curr = stack.pop()!;
          if (curr.r < 0 || curr.r >= rows || curr.c < 0 || curr.c >= cols) continue;
          if (!cellsEqual(newCells[curr.r][curr.c] ?? null, targetColor)) continue;
          applyMirror(curr.r, curr.c, newCells, fillValue, targetColor);
          stack.push({ r: curr.r + 1, c: curr.c }, { r: curr.r - 1, c: curr.c }, { r: curr.r, c: curr.c + 1 }, { r: curr.r, c: curr.c - 1 });
        }
      }
      return newCells;
    });
  }

  function startStroke(e: PointerEvent) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    hasPaintedInStroke = false;
    hover = null;
    paint(e);
  }
  function moveStroke(e: PointerEvent) {
    const { r, c } = getCoords(e);
    if (r >= 0 && r < rows && c >= 0 && c < cols) hover = { r, c }; else hover = null;
    if (drawing && $toolMode !== 'fill') paint(e);
    else drawGhost();
  }
  function endStroke(e: PointerEvent) {
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    drawing = false;
  }
</script>

<svg class="hidden" aria-hidden="true">
  <defs>
    <filter id="protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" /></filter>
    <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" /></filter>
    <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" /></filter>
  </defs>
</svg>

<div class="gp-stage flex-1 flex items-center justify-center p-6">
  <div class="relative" style="width: min(100%, {width}px); aspect-ratio: 1 / 1;">
    <canvas
      bind:this={canvas}
      width={width}
      height={height}
      class="w-full h-full cursor-crosshair shadow-2xl bg-white block"
      style="filter: {visionFilters[$visionMode]}; touch-action: none;"
      on:pointerdown={startStroke}
      on:pointermove={moveStroke}
      on:pointerup={endStroke}
      on:pointercancel={endStroke}
      on:pointerleave={() => { hover = null; drawGhost(); }}
      aria-label="Grid paint canvas, {rows} by {cols} cells"
    ></canvas>
    <canvas
      bind:this={overlay}
      width={width}
      height={height}
      class="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    ></canvas>
  </div>
</div>
