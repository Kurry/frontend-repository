<script lang="ts">
  import { IconAlertCircle, IconFlask2, IconShieldCheck } from '@tabler/icons-svelte';
  import { fly, fade } from 'svelte/transition';
  import { triage } from '../lib/triage.svelte';
  import { CONDITIONS, divergentIndexes, verdictFor } from '../lib/types';
  import VerdictChip from './VerdictChip.svelte';

  function correlationCount(condition: string): number {
    return triage.flakyTests.reduce((total, test) => {
      const diverged = divergentIndexes(test.runs);
      return total + test.runs.filter((run) => diverged.has(run.index) && run.condition === condition).length;
    }, 0);
  }

  let maxCorrelation = $derived(Math.max(1, ...CONDITIONS.map((condition) => correlationCount(condition))));
</script>

<section class="card-panel quarantine-panel" id="quarantine-map" aria-labelledby="quarantine-title">
  <div class="panel-header">
    <div>
      <span class="eyebrow">Live derivation</span>
      <h2 class="panel-title" id="quarantine-title">Quarantine map</h2>
    </div>
    <span class="total-count">{triage.allFailTests.length + triage.flakyTests.length} held</span>
  </div>
  <div class="quarantine-content">
    <section class="group" aria-labelledby="all-fail-heading">
      <div class="group-heading">
        <span><IconAlertCircle size={15} /> <strong id="all-fail-heading">All-fail tests</strong></span>
        <span class="count fail-count">{triage.allFailTests.length}</span>
      </div>
      <ul>
        {#each triage.allFailTests as test (test.id)}
          <li in:fly={{ x: 8, duration: 190 }} out:fade={{ duration: 140 }}>
            <button type="button" onclick={() => triage.selectTest(test.id)}>
              <span class="mono">{test.id}</span>
              <VerdictChip verdict={verdictFor(test.runs)} compact />
            </button>
          </li>
        {:else}
          <li class="empty-list">
            <IconShieldCheck size={16} /> No tests whose five runs all fail.
          </li>
        {/each}
      </ul>
    </section>
    <section class="group" aria-labelledby="flaky-heading">
      <div class="group-heading">
        <span><IconFlask2 size={15} /> <strong id="flaky-heading">Flaky tests</strong></span>
        <span class="count flaky-count">{triage.flakyTests.length}</span>
      </div>
      <ul>
        {#each triage.flakyTests as test (test.id)}
          <li in:fly={{ x: 8, duration: 190 }} out:fade={{ duration: 140 }}>
            <button type="button" onclick={() => triage.selectTest(test.id)}>
              <span class="mono">{test.id}</span>
              <VerdictChip verdict={verdictFor(test.runs)} compact />
            </button>
          </li>
        {:else}
          <li class="empty-list">
            <IconShieldCheck size={16} /> No tests with mixed pass and fail runs.
          </li>
        {/each}
      </ul>
    </section>

    <section class="correlation" aria-labelledby="correlation-title">
      <div class="correlation-heading">
        <div>
          <strong id="correlation-title">Diverging conditions</strong>
          <span>Minority runs across flaky tests</span>
        </div>
        <span class="eyebrow">Correlation</span>
      </div>
      <div class="correlation-grid">
        {#each CONDITIONS as condition}
          {@const count = correlationCount(condition)}
          <div class="correlation-row">
            <span>{condition}</span>
            <i><b style={`width: ${(count / maxCorrelation) * 100}%`}></b></i>
            <strong class="mono">{count}</strong>
          </div>
        {/each}
      </div>
    </section>
  </div>
</section>

<style>
  .quarantine-panel { overflow: hidden; }
  .panel-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px; border-bottom: 1px solid #e2e8e4; }
  .panel-header h2 { margin: 2px 0 0; }
  .total-count { border-radius: 999px; background: #edf2ef; padding: 6px 9px; color: #52605a; font-size: 10px; font-weight: 800; }
  .quarantine-content { display: grid; gap: 15px; padding: 15px 18px 18px; }
  .group-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 7px; }
  .group-heading > span:first-child { display: inline-flex; align-items: center; gap: 6px; color: #37443f; font-size: 11px; }
  .count { display: inline-grid; min-width: 24px; height: 22px; place-items: center; border-radius: 7px; font-family: var(--font-mono); font-size: 10px; font-weight: 800; }
  .fail-count { background: #ffe2e0; color: #a3262b; }
  .flaky-count { background: #fff0c3; color: #825007; }
  ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
  li button { display: flex; width: 100%; min-height: 36px; align-items: center; justify-content: space-between; gap: 9px; border: 0; border-radius: 8px; background: transparent; padding: 6px 7px; color: #3d4b45; text-align: left; transition: background-color 150ms ease, transform 120ms ease; }
  li button:hover { background: #f0f5f2; }
  li button:active { transform: scale(.995); }
  li button > span:first-child { max-width: 75%; overflow: hidden; font-size: 9px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
  .empty-list { display: flex; min-height: 42px; align-items: center; gap: 7px; border: 1px dashed #dbe3df; border-radius: 9px; padding: 9px; color: #7a8781; font-size: 10px; line-height: 1.35; }
  .correlation { border-top: 1px solid #e2e8e4; padding-top: 14px; }
  .correlation-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
  .correlation-heading div { display: flex; flex-direction: column; }
  .correlation-heading strong { color: #35423d; font-size: 11px; }
  .correlation-heading div span { margin-top: 2px; color: #7b8782; font-size: 9px; }
  .correlation-grid { display: grid; gap: 6px; }
  .correlation-row { display: grid; grid-template-columns: 108px 1fr 15px; align-items: center; gap: 7px; color: #617069; font-size: 9px; }
  .correlation-row > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .correlation-row i { height: 5px; overflow: hidden; border-radius: 99px; background: #e7ece9; }
  .correlation-row b { display: block; height: 100%; min-width: 2px; border-radius: inherit; background: #d69a17; transition: width 260ms ease; }
  .correlation-row > strong { text-align: right; }
  :global(.dark) .panel-header, :global(.dark) .correlation { border-color: #30403a; }
  :global(.dark) .total-count { background: #2a3732; color: #bec9c4; }
  :global(.dark) .group-heading > span:first-child,
  :global(.dark) .correlation-heading strong { color: #e2e9e5; }
  :global(.dark) li button { color: #cdd6d2; }
  :global(.dark) li button:hover { background: #24332e; }
  :global(.dark) .empty-list { border-color: #394842; color: #9da9a4; }
  :global(.dark) .fail-count { background: #47282b; color: #f5aaab; }
  :global(.dark) .flaky-count { background: #40351e; color: #f3ce6c; }
  :global(.dark) .correlation-row i { background: #31403a; }
</style>
