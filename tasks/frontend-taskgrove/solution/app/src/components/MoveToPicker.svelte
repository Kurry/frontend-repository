<script>
  import { store } from '../lib/store.svelte.js';

  const isOpen = $derived(store.moveToSourceId !== null);
  const sourceId = $derived(store.moveToSourceId);
  const targets = $derived(sourceId ? store.getMoveToTargets(sourceId) : []);
  const sourceNode = $derived(sourceId ? findNodeInTree(store.tasks, sourceId) : null);

  function findNodeInTree(nodes, id) {
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findNodeInTree(n.children, id);
      if (found) return found;
    }
    return null;
  }

  function selectTarget(targetId) {
    store.reparent(sourceId, targetId);
  }

  function close() {
    store.moveToSourceId = null;
  }

  function closeOnEscape(e) {
    if (e.key === 'Escape') close();
  }

  function stopKey(e) {
    e.stopPropagation();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onclick={close} onkeydown={closeOnEscape} role="dialog" aria-modal="true" aria-label="Move task dialog" tabindex="-1">
    <div
      class="bg-[var(--color-background)] border border-[var(--color-border)] rounded w-full max-w-sm mx-4 shadow-xl max-h-[70vh] flex flex-col"
      onclick={(e) => e.stopPropagation()}
      onkeydown={stopKey}
      role="document"
    >
      <div class="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 class="text-[12px] font-bold heading">Move "{sourceNode?.title || ''}" to…</h3>
        <button
          class="text-[var(--color-muted)] hover:text-[var(--color-text-primary)] text-[14px]"
          onclick={close}
          aria-label="Close"
        >✕</button>
      </div>
      <div class="overflow-y-auto p-2 flex-1">
        {#each targets as target}
          <button
            class="w-full text-left px-2.5 py-1.5 rounded text-[10px] hover:bg-[var(--color-surface)] transition-colors border border-transparent hover:border-[var(--color-primary)] mb-0.5"
            style="padding-left: calc({target.depth} * 16px + 10px);"
            onclick={() => selectTarget(target.id)}
          >
            {#if target.id === null}
              <span class="font-semibold italic text-[var(--color-secondary)]">{target.title}</span>
            {:else}
              <span>{target.title}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
