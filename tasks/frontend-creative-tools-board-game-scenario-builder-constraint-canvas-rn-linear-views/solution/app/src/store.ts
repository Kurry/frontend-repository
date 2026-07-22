import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ScenarioRecord, ScenarioStatus, ViewMode, ScenarioSessionState } from './types';
import { arrayMove } from '@dnd-kit/sortable';

// Validation constraints
const MAX_DURATION = 120;
const MAX_PLAYERS = 8;
const MIN_PLAYERS = 1;

export const validateCardForStatus = (card: ScenarioRecord, newStatus: ScenarioStatus): { valid: boolean; reason?: string } => {
  if (newStatus === 'ready' || newStatus === 'resolved') {
    if (card.duration > MAX_DURATION) return { valid: false, reason: 'Duration exceeds maximum of 120 minutes' };
    if (card.requiredPlayers < MIN_PLAYERS || card.requiredPlayers > MAX_PLAYERS) return { valid: false, reason: `Players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}` };
    if (!card.title.trim()) return { valid: false, reason: 'Title is required' };
  }
  return { valid: true };
};

export const validateRecordBounds = (card: ScenarioRecord): boolean => {
  if (card.duration < 1 || card.duration > MAX_DURATION) return false;
  if (card.requiredPlayers < MIN_PLAYERS || card.requiredPlayers > MAX_PLAYERS) return false;
  if (!card.title.trim()) return false;
  return true;
};

export interface AppState {
  viewMode: ViewMode;
  records: ScenarioRecord[];
  history: ScenarioRecord[][];
  future: ScenarioRecord[][];
  selectedRecordId: string | null;
  conflictDialogData: { record: ScenarioRecord; intendedStatus: ScenarioStatus; reason: string } | null;

  setViewMode: (mode: ViewMode) => void;
  setSelectedRecordId: (id: string | null) => void;
  setConflictDialogData: (data: { record: ScenarioRecord; intendedStatus: ScenarioStatus; reason: string } | null) => void;

  addRecord: (record: Omit<ScenarioRecord, 'id' | 'status' | 'archived'>) => void;
  updateRecord: (id: string, updates: Partial<ScenarioRecord>) => void;
  deleteRecord: (id: string) => void;
  moveRecord: (id: string, newStatus: ScenarioStatus, skipValidation?: boolean) => void;
  reorderRecord: (id: string, overId: string, newStatus: ScenarioStatus) => void;
  resolveConflict: (id: string, updates: Partial<ScenarioRecord>, intendedStatus: ScenarioStatus) => void;
  archiveRecord: (id: string) => void;

  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  exportSession: () => string;
  importSession: (jsonString: string) => { success: boolean; error?: string };
  clearSession: () => void;
}

const seedRecords: ScenarioRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: uuidv4(),
  title: `Scenario Card ${i + 1}`,
  description: `Description for scenario ${i + 1}`,
  requiredPlayers: Math.floor(Math.random() * 6) + 1,
  duration: Math.floor(Math.random() * 60) + 15,
  status: 'draft',
  archived: false,
}));

export const useStore = create<AppState>((set, get) => ({
  viewMode: 'constraint-canvas',
  records: seedRecords,
  history: [],
  future: [],
  selectedRecordId: null,
  conflictDialogData: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedRecordId: (id) => set({ selectedRecordId: id }),
  setConflictDialogData: (data) => set({ conflictDialogData: data }),

  saveHistory: () => {
    set((state) => ({
      history: [...state.history, state.records],
      future: []
    }));
  },

  addRecord: (data) => {
    get().saveHistory();
    set((state) => ({
      records: [...state.records, { ...data, id: uuidv4(), status: 'draft', archived: false }]
    }));
  },

  updateRecord: (id, updates) => {
    get().saveHistory();
    set((state) => ({
      records: state.records.map((r) => r.id === id ? { ...r, ...updates } : r)
    }));
  },

  deleteRecord: (id) => {
    get().saveHistory();
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
    }));
  },

  archiveRecord: (id) => {
    get().saveHistory();
    set((state) => ({
      records: state.records.map((r) => r.id === id ? { ...r, archived: true } : r)
    }));
  },

  moveRecord: (id, newStatus, skipValidation = false) => {
    const record = get().records.find((r) => r.id === id);
    if (!record) return;

    if (!skipValidation) {
      const validation = validateCardForStatus(record, newStatus);
      if (!validation.valid) {
        set({ conflictDialogData: { record, intendedStatus: newStatus, reason: validation.reason! } });
        get().saveHistory();
        set((state) => ({
          records: state.records.map((r) => r.id === id ? { ...r, status: 'conflict', conflictReason: validation.reason } : r)
        }));
        return;
      }
    }

    get().saveHistory();
    set((state) => ({
      records: state.records.map((r) => r.id === id ? { ...r, status: newStatus, conflictReason: undefined } : r)
    }));
  },

  reorderRecord: (id, overId, newStatus) => {
    const state = get();
    const oldIndex = state.records.findIndex(r => r.id === id);
    const newIndex = state.records.findIndex(r => r.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const record = state.records[oldIndex];
      const validation = validateCardForStatus(record, newStatus);

      if (!validation.valid) {
        set({ conflictDialogData: { record, intendedStatus: newStatus, reason: validation.reason! } });
        get().saveHistory();
        set((state) => ({
          records: state.records.map((r) => r.id === id ? { ...r, status: 'conflict', conflictReason: validation.reason } : r)
        }));
        return;
      }

      get().saveHistory();
      set((state) => {
        const newRecords = arrayMove(state.records, oldIndex, newIndex);
        return {
          records: newRecords.map((r) => r.id === id ? { ...r, status: newStatus, conflictReason: undefined } : r)
        };
      });
    } else {
      get().moveRecord(id, newStatus);
    }
  },

  resolveConflict: (id, updates, intendedStatus) => {
    get().saveHistory();
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === id) {
          const updatedRecord = { ...r, ...updates, conflictReason: undefined };
          // After applying updates, check if it's valid for intended status
          const validation = validateCardForStatus(updatedRecord, intendedStatus);
          if (validation.valid) {
            return { ...updatedRecord, status: intendedStatus };
          } else {
             // Still conflict
             return { ...updatedRecord, status: 'conflict', conflictReason: validation.reason };
          }
        }
        return r;
      }),
      conflictDialogData: null
    }));

    // Check if it's still conflict after update
    const updatedRecord = get().records.find(r => r.id === id);
    if(updatedRecord?.status === 'conflict') {
      set({ conflictDialogData: { record: updatedRecord, intendedStatus, reason: updatedRecord.conflictReason! } });
    }
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        records: previous,
        history: newHistory,
        future: [state.records, ...state.future]
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        records: next,
        history: [...state.history, state.records],
        future: newFuture
      };
    });
  },

  exportSession: () => {
    const state = get();
    const session: ScenarioSessionState = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        totalRecords: state.records.length,
        conflictCount: state.records.filter((r) => r.status === 'conflict').length
      },
      history: state.history
    };
    return JSON.stringify(session, null, 2);
  },

  importSession: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.schemaVersion !== 'v1') return { success: false, error: 'Invalid schema version' };
      if (!Array.isArray(data.records)) return { success: false, error: 'Invalid records format' };
      if (data.history && !Array.isArray(data.history)) return { success: false, error: 'Invalid history format' };

      const seenIds = new Set<string>();

      // Basic validation of records
      for (const r of data.records) {
        if (!r.id || typeof r.title !== 'string' || typeof r.requiredPlayers !== 'number' || typeof r.duration !== 'number' || !r.status) {
          return { success: false, error: 'Invalid record shape found' };
        }
        if (seenIds.has(r.id)) {
          return { success: false, error: 'Duplicate ID found' };
        }
        seenIds.add(r.id);

        if (!validateRecordBounds(r)) {
           return { success: false, error: 'Record bounds validation failed' };
        }
      }

      set({
        records: data.records,
        history: data.history || [],
        future: [],
        selectedRecordId: null,
        conflictDialogData: null
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Failed to parse JSON' };
    }
  },

  clearSession: () => {
    set({
      records: [],
      history: [],
      future: [],
      selectedRecordId: null,
      conflictDialogData: null
    });
  }

}));
