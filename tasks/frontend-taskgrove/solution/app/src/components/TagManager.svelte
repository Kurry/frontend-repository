<script>
  import { store } from '../lib/store.svelte.js';

  const isOpen = $derived(store.showTagManager);
  const tags = $derived(store.tags);

  let newName = $state('');
  let newColor = $state('#3B82F6');
  let error = $state('');

  const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'
  ];

  function addTag() {
    if (!newName.trim()) {
      error = 'Tag name required';
      return;
    }
    if (store.addTag(newName, newColor)) {
      newName = '';
      error = '';
      // Pick next color
      newColor = COLORS[tags.length % COLORS.length];
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') addTag();
  }
</script>

{#if isOpen}
  <div class="tag-manager-panel border-b border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-theme">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-[12px] font-bold heading">Tag manager</h3>
      <button
        class="text-[var(--color-muted)] hover:text-[var(--color-text-primary)] text-[14px]"
        onclick={() => store.showTagManager = false}
        aria-label="Close Tag Manager"
      >✕</button>
    </div>

    <!-- Create Tag -->
    <div class="flex items-center gap-1.5 mb-2 flex-wrap">
      <input
        type="text"
        bind:value={newName}
        onkeydown={handleKey}
        placeholder="New tag name…"
        class="bg-[var(--color-background)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] outline-none flex-1 min-w-[80px] focus:border-[var(--color-primary)]"
        style="font-size: 10px;"
      />
      <div class="flex items-center gap-0.5">
        {#each COLORS as color}
          <button
            class="w-4 h-4 rounded-full border-2 transition-all"
            style="background-color: {color}; border-color: {color === newColor ? 'var(--color-primary)' : 'transparent'};"
            onclick={() => newColor = color}
            aria-label="Select color {color}"
          ></button>
        {/each}
      </div>
      <button class="btn-primary !px-3 !py-1 !text-[9px]" onclick={addTag}>Create tag</button>
    </div>
    {#if error}
      <div class="text-[var(--color-danger)] text-[9px] mb-1 shake">{error}</div>
    {/if}

    <!-- Existing Tags -->
    <div class="flex flex-wrap gap-1.5">
      {#if tags.length === 0}
        <span class="text-[9px] text-[var(--color-muted)]">No tags yet. Create your first tag above.</span>
      {/if}
      {#each tags as tag}
        <div class="flex items-center gap-1">
          <span
            class="tag-chip text-[8px] px-1.5 py-0.5 rounded-full font-semibold"
            style="background-color: {tag.color}; color: #fff; border: 1px solid {tag.color};"
          >{tag.name}</span>
          <button
            class="text-[10px] opacity-60 hover:opacity-100"
            style="color: var(--color-danger);"
            onclick={() => store.deleteTag(tag.id)}
            aria-label="Delete tag {tag.name}"
          >✕</button>
        </div>
      {/each}
    </div>
  </div>
{/if}
