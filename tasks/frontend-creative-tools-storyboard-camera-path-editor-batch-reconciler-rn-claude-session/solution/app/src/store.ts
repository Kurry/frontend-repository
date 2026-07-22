import { create } from 'zustand';
import { z } from 'zod';

// Zod Schemas
export const BeatStatusSchema = z.enum(['draft', 'ready', 'changed', 'archived']);

export const StoryBeatSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  status: BeatStatusSchema,
  batchReconcilerState: z.string().optional(),
});

export const DerivedStateSchema = z.object({
  summary: z.object({
    totalBeats: z.number(),
    draftBeats: z.number(),
    readyBeats: z.number(),
    changedBeats: z.number(),
    archivedBeats: z.number(),
    reconciledBatchSize: z.number().optional(),
  }),
});

export const SessionHistoryEntrySchema = z.object({
  timestamp: z.string(),
  action: z.string(),
  details: z.any(),
});

export const StoryboardCameraPathEditorSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(StoryBeatSchema),
  derived: DerivedStateSchema,
  history: z.array(SessionHistoryEntrySchema),
});

export type BeatStatus = z.infer<typeof BeatStatusSchema>;
export type StoryBeat = z.infer<typeof StoryBeatSchema>;
export type DerivedState = z.infer<typeof DerivedStateSchema>;
export type SessionHistoryEntry = z.infer<typeof SessionHistoryEntrySchema>;
export type StoryboardCameraPathEditorSession = z.infer<typeof StoryboardCameraPathEditorSessionSchema>;

export interface StoreState {
  records: StoryBeat[];
  history: SessionHistoryEntry[];
  undoStack: { records: StoryBeat[], history: SessionHistoryEntry[] }[];

  createBeat: (beat: Omit<StoryBeat, 'id'>) => void;
  updateBeat: (id: string, updates: Partial<StoryBeat>) => void;
  archiveBeat: (id: string) => void;
  batchReconcileRecords: (ids: string[]) => void;
  undo: () => void;

  exportSession: () => string;
  importSession: (jsonString: string) => boolean; // returns true on success, false on invalid import

  // Selection state (not persisted)
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateDerivedState = (records: StoryBeat[]): DerivedState => {
  return {
    summary: {
      totalBeats: records.length,
      draftBeats: records.filter(r => r.status === 'draft').length,
      readyBeats: records.filter(r => r.status === 'ready').length,
      changedBeats: records.filter(r => r.status === 'changed').length,
      archivedBeats: records.filter(r => r.status === 'archived').length,
      reconciledBatchSize: records.filter(r => r.batchReconcilerState === 'reconciled').length,
    }
  };
};

export const useStore = create<StoreState>((set, get) => ({
  records: [
    { id: '1', title: 'Opening Scene', description: 'Camera pans across the city', status: 'draft' },
    { id: '2', title: 'Character Intro', description: 'Close up on protagonist', status: 'ready' },
  ],
  history: [],
  undoStack: [],
  selectedIds: [],

  toggleSelection: (id) => set(state => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter(i => i !== id)
      : [...state.selectedIds, id]
  })),

  clearSelection: () => set({ selectedIds: [] }),

  createBeat: (beat) => set(state => {
    const newRecord = { ...beat, id: generateId() };
    const newRecords = [...state.records, newRecord];
    const historyEntry = { timestamp: new Date().toISOString(), action: 'create', details: { id: newRecord.id } };
    return {
      records: newRecords,
      history: [...state.history, historyEntry],
      undoStack: [...state.undoStack, { records: state.records, history: state.history }],
    };
  }),

  updateBeat: (id, updates) => set(state => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    const historyEntry = { timestamp: new Date().toISOString(), action: 'update', details: { id, updates } };
    return {
      records: newRecords,
      history: [...state.history, historyEntry],
      undoStack: [...state.undoStack, { records: state.records, history: state.history }],
    };
  }),

  archiveBeat: (id) => set(state => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' as const } : r);
    const historyEntry = { timestamp: new Date().toISOString(), action: 'archive', details: { id } };
    return {
      records: newRecords,
      history: [...state.history, historyEntry],
      undoStack: [...state.undoStack, { records: state.records, history: state.history }],
    };
  }),

  batchReconcileRecords: (ids) => set(state => {
    if (ids.length === 0) return state; // Do nothing if empty

    // Check for conflicts (e.g. attempting to reconcile archived)
    const hasArchived = state.records.some(r => ids.includes(r.id) && r.status === 'archived');
    if (hasArchived) {
        // Do not perform partial updates if there's a conflict
        return state;
    }

    const newRecords = state.records.map(r => {
      if (ids.includes(r.id)) {
        return { ...r, status: 'changed' as const, batchReconcilerState: 'reconciled' };
      }
      return r;
    });

    const historyEntry = { timestamp: new Date().toISOString(), action: 'batchReconcile', details: { ids } };
    return {
      records: newRecords,
      history: [...state.history, historyEntry],
      undoStack: [...state.undoStack, { records: state.records, history: state.history }],
      selectedIds: [], // Clear selection after batch action
    };
  }),

  undo: () => set(state => {
    if (state.undoStack.length === 0) return state;
    const previousState = state.undoStack[state.undoStack.length - 1];
    return {
      records: previousState.records,
      history: previousState.history,
      undoStack: state.undoStack.slice(0, -1),
    };
  }),

  exportSession: () => {
    const { records, history } = get();
    const session: StoryboardCameraPathEditorSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: calculateDerivedState(records),
      history,
    };
    return JSON.stringify(session, null, 2);
  },

  importSession: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const validated = StoryboardCameraPathEditorSessionSchema.parse(parsed);

      // valid import restores authored structure and regenerates exportedAt
      const regeneratedHistory = [...validated.history, { timestamp: new Date().toISOString(), action: 'import', details: {} }];

      set({
        records: validated.records,
        history: regeneratedHistory,
        undoStack: [],
        selectedIds: [],
      });
      return true;
    } catch (e) {
      console.error("Invalid import", e);
      return false; // Invalid import makes no state change
    }
  },

}));

export { calculateDerivedState };
