import { BENCHMARKS, makeJobConfigSchema, sanitizeJobConfig } from './schemas';
import { getEligibleCheckpoints, getEligibleDatasets, usePipelineStore } from './store';

let registered = false;

const result = (ok, message, visibleState = {}) => ({ ok, message, visibleState });
const state = () => usePipelineStore.getState();

function normalizeForm(input = {}) {
  return {
    jobType: input['job-type'] ?? input.jobType,
    dataset: input.dataset,
    model: input.model,
    count: input.count,
    cluster: input.cluster,
    benchmark: input.benchmark,
    repetitions: input.repetitions ?? (input['job-type'] === 'evaluate' ? 3 : undefined),
    autoEvaluate: input['auto-evaluate'] ?? input.autoEvaluate,
  };
}

function displayEnums(config) {
  const types = { 'data-generation': 'Data generation', 'fine-tune': 'Fine-tune', evaluate: 'Evaluate' };
  const benchmarks = { switchboard: 'Switchboard', cartographer: 'Cartographer', ledger: 'Ledger' };
  return { ...config, jobType: types[config.jobType] ?? config.jobType, benchmark: benchmarks[config.benchmark] ?? config.benchmark };
}

const handlers = {
  browse_open: async ({ destination, runId, model, benchmark } = {}) => {
    const s = state();
    if (destination === 'pipeline-board') s.setView('pipeline');
    else if (destination === 'datasets') s.setView('datasets');
    else if (destination === 'results') s.setView('results');
    else if (destination === 'run-detail' && s.runs.some((r) => r.id === runId)) { s.setView('pipeline'); s.selectRun(runId); }
    else if (destination === 'trial-drill-down' && s.trialData.some((x) => x.model === model && x.benchmark === benchmark)) { s.setView('results'); s.setDrilldown({ model, benchmark }); }
    else return result(false, 'Destination or required bounded identifier is unavailable.');
    return result(true, `Opened ${destination}.`, { destination, runId, model, benchmark });
  },
  browse_search: async ({ query } = {}) => {
    const run = state().runs.find((r) => r.id.toLowerCase() === String(query ?? '').toLowerCase() || r.label.toLowerCase().includes(String(query ?? '').toLowerCase()));
    if (!run) return result(false, 'No run matched the visible query; state unchanged.');
    state().setView('pipeline'); state().selectRun(run.id);
    return result(true, `Opened matching run ${run.id}.`, { destination: 'run-detail', runId: run.id });
  },
  browse_apply_filter: async ({ filter, value, index = 0 } = {}) => {
    const s = state();
    if (filter === 'dataset') { s.setDatasetFilter(value); return result(true, `Dataset filter set to ${value}.`, { datasetFilter: value }); }
    if (filter === 'phase') { s.setTimelinePhase(value); return result(true, `Timeline phase filter set to ${value}.`, { phase: value }); }
    if (filter === 'status') { s.setTimelineStatus(value); return result(true, `Timeline status filter set to ${value}.`, { status: value }); }
    if (filter === 'comparison-model' && s.trialData.some((x) => x.model === value)) { s.setView('results'); s.setComparison(Number(index) === 1 ? 1 : 0, value); return result(true, 'Comparison model updated.', { index, model: value }); }
    return result(false, 'Filter or bounded value is unavailable; state unchanged.');
  },
  browse_clear_filter: async ({ filter } = {}) => {
    const s = state();
    if (!filter || filter === 'dataset') s.setDatasetFilter(null);
    if (!filter || filter === 'phase') s.setTimelinePhase('all');
    if (!filter || filter === 'status') s.setTimelineStatus('all');
    return result(true, `${filter ?? 'All'} filter cleared.`, { filter });
  },
  browse_sort: async ({ sort = 'mean-score', direction } = {}) => {
    const keyMap = { 'mean-score': 'mean', spread: 'spread', cost: 'cost', 'trial-count': 'trials' };
    if (!keyMap[sort]) return result(false, 'Sort is outside the declared result sorts.');
    state().setView('results'); state().setResultSort(keyMap[sort], direction === 'asc' ? 'asc' : 'desc');
    return result(true, `Results sorted by ${sort}.`, { sort, direction: direction === 'asc' ? 'asc' : 'desc' });
  },
  browse_set_locale: async () => result(false, 'Relay has one fixed research locale; no visible locale control is available.'),
  browse_set_theme: async () => result(false, 'Relay uses the fixed console theme; no visible theme control is available.'),

  form_validate: async (input = {}) => {
    const s = state(); const raw = displayEnums(normalizeForm(input));
    s.openSubmission(); window.dispatchEvent(new CustomEvent('relay:form-fill', { detail: raw }));
    const parsed = makeJobConfigSchema(getEligibleDatasets(s.runs), getEligibleCheckpoints(s.runs)).safeParse(raw);
    if (parsed.success) return result(true, 'Job configuration is valid and visible in the submission panel.', { valid: true });
    return result(false, 'Validation errors are visible in the submission panel.', { valid: false, fields: parsed.error.issues.map((x) => x.path[0]) });
  },
  form_submit: async (input = {}) => {
    const s = state(); const raw = displayEnums(normalizeForm(input));
    s.openSubmission(); window.dispatchEvent(new CustomEvent('relay:form-fill', { detail: raw }));
    const parsed = makeJobConfigSchema(getEligibleDatasets(s.runs), getEligibleCheckpoints(s.runs)).safeParse(raw);
    if (!parsed.success) return result(false, 'Submission rejected; named field errors remain visible.', { valid: false, fields: parsed.error.issues.map((x) => x.path[0]) });
    const run = s.submitJob(sanitizeJobConfig(raw, getEligibleDatasets(s.runs), getEligibleCheckpoints(s.runs)));
    return result(true, `Submitted ${run.id}; the board and rollups updated.`, { runId: run.id, destination: 'pipeline-board' });
  },
  form_cancel: async () => { state().closeSubmission(); return result(true, 'Submission panel closed.', { submissionOpen: false }); },
  form_reset: async () => { const draft = { jobType: 'Fine-tune', dataset: '', model: '', count: 5, cluster: 'aurora', repetitions: 3, autoEvaluate: true }; state().openSubmission(); window.dispatchEvent(new CustomEvent('relay:form-fill',{detail:draft})); return result(true, 'Submission form reset; validation remains active.', { submissionOpen: true }); },
  form_advance: async () => result(false, 'The job form is a single visible step; advance is unavailable.'),
  form_return: async () => result(false, 'The job form is a single visible step; return is unavailable.'),

  session_pause: async ({ runId, phase } = {}) => { const p = state().runs.find(r=>r.id===runId)?.phases.find(x=>x.key===phase); if(!p||p.status!=='Running')return result(false,'Only a running phase can be paused.'); state().pausePhase(runId,phase); return result(true,'Phase paused at its visible checkpoint.',{runId,phase,checkpoint:p.current}); },
  session_resume: async ({ runId, phase } = {}) => { const p = state().runs.find(r=>r.id===runId)?.phases.find(x=>x.key===phase); if(!p||p.status!=='Running'||!p.paused)return result(false,'Only a paused running phase can be resumed.'); state().resumePhase(runId,phase); return result(true,'Phase resumed from the same checkpoint.',{runId,phase,checkpoint:p.current}); },
  session_restart: async ({ runId, phase } = {}) => { const p = state().runs.find(r=>r.id===runId)?.phases.find(x=>x.key===phase); if(!p||p.status!=='Failed'||p.retryRemaining>0)return result(false,'Manual retry is available only after backoff is exhausted.'); state().retryPhase(runId,phase); return result(true,'Failed phase restarted from its saved checkpoint.',{runId,phase,checkpoint:p.current}); },
  session_start: async () => result(false, 'New simulations start through the visible job submission workflow.'),
  session_stop: async () => result(false, 'Stopping is not a declared product operation; pause a running phase instead.'),
  session_advance: async () => result(false, 'Live progress is timing-based and must be observed in the UI.'),
  session_trigger_demo: async () => result(false, 'No synthetic demo trigger is exposed; use the seeded live runs.'),
  session_connect: async () => result(false, 'The in-memory simulation is already connected.'),
  session_disconnect: async () => result(false, 'Disconnect is unavailable for the in-memory simulation.'),

  artifact_copy: async () => {
    const s = state(); const raw = s.formDraft;
    const parsed = makeJobConfigSchema(getEligibleDatasets(s.runs), getEligibleCheckpoints(s.runs)).safeParse(raw);
    if (!parsed.success) return result(false, 'The visible config is invalid and was not copied.', { valid: false });
    const exact = JSON.stringify(sanitizeJobConfig(raw,getEligibleDatasets(s.runs),getEligibleCheckpoints(s.runs)),null,2);
    await navigator.clipboard.writeText(exact); s.pushAlert('Exact job config copied to clipboard','green');
    return result(true, 'The visible job config was copied; inspect the clipboard through the browser.', { format: 'job-config' });
  },
  artifact_export: async () => result(false, 'Use the visible Download job-config.json control; download observation remains in the browser.'),
  artifact_import: async () => result(false, 'No import control is offered in this product; state unchanged.'),
  artifact_print_preview: async () => result(false, 'Print preview is not offered; state unchanged.'),
  artifact_convert: async () => result(false, 'Conversion is not offered; state unchanged.'),
};

const schemas = {
  browse_open: { type:'object', properties:{ destination:{enum:['pipeline-board','run-detail','datasets','results','trial-drill-down']},runId:{type:'string'},model:{type:'string'},benchmark:{enum:BENCHMARKS} }, required:['destination'] },
  browse_search: { type:'object',properties:{query:{type:'string'}},required:['query'] },
  browse_apply_filter: { type:'object',properties:{filter:{enum:['dataset','phase','status','comparison-model']},value:{type:'string'},index:{type:'integer',minimum:0,maximum:1}},required:['filter','value'] },
  browse_clear_filter: { type:'object',properties:{filter:{enum:['dataset','phase','status','comparison-model']}} },
  browse_sort: { type:'object',properties:{sort:{enum:['mean-score','spread','cost','trial-count']},direction:{enum:['asc','desc']}},required:['sort'] },
};

function toolDescription(name) {
  return `${name.replaceAll('_',' ')} for the Relay research pipeline. Uses the same bounded product handler and updates visible state when available.`;
}

export function registerWebMCP() {
  if (registered) return;
  registered = true;
  window.webmcp_tools = Object.fromEntries(Object.entries(handlers).map(([name,execute])=>[name,{name,description:toolDescription(name),inputSchema:schemas[name]??{type:'object',additionalProperties:true},execute}]));
  window.webmcp_list_tools = () => Object.values(window.webmcp_tools).map(({name,description,inputSchema})=>({name,description,inputSchema}));
  window.webmcp_invoke_tool = async (name,args={}) => {
    if(!window.webmcp_tools[name]) throw new Error(`Unknown WebMCP tool: ${name}`);
    return window.webmcp_tools[name].execute(args);
  };
  const context = navigator.modelContext;
  if (context?.registerTool) {
    Object.values(window.webmcp_tools).forEach((tool)=>{
      try { context.registerTool({ name:tool.name, description:tool.description, inputSchema:tool.inputSchema, execute:tool.execute }); } catch (error) { /* duplicate registration is harmless during HMR */ }
    });
  }
}
