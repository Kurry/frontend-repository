import { create } from 'zustand';

export type Status = 'draft' | 'ready' | 'failed' | 'recovered' | 'archived';
export type RecoveryBoardState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface Record {
  id: string;
  title: string;
  description: string;
  status: Status;
  recoveryBoardState: RecoveryBoardState;
  difficulty: number;
  linkedScenarioId: string | null;
}

export interface Derived {
  summary: {
    total: number;
    failed: number;
    recovered: number;
  };
}

export interface HistoryEntry {
  records: Record[];
}

export interface AppState {
  records: Record[];
  history: HistoryEntry[];

  // Actions
  addRecord: (record: Record) => void;
  updateRecord: (id: string, partial: Partial<Record>) => void;
  deleteRecord: (id: string) => void;

  // The Canonical Mutation
  recoverRecord: (id: string, updates: Partial<Record>) => void;

  // History
  undo: () => void;

  // Export / Import
  setAllState: (records: Record[], history?: HistoryEntry[]) => void;
}

const seedRecords: Record[] = [
  {
    id: 'sc-1',
    title: 'Goblin Ambush',
    description: 'A simple ambush by a group of goblins.',
    status: 'draft',
    recoveryBoardState: 'idle',
    difficulty: 2,
    linkedScenarioId: null,
  },
  {
    id: 'sc-2',
    title: 'Dragon Lair',
    description: 'The party enters the dragon\'s lair.',
    status: 'failed',
    recoveryBoardState: 'idle',
    difficulty: 9,
    linkedScenarioId: null,
  },
  {
    id: 'sc-3',
    title: 'Missing Merchant',
    description: 'Find the merchant who disappeared in the woods.',
    status: 'recovered',
    recoveryBoardState: 'resolved',
    difficulty: 4,
    linkedScenarioId: 'sc-1',
  },
];

const pushHistory = (state: AppState) => {
  return [{ records: JSON.parse(JSON.stringify(state.records)) }, ...state.history].slice(0, 50);
};

export const useStore = create<AppState>((set) => ({
  records: seedRecords,
  history: [],

  addRecord: (record) => set((state) => {
    return {
      history: pushHistory(state),
      records: [...state.records, record],
    };
  }),

  updateRecord: (id, partial) => set((state) => {
    return {
      history: pushHistory(state),
      records: state.records.map((r) => r.id === id ? { ...r, ...partial } : r),
    };
  }),

  deleteRecord: (id) => set((state) => {
    return {
      history: pushHistory(state),
      records: state.records.filter((r) => r.id !== id),
    };
  }),

  recoverRecord: (id, updates) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record || record.status !== 'failed') return state; // Only operate on failed
    if (record.recoveryBoardState === 'conflict') return state; // rejected if in conflict without resolution

    return {
      history: pushHistory(state),
      records: state.records.map((r) =>
        r.id === id
          ? { ...r, ...updates, status: 'recovered', recoveryBoardState: 'resolved' }
          : r
      ),
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const [lastState, ...restHistory] = state.history;
    return {
      records: lastState.records,
      history: restHistory,
    };
  }),

  setAllState: (records, history = []) => set(() => ({
    records,
    history,
  })),
}));

export const selectDerived = (state: AppState): Derived => {
  const total = state.records.length;
  const failed = state.records.filter((r) => r.status === 'failed').length;
  const recovered = state.records.filter((r) => r.status === 'recovered').length;
  return {
    summary: { total, failed, recovered },
  };
};
