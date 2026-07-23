import { atom, createStore } from "jotai";
import { Habit, Category, AppState, EMOJI_PALETTE } from "./types";
import { z } from "zod";

const STORAGE_KEY = "loopdaily.appState.v1";
const BACKUP_STORAGE_KEY = "loopdaily.appState.backup.v1";
const UI_PREFS_KEY = "loopdaily.ui.v1";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

export type ViewMode = "habits" | "stats" | "heatmap" | "import";

export interface UiPrefs {
  lastView: ViewMode | null;
  coachDismissed: boolean;
}

export const defaultState: AppState = {
  habits: [],
  categories: [],
  activeCategoryFilter: null,
};

function saveToStorage(key: string, state: AppState) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(state));
    }
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}

function readUiPrefs(): UiPrefs {
  if (typeof window === "undefined") return { lastView: null, coachDismissed: false };
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return { lastView: null, coachDismissed: false };
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      lastView:
        parsed.lastView === "habits" ||
        parsed.lastView === "stats" ||
        parsed.lastView === "import"
          ? parsed.lastView
          : null,
      coachDismissed: Boolean(parsed.coachDismissed),
    };
  } catch {
    return { lastView: null, coachDismissed: false };
  }
}

function writeUiPrefs(prefs: UiPrefs) {
  try {
    if (typeof window !== "undefined") localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

// --- New Habit form schema (API-shaped HabitUpsert) ---
const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().max(40),
});

const HabitSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(80),
    icon: z.string().refine((val) => EMOJI_PALETTE.includes(val as (typeof EMOJI_PALETTE)[number])),
    targetType: z.enum(["once", "count"]),
    targetCount: z.number().int().min(1).max(100),
    categoryId: z.string().nullable(),
    reminder: z.string().trim().max(40).optional().default(""),
    paused: z.boolean(),
    completions: z.record(z.string().regex(DATE_RE), z.number().int().min(0)),
    order: z.number().int().min(0),
    createdAt: z.string().datetime(),
  })
  .refine((data) => !(data.targetType === "once" && data.targetCount !== 1));

function isValidCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.id === "string" && typeof c.name === "string";
}

function isValidHabit(value: unknown): value is Habit {
  if (!value || typeof value !== "object") return false;
  const h = value as Record<string, unknown>;
  return (
    typeof h.id === "string" &&
    typeof h.name === "string" &&
    typeof h.icon === "string" &&
    (h.targetType === "once" || h.targetType === "count") &&
    typeof h.targetCount === "number" &&
    (h.categoryId === null || typeof h.categoryId === "string") &&
    typeof h.reminder === "string" &&
    typeof h.paused === "boolean" &&
    !!h.completions &&
    typeof h.completions === "object" &&
    !Array.isArray(h.completions) &&
    typeof h.order === "number" &&
    typeof h.createdAt === "string"
  );
}

function isValidAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (!Array.isArray(s.habits) || !Array.isArray(s.categories)) return false;
  if (!(s.activeCategoryFilter === null || typeof s.activeCategoryFilter === "string")) return false;
  return s.habits.every(isValidHabit) && s.categories.every(isValidCategory);
}

function parseStoredState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// --- Strict Workspace-JSON field-contract validator with named per-field errors ---
export function validateWorkspaceDoc(data: unknown): string[] {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return ["Workspace document must be a JSON object"];
  }
  const obj = data as Record<string, unknown>;

  if (obj.schemaVersion !== "loopdaily.workspace.v1") {
    errors.push("schemaVersion must be exactly loopdaily.workspace.v1");
  }
  if (typeof obj.exportedAt !== "string") {
    errors.push("exportedAt is required (ISO-8601 datetime string)");
  }
  if (!Array.isArray(obj.habits)) {
    errors.push("habits must be an array");
  }


  if (!Array.isArray(obj.categories)) {
    errors.push("categories must be an array");
  }
  if (!("activeCategoryFilter" in obj)) {
    errors.push("activeCategoryFilter is required (category id or null)");
  }


  if (Array.isArray(obj.categories)) {
    obj.categories.forEach((c: any, i: number) => {
      if (!c || typeof c !== "object") {
        errors.push(`categories[${i}] must be an object`);
        return;
      }
      if (typeof c.id !== "string" || !c.id.trim()) {
        errors.push(`categories[${i}].id must be a non-empty string`);
      }
      if (typeof c.name !== "string" || !c.name.trim() || c.name.length > 40) {
        errors.push(`categories[${i}].name must be a 1-40 character string`);
      }
    });
  }

  if (Array.isArray(obj.habits)) {
    let prevOrder = -1;
    obj.habits.forEach((h: any, i: number) => {
      if (!h || typeof h !== "object") {
        errors.push(`habits[${i}] must be an object`);
        return;
      }
      if (typeof h.id !== "string" || !h.id.trim()) errors.push(`habits[${i}].id must be non-empty`);
      if (typeof h.name !== "string" || !h.name.trim() || h.name.length > 80) errors.push(`habits[${i}].name must be 1-80 chars`);
      if (typeof h.icon !== "string" || !['🎯', '💧', '🏃', '📚', '🧘', '🍎', '💤', '🌱', '☀️', '📝', '🎸', '🎨'].includes(h.icon)) errors.push(`habits[${i}].icon must be a fixed palette emoji`);
      if (h.targetType !== "once" && h.targetType !== "count") errors.push(`habits[${i}].targetType must be once|count`);
      if (typeof h.targetCount !== "number" || !Number.isInteger(h.targetCount) || h.targetCount < 1 || h.targetCount > 100) errors.push(`habits[${i}].targetCount must be 1-100`);
      if (h.targetType === "once" && h.targetCount !== 1) errors.push(`habits[${i}].targetCount must be 1 if once`);
      if (h.categoryId !== null && typeof h.categoryId !== "string") errors.push(`habits[${i}].categoryId unresolved`);
      if (typeof h.reminder !== "string" || h.reminder.length > 40) errors.push(`habits[${i}].reminder must be 0-40 chars`);
      if (typeof h.paused !== "boolean") errors.push(`habits[${i}].paused must be boolean`);
      if (typeof h.order !== "number" || h.order < 0) errors.push(`habits[${i}].order must be non-negative integer`);
      if (h.order < prevOrder) errors.push(`habits[${i}] ordering is not strictly sequential`);
      prevOrder = h.order;
      if (typeof h.createdAt !== "string" || isNaN(Date.parse(h.createdAt))) errors.push(`habits[${i}].createdAt must be ISO-8601`);

      if (!h.completions || typeof h.completions !== "object" || Array.isArray(h.completions)) {
        errors.push(`habits[${i}].completions must be an object`);
      } else {
        for (const [k, v] of Object.entries(h.completions)) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) errors.push(`habits[${i}].completions key ${k} must be YYYY-MM-DD`);
          if (typeof v !== "number" || !Number.isInteger(v) || v < 0) errors.push(`habits[${i}].completions[${k}] must be >= 0`);
        }
      }
    });
  }



  if (Array.isArray(obj.categories)) {
    obj.categories.forEach((c: any, i: number) => {
      if (!c || typeof c !== "object") {
        errors.push(`categories[${i}] must be an object`);
        return;
      }
      if (typeof c.id !== "string" || !c.id.trim()) {
        errors.push(`categories[${i}].id must be a non-empty string`);
      }
      if (typeof c.name !== "string" || !c.name.trim() || c.name.length > 40) {
        errors.push(`categories[${i}].name must be a 1-40 character string`);
      }
    });
  }

  if (Array.isArray(obj.habits)) {
    let prevOrder = -1;
    obj.habits.forEach((h: any, i: number) => {
      if (!h || typeof h !== "object") {
        errors.push(`habits[${i}] must be an object`);
        return;
      }
      if (typeof h.id !== "string" || !h.id.trim()) errors.push(`habits[${i}].id must be non-empty`);
      if (typeof h.name !== "string" || !h.name.trim() || h.name.length > 80) errors.push(`habits[${i}].name must be 1-80 chars`);
      if (typeof h.icon !== "string" || !['🎯', '💧', '🏃', '📚', '🧘', '🍎', '💤', '🌱', '☀️', '📝', '🎸', '🎨'].includes(h.icon)) errors.push(`habits[${i}].icon must be a fixed palette emoji`);
      if (h.targetType !== "once" && h.targetType !== "count") errors.push(`habits[${i}].targetType must be once|count`);
      if (typeof h.targetCount !== "number" || !Number.isInteger(h.targetCount) || h.targetCount < 1 || h.targetCount > 100) errors.push(`habits[${i}].targetCount must be 1-100`);
      if (h.targetType === "once" && h.targetCount !== 1) errors.push(`habits[${i}].targetCount must be 1 if once`);
      if (h.categoryId !== null && typeof h.categoryId !== "string") errors.push(`habits[${i}].categoryId unresolved`);
      if (typeof h.reminder !== "string" || h.reminder.length > 40) errors.push(`habits[${i}].reminder must be 0-40 chars`);
      if (typeof h.paused !== "boolean") errors.push(`habits[${i}].paused must be boolean`);
      if (typeof h.order !== "number" || h.order < 0) errors.push(`habits[${i}].order must be non-negative integer`);
      if (h.order < prevOrder) errors.push(`habits[${i}] ordering is not strictly sequential`);
      prevOrder = h.order;
      if (typeof h.createdAt !== "string" || isNaN(Date.parse(h.createdAt))) errors.push(`habits[${i}].createdAt must be ISO-8601`);

      if (!h.completions || typeof h.completions !== "object" || Array.isArray(h.completions)) {
        errors.push(`habits[${i}].completions must be an object`);
      } else {
        for (const [k, v] of Object.entries(h.completions)) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) errors.push(`habits[${i}].completions key ${k} must be YYYY-MM-DD`);
          if (typeof v !== "number" || !Number.isInteger(v) || v < 0) errors.push(`habits[${i}].completions[${k}] must be >= 0`);
        }
      }
    });
  }
 else if (obj.activeCategoryFilter !== null && typeof obj.activeCategoryFilter !== "string") {
    errors.push("activeCategoryFilter must be a category id string or null");
  }
  if (errors.length) return errors; // structural problems first

  const categories = obj.categories as unknown[];
  const categoryIds = new Set<string>();
  categories.forEach((c, i) => {
    if (!c || typeof c !== "object") {
      errors.push(`categories[${i}] must be an object`);
      return;
    }
    const rec = c as Record<string, unknown>;
    if (typeof rec.id !== "string" || rec.id.length === 0) {
      errors.push(`categories[${i}].id must be a non-empty string`);
    } else {
      categoryIds.add(rec.id);
    }
    const name = rec.name;
    if (typeof name !== "string" || name.trim().length === 0) {
      errors.push(`categories[${i}].name must be non-empty`);
    } else if (name.trim().length > 40) {
      errors.push(`categories[${i}].name must be 40 characters or fewer`);
    }
  });

  const habits = obj.habits as unknown[];
  habits.forEach((h, i) => {
    const p = `habits[${i}]`;
    if (!h || typeof h !== "object") {
      errors.push(`${p} must be an object`);
      return;
    }
    const rec = h as Record<string, unknown>;
    if (typeof rec.id !== "string" || rec.id.length === 0) errors.push(`${p}.id must be a non-empty string`);
    if (typeof rec.name !== "string" || rec.name.trim().length === 0) errors.push(`${p}.name must be non-empty`);
    else if (rec.name.trim().length > 80) errors.push(`${p}.name must be 80 characters or fewer`);
    if (typeof rec.icon !== "string" || !EMOJI_PALETTE.includes(rec.icon as (typeof EMOJI_PALETTE)[number]))
      errors.push(`${p}.icon must be one of the fixed emoji palette`);
    if (rec.targetType !== "once" && rec.targetType !== "count")
      errors.push(`${p}.targetType must be one of once|count`);
    if (
      typeof rec.targetCount !== "number" ||
      !Number.isInteger(rec.targetCount) ||
      rec.targetCount < 1 ||
      rec.targetCount > 100
    ) {
      errors.push(`${p}.targetCount must be an integer between 1 and 100`);
    } else if (rec.targetType === "once" && rec.targetCount !== 1) {
      errors.push(`${p}.targetCount must be 1 when targetType is once`);
    }
    if (rec.categoryId !== null && typeof rec.categoryId !== "string")
      errors.push(`${p}.categoryId must be a string id or null`);
    if (typeof rec.reminder === "string" && rec.reminder.trim().length > 40)
      errors.push(`${p}.reminder must be 40 characters or fewer`);
    if (typeof rec.paused !== "boolean") errors.push(`${p}.paused must be a boolean`);
    if (typeof rec.order !== "number" || !Number.isInteger(rec.order) || rec.order < 0)
      errors.push(`${p}.order must be a non-negative integer`);
    if (typeof rec.createdAt !== "string") errors.push(`${p}.createdAt must be an ISO-8601 datetime string`);
    if (!rec.completions || typeof rec.completions !== "object" || Array.isArray(rec.completions)) {
      errors.push(`${p}.completions must be an object mapping YYYY-MM-DD to counts`);
    } else {
      for (const [k, v] of Object.entries(rec.completions as Record<string, unknown>)) {
        if (!DATE_RE.test(k)) errors.push(`${p}.completions key "${k}" must be a YYYY-MM-DD date`);
        if (typeof v !== "number" || !Number.isInteger(v) || v < 0)
          errors.push(`${p}.completions["${k}"] must be a non-negative integer`);
      }
    }
  });

  // Cross-field: unresolved category ids
  habits.forEach((h, i) => {
    if (h && typeof h === "object") {
      const rec = h as Record<string, unknown>;
      if (typeof rec.categoryId === "string" && !categoryIds.has(rec.categoryId)) {
        errors.push(`habits[${i}].categoryId "${rec.categoryId}" does not match any imported category`);
      }
    }
  });
  if (typeof obj.activeCategoryFilter === "string" && !categoryIds.has(obj.activeCategoryFilter)) {
    errors.push(`activeCategoryFilter "${obj.activeCategoryFilter}" does not match any imported category`);
  }

  return errors;
}

function loadInitialState(): { state: AppState; recoveryActive: boolean; recoveryMessage: string } {
  if (typeof window === "undefined") {
    return { state: defaultState, recoveryActive: false, recoveryMessage: "" };
  }

  const primaryRaw = localStorage.getItem(STORAGE_KEY);
  const primary = parseStoredState(primaryRaw);
  if (primary) {
    return { state: primary, recoveryActive: false, recoveryMessage: "" };
  }

  const backup = parseStoredState(localStorage.getItem(BACKUP_STORAGE_KEY));
  if (backup) {
    saveToStorage(STORAGE_KEY, backup);
    return {
      state: backup,
      recoveryActive: true,
      recoveryMessage:
        "Stored data was corrupted. We restored your last valid snapshot. Choose Retry to keep it, or Reset to start from a clean slate.",
    };
  }

  const hadPrimary = primaryRaw !== null;
  if (hadPrimary) localStorage.removeItem(STORAGE_KEY);

  return {
    state: defaultState,
    recoveryActive: hadPrimary,
    recoveryMessage: hadPrimary
      ? "Stored data was unreadable, so we started from a clean state. Choose Reset to confirm, or just create your first habit."
      : "",
  };
}

const boot = loadInitialState();

const appStateBaseAtom = atom<AppState>(boot.state);

export interface RecoveryState {
  active: boolean;
  message: string;
}

export const recoveryAtom = atom<RecoveryState>({
  active: boot.recoveryActive,
  message: boot.recoveryMessage,
});

export const appStateAtom = atom(
  (get) => get(appStateBaseAtom),
  (_get, set, nextState: AppState) => {
    set(appStateBaseAtom, nextState);
    saveToStorage(STORAGE_KEY, nextState);
    saveToStorage(BACKUP_STORAGE_KEY, nextState);
    set(recoveryAtom, { active: false, message: "" });
  }
);

// UI preferences (last opened view, coach-mark dismissal) — small personalisation
// that survives reload alongside the rest of localStorage state.
const uiPrefsBaseAtom = atom<UiPrefs>(readUiPrefs());
export const uiPrefsAtom = atom(
  (get) => get(uiPrefsBaseAtom),
  (_get, set, patch: Partial<UiPrefs>) => {
    const next = { ..._get(uiPrefsBaseAtom), ...patch };
    set(uiPrefsBaseAtom, next);
    writeUiPrefs(next);
  }
);

export const habitsAtom = atom(
  (get) => get(appStateAtom).habits,
  (get, set, habits: Habit[]) => {
    const state = get(appStateAtom);
    set(appStateAtom, { ...state, habits });
  }
);

export const categoriesAtom = atom(
  (get) => get(appStateAtom).categories,
  (get, set, categories: Category[]) => {
    const state = get(appStateAtom);
    set(appStateAtom, { ...state, categories });
  }
);

export const activeFilterAtom = atom(
  (get) => get(appStateAtom).activeCategoryFilter,
  (get, set, filter: string | null) => {
    const state = get(appStateAtom);
    set(appStateAtom, { ...state, activeCategoryFilter: filter });
  }
);

export const addHabitAtom = atom(
  null,
  (get, set, habit: Omit<Habit, "id" | "order" | "createdAt" | "completions">) => {
    const state = get(appStateAtom);
    const maxOrder = state.habits.reduce((max, h) => Math.max(max, h.order), -1);
    const newHabit: Habit = {
      ...habit,
      id: genId(),
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      completions: {},
    };
    set(appStateAtom, { ...state, habits: [...state.habits, newHabit] });
    return newHabit;
  }
);

export const updateHabitAtom = atom(null, (get, set, id: string, updates: Partial<Habit>) => {
  const state = get(appStateAtom);
  const habits = state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
  set(appStateAtom, { ...state, habits });
});

export const deleteHabitAtom = atom(null, (get, set, id: string) => {
  const state = get(appStateAtom);
  const habits = state.habits.filter((h) => h.id !== id);
  set(appStateAtom, { ...state, habits });
});

export const toggleCompletionAtom = atom(null, (get, set, id: string, day: string) => {
  const state = get(appStateAtom);
  const habits = state.habits.map((h) => {
    if (h.id !== id) return h;
    const current = h.completions[day] || 0;
    if (h.targetType === "once") {
      const newCount = current >= 1 ? 0 : 1;
      return { ...h, completions: { ...h.completions, [day]: newCount } };
    }
    return h;
  });
  set(appStateAtom, { ...state, habits });
});

export const stepCompletionAtom = atom(null, (get, set, id: string, day: string, delta: number) => {
  const state = get(appStateAtom);
  const habits = state.habits.map((h) => {
    if (h.id !== id || h.targetType !== "count") return h;
    const current = h.completions[day] || 0;
    const newCount = Math.max(0, Math.min(h.targetCount, current + delta));
    return { ...h, completions: { ...h.completions, [day]: newCount } };
  });
  set(appStateAtom, { ...state, habits });
});

export const reorderHabitsAtom = atom(null, (get, set, fromIndex: number, toIndex: number) => {
  const state = get(appStateAtom);
  const sorted = [...state.habits].sort((a, b) => a.order - b.order);
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);
  const habits = sorted.map((h, i) => ({ ...h, order: i }));
  set(appStateAtom, { ...state, habits });
});

// Commit a new ordering for a visible subset. The subset is projected back into
// its existing global order slots so filtered-out and paused habits never move.
export const reorderByIdsAtom = atom(null, (get, set, ids: string[]) => {
  const state = get(appStateBaseAtom);
  const idSet = new Set(ids);
  const slots = state.habits
    .filter((h) => idSet.has(h.id))
    .map((h) => h.order)
    .sort((a, b) => a - b);
  const orderById = new Map<string, number>();
  ids.forEach((id, i) => {
    if (slots[i] !== undefined) orderById.set(id, slots[i]);
  });
  const habits = state.habits.map((h) => {
    const order = orderById.get(h.id);
    return order === undefined ? h : { ...h, order };
  });
  set(appStateAtom, { ...state, habits });
});

export const addCategoryAtom = atom(null, (get, set, name: string) => {
  const state = get(appStateAtom);
  const newCat: Category = { id: genId(), name };
  set(appStateAtom, { ...state, categories: [...state.categories, newCat] });
  return newCat;
});

export const deleteCategoryAtom = atom(null, (get, set, id: string) => {
  const state = get(appStateAtom);
  const categories = state.categories.filter((c) => c.id !== id);
  const habits = state.habits.map((h) => (h.categoryId === id ? { ...h, categoryId: null } : h));
  const filter = state.activeCategoryFilter === id ? null : state.activeCategoryFilter;
  set(appStateAtom, { ...state, categories, habits, activeCategoryFilter: filter });
});

function normalizeImportedData(data: unknown): AppState | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.habits)) return null;

  const validHabits: Habit[] = (obj.habits as unknown[])
    .filter((h) => h && typeof h === "object")
    .map((h, index) => {
      const rec = h as Record<string, unknown>;
      return {
        id: typeof rec.id === "string" && rec.id ? rec.id : genId(),
        name: typeof rec.name === "string" && rec.name.trim() ? rec.name.trim() : "Imported habit",
        icon:
          typeof rec.icon === "string" && EMOJI_PALETTE.includes(rec.icon as (typeof EMOJI_PALETTE)[number])
            ? rec.icon
            : "🎯",
        targetType: rec.targetType === "count" ? "count" : "once",
        targetCount:
          typeof rec.targetCount === "number" && Number.isInteger(rec.targetCount) && rec.targetCount >= 1 && rec.targetCount <= 100
            ? rec.targetCount
            : 1,
        categoryId: typeof rec.categoryId === "string" ? rec.categoryId : null,
        reminder: typeof rec.reminder === "string" ? rec.reminder.trim().slice(0, 40) : "",
        paused: Boolean(rec.paused),
        completions:
          rec.completions && typeof rec.completions === "object" && !Array.isArray(rec.completions)
            ? Object.fromEntries(
                Object.entries(rec.completions as Record<string, unknown>).filter(
                  ([k, v]) => DATE_RE.test(k) && typeof v === "number" && Number.isInteger(v) && v >= 0
                ) as [string, number][]
              )
            : {},
        order: typeof rec.order === "number" && Number.isInteger(rec.order) && rec.order >= 0 ? rec.order : index,
        createdAt: typeof rec.createdAt === "string" ? rec.createdAt : new Date().toISOString(),
      };
    });

  const validCategories: Category[] = Array.isArray(obj.categories)
    ? (obj.categories as unknown[])
        .filter((c) => c && typeof c === "object")
        .map((c) => {
          const rec = c as Record<string, unknown>;
          return {
            id: typeof rec.id === "string" && rec.id ? rec.id : genId(),
            name: typeof rec.name === "string" && rec.name.trim() ? rec.name.trim() : "Unnamed",
          };
        })
    : [];

  return { habits: validHabits, categories: validCategories, activeCategoryFilter: null };
}

export interface ImportResult {
  success: boolean;
  errors: string[];
  habitCount: number;
  categoryCount: number;
}

export const importDataAtom = atom(null, (get, set, data: unknown): ImportResult => {
  const errors = validateWorkspaceDoc(data);
  if (errors.length) {
    return { success: false, errors, habitCount: 0, categoryCount: 0 };
  }

  const normalized = normalizeImportedData(data);
  if (!normalized) {
    return { success: false, errors: ["Workspace document could not be normalised"], habitCount: 0, categoryCount: 0 };
  }

  const current = get(appStateAtom);
  saveToStorage(BACKUP_STORAGE_KEY, current);

  set(appStateAtom, {
    ...normalized,
    activeCategoryFilter: (data as AppState).activeCategoryFilter,
  });
  return { success: true, errors: [], habitCount: normalized.habits.length, categoryCount: normalized.categories.length };
});

export const importMalformedDataAtom = atom(null, (get, set, data: unknown) => {
  const normalized = normalizeImportedData(data);
  if (!normalized) {
    return { success: false, habitCount: 0, categoryCount: 0 };
  }
  const current = get(appStateAtom);
  saveToStorage(BACKUP_STORAGE_KEY, current);
  set(appStateAtom, normalized);
  return { success: true, habitCount: normalized.habits.length, categoryCount: normalized.categories.length };
});

export const retryRecoveryAtom = atom(null, (get, set) => {
  const backup = parseStoredState(typeof window !== "undefined" ? localStorage.getItem(BACKUP_STORAGE_KEY) : null);
  if (backup) {
    set(appStateAtom, backup);
    set(recoveryAtom, { active: false, message: "" });
    return true;
  }
  set(recoveryAtom, { active: false, message: "" });
  return false;
});

export const resetAppAtom = atom(null, (_get, set) => {
  set(appStateAtom, defaultState);
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
  set(recoveryAtom, { active: false, message: "" });
});

export const malformedSample = {
  schemaVersion: "loopdaily.workspace.v1",
  exportedAt: new Date().toISOString(),
  habits: [
    { id: "rec1", name: "Recovered habit", icon: "🔥", targetType: "once", targetCount: 1, completions: "not_an_object" },
    null,
    { id: "rec2", name: 12345, completions: {} },
    undefined,
    { id: "rec3" },
  ],
  categories: [{ id: "cat1", name: "Recovered" }, null, "invalid"],
  extraField: "ignored by soft recovery",
};

export const jotaiStore = createStore();

// Re-export the form schema for any callers that need it.
export { HabitSchema, CategorySchema };
