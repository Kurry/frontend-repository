import { create } from 'zustand';
import { AppState, LayoverActivity, DomainStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

interface Store extends AppState {
  addRecord: (record: Omit<LayoverActivity, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<LayoverActivity>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  applyRecoveryMutation: (id: string, recoveryPathId: string, downstreamImpact: string) => void;
  undo: () => void;
  importState: (records: LayoverActivity[], history?: LayoverActivity[][]) => void;
  clearState: () => void;
}

const initialRecords: LayoverActivity[] = [
  { id: uuidv4(), title: 'Lounge Access', status: 'ready', durationMinutes: 120, location: 'Terminal 1' },
  { id: uuidv4(), title: 'Missed Connection Check', status: 'failed', durationMinutes: 30, location: 'Help Desk', downstreamImpact: 'Missed Flight XYZ' },
  { id: uuidv4(), title: 'Grab Coffee', status: 'draft', durationMinutes: 15, location: 'Gate A2' },
];

export const useStore = create<Store>((set) => ({
  records: initialRecords,
  selectedId: null,
  history: [initialRecords],
  historyIndex: 0,

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: uuidv4() }];
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      records: newRecords,
      history: [...newHistory, newRecords],
      historyIndex: state.historyIndex + 1,
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      records: newRecords,
      history: [...newHistory, newRecords],
      historyIndex: state.historyIndex + 1,
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      records: newRecords,
      history: [...newHistory, newRecords],
      historyIndex: state.historyIndex + 1,
      selectedId: state.selectedId === id ? null : state.selectedId,
    };
  }),

  selectRecord: (id) => set({ selectedId: id }),

  applyRecoveryMutation: (id, recoveryPathId, downstreamImpact) => set((state) => {
    const target = state.records.find(r => r.id === id);
    if (!target || target.status !== 'failed') return state;

    const newRecords = state.records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'resolved' as DomainStatus,
          recoveryPathId,
          downstreamImpact: `Repaired: ${downstreamImpact}`
        };
      }
      return r;
    });
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      records: newRecords,
      history: [...newHistory, newRecords],
      historyIndex: state.historyIndex + 1,
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return {
        records: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    return state;
  }),

  importState: (records, history) => set(() => {
    return {
      records,
      history: history || [records],
      historyIndex: history ? history.length - 1 : 0,
      selectedId: null
    };
  }),

  clearState: () => set(() => ({
    records: [],
    history: [[]],
    historyIndex: 0,
    selectedId: null
  }))
}));
