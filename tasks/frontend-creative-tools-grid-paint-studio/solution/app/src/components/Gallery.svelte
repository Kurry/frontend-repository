<script lang="ts">
  import {
    savedBoards, tagFilter, visibleBoards, deleteBoard, updateBoard, boardCells,
    cellSize, activeMode, selectedBoards, toggleBoardSelection, clearBoardSelection,
    loadBoardToCanvas, pushToast, addBoard
  } from '../lib/store';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { savedBoardSchema, boardNameSchema } from '../lib/schema';
  import { renderBoardDataUrl } from '../lib/exportPng';
  import type { SavedBoard } from '../lib/types';
  import { fly, fade } from 'svelte/transition';
  import { get } from 'svelte/store';

  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = (ms: number) => (reduced ? 0 : ms);

  const tags = ['pattern', 'portrait', 'abstract', 'logo', 'study', 'signal'] as const;

  let saving = false;
  const { form, errors, data, touched, isValid, isSubmitting, reset } = createForm({
    extend: validator({ schema: savedBoardSchema }),
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      const msgs: Record<string, string[]> = {};
      const name = (values.name ?? '').trim();
      if (name && get(savedBoards).some(b => b.name.trim().toLowerCase() === name.toLowerCase())) {
        msgs.name = ['A board with this name already exists — choose a unique name'];
      }
      return msgs;
    },
    onSubmit: (values) => {
      if (saving) return;
      saving = true;
      const name = values.name.trim();
      addBoard({ name, tag: values.tag, favorite: false, cells: $boardCells.map(row => row.map(c => (c ? { ...c } : null))), cellSize: $cellSize });
      pushToast(`Saved board "${name}"`, 'success');
      reset();
      setTimeout(() => { saving = false; }, 120);
    },
  });

  $: showNameErr = ($touched.name || ($data.name && $data.name.length > 0)) && $errors.name;
  $: showTagErr = $touched.tag && $errors.tag;

  // --- Rename with inline validation (name + uniqueness, max 40) ---
  let renameDraft: Record<string, string> = {};
  let renameError: Record<string, string> = {};
  function beginRename(board: SavedBoard) { if (!(board.id in renameDraft)) renameDraft = { ...renameDraft, [board.id]: board.name }; }
  function commitRename(board: SavedBoard) {
    const raw = renameDraft[board.id] ?? board.name;
    const parsed = boardNameSchema.safeParse(raw);
    const dup = parsed.success && get(savedBoards).some(b => b.id !== board.id && b.name.trim().toLowerCase() === parsed.data.toLowerCase());
    if (!parsed.success) { renameError = { ...renameError, [board.id]: parsed.error.errors[0].message }; return; }
    if (dup) { renameError = { ...renameError, [board.id]: 'A board with this name already exists' }; return; }
    const next = renameError; delete next[board.id]; renameError = next;
    updateBoard(board.id, { name: parsed.data });
  }

  // --- Bulk delete uses a two-step confirmation that names the count (the
  // per-card delete is immediate; only the bulk action needs the confirm). ---
  let bulkConfirm = false;
  function favoriteSelected() {
    get(selectedBoards).forEach(id => updateBoard(id, { favorite: true }));
    pushToast(`Favorited ${get(selectedBoards).size} boards`, 'success');
  }
  function deleteSelected() {
    const ids = [...get(selectedBoards)];
    if (ids.length === 0) return;
    if (!bulkConfirm) { bulkConfirm = true; return; }
    ids.forEach(id => deleteBoard(id));
    pushToast(`Deleted ${ids.length} boards`, 'info');
    clearBoardSelection();
    bulkConfirm = false;
  }

  const thumbCache = new Map<string, string>();
  function thumb(board: SavedBoard): string {
    let url = thumbCache.get(board.id);
    if (!url) { url = renderBoardDataUrl(board.cells, board.cellSize); thumbCache.set(board.id, url); }
    return url;
  }
</script>

<div class="flex flex-col lg:flex-row gap-8">
  <div class="w-full lg:w-72 flex-shrink-0">
    <h3 class="text-xl font-bold mb-4">Save current board</h3>
    <form use:form class="flex flex-col gap-4 bg-gray-800 p-4 rounded-lg">
      <div aria-live="polite" aria-atomic="true" class="min-h-[1rem]">
        {#if showNameErr}<p class="text-red-400 text-sm">{$errors.name[0]}</p>{/if}
        {#if showTagErr}<p class="text-red-400 text-sm">{$errors.tag[0]}</p>{/if}
      </div>
      <label class="flex flex-col gap-1 text-sm">
        <span>Name</span>
        <input type="text" name="name" autocomplete="off" class="p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span>Tag</span>
        <select name="tag" class="p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
          {#each tags as t}<option value={t}>{t[0].toUpperCase() + t.slice(1)}</option>{/each}
        </select>
      </label>
      <button type="submit" disabled={!$isValid || $isSubmitting || saving} class="bg-blue-600 p-2 rounded font-bold disabled:opacity-50 hover:bg-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Save board</button>
    </form>

    <div class="mt-8">
      <h3 class="text-xl font-bold mb-4">Filter by tag</h3>
      <div class="flex flex-wrap gap-2">
        <button class="px-2 py-1 text-sm rounded transition-colors {$tagFilter === null ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $tagFilter = null} aria-pressed={$tagFilter === null}>All</button>
        {#each tags as t}
          <button class="px-2 py-1 text-sm rounded transition-colors {$tagFilter === t ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}" on:click={() => $tagFilter = t} aria-pressed={$tagFilter === t}>{t[0].toUpperCase() + t.slice(1)}</button>
        {/each}
      </div>
    </div>
  </div>

  <div class="flex-1 min-w-0">
    <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
      <h3 class="text-xl font-bold">Saved boards ({$visibleBoards.length})</h3>
      {#if $selectedBoards.size > 0}
        <div class="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg" role="group" aria-label="Bulk actions">
          <span class="text-sm font-medium tabular-nums">{$selectedBoards.size} selected</span>
          <button on:click={favoriteSelected} class="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold hover:bg-yellow-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Favorite selected</button>
          {#if bulkConfirm}
            <button on:click={deleteSelected} class="bg-red-700 px-3 py-1 rounded text-sm font-bold hover:bg-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Delete {$selectedBoards.size} boards</button>
            <button on:click={() => bulkConfirm = false} class="text-sm text-gray-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-1">Cancel</button>
          {:else}
            <button on:click={deleteSelected} class="bg-red-900 px-3 py-1 rounded text-sm hover:bg-red-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Delete selected</button>
          {/if}
          <button on:click={() => { clearBoardSelection(); bulkConfirm = false; }} class="text-sm text-gray-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-1">Clear selection</button>
        </div>
      {/if}
    </div>

    {#if $savedBoards.length === 0}
      <div class="bg-gray-800 rounded-lg p-12 text-center flex flex-col items-center justify-center" role="status" aria-live="polite">
        <h4 class="text-xl font-bold mb-2">Your gallery is empty</h4>
        <p class="text-gray-400 max-w-md">Saved boards appear here. Paint a pattern in Paint mode, then use the “Save board” form to add it to the gallery with a name and tag.</p>
        <button on:click={() => activeMode.set('paint')} class="mt-6 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Start painting</button>
      </div>
    {:else if $visibleBoards.length === 0}
      <div class="bg-gray-800 rounded-lg p-12 text-center flex flex-col items-center justify-center" role="status" aria-live="polite">
        <h4 class="text-xl font-bold mb-2">No boards match this tag</h4>
        <p class="text-gray-400 max-w-md">The current tag filter hides every board. Clear the filter to see all boards, or save a new board carrying this tag from Paint mode.</p>
        <button on:click={() => $tagFilter = null} class="mt-6 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Clear filter</button>
      </div>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each $visibleBoards as board (board.id)}
          <div
            class="gp-card bg-gray-800 rounded-lg overflow-hidden border transition-colors {$selectedBoards.has(board.id) ? 'border-blue-500' : 'border-gray-700 hover:border-gray-500'} relative"
          >
            <div class="absolute top-2 left-2 z-10">
              <input type="checkbox" checked={$selectedBoards.has(board.id)} on:change={() => toggleBoardSelection(board.id)} class="w-5 h-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="Select {board.name}" />
            </div>
            <button class="absolute top-2 right-2 z-10 text-2xl bg-black/60 hover:bg-black/80 transition-colors w-8 h-8 flex items-center justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={() => updateBoard(board.id, { favorite: !board.favorite })} aria-label={board.favorite ? `Unfavorite ${board.name}` : `Favorite ${board.name}`} aria-pressed={board.favorite} title={board.favorite ? "Unfavorite" : "Favorite"}>
              <span aria-hidden="true" class={board.favorite ? "text-yellow-400" : "text-white"}>{board.favorite ? '★' : '☆'}</span>
            </button>
            <button class="w-full aspect-square bg-white block p-0 border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" on:click={() => loadBoardToCanvas(board)} aria-label="Load {board.name} onto canvas">
              <img src={thumb(board)} alt="" aria-hidden="true" class="w-full h-full object-contain" draggable="false" />
            </button>
            <div class="p-3">
              <label class="sr-only" for="rename-{board.id}">Rename {board.name}</label>
              <input
                id="rename-{board.id}"
                type="text"
                value={renameDraft[board.id] ?? board.name}
                on:focus={() => beginRename(board)}
                on:input={(e) => { renameDraft = { ...renameDraft, [board.id]: e.currentTarget.value }; if (renameError[board.id]) { const n = { ...renameError }; delete n[board.id]; renameError = n; } }}
                on:blur={() => commitRename(board)}
                on:keydown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
                class="w-full bg-transparent font-bold mb-1 px-1 -ml-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 {renameError[board.id] ? 'text-red-400' : ''}"
                aria-invalid={!!renameError[board.id]}
              />
              {#if renameError[board.id]}<p class="text-red-400 text-xs mb-1" aria-live="polite">{renameError[board.id]}</p>{/if}
              <div class="text-xs text-gray-300 bg-gray-900 inline-block px-2 py-1 rounded">{board.tag}</div>
              <button class="mt-2 text-sm text-red-400 hover:underline block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-1 -ml-1" on:click={() => { deleteBoard(board.id); pushToast('Deleted board ' + board.name, 'info'); }} aria-label="Delete {board.name}">Delete</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div aria-live="polite" class="sr-only">
      {#each Object.values(renameError) as msg}{msg} {/each}
    </div>
  </div>
</div>
