<script lang="ts">
  import { store } from '../lib/store.svelte';

  let query: string = $state('');
  let activeIndex: number = $state(0);
  let dialogRef: HTMLElement | null = $state(null);
  let lastFocused: HTMLElement | null = null;

  interface Result { label: string; hint: string; run: () => void; }

  function actions(): Result[] {
    return [
      { label: 'New Note', hint: 'action', run: () => { store.createNote(store.selectedFolderId === 'trash' ? null : store.selectedFolderId); } },
      { label: 'New Folder', hint: 'action', run: () => { store.createFolder(null); } },
      { label: 'Empty Trash', hint: 'action', run: () => { store.selectedFolderId = 'trash'; if (confirm('Empty trash? All notes will be permanently deleted.')) store.emptyTrash(); } },
      { label: 'Export Nest', hint: 'action', run: () => { store.exportOpen = true; } },
      { label: 'Import Nest', hint: 'action', run: () => { store.importOpen = true; } },
      { label: 'All Notes', hint: 'view', run: () => { store.selectedFolderId = null; store.selectedNoteId = null; store.searchQuery = ''; } },
      { label: 'Trash', hint: 'view', run: () => { store.selectedFolderId = 'trash'; store.selectedNoteId = null; store.searchQuery = ''; } },
    ];
  }

  let results = $derived.by<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const items: Result[] = [...actions()];
    for (const f of store.folders) {
      items.push({ label: f.name, hint: 'folder', run: () => { store.selectedFolderId = f.id; store.selectedNoteId = null; store.searchQuery = ''; } });
    }
    for (const n of store.activeNotes) {
      items.push({ label: n.title || 'Untitled', hint: 'note', run: () => { store.selectedFolderId = null; store.selectedNoteId = n.id; store.searchQuery = ''; } });
    }
    if (!q) return items.slice(0, 12);
    return items.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 20);
  });

  function choose(r: Result) {
    r.run();
    store.paletteOpen = false;
    lastFocused?.focus();
  }

  function close() {
    store.paletteOpen = false;
    lastFocused?.focus();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, results.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[activeIndex]) choose(results[activeIndex]); }
    else if (e.key === 'Tab' && dialogRef) {
      const focusables = dialogRef.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  $effect(() => {
    if (store.paletteOpen) {
      lastFocused = document.activeElement as HTMLElement;
      query = '';
      activeIndex = 0;
      queueMicrotask(() => dialogRef?.querySelector<HTMLInputElement>('input')?.focus());
    }
  });
</script>

{#if store.paletteOpen}
  <div class="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
    <button class="absolute inset-0 bg-black/40 cursor-default" aria-label="Close command palette" onclick={close} tabindex="-1"></button>
    <div
      bind:this={dialogRef}
      class="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden drawer-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onkeydown={onKeydown}
    >
      <input
        bind:value={query}
        oninput={() => activeIndex = 0}
        class="w-full px-4 py-3 text-sm outline-none border-b border-slate-200"
        placeholder="Search folders, notes, and actions…"
        aria-label="Command palette search"
      />
      <ul class="max-h-72 overflow-y-auto py-1" role="listbox" aria-label="Results">
        {#each results as r, i (r.label + r.hint + i)}
          <li>
            <button
              class="w-full flex items-center justify-between gap-2 px-4 py-2 text-left text-sm transition cursor-pointer {i === activeIndex ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}"
              role="option"
              aria-selected={i === activeIndex}
              onmousemove={() => activeIndex = i}
              onclick={() => choose(r)}
            >
              <span class="truncate">{r.label}</span>
              <span class="text-xs text-slate-400 flex-shrink-0">{r.hint}</span>
            </button>
          </li>
        {/each}
        {#if results.length === 0}
          <li class="px-4 py-3 text-sm text-slate-400">No matching commands</li>
        {/if}
      </ul>
    </div>
  </div>
{/if}
