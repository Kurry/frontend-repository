export interface ActionStep {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt: string;
  focusToday: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  steps: ActionStep[];
  completed: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  accentColor: string;
  motivation: string;
  milestones: Milestone[];
  createdAt: string;
  completed: boolean;
  completedAt: string;
}

export interface AppState {
  goals: Goal[];
  focusDate: string;
  view: "overview" | "detail" | "completed";
  activeGoalId: string;
  showCompleted: boolean;
}

// The closed 8-swatch palette mandated by the field contract. Any accentColor
// outside this set is rejected by the forms and by Path Pack import.
export const ACCENT_COLORS = [
  { value: "#2b6f6e", label: "Teal" },
  { value: "#c98a3d", label: "Gold" },
  { value: "#3f9d6b", label: "Green" },
  { value: "#4a6fa5", label: "Blue" },
  { value: "#8b5a8c", label: "Plum" },
  { value: "#c1483f", label: "Crimson" },
  { value: "#6b7268", label: "Slate" },
  { value: "#d9a441", label: "Amber" },
];

export const ACCENT_VALUES = ACCENT_COLORS.map((c) => c.value);

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeStep(value: unknown): ActionStep {
  const step = isRecord(value) ? value : {};
  // Path Pack export writes completion time as `lastCompletedAt` (see
  // serializeStep); fall back to the legacy `completedAt` key for packs
  // produced before that rename so re-imported timestamps aren't dropped.
  return createStep({
    id: stringValue(step.id, uid()),
    title: stringValue(step.title),
    completed: step.completed === true,
    createdAt: stringValue(step.createdAt, new Date().toISOString()),
    completedAt: stringValue(step.lastCompletedAt, stringValue(step.completedAt)),
    focusToday: step.focusToday === true,
  });
}

function normalizeMilestone(value: unknown): Milestone {
  const milestone = isRecord(value) ? value : {};
  return createMilestone({
    id: stringValue(milestone.id, uid()),
    title: stringValue(milestone.title),
    targetDate: stringValue(milestone.targetDate),
    steps: Array.isArray(milestone.steps) ? milestone.steps.map(normalizeStep) : [],
    completed: milestone.completed === true,
    createdAt: stringValue(milestone.createdAt, new Date().toISOString()),
  });
}

function normalizeGoal(value: unknown): Goal {
  const goal = isRecord(value) ? value : {};
  return createGoal({
    id: stringValue(goal.id, uid()),
    title: stringValue(goal.title),
    targetDate: stringValue(goal.targetDate),
    accentColor: stringValue(goal.accentColor, ACCENT_COLORS[0].value),
    motivation: stringValue(goal.motivation),
    milestones: Array.isArray(goal.milestones) ? goal.milestones.map(normalizeMilestone) : [],
    createdAt: stringValue(goal.createdAt, new Date().toISOString()),
    completed: goal.completed === true,
    completedAt: stringValue(goal.completedAt),
  });
}

export function createGoal(partial: Partial<Goal> = {}): Goal {
  return {
    id: uid(),
    title: "",
    targetDate: "",
    accentColor: ACCENT_COLORS[0].value,
    motivation: "",
    milestones: [],
    createdAt: new Date().toISOString(),
    completed: false,
    completedAt: "",
    ...partial,
  };
}

export function createMilestone(partial: Partial<Milestone> = {}): Milestone {
  return {
    id: uid(),
    title: "",
    targetDate: "",
    steps: [],
    completed: false,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function createStep(partial: Partial<ActionStep> = {}): ActionStep {
  return {
    id: uid(),
    title: "",
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: "",
    focusToday: false,
    ...partial,
  };
}

/**
 * Flip a step's completed state and keep completedAt in sync so
 * isStalled() can key off the actual completion date rather than the
 * step's original creation date.
 */
export function setStepCompleted(step: ActionStep, completed: boolean): void {
  step.completed = completed;
  step.completedAt = completed ? new Date().toISOString() : "";
}

// Persistence contract (good-app genre): the session is IN-MEMORY only. No
// localStorage / sessionStorage / IndexedDB / cookies. A full page reload
// returns the app to an empty overview with empty undo/redo stacks; session
// work survives only through Path Pack Export and the WebMCP surface. loadState
// therefore always yields a fresh empty session and saveState is a deliberate
// no-op kept so call sites stay uniform.
export function loadState(): AppState {
  return {
    goals: [],
    focusDate: "",
    view: "overview",
    activeGoalId: "",
    showCompleted: false,
  };
}

export function saveState(_state: AppState): void {
  /* in-memory only: intentionally does not persist to any browser storage */
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeProgress(goal: Goal): { completed: number; total: number; pct: number } {
  let total = 0;
  let completed = 0;
  const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
  for (const m of milestones) {
    const steps = Array.isArray(m.steps) ? m.steps : [];
    for (const s of steps) {
      total++;
      if (s.completed) completed++;
    }
  }
  return { completed, total, pct: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function isStalled(goal: Goal): boolean {
  if (goal.completed) return false;
  const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
  const hasIncomplete = milestones.some((m) => !m.completed);
  if (!hasIncomplete) return false;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  // Find latest activity across all steps: prefer the actual completion
  // timestamp, falling back to createdAt only for legacy/seeded records
  // that predate the completedAt field.
  let latestActivity: Date | null = null;
  for (const m of milestones) {
    const steps = Array.isArray(m.steps) ? m.steps : [];
    for (const s of steps) {
      if (s.completed) {
        const d = new Date(s.completedAt || s.createdAt);
        if (!latestActivity || d > latestActivity) latestActivity = d;
      }
    }
  }
  if (!latestActivity) {
    // no steps completed, use goal creation date
    const created = new Date(goal.createdAt);
    return created < sevenDaysAgo;
  }
  return latestActivity < sevenDaysAgo;
}

export function checkMilestoneAutoComplete(milestone: Milestone): boolean {
  const steps = Array.isArray(milestone.steps) ? milestone.steps : [];
  if (steps.length === 0) return false;
  return steps.every((s) => s.completed);
}

export function getActiveMilestoneIndex(goal: Goal): number {
  const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
  for (let i = 0; i < milestones.length; i++) {
    if (!milestones[i].completed) return i;
  }
  return -1;
}

type FocusStep = { goalId: string; milestoneId: string; stepId: string; stepTitle: string; goalTitle: string; milestoneTitle: string; completed: boolean; accentColor: string };

// Collects every step flagged `focusToday`, regardless of whether `focusDate`
// is today. Used by export so the Path Pack's `todaysFocus.stepIds` always
// reflects the actual focus flags on the goals (e.g. after importing a pack
// whose focusDate is in the past, steps can still carry focusToday === true).
function collectFocusSteps(goals: Goal[]): FocusStep[] {
  const result: FocusStep[] = [];
  for (const g of goals) {
    if (g.completed) continue;
    const milestones = Array.isArray(g.milestones) ? g.milestones : [];
    for (const m of milestones) {
      const steps = Array.isArray(m.steps) ? m.steps : [];
      for (const s of steps) {
        if (s.focusToday) {
          result.push({
            goalId: g.id,
            milestoneId: m.id,
            stepId: s.id,
            stepTitle: s.title,
            goalTitle: g.title,
            milestoneTitle: m.title,
            completed: s.completed,
            accentColor: g.accentColor,
          });
        }
      }
    }
  }
  return result;
}

export function getTodayFocusSteps(goals: Goal[], focusDate: string): FocusStep[] {
  const today = getTodayStr();
  if (focusDate !== today) return [];
  return collectFocusSteps(goals);
}

export function countTodayFocus(goals: Goal[], focusDate: string): number {
  return getTodayFocusSteps(goals, focusDate).length;
}

// Today's Focus panel caps at 3 steps; enforced both when toggling in the UI
// and when re-applying focus flags from an imported Path Pack.
export const MAX_FOCUS_STEPS = 3;

// ── Path Pack export/import (the app's produced roadmap files) ──────────────
export const PATH_PACK_FORMAT = "focuspath-path-pack-v1";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Goal/Milestone targetDate contract: YYYY-MM-DD and within [1970-01-01, 2100-12-31].
// Used by the create/edit forms and by Path Pack import validation so both paths
// reject the same out-of-range dates.
export const MIN_TARGET_DATE = "1970-01-01";
export const MAX_TARGET_DATE = "2100-12-31";

export function isTargetDateInRange(value: string): boolean {
  return value >= MIN_TARGET_DATE && value <= MAX_TARGET_DATE;
}

function serializeStep(s: ActionStep) {
  return {
    id: s.id,
    title: s.title,
    completed: s.completed,
    createdAt: s.createdAt,
    lastCompletedAt: s.completedAt || "",
  };
}

function serializeMilestone(m: Milestone) {
  return {
    id: m.id,
    title: m.title,
    targetDate: m.targetDate,
    createdAt: m.createdAt,
    completed: m.completed,
    steps: (m.steps || []).map(serializeStep),
  };
}

function serializeGoal(g: Goal) {
  const base = {
    id: g.id,
    title: g.title,
    targetDate: g.targetDate,
    accentColor: g.accentColor,
    motivation: g.motivation,
    createdAt: g.createdAt,
    completionPercent: computeProgress(g).pct,
    milestones: (g.milestones || []).map(serializeMilestone),
  };
  return g.completed ? { ...base, completionDate: (g.completedAt || "").slice(0, 10) } : base;
}

export function buildPathPack(state: AppState): Record<string, unknown> {
  const focusSteps = collectFocusSteps(state.goals);
  return {
    format: PATH_PACK_FORMAT,
    exportedAt: new Date().toISOString(),
    activeGoals: state.goals.filter((g) => !g.completed).map(serializeGoal),
    completedGoals: state.goals.filter((g) => g.completed).map(serializeGoal),
    todaysFocus: {
      focusDate: state.focusDate || "",
      stepIds: focusSteps.map((f) => f.stepId),
    },
  };
}

export function buildPathPackJson(state: AppState): string {
  return JSON.stringify(buildPathPack(state), null, 2);
}

export function buildMarkdownReport(state: AppState): string {
  const lines: string[] = ["# FocusPath Progress Report", ""];
  const section = (title: string, goals: Goal[]) => {
    lines.push(`## ${title}`);
    if (goals.length === 0) lines.push("_None yet._");
    for (const g of goals) {
      const p = computeProgress(g);
      lines.push(`### ${g.title} — ${p.pct}%`);
      if (g.completed && g.completedAt) lines.push(`Completed: ${g.completedAt.slice(0, 10)}`);
      for (const m of g.milestones || []) {
        lines.push(`- ${m.completed ? "[x]" : "[ ]"} **${m.title}**`);
        for (const s of m.steps || []) {
          lines.push(`  - ${s.completed ? "[x]" : "[ ]"} ${s.title}`);
        }
      }
      lines.push("");
    }
  };
  section("Active Goals", state.goals.filter((g) => !g.completed));
  section("Completed Goals", state.goals.filter((g) => g.completed));
  return lines.join("\n");
}

export interface PathPackValidation {
  ok: boolean;
  error?: string;
  goals?: Goal[];
  focusDate?: string;
  focusStepIds?: string[];
}

function validateGoalShape(raw: unknown, where: string): string | null {
  if (!isRecord(raw)) return `${where} must be an object`;
  const title = raw.title;
  if (typeof title !== "string" || title.length < 1) return `${where} title is required`;
  if (title.length > 80) return `${where} title must be at most 80 characters`;
  if (typeof raw.accentColor !== "string" || !ACCENT_VALUES.includes(raw.accentColor))
    return `${where} accentColor must be one of the 8 palette swatches`;
  if (raw.targetDate !== undefined && raw.targetDate !== "") {
    if (typeof raw.targetDate !== "string" || !DATE_RE.test(raw.targetDate)) return `${where} targetDate must be YYYY-MM-DD`;
    if (!isTargetDateInRange(raw.targetDate)) return `${where} targetDate must be between ${MIN_TARGET_DATE} and ${MAX_TARGET_DATE}`;
  }
  if (raw.motivation !== undefined && raw.motivation !== "") {
    if (typeof raw.motivation !== "string") return `${where} motivation must be a string`;
    if (raw.motivation.length > 280) return `${where} motivation must be at most 280 characters`;
  }
  const milestones = Array.isArray(raw.milestones) ? raw.milestones : [];
  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    if (!isRecord(m)) return `${where} milestone ${i + 1} must be an object`;
    if (typeof m.title !== "string" || m.title.length < 1) return `${where} milestone ${i + 1} title is required`;
    if (m.title.length > 80) return `${where} milestone ${i + 1} title must be at most 80 characters`;
    if (m.targetDate !== undefined && m.targetDate !== "") {
      if (typeof m.targetDate !== "string" || !DATE_RE.test(m.targetDate))
        return `${where} milestone ${i + 1} targetDate must be YYYY-MM-DD`;
      if (!isTargetDateInRange(m.targetDate))
        return `${where} milestone ${i + 1} targetDate must be between ${MIN_TARGET_DATE} and ${MAX_TARGET_DATE}`;
    }
    const steps = Array.isArray(m.steps) ? m.steps : [];
    for (let j = 0; j < steps.length; j++) {
      const s = steps[j];
      if (!isRecord(s)) return `${where} milestone ${i + 1} step ${j + 1} must be an object`;
      if (typeof s.title !== "string" || s.title.length < 1) return `${where} milestone ${i + 1} step ${j + 1} title is required`;
      if (s.title.length > 120) return `${where} milestone ${i + 1} step ${j + 1} title must be at most 120 characters`;
    }
  }
  return null;
}

export function validatePathPack(text: string): PathPackValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "File is not valid JSON" };
  }
  if (!isRecord(parsed)) return { ok: false, error: "Path Pack must be a JSON object" };
  if (parsed.format !== PATH_PACK_FORMAT)
    return { ok: false, error: `format must be exactly "${PATH_PACK_FORMAT}"` };
  if (!Array.isArray(parsed.activeGoals)) return { ok: false, error: "activeGoals must be an array" };
  if (!Array.isArray(parsed.completedGoals)) return { ok: false, error: "completedGoals must be an array" };
  if (!isRecord(parsed.todaysFocus)) return { ok: false, error: "todaysFocus must be an object" };

  for (let i = 0; i < parsed.activeGoals.length; i++) {
    const err = validateGoalShape(parsed.activeGoals[i], `activeGoals[${i}]`);
    if (err) return { ok: false, error: err };
  }
  for (let i = 0; i < parsed.completedGoals.length; i++) {
    const err = validateGoalShape(parsed.completedGoals[i], `completedGoals[${i}]`);
    if (err) return { ok: false, error: err };
  }

  const focus = parsed.todaysFocus as Record<string, unknown>;
  const focusDate = typeof focus.focusDate === "string" ? focus.focusDate : "";
  if (focusDate !== "" && !DATE_RE.test(focusDate))
    return { ok: false, error: "todaysFocus.focusDate must be YYYY-MM-DD or empty" };
  const focusStepIds = Array.isArray(focus.stepIds) ? focus.stepIds.filter((x): x is string => typeof x === "string") : [];

  const active = parsed.activeGoals.map((g) => normalizeGoal({ ...(g as object), completed: false }));
  const completed = parsed.completedGoals.map((g) => {
    const goal = normalizeGoal({ ...(g as object), completed: true });
    const cd = isRecord(g) ? g.completionDate : undefined;
    if (typeof cd === "string" && cd) goal.completedAt = cd.length === 10 ? `${cd}T00:00:00.000Z` : cd;
    else if (!goal.completedAt) goal.completedAt = new Date().toISOString();
    return goal;
  });

  const goals = [...active, ...completed];
  // Re-apply focus flags from stepIds, honoring the same Today's Focus cap
  // enforced when toggling in the UI (a pack with more than MAX_FOCUS_STEPS
  // ids only re-focuses the first MAX_FOCUS_STEPS, in pack order).
  const cappedFocusStepIds = focusStepIds.slice(0, MAX_FOCUS_STEPS);
  const idSet = new Set(cappedFocusStepIds);
  for (const g of goals) for (const m of g.milestones) for (const s of m.steps) s.focusToday = idSet.has(s.id);

  return { ok: true, goals, focusDate, focusStepIds: cappedFocusStepIds };
}
