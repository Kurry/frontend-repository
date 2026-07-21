import { create } from 'zustand';
import { seedDatasets, seedRuns, seedTrials } from './seed';
import { exportSchema, makeJobConfigSchema, sanitizeJobConfig } from './schemas';

const clone = (value) => JSON.parse(JSON.stringify(value));
const stamp = () => new Date().toISOString();
const phaseOrder = ['data', 'fineTune', 'evaluation'];
let sequence = 1050;
let lastSubmissionAt = 0;
let tickCounter = 0;

const event = (runId, phase, status, message) => ({
  id: `${runId}-e-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  phase, status, message, timestamp: stamp(),
});

export const getEligibleDatasets = (runs) => [...new Set(runs.filter((r) => r.phases[0].status === 'Complete').map((r) => r.phases[0].dataset))];
export const getEligibleCheckpoints = (runs) => [...new Set(runs.filter((r) => r.phases[1].status === 'Complete').map((r) => r.phases[1].model))];

function phaseTemplate(key, status, config, runId) {
  const title = key === 'data' ? 'Data generation' : key === 'fineTune' ? 'Fine-tuning' : 'Evaluation';
  const checkpoint = `${config.model}-ft-${runId.replace('run-', '')}`;
  const count = key === 'evaluation' ? (config.repetitions ?? 3) : config.count;
  return {
    key, title, status, dataset: config.dataset,
    model: key === 'evaluation' && config.jobType === 'Fine-tune' ? checkpoint : config.model,
    cluster: config.cluster, count, current: 0, paused: false, attempt: 1, maxAttempts: 3,
    retryRemaining: 0, autoRetry: false, startedAt: status === 'Running' ? stamp() : null,
    completedAt: null, output: null, loss: [], scores: [], cost: 0,
  };
}

function buildRun(config) {
  const id = `run-${sequence++}`;
  const statuses = config.jobType === 'Data generation'
    ? ['Running', 'Pending', 'Pending']
    : config.jobType === 'Fine-tune'
      ? ['Skipped', 'Running', 'Pending']
      : ['Skipped', 'Skipped', 'Running'];
  const phases = phaseOrder.map((key, i) => phaseTemplate(key, statuses[i], config, id));
  if (config.jobType === 'Fine-tune') phases[1].model = `${config.model}-ft-${id.replace('run-', '')}`;
  return {
    id,
    label: `${config.dataset} · ${config.jobType}`,
    createdAt: stamp(),
    config,
    phases,
    cost: 0,
    isNew: true,
    events: [event(id, config.jobType === 'Data generation' ? 'data' : config.jobType === 'Fine-tune' ? 'fineTune' : 'evaluation', 'Running', `${config.jobType} submitted to ${config.cluster}`)],
  };
}

function appendEvaluationTrials(trialData, run, phase) {
  const benchmark = run.config.benchmark ?? 'Switchboard';
  const model = phase.model;
  const existingIndex = trialData.findIndex((x) => x.model === model && x.benchmark === benchmark);
  const newTrials = phase.scores.map((score, index) => ({
    id: `${run.id}-${benchmark.slice(0, 2).toLowerCase()}-${String(index + 1).padStart(2, '0')}`,
    score,
    duration: 34 + ((index * 7 + run.id.length) % 31),
  }));
  if (existingIndex < 0) return [...trialData, { model, benchmark, trials: newTrials }];
  return trialData.map((x, i) => i === existingIndex ? { ...x, trials: [...x.trials, ...newTrials] } : x);
}

function runUsesDataset(run, datasetName) {
  if (!datasetName) return true;
  if (run.config?.dataset === datasetName) return true;
  return run.phases.some((p) => p.dataset === datasetName);
}

export const usePipelineStore = create((set, get) => ({
  runs: clone(seedRuns),
  datasets: clone(seedDatasets),
  trialData: clone(seedTrials),
  activeView: 'pipeline',
  selectedRunId: null,
  datasetFilter: null,
  timelinePhase: 'all',
  timelineStatus: 'all',
  highlightedPhase: null,
  submissionOpen: false,
  mobileNavOpen: false,
  density: 'comfortable',
  formDraft: { jobType: 'Fine-tune', dataset: '', model: '', count: 5, cluster: 'aurora', autoEvaluate: true },
  comparison: ['quill-2b-ft-1027', 'ember-ft-1031'],
  resultSort: { key: 'mean', dir: 'desc' },
  drilldown: null,
  alerts: [],
  importError: null,
  // Keep the selected run and its timeline filters while visiting catalog and
  // results views so returning to the board restores the same detail context.
  setView: (activeView) => set({ activeView, mobileNavOpen: false, drilldown: null }),
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  setDensity: (density) => set({ density }),
  openSubmission: () => set({ submissionOpen: true, selectedRunId: null, drilldown: null, importError: null }),
  closeSubmission: () => set({ submissionOpen: false }),
  setFormDraft: (formDraft) => set({ formDraft }),
  selectRun: (selectedRunId) => set({ selectedRunId, highlightedPhase: null, timelinePhase: 'all', timelineStatus: 'all', submissionOpen: false }),
  setDatasetFilter: (datasetFilter) => set({ datasetFilter, activeView: 'pipeline', mobileNavOpen: false, selectedRunId: null }),
  setTimelinePhase: (timelinePhase) => set({ timelinePhase }),
  setTimelineStatus: (timelineStatus) => set({ timelineStatus }),
  setHighlightedPhase: (highlightedPhase) => set({ highlightedPhase }),
  setComparison: (index, model) => set((s) => ({ comparison: s.comparison.map((x, i) => i === index ? model : x) })),
  setResultSort: (key, dir) => set({ resultSort: { key, dir } }),
  setDrilldown: (drilldown) => set({ drilldown, submissionOpen: false }),
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  pushAlert: (message, color = 'indigo') => set((s) => ({ alerts: [...s.alerts, { id: `${Date.now()}-${Math.random()}`, message, color }] })),
  clearImportError: () => set({ importError: null }),
  submitJob: (raw, opts = {}) => {
    const state = get();
    const submittedAt = Date.now();
    if (!opts.force && (state.submitting || submittedAt - lastSubmissionAt < 600)) return null;
    lastSubmissionAt = submittedAt;
    const config = sanitizeJobConfig(raw, getEligibleDatasets(state.runs), getEligibleCheckpoints(state.runs));
    const run = buildRun(config);
    set((s) => ({
      runs: [run, ...s.runs],
      submissionOpen: false,
      activeView: 'pipeline',
      datasetFilter: null,
      selectedRunId: null,
      submitting: false,
      alerts: [...s.alerts, { id: `submit-${run.id}`, message: `${run.id} submitted to ${config.cluster}`, color: 'indigo' }],
    }));
    return run;
  },
  pausePhase: (runId, phaseKey) => set((s) => ({
    runs: s.runs.map((run) => run.id !== runId ? run : {
      ...run,
      phases: run.phases.map((p) => p.key === phaseKey && p.status === 'Running' ? { ...p, paused: true } : p),
      events: [...run.events, event(runId, phaseKey, 'Running', 'Paused at saved checkpoint')],
    }),
    alerts: [...s.alerts, { id: `pause-${Date.now()}`, message: `${runId} paused at checkpoint`, color: 'gray' }],
  })),
  resumePhase: (runId, phaseKey) => set((s) => ({
    runs: s.runs.map((run) => run.id !== runId ? run : {
      ...run,
      phases: run.phases.map((p) => p.key === phaseKey && p.status === 'Running' ? { ...p, paused: false } : p),
      events: [...run.events, event(runId, phaseKey, 'Running', 'Resumed from saved checkpoint')],
    }),
    alerts: [...s.alerts, { id: `resume-${Date.now()}`, message: `${runId} resumed`, color: 'indigo' }],
  })),
  retryPhase: (runId, phaseKey) => set((s) => {
    let found = false;
    const runs = s.runs.map((run) => {
      if (run.id !== runId) return run;
      return {
        ...run,
        phases: run.phases.map((p) => {
          if (p.key !== phaseKey || p.status !== 'Failed') return p;
          found = true;
          return {
            ...p,
            status: 'Running',
            paused: false,
            startedAt: stamp(),
            retryRemaining: 0,
            autoRetry: false,
            attempt: Math.min(p.maxAttempts, (p.attempt || 1) + 1),
          };
        }),
        events: [...run.events, event(runId, phaseKey, 'Running', 'Manual retry resumed from checkpoint')],
      };
    });
    if (!found) return s;
    return {
      runs,
      alerts: [...s.alerts, { id: `retry-${Date.now()}`, message: `${runId} retrying from checkpoint`, color: 'indigo' }],
    };
  }),
  importJobConfig: (text) => {
    let parsed;
    try { parsed = JSON.parse(text); } catch {
      set({ importError: 'Import rejected: payload is not valid JSON. Fix the file and try again.' });
      return false;
    }
    // Accept either a single job-config or an export envelope.
    if (parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.runs)) {
      const restored = [];
      for (const item of parsed.runs) {
        const body = {
          jobType: item.jobType,
          dataset: item.dataset,
          model: item.model,
          count: item.count,
          cluster: item.cluster,
          benchmark: item.benchmark,
          repetitions: item.repetitions,
          autoEvaluate: item.autoEvaluate,
        };
        const eligibleDatasets = getEligibleDatasets(get().runs);
        const eligibleCheckpoints = getEligibleCheckpoints(get().runs);
        const check = makeJobConfigSchema(eligibleDatasets, eligibleCheckpoints).safeParse(body);
        if (!check.success) {
          set({ importError: `Import rejected: run ${item.runId ?? '(unknown)'} failed schema validation. Fix the payload and try again.` });
          return false;
        }
        restored.push(sanitizeJobConfig(body, eligibleDatasets, eligibleCheckpoints));
      }
      const runs = restored.map((config) => buildRun(config));
      set((s) => ({
        runs: [...runs, ...s.runs],
        importError: null,
        activeView: 'pipeline',
        datasetFilter: null,
        alerts: [...s.alerts, { id: `import-${Date.now()}`, message: `Imported ${runs.length} job config(s)`, color: 'green' }],
      }));
      return true;
    }
    const eligibleDatasets = getEligibleDatasets(get().runs);
    const eligibleCheckpoints = getEligibleCheckpoints(get().runs);
    const check = makeJobConfigSchema(eligibleDatasets, eligibleCheckpoints).safeParse(parsed);
    if (!check.success) {
      set({ importError: 'Import rejected: job-config does not match the required field contract. Fix required fields and try again.' });
      return false;
    }
    const config = sanitizeJobConfig(parsed, eligibleDatasets, eligibleCheckpoints);
    const run = buildRun(config);
    set((s) => ({
      runs: [run, ...s.runs],
      importError: null,
      activeView: 'pipeline',
      datasetFilter: null,
      alerts: [...s.alerts, { id: `import-${run.id}`, message: `Imported ${run.id} from job-config`, color: 'green' }],
    }));
    return true;
  },
  exportRuns: () => {
    const payload = {
      schemaVersion: 1,
      runs: get().runs.map((run) => ({
        runId: run.id,
        ...run.config,
        phaseStatuses: run.phases.map((p) => ({ phase: p.key, status: p.status })),
      })),
      generatedAt: new Date().toISOString(),
    };
    return exportSchema.parse(payload);
  },
  tick: () => set((state) => {
    tickCounter += 1;
    let trialData = state.trialData;
    const alerts = [...state.alerts];
    const runs = state.runs.map((run) => {
      let changed = false;
      let nextEvents = run.events;
      let nextCost = run.cost;
      let phases = run.phases.map((p) => {
        if (p.status === 'Failed' && p.retryRemaining > 0) {
          changed = true;
          const remaining = p.retryRemaining - 1;
          if (remaining === 0) nextEvents = [...nextEvents, event(run.id, p.key, 'Failed', 'Automatic retries exhausted; manual retry available')];
          return { ...p, retryRemaining: remaining, autoRetry: remaining > 0 };
        }
        if (p.status !== 'Running' || p.paused) return p;
        // Slow cadence so pause/resume and countdowns stay observable.
        if (p.key === 'fineTune' && tickCounter % 2 !== 0) return p;
        if (p.key === 'evaluation' && tickCounter % 2 !== 0) return p;
        changed = true;
        nextCost += p.key === 'data' ? .07 : p.key === 'fineTune' ? .22 : .11;
        if (p.key === 'data') {
          const target = p.count * 100;
          const current = Math.min(target, p.current + 8);
          if (current >= target) {
            nextEvents = [...nextEvents, event(run.id, p.key, 'Complete', `${current.toLocaleString()} tasks generated`)];
            alerts.push({ id: `done-${run.id}-${p.key}`, message: `${run.id} data generation completed`, color: 'green' });
            return { ...p, current, status: 'Complete', completedAt: stamp(), output: `dataset://${p.dataset.toLowerCase().replace(/\s/g, '-')}`, cost: p.cost + .07 };
          }
          return { ...p, current, cost: p.cost + .07 };
        }
        if (p.key === 'fineTune') {
          const current = Math.min(p.count, p.current + 1);
          const loss = [...p.loss, { epoch: current, loss: Number(Math.max(.18, 1.31 * Math.exp(-current * .28) + Math.random() * .08).toFixed(2)) }];
          if (current >= p.count) {
            nextEvents = [...nextEvents, event(run.id, p.key, 'Complete', `Checkpoint ${p.model} saved`)];
            alerts.push({ id: `done-${run.id}-${p.key}`, message: `${run.id} fine-tuning completed`, color: 'green' });
            return { ...p, current, loss, status: 'Complete', completedAt: stamp(), output: `checkpoint://${p.model}`, cost: p.cost + .22 };
          }
          return { ...p, current, loss, cost: p.cost + .22 };
        }
        const current = Math.min(p.count, p.current + 1);
        const score = Number((.68 + ((run.id.charCodeAt(run.id.length - 1) + current * 7) % 20) / 100).toFixed(2));
        const scores = [...p.scores, score];
        if (current >= p.count) {
          const completed = { ...p, current, scores, status: 'Complete', completedAt: stamp(), output: `report://${run.id}`, cost: p.cost + .11 };
          nextEvents = [...nextEvents, event(run.id, p.key, 'Complete', `Evaluation completed with mean ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3)}`)];
          trialData = appendEvaluationTrials(trialData, run, completed);
          alerts.push({ id: `done-${run.id}-${p.key}`, message: `${run.id} evaluation completed`, color: 'green' });
          return completed;
        }
        return { ...p, current, scores, cost: p.cost + .11 };
      });

      const fine = phases[1];
      const evalPhase = phases[2];
      if (run.config.autoEvaluate && fine.status === 'Complete' && evalPhase.status === 'Pending') {
        phases = phases.map((p) => p.key === 'evaluation' ? { ...p, status: 'Running', startedAt: stamp(), model: fine.model } : p);
        nextEvents = [...nextEvents, event(run.id, 'evaluation', 'Running', 'Automatic evaluation triggered after training completion')];
        alerts.push({ id: `auto-${run.id}`, message: `${run.id} automatic evaluation started`, color: 'indigo' });
        changed = true;
      }
      return changed ? { ...run, phases, events: nextEvents, cost: Number(nextCost.toFixed(2)), isNew: false } : run;
    });
    return { runs, trialData, alerts };
  }),
  filteredRuns: () => {
    const s = get();
    return s.datasetFilter ? s.runs.filter((r) => runUsesDataset(r, s.datasetFilter)) : s.runs;
  },
}));

export function buildExportText() {
  return JSON.stringify(usePipelineStore.getState().exportRuns(), null, 2);
}

export { runUsesDataset };
