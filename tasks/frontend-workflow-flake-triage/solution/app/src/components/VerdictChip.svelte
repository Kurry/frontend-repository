<script lang="ts">
  import { IconCircleCheckFilled, IconAlertTriangleFilled, IconCircleXFilled } from '@tabler/icons-svelte';
  import type { Verdict } from '../lib/types';

  let { verdict, compact = false }: { verdict: Verdict; compact?: boolean } = $props();
</script>

<span class:compact class={`verdict-chip ${verdict}`} data-verdict={verdict}>
  {#if verdict === 'keep'}
    <IconCircleCheckFilled size={compact ? 12 : 14} aria-hidden="true" />
  {:else if verdict === 'flaky'}
    <IconAlertTriangleFilled size={compact ? 12 : 14} aria-hidden="true" />
  {:else}
    <IconCircleXFilled size={compact ? 12 : 14} aria-hidden="true" />
  {/if}
  {verdict}
</span>

<style>
  .verdict-chip {
    display: inline-flex;
    min-width: 72px;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 5px 9px;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    text-transform: capitalize;
    transition: color 220ms ease, background-color 220ms ease, border-color 220ms ease, transform 220ms ease;
  }
  .verdict-chip.compact {
    min-width: 58px;
    padding: 4px 7px;
    font-size: 10px;
  }
  .keep {
    border-color: #9dd7c4;
    background: #e3f5ed;
    color: #08614f;
  }
  .flaky {
    border-color: #f0cf79;
    background: #fff2c9;
    color: #825007;
  }
  .fail {
    border-color: #f2b4b4;
    background: #ffe6e4;
    color: #a5262b;
  }
  :global(.dark) .keep {
    border-color: #286653;
    background: #193e34;
    color: #81d3b6;
  }
  :global(.dark) .flaky {
    border-color: #705a24;
    background: #40351e;
    color: #f3ce6c;
  }
  :global(.dark) .fail {
    border-color: #713b3e;
    background: #47272a;
    color: #f3a7a8;
  }
</style>
