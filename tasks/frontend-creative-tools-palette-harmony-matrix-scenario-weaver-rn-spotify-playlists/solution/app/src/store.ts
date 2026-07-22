import { create } from 'zustand';
import { type ColorRecord, type PaletteHarmonyMatrixSession, PaletteHarmonyMatrixSessionSchema } from './schema';

interface AppState {
  records: ColorRecord[];
  history: { action: string; timestamp: string; recordId?: string }[];
  scenarioColorId: string | null;
  scenarioOriginalHex: string | null;
  undoStack: ColorRecord[][]; // Stack of records states for undo

  // Actions
  seed: () => void;
  createRecord: (record: Omit<ColorRecord, 'id' | 'status'>) => void;
  updateRecord: (id: string, updates: Partial<ColorRecord>) => void;
  deleteRecord: (id: string) => void;
  reorderRecords: (startIndex: number, endIndex: number) => void;

  // Scenario Weaver
  branchToScenario: (id: string) => void;
  updateScenarioHex: (hex: string) => void;
  resolveScenario: (status: 'ready' | 'changed' | 'archived') => void;
  cancelScenario: () => void;

  // Global Actions
  undo: () => void;
  clear: () => void;
  importSession: (data: unknown) => { success: boolean; errors?: any };
  exportSession: () => PaletteHarmonyMatrixSession;

  // Derived
  getDerivedStats: () => { totalCount: number; readyCount: number; archivedCount: number };
}

function generateSeededRecords(): ColorRecord[] {
  const records: ColorRecord[] = [];
  for (let i = 1; i <= 100; i++) {
    const isSpecial = i <= 5;
    records.push({
      id: `color-${i}`,
      name: `Color ${i}`,
      hex: isSpecial ? (i % 2 === 0 ? '#1DB954' : '#ffffff') : `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      status: isSpecial ? 'ready' : (i % 5 === 0 ? 'archived' : 'draft'),
    });
  }
  return records;
}

export const useStore = create<AppState>((set, get) => ({
  records: generateSeededRecords(),
  history: [],
  scenarioColorId: null,
  scenarioOriginalHex: null,
  undoStack: [],

  seed: () => set({ records: generateSeededRecords(), history: [], undoStack: [], scenarioColorId: null, scenarioOriginalHex: null }),

  createRecord: (record) => set((state) => {
    const newRecord: ColorRecord = {
      ...record,
      id: `color-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'draft'
    };
    const newRecords = [newRecord, ...state.records];
    return {
      records: newRecords,
      undoStack: [...state.undoStack, state.records],
      history: [...state.history, { action: 'create', timestamp: new Date().toISOString(), recordId: newRecord.id }]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return {
      records: newRecords,
      undoStack: [...state.undoStack, state.records],
      history: [...state.history, { action: 'update', timestamp: new Date().toISOString(), recordId: id }]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      undoStack: [...state.undoStack, state.records],
      history: [...state.history, { action: 'delete', timestamp: new Date().toISOString(), recordId: id }],
      scenarioColorId: state.scenarioColorId === id ? null : state.scenarioColorId
    };
  }),

  reorderRecords: (startIndex, endIndex) => set((state) => {
    const newRecords = Array.from(state.records);
    const [removed] = newRecords.splice(startIndex, 1);
    newRecords.splice(endIndex, 0, removed);
    return {
      records: newRecords,
      undoStack: [...state.undoStack, state.records],
      history: [...state.history, { action: 'reorder', timestamp: new Date().toISOString() }]
    };
  }),

  branchToScenario: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    // We only mutate state to enter scenario mode. The actual record isn't "changed" until resolved/updated.
    return {
      scenarioColorId: id,
      scenarioOriginalHex: record.hex,
    };
  }),

  updateScenarioHex: (hex) => set((state) => {
    if (!state.scenarioColorId) return state;
    const newRecords = state.records.map(r => r.id === state.scenarioColorId ? { ...r, hex, scenarioState: { isBranched: true, originalHex: state.scenarioOriginalHex || undefined } } : r);
    return {
      records: newRecords
    }; // We do not push to undoStack until resolved to avoid huge undo history for every color tweak
  }),

  resolveScenario: (status) => set((state) => {
    if (!state.scenarioColorId) return state;

    // Finalize the record
    const newRecords = state.records.map(r => {
      if (r.id === state.scenarioColorId) {
        return { ...r, status, scenarioState: undefined }; // clear scenario state upon resolution
      }
      return r;
    });

    return {
      records: newRecords,
      undoStack: [...state.undoStack, state.records],
      history: [...state.history, { action: 'resolve_scenario', timestamp: new Date().toISOString(), recordId: state.scenarioColorId }],
      scenarioColorId: null,
      scenarioOriginalHex: null
    };
  }),

  cancelScenario: () => set((state) => {
    if (!state.scenarioColorId) return state;
    // Revert the hex to original
    const newRecords = state.records.map(r => {
      if (r.id === state.scenarioColorId) {
        return { ...r, hex: state.scenarioOriginalHex || r.hex, scenarioState: undefined };
      }
      return r;
    });
    return {
      records: newRecords,
      scenarioColorId: null,
      scenarioOriginalHex: null
    };
  }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const newUndoStack = [...state.undoStack];
    const previousRecords = newUndoStack.pop()!;
    return {
      records: previousRecords,
      undoStack: newUndoStack,
      history: [...state.history, { action: 'undo', timestamp: new Date().toISOString() }],
      scenarioColorId: null, // Clear scenario state on undo to prevent inconsistencies
      scenarioOriginalHex: null
    };
  }),

  clear: () => set({ records: [], undoStack: [], history: [], scenarioColorId: null, scenarioOriginalHex: null }),

  importSession: (data: unknown) => {
    const result = PaletteHarmonyMatrixSessionSchema.safeParse(data);
    if (result.success) {
      set({
        records: result.data.records,
        history: result.data.history,
        undoStack: [],
        scenarioColorId: null,
        scenarioOriginalHex: null
      });
      return { success: true };
    }
    return { success: false, errors: result.error };
  },

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.getDerivedStats(),
      history: state.history,
    };
  },

  getDerivedStats: () => {
    const state = get();
    return {
      totalCount: state.records.length,
      readyCount: state.records.filter(r => r.status === 'ready').length,
      archivedCount: state.records.filter(r => r.status === 'archived').length,
    };
  }
}));
