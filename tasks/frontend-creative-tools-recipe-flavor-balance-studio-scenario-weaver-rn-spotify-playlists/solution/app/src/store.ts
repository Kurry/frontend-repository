import { create } from 'zustand';
import type { FlavorComponent, RecipeFlavorBalanceStudioSession } from './schema';
import { seedRecords } from './seed';

export interface AppState {
  records: FlavorComponent[];
  history: FlavorComponent[][]; // Array of previous records states for Undo
  selectedId: string | null;
  filterStatus: string | null; // null means all

  // Actions
  setRecords: (records: FlavorComponent[]) => void;
  addRecord: (record: FlavorComponent) => void;
  updateRecord: (id: string, updates: Partial<FlavorComponent>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  setFilterStatus: (status: string | null) => void;

  // Signature Mutation
  branchScenario: (id: string) => void;

  // Undo
  undo: () => void;

  // Clear for import
  clearAndImport: (session: RecipeFlavorBalanceStudioSession) => void;
}

export const useStore = create<AppState>((set) => ({
  records: seedRecords(),
  history: [],
  selectedId: null,
  filterStatus: null,

  setRecords: (records) => set({ records }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, record];
    return { records: newRecords, history: [...state.history, state.records] };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return { records: newRecords, history: [...state.history, state.records] };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      history: [...state.history, state.records],
      selectedId: state.selectedId === id ? null : state.selectedId
    };
  }),

  selectRecord: (id) => set({ selectedId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  branchScenario: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    // Create branched record
    const newId = `comp-branch-${Date.now()}`;
    const newRecord: FlavorComponent = {
      ...record,
      id: newId,
      name: `${record.name} (Scenario)`,
      status: 'draft',
      branched_from: id,
    };

    // Original record becomes "changed" if it was "ready" or "draft", we can mark it "changed" as per domain
    const updatedRecords = state.records.map(r => r.id === id ? { ...r, status: 'changed' as const } : r);
    const finalRecords = [...updatedRecords, newRecord];

    return {
      records: finalRecords,
      history: [...state.history, state.records],
      selectedId: newId
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousRecords = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);

    // If selected item doesn't exist in previous state, deselect
    const selectedId = state.selectedId;
    const exists = previousRecords.some(r => r.id === selectedId);

    return {
      records: previousRecords,
      history: newHistory,
      selectedId: exists ? selectedId : null
    };
  }),

  clearAndImport: (session) => set({
    records: session.records,
    history: session.history || [],
    selectedId: null,
    filterStatus: null,
  }),
}));
