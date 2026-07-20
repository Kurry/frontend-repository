<script lang="ts">
  import './app.css';
  import { untrack } from 'svelte';
  import { store } from './lib/store.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import SearchBar from './components/SearchBar.svelte';
  import NoteList from './components/NoteList.svelte';
  import NoteEditor from './components/NoteEditor.svelte';
  import Toast from './components/Toast.svelte';
  import VirtualizedList from './components/VirtualizedList.svelte';
  import ExportDrawer from './components/ExportDrawer.svelte';
  import ImportDialog from './components/ImportDialog.svelte';
  import CommandPalette from './components/CommandPalette.svelte';
  import BatchTray from './components/BatchTray.svelte';

  let showVirtualized: boolean = $state(false);
  let virtualizedItems: { id: string; text: string }[] = $state([]);
  let isMobile: boolean = $state(false);

  // Current view state
  let isTrash = $derived(store.selectedFolderId === 'trash');
  let isSearching = $derived(store.searchQuery.trim().length > 0);

  // Pinned notes in current context
  let pinnedInCurrentView = $derived.by(() => {
    if (isSearching) {
      return store.filteredNotes.filter(n => n.pinned);
    }
    if (isTrash) return [];
    if (store.selectedFolderId === null) {
      return store.pinnedNotes;
    }
    return store.activeNotes.filter(n => n.folderId === store.selectedFolderId && n.pinned);
  });

  // Non-pinned notes in current context
  let unpinnedInCurrentView = $derived.by(() => {
    if (isSearching) {
      return store.filteredNotes.filter(n => !n.pinned);
    }
    if (isTrash) return [];
    if (store.selectedFolderId === null) {
      return store.activeNotes.filter(n => !n.pinned);
    }
    return store.activeNotes.filter(n => n.folderId === store.selectedFolderId && !n.pinned);
  });

  // Sort notes - most recently edited first
  let sortedPinned = $derived.by(() => 
    [...pinnedInCurrentView].sort((a, b) => b.updatedAt - a.updatedAt)
  );
  let sortedUnpinned = $derived.by(() => 
    [...unpinnedInCurrentView].sort((a, b) => b.updatedAt - a.updatedAt)
  );
  let sortedTrash = $derived.by(() => 
    [...store.trashNotes].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
  );
  let sortedSearch = $derived.by(() => 
    [...store.filteredNotes].sort((a, b) => b.updatedAt - a.updatedAt)
  );

  // Persistence hook — saveData is a no-op (in-memory contract), but keep
  // the subscription out of the render path to avoid state_unsafe_mutation.
  $effect(() => {
    store.folders;
    store.notes;
    untrack(() => queueMicrotask(() => store.persist()));
  });

  // View title
  let viewTitle = $derived.by(() => {
    if (isSearching) return 'Search Results';
    if (isTrash) return 'Trash';
    if (store.selectedFolderId === null) return 'All Notes';
    const folder = store.folders.find(f => f.id === store.selectedFolderId);
    return folder ? folder.name : 'Notes';
  });

  function handleNewNote() {
    if (isTrash) return;
    const folderId = isSearching ? null : store.selectedFolderId;
    store.createNote(folderId === 'trash' ? null : folderId);
  }

  function loadVirtualized() {
    virtualizedItems = store.generateVirtualizedItems(10000);
    showVirtualized = true;
  }

  // Mobile detection
  $effect(() => {
    const checkMobile = () => {
      isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile) store.sidebarOpen = false;
    };
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  });

  function toggleSidebar() {
    store.sidebarOpen = !store.sidebarOpen;
  }

  // Global keyboard shortcuts: command palette + session undo/redo.
  function onGlobalKeydown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && key === 'k') {
      e.preventDefault();
      store.paletteOpen = !store.paletteOpen;
      return;
    }
    // Session undo/redo only when the note body editor is not capturing them.
    const target = e.target as HTMLElement | null;
    const inBodyEditor = !!target?.closest?.('[contenteditable="true"]');
    if (!inBodyEditor && (e.metaKey || e.ctrlKey) && key === 'z') {
      const isRedo = e.shiftKey;
      // Only hijack the shortcut when there is session history to apply;
      // otherwise let the browser's native undo run in the focused field
      // (title input, search bar, Import Nest textarea, command palette, ...).
      if (isRedo ? store.canRedo : store.canUndo) {
        e.preventDefault();
        if (isRedo) store.redo();
        else store.undo();
      }
    }
  }

  $effect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', onGlobalKeydown);
    return () => window.removeEventListener('keydown', onGlobalKeydown);
  });
</script>

<div class="h-screen w-screen flex flex-col bg-white overflow-hidden">
  <!-- Toast notifications -->
  <Toast />

  <!-- Overlays -->
  <ExportDrawer />
  <ImportDialog />
  <CommandPalette />
  <BatchTray />

  <!-- Main layout -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Mobile sidebar overlay -->
    {#if isMobile && store.sidebarOpen}
      <div
        class="fixed inset-0 bg-black/40 z-30 md:hidden"
        onclick={toggleSidebar}
      ></div>
    {/if}

    <!-- Sidebar -->
    <div
      class="flex-shrink-0 transition-all duration-300 z-40 h-full overflow-hidden
        {isMobile ? 'fixed left-0 top-0' : 'relative'}"
      style="width: {store.sidebarOpen ? '256px' : '0px'};
        {isMobile ? (store.sidebarOpen ? 'transform: translateX(0)' : 'transform: translateX(-100%)') : ''}
      "
    >
      <div class="w-64 h-full">
        <Sidebar />
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Top bar -->
      <header class="flex items-center gap-3 px-3 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
        <!-- Mobile sidebar toggle -->
        <button
          class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition md:hidden flex-shrink-0 cursor-pointer"
          onclick={toggleSidebar}
          aria-label="Toggle folders"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Search -->
        <div class="flex-1 max-w-sm">
          <SearchBar />
        </div>

        <!-- Session Undo / Redo -->
        <button
          class="px-2 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onclick={() => store.undo()}
          disabled={!store.canUndo}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4"/></svg>
        </button>
        <button
          class="px-2 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onclick={() => store.redo()}
          disabled={!store.canRedo}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v1M21 10l-4-4M21 10l-4 4"/></svg>
        </button>

        <!-- Command Palette -->
        <button
          class="px-2 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition flex-shrink-0 cursor-pointer"
          onclick={() => store.paletteOpen = true}
          aria-label="Command Palette"
          title="Command Palette (Ctrl+K)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/></svg>
        </button>

        <!-- Export / Import Nest -->
        <button
          class="flex items-center gap-1 px-2 py-2 sm:px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition flex-shrink-0 cursor-pointer"
          onclick={() => store.exportOpen = true}
          title="Export Nest"
          aria-label="Export Nest"
        >
          <span class="hidden sm:inline">Export Nest</span>
          <span class="sm:hidden">Export</span>
        </button>
        <button
          class="flex items-center gap-1 px-2 py-2 sm:px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition flex-shrink-0 cursor-pointer"
          onclick={() => store.importOpen = true}
          title="Import Nest"
          aria-label="Import Nest"
        >
          <span class="hidden sm:inline">Import Nest</span>
          <span class="sm:hidden">Import</span>
        </button>

        <!-- New Note button -->
        <button
          class="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onclick={handleNewNote}
          disabled={isTrash}
          title="New Note"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="hidden sm:inline">New Note</span>
        </button>

        <!-- Load 10,000 items button -->
        <button
          class="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition flex-shrink-0 cursor-pointer"
          onclick={loadVirtualized}
          title="Load 10,000 Items"
        >
          <span class="hidden sm:inline">Load 10k</span>
          <span class="sm:hidden">10k</span>
        </button>
      </header>

      <!-- Content area: two-pane (list + editor) on desktop, single-pane on mobile -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Virtualized list (takes full view) -->
        {#if showVirtualized}
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-3 flex-shrink-0">
              <button
                class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                onclick={() => showVirtualized = false}
              >
                ← Back
              </button>
              <span class="font-medium text-slate-800">Virtualized Items</span>
            </div>
            <VirtualizedList items={virtualizedItems} />
          </div>
        {:else}
          <!-- Normal view -->
          <!-- Note list panel (hidden on mobile when a note is selected) -->
          <div
            class="border-r border-slate-200 bg-white flex flex-col overflow-hidden flex-shrink-0
              md:w-80
              {store.selectedNoteId ? 'hidden md:flex' : 'w-full md:w-80'}"
            class:hidden={showVirtualized}
          >
            <!-- View header -->
            <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h1 class="text-base font-semibold text-slate-800 truncate">{viewTitle}</h1>
            </div>

            <!-- Empty trash controls -->
            {#if isTrash && store.trashNotes.length > 0}
              <div class="px-4 py-2 border-b border-slate-100 flex-shrink-0">
                <button
                  class="w-full px-3 py-1.5 text-xs text-red-500 border border-red-200 hover:bg-red-50 rounded transition cursor-pointer"
                  onclick={() => { if (confirm('Empty trash? All notes will be permanently deleted.')) store.emptyTrash(); }}
                >
                  Empty Trash
                </button>
              </div>
            {/if}

            <!-- Note list -->
            <main class="flex-1 overflow-y-auto">
              {#if isTrash}
                <!-- Trash view -->
                {#if store.trashNotes.length === 0}
                  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <svg class="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <p class="text-slate-400 text-sm">Trash is empty</p>
                    <p class="text-slate-300 text-xs mt-1">Deleted notes will appear here</p>
                  </div>
                {:else}
                  {#each sortedTrash as note (note.id)}
                    <div
                      class="flex gap-0 cursor-pointer transition hover:bg-slate-50 px-4 py-3"
                      class:bg-indigo-50={store.selectedNoteId === note.id}
                      onclick={() => { store.selectedNoteId = note.id; }}
                    >
                      <div class="flex-1 min-w-0">
                        <span class="font-medium text-sm text-slate-600 truncate block">
                          {note.title || 'Untitled'}
                        </span>
                        {#if note.deletedAt}
                          <span class="text-xs text-slate-400">Deleted {new Date(note.deletedAt).toLocaleDateString()}</span>
                        {/if}
                      </div>
                      <div class="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          class="text-xs text-green-500 hover:text-green-700 px-1.5 py-0.5 rounded hover:bg-green-50 transition cursor-pointer"
                          onclick={(e) => { e.stopPropagation(); store.restoreNote(note.id); }}
                        >
                          Restore
                        </button>
                        <button
                          class="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition cursor-pointer"
                          onclick={(e) => { e.stopPropagation(); if (confirm('Delete this note forever?')) store.deleteForever(note.id); }}
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  {/each}
                {/if}
              {:else if isSearching}
                <!-- Search results -->
                {#if sortedSearch.length === 0}
                  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <svg class="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <p class="text-slate-400 text-sm">No results found</p>
                    <p class="text-slate-300 text-xs mt-1">Try a different search term</p>
                  </div>
                {:else}
                  <NoteList notes={sortedSearch} title="" showEmpty={false} />
                {/if}
              {:else}
                <!-- Normal view: Pinned + Unpinned -->
                {#if sortedPinned.length === 0 && sortedUnpinned.length === 0}
                  {#if store.selectedFolderId === null}
                    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <svg class="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                      <h2 class="text-slate-400 text-sm font-medium">No notes yet</h2>
                      <p class="text-slate-300 text-xs mt-1">Click "New Note" to create your first note</p>
                    </div>
                  {:else}
                    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <svg class="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                      </svg>
                      <h2 class="text-slate-400 text-sm font-medium">This folder is empty</h2>
                      <p class="text-slate-300 text-xs mt-1">Create a note in this folder to get started</p>
                    </div>
                  {/if}
                {:else}
                  {#if sortedPinned.length > 0}
                    <NoteList notes={sortedPinned} title="📌 Pinned" showEmpty={false} />
                    <div class="border-t border-slate-100 mx-4"></div>
                  {/if}
                  <NoteList
                    notes={sortedUnpinned}
                    title={sortedPinned.length > 0 ? 'Notes' : ''}
                    showEmpty={false}
                    emptyMessage="Create a note to get started!"
                  />
                {/if}
              {/if}
            </main>
          </div>

          <!-- Note editor panel (hidden on mobile when no note selected) -->
          <div
            class="flex-1 overflow-hidden bg-white flex flex-col min-w-0
              {store.selectedNoteId ? 'flex' : 'hidden md:flex'}"
          >
            <NoteEditor />
          </div>

          <!-- Mobile back button overlay -->
          {#if isMobile && store.selectedNoteId}
            <button
              class="fixed bottom-6 left-6 z-50 p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition md:hidden"
              onclick={() => { store.selectedNoteId = null; }}
              aria-label="Back to list"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>
