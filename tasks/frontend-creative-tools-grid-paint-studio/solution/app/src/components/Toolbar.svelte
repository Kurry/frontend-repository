<script lang="ts">
  import {
    toolMode, activeColor, showGrid, cellSize, cellLock, mirrorMode, activeMode,
    undo, redo, clearBoard, undoStack, redoStack, visionMode, boardCells, pushHistory,
    updateBoardSize, cameraOpen, cameraClosing, cameraError, timelineIndex,
    timelineLength, scrubTimeline, commitTimeline
  } from '../lib/store';
  import { brandedPngBlob, downloadBrandedPng } from '../lib/exportPng';
  import type { CellValue, MirrorMode } from '../lib/types';
  import { onMount, tick } from 'svelte';

  const swatches = [
    { color: '#000000', name: 'Black', key: '1' },
    { color: '#ffffff', name: 'White', key: '2' },
    { color: '#ff0000', name: 'Red', key: '3' },
    { color: '#ffff00', name: 'Yellow', key: '4' },
    { color: '#00ff00', name: 'Green', key: '5' },
    { color: '#0000ff', name: 'Blue', key: '6' },
    { color: '#ff0098', name: 'Pink', key: '7' },
  ];

  function handleKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

    if (e.key === 'q' || e.key === 'Q') $toolMode = 'qr';
    if (e.key === 'b' || e.key === 'B') $toolMode = 'color';
    if (e.key === 'f' || e.key === 'F') $toolMode = 'fill';
    if (e.key === 'e' || e.key === 'E') $toolMode = 'erase';
    if (e.key === 'g' || e.key === 'G') $showGrid = !$showGrid;
    if (e.key === 'm' || e.key === 'M') {
      const modes: MirrorMode[] = ['off', 'horizontal', 'vertical', 'both'];
      $mirrorMode = modes[(modes.indexOf($mirrorMode) + 1) % modes.length];
    }
    if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey)) {
      e.preventDefault(); undo();
    }
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault(); redo();
    }
    swatches.forEach(s => { if (e.key === s.key) $activeColor = s.color; });
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => { window.removeEventListener('keydown', handleKeydown); releaseCamera(); };
  });

  // --- Desktop toolbar drag ---
  let toolbarEl: HTMLDivElement;
  let dragging = false;
  let toolbarPos = { x: 16, y: 96 };
  let dragOffset = { x: 0, y: 0 };

  function clampToStage(x: number, y: number) {
    if (typeof window === 'undefined' || !toolbarEl) return { x, y };
    const maxX = Math.max(0, window.innerWidth - toolbarEl.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - toolbarEl.offsetHeight);
    return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
  }
  function dragPoint(e: MouseEvent | TouchEvent) { return e instanceof MouseEvent ? e : e.touches[0]; }
  function startToolbarDrag(e: MouseEvent | TouchEvent) {
    if (!toolbarEl) return;
    const point = dragPoint(e); if (!point) return;
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
    const point = dragPoint(e); if (!point) return;
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
    updateBoardSize(Number((e.currentTarget as HTMLInputElement).value));
  }

  // --- Upload / Camera: pixelize an image source onto the grid ---
  let fileInput: HTMLInputElement;
  function applyPixelized(t: CanvasRenderingContext2D, cols: number, rows: number) {
    pushHistory($boardCells);
    const data = t.getImageData(0, 0, cols, rows).data;
    const cells: CellValue[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, cCol) => {
        const i = (r * cols + cCol) * 4;
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
    const file = input.files?.[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
      const { cols, rows } = boardDims();
      const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const nw = img.naturalWidth * scale, nh = img.naturalHeight * scale;
      const tmp = document.createElement('canvas'); tmp.width = cols; tmp.height = rows;
      const t = tmp.getContext('2d', { willReadFrequently: true })!;
      t.imageSmoothingEnabled = false;
      t.drawImage(img, (cols - nw) / 2, (rows - nh) / 2, nw, nh);
      applyPixelized(t, cols, rows);
      URL.revokeObjectURL(img.src); input.value = '';
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); input.value = ''; };
    img.src = URL.createObjectURL(file);
  }

  // --- Camera overlay (driven by shared store so WebMCP session tools work) ---
  let cameraStream: MediaStream | null = null;
  let cameraFeed: HTMLVideoElement;
  let cameraButton: HTMLButtonElement;
  let captureButton: HTMLButtonElement;
  let cancelButton: HTMLButtonElement;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  async function acquireCamera() {
    $cameraError = '';
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } }, audio: false });
      await tick();
      if (cameraFeed) cameraFeed.srcObject = cameraStream;
      captureButton?.focus();
    } catch {
      $cameraError = 'Camera unavailable — access was denied or no camera is present. The board is unchanged.';
      await tick();
      cancelButton?.focus();
    }
  }
  function releaseCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    if (cameraFeed) cameraFeed.srcObject = null;
  }
  function openCamera() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    $cameraClosing = false;
    $cameraOpen = true;
  }
  function closeCamera() {
    // Fade the overlay out, then unmount and return focus to the Camera button.
    if (!$cameraOpen) return;
    $cameraClosing = true;
    closeTimer = setTimeout(() => {
      $cameraOpen = false;
      $cameraClosing = false;
      releaseCamera();
      cameraButton?.focus();
      closeTimer = null;
    }, 200);
  }
  // React to the shared open flag so the WebMCP session tools drive the same
  // overlay: acquire the stream when it opens, release it when it closes.
  $: if ($cameraOpen && !$cameraClosing && !cameraStream) acquireCamera();
  $: if (!$cameraOpen && cameraStream) releaseCamera();

  function captureCamera() {
    if (cameraFeed) {
      const vw = cameraFeed.videoWidth, vh = cameraFeed.videoHeight;
      if (vw && vh) {
        const side = Math.min(vw, vh);
        const { cols, rows } = boardDims();
        const tmp = document.createElement('canvas'); tmp.width = cols; tmp.height = rows;
        const t = tmp.getContext('2d', { willReadFrequently: true })!;
        t.imageSmoothingEnabled = false;
        t.drawImage(cameraFeed, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, cols, rows);
        applyPixelized(t, cols, rows);
      }
    }
    closeCamera();
  }
  function handleCameraKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.stopPropagation(); closeCamera(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const focusables = [captureButton, cancelButton].filter(Boolean) as HTMLElement[];
      if (focusables.length === 0) return;
      const idx = focusables.indexOf(document.activeElement as HTMLElement);
      focusables[(idx + (e.shiftKey ? focusables.length - 1 : 1)) % focusables.length].focus();
    }
  }

  // --- Share ---
  function isMobileDevice() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }
  async function shareBoard() {
    try {
      const blob = await brandedPngBlob($boardCells, $cellSize); if (!blob) return;
      const file = new File([blob], 'grid_paint.png', { type: 'image/png' });
      if (isMobileDevice() && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Grid Paint Studio', text: 'Made with Grid Paint Studio', files: [file] });
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
  class="gp-toolbar fixed bg-gray-900 text-white p-4 rounded-lg shadow-xl flex flex-col gap-3 z-50 w-[20rem] max-w-[92vw]"
  class:dragging={dragging}
  style="left: {toolbarPos.x}px; top: {toolbarPos.y}px;"
  role="toolbar"
  aria-label="Grid paint tools"
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex items-center justify-between gp-drag-handle cursor-move select-none rounded px-1 py-1 -mx-1 hover:bg-white/5"
    on:mousedown={startToolbarDrag}
    on:touchstart={startToolbarDrag}
    aria-hidden="true"
  >
    <span class="text-xs font-bold tracking-widest text-gray-300">/GRID PAINT TOOLS</span>
    <span class="text-gray-500 text-xs" aria-hidden="true">⋮</span>
  </div>

  <div class="flex flex-col gap-1 gp-ctrl transition-opacity duration-300" class:opacity-50={$cellLock}>
    <label class="text-sm font-medium flex items-center justify-between gap-2">
      <span>Cell size</span>
      <input type="range" min="16" max="64" value={$cellSize} on:input={handleCellSizeInput} disabled={$cellLock} class="ml-2 w-28 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="Cell size" />
    </label>
    {#if $cellLock}<p class="text-[11px] text-gray-400">Resolution locked · Clear to resize</p>{/if}
  </div>

  <div class="flex gap-2 gp-modes flex-wrap">
    <button class="gp-btn px-3 py-1 rounded text-sm font-medium transition-colors {$toolMode === 'qr' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $toolMode = 'qr'} aria-pressed={$toolMode === 'qr'} aria-label="QR Brush" title="QR Brush (Q)">QR Brush</button>
    <button class="gp-btn px-3 py-1 rounded text-sm font-medium transition-colors {$toolMode === 'color' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $toolMode = 'color'} aria-pressed={$toolMode === 'color'} aria-label="Color Brush" title="Color Brush (B)">Color Brush</button>
    <button class="gp-btn px-3 py-1 rounded text-sm font-medium transition-colors {$toolMode === 'fill' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $toolMode = 'fill'} aria-pressed={$toolMode === 'fill'} aria-label="Flood Fill" title="Flood Fill (F)">Flood Fill</button>
    <button class="gp-btn px-3 py-1 rounded text-sm font-medium transition-colors {$toolMode === 'erase' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $toolMode = 'erase'} aria-pressed={$toolMode === 'erase'} aria-label="Eraser" title="Eraser (E)">Eraser</button>
    <button class="gp-btn px-3 py-1 rounded text-sm font-medium transition-colors {$showGrid ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $showGrid = !$showGrid} aria-pressed={$showGrid} aria-label={$showGrid ? 'Grid On' : 'Grid Off'} title="{$showGrid ? 'Grid On' : 'Grid Off'} (G)">{$showGrid ? 'Grid On' : 'Grid Off'}</button>
  </div>

  <div class="flex gap-2">
    <label class="text-sm font-medium flex items-center justify-between flex-1 gap-1">
      <span>Mirror</span>
      <select bind:value={$mirrorMode} class="ml-1 bg-gray-800 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Mirror mode">
        <option value="off">Off</option>
        <option value="horizontal">Horizontal</option>
        <option value="vertical">Vertical</option>
        <option value="both">Both</option>
      </select>
    </label>
    <label class="text-sm font-medium flex items-center justify-between flex-1 gap-1">
      <span>Vision</span>
      <select bind:value={$visionMode} class="ml-1 bg-gray-800 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Vision mode">
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
        class="gp-swatch w-8 h-8 rounded border-2 transition-transform duration-150 hover:scale-110 focus-visible:scale-110 {$activeColor === swatch.color ? 'border-white ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'border-transparent hover:border-gray-400'}"
        style="background-color: {swatch.color}"
        aria-label="Swatch {swatch.name}, key {swatch.key}"
        aria-pressed={$activeColor === swatch.color}
        title="{swatch.name} ({swatch.key})"
        on:click={() => $activeColor = swatch.color}
      ></button>
    {/each}
  </div>

  <div class="flex gap-2 text-sm flex-wrap">
    <button class="gp-btn px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors" on:click={() => fileInput.click()} aria-label="Upload" title="Upload image">Upload</button>
    <button bind:this={cameraButton} class="gp-btn px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors" on:click={openCamera} aria-label="Camera" title="Capture from camera">Camera</button>
    <button class="gp-btn px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:hover:bg-gray-800" on:click={undo} disabled={$undoStack.length === 0} aria-label="Undo" title="Undo (Ctrl+Z / Backspace)">Undo</button>
    <button class="gp-btn px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:hover:bg-gray-800" on:click={redo} disabled={$redoStack.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">Redo</button>
    <button class="gp-btn px-3 py-1 rounded bg-red-800 hover:bg-red-700 transition-colors" on:click={clearBoard} aria-label="Clear" title="Clear">Clear</button>
    <button class="gp-btn px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors" on:click={() => $activeMode = 'export'} aria-label="Export" title="Open Export center">Export</button>
    <button class="gp-btn px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors" on:click={shareBoard} aria-label="Share" title="Share PNG (falls back to download)">Share</button>
  </div>

  <!-- Scrubbable undo timeline (bonus polish) -->
  <div class="flex flex-col gap-1 gp-ctrl">
    <span class="text-xs font-medium flex items-center justify-between gap-2 text-gray-300">
      <span>Undo timeline</span>
      <span class="tabular-nums text-gray-400">{($timelineIndex ?? ($timelineLength - 1)) + 1} / {$timelineLength}</span>
    </span>
    <input
      type="range" min="0" max={Math.max(0, $timelineLength - 1)}
      value={$timelineIndex ?? ($timelineLength - 1)}
      disabled={$timelineLength <= 1}
      on:input={(e) => scrubTimeline(Number((e.currentTarget as HTMLInputElement).value))}
      on:change={() => commitTimeline()}
      class="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded disabled:opacity-40"
      aria-label="Undo timeline — drag to preview earlier board states"
    />
  </div>

  <input type="file" accept="image/*" class="hidden" bind:this={fileInput} on:change={handleUpload} aria-hidden="true" tabindex="-1" />

  <div class="flex gap-2 text-sm mt-1">
    <button class="gp-btn px-3 py-1 rounded font-bold transition-colors {$activeMode === 'paint' ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $activeMode = 'paint'} aria-pressed={$activeMode === 'paint'}>Paint</button>
    <button class="gp-btn px-3 py-1 rounded font-bold transition-colors {$activeMode === 'gallery' ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $activeMode = 'gallery'} aria-pressed={$activeMode === 'gallery'}>Gallery</button>
    <button class="gp-btn px-3 py-1 rounded font-bold transition-colors {$activeMode === 'export' ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $activeMode = 'export'} aria-pressed={$activeMode === 'export'}>Export center</button>
  </div>

  {#if $cameraOpen}
    <div
      class="gp-camera rounded-lg p-3 flex flex-col gap-2 border {$cameraClosing ? 'gp-fade-out' : 'gp-fade-in'} {$cameraError ? 'bg-red-950 border-red-700' : 'bg-black border-gray-700'}"
      role="dialog" aria-modal="true" aria-label="Camera capture" tabindex="-1" on:keydown={handleCameraKeydown}
    >
      {#if $cameraError}
        <p class="text-sm text-red-200" aria-live="assertive">{$cameraError}</p>
      {:else}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video bind:this={cameraFeed} autoplay playsinline muted class="w-full rounded bg-black"></video>
      {/if}
      <div class="flex gap-2 text-sm">
        <button bind:this={captureButton} class="px-3 py-1 rounded font-bold bg-blue-600 hover:bg-blue-500 transition-colors" on:click={captureCamera} disabled={!!$cameraError}>Capture</button>
        <button bind:this={cancelButton} class="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors" on:click={closeCamera}>Cancel</button>
      </div>
    </div>
  {/if}
</div>
