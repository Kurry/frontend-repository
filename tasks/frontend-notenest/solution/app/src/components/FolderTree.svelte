<script lang="ts">
  import { store } from '../lib/store.svelte';
  import FolderTree from './FolderTree.svelte';

  interface Props {
    parentId: string | null;
    depth?: number;
  }

  let { parentId = null, depth = 0 }: Props = $props();

  let editingFolderId: string | null = $state(null);
  let editName: string = $state('');

  let children = $derived(store.getFolderChildren(parentId));

  function startRename(folderId: string, currentName: string) {
    editingFolderId = folderId;
    editName = currentName;
  }

  function finishRename(folderId: string) {
    if (editName.trim()) {
      store.renameFolder(folderId, editName);
    }
    editingFolderId = null;
  }
</script>

<ul class="list-none">
  {#each children as folder (folder.id)}
    <li class="select-none group/item">
      <!-- Folder row -->
      <button
        class="w-full flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition text-sm text-left
          hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        class:bg-indigo-50={store.selectedFolderId === folder.id}
        class:text-indigo-700={store.selectedFolderId === folder.id}
        class:text-slate-700={store.selectedFolderId !== folder.id}
        onclick={() => { store.selectedFolderId = folder.id; store.selectedNoteId = null; store.searchQuery = ''; }}
        style="padding-left: {depth * 16 + 8}px"
        role="treeitem"
        aria-selected={store.selectedFolderId === folder.id}
        aria-expanded={!folder.collapsed}
      >
        <!-- Expand/Collapse -->
        <span
          class="w-4 h-4 flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
          onclick={(e) => { e.stopPropagation(); store.toggleFolderCollapse(folder.id); }}
          aria-label={folder.collapsed ? 'Expand folder' : 'Collapse folder'}
          style="visibility: {store.getFolderChildren(folder.id).length > 0 ? 'visible' : 'hidden'}"
        >
          <svg class="w-3 h-3 transition-transform {folder.collapsed ? '' : 'rotate-90'}" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </span>

        <!-- Folder icon -->
        <svg class="w-4 h-4 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
        </svg>

        <!-- Name or input -->
        {#if editingFolderId === folder.id}
          <input
            type="text"
            bind:value={editName}
            class="flex-1 min-w-0 px-1 py-0.5 text-sm border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onblur={() => finishRename(folder.id)}
            onkeydown={(e) => { if (e.key === 'Enter') finishRename(folder.id); if (e.key === 'Escape') editingFolderId = null; e.stopPropagation(); }}
            onclick={(e) => e.stopPropagation()}
            autofocus
          />
        {:else}
          <span class="flex-1 min-w-0 truncate">{folder.name}</span>
          <!-- Count badge -->
          <span class="flex-shrink-0 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full ml-1">
            {store.getNoteCountInFolder(folder.id)}
          </span>
          <!-- Actions (shown on group hover) -->
          <span class="hidden group-hover/item:flex items-center gap-0.5 ml-1">
            <button
              class="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition flex-shrink-0"
              onclick={(e) => { e.stopPropagation(); startRename(folder.id, folder.name); }}
              title="Rename"
              aria-label="Rename folder"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              class="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition flex-shrink-0"
              onclick={(e) => { e.stopPropagation(); if (confirm('Delete this folder? Notes will be moved to the root level.')) store.deleteFolder(folder.id); }}
              title="Delete folder"
              aria-label="Delete folder"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </span>
        {/if}
      </button>

      <!-- Children -->
      {#if !folder.collapsed}
        <div>
          <FolderTree parentId={folder.id} depth={depth + 1} />
        </div>
      {/if}
    </li>
  {/each}
</ul>
