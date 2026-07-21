<script lang="ts">
  import { CheckCircle, XCircle, CircleNotch, Circle } from 'phosphor-svelte';
  import type { RunRecord, StageStatus } from '../contracts';
  import { consoleStore } from '../console-store.svelte';

  let { run, compact = false, interactive = true }: { run: RunRecord; compact?: boolean; interactive?: boolean } = $props();

  function statusFor(stageName: string, recorded: StageStatus): StageStatus {
    if (run.id === consoleStore.selectedRun.id && stageName === consoleStore.selectedStage.name && consoleStore.whatIf.active) {
      return consoleStore.displayedStageStatus;
    }
    return recorded;
  }
</script>

<div class:compact class="stage-strip" aria-label={`Five stage status strip for ${run.id}`}>
  {#each run.stages as stage, stageIndex}
    {@const status = statusFor(stage.name, stage.status)}
    <button
      type="button"
      class={`stage-segment status-${status}`}
      class:selected={interactive && run.id === consoleStore.selectedRun.id && stage.name === consoleStore.selectedStage.name}
      disabled={!interactive}
      aria-label={`${stageIndex + 1}. ${stage.name}: ${status}`}
      onclick={() => interactive && consoleStore.selectStage(stage.name)}
    >
      <span class="stage-icon">
        {#if status === 'passed'}<CheckCircle size={compact ? 13 : 16} weight="fill" />
        {:else if status === 'rejected'}<XCircle size={compact ? 13 : 16} weight="fill" />
        {:else if status === 'running'}<CircleNotch class="spin" size={compact ? 13 : 16} weight="bold" />
        {:else}<Circle size={compact ? 13 : 16} />{/if}
      </span>
      <span>{stage.name}</span>
    </button>
  {/each}
</div>

<style>
  .stage-strip { width:100%; min-width:0; display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:.35rem; }
  .stage-segment { position:relative; display:flex; align-items:center; gap:.38rem; min-height:2.8rem; min-width:0; padding:.5rem .45rem; color:var(--status); background:var(--status-bg); border:1px solid var(--status-border); border-radius:.55rem; font-size:.62rem; font-weight:800; cursor:pointer; transition:transform .15s ease, filter .09s ease, box-shadow .09s ease; }
  .stage-segment > span:last-child { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .stage-segment:not(:disabled):hover { filter:brightness(.98); box-shadow:0 4px 12px rgba(30,45,70,.1); transform:translateY(-1px); }
  .stage-segment.selected::after { content:""; position:absolute; left:.55rem; right:.55rem; bottom:.2rem; height:2px; border-radius:2px; background:var(--status); }
  .stage-icon { flex:none; display:grid; place-items:center; }
  .spin { animation:spin .85s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .compact { min-width:0; gap:.22rem; }
  .compact .stage-segment { min-width:0; min-height:1.85rem; justify-content:center; padding:.28rem .22rem; border-radius:.35rem; }
  .compact .stage-segment span:last-child { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  @media (max-width:700px) {
    .stage-strip:not(.compact) {
      display:flex;
      overflow-x:auto;
      gap:.35rem;
      padding-bottom:.15rem;
      scroll-snap-type:x proximity;
    }
    .stage-strip:not(.compact) .stage-segment {
      flex:0 0 6.5rem;
      min-width:6.5rem;
      scroll-snap-align:start;
    }
    .stage-segment { min-height:44px; font-size:.58rem; padding:.4rem .35rem; }
  }
</style>
