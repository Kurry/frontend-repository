import { create } from 'zustand';

export type SegmentStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type AtlasState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface PracticeSegment {
  id: string;
  title: string;
  status: SegmentStatus;
  atlasState: AtlasState;
  bpm: number;
  measures: number;
  sourceEvidence?: string;
  quarantined?: boolean;
}

export interface SessionDerivedState {
  totalSegments: number;
  readySegments: number;
  quarantinedLineages: number;
  averageBpm: number;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  action: string;
  payload: any;
}

export interface ComposerState {
  schemaVersion: 'practice-loop-v1';
  exportedAt: string | null;
  records: PracticeSegment[];
  history: HistoryEvent[];
  selectedId: string | null;

  // Actions
  addRecord: (record: Omit<PracticeSegment, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<PracticeSegment>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;

  // Signature mutation
  traceAndQuarantine: (id: string, evidence: string) => void;

  // Undo/Import/Export
  undo: () => void;
  importSession: (data: string) => boolean;
  clearSession: () => void;

  // Seeds
  seedData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const computeDerived = (records: PracticeSegment[]): SessionDerivedState => {
  const ready = records.filter(r => r.status === 'ready').length;
  const quarantined = records.filter(r => r.quarantined).length;
  const validBpms = records.filter(r => !r.quarantined && r.bpm > 0);
  const avgBpm = validBpms.length > 0
    ? Math.round(validBpms.reduce((acc, r) => acc + r.bpm, 0) / validBpms.length)
    : 0;

  return {
    totalSegments: records.length,
    readySegments: ready,
    quarantinedLineages: quarantined,
    averageBpm: avgBpm
  };
};

export const useStore = create<ComposerState>((set, get) => ({
  schemaVersion: 'practice-loop-v1',
  exportedAt: null,
  records: [],
  history: [],
  selectedId: null,

  addRecord: (recordData) => {
    set((state) => {
      const newRecord: PracticeSegment = { ...recordData, id: generateId() };
      const newRecords = [...state.records, newRecord];
      const event: HistoryEvent = { id: generateId(), timestamp: new Date().toISOString(), action: 'addRecord', payload: { record: newRecord } };
      return {
        records: newRecords,
        history: [...state.history, event],
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const oldRecord = state.records.find(r => r.id === id);
      if (!oldRecord) return state;

      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
      const event: HistoryEvent = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'updateRecord',
        payload: { id, oldRecord, newRecord: { ...oldRecord, ...updates } }
      };

      return {
        records: newRecords,
        history: [...state.history, event],
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const oldRecord = state.records.find(r => r.id === id);
      if (!oldRecord) return state;

      const newRecords = state.records.filter(r => r.id !== id);
      const event: HistoryEvent = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'deleteRecord',
        payload: { record: oldRecord }
      };

      return {
        records: newRecords,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: [...state.history, event],
      };
    });
  },

  selectRecord: (id) => {
    set({ selectedId: id });
  },

  traceAndQuarantine: (id, evidence) => {
    set((state) => {
      const oldRecord = state.records.find(r => r.id === id);
      if (!oldRecord) return state;

      if (oldRecord.quarantined) return state;

      const newRecord: PracticeSegment = {
        ...oldRecord,
        status: 'changed',
        atlasState: 'resolved',
        quarantined: true,
        sourceEvidence: evidence
      };

      const newRecords = state.records.map(r => r.id === id ? newRecord : r);

      const event: HistoryEvent = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'traceAndQuarantine',
        payload: { id, oldRecord, newRecord, selectedIdBefore: state.selectedId }
      };

      return {
        records: newRecords,
        history: [...state.history, event],
        selectedId: id
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;

      const newHistory = [...state.history];
      const lastEvent = newHistory.pop()!;
      let newRecords = [...state.records];
      let newSelectedId = state.selectedId;

      if (lastEvent.action === 'addRecord') {
        newRecords = newRecords.filter(r => r.id !== lastEvent.payload.record.id);
        if (newSelectedId === lastEvent.payload.record.id) newSelectedId = null;
      } else if (lastEvent.action === 'updateRecord' || lastEvent.action === 'traceAndQuarantine') {
        newRecords = newRecords.map(r => r.id === lastEvent.payload.id ? lastEvent.payload.oldRecord : r);
        if (lastEvent.action === 'traceAndQuarantine' && lastEvent.payload.selectedIdBefore !== undefined) {
          newSelectedId = lastEvent.payload.selectedIdBefore;
        }
      } else if (lastEvent.action === 'deleteRecord') {
        newRecords.push(lastEvent.payload.record);
      }

      return {
        records: newRecords,
        history: newHistory,
        selectedId: newSelectedId
      };
    });
  },

  importSession: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.schemaVersion !== 'practice-loop-v1' || !Array.isArray(data.records) || !Array.isArray(data.history)) {
        return false;
      }

      const ids = new Set();
      for (const r of data.records) {
        if (ids.has(r.id)) return false;
        if (typeof r.bpm !== 'number' || typeof r.measures !== 'number') return false;
        ids.add(r.id);
      }

      set({
        schemaVersion: 'practice-loop-v1',
        exportedAt: new Date().toISOString(),
        records: data.records,
        history: data.history,
        selectedId: null
      });
      return true;
    } catch {
      return false;
    }
  },

  clearSession: () => {
    set({
      records: [],
      history: [],
      selectedId: null
    });
  },

  seedData: () => {
    set({
      records: [
        { id: '1', title: 'Intro Riff', status: 'ready', atlasState: 'idle', bpm: 120, measures: 8 },
        { id: '2', title: 'Chorus Chords', status: 'draft', atlasState: 'idle', bpm: 125, measures: 16 },
        { id: '3', title: 'Bridge Arpeggio', status: 'empty', atlasState: 'idle', bpm: 110, measures: 4 },
        { id: '4', title: 'Outro Solo', status: 'ready', atlasState: 'selected', bpm: 130, measures: 12 },
      ],
      history: [],
      selectedId: null
    });
  }
}));

export { computeDerived };
