<script>
  import { store } from '../lib/store.svelte.js';
  import TagFilter from './TagFilter.svelte';

  let searchValue = $state(store.searchQuery);
  let importInput = $state(null);

  function handleSearchInput() {
    store.setSearchQuery(searchValue);
  }

  function clearSearch() {
    searchValue = '';
    store.setSearchQuery('');
  }

  function openExport() {
    store.groveImportMode = false;
    store.showGrovePanel = true;
  }

  function openImport() {
    store.groveImportMode = true;
    store.showGrovePanel = true;
  }

  function triggerImportFile() {
    importInput?.click();
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const format = file.name.endsWith('.csv') ? 'grove-csv' : 'grove-json';
    const result = store.importGrove(text, format);
    if (result.error) store.announce(result.error);
    event.target.value = '';
  }

  const themeLabel = $derived(() => {
    const map = { light: 'Theme: Light', dark: 'Theme: Dark', forest: 'Theme: Forest' };
    return map[store.theme] || 'Theme: Light';
  });
</script>

<div class="toolbar flex flex-wrap items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] transition-theme">
  <div class="relative flex-1 min-w-[120px]">
    <input
      type="text"
      bind:value={searchValue}
      oninput={handleSearchInput}
      placeholder="Search tasks…"
      aria-label="Smart Search"
      class="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 pl-8 text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-primary)]"
      style="font-size: 10px; min-height: 32px;"
    />
    <svg class="absolute left-2 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="3.5" stroke="var(--color-muted)" stroke-width="1.2"/>
      <path d="M7.5 7.5L10.5 10.5" stroke="var(--color-muted)" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    {#if searchValue}
      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text-primary)] btn-secondary !min-h-0 !px-2 !py-1"
        onclick={clearSearch}
        aria-label="Clear search"
      >✕</button>
    {/if}
  </div>

  <TagFilter />

  <button
    class="btn-secondary"
    onclick={() => store.showTagManager = !store.showTagManager}
    aria-label="Tag manager"
  >Tag manager</button>

  <button class="btn-secondary" onclick={openExport}>Export grove</button>

  <button class="btn-secondary" onclick={openImport}>Import grove</button>

  <button class="btn-secondary" onclick={triggerImportFile}>Import file</button>
  <input bind:this={importInput} class="sr-only" type="file" accept=".json,.csv,application/json,text/csv" onchange={handleImportFile} />

  <button
    class="btn-secondary"
    onclick={() => store.cycleTheme()}
    aria-label="Switch Theme"
  >{themeLabel()}</button>
</div>
