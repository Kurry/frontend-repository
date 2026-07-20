<script lang="ts">
  import { Funnel, X, ArrowLeft, CheckCircle, Circle } from 'phosphor-svelte';
  import { STAGE_NAMES } from '../contracts';
  import { consoleStore } from '../console-store.svelte';
</script>

<section class="registry" aria-labelledby="registry-title">
  <div class="registry-header">
    <div>
      <button type="button" class="back" onclick={() => consoleStore.activeView = 'pipeline'}>
        <ArrowLeft size={16} weight="bold" /> Run detail
      </button>
      <span class="eyebrow">Policy catalog</span>
      <h2 id="registry-title">Gate registry</h2>
      <p>Every evaluation used across the five pipeline suites.</p>
    </div>
    <div class="filter-block">
      <label for="severity-filter"><Funnel size={14} /> Severity filter</label>
      <select id="severity-filter" bind:value={consoleStore.severityFilter}>
        <option value="all">All severities</option>
        <option value="S1">S1 · hard gates</option>
        <option value="S2">S2 · required</option>
        <option value="S3">S3 · advisory</option>
      </select>
      {#if consoleStore.severityFilter !== 'all'}
        <button type="button" class="clear-filter" onclick={() => consoleStore.severityFilter = 'all'}>
          <X size={13} weight="bold" /> Clear filter
        </button>
      {/if}
    </div>
  </div>

  <div class="registry-layout">
    <div class="registry-list surface" aria-label="Registered gates">
      {#if consoleStore.registryGates.length}
        {#each consoleStore.registryGates as gate}
          <button
            type="button"
            class:selected={gate.id === consoleStore.selectedRegistryGateId}
            onclick={() => consoleStore.selectedRegistryGateId = gate.id}
          >
            <span class="row-top"><code>{gate.id}</code><span class={`severity severity-${gate.severity}`}>{gate.severity}</span></span>
            <strong>{gate.name}</strong>
            <p>{gate.description}</p>
          </button>
        {/each}
      {:else}
        <div class="empty-state">
          <Funnel size={28} />
          <strong>No gates match this severity</strong>
          <span>Clear the filter to restore the full registry.</span>
        </div>
      {/if}
    </div>

    <aside class="registry-detail surface" aria-live="polite">
      {#if consoleStore.selectedRegistryGate}
        {@const gate = consoleStore.selectedRegistryGate}
        <div class="detail-head">
          <span class={`severity large severity-${gate.severity}`}>{gate.severity}</span>
          <code>{gate.id}</code>
        </div>
        <h3>{gate.name}</h3>
        <p>{gate.description}</p>
        <span class="stage-label">Pipeline coverage</span>
        <div class="stage-membership">
          {#each STAGE_NAMES as stage}
            <div class:included={gate.stages.includes(stage)}>
              {#if gate.stages.includes(stage)}<CheckCircle size={17} weight="fill" />{:else}<Circle size={17} />{/if}
              <span>{stage}</span>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state"><strong>Select a gate</strong><span>Its full policy description will appear here.</span></div>
      {/if}
    </aside>
  </div>
</section>

<style>
  .registry { max-width:1180px; margin:0 auto; }
  .registry-header { display:flex; align-items:flex-end; justify-content:space-between; gap:2rem; margin-bottom:1rem; }
  .back { display:none; align-items:center; gap:.35rem; padding:.3rem 0; color:#178296; background:transparent; border:0; font-size:.7rem; font-weight:800; cursor:pointer; }
  .eyebrow { color:#18879a; font-size:.6rem; font-weight:850; letter-spacing:.1em; text-transform:uppercase; }
  h2 { margin:.15rem 0 0; font-size:1.5rem; letter-spacing:-.025em; }
  .registry-header p { margin:.25rem 0 0; color:#697a90; font-size:.75rem; }
  .filter-block { display:grid; grid-template-columns:auto auto; gap:.35rem .55rem; align-items:center; }
  .filter-block label { grid-column:1 / -1; display:flex; align-items:center; gap:.3rem; color:#65768b; font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em; }
  select { min-width:12rem; padding:.5rem 2rem .5rem .55rem; color:inherit; background:white; border:1px solid #cad5e2; border-radius:.5rem; font-size:.72rem; }
  :global(.dark) select { background:#0d1b2d; border-color:#31465d; }
  .clear-filter { display:flex; align-items:center; gap:.25rem; color:#99601a; background:transparent; border:0; font-size:.65rem; font-weight:800; cursor:pointer; }
  .registry-layout { display:grid; grid-template-columns:minmax(0, 1.45fr) minmax(260px, .75fr); gap:1rem; align-items:start; }
  .registry-list, .registry-detail { border-radius:.8rem; overflow:hidden; }
  .registry-list > button { display:block; width:100%; padding:.8rem .9rem; color:inherit; text-align:left; background:transparent; border:0; border-bottom:1px solid #e1e7ef; cursor:pointer; transition:background-color .18s, box-shadow .18s; }
  .registry-list > button:last-child { border-bottom:0; }
  .registry-list > button:hover { background:#f4f8fb; }
  .registry-list > button.selected { background:#eef9fb; box-shadow:inset 3px 0 #25adc1; }
  :global(.dark) .registry-list > button { border-color:#26394d; }
  :global(.dark) .registry-list > button:hover { background:#12243a; }
  :global(.dark) .registry-list > button.selected { background:#102c37; }
  .row-top { display:flex; align-items:center; gap:.45rem; }
  code { color:#64768c; font:650 .65rem var(--font-mono); }
  :global(.dark) code { color:#a1b2c6; }
  .severity { display:inline-block; border:1px solid; border-radius:.28rem; padding:.07rem .3rem; font-size:.54rem; font-weight:850; }
  .severity.large { padding:.18rem .4rem; font-size:.62rem; }
  .registry-list strong { display:block; margin-top:.27rem; font-size:.78rem; }
  .registry-list p { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; margin:.18rem 0 0; color:#6d7d91; font-size:.68rem; }
  .registry-detail { position:sticky; top:5.25rem; padding:1rem; }
  .detail-head { display:flex; align-items:center; gap:.55rem; }
  .registry-detail h3 { margin:.65rem 0 .35rem; font-size:1.05rem; }
  .registry-detail > p { margin:0; color:#63758b; font-size:.73rem; line-height:1.6; }
  :global(.dark) .registry-detail > p { color:#9eb0c4; }
  .stage-label { display:block; margin-top:1.2rem; color:#6a7b90; font-size:.58rem; font-weight:850; text-transform:uppercase; letter-spacing:.08em; }
  .stage-membership { display:grid; gap:.35rem; margin-top:.5rem; }
  .stage-membership div { display:flex; align-items:center; gap:.45rem; padding:.48rem .55rem; color:#8795a8; background:#f5f7fa; border:1px solid #e2e8ef; border-radius:.46rem; font-size:.68rem; font-weight:700; }
  .stage-membership div.included { color:#168662; background:#eaf8f3; border-color:#a8dfcc; }
  :global(.dark) .stage-membership div { background:#0a1727; border-color:#26394e; }
  :global(.dark) .stage-membership div.included { color:#41d09e; background:#0e3029; border-color:#286b56; }
  .empty-state { min-height:12rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.35rem; padding:2rem; color:#8492a5; text-align:center; }
  .empty-state strong { color:inherit; font-size:.8rem; }
  .empty-state span { font-size:.67rem; }
  @media (max-width:760px) {
    .back { display:flex; }
    .registry-header { align-items:flex-start; flex-direction:column; gap:.8rem; }
    .registry-layout { grid-template-columns:1fr; }
    .registry-detail { position:static; order:-1; }
  }
</style>
