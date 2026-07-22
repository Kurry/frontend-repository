import { create } from 'zustand';
import { type ApparelFitAnnotation, type TimelineEvent, type Session, SessionSchema } from './schema';
import { v4 as uuidv4 } from 'uuid';

export type FilterStatus = 'all' | 'draft' | 'ready' | 'changed' | 'archived';

interface StoreState {
  records: Record<string, ApparelFitAnnotation>;
  history: TimelineEvent[];
  selectedId: string | null;
  filter: FilterStatus;

  // Computed (derived) logic getters
  getDerivedState: () => Session['derived'];
  getVisibleRecords: () => ApparelFitAnnotation[];
  getRecordHistory: (id: string) => TimelineEvent[];

  // Actions
  selectRecord: (id: string | null) => void;
  setFilter: (filter: FilterStatus) => void;
  createRecord: (record: Omit<ApparelFitAnnotation, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<ApparelFitAnnotation>) => void;
  deleteRecord: (id: string) => void;

  // Timeline Actions
  scrubTimeline: (recordId: string, targetEventId: string) => void;
  restoreCheckpoint: (recordId: string, targetEventId: string) => void;
  undoLastMutation: () => void;

  // Export/Import
  exportSession: () => string;
  importSession: (jsonString: string) => void;

  // Seed
  seedInitialData: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  records: {},
  history: [],
  selectedId: null,
  filter: 'all',

  getDerivedState: () => {
    const { records } = get();
    const values = Object.values(records);
    const counts = { draft: 0, ready: 0, changed: 0, archived: 0 };
    values.forEach(r => {
      counts[r.status]++;
    });
    return {
      totalRecords: values.length,
      statusCounts: counts,
    };
  },

  getVisibleRecords: () => {
    const { records, filter } = get();
    const values = Object.values(records);
    if (filter === 'all') return values;
    return values.filter(r => r.status === filter);
  },

  getRecordHistory: (id: string) => {
    return get().history.filter(e => e.recordId === id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  selectRecord: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),

  createRecord: (data) => {
    const id = uuidv4();
    const newRecord: ApparelFitAnnotation = { ...data, id };

    const event: TimelineEvent = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      recordId: id,
      state: { ...newRecord }
    };

    set(state => ({
      records: { ...state.records, [id]: newRecord },
      history: [...state.history, event],
    }));
  },

  updateRecord: (id, updates) => {
    set(state => {
      const existing = state.records[id];
      if (!existing) return state;

      const newRecord = { ...existing, ...updates };

      const event: TimelineEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        recordId: id,
        state: { ...newRecord }
      };

      return {
        records: { ...state.records, [id]: newRecord },
        history: [...state.history, event],
      };
    });
  },

  deleteRecord: (id) => {
    set(state => {
      const newRecords = { ...state.records };
      delete newRecords[id];

      // We do not delete history as it might be needed for undo? Or maybe we just delete it.
      // Usually delete is a hard delete in this context, or we just remove it from records.

      return {
        records: newRecords,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: state.history.filter(e => e.recordId !== id),
      };
    });
  },

  scrubTimeline: (recordId, targetEventId) => {
    // Just sets the current state to the selected event without deleting history
    set(state => {
      const event = state.history.find(e => e.eventId === targetEventId && e.recordId === recordId);
      if (!event) return state;

      return {
        records: { ...state.records, [recordId]: event.state }
      };
    });
  },

  restoreCheckpoint: (recordId, targetEventId) => {
    // Sets the state AND truncates future history for this record
    set(state => {
      const event = state.history.find(e => e.eventId === targetEventId && e.recordId === recordId);
      if (!event) return state;

      const recordHistory = get().getRecordHistory(recordId);
      const targetIndex = recordHistory.findIndex(e => e.eventId === targetEventId);

      if (targetIndex === -1) return state;

      const eventsToRemove = recordHistory.slice(targetIndex + 1).map(e => e.eventId);

      return {
        records: { ...state.records, [recordId]: event.state },
        history: state.history.filter(e => !eventsToRemove.includes(e.eventId))
      };
    });
  },

  undoLastMutation: () => {
    set(state => {
      if (state.history.length === 0) return state;

      // Get the last event overall
      const lastEvent = state.history[state.history.length - 1];
      const recordId = lastEvent.recordId;

      // Find the previous event for this record
      const recordHistory = state.history.filter(e => e.recordId === recordId);

      if (recordHistory.length <= 1) {
        // If it was the creation event, we just delete the record and its single event
        const newRecords = { ...state.records };
        delete newRecords[recordId];
        return {
          records: newRecords,
          history: state.history.filter(e => e.eventId !== lastEvent.eventId),
          selectedId: state.selectedId === recordId ? null : state.selectedId,
        };
      }

      // Restore to the previous state of this record
      const prevEvent = recordHistory[recordHistory.length - 2];

      return {
        records: { ...state.records, [recordId]: prevEvent.state },
        history: state.history.filter(e => e.eventId !== lastEvent.eventId)
      };
    });
  },

  exportSession: () => {
    const state = get();
    const session: Session = {
      schemaVersion: 'fit-annotations-v1',
      exportedAt: new Date().toISOString(),
      records: Object.values(state.records),
      derived: state.getDerivedState(),
      history: state.history,
    };
    return JSON.stringify(session, null, 2);
  },

  importSession: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      const parsed = SessionSchema.parse(data);

      // Regenerate exportedAt upon import per instructions
      parsed.exportedAt = new Date().toISOString();

      const newRecords: Record<string, ApparelFitAnnotation> = {};
      parsed.records.forEach(r => newRecords[r.id] = r);

      set({
        records: newRecords,
        history: parsed.history,
        selectedId: null,
        filter: 'all'
      });
    } catch (e) {
      console.error("Import failed:", e);
      // Malformed schema makes no state change per requirements
    }
  },

  seedInitialData: () => {
    // Deterministic seed for E2E
    const initialRecords: ApparelFitAnnotation[] = [
      { id: '1', title: 'Jacket Armhole', status: 'draft', notes: 'Needs widening', measurementOffset: -2 },
      { id: '2', title: 'Pant Hem', status: 'ready', notes: 'Approved length', measurementOffset: 0 },
      { id: '3', title: 'Collar Stand', status: 'changed', notes: 'Reduced by 1/4 inch', measurementOffset: -0.25 },
      { id: '4', title: 'Shoulder Drop', status: 'archived', notes: 'Old style', measurementOffset: 1 },
    ];

    const recordsMap: Record<string, ApparelFitAnnotation> = {};
    const initialHistory: TimelineEvent[] = [];

    const now = Date.now();

    initialRecords.forEach((r, i) => {
      recordsMap[r.id] = r;
      initialHistory.push({
        eventId: `evt-${r.id}-1`,
        timestamp: new Date(now - (10 - i) * 60000).toISOString(),
        recordId: r.id,
        state: r
      });
    });

    set({
      records: recordsMap,
      history: initialHistory,
      selectedId: null,
      filter: 'all'
    });
  }
}));
