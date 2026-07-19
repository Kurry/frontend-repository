import { atom, createStore } from "jotai";
import type { AppState, Habit, Category, ToastMessage } from "./types";

// Explicit Jotai store instance (rather than the implicit default store) so
// the WebMCP surface (src/webmcp.ts) can read/write the SAME atoms the React
// tree renders from, via store.get(atom) / store.set(atom, ...). This is not
// a parallel state implementation — it is the identical store the <Provider>
// below is wired to.
export const jotaiStore = createStore();

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const STORAGE_KEY = "loopdaily_state_v1";
const BACKUP_STORAGE_KEY = "loopdaily_state_backup_v1";

const defaultState: AppState = {
  habits: [],
  categories: [],
  activeCategoryFilter: null,
};

function saveToStorage(key: string, value: unknown): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
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
    typeof h.completions === "object" &&
    h.completions !== null &&
    typeof h.order === "number" &&
    typeof h.createdAt === "string"
  );
}

function isValidCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.id === "string" && typeof c.name === "string";
}

function isValidAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (!Array.isArray(s.habits) || !Array.isArray(s.categories)) return false;
  if (!(s.activeCategoryFilter === null || typeof s.activeCategoryFilter === "string")) {
    return false;
  }
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

function loadInitialState(): {
  state: AppState;
  recoveryActive: boolean;
  recoveryMessage: string;
} {
  if (typeof window === "undefined") {
    return { state: defaultState, recoveryActive: false, recoveryMessage: "" };
  }

  const primary = parseStoredState(localStorage.getItem(STORAGE_KEY));
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
        "Stored data was corrupted. Restored your last valid snapshot. Use Retry to keep it or Reset to start fresh.",
    };
  }

  const hadPrimary = localStorage.getItem(STORAGE_KEY) !== null;
  if (hadPrimary) {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    state: defaultState,
    recoveryActive: hadPrimary,
    recoveryMessage: hadPrimary
      ? "Stored data was unreadable. Started from a clean state. Use Reset to confirm or create new habits."
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

export const updateHabitAtom = atom(
  null,
  (get, set, id: string, updates: Partial<Habit>) => {
    const state = get(appStateAtom);
    const habits = state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
    set(appStateAtom, { ...state, habits });
  }
);

export const deleteHabitAtom = atom(
  null,
  (get, set, id: string) => {
    const state = get(appStateAtom);
    const habits = state.habits.filter((h) => h.id !== id);
    set(appStateAtom, { ...state, habits });
  }
);

export const toggleCompletionAtom = atom(
  null,
  (get, set, id: string, day: string) => {
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
  }
);

export const stepCompletionAtom = atom(
  null,
  (get, set, id: string, day: string, delta: number) => {
    const state = get(appStateAtom);
    const habits = state.habits.map((h) => {
      if (h.id !== id || h.targetType !== "count") return h;
      const current = h.completions[day] || 0;
      const newCount = Math.max(0, Math.min(h.targetCount, current + delta));
      return { ...h, completions: { ...h.completions, [day]: newCount } };
    });
    set(appStateAtom, { ...state, habits });
  }
);

export const reorderHabitsAtom = atom(
  null,
  (get, set, fromIndex: number, toIndex: number) => {
    const state = get(appStateAtom);
    const sorted = [...state.habits].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    const habits = sorted.map((h, i) => ({ ...h, order: i }));
    set(appStateAtom, { ...state, habits });
  }
);

export const addCategoryAtom = atom(null, (get, set, name: string) => {
  const state = get(appStateAtom);
  const newCat: Category = { id: genId(), name };
  set(appStateAtom, { ...state, categories: [...state.categories, newCat] });
  return newCat;
});

export const deleteCategoryAtom = atom(null, (get, set, id: string) => {
  const state = get(appStateAtom);
  const categories = state.categories.filter((c) => c.id !== id);
  const habits = state.habits.map((h) =>
    h.categoryId === id ? { ...h, categoryId: null } : h
  );
  const filter = state.activeCategoryFilter === id ? null : state.activeCategoryFilter;
  set(appStateAtom, { ...state, categories, habits, activeCategoryFilter: filter });
});

function normalizeImportedData(data: unknown): AppState | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.habits)) return null;

  const validHabits: Habit[] = obj.habits
    .filter((h: unknown) => h && typeof h === "object")
    .map((h: Record<string, unknown>, index: number) => ({
      id: typeof h.id === "string" ? h.id : genId(),
      name: typeof h.name === "string" ? h.name : "Imported habit",
      icon: typeof h.icon === "string" ? h.icon : "🎯",
      targetType: h.targetType === "count" ? "count" : "once",
      targetCount: typeof h.targetCount === "number" ? h.targetCount : 1,
      categoryId: typeof h.categoryId === "string" ? h.categoryId : null,
      reminder: typeof h.reminder === "string" ? h.reminder : "",
      paused: Boolean(h.paused),
      completions:
        h.completions && typeof h.completions === "object" && !Array.isArray(h.completions)
          ? (h.completions as Record<string, number>)
          : {},
      order: typeof h.order === "number" ? h.order : index,
      createdAt: typeof h.createdAt === "string" ? h.createdAt : new Date().toISOString(),
    }));

  const validCategories: Category[] = Array.isArray(obj.categories)
    ? obj.categories
        .filter((c: unknown) => c && typeof c === "object")
        .map((c: Record<string, unknown>) => ({
          id: typeof c.id === "string" ? c.id : genId(),
          name: typeof c.name === "string" ? c.name : "Unnamed",
        }))
    : [];

  return {
    habits: validHabits,
    categories: validCategories,
    activeCategoryFilter: null,
  };
}

export const importDataAtom = atom(null, (get, set, data: unknown) => {
  const normalized = normalizeImportedData(data);
  if (!normalized) {
    return { success: false, habitCount: 0, categoryCount: 0 };
  }

  const current = get(appStateAtom);
  saveToStorage(BACKUP_STORAGE_KEY, current);

  set(appStateAtom, normalized);
  return {
    success: true,
    habitCount: normalized.habits.length,
    categoryCount: normalized.categories.length,
  };
});

export const retryRecoveryAtom = atom(null, (get, set) => {
  const backup = parseStoredState(
    typeof window !== "undefined" ? localStorage.getItem(BACKUP_STORAGE_KEY) : null
  );
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
    // ignore
  }
  set(recoveryAtom, { active: false, message: "" });
});

export const toastsAtom = atom<ToastMessage[]>([]);

export const addToastAtom = atom(
  null,
  (get, set, text: string, type: ToastMessage["type"] = "success") => {
    const toast: ToastMessage = { id: genId(), text, type };
    set(toastsAtom, [...get(toastsAtom), toast]);
    setTimeout(() => {
      set(removeToastAtom, toast.id);
    }, 3000);
  }
);

export const removeToastAtom = atom(null, (get, set, id: string) => {
  set(
    toastsAtom,
    get(toastsAtom).filter((t) => t.id !== id)
  );
});

export const malformedSample = {
  habits: [
    { id: "test1", name: "Malformed Habit", icon: "🔥", targetType: "once", completions: "not_an_object" },
    null,
    { id: "test2", name: 12345, completions: {} },
    undefined,
    { id: "test3" },
  ],
  categories: [{ id: "cat1", name: "Test" }, null, "invalid"],
  extraField: "should be ignored",
};
