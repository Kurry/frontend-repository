import { component$, useStore, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
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
  });

  // Load from localStorage on mount
  useVisibleTask$(() => {
    const saved = loadState();
    state.goals = saved.goals;
    state.showCompleted = saved.showCompleted;
    // Clear stale focus selections
    const today = getTodayStr();
    if (saved.focusDate !== today) {
      state.focusDate = today;
      for (const g of state.goals) {
        for (const m of g.milestones) {
          for (const s of m.steps) {
            s.focusToday = false;
          }
        }
      }
    } else {
      state.focusDate = saved.focusDate;
    }
    saveState(state);
    // Re-baseline the undo tracker to the just-loaded state and drop any
    // entries it may have queued while this task's mutations were still in
    // flight. useVisibleTask$ execution order between this task and the undo
    // tracker below isn't guaranteed, so without this the tracker can adopt a
    // pre-load snapshot as its baseline and then record THIS load (e.g. the
    // focusDate "" -> today hydration) as if it were a user edit, leaving
    // Undo enabled before any real interaction.
    state._lastSnap = JSON.stringify({ goals: state.goals, focusDate: state.focusDate, showCompleted: state.showCompleted });
    state.undoStack = [];
    state.redoStack = [];
  });

  const persist = $(() => {
    saveState(state);
  });

  // ── Undo / Redo history ──
  // A single tracked task captures every mutation to goals / focusDate /
  // completed-visibility as a serialized snapshot. Any observable change (from
  // a visible control OR a WebMCP command, since both mutate the same store)
  // pushes the PREVIOUS snapshot onto the undo stack and clears redo — so undo
  // restores the exact prior visible state. _timeTravel suppresses re-capture
  // while an undo/redo is itself being applied.
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
    state.focusDate = result.focusDate ?? "";
    state.view = "overview";
    state.activeGoalId = "";
    state.showImport = false;
    state.importError = "";
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

  // ── Global keyboard shortcuts (Undo/Redo, palette, Escape) ──
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
        if (e.shiftKey) {
          void redo();
        } else {
          void undo();
        }
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Expose undo/redo/export/import/palette to the WebMCP bridge.
  useVisibleTask$(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__focuspath_ui = {
      undo,
      redo,
      openExport: () => { state.exportTab = "json"; state.copyConfirm = false; state.showExport = true; return { ok: true }; },
      setExportTab: (tab: string) => { state.exportTab = tab === "markdown" ? "markdown" : "json"; state.showExport = true; return { ok: true, tab: state.exportTab }; },
      copyExport: async () => {
        // Mirror the visible Copy button exactly: write the tab's current
        // rendered text to the clipboard before flipping the confirmation,
        // so a WebMCP-driven copy leaves the clipboard in the same state a
        // real click would.
        const text = state.exportTab === "json" ? buildPathPackJson(state) : buildMarkdownReport(state);
        try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
        state.copyConfirm = true;
        state.showExport = true;
        setTimeout(() => { state.copyConfirm = false; }, 1800);
        return { ok: true };
      },
      openImport: () => { state.showImport = true; state.importError = ""; return { ok: true }; },
      importPack: (text: string) => {
        const result = validatePathPack(text);
        if (!result.ok) { state.importError = result.error ?? "invalid"; return { ok: false, error: result.error }; }
        state.goals = result.goals ?? [];
        state.focusDate = result.focusDate ?? "";
        state.view = "overview";
        state.activeGoalId = "";
        state.showImport = false;
        state.importError = "";
        return { ok: true, goals: state.goals.length };
      },
      openPalette: () => { state.paletteQuery = ""; state.showPalette = true; return { ok: true }; },
    };
  });

  // ──────────────────────────────────────────────────────────
  // WebMCP command bridge (zto-webmcp-v1).
  //
  // Installs window.__focuspath: a set of imperative commands that run the
  // EXACT same domain logic the visible controls run — the same createGoal/
  // createMilestone/createStep factories, the same setStepCompleted +
  // checkMilestoneAutoComplete pipeline, the same reorder guard, the same
  // focus-today cap, the same saveState persistence — mutating the same
  // reactive Qwik store so the UI re-renders identically. No command reaches
  // a state the visible UI cannot; there is no fabricated success path.
  // src/scripts/webmcp.ts exposes the window.webmcp_* surface that delegates
  // here.
  // ──────────────────────────────────────────────────────────
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
    const clearStaleFocus = () => {
      const today = getTodayStr();
      if (state.focusDate !== today) {
        state.focusDate = today;
        for (const g of state.goals) {
          for (const m of g.milestones) {
            for (const s of m.steps) s.focusToday = false;
          }
        }
      }
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
          state.view = "overview";
          state.activeGoalId = "";
          return { ok: true, destination, view: state.view };
        }
        if (destination === "completed-goals") {
          state.view = "overview";
          state.activeGoalId = "";
          state.showCompleted = true;
          saveState(state);
          return { ok: true, destination, view: state.view, showCompleted: true };
        }
        if (destination === "goal-detail") {
          const g = goalId ? findGoal(goalId) : state.goals[0];
          if (!g) return { ok: false, error: "no goal to open" };
          state.activeGoalId = g.id;
          state.view = "detail";
          return { ok: true, destination, view: state.view, activeGoalId: g.id };
        }
        return { ok: false, error: `unknown destination: ${destination}` };
      },

      createGoal: (fields: { title?: string; targetDate?: string; accentColor?: string; motivation?: string }) => {
        const title = (fields.title ?? "").trim();
        if (!title) return { ok: false, error: "Goal title is required." };
        const accent = ACCENT_COLORS.some((c) => c.value === fields.accentColor)
          ? (fields.accentColor as string)
          : ACCENT_COLORS[0].value;
        const g = createGoal({
          id: uid(),
          title,
          targetDate: fields.targetDate ?? "",
          accentColor: accent,
          motivation: (fields.motivation ?? "").trim(),
        });
        state.goals.push(g);
        saveState(state);
        return { ok: true, entity: "goal", id: g.id };
      },

      createMilestone: (goalId: string, fields: { title?: string; targetDate?: string }) => {
        const g = findGoal(goalId);
        if (!g) return { ok: false, error: "goal not found" };
        const title = (fields.title ?? "").trim();
        if (!title) return { ok: false, error: "Title is required." };
        const m = createMilestone({ id: uid(), title, targetDate: fields.targetDate ?? "" });
        g.milestones.push(m);
        saveState(state);
        return { ok: true, entity: "milestone", id: m.id };
      },

      createStep: (goalId: string, milestoneId: string, title: string) => {
        const m = findMilestone(goalId, milestoneId);
        if (!m) return { ok: false, error: "milestone not found" };
        const t = (title ?? "").trim();
        if (!t) return { ok: false, error: "Step title is required." };
        const s = createStep({ id: uid(), title: t });
        m.steps.push(s);
        m.completed = checkMilestoneAutoComplete(m);
        saveState(state);
        return { ok: true, entity: "step", id: s.id, milestoneCompleted: m.completed };
      },

      select: (goalId: string) => {
        const g = findGoal(goalId);
        if (!g) return { ok: false, error: "goal not found" };
        state.activeGoalId = g.id;
        state.view = "detail";
        return { ok: true, id: g.id };
      },

      update: (args: { entity: string; goalId: string; milestoneId?: string; stepId?: string; title?: string; targetDate?: string; motivation?: string }) => {
        if (args.entity === "goal") {
          const g = findGoal(args.goalId);
          if (!g) return { ok: false, error: "goal not found" };
          if (args.title !== undefined && args.title.trim()) g.title = args.title.trim();
          if (args.targetDate !== undefined) g.targetDate = args.targetDate;
          if (args.motivation !== undefined) g.motivation = args.motivation.trim();
          saveState(state);
          return { ok: true, entity: "goal", id: g.id };
        }
        if (args.entity === "milestone") {
          const m = findMilestone(args.goalId, args.milestoneId ?? "");
          if (!m) return { ok: false, error: "milestone not found" };
          if (args.title !== undefined && args.title.trim()) m.title = args.title.trim();
          if (args.targetDate !== undefined) m.targetDate = args.targetDate;
          saveState(state);
          return { ok: true, entity: "milestone", id: m.id };
        }
        if (args.entity === "step") {
          const s = findStep(args.goalId, args.milestoneId ?? "", args.stepId ?? "");
          if (!s) return { ok: false, error: "step not found" };
          if (args.title !== undefined && args.title.trim()) s.title = args.title.trim();
          saveState(state);
          return { ok: true, entity: "step", id: s.id };
        }
        return { ok: false, error: `unknown entity: ${args.entity}` };
      },

      remove: (args: { entity: string; goalId: string; milestoneId?: string; stepId?: string; confirm?: boolean }) => {
        if (args.confirm !== true) return { ok: false, error: "delete requires confirm=true" };
        if (args.entity === "goal") {
          const idx = state.goals.findIndex((g) => g.id === args.goalId);
          if (idx === -1) return { ok: false, error: "goal not found" };
          state.goals.splice(idx, 1);
          if (state.activeGoalId === args.goalId) {
            state.activeGoalId = "";
            state.view = "overview";
          }
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
        clearStaleFocus();
        const s = findStep(goalId, milestoneId, stepId);
        if (!s) return { ok: false, error: "step not found" };
        if (s.focusToday) {
          s.focusToday = false;
          saveState(state);
          return { ok: true, stepId, focusToday: false, focusCount: countTodayFocus(state.goals, state.focusDate) };
        }
        if (countTodayFocus(state.goals, state.focusDate) >= MAX_FOCUS_STEPS) {
          return { ok: false, error: "You already have 3 focus steps today. Complete or unfocus one to add another.", focusCount: MAX_FOCUS_STEPS };
        }
        s.focusToday = true;
        saveState(state);
        return { ok: true, stepId, focusToday: true, focusCount: countTodayFocus(state.goals, state.focusDate) };
      },

      reorderMilestone: (goalId: string, milestoneId: string, direction: "up" | "down") => {
        const g = findGoal(goalId);
        if (!g) return { ok: false, error: "goal not found" };
        const idx = g.milestones.findIndex((m) => m.id === milestoneId);
        if (idx === -1) return { ok: false, error: "milestone not found" };
        const m = g.milestones[idx];
        if (m.completed) return { ok: false, error: "Reordering disabled — this milestone is complete" };
        const earlierComplete = g.milestones.slice(0, idx).some((x) => x.completed);
        if (earlierComplete) return { ok: false, error: "Reordering disabled — an earlier milestone is complete" };
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
        saveState(state);
        return { ok: true, id: g.id, completedAt: g.completedAt };
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
    const d = state.goalFormData;
    const title = d.title.trim();
    if (!title) { state.goalFormError = "Goal title is required."; return; }
    if (title.length > 80) { state.goalFormError = "Title must be at most 80 characters."; return; }
    if (d.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(d.targetDate)) { state.goalFormError = "Target date must be YYYY-MM-DD."; return; }
    if (d.targetDate && !isTargetDateInRange(d.targetDate)) { state.goalFormError = `Target date must be between ${MIN_TARGET_DATE} and ${MAX_TARGET_DATE}.`; return; }
    if (d.motivation.length > 280) { state.goalFormError = "Motivation must be at most 280 characters."; return; }
    if (!ACCENT_VALUES.includes(d.accentColor)) { state.goalFormError = "Accent color must be one of the 8 palette swatches."; return; }
    const g = createGoal({
      id: uid(),
      title,
      targetDate: d.targetDate,
      accentColor: d.accentColor,
      motivation: d.motivation.trim(),
    });
    state.goals.push(g);
    state.showGoalForm = false;
    state.goalFormError = "";
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
      for (const g of state.goals) {
        for (const m of g.milestones) {
          for (const s of m.steps) s.focusToday = false;
        }
      }
    }
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const milestone = goal.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;
    const step = milestone.steps.find((s) => s.id === stepId);
    if (!step) return;

    if (step.focusToday) {
      step.focusToday = false;
      persist();
      return;
    }
    const count = countTodayFocus(state.goals, state.focusDate);
    if (count >= 3) {
      // handled at call site with inline message
      return;
    }
    step.focusToday = true;
    persist();
  });

  const activeGoal = state.goals.find((g) => g.id === state.activeGoalId) ?? null;
  const todaySteps = getTodayFocusSteps(state.goals, state.focusDate);
  const focusCount = todaySteps.length;
  const stalledMessage = activeGoal && isStalled(activeGoal);

  return (
    <div class="min-h-screen" style="background-color:var(--color-background)">
      {/* Header */}
      <header style="background:var(--color-surface);border-bottom:1px solid #e5e7eb;" class="sticky top-0 z-10">
        <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <button
              class="font-bold text-xl cursor-pointer bg-transparent border-none"
              style="font-family:'Fraunces','Georgia',serif;color:var(--color-primary)"
              onClick$={() => { state.view = "overview"; state.activeGoalId = ""; }}
            >
              FocusPath
            </button>
            {state.view === "detail" && (
              <button class="btn-secondary" aria-label="Back to overview" onClick$={() => { state.view = "overview"; state.activeGoalId = ""; }}>
                ← Back
              </button>
            )}
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button class="btn-primary" onClick$={openGoalForm}>+ New Goal</button>
            <button
              class="btn-secondary"
              aria-label="Undo"
              aria-disabled={state.undoStack.length === 0 ? "true" : "false"}
              disabled={state.undoStack.length === 0}
              style={state.undoStack.length === 0 ? "opacity:0.4" : ""}
              title="Undo (Ctrl+Z)"
              onClick$={undo}
            >
              ↶ Undo
            </button>
            <button
              class="btn-secondary"
              aria-label="Redo"
              aria-disabled={state.redoStack.length === 0 ? "true" : "false"}
              disabled={state.redoStack.length === 0}
              style={state.redoStack.length === 0 ? "opacity:0.4" : ""}
              title="Redo (Ctrl+Shift+Z)"
              onClick$={redo}
            >
              ↷ Redo
            </button>
            <button class="btn-secondary" aria-label="Export" onClick$={openExport}>Export</button>
            <button class="btn-secondary" aria-label="Import" onClick$={() => { state.showImport = true; state.importError = ""; }}>Import</button>
            <button class="btn-secondary" aria-label="Open command palette" title="Command palette (Ctrl+K)" onClick$={openPalette}>⌘ Search</button>
          </div>
        </div>
      </header>

      {/* Export drawer */}
      {state.showExport && (
        <ExportDrawer state={state} onClose$={() => { state.showExport = false; }} />
      )}

      {/* Import modal */}
      {state.showImport && (
        <ImportModal
          error={state.importError}
          onValidate$={(text: string) => { applyImport(text); }}
          onCancel$={() => { state.showImport = false; state.importError = ""; }}
        />
      )}

      {/* Command palette */}
      {state.showPalette && (
        <CommandPalette state={state} onJump$={jumpToPalette} onClose$={() => { state.showPalette = false; }} />
      )}

      <main class="max-w-5xl mx-auto px-4 py-6">
        {/* Goal Form Modal */}
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
          />
        )}
      </main>
    </div>
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
  const title = data.title.trim();
  const titleErr = title.length === 0 ? "Goal title is required" : title.length > 80 ? "Title must be at most 80 characters" : "";
  const dateErr = data.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.targetDate)
    ? "Target date must be YYYY-MM-DD"
    : data.targetDate && !isTargetDateInRange(data.targetDate)
    ? `Target date must be between ${MIN_TARGET_DATE} and ${MAX_TARGET_DATE}`
    : "";
  const motErr = data.motivation.length > 280 ? "Motivation must be at most 280 characters" : "";
  const valid = titleErr === "" && dateErr === "" && motErr === "";

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.35)" role="dialog" aria-modal="true" aria-label="New goal">
      <div class="card p-6 w-full max-w-md mx-4 slide-in">
        <h2 style="font-size:1.3rem;margin-bottom:1rem;color:var(--color-text-primary)">New goal</h2>
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm mb-1" for="goal-title" style="color:var(--color-text-secondary)">Title *</label>
            <input
              id="goal-title"
              type="text"
              maxLength={80}
              value={data.title}
              aria-invalid={titleErr ? "true" : "false"}
              placeholder="e.g. Launch my podcast"
              onInput$={(e) => { data.title = (e.target as HTMLInputElement).value; }}
            />
            {(titleErr || props.error) && (
              <p class="mt-1 text-xs" role="alert" style="color:var(--color-error)">{props.error || titleErr}</p>
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
              onInput$={(e) => { data.targetDate = (e.target as HTMLInputElement).value; }}
            />
            {dateErr && <p class="mt-1 text-xs" role="alert" style="color:var(--color-error)">{dateErr}</p>}
          </div>
          <div>
            <label class="block text-sm mb-1" style="color:var(--color-text-secondary)">Accent color</label>
            <div class="flex gap-2 flex-wrap" role="radiogroup" aria-label="Accent color">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={data.accentColor === c.value ? "true" : "false"}
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
              onInput$={(e) => { data.motivation = (e.target as HTMLTextAreaElement).value; }}
            />
            {motErr && <p class="mt-1 text-xs" role="alert" style="color:var(--color-error)">{motErr}</p>}
          </div>
          <div class="flex gap-2 justify-end">
            <button class="btn-secondary" onClick$={props.onCancel$}>Cancel</button>
            <button
              class="btn-primary"
              disabled={!valid}
              aria-disabled={!valid ? "true" : "false"}
              style={!valid ? "opacity:0.5;cursor:not-allowed" : ""}
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
  state: AppState & { showCompleted: boolean; focusDate: string };
  onOpenGoal$: (id: string) => void;
  onOpenGoalForm$: () => void;
  persist$: () => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
}>((props) => {
  const { state } = props;
  const active = sortedActiveGoals(state.goals);
  const completed = state.goals.filter((g) => g.completed);
  const todaySteps = getTodayFocusSteps(state.goals, state.focusDate);

  return (
    <div class="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Main column */}
      <div class="flex-1 min-w-0">
        {/* Today's Focus Panel */}
        <TodayFocusPanel
          state={state}
          todaySteps={todaySteps}
          persist$={props.persist$}
          toggleFocusStep$={props.toggleFocusStep$}
        />

        {/* Live Activity Stream */}
        <LiveEventPanel />

        {/* Active Goals */}
        <div class="mt-6">
          <div class="flex items-center justify-between mb-3">
            <h2 style="font-size:1.3rem;color:var(--color-text-primary)">Goals</h2>
            <button class="btn-primary" onClick$={props.onOpenGoalForm$}>+ New Goal</button>
          </div>

          {active.length === 0 ? (
            <div class="card p-10 text-center fade-in">
              <p class="text-lg mb-4" style="color:var(--color-text-secondary);font-family:'Fraunces','Georgia',serif">
                Set your first goal to start building a path
              </p>
              <button class="btn-primary" onClick$={props.onOpenGoalForm$}>+ New Goal</button>
            </div>
          ) : (
            <div class="flex flex-col gap-3">
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

        {/* Completed Goals toggle */}
        {completed.length > 0 && (
          <div class="mt-6">
            <button
              class="btn-secondary w-full justify-center"
              onClick$={() => { state.showCompleted = !state.showCompleted; props.persist$(); }}
            >
              {state.showCompleted ? "Hide" : "Show"} Completed Goals ({completed.length})
            </button>
            {state.showCompleted && (
              <div class="flex flex-col gap-3 mt-3 fade-in">
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
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Today's Focus Panel
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

  return (
    <div class="card p-4 mb-2 fade-in" style="border-left:4px solid var(--color-accent)">
      <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 class="font-semibold" style="color:#92400e;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em">
          Today's Focus
        </h3>
        <span class="text-xs font-semibold" aria-label="Daily velocity" style="color:#92400e">
          Daily Velocity: {completedToday} of 3
        </span>
      </div>
      <div class="flex flex-col gap-2">
        {todaySteps.map((item) => (
          <div key={item.stepId} class="flex items-center gap-2 p-2 rounded-lg" style="background:#fef9f0">
            <input
              type="checkbox"
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
                {item.stepTitle}
              </p>
              <p class="text-xs" style="color:var(--color-text-secondary)">
                {item.goalTitle} › {item.milestoneTitle}
              </p>
            </div>
            <div
              class="w-2 h-2 rounded-full flex-shrink-0"
              style={`background:${item.accentColor}`}
            />
          </div>
        ))}
      </div>
    </div>
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

// Three deterministic events, each with a stable ID and a logical (not
// wall-clock) timestamp. event-003 has the latest logical time but is the
// one offered by "Deliver Out of Order" so it can arrive before event-002.
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
    <div class="card p-4 mb-4 fade-in">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 style="font-size:0.95rem;color:var(--color-text-primary)">Live activity stream</h3>
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
            if (live.processedIds.includes(first.id)) {
              live.feedback = "Stream active; no new event to apply.";
              return;
            }
            live.processedIds.push(first.id);
            const qIdx = live.queuedIds.indexOf(first.id);
            if (qIdx !== -1) live.queuedIds.splice(qIdx, 1);
            live.feedback = `${first.id} applied (logical time ${first.logicalTime}).`;
          }}
        >
          Start
        </button>
        <button
          id="fp-live-pause"
          class="btn-secondary"
          onClick$={() => {
            live.status = "paused";
            live.feedback = "Processing paused; values are unchanged.";
          }}
        >
          Pause
        </button>
        <button
          id="fp-live-disconnect"
          class="btn-secondary"
          onClick$={() => {
            live.status = "disconnected";
            live.feedback = "Stream disconnected; new events will queue.";
          }}
        >
          Disconnect
        </button>
        <button
          id="fp-live-deliver"
          class="btn-secondary"
          onClick$={() => {
            const evt = OUT_OF_ORDER_EVENT;
            if (live.status === "paused" || live.status === "disconnected") {
              if (!live.processedIds.includes(evt.id) && !live.queuedIds.includes(evt.id)) {
                live.queuedIds.push(evt.id);
              }
              live.feedback = `${evt.id} queued while ${live.status}.`;
              return;
            }
            if (live.processedIds.includes(evt.id)) {
              live.feedback = `${evt.id} ignored as a duplicate.`;
              return;
            }
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
              for (const evt of LIVE_EVENTS) {
                if (!live.processedIds.includes(evt.id)) {
                  live.processedIds.push(evt.id);
                }
              }
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

      {/* Applied events, always displayed in logical-time order regardless
          of the order they were actually delivered/applied. */}
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
    </div>
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
      class="card p-4 cursor-pointer transition-shadow hover:shadow-md fade-in"
      style={`border-left:4px solid ${goal.accentColor}`}
      onClick$={props.onOpen$}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 style="font-size:1.1rem;color:var(--color-text-primary);font-family:'Fraunces','Georgia',serif">
              {goal.title}
            </h3>
            {stalled && <span class="badge-warning">Needs Attention</span>}
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
            <div class="flex items-center gap-1" onClick$={(e) => e.stopPropagation()}>
              <span class="text-xs" style="color:var(--color-error)">Delete?</span>
              <button
                class="btn-danger"
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
              onClick$={(e) => { e.stopPropagation(); deleteStore.confirming = true; }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <div class="mt-3 progress-bar-bg">
        <div class="progress-bar-fill" style={`width:${prog.pct}%`} />
      </div>
      <p class="text-xs mt-1" style="color:var(--color-text-secondary)">
        {prog.completed} of {prog.total} steps completed
      </p>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Completed Goal Card
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
      class="card p-4 opacity-75 fade-in cursor-pointer transition-shadow hover:shadow-md"
      style={`border-left:4px solid ${goal.accentColor}`}
      onClick$={props.onOpen$}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 style="font-size:1.05rem;font-family:'Fraunces','Georgia',serif">{goal.title}</h3>
            <span class="badge-success">Complete</span>
          </div>
          {goal.completedAt && (
            <p class="text-xs mt-0.5" style="font-family:'SFMono-Regular',monospace;color:var(--color-text-secondary)">
              Completed: {goal.completedAt.slice(0, 10)}
            </p>
          )}
        </div>
        {deleteStore.confirming ? (
          <div class="flex items-center gap-1" onClick$={(e) => e.stopPropagation()}>
            <span class="text-xs" style="color:var(--color-error)">Delete?</span>
            <button
              class="btn-danger"
              onClick$={(e) => {
                e.stopPropagation();
                const idx = props.state.goals.findIndex((g) => g.id === goal.id);
                if (idx !== -1) props.state.goals.splice(idx, 1);
                props.persist$();
              }}
            >
              Yes
            </button>
            <button
              class="btn-secondary text-xs px-2 py-1"
              onClick$={(e) => { e.stopPropagation(); deleteStore.confirming = false; }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            class="btn-danger"
            onClick$={(e) => { e.stopPropagation(); deleteStore.confirming = true; }}
          >
            Delete
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
    focusLimitMsg: false,
  });

  const todaySteps = getTodayFocusSteps(props.state.goals, props.state.focusDate);
  const focusCount = todaySteps.length;

  // Scroll a milestone into view after a command-palette jump.
  useVisibleTask$(({ track }) => {
    const target = track(() => props.state.scrollMilestoneId);
    if (!target) return;
    const el = document.getElementById(`milestone-${target}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    props.state.scrollMilestoneId = "";
  });

  return (
    <div class="slide-in">
      {/* Goal header */}
      <div class="card p-5 mb-6">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            {editStore.editingTitle ? (
              <div class="flex gap-2 items-center">
                <input
                  type="text"
                  value={editStore.titleDraft}
                  onInput$={(e) => { editStore.titleDraft = (e.target as HTMLInputElement).value; }}
                  style="font-size:1.4rem;font-family:'Fraunces','Georgia',serif;font-weight:600"
                />
                <button class="btn-primary text-sm" onClick$={() => {
                  if (editStore.titleDraft.trim()) goal.title = editStore.titleDraft.trim();
                  editStore.editingTitle = false;
                  props.persist$();
                }}>Save</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.editingTitle = false; }}>Cancel</button>
              </div>
            ) : (
              <h1
                class="cursor-pointer hover:opacity-70 transition-opacity"
                style="font-size:1.6rem;color:var(--color-text-primary)"
                onClick$={() => { editStore.titleDraft = goal.title; editStore.editingTitle = true; }}
              >
                {goal.title}
              </h1>
            )}

            {editStore.editingDate ? (
              <div class="flex gap-2 items-center mt-1">
                <input
                  type="date"
                  min={MIN_TARGET_DATE}
                  max={MAX_TARGET_DATE}
                  value={editStore.dateDraft}
                  onInput$={(e) => { editStore.dateDraft = (e.target as HTMLInputElement).value; }}
                  style="width:auto"
                />
                <button class="btn-primary text-sm" onClick$={() => {
                  if (editStore.dateDraft && !isTargetDateInRange(editStore.dateDraft)) return;
                  goal.targetDate = editStore.dateDraft;
                  editStore.editingDate = false;
                  props.persist$();
                }}>Save</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.editingDate = false; }}>Cancel</button>
              </div>
            ) : (
              <p
                class="mt-1 cursor-pointer hover:opacity-70 transition-opacity"
                style="font-family:'SFMono-Regular',monospace;font-size:0.75rem;color:var(--color-text-secondary)"
                onClick$={() => { editStore.dateDraft = goal.targetDate; editStore.editingDate = true; }}
              >
                {goal.targetDate ? `Target: ${goal.targetDate}` : "Add target date…"}
              </p>
            )}

            {stalled && (
              <div class="mt-2 p-2 rounded-md text-sm" style="background:#fef3c7;color:#92400e;border:1px solid var(--color-warning)">
                Needs Attention — no progress in over 7 days
              </div>
            )}
          </div>

          <div class="flex flex-col items-end gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xl" style="color:var(--color-primary)">{prog.pct}%</span>
            </div>
            <div class="w-32 progress-bar-bg">
              <div class="progress-bar-fill" style={`width:${prog.pct}%`} />
            </div>
            <p class="text-xs" style="color:var(--color-text-secondary)">{prog.completed}/{prog.total} steps</p>
          </div>
        </div>

        {/* Motivation note */}
        <div class="mt-3 pt-3" style="border-top:1px solid #e5e7eb">
          {editStore.editingMotivation ? (
            <div class="flex gap-2 items-start">
              <textarea
                rows={2}
                value={editStore.motivationDraft}
                onInput$={(e) => { editStore.motivationDraft = (e.target as HTMLTextAreaElement).value; }}
                style="flex:1;resize:vertical"
              />
              <div class="flex flex-col gap-1">
                <button class="btn-primary text-sm" onClick$={() => {
                  goal.motivation = editStore.motivationDraft.trim();
                  editStore.editingMotivation = false;
                  props.persist$();
                }}>Save</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.editingMotivation = false; }}>Cancel</button>
              </div>
            </div>
          ) : (
            <p
              class="text-sm cursor-pointer hover:opacity-70 transition-opacity italic"
              style="color:var(--color-text-secondary)"
              onClick$={() => { editStore.motivationDraft = goal.motivation; editStore.editingMotivation = true; }}
            >
              {goal.motivation || "Why does this matter to you? Click to add…"}
            </p>
          )}
        </div>

        {/* Mark complete */}
        {prog.pct === 100 && !goal.completed && (
          <div class="mt-3 pt-3" style="border-top:1px solid #e5e7eb">
            {editStore.markCompleteConfirm ? (
              <div class="flex items-center gap-2">
                <span class="text-sm" style="color:var(--color-text-primary)">Mark this goal as complete?</span>
                <button class="btn-primary text-sm" onClick$={() => {
                  goal.completed = true;
                  goal.completedAt = new Date().toISOString();
                  props.persist$();
                  // go back to overview
                  props.state.view = "overview";
                  props.state.activeGoalId = "";
                }}>Yes, complete!</button>
                <button class="btn-secondary text-sm" onClick$={() => { editStore.markCompleteConfirm = false; }}>Cancel</button>
              </div>
            ) : (
              <button class="btn-primary" onClick$={() => { editStore.markCompleteConfirm = true; }}>
                Mark Goal Complete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Today's Focus in detail view */}
      {todaySteps.length > 0 && (
        <TodayFocusPanel
          state={props.state}
          todaySteps={todaySteps}
          persist$={props.persist$}
          toggleFocusStep$={props.toggleFocusStep$}
        />
      )}

      {/* Focus limit message */}
      {editStore.focusLimitMsg && (
        <div class="mb-4 p-3 rounded-lg text-sm" style="background:#fef3c7;color:#92400e;border:1px solid var(--color-warning)">
          You already have 3 focus steps today. Complete or unfocus one to add another.
          <button class="ml-3 btn-secondary text-xs" onClick$={() => { editStore.focusLimitMsg = false; }}>Dismiss</button>
        </div>
      )}

      {/* Milestones path */}
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 style="font-size:1.2rem;color:var(--color-text-primary)">Milestones</h2>
          {!goal.completed && (
            <button class="btn-primary" onClick$={() => {
              editStore.showAddMilestone = !editStore.showAddMilestone;
              editStore.newMilestoneTitle = "";
              editStore.newMilestoneDate = "";
              editStore.milestoneError = "";
            }}>
              + Add Milestone
            </button>
          )}
        </div>

        {editStore.showAddMilestone && (
          <div class="card p-4 mb-4 slide-in">
            <h4 class="text-sm font-semibold mb-2" style="color:var(--color-text-secondary)">New milestone</h4>
            {editStore.milestoneError && (
              <p class="text-sm mb-2" style="color:var(--color-error)">{editStore.milestoneError}</p>
            )}
            <div class="flex flex-col gap-2">
              <div>
                <label class="block text-xs mb-1" for="new-milestone-title" style="color:var(--color-text-secondary)">Milestone title</label>
                <input
                  id="new-milestone-title"
                  type="text"
                  placeholder="e.g. Record first episode"
                  value={editStore.newMilestoneTitle}
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
              <div class="flex gap-2">
                <button class="btn-primary" onClick$={() => {
                  if (!editStore.newMilestoneTitle.trim()) {
                    editStore.milestoneError = "Title is required.";
                    return;
                  }
                  if (editStore.newMilestoneDate && !isTargetDateInRange(editStore.newMilestoneDate)) {
                    editStore.milestoneError = `Target date must be between ${MIN_TARGET_DATE} and ${MAX_TARGET_DATE}.`;
                    return;
                  }
                  const m = createMilestone({
                    id: uid(),
                    title: editStore.newMilestoneTitle.trim(),
                    targetDate: editStore.newMilestoneDate,
                  });
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
          <div class="card p-10 text-center fade-in">
            <p style="color:var(--color-text-secondary);font-family:'Fraunces','Georgia',serif">
              Add your first milestone to build this path
            </p>
          </div>
        ) : (
          <MilestonePath
            goal={goal}
            activeIdx={activeIdx}
            state={props.state}
            persist$={props.persist$}
            onFocusLimit$={() => { editStore.focusLimitMsg = true; }}
            toggleFocusStep$={props.toggleFocusStep$}
          />
        )}
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Milestone Path
// ──────────────────────────────────────────────────────────

const MilestonePath = component$<{
  goal: Goal;
  activeIdx: number;
  state: AppState & { goals: Goal[]; focusDate: string };
  persist$: () => void;
  onFocusLimit$: () => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
}>((props) => {
  const { goal } = props;

  return (
    <div class="flex flex-col gap-0">
      {goal.milestones.map((milestone, idx) => {
        const nodeState = milestone.completed ? "completed" : idx === props.activeIdx ? "active" : "upcoming";
        const isLast = idx === goal.milestones.length - 1;
        const canReorder = !milestone.completed && (idx === 0 || !goal.milestones[idx - 1].completed);

        return (
          <div key={milestone.id} id={`milestone-${milestone.id}`} class="flex gap-4" style="scroll-margin-top:5rem">
            {/* Node + connector column */}
            <div class="flex flex-col items-center flex-shrink-0" style="width:2.25rem">
              <div
                class={`milestone-node ${nodeState}`}
                tabIndex={0}
                role="button"
                aria-label={`Milestone ${idx + 1}: ${milestone.title}`}
              >
                {milestone.completed ? "✓" : idx + 1}
              </div>
              {!isLast && (
                <div
                  class="flex-1"
                  style={`width:2px;min-height:1.5rem;margin:0.25rem 0;${
                    milestone.completed
                      ? "background:var(--color-success)"
                      : idx === props.activeIdx
                      ? "background:var(--color-accent)"
                      : "background:repeating-linear-gradient(to bottom,#d1d5db 0,#d1d5db 6px,transparent 6px,transparent 12px)"
                  }`}
                />
              )}
            </div>

            {/* Milestone content */}
            <div class="flex-1 min-w-0 pb-6">
              <MilestoneCard
                goal={goal}
                milestone={milestone}
                milestoneIdx={idx}
                nodeState={nodeState}
                state={props.state}
                persist$={props.persist$}
                onFocusLimit$={props.onFocusLimit$}
                toggleFocusStep$={props.toggleFocusStep$}
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
  onFocusLimit$: () => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
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

  const todayFocusCount = countTodayFocus(props.state.goals, props.state.focusDate);

  const canMoveUp = milestoneIdx > 0 && !milestone.completed && !goal.milestones[milestoneIdx - 1]?.completed;
  const canMoveDown = milestoneIdx < goal.milestones.length - 1 && !milestone.completed && !goal.milestones[milestoneIdx + 1]?.completed;
  const isEarlierComplete = milestoneIdx > 0 && goal.milestones.slice(0, milestoneIdx).some((m) => m.completed);

  const borderColor = props.nodeState === "completed" ? "var(--color-success)" : props.nodeState === "active" ? "var(--color-accent)" : "#e5e7eb";

  return (
    <div class="card p-4" style={`border-left:3px solid ${borderColor}`}>
      {/* Header row */}
      <div class="flex items-start gap-2 justify-between flex-wrap">
        <div class="flex-1 min-w-0">
          {local.editingTitle ? (
            <div class="flex gap-2 items-center">
              <input
                type="text"
                value={local.titleDraft}
                onInput$={(e) => { local.titleDraft = (e.target as HTMLInputElement).value; }}
                style="font-size:1rem"
              />
              <button class="btn-primary text-xs" onClick$={() => {
                if (local.titleDraft.trim()) milestone.title = local.titleDraft.trim();
                local.editingTitle = false;
                props.persist$();
              }}>Save</button>
              <button class="btn-secondary text-xs" onClick$={() => { local.editingTitle = false; }}>Cancel</button>
            </div>
          ) : (
            <h4
              class="cursor-pointer hover:opacity-70 transition-opacity"
              style="font-size:1.05rem;font-family:'Fraunces','Georgia',serif;font-weight:600;color:var(--color-text-primary)"
              onClick$={() => { local.titleDraft = milestone.title; local.editingTitle = true; }}
            >
              {milestone.title}
            </h4>
          )}

          {local.editingDate ? (
            <div class="flex gap-2 items-center mt-1">
              <input
                type="date"
                min={MIN_TARGET_DATE}
                max={MAX_TARGET_DATE}
                value={local.dateDraft}
                onInput$={(e) => { local.dateDraft = (e.target as HTMLInputElement).value; }}
                style="width:auto"
              />
              <button class="btn-primary text-xs" onClick$={() => {
                if (local.dateDraft && !isTargetDateInRange(local.dateDraft)) return;
                milestone.targetDate = local.dateDraft;
                local.editingDate = false;
                props.persist$();
              }}>Save</button>
              <button class="btn-secondary text-xs" onClick$={() => { local.editingDate = false; }}>Cancel</button>
            </div>
          ) : (
            <p
              class="text-xs mt-0.5 cursor-pointer hover:opacity-70"
              style="font-family:'SFMono-Regular',monospace;color:var(--color-text-secondary)"
              onClick$={() => { local.dateDraft = milestone.targetDate; local.editingDate = true; }}
            >
              {milestone.targetDate ? `Target: ${milestone.targetDate}` : "Add target date…"}
            </p>
          )}
        </div>

        {/* Controls */}
        <div class="flex items-center gap-1 flex-shrink-0">
          {/* Reorder */}
          {!goal.completed && (
            <>
              <div class="relative group">
                <button
                  class="btn-secondary text-xs px-1.5 py-0.5"
                  disabled={!canMoveUp}
                  style={!canMoveUp ? "opacity:0.4" : ""}
                  onClick$={() => {
                    if (!canMoveUp) return;
                    const temp = goal.milestones[milestoneIdx - 1];
                    goal.milestones[milestoneIdx - 1] = milestone;
                    goal.milestones[milestoneIdx] = temp;
                    props.persist$();
                  }}
                  title={isEarlierComplete ? "Cannot reorder: earlier milestone is complete" : "Move up"}
                >
                  ↑
                </button>
              </div>
              <div class="relative group">
                <button
                  class="btn-secondary text-xs px-1.5 py-0.5"
                  disabled={!canMoveDown}
                  style={!canMoveDown ? "opacity:0.4" : ""}
                  onClick$={() => {
                    if (!canMoveDown) return;
                    const temp = goal.milestones[milestoneIdx + 1];
                    goal.milestones[milestoneIdx + 1] = milestone;
                    goal.milestones[milestoneIdx] = temp;
                    props.persist$();
                  }}
                  title="Move down"
                >
                  ↓
                </button>
              </div>
            </>
          )}

          {/* Delete */}
          {local.deleteConfirm ? (
            <div class="flex items-center gap-1">
              <span class="text-xs" style="color:var(--color-error)">Delete?</span>
              <button class="btn-danger text-xs" onClick$={() => {
                const idx = goal.milestones.findIndex((m) => m.id === milestone.id);
                if (idx !== -1) goal.milestones.splice(idx, 1);
                props.persist$();
              }}>Yes</button>
              <button class="btn-secondary text-xs px-2 py-0.5" onClick$={() => { local.deleteConfirm = false; }}>No</button>
            </div>
          ) : (
            !goal.completed && (
              <button class="btn-danger" onClick$={() => { local.deleteConfirm = true; }}>Delete</button>
            )
          )}
        </div>
      </div>

      {/* Reorder disabled note */}
      {milestone.completed ? (
        <p class="text-xs mt-1" style="color:var(--color-text-secondary)">
          Reordering disabled — this milestone is complete
        </p>
      ) : (
        isEarlierComplete && (
          <p class="text-xs mt-1" style="color:var(--color-text-secondary)">
            Reordering disabled — an earlier milestone is complete
          </p>
        )
      )}

      {/* Steps */}
      <div class="mt-3">
        {milestone.steps.length === 0 && !goal.completed ? (
          <p class="text-sm italic" style="color:var(--color-text-secondary)">Add a step to make progress</p>
        ) : (
          <div class="flex flex-col gap-1">
            {milestone.steps.map((step) => {
              const isStepFocused = step.focusToday;
              return (
                <StepRow
                  key={step.id}
                  step={step}
                  goal={goal}
                  milestone={milestone}
                  state={props.state}
                  persist$={props.persist$}
                  onFocusLimit$={props.onFocusLimit$}
                  toggleFocusStep$={props.toggleFocusStep$}
                  readonly={!!goal.completed}
                />
              );
            })}
          </div>
        )}

        {/* Add step */}
        {!goal.completed && (
          <div class="mt-2">
            {local.addingStep ? (
              <div class="flex gap-2 items-center slide-in">
                {local.stepError && <span class="text-xs" style="color:var(--color-error)">{local.stepError}</span>}
                <label class="sr-only" for={`new-step-${milestone.id}`}>Step title</label>
                <input
                  id={`new-step-${milestone.id}`}
                  type="text"
                  placeholder="e.g. Practice scales for 15 minutes"
                  value={local.newStepTitle}
                  onInput$={(e) => { local.newStepTitle = (e.target as HTMLInputElement).value; }}
                  onKeyDown$={(e) => {
                    if (e.key === "Enter") {
                      if (!local.newStepTitle.trim()) { local.stepError = "Required"; return; }
                      const s = createStep({ id: uid(), title: local.newStepTitle.trim() });
                      milestone.steps.push(s);
                      local.newStepTitle = "";
                      local.addingStep = false;
                      local.stepError = "";
                      // auto-complete milestone if all steps done
                      milestone.completed = checkMilestoneAutoComplete(milestone);
                      props.persist$();
                    }
                  }}
                />
                <button class="btn-primary text-sm flex-shrink-0" onClick$={() => {
                  if (!local.newStepTitle.trim()) { local.stepError = "Required"; return; }
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
                class="text-sm mt-1"
                style="color:var(--color-primary);background:none;border:none;cursor:pointer;padding:0;font-family:inherit"
                onClick$={() => { local.addingStep = true; }}
              >
                + Add Step
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
  onFocusLimit$: () => void;
  toggleFocusStep$: (goalId: string, milestoneId: string, stepId: string) => void;
  readonly: boolean;
}>((props) => {
  const { step, goal, milestone } = props;
  const local = useStore({
    editing: false,
    draft: step.title,
    deleteConfirm: false,
  });

  const focusCount = countTodayFocus(props.state.goals, props.state.focusDate);

  return (
    <div class="step-row group" tabIndex={0}>
      {!props.readonly && (
        <input
          type="checkbox"
          checked={step.completed}
          onChange$={() => {
            setStepCompleted(step, !step.completed);
            // Auto-complete milestone
            milestone.completed = checkMilestoneAutoComplete(milestone);
            props.persist$();
          }}
        />
      )}

      {local.editing ? (
        <div class="flex gap-2 items-center flex-1">
          <input
            type="text"
            value={local.draft}
            onInput$={(e) => { local.draft = (e.target as HTMLInputElement).value; }}
          />
          <button class="btn-primary text-xs flex-shrink-0" onClick$={() => {
            if (local.draft.trim()) step.title = local.draft.trim();
            local.editing = false;
            props.persist$();
          }}>Save</button>
          <button class="btn-secondary text-xs flex-shrink-0" onClick$={() => { local.editing = false; }}>Cancel</button>
        </div>
      ) : (
        <span
          class={`flex-1 text-sm cursor-pointer ${step.completed ? "line-through" : ""}`}
          style={step.completed ? "color:var(--color-text-secondary)" : "color:var(--color-text-primary)"}
          onClick$={() => { local.draft = step.title; local.editing = true; }}
        >
          {step.title}
        </span>
      )}

      {/* Focus today toggle */}
      {!props.readonly && !step.completed && (
        <button
          class={`focus-toggle ${step.focusToday ? "active" : ""}`}
          onClick$={() => {
            if (!step.focusToday && focusCount >= MAX_FOCUS_STEPS) {
              props.onFocusLimit$();
              return;
            }
            props.toggleFocusStep$(goal.id, milestone.id, step.id);
          }}
          title={step.focusToday ? "Remove from today's focus" : "Add to today's focus"}
        >
          {step.focusToday ? "★ Focus" : "☆ Focus"}
        </button>
      )}

      {/* Delete */}
      {!props.readonly && (
        <>
          {local.deleteConfirm ? (
            <div class="flex items-center gap-1">
              <button class="btn-danger text-xs" onClick$={() => {
                const idx = milestone.steps.findIndex((s) => s.id === step.id);
                if (idx !== -1) milestone.steps.splice(idx, 1);
                milestone.completed = checkMilestoneAutoComplete(milestone);
                props.persist$();
              }}>Del</button>
              <button class="btn-secondary text-xs px-1.5 py-0.5" onClick$={() => { local.deleteConfirm = false; }}>No</button>
            </div>
          ) : (
            <button
              class="btn-danger opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              onClick$={() => { local.deleteConfirm = true; }}
            >
              ✕
            </button>
          )}
        </>
      )}
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Export Drawer (Path Pack JSON / Markdown report)
// ──────────────────────────────────────────────────────────

const ExportDrawer = component$<{
  state: AppState & { exportTab: "json" | "markdown"; copyConfirm: boolean };
  onClose$: () => void;
}>((props) => {
  const { state } = props;
  const closeRef = useSignal<HTMLButtonElement>();
  const text = state.exportTab === "json" ? buildPathPackJson(state) : buildMarkdownReport(state);
  const filename = state.exportTab === "json" ? "path-pack.json" : "progress.md";
  const mime = state.exportTab === "json" ? "application/json" : "text/markdown";

  useVisibleTask$(() => { closeRef.value?.focus(); });

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.35)" role="dialog" aria-modal="true" aria-label="Export Path Pack">
      <div class="card w-full max-w-2xl mx-4 slide-in" style="max-height:85vh;display:flex;flex-direction:column">
        <div class="flex items-center justify-between p-4" style="border-bottom:1px solid #e5e7eb">
          <h2 style="font-size:1.2rem;color:var(--color-text-primary)">Export Path Pack</h2>
          <button ref={closeRef} class="btn-secondary" aria-label="Close export" onClick$={props.onClose$}>✕ Close</button>
        </div>
        <div class="flex gap-2 px-4 pt-3">
          <button
            class={state.exportTab === "json" ? "btn-primary" : "btn-secondary"}
            aria-pressed={state.exportTab === "json" ? "true" : "false"}
            onClick$={() => { state.exportTab = "json"; state.copyConfirm = false; }}
          >
            Path Pack JSON
          </button>
          <button
            class={state.exportTab === "markdown" ? "btn-primary" : "btn-secondary"}
            aria-pressed={state.exportTab === "markdown" ? "true" : "false"}
            onClick$={() => { state.exportTab = "markdown"; state.copyConfirm = false; }}
          >
            Markdown report
          </button>
        </div>
        <p class="px-4 pt-2 text-xs" style="color:var(--color-text-secondary)">
          Regenerated live from your current goals, milestones, steps, and Today's Focus.
        </p>
        <pre
          class="mx-4 my-3 p-3 rounded-md text-xs"
          aria-label="Export preview"
          style="background:#f6f5f0;overflow:auto;flex:1;white-space:pre-wrap;font-family:'SFMono-Regular',monospace;color:var(--color-text-primary)"
        >{text}</pre>
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
// Import Modal (Path Pack JSON)
// ──────────────────────────────────────────────────────────

const ImportModal = component$<{
  error: string;
  onValidate$: (text: string) => void;
  onCancel$: () => void;
}>((props) => {
  const local = useStore({ text: "", pendingConfirm: false, fileName: "" });

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.35)" role="dialog" aria-modal="true" aria-label="Import Path Pack">
      <div class="card w-full max-w-lg mx-4 slide-in p-5">
        <h2 style="font-size:1.2rem;margin-bottom:0.75rem;color:var(--color-text-primary)">Import Path Pack</h2>
        <p class="text-xs mb-3" style="color:var(--color-text-secondary)">
          Load a Path Pack JSON file (format focuspath-path-pack-v1). Importing replaces your current session.
        </p>
        <label class="block text-sm mb-1" for="import-file" style="color:var(--color-text-secondary)">Path Pack file</label>
        <input
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
          <p class="mb-2 text-sm" role="alert" style="color:var(--color-error)">{props.error}</p>
        )}
        {local.pendingConfirm && (
          <div class="mb-3 p-2 rounded-md text-sm" style="background:#fef3c7;color:#92400e;border:1px solid var(--color-warning)">
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
// Command Palette (fuzzy goal / milestone jump)
// ──────────────────────────────────────────────────────────

// Subsequence fuzzy match: every character of `query` must appear in `target`
// in order, but not necessarily contiguously (e.g. "lnch pdcst" matches
// "Launch my podcast"). Returns a score where lower is better — tighter,
// earlier matches rank first — or null when the query isn't a subsequence.
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
  const inputRef = useSignal<HTMLInputElement>();
  useVisibleTask$(() => { inputRef.value?.focus(); });

  const q = state.paletteQuery.trim();
  type Row = { goalId: string; milestoneId: string; label: string; sub: string; score: number };
  const rows: Row[] = [];
  for (const g of state.goals) {
    if (g.completed) continue;
    const goalScore = fuzzyScore(q, g.title);
    if (goalScore !== null) {
      rows.push({ goalId: g.id, milestoneId: "", label: g.title, sub: "Goal", score: goalScore });
    }
    for (const m of g.milestones) {
      const milestoneScore = fuzzyScore(q, m.title);
      if (milestoneScore !== null) {
        rows.push({ goalId: g.id, milestoneId: m.id, label: m.title, sub: `Milestone · ${g.title}`, score: milestoneScore });
      }
    }
  }
  rows.sort((a, b) => a.score - b.score);
  const shown = rows.slice(0, 20);

  return (
    <div
      class="fixed inset-0 z-50 flex items-start justify-center"
      style="background:rgba(0,0,0,0.35);padding-top:10vh"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick$={(e) => { if (e.target === e.currentTarget) props.onClose$(); }}
    >
      <div class="card w-full max-w-lg mx-4 slide-in" style="display:flex;flex-direction:column;max-height:70vh">
        <input
          ref={inputRef}
          type="text"
          aria-label="Search goals and milestones"
          placeholder="Jump to a goal or milestone…"
          class="m-3"
          value={state.paletteQuery}
          onInput$={(e) => { state.paletteQuery = (e.target as HTMLInputElement).value; }}
        />
        <div style="overflow:auto" class="px-3 pb-3">
          {shown.length === 0 ? (
            <p class="text-sm p-2" style="color:var(--color-text-secondary)">No matching goals or milestones.</p>
          ) : (
            shown.map((r) => (
              <button
                key={`${r.goalId}-${r.milestoneId}`}
                class="w-full text-left p-2 rounded-md transition-colors"
                style="background:none;border:none;cursor:pointer"
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
