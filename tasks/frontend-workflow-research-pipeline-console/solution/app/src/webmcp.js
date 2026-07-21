import { BENCHMARKS, makeJobConfigSchema, sanitizeJobConfig } from './schemas';
import { getEligibleCheckpoints, getEligibleDatasets, usePipelineStore } from './store';

let registered = false;

const MODULES = ['browse-query-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'];

const paint = () => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30)));
});

const result = (ok, message, visibleState = {}) => ({ ok, message, visibleState });
const state = () => usePipelineStore.getState();

function snapshot() {
  const s = state();
  return {
    activeView: s.activeView,
    selectedRunId: s.selectedRunId,
    datasetFilter: s.datasetFilter,
    submissionOpen: s.submissionOpen,
    runCount: s.runs.length,
    activeJobs: s.runs.filter((r) => r.phases.some((p) => p.status === 'Running')).length,
    resultSort: s.resultSort,
    comparison: s.comparison,
    timelinePhase: s.timelinePhase,
    timelineStatus: s.timelineStatus,
    drilldown: s.drilldown,
  };
}

function normalizeForm(input = {}) {
  const jobRaw = input['job-type'] ?? input.jobType;
  return {
    jobType: jobRaw,
    dataset: input.dataset,
    model: input.model,
    count: input.count,
    cluster: input.cluster,
    benchmark: input.benchmark,
    repetitions: input.repetitions ?? (String(jobRaw).toLowerCase() === 'evaluate' ? 3 : undefined),
    autoEvaluate: input['auto-evaluate'] ?? input.autoEvaluate,
  };
}

function displayEnums(config) {
  const types = { 'data-generation': 'Data generation', 'fine-tune': 'Fine-tune', evaluate: 'Evaluate' };
  const benchmarks = { switchboard: 'Switchboard', cartographer: 'Cartographer', ledger: 'Ledger' };
  return {
    ...config,
    jobType: types[config.jobType] ?? config.jobType,
    benchmark: config.benchmark != null ? (benchmarks[config.benchmark] ?? config.benchmark) : undefined,
  };
}

const handlers = {
  browse_open: async ({ destination, runId, model, benchmark } = {}) => {
    const s = state();
    if (destination === 'pipeline-board') s.setView('pipeline');
    else if (destination === 'datasets') s.setView('datasets');
    else if (destination === 'results') s.setView('results');
    else if (destination === 'run-detail' && s.runs.some((r) => r.id === runId)) { s.setView('pipeline'); s.selectRun(runId); }
    else if (destination === 'trial-drill-down' && s.trialData.some((x) => x.model === model && x.benchmark === benchmark)) {
      s.setView('results'); s.setDrilldown({ model, benchmark });
    } else return result(false, 'Destination or required bounded identifier is unavailable.', snapshot());
    await paint();
    return result(true, `Opened ${destination}.`, { ...snapshot(), destination, runId, model, benchmark });
  },
  browse_search: async ({ query } = {}) => {
    const q = String(query ?? '').toLowerCase();
    const run = state().runs.find((r) => r.id.toLowerCase() === q || r.label.toLowerCase().includes(q));
    if (!run) return result(false, 'No run matched the visible query; state unchanged.', snapshot());
    state().setView('pipeline'); state().selectRun(run.id);
    await paint();
    return result(true, `Opened matching run ${run.id}.`, { ...snapshot(), destination: 'run-detail', runId: run.id });
  },
  browse_apply_filter: async ({ filter, value, index = 0 } = {}) => {
    const s = state();
    if (filter === 'dataset') {
      if (!s.datasets.some((d) => d.name === value)) return result(false, 'Dataset is outside the visible catalog.', snapshot());
      s.setDatasetFilter(value);
      await paint();
      return result(true, `Dataset filter set to ${value}.`, { ...snapshot(), datasetFilter: value });
    }
    if (filter === 'phase') {
      if (!s.selectedRunId) return result(false, 'Open a run detail panel before filtering its timeline.', snapshot());
      s.setTimelinePhase(value);
      await paint();
      return result(true, `Timeline phase filter set to ${value}.`, { ...snapshot(), phase: value });
    }
    if (filter === 'status') {
      if (!s.selectedRunId) return result(false, 'Open a run detail panel before filtering its timeline.', snapshot());
      s.setTimelineStatus(value);
      await paint();
      return result(true, `Timeline status filter set to ${value}.`, { ...snapshot(), status: value });
    }
    if (filter === 'comparison-model' && s.trialData.some((x) => x.model === value)) {
      s.setView('results'); s.setComparison(Number(index) === 1 ? 1 : 0, value);
      await paint();
      return result(true, 'Comparison model updated.', { ...snapshot(), index, model: value });
    }
    return result(false, 'Filter or bounded value is unavailable; state unchanged.', snapshot());
  },
  browse_clear_filter: async ({ filter } = {}) => {
    const s = state();
    if (!filter || filter === 'dataset') s.setDatasetFilter(null);
    if (!filter || filter === 'phase') s.setTimelinePhase('all');
    if (!filter || filter === 'status') s.setTimelineStatus('all');
    await paint();
    return result(true, `${filter ?? 'All'} filter cleared.`, { ...snapshot(), filter });
  },
  browse_sort: async ({ sort = 'mean-score', direction } = {}) => {
    const keyMap = { 'mean-score': 'mean', spread: 'spread', cost: 'cost', 'trial-count': 'trials' };
    if (!keyMap[sort]) return result(false, 'Sort is outside the declared result sorts.', snapshot());
    const dir = direction === 'asc' ? 'asc' : 'desc';
    state().setView('results');
    state().setResultSort(keyMap[sort], dir);
    await paint();
    return result(true, `Results sorted by ${sort} ${dir}.`, { ...snapshot(), sort, direction: dir });
  },

  form_validate: async (input = {}) => {
    const s = state();
    const raw = displayEnums(normalizeForm(input));
    s.openSubmission();
    await paint();
    window.dispatchEvent(new CustomEvent('relay:form-fill', { detail: raw }));
    await paint();
    const parsed = makeJobConfigSchema(getEligibleDatasets(s.runs), getEligibleCheckpoints(s.runs)).safeParse(raw);
    if (parsed.success) return result(true, 'Job configuration is valid and visible in the submission panel.', { ...snapshot(), valid: true });
    return result(false, 'Validation errors are visible in the submission panel.', {
      ...snapshot(), valid: false, fields: parsed.error.issues.map((x) => x.path[0]),
    });
  },
  form_submit: async (input = {}) => {
    const s = state();
    const raw = displayEnums(normalizeForm(input));
    s.openSubmission();
    await paint();
    window.dispatchEvent(new CustomEvent('relay:form-fill', { detail: raw }));
    await paint();
    const eligibleDatasets = getEligibleDatasets(s.runs);
    const eligibleCheckpoints = getEligibleCheckpoints(s.runs);
    const parsed = makeJobConfigSchema(eligibleDatasets, eligibleCheckpoints).safeParse(raw);
    if (!parsed.success) {
      return result(false, 'Submission rejected; named field errors remain visible.', {
        ...snapshot(), valid: false, fields: parsed.error.issues.map((x) => x.path[0]),
      });
    }
    const run = s.submitJob(sanitizeJobConfig(raw, eligibleDatasets, eligibleCheckpoints), { force: true });
    if (!run) return result(false, 'Submission did not create a run; board unchanged.', snapshot());
    await paint();
    return result(true, `Submitted ${run.id}; the board and rollups updated.`, {
      ...snapshot(), runId: run.id, destination: 'pipeline-board',
    });
  },
  form_cancel: async () => {
    state().closeSubmission();
    await paint();
    return result(true, 'Submission panel closed.', snapshot());
  },

  session_pause: async ({ runId, phase } = {}) => {
    const p = state().runs.find((r) => r.id === runId)?.phases.find((x) => x.key === phase);
    if (!p || p.status !== 'Running') return result(false, 'Only a running phase can be paused.', snapshot());
    state().pausePhase(runId, phase);
    await paint();
    return result(true, 'Phase paused at its visible checkpoint.', { ...snapshot(), runId, phase, checkpoint: p.current });
  },
  session_resume: async ({ runId, phase } = {}) => {
    const p = state().runs.find((r) => r.id === runId)?.phases.find((x) => x.key === phase);
    if (!p || p.status !== 'Running' || !p.paused) return result(false, 'Only a paused running phase can be resumed.', snapshot());
    state().resumePhase(runId, phase);
    await paint();
    return result(true, 'Phase resumed from the same checkpoint.', { ...snapshot(), runId, phase, checkpoint: p.current });
  },
  session_restart: async ({ runId, phase } = {}) => {
    const p = state().runs.find((r) => r.id === runId)?.phases.find((x) => x.key === phase);
    if (!p || p.status !== 'Failed') return result(false, 'Manual retry is available only for a Failed phase.', snapshot());
    state().retryPhase(runId, phase);
    await paint();
    const next = state().runs.find((r) => r.id === runId)?.phases.find((x) => x.key === phase);
    return result(true, 'Failed phase restarted from its saved checkpoint.', {
      ...snapshot(), runId, phase, checkpoint: next?.current, status: next?.status,
    });
  },

  artifact_copy: async () => {
    const s = state();
    const raw = s.formDraft;
    const eligibleDatasets = getEligibleDatasets(s.runs);
    const eligibleCheckpoints = getEligibleCheckpoints(s.runs);
    const parsed = makeJobConfigSchema(eligibleDatasets, eligibleCheckpoints).safeParse(raw);
    if (!parsed.success) return result(false, 'The visible config is invalid and was not copied.', { ...snapshot(), valid: false });
    const exact = JSON.stringify(sanitizeJobConfig(raw, eligibleDatasets, eligibleCheckpoints), null, 2);
    try { await navigator.clipboard.writeText(exact); } catch { /* clipboard may be blocked in headless; UI still confirms */ }
    s.pushAlert('Exact job config copied to clipboard', 'green');
    await paint();
    return result(true, 'The visible job config was copied; inspect the clipboard through the browser.', { ...snapshot(), format: 'job-config' });
  },
};

const schemas = {
  browse_open: {
    type: 'object',
    additionalProperties: false,
    properties: {
      destination: { type: 'string', enum: ['pipeline-board', 'run-detail', 'datasets', 'results', 'trial-drill-down'] },
      runId: { type: 'string' },
      model: { type: 'string' },
      benchmark: { type: 'string', enum: BENCHMARKS },
    },
    required: ['destination'],
  },
  browse_search: {
    type: 'object', additionalProperties: false,
    properties: { query: { type: 'string' } }, required: ['query'],
  },
  browse_apply_filter: {
    type: 'object', additionalProperties: false,
    properties: {
      filter: { type: 'string', enum: ['dataset', 'phase', 'status', 'comparison-model'] },
      value: { type: 'string' },
      index: { type: 'integer', minimum: 0, maximum: 1 },
    },
    required: ['filter', 'value'],
  },
  browse_clear_filter: {
    type: 'object', additionalProperties: false,
    properties: { filter: { type: 'string', enum: ['dataset', 'phase', 'status', 'comparison-model'] } },
  },
  browse_sort: {
    type: 'object', additionalProperties: false,
    properties: {
      sort: { type: 'string', enum: ['mean-score', 'spread', 'cost', 'trial-count'] },
      direction: { type: 'string', enum: ['asc', 'desc'] },
    },
    required: ['sort'],
  },
  form_validate: {
    type: 'object', additionalProperties: false,
    properties: {
      'job-type': { type: 'string', enum: ['data-generation', 'fine-tune', 'evaluate'] },
      jobType: { type: 'string' },
      dataset: { type: 'string' },
      model: { type: 'string' },
      count: { type: ['integer', 'number', 'string'] },
      cluster: { type: 'string', enum: ['aurora', 'basalt', 'cinder'] },
      benchmark: { type: 'string' },
      repetitions: { type: ['integer', 'number', 'string'] },
      'auto-evaluate': { type: 'boolean' },
      autoEvaluate: { type: 'boolean' },
    },
  },
  form_submit: {
    type: 'object', additionalProperties: false,
    properties: {
      'job-type': { type: 'string', enum: ['data-generation', 'fine-tune', 'evaluate'] },
      jobType: { type: 'string' },
      dataset: { type: 'string' },
      model: { type: 'string' },
      count: { type: ['integer', 'number', 'string'] },
      cluster: { type: 'string', enum: ['aurora', 'basalt', 'cinder'] },
      benchmark: { type: 'string' },
      repetitions: { type: ['integer', 'number', 'string'] },
      'auto-evaluate': { type: 'boolean' },
      autoEvaluate: { type: 'boolean' },
    },
  },
  form_cancel: { type: 'object', additionalProperties: false, properties: {} },
  session_pause: {
    type: 'object', additionalProperties: false,
    properties: { runId: { type: 'string' }, phase: { type: 'string', enum: ['data', 'fineTune', 'evaluation'] } },
    required: ['runId', 'phase'],
  },
  session_resume: {
    type: 'object', additionalProperties: false,
    properties: { runId: { type: 'string' }, phase: { type: 'string', enum: ['data', 'fineTune', 'evaluation'] } },
    required: ['runId', 'phase'],
  },
  session_restart: {
    type: 'object', additionalProperties: false,
    properties: { runId: { type: 'string' }, phase: { type: 'string', enum: ['data', 'fineTune', 'evaluation'] } },
    required: ['runId', 'phase'],
  },
  artifact_copy: {
    type: 'object', additionalProperties: false,
    properties: { format: { type: 'string', enum: ['job-config'] } },
  },
};

function toolDescription(name) {
  return `${name.replaceAll('_', ' ')} for the Relay research pipeline. Uses the same bounded product handler and updates visible state when available.`;
}

export function registerWebMCP() {
  if (registered) return;
  registered = true;
  const tools = Object.fromEntries(
    Object.entries(handlers).map(([name, execute]) => [name, {
      name,
      description: toolDescription(name),
      inputSchema: schemas[name] ?? { type: 'object', additionalProperties: false, properties: {} },
      execute,
    }]),
  );
  window.webmcp_tools = tools;
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    contractVersion: 'zto-webmcp-v1',
    modules: MODULES,
    tool_names: Object.keys(tools),
    toolNames: Object.keys(tools),
    entity: 'runs',
    visibleState: snapshot(),
  });
  window.webmcp_list_tools = () => Object.values(tools).map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  window.webmcp_invoke_tool = async (name, args = {}) => {
    if (!tools[name]) throw new Error(`Unknown WebMCP tool: ${name}`);
    return tools[name].execute(args ?? {});
  };
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
  const context = navigator.modelContext;
  if (context?.registerTool) {
    Object.values(tools).forEach((tool) => {
      try {
        context.registerTool({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: tool.execute,
        });
      } catch { /* duplicate registration is harmless during HMR */ }
    });
  }
}
