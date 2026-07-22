import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const initialDerived = {
  summary: { total: 0, draft: 0, ready: 0, changed: 0, archived: 0, conflict: 0, resolved: 0 },
};

export const useStore = create((set, get) => ({
  records: [],
  derived: initialDerived,
  history: [],
  undoStack: [],
  activeRecordId: null,
  filterStatus: 'all',

  setActiveRecordId: (id) => set({ activeRecordId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  addRecord: (record) => {
    const newRecord = {
      id: uuidv4(),
      status: 'draft',
      title: 'New Scenario',
      description: '',
      lineage: 'clean',
      evidence: [],
      ...record,
    };

    set((state) => {
      const newRecords = [...state.records, newRecord];
      const newHistory = [...state.history, { type: 'CREATE', recordId: newRecord.id, timestamp: new Date().toISOString() }];
      return {
        records: newRecords,
        activeRecordId: newRecord.id,
        undoStack: [...state.undoStack, state],
        history: newHistory,
        derived: updateDerived(newRecords)
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || 'changed' } : r);
      const newHistory = [...state.history, { type: 'UPDATE', recordId: id, updates, timestamp: new Date().toISOString() }];
      return {
        records: newRecords,
        undoStack: [...state.undoStack, state],
        history: newHistory,
        derived: updateDerived(newRecords)
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      const newHistory = [...state.history, { type: 'DELETE', recordId: id, timestamp: new Date().toISOString() }];
      return {
        records: newRecords,
        activeRecordId: state.activeRecordId === id ? null : state.activeRecordId,
        undoStack: [...state.undoStack, state],
        history: newHistory,
        derived: updateDerived(newRecords)
      };
    });
  },

  // Canonical mutation: trace a selected record to source evidence and quarantine a bad lineage
  quarantineLineage: (id, evidenceSource) => {
    set((state) => {
      const record = state.records.find(r => r.id === id);
      if (!record || record.status === 'conflict') return state; // Reject invalid/conflict states

      const newRecords = state.records.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: 'conflict',
            lineage: 'quarantined',
            evidence: [...(r.evidence || []), { source: evidenceSource, timestamp: new Date().toISOString() }],
            provenanceAtlasState: 'quarantined'
          };
        }
        return r;
      });

      const newHistory = [...state.history, { type: 'QUARANTINE_LINEAGE', recordId: id, evidenceSource, timestamp: new Date().toISOString() }];
      return {
        records: newRecords,
        undoStack: [...state.undoStack, state],
        history: newHistory,
        derived: updateDerived(newRecords)
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const prevState = state.undoStack[state.undoStack.length - 1];
      return {
        records: prevState.records,
        derived: prevState.derived,
        history: prevState.history,
        activeRecordId: prevState.activeRecordId,
        filterStatus: prevState.filterStatus,
        undoStack: state.undoStack.slice(0, -1)
      };
    });
  },

  importState: (data) => {
    if (!data || data.schemaVersion !== 'scenario-builder-v1') return; // Field-level validation stub

    set({
      records: data.records || [],
      derived: data.derived || initialDerived,
      history: data.history || [],
      undoStack: [],
      activeRecordId: null,
      filterStatus: 'all'
    });
  },

  exportState: () => {
    const state = get();
    return {
      schemaVersion: 'scenario-builder-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history,
    };
  }
}));

function updateDerived(records) {
  const summary = { total: records.length, draft: 0, ready: 0, changed: 0, archived: 0, conflict: 0, resolved: 0 };
  records.forEach(r => {
    if (summary[r.status] !== undefined) {
      summary[r.status]++;
    }
  });
  return { summary };
}
