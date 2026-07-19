<script lang="ts">
  import { createVirtualizer, type Virtualizer } from '@tanstack/svelte-virtual';

  interface Props {
    items: { id: string; text: string }[];
  }

  let { items }: Props = $props();

  let scrollRef: HTMLElement | null = $state(null);

  let virtualizer = $derived.by(() => {
    if (!scrollRef) return null;
    return createVirtualizer({
      count: items.length,
      getScrollElement: () => scrollRef,
      estimateSize: () => 40,
      overscan: 5,
    });
  });

  let virtualItems = $derived.by(() => {
    return virtualizer?.getVirtualItems() ?? [];
  });

  let renderedCount = $derived.by(() => virtualItems.length);
</script>

<div class="flex-1 overflow-hidden flex flex-col">
  <div class="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
    <span class="text-xs font-semibold text-slate-500 uppercase">Virtualized items: {items.length}</span>
    <span class="text-xs text-slate-400">Rendered item count: {renderedCount}</span>
  </div>
  <div
    class="flex-1 overflow-auto"
    bind:this={scrollRef}
  >
    {#if virtualizer}
      <div
        style="height: {virtualizer.getTotalSize()}px; width: 100%; position: relative;"
      >
        {#each virtualItems as virtualItem (virtualItem.key)}
          <div
            class="absolute top-0 left-0 w-full flex items-center px-4 text-sm text-slate-700 border-b border-slate-100 hover:bg-slate-50"
            style="height: {virtualItem.size}px; transform: translateY({virtualItem.start}px);"
          >
            <span class="text-slate-300 mr-3 w-8 text-right">{virtualItem.index + 1}</span>
            {items[virtualItem.index].text}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
