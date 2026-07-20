import { create } from "zustand";
import {
  tasks,
  getTask,
  getTrial,
  computeRollup,
  flippedCriterionIds,
  dimensions,
} from "./seed";

const defaultTrialState = () =>
  Object.fromEntries(
    tasks.flatMap((task) =>
      task.trials.map((trial) => [
        trial.id,
        {
          activeLabel: trial.labelNames[0],
          comparedLabels: [trial.labelNames[0], trial.labelNames[1]],
          agentStep: 0,
          scorerStep: 0,
          focusedPane: "agent",
          flipsOnly: false,
          selectedFlips: [],
          selectedCriterion: null,
          adjudications: [],
          undo: [],
          redo: [],
        },
      ]),
    ),
  );

const cloneRecords = (records) =>
  records.map((record) => ({
    ...record,
    evidenceStepIds: record.evidenceStepIds
      ? [...record.evidenceStepIds]
      : undefined,
  }));

function findTrialAcrossTasks(trialId) {
  for (const task of tasks) {
    const trial = task.trials.find((item) => item.id === trialId);
    if (trial) return { task, trial };
  }
  return null;
}

function pushActivity(set, get, entry) {
  const next = [
    { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), ...entry },
    ...get().activityFeed,
  ].slice(0, 12);
  set({ activityFeed: next });
}

export const useReviewStore = create((set, get) => ({
  tasks,
  view: "tasks",
  activeTaskId: tasks[0].id,
  activeTrialId: null,
  trialState: defaultTrialState(),
  overlays: { export: false, import: false, palette: false, print: false, cheatsheet: false },
  exportTab: "json",
  importDraft: "",
  importErrors: [],
  announcement: "",
  disclosure: {},
  terminalComplete: {},
  fileSelection: {},
  activityFeed: [],
  density: "dense",
  coachmarksOpen: true,
  coachmarksStep: 0,

  selectTask: (taskId) =>
    set({
      activeTaskId: taskId,
      activeTrialId: null,
      view: "task",
      announcement: `Opened ${getTask(taskId).title}`,
    }),
  backToTasks: () => set({ view: "tasks", activeTrialId: null }),
  openTrial: (trialId, taskId) => {
    const found = findTrialAcrossTasks(trialId);
    if (!found) return false;
    const resolvedTaskId = taskId || found.task.id;
    set((state) => ({
      view: "review",
      activeTaskId: resolvedTaskId,
      activeTrialId: trialId,
      overlays: { ...state.overlays, palette: false },
      announcement: `Opened trial ${trialId}`,
    }));
    return true;
  },
  backToTask: () => set({ view: "task", activeTrialId: null }),
  setDensity: (density) => set({ density }),
  dismissCoachmarks: () => set({ coachmarksOpen: false, coachmarksStep: 0 }),
  setCoachmarksStep: (coachmarksStep) => set({ coachmarksStep }),
  openCheatsheet: () =>
    set((state) => ({ overlays: { ...state.overlays, cheatsheet: true } })),
  closeCheatsheet: () =>
    set((state) => ({ overlays: { ...state.overlays, cheatsheet: false } })),
  openPrintMemo: () =>
    set((state) => ({ overlays: { ...state.overlays, print: true } })),
  closePrintMemo: () =>
    set((state) => ({ overlays: { ...state.overlays, print: false } })),
  patchTrial: (trialId, patch) =>
    set((state) => ({
      trialState: {
        ...state.trialState,
        [trialId]: { ...state.trialState[trialId], ...patch },
      },
    })),
  setActiveLabel: (label) => {
    const { activeTrialId } = get();
    if (activeTrialId) get().patchTrial(activeTrialId, { activeLabel: label });
  },
  setComparedLabel: (index, label) => {
    const { activeTrialId, trialState } = get();
    if (!activeTrialId) return;
    const pair = [...trialState[activeTrialId].comparedLabels];
    pair[index] = label;
    if (pair[0] === pair[1]) {
      const trial = getTrial(get().activeTaskId, activeTrialId);
      pair[1 - index] =
        trial.labelNames.find((name) => name !== label) || pair[1 - index];
    }
    get().patchTrial(activeTrialId, {
      comparedLabels: pair,
      selectedFlips: [],
    });
  },
  toggleFlips: () => {
    const { activeTrialId, trialState } = get();
    if (activeTrialId)
      get().patchTrial(activeTrialId, {
        flipsOnly: !trialState[activeTrialId].flipsOnly,
        selectedFlips: [],
      });
  },
  clearFlips: () => {
    const { activeTrialId } = get();
    if (activeTrialId)
      get().patchTrial(activeTrialId, { flipsOnly: false, selectedFlips: [] });
  },
  selectFlip: (criterionId) => {
    const { activeTrialId, trialState } = get();
    if (!activeTrialId) return;
    const selected = trialState[activeTrialId].selectedFlips;
    get().patchTrial(activeTrialId, {
      selectedFlips: selected.includes(criterionId)
        ? selected.filter((id) => id !== criterionId)
        : [...selected, criterionId],
    });
  },
  clearFlipSelection: () => {
    const { activeTrialId } = get();
    if (activeTrialId) get().patchTrial(activeTrialId, { selectedFlips: [] });
  },
  selectCriterion: (criterionId, { toggle = true } = {}) => {
    const state = get();
    const found =
      (state.activeTrialId &&
        getTrial(state.activeTaskId, state.activeTrialId) && {
          trial: getTrial(state.activeTaskId, state.activeTrialId),
        }) ||
      findTrialAcrossTasks(state.activeTrialId);
    const trial = found?.trial;
    if (!trial) return false;
    const current = state.trialState[trial.id];
    if (toggle && current.selectedCriterion === criterionId) {
      get().patchTrial(trial.id, { selectedCriterion: null });
      return true;
    }
    const verdict = trial.results[current.activeLabel].verdicts[criterionId];
    if (!verdict) return false;
    get().patchTrial(trial.id, {
      selectedCriterion: criterionId,
      agentStep: verdict.agentStep,
      scorerStep: verdict.scorerStep,
    });
    return true;
  },
  jumpEvidence: (criterionId) => {
    const state = get();
    const found =
      findTrialAcrossTasks(state.activeTrialId) ||
      (state.activeTrialId
        ? {
            trial: getTrial(state.activeTaskId, state.activeTrialId),
          }
        : null);
    const trial = found?.trial;
    if (!trial) return;
    const current = state.trialState[trial.id];
    const verdict = trial.results[current.activeLabel].verdicts[criterionId];
    if (!verdict) return;
    get().patchTrial(trial.id, {
      selectedCriterion: criterionId,
      scorerStep: verdict.scorerStep,
      agentStep: verdict.agentStep,
      focusedPane: "scorer",
    });
  },
  setStep: (pane, index) => {
    const { activeTrialId } = get();
    if (activeTrialId)
      get().patchTrial(activeTrialId, {
        [`${pane}Step`]: index,
        focusedPane: pane,
      });
  },
  setFocusedPane: (pane) => {
    const { activeTrialId } = get();
    if (activeTrialId) get().patchTrial(activeTrialId, { focusedPane: pane });
  },
  moveStep: (pane, direction) => {
    const state = get();
    const trial = getTrial(state.activeTaskId, state.activeTrialId);
    if (!trial) return;
    const current = state.trialState[trial.id][`${pane}Step`];
    const max = trial[`${pane}Steps`].length - 1;
    const index =
      direction === "home"
        ? 0
        : direction === "end"
          ? max
          : Math.max(0, Math.min(max, current + direction));
    get().setStep(pane, index);
  },
  toggleDisclosure: (key) =>
    set((state) => ({
      disclosure: { ...state.disclosure, [key]: !state.disclosure[key] },
    })),
  selectFile: (trialId, path) =>
    set((state) => ({
      fileSelection: { ...state.fileSelection, [trialId]: path },
    })),
  markTerminalComplete: (key) =>
    set((state) => ({
      terminalComplete: { ...state.terminalComplete, [key]: true },
    })),

  recordAdjudications: (records, label = "Recorded adjudication") => {
    const state = get();
    const trialId = state.activeTrialId;
    if (!trialId || !records.length) return;
    const previous = cloneRecords(state.trialState[trialId].adjudications);
    const map = new Map(previous.map((record) => [record.criterionId, record]));
    records.forEach((record) => map.set(record.criterionId, record));
    const next = [...map.values()];
    const history = [
      ...state.trialState[trialId].undo,
      { before: previous, after: cloneRecords(next), label },
    ];
    get().patchTrial(trialId, {
      adjudications: next,
      undo: history,
      redo: [],
      selectedFlips: [],
    });
    pushActivity(set, get, {
      label,
      detail: records.map((record) => `${record.criterionId}:${record.classification}`).join(", "),
      count: records.length,
    });
    set({
      announcement: `${records.length} adjudication${records.length === 1 ? "" : "s"} recorded`,
    });
  },
  replaceAdjudications: (records) => {
    const state = get();
    const trialId = state.activeTrialId;
    if (!trialId) return;
    const previous = cloneRecords(state.trialState[trialId].adjudications);
    const next = cloneRecords(records);
    get().patchTrial(trialId, {
      adjudications: next,
      undo: [
        ...state.trialState[trialId].undo,
        { before: previous, after: next, label: "Imported review package" },
      ],
      redo: [],
    });
    pushActivity(set, get, {
      label: "Imported review package",
      detail: `${next.length} adjudications restored`,
      count: next.length,
    });
  },
  undo: () => {
    const state = get();
    const trialId = state.activeTrialId;
    if (!trialId) return;
    const current = state.trialState[trialId];
    const entry = current.undo.at(-1);
    if (!entry) return;
    get().patchTrial(trialId, {
      adjudications: cloneRecords(entry.before),
      undo: current.undo.slice(0, -1),
      redo: [...current.redo, entry],
    });
    pushActivity(set, get, {
      label: `Undid: ${entry.label}`,
      detail: `${entry.before.length} adjudications restored`,
      count: entry.before.length,
    });
    set({ announcement: `Undid: ${entry.label}` });
  },
  redo: () => {
    const state = get();
    const trialId = state.activeTrialId;
    if (!trialId) return;
    const current = state.trialState[trialId];
    const entry = current.redo.at(-1);
    if (!entry) return;
    get().patchTrial(trialId, {
      adjudications: cloneRecords(entry.after),
      undo: [...current.undo, entry],
      redo: current.redo.slice(0, -1),
    });
    pushActivity(set, get, {
      label: `Redid: ${entry.label}`,
      detail: `${entry.after.length} adjudications restored`,
      count: entry.after.length,
    });
    set({ announcement: `Redid: ${entry.label}` });
  },
  openOverlay: (name) =>
    set((state) => ({
      overlays: { ...state.overlays, [name]: true },
      importErrors: name === "import" ? [] : state.importErrors,
    })),
  closeOverlay: (name) =>
    set((state) => ({ overlays: { ...state.overlays, [name]: false } })),
  setExportTab: (exportTab) => set({ exportTab }),
  setImportDraft: (importDraft) => set({ importDraft }),
  setImportErrors: (importErrors) => set({ importErrors }),
  setAnnouncement: (announcement) => set({ announcement }),
}));

export function currentContext(state = useReviewStore.getState()) {
  let task = getTask(state.activeTaskId);
  let trial = state.activeTrialId
    ? getTrial(state.activeTaskId, state.activeTrialId)
    : null;
  if (state.activeTrialId && !trial) {
    const found = findTrialAcrossTasks(state.activeTrialId);
    if (found) {
      task = found.task;
      trial = found.trial;
    }
  }
  const ui = trial ? state.trialState[trial.id] : null;
  return { task, trial, ui };
}

export function summaryCounts(records) {
  const counts = { "agent-bug": 0, "rubric-bug": 0, "scorer-error": 0 };
  records.forEach((record) => {
    if (counts[record.classification] !== undefined)
      counts[record.classification] += 1;
  });
  return counts;
}

export function buildReviewPackage(state = useReviewStore.getState()) {
  const { task, trial, ui } = currentContext(state);
  if (!trial) return null;
  return {
    schemaVersion: "review-package/v1",
    exportedAt: new Date().toISOString(),
    taskId: task.id,
    trialId: trial.id,
    model: trial.model,
    activeLabel: ui.activeLabel,
    comparedLabels: [...ui.comparedLabels],
    dimensionRollup: computeRollup(trial, ui.activeLabel),
    adjudications: cloneRecords(ui.adjudications),
    summaryCounts: summaryCounts(ui.adjudications),
    flipCriterionIds: flippedCriterionIds(trial, ui.comparedLabels),
  };
}

export function buildMemo(state = useReviewStore.getState()) {
  const pkg = buildReviewPackage(state);
  if (!pkg) return "";
  const lines = [
    "# Review memo",
    "",
    `- Task: \`${pkg.taskId}\``,
    `- Trial: \`${pkg.trialId}\``,
    `- Model: ${pkg.model}`,
    `- Active label: ${pkg.activeLabel}`,
    "",
    "## Adjudication summary",
    "",
    `- agent-bug: ${pkg.summaryCounts["agent-bug"]}`,
    `- rubric-bug: ${pkg.summaryCounts["rubric-bug"]}`,
    `- scorer-error: ${pkg.summaryCounts["scorer-error"]}`,
    "",
    "## Recorded adjudications",
    "",
  ];
  if (!pkg.adjudications.length)
    lines.push("No adjudications have been recorded.");
  pkg.adjudications.forEach((record) =>
    lines.push(
      `- **${record.criterionId}** — ${record.classification}: ${record.rationale.split("\\n")[0]}`,
    ),
  );
  return lines.join("\n");
}

export function trialBadge(trialId, state = useReviewStore.getState()) {
  const ui = state.trialState[trialId];
  const trial = tasks
    .flatMap((task) => task.trials)
    .find((item) => item.id === trialId);
  const reviewable = trial.criteria.filter(
    (criterion) =>
      !trial.results[ui.activeLabel].verdicts[criterion.id].yes ||
      flippedCriterionIds(trial, ui.comparedLabels).includes(criterion.id),
  ).length;
  if (!ui.adjudications.length) return { text: "None", tone: "neutral" };
  if (ui.adjudications.length >= reviewable)
    return { text: "Fully adjudicated", tone: "positive" };
  return { text: `In review · ${ui.adjudications.length}`, tone: "warning" };
}

export { dimensions, computeRollup, flippedCriterionIds };
