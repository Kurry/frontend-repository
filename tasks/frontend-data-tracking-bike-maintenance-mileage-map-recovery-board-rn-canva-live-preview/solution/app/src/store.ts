import { create } from 'zustand';
import { z } from 'zod';

export const BikeRecordSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived', 'failed', 'recovery']),
  distance: z.number().nonnegative("Distance must be non-negative"),
  notes: z.string().optional(),
});

export type BikeRecord = z.infer<typeof BikeRecordSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(BikeRecordSchema).refine((records) => {
    const ids = new Set(records.map(r => r.id));
    return ids.size === records.length;
  }, "Duplicate IDs found in records"),
  derived: z.object({
    totalDistance: z.number(),
    readyCount: z.number(),
    failedCount: z.number(),
    recoveryCount: z.number(),
  }),
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.string(),
    recordId: z.string().optional()
  })),
  recoveryBoardState: z.object({
    selectedRecordId: z.string().nullable(),
  }).optional()
});

export type SessionState = z.infer<typeof SessionSchema>;

type StoreState = {
  current: SessionState;
  past: SessionState[];
  future: SessionState[];
  createRecord: (record: Omit<BikeRecord, 'id'>) => void;
  updateRecord: (id: string, record: Partial<BikeRecord>) => void;
  deleteRecord: (id: string) => void;
  moveToRecovery: (id: string, recoveryAction: string) => void;
  undo: () => void;
  redo: () => void;
  exportArtifact: () => string;
  importArtifact: (data: unknown) => boolean;
  clearState: () => void;
  selectRecordForRecovery: (id: string | null) => void;
};

const initialSessionState: SessionState = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [
    { id: '1', title: 'Chain Replacement', status: 'ready', distance: 2000, notes: 'Shimano 11s' },
    { id: '2', title: 'Brake Bleed', status: 'failed', distance: 1500, notes: 'Spongy rear brake' },
    { id: '3', title: 'Tire Check', status: 'draft', distance: 0, notes: 'Check tubeless sealant' }
  ],
  derived: {
    totalDistance: 3500,
    readyCount: 1,
    failedCount: 1,
    recoveryCount: 0,
  },
  history: [],
  recoveryBoardState: {
    selectedRecordId: null
  }
};

const computeDerived = (records: BikeRecord[]) => {
  return {
    totalDistance: records.reduce((sum, r) => sum + r.distance, 0),
    readyCount: records.filter(r => r.status === 'ready').length,
    failedCount: records.filter(r => r.status === 'failed').length,
    recoveryCount: records.filter(r => r.status === 'recovery').length,
  };
};

export const useStore = create<StoreState>((set, get) => ({
  current: initialSessionState,
  past: [],
  future: [],

  createRecord: (recordData) => {
    set((state) => {
      const newRecord = { ...recordData, id: Math.random().toString(36).substring(2, 9) } as BikeRecord;
      const newRecords = [...state.current.records, newRecord];
      const newState = {
        ...state.current,
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.current.history, { action: 'create_record', timestamp: new Date().toISOString(), recordId: newRecord.id }]
      };
      return {
        past: [...state.past, state.current],
        current: newState,
        future: []
      };
    });
  },

  updateRecord: (id, recordData) => {
    set((state) => {
      const newRecords = state.current.records.map(r => r.id === id ? { ...r, ...recordData } : r);
      const newState = {
        ...state.current,
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.current.history, { action: 'update_record', timestamp: new Date().toISOString(), recordId: id }]
      };
      return {
        past: [...state.past, state.current],
        current: newState,
        future: []
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.current.records.filter(r => r.id !== id);
      const newState = {
        ...state.current,
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.current.history, { action: 'delete_record', timestamp: new Date().toISOString(), recordId: id }],
        recoveryBoardState: state.current.recoveryBoardState?.selectedRecordId === id
          ? { selectedRecordId: null }
          : state.current.recoveryBoardState
      };
      return {
        past: [...state.past, state.current],
        current: newState,
        future: []
      };
    });
  },

  moveToRecovery: (id, recoveryAction) => {
    set((state) => {
      const record = state.current.records.find(r => r.id === id);
      if (!record || record.status !== 'failed') return state; // Only failed records can be moved to recovery

      const newRecords = state.current.records.map(r =>
        r.id === id
          ? { ...r, status: 'recovery' as const, notes: (r.notes ? r.notes + '\n' : '') + 'Recovery: ' + recoveryAction }
          : r
      );
      const newState = {
        ...state.current,
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.current.history, { action: 'move_to_recovery', timestamp: new Date().toISOString(), recordId: id }],
        recoveryBoardState: { selectedRecordId: id } // Auto select in recovery board
      };
      return {
        past: [...state.past, state.current],
        current: newState,
        future: []
      };
    });
  },

  selectRecordForRecovery: (id) => {
      set((state) => {
        return {
          current: {
            ...state.current,
            recoveryBoardState: { selectedRecordId: id }
          }
        }
      });
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        current: previous,
        future: [state.current, ...state.future]
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.current],
        current: next,
        future: newFuture
      };
    });
  },

  exportArtifact: () => {
    const state = get().current;
    const exportData = {
      ...state,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  },

  importArtifact: (data: unknown) => {
    try {
      const parsed = SessionSchema.parse(data);
      set((state) => ({
        past: [...state.past, state.current],
        current: {
            ...parsed,
            exportedAt: new Date().toISOString() // Regenerate on import
        },
        future: []
      }));
      return true;
    } catch (e) {
      console.error("Invalid import artifact", e);
      return false;
    }
  },

  clearState: () => {
    set((state) => ({
      past: [...state.past, state.current],
      current: {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: [],
          derived: { totalDistance: 0, readyCount: 0, failedCount: 0, recoveryCount: 0 },
          history: [],
          recoveryBoardState: { selectedRecordId: null }
      },
      future: []
    }));
  }
}));
