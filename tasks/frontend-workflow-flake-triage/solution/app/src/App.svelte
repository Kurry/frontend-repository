<script lang="ts">
  import { onMount } from 'svelte';
  import { IconActivity, IconAlertTriangle, IconCircleCheck, IconFlask2 } from '@tabler/icons-svelte';
  import { triage } from './lib/triage.svelte';
  import { registerWebMcpTools } from './lib/webmcp';
  import { verdictFor } from './lib/types';
  import AppHeader from './components/AppHeader.svelte';
  import TestQueue from './components/TestQueue.svelte';
  import TestDetail from './components/TestDetail.svelte';
  import QuarantineMap from './components/QuarantineMap.svelte';
  import AuditTimeline from './components/AuditTimeline.svelte';
  import ExportDrawer from './components/ExportDrawer.svelte';
  import ImportDialog from './components/ImportDialog.svelte';
  import ToastViewport from './components/ToastViewport.svelte';

  let exportTrigger = $state<HTMLButtonElement>();
  let importTrigger = $state<HTMLButtonElement>();

  $effect(() => {
    document.documentElement.classList.toggle('dark', triage.theme === 'dark');
    document.documentElement.dataset.theme = 'cerberus';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', triage.theme === 'dark' ? '#111815' : '#f5f7f3');
  });

  onMount(() => {
    window.__triageStore = triage;
    registerWebMcpTools();
  });
</script>

<AppHeader bind:exportTrigger bind:importTrigger />

<main class="app-shell">
  <section class="hero" aria-labelledby="page-title">
    <div class="hero-copy">
      <span class="eyebrow">Generated suite operations</span>
      <h1 id="page-title">Test determinism triage</h1>
      <p>Inspect five controlled runs, classify the source, and produce a session-accurate quarantine report.</p>
    </div>
    <div class="summary-cards" aria-label="Active suite summary">
      <div class="summary-card keep"><span><IconCircleCheck size={15} /> Keep</span><strong>{triage.keepCount}</strong></div>
      <div class="summary-card flaky"><span><IconFlask2 size={15} /> Flaky</span><strong>{triage.flakyTests.length}</strong></div>
      <div class="summary-card fail"><span><IconAlertTriangle size={15} /> All-fail</span><strong>{triage.allFailTests.length}</strong></div>
    </div>
  </section>

  <nav class="suite-rail" aria-label="Test suites">
    {#each triage.suites as suite}
      <button class:active={triage.selectedSuiteId === suite.id} type="button" aria-current={triage.selectedSuiteId === suite.id ? 'page' : undefined} onclick={() => triage.selectSuite(suite.id)}>
        <span class="suite-icon"><IconActivity size={16} /></span>
        <span><strong>{suite.name}</strong><small>{suite.subtitle}</small></span>
        <em class="mono">{suite.tests.length}</em>
      </button>
    {/each}
  </nav>

  <div class="workspace-grid">
    <TestQueue />
    <aside class="side-stack" aria-label="Selected test and quarantine panels">
      <TestDetail />
      <QuarantineMap />
    </aside>
    <div class="audit-slot"><AuditTimeline /></div>
  </div>

  <footer class="app-footer">
    <span>In-memory session · reload restores seeded state</span>
    <span class="mono">flake-triage-report-v1</span>
  </footer>
</main>

{#if triage.exportOpen}
  <ExportDrawer returnFocus={exportTrigger} />
{/if}
<ImportDialog returnFocus={importTrigger} />
<ToastViewport />

<style>
  .hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; padding: 34px 4px 23px; }
  .hero-copy { max-width: 720px; }
  h1 { margin: 5px 0 0; color: #17201d; font-size: clamp(28px, 3.5vw, 46px); font-weight: 830; letter-spacing: -.052em; line-height: 1.04; }
  .hero-copy p { max-width: 680px; margin: 11px 0 0; color: #65736d; font-size: 13px; line-height: 1.55; }
  .summary-cards { display: grid; grid-template-columns: repeat(3, 92px); gap: 7px; }
  .summary-card { display: flex; min-height: 66px; justify-content: space-between; flex-direction: column; border: 1px solid #dfe6e2; border-radius: 13px; background: rgba(255,255,255,.78); padding: 10px 11px; box-shadow: 0 5px 18px rgba(31,52,44,.04); }
  .summary-card span { display: flex; align-items: center; gap: 5px; color: #6b7872; font-size: 9px; font-weight: 800; text-transform: uppercase; }
  .summary-card strong { color: #26332e; font-family: var(--font-mono); font-size: 22px; line-height: 1; }
  .summary-card.keep { border-top-color: #61b89c; }
  .summary-card.flaky { border-top-color: #e5ae35; }
  .summary-card.fail { border-top-color: #e07173; }
  .suite-rail { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
  .suite-rail button { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: 9px; min-width: 0; border: 1px solid #dce4df; border-radius: 13px; background: rgba(255,255,255,.72); padding: 9px 10px; color: #5b6963; text-align: left; transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 100ms ease; }
  .suite-rail button:hover { border-color: #b9c8c1; background: #fff; box-shadow: 0 6px 18px rgba(32,54,46,.06); }
  .suite-rail button:active { transform: translateY(1px); }
  .suite-rail button.active { border-color: #8fcab8; background: #eef8f4; box-shadow: inset 0 0 0 1px rgba(8,127,109,.08); }
  .suite-icon { display: inline-grid; width: 32px; height: 32px; place-items: center; border-radius: 9px; background: #e9f0ec; color: #5e6e67; }
  .suite-rail button.active .suite-icon { background: #d4eee4; color: #087f6d; }
  .suite-rail button > span:nth-child(2) { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
  .suite-rail strong, .suite-rail small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .suite-rail strong { color: #2c3934; font-size: 11px; }
  .suite-rail small { color: #818d88; font-size: 8px; }
  .suite-rail em { border-radius: 6px; background: #edf2ef; padding: 4px 6px; color: #63716a; font-size: 9px; font-style: normal; font-weight: 800; }
  .workspace-grid { display: grid; grid-template-columns: minmax(0, 1.72fr) minmax(340px, .72fr); align-items: start; gap: 12px; }
  .side-stack { display: grid; min-width: 0; gap: 12px; }
  .audit-slot { grid-column: 1 / -1; min-width: 0; }
  .app-footer { display: flex; justify-content: space-between; gap: 16px; padding: 18px 4px 0; color: #85908c; font-size: 9px; }
  :global(.dark) h1 { color: #f1f5f3; }
  :global(.dark) .hero-copy p { color: #a0aca6; }
  :global(.dark) .summary-card, :global(.dark) .suite-rail button { border-color: #2f3e39; background: rgba(27,38,34,.8); }
  :global(.dark) .summary-card strong, :global(.dark) .suite-rail strong { color: #e5ece8; }
  :global(.dark) .suite-rail button:hover { border-color: #4c6058; background: #202d28; }
  :global(.dark) .suite-rail button.active { border-color: #297e69; background: #19342c; }
  :global(.dark) .suite-icon, :global(.dark) .suite-rail em { background: #293630; color: #b5c0bb; }
  :global(.dark) .suite-rail button.active .suite-icon { background: #205043; color: #83d7ba; }
  @media (max-width: 1080px) {
    .workspace-grid { grid-template-columns: minmax(0, 1.4fr) minmax(320px, .8fr); }
    .summary-cards { grid-template-columns: repeat(3, 78px); }
  }
  @media (max-width: 767px) {
    .hero { align-items: stretch; flex-direction: column; gap: 18px; padding: 25px 3px 18px; }
    .summary-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .suite-rail { display: grid; grid-template-columns: 1fr; overflow: visible; padding-bottom: 2px; }
    .suite-rail button { min-width: 0; }
    .workspace-grid { grid-template-columns: minmax(0, 1fr); }
    .audit-slot { grid-column: 1; }
    .side-stack { grid-row: auto; }
  }
  @media (max-width: 420px) {
    h1 { font-size: 29px; }
    .summary-card { min-height: 60px; padding: 9px; }
    .summary-card span { font-size: 8px; }
    .summary-card strong { font-size: 19px; }
    .app-footer { flex-direction: column; }
  }
</style>
