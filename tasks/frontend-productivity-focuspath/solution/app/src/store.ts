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

export const ACCENT_COLORS = [
  { value: "#2b6f6e", label: "Teal" },
  { value: "#c98a3d", label: "Gold" },
  { value: "#6b4fbb", label: "Violet" },
  { value: "#c1483f", label: "Crimson" },
  { value: "#2e7d5e", label: "Forest" },
  { value: "#4a7fb5", label: "Blue" },
  { value: "#b5563e", label: "Terracotta" },
  { value: "#7a6f42", label: "Olive" },
];

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
  return createStep({
    id: stringValue(step.id, uid()),
    title: stringValue(step.title),
    completed: step.completed === true,
    createdAt: stringValue(step.createdAt, new Date().toISOString()),
    completedAt: stringValue(step.completedAt),
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

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem("focuspath_v1");
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const saved = isRecord(parsed) ? parsed : {};
      return {
        goals: Array.isArray(saved.goals) ? saved.goals.map(normalizeGoal) : [],
        focusDate: stringValue(saved.focusDate),
        view: "overview",
        activeGoalId: "",
        showCompleted: saved.showCompleted === true,
      };
    }
  } catch {}
  return {
    goals: [],
    focusDate: "",
    view: "overview",
    activeGoalId: "",
    showCompleted: false,
  };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(
      "focuspath_v1",
      JSON.stringify({
        goals: state.goals,
        focusDate: state.focusDate,
        showCompleted: state.showCompleted,
      })
    );
  } catch {}
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

export function getTodayFocusSteps(goals: Goal[], focusDate: string): Array<{ goalId: string; milestoneId: string; stepId: string; stepTitle: string; goalTitle: string; milestoneTitle: string; completed: boolean; accentColor: string }> {
  const today = getTodayStr();
  if (focusDate !== today) return [];
  const result = [];
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

export function countTodayFocus(goals: Goal[], focusDate: string): number {
  return getTodayFocusSteps(goals, focusDate).length;
}
