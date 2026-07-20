<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Moon, Sun, Database, Export, UploadSimple, GitBranch, Hash, MagnifyingGlass,
    CaretUpDown, Flask, ArrowCounterClockwise, Play, Certificate, WarningOctagon,
    CheckCircle, XCircle, CircleNotch, Circle, ShieldCheck, ListChecks, Books,
    Package, BracketsCurly
  } from 'phosphor-svelte';
  import { consoleStore } from './lib/console-store.svelte';
  import StageStrip from './lib/components/StageStrip.svelte';
  import GateRow from './lib/components/GateRow.svelte';
  import CertificateChain from './lib/components/CertificateChain.svelte';
  import EventTimeline from './lib/components/EventTimeline.svelte';
  import GateRegistry from './lib/components/GateRegistry.svelte';
  import ModalLayer from './lib/components/ModalLayer.svelte';
  import { registerWebMCP } from './lib/webmcp';

  $effect(() => {
    document.documentElement.classList.toggle('dark', consoleStore.theme === 'dark');
    document.documentElement.style.colorScheme = consoleStore.theme;
  });

  onMount(() => {
    if (!registerWebMCP()) setTimeout(registerWebMCP, 800);
  });

  const selectedRecordedGateFailures = $derived(consoleStore.selectedStage.gates.filter((gate) => gate.state === 'fail'));
  const displayedFailures = $derived(consoleStore.displayedGates.filter((gate) => gate.state === 'fail'));
  const runningSelectedStage = $derived(
    consoleStore.rerun.runId === consoleStore.selectedRun.id && consoleStore.rerun.stageName === consoleStore.selectedStage.name
  );

  function formatSubmitted(value: string) {
    return new Intl.DateTimeFormat('en', {
      month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'UTC'
    }).format(new Date(value));
  }

  function selectRunKey(event: KeyboardEvent, runId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      consoleStore.selectRun(runId);
    }
  }
</script>

<svelte:head>
  <meta name="description" content="Stage-gate benchmark acceptance package console" />
</svelte:head>

<div class="app-shell">
  <header class="app-header">
    <div class="brand">
      <span class="brand-mark"><ShieldCheck size={22} weight="fill" /></span>
      <div>
        <strong>Stagegate</strong>
        <span>Acceptance console</span>
      </div>
    </div>

    <nav aria-label="Console views">
      <button type="button" class:active={consoleStore.activeView === 'pipeline'} onclick={() => consoleStore.activeView = 'pipeline'}>
        <ListChecks size={17} weight="bold" /> Runs
      </button>
      <button type="button" class:active={consoleStore.activeView === 'registry'} onclick={() => consoleStore.activeView = 'registry'}>
        <Books size={17} weight="bold" /> Gate registry
      </button>
    </nav>

    <div class="header-actions">
      <button type="button" class="header-action" onclick={() => consoleStore.openImport()}>
        <UploadSimple size={17} weight="bold" /><span>Import acceptance package</span>
      </button>
      <button type="button" class="header-action primary" onclick={() => consoleStore.openExport()}>
        <Export size={17} weight="bold" /><span>Export acceptance package</span>
      </button>
      <button
        type="button" class="theme-toggle"
        aria-label={`Switch to ${consoleStore.theme === 'light' ? 'dark' : 'light'} theme`}
        title={`Switch to ${consoleStore.theme === 'light' ? 'dark' : 'light'} theme`}
        onclick={() => consoleStore.toggleTheme()}
      >
        {#if consoleStore.theme === 'light'}<Moon size={18} weight="bold" />{:else}<Sun size={18} weight="bold" />{/if}
      </button>
    </div>
  </header>

  <div class="workspace" class:registry-mode={consoleStore.activeView === 'registry'}>
    {#if consoleStore.activeView === 'pipeline'}
      <aside class="run-pane" aria-labelledby="runs-title">
        <div class="pane-head">
          <div>
            <span class="eyebrow">Build pipeline</span>
            <h1 id="runs-title">Recorded runs</h1>
          </div>
          <span class="run-count">{consoleStore.visibleRuns.length} runs</span>
        </div>

        <div class="run-tools">
          <label class="search-field">
            <span class="sr-only">Search runs</span>
            <MagnifyingGlass size={15} />
            <input type="search" aria-label="Search runs" bind:value={consoleStore.runSearch} />
          </label>
          <label class="sort-field">
            <span class="sr-only">Sort runs</span>
            <CaretUpDown size={15} />
            <select aria-label="Sort runs" bind:value={consoleStore.runSort}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
        </div>

        <div class="run-list">
          {#each consoleStore.visibleRuns as run}
            <div
              class="run-card" class:selected={run.id === consoleStore.selectedRun.id}
              role="button" tabindex="0" aria-pressed={run.id === consoleStore.selectedRun.id}
              aria-label={`Open run ${run.id}`}
              onclick={() => consoleStore.selectRun(run.id)}
              onkeydown={(event) => selectRunKey(event, run.id)}
            >
              <div class="run-card-top">
                <div>
                  <code>{run.id}</code>
                  <span>Submitted {formatSubmitted(run.submittedAt)} UTC</span>
                </div>
                <span class="commit"><Hash size={11} />{run.commit}</span>
              </div>
              <div class="branch"><GitBranch size={13} /><span>{run.branch}</span></div>
              <StageStrip {run} compact interactive={false} />
              <div class="mini-stage-labels" aria-hidden="true">
                {#each run.stages as stage}<span>{stage.name}</span>{/each}
              </div>
            </div>
          {:else}
            <div class="run-empty"><Database size={26} /><strong>No runs match this search</strong><button type="button" onclick={() => consoleStore.runSearch = ''}>Clear search</button></div>
          {/each}
        </div>

        <div class="status-legend" aria-label="Status color legend">
          <strong>Status legend</strong>
          <div>
            {#each ['passed', 'rejected', 'running', 'pending'] as status}
              <span class={`status-${status}`}><i class="status-dot"></i>{status}</span>
            {/each}
          </div>
        </div>
      </aside>

      <main class="detail-canvas">
        <section class="run-detail-head">
          <div>
            <span class="eyebrow">Selected benchmark run</span>
            <h2>{consoleStore.selectedRun.id}</h2>
            <div class="run-meta">
              <span><GitBranch size={13} />{consoleStore.selectedRun.branch}</span>
              <span><Hash size={13} />{consoleStore.selectedRun.commit}</span>
              <span>Submitted {new Date(consoleStore.selectedRun.submittedAt).toLocaleString('en', { timeZone:'UTC' })} UTC</span>
            </div>
          </div>
          <div class="run-detail-actions">
            <button type="button" class="action" onclick={() => consoleStore.openImport()}><UploadSimple size={16} weight="bold" /> Import</button>
            <button type="button" class="action primary" onclick={() => consoleStore.openExport()}><BracketsCurly size={16} weight="bold" /> Export</button>
          </div>
        </section>

        <div class="strip-scroll"><StageStrip run={consoleStore.selectedRun} /></div>

        <section class="stage-card surface" aria-labelledby="stage-title">
          <header class="stage-heading">
            <div>
              <span class="eyebrow">Stage {consoleStore.selectedRun.stages.findIndex((stage) => stage.name === consoleStore.selectedStage.name) + 1} of 5</span>
              <h2 id="stage-title">{consoleStore.selectedStage.name}</h2>
              <div class="stage-subtitle">
                <span>{consoleStore.selectedStage.gates.length} gates</span>
                <span>Aggregation · {consoleStore.selectedStage.aggregationMode}</span>
              </div>
            </div>
            <span class={`stage-status status-${consoleStore.displayedStageStatus} status-pill`}>
              {#if consoleStore.displayedStageStatus === 'passed'}<CheckCircle size={16} weight="fill" />
              {:else if consoleStore.displayedStageStatus === 'rejected'}<XCircle size={16} weight="fill" />
              {:else if consoleStore.displayedStageStatus === 'running'}<CircleNotch class="spin" size={16} weight="bold" />
              {:else}<Circle size={16} />{/if}
              {consoleStore.displayedStageStatus}
            </span>
          </header>

          {#if consoleStore.whatIf.active}
            <div class="whatif-banner banner-enter" role="status">
              <Flask size={20} weight="fill" />
              <div><strong>What-if simulation is active</strong><span>Gate flips are temporary and excluded from exports.</span></div>
              <button type="button" class="action" onclick={() => consoleStore.revertWhatIf()}><ArrowCounterClockwise size={15} weight="bold" /> Revert</button>
            </div>
          {/if}

          {#if consoleStore.displayedStageStatus === 'rejected'}
            <div class="rejection-banner banner-enter" role="alert">
              <WarningOctagon size={22} weight="fill" />
              <div>
                <strong>{consoleStore.failingHardGates.length ? 'Hard-gate rejection' : 'Suite rejection'}</strong>
                {#if displayedFailures.length}
                  <span>
                    {displayedFailures.map((gate) => `${gate.id} · ${gate.name}`).join('  |  ')}
                  </span>
                {:else}
                  <span>The recorded aggregation outcome did not pass.</span>
                {/if}
              </div>
            </div>
          {/if}

          {#if runningSelectedStage && consoleStore.rerun.active}
            <div class="rerun-progress" aria-live="polite">
              <div><span>Re-run in progress</span><strong>{consoleStore.rerun.progress}%</strong></div>
              <div class="progress-track"><span style={`width:${consoleStore.rerun.progress}%`}></span></div>
            </div>
          {/if}

          <div class="suite-toolbar">
            <div class="suite-outcome">
              <span>Computed suite outcome</span>
              <strong class:passes={consoleStore.displayedSuitePasses} class:fails={!consoleStore.displayedSuitePasses}>
                {consoleStore.displayedSuitePasses ? 'PASS' : 'FAIL'}
              </strong>
              {#if consoleStore.selectedStage.aggregationMode === 'weighted-mean'}
                <span class="score">{consoleStore.displayedScore.toFixed(1)}%</span>
              {/if}
            </div>
            <div class="stage-controls">
              <label class="whatif-toggle">
                <input
                  type="checkbox" role="switch"
                  checked={consoleStore.whatIf.active}
                  disabled={consoleStore.rerun.active}
                  onchange={() => consoleStore.toggleWhatIf()}
                />
                <span class="switch"><i></i></span>
                <span>What-if mode</span>
              </label>
              {#if consoleStore.selectedStage.status === 'passed' && consoleStore.selectedStage.certificate}
                <button type="button" class="action" onclick={() => consoleStore.openCertificate()}><Certificate size={16} weight="fill" /> View certificate</button>
              {/if}
              <button
                type="button" class="action primary"
                disabled={consoleStore.rerun.active}
                onclick={() => consoleStore.startRerun()}
              ><Play size={16} weight="fill" /> {consoleStore.rerun.active ? 'Re-run active' : 'Start re-run'}</button>
            </div>
          </div>

          <div class="gate-register" aria-label={`${consoleStore.selectedStage.name} gate suite`}>
            {#each consoleStore.displayedGates as gate (gate.id)}
              <GateRow {gate} />
            {/each}
          </div>

          <footer class="stage-foot">
            <span><Package size={14} /> Recorded result</span>
            <span>{selectedRecordedGateFailures.length} recorded gate failure{selectedRecordedGateFailures.length === 1 ? '' : 's'}</span>
            <span>{consoleStore.selectedStage.gates.reduce((count, gate) => count + gate.notes.length, 0)} gate note{consoleStore.selectedStage.gates.reduce((count, gate) => count + gate.notes.length, 0) === 1 ? '' : 's'}</span>
          </footer>
        </section>

        <CertificateChain />
        <div id="event-timeline"><EventTimeline /></div>
      </main>
    {:else}
      <main class="registry-canvas"><GateRegistry /></main>
    {/if}
  </div>

  {#if consoleStore.modal}<ModalLayer />{/if}

  <div class="live-region" aria-live="polite" aria-atomic="true">
    {#if consoleStore.toast}
      <div class="toast toast-enter"><CheckCircle size={19} weight="fill" /><span>{consoleStore.toast.message}</span></div>
    {/if}
  </div>
</div>

<style>
  .app-shell { min-height:100vh; background:
    radial-gradient(circle at 70% -10%, rgba(69,212,232,.1), transparent 28rem),
    #eef2f7; color:#172033; }
  :global(.dark) .app-shell { background:radial-gradient(circle at 70% -10%, rgba(33,171,193,.12), transparent 30rem), #07111f; color:#e8eef8; }
  .app-header { position:sticky; top:0; z-index:40; height:4.3rem; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:1rem; padding:0 1.15rem; color:#e9f3fa; background:#091728; border-bottom:1px solid #22344a; box-shadow:0 8px 26px rgba(4,13,24,.18); }
  :global(.dark) .app-header { background:#081523; }
  .brand { display:flex; align-items:center; gap:.6rem; }
  .brand-mark { display:grid; place-items:center; width:2.35rem; height:2.35rem; color:#55d4e7; background:#112b3d; border:1px solid #285064; border-radius:.62rem; }
  .brand div { display:flex; flex-direction:column; }
  .brand strong { font-size:.9rem; letter-spacing:.01em; }
  .brand div span { margin-top:.02rem; color:#8fa6b9; font-size:.57rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
  nav { display:flex; align-items:center; gap:.25rem; padding:.24rem; background:#0e2135; border:1px solid #24394e; border-radius:.65rem; }
  nav button { display:flex; align-items:center; gap:.4rem; min-height:2.15rem; padding:.4rem .7rem; color:#8fa4b8; background:transparent; border:0; border-radius:.45rem; font-size:.7rem; font-weight:750; cursor:pointer; transition:background-color .18s, color .18s; }
  nav button:hover { color:#dceaf4; background:#152b40; }
  nav button.active { color:white; background:#1c384f; box-shadow:0 2px 7px rgba(0,0,0,.2); }
  .header-actions { display:flex; align-items:center; justify-content:flex-end; gap:.42rem; }
  .header-action, .theme-toggle { display:flex; align-items:center; justify-content:center; gap:.38rem; min-height:2.25rem; padding:.42rem .65rem; color:#b9cad8; background:#102238; border:1px solid #2c4359; border-radius:.52rem; font-size:.65rem; font-weight:750; cursor:pointer; transition:background-color .18s, border-color .18s, transform .12s; }
  .header-action:hover, .theme-toggle:hover { color:white; background:#193149; border-color:#426078; }
  .header-action:active, .theme-toggle:active { transform:translateY(1px); }
  .header-action.primary { color:white; background:#0f8193; border-color:#2aa1b4; }
  .header-action.primary:hover { background:#1192a6; }
  .theme-toggle { width:2.25rem; padding:0; }
  .workspace { display:grid; grid-template-columns:350px minmax(0, 1fr); min-height:calc(100vh - 4.3rem); }
  .workspace.registry-mode { display:block; }
  .run-pane { position:relative; z-index:2; padding:1rem; background:#f7f9fc; border-right:1px solid #d7e0ea; box-shadow:8px 0 24px rgba(40,58,82,.04); }
  :global(.dark) .run-pane { background:#0a1727; border-color:#24374b; }
  .pane-head { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; }
  .eyebrow { color:#148497; font-size:.56rem; font-weight:850; letter-spacing:.095em; text-transform:uppercase; }
  .pane-head h1 { margin:.15rem 0 0; font-size:1.2rem; letter-spacing:-.02em; }
  .run-count { padding:.22rem .42rem; color:#63748a; background:#ebf0f5; border:1px solid #d4dee8; border-radius:999px; font:650 .57rem var(--font-mono); }
  :global(.dark) .run-count { color:#a9b8c8; background:#112338; border-color:#2e4359; }
  .run-tools { display:grid; grid-template-columns:1fr auto; gap:.4rem; margin:.8rem 0; }
  .search-field, .sort-field { display:flex; align-items:center; gap:.35rem; min-height:2.2rem; padding:0 .55rem; color:#7c8c9f; background:white; border:1px solid #cad5e1; border-radius:.5rem; }
  :global(.dark) .search-field, :global(.dark) .sort-field { background:#0e1d2f; border-color:#2c4258; }
  .search-field:focus-within, .sort-field:focus-within { border-color:#22a7bc; box-shadow:0 0 0 3px rgba(34,167,188,.12); }
  .search-field input { width:100%; min-width:0; padding:.35rem 0; color:inherit; background:transparent; border:0; font-size:.7rem; }
  .sort-field select { color:inherit; background:transparent; border:0; font-size:.65rem; font-weight:700; }
  .run-list { display:grid; gap:.55rem; }
  .run-card { padding:.68rem; background:white; border:1px solid #d8e1eb; border-radius:.7rem; box-shadow:0 3px 10px rgba(34,53,79,.045); cursor:pointer; transition:background-color .18s, border-color .18s, box-shadow .18s, transform .14s; }
  .run-card:hover { background:#f9fcfd; border-color:#aac4cf; box-shadow:0 8px 18px rgba(34,53,79,.08); transform:translateY(-1px); }
  .run-card.selected { background:#effafd; border-color:#49b7c8; box-shadow:0 0 0 2px rgba(47,173,192,.12), 0 8px 18px rgba(34,53,79,.07); }
  :global(.dark) .run-card { background:#0e1d2f; border-color:#263b50; }
  :global(.dark) .run-card:hover { background:#12243a; border-color:#426178; }
  :global(.dark) .run-card.selected { background:#102b37; border-color:#40b8ca; }
  .run-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:.7rem; }
  .run-card-top > div { display:flex; flex-direction:column; gap:.1rem; }
  .run-card code { color:#23354b; font:750 .7rem var(--font-mono); }
  :global(.dark) .run-card code { color:#d6e3ee; }
  .run-card-top div span { color:#76869a; font-size:.57rem; }
  .commit { display:flex; align-items:center; color:#718195; font: .57rem var(--font-mono); }
  .branch { display:flex; align-items:center; gap:.3rem; min-width:0; margin:.4rem 0 .5rem; color:#60738a; font-size:.61rem; }
  .branch span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mini-stage-labels { display:grid; grid-template-columns:repeat(5, 1fr); gap:.22rem; margin-top:.25rem; }
  .mini-stage-labels span { overflow:hidden; color:#8090a2; font-size:.47rem; font-weight:650; text-align:center; text-overflow:ellipsis; white-space:nowrap; }
  .status-legend { margin-top:.85rem; padding:.65rem; background:#edf2f6; border:1px solid #dae3ec; border-radius:.58rem; }
  :global(.dark) .status-legend { background:#0d1e30; border-color:#283d53; }
  .status-legend strong { display:block; margin-bottom:.4rem; color:#6d7d90; font-size:.54rem; letter-spacing:.07em; text-transform:uppercase; }
  .status-legend > div { display:grid; grid-template-columns:1fr 1fr; gap:.35rem; }
  .status-legend span { display:flex; align-items:center; gap:.32rem; color:#65758a; font-size:.57rem; font-weight:700; text-transform:capitalize; }
  .status-legend i { width:.48rem; height:.48rem; border-radius:50%; }
  .run-empty { min-height:9rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.35rem; color:#8594a6; text-align:center; }
  .run-empty strong { font-size:.7rem; }
  .run-empty button { color:#16869a; background:transparent; border:0; font-size:.64rem; font-weight:800; cursor:pointer; }
  .detail-canvas { width:100%; min-width:0; display:grid; grid-template-columns:minmax(0, 1fr); align-content:start; gap:1rem; padding:1.1rem; }
  .detail-canvas > :global(*) { min-width:0; }
  .run-detail-head { display:flex; align-items:flex-end; justify-content:space-between; gap:1.5rem; }
  .run-detail-head h2 { margin:.12rem 0 0; font-size:1.55rem; letter-spacing:-.03em; }
  .run-meta { display:flex; align-items:center; flex-wrap:wrap; gap:.6rem; margin-top:.3rem; color:#6e7e92; font-size:.63rem; }
  .run-meta span { display:flex; align-items:center; gap:.25rem; }
  .run-detail-actions { display:flex; gap:.45rem; }
  .strip-scroll { min-width:0; overflow-x:auto; padding-bottom:.2rem; }
  .stage-card { border-radius:.9rem; overflow:hidden; }
  .stage-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1rem 1rem .8rem; }
  .stage-heading h2 { margin:.12rem 0 0; font-size:1.25rem; letter-spacing:-.02em; }
  .stage-subtitle { display:flex; gap:.5rem; margin-top:.25rem; color:#6f8094; font-size:.62rem; }
  .stage-subtitle span + span::before { content:'·'; margin-right:.5rem; }
  .stage-status { display:inline-flex; align-items:center; gap:.35rem; padding:.38rem .52rem; border-radius:.48rem; font-size:.62rem; font-weight:850; text-transform:uppercase; letter-spacing:.04em; }
  .spin { animation:spin .85s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .whatif-banner, .rejection-banner { display:flex; align-items:center; gap:.7rem; margin:0 1rem .75rem; padding:.65rem .75rem; border-radius:.58rem; }
  .whatif-banner { color:#684a9c; background:#f0eafd; border:1px solid #cbb7ef; }
  .rejection-banner { color:#b83246; background:#fff0f2; border:1px solid #eda4af; }
  :global(.dark) .whatif-banner { color:#c5a7fa; background:#261b3b; border-color:#60478a; }
  :global(.dark) .rejection-banner { color:#ff8492; background:#341a23; border-color:#753746; }
  .whatif-banner > div, .rejection-banner > div { flex:1; min-width:0; display:flex; flex-direction:column; gap:.1rem; }
  .whatif-banner strong, .rejection-banner strong { font-size:.72rem; }
  .whatif-banner span, .rejection-banner span { font-size:.63rem; line-height:1.45; }
  .rerun-progress { margin:0 1rem .75rem; }
  .rerun-progress > div:first-child { display:flex; justify-content:space-between; color:#9a6718; font-size:.62rem; font-weight:750; }
  .progress-track { height:.42rem; overflow:hidden; margin-top:.35rem; background:#e7e9e7; border-radius:999px; }
  :global(.dark) .progress-track { background:#263242; }
  .progress-track span { display:block; height:100%; background:linear-gradient(90deg,#d78a17,#efb64b); border-radius:inherit; transition:width .3s ease; }
  .suite-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.7rem 1rem; background:#f5f8fb; border-block:1px solid #e0e7ef; }
  :global(.dark) .suite-toolbar { background:#0a1828; border-color:#263a50; }
  .suite-outcome { display:flex; align-items:center; gap:.48rem; }
  .suite-outcome > span:first-child { color:#6f8094; font-size:.59rem; font-weight:800; text-transform:uppercase; letter-spacing:.055em; }
  .suite-outcome strong { font:850 .7rem var(--font-mono); }
  .suite-outcome .passes { color:#16875f; }
  .suite-outcome .fails { color:#d13d52; }
  .score { padding:.14rem .35rem; color:#316b78; background:#e4f2f5; border:1px solid #badce3; border-radius:.3rem; font:700 .62rem var(--font-mono); }
  :global(.dark) .score { color:#7bd6e4; background:#102b35; border-color:#315a68; }
  .stage-controls { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:.45rem; }
  .whatif-toggle { position:relative; display:flex; align-items:center; gap:.4rem; padding:.25rem .4rem; color:#63758b; font-size:.65rem; font-weight:750; cursor:pointer; }
  .whatif-toggle input { position:absolute; z-index:1; left:.4rem; width:2rem; height:1.08rem; opacity:0; cursor:pointer; }
  .switch { position:relative; width:2rem; height:1.08rem; background:#c4cfda; border-radius:999px; transition:background-color .18s; }
  .switch i { position:absolute; top:.16rem; left:.17rem; width:.76rem; height:.76rem; background:white; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,.2); transition:transform .18s; }
  .whatif-toggle input:checked + .switch { background:#815fc3; }
  .whatif-toggle input:checked + .switch i { transform:translateX(.9rem); }
  .whatif-toggle input:focus-visible + .switch { box-shadow:0 0 0 3px rgba(55,190,211,.3); }
  .whatif-toggle input:disabled + .switch { opacity:.45; }
  .gate-register { margin:.85rem 1rem; overflow:hidden; border:1px solid #dce4ed; border-radius:.72rem; box-shadow:0 5px 16px rgba(28,49,75,.05); }
  :global(.dark) .gate-register { border-color:#263a50; }
  .stage-foot { display:flex; align-items:center; flex-wrap:wrap; gap:.8rem; padding:.65rem 1rem; color:#748499; background:#f5f8fb; border-top:1px solid #e0e7ef; font-size:.59rem; }
  :global(.dark) .stage-foot { background:#0a1828; border-color:#263a50; }
  .stage-foot span { display:flex; align-items:center; gap:.3rem; }
  .registry-canvas { min-height:calc(100vh - 4.3rem); padding:1.3rem; }
  .live-region { position:fixed; z-index:100; right:1rem; bottom:1rem; pointer-events:none; }
  .toast { display:flex; align-items:center; gap:.48rem; min-width:14rem; padding:.7rem .8rem; color:#e8fff7; background:#11352c; border:1px solid #32765f; border-radius:.58rem; box-shadow:0 12px 28px rgba(2,12,20,.25); font-size:.7rem; font-weight:750; }
  .toast :global(svg) { color:#42d4a0; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  @media (max-width:1100px) {
    .workspace { grid-template-columns:315px minmax(0,1fr); }
    .header-action span { display:none; }
    .header-action { width:2.25rem; padding:0; }
    .suite-toolbar { align-items:flex-start; flex-direction:column; }
    .stage-controls { width:100%; justify-content:flex-start; }
  }
  @media (max-width:768px) {
    .app-header { height:auto; min-height:4rem; grid-template-columns:1fr auto; padding:.6rem .75rem; }
    .app-header nav { grid-column:1 / -1; grid-row:2; width:100%; }
    .app-header nav button { flex:1; justify-content:center; }
    .brand div span { display:none; }
    .workspace { display:block; }
    .run-pane { border-right:0; border-bottom:1px solid #d7e0ea; }
    .run-list { grid-template-columns:repeat(2, minmax(0,1fr)); }
    .status-legend { display:none; }
    .detail-canvas { padding:.85rem; }
    .run-detail-head { align-items:flex-start; }
    .run-detail-actions { display:none; }
    .registry-canvas { padding:.85rem; }
  }
  @media (max-width:560px) {
    .app-header { gap:.5rem; }
    .header-actions { gap:.25rem; }
    .header-action:first-child { display:none; }
    .run-list { grid-template-columns:1fr; }
    .run-pane { padding:.75rem; }
    .detail-canvas { padding:.65rem; gap:.7rem; }
    .run-detail-head h2 { font-size:1.25rem; }
    .run-meta span:last-child { width:100%; }
    .stage-heading { padding:.8rem; }
    .stage-heading h2 { font-size:1.06rem; }
    .stage-subtitle { flex-direction:column; gap:.1rem; }
    .stage-subtitle span + span::before { display:none; }
    .whatif-banner, .rejection-banner { margin-inline:.7rem; align-items:flex-start; }
    .whatif-banner .action { min-width:2.2rem; padding:.4rem; font-size:0; }
    .suite-toolbar { padding:.65rem .7rem; }
    .suite-outcome { flex-wrap:wrap; }
    .suite-outcome > span:first-child { width:100%; }
    .stage-controls { display:grid; grid-template-columns:1fr 1fr; }
    .stage-controls .whatif-toggle { grid-column:1 / -1; }
    .stage-controls .action { width:100%; }
    .gate-register { margin:.7rem; }
    .stage-foot { padding:.6rem .7rem; }
  }
</style>
