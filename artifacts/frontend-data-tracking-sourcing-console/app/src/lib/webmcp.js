import { BANDS, LANGUAGES, LICENSES, STATUSES, REASONS, rejectionSchema, pinSchema, randomCommit, samplePack } from './state.svelte.js';

const objectSchema = (properties = {}, required = []) => ({ type:'object', properties, required, additionalProperties:false });
const stringEnum = (values) => ({ type:'string', enum:values });

export function registerWebMCP(app, ui) {
  const destinations = ['candidates','quota','timeline','build-queue','export-panel','import-panel','command-palette'];
  const filters = ['language','difficulty-band','license','status','name-search'];
  const tools = [];
  const add = (name, description, inputSchema, execute) => tools.push({ name, description, inputSchema, execute });
  const visible = (message) => { app.liveMessage=message; return { ok:true, message }; };

  add('browse_open','Open a declared Sourcebench destination.',objectSchema({destination:stringEnum(destinations)},['destination']),({destination}) => {
    if(destination==='export-panel')ui.openPanel('export'); else if(destination==='import-panel')ui.openPanel('import'); else if(destination==='command-palette')ui.openPalette(); else app.activeView=destination;
    return visible(`Opened ${destination}.`);
  });
  add('browse_search','Search candidate repository names.',objectSchema({query:{type:'string',maxLength:100}},['query']),({query}) => { app.activeView='candidates'; app.filters.search=query; app.selectedIds=[]; return {ok:true,visibleCount:app.visibleCandidates.length}; });
  add('browse_apply_filter','Apply one bounded candidate filter.',objectSchema({filter:stringEnum(filters),value:{type:'string',maxLength:80}},['filter','value']),({filter,value}) => {
    // Normalize bounded tokens case-insensitively so the applied value always
    // matches a visible select option — an unmatched value would leave the
    // filter control blank while silently emptying the table.
    let normalized=value;
    if(filter==='language'){ normalized=LANGUAGES.find((item)=>item.toLowerCase()===String(value).toLowerCase()); if(!normalized)return {ok:false,error:'Invalid language value.'}; }
    else if(filter!=='name-search'){ normalized=String(value).toLowerCase(); const domain=filter==='difficulty-band'?BANDS:filter==='license'?LICENSES:STATUSES; if(!domain.includes(normalized))return {ok:false,error:`Invalid ${filter} value.`}; }
    const key={language:'language','difficulty-band':'band',license:'license',status:'status','name-search':'search'}[filter]; app.filters[key]=normalized; app.activeView='candidates'; app.selectedIds=[]; return {ok:true,visibleCount:app.visibleCandidates.length};
  });
  add('browse_clear_filter','Clear one candidate filter or all filters.',objectSchema({filter:{type:'string',enum:['all',...filters]}}),({filter='all'}) => {
    if(filter==='all')app.clearFilters(); else { const key={language:'language','difficulty-band':'band',license:'license',status:'status','name-search':'search'}[filter]; app.filters[key]=''; app.selectedIds=[]; } return {ok:true,visibleCount:app.visibleCandidates.length};
  });
  add('browse_sort','Sort candidates by a declared column and direction.',objectSchema({sort:stringEnum(['name','stars','difficulty']),direction:stringEnum(['asc','desc'])},['sort','direction']),({sort,direction}) => { app.sort={key:sort,direction}; app.activeView='candidates'; return visible(`Sorted candidates by ${sort} ${direction}.`); });

  add('entity_select','Select or clear a candidate checkbox.',objectSchema({name:{type:'string',maxLength:120},selected:{type:'boolean'}},['name','selected']),({name,selected}) => { const candidate=app.find(name); if(!candidate)return {ok:false,error:'Candidate not found.'}; app.setSelection(candidate.id,selected); return {ok:true,selectedCount:app.selectedCount}; });
  add('entity_update','Run a declared candidate status command using the same product handler.',objectSchema({name:{type:'string',maxLength:120},status:stringEnum(STATUSES),'rejection-reason':stringEnum(REASONS),'pin-notes':{type:'string',maxLength:200}},['name','status']),args => {
    const candidate=app.find(args.name); if(!candidate)return {ok:false,error:'Candidate not found.'}; const target=args.status; let result=false;
    if(target==='scored'&&candidate.status==='candidate')result=app.score([candidate.id]);
    else if(target==='selected'&&candidate.status==='scored')result=app.select([candidate.id]);
    else if(target==='rejected'&&candidate.status==='scored'){ const rejected=app.reject([candidate.id],args['rejection-reason']); return {ok:rejected.ok,error:rejected.error||undefined,status:candidate.status}; }
    else if(target==='pinned'&&candidate.status==='selected'){ ui.statusAction(candidate,'pin'); return visible(`Pin form opened for ${candidate.name}.`); }
    else if(target==='queued'&&candidate.status==='pinned')result=app.enqueue(candidate.id);
    else if(target==='selected'&&candidate.status==='queued')result=app.removeFromQueue(candidate.id);
    else return {ok:false,error:`Transition ${candidate.status} to ${target} is not available.`};
    return {ok:!!result,status:candidate.status,guard:candidate.guardMessage||undefined};
  });
  add('entity_reorder','Reorder a queued candidate for setup; gesture behavior remains in the UI.',objectSchema({name:{type:'string',maxLength:120},'queue-position':{type:'integer',minimum:1}},['name','queue-position']),args => { const candidate=app.find(args.name); if(!candidate)return {ok:false,error:'Candidate not found.'}; const ok=app.reorder(candidate.id,args['queue-position']-1); return {ok,position:app.queue.indexOf(candidate.id)+1}; });

  add('form_validate','Validate declared rejection or pin form fields; invalid values surface the same inline field errors as the UI.',objectSchema({form:stringEnum(['rejection','pin']),'rejection-reason':{type:'string'},'pin-notes':{type:'string'}},['form']),args => {
    const result=args.form==='rejection'?rejectionSchema.safeParse({reason:args['rejection-reason']}):pinSchema.safeParse({notes:args['pin-notes']??''});
    if(!result.success) {
      const message=result.error.issues[0].message;
      if(args.form==='rejection'){ if(app.modal?.type!=='reject') ui.openRejectForValidation(); ui.setRejectionError(message); }
      if(args.form==='pin'){ if(app.modal?.type!=='pin') ui.openPinForValidation(); ui.setPinError(message); }
      return {ok:false,error:message};
    }
    if(args.form==='rejection') ui.setRejectionError('');
    if(args.form==='pin') ui.setPinError('');
    return {ok:true};
  });
  add('form_submit','Open or submit a declared candidate form through the visible product flow.',objectSchema({form:stringEnum(['rejection','pin']),name:{type:'string',maxLength:120},'rejection-reason':stringEnum(REASONS),'pin-notes':{type:'string',maxLength:200}},['form','name']),args => {
    const candidate=app.find(args.name); if(!candidate)return {ok:false,error:'Candidate not found.'};
    if(args.form==='rejection'){ const result=app.reject([candidate.id],args['rejection-reason']); return {ok:result.ok,error:result.error||undefined}; }
    const result=app.pin(candidate.id,args['pin-notes']??'',randomCommit()); return {ok:result.ok,error:result.error||undefined,status:candidate.status};
  });
  add('form_cancel','Cancel the open rejection or pin form.',objectSchema({form:stringEnum(['rejection','pin'])},['form']),() => { if(['reject','pin'].includes(app.modal?.type))ui.closeModal(); return visible('Form cancelled with no state change.'); });

  add('artifact_export','Open a live export format without returning artifact contents.',objectSchema({format:stringEnum(['queue-json','candidates-csv','sourcing-report-markdown'])},['format']),({format}) => { ui.openExportSurface(format,false); return visible(`Export panel opened for ${format}; use the visible controls to copy or download.`); });
  add('artifact_import','Start a declared sourcing-pack import mode without accepting raw artifact content.',objectSchema({mode:stringEnum(['sourcing-pack-json','seeded-sample'])},['mode']),({mode}) => {
    if(mode==='seeded-sample'){ const result=app.importPack(samplePack()); return {ok:result.ok,message:result.ok?'Seeded sample pack applied; statuses and queue order restored to the seeded baseline.':result.error}; }
    ui.openPanel('import'); return visible('Import panel opened; choose a file or paste JSON in the visible form.');
  });
  add('artifact_copy','Open and focus the visible Copy control for a declared format; clipboard interaction remains Playwright-driven.',objectSchema({format:stringEnum(['queue-json','candidates-csv','sourcing-report-markdown'])},['format']),({format}) => { ui.openExportSurface(format,true); return visible(`Export panel opened for ${format}; activate the focused Copy control.`); });

  window.sourcebenchWebMCPTools=tools;
  window.webmcp_session_info=() => ({
    "contract_version": "zto-webmcp-v1",
    "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"]
  });
  window.webmcp_list_tools=() => tools.map(({name,description,inputSchema})=>({name,description,inputSchema}));
  window.webmcp_invoke_tool=async(name,args={}) => { const tool=tools.find((item)=>item.name===name); if(!tool)throw new Error(`Unknown WebMCP tool: ${name}`); return tool.execute(args); };
  if(navigator.modelContext?.registerTool){ window.webmcpRegistrationErrors=[]; for(const tool of tools){ try{ navigator.modelContext.registerTool(tool); }catch(error){ window.webmcpRegistrationErrors.push({name:tool.name,message:error.message}); } } }
}
