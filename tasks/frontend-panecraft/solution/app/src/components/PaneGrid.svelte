<script lang="ts">
  import * as store from '../lib/store';
  import { getDataSourceById, dataSources } from '../data/mockData';
  import LineChart from './charts/LineChart.svelte';
  import BarChart from './charts/BarChart.svelte';
  import DonutChart from './charts/DonutChart.svelte';
  import DataTablePane from './charts/DataTablePane.svelte';
  import CounterPane from './charts/CounterPane.svelte';
  
  let confirmDeletePane = $state<{ pageId: string; paneId: string } | null>(null);
  let activePage = $derived(store.getActivePage());
  
  function getPaneWidth(size: store.PaneSize): string {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 sm:col-span-2';
      case 'large': return 'col-span-1 sm:col-span-2 lg:col-span-4';
      default: return 'col-span-1';
    }
  }
  
  function getPaneHeight(size: store.PaneSize): string {
    switch (size) {
      case 'small': return 'min-h-[180px]';
      case 'medium': return 'min-h-[220px]';
      case 'large': return 'min-h-[300px]';
      default: return 'min-h-[180px]';
    }
  }
  
  function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }
  
  // Reactive timer for the "last updated Xs ago" labels
  let tick = $state(0);
  $effect(() => {
    const interval = setInterval(() => {
      tick++;
    }, 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {#each activePage.panes as pane, i}
    <div class="{getPaneWidth(pane.size)} bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-base)] flex flex-col overflow-hidden group">
      <!-- Pane Header -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <span class="text-[15px] font-semibold text-[var(--color-text-primary)] truncate mr-2">{pane.title}</span>
        <div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity flex-shrink-0">
          <button
            class="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] px-1.5 py-0.5 border border-transparent hover:border-[var(--color-border)] rounded bg-white"
            onclick={() => store.setEditingPane({ paneId: pane.id, pageId: activePage.id })}
            title="Edit pane"
          >Edit</button>
          <button
            class="text-xs text-[var(--color-primary)] hover:opacity-80 px-1.5 py-0.5 border border-transparent hover:border-[var(--color-border)] rounded bg-white"
            onclick={() => confirmDeletePane = { pageId: activePage.id, paneId: pane.id }}
            title="Delete pane"
          >Delete</button>
        </div>
      </div>
      
      <!-- Move Controls -->
      <div class="flex items-center gap-1 px-3 py-1 border-b border-[var(--color-border)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
        <button 
          class="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] disabled:opacity-30 px-1.5 py-0.5 border border-[var(--color-border)] rounded bg-white"
          disabled={!store.canMovePane(activePage.id, pane.id, 'up')}
          onclick={() => store.movePane(activePage.id, pane.id, 'up')}
        >Move Up</button>
        <button 
          class="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] disabled:opacity-30 px-1.5 py-0.5 border border-[var(--color-border)] rounded bg-white"
          disabled={!store.canMovePane(activePage.id, pane.id, 'down')}
          onclick={() => store.movePane(activePage.id, pane.id, 'down')}
        >Move Down</button>
        <button 
          class="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] disabled:opacity-30 px-1.5 py-0.5 border border-[var(--color-border)] rounded bg-white"
          disabled={!store.canMovePane(activePage.id, pane.id, 'left')}
          onclick={() => store.movePane(activePage.id, pane.id, 'left')}
        >Move Left</button>
        <button 
          class="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] disabled:opacity-30 px-1.5 py-0.5 border border-[var(--color-border)] rounded bg-white"
          disabled={!store.canMovePane(activePage.id, pane.id, 'right')}
          onclick={() => store.movePane(activePage.id, pane.id, 'right')}
        >Move Right</button>
      </div>
      
      <!-- Size Controls -->
      <div class="flex items-center justify-between px-3 py-1 border-b border-[var(--color-border)] flex-wrap gap-1">
        <div class="flex items-center gap-0.5">
          <span class="text-[10px] text-[var(--color-text-secondary)] mr-1">Size:</span>
          {#each ['small', 'medium', 'large'] as sz}
            <button
              class="text-[10px] px-1.5 py-0.5 rounded {pane.size === sz ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] bg-white border border-[var(--color-border)]'}"
              onclick={() => store.updatePane(activePage.id, pane.id, { size: sz as store.PaneSize })}
            >{sz.charAt(0).toUpperCase() + sz.slice(1)}</button>
          {/each}
        </div>
        <select
          class="text-[10px] px-1 py-0.5 border border-[var(--color-border)] rounded bg-white text-[var(--color-text-secondary)]"
          value={pane.refreshInterval}
          onchange={(e) => store.updatePane(activePage.id, pane.id, { refreshInterval: e.currentTarget.value as store.RefreshInterval, lastRefreshTime: Date.now(), refreshTick: 0 })}
        >
          <option value="off">Refresh: Off</option>
          <option value="30s">Every 30s</option>
          <option value="5m">Every 5m</option>
        </select>
      </div>
      
      <!-- Refresh indicator -->
      {#if pane.refreshInterval !== 'off'}
        <div class="px-3 py-0.5 text-[12px] text-[var(--color-text-secondary)]">
          Last updated {timeAgo(pane.lastRefreshTime)} ago (simulated refresh)
        </div>
      {/if}
      
      <!-- Pane Content -->
      <div class="flex-1 p-3 overflow-auto {getPaneHeight(pane.size)}">
        {#if pane.type === 'line'}
          <LineChart {pane} />
        {:else if pane.type === 'bar'}
          <BarChart {pane} />
        {:else if pane.type === 'donut'}
          <DonutChart {pane} />
        {:else if pane.type === 'table'}
          <DataTablePane {pane} />
        {:else if pane.type === 'counter'}
          <CounterPane {pane} />
        {/if}
      </div>
    </div>
  {/each}
</div>

{#if confirmDeletePane}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick={() => confirmDeletePane = null}>
    <div class="bg-white rounded-[var(--radius-base)] p-6 max-w-sm mx-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-base font-semibold text-[var(--color-text-primary)] mb-2">Delete Pane?</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">This will remove this pane from the page.</p>
      <div class="flex gap-2 justify-end">
        <button class="px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]" onclick={() => confirmDeletePane = null}>Cancel</button>
        <button class="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90" onclick={() => { store.deletePane(confirmDeletePane!.pageId, confirmDeletePane!.paneId); confirmDeletePane = null; }}>Delete</button>
      </div>
    </div>
  </div>
{/if}
