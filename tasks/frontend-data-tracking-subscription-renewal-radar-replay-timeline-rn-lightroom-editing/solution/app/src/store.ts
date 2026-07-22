import { create } from 'zustand';
import { z } from 'zod';

// Zod Schemas for Validation
export const SubscriptionStatusSchema = z.enum(['draft', 'ready', 'changed', 'quarantined', 'archived']);

export const SubscriptionRecordSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  cost: z.number().min(0, "Cost must be positive"),
  renewalDate: z.string(),
  status: SubscriptionStatusSchema,
});

export const SubscriptionHistoryEventSchema = z.object({
  id: z.string(),
  recordId: z.string(),
  timestamp: z.string(),
  previousState: z.record(z.string(), z.any()).optional(),
  newState: z.record(z.string(), z.any()),
  mutationType: z.string(),
});

export const SubscriptionSessionSchema = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string(),
  records: z.array(SubscriptionRecordSchema),
  derived: z.object({
    totalCost: z.number(),
    activeCount: z.number(),
  }),
  history: z.array(SubscriptionHistoryEventSchema),
});

// Types
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type SubscriptionRecord = z.infer<typeof SubscriptionRecordSchema>;
export type SubscriptionHistoryEvent = z.infer<typeof SubscriptionHistoryEventSchema>;
export type SubscriptionSession = z.infer<typeof SubscriptionSessionSchema>;

// Store state and actions
interface StoreState {
  records: SubscriptionRecord[];
  history: SubscriptionHistoryEvent[];
  selectedRecordId: string | null;
  filterStatus: SubscriptionStatus | 'all';
  timelineCheckpointIndex: number | null; // For scrubbing
  scrubbedRecordState: SubscriptionRecord | null; // Temporarily hold state while scrubbing without polluting main records

  // Actions
  addRecord: (record: Omit<SubscriptionRecord, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<SubscriptionRecord>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  setFilterStatus: (status: SubscriptionStatus | 'all') => void;
  quarantineRecord: (id: string) => void;

  // Replay timeline
  undoLastMutation: () => void;
  scrubToTimelineEvent: (historyId: string) => void;
  restoreTimelineCheckpoint: () => void;
  cancelScrub: () => void;

  // Artifact
  importSession: (session: unknown) => void;
  exportSession: () => SubscriptionSession;
  clearSession: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const getCurrentTimestamp = () => new Date().toISOString();

const calculateDerived = (records: SubscriptionRecord[]) => {
  return {
    totalCost: records.filter(r => r.status !== 'archived' && r.status !== 'quarantined').reduce((sum, r) => sum + r.cost, 0),
    activeCount: records.filter(r => r.status === 'ready' || r.status === 'changed').length
  };
};

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  history: [],
  selectedRecordId: null,
  filterStatus: 'all',
  timelineCheckpointIndex: null,
  scrubbedRecordState: null,

  addRecord: (recordData) => {
    set((state) => {
      const newRecord = { ...recordData, id: generateId() };
      const newHistoryEvent: SubscriptionHistoryEvent = {
        id: generateId(),
        recordId: newRecord.id,
        timestamp: getCurrentTimestamp(),
        newState: newRecord,
        mutationType: 'create',
      };
      return {
        records: [...state.records, newRecord],
        history: [...state.history, newHistoryEvent],
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const recordIndex = state.records.findIndex(r => r.id === id);
      if (recordIndex === -1) return state;

      const oldRecord = state.records[recordIndex];
      const newRecord = { ...oldRecord, ...updates, status: updates.status || (oldRecord.status === 'draft' ? 'draft' : 'changed') } as SubscriptionRecord;

      const newHistoryEvent: SubscriptionHistoryEvent = {
        id: generateId(),
        recordId: id,
        timestamp: getCurrentTimestamp(),
        previousState: oldRecord,
        newState: newRecord,
        mutationType: 'update',
      };

      const newRecords = [...state.records];
      newRecords[recordIndex] = newRecord;

      return {
        records: newRecords,
        history: [...state.history, newHistoryEvent],
      };
    });
  },

  quarantineRecord: (id) => {
    set((state) => {
      const recordIndex = state.records.findIndex(r => r.id === id);
      if (recordIndex === -1) return state;
      const oldRecord = state.records[recordIndex];
      const newRecord = { ...oldRecord, status: 'quarantined' } as SubscriptionRecord;

      const newHistoryEvent: SubscriptionHistoryEvent = {
        id: generateId(),
        recordId: id,
        timestamp: getCurrentTimestamp(),
        previousState: oldRecord,
        newState: newRecord,
        mutationType: 'quarantine',
      };
      const newRecords = [...state.records];
      newRecords[recordIndex] = newRecord;
      return {
        records: newRecords,
        history: [...state.history, newHistoryEvent],
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const oldRecord = state.records.find(r => r.id === id);
      if (!oldRecord) return state;

      const newHistoryEvent: SubscriptionHistoryEvent = {
        id: generateId(),
        recordId: id,
        timestamp: getCurrentTimestamp(),
        previousState: oldRecord,
        newState: { ...oldRecord, status: 'archived' },
        mutationType: 'delete',
      };

      const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' as SubscriptionStatus } : r);

      return {
        records: newRecords,
        history: [...state.history, newHistoryEvent],
        selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
      };
    });
  },

  selectRecord: (id) => set({ selectedRecordId: id, timelineCheckpointIndex: null, scrubbedRecordState: null }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  undoLastMutation: () => {
    set((state) => {
      if (state.history.length === 0) return state;

      const lastEvent = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      let newRecords = [...state.records];

      if (lastEvent.mutationType === 'create') {
        newRecords = newRecords.filter(r => r.id !== lastEvent.recordId);
      } else if (lastEvent.mutationType === 'update' || lastEvent.mutationType === 'quarantine' || lastEvent.mutationType === 'delete') {
        const idx = newRecords.findIndex(r => r.id === lastEvent.recordId);
        if (idx !== -1 && lastEvent.previousState) {
          newRecords[idx] = lastEvent.previousState as SubscriptionRecord;
        }
      }

      return {
        records: newRecords,
        history: newHistory,
      };
    });
  },

  scrubToTimelineEvent: (historyId) => {
      set((state) => {
         const eventIndex = state.history.findIndex(h => h.id === historyId);
         if(eventIndex === -1) return state;
         const event = state.history[eventIndex];

         // Temporary scrubbed state for preview only
         return { timelineCheckpointIndex: eventIndex, scrubbedRecordState: event.newState as SubscriptionRecord };
      });
  },

  cancelScrub: () => set({ timelineCheckpointIndex: null, scrubbedRecordState: null }),

  restoreTimelineCheckpoint: () => {
      set((state) => {
          if (state.timelineCheckpointIndex === null || state.scrubbedRecordState === null) return state;

          const targetEvent = state.history[state.timelineCheckpointIndex];
          const recordId = targetEvent.recordId;

          // Truncate only history for THIS specific record, not global history
          const newHistory = state.history.filter((h, i) => {
              if (h.recordId !== recordId) return true; // keep other records' history
              return i <= state.timelineCheckpointIndex!; // keep this record's history up to checkpoint
          });

          const newRecords = [...state.records];
          const recordIdx = newRecords.findIndex(r => r.id === recordId);
          if (recordIdx !== -1) {
              newRecords[recordIdx] = state.scrubbedRecordState;
          }

          return { records: newRecords, history: newHistory, timelineCheckpointIndex: null, scrubbedRecordState: null };
      });
  },

  importSession: (session) => {
      try {
        const parsed = SubscriptionSessionSchema.parse(session);
        set({
            records: parsed.records,
            history: parsed.history,
            selectedRecordId: null,
            filterStatus: 'all',
            timelineCheckpointIndex: null,
            scrubbedRecordState: null
        });
      } catch (e) {
          console.error("Invalid session format", e);
      }
  },

  exportSession: () => {
      const state = get();
      return {
          schemaVersion: "v1",
          exportedAt: getCurrentTimestamp(),
          records: state.records,
          derived: calculateDerived(state.records),
          history: state.history
      };
  },

  clearSession: () => set({ records: [], history: [], selectedRecordId: null, timelineCheckpointIndex: null, scrubbedRecordState: null })
}));
