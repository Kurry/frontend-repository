<script lang="ts">
  import * as store from '../lib/store';
  import { getDataSourceById } from '../data/mockData';
  import Modal from './Modal.svelte';

  const sourceId = $derived(store.getShowDataSourcePreview());
  const ds = $derived(sourceId ? getDataSourceById(sourceId) : undefined);

  let filterText = $state('');

  const filteredRows = $derived.by(() => {
    if (!ds) return [];
    if (!filterText.trim()) return ds.rows;
    const lower = filterText.toLowerCase();
    return ds.rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(lower)),
    );
  });

  function close() {
    store.setShowDataSourcePreview(null);
    filterText = '';
  }
</script>

<Modal
  open={Boolean(ds)}
  heading={ds?.name ?? 'Data Source Preview'}
  labelledBy="source-preview-heading"
  widthClass="max-w-3xl"
  onClose={close}
>
  {#if ds}
    <p class="px-6 pt-3 text-xs text-[var(--color-text-secondary)]">{ds.description}</p>

    <div class="px-6 py-3">
      <label for="preview-filter" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Filter preview rows</label>
      <input
        id="preview-filter"
        type="text"
        class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)]"
        placeholder="Type to narrow the rows…"
        bind:value={filterText}
      />
      <span class="text-xs text-[var(--color-text-secondary)] mt-1 block" aria-live="polite">
        Showing {filteredRows.length} of {ds.rows.length} rows
      </span>
    </div>

    <div class="overflow-x-auto px-6 pb-6">
      <table class="w-full border-collapse min-w-[520px]">
        <thead>
          <tr>
            {#each ds.columns as col}
              <th class="px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] whitespace-nowrap">
                {col}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each filteredRows.slice(0, 100) as row}
            <tr class="transition-colors hover:bg-[var(--color-surface)]">
              {#each ds.columns as col}
                {#if col === 'status' && typeof row[col] === 'string'}
                  <td class="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                    <span class="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium {row[col] === 'Resolved'
                      ? 'bg-[#1ABF68] text-white'
                      : row[col] === 'Open'
                        ? 'bg-[#E8536B] text-white'
                        : 'bg-[#F59E0B] text-white'}">{row[col]}</span>
                  </td>
                {:else}
                  <td class="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                    {String(row[col] ?? '-')}
                  </td>
                {/if}
              {/each}
            </tr>
          {:else}
            <tr>
              <td colspan={ds.columns.length} class="px-3 py-4 text-sm text-center text-[var(--color-text-secondary)]">
                No rows match “{filterText}”.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if filteredRows.length > 100}
        <div class="text-xs text-[var(--color-text-secondary)] mt-2 px-3">Showing first 100 of {filteredRows.length} matching rows</div>
      {/if}
    </div>
  {/if}
</Modal>
