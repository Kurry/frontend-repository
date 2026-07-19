<script lang="ts">
  import { store } from '../lib/store.svelte';
  import FolderTree from './FolderTree.svelte';

  function handleNewFolder() {
    store.createFolder(null);
  }
</script>

<aside class="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden flex-shrink-0">
  <!-- Header -->
  <div class="p-3 border-b border-slate-200">
    <h1 class="text-lg font-bold text-slate-800 flex items-center gap-2">
      <svg class="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
      </svg>
      NoteNest
    </h1>
  </div>

  <!-- New Folder button -->
  <div class="p-3">
    <button
      class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
      onclick={handleNewFolder}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      New Folder
    </button>
  </div>

  <!-- Navigation -->
  <div class="flex-1 overflow-y-auto px-2 pb-4" role="tree">
    <!-- All Notes -->
    <div
      class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition text-sm
        hover:bg-slate-100"
      class:bg-indigo-50={store.selectedFolderId === null}
      class:text-indigo-700={store.selectedFolderId === null}
      class:text-slate-700={store.selectedFolderId !== null}
      onclick={() => { store.selectedFolderId = null; store.selectedNoteId = null; store.searchQuery = ''; }}
      role="treeitem"
      aria-selected={store.selectedFolderId === null}
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter') { store.selectedFolderId = null; store.selectedNoteId = null; store.searchQuery = ''; } }}
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
      <span class="flex-1 min-w-0">All Notes</span>
      <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
        {store.activeNotes.length}
      </span>
    </div>

    <!-- Trash -->
    <div
      class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition text-sm mt-1
        hover:bg-slate-100"
      class:bg-indigo-50={store.selectedFolderId === 'trash'}
      class:text-indigo-700={store.selectedFolderId === 'trash'}
      class:text-slate-700={store.selectedFolderId !== 'trash'}
      onclick={() => { store.selectedFolderId = 'trash'; store.selectedNoteId = null; store.searchQuery = ''; }}
      role="treeitem"
      aria-selected={store.selectedFolderId === 'trash'}
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter') { store.selectedFolderId = 'trash'; store.selectedNoteId = null; store.searchQuery = ''; } }}
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
      <span class="flex-1 min-w-0">Trash</span>
      {#if store.trashNotes.length > 0}
        <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
          {store.trashNotes.length}
        </span>
      {/if}
    </div>

    <!-- Separator -->
    <div class="my-2 border-t border-slate-200"></div>

    <!-- Folder Tree -->
    <FolderTree parentId={null} depth={0} />
  </div>
</aside>
