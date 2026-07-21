<script lang="ts">
  import * as store from '../lib/store';
  import Modal from './Modal.svelte';

  let renamingPageId = $state<string | null>(null);
  let renameValue = $state('');
  let renameError = $state('');
  let confirmDeletePageId = $state<string | null>(null);

  const pages = $derived(store.getPages());
  const confirmPage = $derived(pages.find((page) => page.id === confirmDeletePageId) ?? null);

  function startRename(pageId: string, currentName: string) {
    renamingPageId = pageId;
    renameValue = currentName;
    renameError = '';
  }

  function commitRename() {
    if (!renamingPageId) return;
    const result = store.renamePage(renamingPageId, renameValue);
    if (result.ok) {
      renamingPageId = null;
      renameError = '';
    } else {
      renameError = result.message;
      store.announce(result.message);
    }
  }

  function cancelRename() {
    renamingPageId = null;
    renameError = '';
  }

  function handleAddPage() {
    const result = store.addPage(`Page ${pages.length + 1}`);
    if (result.ok) store.announce('Page created.');
  }

  function confirmDelete() {
    if (!confirmDeletePageId) return;
    const result = store.deletePage(confirmDeletePageId);
    if (!result.ok) store.announce(result.message);
    confirmDeletePageId = null;
  }
</script>

<nav class="flex items-center gap-1 overflow-x-auto flex-1 min-w-0" aria-label="Pages">
  {#each pages as page}
    <div class="relative flex items-center gap-0.5 flex-shrink-0">
      {#if renamingPageId === page.id}
        <div>
          <label for="page-rename-input" class="sr-only">Rename page</label>
          <input
            id="page-rename-input"
            type="text"
            class="px-3 py-1.5 text-sm border rounded-[var(--radius-base)] bg-white min-w-[120px] {renameError ? 'input-invalid' : 'border-[var(--color-primary)]'}"
            bind:value={renameValue}
            onblur={commitRename}
            onkeydown={(event) => {
              if (event.key === 'Enter') commitRename();
              if (event.key === 'Escape') cancelRename();
            }}
            autofocus
          />
          <div aria-live="polite">
            {#if renameError}
              <p class="field-error" role="alert">{renameError}</p>
            {/if}
          </div>
        </div>
      {:else}
        <button
          type="button"
          class="tap-target px-3 py-1.5 text-sm whitespace-nowrap rounded-t-[var(--radius-base)] transition-colors {store.getActivePageId() === page.id
            ? 'font-semibold text-[var(--color-text-primary)] border-b-2 border-[var(--color-primary)] bg-white'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'}"
          aria-current={store.getActivePageId() === page.id ? 'page' : undefined}
          onclick={() => store.setActivePageId(page.id)}
        >
          {page.name}
        </button>
        {#if pages.length > 1}
          <button
            type="button"
            class="tap-target-x text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm px-1.5 py-1 rounded transition-colors"
            onclick={() => (confirmDeletePageId = page.id)}
            aria-label="Delete page {page.name}"
          >×</button>
        {/if}
        <button
          type="button"
          class="tap-target-x text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-xs px-1.5 py-1 rounded transition-colors"
          onclick={() => startRename(page.id, page.name)}
          aria-label="Rename page {page.name}"
        >✎</button>
      {/if}
    </div>
  {/each}

  <button
    type="button"
    class="tap-target ml-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
    onclick={handleAddPage}
  >
    Add Page
  </button>
</nav>

<Modal
  open={confirmDeletePageId !== null}
  heading="Delete Page?"
  labelledBy="delete-page-heading"
  widthClass="max-w-sm"
  onClose={() => (confirmDeletePageId = null)}
>
  <div class="p-6">
    <p class="text-sm text-[var(--color-text-secondary)] mb-4">
      This will remove “{confirmPage?.name ?? 'this page'}” and all of its panes. This cannot be undone.
    </p>
    <div class="flex gap-2 justify-end">
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        onclick={() => (confirmDeletePageId = null)}
      >Cancel</button>
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
        onclick={confirmDelete}
      >Confirm Delete</button>
    </div>
  </div>
</Modal>
