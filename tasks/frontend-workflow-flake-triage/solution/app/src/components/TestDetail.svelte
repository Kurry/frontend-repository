<script lang="ts">
  import { IconActivityHeartbeat, IconPlayerStopFilled, IconRefresh, IconSparkles } from '@tabler/icons-svelte';
  import { fly } from 'svelte/transition';
  import { triage } from '../lib/triage.svelte';
  import { motion } from '../lib/motion.svelte';
  import { divergentIndexes, divergenceFor, verdictFor } from '../lib/types';
  import RunMatrix from './RunMatrix.svelte';
  import VerdictChip from './VerdictChip.svelte';
  import RerunForm from './RerunForm.svelte';

  let rerunTrigger: HTMLButtonElement | undefined = $state();

  const conditionValue: Record<string, string> = {
    'CPU quota': '750m → 500m',
    'terminal size': '120×40 → 80×24',
    hostname: 'ci-node-07',
    timezone: 'UTC → Pacific/Chatham',
    'temp-dir length': '18 → 96 chars',
    'parallel execution': '1 → 8 workers',
  };

  function openRerunFromDetail() {
    triage.openRerun(triage.selectedTestId, rerunTrigger ?? null);
  }
</script>

<section class="card-panel detail-panel" id="test-detail" aria-labelledby="detail-title" tabindex="-1">
  {#if triage.selectedTest}
    {@const test = triage.selectedTest}
    {@const verdict = verdictFor(test.runs)}
    {@const diverged = divergentIndexes(test.runs)}
    {@const rerun = triage.rerunFor(test.id)}
    {@const progress = rerun ? (rerun.completed.length / rerun.runCount) * 100 : 0}
    <div class="detail-header">
      <div>
        <span class="eyebrow">Selected test</span>
        <h2 class="panel-title" id="detail-title">Test detail</h2>
      </div>
      <VerdictChip {verdict} />
    </div>
    <div class="detail-body">
      <p class="test-id mono">{test.id}</p>
      <div class="matrix-block">
        <div class="block-label"><span>Current five-run matrix</span><span>{divergenceFor(test.runs)} divergent</span></div>
        <RunMatrix runs={test.runs} size="large" label={`Five run matrix for ${test.id}`} animateIndex={rerun?.completed.length ? ((rerun.completed.length - 1) % 5) + 1 : 0} />
      </div>

      {#if verdict === 'flaky'}
        <div class="insight-callout">
          <IconSparkles size={16} aria-hidden="true" />
          <span><strong>{diverged.size} minority {diverged.size === 1 ? 'run' : 'runs'}</strong> isolate the likely condition trigger.</span>
        </div>
      {/if}

      <div class="schedule-heading">
        <div>
          <h3>Condition schedule</h3>
          <p>One varied environment condition per run</p>
        </div>
        <span class="reason-tag mono">{test.reason}</span>
      </div>
      <ol class="schedule-list">
        {#each test.runs as run (run.index)}
          <li class:divergent={verdict === 'flaky' && diverged.has(run.index)}>
            <span class="run-number mono">{run.index}</span>
            <span class="condition">
              <strong>{run.condition}</strong>
              <small class="mono">{conditionValue[run.condition]}</small>
            </span>
            {#if verdict === 'flaky' && diverged.has(run.index)}<span class="minority">Minority</span>{/if}
            <span class:pass={run.result === 'pass'} class:fail={run.result === 'fail'} class="result">{run.result}</span>
          </li>
        {/each}
      </ol>

      {#if rerun}
        <div class="run-progress" aria-live="polite">
          <div class="progress-heading">
            <span><IconActivityHeartbeat size={16} /> Re-run {rerun.status}</span>
            <span class="mono">{rerun.completed.length} / {rerun.runCount}</span>
          </div>
          <div class="progress-track" aria-label={`Re-run progress ${rerun.completed.length} of ${rerun.runCount}`} role="progressbar" aria-valuemin={0} aria-valuemax={rerun.runCount} aria-valuenow={rerun.completed.length}>
            <div class="progress-fill" style={`width: ${progress}%`}></div>
          </div>
          <ol class="ticker" aria-label="Re-run results">
            {#each rerun.completed as run (run.index)}
              <li class:pass={run.result === 'pass'} class:fail={run.result === 'fail'} in:fly={{ y: 8, duration: motion.reduced ? 0 : 200 }}>
                <span class="mono">{run.index}</span>
                <span>{run.condition}</span>
                <strong>{run.result}</strong>
              </li>
            {/each}
            {#each Array(rerun.runCount - rerun.completed.length) as _, index}
              <li class="pending"><span class="mono">{rerun.completed.length + index + 1}</span><span>Waiting for result</span></li>
            {/each}
          </ol>
          {#if rerun.status === 'running'}
            <button class="action-btn danger stop-button" type="button" onclick={() => triage.stopRerun(test.id)}>
              <IconPlayerStopFilled size={14} /> Stop run
            </button>
          {:else}
            <p class="run-status">{rerun.status === 'stopped' ? 'Completed results are frozen; remaining runs will not fill in.' : 'All requested runs completed and the five-cell matrix is current.'}</p>
          {/if}
        </div>
      {/if}

      <RerunForm testId={test.id} open={triage.openRerunTestId === test.id} />
      <button
        bind:this={rerunTrigger}
        class="action-btn primary rerun-action"
        type="button"
        data-rerun-opener="true"
        aria-expanded={triage.openRerunTestId === test.id}
        onclick={openRerunFromDetail}
        disabled={rerun?.status === 'running'}
      >
        <IconRefresh size={15} /> {triage.openRerunTestId === test.id ? 'Re-run form open' : rerun?.status === 'running' ? 'Re-run in progress' : 'Start re-run'}
      </button>
    </div>
  {:else}
    <div class="detail-empty">
      <IconActivityHeartbeat size={25} />
      <strong>Select a test</strong>
      <span>Its five-run condition schedule and re-run controls will appear here.</span>
    </div>
  {/if}
</section>

<style>
  .detail-panel { overflow: hidden; }
  .detail-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 19px 18px 15px; border-bottom: 1px solid #e2e8e4; }
  .detail-header h2 { margin: 2px 0 0; }
  .detail-body { padding: 17px 18px 19px; }
  .test-id { margin: 0 0 15px; color: #24322d; font-size: 13px; font-weight: 760; line-height: 1.45; word-break: break-word; }
  .matrix-block { border: 1px solid #e1e7e3; border-radius: 12px; background: #f9fbf9; padding: 11px; }
  .block-label { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: #6c7974; font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
  .insight-callout { display: flex; align-items: flex-start; gap: 8px; margin-top: 11px; border-radius: 10px; background: #fff4d3; padding: 10px; color: #80510d; font-size: 11px; line-height: 1.45; }
  .schedule-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 20px 0 9px; }
  .schedule-heading h3 { margin: 0; color: #27342f; font-size: 13px; }
  .schedule-heading p { margin: 2px 0 0; color: #7a8782; font-size: 10px; }
  .reason-tag { max-width: 165px; overflow: hidden; border: 1px solid #dbe3de; border-radius: 7px; background: #f7f9f7; padding: 5px 7px; color: #50605a; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .schedule-list, .ticker { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; }
  .schedule-list li { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto auto; align-items: center; gap: 8px; min-height: 45px; border: 1px solid #e2e7e4; border-radius: 9px; padding: 6px 8px; transition: background-color 150ms ease, border-color 150ms ease; }
  .schedule-list li.divergent { border-color: #e6bb4f; background: #fff8df; box-shadow: inset 3px 0 0 #d99a0b; }
  .run-number { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 6px; background: #edf1ee; color: #53615b; font-size: 10px; font-weight: 800; }
  .condition { display: flex; min-width: 0; flex-direction: column; gap: 1px; }
  .condition strong { overflow: hidden; color: #34413c; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .condition small { overflow: hidden; color: #85918c; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
  .minority { border-radius: 5px; background: #f4d982; padding: 3px 5px; color: #74500d; font-size: 8px; font-weight: 800; text-transform: uppercase; }
  .result { min-width: 37px; border-radius: 6px; padding: 4px 5px; font-size: 9px; font-weight: 850; text-align: center; text-transform: uppercase; }
  .result.pass { background: #ddf2e9; color: #08614f; }
  .result.fail { background: #ffe1df; color: #a4262b; }
  .run-progress { margin-top: 14px; border: 1px solid #d7e3dd; border-radius: 12px; background: #f7faf8; padding: 12px; }
  .progress-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #4d5c56; font-size: 11px; font-weight: 800; text-transform: capitalize; }
  .progress-heading span { display: inline-flex; align-items: center; gap: 6px; }
  .progress-track { width: 100%; height: 8px; margin: 9px 0 10px; overflow: hidden; border-radius: 99px; background: #dfe7e2; }
  .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #087f6d, #19a78f); transition: width 480ms cubic-bezier(.22,.61,.36,1); }
  .ticker { max-height: 172px; overflow-y: auto; }
  .ticker li { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: center; gap: 6px; min-height: 27px; border-radius: 7px; padding: 4px 7px; font-size: 9px; }
  .ticker li.pass { background: #e4f4ed; color: #0b6653; }
  .ticker li.fail { background: #ffe7e5; color: #a72c30; }
  .ticker li.pending { border: 1px dashed #dce3df; color: #929c98; }
  .ticker strong { text-transform: uppercase; }
  .stop-button, .rerun-action { width: 100%; margin-top: 11px; }
  .run-status { margin: 9px 0 0; color: #6d7a75; font-size: 10px; line-height: 1.45; }
  .detail-empty { display: flex; min-height: 360px; align-items: center; justify-content: center; flex-direction: column; gap: 7px; padding: 28px; color: #74817c; text-align: center; font-size: 12px; }
  .detail-empty strong { color: #2a3732; font-size: 14px; }
  :global(.dark) .detail-header,
  :global(.dark) .matrix-block,
  :global(.dark) .schedule-list li,
  :global(.dark) .run-progress { border-color: #30403a; }
  :global(.dark) .test-id,
  :global(.dark) .schedule-heading h3,
  :global(.dark) .condition strong { color: #e5ece8; }
  :global(.dark) .matrix-block,
  :global(.dark) .run-progress { background: #17211e; }
  :global(.dark) .schedule-list li.divergent { border-color: #76632f; background: #3a331f; }
  :global(.dark) .progress-track { background: #31403a; }
  :global(.dark) .result.pass, :global(.dark) .ticker li.pass { background: #193e34; color: #8be0c0; }
  :global(.dark) .result.fail, :global(.dark) .ticker li.fail { background: #47282b; color: #f5aaab; }
</style>
