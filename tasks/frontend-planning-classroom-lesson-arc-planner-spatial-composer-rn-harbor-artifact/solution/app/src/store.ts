import { create } from 'zustand';
import type { LessonRecord, DerivedState, HistoryItem, SessionState, SpatialComposerZone } from './schema';

export interface AppState {
  records: LessonRecord[];
  zones: SpatialComposerZone[];
  derived: DerivedState;
  history: HistoryItem[];
  selectedRecordId: string | null;
  composerStatus: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

  // Actions
  createRecord: (record: Omit<LessonRecord, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<LessonRecord>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  placeRecord: (zoneId: string) => { success: boolean; error?: string };
  undoMutation: () => void;
  clearSession: () => void;
  importSession: (session: SessionState) => void;
  _calculateDerived: () => void;
  _pushHistory: (type: string) => void;
}

const initialZones: SpatialComposerZone[] = [
  { id: 'zone-1', name: 'Track A', maxCapacity: 50, recordIds: [] },
  { id: 'zone-2', name: 'Track B', maxCapacity: 60, recordIds: [] },
];

const initialDerived: DerivedState = {
  summary: 'Empty session',
  totalAssignedCapacity: 0,
  composerActive: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  records: [],
  zones: initialZones,
  derived: initialDerived,
  history: [],
  selectedRecordId: null,
  composerStatus: 'idle',

  _calculateDerived: () => {
    set((state) => {
      let total = 0;
      state.zones.forEach((zone) => {
        zone.recordIds.forEach((id) => {
          const rec = state.records.find((r) => r.id === id);
          if (rec) total += rec.capacity;
        });
      });
      return {
        derived: {
          summary: `${state.records.length} records, ${total} capacity assigned`,
          totalAssignedCapacity: total,
          composerActive: state.selectedRecordId !== null || state.zones.some(z => z.recordIds.length > 0),
        },
      };
    });
  },

  _pushHistory: (type: string) => {
    set((state) => {
      const snap = {
        records: JSON.parse(JSON.stringify(state.records)),
        zones: JSON.parse(JSON.stringify(state.zones)),
        selectedRecordId: state.selectedRecordId,
        composerStatus: state.composerStatus,
      };
      return {
        history: [...state.history, { type, snapshot: snap }],
      };
    });
  },

  createRecord: (recordData) => {
    get()._pushHistory('create_record');
    const newRecord: LessonRecord = { ...recordData, id: crypto.randomUUID() };
    set((state) => ({ records: [...state.records, newRecord] }));
    get()._calculateDerived();
  },

  updateRecord: (id, updates) => {
    get()._pushHistory('update_record');
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    get()._calculateDerived();
  },

  deleteRecord: (id) => {
    get()._pushHistory('delete_record');
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
      zones: state.zones.map(z => ({ ...z, recordIds: z.recordIds.filter(rid => rid !== id) })),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      composerStatus: state.selectedRecordId === id ? 'idle' : state.composerStatus,
    }));
    get()._calculateDerived();
  },

  selectRecord: (id) => {
    set({ selectedRecordId: id, composerStatus: id ? 'selected' : 'idle' });
    get()._calculateDerived();
  },

  placeRecord: (zoneId) => {
    const state = get();
    const { selectedRecordId, records, zones } = state;
    if (!selectedRecordId) return { success: false, error: 'No record selected' };

    const record = records.find((r) => r.id === selectedRecordId);
    if (!record) return { success: false, error: 'Record not found' };

    const targetZone = zones.find((z) => z.id === zoneId);
    if (!targetZone) return { success: false, error: 'Zone not found' };

    // Check capacity
    const currentZoneCap = targetZone.recordIds.reduce((sum, rid) => {
      const r = records.find(rec => rec.id === rid);
      return sum + (r ? r.capacity : 0);
    }, 0);

    // If placing here exceeds capacity, reject
    // But allow if it's already in THIS zone (it's moving within, or redundant place)
    if (!targetZone.recordIds.includes(selectedRecordId) && currentZoneCap + record.capacity > targetZone.maxCapacity) {
      set({ composerStatus: 'conflict' });
      return { success: false, error: 'Capacity exceeded' };
    }

    get()._pushHistory('place_record');

    set((s) => ({
      composerStatus: 'resolved',
      zones: s.zones.map((z) => {
        // Remove from all zones
        const filtered = z.recordIds.filter(id => id !== selectedRecordId);
        // Add to target
        if (z.id === zoneId) {
          filtered.push(selectedRecordId);
        }
        return { ...z, recordIds: filtered };
      }),
      // Also update record status
      records: s.records.map(r => r.id === selectedRecordId ? { ...r, status: 'ready' } : r)
    }));

    // Automatically transition from resolved back to idle/selected
    setTimeout(() => {
        const curr = get();
        if (curr.composerStatus === 'resolved') {
            set({ composerStatus: 'idle', selectedRecordId: null });
        }
    }, 1500);

    get()._calculateDerived();
    return { success: true };
  },

  undoMutation: () => {
    const { history } = get();
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    set({
      records: lastState.snapshot.records,
      zones: lastState.snapshot.zones,
      selectedRecordId: lastState.snapshot.selectedRecordId,
      composerStatus: lastState.snapshot.composerStatus,
      history: history.slice(0, -1),
    });
    get()._calculateDerived();
  },

  clearSession: () => {
    set({
      records: [],
      zones: initialZones,
      history: [],
      selectedRecordId: null,
      composerStatus: 'idle',
    });
    get()._calculateDerived();
  },

  importSession: (session) => {
    set({
      records: session.records,
      zones: session.zones,
      derived: session.derived,
      history: session.history,
      selectedRecordId: null,
      composerStatus: 'idle',
    });
  }
}));
