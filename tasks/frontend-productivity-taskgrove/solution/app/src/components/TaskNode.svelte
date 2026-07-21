<script>
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import autoAnimate from '@formkit/auto-animate';
  import { store } from '../lib/store.svelte.js';
  import { TaskUpsertSchema } from '../lib/schemas.js';
  import ProgressRing from './ProgressRing.svelte';
  import TaskNode from './TaskNode.svelte';

  let { node, depth = 0, searchQuery = '', tagFilters = null } = $props();

  let childrenEl = $state(null);
  let shakeChildTitle = $state(false);

  $effect(() => {
    if (childrenEl) autoAnimate(childrenEl);
  });

  const isLeafNode = $derived(node.children.length === 0);
  const hasChildren = $derived(node.children.length > 0);
  const progress = $derived(hasChildren ? (() => {
    const total = countLeaves(node);
    const done = countCompletedLeaves(node);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  })() : 0);
  const isComplete = $derived(isLeafNode ? node.completed : progress >= 100);
  const canArchive = $derived(hasChildren && progress >= 100);
  const matchesSearch = $derived(!searchQuery || node.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const subtreeMatches = $derived(!searchQuery || subtreeHasMatch(node, searchQuery));
  const matchesTagFilter = $derived(!tagFilters || tagFilters.size === 0 || subtreeHasTag(node, tagFilters));
  const isDimmed = $derived(
    (searchQuery && !subtreeMatches) ||
    (tagFilters && tagFilters.size > 0 && !matchesTagFilter)
  );
  const nodeTags = $derived(node.tags.map(id => store.getTagById(id)).filter(Boolean));

  let addingChild = $state(false);
  let showTagPicker = $state(false);

  const { form: childForm, errors: childErrors, reset: resetChild, setInitialValues: setChildInitial } = createForm({
    extend: validator({ schema: TaskUpsertSchema }),
    initialValues: { title: '', status: 'todo', priority: 'medium', dueDate: '' },
    onSubmit: (values) => {
      if (store.addChildTask(node.id, values)) {
        addingChild = false;
        resetChild();
        shakeChildTitle = false;
      }
    },
    onError: (errs) => {
      shakeChildTitle = true;
      setTimeout(() => { shakeChildTitle = false; }, 300);
      const first = errs.title?.[0] || errs.status?.[0] || errs.priority?.[0] || errs.dueDate?.[0];
      if (first) store.announce(first);
    },
  });

  function openAddChild() {
    setChildInitial({ title: '', status: 'todo', priority: 'medium', dueDate: '' });
    resetChild();
    addingChild = true;
  }

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

  function handleExport() {
    const text = store.exportBranch(node.id);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    store.addToast('Branch exported as text');
  }

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
</script>

<div class="task-node {isDimmed ? 'search-dimmed' : ''} transition-theme" data-node-id={node.id}>
  <div class="node-row flex flex-wrap items-center gap-2 mb-2" style="--depth: {depth};">
    {#if hasChildren}
      <button
        class="chevron-btn flex-shrink-0 w-8 h-8 flex items-center justify-center rounded transition-transform duration-200 hover:bg-[var(--color-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
        onclick={() => store.toggleCollapse(node.id)}
        aria-label={node.collapsed ? 'Expand' : 'Collapse'}
        aria-expanded={!node.collapsed}
        style="transform: {node.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    {:else}
      <div class="w-8 flex-shrink-0"></div>
    {/if}

    {#if hasChildren}
      <ProgressRing progress={progress} size={20} class="flex-shrink-0" />
    {/if}

    {#if isLeafNode}
      <button
        class="checkbox-btn flex-shrink-0 w-8 h-8 rounded-sm border flex items-center justify-center transition-all duration-150"
        onclick={() => store.toggleComplete(node.id)}
        aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
        style={isComplete ? 'border-color: var(--color-primary); background-color: var(--color-primary);' : 'border-color: var(--color-border); background-color: var(--color-background);'}
      >
        {#if isComplete}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1.5 4L3.5 6L6.5 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
      </button>
    {/if}

    <div class="flex-1 min-w-0 flex flex-wrap items-center gap-2">
      <span
        class="truncate max-w-full"
        class:line-through={isComplete}
        class:opacity-60={isDimmed}
        style="font-size: 10px;"
      >
        {#if typeof titleParts === 'object' && titleParts !== null && titleParts.match !== undefined}
          {titleParts.before}<span class="search-highlight">{titleParts.match}</span>{titleParts.after}
        {:else}
          {node.title}
        {/if}
      </span>
      <span class="meta-chip">{node.status || 'todo'}</span>
      <span class="meta-chip">{node.priority || 'medium'}</span>
      {#if node.dueDate}
        <span class="meta-chip">{node.dueDate}</span>
      {/if}
    </div>

    <div class="flex items-center gap-1 flex-shrink-0 flex-wrap">
      {#each nodeTags as tag}
        <span class="tag-chip" style="background-color: {tag.color}; color: #fff;">{tag.name}</span>
      {/each}
    </div>

    <div class="actions-group flex items-center flex-shrink-0 opacity-80 hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <button class="btn-primary" onclick={openAddChild} aria-label="Add Child">Add Child</button>
      <button class="btn-secondary" onclick={() => store.editTaskId = node.id} aria-label="Edit task">Edit task</button>
      <button class="btn-secondary" onclick={() => store.moveUp(node.id)} aria-label="Move Up">Move Up</button>
      <button class="btn-secondary" onclick={() => store.moveDown(node.id)} aria-label="Move Down">Move Down</button>
      <button class="btn-secondary" onclick={() => store.moveToSourceId = node.id} aria-label="Move To">Move To</button>
      <button class="btn-secondary" onclick={() => showTagPicker = !showTagPicker} aria-label="Manage Tags">Tags</button>
      {#if hasChildren}
        <button class="btn-secondary" onclick={() => store.zoomTo(node.id)} aria-label="Zoom In">Zoom In</button>
      {/if}
      <button class="btn-primary" onclick={handleExport} aria-label="Export as Text">Export as Text</button>
      {#if canArchive}
        <button class="btn-secondary" onclick={() => store.archiveBranch(node.id)} aria-label="Archive">Archive</button>
      {/if}
      {#if isLeafNode}
        <button class="btn-secondary" onclick={() => store.deleteTask(node.id)} aria-label="Delete" style="border-color: var(--color-danger); color: var(--color-danger);">Delete</button>
      {/if}
    </div>
  </div>

  {#if showTagPicker}
    <div class="tag-picker mb-2 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] max-w-xs z-10" style="margin-left: calc({depth} * 24px + 32px);">
      <div class="text-[10px] font-semibold text-[var(--color-muted)] mb-1">Select tags (max 5):</div>
      <div class="flex flex-wrap gap-2">
        {#each store.tags as tag}
          <button
            type="button"
            class="tag-chip"
            class:active={node.tags.includes(tag.id)}
            style="background-color: {tag.color}; color: #fff;"
            onclick={() => store.toggleNodeTag(node.id, tag.id)}
          >{tag.name}</button>
        {/each}
      </div>
      {#if store.tags.length === 0}
        <div class="text-[10px] text-[var(--color-muted)]">No tags yet. Create them in the Tag manager.</div>
      {/if}
    </div>
  {/if}

  {#if addingChild}
    <form use:childForm class="add-child-form mb-2 form-grid" style="margin-left: calc(({depth} + 1) * 24px + 32px);">
      <div class="flex-1 min-w-[100px]">
        <label class="block text-[10px] font-semibold mb-1" for="child-title-{node.id}">title</label>
        <input
          id="child-title-{node.id}"
          name="title"
          placeholder="Child task title…"
          aria-label="Child task title"
          class="w-full bg-[var(--color-background)] border rounded px-2 py-2 {shakeChildTitle ? 'shake' : ''}"
          style="font-size: 10px; {$childErrors.title ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
          aria-invalid={!!$childErrors.title}
        />
        {#if $childErrors.title}<div class="field-error shake" aria-live="polite">{$childErrors.title[0]}</div>{/if}
      </div>
      <div>
        <label class="block text-[10px] font-semibold mb-1" for="child-status-{node.id}">status</label>
        <select id="child-status-{node.id}" name="status" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);">
          <option value="todo">todo</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
          <option value="blocked">blocked</option>
        </select>
        {#if $childErrors.status}<div class="field-error" aria-live="polite">{$childErrors.status[0]}</div>{/if}
      </div>
      <div>
        <label class="block text-[10px] font-semibold mb-1" for="child-priority-{node.id}">priority</label>
        <select id="child-priority-{node.id}" name="priority" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);">
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </select>
        {#if $childErrors.priority}<div class="field-error" aria-live="polite">{$childErrors.priority[0]}</div>{/if}
      </div>
      <div>
        <label class="block text-[10px] font-semibold mb-1" for="child-dueDate-{node.id}">dueDate</label>
        <input id="child-dueDate-{node.id}" name="dueDate" type="date" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);" />
        {#if $childErrors.dueDate}<div class="field-error" aria-live="polite">{$childErrors.dueDate[0]}</div>{/if}
      </div>
      <div class="self-end flex gap-2">
        <button type="submit" class="btn-primary">Add Child</button>
        <button type="button" class="btn-secondary" onclick={() => addingChild = false}>Cancel</button>
      </div>
    </form>
  {/if}

  {#if hasChildren && !node.collapsed}
    <div bind:this={childrenEl}>
      {#each node.children as child (child.id)}
        {#if !tagFilters || tagFilters.size === 0 || subtreeHasTag(child, tagFilters)}
          <TaskNode node={child} depth={depth + 1} {searchQuery} {tagFilters} />
        {/if}
      {/each}
    </div>
  {/if}
</div>
