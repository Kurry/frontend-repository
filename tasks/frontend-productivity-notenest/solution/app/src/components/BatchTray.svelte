<script lang="ts">
  import { store } from '../lib/store.svelte';
  import type { NoteColor } from '../lib/types';

  let showMove: boolean = $state(false);
  let showColor: boolean = $state(false);

  let count = $derived(store.selectedIds.length);

  const swatches: { color: NoteColor; cls: string; label: string }[] = [
    { color: '', cls: 'bg-slate-200', label: 'None' },
    { color: 'red', cls: 'bg-red-400', label: 'Red' },
    { color: 'orange', cls: 'bg-orange-400', label: 'Orange' },
    { color: 'yellow', cls: 'bg-yellow-400', label: 'Yellow' },
    { color: 'green', cls: 'bg-green-400', label: 'Green' },
    { color: 'blue', cls: 'bg-blue-400', label: 'Blue' },
    { color: 'purple', cls: 'bg-purple-400', label: 'Purple' },
  ];

  function folderOptions(): { id: string | null; path: string }[] {
    return [{ id: null, path: 'Unfiled' }, ...store.getAllFolderPaths().map(p => ({ id: p.id, path: p.path }))];
  }

  function doMove(folderId: string | null) {
    store.batchMove([...store.selectedIds], folderId);
    showMove = false;
  }

  function doColor(color: NoteColor) {
    store.batchColor([...store.selectedIds], color);
    showColor = false;
  }

  function doTrash() {
    const ids = [...store.selectedIds];
    if (!ids.length) return;
    if (confirm(`Move ${ids.length} selected note${ids.length === 1 ? '' : 's'} to Trash?`)) {
      store.batchTrash(ids);
    }
  }
</script>

{#if count > 0}
  <div class="fixed bottom-3 inset-x-3 z-40 flex justify-center pointer-events-none">
    <div class="bg-slate-900 text-white rounded-xl shadow-2xl px-2 py-2 sm:px-3 flex items-center gap-1.5 sm:gap-2 batch-tray-enter pointer-events-auto max-w-full overflow-x-auto" role="region" aria-label="Selection actions">
      <span class="text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">{count} selected</span>

      <div class="relative flex-shrink-0">
        <button class="px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition cursor-pointer whitespace-nowrap" onclick={() => { showMove = !showMove; showColor = false; }}>
          Move
        </button>
        {#if showMove}
          <div class="absolute bottom-full mb-1 right-0 bg-white text-slate-800 rounded-lg shadow-xl min-w-44 max-h-56 overflow-y-auto py-1">
            {#each folderOptions() as opt}
              <button class="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer" onclick={() => doMove(opt.id)}>{opt.path}</button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="relative flex-shrink-0">
        <button class="px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition cursor-pointer whitespace-nowrap" onclick={() => { showColor = !showColor; showMove = false; }}>
          Color
        </button>
        {#if showColor}
          <div class="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-xl p-2 flex gap-1.5">
            {#each swatches as s}
              <button class="w-6 h-6 rounded-full border border-slate-300 {s.cls} cursor-pointer" aria-label={s.label} title={s.label} onclick={() => doColor(s.color)}></button>
            {/each}
          </div>
        {/if}
      </div>

      <button class="px-2 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 transition cursor-pointer whitespace-nowrap flex-shrink-0" onclick={doTrash}>
        Trash
      </button>
      <button class="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-700 transition cursor-pointer flex-shrink-0" onclick={() => store.clearSelection()} aria-label="Clear selection">
        Clear
      </button>
    </div>
  </div>
{/if}
