import { component$, useStore, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import autoAnimate from "@formkit/auto-animate";
import {
  AppState,
  loadState,
  saveState,
  getTodayStr,
  getTodayFocusSteps,
  countTodayFocus,
  MAX_FOCUS_STEPS,
  isTargetDateInRange,
  MIN_TARGET_DATE,
  MAX_TARGET_DATE,
  createGoal,
  createMilestone,
  createStep,
  computeProgress,
  isStalled,
  checkMilestoneAutoComplete,
  getActiveMilestoneIndex,
  setStepCompleted,
  ACCENT_COLORS,
  ACCENT_VALUES,
  buildPathPackJson,
  buildMarkdownReport,
  validatePathPack,
} from "../store";
import type { Goal, Milestone, ActionStep } from "../store";

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sortedActiveGoals(goals: Goal[]): Goal[] {
  return goals
    .filter((g) => !g.completed)
    .slice()
    .sort((a, b) => {
      if (!a.targetDate && !b.targetDate) return 0;
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return a.targetDate.localeCompare(b.targetDate);
    });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Shared field-contract validators so the visible forms and the WebMCP entity
// bridge reject the same out-of-bounds input with the same named messages.
function titleError(value: string, label: string, max: number): string {
  const t = value.trim();
  if (!t) return `${label} is required`;
  if (t.length > max) return `${label} must be at most ${max} characters`;
  return "";
}
function dateError(value: string, label: string): string {
  if (!value) return "";
  if (!DATE_RE.test(value)) return `${label} must be YYYY-MM-DD`;
  if (!isTargetDateInRange(value)) return `${label} must be between ${MIN_TARGET_DATE} and ${MAX_TARGET_DATE}`;
  return "";
}
function accentError(value: string): string {
  if (!ACCENT_VALUES.includes(value)) return "Accent color must be one of the 8 palette swatches";
  return "";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

// Animate add / remove / reorder of a list's children (motion 4.6). Attaches
// exactly once per element and is a no-op under reduced motion so state changes
// still land without animation (motion 4.9 / a11y 1.10).
function useAutoList(ref: { value: HTMLElement | undefined }) {
  useVisibleTask$(() => {
    const el = ref.value;
    if (!el || el.dataset.aa === "1") return;
    el.dataset.aa = "1";
    if (prefersReducedMotion()) return;
    autoAnimate(el, { duration: 220, easing: "ease-in-out" });
  });
}

// Focus management for dialogs (a11y 1.2 / tech 2.18): on mount remember the
// opener, move focus into the dialog, trap Tab while open; on unmount return
// focus to the opener. Escape is handled by each dialog's own wiring.
function useFocusTrap(ref: { value: HTMLElement | undefined }, firstFocus?: { value: HTMLElement | undefined }) {
  useVisibleTask$(() => {
    const el = ref.value;
    if (!el) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
    (firstFocus && firstFocus.value ? firstFocus.value : focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("keydown", onKey);
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  });
}

// ──────────────────────────────────────────────────────────
// Icon set — one consistent line style across the whole app (visual 3.8).
// Every glyph is aria-hidden; the interactive parent supplies the name.
// ──────────────────────────────────────────────────────────

type IconName =
  | "undo" | "redo" | "export" | "import" | "search" | "close" | "plus"
  | "trash" | "up" | "down" | "check" | "star" | "starOff" | "back" | "edit" | "flag";

function Icon({ name }: { name: IconName }) {
  const common = "fp-icon";
  const s = { fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round" as const, "stroke-linejoin": "round" as const };
  let body: string;
  switch (name) {
    case "undo": body = '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'; break;
    case "redo": body = '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>'; break;
    case "export": body = '<path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>'; break;
    case "import": body = '<path d="M12 15V3"/><path d="m8 11 4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>'; break;
    case "search": body = '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'; break;
    case "close": body = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'; break;
    case "plus": body = '<path d="M12 5v14"/><path d="M5 12h14"/>'; break;
    case "trash": body = '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'; break;
    case "up": body = '<path d="m6 15 6-6 6 6"/>'; break;
    case "down": body = '<path d="m6 9 6 6 6-6"/>'; break;
    case "check": body = '<path d="M20 6 9 17l-5-5"/>'; break;
    case "star": body = '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" fill="currentColor" stroke="none"/>'; break;
    case "starOff": body = '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"/>'; break;
    case "back": body = '<path d="m15 18-6-6 6-6"/>'; break;
    case "edit": body = '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'; break;
    case "flag": body = '<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>'; break;
  }
  return <svg class={common} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...s} dangerouslySetInnerHTML={body} />;
}

// ──────────────────────────────────────────────────────────
// App root
// ──────────────────────────────────────────────────────────

export const App = component$(() => {
  const state = useStore<AppState & {
    showGoalForm: boolean;
    goalFormData: { title: string; targetDate: string; accentColor: string; motivation: string };
    goalFormError: string;
    undoStack: string[];
    redoStack: string[];
    _lastSnap: string;
    _timeTravel: boolean;
    showExport: boolean;
    exportTab: "json" | "markdown";
    copyConfirm: boolean;
    showImport: boolean;
    importError: string;
    showPalette: boolean;
    paletteQuery: string;
    scrollMilestoneId: string;
    note: string;
    noteKey: number;
    coachDismissed: boolean;
    density: "comfortable" | "compact";
    tint: "default" | "cool" | "warm";
  }>({
    goals: [],
    focusDate: "",
    view: "overview",
    activeGoalId: "",
    showCompleted: false,
    showGoalForm: false,
    goalFormData: { title: "", targetDate: "", accentColor: ACCENT_COLORS[0].value, motivation: "" },
    goalFormError: "",
    undoStack: [],
    redoStack: [],
    _lastSnap: "",
    _timeTravel: false,
    showExport: false,
    exportTab: "json",
    copyConfirm: false,
    showImport: false,
    importError: "",
    showPalette: false,
    paletteQuery: "",
    scrollMilestoneId: "",
    note: "",
    noteKey: 0,
    coachDismissed: false,
    density: "comfortable",
    tint: "default",
  });

  // In-memory load (good-app genre): always a fresh empty session.
  useVisibleTask$(() => {
    const saved = loadState();
    state.goals = saved.goals;
    state.showCompleted = saved.showCompleted;
    const today = getTodayStr();
    if (saved.focusDate !== today) {
      state.focusDate = today;
      for (const g of state.goals) for (const m of g.milestones) for (const s of m.steps) s.focusToday = false;
    } else {
      state.focusDate = saved.focusDate;
    }
    saveState(state);
    state._lastSnap = JSON.stringify({ goals: state.goals, focusDate: state.focusDate, showCompleted: state.showCompleted });
    state.undoStack = [];
    state.redoStack = [];
  });

  const persist = $(() => {
    saveState(state);
  });

  const flashNote = $((msg: string) => {
    state.note = msg;
    state.noteKey = state.noteKey + 1;
  });

  // ── Undo / Redo history ──
  useVisibleTask$(({ track }) => {
    const snap = track(() =>
      JSON.stringify({ goals: state.goals, focusDate: state.focusDate, showCompleted: state.showCompleted })
    );
    if (state._timeTravel) {
      state._timeTravel = false;
      state._lastSnap = snap;
      return;
    }
    if (state._lastSnap === "") {
      state._lastSnap = snap;
      return;
    }
    if (snap === state._lastSnap) return;
    state.undoStack.push(state._lastSnap);
    if (state.undoStack.length > 200) state.undoStack.shift();
    state.redoStack = [];
    state._lastSnap = snap;
  });

  const applySnap = $((snapStr: string) => {
    try {
      const parsed = JSON.parse(snapStr) as { goals: Goal[]; focusDate: string; showCompleted: boolean };
      state.goals = parsed.goals;
      state.focusDate = parsed.focusDate;
      state.showCompleted = parsed.showCompleted;
      if (state.activeGoalId && !state.goals.some((g) => g.id === state.activeGoalId)) {
        state.view = "overview";
        state.activeGoalId = "";
      }
    } catch {
      /* ignore malformed snapshot */
    }
  });

  const undo = $(async () => {
    if (state.undoStack.length === 0) return;
    const prev = state.undoStack.pop()!;
    state.redoStack.push(state._lastSnap);
    state._timeTravel = true;
    await applySnap(prev);
  });

  const redo = $(async () => {
    if (state.redoStack.length === 0) return;
    const next = state.redoStack.pop()!;
    state.undoStack.push(state._lastSnap);
    state._timeTravel = true;
    await applySnap(next);
  });

  // ── Export / Import / Command palette ──
  const openExport = $(() => {
    state.exportTab = "json";
    state.copyConfirm = false;
    state.showExport = true;
  });

  const applyImport = $((text: string): boolean => {
    const result = validatePathPack(text);
    if (!result.ok) {
      state.importError = result.error ?? "Import failed validation";
      return false;
    }
    state.goals = result.goals ?? [];
    // Stale-day focus: if the pack's focusDate is not today, clear focusToday
    // flags (completion untouched) and advance focusDate to today so the panel
    // and Daily Velocity match the empty selection (core 1.10 / edge 4.9).
    const today = getTodayStr();
    const importedFocus = result.focusDate ?? "";
    if (importedFocus !== today) {
      for (const g of state.goals) for (const m of g.milestones) for (const s of m.steps) s.focusToday = false;
      state.focusDate = today;
    } else {
      state.focusDate = importedFocus;
    }
    state.view = "overview";
    state.activeGoalId = "";
    state.showImport = false;
    state.importError = "";
    const n = state.goals.length;
    void flashNote(`Imported Path Pack — ${n} goal${n === 1 ? "" : "s"} loaded; session replaced.`);
    return true;
  });

  const openPalette = $(() => {
    state.paletteQuery = "";
    state.showPalette = true;
  });

  const jumpToPalette = $((goalId: string, milestoneId: string) => {
    state.activeGoalId = goalId;
    state.view = "detail";
    state.scrollMilestoneId = milestoneId;
    state.showPalette = false;
  });

  const anyModalOpen = () => state.showPalette || state.showExport || state.showImport || state.showGoalForm;

  // ── Global keyboard shortcuts ──
  useVisibleTask$(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        state.paletteQuery = "";
        state.showPalette = true;
        return;
      }
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) void redo();
        else void undo();
        return;
      }
      if (mod && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        void redo();
        return;
      }
      if (e.key === "Escape") {
        if (state.showPalette) state.showPalette = false;
        else if (state.showExport) state.showExport = false;
        else if (state.showImport) { state.showImport = false; state.importError = ""; }
        else if (state.showGoalForm) state.showGoalForm = false;
        return;
      }
      // Single-key power shortcuts (innovation 11.5): only when not typing and
      // no overlay is open, so they never hijack form input.
      if (mod || e.altKey) return;
      const ae = document.activeElement as HTMLElement | null;
      const tag = ae?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || ae?.isContentEditable) return;
      if (anyModalOpen()) return;
      if (e.key === "n") { e.preventDefault(); void openGoalForm(); }
      else if (e.key === "e") { e.preventDefault(); void openExport(); }
      else if (e.key === "i") { e.preventDefault(); state.showImport = true; state.importError = ""; }
      else if (e.key === "g") { e.preventDefault(); state.view = "overview"; state.activeGoalId = ""; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Expose UI actions + domain commands to the WebMCP bridge (same handlers the
  // visible controls run — no fabricated success path).
  useVisibleTask$(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__focuspath_ui = {
      undo,
      redo,
      openExport: () => { state.exportTab = "json"; state.copyConfirm = false; state.showExport = true; return { ok: true }; },
      setExportTab: (tab: string) => { state.exportTab = tab === "markdown" ? "markdown" : "json"; state.showExport = true; return { ok: true, tab: state.exportTab }; },
      copyExport: async () => {
        const text = state.exportTab === "json" ? buildPathPackJson(state) : buildMarkdownReport(state);
        try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
        state.copyConfirm = true;
        state.showExport = true;
        setTimeout(() => { state.copyConfirm = false; }, 1800);
        return { ok: true };
      },
      openImport: () => { state.showImport = true; state.importError = ""; return { ok: true }; },
      // Inline sync import — must live inside this useVisibleTask$ QRL. A sibling
      // function declaration is NOT captured by Qwik's resumable closure and
      // throws ReferenceError: applyImportSync is not defined at invoke time.
      importPack: (text: string) => {
        const result = validatePathPack(text);
        if (!result.ok) {
          state.importError = result.error ?? "Import failed validation";
          return { ok: false, error: state.importError };
        }
        state.goals = result.goals ?? [];
        const today = getTodayStr();
        const importedFocus = result.focusDate ?? "";
        if (importedFocus !== today) {
          for (const g of state.goals) for (const m of g.milestones) for (const s of m.steps) s.focusToday = false;
          state.focusDate = today;
        } else {
          state.focusDate = importedFocus;
        }
        state.view = "overview";
        state.activeGoalId = "";
        state.showImport = false;
        state.importError = "";
        return { ok: true, goals: state.goals.length };
      },
      openPalette: () => { state.paletteQuery = ""; state.showPalette = true; return { ok: true }; },
      setPaletteQuery: (query: string) => { state.paletteQuery = query; state.showPalette = true; return { ok: true, query }; },
    };
  });

  // ── WebMCP domain bridge ──
  useVisibleTask$(() => {
    const findGoal = (goalId: string) => state.goals.find((g) => g.id === goalId) ?? null;
    const findMilestone = (goalId: string, milestoneId: string) => {
      const g = findGoal(goalId);
      return g ? g.milestones.find((m) => m.id === milestoneId) ?? null : null;
    };
    const findStep = (goalId: string, milestoneId: string, stepId: string) => {
      const m = findMilestone(goalId, milestoneId);
      return m ? m.steps.find((s) => s.id === stepId) ?? null : null;
    };
    const clearStaleFocusFlags = () => {
      // Clear Today's Focus selections when focusDate is not today, without
      // changing step completion. Caller decides whether to advance focusDate.
      if (state.focusDate === getTodayStr()) return;
      for (const g of state.goals) for (const m of g.milestones) for (const s of m.steps) s.focusToday = false;
    };

    const api = {
      snapshot: () => ({
        view: state.view,
        activeGoalId: state.activeGoalId,
        showCompleted: state.showCompleted,
        focusDate: state.focusDate,
        goals: state.goals.map((g) => ({
          id: g.id,
          title: g.title,
          completed: g.completed,
          pct: computeProgress(g).pct,
          stalled: isStalled(g),
          milestones: g.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            completed: m.completed,
            steps: m.steps.map((s) => ({ id: s.id, title: s.title, completed: s.completed, focusToday: s.focusToday })),
          })),
        })),
        focusCount: countTodayFocus(state.goals, state.focusDate),
      }),

      open: (destination: string, goalId?: string) => {
        if (destination === "goals-overview") {
          state.view = "overview"; state.activeGoalId = "";
          return { ok: true, destination, view: state.view };
        }
        if (destination === "completed-goals") {
          state.view = "overview"; state.activeGoalId = ""; state.showCompleted = true; saveState(state);
          return { ok: true, destination, view: state.view, showCompleted: true };
        }
        if (destination === "goal-detail") {
          const g = goalId ? findGoal(goalId) : state.goals[0];
          if (!g) return { ok: false, error: "no goal to open" };
          state.activeGoalId = g.id; state.view = "detail";
          return { ok: true, destination, view: state.view, activeGoalId: g.id };
        }
        return { ok: false, error: `unknown destination: ${destination}` };
      },

      createGoal: (fields: { title?: string; targetDate?: string; accentColor?: string; motivation?: string }) => {
        const te = titleError(fields.title ?? "", "Goal title", 80);
        if (te) return { ok: false, error: te };
        const accent = fields.accentColor === undefined ? ACCENT_COLORS[0].value : fields.accentColor;
        const ae = accentError(accent);
        if (ae) return { ok: false, error: `Goal ${ae}` };
        const de = dateError(fields.targetDate ?? "", "Goal targetDate");
        if (de) return { ok: false, error: de };
        const mot = (fields.motivation ?? "").trim();
        if (mot.length > 280) return { ok: false, error: "Goal motivation must be at most 280 characters" };
        const g = createGoal({ id: uid(), title: (fields.title ?? "").trim(), targetDate: fields.targetDate ?? "", accentColor: accent, motivation: mot });
        state.goals.push(g);
        saveState(state);
        return { ok: true, entity: "goal", id: g.id };
      },

      createMilestone: (goalId: string, fields: { title?: string; targetDate?: string }) => {
        const g = findGoal(goalId);
        if (!g) return { ok: false, error: "goal not found" };
        const te = titleError(fields.title ?? "", "Milestone title", 80);
        if (te) return { ok: false, error: te };
        const de = dateError(fields.targetDate ?? "", "Milestone targetDate");
        if (de) return { ok: false, error: de };
        const m = createMilestone({ id: uid(), title: (fields.title ?? "").trim(), targetDate: fields.targetDate ?? "" });
        g.milestones.push(m);
        saveState(state);
        return { ok: true, entity: "milestone", id: m.id };
      },

      createStep: (goalId: string, milestoneId: string, title: string) => {
        const m = findMilestone(goalId, milestoneId);
        if (!m) return { ok: false, error: "milestone not found" };
        const te = titleError(title ?? "", "Step title", 120);
        if (te) return { ok: false, error: te };
        const s = createStep({ id: uid(), title: (title ?? "").trim() });
        m.steps.push(s);
        m.completed = checkMilestoneAutoComplete(m);
        saveState(state);
        return { ok: true, entity: "step", id: s.id, milestoneCompleted: m.completed };
      },

      select: (goalId: string) => {
        const g = findGoal(goalId);
        if (!g) return { ok: false, error: "goal not found" };
        state.activeGoalId = g.id; state.view = "detail";
        return { ok: true, id: g.id };
      },

      update: (args: {
        entity: string;
        goalId: string;
        milestoneId?: string;
        stepId?: string;
        title?: string;
        targetDate?: string;
        motivation?: string;
        accentColor?: string;
        createdAt?: string;
        lastCompletedAt?: string;
        completionDate?: string;
        completed?: boolean;
        focusToday?: boolean;
      }) => {
        if (args.entity === "goal") {
          const g = findGoal(args.goalId);
          if (!g) return { ok: false, error: "goal not found" };
          // Validate the complete patch before mutating the reactive object so a
          // later guard cannot leave an update half-applied.
          if (args.title !== undefined) { const e = titleError(args.title, "Goal title", 80); if (e) return { ok: false, error: e }; }
          if (args.targetDate !== undefined) { const e = dateError(args.targetDate, "Goal targetDate"); if (e) return { ok: false, error: e }; }
          if (args.motivation !== undefined && args.motivation.trim().length > 280) return { ok: false, error: "Goal motivation must be at most 280 characters" };
          if (args.accentColor !== undefined) { const e = accentError(args.accentColor); if (e) return { ok: false, error: e }; }
          if (args.completionDate !== undefined && args.completionDate !== "" && !DATE_RE.test(args.completionDate)) return { ok: false, error: "Goal completionDate must be YYYY-MM-DD" };
          if (args.completed === true && computeProgress(g).pct !== 100) return { ok: false, error: "Mark Goal Complete only available at 100%" };
          if (args.title !== undefined) g.title = args.title.trim();
          if (args.targetDate !== undefined) g.targetDate = args.targetDate;
          if (args.motivation !== undefined) g.motivation = args.motivation.trim();
          if (args.accentColor !== undefined) g.accentColor = args.accentColor;
          if (args.createdAt !== undefined) g.createdAt = args.createdAt;
          if (args.completionDate !== undefined) {
            const cd = args.completionDate;
            g.completedAt = cd ? `${cd}T00:00:00.000Z` : "";
          }
          if (args.completed === true) {
            g.completed = true;
            if (!g.completedAt) g.completedAt = new Date().toISOString();
            state.view = "overview";
            state.activeGoalId = "";
            state.showCompleted = true;
          } else if (args.completed === false) {
            g.completed = false;
            g.completedAt = "";
          }
          saveState(state);
          return { ok: true, entity: "goal", id: g.id, stalled: isStalled(g) };
        }
        if (args.entity === "milestone") {
          const m = findMilestone(args.goalId, args.milestoneId ?? "");
          if (!m) return { ok: false, error: "milestone not found" };
          if (args.title !== undefined) { const e = titleError(args.title, "Milestone title", 80); if (e) return { ok: false, error: e }; }
          if (args.targetDate !== undefined) { const e = dateError(args.targetDate, "Milestone targetDate"); if (e) return { ok: false, error: e }; }
          if (args.title !== undefined) m.title = args.title.trim();
          if (args.targetDate !== undefined) m.targetDate = args.targetDate;
          if (args.createdAt !== undefined) m.createdAt = args.createdAt;
          if (args.completed !== undefined) m.completed = args.completed === true;
          saveState(state);
          return { ok: true, entity: "milestone", id: m.id };
        }
        if (args.entity === "step") {
          const m = findMilestone(args.goalId, args.milestoneId ?? "");
          const s = findStep(args.goalId, args.milestoneId ?? "", args.stepId ?? "");
          if (!m || !s) return { ok: false, error: "step not found" };
          if (args.title !== undefined) { const e = titleError(args.title, "Step title", 120); if (e) return { ok: false, error: e }; }
          const today = getTodayStr();
          const focusCount = state.focusDate === today ? countTodayFocus(state.goals, state.focusDate) : 0;
          if (args.focusToday === true && !s.focusToday && focusCount >= MAX_FOCUS_STEPS) {
            return { ok: false, error: "You already have 3 focus steps today. Complete or unfocus one to add another.", focusCount: MAX_FOCUS_STEPS };
          }
          if (args.title !== undefined) s.title = args.title.trim();
          if (args.createdAt !== undefined) s.createdAt = args.createdAt;
          if (args.lastCompletedAt !== undefined) s.completedAt = args.lastCompletedAt;
          if (args.completed !== undefined) {
            setStepCompleted(s, args.completed === true);
            if (args.lastCompletedAt !== undefined) s.completedAt = args.lastCompletedAt;
            m.completed = checkMilestoneAutoComplete(m);
          }
          if (args.focusToday !== undefined) {
            clearStaleFocusFlags();
            if (state.focusDate !== getTodayStr()) state.focusDate = getTodayStr();
            if (args.focusToday === true) {
              s.focusToday = true;
            } else {
              s.focusToday = false;
            }
          }
          saveState(state);
          const g = findGoal(args.goalId);
          return { ok: true, entity: "step", id: s.id, stalled: g ? isStalled(g) : false };
        }
        return { ok: false, error: `unknown entity: ${args.entity}` };
      },

      remove: (args: { entity: string; goalId: string; milestoneId?: string; stepId?: string; confirm?: boolean }) => {
        if (args.confirm !== true) return { ok: false, error: "delete requires confirm=true" };
        if (args.entity === "goal") {
          const idx = state.goals.findIndex((g) => g.id === args.goalId);
          if (idx === -1) return { ok: false, error: "goal not found" };
          state.goals.splice(idx, 1);
          if (state.activeGoalId === args.goalId) { state.activeGoalId = ""; state.view = "overview"; }
          saveState(state);
          return { ok: true, entity: "goal", deleted: args.goalId };
        }
        if (args.entity === "milestone") {
          const g = findGoal(args.goalId);
          if (!g) return { ok: false, error: "goal not found" };
          const idx = g.milestones.findIndex((m) => m.id === args.milestoneId);
          if (idx === -1) return { ok: false, error: "milestone not found" };
          g.milestones.splice(idx, 1);
          saveState(state);
          return { ok: true, entity: "milestone", deleted: args.milestoneId };
        }
        if (args.entity === "step") {
          const m = findMilestone(args.goalId, args.milestoneId ?? "");
          if (!m) return { ok: false, error: "milestone not found" };
          const idx = m.steps.findIndex((s) => s.id === args.stepId);
          if (idx === -1) return { ok: false, error: "step not found" };
          m.steps.splice(idx, 1);
          m.completed = checkMilestoneAutoComplete(m);
          saveState(state);
          return { ok: true, entity: "step", deleted: args.stepId, milestoneCompleted: m.completed };
        }
        return { ok: false, error: `unknown entity: ${args.entity}` };
      },

      toggleStepComplete: (goalId: string, milestoneId: string, stepId: string) => {
        const m = findMilestone(goalId, milestoneId);
        const s = findStep(goalId, milestoneId, stepId);
        if (!m || !s) return { ok: false, error: "step not found" };
        setStepCompleted(s, !s.completed);
        m.completed = checkMilestoneAutoComplete(m);
        saveState(state);
        return { ok: true, stepId, completed: s.completed, milestoneCompleted: m.completed };
      },

      toggleFocusToday: (goalId: string, milestoneId: string, stepId: string) => {
        clearStaleFocusFlags();
        if (state.focusDate !== getTodayStr()) state.focusDate = getTodayStr();
        const s = findStep(goalId, milestoneId, stepId);
        if (!s) return { ok: false, error: "step not found" };
        if (s.focusToday) {
          s.focusToday = false; saveState(state);
          return { ok: true, stepId, focusToday: false, focusCount: countTodayFocus(state.goals, state.focusDate) };
        }
        if (countTodayFocus(state.goals, state.focusDate) >= MAX_FOCUS_STEPS) {
          return { ok: false, error: "You already have 3 focus steps today. Complete or unfocus one to add another.", focusCount: MAX_FOCUS_STEPS };
        }
        s.focusToday = true; saveState(state);
        return { ok: true, stepId, focusToday: true, focusCount: countTodayFocus(state.goals, state.focusDate) };
      },

      reorderMilestone: (goalId: string, milestoneId: string, direction: "up" | "down") => {
        const g = findGoal(goalId);
        if (!g) return { ok: false, error: "goal not found" };
        const idx = g.milestones.findIndex((m) => m.id === milestoneId);
        if (idx === -1) return { ok: false, error: "milestone not found" };
        const m = g.milestones[idx];
        if (m.completed) return { ok: false, error: "Reordering disabled — this milestone is complete" };
        if (g.milestones.slice(0, idx).some((x) => x.completed)) return { ok: false, error: "Reordering disabled — an earlier milestone is complete" };
        const target = direction === "up" ? idx - 1 : idx + 1;
        if (target < 0 || target >= g.milestones.length) return { ok: false, error: "cannot move past the edge" };
        if (g.milestones[target].completed) return { ok: false, error: "Reordering disabled — neighbouring milestone is complete" };
        const tmp = g.milestones[target];
        g.milestones[target] = m;
        g.milestones[idx] = tmp;
        saveState(state);
        return { ok: true, milestoneId, from: idx, to: target };
      },

      markGoalComplete: (goalId: string) => {
        const g = findGoal(goalId);
        if (!g) return { ok: false, error: "goal not found" };
        if (computeProgress(g).pct !== 100) return { ok: false, error: "Mark Goal Complete only available at 100%" };
        g.completed = true;
        g.completedAt = new Date().toISOString();
        state.view = "overview";
        state.activeGoalId = "";
        state.showCompleted = true;
        saveState(state);
        return { ok: true, id: g.id, completedAt: g.completedAt, completionDate: g.completedAt.slice(0, 10) };
      },
    };

    (window as unknown as Record<string, unknown>).__focuspath = api;
  });

  // ── Goal form ──
  const openGoalForm = $(() => {
    state.goalFormData = { title: "", targetDate: "", accentColor: ACCENT_COLORS[0].value, motivation: "" };
    state.goalFormError = "";
    state.showGoalForm = true;
  });

  const submitGoalForm = $(() => {
    // Double-submit: close the form synchronously first so a second click in
    // the same tick sees showGoalForm=false and is a no-op (core 1.38 / edge 4.10).
    if (!state.showGoalForm) return;
    const d = state.goalFormData;
    const te = titleError(d.title, "Goal title", 80);
    if (te) { state.goalFormError = te; return; }
    const de = dateError(d.targetDate, "Target date");
    if (de) { state.goalFormError = de; return; }
    const me = d.motivation.length > 280 ? "Motivation must be at most 280 characters" : "";
    if (me) { state.goalFormError = me; return; }
    const ace = accentError(d.accentColor);
    if (ace) { state.goalFormError = ace; return; }
    state.showGoalForm = false;
    state.goalFormError = "";
    const g = createGoal({ id: uid(), title: d.title.trim(), targetDate: d.targetDate, accentColor: d.accentColor, motivation: d.motivation.trim() });
    state.goals.push(g);
  });

  const cancelGoalForm = $(() => {
    state.showGoalForm = false;
    state.goalFormError = "";
  });

  // ── Focus today helpers ──
  const toggleFocusStep = $((goalId: string, milestoneId: string, stepId: string) => {
    const today = getTodayStr();
    if (state.focusDate !== today) {
      state.focusDate = today;
      for (const g of state.goals) for (const m of g.milestones) for (const s of m.steps) s.focusToday = false;
    }
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const milestone = goal.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;
    const step = milestone.steps.find((s) => s.id === stepId);
    if (!step) return;
    if (step.focusToday) { step.focusToday = false; persist(); return; }
    if (countTodayFocus(state.goals, state.focusDate) >= 3) return; // surfaced via onFocusLimit$
    step.focusToday = true;
    persist();
  });

  const cycleTint = $(() => {
    state.tint = state.tint === "default" ? "cool" : state.tint === "cool" ? "warm" : "default";
  });
  const toggleDensity = $(() => {
    state.density = state.density === "comfortable" ? "compact" : "comfortable";
  });

  const activeGoal = state.goals.find((g) => g.id === state.activeGoalId) ?? null;
  const todaySteps = getTodayFocusSteps(state.goals, state.focusDate);
  const focusCount = todaySteps.length;

  const rootTint = state.tint === "cool" ? "tint-cool" : state.tint === "warm" ? "tint-warm" : "";
  const rootDensity = state.density === "compact" ? "density-compact" : "";

  return (
    <div class={`min-h-screen ${rootTint} ${rootDensity}`} style="background-color:var(--color-background)">
      {/* aria-live announcer for confirmations / validation (a11y 1.4) */}
      <div class="sr-only" role="status" aria-live="polite" key={state.noteKey}>{state.note}</div>

      {/* Header / banner landmark */}
      <header style="background:var(--color-surface);border-bottom:1px solid #e5e7eb;" class="sticky top-0 z-10">
        <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <h1 style="margin:0;font-family:'Fraunces','Georgia',serif;font-weight:700;font-size:1.25rem;line-height:1">
              <button
                class="bg-transparent border-none cursor-pointer"
                style="font:inherit;color:var(--color-primary)"
                onClick$={() => { state.view = "overview"; state.activeGoalId = ""; }}
              >
                FocusPath
              </button>
            </h1>
            {state.view === "detail" && (
              <button class="btn-secondary" aria-label="Back to overview" onClick$={() => { state.view = "overview"; state.activeGoalId = ""; }}>
                <Icon name="back" /> Back
              </button>
            )}
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button class="btn-primary" aria-label="+ New Goal" onClick$={openGoalForm}><Icon name="plus" /> + New Goal</button>
            <button
              class="btn-secondary"
              aria-label="Undo"
              aria-disabled={state.undoStack.length === 0 ? "true" : "false"}
              disabled={state.undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              onClick$={undo}
            >
              <Icon name="undo" /> Undo
            </button>
            <button
              class="btn-secondary"
              aria-label="Redo"
              aria-disabled={state.redoStack.length === 0 ? "true" : "false"}
              disabled={state.redoStack.length === 0}
              title="Redo (Ctrl+Shift+Z)"
              onClick$={redo}
            >
              <Icon name="redo" /> Redo
            </button>
            <button class="btn-secondary" aria-label="Export Path Pack" onClick$={openExport}><Icon name="export" /> Export</button>
            <button class="btn-secondary" aria-label="Import Path Pack" onClick$={() => { state.showImport = true; state.importError = ""; }}><Icon name="import" /> Import</button>
            <button class="btn-secondary" aria-label="Open command palette" title="Command palette (Ctrl+K)" onClick$={openPalette}><Icon name="search" /> Search</button>
            <button
              class="btn-secondary"
              aria-label={`Density: ${state.density}. Activate to toggle.`}
              aria-pressed={state.density === "compact" ? "true" : "false"}
              title="Toggle compact density"
              onClick$={toggleDensity}
            >
              {state.density === "compact" ? "Compact" : "Comfortable"}
            </button>
            <button
              class="btn-secondary"
              aria-label={`Calm tint: ${state.tint}. Activate to cycle.`}
              title="Cycle calm background tint"
              onClick$={cycleTint}
            >
              Tint
            </button>
          </div>
        </div>
      </header>

      {state.showExport && (
        <ExportDrawer state={state} onClose$={() => { state.showExport = false; }} />
      )}
      {state.showImport && (
        <ImportModal
          error={state.importError}
          onValidate$={(text: string) => { applyImport(text); }}
          onCancel$={() => { state.showImport = false; state.importError = ""; }}
        />
      )}
      {state.showPalette && (
        <CommandPalette state={state} onJump$={jumpToPalette} onClose$={() => { state.showPalette = false; }} />
      )}

      <main class="max-w-5xl mx-auto px-4 py-6">
        {state.showGoalForm && (
          <GoalForm
            data={state.goalFormData}
            error={state.goalFormError}
            onSubmit$={submitGoalForm}
            onCancel$={cancelGoalForm}
          />
        )}

        {state.view === "overview" && (
          <OverviewView
            state={state}
            onOpenGoal$={(id: string) => { state.activeGoalId = id; state.view = "detail"; }}
            onOpenGoalForm$={openGoalForm}
            persist$={persist}
            toggleFocusStep$={toggleFocusStep}
          />
        )}

        {state.view === "detail" && activeGoal && (
          <DetailView
            state={state}
            goal={activeGoal}
            persist$={persist}
            toggleFocusStep$={toggleFocusStep}
            flashNote$={flashNote}
          />
        )}

        <SessionSummary state={state} />
      </main>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Session summary (in-memory, no storage) — innovation 11.9
// ──────────────────────────────────────────────────────────

const SessionSummary = component$<{ state: AppState & { goals: Goal[] } }>((props) => {
  const goals = props.state.goals;
  const active = goals.filter((g) => !g.completed).length;
  const done = goals.filter((g) => g.completed).length;
  let steps = 0;
  let doneSteps = 0;
  for (const g of goals) for (const m of g.milestones) for (const s of m.steps) { steps++; if (s.completed) doneSteps++; }
  return (
    <p class="session-summary">
      This session: {active} active goal{active === 1 ? "" : "s"}, {done} completed, {doneSteps} of {steps} steps done.
      Work lives in memory only — export a Path Pack to keep it.
    </p>
  );
});

// ──────────────────────────────────────────────────────────
// Goal Form
// ──────────────────────────────────────────────────────────

const GoalForm = component$<{
  data: { title: string; targetDate: string; accentColor: string; motivation: string };
  error: string;
  onSubmit$: () => void;
  onCancel$: () => void;
}>((props) => {
  const { data } = props;
  const dialogRef = useSignal<HTMLDivElement>();
  const titleInputRef = useSignal<HTMLInputElement>();
  useFocusTrap(dialogRef, titleInputRef);

  const titleErr = titleError(data.title, "Goal title", 80);
  const dateErr = dateError(data.targetDate, "Target date");
  const motErr = data.motivation.length > 280 ? "Motivation must be at most 280 characters" : "";
  const valid = titleErr === "" && dateErr === "" && motErr === "" && data.title.trim().length > 0;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.35)" role="dialog" aria-modal="true" aria-labelledby="goal-form-title">
      <div ref={dialogRef} class="card p-6 w-full max-w-md mx-4 modal-enter">
        <h2 id="goal-form-title" style="font-size:1.3rem;margin-bottom:0.25rem;color:var(--color-text-primary)">New goal</h2>
        <p class="text-xs mb-4" style="color:var(--color-text-secondary)">
          Break a goal into milestones, then into doable steps. Progress lives in this session — export a Path Pack to keep it.
        </p>
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm mb-1" for="goal-title" style="color:var(--color-text-secondary)">Title *</label>
            <input
              ref={titleInputRef}
              id="goal-title"
              type="text"
              maxLength={80}
              value={data.title}
              aria-invalid={titleErr ? "true" : "false"}
              aria-describedby="goal-title-err"
              placeholder="e.g. Launch my podcast"
              onInput$={(e) => { data.title = (e.target as HTMLInputElement).value; }}
            />
            {(titleErr || props.error) && (
              <p id="goal-title-err" class="mt-1 text-xs feedback-in" role="alert" style="color:var(--color-error)">{props.error || titleErr}</p>
            )}
          </div>
          <div>
            <label class="block text-sm mb-1" for="goal-date" style="color:var(--color-text-secondary)">Target date</label>
            <input
              id="goal-date"
              type="date"
              min={MIN_TARGET_DATE}
              max={MAX_TARGET_DATE}
              value={data.targetDate}
              aria-invalid={dateErr ? "true" : "false"}
              aria-describedby="goal-date-err"
              onInput$={(e) => { data.targetDate = (e.target as HTMLInputElement).value; }}
            />
            {dateErr && <p id="goal-date-err" class="mt-1 text-xs feedback-in" role="alert" style="color:var(--color-error)">{dateErr}</p>}
          </div>
          <div>
            <span class="block text-sm mb-1" id="goal-accent-label" style="color:var(--color-text-secondary)">Accent color</span>
            <div class="flex gap-2 flex-wrap" role="radiogroup" aria-labelledby="goal-accent-label">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={data.accentColor === c.value ? "true" : "false"}
                  aria-label={c.label}
                  class="w-7 h-7 rounded-full border-2 transition-all"
                  style={`background:${c.value};border-color:${data.accentColor === c.value ? '#232823' : 'transparent'}`}
                  onClick$={() => { data.accentColor = c.value; }}
                />
              ))}
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1" for="goal-motivation" style="color:var(--color-text-secondary)">Why this matters</label>
            <textarea
              id="goal-motivation"
              rows={2}
              maxLength={280}
              placeholder="Your motivation..."
              style="resize:vertical"
              value={data.motivation}
              aria-invalid={motErr ? "true" : "false"}
              aria-describedby="goal-motivation-err"
              onInput$={(e) => { data.motivation = (e.target as HTMLTextAreaElement).value; }}
            />
            {motErr && <p id="goal-motivation-err" class="mt-1 text-xs feedback-in" role="alert" style="color:var(--color-error)">{motErr}</p>}
          </div>
          <div class="flex gap-2 justify-end">
            <button class="btn-secondary" onClick$={props.onCancel$}>Cancel</button>
            <button
              class="btn-primary"
              disabled={!valid}
              aria-disabled={!valid ? "true" : "false"}
              onClick$={props.onSubmit$}
            >
              Create Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Overview View
// ──────────────────────────────────────────────────────────

const OverviewView = component$<{
  state: AppState & { showCompleted: boolean; focusDate: string; coachDismissed: boolean };
  onOpenGoal$: (id: string) => void;
  onOpenGoalForm$: () => void;
  persist$: () => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
}>((props) => {
  const { state } = props;
  const active = sortedActiveGoals(state.goals);
  const completed = state.goals.filter((g) => g.completed);
  const todaySteps = getTodayFocusSteps(state.goals, state.focusDate);
  const listRef = useSignal<HTMLDivElement>();
  useAutoList(listRef);

  return (
    <div class="flex flex-col gap-6">
      <TodayFocusPanel
        state={state}
        todaySteps={todaySteps}
        persist$={props.persist$}
        toggleFocusStep$={props.toggleFocusStep$}
      />

      <LiveEventPanel />

      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 style="font-size:1.3rem;color:var(--color-text-primary)">Goals</h2>
          <button class="btn-primary" onClick$={props.onOpenGoalForm$}><Icon name="plus" /> + New Goal</button>
        </div>

        {active.length === 0 ? (
          <div class="card p-10 text-center">
            <p class="text-lg mb-2" style="color:var(--color-text-secondary);font-family:'Fraunces','Georgia',serif">
              Set your first goal to start building a path
            </p>
            <p class="text-sm mb-4" style="color:var(--color-text-secondary)">
              A goal becomes a roadmap: add milestones, then the small steps that move each one forward.
            </p>
            <button class="btn-primary" onClick$={props.onOpenGoalForm$}><Icon name="plus" /> + New Goal</button>
            {!state.coachDismissed && (
              <div class="coachmark mt-5 text-left feedback-in" role="note">
                <div class="flex items-start justify-between gap-3">
                  <p class="text-sm" style="color:var(--color-text-primary)">
                    <strong style="color:var(--color-accent)">Tip:</strong> create a goal, then open it and use{" "}
                    <em>+ Add Milestone</em> to lay out the path. Star up to three steps as <em>Today's Focus</em> to
                    see them in one panel with a live velocity gauge.
                  </p>
                  <button class="btn-secondary text-xs flex-shrink-0" aria-label="Dismiss coaching tip" onClick$={() => { state.coachDismissed = true; }}>
                    <Icon name="close" /> Got it
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div ref={listRef} class="flex flex-col gap-3">
            {active.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                state={state}
                onOpen$={() => props.onOpenGoal$(goal.id)}
                persist$={props.persist$}
              />
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div class="mt-2">
          <button
            class="btn-secondary w-full justify-center"
            aria-expanded={state.showCompleted ? "true" : "false"}
            onClick$={() => { state.showCompleted = !state.showCompleted; props.persist$(); }}
          >
            {state.showCompleted ? "Hide" : "Show"} Completed Goals ({completed.length})
          </button>
          {state.showCompleted && (
            <div class="flex flex-col gap-3 mt-3">
              {completed.map((goal) => (
                <CompletedGoalCard
                  key={goal.id}
                  goal={goal}
                  state={state}
                  persist$={props.persist$}
                  onOpen$={() => props.onOpenGoal$(goal.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Today's Focus Panel (complementary landmark + velocity gauge)
// ──────────────────────────────────────────────────────────

const TodayFocusPanel = component$<{
  state: AppState & { focusDate: string };
  todaySteps: ReturnType<typeof getTodayFocusSteps>;
  persist$: () => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
}>((props) => {
  const { todaySteps } = props;
  if (todaySteps.length === 0) return null;
  const completedToday = todaySteps.filter((s) => s.completed).length;
  const deg = Math.round((completedToday / MAX_FOCUS_STEPS) * 360);

  return (
    <aside class="card p-4 fade-in" style="border-left:4px solid var(--color-accent)" aria-label="Today's Focus">
      <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 class="font-semibold" style="color:#92400e;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.05em">
          Today's Focus
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold" style="color:#92400e">
            Daily Velocity: {completedToday} of {MAX_FOCUS_STEPS}
          </span>
          <div class="velocity-gauge" style={`--g:${deg}deg`} role="img" aria-label={`Daily velocity ${completedToday} of ${MAX_FOCUS_STEPS}`}>
            <span>{completedToday}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        {todaySteps.map((item) => (
          <div key={item.stepId} class="flex items-center gap-2 p-2 rounded-lg" style="background:#fef9f0">
            <input
              type="checkbox"
              aria-label={`Quick-complete focused step: ${item.stepTitle}`}
              checked={item.completed}
              onChange$={() => {
                const goal = props.state.goals.find((g) => g.id === item.goalId);
                if (!goal) return;
                const m = goal.milestones.find((m) => m.id === item.milestoneId);
                if (!m) return;
                const s = m.steps.find((s) => s.id === item.stepId);
                if (!s) return;
                setStepCompleted(s, !s.completed);
                m.completed = checkMilestoneAutoComplete(m);
                props.persist$();
              }}
            />
            <div class="flex-1 min-w-0">
              <p class={`text-sm ${item.completed ? "line-through" : ""}`} style="color:var(--color-text-primary)">
                {item.completed ? <Icon name="check" /> : null} {item.stepTitle}
              </p>
              <p class="text-xs" style="color:var(--color-text-secondary)">
                {item.goalTitle} › {item.milestoneTitle}
              </p>
            </div>
            <div class="w-2 h-2 rounded-full flex-shrink-0" style={`background:${item.accentColor}`} aria-hidden="true" />
          </div>
        ))}
      </div>
    </aside>
  );
});

// ──────────────────────────────────────────────────────────
// Live Activity Stream (deterministic local event simulation)
// ──────────────────────────────────────────────────────────

type StreamStatus = "ready" | "active" | "paused" | "disconnected" | "replaying" | "caught-up";

const STREAM_STATUS_LABEL: Record<StreamStatus, string> = {
  ready: "Ready",
  active: "Active",
  paused: "Paused",
  disconnected: "Disconnected",
  replaying: "Replaying",
  "caught-up": "Caught up",
};

const LIVE_EVENTS = [
  { id: "focus-evt-001", logicalTime: 1 },
  { id: "focus-evt-002", logicalTime: 2 },
  { id: "focus-evt-003", logicalTime: 3 },
] as const;
const OUT_OF_ORDER_EVENT = LIVE_EVENTS[2];

const LiveEventPanel = component$(() => {
  const live = useStore<{
    status: StreamStatus;
    processedIds: string[];
    queuedIds: string[];
    feedback: string;
    reconnectTimer: number;
  }>({
    status: "ready",
    processedIds: [],
    queuedIds: [],
    feedback: "Stream ready. Press Start to begin.",
    reconnectTimer: 0,
  });

  return (
    <aside class="card p-4 fade-in" aria-label="Live activity stream">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 style="font-size:1rem;color:var(--color-text-primary)">Live activity stream</h2>
          <p class="text-xs mt-1" style="color:var(--color-text-secondary)">
            A local, deterministic event feed — no network access.
          </p>
        </div>
        <span class={`stream-status status-${live.status}`} role="status" aria-live="polite">
          {STREAM_STATUS_LABEL[live.status]}
        </span>
      </div>

      <div class="flex gap-4 mb-3 text-xs" style="color:var(--color-text-secondary)">
        <span>Applied: <strong style="color:var(--color-text-primary)">{live.processedIds.length}</strong> of {LIVE_EVENTS.length}</span>
        <span>Queued: <strong style="color:var(--color-text-primary)">{live.queuedIds.length}</strong></span>
      </div>

      <div class="flex gap-2 flex-wrap mb-2">
        <button
          id="fp-live-start"
          class="btn-primary"
          onClick$={() => {
            live.status = "active";
            const first = LIVE_EVENTS[0];
            if (live.processedIds.includes(first.id)) { live.feedback = "Stream active; no new event to apply."; return; }
            live.processedIds.push(first.id);
            const qIdx = live.queuedIds.indexOf(first.id);
            if (qIdx !== -1) live.queuedIds.splice(qIdx, 1);
            live.feedback = `${first.id} applied (logical time ${first.logicalTime}).`;
          }}
        >
          Start
        </button>
        <button id="fp-live-pause" class="btn-secondary" onClick$={() => { live.status = "paused"; live.feedback = "Processing paused; values are unchanged."; }}>
          Pause
        </button>
        <button id="fp-live-disconnect" class="btn-secondary" onClick$={() => { live.status = "disconnected"; live.feedback = "Stream disconnected; new events will queue."; }}>
          Disconnect
        </button>
        <button
          id="fp-live-deliver"
          class="btn-secondary"
          onClick$={() => {
            const evt = OUT_OF_ORDER_EVENT;
            if (live.status === "paused" || live.status === "disconnected") {
              if (!live.processedIds.includes(evt.id) && !live.queuedIds.includes(evt.id)) live.queuedIds.push(evt.id);
              live.feedback = `${evt.id} queued while ${live.status}.`;
              return;
            }
            if (live.processedIds.includes(evt.id)) { live.feedback = `${evt.id} ignored as a duplicate.`; return; }
            live.status = "active";
            live.processedIds.push(evt.id);
            const qIdx = live.queuedIds.indexOf(evt.id);
            if (qIdx !== -1) live.queuedIds.splice(qIdx, 1);
            live.feedback = `${evt.id} delivered out of order and resolved by logical time ${evt.logicalTime}.`;
          }}
        >
          Deliver Out of Order
        </button>
        <button
          id="fp-live-reconnect"
          class="btn-secondary"
          onClick$={() => {
            window.clearTimeout(live.reconnectTimer);
            live.status = "replaying";
            live.feedback = "Reconnected; replaying any missed events once.";
            live.reconnectTimer = window.setTimeout(() => {
              for (const evt of LIVE_EVENTS) if (!live.processedIds.includes(evt.id)) live.processedIds.push(evt.id);
              live.queuedIds = [];
              live.status = "caught-up";
              live.feedback = "Caught up — every event ID applied exactly once.";
            }, 400);
          }}
        >
          Reconnect
        </button>
      </div>

      <p class="text-xs mb-2" role="status" aria-live="polite" style="color:var(--color-text-secondary)">
        {live.feedback}
      </p>

      <div class="flex flex-col gap-1" aria-label="Applied event ledger, ordered by logical time">
        {LIVE_EVENTS.filter((e) => live.processedIds.includes(e.id))
          .slice()
          .sort((a, b) => a.logicalTime - b.logicalTime)
          .map((e) => (
            <span key={e.id} class="text-xs" style="color:var(--color-text-secondary);font-family:'SFMono-Regular',monospace">
              {e.id} · logical time {e.logicalTime}
            </span>
          ))}
      </div>
    </aside>
  );
});

// ──────────────────────────────────────────────────────────
// Goal Card (overview)
// ──────────────────────────────────────────────────────────

const GoalCard = component$<{
  goal: Goal;
  state: AppState & { goals: Goal[] };
  onOpen$: () => void;
  persist$: () => void;
}>((props) => {
  const { goal } = props;
  const prog = computeProgress(goal);
  const stalled = isStalled(goal);
  const deleteStore = useStore({ confirming: false });

  return (
    <div
      class="card p-4 cursor-pointer transition-shadow hover:shadow-md"
      style={`border-left:4px solid ${goal.accentColor}`}
      role="button"
      tabIndex={0}
      aria-label={`Open goal: ${goal.title}, ${prog.pct}% complete`}
      onClick$={props.onOpen$}
      onKeyDown$={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onOpen$(); }
      }}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 style="font-size:1.1rem;color:var(--color-text-primary);font-family:'Fraunces','Georgia',serif">
              {goal.title}
            </h3>
            {stalled && <span class="badge-warning"><Icon name="flag" /> Needs Attention</span>}
          </div>
          {goal.targetDate && (
            <p class="mt-0.5" style="font-family:'SFMono-Regular',monospace;font-size:0.75rem;color:var(--color-text-secondary)">
              Target: {goal.targetDate}
            </p>
          )}
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-sm font-semibold" style="color:var(--color-primary)">{prog.pct}%</span>
          {deleteStore.confirming ? (
            <div class="flex items-center gap-1" onClick$={(e) => e.stopPropagation()} onKeyDown$={(e) => e.stopPropagation()}>
              <span class="text-xs" style="color:var(--color-error)">Delete?</span>
              <button
                class="btn-danger"
                aria-label={`Confirm delete goal ${goal.title}`}
                onClick$={(e) => {
                  e.stopPropagation();
                  const idx = props.state.goals.findIndex((g) => g.id === goal.id);
                  if (idx !== -1) props.state.goals.splice(idx, 1);
                  props.persist$();
                }}
              >
                Yes
              </button>
              <button class="btn-secondary text-xs px-2 py-1" onClick$={(e) => { e.stopPropagation(); deleteStore.confirming = false; }}>
                No
              </button>
            </div>
          ) : (
            <button
              class="btn-danger"
              aria-label={`Delete goal ${goal.title}`}
              onClick$={(e) => { e.stopPropagation(); deleteStore.confirming = true; }}
            >
              <Icon name="trash" /> Delete
            </button>
          )}
        </div>
      </div>
      <div class="mt-3 progress-bar-bg" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.title} completion`}>
        <div class="progress-bar-fill" style={`width:${prog.pct}%`} />
      </div>
      <p class="text-xs mt-1" style="color:var(--color-text-secondary)">
        {prog.completed} of {prog.total} steps completed
      </p>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Completed Goal Card (read-only path entry)
// ──────────────────────────────────────────────────────────

const CompletedGoalCard = component$<{
  goal: Goal;
  state: AppState & { goals: Goal[] };
  persist$: () => void;
  onOpen$: () => void;
}>((props) => {
  const { goal } = props;
  const deleteStore = useStore({ confirming: false });

  return (
    <div
      class="card p-4 opacity-80 cursor-pointer transition-shadow hover:shadow-md"
      style={`border-left:4px solid ${goal.accentColor}`}
      role="button"
      tabIndex={0}
      aria-label={`View completed goal: ${goal.title}`}
      onClick$={props.onOpen$}
      onKeyDown$={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onOpen$(); } }}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 style="font-size:1.05rem;font-family:'Fraunces','Georgia',serif">{goal.title}</h3>
            <span class="badge-success"><Icon name="check" /> Complete</span>
          </div>
          {goal.completedAt && (
            <p class="text-xs mt-0.5" style="font-family:'SFMono-Regular',monospace;color:var(--color-text-secondary)">
              Completed: {goal.completedAt.slice(0, 10)}
            </p>
          )}
        </div>
        {deleteStore.confirming ? (
          <div class="flex items-center gap-1" onClick$={(e) => e.stopPropagation()} onKeyDown$={(e) => e.stopPropagation()}>
            <span class="text-xs" style="color:var(--color-error)">Delete?</span>
            <button
              class="btn-danger"
              aria-label={`Confirm delete completed goal ${goal.title}`}
              onClick$={(e) => {
                e.stopPropagation();
                const idx = props.state.goals.findIndex((g) => g.id === goal.id);
                if (idx !== -1) props.state.goals.splice(idx, 1);
                props.persist$();
              }}
            >
              Yes
            </button>
            <button class="btn-secondary text-xs px-2 py-1" onClick$={(e) => { e.stopPropagation(); deleteStore.confirming = false; }}>
              No
            </button>
          </div>
        ) : (
          <button
            class="btn-danger"
            aria-label={`Delete completed goal ${goal.title}`}
            onClick$={(e) => { e.stopPropagation(); deleteStore.confirming = true; }}
          >
            <Icon name="trash" /> Delete
          </button>
        )}
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Detail View
// ──────────────────────────────────────────────────────────

const DetailView = component$<{
  state: AppState & { goals: Goal[]; focusDate: string; scrollMilestoneId: string };
  goal: Goal;
  persist$: () => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
  flashNote$: (msg: string) => void;
}>((props) => {
  const { goal } = props;
  const prog = computeProgress(goal);
  const stalled = isStalled(goal);
  const activeIdx = getActiveMilestoneIndex(goal);
  const editStore = useStore({
    editingTitle: false,
    editingDate: false,
    editingMotivation: false,
    titleDraft: goal.title,
    dateDraft: goal.targetDate,
    motivationDraft: goal.motivation,
    showAddMilestone: false,
    newMilestoneTitle: "",
    newMilestoneDate: "",
    milestoneError: "",
    markCompleteConfirm: false,
    focusLimitMsg: "",
  });

  const todaySteps = getTodayFocusSteps(props.state.goals, props.state.focusDate);
  const hasFocus = todaySteps.length > 0;
  const readonly = goal.completed;

  // Scroll a milestone into view after a command-palette jump.
  useVisibleTask$(({ track }) => {
    const target = track(() => props.state.scrollMilestoneId);
    if (!target) return;
    const el = document.getElementById(`milestone-${target}`);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    props.state.scrollMilestoneId = "";
  });

  return (
    <div class="fade-in">
      {/* Goal header — full width above the path/focus columns */}
      <div class="card p-5 mb-6" style={`border-left:4px solid ${goal.accentColor}`}>
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            {editStore.editingTitle && !readonly ? (
              <div class="flex gap-2 items-center">
                <label class="sr-only" for="detail-title">Goal title</label>
                <input
                  id="detail-title"
                  type="text"
                  maxLength={80}
                  value={editStore.titleDraft}
                  onInput$={(e) => { editStore.titleDraft = (e.target as HTMLInputElement).value; }}
                  style="font-size:1.4rem;font-family:'Fraunces','Georgia',serif;font-weight:600"
                />
                <button class="btn-primary text-sm" onClick$={() => {
                  const e = titleError(editStore.titleDraft, "Goal title", 80);
                  if (e) return;
                  goal.title = editStore.titleDraft.trim();
                  editStore.editingTitle = false;
                  props.persist$();
                }}>Save</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.editingTitle = false; }}>Cancel</button>
              </div>
            ) : (
              <h2 style="margin:0">
                {readonly ? (
                  <span class="inline-title" style="font-size:1.6rem" aria-disabled="true">{goal.title}</span>
                ) : (
                  <button
                    class="inline-title"
                    style="font-size:1.6rem"
                    aria-label="Edit goal title"
                    onClick$={() => { editStore.titleDraft = goal.title; editStore.editingTitle = true; }}
                  >
                    {goal.title} <Icon name="edit" />
                  </button>
                )}
              </h2>
            )}

            {editStore.editingDate && !readonly ? (
              <div class="flex gap-2 items-center mt-1">
                <label class="sr-only" for="detail-date">Target date</label>
                <input
                  id="detail-date"
                  type="date"
                  min={MIN_TARGET_DATE}
                  max={MAX_TARGET_DATE}
                  value={editStore.dateDraft}
                  onInput$={(e) => { editStore.dateDraft = (e.target as HTMLInputElement).value; }}
                  style="width:auto"
                />
                <button class="btn-primary text-sm" onClick$={() => {
                  const e = dateError(editStore.dateDraft, "Target date");
                  if (e) return;
                  goal.targetDate = editStore.dateDraft;
                  editStore.editingDate = false;
                  props.persist$();
                }}>Save</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.editingDate = false; }}>Cancel</button>
              </div>
            ) : (
              <p class="mt-1" style="font-family:'SFMono-Regular',monospace;font-size:0.75rem;color:var(--color-text-secondary)">
                {readonly ? (
                  goal.targetDate ? `Target: ${goal.targetDate}` : "No target date"
                ) : (
                  <button class="inline-text" style="font-family:'SFMono-Regular',monospace;font-size:0.75rem" aria-label="Edit target date" onClick$={() => { editStore.dateDraft = goal.targetDate; editStore.editingDate = true; }}>
                    {goal.targetDate ? `Target: ${goal.targetDate}` : "Add target date…"} <Icon name="edit" />
                  </button>
                )}
              </p>
            )}

            {stalled && (
              <div class="mt-2 flex items-center gap-2">
                <span class="badge-warning"><Icon name="flag" /> Needs Attention</span>
                <span class="text-xs" style="color:#92400e">No progress in over 7 days — complete a step to clear.</span>
              </div>
            )}
          </div>

          <div class="flex flex-col items-end gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xl" style="color:var(--color-primary)">{prog.pct}%</span>
            </div>
            <div class="w-32 progress-bar-bg" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Goal completion">
              <div class="progress-bar-fill" style={`width:${prog.pct}%`} />
            </div>
            <p class="text-xs" style="color:var(--color-text-secondary)">{prog.completed}/{prog.total} steps</p>
            <span class="text-xs flex items-center gap-1" style="color:var(--color-text-secondary)">
              <span class="w-3 h-3 rounded-full inline-block" style={`background:${goal.accentColor}`} aria-hidden="true" />
              {ACCENT_COLORS.find((c) => c.value === goal.accentColor)?.label ?? "Accent"}
            </span>
          </div>
        </div>

        {/* Motivation note */}
        <div class="mt-3 pt-3" style="border-top:1px solid #e5e7eb">
          {editStore.editingMotivation && !readonly ? (
            <div class="flex gap-2 items-start">
              <label class="sr-only" for="detail-motivation">Why this matters</label>
              <textarea
                id="detail-motivation"
                rows={2}
                maxLength={280}
                value={editStore.motivationDraft}
                onInput$={(e) => { editStore.motivationDraft = (e.target as HTMLTextAreaElement).value; }}
                style="flex:1;resize:vertical"
              />
              <div class="flex flex-col gap-1">
                <button class="btn-primary text-sm" onClick$={() => {
                  if (editStore.motivationDraft.trim().length > 280) return;
                  goal.motivation = editStore.motivationDraft.trim();
                  editStore.editingMotivation = false;
                  props.persist$();
                }}>Save</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.editingMotivation = false; }}>Cancel</button>
              </div>
            </div>
          ) : (
            <p class="text-sm italic" style="color:var(--color-text-secondary)">
              {readonly ? (
                goal.motivation || "No motivation note."
              ) : (
                <button class="inline-text text-sm italic" style="color:var(--color-text-secondary)" aria-label="Edit motivation note" onClick$={() => { editStore.motivationDraft = goal.motivation; editStore.editingMotivation = true; }}>
                  {goal.motivation || "Why does this matter to you? Click to add…"} {!goal.motivation ? <Icon name="edit" /> : null}
                </button>
              )}
            </p>
          )}
        </div>

        {/* Mark complete */}
        {prog.pct === 100 && !goal.completed && (
          <div class="mt-3 pt-3" style="border-top:1px solid #e5e7eb">
            {editStore.markCompleteConfirm ? (
              <div class="flex items-center gap-2 feedback-in">
                <span class="text-sm" style="color:var(--color-text-primary)">Mark this goal as complete?</span>
                <button class="btn-primary text-sm" onClick$={() => {
                  goal.completed = true;
                  goal.completedAt = new Date().toISOString();
                  props.state.showCompleted = true;
                  props.persist$();
                  void props.flashNote$(`Goal "${goal.title}" marked complete.`);
                  props.state.view = "overview";
                  props.state.activeGoalId = "";
                }}>Yes, complete!</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.markCompleteConfirm = false; }}>Cancel</button>
              </div>
            ) : (
              <button class="btn-primary" onClick$={() => { editStore.markCompleteConfirm = true; }}>
                <Icon name="check" /> Mark Goal Complete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Path + Focus columns: side by side at >=1024px, stacked (focus below) on mobile */}
      <div class={hasFocus ? "detail-cols detail-cols--two" : "detail-cols"}>
        <section aria-label="Milestone path">
          <div class="flex items-center justify-between mb-4">
            <h2 style="font-size:1.2rem;color:var(--color-text-primary)">Milestones</h2>
            {!readonly && (
              <button class="btn-primary" onClick$={() => {
                editStore.showAddMilestone = !editStore.showAddMilestone;
                editStore.newMilestoneTitle = "";
                editStore.newMilestoneDate = "";
                editStore.milestoneError = "";
              }}>
                <Icon name="plus" /> + Add Milestone
              </button>
            )}
          </div>

          {editStore.showAddMilestone && !readonly && (
            <div class="card p-4 mb-4 modal-enter">
              <p class="text-sm font-semibold mb-2" style="color:var(--color-text-secondary)">New milestone</p>
              <div class="flex flex-col gap-2">
                <div>
                  <label class="block text-xs mb-1" for="new-milestone-title" style="color:var(--color-text-secondary)">Milestone title</label>
                  <input
                    id="new-milestone-title"
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Record first episode"
                    value={editStore.newMilestoneTitle}
                    aria-invalid={editStore.milestoneError ? "true" : "false"}
                    onInput$={(e) => { editStore.newMilestoneTitle = (e.target as HTMLInputElement).value; }}
                  />
                </div>
                <div>
                  <label class="block text-xs mb-1" for="new-milestone-date" style="color:var(--color-text-secondary)">Target date</label>
                  <input
                    id="new-milestone-date"
                    type="date"
                    min={MIN_TARGET_DATE}
                    max={MAX_TARGET_DATE}
                    value={editStore.newMilestoneDate}
                    onInput$={(e) => { editStore.newMilestoneDate = (e.target as HTMLInputElement).value; }}
                  />
                </div>
                {editStore.milestoneError && (
                  <p class="text-sm feedback-in" role="alert" style="color:var(--color-error)">{editStore.milestoneError}</p>
                )}
                <div class="flex gap-2">
                  <button class="btn-primary" onClick$={() => {
                    const te = titleError(editStore.newMilestoneTitle, "Milestone title", 80);
                    if (te) { editStore.milestoneError = te; return; }
                    const de = dateError(editStore.newMilestoneDate, "Milestone target date");
                    if (de) { editStore.milestoneError = de; return; }
                    const m = createMilestone({ id: uid(), title: editStore.newMilestoneTitle.trim(), targetDate: editStore.newMilestoneDate });
                    goal.milestones.push(m);
                    editStore.showAddMilestone = false;
                    props.persist$();
                  }}>Add</button>
                  <button class="btn-secondary" onClick$={() => { editStore.showAddMilestone = false; }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {goal.milestones.length === 0 ? (
            <div class="card p-10 text-center">
              <p style="color:var(--color-text-secondary);font-family:'Fraunces','Georgia',serif">
                Add your first milestone to build this path
              </p>
              <p class="text-xs mt-1" style="color:var(--color-text-secondary)">
                Milestones are the big beats; steps are the small moves that complete each one.
              </p>
            </div>
          ) : (
            <MilestonePath
              goal={goal}
              activeIdx={activeIdx}
              state={props.state}
              persist$={props.persist$}
              onFocusLimit$={(msg: string) => { editStore.focusLimitMsg = msg; }}
              toggleFocusStep$={props.toggleFocusStep$}
              readonly={readonly}
            />
          )}
        </section>

        {hasFocus && (
          <div>
            {editStore.focusLimitMsg && (
              <div class="mb-3 p-3 rounded-lg text-sm feedback-in" role="status" aria-live="polite" style="background:#fef3c7;color:#92400e;border:1px solid var(--color-warning)">
                {editStore.focusLimitMsg}
                <button class="ml-3 btn-secondary text-xs" onClick$={() => { editStore.focusLimitMsg = ""; }}>Dismiss</button>
              </div>
            )}
            <TodayFocusPanel
              state={props.state}
              todaySteps={todaySteps}
              persist$={props.persist$}
              toggleFocusStep$={props.toggleFocusStep$}
            />
          </div>
        )}
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Milestone Path (vertical timeline on mobile, horizontal roadmap on desktop)
// ──────────────────────────────────────────────────────────

const MilestonePath = component$<{
  goal: Goal;
  activeIdx: number;
  state: AppState & { goals: Goal[]; focusDate: string };
  persist$: () => void;
  onFocusLimit$: (msg: string) => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
  readonly: boolean;
}>((props) => {
  const { goal } = props;
  const pathRef = useSignal<HTMLDivElement>();
  useAutoList(pathRef);

  const connectorStyle = (idx: number) => {
    const m = goal.milestones[idx];
    if (m.completed) return "background:var(--color-success)";
    if (idx === props.activeIdx) return "background:var(--color-accent)";
    return "background:repeating-linear-gradient(to bottom,#d1d5db 0,#d1d5db 6px,transparent 6px,transparent 12px)";
  };
  const connectorStyleH = (idx: number) => {
    const m = goal.milestones[idx];
    if (m.completed) return "background:var(--color-success)";
    if (idx === props.activeIdx) return "background:var(--color-accent)";
    return "background:repeating-linear-gradient(to right,#d1d5db 0,#d1d5db 6px,transparent 6px,transparent 12px)";
  };

  return (
    <div ref={pathRef} class="milestone-path">
      {goal.milestones.map((milestone, idx) => {
        const nodeState = milestone.completed ? "completed" : idx === props.activeIdx ? "active" : "upcoming";
        const isLast = idx === goal.milestones.length - 1;
        return (
          <div key={milestone.id} id={`milestone-${milestone.id}`} class="ms-item" style="scroll-margin-top:5rem">
            <div class="ms-node-col">
              <div
                class={`milestone-node ${nodeState} ${milestone.completed ? "node-animate" : ""}`}
                tabIndex={0}
                role="button"
                aria-label={`Milestone ${idx + 1}: ${milestone.title}${milestone.completed ? " (completed)" : idx === props.activeIdx ? " (active)" : " (upcoming)"}`}
              >
                {milestone.completed ? <Icon name="check" /> : idx + 1}
              </div>
              {!isLast && <div class="ms-connector-v" style={connectorStyle(idx)} aria-hidden="true" />}
              {!isLast && <div class="ms-connector-h" style={connectorStyleH(idx)} aria-hidden="true" />}
            </div>
            <div class="ms-card">
              <MilestoneCard
                goal={goal}
                milestone={milestone}
                milestoneIdx={idx}
                nodeState={nodeState}
                state={props.state}
                persist$={props.persist$}
                onFocusLimit$={props.onFocusLimit$}
                toggleFocusStep$={props.toggleFocusStep$}
                readonly={props.readonly}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Milestone Card
// ──────────────────────────────────────────────────────────

const MilestoneCard = component$<{
  goal: Goal;
  milestone: Milestone;
  milestoneIdx: number;
  nodeState: string;
  state: AppState & { goals: Goal[]; focusDate: string };
  persist$: () => void;
  onFocusLimit$: (msg: string) => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
  readonly: boolean;
}>((props) => {
  const { goal, milestone, milestoneIdx } = props;
  const local = useStore({
    editingTitle: false,
    titleDraft: milestone.title,
    editingDate: false,
    dateDraft: milestone.targetDate,
    newStepTitle: "",
    deleteConfirm: false,
    addingStep: false,
    stepError: "",
  });
  const stepsRef = useSignal<HTMLDivElement>();
  useAutoList(stepsRef);

  const borderColor = props.nodeState === "completed" ? "var(--color-success)" : props.nodeState === "active" ? "var(--color-accent)" : "#e5e7eb";
  const isEarlierComplete = milestoneIdx > 0 && goal.milestones.slice(0, milestoneIdx).some((m) => m.completed);
  const canMoveUp = milestoneIdx > 0 && !milestone.completed && !goal.milestones[milestoneIdx - 1]?.completed;
  const canMoveDown = milestoneIdx < goal.milestones.length - 1 && !milestone.completed && !goal.milestones[milestoneIdx + 1]?.completed;

  return (
    <div class="card p-4" style={`border-left:3px solid ${borderColor}`}>
      <div class="flex items-start gap-2 justify-between flex-wrap">
        <div class="flex-1 min-w-0">
          {local.editingTitle && !props.readonly ? (
            <div class="flex gap-2 items-center">
              <label class="sr-only" for={`ms-title-${milestone.id}`}>Milestone title</label>
              <input
                id={`ms-title-${milestone.id}`}
                type="text"
                maxLength={80}
                value={local.titleDraft}
                onInput$={(e) => { local.titleDraft = (e.target as HTMLInputElement).value; }}
                style="font-size:1rem"
              />
              <button class="btn-primary text-xs" onClick$={() => {
                const e = titleError(local.titleDraft, "Milestone title", 80);
                if (e) return;
                milestone.title = local.titleDraft.trim();
                local.editingTitle = false;
                props.persist$();
              }}>Save</button>
              <button class="btn-secondary text-xs" onClick$={() => { local.editingTitle = false; }}>Cancel</button>
            </div>
          ) : (
            <h3 style="margin:0">
              {props.readonly ? (
                <span class="inline-title" style="font-size:1.05rem">{milestone.title}</span>
              ) : (
                <button class="inline-title" style="font-size:1.05rem" aria-label={`Edit milestone title: ${milestone.title}`} onClick$={() => { local.titleDraft = milestone.title; local.editingTitle = true; }}>
                  {milestone.title} <Icon name="edit" />
                </button>
              )}
            </h3>
          )}

          {local.editingDate && !props.readonly ? (
            <div class="flex gap-2 items-center mt-1">
              <label class="sr-only" for={`ms-date-${milestone.id}`}>Milestone target date</label>
              <input
                id={`ms-date-${milestone.id}`}
                type="date"
                min={MIN_TARGET_DATE}
                max={MAX_TARGET_DATE}
                value={local.dateDraft}
                onInput$={(e) => { local.dateDraft = (e.target as HTMLInputElement).value; }}
                style="width:auto"
              />
              <button class="btn-primary text-xs" onClick$={() => {
                const e = dateError(local.dateDraft, "Milestone target date");
                if (e) return;
                milestone.targetDate = local.dateDraft;
                local.editingDate = false;
                props.persist$();
              }}>Save</button>
              <button class="btn-secondary text-xs" onClick$={() => { local.editingDate = false; }}>Cancel</button>
            </div>
          ) : (
            <p class="text-xs mt-0.5" style="font-family:'SFMono-Regular',monospace;color:var(--color-text-secondary)">
              {props.readonly ? (
                milestone.targetDate ? `Target: ${milestone.targetDate}` : "No target date"
              ) : (
                <button class="inline-text text-xs" style="font-family:'SFMono-Regular',monospace" aria-label="Edit milestone target date" onClick$={() => { local.dateDraft = milestone.targetDate; local.editingDate = true; }}>
                  {milestone.targetDate ? `Target: ${milestone.targetDate}` : "Add target date…"} <Icon name="edit" />
                </button>
              )}
            </p>
          )}
        </div>

        {/* Controls */}
        <div class="flex items-center gap-1 flex-shrink-0">
          {!props.readonly && (
            <>
              <button
                class="btn-secondary text-xs px-1.5 py-0.5"
                aria-label={`Move milestone ${milestone.title} earlier`}
                disabled={!canMoveUp}
                title={isEarlierComplete || milestone.completed ? "Reordering disabled" : "Move up"}
                onClick$={() => {
                  if (!canMoveUp) return;
                  const temp = goal.milestones[milestoneIdx - 1];
                  goal.milestones[milestoneIdx - 1] = milestone;
                  goal.milestones[milestoneIdx] = temp;
                  props.persist$();
                }}
              >
                <Icon name="up" />
              </button>
              <button
                class="btn-secondary text-xs px-1.5 py-0.5"
                aria-label={`Move milestone ${milestone.title} later`}
                disabled={!canMoveDown}
                title="Move down"
                onClick$={() => {
                  if (!canMoveDown) return;
                  const temp = goal.milestones[milestoneIdx + 1];
                  goal.milestones[milestoneIdx + 1] = milestone;
                  goal.milestones[milestoneIdx] = temp;
                  props.persist$();
                }}
              >
                <Icon name="down" />
              </button>
            </>
          )}

          {local.deleteConfirm ? (
            <div class="flex items-center gap-1">
              <span class="text-xs" style="color:var(--color-error)">Delete?</span>
              <button class="btn-danger text-xs" aria-label={`Confirm delete milestone ${milestone.title}`} onClick$={() => {
                const idx = goal.milestones.findIndex((m) => m.id === milestone.id);
                if (idx !== -1) goal.milestones.splice(idx, 1);
                props.persist$();
              }}>Yes</button>
              <button class="btn-secondary text-xs px-2 py-0.5" onClick$={() => { local.deleteConfirm = false; }}>No</button>
            </div>
          ) : (
            !props.readonly && (
              <button class="btn-danger" aria-label={`Delete milestone ${milestone.title}`} onClick$={() => { local.deleteConfirm = true; }}>
                <Icon name="trash" /> Delete
              </button>
            )
          )}
        </div>
      </div>

      {/* Reorder disabled note */}
      {!props.readonly && milestone.completed && (
        <p class="text-xs mt-1" style="color:var(--color-text-secondary)">Reordering disabled — this milestone is complete</p>
      )}
      {!props.readonly && !milestone.completed && isEarlierComplete && (
        <p class="text-xs mt-1" style="color:var(--color-text-secondary)">Reordering disabled — an earlier milestone is complete</p>
      )}

      {/* Steps */}
      <div class="mt-3">
        {milestone.steps.length === 0 && !props.readonly ? (
          <p class="text-sm italic" style="color:var(--color-text-secondary)">Add a step to make progress</p>
        ) : (
          <div ref={stepsRef} class="flex flex-col gap-1">
            {milestone.steps.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                goal={goal}
                milestone={milestone}
                state={props.state}
                persist$={props.persist$}
                onFocusLimit$={props.onFocusLimit$}
                toggleFocusStep$={props.toggleFocusStep$}
                readonly={props.readonly}
              />
            ))}
          </div>
        )}

        {!props.readonly && (
          <div class="mt-2">
            {local.addingStep ? (
              <div class="flex gap-2 items-center flex-wrap modal-enter">
                <label class="text-xs flex-shrink-0" for={`new-step-${milestone.id}`} style="color:var(--color-text-secondary)">Step title</label>
                <input
                  id={`new-step-${milestone.id}`}
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Practice scales for 15 minutes"
                  value={local.newStepTitle}
                  aria-invalid={local.stepError ? "true" : "false"}
                  onInput$={(e) => { local.newStepTitle = (e.target as HTMLInputElement).value; }}
                  onKeyDown$={(e) => {
                    if (e.key === "Enter") {
                      const te = titleError(local.newStepTitle, "Step title", 120);
                      if (te) { local.stepError = te; return; }
                      const s = createStep({ id: uid(), title: local.newStepTitle.trim() });
                      milestone.steps.push(s);
                      local.newStepTitle = "";
                      local.addingStep = false;
                      local.stepError = "";
                      milestone.completed = checkMilestoneAutoComplete(milestone);
                      props.persist$();
                    }
                  }}
                />
                {local.stepError && <span class="text-xs w-full feedback-in" role="alert" style="color:var(--color-error)">{local.stepError}</span>}
                <button class="btn-primary text-sm flex-shrink-0" onClick$={() => {
                  const te = titleError(local.newStepTitle, "Step title", 120);
                  if (te) { local.stepError = te; return; }
                  const s = createStep({ id: uid(), title: local.newStepTitle.trim() });
                  milestone.steps.push(s);
                  local.newStepTitle = "";
                  local.addingStep = false;
                  local.stepError = "";
                  milestone.completed = checkMilestoneAutoComplete(milestone);
                  props.persist$();
                }}>Add</button>
                <button class="btn-secondary text-sm flex-shrink-0" onClick$={() => { local.addingStep = false; local.stepError = ""; }}>Cancel</button>
              </div>
            ) : (
              <button
                class="text-sm mt-1 inline-flex items-center gap-1"
                style="color:var(--color-primary);background:none;border:none;cursor:pointer;padding:0;font-family:inherit"
                onClick$={() => { local.addingStep = true; }}
              >
                <Icon name="plus" /> Add Step
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Step Row
// ──────────────────────────────────────────────────────────

const StepRow = component$<{
  step: ActionStep;
  goal: Goal;
  milestone: Milestone;
  state: AppState & { goals: Goal[]; focusDate: string };
  persist$: () => void;
  onFocusLimit$: (msg: string) => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
  readonly: boolean;
}>((props) => {
  const { step, goal, milestone } = props;
  const local = useStore({ editing: false, draft: step.title, deleteConfirm: false, editError: "" });
  const focusCount = countTodayFocus(props.state.goals, props.state.focusDate);

  return (
    <div class="step-row group">
      {!props.readonly && (
        <input
          type="checkbox"
          aria-label={`Mark step complete: ${step.title}`}
          checked={step.completed}
          onChange$={() => {
            setStepCompleted(step, !step.completed);
            milestone.completed = checkMilestoneAutoComplete(milestone);
            props.persist$();
          }}
        />
      )}
      {props.readonly && (
        <span aria-hidden="true" style="color:var(--color-success)">
          {step.completed ? <Icon name="check" /> : <span style="color:var(--color-text-secondary)">○</span>}
        </span>
      )}

      {local.editing && !props.readonly ? (
        <div class="flex gap-2 items-center flex-1 flex-wrap">
          <label class="sr-only" for={`step-edit-${step.id}`}>Step title</label>
          <input
            id={`step-edit-${step.id}`}
            type="text"
            maxLength={120}
            value={local.draft}
            aria-invalid={local.editError ? "true" : "false"}
            onInput$={(e) => { local.draft = (e.target as HTMLInputElement).value; }}
          />
          {local.editError && <span class="text-xs w-full feedback-in" role="alert" style="color:var(--color-error)">{local.editError}</span>}
          <button class="btn-primary text-xs flex-shrink-0" onClick$={() => {
            const te = titleError(local.draft, "Step title", 120);
            if (te) { local.editError = te; return; }
            step.title = local.draft.trim();
            local.editing = false;
            local.editError = "";
            props.persist$();
          }}>Save</button>
          <button class="btn-secondary text-xs flex-shrink-0" onClick$={() => { local.editing = false; local.editError = ""; }}>Cancel</button>
        </div>
      ) : (
        <span class="flex-1 text-sm" style={step.completed ? "color:var(--color-text-secondary)" : "color:var(--color-text-primary)"}>
          {props.readonly ? (
            <span class={step.completed ? "line-through" : ""}>{step.title}</span>
          ) : (
            <button
              class={`inline-text text-sm ${step.completed ? "line-through" : ""}`}
              style={step.completed ? "color:var(--color-text-secondary)" : "color:var(--color-text-primary)"}
              aria-label={`Edit step: ${step.title}`}
              onClick$={() => { local.draft = step.title; local.editing = true; local.editError = ""; }}
            >
              {step.title}
            </button>
          )}
        </span>
      )}

      {/* Focus today toggle */}
      {!props.readonly && !step.completed && (
        <button
          class={`focus-toggle ${step.focusToday ? "active" : ""}`}
          aria-pressed={step.focusToday ? "true" : "false"}
          aria-label={step.focusToday ? `Remove from today's focus: ${step.title}` : `Add to today's focus: ${step.title}`}
          onClick$={() => {
            if (!step.focusToday && focusCount >= MAX_FOCUS_STEPS) {
              props.onFocusLimit$("You already have 3 focus steps today. Complete or unfocus one to add another.");
              return;
            }
            props.toggleFocusStep$(goal.id, milestone.id, step.id);
          }}
        >
          <Icon name={step.focusToday ? "star" : "starOff"} /> Focus Today
        </button>
      )}

      {/* Delete */}
      {!props.readonly && (
        <>
          {local.deleteConfirm ? (
            <div class="flex items-center gap-1">
              <button class="btn-danger text-xs" aria-label={`Confirm delete step ${step.title}`} onClick$={() => {
                const idx = milestone.steps.findIndex((s) => s.id === step.id);
                if (idx !== -1) milestone.steps.splice(idx, 1);
                milestone.completed = checkMilestoneAutoComplete(milestone);
                props.persist$();
              }}>Del</button>
              <button class="btn-secondary text-xs px-1.5 py-0.5" onClick$={() => { local.deleteConfirm = false; }}>No</button>
            </div>
          ) : (
            <button
              class="btn-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-xs"
              aria-label={`Delete step ${step.title}`}
              onClick$={() => { local.deleteConfirm = true; }}
            >
              <Icon name="close" />
            </button>
          )}
        </>
      )}
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Export preview tokenizers (innovation 11.4)
// ──────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJson(text: string): string {
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],]/g;
  return text.replace(re, (m, str, colon, kw) => {
    if (str) {
      const safe = escapeHtml(str);
      return colon ? `<span class="jk">${safe}</span><span class="jp">${escapeHtml(colon)}</span>` : `<span class="js">${safe}</span>`;
    }
    if (kw) return `<span class="jb">${m}</span>`;
    if (/^-?\d/.test(m)) return `<span class="jn">${m}</span>`;
    return `<span class="jp">${escapeHtml(m)}</span>`;
  });
}

function highlightMarkdown(text: string): string {
  return escapeHtml(text)
    .split("\n")
    .map((line) => {
      if (/^#{1,6}\s/.test(line)) return `<span class="mh">${line}</span>`;
      return line
        .replace(/(\[x\])/g, '<span class="mx">$1</span>')
        .replace(/(\[ \])/g, '<span class="mu">$1</span>');
    })
    .join("\n");
}

// ──────────────────────────────────────────────────────────
// Export Drawer
// ──────────────────────────────────────────────────────────

const ExportDrawer = component$<{
  state: AppState & { exportTab: "json" | "markdown"; copyConfirm: boolean };
  onClose$: () => void;
}>((props) => {
  const { state } = props;
  const dialogRef = useSignal<HTMLDivElement>();
  const closeRef = useSignal<HTMLButtonElement>();
  useFocusTrap(dialogRef, closeRef);

  const text = state.exportTab === "json" ? buildPathPackJson(state) : buildMarkdownReport(state);
  const filename = state.exportTab === "json" ? "path-pack.json" : "progress.md";
  const mime = state.exportTab === "json" ? "application/json" : "text/markdown";
  const html = state.exportTab === "json" ? highlightJson(text) : highlightMarkdown(text);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.35)" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div ref={dialogRef} class="card w-full max-w-2xl mx-4 modal-enter" style="max-height:85vh;display:flex;flex-direction:column">
        <div class="flex items-center justify-between p-4" style="border-bottom:1px solid #e5e7eb">
          <h2 id="export-title" style="font-size:1.2rem;color:var(--color-text-primary)">Export Path Pack</h2>
          <button ref={closeRef} class="btn-secondary" aria-label="Close export" onClick$={props.onClose$}><Icon name="close" /> Close</button>
        </div>
        <div class="flex gap-2 px-4 pt-3" role="tablist" aria-label="Export format">
          <button
            role="tab"
            aria-selected={state.exportTab === "json" ? "true" : "false"}
            class={state.exportTab === "json" ? "btn-primary" : "btn-secondary"}
            onClick$={() => { state.exportTab = "json"; state.copyConfirm = false; }}
          >
            Path Pack JSON
          </button>
          <button
            role="tab"
            aria-selected={state.exportTab === "markdown" ? "true" : "false"}
            class={state.exportTab === "markdown" ? "btn-primary" : "btn-secondary"}
            onClick$={() => { state.exportTab = "markdown"; state.copyConfirm = false; }}
          >
            Markdown report
          </button>
        </div>
        <p class="px-4 pt-2 text-xs" style="color:var(--color-text-secondary)">
          Regenerated live from your current goals, milestones, steps, and Today's Focus.
        </p>
        <pre
          class={`mx-4 my-3 p-3 rounded-md ${state.exportTab === "json" ? "json-hl" : "md-hl"}`}
          aria-label="Export preview"
          style="background:#f6f5f0;overflow:auto;flex:1;white-space:pre-wrap;color:var(--color-text-primary)"
          dangerouslySetInnerHTML={html}
        />
        <div class="flex items-center gap-2 p-4" style="border-top:1px solid #e5e7eb">
          <button
            class="btn-secondary"
            onClick$={async () => {
              try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
              state.copyConfirm = true;
              setTimeout(() => { state.copyConfirm = false; }, 1800);
            }}
          >
            Copy
          </button>
          <button
            class="btn-primary"
            onClick$={() => {
              const blob = new Blob([text], { type: mime });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Download
          </button>
          {state.copyConfirm && (
            <span class="text-sm" role="status" aria-live="polite" style="color:var(--color-success)">Copied to clipboard</span>
          )}
        </div>
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Import Modal
// ──────────────────────────────────────────────────────────

const ImportModal = component$<{
  error: string;
  onValidate$: (text: string) => void;
  onCancel$: () => void;
}>((props) => {
  const local = useStore({ text: "", pendingConfirm: false, fileName: "" });
  const dialogRef = useSignal<HTMLDivElement>();
  const fileRef = useSignal<HTMLInputElement>();
  useFocusTrap(dialogRef, fileRef);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.35)" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div ref={dialogRef} class="card w-full max-w-lg mx-4 modal-enter p-5">
        <h2 id="import-title" style="font-size:1.2rem;margin-bottom:0.75rem;color:var(--color-text-primary)">Import Path Pack</h2>
        <p class="text-xs mb-3" style="color:var(--color-text-secondary)">
          Load a Path Pack JSON file (format focuspath-path-pack-v1). Importing replaces your current session.
        </p>
        <label class="block text-sm mb-1" for="import-file" style="color:var(--color-text-secondary)">Path Pack file</label>
        <input
          ref={fileRef}
          id="import-file"
          type="file"
          accept="application/json,.json"
          class="mb-3 text-sm"
          onChange$={async (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (!f) return;
            local.fileName = f.name;
            local.text = await f.text();
            local.pendingConfirm = false;
          }}
        />
        <label class="block text-sm mb-1" for="import-json" style="color:var(--color-text-secondary)">…or paste Path Pack JSON</label>
        <textarea
          id="import-json"
          rows={6}
          class="mb-2"
          style="font-family:'SFMono-Regular',monospace;font-size:0.75rem;resize:vertical"
          value={local.text}
          onInput$={(e) => { local.text = (e.target as HTMLTextAreaElement).value; local.pendingConfirm = false; }}
        />
        {props.error && (
          <p class="mb-2 text-sm feedback-in" role="alert" style="color:var(--color-error)">{props.error}</p>
        )}
        {local.pendingConfirm && (
          <div class="mb-3 p-2 rounded-md text-sm feedback-in" role="alert" style="background:#fef3c7;color:#92400e;border:1px solid var(--color-warning)">
            This will replace your current session. Confirm to continue.
          </div>
        )}
        <div class="flex gap-2 justify-end">
          <button class="btn-secondary" onClick$={props.onCancel$}>Cancel</button>
          {local.pendingConfirm ? (
            <button class="btn-primary" onClick$={() => props.onValidate$(local.text)}>Confirm Replace</button>
          ) : (
            <button class="btn-primary" onClick$={() => { local.pendingConfirm = true; }}>Import</button>
          )}
        </div>
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Command Palette
// ──────────────────────────────────────────────────────────

function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!q) return 0;
  let qi = 0;
  let score = 0;
  let lastMatch = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += lastMatch === -1 ? ti : ti - lastMatch - 1;
      lastMatch = ti;
      qi++;
    }
  }
  return qi === q.length ? score : null;
}

const CommandPalette = component$<{
  state: AppState & { paletteQuery: string; goals: Goal[] };
  onJump$: (goalId: string, milestoneId: string) => void;
  onClose$: () => void;
}>((props) => {
  const { state } = props;
  const dialogRef = useSignal<HTMLDivElement>();
  const inputRef = useSignal<HTMLInputElement>();
  useFocusTrap(dialogRef, inputRef);
  const activeIdx = useSignal(0);

  const q = state.paletteQuery.trim();
  type Row = { goalId: string; milestoneId: string; label: string; sub: string; score: number };
  const rows: Row[] = [];
  for (const g of state.goals) {
    if (g.completed) continue;
    const goalScore = fuzzyScore(q, g.title);
    if (goalScore !== null) rows.push({ goalId: g.id, milestoneId: "", label: g.title, sub: "Goal", score: goalScore });
    for (const m of g.milestones) {
      const milestoneScore = fuzzyScore(q, m.title);
      if (milestoneScore !== null) rows.push({ goalId: g.id, milestoneId: m.id, label: m.title, sub: `Milestone · ${g.title}`, score: milestoneScore });
    }
  }
  rows.sort((a, b) => a.score - b.score);
  const shown = rows.slice(0, 20);
  if (activeIdx.value >= shown.length) activeIdx.value = Math.max(0, shown.length - 1);

  return (
    <div
      class="fixed inset-0 z-50 flex items-start justify-center"
      style="background:rgba(0,0,0,0.35);padding-top:10vh"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick$={(e) => { if (e.target === e.currentTarget) props.onClose$(); }}
    >
      <div ref={dialogRef} class="card w-full max-w-lg mx-4 modal-enter" style="display:flex;flex-direction:column;max-height:70vh">
        <label class="sr-only" for="palette-input">Search goals and milestones</label>
        <input
          ref={inputRef}
          id="palette-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={shown[activeIdx.value] ? `palette-row-${activeIdx.value}` : undefined}
          placeholder="Jump to a goal or milestone…"
          class="m-3"
          value={state.paletteQuery}
          onInput$={(e) => { state.paletteQuery = (e.target as HTMLInputElement).value; activeIdx.value = 0; }}
          onKeyDown$={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); activeIdx.value = Math.min(shown.length - 1, activeIdx.value + 1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx.value = Math.max(0, activeIdx.value - 1); }
            else if (e.key === "Enter") {
              const r = shown[activeIdx.value];
              if (r) { e.preventDefault(); props.onJump$(r.goalId, r.milestoneId); }
            }
          }}
        />
        <div id="palette-list" role="listbox" style="overflow:auto" class="px-3 pb-3">
          {shown.length === 0 ? (
            <p class="text-sm p-2" style="color:var(--color-text-secondary)">No matching goals or milestones.</p>
          ) : (
            shown.map((r, i) => (
              <button
                key={`${r.goalId}-${r.milestoneId}`}
                id={`palette-row-${i}`}
                role="option"
                aria-selected={i === activeIdx.value ? "true" : "false"}
                class="w-full text-left p-2 rounded-md transition-colors"
                style={`background:${i === activeIdx.value ? "#eef2f1" : "none"};border:none;cursor:pointer`}
                onMouseEnter$={() => { activeIdx.value = i; }}
                onClick$={() => props.onJump$(r.goalId, r.milestoneId)}
              >
                <span class="text-sm block" style="color:var(--color-text-primary)">{r.label}</span>
                <span class="text-xs block" style="color:var(--color-text-secondary)">{r.sub}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
