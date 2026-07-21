<script lang="ts">
  import { createVirtualizer } from '@tanstack/svelte-virtual';

  interface Props {
    items: { id: string; text: string }[];
  }

  let { items }: Props = $props();

  let scrollRef: HTMLElement | null = $state(null);
  let filterQuery: string = $state('');
  let selectedId: string | null = $state(null);

  let filteredItems = $derived.by(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.text.toLowerCase().includes(q));
  });

  let virtualizer = $derived.by(() => {
    if (!scrollRef) return null;
    return createVirtualizer({
      count: filteredItems.length,
      getScrollElement: () => scrollRef,
      estimateSize: () => 40,
      overscan: 5,
    });
  });

  let virtualItems = $derived.by(() => virtualizer?.getVirtualItems() ?? []);
  let renderedCount = $derived.by(() => virtualItems.length);

  function focusItem(id: string | null) {
    if (!id || !scrollRef) return;
    const el = scrollRef.querySelector(`[data-item-id="${id}"]`);
    if (el instanceof HTMLElement) el.focus();
  }

  function onItemKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(index + 1, filteredItems.length - 1);
      selectedId = filteredItems[next]?.id ?? null;
      virtualizer?.scrollToIndex(next, { align: 'auto' });
      queueMicrotask(() => focusItem(selectedId));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(index - 1, 0);
      selectedId = filteredItems[prev]?.id ?? null;
      virtualizer?.scrollToIndex(prev, { align: 'auto' });
      queueMicrotask(() => focusItem(selectedId));
    }
  }
</script>

<div class="flex-1 overflow-hidden flex flex-col">
  <div class="px-4 py-2 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center gap-2">
    <span class="text-xs font-semibold text-slate-500 uppercase">Virtualized items: {items.length}</span>
    <span class="text-xs text-slate-400">Rendered item count: {renderedCount}</span>
    <label class="sm:ml-auto flex items-center gap-2 text-xs text-slate-600">
      <span class="whitespace-nowrap">Filter</span>
      <input
        type="text"
        bind:value={filterQuery}
        class="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Filter items..."
        aria-label="Filter virtualized items"
      />
    </label>
  </div>
  <div class="flex-1 overflow-auto" bind:this={scrollRef}>
    {#if virtualizer}
      <div style="height: {virtualizer.getTotalSize()}px; width: 100%; position: relative;">
        {#each virtualItems as virtualItem (virtualItem.key)}
          {@const item = filteredItems[virtualItem.index]}
          <div
            class="absolute top-0 left-0 w-full flex items-center px-4 text-sm text-slate-700 border-b border-slate-100 hover:bg-slate-50 focus:bg-indigo-50 focus:outline-none"
            class:bg-indigo-50={selectedId === item.id}
            style="height: {virtualItem.size}px; transform: translateY({virtualItem.start}px);"
            tabindex="0"
            data-item-id={item.id}
            role="option"
            aria-selected={selectedId === item.id}
            onclick={() => { selectedId = item.id; }}
            onkeydown={(e) => onItemKeydown(e, virtualItem.index)}
          >
            <span class="text-slate-300 mr-3 w-8 text-right">{virtualItem.index + 1}</span>
            {item.text}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
