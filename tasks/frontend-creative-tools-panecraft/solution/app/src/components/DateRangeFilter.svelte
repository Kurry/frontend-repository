<script lang="ts">
  import * as store from '../lib/store';

  function setRange(value: store.DateRange, label: string) {
    store.setDateRange(value);
    store.announce(`Date range set to ${label}.`);
  }
</script>

<div class="flex items-center gap-1 flex-wrap" role="group" aria-label="Shared date range">
  <span class="text-xs text-[var(--color-text-secondary)] mr-1 hidden sm:inline">Range:</span>
  {#each store.DATE_RANGES as r}
    <button
      type="button"
      class="tap-target px-2.5 py-1 text-xs rounded-[var(--radius-base)] whitespace-nowrap transition-colors {store.getDateRange() === r.value
        ? 'bg-[var(--color-primary)] text-white font-semibold'
        : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)]'}"
      aria-pressed={store.getDateRange() === r.value}
      onclick={() => setRange(r.value, r.label)}
    >
      {r.label}
    </button>
  {/each}
</div>
