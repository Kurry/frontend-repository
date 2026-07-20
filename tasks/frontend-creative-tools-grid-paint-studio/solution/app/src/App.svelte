<script lang="ts">
  import { onMount } from 'svelte';
  import { activeMode } from './lib/store';
  import { registerWebMCP } from './lib/webmcp';
  import Toolbar from './components/Toolbar.svelte';
  import Canvas from './components/Canvas.svelte';
  import Gallery from './components/Gallery.svelte';
  import Export from './components/Export.svelte';
  import Histogram from './components/Histogram.svelte';
  import CommandPalette from './components/CommandPalette.svelte';
  import Versions from './components/Versions.svelte';

  onMount(() => {
    registerWebMCP();
  });
</script>

<main class="w-full min-h-screen relative overflow-hidden font-sans">
  <div class="absolute top-4 right-4 text-white z-50 text-right pointer-events-none mix-blend-difference">
    <h1 class="text-xl font-mono font-bold">&lt;GRID PAINT STUDIO&gt;</h1>
    <p class="text-sm opacity-80 typewriter font-mono">&lt;You are the algorithm&gt;</p>
  </div>

  <Toolbar />
  <CommandPalette />

  {#if $activeMode === 'paint'}
    <Canvas />
    <Histogram />
    <Versions />
  {:else if $activeMode === 'gallery'}
    <div class="w-full h-full min-h-screen bg-gray-900 text-white p-20 pt-24 overflow-auto">
      <h2 class="text-3xl font-bold mb-8">Gallery</h2>
      <Gallery />
    </div>
  {:else if $activeMode === 'export'}
    <div class="w-full h-full min-h-screen bg-gray-900 text-white p-20 pt-24 overflow-auto">
      <h2 class="text-3xl font-bold mb-8">Export Center</h2>
      <Export />
    </div>
  {/if}
</main>
