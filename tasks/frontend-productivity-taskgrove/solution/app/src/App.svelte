<script>
  import './app.css';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { store } from './lib/store.svelte.js';
  import { TaskUpsertSchema } from './lib/schemas.js';
  import Toolbar from './components/Toolbar.svelte';
  import Breadcrumb from './components/Breadcrumb.svelte';
  import TaskTree from './components/TaskTree.svelte';
  import ArchivePanel from './components/ArchivePanel.svelte';
  import TagManager from './components/TagManager.svelte';
  import MoveToPicker from './components/MoveToPicker.svelte';
  import GrovePanel from './components/GrovePanel.svelte';
  import EditTaskDialog from './components/EditTaskDialog.svelte';
  import Toast from './components/Toast.svelte';

  let shakeTitle = $state(false);

  const { form, errors, reset } = createForm({
    extend: validator({ schema: TaskUpsertSchema }),
    initialValues: { title: '', status: 'todo', priority: 'medium', dueDate: '' },
    onSubmit: (values) => {
      if (store.addRootTask(values)) {
        reset();
        shakeTitle = false;
      }
    },
    onError: (errs) => {
      shakeTitle = true;
      setTimeout(() => { shakeTitle = false; }, 300);
      const first = errs.title?.[0] || errs.status?.[0] || errs.priority?.[0] || errs.dueDate?.[0];
      if (first) store.announce(first);
    },
  });

  const theme = $derived(store.theme);
</script>

<div class="app-container min-h-screen flex flex-col transition-theme overflow-x-hidden" data-theme={theme}>
  <header class="px-4 pt-4 pb-3 border-b border-[var(--color-border)] bg-[var(--color-background)]">
    <h1 class="app-title heading font-extrabold tracking-tight text-[var(--color-primary)]" style="font-family: var(--font-heading);">
      TaskGrove
    </h1>
    <p class="text-[14px] leading-[1.5] text-[var(--color-secondary)] mt-2 max-w-[65ch]">Grow your tasks like trees — big outcomes built from small steps.</p>
  </header>

  <Toolbar />
  <TagManager />
  <Breadcrumb />

  <main class="flex-1 flex flex-col lg:flex-row overflow-hidden">
    <div class="flex-1 overflow-y-auto p-2 bg-[var(--color-background)]">
      <TaskTree />
    </div>
    <ArchivePanel />
  </main>

  <footer class="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-2">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-[10px] font-semibold mb-2">New root task</h2>
      <form use:form class="form-grid">
        <div class="flex-1 min-w-[120px]">
          <label for="root-title" class="block text-[10px] font-semibold mb-1">title</label>
          <input
            id="root-title"
            name="title"
            placeholder="New root task title…"
            class="w-full bg-[var(--color-background)] border rounded px-3 py-2 text-[var(--color-text-primary)] outline-none {shakeTitle ? 'shake' : ''}"
            style="font-size: 10px; {$errors.title ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
            aria-invalid={!!$errors.title}
            aria-describedby={$errors.title ? 'root-title-error' : undefined}
          />
          {#if $errors.title}
            <div id="root-title-error" class="field-error shake" aria-live="polite">{$errors.title[0]}</div>
          {/if}
        </div>
        <div>
          <label for="root-status" class="block text-[10px] font-semibold mb-1">status</label>
          <select id="root-status" name="status" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);">
            <option value="todo">todo</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
            <option value="blocked">blocked</option>
          </select>
          {#if $errors.status}<div class="field-error" aria-live="polite">{$errors.status[0]}</div>{/if}
        </div>
        <div>
          <label for="root-priority" class="block text-[10px] font-semibold mb-1">priority</label>
          <select id="root-priority" name="priority" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
          {#if $errors.priority}<div class="field-error" aria-live="polite">{$errors.priority[0]}</div>{/if}
        </div>
        <div>
          <label for="root-dueDate" class="block text-[10px] font-semibold mb-1">dueDate</label>
          <input id="root-dueDate" name="dueDate" type="date" class="bg-[var(--color-background)] border rounded px-2 py-2" style="font-size: 10px; border-color: var(--color-border);" />
          {#if $errors.dueDate}<div class="field-error" aria-live="polite">{$errors.dueDate[0]}</div>{/if}
        </div>
        <div class="self-end">
          <button type="submit" class="btn-primary">New Root Task</button>
        </div>
      </form>
    </div>
  </footer>

  <MoveToPicker />
  <GrovePanel />
  <EditTaskDialog />
  <Toast />
</div>
