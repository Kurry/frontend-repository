<script lang="ts">
  import { versions, boardCells, cellSize, addVersion } from '../lib/store';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { z } from 'zod';
  import { onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { VersionSnapshot } from '../lib/types';

  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = (ms: number) => (reduced ? 0 : ms);

  const snapSchema = z.object({ name: z.string().trim().min(1, "Name is required — enter a version name").max(40, "Name must be 40 characters or less") });

  const { form, errors, data, touched, isValid, isSubmitting, reset } = createForm({
    extend: validator({ schema: snapSchema }),
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      addVersion({ name: values.name.trim(), cells: $boardCells.map(row => row.map(c => (c ? { ...c } : null))), cellSize: $cellSize });
      reset();
    }
  });
  $: showSnapErr = ($touched.name || ($data.name && $data.name.length > 0)) && $errors.name;

  let selectedVersionIds = new Set<string>();
  let includeLive = false;
  let compareMode = false;
  let compareLeft: { label: string; cells: VersionSnapshot['cells']; cellSize: number } | null = null;
  let compareRight: { label: string; cells: VersionSnapshot['cells']; cellSize: number } | null = null;
  let compareMessage = '';

  let dialogElement: HTMLDivElement;
  let exitButton: HTMLButtonElement;
  let prevFocus: HTMLElement | null = null;

  function startCompare() {
    const versionsSel = $versions.filter(v => selectedVersionIds.has(v.id));
    const sides: { label: string; cells: VersionSnapshot['cells']; cellSize: number }[] = [];
    versionsSel.forEach(v => sides.push({ label: v.name, cells: v.cells, cellSize: v.cellSize }));
    if (includeLive) sides.push({ label: 'Live board', cells: $boardCells, cellSize: $cellSize });
    if (sides.length < 2) {
      compareMessage = 'Select two sides to compare — pick two versions, or one version and the live board.';
      return;
    }
    compareMessage = '';
    compareLeft = sides[0];
    compareRight = sides[1];
    prevFocus = document.activeElement as HTMLElement;
    compareMode = true;
  }
  function exitCompare() {
    compareMode = false;
    tick().then(() => (prevFocus ?? null)?.focus?.());
  }
  function handleKeydown(e: KeyboardEvent) {
    if (!compareMode) return;
    if (e.key === 'Escape') { e.stopPropagation(); exitCompare(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      exitButton?.focus();
    }
  }
  onMount(() => { window.addEventListener('keydown', handleKeydown); return () => window.removeEventListener('keydown', handleKeydown); });

  const cellPct = (size: number) => 100 / (1024 / size);
  const pos = (i: number, size: number) => i * cellPct(size);
</script>

<div class="fixed top-4 right-4 z-40 bg-gray-900 text-white p-4 rounded-lg shadow-xl w-72 max-h-[80vh] flex flex-col gap-3 overflow-y-auto" aria-label="Versions" role="region">
  <h2 class="text-lg font-bold">Versions</h2>

  <form use:form class="flex flex-col gap-2">
    <div aria-live="polite" class="min-h-[1rem]">
      {#if showSnapErr}<p class="text-red-400 text-xs">{$errors.name[0]}</p>{/if}
    </div>
    <label class="text-sm flex flex-col gap-1">
      <span class="sr-only">Version name</span>
      <input type="text" name="name" placeholder="Version name" class="w-full bg-gray-800 rounded p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 text-sm" />
    </label>
    <button type="submit" disabled={!$isValid || $isSubmitting} class="w-full bg-blue-600 rounded p-2 text-sm font-bold disabled:opacity-50 hover:bg-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Snap version</button>
  </form>

  <div class="flex flex-col gap-2 mt-1">
    {#each $versions as v}
      <label class="bg-gray-800 p-2 rounded flex items-center gap-2 hover:bg-gray-700 transition-colors cursor-pointer">
        <input type="checkbox" checked={selectedVersionIds.has(v.id)} on:change={() => { const n = new Set(selectedVersionIds); if (n.has(v.id)) n.delete(v.id); else n.add(v.id); selectedVersionIds = n; }} class="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="Select version {v.name} for compare" />
        <div class="flex flex-col min-w-0">
          <span class="font-bold text-sm truncate">{v.name}</span>
          <span class="text-xs text-gray-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
        </div>
      </label>
    {/each}
    <label class="bg-gray-800 p-2 rounded flex items-center gap-2 hover:bg-gray-700 transition-colors cursor-pointer">
      <input type="checkbox" bind:checked={includeLive} class="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="Include live board in compare" />
      <span class="font-bold text-sm">Live board</span>
    </label>
    <button class="w-full bg-gray-700 hover:bg-gray-600 transition-colors rounded p-2 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={startCompare}>Compare</button>
    {#if compareMessage}<p class="text-yellow-300 text-xs" aria-live="polite">{compareMessage}</p>{/if}
  </div>
</div>

{#if compareMode && compareLeft && compareRight}
  <div
    bind:this={dialogElement}
    class="fixed inset-0 bg-black/90 z-[100] flex flex-col p-8"
    role="dialog" aria-modal="true" aria-label="Compare versions" transition:fade={{ duration: dur(180) }}
  >
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-white text-2xl font-bold">Compare: {compareLeft.label} vs {compareRight.label}</h2>
      <button bind:this={exitButton} class="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" on:click={exitCompare}>Exit compare</button>
    </div>
    <div class="flex-1 flex flex-col md:flex-row gap-8">
      <div class="flex-1 flex flex-col items-center">
        <h3 class="text-white text-xl mb-4">{compareLeft.label}</h3>
        <div class="w-full max-w-lg aspect-square bg-white relative">
          {#each compareLeft.cells as row, r}{#each row as cell, c}{#if cell}<div style="position:absolute; top:{pos(r, compareLeft.cellSize)}%; left:{pos(c, compareLeft.cellSize)}%; width:{cellPct(compareLeft.cellSize)}%; height:{cellPct(compareLeft.cellSize)}%; background-color:{cell.color};" aria-hidden="true"></div>{/if}{/each}{/each}
        </div>
      </div>
      <div class="flex-1 flex flex-col items-center">
        <h3 class="text-white text-xl mb-4">{compareRight.label}</h3>
        <div class="w-full max-w-lg aspect-square bg-white relative">
          {#each compareRight.cells as row, r}{#each row as cell, c}{#if cell}<div style="position:absolute; top:{pos(r, compareRight.cellSize)}%; left:{pos(c, compareRight.cellSize)}%; width:{cellPct(compareRight.cellSize)}%; height:{cellPct(compareRight.cellSize)}%; background-color:{cell.color};" aria-hidden="true"></div>{/if}{/each}{/each}
        </div>
      </div>
    </div>
  </div>
{/if}
