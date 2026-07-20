<script lang="ts">
  import { Certificate, LockKey, XCircle, Hourglass, ArrowRight } from 'phosphor-svelte';
  import { consoleStore } from '../console-store.svelte';
</script>

<section class="chain-section surface" aria-labelledby="chain-title">
  <div class="section-heading">
    <div>
      <span class="eyebrow">Certificate chain</span>
      <h3 id="chain-title">Pipeline trust path</h3>
    </div>
    <span class="chain-count">{consoleStore.selectedRun.stages.filter((stage) => stage.certificate).length}/5 issued</span>
  </div>

  <div class="chain-scroll">
    <div class="chain" aria-label="Five-stage certificate chain">
      {#each consoleStore.selectedRun.stages as stage, index}
        {@const status = stage.status}
        <button
          type="button"
          class={`chain-node status-${status}`}
          class:clickable={status === 'passed'}
          disabled={status !== 'passed'}
          aria-label={`${stage.name}: ${status}${status === 'passed' ? ', open certificate' : ''}`}
          onclick={() => consoleStore.openCertificate(stage.name)}
        >
          <span class="node-icon status-pill">
            {#if status === 'passed'}<Certificate size={20} weight="fill" />
            {:else if status === 'rejected'}<XCircle size={20} weight="fill" />
            {:else if status === 'running'}<Hourglass size={20} weight="fill" />
            {:else}<LockKey size={20} />{/if}
          </span>
          <span class="node-stage">{stage.name}</span>
          <span class="node-status">{status}</span>
        </button>
        {#if index < consoleStore.selectedRun.stages.length - 1}
          {@const next = consoleStore.selectedRun.stages[index + 1]}
          <div
            class="chain-link"
            class:intact={stage.status === 'passed' && next.status === 'passed'}
            class:broken={stage.status === 'rejected' || next.status === 'rejected'}
            class:waiting={stage.status !== 'passed' || next.status !== 'passed'}
            aria-label={stage.status === 'passed' && next.status === 'passed' ? 'intact link' : 'broken or pending link'}
          >
            <span></span><ArrowRight size={16} weight="bold" />
          </div>
        {/if}
      {/each}
    </div>
  </div>
</section>

<style>
  .chain-section { border-radius:.85rem; padding:1rem; }
  .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; margin-bottom:.85rem; }
  .eyebrow { color:#208a9a; font-size:.57rem; font-weight:850; letter-spacing:.09em; text-transform:uppercase; }
  h3 { margin:.12rem 0 0; font-size:.94rem; }
  .chain-count { color:#728196; font:600 .64rem var(--font-mono); }
  .chain-scroll { overflow-x:auto; padding:.2rem .1rem .5rem; }
  .chain { min-width:690px; display:flex; align-items:center; justify-content:space-between; }
  .chain-node { width:92px; flex:none; display:flex; flex-direction:column; align-items:center; color:inherit; background:transparent; border:0; border-radius:.6rem; padding:.35rem .2rem; }
  .chain-node.clickable { cursor:pointer; transition:background-color .18s, transform .16s; }
  .chain-node.clickable:hover { background:rgba(75,148,162,.09); transform:translateY(-2px); }
  .node-icon { display:grid; place-items:center; width:2.4rem; height:2.4rem; border-radius:.65rem; }
  .node-stage { margin-top:.35rem; font-size:.64rem; font-weight:800; white-space:nowrap; }
  .node-status { margin-top:.08rem; color:var(--status); font-size:.54rem; font-weight:750; text-transform:uppercase; letter-spacing:.05em; }
  .chain-link { flex:1; min-width:40px; display:flex; align-items:center; color:#8798aa; }
  .chain-link span { flex:1; height:2px; background:currentColor; }
  .chain-link.intact { color:#20a777; }
  .chain-link.broken { color:#df475a; }
  .chain-link.broken span, .chain-link.waiting span { height:0; border-top:2px dashed currentColor; background:transparent; }
  .chain-link.waiting:not(.broken) { color:#8898aa; opacity:.72; }
</style>
