<script>
  import './app.css';
  import { store } from './lib/store.svelte.js';
  import Toolbar from './components/Toolbar.svelte';
  import Breadcrumb from './components/Breadcrumb.svelte';
  import TaskTree from './components/TaskTree.svelte';
  import ArchivePanel from './components/ArchivePanel.svelte';
  import TagManager from './components/TagManager.svelte';
  import MoveToPicker from './components/MoveToPicker.svelte';
  import GrovePanel from './components/GrovePanel.svelte';
  import Toast from './components/Toast.svelte';

  // Root task creation
  let rootTitle = $state('');
  let rootError = $state('');
  let rootInput = $state(null);

  function addRootTask() {
    const title = rootTitle.trim();
    if (!title || title.length > 120) {
      rootError = 'Task title must be 1 to 120 characters';
      rootInput?.focus();
      return;
    }
    if (store.addRootTask(title)) {
      rootTitle = '';
      rootError = '';
    } else {
      rootError = 'A root task with this title already exists';
      rootInput?.focus();
    }
  }

  function handleRootKey(e) {
    if (e.key === 'Enter') addRootTask();
  }

  // Derived values
  const theme = $derived(store.theme);
</script>

<div class="app-container min-h-screen flex flex-col transition-theme overflow-x-hidden" data-theme={theme}>
  <!-- Header -->
  <header class="px-4 pt-4 pb-3 border-b border-[var(--color-border)] bg-[var(--color-background)]">
    <h1 class="app-title heading font-extrabold tracking-tight text-[var(--color-primary)]" style="font-family: var(--font-heading); line-height: 0.95;">
      TaskGrove
    </h1>
    <p class="text-[14px] leading-[1.5] text-[var(--color-secondary)] mt-2 max-w-[65ch]">Grow your tasks like trees — big outcomes built from small steps.</p>
  </header>

  <!-- Toolbar -->
  <Toolbar />

  <!-- Tag Manager (expandable) -->
  <TagManager />

  <!-- Breadcrumb (when zoomed) -->
  <Breadcrumb />

  <!-- Main Content Area -->
  <main class="flex-1 flex flex-col lg:flex-row overflow-hidden">
    <!-- Task Tree -->
    <div class="flex-1 overflow-y-auto p-2 bg-[var(--color-background)]">
      <TaskTree />
    </div>

    <!-- Archive Panel (sidebar on large, below on narrow) -->
    <ArchivePanel />
  </main>

  <!-- Bottom Input: New Root Task -->
  <footer class="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-2">
    <div class="max-w-3xl mx-auto">
      <label for="new-root-task" class="block text-[10px] font-semibold mb-1">New root task</label>
      <div class="flex flex-wrap items-center gap-2">
      <input
        id="new-root-task"
        bind:this={rootInput}
        bind:value={rootTitle}
        onkeydown={handleRootKey}
        placeholder="New root task title…"
        class="flex-1 min-w-[100px] bg-[var(--color-background)] border rounded px-3 py-2 text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-primary)]"
        style="font-size: 10px; {rootError ? 'border-color: var(--color-danger);' : 'border-color: var(--color-border);'}"
        aria-label="New root task title"
        aria-invalid={!!rootError}
      />
      <button
        class="btn-primary !px-4 !py-2"
        onclick={addRootTask}
      >New Root Task</button>
      </div>
    </div>
    {#if rootError}
      <div class="max-w-3xl mx-auto mt-1 text-[var(--color-danger)] text-[9px] shake">{rootError}</div>
    {/if}
  </footer>

  <!-- Modals & Overlays -->
  <MoveToPicker />
  <GrovePanel />

  <!-- Toast Notifications -->
  <Toast />
</div>
