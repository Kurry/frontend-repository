<script lang="ts">
  import { flip } from 'svelte/animate';
  import * as store from '../lib/store';
  import LineChart from './charts/LineChart.svelte';
  import BarChart from './charts/BarChart.svelte';
  import DonutChart from './charts/DonutChart.svelte';
  import DataTablePane from './charts/DataTablePane.svelte';
  import CounterPane from './charts/CounterPane.svelte';
  import Modal from './Modal.svelte';
  import { prefersReducedMotion } from '../lib/chartUtils';

  let confirmDeletePane = $state<{ pageId: string; paneId: string; title: string } | null>(null);
  const activePage = $derived(store.getActivePage());
  const justCreatedId = $derived(store.getLastCreatedPaneId());

  function paneSpans(size: store.PaneSize): string {
    if (size === 'medium') return 'col-span-1 sm:col-span-2';
    if (size === 'large') return 'col-span-1 sm:col-span-2 lg:col-span-4';
    return 'col-span-1';
  }

  function paneHeight(size: store.PaneSize): string {
    if (size === 'medium') return 'min-h-[220px]';
    if (size === 'large') return 'min-h-[300px]';
    return 'min-h-[190px]';
  }

  function timeAgo(timestamp: number): string {
    const seconds = Math.max(Math.floor((Date.now() - timestamp) / 1000), 0);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  }

  // Re-render each second so the "Last updated Xs ago" labels count up.
  let now = $state(Date.now());
  $effect(() => {
    const interval = setInterval(() => {
      now = Date.now();
    }, 1000);
    return () => clearInterval(interval);
  });

  function paneExit(node: Element) {
    if (prefersReducedMotion()) return { duration: 0 };
    return {
      duration: 240,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      css: (t: number) => `opacity: ${t}; transform: scale(${0.92 + 0.08 * t});`,
    };
  }

  // Arrow-key grid nudging: a focused pane can move without pointer buttons.
  function handlePaneKeydown(event: KeyboardEvent, paneId: string) {
    const directions: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    const direction = directions[event.key];
    if (!direction) return;
    if (!store.canMovePane(activePage.id, paneId, direction)) return;
    event.preventDefault();
    store.movePane(activePage.id, paneId, direction);
  }

  function setSize(paneId: string, size: store.PaneSize) {
    store.updatePane(activePage.id, paneId, { size });
    store.announce(`Pane size set to ${size}.`);
  }

  function setRefresh(paneId: string, refreshInterval: store.RefreshInterval) {
    store.updatePane(activePage.id, paneId, {
      refreshInterval,
      lastRefreshTime: Date.now(),
      refreshTick: 0,
    });
  }

  function requestDelete(pane: store.Pane) {
    confirmDeletePane = { pageId: activePage.id, paneId: pane.id, title: pane.title };
  }

  function confirmDelete() {
    if (!confirmDeletePane) return;
    store.deletePane(confirmDeletePane.pageId, confirmDeletePane.paneId);
    store.announce('Pane deleted.');
    confirmDeletePane = null;
  }
</script>

<section aria-label="Workspace panes">
  <div class="flex items-baseline justify-between mb-3 gap-2">
    <h2 class="text-base font-semibold text-[var(--color-text-primary)]">{activePage.name}</h2>
    <span class="text-xs text-[var(--color-text-secondary)]" aria-live="polite">
      {activePage.panes.length} pane{activePage.panes.length === 1 ? '' : 's'} · shared range applied together
    </span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each activePage.panes as pane (pane.id)}
      <div
        class="pane-card pane-enter {paneSpans(pane.size)} bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-base)] flex flex-col overflow-hidden"
        class:pane-just-created={pane.id === justCreatedId}
        tabindex="0"
        role="group"
        aria-label="{pane.title} pane. Use arrow keys to move the pane."
        onkeydown={(event) => handlePaneKeydown(event, pane.id)}
        animate:flip={{ duration: prefersReducedMotion() ? 0 : 250 }}
        out:paneExit
      >
        <!-- Pane header -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] gap-2">
          <h3 class="text-[15px] font-semibold text-[var(--color-text-primary)] truncate mr-1">{pane.title}</h3>
          <div class="pane-controls flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              class="tap-target tap-target-x text-xs text-[var(--color-text-primary)] bg-white border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-base)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              onclick={() => store.setEditingPane({ paneId: pane.id, pageId: activePage.id })}
            >Edit</button>
            <button
              type="button"
              class="tap-target tap-target-x text-xs text-[var(--color-text-primary)] bg-white border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-base)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              onclick={() => store.setShowSharePanel(true)}
            >Share</button>
            <button
              type="button"
              class="tap-target tap-target-x text-xs text-[var(--color-text-primary)] bg-white border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-base)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              onclick={() => requestDelete(pane)}
            >Delete</button>
          </div>
        </div>

        <!-- Move controls -->
        <div class="pane-controls flex items-center gap-1 px-3 py-1.5 border-b border-[var(--color-border)] flex-wrap">
          {#each [['up', 'Move Up'], ['down', 'Move Down'], ['left', 'Move Left'], ['right', 'Move Right']] as [direction, label]}
            <button
              type="button"
              class="tap-target-x text-[11px] text-[var(--color-text-secondary)] bg-white border border-[var(--color-border)] px-1.5 py-1 rounded-[var(--radius-base)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] disabled:opacity-30 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-secondary)] transition-colors"
              disabled={!store.canMovePane(activePage.id, pane.id, direction)}
              aria-label="{label} pane {pane.title}"
              onclick={() => store.movePane(activePage.id, pane.id, direction)}
            >{label}</button>
          {/each}
        </div>

        <!-- Size + refresh controls -->
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] flex-wrap gap-1">
          <div class="flex items-center gap-1" role="group" aria-label="Pane size">
            <span class="text-[11px] text-[var(--color-text-secondary)] mr-0.5">Size:</span>
            {#each ['small', 'medium', 'large'] as sz}
              <button
                type="button"
                class="tap-target-x text-[11px] px-2 py-1 rounded-[var(--radius-base)] transition-colors {pane.size === sz
                  ? 'bg-[var(--color-primary)] text-white font-semibold'
                  : 'text-[var(--color-text-secondary)] bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)]'}"
                aria-pressed={pane.size === sz}
                onclick={() => setSize(pane.id, sz)}
              >{sz.charAt(0).toUpperCase() + sz.slice(1)}</button>
            {/each}
          </div>
          <label class="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]">
            <span>Refresh:</span>
            <select
              class="tap-target-x text-[11px] px-1.5 py-1 border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary)]"
              value={pane.refreshInterval}
              aria-label="Refresh interval for {pane.title}"
              onchange={(event) => setRefresh(pane.id, event.currentTarget.value as store.RefreshInterval)}
            >
              <option value="off">Off</option>
              <option value="30s">Every 30s</option>
              <option value="5m">Every 5m</option>
            </select>
          </label>
        </div>

        {#if pane.refreshInterval !== 'off'}
          <div
            class="px-3 py-1 text-[12px] text-[var(--color-text-secondary)]"
            title="Simulated refresh with deterministic jitter — not a live network fetch."
          >
            Last updated {timeAgo(pane.lastRefreshTime)} ago <span class="opacity-70">(simulated refresh)</span>
          </div>
        {/if}

        <!-- Pane content -->
        <div class="flex-1 p-3 overflow-hidden {paneHeight(pane.size)}">
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
</section>

<Modal
  open={confirmDeletePane !== null}
  heading="Delete Pane?"
  labelledBy="delete-pane-heading"
  widthClass="max-w-sm"
  onClose={() => (confirmDeletePane = null)}
>
  <div class="p-6">
    <p id="delete-pane-body" class="text-sm text-[var(--color-text-secondary)] mb-4">
      This will remove “{confirmDeletePane?.title ?? 'this pane'}” from {activePage.name}. This cannot be undone.
    </p>
    <div class="flex gap-2 justify-end">
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        onclick={() => (confirmDeletePane = null)}
      >Cancel</button>
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
        onclick={confirmDelete}
      >Confirm Delete</button>
    </div>
  </div>
</Modal>
