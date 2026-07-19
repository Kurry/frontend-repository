<script lang="ts">
  import * as store from '../lib/store';
  
  const ranges: { value: store.DateRange; label: string }[] = [
    { value: '1', label: 'Today Only' },
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
  ];
</script>

<div class="flex items-center gap-1">
  <span class="text-xs text-[var(--color-text-secondary)] mr-1 hidden sm:inline">Range:</span>
  {#each ranges as r}
    <button
      class="px-2 py-1 text-xs rounded-[var(--radius-base)] whitespace-nowrap transition-colors {store.getDateRange() === r.value ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'}"
      onclick={() => store.setDateRange(r.value)}
    >
      {r.label}
    </button>
  {/each}
</div>
