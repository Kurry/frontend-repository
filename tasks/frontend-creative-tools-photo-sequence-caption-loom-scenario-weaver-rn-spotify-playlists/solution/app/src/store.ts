import { create } from 'zustand';

export type RecordStatus = 'draft' | 'ready' | 'changed' | 'archived';
export type WeaverState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface PhotoSequenceRecord {
  id: string;
  title: string;
  caption: string;
  sequenceOrder: number;
  status: RecordStatus;
  folder: string;
  queueState: string;
  weaverState: WeaverState;
  selected: boolean;
}

export interface DerivedSummary {
  totalRecords: number;
  draftCount: number;
  readyCount: number;
  changedCount: number;
  archivedCount: number;
  lastDecision?: string;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  action: string;
  details: any;
}

export interface PhotoSequenceCaptionLoomSession {
  schemaVersion: 'photo-caption-v1';
  exportedAt?: string;
  records: PhotoSequenceRecord[];
  derived: DerivedSummary;
  history: HistoryEvent[];
}

interface State extends PhotoSequenceCaptionLoomSession {
  past: Omit<PhotoSequenceCaptionLoomSession, 'history'>[];

  // Actions
  addRecord: (record: Omit<PhotoSequenceRecord, 'id' | 'weaverState' | 'selected'>) => void;
  updateRecord: (id: string, updates: Partial<PhotoSequenceRecord>) => void;
  deleteRecord: (id: string) => void;
  toggleSelection: (id: string) => void;
  reorderRecords: (id: string, newOrder: number) => void;

  // Scenario Weaver Actions
  branchScenario: (recordId: string, outcome: string) => void;
  undo: () => void;

  // Export / Import
  importSession: (session: any) => void;
  exportSession: () => PhotoSequenceCaptionLoomSession;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const getTimestamp = () => new Date().toISOString();

const computeDerived = (records: PhotoSequenceRecord[], lastDecision?: string): DerivedSummary => {
  return {
    totalRecords: records.length,
    draftCount: records.filter(r => r.status === 'draft').length,
    readyCount: records.filter(r => r.status === 'ready').length,
    changedCount: records.filter(r => r.status === 'changed').length,
    archivedCount: records.filter(r => r.status === 'archived').length,
    lastDecision,
  };
};

const defaultRecords: PhotoSequenceRecord[] = [
  {
    id: 'rec-1',
    title: 'Initial Shot',
    caption: 'The start of the sequence.',
    sequenceOrder: 1,
    status: 'ready',
    folder: 'inbox',
    queueState: 'idle',
    weaverState: 'idle',
    selected: false,
  },
  {
    id: 'rec-2',
    title: 'Mid Action',
    caption: 'Peak motion.',
    sequenceOrder: 2,
    status: 'draft',
    folder: 'processing',
    queueState: 'idle',
    weaverState: 'idle',
    selected: false,
  },
];

const initialState = {
  schemaVersion: 'photo-caption-v1' as const,
  records: defaultRecords,
  derived: computeDerived(defaultRecords),
  history: [],
  past: [],
};

export const useStore = create<State>((set, get) => ({
  ...initialState,

  addRecord: (recordData) => set((state) => {
    const newRecord: PhotoSequenceRecord = {
      ...recordData,
      id: generateId(),
      weaverState: 'idle',
      selected: false,
    };
    const newRecords = [...state.records, newRecord];
    const newDerived = computeDerived(newRecords, state.derived.lastDecision);

    return {
      past: [...state.past, { records: state.records, schemaVersion: state.schemaVersion, derived: state.derived }],
      records: newRecords,
      derived: newDerived,
      history: [...state.history, { id: generateId(), timestamp: getTimestamp(), action: 'addRecord', details: { id: newRecord.id } }],
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const oldRecords = state.records;
    const newRecords = state.records.map((rec) =>
      rec.id === id ? { ...rec, ...updates } : rec
    );
    const newDerived = computeDerived(newRecords, state.derived.lastDecision);

    return {
      past: [...state.past, { records: oldRecords, schemaVersion: state.schemaVersion, derived: state.derived }],
      records: newRecords,
      derived: newDerived,
      history: [...state.history, { id: generateId(), timestamp: getTimestamp(), action: 'updateRecord', details: { id, updates } }],
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter((rec) => rec.id !== id);
    const newDerived = computeDerived(newRecords, state.derived.lastDecision);

    return {
      past: [...state.past, { records: state.records, schemaVersion: state.schemaVersion, derived: state.derived }],
      records: newRecords,
      derived: newDerived,
      history: [...state.history, { id: generateId(), timestamp: getTimestamp(), action: 'deleteRecord', details: { id } }],
    };
  }),

  toggleSelection: (id) => set((state) => {
    const newRecords = state.records.map((rec) =>
      rec.id === id ? { ...rec, selected: !rec.selected } : rec
    );
    return { records: newRecords };
  }),

  reorderRecords: (id, newOrder) => set((state) => {
    const target = state.records.find(r => r.id === id);
    if (!target) return {};
    const oldRecords = state.records;

    const newRecords = state.records.map(r => {
        if (r.id === id) return { ...r, sequenceOrder: newOrder };
        if (r.sequenceOrder === newOrder) return { ...r, sequenceOrder: target.sequenceOrder };
        return r;
    });

    const newDerived = computeDerived(newRecords, state.derived.lastDecision);

    return {
      past: [...state.past, { records: oldRecords, schemaVersion: state.schemaVersion, derived: state.derived }],
      records: newRecords,
      derived: newDerived,
      history: [...state.history, { id: generateId(), timestamp: getTimestamp(), action: 'reorder', details: { id, newOrder } }],
    };
  }),

  branchScenario: (recordId, outcome) => set((state) => {
    const target = state.records.find(r => r.id === recordId);
    if (!target) return {};

    if (outcome === 'conflict') {
      return {};
    }

    const oldRecords = state.records;
    const newRecords = state.records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          weaverState: 'changed' as WeaverState,
          status: 'changed' as RecordStatus,
          caption: `${r.caption} (Scenario: ${outcome})`,
        };
      }
      return { ...r, weaverState: 'idle' as WeaverState };
    });

    const newDerived = computeDerived(newRecords, `Branched ${target.title} -> ${outcome}`);

    return {
      past: [...state.past, { records: oldRecords, schemaVersion: state.schemaVersion, derived: state.derived }],
      records: newRecords,
      derived: newDerived,
      history: [...state.history, { id: generateId(), timestamp: getTimestamp(), action: 'branchScenario', details: { recordId, outcome } }],
    };
  }),

  undo: () => set((state) => {
    if (state.past.length === 0) return {};
    const previous = state.past[state.past.length - 1];

    return {
      past: state.past.slice(0, -1),
      records: previous.records,
      derived: previous.derived,
      history: [...state.history, { id: generateId(), timestamp: getTimestamp(), action: 'undo', details: {} }],
    };
  }),

  importSession: (session) => set(() => {
    if (!session || typeof session !== 'object' || session.schemaVersion !== 'photo-caption-v1') {
      return {};
    }
    if (!Array.isArray(session.records)) return {};

    const uniqueIds = new Set(session.records.map((r: any) => r.id));
    if (uniqueIds.size !== session.records.length) return {};

    return {
      schemaVersion: 'photo-caption-v1',
      records: session.records,
      derived: session.derived,
      history: session.history,
      past: [],
    };
  }),

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'photo-caption-v1',
      exportedAt: getTimestamp(),
      records: state.records,
      derived: state.derived,
      history: state.history,
    };
  }
}));
