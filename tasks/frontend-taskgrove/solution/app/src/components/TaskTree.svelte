<script>
  import { store } from '../lib/store.svelte.js';
  import TaskNode from './TaskNode.svelte';

  const visibleTasks = $derived(store.visibleTasks);
  const searchQuery = $derived(store.searchQuery);
  const tagFilterSet = $derived(store.activeTagFilterSet);
  const hasSearch = $derived(searchQuery && searchQuery.trim().length > 0);
  const hasTagFilter = $derived(tagFilterSet.size > 0);

  // Check if any nodes match current filters
  function anyNodeMatches(nodes) {
    for (const node of nodes) {
      if (hasSearch && !subtreeHasMatch(node, searchQuery)) continue;
      if (hasTagFilter && !subtreeHasTag(node, tagFilterSet)) continue;
      return true;
    }
    return false;
  }

  function subtreeHasMatch(n, q) {
    if (n.title.toLowerCase().includes(q.toLowerCase())) return true;
    return n.children.some(c => subtreeHasMatch(c, q));
  }

  function subtreeHasTag(n, tf) {
    if (n.tags && n.tags.some(t => tf.has(t))) return true;
    return n.children.some(c => subtreeHasTag(c, tf));
  }

  const hasVisibleResults = $derived(anyNodeMatches(visibleTasks));
</script>

<div class="task-tree">
  {#if visibleTasks.length === 0}
    <div class="empty-state">
      <div style="font-size: 32px; margin-bottom: 8px;">🌱</div>
      <div style="font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">No tasks yet</div>
      <div style="font-size: 11px; color: var(--color-muted);">Add your first root task below to get started!</div>
    </div>
  {:else if hasVisibleResults === false}
    <div class="empty-state">
      <div style="font-size: 24px; margin-bottom: 8px;">🔎</div>
      <div style="font-size: 12px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">No results</div>
      <div style="font-size: 10px; color: var(--color-muted);">No tasks match your current search or filter.</div>
    </div>
  {:else}
    {#each visibleTasks as task (task.id)}
      {#if !hasTagFilter || subtreeHasTag(task, tagFilterSet)}
        <TaskNode
          node={task}
          depth={0}
          searchQuery={store.searchQuery}
          tagFilters={store.activeTagFilterSet}
        />
      {/if}
    {/each}
  {/if}
</div>
