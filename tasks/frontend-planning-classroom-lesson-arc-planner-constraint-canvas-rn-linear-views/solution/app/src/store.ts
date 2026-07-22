import { create } from 'zustand';
import type { LessonBlock, ClassroomLessonArcPlannerSession } from './types';

interface AppState {
  records: LessonBlock[];
  history: LessonBlock[][];
  redoStack: LessonBlock[][];
  filter: "all" | "draft" | "ready" | "changed" | "archived" | "conflict";

  // Actions
  setFilter: (filter: AppState["filter"]) => void;
  addRecord: (record: Omit<LessonBlock, "id" | "status">) => void;
  updateRecord: (id: string, record: Partial<LessonBlock>) => void;
  deleteRecord: (id: string) => void;
  undo: () => void;
  redo: () => void;
  importSession: (session: ClassroomLessonArcPlannerSession) => void;
  clearSession: () => void;

  // Computed (will be updated on mutations or used directly)
  getDerivedSummary: () => Record<string, any>;
  exportSession: () => ClassroomLessonArcPlannerSession;
}

export const LANES = ["Backlog", "Morning", "Afternoon"];
export const MAX_ITEMS_PER_LANE = 5;

export const useAppStore = create<AppState>((set, get) => ({
  records: [],
  history: [],
  redoStack: [],
  filter: "all",

  setFilter: (filter) => set({ filter }),

  addRecord: (recordData) => {
    set((state) => {
      const newRecord: LessonBlock = {
        id: Math.random().toString(36).substr(2, 9),
        status: "draft",
        ...recordData
      };
      const newRecords = [...state.records, newRecord];
      return {
        records: newRecords,
        history: [...state.history, state.records],
        redoStack: []
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      let isConflict = false;
      const testRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);

      const lane = updates.lane || state.records.find(r => r.id === id)?.lane;
      if (lane && lane !== "Backlog") {
          const laneCount = testRecords.filter(r => r.lane === lane).length;
          if (laneCount > MAX_ITEMS_PER_LANE) {
              isConflict = true;
          }
      }

      const newRecords = testRecords.map(record => {
        if (record.lane === lane && lane !== "Backlog") {
           if (isConflict) {
               return { ...record, status: "conflict" };
           } else if (record.status === "conflict") {
               return { ...record, status: "resolved" };
           } else if (record.id === id) {
               return { ...record, status: "changed" };
           }
        }

        return record;
      });

      return {
        records: newRecords,
        history: [...state.history, state.records],
        redoStack: []
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        records: newRecords,
        history: [...state.history, state.records],
        redoStack: []
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const previousRecords = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        records: previousRecords,
        history: newHistory,
        redoStack: [state.records, ...state.redoStack]
      };
    });
  },

  redo: () => {
     set((state) => {
      if (state.redoStack.length === 0) return state;
      const nextRecords = state.redoStack[0];
      const newRedoStack = state.redoStack.slice(1);
      return {
        records: nextRecords,
        history: [...state.history, state.records],
        redoStack: newRedoStack
      };
    });
  },

  importSession: (session) => {
    set(() => ({
      records: session.records,
      history: [],
      redoStack: []
    }));
  },

  clearSession: () => {
      set(() => ({
          records: [],
          history: [],
          redoStack: []
      }));
  },

  getDerivedSummary: () => {
    const records = get().records;
    const summary: Record<string, { count: number, isConflict: boolean }> = {};
    LANES.forEach(lane => {
        const laneRecords = records.filter(r => r.lane === lane);
        summary[lane] = {
            count: laneRecords.length,
            isConflict: lane !== "Backlog" && laneRecords.length > MAX_ITEMS_PER_LANE
        };
    });
    return summary;
  },

  exportSession: () => {
    return {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: get().records,
      derived: { summary: get().getDerivedSummary() },
      history: get().history
    };
  }
}));
