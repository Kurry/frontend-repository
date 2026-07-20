<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { boardCells, toolMode, activeColor, cellSize, pushHistory, showGrid, mirrorMode, visionMode } from '../lib/store';
  import QRious from 'qrious';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let drawing = false;
  let hasPaintedInStroke = false;

  $: cols = Math.floor(1024 / $cellSize);
  $: rows = Math.floor(1024 / $cellSize);
  $: width = cols * $cellSize;
  $: height = rows * $cellSize;

  // Render when store changes
  $: {
    if (ctx && $boardCells && $visionMode) {
      render();
    }
  }

  function getQRMask() {
    const qr = new QRious({ value: 'GRID PAINT STUDIO', size: cols, level: 'M' });
    const imgData = qr.ctx.getImageData(0, 0, qr.canvas.width, qr.canvas.height);
    const data = imgData.data;
    const mask = Array.from({ length: rows }, () => Array(cols).fill(false));

    // Nearest neighbor sampling of QR to our grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const qrX = Math.floor(c * (qr.canvas.width / cols));
        const qrY = Math.floor(r * (qr.canvas.height / rows));
        const idx = (qrY * qr.canvas.width + qrX) * 4;
        mask[r][c] = data[idx] < 128; // black is true
      }
    }
    return mask;
  }

  let qrMask: boolean[][] = [];
  $: {
    if (cols > 0 && rows > 0) {
      qrMask = getQRMask();
    }
  }

  const visionFilters: Record<string, string> = {
    off: 'none',
    protanopia: 'url(#protanopia)',
    deuteranopia: 'url(#deuteranopia)',
    tritanopia: 'url(#tritanopia)'
  };

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cellColor = $boardCells[r]?.[c];

        if (cellColor) {
           ctx.fillStyle = cellColor;
           ctx.fillRect(c * $cellSize, r * $cellSize, $cellSize, $cellSize);
        }
      }
    }

    if ($showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * $cellSize); ctx.lineTo(width, r * $cellSize); ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * $cellSize, 0); ctx.lineTo(c * $cellSize, height); ctx.stroke();
      }
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    render();
  });

  function getCoords(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e instanceof MouseEvent) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    }
    // Scale coords to actual canvas dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { c: Math.floor((x * scaleX) / $cellSize), r: Math.floor((y * scaleY) / $cellSize) };
  }

  function applyMirror(r: number, c: number, newCells: (string | null)[][], setColor: string | null, originalTargetColor: string | null = null) {
      const mirrors = [{r, c}];
      if ($mirrorMode === 'horizontal' || $mirrorMode === 'both') {
          mirrors.push({r, c: cols - 1 - c});
      }
      if ($mirrorMode === 'vertical' || $mirrorMode === 'both') {
          mirrors.push({r: rows - 1 - r, c});
      }
      if ($mirrorMode === 'both') {
          mirrors.push({r: rows - 1 - r, c: cols - 1 - c});
      }

      let changed = false;
      mirrors.forEach(pos => {
          if (pos.r >= 0 && pos.r < rows && pos.c >= 0 && pos.c < cols) {
              if (originalTargetColor !== null && newCells[pos.r][pos.c] !== originalTargetColor) return;
              if (newCells[pos.r][pos.c] !== setColor) {
                  newCells[pos.r][pos.c] = setColor;
                  changed = true;
              }
          }
      });
      return changed;
  }

  function paint(e: MouseEvent | TouchEvent) {
    const { r, c } = getCoords(e);
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;

    if (!hasPaintedInStroke) {
      pushHistory($boardCells);
      hasPaintedInStroke = true;
    }

    let changed = false;

    boardCells.update(cells => {
      const newCells = cells.map(row => [...row]);

      if ($toolMode === 'qr') {
        const isBlack = qrMask[r]?.[c];
        const newColor = isBlack ? ($activeColor === '#000000' ? '#ffffff' : '#000000') : ($activeColor === '#ffffff' ? '#000000' : $activeColor);
        changed = applyMirror(r, c, newCells, newColor) || changed;
      } else if ($toolMode === 'color') {
        changed = applyMirror(r, c, newCells, $activeColor) || changed;
      } else if ($toolMode === 'erase') {
        changed = applyMirror(r, c, newCells, null) || changed;
      } else if ($toolMode === 'fill') {
        // Flood fill logic
        const targetColor = newCells[r][c];
        if (targetColor === $activeColor) return cells; // same color, no-op

        const stack = [{r, c}];
        while(stack.length > 0) {
          const curr = stack.pop()!;
          if (curr.r < 0 || curr.r >= rows || curr.c < 0 || curr.c >= cols) continue;
          if (newCells[curr.r][curr.c] !== targetColor) continue;

          applyMirror(curr.r, curr.c, newCells, $activeColor, targetColor);
          changed = true;

          stack.push({r: curr.r + 1, c: curr.c});
          stack.push({r: curr.r - 1, c: curr.c});
          stack.push({r: curr.r, c: curr.c + 1});
          stack.push({r: curr.r, c: curr.c - 1});
        }
      }
      return newCells;
    });
  }

  function startStroke(e: MouseEvent | TouchEvent) {
    drawing = true;
    hasPaintedInStroke = false;
    paint(e);
  }

  function moveStroke(e: MouseEvent | TouchEvent) {
    if (drawing) paint(e);
  }

  function endStroke() {
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

<div class="flex-1 flex items-center justify-center bg-blue-600 min-h-screen">
  <canvas
    bind:this={canvas}
    width={width}
    height={height}
    class="max-w-full max-h-full object-contain cursor-crosshair shadow-2xl bg-white"
    style="filter: {visionFilters[$visionMode]};"
    on:mousedown={startStroke}
    on:mousemove={moveStroke}
    on:mouseup={endStroke}
    on:mouseleave={endStroke}
    on:touchstart|preventDefault={startStroke}
    on:touchmove|preventDefault={moveStroke}
    on:touchend|preventDefault={endStroke}
    on:touchcancel|preventDefault={endStroke}
    aria-label="Grid paint canvas"
  ></canvas>
</div>
