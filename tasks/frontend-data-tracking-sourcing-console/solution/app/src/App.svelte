<script>
  import { onMount, tick } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { createForm } from '@tanstack/svelte-form';
  import { z } from 'zod';
  import {
    IconSearch, IconFilterOff, IconChevronUp, IconChevronDown, IconPin, IconPlayerPlay,
    IconTrash, IconCopy, IconDownload, IconUpload, IconFileExport, IconTerminal2, IconCommand,
    IconRotateClockwise, IconArrowBackUp, IconListCheck, IconX, IconGripVertical, IconCheck,
    IconAlertTriangle, IconDotsVertical, IconDatabaseImport, IconSparkles, IconGitBranch,
    IconKeyboard, IconBookmark, IconCamera, IconScale, IconLoader2
  } from '@tabler/icons-svelte';
  import {
    app, LANGUAGES, LICENSES, STATUSES, BANDS, REASONS, TIMELINE_TYPES, titleCase, getBand,
    randomCommit, rejectionSchema, pinSchema, packSchema, samplePack, orgHue
  } from './lib/state.svelte.js';
  import { registerWebMCP } from './lib/webmcp.js';

  const stepNames = ['Querying','Scoring','Classifying'];
  const exportTabs = [
    { id:'queue-json', label:'Queue JSON', filename:'sourcebench-queue.json', type:'application/json' },
    { id:'candidates-csv', label:'Candidates CSV', filename:'sourcebench-candidates.csv', type:'text/csv' },
    { id:'sourcing-report', label:'Sourcing report', filename:'sourcebench-report.md', type:'text/markdown' }
  ];
  const shortcuts = [
    ['Open command palette', ['⌘/Ctrl','K']],
    ['Undo the last action', ['⌘/Ctrl','Z']],
    ['Redo the last action', ['⌘/Ctrl','⇧','Z']],
    ['Close the topmost overlay', ['Esc']],
    ['Move a focused queue entry', ['Alt','↑','↓']],
    ['Cycle through controls', ['Tab','⇧','Tab']]
  ];

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = $state(motionQuery.matches);
  const D = (ms) => reduced ? 0 : ms;

  let rejectReason = $state('');
  let rejectionError = $state('');
  let pinNotes = $state('');
  let pinError = $state('');
  let pinBusy = $state(false);
  let importRaw = $state('');
  let importError = $state('');
  let importBusy = $state(false);
  let exportTab = $state('queue-json');
  let panelAt = $state('');
  let copied = $state('');
  let paletteOpen = $state(false);
  let paletteQuery = $state('');
  let paletteReturnFocus = null;
  let paletteInput = $state(null);
  let dragId = $state('');
  let modalReturnFocus = null;
  let panelReturnFocus = null;
  let coachDismissed = $state(false);
  let presetName = $state('');
  let compareOpen = $state(false);
  let modalCard = $state(null);
  let panelCard = $state(null);
  let paletteCard = $state(null);

  const importFormSchema = z.object({ raw:z.string().min(1,'JSON field: paste a sourcing pack or choose the sample.').superRefine((raw,ctx) => {
    let data; try { data=JSON.parse(raw); } catch { ctx.addIssue({code:'custom',message:'JSON field: enter valid JSON.'}); return; }
    const result=packSchema.safeParse(data); if (!result.success) ctx.addIssue({code:'custom',message:`${result.error.issues[0].path.join('.') || 'document'} field: ${result.error.issues[0].message}`});
  }) });

  const rejectionForm = createForm(() => ({
    defaultValues:{reason:''}, validators:{onSubmit:rejectionSchema},
    onSubmit:({value}) => {
      const result=app.modal?.bulk ? app.bulk('reject',value.reason) : app.reject(app.modal?.ids ?? [],value.reason);
      if (result?.ok) closeModal(); else rejectionError=result?.error || 'Reason field: choose a reason.';
    }
  }));
  const pinForm = createForm(() => ({
    defaultValues:{notes:''}, validators:{onSubmit:pinSchema},
    onSubmit:({value}) => { const result=app.pin(app.modal?.id,value.notes,app.modal?.commit); if(result.ok) closeModal(); else pinError=result.error; }
  }));
  const importForm = createForm(() => ({
    defaultValues:{raw:''}, validators:{onSubmit:importFormSchema},
    onSubmit: async () => {
      importBusy=true;
      await new Promise((resolve)=>setTimeout(resolve, reduced?40:550));
      const result=app.importPack(importRaw);
      importBusy=false;
      if (result.ok) closePanel(); else importError=result.error;
    }
  }));

  function focusables(card) {
    return card ? [...card.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter((node)=>node.offsetParent!==null) : [];
  }
  function focusDialog(getCard) {
    tick().then(()=>{ const card=getCard(); const target=card?.querySelector('[data-autofocus]') || focusables(card)[0]; target?.focus(); });
  }
  function trapTab(event, card) {
    if (event.key!=='Tab' || !card) return;
    const nodes=focusables(card); if (!nodes.length) return;
    const first=nodes[0], last=nodes.at(-1);
    if (event.shiftKey && (document.activeElement===first || !card.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement===last || !card.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }

  function openReject(ids, bulk=false) {
    modalReturnFocus=document.activeElement; rejectReason=''; rejectionError=''; rejectionForm.reset(); app.modal={type:'reject',ids,bulk}; focusDialog(()=>modalCard);
  }
  function openPin(candidate) {
    modalReturnFocus=document.activeElement; pinNotes=''; pinError=''; pinBusy=false; pinForm.reset(); app.modal={type:'pin',id:candidate.id,commit:randomCommit()}; focusDialog(()=>modalCard);
  }
  function openHelp() {
    modalReturnFocus=document.activeElement; app.modal={type:'help'}; focusDialog(()=>modalCard);
  }
  function openPanel(type) {
    panelReturnFocus=document.activeElement;
    if(type==='export') { panelAt=new Date().toISOString(); exportTab='queue-json'; compareOpen=false; app.sessionFlags.export=true; }
    if(type==='import') { importRaw=''; importError=''; importBusy=false; importForm.reset(); }
    app.panel=type; app.mobileMenu=false; focusDialog(()=>panelCard);
  }
  function openExportSurface(format, focusCopy=false) {
    const tabByFormat = { 'queue-json':'queue-json', 'candidates-csv':'candidates-csv', 'sourcing-report-markdown':'sourcing-report' };
    openPanel('export'); exportTab=tabByFormat[format];
    if (focusCopy) tick().then(()=>document.getElementById('export-copy')?.focus());
  }
  function closeModal() { app.modal=null; rejectionError=''; pinError=''; pinBusy=false; tick().then(()=>modalReturnFocus?.focus?.()); }
  function closePanel() { app.panel=null; importError=''; importBusy=false; tick().then(()=>panelReturnFocus?.focus?.()); }
  function openPalette() { paletteReturnFocus=document.activeElement; paletteQuery=''; paletteOpen=true; tick().then(()=>paletteInput?.focus()); }
  function closePalette() { paletteOpen=false; tick().then(()=>paletteReturnFocus?.focus?.()); }

  async function submitReject() {
    rejectionError=''; rejectionForm.setFieldValue('reason',rejectReason);
    const parsed=rejectionSchema.safeParse({reason:rejectReason});
    if(!parsed.success){ rejectionError=parsed.error.issues[0].message; return; }
    await rejectionForm.handleSubmit();
  }
  async function submitPin() {
    if (pinBusy) return;
    pinError=''; pinForm.setFieldValue('notes',pinNotes);
    const parsed=pinSchema.safeParse({notes:pinNotes});
    if(!parsed.success){ pinError=parsed.error.issues[0].message; return; }
    pinBusy=true; await pinForm.handleSubmit(); pinBusy=false;
  }
  async function submitImport() {
    importError=''; importForm.setFieldValue('raw',importRaw);
    const parsed=importFormSchema.safeParse({raw:importRaw});
    if(!parsed.success){ importError=parsed.error.issues[0].message; return; }
    await importForm.handleSubmit();
  }

  function statusAction(candidate,action) {
    app.focusedId=candidate.id;
    if(action==='score') { if(app.score([candidate.id])) app.notify(`${candidate.name} scored at ${candidate.difficulty.toFixed(1)}.`); }
    if(action==='select') { if(app.select([candidate.id])) app.notify(`${candidate.name} selected.`); }
    if(action==='reject') openReject([candidate.id]);
    if(action==='pin') openPin(candidate);
    if(action==='queue') app.enqueue(candidate.id);
  }
  function toggleVisibleSelection() {
    const all=app.visibleCandidates.length>0 && app.visibleCandidates.every((candidate)=>app.selectedIds.includes(candidate.id)); app.selectAllVisible(!all);
  }
  function switchView(view) { app.activeView=view; app.queueOpen=false; app.mobileMenu=false; }
  function sortLabel(key) { return app.sort.key===key ? (app.sort.direction==='asc'?'ascending':'descending') : 'none'; }
  async function copyText(text,label) {
    try { await navigator.clipboard.writeText(text); copied=label; app.notify(`${label} copied to the clipboard.`); setTimeout(()=>copied='',1800); }
    catch { app.notify('Copy was blocked by the browser.','warning'); }
  }
  function downloadActive() {
    const tab=exportTabs.find((item)=>item.id===exportTab); const text=exportTexts[exportTab];
    const url=URL.createObjectURL(new Blob([text],{type:tab.type})); const anchor=document.createElement('a'); anchor.href=url; anchor.download=tab.filename; anchor.click(); URL.revokeObjectURL(url); app.notify(`${tab.label} download prepared.`);
  }
  async function loadFile(event) {
    const file=event.currentTarget.files?.[0]; if(!file)return; importRaw=await file.text(); importForm.setFieldValue('raw',importRaw); importError='';
  }
  function savePresetUI() { if (app.savePreset(presetName)) { presetName=''; app.notify('Filter preset saved.'); } }
  function highlightName(name) {
    const query=app.filters.search.trim().toLowerCase(); if (!query) return null;
    const index=name.toLowerCase().indexOf(query); if (index<0) return null;
    return [name.slice(0,index), name.slice(index,index+query.length), name.slice(index+query.length)];
  }

  function paletteItems() {
    const base=[
      ['Candidates','Destination','candidates'],['Quota','Destination','quota'],['Timeline','Destination','timeline'],['Build queue','Destination','build-queue'],
      ['Fetch more candidates','Action','fetch'],['Export sourcing pack','Action','export'],['Import sourcing pack','Action','import'],['Keyboard shortcuts','Action','help']
    ];
    const candidate=app.find(app.focusedId) || app.find(app.selectedIds[0]);
    if(candidate){ if(candidate.status==='candidate')base.push([`Score ${candidate.name}`,'Candidate action','score']); if(candidate.status==='scored')base.push([`Select ${candidate.name}`,'Candidate action','select'],[`Reject ${candidate.name}`,'Candidate action','reject']); if(candidate.status==='selected')base.push([`Pin ${candidate.name}`,'Candidate action','pin']); if(candidate.status==='pinned')base.push([`Queue ${candidate.name}`,'Candidate action','queue']); }
    const chars=paletteQuery.toLowerCase().replaceAll(' ',''); return base.filter((item)=>{ let index=0; const label=item[0].toLowerCase(); for(const char of chars){index=label.indexOf(char,index);if(index<0)return false;index++;}return true; });
  }
  function choosePalette(code) {
    const candidate=app.find(app.focusedId) || app.find(app.selectedIds[0]); closePalette();
    if(['candidates','quota','timeline','build-queue'].includes(code)) switchView(code);
    else if(code==='fetch') app.fetchMore(reduced?60:800);
    else if(code==='export'||code==='import') setTimeout(()=>openPanel(code), reduced?0:260);
    else if(code==='help') setTimeout(()=>openHelp(), reduced?0:260);
    else if(candidate) setTimeout(()=>statusAction(candidate,code), reduced?0:260);
  }
  function keydown(event) {
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){ event.preventDefault(); paletteOpen?closePalette():openPalette(); return; }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){ event.preventDefault(); event.shiftKey?app.redo():app.undo(); return; }
    if(event.key==='Escape'){
      if(paletteOpen){ event.preventDefault(); closePalette(); }
      else if(app.modal){ event.preventDefault(); closeModal(); }
      else if(app.panel){ event.preventDefault(); closePanel(); }
    }
  }
  function queueDrop(event,targetIndex) { event.preventDefault(); if(dragId)app.reorder(dragId,targetIndex); dragId=''; }
  function queueKey(event,id,index) {
    if(event.altKey&&(event.key==='ArrowUp'||event.key==='ArrowDown')){ event.preventDefault(); app.reorder(id, index+(event.key==='ArrowUp'?-1:1)); }
  }

  const exportTexts = $derived({
    'queue-json': app.exportText('queue-json', panelAt),
    'candidates-csv': app.exportText('candidates-csv', panelAt),
    'sourcing-report': app.exportText('sourcing-report', panelAt)
  });
  const importPreview = $derived(importRaw.trim() ? app.importDiff(importRaw) : null);
  const sparkValues = $derived(app.fillHistory.length >= 2 ? app.fillHistory : [app.fillHistory[0] ?? 0, app.fillHistory[0] ?? 0]);
  const sparkPoints = $derived(sparkValues.map((value,i)=>`${(i*(120/Math.max(1,sparkValues.length-1))).toFixed(1)},${(26-(value/100)*22).toFixed(1)}`).join(' '));
  const coachSteps = $derived([
    { label:'Score', done:app.sessionFlags.score },
    { label:'Select', done:app.sessionFlags.select },
    { label:'Pin', done:app.sessionFlags.pin },
    { label:'Queue', done:app.sessionFlags.queue },
    { label:'Export', done:app.sessionFlags.export }
  ]);

  onMount(() => {
    const onMotion=(event)=>reduced=event.matches;
    motionQuery.addEventListener('change',onMotion);
    window.addEventListener('keydown',keydown);
    registerWebMCP(app,{
      openPanel, openExportSurface, openPalette, statusAction, closeModal,
      setRejectionError:(message)=>{rejectionError=message},
      setPinError:(message)=>{pinError=message},
      openRejectForValidation:()=>{ const target=app.candidates.find((c)=>c.status==='scored'); if(target&&app.modal?.type!=='reject') openReject([target.id]); },
      openPinForValidation:()=>{ const target=app.candidates.find((c)=>c.status==='selected'); if(target&&app.modal?.type!=='pin') openPin(target); }
    });
    return()=>{ motionQuery.removeEventListener('change',onMotion); window.removeEventListener('keydown',keydown); };
  });
</script>

<svelte:head><meta name="description" content="Repository sourcing and benchmark build-queue console" /></svelte:head>

<div class="min-h-screen">
  <header class="sticky top-0 z-[80] border-b border-[#29415a] bg-[#091626]/95 backdrop-blur-xl">
    <div class="flex h-16 items-center gap-4 px-4 lg:px-6">
      <button class="flex shrink-0 items-center gap-3 text-left" onclick={()=>switchView('candidates')} aria-label="Sourcebench home">
        <span class="grid size-9 place-items-center rounded-sm bg-[#55d6be] text-[#081713]"><IconTerminal2 size={20}/></span>
        <span><span class="block text-[15px] font-semibold leading-none">Sourcebench</span><span class="mt-1 block text-[10px] uppercase tracking-[.16em] text-[#7796b2]">Sourcing console</span></span>
      </button>
      <nav class="primary-nav hidden h-full items-stretch md:flex" aria-label="Primary navigation">
        {#each [['candidates','Candidates'],['quota','Quota'],['timeline','Timeline']] as item}
          <button class="relative px-4 text-xs font-semibold transition-colors hover:bg-[#12273c] hover:text-white {app.activeView===item[0]?'text-[#6ee1cb]':'text-[#9ab0c5]'}" onclick={()=>switchView(item[0])} aria-current={app.activeView===item[0]?'page':undefined}>{item[1]}{#if app.activeView===item[0]}<span class="absolute inset-x-3 bottom-0 h-0.5 bg-[#55d6be]"></span>{/if}</button>
        {/each}
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <div class="desktop-actions flex items-center gap-1 border-r border-[#29415a] pr-2">
          <button class="btn-soft icon-btn" onclick={()=>app.undo()} disabled={!app.undoStack.length} aria-label="Undo" title="Undo (Ctrl/Command-Z)"><IconArrowBackUp size={17}/></button>
          <button class="btn-soft icon-btn" onclick={()=>app.redo()} disabled={!app.redoStack.length} aria-label="Redo" title="Redo (Ctrl/Command-Shift-Z)"><IconRotateClockwise size={17}/></button>
        </div>
        <button class="btn-soft desktop-actions" onclick={()=>openPanel('import')}><IconDatabaseImport size={16}/>Import</button>
        <button class="btn-soft desktop-actions" onclick={()=>openPanel('export')}><IconFileExport size={16}/>Export pack</button>
        <button class="btn-soft icon-btn desktop-actions" onclick={openHelp} aria-label="Keyboard shortcuts" title="Keyboard shortcuts"><IconKeyboard size={17}/></button>
        <button class="btn-soft sm-command hidden sm:inline-flex" onclick={openPalette} aria-label="Open command palette"><IconCommand size={16}/><span class="hidden lg:inline">Commands</span><kbd class="hidden rounded border border-[#3b5269] px-1 text-[10px] text-[#88a0b6] lg:inline">⌘K</kbd></button>
        <button class="btn-soft relative" onclick={()=>app.queueOpen=!app.queueOpen} aria-label="Toggle build queue"><IconListCheck size={17}/><span class="hidden sm:inline">Queue</span><span class="rounded-full bg-[#55d6be] px-1.5 text-[10px] font-bold text-[#071712]">{app.queue.length}</span></button>
        <button class="btn-soft icon-btn mobile-only" onclick={()=>app.mobileMenu=!app.mobileMenu} aria-label="More actions"><IconDotsVertical size={18}/></button>
      </div>
    </div>
    {#if app.mobileMenu}
      <div class="mobile-only grid grid-cols-2 gap-2 border-t border-[#29415a] bg-[#0d1c2e] p-3" transition:fly={{y:-8,duration:D(180)}}>
        <button class="btn-soft" onclick={()=>app.undo()} disabled={!app.undoStack.length}>Undo</button><button class="btn-soft" onclick={()=>app.redo()} disabled={!app.redoStack.length}>Redo</button>
        <button class="btn-soft" onclick={()=>openPanel('import')}>Import</button><button class="btn-soft" onclick={()=>openPanel('export')}>Export</button>
        <button class="btn-soft" onclick={openPalette}>Command palette</button><button class="btn-soft" onclick={openHelp}>Keyboard shortcuts</button>
      </div>
    {/if}
  </header>

  <div class="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-3 lg:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <main class="min-w-0">
      {#if app.activeView==='candidates'}
        <section aria-labelledby="candidates-title">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><div class="eyebrow">Repository intake</div><h1 id="candidates-title" class="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">Candidate workbench</h1><p class="mt-1 text-sm text-[#8ea6bc]">Score, guard, and freeze benchmark-ready repositories.</p></div>
            <button class="btn-soft btn-primary" onclick={()=>app.fetchMore(reduced?60:800)} disabled={app.fetchState.running}><IconSparkles size={17}/>{app.fetchState.running?'Sourcing in progress…':'Fetch more candidates'}</button>
          </div>

          {#if !coachDismissed}
            <div class="surface mb-4 p-4" aria-label="Sourcing walkthrough" in:fade={{duration:D(300)}}>
              <div class="flex flex-wrap items-center gap-3">
                <span class="eyebrow">First-run guide</span>
                <ol class="flex flex-wrap items-center gap-2" aria-label="Sourcing loop progress">
                  {#each coachSteps as step, i (step.label)}
                    <li class="coach-step" class:done={step.done}>{#if step.done}<IconCheck size={12}/>{/if}{i+1}. {step.label}</li>
                    {#if i<coachSteps.length-1}<li aria-hidden="true" class="coach-arrow">→</li>{/if}
                  {/each}
                </ol>
                <button class="btn-soft btn-mini ml-auto" onclick={()=>coachDismissed=true}>Dismiss guide</button>
              </div>
              <p class="mt-2 text-[11px] leading-relaxed text-[#86a0b6]">The core loop: Score → Select → Pin → Queue → Export. Checks fill in as you work; dismissing never blocks any action.</p>
            </div>
          {/if}

          <div class="rollups mb-4 grid grid-cols-4 gap-px overflow-hidden border border-[#29415a] bg-[#29415a] lg:grid-cols-8">
            {#each STATUSES as status}<div class="bg-[#0f2034] p-3"><div class="text-[10px] font-bold uppercase tracking-wider text-[#7892aa]">{titleCase(status)}</div><div class="mt-1 text-xl font-semibold tabular-nums">{app.rollups[status]}</div></div>{/each}
            <div class="bg-[#132a3e] p-3"><div class="text-[10px] font-bold uppercase tracking-wider text-[#7fcbbd]">Quota fill</div><div class="mt-1 text-xl font-semibold tabular-nums text-[#70dfca]">{app.quotaFillPercent}%</div></div>
            <div class="bg-[#132a3e] p-3"><div class="text-[10px] font-bold uppercase tracking-wider text-[#7fcbbd]">Queue</div><div class="mt-1 text-xl font-semibold tabular-nums text-[#70dfca]">{app.queue.length}</div></div>
          </div>

          {#if app.fetchState.running || app.fetchState.steps.some((step)=>step==='complete')}
            <div class="surface mb-4 flex flex-wrap items-center gap-4 p-3" aria-label="Fetch more candidates progress">
              <div class="mr-2"><div class="text-xs font-semibold">Sourcing run {app.fetchState.runs+1}</div><div class="text-[11px] text-[#87a0b6]">Six distinct repositories per run</div></div>
              {#each stepNames as name,index (name)}<div class="flex items-center gap-2"><span class="progress-dot {app.fetchState.steps[index]}"></span><span class="text-xs">{name}</span><span class="text-[10px] uppercase text-[#7891a8]">{app.fetchState.steps[index]}</span></div>{/each}
            </div>
          {/if}

          <div class="surface mb-3 p-3">
            <div class="filters">
              <label class="search-field"><span class="filter-label">Search repositories</span><span class="relative block"><IconSearch class="pointer-events-none absolute left-3 top-2.5 text-[#7290aa]" size={17}/><input class="field pl-9" type="search" placeholder="org/repository substring" bind:value={app.filters.search} oninput={()=>app.selectedIds=[]}/></span></label>
              <label><span class="filter-label">Language</span><select class="field" bind:value={app.filters.language} onchange={()=>app.selectedIds=[]}><option value="">All languages</option>{#each LANGUAGES as language}<option>{language}</option>{/each}</select></label>
              <label><span class="filter-label">Difficulty band</span><select class="field" bind:value={app.filters.band} onchange={()=>app.selectedIds=[]}><option value="">All difficulty</option>{#each BANDS as band}<option value={band}>{titleCase(band)}</option>{/each}</select></label>
              <label><span class="filter-label">License</span><select class="field" bind:value={app.filters.license} onchange={()=>app.selectedIds=[]}><option value="">All licenses</option>{#each LICENSES as license}<option value={license}>{titleCase(license)}</option>{/each}</select></label>
              <label><span class="filter-label">Status</span><select class="field" bind:value={app.filters.status} onchange={()=>app.selectedIds=[]}><option value="">All statuses</option>{#each STATUSES as status}<option value={status}>{titleCase(status)}</option>{/each}</select></label>
              <div class="flex flex-col justify-end"><button class="btn-soft" onclick={()=>app.clearFilters()} disabled={!app.activeFilterLabels.length}><IconFilterOff size={16}/>Clear</button></div>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-[#223750] pt-3">
              <span class="text-[10px] font-bold uppercase tracking-[.09em] text-[#7d97ad]">Presets</span>
              {#each app.presets as preset (preset.id)}
                <span class="preset-chip"><button class="preset-apply" onclick={()=>{app.applyPreset(preset.id);app.notify(`Preset “${preset.name}” applied.`)}} title="Apply this filter preset">{preset.name}</button><button class="preset-del" aria-label={`Delete preset ${preset.name}`} onclick={()=>app.deletePreset(preset.id)}>×</button></span>
              {:else}<span class="text-[11px] text-[#607c95]">None saved yet</span>{/each}
              <span class="ml-auto flex items-center gap-1.5"><input class="field field-mini" aria-label="New preset name" placeholder="Preset name" bind:value={presetName} onkeydown={(event)=>{if(event.key==='Enter'){event.preventDefault();savePresetUI()}}}/><button class="btn-soft btn-mini" onclick={savePresetUI} disabled={!presetName.trim()}><IconBookmark size={13}/>Save current filters</button></span>
            </div>
            {#if app.activeFilterLabels.length}<div class="mt-2 flex flex-wrap gap-1.5" aria-label="Active filters">{#each app.activeFilterLabels as label}<span class="license-chip">{label}</span>{/each}<span class="ml-auto text-[11px] text-[#829ab1]">{app.visibleCandidates.length} results</span></div>{/if}
          </div>

          <div class="surface overflow-hidden">
            {#if app.visibleCandidates.length}
              <div class="max-h-[calc(100vh-290px)] overflow-auto">
                <table class="candidate-table" aria-label="Candidate repositories">
                  <thead><tr>
                    <th class="w-10"><input type="checkbox" aria-label="Select all visible candidates" checked={app.visibleCandidates.length>0 && app.visibleCandidates.every((c)=>app.selectedIds.includes(c.id))} onchange={toggleVisibleSelection}/></th>
                    <th aria-sort={sortLabel('name')}><button class="sortable" onclick={()=>app.setSort('name')}>Repository {#if app.sort.key==='name'}{#if app.sort.direction==='asc'}<IconChevronUp size={14}/>{:else}<IconChevronDown size={14}/>{/if}{/if}</button></th>
                    <th>Language</th><th aria-sort={sortLabel('stars')}><button class="sortable" onclick={()=>app.setSort('stars')}>Stars {#if app.sort.key==='stars'}{#if app.sort.direction==='asc'}<IconChevronUp size={14}/>{:else}<IconChevronDown size={14}/>{/if}{/if}</button></th>
                    <th aria-sort={sortLabel('difficulty')}><button class="sortable" onclick={()=>app.setSort('difficulty')}>Difficulty {#if app.sort.key==='difficulty'}{#if app.sort.direction==='asc'}<IconChevronUp size={14}/>{:else}<IconChevronDown size={14}/>{/if}{/if}</button></th>
                    <th>Category</th><th>Cluster</th><th>License</th><th>Status</th><th class="text-right">Action</th>
                  </tr></thead>
                  <tbody>
                    {#each app.visibleCandidates as candidate (candidate.id)}
                      {@const hi=highlightName(candidate.name)}
                      <tr class:row-selected={app.selectedIds.includes(candidate.id)} class:fresh-row={candidate.fresh} onclick={()=>app.focusedId=candidate.id}>
                        <td><input type="checkbox" aria-label={`Select ${candidate.name}`} checked={app.selectedIds.includes(candidate.id)} onchange={(event)=>app.setSelection(candidate.id,event.currentTarget.checked)}/></td>
                        <td><span class="identicon mono" style={`background:${orgHue(candidate.name)}`} aria-hidden="true">{candidate.name[0].toUpperCase()}</span><span class="mono font-semibold text-[#eef7ff]">{#if hi}{hi[0]}<mark>{hi[1]}</mark>{hi[2]}{:else}{candidate.name}{/if}</span>{#if candidate.rejectionReason}<div class="mt-1 text-[11px] text-[#f2a2af]">Reason: {candidate.rejectionReason}</div>{/if}{#if candidate.commit}<div class="mt-1 flex items-center gap-1.5"><code class="text-[10px] text-[#c7b2eb]">{candidate.commit}</code><button class="text-[#86a8c4] hover:text-white" aria-label={`Copy commit ${candidate.commit}`} onclick={(event)=>{event.stopPropagation();copyText(candidate.commit,'Commit hash')}}><IconCopy size={13}/></button>{#if copied==='Commit hash'}<span class="text-[10px] text-[#65dbc5]">Copied</span>{/if}</div>{/if}</td>
                        <td>{candidate.language}</td><td class="tabular-nums">{candidate.stars.toLocaleString()}</td>
                        <td><span class="font-semibold tabular-nums">{candidate.difficulty.toFixed(1)}</span><span class="ml-1 text-[10px] uppercase text-[#7891a8]">{titleCase(getBand(candidate.difficulty))}</span></td>
                        <td>{candidate.category}</td><td><code class="text-[11px] text-[#91abc3]">{candidate.clusterId}</code></td><td><span class="license-chip">{titleCase(candidate.license)}</span></td>
                        <td><span class="status-chip status-{candidate.status}">{titleCase(candidate.status)}</span>{#if candidate.guardMessage}<div class="caution mt-2 max-w-[235px]">{candidate.guardMessage}</div>{/if}</td>
                        <td><div class="flex justify-end gap-1">
                          {#if candidate.status==='candidate'}<button class="btn-soft" onclick={(event)=>{event.stopPropagation();statusAction(candidate,'score')}}>Score</button>
                          {:else if candidate.status==='scored'}<button class="btn-soft btn-primary" onclick={(event)=>{event.stopPropagation();statusAction(candidate,'select')}}>Select</button><button class="btn-soft btn-danger" onclick={(event)=>{event.stopPropagation();statusAction(candidate,'reject')}}>Reject</button>
                          {:else if candidate.status==='selected'}<button class="btn-soft" onclick={(event)=>{event.stopPropagation();statusAction(candidate,'pin')}}><IconPin size={14}/>Pin</button>
                          {:else if candidate.status==='pinned'}<button class="btn-soft btn-primary" onclick={(event)=>{event.stopPropagation();statusAction(candidate,'queue')}}><IconPlayerPlay size={14}/>Queue</button>
                          {:else if candidate.status==='queued'}<span class="text-[11px] text-[#d7b772]">Position {app.queue.indexOf(candidate.id)+1}</span>
                          {:else}<span class="text-[11px] text-[#7891a8]">Reviewed</span>{/if}
                        </div></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <div class="grid min-h-72 place-items-center p-8 text-center"><div><IconSearch class="mx-auto mb-3 text-[#58738d]" size={34}/><h2 class="text-lg font-semibold">No candidates match</h2><p class="mx-auto mt-2 max-w-lg text-sm text-[#8da5ba]">No repositories match {app.activeFilterLabels.join(', ')}. Clear the active filters to restore the complete table.</p><button class="btn-soft mt-4" onclick={()=>app.clearFilters()}><IconFilterOff size={16}/>Clear filters</button></div></div>
            {/if}
          </div>

          <div class="mt-4 grid gap-3 xl:grid-cols-2">
            <section class="surface p-4" aria-labelledby="org-title">
              <div class="flex flex-wrap items-baseline justify-between gap-2"><h2 id="org-title" class="section-h">Org cap tracker</h2><span class="text-[11px] text-[#829ab1]">Select blocks at 3 active repos per org</span></div>
              <div class="org-grid mt-3">
                {#each app.orgReadout as org (org.org)}
                  <div class="org-tile" class:org-full={org.held>=3}><span class="mono truncate">{org.org}</span><span class="org-dots">{#each [0,1,2] as i}<i class="org-dot" class:on={i<org.held}></i>{/each}</span><span class="org-count">{org.held}/3</span></div>
                {/each}
              </div>
            </section>
            <section class="surface p-4" aria-labelledby="cluster-title">
              <div class="flex flex-wrap items-baseline justify-between gap-2"><h2 id="cluster-title" class="section-h">Cluster map</h2><span class="text-[11px] text-[#829ab1]">{app.clusterGroups.length} shared cluster{app.clusterGroups.length===1?'':'s'}</span></div>
              {#if app.clusterGroups.length}
                <div class="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {#each app.clusterGroups as group (group.clusterId)}
                    <div class="cluster-card">
                      <div class="flex items-center gap-2"><IconGitBranch size={13} class="text-[#6fdcc7]"/><code class="text-[11px]">{group.clusterId}</code><span class="text-[10px] text-[#7d97ad]">{group.members.length} repositories share this cluster</span></div>
                      <div class="mt-2 flex flex-wrap gap-1.5">
                        {#each group.members as member (member.id)}
                          <button class="cluster-node" onclick={()=>{app.filters.search=member.name;}} title="Filter the table to this repository"><span class="mono">{member.name}</span><span class="status-chip status-{member.status}">{titleCase(member.status)}</span></button>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}<p class="mt-3 text-xs text-[#86a0b6]">No shared clusters right now. Fetch more candidates to grow the map.</p>{/if}
            </section>
          </div>
        </section>
      {:else if app.activeView==='quota'}
        <section aria-labelledby="quota-title">
          <div class="mb-5"><div class="eyebrow">Coverage matrix</div><h1 id="quota-title" class="mt-1 text-3xl font-semibold">Quota dashboard</h1><p class="mt-2 text-sm text-[#8fa7bc]">Selected, pinned, and queued candidates count toward coverage. Activate any cell to drill into its candidates.</p></div>
          <div class="mb-4 flex flex-wrap items-center gap-5 border border-[#29415a] bg-[#102137] p-4">
            <div><div class="text-3xl font-semibold text-[#6de0ca]">{app.quotaFillPercent}%</div><div class="text-xs text-[#91a7bb]">overall fill</div></div>
            <div class="h-10 w-px bg-[#29415a]"></div>
            <div><div class="text-[10px] font-bold uppercase tracking-wider text-[#7fa0bd]">Fill trend this session</div><svg class="fill-spark mt-1" viewBox="0 0 120 28" role="img" aria-label={`Quota fill trend, currently ${app.quotaFillPercent} percent`}><polyline points={sparkPoints} fill="none" stroke="#58c7f3" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg></div>
            <div class="h-10 w-px bg-[#29415a]"></div>
            {#each app.bandPressure as bp (bp.band)}
              <div><div class="text-[10px] font-bold uppercase tracking-wider text-[#7fa0bd]">{titleCase(bp.band)} pressure</div><div class="band-meter"><i class={bp.need>0?'need':'ok'} style={`width:${Math.min(100,bp.achieved/bp.target*100)}%`}></i></div><div class="mt-1 text-[10px] tabular-nums text-[#8ba3b9]">{bp.achieved}/{bp.target}{bp.need>0?` · needs ${bp.need}`:' · filled'}</div></div>
            {/each}
            <div class="h-10 w-px bg-[#29415a]"></div>
            <div class="text-sm"><strong>{app.achievedCandidates.length}</strong> <span class="text-[#91a7bb]">active repos across {LANGUAGES.length} languages</span></div>
          </div>
          <div class="overflow-x-auto pb-2"><div class="quota-grid"><div class="quota-head">Language</div>{#each BANDS as band}<div class="quota-head">{titleCase(band)} <span class="ml-1 text-[10px] font-normal normal-case tracking-normal text-[#6f8ba5]">{band==='easy'?'0–3.9':band==='medium'?'4–6.9':'7–10'}</span></div>{/each}
            {#each LANGUAGES as language}<div class="quota-label flex items-center">{language}</div>{#each BANDS as band}{@const cell=app.quota.find((item)=>item.language===language&&item.band===band)}
              <button class="quota-cell" class:unfilled={cell.achieved<cell.target} class:oversubscribed={cell.achieved>cell.target*1.5} onclick={()=>app.drillQuota(language,band)} aria-label={`${language} ${band}: ${cell.achieved} of ${cell.target}; show matching candidates`}>
                <div class="flex items-start justify-between"><span class="text-xl font-semibold tabular-nums">{cell.achieved} <span class="text-sm font-normal text-[#819ab0]">of {cell.target}</span></span>{#if cell.achieved<cell.target}<span class="rounded-sm bg-[#5b461d] px-1.5 py-1 text-[9px] font-bold uppercase text-[#ffd792]">Needs {cell.target-cell.achieved}</span>{:else if cell.achieved>cell.target*1.5}<span class="rounded-sm bg-[#513d6b] px-1.5 py-1 text-[9px] font-bold uppercase text-[#e0c8ff]">+{cell.achieved-cell.target} excess</span>{:else}<IconCheck class="text-[#55d6be]" size={18}/>{/if}</div>
                <div class="quota-bar"><div class="quota-fill" style={`width:${Math.min(100,cell.achieved/cell.target*100)}%`}></div></div>
                <div class="mt-2 flex items-center gap-1">{#each Array.from({length:Math.max(cell.target,Math.min(cell.achieved,cell.target+3))}) as _,i}<i class="quota-dot" class:filled={i<Math.min(cell.achieved,cell.target)} class:extra={i>=cell.target&&i<cell.achieved}></i>{/each}<span class="ml-auto text-[10px] tabular-nums text-[#7e98af]">{Math.round(cell.achieved/cell.target*100)}%</span></div>
              </button>
            {/each}{/each}
          </div></div>
        </section>
      {:else if app.activeView==='timeline'}
        <section aria-labelledby="timeline-title"><div class="mb-5"><div class="eyebrow">Audit trail</div><h1 id="timeline-title" class="mt-1 text-3xl font-semibold">Event timeline</h1><p class="mt-2 text-sm text-[#8fa7bc]">Newest events first. Undo restores this trail with the rest of session state.</p></div>
          <div class="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter timeline by transition type">
            <button class="chip-filter" class:active={app.timelineFilter==='all'} aria-pressed={app.timelineFilter==='all'} onclick={()=>app.timelineFilter='all'}>All · {app.timeline.length}</button>
            {#each TIMELINE_TYPES as type}<button class="chip-filter" class:active={app.timelineFilter===type} aria-pressed={app.timelineFilter===type} onclick={()=>app.timelineFilter=type}>{titleCase(type)} · {app.timelineCounts[type]}</button>{/each}
          </div>
          <div class="surface p-5 lg:p-7">
            {#each app.visibleTimeline as entry,index (entry.at+entry.name+index)}
              <article class="timeline-line" in:fade={{duration:D(240)}}>
                <div class="flex flex-wrap items-center gap-2"><code class="font-semibold text-[#e8f3fb]">{entry.name}</code><span class="status-chip status-{entry.fromStatus}">{titleCase(entry.fromStatus)}</span><span class="text-[#68849d]">→</span><span class="status-chip status-{entry.toStatus}">{titleCase(entry.toStatus)}</span>{#if entry.rejectionReason}<span class="license-chip">{entry.rejectionReason}</span>{/if}</div>
                <time class="mt-2 block text-[11px] text-[#718da6]" datetime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
              </article>
            {:else}
              <div class="py-8 text-center"><h2 class="text-base font-semibold">No {app.timelineFilter==='all'?'':titleCase(app.timelineFilter)+' '}entries yet</h2><p class="mt-2 text-sm text-[#86a0b6]">Perform that action in the candidate workbench and it lands here, newest first.</p></div>
            {/each}
          </div>
        </section>
      {:else if app.activeView==='build-queue'}
        <section aria-labelledby="queue-title"><div class="mb-5"><div class="eyebrow">Build order</div><h1 id="queue-title" class="mt-1 text-3xl font-semibold">Build queue</h1><p class="mt-2 text-sm text-[#8fa7bc]">Drag entries, or focus an entry and press Alt+↑ / Alt+↓. Order persists across views.</p></div>{@render queueList(false)}</section>
      {/if}
    </main>

    <aside class="desktop-queue sticky top-20 hidden h-[calc(100vh-6.25rem)] min-h-0 flex-col surface xl:flex" aria-label="Build queue panel">
      <div class="flex items-center justify-between border-b border-[#29415a] p-4"><div><div class="eyebrow">Ordered output</div><h2 class="mt-1 font-semibold">Build queue <span class="ml-1 text-[#63d9c3]">{app.queue.length}</span></h2></div><button class="btn-soft icon-btn" onclick={()=>switchView('build-queue')} aria-label="Open build queue view"><IconListCheck size={16}/></button></div>
      <div class="min-h-0 flex-1 overflow-y-auto p-3">{@render queueList(true)}</div>
      <div class="border-t border-[#29415a] p-3 text-[11px] text-[#7891a7]">Focus an entry and press Alt+↑ / Alt+↓ to reorder; moves are announced.</div>
    </aside>
  </div>
</div>

{#snippet queueList(compact)}
  {#if app.queue.length}
    <ol class="space-y-2" aria-label="Ordered build queue">
      {#each app.queueEntries() as entry,index (entry.candidate.id)}
        <li class="queue-entry" class:opacity-60={dragId===entry.candidate.id}
          animate:flip={{duration:D(260)}} in:fly={{x:24,duration:D(240)}} out:fly={{x:24,duration:D(200)}}>
          <button type="button" class="flex w-full items-start gap-2 text-left"
            aria-label={`Queue position ${entry.position}: ${entry.candidate.name}. Press Alt+ArrowUp or Alt+ArrowDown to move it.`}
            draggable="true" ondragstart={()=>dragId=entry.candidate.id} ondragover={(event)=>event.preventDefault()} ondrop={(event)=>queueDrop(event,index)}
            onkeydown={(event)=>queueKey(event,entry.candidate.id,index)}>
            <span class="grid size-6 shrink-0 place-items-center bg-[#55d6be] text-xs font-bold text-[#071714]">{entry.position}</span><IconGripVertical class="mt-1 shrink-0 cursor-grab text-[#54718b]" size={15}/><span class="min-w-0 flex-1"><span class="mono block truncate text-xs font-semibold">{entry.candidate.name}</span><span class="mt-1 block text-[10px] text-[#8099b0]">Difficulty {entry.candidate.difficulty.toFixed(1)} · {entry.candidate.clusterId}</span></span>
          </button>
          <div class="mt-3 flex gap-1"><button class="btn-soft icon-btn" disabled={index===0} onclick={()=>app.reorder(entry.candidate.id,index-1)} aria-label={`Move ${entry.candidate.name} up`}><IconChevronUp size={14}/></button><button class="btn-soft icon-btn" disabled={index===app.queue.length-1} onclick={()=>app.reorder(entry.candidate.id,index+1)} aria-label={`Move ${entry.candidate.name} down`}><IconChevronDown size={14}/></button><button class="btn-soft btn-danger ml-auto {compact?'icon-btn':''}" onclick={()=>app.removeFromQueue(entry.candidate.id)} aria-label={`Remove ${entry.candidate.name} from queue`}><IconTrash size={14}/>{#if !compact}Remove{/if}</button></div>
        </li>
      {/each}
    </ol>
  {:else}<div class="grid min-h-48 place-items-center p-5 text-center"><div><IconListCheck class="mx-auto text-[#4d6a84]" size={30}/><h3 class="mt-3 text-sm font-semibold">Queue is ready</h3><p class="mt-1 text-xs leading-relaxed text-[#7f99b0]">Pin a selected repository, then queue its frozen commit.</p></div></div>{/if}
{/snippet}

{#if app.queueOpen}
  <div class="fixed inset-0 z-[64] bg-black/60 xl:hidden" onclick={()=>app.queueOpen=false} role="presentation"></div>
  <aside class="surface fixed right-0 bottom-0 top-16 z-[66] w-[min(90vw,380px)] xl:hidden" transition:fly={{x:380,duration:D(240)}} aria-label="Mobile build queue"><div class="flex items-center justify-between border-b border-[#29415a] p-4"><h2 class="font-semibold">Build queue ({app.queue.length})</h2><button class="btn-soft icon-btn" onclick={()=>app.queueOpen=false} aria-label="Close queue"><IconX size={17}/></button></div><div class="h-[calc(100%-65px)] overflow-y-auto p-3">{@render queueList(false)}</div></aside>
{/if}

{#if app.selectedCount>0}
  <div class="bulk-tray" transition:fly={{y:50,duration:D(220)}} aria-label="Bulk action tray"><span class="mr-auto text-sm font-semibold"><span class="mr-2 rounded-full bg-[#55d6be] px-2 py-1 text-xs text-[#071714]">{app.selectedCount}</span>selected</span><button class="btn-soft" onclick={()=>app.bulk('score')}>Bulk Score</button><button class="btn-soft btn-primary" onclick={()=>app.bulk('select')}>Bulk Select</button><button class="btn-soft btn-danger" onclick={()=>openReject([...app.selectedIds],true)}>Bulk Reject</button><button class="btn-soft icon-btn" onclick={()=>app.selectedIds=[]} aria-label="Clear selection"><IconX size={16}/></button></div>
{/if}

{#if app.modal?.type==='reject'}
  <div class="dialog-backdrop" role="presentation" onclick={(event)=>{if(event.currentTarget===event.target)closeModal()}}>
    <div class="dialog-card card-sm" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="reject-title" bind:this={modalCard} onkeydown={(event)=>trapTab(event,modalCard)} transition:scale={{start:.96,duration:D(240)}}>
      <div class="border-b border-[#2a4159] p-4"><div class="eyebrow">{app.modal.bulk?'Bulk workflow':'Candidate workflow'}</div><h2 id="reject-title" class="mt-1 text-lg font-semibold">{app.modal.bulk?`Reject ${app.modal.ids.length} selected candidates`:`Reject ${app.find(app.modal.ids[0])?.name ?? 'candidate'}`}</h2></div>
      <form class="p-4" id="reject-form" onsubmit={(event)=>{event.preventDefault();submitReject()}}>
        <label class="label" for="reject-reason">Rejection reason <span class="text-[#ff9baa]">required</span></label>
        <select id="reject-reason" class="field" bind:value={rejectReason} aria-invalid={rejectionError?true:undefined} aria-describedby="reject-error" data-autofocus><option value="">Choose a reason</option>{#each REASONS as reason}<option value={reason}>{reason}</option>{/each}</select>
        {#if rejectionError}<p id="reject-error" class="error" role="alert">{rejectionError}</p>{/if}
        <p class="mt-3 text-xs leading-relaxed text-[#8ca4b9]">Only the fixed sourcing-policy tokens are accepted. Cancel changes nothing.</p>
        <div class="mt-4 flex justify-end gap-2 border-t border-[#24405c] pt-4"><button type="button" class="btn-soft" onclick={closeModal}>Cancel</button><button type="submit" class="btn-soft btn-danger">Reject{app.modal.bulk?` ${app.modal.ids.length}`:''}</button></div>
      </form>
    </div>
  </div>
{/if}

{#if app.modal?.type==='pin'}
  {@const pinCandidate=app.find(app.modal.id)}
  <div class="dialog-backdrop" role="presentation" onclick={(event)=>{if(event.currentTarget===event.target)closeModal()}}>
    <div class="dialog-card card-sm" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="pin-title" bind:this={modalCard} onkeydown={(event)=>trapTab(event,modalCard)} transition:scale={{start:.96,duration:D(240)}}>
      <div class="border-b border-[#2a4159] p-4"><div class="eyebrow">Freeze source</div><h2 id="pin-title" class="mt-1 text-lg font-semibold">Pin {pinCandidate?.name ?? 'candidate'}</h2></div>
      <form class="p-4" onsubmit={(event)=>{event.preventDefault();submitPin()}}>
        <div class="mb-4 border border-[#344e67] bg-[#0a192a] p-3"><div class="eyebrow">Frozen commit</div><code class="mt-2 block text-lg font-semibold tracking-wider text-[#d3b9ff]">{app.modal.commit}</code><p class="mt-1 text-[11px] text-[#7893aa]">Generated locally; lowercase hexadecimal, 12 characters.</p></div>
        <label class="label" for="pin-notes">Notes <span class="font-normal text-[#718ba3]">optional · {pinNotes.length}/200</span></label>
        <textarea id="pin-notes" class="field" rows="4" bind:value={pinNotes} aria-invalid={pinError||pinNotes.length>200?true:undefined} aria-describedby="pin-error" placeholder="Capture build flags, fixtures, or review context." data-autofocus></textarea>
        {#if pinNotes.length>200}<p id="pin-error" class="error" role="alert">Notes field: use 200 characters or fewer.</p>{:else if pinError}<p id="pin-error" class="error" role="alert">{pinError}</p>{/if}
        <div class="mt-4 flex justify-end gap-2 border-t border-[#24405c] pt-4"><button type="button" class="btn-soft" onclick={closeModal}>Cancel</button><button type="submit" class="btn-soft btn-primary" disabled={pinNotes.length>200||pinBusy}>{#if pinBusy}<IconLoader2 class="spin" size={15}/>Pinning…{:else}Confirm pin{/if}</button></div>
      </form>
    </div>
  </div>
{/if}

{#if app.modal?.type==='help'}
  <div class="dialog-backdrop" role="presentation" onclick={(event)=>{if(event.currentTarget===event.target)closeModal()}}>
    <div class="dialog-card card-sm" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="help-title" bind:this={modalCard} onkeydown={(event)=>trapTab(event,modalCard)} transition:scale={{start:.96,duration:D(240)}}>
      <div class="flex items-center justify-between border-b border-[#2a4159] p-4"><div><div class="eyebrow">Power use</div><h2 id="help-title" class="mt-1 text-lg font-semibold">Keyboard shortcuts</h2></div><button class="btn-soft icon-btn" onclick={closeModal} aria-label="Close keyboard shortcuts" data-autofocus><IconX size={16}/></button></div>
      <dl class="space-y-3 p-4 text-sm">
        {#each shortcuts as entry (entry[0])}
          <div class="flex items-center justify-between gap-3"><dt class="text-[#a9bdd0]">{entry[0]}</dt><dd class="flex gap-1">{#each entry[1] as key}<kbd class="kbd-key">{key}</kbd>{/each}</dd></div>
        {/each}
      </dl>
    </div>
  </div>
{/if}

{#if app.panel==='export'}
  <div class="dialog-backdrop layer-panel" role="presentation" onclick={(event)=>{if(event.currentTarget===event.target)closePanel()}}>
    <div class="dialog-card card-lg" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="export-title" bind:this={panelCard} onkeydown={(event)=>trapTab(event,panelCard)} transition:scale={{start:.97,duration:D(240)}}>
      <div class="flex items-center justify-between border-b border-[#2a4159] p-4">
        <div><div class="eyebrow">Session artifact</div><h2 id="export-title" class="mt-1 text-lg font-semibold">Export sourcing pack</h2></div>
        <button class="btn-soft icon-btn" onclick={closePanel} aria-label="Close export panel"><IconX size={16}/></button>
      </div>
      <div class="p-4">
        <div class="flex flex-wrap gap-1 border-b border-[#2a4159]" role="tablist" aria-label="Export formats">
          {#each exportTabs as tab (tab.id)}<button class="px-3 py-2 text-xs font-semibold transition-colors {exportTab===tab.id?'border-b-2 border-[#55d6be] text-[#6ee0cb]':'text-[#8fa6bb] hover:text-[#d5e6f4]'}" role="tab" aria-selected={exportTab===tab.id} onclick={()=>exportTab=tab.id} data-autofocus={tab.id==='queue-json'?true:undefined}>{tab.label}</button>{/each}
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#87a0b6]">
          <span class="kbd-key mono">fingerprint {app.packFingerprint()}</span>
          <span>Integrity fingerprint of the pack — it changes whenever session mutations change the export.</span>
        </div>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-[#8da5bb]">Compiled live from {app.candidates.length} candidates and {app.queue.length} queue entries.</p>
          <div class="flex flex-wrap gap-2">
            <button id="export-copy" class="btn-soft" onclick={()=>copyText(exportTexts[exportTab],exportTabs.find((item)=>item.id===exportTab).label)}><IconCopy size={15}/>{copied===exportTabs.find((item)=>item.id===exportTab).label?'Copied':'Copy'}</button>
            <button class="btn-soft btn-primary" onclick={downloadActive}><IconDownload size={15}/>Download</button>
          </div>
        </div>
        <pre class="mt-3 max-h-[44vh] overflow-auto border border-[#2d455d] bg-[#081523] p-4 text-[11px] leading-relaxed text-[#c6d8e8]" aria-label="Active export text">{exportTexts[exportTab]}</pre>
        <div class="mt-3 border-t border-[#24405c] pt-3">
          <div class="flex flex-wrap items-center gap-2">
            <button class="btn-soft btn-mini" onclick={()=>{const fingerprint=app.takeSnapshot();app.notify(`Snapshot saved — fingerprint ${fingerprint}.`)}}><IconCamera size={14}/>Take snapshot</button>
            <button class="btn-soft btn-mini" onclick={()=>compareOpen=!compareOpen} disabled={app.snapshots.length<2}><IconScale size={14}/>{compareOpen?'Hide comparison':'Compare snapshots'}</button>
            <span class="text-[11px] text-[#7e98af]">{app.snapshots.length}/4 snapshots kept this session</span>
          </div>
          {#if app.snapshots.length}<div class="mt-2 flex flex-wrap gap-1.5">{#each app.snapshots as snap (snap.id)}<span class="license-chip mono" title={snap.at}>{snap.label} · {snap.fingerprint}</span>{/each}</div>{/if}
          {#if compareOpen && app.snapshotDiff}
            {@const diff=app.snapshotDiff}
            <div class="diff-preview mt-2" aria-label="Snapshot comparison"><div class="eyebrow">{diff.older.label} → {diff.newer.label}</div><ul class="mt-1">{#each diff.lines as line}<li class="mono text-[11px]">{line}</li>{/each}</ul></div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

{#if app.panel==='import'}
  <div class="dialog-backdrop layer-panel" role="presentation" onclick={(event)=>{if(event.currentTarget===event.target)closePanel()}}>
    <div class="dialog-card card-lg" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="import-title" bind:this={panelCard} onkeydown={(event)=>trapTab(event,panelCard)} transition:scale={{start:.97,duration:D(240)}}>
      <div class="flex items-center justify-between border-b border-[#2a4159] p-4">
        <div><div class="eyebrow">Restore session</div><h2 id="import-title" class="mt-1 text-lg font-semibold">Import sourcing pack</h2></div>
        <button class="btn-soft icon-btn" onclick={closePanel} aria-label="Close import panel"><IconX size={16}/></button>
      </div>
      <form class="p-4" onsubmit={(event)=>{event.preventDefault();submitImport()}}>
        <div class="mb-4 grid gap-3 sm:grid-cols-2">
          <label class="btn-soft cursor-pointer"><IconUpload size={16}/>Choose .json file<input class="sr-only" type="file" accept=".json,application/json" onchange={loadFile}/></label>
          <button type="button" class="btn-soft" onclick={()=>{importRaw=samplePack();importForm.setFieldValue('raw',importRaw);importError=''}}><IconSparkles size={16}/>Use seeded sample pack</button>
        </div>
        <label class="label" for="import-json">Raw JSON text</label>
        <textarea id="import-json" class="field mono" rows="12" bind:value={importRaw} aria-invalid={importError?true:undefined} aria-describedby="import-error" placeholder="Paste a sourcing-pack/v1 JSON document" data-autofocus></textarea>
        {#if importError}<p id="import-error" class="error" role="alert">{importError}</p>{/if}
        {#if importPreview}
          <div class="diff-preview mt-3" aria-label="Preview of changes this import will apply">
            <div class="eyebrow">Change preview</div>
            {#if importPreview.changes.length}<ul class="mt-1">{#each importPreview.changes as change}<li class="mono text-[11px]">{change}</li>{/each}</ul>{:else}<p class="mt-1 text-[11px] text-[#9db4c8]">No status or queue changes — the pack matches the current session.</p>{/if}
            {#if importPreview.extra>0}<div class="mt-1 text-[10px] text-[#7e98af]">…and {importPreview.extra} more change{importPreview.extra===1?'':'s'}</div>{/if}
            <div class="mt-1 text-[10px] text-[#7e98af]">{importPreview.candidateCount} candidates · {importPreview.queueCount} queue entries will apply.</div>
          </div>
        {/if}
        <p class="mt-3 text-xs leading-relaxed text-[#8ba3b9]">A valid import replaces candidate records and queue order. It is one undoable action.</p>
        <div class="mt-4 flex justify-end gap-2 border-t border-[#24405c] pt-4">
          <button type="button" class="btn-soft" onclick={closePanel}>Cancel</button>
          <button type="submit" class="btn-soft btn-primary" disabled={!importRaw.trim()||importBusy}>{#if importBusy}<IconLoader2 class="spin" size={15}/>Applying import…{:else}Apply import{/if}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if paletteOpen}
  <div class="dialog-backdrop layer-palette" role="presentation" transition:fade={{duration:D(200)}} onclick={(event)=>{if(event.currentTarget===event.target)closePalette()}}>
    <div class="palette-card" tabindex="-1" role="dialog" aria-modal="true" aria-label="Command palette" bind:this={paletteCard} onkeydown={(event)=>trapTab(event,paletteCard)} transition:scale={{start:.96,duration:D(220)}}>
      <div class="flex items-center gap-3 p-4"><IconSearch class="text-[#6c8aa5]" size={20}/><input class="min-w-0 flex-1 bg-transparent text-base text-white" style="outline:none" bind:this={paletteInput} bind:value={paletteQuery} placeholder="Search destinations and actions" aria-label="Search commands" onkeydown={(event)=>{if(event.key==='Enter'){const items=paletteItems(); if(items.length){event.preventDefault(); choosePalette(items[0][2]);}}}}/><kbd class="kbd-key">Esc</kbd></div>
      <div class="max-h-[55vh] overflow-y-auto">{#each paletteItems() as item (item[0])}<button class="palette-result" onclick={()=>choosePalette(item[2])}><span><span class="block text-sm font-semibold">{item[0]}</span><span class="mt-1 block text-[10px] uppercase tracking-wider text-[#708ba3]">{item[1]}</span></span><span class="text-[#6fdcc7]">↵</span></button>{:else}<div class="p-8 text-center"><IconSearch class="mx-auto text-[#526e88]" size={28}/><h3 class="mt-3 text-sm font-semibold">No matching commands</h3><p class="mt-1 text-xs text-[#849db3]">Try typing “quota”, “export”, or a candidate action.</p></div>{/each}</div>
    </div>
  </div>
{/if}

{#if app.toast}
  <div class="toast {app.toast.kind}" role="status" in:fly={{x:30,duration:D(220)}} out:fade={{duration:D(280)}}><div class="flex items-start gap-3">{#if app.toast.kind==='warning'}<IconAlertTriangle class="mt-0.5 shrink-0 text-[#f0b65a]" size={18}/>{:else}<IconCheck class="mt-0.5 shrink-0 text-[#55d6be]" size={18}/>{/if}<div><div class="text-sm font-semibold">{app.toast.kind==='warning'?'Attention':'Complete'}</div><div class="mt-1 text-xs leading-relaxed text-[#b3c4d3]">{app.toast.message}</div></div><button class="ml-auto text-[#7590a8] hover:text-white" onclick={()=>app.toast=null} aria-label="Dismiss notification"><IconX size={16}/></button></div></div>
{/if}

<div class="sr-only" aria-live="polite" aria-atomic="true">{app.liveMessage}</div>
