<script>
  import { Badge } from 'flowbite-svelte';
  import { CheckCircle, Circle, WarningDiamond, XCircle } from 'phosphor-svelte';
  import { reviewStateLabels } from '../lib/data.js';

  let { state, animate = false } = $props();

  const classes = {
    unreviewed: 'border-slate-300 bg-slate-100 text-slate-650',
    'review-triggered': 'border-amber-300 bg-amber-100 text-amber-800',
    'confirmed-clean': 'border-emerald-300 bg-emerald-100 text-emerald-800',
    'confirmed-leak': 'border-rose-300 bg-rose-100 text-rose-800'
  };
</script>

<Badge border class={`inline-flex whitespace-nowrap !rounded-md !px-2.5 !py-1 text-[11px] font-bold ${classes[state]} ${animate ? 'chip-pop' : ''}`}>
  <span class="mr-1.5 inline-flex" aria-hidden="true">
    {#if state === 'unreviewed'}<Circle size={12} weight="fill" />
    {:else if state === 'review-triggered'}<WarningDiamond size={12} weight="fill" />
    {:else if state === 'confirmed-clean'}<CheckCircle size={12} weight="fill" />
    {:else}<XCircle size={12} weight="fill" />{/if}
  </span>
  {reviewStateLabels[state]}
</Badge>
