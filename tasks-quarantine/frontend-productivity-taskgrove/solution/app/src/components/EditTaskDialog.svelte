<script>
  import { createDialog } from '@melt-ui/svelte';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { store } from '../lib/store.svelte.js';
  import { TaskUpsertSchema } from '../lib/schemas.js';

  const {
    elements: { portalled, overlay, content, title, description, close },
    states: { open },
  } = createDialog({ forceVisible: true });

  const nodeId = $derived(store.editTaskId);
  const node = $derived.by(() => {
    if (!nodeId) return null;
    function find(nodes) {
      for (const n of nodes) {
        if (n.id === nodeId) return n;
        const child = find(n.children);
        if (child) return child;
      }
      return null;
    }
    const inTree = find(store.tasks);
    if (inTree) return inTree;
    for (const entry of store.archive) {
      const archived = find([entry.branch]);
      if (archived) return archived;
    }
    return null;
  });

  let shakeTitle = $state(false);

  const { form, errors, reset, setInitialValues } = createForm({
    extend: validator({ schema: TaskUpsertSchema }),
    onSubmit: (values) => {
      if (!nodeId) return;
      if (store.updateTask(nodeId, values)) {
        store.editTaskId = null;
      }
    },
    onError: (errs) => {
      shakeTitle = true;
      setTimeout(() => { shakeTitle = false; }, 300);
      const first = errs.title?.[0] || errs.status?.[0] || errs.priority?.[0] || errs.dueDate?.[0];
      if (first) store.announce(first);
    },
  });

  $effect(() => {
    open.set(nodeId !== null);
    if (node) {
      setInitialValues({
        title: node.title,
        status: node.status || 'todo',
        priority: node.priority || 'medium',
        dueDate: node.dueDate || '',
      });
      reset();
    }
  });

  $effect(() => {
    if (!$open && store.editTaskId !== null) store.editTaskId = null;
  });
</script>

{#if $open && node}
  <div {...$portalled}>
    <div {...$overlay} class="fixed inset-0 z-50 bg-black/30"></div>
    <section
      {...$content}
      class="fixed left-1/2 top-1/2 z-50 w-[min(520px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-xl panel-enter"
    >
      <div class="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2 mb-3">
        <h2 {...$title} class="heading font-bold" style="font-size: 48px; line-height: 1.1;">Edit task</h2>
        <button {...$close} class="btn-secondary !px-2 !py-1" aria-label="Close Edit task">✕</button>
      </div>
      <p {...$description} class="sr-only">Edit task title, status, priority, and due date</p>
      <form use:form class="form-grid">
        <div class="w-full">
          <label for="edit-title" class="block text-[10px] font-semibold mb-1">title</label>
          <input
            id="edit-title"
            name="title"
            class="w-full bg-[var(--color-background)] border rounded px-2 py-2 text-[var(--color-text-primary)] outline-none {shakeTitle ? 'shake' : ''}"
            style="font-size: 10px; {$errors.title ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
            aria-invalid={!!$errors.title}
            aria-describedby={$errors.title ? 'edit-title-error' : undefined}
          />
          {#if $errors.title}
            <div id="edit-title-error" class="field-error shake" aria-live="polite">{$errors.title[0]}</div>
          {/if}
        </div>
        <div>
          <label for="edit-status" class="block text-[10px] font-semibold mb-1">status</label>
          <select id="edit-status" name="status" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);">
            <option value="todo">todo</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
            <option value="blocked">blocked</option>
          </select>
          {#if $errors.status}<div class="field-error" aria-live="polite">{$errors.status[0]}</div>{/if}
        </div>
        <div>
          <label for="edit-priority" class="block text-[10px] font-semibold mb-1">priority</label>
          <select id="edit-priority" name="priority" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
          {#if $errors.priority}<div class="field-error" aria-live="polite">{$errors.priority[0]}</div>{/if}
        </div>
        <div>
          <label for="edit-dueDate" class="block text-[10px] font-semibold mb-1">dueDate</label>
          <input id="edit-dueDate" name="dueDate" type="date" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);" />
          {#if $errors.dueDate}<div class="field-error" aria-live="polite">{$errors.dueDate[0]}</div>{/if}
        </div>
        <div class="w-full flex gap-2 justify-end mt-2">
          <button type="button" class="btn-secondary" onclick={() => store.editTaskId = null}>Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </section>
  </div>
{/if}
