import { create } from 'zustand';
import { seedDatasets, seedRuns, seedTrials } from './seed';
import { exportSchema, sanitizeJobConfig } from './schemas';

const clone = (value) => JSON.parse(JSON.stringify(value));
const stamp = () => new Date().toISOString();
const phaseOrder = ['data', 'fineTune', 'evaluation'];
let sequence = 1050;
let lastSubmissionAt = 0;

const event = (runId, phase, status, message) => ({
  id: `${runId}-e-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  phase, status, message, timestamp: stamp(),
});

export const getEligibleDatasets = (runs) => [...new Set(runs.filter((r) => r.phases[0].status === 'Complete').map((r) => r.phases[0].dataset))];
export const getEligibleCheckpoints = (runs) => [...new Set(runs.filter((r) => r.phases[1].status === 'Complete').map((r) => r.phases[1].model))];

function phaseTemplate(key, status, config, runId) {
  const title = key === 'data' ? 'Data generation' : key === 'fineTune' ? 'Fine-tuning' : 'Evaluation';
  const checkpoint = `${config.model}-ft-${runId.replace('run-', '')}`;
  const count = key === 'evaluation' ? (config.repetitions ?? 3) : key === 'fineTune' ? config.count : config.count;
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
  formDraft: { jobType: 'Fine-tune', dataset: '', model: '', count: 5, cluster: 'aurora', autoEvaluate: true },
  comparison: ['quill-2b-ft-1027', 'ember-ft-1031'],
  resultSort: { key: 'mean', dir: 'desc' },
  drilldown: null,
  alerts: [],
  setView: (activeView) => set({ activeView, mobileNavOpen: false, selectedRunId: null }),
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  openSubmission: () => set({ submissionOpen: true }),
  closeSubmission: () => set({ submissionOpen: false }),
  setFormDraft: (formDraft) => set({ formDraft }),
  selectRun: (selectedRunId) => set({ selectedRunId, highlightedPhase: null, timelinePhase: 'all', timelineStatus: 'all' }),
  setDatasetFilter: (datasetFilter) => set({ datasetFilter, activeView: 'pipeline', mobileNavOpen: false }),
  setTimelinePhase: (timelinePhase) => set({ timelinePhase }),
  setTimelineStatus: (timelineStatus) => set({ timelineStatus }),
  setHighlightedPhase: (highlightedPhase) => set({ highlightedPhase }),
  setComparison: (index, model) => set((s) => ({ comparison: s.comparison.map((x, i) => i === index ? model : x) })),
  setResultSort: (key, dir) => set({ resultSort: { key, dir } }),
  setDrilldown: (drilldown) => set({ drilldown }),
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  pushAlert: (message, color = 'indigo') => set((s) => ({ alerts: [...s.alerts, { id: `${Date.now()}-${Math.random()}`, message, color }] })),
  submitJob: (raw) => {
    const state = get();
    const submittedAt = Date.now();
    if (state.submitting || submittedAt - lastSubmissionAt < 750) return null;
    lastSubmissionAt = submittedAt;
    const config = sanitizeJobConfig(raw, getEligibleDatasets(state.runs), getEligibleCheckpoints(state.runs));
    const run = buildRun(config);
    set((s) => ({ runs: [run, ...s.runs], submissionOpen: false, activeView: 'pipeline', submitting: false, alerts: [...s.alerts, { id: `submit-${run.id}`, message: `${run.id} submitted to ${config.cluster}`, color: 'indigo' }] }));
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
  retryPhase: (runId, phaseKey) => set((s) => ({
    runs: s.runs.map((run) => run.id !== runId ? run : {
      ...run,
      phases: run.phases.map((p) => p.key === phaseKey && p.status === 'Failed' ? { ...p, status: 'Running', paused: false, startedAt: stamp(), retryRemaining: 0, autoRetry: false } : p),
      events: [...run.events, event(runId, phaseKey, 'Running', 'Manual retry resumed from checkpoint')],
    }),
    alerts: [...s.alerts, { id: `retry-${Date.now()}`, message: `${runId} retrying from checkpoint`, color: 'indigo' }],
  })),
  exportRuns: () => {
    const payload = {
      schemaVersion: 1,
      runs: get().runs.map((run) => ({
        runId: run.id,
        ...run.config,
        phaseStatuses: run.phases.map((p) => ({ phase: p.key, status: p.status })),
      })),
      generatedAt: stamp(),
    };
    return exportSchema.parse(payload);
  },
  tick: () => set((state) => {
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
        changed = true;
        nextCost += p.key === 'data' ? .07 : p.key === 'fineTune' ? .22 : .11;
        if (p.key === 'data') {
          const target = p.count * 100;
          const current = Math.min(target, p.current + 23);
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
          nextEvents = [...nextEvents, event(run.id, p.key, 'Complete', `Evaluation completed with mean ${(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3)}`)];
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
}));

export function buildExportText() {
  return JSON.stringify(usePipelineStore.getState().exportRuns(), null, 2);
}
