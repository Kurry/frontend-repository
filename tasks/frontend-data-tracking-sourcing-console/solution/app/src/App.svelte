<script>
  import { onMount, tick } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { createForm } from '@tanstack/svelte-form';
  import { z } from 'zod';
  import { Button, Modal, Tag } from 'carbon-components-svelte';
  import {
    IconSearch, IconFilterOff, IconChevronUp, IconChevronDown, IconPin, IconPlayerPlay,
    IconTrash, IconCopy, IconDownload, IconUpload, IconFileExport, IconTerminal2, IconCommand,
    IconRotateClockwise, IconArrowBackUp, IconListCheck, IconX, IconGripVertical, IconCheck,
    IconClock, IconAlertTriangle, IconDotsVertical, IconDatabaseImport, IconSparkles
  } from '@tabler/icons-svelte';
  import { app, LANGUAGES, LICENSES, STATUSES, BANDS, REASONS, titleCase, getBand, randomCommit, rejectionSchema, pinSchema, packSchema, samplePack } from './lib/state.svelte.js';
  import { registerWebMCP } from './lib/webmcp.js';

  const stepNames = ['Querying','Scoring','Classifying'];
  const exportTabs = [
    { id:'queue-json', label:'Queue JSON', filename:'sourcebench-queue.json', type:'application/json' },
    { id:'candidates-csv', label:'Candidates CSV', filename:'sourcebench-candidates.csv', type:'text/csv' },
    { id:'sourcing-report', label:'Sourcing report', filename:'sourcebench-report.md', type:'text/markdown' }
  ];

  let rejectReason = $state('');
  let rejectionError = $state('');
  let pinNotes = $state('');
  let pinError = $state('');
  let importRaw = $state('');
  let importError = $state('');
  let exportTab = $state('queue-json');
  let exportTexts = $state({});
  let copied = $state('');
  let paletteQuery = $state('');
  let paletteReturnFocus = null;
  let paletteInput = $state(null);
  let dragId = $state('');

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
    onSubmit:({value}) => { const result=app.importPack(value.raw); if(result.ok) closeModal(); else importError=result.error; }
  }));

  function openReject(ids, bulk=false) {
    rejectReason=''; rejectionError=''; rejectionForm.reset(); app.modal={type:'reject',ids,bulk};
  }
  function openPin(candidate) {
    pinNotes=''; pinError=''; pinForm.reset(); app.modal={type:'pin',id:candidate.id,commit:randomCommit()};
  }
  function openPanel(type) {
    if(type==='export') { exportTab='queue-json'; exportTexts=Object.fromEntries(exportTabs.map((tab)=>[tab.id,app.exportText(tab.id)])); }
    if(type==='import') { importRaw=''; importError=''; importForm.reset(); }
    app.modal={type}; app.mobileMenu=false;
  }
  function closeModal() { app.modal=null; rejectionError=''; pinError=''; importError=''; }
  async function submitReject() {
    rejectionError=''; rejectionForm.setFieldValue('reason',rejectReason);
    const parsed=rejectionSchema.safeParse({reason:rejectReason}); if(!parsed.success){rejectionError='Reason field: choose one of the five listed reasons.';return;}
    await rejectionForm.handleSubmit();
  }
  async function submitPin() {
    pinError=''; pinForm.setFieldValue('notes',pinNotes); const parsed=pinSchema.safeParse({notes:pinNotes});
    if(!parsed.success){pinError=parsed.error.issues[0].message;return;} await pinForm.handleSubmit();
  }
  async function submitImport() {
    importError=''; importForm.setFieldValue('raw',importRaw); const parsed=importFormSchema.safeParse({raw:importRaw});
    if(!parsed.success){importError=parsed.error.issues[0].message;return;} await importForm.handleSubmit();
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
  function openPalette() { paletteReturnFocus=document.activeElement; paletteQuery=''; app.modal={type:'palette'}; tick().then(()=>paletteInput?.focus()); }
  function closePalette() { app.modal=null; tick().then(()=>paletteReturnFocus?.focus?.()); }
  function paletteItems() {
    const base=[
      ['Candidates','Destination','candidates'],['Quota','Destination','quota'],['Timeline','Destination','timeline'],['Build queue','Destination','build-queue'],
      ['Fetch more candidates','Action','fetch'],['Export sourcing pack','Action','export'],['Import sourcing pack','Action','import']
    ];
    const candidate=app.find(app.focusedId) || app.find(app.selectedIds[0]);
    if(candidate){ if(candidate.status==='candidate')base.push([`Score ${candidate.name}`,'Candidate action','score']); if(candidate.status==='scored')base.push([`Select ${candidate.name}`,'Candidate action','select'],[`Reject ${candidate.name}`,'Candidate action','reject']); if(candidate.status==='selected')base.push([`Pin ${candidate.name}`,'Candidate action','pin']); if(candidate.status==='pinned')base.push([`Queue ${candidate.name}`,'Candidate action','queue']); }
    const chars=paletteQuery.toLowerCase().replaceAll(' ',''); return base.filter((item)=>{ let index=0; const label=item[0].toLowerCase(); for(const char of chars){index=label.indexOf(char,index);if(index<0)return false;index++;}return true; });
  }
  function choosePalette(code) {
    const candidate=app.find(app.focusedId) || app.find(app.selectedIds[0]); closePalette();
    if(['candidates','quota','timeline','build-queue'].includes(code)) switchView(code);
    else if(code==='fetch') app.fetchMore(); else if(code==='export'||code==='import') setTimeout(()=>openPanel(code),0); else if(candidate)setTimeout(()=>statusAction(candidate,code),0);
  }
  function keydown(event) {
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openPalette();return;}
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?app.redo():app.undo();}
  }
  function queueDrop(event,targetIndex) { event.preventDefault(); if(dragId)app.reorder(dragId,targetIndex); dragId=''; }

  onMount(() => { window.addEventListener('keydown',keydown); registerWebMCP(app,{openPanel,openPalette,statusAction}); return()=>window.removeEventListener('keydown',keydown); });
</script>

<svelte:head><meta name="description" content="Repository sourcing and benchmark build-queue console" /></svelte:head>

<div class="min-h-screen">
  <header class="sticky top-0 z-50 border-b border-[#29415a] bg-[#091626]/95 backdrop-blur-xl">
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
        <button class="btn-soft sm-command hidden sm:inline-flex" onclick={openPalette} aria-label="Open command palette"><IconCommand size={16}/><span class="hidden lg:inline">Commands</span><kbd class="hidden rounded border border-[#3b5269] px-1 text-[10px] text-[#88a0b6] lg:inline">⌘K</kbd></button>
        <button class="btn-soft relative" onclick={()=>app.queueOpen=!app.queueOpen} aria-label="Toggle build queue"><IconListCheck size={17}/><span class="hidden sm:inline">Queue</span><span class="rounded-full bg-[#55d6be] px-1.5 text-[10px] font-bold text-[#071712]">{app.queue.length}</span></button>
        <button class="btn-soft icon-btn mobile-only" onclick={()=>app.mobileMenu=!app.mobileMenu} aria-label="More actions"><IconDotsVertical size={18}/></button>
      </div>
    </div>
    {#if app.mobileMenu}
      <div class="mobile-only grid grid-cols-2 gap-2 border-t border-[#29415a] bg-[#0d1c2e] p-3" transition:fly={{y:-8,duration:180}}>
        <button class="btn-soft" onclick={()=>app.undo()} disabled={!app.undoStack.length}>Undo</button><button class="btn-soft" onclick={()=>app.redo()} disabled={!app.redoStack.length}>Redo</button>
        <button class="btn-soft" onclick={()=>openPanel('import')}>Import</button><button class="btn-soft" onclick={()=>openPanel('export')}>Export</button>
        <button class="btn-soft" onclick={openPalette}>Command palette</button><button class="btn-soft" onclick={()=>switchView('quota')}>Quota</button>
      </div>
    {/if}
  </header>

  <div class="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-3 lg:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <main class="min-w-0">
      {#if app.activeView==='candidates'}
        <section aria-labelledby="candidates-title">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><div class="eyebrow">Repository intake</div><h1 id="candidates-title" class="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">Candidate workbench</h1><p class="mt-1 text-sm text-[#8ea6bc]">Score, guard, and freeze benchmark-ready repositories.</p></div>
            <button class="btn-soft btn-primary" onclick={()=>app.fetchMore()} disabled={app.fetchState.running}><IconSparkles size={17}/>{app.fetchState.running?'Sourcing in progress…':'Fetch more candidates'}</button>
          </div>

          <div class="rollups mb-4 grid grid-cols-4 gap-px overflow-hidden border border-[#29415a] bg-[#29415a] lg:grid-cols-8">
            {#each STATUSES as status}<div class="bg-[#0f2034] p-3"><div class="text-[10px] font-bold uppercase tracking-wider text-[#7892aa]">{titleCase(status)}</div><div class="mt-1 text-xl font-semibold tabular-nums">{app.rollups[status]}</div></div>{/each}
            <div class="bg-[#132a3e] p-3"><div class="text-[10px] font-bold uppercase tracking-wider text-[#7fcbbd]">Quota fill</div><div class="mt-1 text-xl font-semibold tabular-nums text-[#70dfca]">{app.quotaFillPercent}%</div></div>
            <div class="bg-[#132a3e] p-3"><div class="text-[10px] font-bold uppercase tracking-wider text-[#7fcbbd]">Queue</div><div class="mt-1 text-xl font-semibold tabular-nums text-[#70dfca]">{app.queue.length}</div></div>
          </div>

          {#if app.fetchState.running || app.fetchState.steps.some((step)=>step==='complete')}
            <div class="surface mb-4 flex flex-wrap items-center gap-4 p-3" aria-label="Fetch more candidates progress">
              <div class="mr-2"><div class="text-xs font-semibold">Sourcing run {app.fetchState.runs+1}</div><div class="text-[11px] text-[#87a0b6]">Six distinct repositories per run</div></div>
              {#each stepNames as name,index}<div class="flex items-center gap-2"><span class="progress-dot {app.fetchState.steps[index]}"></span><span class="text-xs">{name}</span><span class="text-[10px] uppercase text-[#7891a8]">{app.fetchState.steps[index]}</span></div>{/each}
            </div>
          {/if}

          <div class="surface mb-3 p-3">
            <div class="filters">
              <label class="search-field relative"><span class="sr-only">Search repository name</span><IconSearch class="pointer-events-none absolute left-3 top-3 text-[#7290aa]" size={17}/><input class="field pl-9" type="search" placeholder="Search org/repository" bind:value={app.filters.search} oninput={()=>app.selectedIds=[]}/></label>
              <label><span class="sr-only">Language filter</span><select class="field" bind:value={app.filters.language} onchange={()=>app.selectedIds=[]}><option value="">All languages</option>{#each LANGUAGES as language}<option>{language}</option>{/each}</select></label>
              <label><span class="sr-only">Difficulty band filter</span><select class="field" bind:value={app.filters.band} onchange={()=>app.selectedIds=[]}><option value="">All difficulty</option>{#each BANDS as band}<option value={band}>{titleCase(band)}</option>{/each}</select></label>
              <label><span class="sr-only">License filter</span><select class="field" bind:value={app.filters.license} onchange={()=>app.selectedIds=[]}><option value="">All licenses</option>{#each LICENSES as license}<option value={license}>{titleCase(license)}</option>{/each}</select></label>
              <label><span class="sr-only">Status filter</span><select class="field" bind:value={app.filters.status} onchange={()=>app.selectedIds=[]}><option value="">All statuses</option>{#each STATUSES as status}<option value={status}>{titleCase(status)}</option>{/each}</select></label>
              <button class="btn-soft" onclick={()=>app.clearFilters()} disabled={!app.activeFilterLabels.length}><IconFilterOff size={16}/>Clear</button>
            </div>
            {#if app.activeFilterLabels.length}<div class="mt-2 flex flex-wrap gap-1.5" aria-label="Active filters">{#each app.activeFilterLabels as label}<span class="license-chip">{label}</span>{/each}<span class="ml-auto text-[11px] text-[#829ab1]">{app.visibleCandidates.length} results</span></div>{/if}
          </div>

          <div class="surface overflow-hidden">
            {#if app.visibleCandidates.length}
              <div class="max-h-[calc(100vh-290px)] overflow-auto">
                <table class="candidate-table" aria-label="Candidate repositories">
                  <thead><tr>
                    <th class="w-10"><input type="checkbox" aria-label="Select all visible candidates" checked={app.visibleCandidates.every((c)=>app.selectedIds.includes(c.id))} onchange={toggleVisibleSelection}/></th>
                    <th aria-sort={sortLabel('name')}><button class="sortable" onclick={()=>app.setSort('name')}>Repository {#if app.sort.key==='name'}{#if app.sort.direction==='asc'}<IconChevronUp size={14}/>{:else}<IconChevronDown size={14}/>{/if}{/if}</button></th>
                    <th>Language</th><th aria-sort={sortLabel('stars')}><button class="sortable" onclick={()=>app.setSort('stars')}>Stars {#if app.sort.key==='stars'}{#if app.sort.direction==='asc'}<IconChevronUp size={14}/>{:else}<IconChevronDown size={14}/>{/if}{/if}</button></th>
                    <th aria-sort={sortLabel('difficulty')}><button class="sortable" onclick={()=>app.setSort('difficulty')}>Difficulty {#if app.sort.key==='difficulty'}{#if app.sort.direction==='asc'}<IconChevronUp size={14}/>{:else}<IconChevronDown size={14}/>{/if}{/if}</button></th>
                    <th>Category</th><th>Cluster</th><th>License</th><th>Status</th><th class="text-right">Action</th>
                  </tr></thead>
                  <tbody>
                    {#each app.visibleCandidates as candidate (candidate.id)}
                      <tr class:row-selected={app.selectedIds.includes(candidate.id)} class:fresh-row={candidate.fresh} onclick={()=>app.focusedId=candidate.id}>
                        <td><input type="checkbox" aria-label={`Select ${candidate.name}`} checked={app.selectedIds.includes(candidate.id)} onchange={(event)=>app.setSelection(candidate.id,event.currentTarget.checked)}/></td>
                        <td><div class="mono font-semibold text-[#eef7ff]">{candidate.name}</div>{#if candidate.rejectionReason}<div class="mt-1 text-[11px] text-[#f2a2af]">Reason: {candidate.rejectionReason}</div>{/if}{#if candidate.commit}<div class="mt-1 flex items-center gap-1.5"><code class="text-[10px] text-[#c7b2eb]">{candidate.commit}</code><button class="text-[#86a8c4] hover:text-white" aria-label={`Copy commit ${candidate.commit}`} onclick={(event)=>{event.stopPropagation();copyText(candidate.commit,'Commit hash')}}><IconCopy size={13}/></button>{#if copied==='Commit hash'}<span class="text-[10px] text-[#65dbc5]">Copied</span>{/if}</div>{/if}</td>
                        <td>{candidate.language}</td><td class="tabular-nums">{candidate.stars.toLocaleString()}</td>
                        <td>{#if candidate.status==='candidate'}<span class="text-[#718ba4]">Not scored</span>{:else}<span class="font-semibold tabular-nums">{candidate.difficulty.toFixed(1)}</span><span class="ml-1 text-[10px] uppercase text-[#7891a8]">{titleCase(getBand(candidate.difficulty))}</span>{/if}</td>
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
        </section>
      {:else if app.activeView==='quota'}
        <section aria-labelledby="quota-title">
          <div class="mb-5"><div class="eyebrow">Coverage matrix</div><h1 id="quota-title" class="mt-1 text-3xl font-semibold">Quota dashboard</h1><p class="mt-2 text-sm text-[#8fa7bc]">Selected, pinned, and queued candidates count toward coverage. Activate any cell to drill into its candidates.</p></div>
          <div class="mb-4 flex items-center gap-5 border border-[#29415a] bg-[#102137] p-4"><div><div class="text-3xl font-semibold text-[#6de0ca]">{app.quotaFillPercent}%</div><div class="text-xs text-[#91a7bb]">overall fill</div></div><div class="h-10 w-px bg-[#29415a]"></div><div class="text-sm"><strong>{app.achievedCandidates.length}</strong> active repositories across <strong>{LANGUAGES.length}</strong> languages</div></div>
          <div class="overflow-x-auto pb-2"><div class="quota-grid"><div class="quota-head">Language</div>{#each BANDS as band}<div class="quota-head">{titleCase(band)} <span class="ml-1 text-[10px] font-normal normal-case tracking-normal text-[#6f8ba5]">{band==='easy'?'0–3.9':band==='medium'?'4–6.9':'7–10'}</span></div>{/each}
            {#each LANGUAGES as language}<div class="quota-label flex items-center">{language}</div>{#each BANDS as band}{@const cell=app.quota.find((item)=>item.language===language&&item.band===band)}
              <button class="quota-cell" class:unfilled={cell.achieved<cell.target} class:oversubscribed={cell.achieved>cell.target*1.5} onclick={()=>app.drillQuota(language,band)} aria-label={`${language} ${band}: ${cell.achieved} of ${cell.target}; show matching candidates`}>
                <div class="flex items-start justify-between"><span class="text-xl font-semibold tabular-nums">{cell.achieved} <span class="text-sm font-normal text-[#819ab0]">of {cell.target}</span></span>{#if cell.achieved<cell.target}<span class="rounded-sm bg-[#5b461d] px-1.5 py-1 text-[9px] font-bold uppercase text-[#ffd792]">Needs {cell.target-cell.achieved}</span>{:else if cell.achieved>cell.target*1.5}<span class="rounded-sm bg-[#513d6b] px-1.5 py-1 text-[9px] font-bold uppercase text-[#e0c8ff]">+{cell.achieved-cell.target} excess</span>{:else}<IconCheck class="text-[#55d6be]" size={18}/>{/if}</div>
                <div class="quota-bar"><div class="quota-fill" style={`width:${Math.min(100,cell.achieved/cell.target*100)}%`}></div></div><div class="mt-2 text-[11px] text-[#7e98af]">View {language} repositories</div>
              </button>
            {/each}{/each}
          </div></div>
        </section>
      {:else if app.activeView==='timeline'}
        <section aria-labelledby="timeline-title"><div class="mb-5"><div class="eyebrow">Audit trail</div><h1 id="timeline-title" class="mt-1 text-3xl font-semibold">Event timeline</h1><p class="mt-2 text-sm text-[#8fa7bc]">Newest events first. Undo restores this trail with the rest of session state.</p></div>
          <div class="surface p-5 lg:p-7">{#each [...app.timeline].reverse() as entry,index (entry.at+entry.name+index)}<article class="timeline-line"><div class="flex flex-wrap items-center gap-2"><code class="font-semibold text-[#e8f3fb]">{entry.name}</code><span class="status-chip status-{entry.fromStatus}">{titleCase(entry.fromStatus)}</span><span class="text-[#68849d]">→</span><span class="status-chip status-{entry.toStatus}">{titleCase(entry.toStatus)}</span>{#if entry.rejectionReason}<span class="license-chip">{entry.rejectionReason}</span>{/if}</div><time class="mt-2 block text-[11px] text-[#718da6]" datetime={entry.at}>{new Date(entry.at).toLocaleString()}</time></article>{/each}</div>
        </section>
      {:else if app.activeView==='build-queue'}
        <section aria-labelledby="queue-title"><div class="mb-5"><div class="eyebrow">Build order</div><h1 id="queue-title" class="mt-1 text-3xl font-semibold">Build queue</h1><p class="mt-2 text-sm text-[#8fa7bc]">Use move controls or drag entries. Order persists across views.</p></div>{@render queueList(false)}</section>
      {/if}
    </main>

    <aside class="desktop-queue sticky top-20 hidden h-[calc(100vh-6.25rem)] min-h-0 flex-col surface xl:flex" aria-label="Build queue panel">
      <div class="flex items-center justify-between border-b border-[#29415a] p-4"><div><div class="eyebrow">Ordered output</div><h2 class="mt-1 font-semibold">Build queue <span class="ml-1 text-[#63d9c3]">{app.queue.length}</span></h2></div><button class="btn-soft icon-btn" onclick={()=>switchView('build-queue')} aria-label="Open build queue view"><IconListCheck size={16}/></button></div>
      <div class="min-h-0 flex-1 overflow-y-auto p-3">{@render queueList(true)}</div>
      <div class="border-t border-[#29415a] p-3 text-[11px] text-[#7891a7]">Keyboard reorder controls announce the new position.</div>
    </aside>
  </div>
</div>

{#snippet queueList(compact)}
  {#if app.queue.length}
    <div class="space-y-2" role="list" aria-label="Ordered build queue">
      {#each app.queueEntries() as entry,index (entry.candidate.id)}
        <article class="queue-entry" class:opacity-60={dragId===entry.candidate.id} role="listitem" draggable="true" ondragstart={()=>dragId=entry.candidate.id} ondragover={(event)=>event.preventDefault()} ondrop={(event)=>queueDrop(event,index)} animate:flip={{duration:260}} transition:fly={{x:20,duration:220}}>
          <div class="flex items-start gap-2"><span class="grid size-6 shrink-0 place-items-center bg-[#55d6be] text-xs font-bold text-[#071714]">{entry.position}</span><IconGripVertical class="mt-1 shrink-0 cursor-grab text-[#54718b]" size={15}/><div class="min-w-0 flex-1"><div class="mono truncate text-xs font-semibold">{entry.candidate.name}</div><div class="mt-1 text-[10px] text-[#8099b0]">Difficulty {entry.candidate.difficulty.toFixed(1)} · {entry.candidate.clusterId}</div></div></div>
          <div class="mt-3 flex gap-1"><button class="btn-soft icon-btn" disabled={index===0} onclick={()=>app.reorder(entry.candidate.id,index-1)} aria-label={`Move ${entry.candidate.name} up`}><IconChevronUp size={14}/></button><button class="btn-soft icon-btn" disabled={index===app.queue.length-1} onclick={()=>app.reorder(entry.candidate.id,index+1)} aria-label={`Move ${entry.candidate.name} down`}><IconChevronDown size={14}/></button><button class="btn-soft btn-danger ml-auto {compact?'icon-btn':''}" onclick={()=>app.removeFromQueue(entry.candidate.id)} aria-label={`Remove ${entry.candidate.name} from queue`}><IconTrash size={14}/>{#if !compact}Remove{/if}</button></div>
        </article>
      {/each}
    </div>
  {:else}<div class="grid min-h-48 place-items-center p-5 text-center"><div><IconListCheck class="mx-auto text-[#4d6a84]" size={30}/><h3 class="mt-3 text-sm font-semibold">Queue is ready</h3><p class="mt-1 text-xs leading-relaxed text-[#7f99b0]">Pin a selected repository, then queue its frozen commit.</p></div></div>{/if}
{/snippet}

{#if app.queueOpen}
  <div class="fixed inset-0 z-[65] bg-black/60 xl:hidden" onclick={()=>app.queueOpen=false} role="presentation"></div>
  <aside class="fixed inset-y-0 right-0 z-[66] w-[min(90vw,380px)] surface xl:hidden" transition:fly={{x:380,duration:240}} aria-label="Mobile build queue"><div class="flex items-center justify-between border-b border-[#29415a] p-4"><h2 class="font-semibold">Build queue ({app.queue.length})</h2><button class="btn-soft icon-btn" onclick={()=>app.queueOpen=false} aria-label="Close queue"><IconX size={17}/></button></div><div class="h-[calc(100%-65px)] overflow-y-auto p-3">{@render queueList(false)}</div></aside>
{/if}

{#if app.selectedCount>0}
  <div class="bulk-tray" transition:fly={{y:50,duration:220}} aria-label="Bulk action tray"><span class="mr-auto text-sm font-semibold"><span class="mr-2 rounded-full bg-[#55d6be] px-2 py-1 text-xs text-[#071714]">{app.selectedCount}</span>selected</span><button class="btn-soft" onclick={()=>app.bulk('score')}>Bulk Score</button><button class="btn-soft btn-primary" onclick={()=>app.bulk('select')}>Bulk Select</button><button class="btn-soft btn-danger" onclick={()=>openReject([...app.selectedIds],true)}>Bulk Reject</button><button class="btn-soft icon-btn" onclick={()=>app.selectedIds=[]} aria-label="Clear selection"><IconX size={16}/></button></div>
{/if}

{#if app.modal?.type==='reject'}
  <Modal open size="xs" danger modalLabel={app.modal.bulk?'Bulk workflow':'Candidate workflow'} modalHeading={app.modal.bulk?`Reject ${app.modal.ids.length} selected candidates`:`Reject ${app.find(app.modal.ids[0])?.name}`} primaryButtonText="Reject" secondaryButtonText="Cancel" on:click:button--primary={submitReject} on:click:button--secondary={closeModal} on:close={closeModal} preventCloseOnClickOutside>
    <form id="reject-form" onsubmit={(event)=>{event.preventDefault();submitReject()}}><label class="label" for="reject-reason">Rejection reason <span class="text-[#ff9baa]">required</span></label><select id="reject-reason" class="field" bind:value={rejectReason} aria-invalid={!!rejectionError} aria-describedby="reject-error" data-modal-primary-focus><option value="">Choose a reason</option>{#each REASONS as reason}<option value={reason}>{reason}</option>{/each}</select>{#if rejectionError}<p id="reject-error" class="error">{rejectionError}</p>{/if}<p class="mt-3 text-xs leading-relaxed text-[#8ca4b9]">Only the fixed sourcing-policy tokens are accepted. Cancel changes nothing.</p></form>
  </Modal>
{/if}
{#if app.modal?.type==='pin'}
  <Modal open size="sm" modalLabel="Freeze source" modalHeading={`Pin ${app.find(app.modal.id)?.name}`} primaryButtonText="Confirm pin" secondaryButtonText="Cancel" primaryButtonDisabled={pinNotes.length>200} on:click:button--primary={submitPin} on:click:button--secondary={closeModal} on:close={closeModal} preventCloseOnClickOutside>
    <form onsubmit={(event)=>{event.preventDefault();submitPin()}}><div class="mb-4 border border-[#344e67] bg-[#0a192a] p-3"><div class="eyebrow">Frozen commit</div><code class="mt-2 block text-lg font-semibold tracking-wider text-[#d3b9ff]">{app.modal.commit}</code><p class="mt-1 text-[11px] text-[#7893aa]">Generated locally; lowercase hexadecimal, 12 characters.</p></div><label class="label" for="pin-notes">Notes <span class="font-normal text-[#718ba3]">optional · {pinNotes.length}/200</span></label><textarea id="pin-notes" class="field" rows="4" maxlength="220" bind:value={pinNotes} aria-invalid={!!pinError||pinNotes.length>200} aria-describedby="pin-error" placeholder="Capture build flags, fixtures, or review context." data-modal-primary-focus></textarea>{#if pinNotes.length>200}<p id="pin-error" class="error">Notes field: use 200 characters or fewer.</p>{:else if pinError}<p id="pin-error" class="error">{pinError}</p>{/if}</form>
  </Modal>
{/if}

{#if app.modal?.type==='export'}
  <Modal open size="lg" passiveModal modalLabel="Session artifact" modalHeading="Export sourcing pack" on:close={closeModal} hasScrollingContent>
    <div class="mb-3 flex flex-wrap gap-1 border-b border-[#2a4159]" role="tablist">{#each exportTabs as tab}<button class="px-3 py-2 text-xs font-semibold {exportTab===tab.id?'border-b-2 border-[#55d6be] text-[#6ee0cb]':'text-[#8fa6bb]'}" role="tab" aria-selected={exportTab===tab.id} onclick={()=>exportTab=tab.id}>{tab.label}</button>{/each}</div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2"><p class="text-xs text-[#8da5bb]">Compiled live from {app.candidates.length} candidates and {app.queue.length} queue entries.</p><div class="flex gap-2"><button class="btn-soft" onclick={()=>copyText(exportTexts[exportTab],exportTabs.find((item)=>item.id===exportTab).label)}><IconCopy size={15}/>{copied===exportTabs.find((item)=>item.id===exportTab).label?'Copied':'Copy'}</button><button class="btn-soft btn-primary" onclick={downloadActive}><IconDownload size={15}/>Download</button></div></div>
    <pre class="max-h-[52vh] overflow-auto border border-[#2d455d] bg-[#081523] p-4 text-[11px] leading-relaxed text-[#c6d8e8]" aria-label="Active export text">{exportTexts[exportTab]}</pre>
  </Modal>
{/if}

{#if app.modal?.type==='import'}
  <Modal open size="lg" modalLabel="Restore session" modalHeading="Import sourcing pack" primaryButtonText="Apply import" secondaryButtonText="Cancel" primaryButtonDisabled={!importRaw.trim()} on:click:button--primary={submitImport} on:click:button--secondary={closeModal} on:close={closeModal} preventCloseOnClickOutside hasScrollingContent>
    <form onsubmit={(event)=>{event.preventDefault();submitImport()}}><div class="mb-4 grid gap-3 sm:grid-cols-2"><label class="btn-soft cursor-pointer"><IconUpload size={16}/>Choose .json file<input class="sr-only" type="file" accept=".json,application/json" onchange={loadFile}/></label><button type="button" class="btn-soft" onclick={()=>{importRaw=samplePack();importForm.setFieldValue('raw',importRaw);importError=''}}><IconSparkles size={16}/>Use seeded sample pack</button></div><label class="label" for="import-json">Raw JSON text</label><textarea id="import-json" class="field mono" rows="14" bind:value={importRaw} aria-invalid={!!importError} aria-describedby="import-error" placeholder="Paste a sourcing-pack/v1 JSON document" data-modal-primary-focus></textarea>{#if importError}<p id="import-error" class="error">{importError}</p>{/if}<p class="mt-3 text-xs leading-relaxed text-[#8ba3b9]">A valid import replaces candidate records and queue order. It is one undoable action.</p></form>
  </Modal>
{/if}

{#if app.modal?.type==='palette'}
  <div class="overlay" role="presentation" onclick={(event)=>{if(event.currentTarget===event.target)closePalette()}} onkeydown={(event)=>{if(event.key==='Escape'){event.stopPropagation();closePalette()}else if(event.key==='Tab'){const nodes=[...event.currentTarget.querySelectorAll('input,button:not(:disabled)')];const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}}}>
    <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette" transition:scale={{start:.96,duration:220}}>
      <div class="flex items-center gap-3 p-4"><IconSearch class="text-[#6c8aa5]" size={20}/><input class="min-w-0 flex-1 bg-transparent text-base text-white outline-none" bind:this={paletteInput} bind:value={paletteQuery} placeholder="Search destinations and actions" aria-label="Search commands"/><kbd class="rounded border border-[#3a536c] px-2 py-1 text-[10px] text-[#7f99b0]">Esc</kbd></div>
      <div class="max-h-[55vh] overflow-y-auto">{#each paletteItems() as item}<button class="palette-result" onclick={()=>choosePalette(item[2])}><span><span class="block text-sm font-semibold">{item[0]}</span><span class="mt-1 block text-[10px] uppercase tracking-wider text-[#708ba3]">{item[1]}</span></span><span class="text-[#6fdcc7]">↵</span></button>{:else}<div class="p-8 text-center"><IconSearch class="mx-auto text-[#526e88]" size={28}/><h3 class="mt-3 text-sm font-semibold">No matching commands</h3><p class="mt-1 text-xs text-[#849db3]">Try typing “quota”, “export”, or a candidate action.</p></div>{/each}</div>
    </div>
  </div>
{/if}

{#if app.toast}
  <div class="toast {app.toast.kind}" role="status" transition:fly={{x:30,duration:220}}><div class="flex items-start gap-3">{#if app.toast.kind==='warning'}<IconAlertTriangle class="mt-0.5 shrink-0 text-[#f0b65a]" size={18}/>{:else}<IconCheck class="mt-0.5 shrink-0 text-[#55d6be]" size={18}/>{/if}<div><div class="text-sm font-semibold">{app.toast.kind==='warning'?'Attention':'Complete'}</div><div class="mt-1 text-xs leading-relaxed text-[#b3c4d3]">{app.toast.message}</div></div><button class="ml-auto text-[#7590a8] hover:text-white" onclick={()=>app.toast=null} aria-label="Dismiss notification"><IconX size={16}/></button></div></div>
{/if}

<div class="sr-only" aria-live="polite" aria-atomic="true">{app.liveMessage}</div>
