import { useSyncExternalStore } from "react";

export type ColorStatus = "empty" | "draft" | "ready" | "changed" | "archived";
export type ReconcilerState = "idle" | "selected" | "changed" | "conflict" | "resolved";

export interface ColorRecord {
  id: string;
  name: string;
  hex: string;
  status: ColorStatus;
  batchReconcilerState?: ReconcilerState;
}

export interface DerivedSummary {
  total: number;
  byStatus: Record<ColorStatus, number>;
  reconciledCount: number;
}

export interface SessionHistoryEvent {
  action: string;
  timestamp: string;
  details?: any;
}

export interface SessionState {
  schemaVersion: "palette-harmony-v1";
  exportedAt: string;
  records: ColorRecord[];
  derived: DerivedSummary;
  history: SessionHistoryEvent[];
}

let state: SessionState = {
  schemaVersion: "palette-harmony-v1",
  exportedAt: new Date().toISOString(),
  records: [
    { id: "1", name: "Ocean Blue", hex: "#0077b6", status: "ready" },
    { id: "2", name: "Crimson Red", hex: "#dc2f02", status: "draft" },
    { id: "3", name: "Forest Green", hex: "#2d6a4f", status: "archived" },
  ],
  derived: {
    total: 3,
    byStatus: { empty: 0, draft: 1, ready: 1, changed: 0, archived: 1 },
    reconciledCount: 0
  },
  history: [
    { action: "seed_initial_state", timestamp: new Date().toISOString() }
  ]
};

// Undo history
let historyStack: SessionState[] = [];

const listeners = new Set<() => void>();

function emitChange() {
  updateDerived();
  listeners.forEach((listener) => listener());
}

function updateDerived() {
  const byStatus: Record<ColorStatus, number> = { empty: 0, draft: 0, ready: 0, changed: 0, archived: 0 };
  state.records.forEach(r => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });

  state.derived = {
    total: state.records.length,
    byStatus,
    reconciledCount: state.records.filter(r => r.batchReconcilerState === "resolved").length
  };
}

function saveToHistory() {
  historyStack.push(JSON.parse(JSON.stringify(state)));
}

export const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  addRecord(record: Omit<ColorRecord, "id" | "status">) {
    saveToHistory();
    const id = Date.now().toString();
    state = {
      ...state,
      records: [...state.records, { ...record, id, status: "draft", batchReconcilerState: "idle" }],
      history: [...state.history, { action: "add_record", timestamp: new Date().toISOString(), details: { id } }]
    };
    emitChange();
  },
  updateRecord(id: string, updates: Partial<ColorRecord>) {
    saveToHistory();
    state = {
      ...state,
      records: state.records.map(r => r.id === id ? { ...r, ...updates, status: "changed" } : r),
      history: [...state.history, { action: "update_record", timestamp: new Date().toISOString(), details: { id } }]
    };
    emitChange();
  },
  archiveRecord(id: string) {
    saveToHistory();
    state = {
      ...state,
      records: state.records.map(r => r.id === id ? { ...r, status: "archived" } : r),
      history: [...state.history, { action: "archive_record", timestamp: new Date().toISOString(), details: { id } }]
    };
    emitChange();
  },
  deleteRecord(id: string) {
    saveToHistory();
    state = {
      ...state,
      records: state.records.filter(r => r.id !== id),
      history: [...state.history, { action: "delete_record", timestamp: new Date().toISOString(), details: { id } }]
    };
    emitChange();
  },
  toggleSelection(id: string) {
    saveToHistory();
    state = {
      ...state,
      records: state.records.map(r => {
        if (r.id === id) {
          const newState = r.batchReconcilerState === "selected" ? "idle" : "selected";
          return { ...r, batchReconcilerState: newState };
        }
        return r;
      }),
      history: [...state.history, { action: "toggle_selection", timestamp: new Date().toISOString(), details: { id } }]
    };
    emitChange();
  },
  reconcileBatch() {
    saveToHistory();

    // Check for conflicts: archived items cannot be reconciled
    const selected = state.records.filter(r => r.batchReconcilerState === "selected");
    const hasConflict = selected.some(r => r.status === "archived");

    if (hasConflict) {
      state = {
        ...state,
        records: state.records.map(r =>
          r.batchReconcilerState === "selected"
            ? { ...r, batchReconcilerState: "conflict" }
            : r
        ),
        history: [...state.history, { action: "reconcile_batch_conflict", timestamp: new Date().toISOString() }]
      };
    } else {
      state = {
        ...state,
        records: state.records.map(r =>
          r.batchReconcilerState === "selected"
            ? { ...r, status: "ready", batchReconcilerState: "resolved" }
            : r
        ),
        history: [...state.history, { action: "reconcile_batch_success", timestamp: new Date().toISOString() }]
      };
    }
    emitChange();
  },
  undo() {
    if (historyStack.length > 0) {
      const prev = historyStack.pop();
      if (prev) {
        state = prev;
        emitChange();
      }
    }
  },
  hasUndo() {
    return historyStack.length > 0;
  }
};

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function exportArtifact(): string {
  const snapshot = store.getSnapshot();
  const toExport = { ...snapshot, exportedAt: new Date().toISOString() };
  return JSON.stringify(toExport, null, 2);
}

export function importArtifact(json: string): boolean {
  try {
    const parsed = JSON.parse(json);

    // Basic structural validation
    if (parsed.schemaVersion !== "palette-harmony-v1") return false;
    if (!Array.isArray(parsed.records)) return false;
    if (!parsed.derived || typeof parsed.derived.total !== "number") return false;
    if (!Array.isArray(parsed.history)) return false;

    // Field-level validations for records
    const validStatuses = ["empty", "draft", "ready", "changed", "archived"];
    const validReconcilerStates = ["idle", "selected", "changed", "conflict", "resolved", undefined];

    const ids = new Set();
    for (const record of parsed.records) {
      if (!record.id || typeof record.id !== "string") return false;
      if (ids.has(record.id)) return false; // duplicate id
      ids.add(record.id);

      if (!record.name || typeof record.name !== "string" || record.name.trim() === "") return false;
      if (!/^#[0-9A-Fa-f]{6}$/.test(record.hex)) return false;
      if (!validStatuses.includes(record.status)) return false;
      if (!validReconcilerStates.includes(record.batchReconcilerState)) return false;
    }

    saveToHistory();
    state = parsed;
    emitChange();
    return true;
  } catch (e) {
    return false;
  }
}
