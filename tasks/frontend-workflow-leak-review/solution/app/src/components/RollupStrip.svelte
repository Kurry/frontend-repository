<script>
  import { MagnifyingGlass, CheckCircle, WarningDiamond, ChartBar } from 'phosphor-svelte';
  let { rollup } = $props();

  const items = $derived([
    { label: 'Review triggered', value: rollup.reviewTriggered, icon: WarningDiamond, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Confirmed clean', value: rollup.confirmedClean, icon: CheckCircle, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Confirmed leak', value: rollup.confirmedLeak, icon: MagnifyingGlass, tone: 'text-rose-700 bg-rose-50' },
    { label: 'Mean similarity', value: rollup.meanSimilarity.toFixed(2), icon: ChartBar, tone: 'text-teal-700 bg-teal-50' }
  ]);
</script>

<section aria-label="Queue rollup" class="panel grid overflow-hidden rounded-xl sm:grid-cols-2 lg:grid-cols-4">
  {#each items as item, index}
    <div class={`flex items-center gap-3 px-4 py-3.5 ${index ? 'border-t border-line/70 sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}>
      <span class={`grid size-9 shrink-0 place-items-center rounded-lg ${item.tone}`}><item.icon size={18} weight="bold" /></span>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[.08em] text-slate-500">{item.label}</p>
        <p class="tabular text-xl font-extrabold text-ink-900" aria-label={`${item.label}: ${item.value}`}>{item.value}</p>
      </div>
    </div>
  {/each}
</section>
