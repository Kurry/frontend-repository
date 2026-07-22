import { create } from 'zustand';
import { z } from 'zod';

export const StatusEnum = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);

export const RecordSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  description: z.string().max(200, 'Description too long'),
  capacity: z.number().int().min(1).max(10),
  status: StatusEnum,
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
});

export const SessionSchema = z.object({
  schemaVersion: z.literal('scenario-builder-v1'),
  exportedAt: z.string(),
  records: z.array(RecordSchema),
  derived: z.object({
    totalCapacity: z.number(),
    activeCount: z.number()
  }),
  history: z.array(z.any())
});

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateInitialRecords() {
  const records = [];
  for (let i = 0; i < 110; i++) {
    records.push({
      id: `record-${i}`,
      name: `Scenario ${i}`,
      description: `Description for scenario ${i}`,
      capacity: (i % 10) + 1,
      status: i < 5 ? 'draft' : (i < 10 ? 'ready' : (i < 15 ? 'changed' : (i < 20 ? 'archived' : 'empty'))),
      position: i < 3 ? { x: i * 100, y: i * 50 } : undefined
    });
  }
  return records;
}

const MAX_CAPACITY = 20;

export const useStore = create((set, get) => ({
  records: generateInitialRecords(),
  selectedRecordId: null,
  history: [],
  historyIndex: -1,
  filterStatus: 'all',

  selectRecord: (id) => set({ selectedRecordId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  addRecord: (recordData) => {
    set((state) => {
      const newRecord = { ...recordData, id: generateId(), status: 'draft' };
      const newRecords = [...state.records, newRecord];
      return {
        records: newRecords,
        history: [...state.history.slice(0, state.historyIndex + 1), { type: 'ADD', recordId: newRecord.id, previousState: state.records }],
        historyIndex: state.historyIndex + 1
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const recordIndex = state.records.findIndex(r => r.id === id);
      if (recordIndex === -1) return state;
      const oldRecord = state.records[recordIndex];
      const newRecord = { ...oldRecord, ...updates };
      const parsed = RecordSchema.safeParse(newRecord);

      if (!parsed.success) {
        return state;
      }

      const newRecords = [...state.records];
      newRecords[recordIndex] = parsed.data;

      return {
        records: newRecords,
        history: [...state.history.slice(0, state.historyIndex + 1), { type: 'UPDATE', recordId: id, previousState: state.records }],
        historyIndex: state.historyIndex + 1
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => ({
      records: state.records.filter(r => r.id !== id),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      history: [...state.history.slice(0, state.historyIndex + 1), { type: 'DELETE', recordId: id, previousState: state.records }],
      historyIndex: state.historyIndex + 1
    }));
  },

  placeRecordInComposer: (id, position) => {
    set((state) => {
      const record = state.records.find(r => r.id === id);
      if (!record) return state;

      const currentPlacedCapacity = state.records
        .filter(r => r.position && r.id !== id)
        .reduce((sum, r) => sum + r.capacity, 0);

      if (currentPlacedCapacity + record.capacity > MAX_CAPACITY) {
         return state;
      }

      const newRecords = state.records.map(r =>
        r.id === id ? { ...r, position, status: r.status === 'empty' ? 'draft' : 'changed' } : r
      );

      return {
        records: newRecords,
        selectedRecordId: id,
        history: [...state.history.slice(0, state.historyIndex + 1), {
          type: 'PLACE',
          recordId: id,
          previousState: state.records,
          previousSelectedRecordId: state.selectedRecordId
        }],
        historyIndex: state.historyIndex + 1
      };
    });
  },

  removeRecordFromComposer: (id) => {
      set((state) => {
          const newRecords = state.records.map(r => {
             if(r.id === id) {
                 const { position, ...rest } = r;
                 return rest;
             }
             return r;
          });

          return {
              records: newRecords,
              history: [...state.history.slice(0, state.historyIndex + 1), { type: 'REMOVE_FROM_COMPOSER', recordId: id, previousState: state.records }],
              historyIndex: state.historyIndex + 1
          }
      });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex < 0) return state;
      const action = state.history[state.historyIndex];
      return {
        records: action.previousState,
        selectedRecordId: action.previousSelectedRecordId !== undefined ? action.previousSelectedRecordId : state.selectedRecordId,
        historyIndex: state.historyIndex - 1
      };
    });
  },

  importSession: (sessionData) => {
    try {
      const parsed = SessionSchema.parse(sessionData);
      set({
        records: parsed.records,
        history: parsed.history,
        historyIndex: parsed.history.length - 1,
        selectedRecordId: null
      });
      return true;
    } catch (e) {
      console.error("Invalid session data", e);
      return false;
    }
  },

  clearSession: () => {
    set({
      records: [],
      history: [],
      historyIndex: -1,
      selectedRecordId: null
    });
  },

  getDerivedState: () => {
    const state = get();
    const placedRecords = state.records.filter(r => r.position);
    return {
      totalCapacity: placedRecords.reduce((sum, r) => sum + r.capacity, 0),
      activeCount: placedRecords.length,
      maxCapacity: MAX_CAPACITY
    };
  }
}));
