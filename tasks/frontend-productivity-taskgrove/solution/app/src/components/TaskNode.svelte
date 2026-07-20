<script>
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { store } from '../lib/store.svelte.js';
  import { TaskUpsertSchema } from '../lib/schemas.js';
  import ProgressRing from './ProgressRing.svelte';
  import TaskNode from './TaskNode.svelte';

  let { node, depth = 0, searchQuery = '', tagFilters = null } = $props();

  const isLeafNode = $derived(node.children.length === 0);
  const hasChildren = $derived(node.children.length > 0);
  const progress = $derived(hasChildren ? (() => {
    const total = countLeaves(node);
    const done = countCompletedLeaves(node);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  })() : 0);
  const isComplete = $derived(isLeafNode ? node.completed : progress >= 100);
  const canArchive = $derived(isComplete && hasChildren);
  const matchesSearch = $derived(!searchQuery || node.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const subtreeMatches = $derived(!searchQuery || subtreeHasMatch(node, searchQuery));
  const matchesTagFilter = $derived(!tagFilters || tagFilters.size === 0 || subtreeHasTag(node, tagFilters));
  const isDimmed = $derived(
    (searchQuery && !subtreeMatches) ||
    (tagFilters && tagFilters.size > 0 && !matchesTagFilter)
  );
  const nodeTags = $derived(node.tags.map(id => store.getTagById(id)).filter(Boolean));

  // Title editing
  let editing = $state(false);
  let editTitle = $state('');
  let titleInput = $state(null);

  function startEdit() {
    editing = true;
    editTitle = node.title;
    setTimeout(() => titleInput?.focus(), 10);
  }

  function finishEdit() {
    if (editTitle.trim() && editTitle.trim() !== node.title) {
      store.updateTaskTitle(node.id, editTitle);
    }
    editing = false;
  }

  function cancelEdit() {
    editing = false;
  }

  function handleKey(e) {
    if (e.key === 'Enter') finishEdit();
    if (e.key === 'Escape') cancelEdit();
  }

  // Search highlight
  function highlightedTitle() {
    if (!searchQuery || !matchesSearch) return node.title;
    const idx = node.title.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx < 0) return node.title;
    return {
      before: node.title.slice(0, idx),
      match: node.title.slice(idx, idx + searchQuery.length),
      after: node.title.slice(idx + searchQuery.length)
    };
  }

  const titleParts = $derived(highlightedTitle());

  // Child add form
  let addingChild = $state(false);

  const { form: childForm, errors: childErrors, reset: resetChild, setInitialValues: setChildInitial } = createForm({
    extend: validator({ schema: TaskUpsertSchema }),
    onSubmit: (values) => {
      if (store.addChildTask(node.id, values)) {
        addingChild = false;
        resetChild();
      }
    }
  });

  function openAddChild() {
    setChildInitial({ title: '', status: 'todo', priority: 'medium', dueDate: '' });
    resetChild();
    addingChild = true;
  }

  function cancelAddChild() {
    addingChild = false;
  }

  function handleChildKey(e) {
    if (e.key === 'Escape') cancelAddChild();
  }

  // Export
  function handleExport() {
    const text = store.exportBranch(node.id);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Move To
  function openMoveTo() {
    store.moveToSourceId = node.id;
  }

  // Helpers
  function countLeaves(n) {
    if (n.children.length === 0) return 1;
    return n.children.reduce((s, c) => s + countLeaves(c), 0);
  }

  function countCompletedLeaves(n) {
    if (n.children.length === 0) return n.completed ? 1 : 0;
    return n.children.reduce((s, c) => s + countCompletedLeaves(c), 0);
  }

  function subtreeHasMatch(n, q) {
    if (n.title.toLowerCase().includes(q.toLowerCase())) return true;
    return n.children.some(c => subtreeHasMatch(c, q));
  }

  function subtreeHasTag(n, tf) {
    if (n.tags && n.tags.some(t => tf.has(t))) return true;
    return n.children.some(c => subtreeHasTag(c, tf));
  }

  // Tag picker for this node
  let showTagPicker = $state(false);
</script>

<div class="task-node {isDimmed ? 'search-dimmed' : ''} transition-theme" data-node-id={node.id}>
  <!-- Node Row -->
  <div
    class="node-row flex flex-wrap items-center gap-2 py-2 px-2 mb-2 transition-all duration-150"
    style="--depth: {depth};"
  >
    <!-- Expand/Collapse Chevron -->
    {#if hasChildren}
      <button
        class="chevron-btn flex-shrink-0 w-4 h-4 flex items-center justify-center rounded transition-transform duration-200 hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
        onclick={() => store.toggleCollapse(node.id)}
        aria-label={node.collapsed ? 'Expand' : 'Collapse'}
        style="transform: {node.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    {:else}
      <div class="w-4 flex-shrink-0"></div>
    {/if}

    <!-- Progress Ring (for parent nodes) -->
    {#if hasChildren}
      <ProgressRing progress={progress} size={18} class="flex-shrink-0" />
    {/if}

    <!-- Completion Checkbox (leaf only) -->
    {#if isLeafNode}
      <button
        class="checkbox-btn flex-shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center transition-all duration-150 {isComplete ? 'border-primary bg-primary' : 'border-default'}"
        onclick={() => store.toggleComplete(node.id)}
        aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
        style={isComplete ? 'border-color: var(--color-primary); background-color: var(--color-primary);' : 'border-color: var(--color-border);'}
      >
        {#if isComplete}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3.5 6L6.5 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
      </button>
    {/if}

    <!-- Title -->
    <div class="flex-1 min-w-0">
      {#if editing}
        <input
          bind:this={titleInput}
          bind:value={editTitle}
          onkeydown={handleKey}
          onblur={finishEdit}
          class="w-full bg-[var(--color-background)] border border-[var(--color-primary)] rounded px-1.5 py-0.5 text-[var(--color-text-primary)] outline-none"
          style="font-size: 11px;"
        />
      {:else}
        <span
          class="inline-block cursor-pointer hover:text-[var(--color-primary)] transition-colors truncate max-w-full"
          class:line-through={isComplete}
          class:opacity-60={isDimmed}
          ondblclick={startEdit}
          role="button"
          tabindex="0"
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === 'F2') startEdit(); }}
          style="font-size: 10px;"
        >
          {#if typeof titleParts === 'object' && titleParts !== null && titleParts.match !== undefined}
            {titleParts.before}<span class="search-highlight">{titleParts.match}</span>{titleParts.after}
          {:else}
            {node.title}
          {/if}
        </span>
      {/if}
    </div>

    <!-- Tags -->
    <div class="flex items-center gap-0.5 flex-shrink-0">
      {#each nodeTags as tag}
        <span
          class="tag-chip text-[8px] px-1.5 py-0.5 rounded-full font-semibold"
          style="background-color: {tag.color}; color: #fff; border: 1px solid {tag.color};"
        >{tag.name}</span>
      {/each}
    </div>

    <!-- Actions (visible on hover/focus) -->
    <div class="flex items-center gap-0.5 flex-shrink-0 actions-group opacity-60 hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <!-- Add Child -->
      <button
        class="btn-primary !px-2 !py-1 !text-[8px]"
        onclick={openAddChild}
        aria-label="Add Child"
        title="Add Child"
      >Add Child</button>

      <!-- Move Up/Down -->
      <button
        class="btn-secondary !px-2 !py-1 !text-[8px]"
        onclick={() => store.moveUp(node.id)}
        aria-label="Move Up"
        title="Move Up"
      >Move Up</button>
      <button
        class="btn-secondary !px-2 !py-1 !text-[8px]"
        onclick={() => store.moveDown(node.id)}
        aria-label="Move Down"
        title="Move Down"
      >Move Down</button>

      <!-- Move To -->
      <button
        class="btn-secondary !px-2 !py-1 !text-[8px]"
        onclick={openMoveTo}
        aria-label="Move To…"
        title="Move To…"
      >Move To…</button>

      <!-- Tag Toggle -->
      <button
        class="btn-secondary !px-2 !py-1 !text-[8px]"
        onclick={() => showTagPicker = !showTagPicker}
        aria-label="Manage Tags"
        title="Tags"
      >Tags</button>

      <!-- Zoom In -->
      {#if hasChildren}
        <button
          class="btn-secondary !px-2 !py-1 !text-[8px]"
          onclick={() => store.zoomTo(node.id)}
          aria-label="Zoom In"
          title="Zoom In"
        >Zoom In</button>
      {/if}

      <!-- Export -->
      <button
        class="btn-primary !px-2 !py-1 !text-[8px]"
        onclick={handleExport}
        aria-label="Export as Text"
        title="Export as Text"
      >Export as Text</button>

      <!-- Archive (only for complete branches) -->
      {#if canArchive}
        <button
          class="btn-secondary !px-2 !py-1 !text-[8px]"
          onclick={() => store.archiveBranch(node.id)}
          aria-label="Archive"
          title="Archive"
        >Archive</button>
      {/if}

      <!-- Delete (leaf only) -->
      {#if isLeafNode}
        <button
          class="btn-secondary !px-2 !py-1 !text-[8px]"
          style="border-color: var(--color-danger); color: var(--color-danger);"
          onclick={() => store.deleteTask(node.id)}
          aria-label="Delete"
          title="Delete"
        >Delete</button>
      {/if}
    </div>
  </div>

  <!-- Tag Picker Dropdown -->
  {#if showTagPicker}
    <div class="tag-picker mb-1 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded max-w-xs z-10" style="margin-left: calc({depth} * 20px + 28px);">
      <div class="text-[9px] font-semibold text-[var(--color-muted)] mb-1">Select tags (max 5):</div>
      <div class="flex flex-wrap gap-1">
        {#each store.tags as tag}
          <button
            class="tag-chip text-[8px] px-2 py-0.5 rounded-full font-semibold"
            class:active={node.tags.includes(tag.id)}
            style="background-color: {tag.color}; color: #fff; border: 1px solid {tag.color};"
            onclick={() => store.toggleNodeTag(node.id, tag.id)}
          >{tag.name}</button>
        {/each}
      </div>
      {#if store.tags.length === 0}
        <div class="text-[9px] text-[var(--color-muted)]">No tags yet. Create them in the Tag Manager.</div>
      {/if}
    </div>
  {/if}

  <!-- Add Child Form -->
  {#if addingChild}
    <form use:childForm class="add-child-form mb-1 flex flex-wrap items-center gap-1" style="margin-left: calc(({depth} + 1) * 20px + 20px);" onkeydown={handleChildKey}>
      <input
        name="title"
        placeholder="Child task title…"
        aria-label="Child task title"
        class="flex-1 min-w-[80px] bg-[var(--color-background)] border rounded px-2 py-1 text-[var(--color-text-primary)] outline-none"
        style="font-size: 10px; {$childErrors.title ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
      />
      <select
        name="status"
        class="bg-[var(--color-background)] border rounded px-1 py-1 text-[var(--color-text-primary)] outline-none"
        style="font-size: 10px; {$childErrors.status ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
      >
        <option value="todo">todo</option>
        <option value="in_progress">in_progress</option>
        <option value="done">done</option>
        <option value="blocked">blocked</option>
      </select>
      <select
        name="priority"
        class="bg-[var(--color-background)] border rounded px-1 py-1 text-[var(--color-text-primary)] outline-none"
        style="font-size: 10px; {$childErrors.priority ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
      >
        <option value="low">low</option>
        <option value="medium" selected>medium</option>
        <option value="high">high</option>
        <option value="urgent">urgent</option>
      </select>
      <input
        name="dueDate"
        type="text"
        placeholder="YYYY-MM-DD"
        class="w-20 bg-[var(--color-background)] border rounded px-1 py-1 text-[var(--color-text-primary)] outline-none"
        style="font-size: 10px; {$childErrors.dueDate ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
      />
      <button type="submit" class="btn-primary !px-3 !py-1 !text-[8px] !rounded-lg">Add</button>
      <button type="button" class="btn-secondary !px-3 !py-1 !text-[8px] !rounded-lg" onclick={cancelAddChild}>Cancel</button>
      {#if $childErrors.title}<div class="w-full text-[var(--color-danger)] text-[9px] shake" style="margin-left: 0;">{$childErrors.title[0]}</div>{/if}
      {#if $childErrors.status}<div class="w-full text-[var(--color-danger)] text-[9px] shake" style="margin-left: 0;">{$childErrors.status[0]}</div>{/if}
      {#if $childErrors.priority}<div class="w-full text-[var(--color-danger)] text-[9px] shake" style="margin-left: 0;">{$childErrors.priority[0]}</div>{/if}
      {#if $childErrors.dueDate}<div class="w-full text-[var(--color-danger)] text-[9px] shake" style="margin-left: 0;">{$childErrors.dueDate[0]}</div>{/if}
    </form>
  {/if}

  <!-- Children -->
  {#if hasChildren && !node.collapsed}
    {#each node.children as child (child.id)}
      {#if !tagFilters || tagFilters.size === 0 || subtreeHasTag(child, tagFilters)}
        <TaskNode node={child} depth={depth + 1} {searchQuery} {tagFilters} />
      {/if}
    {/each}
  {/if}
</div>

<style>
  .node-row:hover {
    background-color: var(--color-surface);
  }
  .node-row:hover .actions-group {
    opacity: 1;
  }
  .chevron-btn:hover {
    background-color: var(--color-border);
    border-radius: 4px;
  }
</style>
