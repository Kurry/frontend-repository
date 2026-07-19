<script lang="ts">
  import * as store from '../lib/store';
  import type { DataSource } from '../data/mockData';
  
  const ds = $derived(store.getShowDataSourcePreview());
  
  let filterText = $state('');
  
  const filteredRows = $derived.by(() => {
    if (!ds) return [];
    if (!filterText.trim()) return ds.rows;
    const lower = filterText.toLowerCase();
    return ds.rows.filter(row => 
      Object.values(row).some(v => String(v).toLowerCase().includes(lower))
    );
  });
  
  function close() {
    store.setShowDataSourcePreview(null);
    filterText = '';
  }
</script>

{#if ds}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onclick={close}>
    <div class="bg-white rounded-[var(--radius-base)] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl flex flex-col" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <div>
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">{ds.name}</h2>
          <p class="text-xs text-[var(--color-text-secondary)]">{ds.description}</p>
        </div>
        <button aria-label="Close data source preview" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xl min-w-8 min-h-8" onclick={close}>×</button>
      </div>
      
      <div class="px-6 py-3 border-b border-[var(--color-border)]">
        <label for="preview-filter" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Filter preview rows</label>
        <input 
          id="preview-filter"
          type="text" 
          class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)]"
          placeholder="Filter rows..."
          bind:value={filterText}
        />
        <span class="text-xs text-[var(--color-text-secondary)] mt-1 block">
          Showing {filteredRows.length} of {ds.rows.length} rows
        </span>
      </div>
      
      <div class="flex-1 overflow-auto p-6">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              {#each ds.columns as col}
                <th class="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] whitespace-nowrap sticky top-0 bg-white">
                  {col}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each filteredRows.slice(0, 100) as row}
              <tr class="hover:bg-[var(--color-surface)]">
                {#each ds.columns as col}
                  {#if col === 'status' && typeof row[col] === 'string'}
                    <td class="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                      <span class="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium {row[col] === 'Resolved' ? 'bg-[#1ABF68] text-white' : row[col] === 'Open' ? 'bg-[#E8536B] text-white' : 'bg-[#F59E0B] text-white'}">{row[col]}</span>
                    </td>
                  {:else}
                    <td class="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                      {row[col] ?? '-'}
                    </td>
                  {/if}
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
        {#if filteredRows.length > 100}
          <div class="text-xs text-[var(--color-text-secondary)] mt-2 px-3">Showing first 100 of {filteredRows.length} matching rows</div>
        {/if}
      </div>
    </div>
  </div>
{/if}
