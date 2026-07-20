<script lang="ts">
  import { versions, boardCells, cellSize, activeMode } from '../lib/store';
  import { addVersion } from '../lib/store';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { z } from 'zod';
  import { onMount } from 'svelte';

  const snapSchema = z.object({
      name: z.string().min(1, "Name is required").max(40, "Max 40 characters")
  });

  const { form, errors, isValid, isSubmitting, reset } = createForm({
      extend: validator({ schema: snapSchema }),
      onSubmit: (values) => {
          addVersion({
              name: values.name,
              cells: $boardCells.map(row => [...row]),
              cellSize: $cellSize
          });
          reset();
      }
  });

  let compareMode = false;
  let compareVersion: import('../lib/types').VersionSnapshot | null = null;

  function openCompare(v: import('../lib/types').VersionSnapshot) {
      compareVersion = v;
      compareMode = true;
  }

  let dialogElement: HTMLDivElement;
  let prevFocus: HTMLElement | null = null;

  $: if (compareMode) {
      prevFocus = document.activeElement as HTMLElement;
      setTimeout(() => {
          dialogElement?.querySelector('button')?.focus();
      }, 50);
  } else {
      if (prevFocus) prevFocus.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
      if (!compareMode) return;
      if (e.key === 'Escape') {
          compareMode = false;
      }
      if (e.key === 'Tab') {
          // Trap focus simply: just one button anyway
          e.preventDefault();
          dialogElement?.querySelector('button')?.focus();
      }
  }

  onMount(() => {
      window.addEventListener('keydown', handleKeydown);
      return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="fixed top-4 right-4 z-40 bg-gray-900 text-white p-4 rounded-lg shadow-lg w-72 max-h-[80vh] flex flex-col gap-4 overflow-y-auto">
  <h3 class="text-lg font-bold">Versions</h3>

  <form use:form class="flex flex-col gap-2">
      <div aria-live="polite">
          {#if $errors.name}<p class="text-red-500 text-xs">{$errors.name[0]}</p>{/if}
      </div>
      <label class="text-sm">
          <span class="sr-only">Version Name</span>
          <input type="text" name="name" placeholder="Version name..." class="w-full bg-gray-800 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      </label>
      <button type="submit" disabled={!$isValid || $isSubmitting} class="w-full bg-blue-600 rounded p-2 text-sm font-bold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white">Snap Version</button>
  </form>

  <div class="flex flex-col gap-2 mt-2">
      {#each $versions as v}
          <div class="bg-gray-800 p-2 rounded flex justify-between items-center focus-within:ring-2 focus-within:ring-blue-500">
              <div class="flex flex-col">
                  <span class="font-bold text-sm">{v.name}</span>
                  <span class="text-xs text-gray-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
              </div>
              <button class="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 focus:outline-none" on:click={() => openCompare(v)} aria-label="Compare {v.name}">Compare</button>
          </div>
      {/each}
  </div>
</div>

{#if compareMode && compareVersion}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div bind:this={dialogElement} tabindex="-1" class="fixed inset-0 bg-black/90 z-[100] flex flex-col p-8" role="dialog" aria-modal="true" aria-label="Compare Versions" on:click={() => compareMode = false}>
      <div class="flex justify-between items-center mb-8">
          <h2 class="text-white text-2xl font-bold" id="compare-title">Compare: {compareVersion.name} vs Current</h2>
          <button class="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" on:click={() => compareMode = false} aria-label="Exit Compare">Exit Compare</button>
      </div>

      <div class="flex-1 flex gap-8">
          <div class="flex-1 flex flex-col items-center">
              <h3 class="text-white text-xl mb-4">{compareVersion.name}</h3>
              <div class="w-full max-w-lg aspect-square bg-white relative">
                  {#each compareVersion.cells as row, r}
                      {#each row as cell, c}
                          {#if cell}
                              <div style="position:absolute; top:{r * (100 / (1024 / compareVersion.cellSize))}%; left:{c * (100 / (1024 / compareVersion.cellSize))}%; width:{100 / (1024 / compareVersion.cellSize)}%; height:{100 / (1024 / compareVersion.cellSize)}%; background-color:{cell};" aria-hidden="true"></div>
                          {/if}
                      {/each}
                  {/each}
              </div>
          </div>

          <div class="flex-1 flex flex-col items-center">
              <h3 class="text-white text-xl mb-4">Current</h3>
              <div class="w-full max-w-lg aspect-square bg-white relative">
                  {#each $boardCells as row, r}
                      {#each row as cell, c}
                          {#if cell}
                              <div style="position:absolute; top:{r * (100 / (1024 / $cellSize))}%; left:{c * (100 / (1024 / $cellSize))}%; width:{100 / (1024 / $cellSize)}%; height:{100 / (1024 / $cellSize)}%; background-color:{cell};" aria-hidden="true"></div>
                          {/if}
                      {/each}
                  {/each}
              </div>
          </div>
      </div>
  </div>
{/if}
