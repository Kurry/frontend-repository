import { create } from 'zustand';

// Use structured session shape
const initialState = {
  records: [
    { id: 'kp-1', status: 'empty', title: '', evidence: '' },
    { id: 'kp-2', status: 'draft', title: 'Blue Bowl', evidence: '' },
    { id: 'kp-3', status: 'ready', title: 'Red Mug', evidence: '' },
    { id: 'kp-4', status: 'changed', title: 'Green Plate', evidence: '' },
  ],
  auditLensState: {
    status: 'idle', // idle, selected, changed, conflict, resolved
    selectedId: null,
  },
  derived: { summary: 'Ready for audit' },
  history: [],
};

export const useStore = create((set, get) => ({
  ...initialState,
  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: `kp-${Date.now()}` }];
    return updateState(state, newRecords, state.auditLensState);
  }),
  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return updateState(state, newRecords, state.auditLensState);
  }),
  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const newAuditState = state.auditLensState.selectedId === id ? { status: 'idle', selectedId: null } : state.auditLensState;
    return updateState(state, newRecords, newAuditState);
  }),
  selectForAudit: (id) => set((state) => {
    if (state.auditLensState.status === 'idle' || state.auditLensState.status === 'resolved') {
      return { auditLensState: { status: 'selected', selectedId: id } };
    }
    return {};
  }),
  resolveAuditDiscrepancy: (id, evidence) => set((state) => {
    if (!evidence || !evidence.trim()) {
      return { auditLensState: { ...state.auditLensState, status: 'conflict' } };
    }
    const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'resolved', evidence } : r);
    return updateState(state, newRecords, { status: 'resolved', selectedId: id });
  }),
  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousState = state.history[state.history.length - 1];
    return {
      ...previousState,
      history: state.history.slice(0, -1),
    };
  }),
  clearData: () => set(() => updateState({ history: [] }, [], { status: 'idle', selectedId: null })),
  importData: (data) => set({
    records: data.records,
    auditLensState: { status: 'idle', selectedId: null },
    derived: data.derived || { summary: 'Imported' },
    history: data.history || [],
  }),
}));

function updateState(currentState, newRecords, newAuditState) {
  // Save current history before mutation
  const savedState = {
    records: currentState.records,
    auditLensState: currentState.auditLensState,
    derived: currentState.derived,
  };
  return {
    records: newRecords,
    auditLensState: newAuditState,
    derived: computeDerived(newRecords, newAuditState),
    history: [...(currentState.history || []), savedState],
  };
}

function computeDerived(records, auditState) {
  const discrepancies = records.filter(r => r.status === 'changed' || r.status === 'draft').length;
  let summary = `Total records: ${records.length}, Discrepancies: ${discrepancies}`;
  if (auditState.status === 'conflict') {
    summary = 'Audit conflict: missing evidence';
  } else if (auditState.status === 'resolved') {
    summary = 'Audit resolved';
  }
  return { summary, total: records.length, discrepancies };
}
