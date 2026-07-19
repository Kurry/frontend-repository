<script lang="ts">
  import * as store from '../lib/store';
</script>

<div class="flex flex-col items-center justify-center py-20">
  <div class="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-4">
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  </div>
  <p class="text-[var(--color-text-primary)] font-medium text-base mb-1">No panes yet</p>
  <p class="text-[var(--color-text-secondary)] text-sm mb-4">Create your first pane to build this page.</p>
  <button
    class="bg-[var(--color-primary)] text-white px-5 py-2 rounded-[var(--radius-base)] text-sm font-medium hover:opacity-90 transition-opacity"
    onclick={() => store.setShowCreateWizard(true)}
  >
    Create Pane
  </button>
</div>
