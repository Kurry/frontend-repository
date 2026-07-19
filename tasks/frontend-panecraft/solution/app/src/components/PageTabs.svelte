<script lang="ts">
  import * as store from '../lib/store';
  
  let renamingPageId = $state<string | null>(null);
  let renameValue = $state('');
  let confirmDeletePageId = $state<string | null>(null);

  function startRename(pageId: string, currentName: string) {
    renamingPageId = pageId;
    renameValue = currentName;
  }

  function commitRename() {
    if (renamingPageId && renameValue.trim()) {
      store.renamePage(renamingPageId, renameValue.trim());
    }
    renamingPageId = null;
  }

  function handleAddPage() {
    const name = `Page ${store.getPages().length + 1}`;
    store.addPage(name);
  }

  function handleDeletePage(pageId: string) {
    confirmDeletePageId = pageId;
  }

  function confirmDelete() {
    if (confirmDeletePageId) {
      store.deletePage(confirmDeletePageId);
      confirmDeletePageId = null;
    }
  }
</script>

<div class="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
  {#each store.getPages() as page}
    <div class="relative flex items-center gap-1 flex-shrink-0">
      {#if renamingPageId === page.id}
        <input
          type="text"
          class="px-3 py-1.5 text-sm border border-[var(--color-primary)] rounded-[var(--radius-base)] bg-white min-w-[100px]"
          bind:value={renameValue}
          onblur={commitRename}
          onkeydown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') renamingPageId = null; }}
          autofocus
        />
      {:else}
        <button
          class="px-3 py-1.5 text-sm whitespace-nowrap rounded-[var(--radius-base)] transition-all {store.getActivePageId() === page.id ? 'font-semibold text-[var(--color-text-primary)] border-b-2 border-[var(--color-primary)] bg-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'}"
          onclick={() => store.setActivePageId(page.id)}
        >
          {page.name}
        </button>
        {#if store.getPages().length > 1}
          <button
            class="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-xs p-0.5"
            onclick={() => handleDeletePage(page.id)}
            title="Delete page"
          >
            ×
          </button>
        {/if}
        <button
          class="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-xs p-0.5"
          onclick={() => startRename(page.id, page.name)}
          title="Rename page"
        >
          ✎
        </button>
      {/if}
    </div>
  {/each}
  
  <button
    class="ml-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity whitespace-nowrap"
    onclick={handleAddPage}
  >
    Add Page
  </button>
</div>

{#if confirmDeletePageId}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick={() => confirmDeletePageId = null}>
    <div class="bg-white rounded-[var(--radius-base)] p-6 max-w-sm mx-4" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-base font-semibold text-[var(--color-text-primary)] mb-2">Delete Page?</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">This will remove the page and all its panes. This cannot be undone.</p>
      <div class="flex gap-2 justify-end">
        <button class="px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)]" onclick={() => confirmDeletePageId = null}>Cancel</button>
        <button class="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)]" onclick={confirmDelete}>Delete</button>
      </div>
    </div>
  </div>
{/if}
