<script>
  import { store } from '../lib/store.svelte.js';
  import TagFilter from './TagFilter.svelte';

  let searchValue = $state(store.searchQuery);

  function handleSearchInput() {
    store.setSearchQuery(searchValue);
  }

  function clearSearch() {
    searchValue = '';
    store.setSearchQuery('');
  }

  const themeLabel = $derived(() => {
    const map = { light: 'Theme: Light', dark: 'Theme: Dark', forest: 'Theme: Forest' };
    return map[store.theme] || 'Theme: Light';
  });
</script>

<div class="toolbar flex flex-wrap items-center gap-2 p-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] transition-theme">
  <!-- Search Input -->
  <div class="relative flex-1 min-w-[120px]">
    <input
      type="text"
      bind:value={searchValue}
      oninput={handleSearchInput}
      placeholder="Search tasks…"
      aria-label="Smart Search"
      class="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-2.5 py-1.5 pl-6 text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-primary)]"
      style="font-size: 10px;"
    />
    <svg class="absolute left-1.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="5" cy="5" r="3.5" stroke="var(--color-muted)" stroke-width="1.2"/>
      <path d="M7.5 7.5L10.5 10.5" stroke="var(--color-muted)" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    {#if searchValue}
      <button
        class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text-primary)]"
        onclick={clearSearch}
        aria-label="Clear search"
      >✕</button>
    {/if}
  </div>

  <!-- Tag Filter Row -->
  <TagFilter />

  <!-- Tag Manager Toggle -->
  <button
    class="btn-secondary !px-2.5 !py-1.5 !text-[9px] !rounded-lg flex items-center gap-1"
    onclick={() => store.showTagManager = !store.showTagManager}
    aria-label="Tag Manager"
  >Tags</button>

  <button
    class="btn-secondary !px-2.5 !py-1.5 !text-[9px] !rounded-lg flex items-center gap-1"
    onclick={() => store.showGrovePanel = true}
  >Export grove</button>

  <!-- Theme Switcher -->
  <button
    class="btn-secondary !px-2.5 !py-1.5 !text-[9px] !rounded-lg flex items-center gap-1"
    onclick={() => store.cycleTheme()}
    aria-label="Switch Theme"
  >{themeLabel()}</button>
</div>
