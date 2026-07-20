<script lang="ts">
  import {
    CaretDown, CheckCircle, XCircle, CircleNotch, Circle, NotePencil,
    Flask, Trash
  } from 'phosphor-svelte';
  import type { GateRecord } from '../contracts';
  import { consoleStore } from '../console-store.svelte';
  import NoteForm from './NoteForm.svelte';

  let { gate }: { gate: GateRecord } = $props();

  const expanded = $derived(consoleStore.expandedGates.has(gate.id));
  const recordedGate = $derived(consoleStore.selectedStage.gates.find((item) => item.id === gate.id)!);
  const simulated = $derived(gate.state !== recordedGate.state);
  const rerunStatus = $derived(
    consoleStore.rerun.active &&
    consoleStore.rerun.runId === consoleStore.selectedRun.id &&
    consoleStore.rerun.stageName === consoleStore.selectedStage.name
      ? consoleStore.rerun.gateStatuses[gate.id]
      : null
  );
  const visualState = $derived(rerunStatus === 'pass' || rerunStatus === 'fail' ? rerunStatus : gate.state);

  function stateLabel() {
    if (rerunStatus === 'pending') return 'Pending';
    if (rerunStatus === 'running') return 'Running';
    return visualState === 'pass' ? 'Pass' : 'Fail';
  }
</script>

<article class="gate-row" class:expanded class:simulated>
  <div class="gate-line">
    <button
      type="button"
      class="gate-disclosure"
      aria-expanded={expanded}
      aria-controls={`gate-evidence-${gate.id}`}
      onclick={() => consoleStore.toggleGateExpanded(gate.id)}
    >
      <CaretDown class={expanded ? 'rotated' : ''} size={16} weight="bold" />
      <span class="gate-identity">
        <span class="gate-topline">
          <code>{gate.id}</code>
          <span class={`severity severity-${gate.severity}`}>{gate.severity}</span>
          {#if simulated}<span class="sim-marker"><Flask size={12} weight="fill" /> Simulated</span>{/if}
        </span>
        <strong>{gate.name}</strong>
      </span>
    </button>

    <button
      type="button"
      class={`gate-state ${visualState}`}
      class:interactive={consoleStore.whatIf.active}
      disabled={!consoleStore.whatIf.active || Boolean(rerunStatus)}
      aria-label={`${gate.id} ${stateLabel()}${consoleStore.whatIf.active ? '; flip simulated state' : ''}`}
      onclick={() => consoleStore.flipSimulatedState(gate.id)}
    >
      {#if rerunStatus === 'running'}
        <CircleNotch class="spin" size={18} weight="bold" />
      {:else if rerunStatus === 'pending'}
        <Circle size={18} />
      {:else if visualState === 'pass'}
        <CheckCircle size={18} weight="fill" />
      {:else}
        <XCircle size={18} weight="fill" />
      {/if}
      <span>{stateLabel()}</span>
    </button>
  </div>

  <div id={`gate-evidence-${gate.id}`} class="evidence-grid" class:open={expanded} aria-hidden={!expanded}>
    <div class="evidence-inner">
      <div class="evidence-copy">
        <span class="evidence-label">Recorded evidence</span>
        <p>{recordedGate.evidence}</p>
      </div>

      {#if recordedGate.notes.length}
        <div class="notes-list" aria-label={`${gate.id} notes`}>
          <span class="evidence-label">Gate notes · {recordedGate.notes.length}</span>
          {#each recordedGate.notes as note, noteIndex}
            <div class="note-item">
              <div><span>{note.category}</span><p>{note.text}</p></div>
              <button type="button" aria-label={`Remove note ${noteIndex + 1} from ${gate.id}`} onclick={() => consoleStore.deleteNote(gate.id, noteIndex)}>
                <Trash size={15} />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      {#if consoleStore.noteFormGateId === gate.id}
        <NoteForm gateId={gate.id} />
      {:else}
        <button type="button" class="add-note" data-add-note={gate.id} onclick={() => consoleStore.openNoteForm(gate.id)}>
          <NotePencil size={15} weight="bold" /> Add note
        </button>
      {/if}
    </div>
  </div>
</article>

<style>
  .gate-row { background:white; border-bottom:1px solid #e0e6ee; transition:background-color .18s, box-shadow .18s; }
  .gate-row:first-child { border-radius:.7rem .7rem 0 0; }
  .gate-row:last-child { border-bottom:0; border-radius:0 0 .7rem .7rem; }
  .gate-row:hover { background:#f8fbfd; }
  .gate-row.expanded { background:#fbfdff; box-shadow:inset 3px 0 #52c8dc; }
  .gate-row.simulated { box-shadow:inset 3px 0 #8b64d9; }
  :global(.dark) .gate-row { background:#0e1c2d; border-color:#25384c; }
  :global(.dark) .gate-row:hover, :global(.dark) .gate-row.expanded { background:#122238; }
  .gate-line { display:flex; align-items:stretch; min-height:4.1rem; }
  .gate-disclosure { flex:1; min-width:0; display:flex; align-items:center; gap:.7rem; padding:.7rem .8rem; text-align:left; color:inherit; background:transparent; border:0; cursor:pointer; }
  .gate-disclosure :global(svg) { flex:none; color:#76869a; transition:transform .2s ease; }
  .gate-disclosure :global(svg.rotated) { transform:rotate(180deg); }
  .gate-identity { min-width:0; display:flex; flex-direction:column; gap:.2rem; }
  .gate-identity strong { font-size:.78rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .gate-topline { display:flex; align-items:center; flex-wrap:wrap; gap:.4rem; }
  code { color:#63748b; font:600 .66rem var(--font-mono); letter-spacing:.025em; }
  :global(.dark) code { color:#9db0c6; }
  .severity { border:1px solid; border-radius:.28rem; padding:.08rem .3rem; font-size:.55rem; font-weight:850; }
  .sim-marker { display:inline-flex; align-items:center; gap:.2rem; color:#7651be; background:#f0eafd; border:1px solid #c9b4ef; border-radius:999px; padding:.08rem .36rem; font-size:.55rem; font-weight:800; text-transform:uppercase; letter-spacing:.035em; }
  :global(.dark) .sim-marker { color:#c3a7ff; background:#261b3c; border-color:#5d4684; }
  .gate-state { align-self:center; flex:none; display:flex; align-items:center; gap:.34rem; min-width:5.4rem; margin-right:.7rem; padding:.4rem .55rem; border-radius:.5rem; border:1px solid; background:transparent; font-size:.65rem; font-weight:800; text-transform:uppercase; }
  .gate-state.pass { color:#16845e; border-color:#a1d8c4; background:#ebf9f4; }
  .gate-state.fail { color:#c73c4f; border-color:#efabb5; background:#fff2f3; }
  .gate-state.interactive { cursor:pointer; box-shadow:0 3px 8px rgba(32,44,65,.08); }
  .gate-state:disabled { opacity:1; }
  :global(.dark) .gate-state.pass { color:#44d4a2; border-color:#286b56; background:#0d3029; }
  :global(.dark) .gate-state.fail { color:#ff8290; border-color:#763b49; background:#341a23; }
  .spin { animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .evidence-grid { display:grid; grid-template-rows:0fr; opacity:0; transition:grid-template-rows .24s ease, opacity .2s ease; }
  .evidence-grid.open { grid-template-rows:1fr; opacity:1; }
  .evidence-inner { min-height:0; overflow:hidden; padding:0 1rem 0 2.65rem; }
  .evidence-grid.open .evidence-inner { padding-bottom:.9rem; }
  .evidence-copy { border-left:2px solid #cfdae6; padding-left:.7rem; }
  :global(.dark) .evidence-copy { border-color:#38516b; }
  .evidence-label { display:block; color:#718096; font-size:.57rem; font-weight:850; letter-spacing:.075em; text-transform:uppercase; }
  .evidence-copy p { margin:.25rem 0 0; color:#586a80; font-size:.7rem; line-height:1.55; }
  :global(.dark) .evidence-copy p { color:#a4b3c5; }
  .notes-list { margin-top:.85rem; }
  .note-item { display:flex; align-items:flex-start; justify-content:space-between; gap:.7rem; margin-top:.4rem; padding:.55rem .65rem; background:#f3f6fa; border:1px solid #dbe4ee; border-radius:.5rem; }
  :global(.dark) .note-item { background:#091625; border-color:#263b51; }
  .note-item span { color:#7a529c; font-size:.57rem; font-weight:850; text-transform:uppercase; letter-spacing:.05em; }
  .note-item p { margin:.15rem 0 0; font-size:.7rem; line-height:1.45; }
  .note-item button { flex:none; display:grid; place-items:center; color:#8c5261; background:transparent; border:0; border-radius:.35rem; width:1.7rem; height:1.7rem; cursor:pointer; }
  .note-item button:hover { background:#ffe8ec; color:#c33349; }
  .add-note { display:inline-flex; align-items:center; gap:.36rem; margin-top:.75rem; padding:.35rem .5rem; color:#147f91; background:transparent; border:0; border-radius:.4rem; font-size:.68rem; font-weight:800; cursor:pointer; }
  .add-note:hover { background:#e9f7f9; }
  :global(.dark) .add-note { color:#62d2e4; }
  :global(.dark) .add-note:hover { background:#11303a; }
  @media (max-width:520px) {
    .gate-state { min-width:44px; min-height:44px; justify-content:center; margin-right:.45rem; }
    .gate-state span { display:none; }
    .gate-disclosure { padding-left:.55rem; gap:.45rem; min-height:44px; }
    .evidence-inner { padding-left:2rem; padding-right:.65rem; }
    .add-note { min-height:44px; min-width:44px; justify-content:center; }
  }
</style>
