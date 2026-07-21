<script>
  import { store } from '../lib/store.svelte.js';
  import { createDialog } from '@melt-ui/svelte';

  const {
    elements: { portalled, overlay, content, title, description, close },
    states: { open },
  } = createDialog({
    forceVisible: true,
  });

  // Sync internal state with store
  $effect(() => {
    open.set(store.moveToSourceId !== null);
  });

  $effect(() => {
    if (!$open && store.moveToSourceId !== null) {
      store.moveToSourceId = null;
    }
  });

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
    open.set(false);
  }
</script>

{#if $open}
  <div {...$portalled}>
    <div {...$overlay} class="fixed inset-0 z-50 bg-black/30 transition-opacity"></div>
    <div
      {...$content}
      class="fixed left-[50%] top-[50%] z-50 max-h-[70vh] w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded bg-[var(--color-background)] border border-[var(--color-border)] shadow-xl flex flex-col"
    >
      <div class="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 {...$title} class="heading m-0" style="font-size: 48px; line-height: 1.1;">Move "{sourceNode?.title || ''}" to…</h3>
        <button
          {...$close}
          class="text-[var(--color-muted)] hover:text-[var(--color-text-primary)] text-[14px]"
          aria-label="Close"
        >✕</button>
      </div>
      <div {...$description} class="sr-only">Select a new parent for this task</div>
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
