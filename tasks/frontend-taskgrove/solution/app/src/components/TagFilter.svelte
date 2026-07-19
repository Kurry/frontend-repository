<script>
  import { store } from '../lib/store.svelte.js';

  const tags = $derived(store.tags);
  const activeFilters = $derived(store.activeTagFilters);
</script>

{#if tags.length > 0}
  <div class="flex items-center gap-1 flex-wrap">
    <span class="text-[8px] text-[var(--color-muted)] mr-0.5">Filter:</span>
    {#each tags as tag}
      <button
        class="tag-chip text-[8px] px-2 py-0.5 rounded-full font-semibold transition-all"
        class:active={activeFilters.includes(tag.id)}
        style="background-color: {tag.color}; color: #fff; border: 1px solid {tag.color};"
        onclick={() => store.toggleTagFilter(tag.id)}
        aria-label="Filter by tag {tag.name}"
      >{tag.name}</button>
    {/each}
    {#if activeFilters.length > 0}
      <button
        class="text-[8px] text-[var(--color-muted)] hover:text-[var(--color-text-primary)] ml-1"
        onclick={() => store.activeTagFilters = []}
      >Clear all</button>
    {/if}
  </div>
{/if}
