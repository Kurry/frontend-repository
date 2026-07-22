import { create } from 'zustand';

export type Status = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface FitAnnotation {
  id: string;
  status: Status;
  'typed-fields': {
    garment: string;
    fitIssue: string;
    measurementDelta: number; // e.g., +2.5cm
  };
  'duplicate-merge-id': string | null;
  'saved-query': string | null;
  'release-provenance': string | null;

  // Ribbon state explicitly tracked
  'forecast-ribbonState'?: {
    projection: string;
    priority: number;
    release: string;
  };
}

export type RibbonState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface DerivedSummary {
  total: number;
  byStatus: Record<Status, number>;
  projectedChanges: number;
  averageDelta: number;
}

export interface HistoryEvent {
  action: string;
  previousRecords: FitAnnotation[];
  previousDerived: DerivedSummary;
  ribbonState: RibbonState;
  selectedRecordId: string | null;
}

interface AppState {
  records: FitAnnotation[];
  history: HistoryEvent[];
  ribbonState: RibbonState;
  selectedRecordId: string | null;

  derived: DerivedSummary;

  // Actions
  seed: () => void;
  createRecord: (record: Omit<FitAnnotation, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<FitAnnotation>) => void;
  deleteRecord: (id: string) => void;

  // Ribbon
  selectRecord: (id: string | null) => void;
  adjustProjection: (projection: string, priority: number, release: string) => void;
  undo: () => void;

  // Artifact
  importArtifact: (data: any) => void;
  clearWorkspace: () => void;
}

const computeDerived = (records: FitAnnotation[]): DerivedSummary => {
  const total = records.length;
  const byStatus: Record<Status, number> = {
    empty: 0, draft: 0, ready: 0, changed: 0, archived: 0
  };
  let projectedChanges = 0;
  let totalDelta = 0;
  let deltaCount = 0;

  for (const r of records) {
    byStatus[r.status]++;
    if (r['forecast-ribbonState']) {
      projectedChanges++;
    }
    if (r['typed-fields']?.measurementDelta !== undefined) {
      totalDelta += r['typed-fields'].measurementDelta;
      deltaCount++;
    }
  }

  return {
    total,
    byStatus,
    projectedChanges,
    averageDelta: deltaCount > 0 ? (totalDelta / deltaCount) : 0,
  };
};

const generateSeededRecords = (): FitAnnotation[] => {
  const records: FitAnnotation[] = [];
  const statuses: Status[] = ['empty', 'draft', 'ready', 'changed', 'archived'];
  const garments = ['Shirt', 'Pants', 'Jacket', 'Dress', 'Skirt'];

  for (let i = 1; i <= 100; i++) {
    records.push({
      id: `record-${i}`,
      status: statuses[i % 5],
      'typed-fields': {
        garment: garments[i % 5],
        fitIssue: i % 3 === 0 ? 'Too tight' : (i % 2 === 0 ? 'Too loose' : 'Wrong length'),
        measurementDelta: (i % 10) - 5,
      },
      'duplicate-merge-id': i % 15 === 0 ? `record-${i-1}` : null,
      'saved-query': i % 7 === 0 ? 'priority-issues' : null,
      'release-provenance': i % 4 === 0 ? 'v1.0.0' : null,
    });
  }
  return records;
};

export const useStore = create<AppState>((set) => ({
  records: [],
  history: [],
  ribbonState: 'idle',
  selectedRecordId: null,
  derived: {
    total: 0,
    byStatus: { empty: 0, draft: 0, ready: 0, changed: 0, archived: 0 },
    projectedChanges: 0,
    averageDelta: 0,
  },

  seed: () => {
    const records = generateSeededRecords();
    set({
      records,
      history: [],
      ribbonState: 'idle',
      selectedRecordId: null,
      derived: computeDerived(records)
    });
  },

  createRecord: (recordData) => {
    set((state) => {
      const newRecord = { ...recordData, id: `record-${Date.now()}` };
      const newRecords = [...state.records, newRecord];
      return {
        records: newRecords,
        derived: computeDerived(newRecords)
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
      return {
        records: newRecords,
        derived: computeDerived(newRecords)
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
        ribbonState: state.selectedRecordId === id ? 'idle' : state.ribbonState,
      };
    });
  },

  selectRecord: (id) => {
    set({
      selectedRecordId: id,
      ribbonState: id ? 'selected' : 'idle',
    });
  },

  adjustProjection: (projection, priority, release) => {
    set((state) => {
      if (!state.selectedRecordId) return state;

      // Save history
      const historyEvent: HistoryEvent = {
        action: 'adjustProjection',
        previousRecords: state.records,
        previousDerived: state.derived,
        ribbonState: state.ribbonState,
        selectedRecordId: state.selectedRecordId,
      };

      const newRecords = state.records.map(r => {
        if (r.id === state.selectedRecordId) {
          return {
            ...r,
            status: 'changed' as Status,
            'forecast-ribbonState': { projection, priority, release }
          };
        }
        return r;
      });

      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        ribbonState: 'resolved',
        history: [...state.history, historyEvent]
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const lastEvent = state.history[state.history.length - 1];

      return {
        records: lastEvent.previousRecords,
        derived: lastEvent.previousDerived,
        ribbonState: lastEvent.ribbonState,
        selectedRecordId: lastEvent.selectedRecordId,
        history: state.history.slice(0, -1),
      };
    });
  },

  clearWorkspace: () => {
    set({
      records: [],
      history: [],
      ribbonState: 'idle',
      selectedRecordId: null,
      derived: computeDerived([])
    });
  },

  importArtifact: (data) => {
    set({
      records: data.records,
      history: data.history || [],
      ribbonState: 'idle',
      selectedRecordId: null,
      derived: computeDerived(data.records)
    });
  }
}));
