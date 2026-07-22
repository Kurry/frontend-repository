import { create } from 'zustand';
import type { ApplianceRecord, ApplianceStatus, DerivedState, HistoryAction, ArtifactSchema, TimelineEvent } from './types';

interface AppState {
  records: ApplianceRecord[];
  derived: DerivedState;
  history: HistoryAction[];

  // Actions
  setFilter: (filter: ApplianceStatus | 'all') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  selectRecord: (id: string | null) => void;

  createRecord: (record: Omit<ApplianceRecord, 'id' | 'status' | 'service_history'>) => void;
  updateRecord: (id: string, updates: Partial<Omit<ApplianceRecord, 'id' | 'service_history'>>) => void;
  deleteRecord: (id: string) => void;
  archiveRecord: (id: string) => void;

  scrubTimeline: (recordId: string, checkpointId: string) => void;
  undoLastAction: () => void;

  importArtifact: (artifact: ArtifactSchema) => void;
  exportArtifact: () => ArtifactSchema;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createTimelineEvent = (
  type: TimelineEvent['type'],
  description: string,
  snapshot: Omit<ApplianceRecord, 'service_history' | 'timeline_checkpoint'>
): TimelineEvent => ({
  id: generateId(),
  timestamp: new Date().toISOString(),
  description,
  type,
  snapshot
});

const defaultRecords: ApplianceRecord[] = [
  {
    id: 'r1',
    type: 'Refrigerator',
    brand: 'Samsung',
    model: 'RF28R7201SR',
    serial_number: 'SN-001',
    status: 'ready',
    service_history: [
      {
        id: 'cp1-1',
        timestamp: '2023-01-15T10:00:00Z',
        description: 'Initial Installation',
        type: 'creation',
        snapshot: { id: 'r1', type: 'Refrigerator', brand: 'Samsung', model: 'RF28R7201SR', serial_number: 'SN-001', status: 'ready' }
      },
      {
         id: 'cp1-2',
         timestamp: '2023-06-20T14:30:00Z',
         description: 'Routine Maintenance',
         type: 'service',
         snapshot: { id: 'r1', type: 'Refrigerator', brand: 'Samsung', model: 'RF28R7201SR', serial_number: 'SN-001', status: 'ready' }
      }
    ]
  },
  {
    id: 'r2',
    type: 'Washing Machine',
    brand: 'LG',
    model: 'WM4000HWA',
    serial_number: 'SN-002',
    status: 'draft',
    service_history: [
       {
        id: 'cp2-1',
        timestamp: '2024-02-10T09:15:00Z',
        description: 'Draft created',
        type: 'creation',
        snapshot: { id: 'r2', type: 'Washing Machine', brand: 'LG', model: 'WM4000HWA', serial_number: 'SN-002', status: 'draft' }
      }
    ]
  },
  {
    id: 'r3',
    type: 'Dishwasher',
    brand: 'Bosch',
    model: 'SHPM65Z55N',
    serial_number: 'SN-003',
    status: 'archived',
    service_history: [
       {
        id: 'cp3-1',
        timestamp: '2021-11-05T11:00:00Z',
        description: 'Initial Installation',
        type: 'creation',
        snapshot: { id: 'r3', type: 'Dishwasher', brand: 'Bosch', model: 'SHPM65Z55N', serial_number: 'SN-003', status: 'ready' }
      },
      {
        id: 'cp3-2',
        timestamp: '2024-01-12T16:45:00Z',
        description: 'Archived due to replacement',
        type: 'modification',
        snapshot: { id: 'r3', type: 'Dishwasher', brand: 'Bosch', model: 'SHPM65Z55N', serial_number: 'SN-003', status: 'archived' }
      }
    ]
  },
  {
    id: 'r4',
    type: 'Oven',
    brand: 'GE',
    model: 'JB735SPSS',
    serial_number: '',
    status: 'empty',
    service_history: []
  },
  {
    id: 'r5',
    type: 'Microwave',
    brand: 'Panasonic',
    model: 'NN-SN936B',
    serial_number: 'SN-005',
    status: 'changed',
    service_history: [
      {
        id: 'cp5-1',
        timestamp: '2023-08-22T13:20:00Z',
        description: 'Initial Installation',
        type: 'creation',
        snapshot: { id: 'r5', type: 'Microwave', brand: 'Panasonic', model: 'NN-SN936B', serial_number: 'SN-005', status: 'ready' }
      },
      {
        id: 'cp5-2',
        timestamp: '2024-03-01T10:10:00Z',
        description: 'Replaced Magnetron',
        type: 'service',
        snapshot: { id: 'r5', type: 'Microwave', brand: 'Panasonic', model: 'NN-SN936B', serial_number: 'SN-005', status: 'changed' }
      }
    ]
  }
];

const computeDerivedState = (
  records: ApplianceRecord[],
  currentDerived: DerivedState
): DerivedState => {
  const counts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, { empty: 0, draft: 0, ready: 0, changed: 0, archived: 0 } as Record<ApplianceStatus, number>);

  return {
    ...currentDerived,
    totalRecords: records.length,
    recordsByStatus: counts
  };
};

const recordHistory = (
  type: HistoryAction['type'],
  recordId: string,
  previousState: ApplianceRecord | null,
  newState: ApplianceRecord | null,
  history: HistoryAction[]
) => {
  const newAction: HistoryAction = {
    id: generateId(),
    type,
    recordId,
    timestamp: new Date().toISOString(),
    previousState,
    newState
  };
  return [...history, newAction];
};

export const useStore = create<AppState>((set, get) => ({
  records: defaultRecords,
  derived: {
    totalRecords: defaultRecords.length,
    recordsByStatus: defaultRecords.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, { empty: 0, draft: 0, ready: 0, changed: 0, archived: 0 }),
    activeFilter: 'all',
    activeSelectionId: null,
    sortOrder: 'asc'
  },
  history: [],

  setFilter: (filter) => set((state) => ({
    derived: { ...state.derived, activeFilter: filter }
  })),

  setSortOrder: (order) => set((state) => ({
    derived: { ...state.derived, sortOrder: order }
  })),

  selectRecord: (id) => set((state) => ({
    derived: { ...state.derived, activeSelectionId: id }
  })),

  createRecord: (recordData) => set((state) => {
    const newId = generateId();
    const newRecord: ApplianceRecord = {
      ...recordData,
      id: newId,
      status: 'draft',
      service_history: []
    };

    newRecord.service_history.push(createTimelineEvent(
      'creation',
      'Record Created',
      { ...newRecord, service_history: undefined } as any
    ));

    const newRecords = [...state.records, newRecord];
    return {
      records: newRecords,
      derived: computeDerivedState(newRecords, state.derived),
      history: recordHistory('create', newId, null, newRecord, state.history)
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const idx = state.records.findIndex(r => r.id === id);
    if (idx === -1) return state;

    const oldRecord = state.records[idx];
    const newRecord = { ...oldRecord, ...updates, status: 'changed' as ApplianceStatus };

    newRecord.service_history = [
      ...oldRecord.service_history,
      createTimelineEvent('modification', 'Record Updated', { ...newRecord, service_history: undefined } as any)
    ];

    const newRecords = [...state.records];
    newRecords[idx] = newRecord;

    return {
      records: newRecords,
      derived: computeDerivedState(newRecords, state.derived),
      history: recordHistory('update', id, oldRecord, newRecord, state.history)
    };
  }),

  deleteRecord: (id) => set((state) => {
    const oldRecord = state.records.find(r => r.id === id);
    if (!oldRecord) return state;

    const newRecords = state.records.filter(r => r.id !== id);
    let newSelection = state.derived.activeSelectionId;
    if (newSelection === id) newSelection = null;

    return {
      records: newRecords,
      derived: computeDerivedState(newRecords, { ...state.derived, activeSelectionId: newSelection }),
      history: recordHistory('delete', id, oldRecord, null, state.history)
    };
  }),

  archiveRecord: (id) => set((state) => {
    const idx = state.records.findIndex(r => r.id === id);
    if (idx === -1) return state;

    const oldRecord = state.records[idx];
    const newRecord = { ...oldRecord, status: 'archived' as ApplianceStatus };

     newRecord.service_history = [
      ...oldRecord.service_history,
      createTimelineEvent('modification', 'Record Archived', { ...newRecord, service_history: undefined } as any)
    ];

    const newRecords = [...state.records];
    newRecords[idx] = newRecord;

    return {
      records: newRecords,
      derived: computeDerivedState(newRecords, state.derived),
      history: recordHistory('update', id, oldRecord, newRecord, state.history)
    };
  }),

  scrubTimeline: (recordId, checkpointId) => set((state) => {
    const idx = state.records.findIndex(r => r.id === recordId);
    if (idx === -1) return state;

    const oldRecord = state.records[idx];
    const checkpoint = oldRecord.service_history.find(cp => cp.id === checkpointId);

    if (!checkpoint) return state;

    const newRecord: ApplianceRecord = {
      ...checkpoint.snapshot,
      service_history: oldRecord.service_history,
      timeline_checkpoint: checkpointId
    };

    const newRecords = [...state.records];
    newRecords[idx] = newRecord;

    return {
      records: newRecords,
      derived: computeDerivedState(newRecords, state.derived),
      history: recordHistory('scrub', recordId, oldRecord, newRecord, state.history)
    };
  }),

  undoLastAction: () => set((state) => {
    if (state.history.length === 0) return state;

    const lastAction = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    let newRecords = [...state.records];

    if (lastAction.type === 'create') {
      newRecords = newRecords.filter(r => r.id !== lastAction.recordId);
    } else if (lastAction.type === 'delete') {
      if (lastAction.previousState) {
        newRecords.push(lastAction.previousState);
      }
    } else if (lastAction.type === 'update' || lastAction.type === 'scrub') {
      const idx = newRecords.findIndex(r => r.id === lastAction.recordId);
      if (idx !== -1 && lastAction.previousState) {
        newRecords[idx] = lastAction.previousState;
      }
    }

    // Undo does not restore selection to avoid complex jumping, but can if needed.

    return {
      records: newRecords,
      derived: computeDerivedState(newRecords, state.derived),
      history: newHistory
    };
  }),

  importArtifact: (artifact) => set(() => ({
    records: artifact.records,
    derived: artifact.derived,
    history: artifact.history
  })),

  exportArtifact: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
  }
}));
