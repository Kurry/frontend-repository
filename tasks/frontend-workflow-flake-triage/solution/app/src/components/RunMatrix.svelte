<script lang="ts">
  import { IconCheck, IconX } from '@tabler/icons-svelte';
  import type { Run } from '../lib/types';

  let {
    runs,
    size = 'normal',
    label = 'Five run result matrix',
    animateIndex = 0,
  }: { runs: Run[]; size?: 'small' | 'normal' | 'large'; label?: string; animateIndex?: number } = $props();
</script>

<ol class={`matrix ${size}`} aria-label={label}>
  {#each runs as run (run.index)}
    <li
      class:pass={run.result === 'pass'}
      class:fail={run.result === 'fail'}
      class:tick={animateIndex === run.index}
      aria-label={`Run ${run.index}: ${run.result}`}
      title={`Run ${run.index} · ${run.condition} · ${run.result}`}
    >
      <span class="run-index">{run.index}</span>
      {#if size === 'large'}
        {#if run.result === 'pass'}<IconCheck size={14} stroke={3} aria-hidden="true" />{:else}<IconX size={14} stroke={3} aria-hidden="true" />{/if}
      {/if}
    </li>
  {/each}
</ol>

<style>
  .matrix {
    display: inline-grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    min-width: 156px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .matrix li {
    display: inline-flex;
    height: 30px;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: 1px solid transparent;
    border-radius: 7px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 800;
    transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease, opacity 180ms ease;
  }
  .matrix li.tick {
    animation: cell-tick 260ms cubic-bezier(.22,.61,.36,1);
  }
  @keyframes cell-tick {
    from { opacity: 0; transform: translateY(6px) scale(.92); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .matrix.small {
    min-width: 116px;
    gap: 3px;
  }
  .matrix.small li {
    height: 24px;
    border-radius: 5px;
    font-size: 9px;
  }
  .matrix.large {
    width: 100%;
    min-width: 0;
    gap: 7px;
  }
  .matrix.large li {
    height: 42px;
    border-radius: 9px;
    font-size: 12px;
  }
  .pass {
    border-color: #9ed8c5 !important;
    background: #ddf3ea;
    color: #08614f;
  }
  .fail {
    border-color: #f1b3b4 !important;
    background: #ffe2e0;
    color: #a4262b;
  }
  :global(.dark) .pass {
    border-color: #2a6c58 !important;
    background: #193e34;
    color: #8be0c0;
  }
  :global(.dark) .fail {
    border-color: #714044 !important;
    background: #47282b;
    color: #f5aaab;
  }
</style>
