<script lang="ts">
  import { toolMode, activeColor, showGrid, cellSize, cellLock, mirrorMode, activeMode, undo, redo, clearBoard, undoStack, redoStack, visionMode, boardCells, pushHistory, updateBoardSize } from '../lib/store';
  import { brandedPngBlob, downloadBrandedPng } from '../lib/exportPng';
  import type { CellValue } from '../lib/types';
  import { onMount, tick } from 'svelte';

  const swatches = [
    { color: '#000000', name: '1 black', key: '1' },
    { color: '#ffffff', name: '2 white', key: '2' },
    { color: '#ff0000', name: '3 red', key: '3' },
    { color: '#ffff00', name: '4 yellow', key: '4' },
    { color: '#00ff00', name: '5 green', key: '5' },
    { color: '#0000ff', name: '6 blue', key: '6' },
    { color: '#ff0098', name: '7 pink', key: '7' },
  ];

  function handleKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

    if (e.key === 'q' || e.key === 'Q') $toolMode = 'qr';
    if (e.key === 'b' || e.key === 'B') $toolMode = 'color';
    if (e.key === 'f' || e.key === 'F') $toolMode = 'fill';
    if (e.key === 'e' || e.key === 'E') $toolMode = 'erase';
    if (e.key === 'g' || e.key === 'G') $showGrid = !$showGrid;
    if (e.key === 'm' || e.key === 'M') {
      const modes: import('../lib/types').MirrorMode[] = ['off', 'horizontal', 'vertical', 'both'];
      $mirrorMode = modes[(modes.indexOf($mirrorMode) + 1) % modes.length];
    }

    if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey)) {
      e.preventDefault();
      undo();
    }
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      redo();
    }

    swatches.forEach(s => {
      if (e.key === s.key) {
        $activeColor = s.color;
      }
    });
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      closeCamera();
    };
  });

  // --- Desktop toolbar drag: grab the /GRID PAINT TOOLS header to move the
  // floating panel, clamped within the stage/viewport bounds. ---
  let toolbarEl: HTMLDivElement;
  let dragging = false;
  let toolbarPos = { x: 16, y: 16 }; // matches the default top-4 left-4 (1rem)
  let dragOffset = { x: 0, y: 0 };

  function clampToStage(x: number, y: number) {
    if (typeof window === 'undefined' || !toolbarEl) return { x, y };
    const maxX = Math.max(0, window.innerWidth - toolbarEl.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - toolbarEl.offsetHeight);
    return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
  }

  function dragPoint(e: MouseEvent | TouchEvent) {
    return e instanceof MouseEvent ? e : e.touches[0];
  }

  function startToolbarDrag(e: MouseEvent | TouchEvent) {
    if (!toolbarEl) return;
    const point = dragPoint(e);
    if (!point) return;
    dragging = true;
    const rect = toolbarEl.getBoundingClientRect();
    dragOffset = { x: point.clientX - rect.left, y: point.clientY - rect.top };
    window.addEventListener('mousemove', onToolbarDrag);
    window.addEventListener('mouseup', stopToolbarDrag);
    window.addEventListener('touchmove', onToolbarDrag, { passive: false });
    window.addEventListener('touchend', stopToolbarDrag);
  }

  function onToolbarDrag(e: MouseEvent | TouchEvent) {
    if (!dragging) return;
    const point = dragPoint(e);
    if (!point) return;
    if (e.cancelable) e.preventDefault();
    toolbarPos = clampToStage(point.clientX - dragOffset.x, point.clientY - dragOffset.y);
  }

  function stopToolbarDrag() {
    dragging = false;
    window.removeEventListener('mousemove', onToolbarDrag);
    window.removeEventListener('mouseup', stopToolbarDrag);
    window.removeEventListener('touchmove', onToolbarDrag);
    window.removeEventListener('touchend', stopToolbarDrag);
  }

  function handleCellSizeInput(e: Event) {
    // Rebuild the board matrix to match the new resolution instead of only
    // changing pixel math (updateBoardSize resamples existing artwork into
    // the new cell count and respects the cell lock).
    updateBoardSize(Number((e.currentTarget as HTMLInputElement).value));
  }

  // --- Upload / Camera: pixelize an image source onto the grid ---
  let fileInput: HTMLInputElement;

  function applyPixelized(t: CanvasRenderingContext2D, cols: number, rows: number) {
    pushHistory($boardCells); // one undo step; also locks the Cell control
    const data = t.getImageData(0, 0, cols, rows).data;
    const cells: CellValue[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const i = (r * cols + c) * 4;
        return { kind: 'color', color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})` } as CellValue;
      })
    );
    boardCells.set(cells);
  }

  function boardDims() {
    const rows = $boardCells.length || Math.floor(1024 / $cellSize);
    const cols = $boardCells[0]?.length || rows;
    return { cols, rows };
  }

  function handleUpload(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const { cols, rows } = boardDims();
      const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const nw = img.naturalWidth * scale;
      const nh = img.naturalHeight * scale;
      const tmp = document.createElement('canvas');
      tmp.width = cols;
      tmp.height = rows;
      const t = tmp.getContext('2d', { willReadFrequently: true })!;
      t.imageSmoothingEnabled = false;
      t.drawImage(img, (cols - nw) / 2, (rows - nh) / 2, nw, nh);
      applyPixelized(t, cols, rows);
      URL.revokeObjectURL(img.src);
      input.value = '';
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      input.value = '';
    };
    img.src = URL.createObjectURL(file);
  }

  // --- Camera overlay ---
  let cameraOpen = false;
  let cameraError = '';
  let cameraStream: MediaStream | null = null;
  let cameraFeed: HTMLVideoElement;
  let cameraButton: HTMLButtonElement;
  let captureButton: HTMLButtonElement;

  async function openCamera() {
    cameraError = '';
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } },
        audio: false
      });
      cameraOpen = true;
      await tick();
      if (cameraFeed) cameraFeed.srcObject = cameraStream;
      captureButton?.focus();
    } catch (err) {
      cameraError = 'Camera access denied — allow camera access to capture.';
    }
  }

  function closeCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    if (cameraFeed) cameraFeed.srcObject = null;
    if (cameraOpen) {
      cameraOpen = false;
      cameraButton?.focus();
    }
  }

  function captureCamera() {
    if (cameraFeed) {
      const vw = cameraFeed.videoWidth;
      const vh = cameraFeed.videoHeight;
      if (vw && vh) {
        const side = Math.min(vw, vh);
        const { cols, rows } = boardDims();
        const tmp = document.createElement('canvas');
        tmp.width = cols;
        tmp.height = rows;
        const t = tmp.getContext('2d', { willReadFrequently: true })!;
        t.imageSmoothingEnabled = false;
        t.drawImage(cameraFeed, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, cols, rows);
        applyPixelized(t, cols, rows);
      }
    }
    closeCamera();
  }

  function handleCameraKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeCamera();
    }
  }

  // --- Share ---
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  async function shareBoard() {
    try {
      const blob = await brandedPngBlob($boardCells, $cellSize);
      if (!blob) return;
      const file = new File([blob], 'grid_paint.png', { type: 'image/png' });
      if (isMobileDevice() && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Grid Paint Studio',
          text: 'Check out my grid art made with Grid Paint Studio!',
          files: [file]
        });
      } else {
        await downloadBrandedPng($boardCells, $cellSize);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    }
  }
</script>

<div
  bind:this={toolbarEl}
  class="fixed bg-gray-900 text-white p-4 rounded-lg shadow-lg flex flex-col gap-4 z-50 gp-toolbar gp-drag-box"
  class:dragging={dragging}
  style="left: {toolbarPos.x}px; top: {toolbarPos.y}px;"
  role="toolbar"
  aria-label="Main Toolbar"
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="flex items-center justify-between gp-drag-handle cursor-move"
    on:mousedown={startToolbarDrag}
    on:touchstart={startToolbarDrag}
  >
    <span class="text-xs font-bold tracking-widest text-gray-400 drag-box-label">/GRID PAINT TOOLS</span>
  </div>

  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium flex items-center justify-between gp-ctrl">
      Cell Size
      <input type="range" min="16" max="64" value={$cellSize} on:input={handleCellSizeInput} disabled={$cellLock} class="ml-2 w-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Cell Size" />
    </label>
  </div>

  <div class="flex gap-2 gp-modes flex-wrap">
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'qr' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'qr'} aria-pressed={$toolMode === 'qr'} aria-label="QR Brush" title="QR Brush (Q)">QR Brush</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'color' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'color'} aria-pressed={$toolMode === 'color'} aria-label="Color Brush" title="Color Brush (B)">Color Brush</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'fill' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'fill'} aria-pressed={$toolMode === 'fill'} aria-label="Flood Fill" title="Flood Fill (F)">Flood Fill</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'erase' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'erase'} aria-pressed={$toolMode === 'erase'} aria-label="Eraser" title="Eraser (E)">Eraser</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$showGrid ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $showGrid = !$showGrid} aria-pressed={$showGrid} aria-label={$showGrid ? 'Grid On' : 'Grid Off'} title="{$showGrid ? 'Grid On' : 'Grid Off'} (G)">{$showGrid ? 'Grid On' : 'Grid Off'}</button>
  </div>

  <div class="flex gap-2">
    <label class="text-sm font-medium flex items-center justify-between flex-1">
      Mirror
      <select bind:value={$mirrorMode} class="ml-2 bg-gray-800 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Mirror Mode">
        <option value="off">Off</option>
        <option value="horizontal">Horizontal</option>
        <option value="vertical">Vertical</option>
        <option value="both">Both</option>
      </select>
    </label>

    <label class="text-sm font-medium flex items-center justify-between flex-1">
      Vision
      <select bind:value={$visionMode} class="ml-2 bg-gray-800 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Vision Mode">
        <option value="off">Off</option>
        <option value="protanopia">Protanopia</option>
        <option value="deuteranopia">Deuteranopia</option>
        <option value="tritanopia">Tritanopia</option>
      </select>
    </label>
  </div>

  <div class="flex gap-2 gp-palette">
    {#each swatches as swatch}
      <button
        class="w-8 h-8 rounded-full border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white gp-swatch {$activeColor === swatch.color ? 'border-white' : 'border-transparent'}"
        style="background-color: {swatch.color}"
        aria-label={swatch.name}
        aria-pressed={$activeColor === swatch.color}
        title={swatch.name}
        on:click={() => $activeColor = swatch.color}
      ></button>
    {/each}
  </div>

  <div class="flex gap-2 text-sm flex-wrap">
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800" on:click={() => fileInput.click()} aria-label="Upload" title="Upload image">Upload</button>
    <button bind:this={cameraButton} class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800" on:click={openCamera} aria-label="Camera" title="Capture from camera">Camera</button>
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800 disabled:opacity-50" on:click={undo} disabled={$undoStack.length === 0} aria-label="Undo" title="Undo (Ctrl+Z / Backspace)">Undo</button>
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800 disabled:opacity-50" on:click={redo} disabled={$redoStack.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">Redo</button>
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-red-900" on:click={clearBoard} aria-label="Clear" title="Clear">Clear</button>
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800" on:click={shareBoard} aria-label="Share" title="Share PNG (falls back to download)">Share</button>
  </div>

  <input type="file" accept="image/*" class="hidden" bind:this={fileInput} on:change={handleUpload} aria-hidden="true" tabindex="-1" />

  {#if cameraError}
    <div class="text-xs text-red-400" aria-live="polite">{cameraError}</div>
  {/if}

  {#if cameraOpen}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="bg-black border border-gray-700 rounded-lg p-3 flex flex-col gap-2" role="dialog" aria-modal="true" aria-label="Camera capture" on:keydown={handleCameraKeydown}>
      <!-- svelte-ignore a11y-media-has-caption -->
      <video bind:this={cameraFeed} autoplay playsinline muted class="w-full rounded"></video>
      <div class="flex gap-2 text-sm">
        <button bind:this={captureButton} class="px-3 py-1 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-blue-600" on:click={captureCamera}>Capture</button>
        <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800" on:click={closeCamera}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="flex gap-2 text-sm mt-4">
    <button class="px-3 py-1 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$activeMode === 'paint' ? 'bg-white text-black' : 'bg-gray-800'}" on:click={() => $activeMode = 'paint'} aria-pressed={$activeMode === 'paint'}>Paint</button>
    <button class="px-3 py-1 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$activeMode === 'gallery' ? 'bg-white text-black' : 'bg-gray-800'}" on:click={() => $activeMode = 'gallery'} aria-pressed={$activeMode === 'gallery'}>Gallery</button>
    <button class="px-3 py-1 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$activeMode === 'export' ? 'bg-white text-black' : 'bg-gray-800'}" on:click={() => $activeMode = 'export'} aria-pressed={$activeMode === 'export'}>Export</button>
  </div>
</div>
