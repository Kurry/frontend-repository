<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { createForm } from '@tanstack/svelte-form';
  import {
    ArrowCounterClockwise, CaretUpDown, Check, CheckCircle, Copy, DownloadSimple,
    FloppyDisk, Funnel, GitCommit, ListChecks, LockSimple, MagnifyingGlass,
    Package as PackageIcon, Pause, Play, Plus, Trash, UploadSimple, WarningCircle, X
  } from 'phosphor-svelte';
  import Modal from './lib/components/Modal.svelte';
  import { studio, type Seed, type Status } from './lib/studio.svelte';
  import {
    DatasetStudioPackageSchema, FoilUpsertSchema, HarvestPendingJustificationSchema,
    NegativeCriterionSchema, PositiveCriterionSchema, RejectSeedSchema,
    negativeClasses, rejectClasses, failureModes, repositories,
    type FoilUpsert
  } from './lib/schemas';

  const checklistLabels = [
    'Names no file paths or symbols',
    'Quotes no implementation code',
    'Reveals no proposed fix',
    'States the observable symptom'
  ];
  const statusOrder: Status[] = ['draft', 'authored', 'rejected', 'harvest-pending'];

  let filterName = $state('');
  let rejectClass = $state('');
  let rejectJustification = $state('');
  let rejectTouched = $state(false);
  let rejectResult = $derived(RejectSeedSchema.safeParse({ rejectClass, justification: rejectJustification }));

  let foilDraft = $state<FoilUpsert>({ answerText: '', failureMode: 'wrong-answer', expectsFailIds: [], correctnessCap: 20 });
  let foilTouched = $state(false);
  let foilResult = $derived(FoilUpsertSchema.safeParse(foilDraft));
  let harvestJustification = $state('');
  let harvestTouched = $state(false);
  let harvestResult = $derived(HarvestPendingJustificationSchema.safeParse({ justification: harvestJustification }));
  let importTouched = $state(false);
  let previousGateCount = $state(-1);

  const rejectForm = createForm(() => ({
    defaultValues: { rejectClass: '', justification: '' },
    validators: { onChange: RejectSeedSchema },
    onSubmit: () => submitReject()
  }));
  const foilForm = createForm(() => ({
    defaultValues: { answerText: '', failureMode: 'wrong-answer', expectsFailIds: [] as string[], correctnessCap: 20 },
    validators: { onChange: FoilUpsertSchema },
    onSubmit: () => submitFoil()
  }));
  const harvestPendingForm = createForm(() => ({
    defaultValues: { justification: '' },
    validators: { onChange: HarvestPendingJustificationSchema },
    onSubmit: () => submitHarvestPending()
  }));
  const importForm = createForm(() => ({
    defaultValues: { packageText: '' },
    onSubmit: () => submitImport()
  }));

  $effect(() => {
    const count = studio.activeSeed ? studio.gateConditions(studio.activeSeed).length : -1;
    if (previousGateCount > 0 && count === 0) studio.ariaMessage = 'All package gate conditions are satisfied';
    previousGateCount = count;
  });

  function fieldIssue(result: any, field: string) {
    if (result.success) return '';
    return result.error.issues.find((issue: any) => issue.path[0] === field)?.message ?? '';
  }

  function positiveIssue(record: any, field: string) { return fieldIssue(PositiveCriterionSchema.safeParse(record), field); }
  function negativeIssue(record: any, field: string) { return fieldIssue(NegativeCriterionSchema.safeParse(record), field); }
  function countRepoStatus(repository: string, status: Status) { return studio.seeds.filter((seed) => seed.repository === repository && seed.status === status).length; }
  function pretty(value: string) { return value.replaceAll('-', ' '); }
  function selectedDrafts() { return studio.selectedIds.filter((id) => studio.seeds.find((seed) => seed.id === id)?.status === 'draft'); }

  function openReject(ids: string[], mode: 'single' | 'batch') {
    studio.rejectTargetIds = ids;
    studio.rejectMode = mode;
    studio.rejectOpen = true;
    rejectClass = '';
    rejectJustification = '';
    rejectTouched = false;
    rejectForm.reset();
  }

  function submitReject() {
    rejectTouched = true;
    if (!rejectResult.success) return;
    const error = studio.reject(studio.rejectTargetIds, rejectResult.data);
    if (error) studio.showToast(error);
  }

  function openFoil(seed: Seed, index: number | null) {
    studio.foilEditingIndex = index;
    foilDraft = index === null
      ? { answerText: '', failureMode: 'wrong-answer', expectsFailIds: [], correctnessCap: 20 }
      : JSON.parse(JSON.stringify(seed.authoring.foils[index]));
    foilTouched = false;
    foilForm.reset();
    for (const [key, value] of Object.entries(foilDraft)) foilForm.setFieldValue(key as any, value as any);
    studio.foilEditorOpen = true;
  }

  function toggleFoilId(id: string) {
    foilDraft.expectsFailIds = foilDraft.expectsFailIds.includes(id)
      ? foilDraft.expectsFailIds.filter((value) => value !== id)
      : [...foilDraft.expectsFailIds, id];
    foilForm.setFieldValue('expectsFailIds', foilDraft.expectsFailIds);
  }

  function submitFoil() {
    foilTouched = true;
    const seed = studio.activeSeed;
    if (!seed || !foilResult.success) return;
    const issues = studio.upsertFoil(seed, JSON.parse(JSON.stringify(foilDraft)), studio.foilEditingIndex);
    if (issues.length) studio.showToast(issues[0].message);
  }

  function submitHarvestPending() {
    harvestTouched = true;
    const seed = studio.activeSeed;
    if (!seed || !harvestResult.success) return;
    const error = studio.setHarvestPending(seed, harvestResult.data.justification);
    if (!error) { harvestJustification = ''; harvestTouched = false; }
  }

  function submitImport() {
    importTouched = true;
    const error = studio.importPackage(studio.importText);
    studio.importError = error ?? '';
  }

  async function readImportFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    studio.importText = await file.text();
    studio.importError = '';
  }

  async function copyText(text: string, confirmation: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    studio.showToast(confirmation);
  }

  function copyPreview() {
    const tab = studio.exportTab;
    copyText(studio.preview(tab), `${tab === 'manifest' ? 'Manifest' : tab === 'snapshot' ? 'Snapshot' : 'Studio package'} copied`);
    studio.stampExport(tab);
  }

  function downloadPreview() {
    const text = studio.preview(studio.exportTab);
    const seedPart = studio.activeSeed?.id ?? 'dataset';
    const filenames = { manifest: `${seedPart}-manifest.json`, snapshot: 'dataset-snapshot.json', studio: 'seed-dataset-studio.json' };
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filenames[studio.exportTab];
    anchor.click();
    URL.revokeObjectURL(url);
    studio.stampExport(studio.exportTab);
    studio.showToast(`${studio.exportTab === 'manifest' ? 'Manifest' : studio.exportTab === 'snapshot' ? 'Snapshot' : 'Studio package'} downloaded`);
  }

  function paneJump(id: string) {
    studio.activePane = id as any;
    document.getElementById(`pane-${id}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function timelineFor(seed: Seed) {
    return seed.timelineFilter === 'all' ? [...seed.timeline].reverse() : seed.timeline.filter((entry) => entry.type === seed.timelineFilter).reverse();
  }

  function registerWebMCP() {
    const context = (navigator as any).modelContext;
    if (!context?.registerTool) return;
    const result = (message: string, data: Record<string, unknown> = {}) => ({ content: [{ type: 'text', text: JSON.stringify({ message, ...data }) }] });
    const register = (name: string, description: string, properties: Record<string, unknown>, required: string[], execute: (args: any) => any) => {
      try { context.registerTool({ name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false }, execute }); } catch { /* Host may already have this tool after HMR. */ }
    };
    const seedProp = { type: 'string', description: 'A seeded seedId.' };
    const objectTypes = ['question', 'under-specification-checklist-item', 'positive-criterion', 'negative-criterion', 'foil', 'golden-answer'];

    register('editor_select', 'Select a seed and editor object.', { seedId: seedProp, objectType: { type: 'string', enum: objectTypes }, objectId: { type: 'string' } }, ['seedId', 'objectType'], ({ seedId, objectType, objectId }) => {
      const seed = studio.seeds.find((item) => item.id === seedId); if (!seed) return result('Seed not found');
      studio.openSeed(seedId); if (objectId?.startsWith('1.') || objectId?.startsWith('2.')) studio.jumpToCriterion(objectId); else studio.activePane = objectType === 'foil' ? 'foils' : objectType === 'golden-answer' ? 'golden' : objectType === 'negative-criterion' ? 'negative' : objectType === 'positive-criterion' ? 'positive' : 'question';
      return result('Editor object selected', { seedId, objectType, objectId });
    });
    register('editor_add', 'Add a declared rubric or foil object through studio logic.', { seedId: seedProp, objectType: { type: 'string', enum: ['positive-criterion', 'negative-criterion', 'foil'] } }, ['seedId', 'objectType'], ({ seedId, objectType }) => {
      const seed = studio.seeds.find((item) => item.id === seedId); if (!seed) return result('Seed not found');
      if (objectType === 'positive-criterion') studio.addPositive(seed); else if (objectType === 'negative-criterion') studio.addNegative(seed); else studio.upsertFoil(seed, { answerText: 'This explanation attributes the failure to a nearby subsystem without runtime confirmation.', failureMode: 'wrong-answer', expectsFailIds: ['1.1'], correctnessCap: 20 }, null);
      return result('Editor object added', { seedId, objectType });
    });
    register('editor_delete', 'Delete an editable rubric or foil object.', { seedId: seedProp, objectType: { type: 'string', enum: ['positive-criterion', 'negative-criterion', 'foil'] }, objectId: { type: 'string' } }, ['seedId', 'objectType', 'objectId'], ({ seedId, objectType, objectId }) => {
      const seed = studio.seeds.find((item) => item.id === seedId); if (!seed) return result('Seed not found');
      if (objectType === 'positive-criterion') { const ok = studio.deletePositive(seed, objectId); return result(ok ? 'Positive criterion deleted' : 'Criterion 1.4 is locked and remains in place'); }
      if (objectType === 'negative-criterion') studio.deleteNegative(seed, objectId); else { const index = Number(objectId); if (Number.isInteger(index)) studio.deleteFoil(seed, index); }
      return result('Editor object deleted', { seedId, objectType, objectId });
    });
    register('editor_update_property', 'Update one declared editor property through the same authoring state.', {
      seedId: seedProp, objectType: { type: 'string', enum: objectTypes }, objectId: { type: 'string' },
      property: { type: 'string', enum: ['question-text', 'checklist-item-checked', 'criterion-name', 'criterion-weight', 'criterion-description', 'negative-criterion-class', 'foil-answer-text', 'foil-failure-mode', 'foil-expects-fail-ids', 'foil-correctness-cap', 'golden-answer-text', 'seed-title'] },
      value: {}
    }, ['seedId', 'objectType', 'property', 'value'], ({ seedId, objectId, property, value }) => {
      const seed = studio.seeds.find((item) => item.id === seedId); if (!seed) return result('Seed not found');
      if (property === 'seed-title') seed.title = String(value);
      else if (property === 'question-text') seed.authoring.questionText = String(value);
      else if (property === 'golden-answer-text') seed.authoring.golden = { status: 'present', value: String(value) };
      else if (property === 'checklist-item-checked') seed.authoring.checklist[Number(objectId)] = Boolean(value);
      else {
        const positive = seed.authoring.positiveCriteria.find((item) => item.id === objectId);
        const negative = seed.authoring.negativeCriteria.find((item) => item.id === objectId);
        const foil = seed.authoring.foils[Number(objectId)];
        if (positive && property === 'criterion-name') positive.name = String(value);
        if (positive && property === 'criterion-weight') positive.weight = Number(value);
        if ((positive || negative) && property === 'criterion-description') (positive ?? negative)!.description = String(value);
        if (negative && property === 'criterion-name') negative.name = String(value);
        if (negative && property === 'negative-criterion-class' && negativeClasses.includes(value as any)) negative.class = value;
        if (foil && property === 'foil-answer-text') foil.answerText = String(value);
        if (foil && property === 'foil-failure-mode' && failureModes.includes(value as any)) foil.failureMode = value;
        if (foil && property === 'foil-expects-fail-ids' && Array.isArray(value)) foil.expectsFailIds = value.map(String);
        if (foil && property === 'foil-correctness-cap') foil.correctnessCap = Number(value);
      }
      return result('Editor property updated', { seedId, property });
    });
    register('editor_set_content', 'Set question or golden-answer content.', { seedId: seedProp, objectType: { type: 'string', enum: ['question', 'golden-answer'] }, content: { type: 'string' } }, ['seedId', 'objectType', 'content'], ({ seedId, objectType, content }) => {
      const seed = studio.seeds.find((item) => item.id === seedId); if (!seed) return result('Seed not found');
      if (objectType === 'question') seed.authoring.questionText = content; else seed.authoring.golden = { status: 'present', value: content };
      return result('Editor content set', { seedId, objectType });
    });

    const formProps = { operation: { type: 'string', enum: ['reject-seed', 'batch-reject', 'undo-triage', 'accept-for-authoring', 'mark-authored', 'export-package'] }, seedIds: { type: 'array', items: { type: 'string' } }, rejectClass: { type: 'string', enum: rejectClasses }, justification: { type: 'string' } };
    register('form_validate', 'Validate declared workflow fields with product schemas.', formProps, ['operation'], (args) => {
      const parsed = ['reject-seed', 'batch-reject'].includes(args.operation) ? RejectSeedSchema.safeParse({ rejectClass: args.rejectClass, justification: args.justification }) : { success: true };
      return result(parsed.success ? 'Form is valid' : 'Form is invalid', { valid: parsed.success, errors: parsed.success ? [] : (parsed as any).error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`) });
    });
    register('form_submit', 'Submit a declared triage or lifecycle workflow.', formProps, ['operation'], (args) => {
      const ids = args.seedIds ?? [];
      if (args.operation === 'accept-for-authoring') studio.accept(ids, ids.length === 1);
      else if (args.operation === 'reject-seed' || args.operation === 'batch-reject') { const error = studio.reject(ids, { rejectClass: args.rejectClass, justification: args.justification }); if (error) return result(error, { success: false }); }
      else if (args.operation === 'undo-triage') studio.undoTriage();
      else if (args.operation === 'mark-authored') { const seed = studio.seeds.find((item) => item.id === ids[0]); if (seed) studio.markAuthored(seed); }
      else if (args.operation === 'export-package') studio.openExport(ids[0]);
      return result('Workflow submitted', { operation: args.operation, seedIds: ids });
    });
    register('form_cancel', 'Cancel an open studio form.', { operation: { type: 'string', enum: ['reject-seed', 'batch-reject', 'export-package'] } }, ['operation'], ({ operation }) => { studio.rejectOpen = false; studio.foilEditorOpen = false; studio.importOpen = false; if (operation === 'export-package') studio.exportOpen = false; return result('Form cancelled', { operation }); });
    register('session_start', 'Start the harvest-run demo for one seed.', { seedId: seedProp, demo: { type: 'string', enum: ['harvest-run', 'harvest-step-retry'] } }, ['seedId', 'demo'], ({ seedId, demo }) => { const seed = studio.seeds.find((item) => item.id === seedId); if (seed) studio.startHarvest(seed); return result('Harvest session start requested', { seedId, demo }); });
    register('session_pause', 'Pause a running harvest at its current step.', { seedId: seedProp }, ['seedId'], ({ seedId }) => { const seed = studio.seeds.find((item) => item.id === seedId); if (seed) studio.pauseHarvest(seed); return result('Harvest pause requested', { seedId }); });
    register('session_resume', 'Resume a paused harvest from its current step.', { seedId: seedProp }, ['seedId'], ({ seedId }) => { const seed = studio.seeds.find((item) => item.id === seedId); if (seed) studio.resumeHarvest(seed); return result('Harvest resume requested', { seedId }); });
    const artifactProps = { seedId: seedProp, format: { type: 'string', enum: ['package-manifest-json', 'dataset-snapshot-json', 'commit-hash'] } };
    register('artifact_export', 'Open the matching live-derived artifact export surface.', artifactProps, ['format'], ({ seedId, format }) => { if (seedId) studio.activeSeedId = seedId; studio.exportTab = format === 'package-manifest-json' ? 'manifest' : 'snapshot'; studio.openExport(); return result('Artifact export surface opened', { format, seedId }); });
    register('artifact_copy', 'Copy a declared artifact using the visible product handler.', artifactProps, ['format'], async ({ seedId, format }) => { if (seedId) studio.activeSeedId = seedId; const text = format === 'commit-hash' ? studio.activeSeed?.pinnedCommit ?? '' : studio.preview(format === 'package-manifest-json' ? 'manifest' : 'snapshot'); await copyText(text, format === 'commit-hash' ? 'Commit hash copied' : 'Artifact copied'); if (format === 'package-manifest-json') studio.stampExport('manifest'); return result('Artifact copy requested', { format, seedId }); });
  }

  onMount(registerWebMCP);
</script>

<svelte:head><meta name="description" content="Operator console for authoring portable code-investigation benchmark datasets." /></svelte:head>

<div class="app-shell">
  <a href="#main" class="skip-link">Skip to main content</a>
<header class="topbar">
    <div class="brand">
      <div class="brand-mark"><ListChecks size={19} weight="bold" /></div>
      <div><h1>Seed Dataset Studio</h1><p>Investigation benchmark factory</p></div>
    </div>
    <nav class="view-switch" aria-label="Studio views">
      <button class:active={studio.activeView === 'queue'} onclick={() => studio.activeView = 'queue'}>Queue</button>
      <button class:active={studio.activeView === 'workbench'} disabled={!studio.activeSeed} onclick={() => studio.activeView = 'workbench'}>Workbench</button>
    </nav>
    <div class="top-actions">
      {#if studio.lastTriage}<button class="button small" aria-label="Undo triage" onclick={() => studio.undoTriage()}><ArrowCounterClockwise size={14} /><span class="label-text">Undo triage</span></button>{/if}
      <button class="button small" aria-label="Import package" onclick={() => { studio.importOpen = true; studio.importError = ''; importTouched = false; }}><UploadSimple size={14} /><span class="label-text">Import package</span></button>
      <button class="button small primary" aria-label="Export center" onclick={() => studio.openExport()}><PackageIcon size={14} /><span class="label-text">Export center</span></button>
    </div>
  </header>

  <main id="main" class="main" in:fade={{ duration: 250 }}>
    {#if studio.activeView === 'queue'}
      <section class="view" aria-label="Seed queue">
        <div class="stats-panel card">
          <div class="stats-head">
            <div><div class="section-kicker">Live dataset snapshot</div><h2 class="section-title">{studio.seeds.length} total seeds</h2></div>
            <p>All rollups update from session state</p>
          </div>
          <div class="stats-scroll" role="region" aria-label="Dataset Statistics" id="stats-rollup">
            <div class="stat-group">
              <p class="stat-group-title">Status distribution</p>
              <div class="status-grid">
                {#each statusOrder as status}
                  <button class="status-cell {status === 'harvest-pending' ? 'pending' : status}" aria-label={`Filter ${studio.rollup.byStatus[status]} ${status} seeds`} onclick={() => studio.applyRollupFilter('status', status)}>
                    <strong>{studio.rollup.byStatus[status]}</strong><span>{pretty(status)}</span>
                  </button>
                {/each}
              </div>
            </div>
            <div class="stat-group">
              <p class="stat-group-title">Repositories · click a count to filter</p>
              <div class="repo-table">
                <div class="repo-row muted"><span>Repository</span><button aria-label="Draft column">D</button><button aria-label="Authored column">A</button><button aria-label="Rejected column">R</button><button aria-label="Harvest pending column">H</button></div>
                {#each repositories as repository}
                  <div class="repo-row"><span>{repository} <span class="muted">· {studio.rollup.byRepository[repository]}</span></span>
                    {#each statusOrder as status}
                      <button aria-label={`Filter ${repository} ${status} seeds`} onclick={() => studio.applyRollupFilter('repository', repository, status)}>{countRepoStatus(repository, status)}</button>
                    {/each}
                  </div>
                {/each}
              </div>
            </div>
            <div class="stat-group">
              <p class="stat-group-title">Languages</p>
              <div class="breakdown">
                {#each Object.entries(studio.rollup.byLanguage) as [language, count]}
                  <button class="mini-cell" onclick={() => studio.applyRollupFilter('language', language)}><span>{language}</span><strong>{count}</strong></button>
                {/each}
              </div>
              <p class="stat-group-title" style="margin-top:8px">Rejected by class</p>
              <div class="breakdown">
                {#each Object.entries(studio.rollup.rejectedByClass) as [rejectClassName, count]}
                  <div class="mini-cell"><span>{pretty(rejectClassName)}</span><strong>{count}</strong></div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <div class="queue-toolbar card">
          <div class="search-wrap"><MagnifyingGlass size={15} /><input class="control" class:active={studio.search.length > 0} aria-label="Search seed id or title" placeholder="Search seed id or title…" bind:value={studio.search} /></div>
          <select class="control" class:active={!!studio.filters.status} aria-label="Filter by status" bind:value={studio.filters.status}><option value="">All statuses</option>{#each statusOrder as status}<option value={status}>{pretty(status)}</option>{/each}</select>
          <select class="control" class:active={!!studio.filters.language} aria-label="Filter by language" bind:value={studio.filters.language}><option value="">All languages</option>{#each studio.languages as language}<option value={language}>{language}</option>{/each}</select>
          <select class="control" class:active={!!studio.filters.repository} aria-label="Filter by repository" bind:value={studio.filters.repository}><option value="">All repositories</option>{#each repositories as repository}<option value={repository}>{repository}</option>{/each}</select>
          <select class="control" class:active={!!studio.filters.difficulty} aria-label="Filter by difficulty" bind:value={studio.filters.difficulty}><option value="">All difficulty</option><option value="hard">hard</option><option value="unset">unset</option></select>
          <input class="control filter-name" aria-label="Saved filter name" placeholder="Filter name" bind:value={filterName} />
          <button class="button" disabled={!studio.activeFilterParts.length} onclick={() => { studio.saveCurrentFilter(filterName); filterName = ''; }}><Plus size={13} aria-hidden="true" />Save filter</button>
        </div>

        {#if studio.savedFilters.length}
          <div class="saved-row"><span class="saved-label">Saved filters</span>{#each studio.savedFilters as saved}<button class="chip" onclick={() => studio.applySaved(saved.id)}>{saved.name}<span class="remove" role="button" tabindex="0" aria-label={`Remove saved filter ${saved.name}`} onclick={(event) => { event.stopPropagation(); studio.removeSaved(saved.id); }} onkeydown={(event) => { if (event.key === 'Enter') studio.removeSaved(saved.id); }}><X size={10} /></span></button>{/each}</div>
        {/if}

        <div class="active-summary">
          <Funnel size={13} />
          <strong>{studio.visibleSeeds.length} matching seeds</strong>
          <span>{studio.activeFilterParts.length ? studio.activeFilterParts.join(' · ') : 'No active filters'}</span>
          {#if studio.activeFilterParts.length}<button onclick={() => studio.clearFilters()}>Clear all</button>{/if}
        </div>
        <div class="table-card card">
          <div class="table-scroller">
            {#if studio.visibleSeeds.length}
              <table class="seed-table">
                <colgroup><col style="width:34px" /><col class="id-col" style="width:190px" /><col style="width:105px" /><col style="width:90px" /><col style="width:55px" /><col class="title-col" style="width:310px" /><col style="width:105px" /><col style="width:70px" /><col style="width:125px" /><col style="width:95px" /><col style="width:125px" /></colgroup>
                <thead><tr>
                  <th><input type="checkbox" aria-label="Select all matching draft seeds" checked={studio.visibleSeeds.filter((seed) => seed.status === 'draft').length > 0 && studio.visibleSeeds.filter((seed) => seed.status === 'draft').every((seed) => studio.selectedIds.includes(seed.id))} onchange={(event) => { const ids = studio.visibleSeeds.filter((seed) => seed.status === 'draft').map((seed) => seed.id); studio.selectedIds = (event.currentTarget as HTMLInputElement).checked ? [...new Set([...studio.selectedIds, ...ids])] : studio.selectedIds.filter((id) => !ids.includes(id)); }} /></th>
                  {#each ['id','repository','language'] as key}<th><button onclick={() => studio.sortBy(key as any)}>{key}<CaretUpDown size={11} aria-hidden="true" /></button></th>{/each}
                  <th>Kind</th><th><button onclick={() => studio.sortBy('title')}>Title<CaretUpDown size={11} aria-hidden="true" /></button></th><th><button onclick={() => studio.sortBy('status')}>Status<CaretUpDown size={11} aria-hidden="true" /></button></th><th>Difficulty</th><th>Deference</th><th>Commit</th><th><span class="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {#each studio.visibleSeeds as seed (seed.id)}
                    <tr class:selected={studio.selectedIds.includes(seed.id)} tabindex="0" onclick={(event) => { if (!(event.target as HTMLElement).closest('button,input')) studio.openSeed(seed.id); }} onkeydown={(event) => { if (event.key === 'Enter') studio.openSeed(seed.id); }}>
                      <td><input type="checkbox" aria-label={`Select ${seed.id}`} checked={studio.selectedIds.includes(seed.id)} disabled={seed.status !== 'draft'} onchange={() => studio.toggleSelection(seed.id)} /></td>
                      <td class="seed-id" title={seed.id}>{seed.id}</td><td>{seed.repository}</td><td>{seed.language}</td><td>{seed.kind}</td><td class="title-cell" title={seed.title}>{seed.title}</td>
                      <td><span class="badge {seed.status}">{pretty(seed.status)}</span>{#if seed.rejectClass}<span class="sr-only">Reject class {seed.rejectClass}</span>{/if}</td><td><span class="badge {seed.difficulty}">{seed.difficulty}</span></td><td title={seed.deferenceProfile}>{seed.deferenceProfile}</td><td class="commit" title={seed.pinnedCommit}>{seed.pinnedCommit}</td>
                      <td><div class="row-actions">{#if seed.status === 'draft'}<button class="row-button" onclick={() => studio.accept([seed.id], true)}>Accept</button><button class="row-button" onclick={() => openReject([seed.id], 'single')}>Reject</button>{:else}<button class="row-button" onclick={() => studio.openSeed(seed.id)}>Open</button>{/if}</div></td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <div class="empty" role="alert"><div><strong>No seeds match these filters</strong><span>{studio.activeFilterParts.join(' · ')}</span><br /><button class="button small" style="margin-top:12px" onclick={() => studio.clearFilters()}>Clear all filters</button></div></div>
            {/if}
          </div>
        </div>
      </section>
    {:else if studio.activeSeed}
      {@const seed = studio.activeSeed}
      {@const gate = studio.gateConditions(seed)}
      <section class="view" aria-label={`Authoring workbench for ${seed.id}`}>
        <div class="workbench-head card">
          <div>
            <div class="workbench-id"><h2>{seed.id}</h2><span class="badge {seed.status}">{pretty(seed.status)}</span><span class="badge {seed.difficulty}">{seed.difficulty}</span></div>
            <input class="workbench-title" aria-label="Seed title" title={seed.title} bind:value={seed.title} />
            <div class="meta-row"><span>{seed.repository}</span><span>{seed.language}</span><span>{seed.kind}</span><span>Deference: {seed.deferenceProfile}</span><span>Failure: {seed.failureModel}</span>{#if seed.rejectClass}<span>Reject class: {seed.rejectClass}</span>{/if}</div>
            <div class="meta-row"><span><GitCommit size={12} aria-hidden="true" />Pinned commit</span><span class="full-commit">{seed.pinnedCommit}</span><button class="button small" onclick={() => copyText(seed.pinnedCommit, 'Full commit hash copied')}><Copy size={12} aria-hidden="true" />Copy commit</button></div>
          </div>
          <div class="head-actions">
            <button class="button" onclick={() => { studio.saveAuthoring(seed); }} disabled={seed.status === 'rejected'}><FloppyDisk size={14} />Save workbench</button>
            <button class="button" onclick={() => studio.openExport(seed.id)} disabled={seed.status !== 'authored'}><PackageIcon size={14} />Export package</button>
            <button class="button primary" disabled={gate.length > 0 || seed.status === 'authored' || seed.status === 'rejected'} onclick={() => studio.markAuthored(seed)} title={gate.length > 0 ? `Unmet conditions: ${gate.join(', ')}` : 'Package gate clear'}><CheckCircle size={14} aria-hidden="true" />Mark authored</button>
          </div>
          {#if seed.status === 'rejected'}<div class="rejected-banner"><WarningCircle size={17} weight="fill" />This seed is rejected as {seed.rejectClass}. Authoring panes are read-only until triage is undone.</div>{/if}
        </div>

        <div class="gate card" class:unmet={gate.length > 0} class:clear={gate.length === 0}>
          <div class="gate-icon">{#if gate.length}<WarningCircle size={18} />{:else}<CheckCircle size={18} weight="fill" />{/if}</div>
          <div class="gate-copy"><strong>{gate.length ? 'Package gate blocked' : 'Package gate clear'}</strong><span>{gate.length ? `${gate.length} condition${gate.length === 1 ? '' : 's'} remain` : 'Ready to mark authored'}</span></div>
          <div class="gate-items">{#each gate as condition (condition)}<span class="gate-item">○ {condition}</span>{/each}{#if !gate.length}<span class="all-clear">All authoring conditions are satisfied</span>{/if}</div>
        </div>

        <nav class="pane-nav" aria-label="Workbench panes">{#each ['question','positive','negative','foils','golden'] as pane}<button class="button small" onclick={() => paneJump(pane)}>{pretty(pane)}</button>{/each}</nav>
        <div class="workbench-grid" aria-disabled={seed.status === 'rejected'}>
          <div id="pane-question" class="pane card">
            <div class="pane-head"><div><h3>Question</h3><p>Frame the investigation without leaking the solution.</p></div><span class="section-kicker">Required</span></div>
            <fieldset disabled={seed.status === 'rejected'} style="border:0;padding:0;margin:0">
              <div class="field"><label for="question-text">Investigation question</label><textarea id="question-text" class="control" class:error={!seed.authoring.questionText.trim()} rows="6" bind:value={seed.authoring.questionText}></textarea>{#if !seed.authoring.questionText.trim()}<span class="field-error">questionText is required to mark authored</span>{/if}</div>
              <div class="field"><span class="label">Under-specification checklist</span><div class="checklist">{#each checklistLabels as label, index}<label class="check-row"><input type="checkbox" bind:checked={seed.authoring.checklist[index]} />{label}</label>{/each}</div></div>
            </fieldset>
          </div>

          <div id="pane-foils" class="pane card">
            <div class="pane-head"><div><h3>Foils <span class="badge unset">{seed.authoring.foils.length}</span></h3><p>Deliberately wrong answers with explicit failure expectations.</p></div><button class="button small" disabled={seed.status === 'rejected'} onclick={() => openFoil(seed, null)}><Plus size={13} aria-hidden="true" />Add foil</button></div>
            <div class="foil-list">
              {#each seed.authoring.foils as foil, index (index)}
                {@const dangling = studio.danglingIds(seed, foil)}
                <article class="foil" class:warning={dangling.length > 0}>
                  <div class="foil-top"><span class="foil-number">F{index + 1}</span><p class="foil-answer">{foil.answerText}</p><div class="foil-actions"><button class="icon-button" aria-label={`Edit foil ${index + 1}`} disabled={seed.status === 'rejected'} onclick={() => openFoil(seed, index)}><FloppyDisk size={13} /></button><button class="icon-button" aria-label={`Delete foil ${index + 1}`} disabled={seed.status === 'rejected'} onclick={() => studio.deleteFoil(seed, index)}><Trash size={13} /></button></div></div>
                  <div class="foil-meta"><span>{foil.failureMode}</span><span>cap {foil.correctnessCap}%</span><span>expects fail:</span>{#each foil.expectsFailIds as id}<button class="id-chip" class:dangling={dangling.includes(id)} onclick={() => studio.jumpToCriterion(id)}>{id}</button>{/each}</div>
                  {#if dangling.length}<div class="warning-copy"><WarningCircle size={13} />Dangling expectsFailIds: {dangling.join(', ')}. Edit this foil to remove or remap the missing id.</div>{/if}
                </article>
              {:else}<div class="empty" role="alert" style="padding:26px"><div><strong>No foils authored</strong><span>Add at least three API-valid foils to pass the package gate.</span></div></div>{/each}
            </div>
          </div>

          <div id="pane-positive" class="pane card">
            <div class="pane-head"><div><h3>Positive rubric</h3><p>Criteria 1.x score evidence a correct answer must contain.</p></div><button class="button small" disabled={seed.status === 'rejected'} onclick={() => studio.addPositive(seed)}><Plus size={13} aria-hidden="true" />Add criterion</button></div>
            <fieldset disabled={seed.status === 'rejected'} style="border:0;padding:0;margin:0"><div class="criteria-list">
              {#each seed.authoring.positiveCriteria as criterion (criterion.id)}
                <article id={`criterion-${criterion.id.replace('.','-')}`} class="criterion" class:locked={criterion.id === '1.4'} class:highlight={studio.highlightedCriterion === criterion.id} aria-label={criterion.id === '1.4' ? 'Locked runtime-evidence criterion 1.4' : `Positive criterion ${criterion.id}`}>
                  <div class="criterion-top"><span class="criterion-id">{criterion.id}</span><input class="control" class:error={!!positiveIssue(criterion,'name')} aria-label={`${criterion.id} name`} maxlength="80" bind:value={criterion.name} /><input class="control weight" class:error={!!positiveIssue(criterion,'weight')} aria-label={`${criterion.id} weight`} type="number" min="0.5" max="5" step="0.5" bind:value={criterion.weight} /><button class="icon-button" aria-label={`Delete criterion ${criterion.id}`} disabled={criterion.id === '1.4'} title={criterion.id === '1.4' ? 'The runtime-evidence gate cannot be deleted' : 'Delete criterion'} onclick={() => studio.deletePositive(seed, criterion.id)}>{#if criterion.id === '1.4'}<LockSimple size={13} />{:else}<Trash size={13} />{/if}</button></div>
                  <textarea class="control" class:error={!!positiveIssue(criterion,'description')} aria-label={`${criterion.id} description`} maxlength="2000" bind:value={criterion.description}></textarea>
                  {#if positiveIssue(criterion,'name')}<div class="field-error">name: {positiveIssue(criterion,'name')}</div>{/if}{#if positiveIssue(criterion,'weight')}<div class="field-error">weight: {positiveIssue(criterion,'weight')}</div>{/if}{#if positiveIssue(criterion,'description')}<div class="field-error">description: {positiveIssue(criterion,'description')}</div>{/if}
                  {#if criterion.id === '1.4'}<div class="locked-note"><LockSimple size={11} weight="fill" aria-hidden="true" />Locked runtime-evidence gate · requires execution at {seed.pinnedCommit}</div>{/if}
                </article>
              {/each}
            </div></fieldset>
          </div>

          <div id="pane-negative" class="pane card">
            <div class="pane-head"><div><h3>Negative rubric</h3><p>Criteria 2.x describe answer patterns that must fail.</p></div><button class="button small" disabled={seed.status === 'rejected'} onclick={() => studio.addNegative(seed)}><Plus size={13} aria-hidden="true" />Add criterion</button></div>
            <fieldset disabled={seed.status === 'rejected'} style="border:0;padding:0;margin:0"><div class="criteria-list">
              {#each seed.authoring.negativeCriteria as criterion (criterion.id)}
                {@const linked = seed.authoring.foils.map((foil,index) => foil.expectsFailIds.includes(criterion.id) ? index + 1 : null).filter(Boolean)}
                <article id={`criterion-${criterion.id.replace('.','-')}`} class="criterion negative" class:highlight={studio.highlightedCriterion === criterion.id}>
                  <div class="criterion-top"><span class="criterion-id">{criterion.id}</span><input class="control" class:error={!!negativeIssue(criterion,'name')} aria-label={`${criterion.id} name`} maxlength="80" bind:value={criterion.name} /><select class="control criterion-select" aria-label={`${criterion.id} class`} bind:value={criterion.class}>{#each negativeClasses as value}<option value={value}>{value}</option>{/each}</select><button class="icon-button" aria-label={`Delete criterion ${criterion.id}`} onclick={() => studio.deleteNegative(seed, criterion.id)}><Trash size={13} /></button></div>
                  <textarea class="control" class:error={!!negativeIssue(criterion,'description')} aria-label={`${criterion.id} description`} maxlength="2000" bind:value={criterion.description}></textarea>
                  <div class="criterion-links"><span class="against">Matching this criterion counts against the answer.</span>{#if linked.length}<span>Referenced by foil {linked.join(', ')}</span>{:else}<span>No foil references yet</span>{/if}</div>
                  {#if negativeIssue(criterion,'name')}<div class="field-error">name: {negativeIssue(criterion,'name')}</div>{/if}{#if negativeIssue(criterion,'description')}<div class="field-error">description: {negativeIssue(criterion,'description')}</div>{/if}
                </article>
              {:else}<div class="empty" role="alert" style="padding:24px"><span>No negative criteria yet.</span></div>{/each}
            </div></fieldset>
          </div>

          <div id="pane-golden" class="pane card">
            <div class="pane-head"><div><h3>Golden answer</h3><p>Author directly or run the five-step evidence harvest.</p></div>{#if seed.authoring.golden.status !== 'none'}<span class="badge {seed.authoring.golden.status === 'harvest-pending' ? 'harvest-pending' : 'authored'}">{seed.authoring.golden.status}</span>{/if}</div>
            <fieldset disabled={seed.status === 'rejected'} style="border:0;padding:0;margin:0">
              {#if seed.authoring.golden.status === 'harvest-pending'}<div class="golden-state pending"><strong>Harvest pending</strong><p>{seed.authoring.golden.value}</p></div>{/if}
              <div class="field"><label for="golden-answer">Golden answer text</label><textarea id="golden-answer" class="control" rows="7" value={seed.authoring.golden.status === 'present' ? seed.authoring.golden.value : ''} oninput={(event) => seed.authoring.golden = { status: 'present', value: (event.currentTarget as HTMLTextAreaElement).value }}></textarea></div>
              <div class="field"><label for="harvest-justification">Harvest-pending justification</label><textarea id="harvest-justification" class="control" class:error={harvestTouched && !harvestResult.success} rows="3" aria-describedby={harvestTouched && fieldIssue(harvestResult, 'justification') ? "harvest-justification-error" : undefined} placeholder="Explain why runtime evidence must be harvested later (20 characters minimum)." bind:value={harvestJustification} oninput={() => harvestPendingForm.setFieldValue('justification', harvestJustification)}></textarea>{#if harvestTouched && fieldIssue(harvestResult,'justification')}<span class="field-error" id="harvest-justification-error" role="alert">justification: {fieldIssue(harvestResult,'justification')}</span>{/if}<button class="button small amber" disabled={!harvestResult.success} onclick={() => harvestPendingForm.handleSubmit()}>Set harvest-pending</button></div>
              <div class="harvest-controls"><button class="button primary" disabled={seed.authoring.harvest.running} onclick={() => studio.startHarvest(seed)}><Play size={13} aria-hidden="true" />Run harvest</button>{#if seed.authoring.harvest.running && !seed.authoring.harvest.paused}<button class="button" onclick={() => studio.pauseHarvest(seed)}><Pause size={13} aria-hidden="true" />Pause harvest</button>{/if}{#if seed.authoring.harvest.running && seed.authoring.harvest.paused}<button class="button" onclick={() => studio.resumeHarvest(seed)}><Play size={13} aria-hidden="true" />Resume harvest</button>{/if}</div>
              {#if seed.authoring.harvest.steps.length}<div class="step-list">{#each seed.authoring.harvest.steps as step, index}<div class="step {step.status}"><span class="step-icon">{#if step.status === 'complete'}<Check size={11} weight="bold" aria-hidden="true" />{:else}{index + 1}{/if}</span><div><strong>{step.name}</strong><span>{step.status}{#if step.attempt > 1} · retry {step.attempt} of 3{/if}{#if step.backoff > 0} · retrying in {step.backoff}s{/if}{#if step.completedAt} · {new Date(step.completedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}{/if}</span>{#if step.error}<div class="field-error">{step.error}</div>{/if}</div>{#if step.status === 'failed'}<button class="button small" onclick={() => studio.retryHarvest(seed,index)}>Retry</button>{/if}</div>{/each}</div>{/if}
            </fieldset>
          </div>

          <div id="pane-timeline" class="pane card" role="region" aria-label="Seed Timeline">
            <div class="pane-head"><div><h3>Lifecycle timeline</h3><p>Status, authoring, harvest, and export events in session order.</p></div><select class="control timeline-filter" aria-label="Filter timeline by event type" bind:value={seed.timelineFilter}><option value="all">All events</option><option value="transition">Transitions</option><option value="triage">Triage</option><option value="save">Saves</option><option value="harvest">Harvest</option><option value="export">Exports</option></select></div>
            <div class="timeline">{#if timelineFor(seed).length === 0}<div class="empty" role="alert" style="padding:25px"><span>No events are recorded for this seed.</span></div>{/if}{#each timelineFor(seed) as entry, i (entry.id)}<div class="timeline-entry {entry.type}"><span class="timeline-dot"></span><strong>{entry.label}</strong><time datetime={entry.timestamp}>{new Date(entry.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time></div>{:else}<div class="empty" style="padding:25px"><span>No {seed.timelineFilter} events matched. Try clearing the filter.</span></div>{/each}</div>
          </div>
        </div>
      </section>
    {/if}
  </main>

  {#if studio.selectedIds.length}
    <div class="batch-bar" aria-label="Selection toolbar"><strong>{studio.selectedIds.length} selected</strong><button class="button small" disabled={!selectedDrafts().length} onclick={() => studio.accept(selectedDrafts())}>Accept for authoring</button><button class="button small danger" disabled={!selectedDrafts().length} onclick={() => openReject(selectedDrafts(), 'batch')}>Batch reject</button><button class="icon-button" aria-label="Clear selection" onclick={() => studio.clearSelection()}><X size={14} /></button></div>
  {/if}

  <Modal open={studio.rejectOpen} title={studio.rejectMode === 'batch' ? `Batch reject ${studio.rejectTargetIds.length} seeds` : 'Reject seed'} description="This validated record is the exact RejectSeed API request body." onclose={() => studio.rejectOpen = false}>
    <form onsubmit={(event) => { event.preventDefault(); rejectForm.handleSubmit(); }}>
      <div class="field"><label for="reject-class">Reject class</label><select id="reject-class" class="control" class:error={rejectTouched && !!fieldIssue(rejectResult,'rejectClass')} value={rejectClass} onchange={(event) => { rejectClass = (event.currentTarget as HTMLSelectElement).value; rejectForm.setFieldValue('rejectClass', rejectClass); rejectTouched = true; }}><option value="">Select reject class</option>{#each rejectClasses as value}<option value={value}>{value}</option>{/each}</select>{#if rejectTouched && fieldIssue(rejectResult,'rejectClass')}<span class="field-error">rejectClass: {fieldIssue(rejectResult,'rejectClass')}</span>{/if}</div>
      <div class="field"><label for="reject-justification">Justification</label><textarea id="reject-justification" class="control" class:error={rejectTouched && !!fieldIssue(rejectResult,'justification')} rows="5" placeholder="Explain why this report cannot support a benchmark seed." value={rejectJustification} oninput={(event) => { rejectJustification = (event.currentTarget as HTMLTextAreaElement).value; rejectForm.setFieldValue('justification', rejectJustification); rejectTouched = true; }}></textarea><span class="help">Minimum 20 trimmed characters · {rejectJustification.trim().length}/20</span>{#if rejectTouched && fieldIssue(rejectResult,'justification')}<span class="field-error" id="reject-justification-error" role="alert">justification: {fieldIssue(rejectResult,'justification')}</span>{/if}</div>
      <div class="form-actions"><button type="button" class="button" onclick={() => studio.rejectOpen = false}>Cancel</button><button type="submit" class="button danger" disabled={!rejectResult.success}>{studio.rejectMode === 'batch' ? 'Reject selected seeds' : 'Reject seed'}</button></div>
    </form>
  </Modal>

  <Modal open={studio.foilEditorOpen} title={studio.foilEditingIndex === null ? 'Add foil' : `Edit foil ${studio.foilEditingIndex + 1}`} description="The submitted record mirrors the FoilUpsert field contract." onclose={() => studio.foilEditorOpen = false}>
    {#if studio.activeSeed}
      <form onsubmit={(event) => { event.preventDefault(); foilForm.handleSubmit(); }}>
        <div class="field"><label for="foil-answer">Answer text</label><textarea id="foil-answer" class="control" class:error={foilTouched && !!fieldIssue(foilResult,'answerText')} rows="6" maxlength="4000" bind:value={foilDraft.answerText} oninput={() => { foilForm.setFieldValue('answerText',foilDraft.answerText); foilTouched = true; }}></textarea>{#if foilTouched && fieldIssue(foilResult,'answerText')}<span class="field-error">answerText: {fieldIssue(foilResult,'answerText')}</span>{/if}</div>
        <div class="field"><label for="failure-mode">Failure mode</label><select id="failure-mode" class="control" bind:value={foilDraft.failureMode} onchange={() => foilForm.setFieldValue('failureMode',foilDraft.failureMode)}>{#each failureModes as value}<option value={value}>{value}</option>{/each}</select></div>
        <div class="field"><span class="label">Expects-fail criterion ids</span><div class="expects-grid">{#each [...studio.activeSeed.authoring.positiveCriteria,...studio.activeSeed.authoring.negativeCriteria] as criterion}<label class="expects-option"><input type="checkbox" checked={foilDraft.expectsFailIds.includes(criterion.id)} onchange={() => { toggleFoilId(criterion.id); foilTouched = true; }} />{criterion.id}</label>{/each}{#each foilDraft.expectsFailIds.filter(id => !studio.activeSeed.authoring.positiveCriteria.find(c => c.id === id) && !studio.activeSeed.authoring.negativeCriteria.find(c => c.id === id)) as danglingId}<label class="expects-option dangling"><input type="checkbox" checked={true} onchange={() => { toggleFoilId(danglingId); foilTouched = true; }} />{danglingId} (missing)</label>{/each}</div>{#if foilTouched && fieldIssue(foilResult,'expectsFailIds')}<span class="field-error">expectsFailIds: {fieldIssue(foilResult,'expectsFailIds')}</span>{/if}</div>
        <div class="field"><label for="correctness-cap">Correctness cap (0–40%)</label><input id="correctness-cap" class="control" class:error={foilTouched && !!fieldIssue(foilResult,'correctnessCap')} type="number" min="0" max="40" bind:value={foilDraft.correctnessCap} oninput={() => { foilForm.setFieldValue('correctnessCap',foilDraft.correctnessCap); foilTouched = true; }} />{#if foilTouched && fieldIssue(foilResult,'correctnessCap')}<span class="field-error">correctnessCap: {fieldIssue(foilResult,'correctnessCap')}</span>{/if}</div>
        <div class="form-actions"><button type="button" class="button" onclick={() => studio.foilEditorOpen = false}>Cancel</button><button type="submit" class="button primary" disabled={!foilResult.success}>{studio.foilEditingIndex === null ? 'Add foil' : 'Save foil'}</button></div>
      </form>
    {/if}
  </Modal>

  <Modal open={studio.exportOpen} title="Export center" description="All three artifacts are compiled live from the current session state." onclose={() => studio.exportOpen = false}>
    <div class="export-tabs" role="tablist" aria-label="Export formats"><button class:active={studio.exportTab === 'manifest'} role="tab" aria-selected={studio.exportTab === 'manifest'} onclick={() => studio.exportTab = 'manifest'}>Package manifest JSON</button><button class:active={studio.exportTab === 'snapshot'} role="tab" aria-selected={studio.exportTab === 'snapshot'} onclick={() => studio.exportTab = 'snapshot'}>Dataset snapshot JSON</button><button class:active={studio.exportTab === 'studio'} role="tab" aria-selected={studio.exportTab === 'studio'} onclick={() => studio.exportTab = 'studio'}>Dataset studio package JSON</button></div>
    <pre class="preview" aria-label={`${studio.exportTab} JSON preview`}>{studio.preview(studio.exportTab)}</pre>
    <div class="export-foot"><span class="seed-name">{studio.exportTab === 'manifest' ? `Generated for ${studio.activeSeed?.id ?? 'no selected seed'}` : `${studio.seeds.length} live seeds · ${studio.rollup.byStatus.authored} authored packages`}</span><button class="button" onclick={copyPreview}><Copy size={13} />Copy {studio.exportTab === 'manifest' ? 'manifest' : studio.exportTab === 'snapshot' ? 'snapshot' : 'studio package'}</button><button class="button primary" onclick={downloadPreview}><DownloadSimple size={13} />Download {studio.exportTab === 'manifest' ? 'manifest' : studio.exportTab === 'snapshot' ? 'snapshot' : 'studio package'}</button></div>
  </Modal>

  <Modal open={studio.importOpen} title="Import package" description="Paste or choose a DatasetStudioPackage JSON document. Invalid data never mutates the studio." onclose={() => studio.importOpen = false}>
    <form class="import-surface" onsubmit={(event) => { event.preventDefault(); importForm.handleSubmit(); }}>
      <div class="field"><label for="import-file">Choose DatasetStudioPackage file</label><input id="import-file" class="control" type="file" accept="application/json,.json" onchange={readImportFile} /></div>
      <div class="field"><label for="import-text">Package JSON</label><textarea id="import-text" class="control" class:error={!!studio.importError} placeholder="Paste the exported dataset studio package JSON." bind:value={studio.importText} oninput={() => { studio.importError = ''; }}></textarea>{#if studio.importError}<span class="field-error" role="alert">{studio.importError}</span>{/if}{#if importTouched && !studio.importText.trim()}<span class="field-error">package: DatasetStudioPackage JSON is required</span>{/if}</div>
      <div class="form-actions"><button type="button" class="button" onclick={() => studio.importOpen = false}>Cancel</button><button type="submit" class="button primary" disabled={!studio.importText.trim()}>Import package</button></div>
    </form>
  </Modal>

  {#if studio.toast}<div class="toast" role="status"><CheckCircle size={15} weight="fill" />{studio.toast}</div>{/if}
  <div class="sr-only" aria-live="polite" aria-atomic="true">{studio.ariaMessage}</div>
</div>
