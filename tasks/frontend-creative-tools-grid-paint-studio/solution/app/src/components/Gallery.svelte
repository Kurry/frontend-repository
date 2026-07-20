<script lang="ts">
  import { savedBoards, tagFilter, visibleBoards, deleteBoard, updateBoard, boardCells, cellSize, activeMode, cellLock } from '../lib/store';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { savedBoardSchema } from '../lib/schema';
  import { addBoard, clearAllBoards } from '../lib/store';
  import type { SavedBoard } from '../lib/types';
  import { onMount } from 'svelte';

  let selectedBoards: Set<string> = new Set();

  const { form, errors, isSubmitting, isValid } = createForm({
    extend: validator({ schema: savedBoardSchema }),
    onSubmit: (values) => {
      addBoard({
        name: values.name,
        tag: values.tag,
        favorite: values.favorite,
        cells: $boardCells.map(row => [...row]),
        cellSize: $cellSize
      });
    },
  });

  function toggleSelection(id: string) {
    if (selectedBoards.has(id)) {
      selectedBoards.delete(id);
    } else {
      selectedBoards.add(id);
    }
    selectedBoards = selectedBoards;
  }

  function loadBoard(board: SavedBoard) {
    cellSize.set(board.cellSize);
    boardCells.set(board.cells.map(row => [...row]));
    cellLock.set(true);
    activeMode.set('paint');
  }

  function deleteSelected() {
    selectedBoards.forEach(id => deleteBoard(id));
    selectedBoards = new Set();
  }
</script>

<div class="flex gap-8">
  <div class="w-64 flex-shrink-0">
    <h3 class="text-xl font-bold mb-4">Save Current Board</h3>
    <form use:form class="flex flex-col gap-4 bg-gray-800 p-4 rounded-lg">
      <div aria-live="polite" aria-atomic="true">
        {#if $errors.name}<p class="text-red-500 text-sm mb-1">{$errors.name[0]}</p>{/if}
        {#if $errors.tag}<p class="text-red-500 text-sm mb-1">{$errors.tag[0]}</p>{/if}
      </div>
      <label class="flex flex-col gap-1 text-sm">
        Name
        <input type="text" name="name" class="p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        Tag
        <select name="tag" class="p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="pattern">Pattern</option>
          <option value="portrait">Portrait</option>
          <option value="abstract">Abstract</option>
          <option value="logo">Logo</option>
          <option value="study">Study</option>
          <option value="signal">Signal</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm focus-within:ring-2 focus-within:ring-blue-500 rounded px-1 -mx-1">
        <input type="checkbox" name="favorite" class="focus:outline-none" />
        Favorite
      </label>
      <button type="submit" disabled={!$isValid || $isSubmitting} class="bg-blue-600 p-2 rounded font-bold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white">Save Board</button>
    </form>

    <div class="mt-8">
      <h3 class="text-xl font-bold mb-4">Filters</h3>
      <div class="flex flex-wrap gap-2">
        <button class="px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-white {$tagFilter === null ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $tagFilter = null} aria-pressed={$tagFilter === null}>All</button>
        <button class="px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-white {$tagFilter === 'pattern' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $tagFilter = 'pattern'} aria-pressed={$tagFilter === 'pattern'}>Pattern</button>
        <button class="px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-white {$tagFilter === 'portrait' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $tagFilter = 'portrait'} aria-pressed={$tagFilter === 'portrait'}>Portrait</button>
        <button class="px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-white {$tagFilter === 'abstract' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $tagFilter = 'abstract'} aria-pressed={$tagFilter === 'abstract'}>Abstract</button>
        <button class="px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-white {$tagFilter === 'logo' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $tagFilter = 'logo'} aria-pressed={$tagFilter === 'logo'}>Logo</button>
        <button class="px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-white {$tagFilter === 'study' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $tagFilter = 'study'} aria-pressed={$tagFilter === 'study'}>Study</button>
        <button class="px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-white {$tagFilter === 'signal' ? 'bg-blue-600' : 'bg-gray-800'}" on:click={() => $tagFilter = 'signal'} aria-pressed={$tagFilter === 'signal'}>Signal</button>
      </div>
    </div>
  </div>

  <div class="flex-1">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold">Saved Boards ({$visibleBoards.length})</h3>
      {#if selectedBoards.size > 0}
        <div class="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded-lg">
          <span class="text-sm font-medium">{selectedBoards.size} selected</span>
          <button on:click={deleteSelected} class="bg-red-900 px-3 py-1 rounded text-sm hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white">Delete Selected</button>
        </div>
      {/if}
      <button on:click={clearAllBoards} class="text-sm text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1">Clear All</button>
    </div>

    {#if $visibleBoards.length === 0}
      <div class="bg-gray-800 rounded-lg p-12 text-center flex flex-col items-center justify-center" aria-live="polite">
        <h4 class="text-xl font-bold mb-2">No boards found</h4>
        <p class="text-gray-400">Your gallery is empty. Go back to Paint mode and save a new board to see it here.</p>
        <button on:click={() => activeMode.set('paint')} class="mt-6 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white">Start Painting</button>
      </div>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each $visibleBoards as board (board.id)}
          <div class="bg-gray-800 rounded-lg overflow-hidden border {selectedBoards.has(board.id) ? 'border-blue-500' : 'border-gray-700'} relative focus-within:ring-2 focus-within:ring-blue-500">
            <div class="absolute top-2 left-2 z-10">
              <input type="checkbox" checked={selectedBoards.has(board.id)} on:change={() => toggleSelection(board.id)} class="w-5 h-5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Select {board.name}" />
            </div>
            <button class="absolute top-2 right-2 z-10 text-2xl focus:outline-none focus:ring-2 focus:ring-white rounded bg-black/50 w-8 h-8 flex items-center justify-center" on:click={() => updateBoard(board.id, { favorite: !board.favorite })} aria-label={board.favorite ? "Unfavorite" : "Favorite"} aria-pressed={board.favorite} title={board.favorite ? "Unfavorite" : "Favorite"}>
              <span aria-hidden="true" class={board.favorite ? "text-yellow-400" : "text-white"}>{board.favorite ? '★' : '☆'}</span>
            </button>
            <button class="w-full aspect-square bg-white relative cursor-pointer focus:outline-none block p-0 border-0" on:click={() => loadBoard(board)} aria-label="Load {board.name}">
              <!-- Mini thumbnail preview -->
              {#each board.cells as row, r}
                {#each row as cell, c}
                  {#if cell}
                    <div style="position:absolute; top:{r * (100 / (1024 / board.cellSize))}%; left:{c * (100 / (1024 / board.cellSize))}%; width:{100 / (1024 / board.cellSize)}%; height:{100 / (1024 / board.cellSize)}%; background-color:{cell.color};" aria-hidden="true"></div>
                  {/if}
                {/each}
              {/each}
            </button>
            <div class="p-3">
              <label class="sr-only" for="rename-{board.id}">Rename {board.name}</label>
              <input id="rename-{board.id}" type="text" value={board.name} on:change={(e) => updateBoard(board.id, { name: e.currentTarget.value })} class="w-full bg-transparent font-bold mb-1 focus:outline-none focus:border-b border-gray-500 px-1 -ml-1 rounded" />
              <div class="text-xs text-gray-400 bg-gray-900 inline-block px-2 py-1 rounded" aria-label="Tag: {board.tag}">{board.tag}</div>
              <button class="mt-2 text-sm text-red-500 hover:underline block focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1 -ml-1" on:click={() => deleteBoard(board.id)} aria-label="Delete {board.name}">Delete</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
