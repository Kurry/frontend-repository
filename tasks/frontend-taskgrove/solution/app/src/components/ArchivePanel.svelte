<script>
  import { store } from '../lib/store.svelte.js';

  const archived = $derived(store.archive);
</script>

<div class="archive-panel border-l border-[var(--color-border)] bg-[var(--color-surface)] transition-theme w-full lg:w-64 flex-shrink-0">
  <div class="p-2 border-b border-[var(--color-border)]">
    <h2 class="text-[12px] font-bold heading" style="font-family: var(--font-heading);">Archive</h2>
  </div>
  <div class="p-2 overflow-y-auto" style="max-height: calc(100vh - 200px);">
    {#if archived.length === 0}
      <div class="text-[10px] text-[var(--color-muted)] text-center py-6">
        <div style="font-size: 20px; margin-bottom: 4px;">📋</div>
        <div>No archived branches yet.</div>
        <div class="mt-1">Complete a task branch and archive it to see it here.</div>
      </div>
    {:else}
      {#each archived as item (item.id)}
        <div class="archive-item mb-2 p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded transition-all hover:border-[var(--color-primary)]">
          <div class="flex items-center justify-between gap-1">
            <span class="text-[10px] font-semibold truncate flex-1">{item.branch.title}</span>
            <button
              class="btn-secondary !px-2 !py-0.5 !text-[8px] !rounded-lg !flex-shrink-0"
              onclick={() => store.restoreBranch(item.id)}
              aria-label="Restore"
            >Restore</button>
          </div>
          <div class="text-[8px] text-[var(--color-muted)] mt-0.5">
            Archived {new Date(item.archivedAt).toLocaleDateString()}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
