import { create } from 'zustand';

export type DomainStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface FlavorProfile {
  sweetness: number; // 0-100
  acidity: number; // 0-100
  saltiness: number; // 0-100
  bitterness: number; // 0-100
  umami: number; // 0-100
}

export interface Checkpoint {
  id: string;
  timestamp: string;
  profile: FlavorProfile;
  status: DomainStatus;
  name: string;
  details: string;
}

export interface FlavorComponent {
  id: string;
  name: string;
  status: DomainStatus;
  details: string;
  profile: FlavorProfile;
  checkpoints: Checkpoint[]; // history of edits
  activeCheckpointId: string | null;
}

export interface SessionState {
  schemaVersion: 'v1';
  exportedAt: string;
  records: FlavorComponent[];
  derived: {
    totalRecords: number;
    readyCount: number;
    draftCount: number;
  };
  history: any[]; // global actions history if needed
}

interface AppState extends SessionState {
  selectedRecordId: string | null;
  filterStatus: DomainStatus | 'all';
  editorMode: 'edit' | 'replay';

  // Actions
  addRecord: (record: Omit<FlavorComponent, 'id' | 'checkpoints' | 'activeCheckpointId'>) => void;
  updateRecord: (id: string, updates: Partial<FlavorComponent>) => void;
  deleteRecord: (id: string) => void;
  archiveRecord: (id: string) => void;

  selectRecord: (id: string | null) => void;
  setFilterStatus: (status: DomainStatus | 'all') => void;
  setEditorMode: (mode: 'edit' | 'replay') => void;

  // Timeline Actions
  addCheckpoint: (recordId: string, checkpoint: Omit<Checkpoint, 'id' | 'timestamp'>) => void;
  restoreCheckpoint: (recordId: string, checkpointId: string) => void;
  scrubTimeline: (recordId: string, checkpointId: string) => void;

  undoLastMutation: () => void;

  exportSession: () => SessionState;
  importSession: (session: any) => boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const getDerived = (records: FlavorComponent[]) => ({
  totalRecords: records.length,
  readyCount: records.filter(r => r.status === 'ready').length,
  draftCount: records.filter(r => r.status === 'draft').length,
});

export const useStore = create<AppState>((set, get) => ({
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [],
  derived: { totalRecords: 0, readyCount: 0, draftCount: 0 },
  history: [],

  selectedRecordId: null,
  filterStatus: 'all',
  editorMode: 'edit',

  addRecord: (record) => set((state) => {
    const id = generateId();
    const initialCheckpoint: Checkpoint = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      profile: record.profile,
      status: record.status,
      name: record.name,
      details: record.details
    };

    const newRecord: FlavorComponent = {
      ...record,
      id,
      checkpoints: [initialCheckpoint],
      activeCheckpointId: initialCheckpoint.id,
    };

    const newRecords = [...state.records, newRecord];
    return {
      records: newRecords,
      derived: getDerived(newRecords),
      history: [...state.history, { type: 'ADD_RECORD', recordId: id, previousState: null }]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const recordIndex = state.records.findIndex(r => r.id === id);
    if (recordIndex === -1) return state;

    const oldRecord = state.records[recordIndex];
    const newRecord = { ...oldRecord, ...updates };

    // Auto-create checkpoint on meaningful edits if we are updating profile or status
    let checkpoints = newRecord.checkpoints;
    let activeCheckpointId = newRecord.activeCheckpointId;

    if (updates.profile || updates.status || updates.name || updates.details) {
      const newCheckpoint: Checkpoint = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        profile: newRecord.profile,
        status: newRecord.status,
        name: newRecord.name,
        details: newRecord.details
      };

      // If we are overriding history (scrubbed back and now editing)
      const activeIdx = checkpoints.findIndex(c => c.id === activeCheckpointId);
      if (activeIdx !== -1 && activeIdx < checkpoints.length - 1) {
        // truncate future history
        checkpoints = checkpoints.slice(0, activeIdx + 1);
      }

      checkpoints = [...checkpoints, newCheckpoint];
      activeCheckpointId = newCheckpoint.id;
    }

    newRecord.checkpoints = checkpoints;
    newRecord.activeCheckpointId = activeCheckpointId;

    const newRecords = [...state.records];
    newRecords[recordIndex] = newRecord;

    return {
      records: newRecords,
      derived: getDerived(newRecords),
      history: [...state.history, { type: 'UPDATE_RECORD', recordId: id, previousState: oldRecord }]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      derived: getDerived(newRecords),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      history: [...state.history, { type: 'DELETE_RECORD', recordId: id, previousState: record }]
    };
  }),

  archiveRecord: (id) => get().updateRecord(id, { status: 'archived' }),

  selectRecord: (id) => set({ selectedRecordId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setEditorMode: (mode) => set({ editorMode: mode }),

  addCheckpoint: (recordId, checkpoint) => {
    get().updateRecord(recordId, {
      profile: checkpoint.profile,
      status: checkpoint.status,
      name: checkpoint.name,
      details: checkpoint.details
    });
  },

  scrubTimeline: (recordId, checkpointId) => set((state) => {
    const recordIndex = state.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return state;

    const record = state.records[recordIndex];
    const checkpoint = record.checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) return state;

    const newRecord = {
      ...record,
      activeCheckpointId: checkpointId,
      profile: checkpoint.profile,
      status: checkpoint.status,
      name: checkpoint.name,
      details: checkpoint.details
    };

    const newRecords = [...state.records];
    newRecords[recordIndex] = newRecord;

    // We do NOT add scrubbing to history because it's transient until 'restored' or 'edited', but it might be useful to track
    return {
      records: newRecords,
      derived: getDerived(newRecords)
    };
  }),

  restoreCheckpoint: (recordId, checkpointId) => set((state) => {
    const recordIndex = state.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return state;

    const oldRecord = state.records[recordIndex];
    const checkpoint = oldRecord.checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) return state;

    const newRecord = {
      ...oldRecord,
      activeCheckpointId: checkpointId,
      profile: checkpoint.profile,
      status: checkpoint.status,
      name: checkpoint.name,
      details: checkpoint.details
    };

    const newRecords = [...state.records];
    newRecords[recordIndex] = newRecord;

    return {
      records: newRecords,
      derived: getDerived(newRecords),
      history: [...state.history, { type: 'RESTORE_CHECKPOINT', recordId, previousState: oldRecord }]
    };
  }),

  undoLastMutation: () => set((state) => {
    if (state.history.length === 0) return state;

    const lastAction = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);

    let newRecords = [...state.records];

    switch (lastAction.type) {
      case 'ADD_RECORD':
        newRecords = newRecords.filter(r => r.id !== lastAction.recordId);
        break;
      case 'UPDATE_RECORD':
      case 'RESTORE_CHECKPOINT':
        const idx = newRecords.findIndex(r => r.id === lastAction.recordId);
        if (idx !== -1 && lastAction.previousState) {
          newRecords[idx] = lastAction.previousState;
        }
        break;
      case 'DELETE_RECORD':
        if (lastAction.previousState) {
          newRecords.push(lastAction.previousState);
        }
        break;
    }

    return {
      records: newRecords,
      derived: getDerived(newRecords),
      history: newHistory
    };
  }),

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
  },

  importSession: (session) => {
    if (!session || session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
      return false;
    }

    // validate numeric bounds
    for (const record of session.records) {
      if (!record.id || !record.name || !record.profile || !record.status) return false;
      const { sweetness, acidity, saltiness, bitterness, umami } = record.profile;
      if ([sweetness, acidity, saltiness, bitterness, umami].some(v => typeof v !== 'number' || v < 0 || v > 100)) {
        return false; // Invalid bounds
      }
    }

    set({
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: session.records,
      derived: getDerived(session.records),
      history: session.history || [],
      selectedRecordId: null,
      filterStatus: 'all',
      editorMode: 'edit'
    });
    return true;
  }
}));
