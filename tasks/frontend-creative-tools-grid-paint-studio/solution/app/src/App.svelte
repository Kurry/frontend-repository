<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { activeMode, toasts } from './lib/store';
  import { registerWebMCP } from './lib/webmcp';
  import Toolbar from './components/Toolbar.svelte';
  import Canvas from './components/Canvas.svelte';
  import Gallery from './components/Gallery.svelte';
  import Export from './components/Export.svelte';
  import Histogram from './components/Histogram.svelte';
  import CommandPalette from './components/CommandPalette.svelte';
  import Versions from './components/Versions.svelte';

  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = (ms: number) => (reduced ? 0 : ms);

  onMount(() => { registerWebMCP(); });
</script>

<main class="gp-app h-screen flex flex-col bg-blue-600 text-white relative overflow-hidden font-sans">
  <header class="flex flex-wrap items-start justify-between gap-4 px-6 pt-5 pb-2 z-30 shrink-0">
    <h1 class="text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none drop-shadow">&lt;GRID PAINT STUDIO&gt;</h1>
    <div class="text-right max-w-sm">
      <p class="font-mono font-bold typewriter">&lt;YOU ARE THE ALGORITHM&gt;</p>
      <p class="text-xs sm:text-sm opacity-90 mt-1">Browser-based open canvas. Everything you touch becomes a structured grid. Capture. Draw. Download. Share.</p>
    </div>
  </header>

  <div class="gp-stage-wrap relative flex-1 min-h-0 flex">
    {#if $activeMode === 'paint'}
      <Canvas />
      <Histogram />
      <div class="gp-versions"><Versions /></div>
    {:else if $activeMode === 'gallery'}
      <section class="w-full h-full bg-gray-900 text-white p-6 pt-4 overflow-auto">
        <h2 class="text-3xl font-bold mb-6">Gallery</h2>
        <Gallery />
      </section>
    {:else}
      <section class="w-full h-full bg-gray-900 text-white p-6 pt-4 overflow-auto">
        <h2 class="text-3xl font-bold mb-6">Export center</h2>
        <Export />
      </section>
    {/if}
  </div>

  <Toolbar />
  <CommandPalette />

  <div class="fixed bottom-4 right-4 z-[120] flex flex-col gap-2 w-72 max-w-[90vw] pointer-events-none" aria-live="polite" aria-atomic="false">
    {#each $toasts as toast (toast.id)}
      <div
        in:fly={{ x: 24, duration: dur(220) }}
        out:fade={{ duration: dur(260) }}
        class="pointer-events-auto rounded-lg px-4 py-2 text-sm font-medium shadow-lg border {toast.kind === 'error' ? 'bg-red-700 border-red-500 text-white' : toast.kind === 'info' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-green-700 border-green-500 text-white'}"
        role="status"
      >
        {toast.message}
      </div>
    {/each}
  </div>
</main>
