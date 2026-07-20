<script lang="ts">
  import { onMount } from 'svelte';
  import { savedBoards, activeMode, boardCells, cellSize, cellLock } from '../lib/store';

  let isOpen = false;
  let search = '';
  let inputElement: HTMLInputElement;
  let dialogElement: HTMLDivElement;
  let prevFocus: HTMLElement | null = null;

  $: filteredBoards = $savedBoards.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      isOpen = !isOpen;
      if (isOpen) {
        prevFocus = document.activeElement as HTMLElement;
        setTimeout(() => inputElement?.focus(), 50);
      } else {
        if (prevFocus) prevFocus.focus();
      }
    }

    if (e.key === 'Escape' && isOpen) {
        isOpen = false;
        if (prevFocus) prevFocus.focus();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function loadBoard(board: import('../lib/types').SavedBoard) {
      cellSize.set(board.cellSize);
      boardCells.set(board.cells.map(row => [...row]));
      cellLock.set(true);
      activeMode.set('paint');
      isOpen = false;
      search = '';
      if (prevFocus) prevFocus.focus();
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div bind:this={dialogElement} tabindex="-1" class="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[20vh]" role="dialog" aria-modal="true" aria-label="Command Palette" on:click={() => { isOpen = false; if (prevFocus) prevFocus.focus(); }}>
      <div role="presentation" class="bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700" on:click|stopPropagation>
          <div class="p-4 border-b border-gray-800">
              <input bind:this={inputElement} bind:value={search} type="text" placeholder="Search boards..." class="w-full bg-transparent text-white text-lg focus:outline-none placeholder-gray-500" aria-label="Search boards" />
          </div>
          <div class="max-h-96 overflow-y-auto p-2">
              {#if filteredBoards.length === 0}
                  <p class="text-gray-500 text-center py-8">No boards found.</p>
              {:else}
                  {#each filteredBoards as board}
                      <button class="w-full text-left px-4 py-3 text-white hover:bg-gray-800 focus:bg-gray-800 focus:outline-none rounded flex items-center justify-between" on:click={() => loadBoard(board)}>
                          <span class="font-bold">{board.name}</span>
                          <span class="text-xs text-gray-500 bg-gray-950 px-2 py-1 rounded">{board.tag}</span>
                      </button>
                  {/each}
              {/if}
          </div>
      </div>
  </div>
{/if}
