<script>
  import { store } from '../lib/store.svelte.js';

  const path = $derived(store.breadcrumbPath);
  const isZoomed = $derived(store.zoomedNodeId !== null);
</script>

{#if isZoomed && path.length > 0}
  <div class="breadcrumb sticky top-0 z-20 flex items-center gap-1 px-2 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto">
    <span class="text-[9px] text-[var(--color-muted)] mr-1">Zoomed to:</span>
    {#each path as segment, i}
      {#if i > 0}
        <span class="text-[var(--color-muted)] text-[9px]">/</span>
      {/if}
      <button
        class="text-[9px] font-semibold px-1.5 py-0.5 rounded hover:bg-[var(--color-border)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
        style={i === path.length - 1 ? 'color: var(--color-primary);' : 'color: var(--color-text-primary);'}
        onclick={() => store.zoomTo(i === path.length - 1 ? null : segment.id)}
        aria-label="Zoom to {segment.title}"
      >
        {segment.title}
      </button>
    {/each}
    <button
      class="ml-auto text-[9px] text-[var(--color-muted)] hover:text-[var(--color-text-primary)] px-1.5 py-0.5 rounded hover:bg-[var(--color-border)] transition-colors flex-shrink-0"
      onclick={() => store.zoomTo(null)}
      aria-label="Zoom out to all tasks"
    >✕ Unzoom</button>
  </div>
{/if}
