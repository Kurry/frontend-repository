<script lang="ts">
  import { store } from '../lib/store.svelte';
  import type { Note } from '../lib/types';

  interface Props {
    notes: Note[];
    title: string;
    showEmpty?: boolean;
    emptyMessage?: string;
  }

  let { notes, title, showEmpty = true, emptyMessage = 'No notes here yet. Create one to get started!' }: Props = $props();

  function formatPreview(html: string): string {
    const stripped = html.replace(/<[^>]*>/g, '').slice(0, 80);
    return stripped || '';
  }

  function formatDate(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return d.toLocaleDateString();
  }

  function getColorBarClass(color: string): string {
    switch(color) {
      case 'red': return 'bg-red-400';
      case 'orange': return 'bg-orange-400';
      case 'yellow': return 'bg-yellow-400';
      case 'green': return 'bg-green-400';
      case 'blue': return 'bg-blue-400';
      case 'purple': return 'bg-purple-400';
      default: return 'bg-slate-200';
    }
  }

  function getFolderBreadcrumb(note: Note): string {
    if (!note.folderId) return 'Unfiled';
    return store.getFolderPath(note.folderId);
  }
</script>

{#if showEmpty && notes.length === 0}
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <svg class="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    <p class="text-slate-400 text-sm">{emptyMessage}</p>
  </div>
{:else if notes.length > 0}
  {#if title}
    <h3 class="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
  {/if}
  <div class="divide-y divide-slate-100">
    {#each notes as note (note.id)}
      <div
        class="flex gap-0 cursor-pointer transition group relative hover:bg-slate-50"
        class:bg-indigo-50={store.selectedNoteId === note.id}
        onclick={() => { store.selectedNoteId = note.id; }}
        role="option"
        aria-selected={store.selectedNoteId === note.id}
        tabindex="0"
        onkeydown={(e) => { if (e.key === 'Enter') { store.selectedNoteId = note.id; } }}
      >
        <!-- Color bar -->
        <div class="w-1 flex-shrink-0 {getColorBarClass(note.color)}"></div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0 px-4 py-3">
          <div class="flex items-start justify-between gap-2">
            <span class="font-medium text-sm text-slate-800 truncate">
              {note.title || 'Untitled'}
            </span>
            <span class="text-xs text-slate-400 flex-shrink-0">
              {formatDate(note.updatedAt)}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1 truncate">
            {formatPreview(note.bodyHtml) || 'No content'}
          </p>
          {#if store.searchQuery}
            <p class="text-xs text-slate-400 mt-0.5">{getFolderBreadcrumb(note)}</p>
          {/if}
          {#if note.pinned}
            <span class="inline-block mt-1 text-xs text-amber-500">📌 Pinned</span>
          {/if}
        </div>

        <!-- Pin indicator -->
        {#if note.pinned}
          <div class="absolute top-2 right-2">
            <svg class="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.868 2.884c-.168-.18-.42-.18-.588 0L7.482 5.764l-.964-.321a1 1 0 00-.632.106L3.7 6.643a1 1 0 00-.533 1.334l1.022 2.358-1.46 5.84a.5.5 0 00.612.612l5.84-1.46 2.358 1.022a1 1 0 001.334-.533l1.094-2.186a1 1 0 00.106-.632l-.321-.964 2.88-2.798c.18-.168.18-.42 0-.588l-1.46-1.46-1.46 1.46-.964-.321-.321-.964-2.798-2.88z"/>
            </svg>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
