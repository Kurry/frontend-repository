<script lang="ts">
  import { toolMode, activeColor, showGrid, cellSize, cellLock, mirrorMode, activeMode, undo, redo, clearBoard, undoStack, redoStack, visionMode } from '../lib/store';
  import { onMount } from 'svelte';

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
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="fixed top-4 left-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg flex flex-col gap-4 z-50 gp-toolbar gp-drag-box" role="toolbar" aria-label="Main Toolbar">
  <div class="flex items-center justify-between gp-drag-handle cursor-move">
    <span class="text-xs font-bold tracking-widest text-gray-400 drag-box-label">/GRID PAINT TOOLS</span>
  </div>

  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium flex items-center justify-between gp-ctrl">
      Cell Size
      <input type="range" min="16" max="64" bind:value={$cellSize} disabled={$cellLock} class="ml-2 w-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Cell Size" />
    </label>
  </div>

  <div class="flex gap-2 gp-modes flex-wrap">
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'qr' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'qr'} aria-pressed={$toolMode === 'qr'} aria-label="QR Brush" title="QR Brush (Q)">QR Brush</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'color' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'color'} aria-pressed={$toolMode === 'color'} aria-label="Color Brush" title="Color Brush (B)">Color Brush</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'fill' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'fill'} aria-pressed={$toolMode === 'fill'} aria-label="Flood Fill" title="Flood Fill (F)">Flood Fill</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$toolMode === 'erase' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $toolMode = 'erase'} aria-pressed={$toolMode === 'erase'} aria-label="Eraser" title="Eraser (E)">Eraser</button>
    <button class="px-3 py-1 rounded text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$showGrid ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $showGrid = !$showGrid} aria-pressed={$showGrid} aria-label="Toggle Grid" title="Grid On (G)">Grid On</button>
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

  <div class="flex gap-2 text-sm">
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800 disabled:opacity-50" on:click={undo} disabled={$undoStack.length === 0} aria-label="Undo" title="Undo (Ctrl+Z / Backspace)">Undo</button>
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-gray-800 disabled:opacity-50" on:click={redo} disabled={$redoStack.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">Redo</button>
    <button class="px-3 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white bg-red-900" on:click={clearBoard} aria-label="Clear" title="Clear">Clear</button>
  </div>

  <div class="flex gap-2 text-sm mt-4">
    <button class="px-3 py-1 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$activeMode === 'paint' ? 'bg-white text-black' : 'bg-gray-800'}" on:click={() => $activeMode = 'paint'} aria-pressed={$activeMode === 'paint'}>Paint</button>
    <button class="px-3 py-1 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$activeMode === 'gallery' ? 'bg-white text-black' : 'bg-gray-800'}" on:click={() => $activeMode = 'gallery'} aria-pressed={$activeMode === 'gallery'}>Gallery</button>
    <button class="px-3 py-1 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white {$activeMode === 'export' ? 'bg-white text-black' : 'bg-gray-800'}" on:click={() => $activeMode = 'export'} aria-pressed={$activeMode === 'export'}>Export</button>
  </div>
</div>
