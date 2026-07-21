import { create } from 'zustand';
import { suiteSchema, exportDocumentSchema } from './schemas';

export const MODELS = ['Granite 3.2 8B', 'GPT-4.1 mini', 'Claude 3.7 Sonnet'];
export const MODEL_COLORS = {
  'Granite 3.2 8B': '#5b5bd6',
  'GPT-4.1 mini': '#0f8c79',
  'Claude 3.7 Sonnet': '#d96d32',
};

export const PROMPTS = [
  { id: 'p-summary', title: 'Executive summary from support transcript', text: 'Summarize the following support transcript in five concise bullets. Preserve decisions, owners, and unresolved risks.' },
  { id: 'p-policy', title: 'Policy-grounded refund response', text: 'Respond to the customer using only the supplied refund policy. Cite the applicable clause and do not invent exceptions.' },
  { id: 'p-code', title: 'Diagnose a production TypeScript exception', text: 'Identify the likely root cause of this TypeScript stack trace, propose a minimal fix, and provide one regression test.' },
  { id: 'p-tone', title: 'Rewrite an escalation with calm, precise language', text: 'Rewrite this escalation for an executive audience. Keep the urgency, remove blame, and retain all quantitative facts.' },
  { id: 'p-extract', title: 'Extract structured contract obligations', text: 'Extract parties, effective dates, renewal terms, notice periods, and financial obligations as strict JSON.' },
  { id: 'p-research', title: 'Synthesize evidence with explicit uncertainty', text: 'Synthesize the supplied evidence. Separate observed facts, inferences, and unanswered questions.' },
  { id: 'p-sql', title: 'Generate safe analytics SQL from a product question', text: 'Write read-only PostgreSQL for the requested funnel analysis. Explain assumptions and guard against duplicate events.' },
  { id: 'p-long', title: 'Design a reliable incident response plan for a multi-region service with dependency failures', text: 'Create an incident response plan with detection, containment, recovery, communication, and follow-up phases.' },
];

const clone = (value) => structuredClone(value);
const round = (value) => Math.round(value * 10) / 10;
const seededNoise = (seed) => {
  const x = Math.sin(seed * 917.13) * 10000;
  return x - Math.floor(x);
};

function makeResults(promptIds, seed = 1, base = 63) {
  return promptIds.flatMap((promptId, promptIndex) => {
    const prompt = PROMPTS.find((item) => item.id === promptId);
    return MODELS.map((model, modelIndex) => {
      const score = Math.max(8, Math.min(98, Math.round(base + modelIndex * 8 + seededNoise(seed + promptIndex * 7 + modelIndex) * 24)));
      const latencyMs = Math.round(580 + modelIndex * 290 + seededNoise(seed * 2 + promptIndex * 5 + modelIndex) * 1350);
      const tokens = Math.round(240 + seededNoise(seed * 3 + promptIndex * 9 + modelIndex) * 720);
      return {
        rowId: `${seed}-${promptId}-${modelIndex}`,
        promptTitle: prompt.title,
        model,
        score,
        latencyMs,
        tokens,
        passFail: score >= 70 ? 'pass' : 'fail',
        promptText: prompt.text,
        response: `${model} produced a grounded response for “${prompt.title}”. The answer follows the requested format, calls out assumptions, and includes concrete next actions.`,
        scoringBreakdown: [
          { dimension: 'Accuracy', score: Math.max(0, Math.min(100, score + 4)) },
          { dimension: 'Groundedness', score: Math.max(0, Math.min(100, score - 3)) },
          { dimension: 'Clarity', score },
        ],
      };
    });
  });
}

function summarizeRun(results) {
  const averageScore = results.length ? round(results.reduce((sum, row) => sum + row.score, 0) / results.length) : 0;
  return {
    averageScore,
    passCount: results.filter((row) => row.passFail === 'pass').length,
    failCount: results.filter((row) => row.passFail === 'fail').length,
    totalLatencyMs: results.reduce((sum, row) => sum + row.latencyMs, 0),
    totalTokens: results.reduce((sum, row) => sum + row.tokens, 0),
  };
}

function makeHistory(promptIds, suiteIndex, base) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 6, 12 + index, 20 + suiteIndex, 15));
    const results = makeResults(promptIds, suiteIndex * 100 + index + 1, base);
    return {
      id: `seed-run-${suiteIndex}-${index}`,
      startedAt: date.toISOString(),
      finishedAt: new Date(date.getTime() + 84000 + index * 3500).toISOString(),
      results,
      ...summarizeRun(results),
    };
  });
}

// Base scores place the three seeded suites in distinct average bands so the
// green (80-100), yellow (60-79), and red (<60) badge treatments are all
// visible on first load: customer care ~ high, engineering ~ mid, grounding ~ low.
const seedDefinitions = [
  { id: 'suite-customer', name: 'Customer care quality', base: 66, promptIds: ['p-summary', 'p-policy', 'p-tone', 'p-extract', 'p-research'] },
  { id: 'suite-engineering', name: 'Engineering copilot', base: 51, promptIds: ['p-code', 'p-sql', 'p-summary', 'p-research', 'p-long', 'p-extract'] },
  { id: 'suite-grounding', name: 'Grounded generation', base: 34, promptIds: ['p-policy', 'p-extract', 'p-research', 'p-summary', 'p-tone', 'p-long', 'p-sql'] },
];

const seededSuites = seedDefinitions.map((suite, index) => {
  const runs = makeHistory(suite.promptIds, index + 1, suite.base);
  const latest = runs.at(-1);
  return { id: suite.id, name: suite.name, promptIds: suite.promptIds, nightMode: false, runs, runCount: 7, baseRunCount: 7, lastRunAt: latest.finishedAt, averageScore: latest.averageScore };
});

const initialState = {
  suites: clone(seededSuites),
  selectedSuiteId: seededSuites[0].id,
  selectedResultId: null,
  mainView: 'results',
  sort: { key: 'promptTitle', direction: 'asc' },
  disclosureOpen: {},
  nightWindow: null,
  history: [],
  future: [],
  suiteModal: { open: false, mode: 'create', suiteId: null },
  deleteModal: { open: false, suiteId: null },
  nightModalOpen: false,
  exportOpen: false,
  exportTab: 'json',
  copied: false,
  importOpen: false,
  sidebarOpen: false,
  timelineFilter: 'all',
  activeRun: null,
  toasts: [],
  ariaMessage: '',
  modelFilter: null,
  prefsOpen: false,
  prefs: { density: 'comfortable', accent: 'indigo', defaultSort: 'promptTitle' },
  dialogOpener: null,
};

const rememberOpener = () => (typeof document !== 'undefined' ? document.activeElement : null);

function mutation(set, get, updater) {
  const previous = clone(get().suites);
  const next = updater(clone(previous));
  set({ suites: next, history: [...get().history, previous].slice(-30), future: [] });
}

export const useEvalStore = create((set, get) => ({
  ...initialState,
  selectSuite: (id) => set((state) => ({ selectedSuiteId: id, selectedResultId: null, sidebarOpen: false, modelFilter: null, sort: { key: state.prefs.defaultSort, direction: 'asc' } })),
  setMainView: (view) => set({ mainView: view }),
  setSort: (key) => set((state) => ({ sort: { key, direction: state.sort.key === key && state.sort.direction === 'asc' ? 'desc' : 'asc' } })),
  selectResult: (rowId) => set({ selectedResultId: rowId }),
  setModelFilter: (model) => set((state) => ({ modelFilter: state.modelFilter === model ? null : model })),
  setPrefsOpen: (prefsOpen) => set({ prefsOpen }),
  setPrefs: (patch) => set((state) => ({
    prefs: { ...state.prefs, ...patch },
    sort: patch.defaultSort && patch.defaultSort !== state.prefs.defaultSort ? { key: patch.defaultSort, direction: 'asc' } : state.sort,
  })),
  closeDetail: () => set({ selectedResultId: null }),
  toggleDisclosure: (rowId) => set((state) => ({ disclosureOpen: { ...state.disclosureOpen, [rowId]: !state.disclosureOpen[rowId] } })),
  openSuiteModal: (mode = 'create', suiteId = null) => set({ suiteModal: { open: true, mode, suiteId }, dialogOpener: rememberOpener() }),
  closeSuiteModal: () => set({ suiteModal: { open: false, mode: 'create', suiteId: null } }),
  createSuite: (payload) => {
    const data = suiteSchema.parse(payload);
    const id = `suite-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    mutation(set, get, (suites) => [...suites, { id, ...data, nightMode: false, runs: [], runCount: 0, baseRunCount: 0, lastRunAt: null, averageScore: null }]);
    set({ selectedSuiteId: id, suiteModal: { open: false, mode: 'create', suiteId: null } });
    get().pushToast('Suite created', `${data.name} is ready to run.`);
    return id;
  },
  updateSuite: (id, payload) => {
    const data = suiteSchema.parse(payload);
    mutation(set, get, (suites) => suites.map((suite) => suite.id === id ? { ...suite, ...data } : suite));
    set({ suiteModal: { open: false, mode: 'create', suiteId: null } });
    get().pushToast('Suite updated', `${data.name} was saved.`);
  },
  requestDelete: (id) => set({ deleteModal: { open: true, suiteId: id }, dialogOpener: rememberOpener() }),
  closeDelete: () => set({ deleteModal: { open: false, suiteId: null } }),
  deleteSuite: (id) => {
    const deleted = get().suites.find((suite) => suite.id === id);
    mutation(set, get, (suites) => suites.filter((suite) => suite.id !== id));
    const remaining = get().suites;
    set({ selectedSuiteId: get().selectedSuiteId === id ? null : get().selectedSuiteId, selectedResultId: null, deleteModal: { open: false, suiteId: null } });
    get().pushToast('Suite deleted', `${deleted?.name || 'Suite'} was removed.`);
    return remaining;
  },
  undo: () => {
    const { history, suites, selectedSuiteId } = get();
    if (!history.length) return;
    const previous = history.at(-1);
    set({ suites: clone(previous), history: history.slice(0, -1), future: [clone(suites), ...get().future].slice(0, 30), selectedSuiteId: previous.some((suite) => suite.id === selectedSuiteId) ? selectedSuiteId : (previous[0]?.id || null), selectedResultId: null });
  },
  redo: () => {
    const { future, suites, selectedSuiteId } = get();
    if (!future.length) return;
    const next = future[0];
    set({ suites: clone(next), future: future.slice(1), history: [...get().history, clone(suites)].slice(-30), selectedSuiteId: next.some((suite) => suite.id === selectedSuiteId) ? selectedSuiteId : (next.at(-1)?.id || null), selectedResultId: null });
  },
  openNightModal: () => set({ nightModalOpen: true, dialogOpener: rememberOpener() }),
  closeNightModal: () => set({ nightModalOpen: false }),
  saveNightWindow: (payload) => set({ nightWindow: payload, nightModalOpen: false }),
  toggleNightMode: (id) => set((state) => ({ suites: state.suites.map((suite) => suite.id === id ? { ...suite, nightMode: !suite.nightMode } : suite) })),
  openExport: (tab = 'json') => set({ exportOpen: true, exportTab: tab, copied: false, dialogOpener: rememberOpener() }),
  closeExport: () => set({ exportOpen: false, copied: false }),
  setExportTab: (tab) => set({ exportTab: tab, copied: false }),
  setCopied: (copied) => set({ copied }),
  openImport: () => set({ importOpen: true, dialogOpener: rememberOpener() }),
  closeImport: () => set({ importOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTimelineFilter: (filter) => set({ timelineFilter: filter }),
  pushToast: (title, subtitle) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, title, subtitle }] }));
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 4300);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  beginRun: (run) => set({ activeRun: run, selectedResultId: null, timelineFilter: 'all' }),
  patchRun: (patch) => set((state) => state.activeRun ? { activeRun: { ...state.activeRun, ...patch } } : {}),
  patchStep: (index, patch) => set((state) => state.activeRun ? ({ activeRun: { ...state.activeRun, steps: state.activeRun.steps.map((step, i) => i === index ? { ...step, ...patch } : step) } }) : {}),
  appendLog: (line) => set((state) => state.activeRun ? ({ activeRun: { ...state.activeRun, logs: [...state.activeRun.logs, { id: `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), ...line }] } }) : {}),
  appendEvent: (event) => set((state) => state.activeRun ? ({ activeRun: { ...state.activeRun, events: [...state.activeRun.events, { id: `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), ...event }] } }) : {}),
  appendResults: (results) => set((state) => state.activeRun ? ({ activeRun: { ...state.activeRun, producedResults: [...state.activeRun.producedResults, ...results] } }) : {}),
  setAriaMessage: (ariaMessage) => set({ ariaMessage }),
  completeRun: (run) => {
    set((state) => ({
      suites: state.suites.map((suite) => suite.id === state.activeRun?.suiteId ? { ...suite, runs: [...suite.runs, run].slice(-7), runCount: (suite.runCount || suite.runs.length) + 1, lastRunAt: run.finishedAt, averageScore: run.averageScore } : suite),
      activeRun: state.activeRun ? { ...state.activeRun, status: 'complete', finishedAt: run.finishedAt } : null,
      ariaMessage: `Evaluation complete. ${run.results.length} results with average score ${run.averageScore}.`,
    }));
    get().pushToast('Evaluation complete', `${run.results.length} model responses scored ${run.averageScore} on average.`);
  },
  importResults: (document) => {
    const parsed = exportDocumentSchema.parse(document);
    const selectedId = get().selectedSuiteId;
    if (!selectedId) throw new Error('Import requires a selected suite');
    const importedResults = parsed.results.map((row, index) => ({ ...row, rowId: `import-${parsed.run.id}-${index}` }));
    const run = { ...parsed.run, results: importedResults };
    set((state) => ({ suites: state.suites.map((suite) => {
      if (suite.id !== selectedId) return suite;
      const runs = suite.runs.length ? [...suite.runs.slice(0, -1), run] : [run];
      return { ...suite, runs: runs.slice(-7), lastRunAt: run.finishedAt, averageScore: run.averageScore };
    }), selectedResultId: null, importOpen: false }));
    get().pushToast('Results imported', `${importedResults.length} result records replaced the latest run.`);
  },
}));

export function getSelectedSuite(state = useEvalStore.getState()) {
  return state.suites.find((suite) => suite.id === state.selectedSuiteId) || null;
}

export function getLatestRun(suite) {
  return suite?.runs?.at(-1) || null;
}

export function compileExportDocument(state = useEvalStore.getState()) {
  const suite = getSelectedSuite(state);
  if (!suite) return null;
  const latest = getLatestRun(suite);
  const emptyDate = '1970-01-01T00:00:00.000Z';
  const run = latest ? {
    id: latest.id,
    startedAt: latest.startedAt,
    finishedAt: latest.finishedAt,
    averageScore: latest.averageScore,
    passCount: latest.passCount,
    failCount: latest.failCount,
    totalLatencyMs: latest.totalLatencyMs,
    totalTokens: latest.totalTokens,
  } : { id: 'not-run', startedAt: emptyDate, finishedAt: emptyDate, averageScore: 0, passCount: 0, failCount: 0, totalLatencyMs: 0, totalTokens: 0 };
  const results = latest ? latest.results.map(({ rowId, ...row }) => row) : [];
  return { version: 1, suite: { name: suite.name, promptCount: suite.promptIds.length, nightMode: suite.nightMode }, run, results };
}

const csvCell = (value) => {
  const stringValue = String(value ?? '');
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
};

export function compileCsv(state = useEvalStore.getState()) {
  const document = compileExportDocument(state);
  const header = 'promptTitle,model,score,latencyMs,tokens,passFail';
  if (!document) return header;
  return [header, ...document.results.map((row) => [row.promptTitle, row.model, row.score, row.latencyMs, row.tokens, row.passFail].map(csvCell).join(','))].join('\n');
}

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
let runnerToken = null;
let elapsedTimer = null;

async function waitWhilePaused(token) {
  while (useEvalStore.getState().activeRun?.paused && runnerToken === token) await sleep(100);
  return runnerToken === token;
}

async function pacedWait(ms, token) {
  let remaining = ms;
  while (remaining > 0 && runnerToken === token) {
    if (!(await waitWhilePaused(token))) return false;
    await sleep(Math.min(100, remaining));
    if (!useEvalStore.getState().activeRun?.paused) remaining -= 100;
  }
  return runnerToken === token;
}

function randomResultsForPrompt(promptId, seed) {
  const prompt = PROMPTS.find((item) => item.id === promptId);
  return MODELS.map((model, modelIndex) => {
    const score = Math.max(45, Math.min(99, Math.round(58 + modelIndex * 8 + Math.random() * 30)));
    const latencyMs = Math.round(620 + modelIndex * 320 + Math.random() * 1500);
    const tokens = Math.round(260 + Math.random() * 800);
    return {
      rowId: `${seed}-${promptId}-${modelIndex}`,
      promptTitle: prompt.title,
      model,
      score,
      latencyMs,
      tokens,
      passFail: score >= 70 ? 'pass' : 'fail',
      promptText: prompt.text,
      response: `${model} completed the evaluation request with a structured, evidence-aware answer. It preserved the required constraints and identified key assumptions for reviewer inspection.`,
      scoringBreakdown: [
        { dimension: 'Accuracy', score: Math.min(100, score + 5) },
        { dimension: 'Groundedness', score: Math.max(0, score - 4) },
        { dimension: 'Clarity', score: Math.min(100, score + 1) },
      ],
    };
  });
}

async function executeStep(index, token, forceRecovery = false) {
  const store = useEvalStore.getState();
  const run = store.activeRun;
  if (!run || runnerToken !== token || index >= run.steps.length) {
    if (run && index >= run.steps.length) finishRun(token);
    return;
  }
  if (!(await waitWhilePaused(token))) return;
  const current = useEvalStore.getState().activeRun.steps[index];
  const attempt = forceRecovery ? 1 : current.attempts + 1;
  const startedAt = current.startedAt || new Date().toISOString();
  store.patchRun({ status: 'running', currentStep: index });
  store.patchStep(index, { status: 'running', attempts: attempt, startedAt, error: null, retryIn: null });
  store.appendEvent({ stepIndex: index, status: 'running', label: `${current.title} started (attempt ${attempt})` });
  const logLines = [
    `Preparing rubric and request context for ${current.title}`,
    `Dispatching candidates to ${MODELS.length} models`,
    'Responses received; normalizing token and latency telemetry',
    'Applying groundedness, accuracy, and clarity rubric',
  ];
  for (const [lineIndex, message] of logLines.entries()) {
    if (!(await pacedWait(260 + lineIndex * 35, token))) return;
    useEvalStore.getState().appendLog({ stepIndex: index, status: lineIndex === logLines.length - 1 ? 'complete' : 'running', message });
  }
  const active = useEvalStore.getState().activeRun;
  // Every run shows one transient gateway hiccup on step 2 that recovers on
  // retry. From the second run of a suite within this session onward, the
  // final step exhausts its retries so operators can exercise the failed
  // state and the manual Retry control; the first run of any suite always
  // completes cleanly end to end.
  const sessionRunIndex = active.runOrdinal - (active.baseOrdinal ?? 0);
  const shouldExhaust = sessionRunIndex >= 2 && index === active.steps.length - 1 && !forceRecovery;
  const shouldRetryOnce = index === 1 && attempt === 1 && !forceRecovery;
  if (shouldRetryOnce || shouldExhaust) {
    useEvalStore.getState().appendLog({ stepIndex: index, status: 'waiting', message: `Model gateway returned a transient 503 on attempt ${attempt}` });
    if (attempt < 3) {
      useEvalStore.getState().patchStep(index, { status: 'retrying', retryIn: 3 });
      useEvalStore.getState().appendEvent({ stepIndex: index, status: 'retrying', label: `${current.title} waiting before retry ${attempt + 1} of 3` });
      for (let countdown = 3; countdown > 0; countdown -= 1) {
        useEvalStore.getState().patchStep(index, { retryIn: countdown });
        if (!(await pacedWait(1000, token))) return;
      }
      return executeStep(index, token, false);
    }
    useEvalStore.getState().patchStep(index, { status: 'failed', retryIn: null, error: 'Model gateway remained unavailable after 3 attempts.' });
    useEvalStore.getState().patchRun({ status: 'failed' });
    window.clearInterval(elapsedTimer);
    useEvalStore.getState().appendEvent({ stepIndex: index, status: 'failed', label: `${current.title} failed after 3 attempts` });
    useEvalStore.getState().setAriaMessage(`Evaluation step failed: ${current.title}. Manual retry is available.`);
    return;
  }
  const results = randomResultsForPrompt(current.promptId, run.id);
  const finishedAt = new Date().toISOString();
  useEvalStore.getState().appendResults(results);
  useEvalStore.getState().patchStep(index, { status: 'complete', finishedAt, outputs: results, retryIn: null });
  useEvalStore.getState().appendEvent({ stepIndex: index, status: 'complete', label: `${current.title} completed` });
  if (!(await pacedWait(180, token))) return;
  return executeStep(index + 1, token, false);
}

function finishRun(token) {
  if (runnerToken !== token) return;
  const active = useEvalStore.getState().activeRun;
  if (!active || active.status === 'complete') return;
  const results = active.producedResults;
  const finishedAt = new Date().toISOString();
  const run = { id: active.id, startedAt: active.startedAt, finishedAt, results, ...summarizeRun(results) };
  useEvalStore.getState().appendEvent({ stepIndex: null, status: 'complete', label: 'Suite run completed' });
  useEvalStore.getState().completeRun(run);
  window.clearInterval(elapsedTimer);
}

export function startRunCommand(suiteId = useEvalStore.getState().selectedSuiteId) {
  const state = useEvalStore.getState();
  const suite = state.suites.find((item) => item.id === suiteId);
  if (!suite || (state.activeRun && ['running', 'retrying'].includes(state.activeRun.status))) return false;
  runnerToken = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = new Date().toISOString();
  const steps = suite.promptIds.map((promptId, index) => {
    const prompt = PROMPTS.find((item) => item.id === promptId);
    return { id: `${runnerToken}-step-${index}`, promptId, title: prompt.title, status: 'pending', attempts: 0, startedAt: null, finishedAt: null, outputs: [], error: null, retryIn: null };
  });
  const baseOrdinal = suite.baseRunCount ?? (suite.runCount || suite.runs.length);
  state.beginRun({ id: runnerToken, suiteId, status: 'running', paused: false, currentStep: 0, startedAt, finishedAt: null, elapsedMs: 0, steps, logs: [], events: [{ id: `${Date.now()}`, at: startedAt, stepIndex: null, status: 'pending', label: 'Suite run queued' }], producedResults: [], runOrdinal: (suite.runCount || suite.runs.length) + 1, baseOrdinal });
  window.clearInterval(elapsedTimer);
  elapsedTimer = window.setInterval(() => {
    const current = useEvalStore.getState().activeRun;
    if (current && !current.paused && !['complete', 'failed'].includes(current.status)) useEvalStore.getState().patchRun({ elapsedMs: current.elapsedMs + 250 });
  }, 250);
  executeStep(0, runnerToken);
  return true;
}

export function pauseRunCommand() {
  const run = useEvalStore.getState().activeRun;
  if (!run || run.paused || ['complete', 'failed'].includes(run.status)) return false;
  useEvalStore.getState().patchRun({ paused: true });
  useEvalStore.getState().appendEvent({ stepIndex: run.currentStep, status: 'paused', label: 'Run paused by operator' });
  return true;
}

export function resumeRunCommand() {
  const run = useEvalStore.getState().activeRun;
  if (!run || !run.paused) return false;
  useEvalStore.getState().patchRun({ paused: false });
  useEvalStore.getState().appendEvent({ stepIndex: run.currentStep, status: 'running', label: 'Run resumed from checkpoint' });
  return true;
}

export function retryStepCommand(index) {
  const run = useEvalStore.getState().activeRun;
  if (!run || run.steps[index]?.status !== 'failed') return false;
  runnerToken = run.id;
  window.clearInterval(elapsedTimer);
  useEvalStore.getState().patchStep(index, { attempts: 0, status: 'pending', error: null });
  useEvalStore.getState().patchRun({ status: 'running', paused: false });
  elapsedTimer = window.setInterval(() => {
    const current = useEvalStore.getState().activeRun;
    if (current && !current.paused && current.status === 'running') useEvalStore.getState().patchRun({ elapsedMs: current.elapsedMs + 250 });
  }, 250);
  executeStep(index, runnerToken, true);
  return true;
}

export function restartRunCommand() {
  const suiteId = useEvalStore.getState().activeRun?.suiteId || useEvalStore.getState().selectedSuiteId;
  runnerToken = null;
  window.clearInterval(elapsedTimer);
  useEvalStore.getState().patchRun({ status: 'stopped' });
  return startRunCommand(suiteId);
}
