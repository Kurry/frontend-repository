import { create } from 'zustand';

export const useFlavorStore = create((set, get) => ({
  records: [],
  history: [],
  historyIndex: -1,
  selectedId: null,
  filterStatus: 'all', // all, empty, draft, ready, changed, archived

  // Lens specific
  lensState: 'idle', // idle, selected, changed, conflict, resolved
  lensEvidence: '',

  // Derived state is calculated on the fly
  getDerivedState: () => {
    const { records } = get();
    return {
      total: records.length,
      ready: records.filter(r => r.status === 'ready').length,
      archived: records.filter(r => r.status === 'archived').length,
      discrepancies: records.filter(r => r.hasDiscrepancy).length,
      resolved: records.filter(r => r.status === 'resolved').length
    };
  },

  // Actions
  seed: (records) => set({
    records,
    history: [{ records, selectedId: null, lensState: 'idle' }],
    historyIndex: 0,
    selectedId: null,
    lensState: 'idle'
  }),

  addRecord: (record) => {
    const { records, history, historyIndex, selectedId, lensState } = get();
    const newRecords = [...records, { id: crypto.randomUUID(), status: 'empty', ...record }];
    const newHistory = history.slice(0, historyIndex + 1);
    set({
      records: newRecords,
      history: [...newHistory, { records: newRecords, selectedId, lensState }],
      historyIndex: historyIndex + 1
    });
  },

  updateRecord: (id, updates) => {
    const { records, history, historyIndex, selectedId, lensState } = get();
    const newRecords = records.map(r => r.id === id ? { ...r, ...updates } : r);
    const newHistory = history.slice(0, historyIndex + 1);
    set({
      records: newRecords,
      history: [...newHistory, { records: newRecords, selectedId, lensState }],
      historyIndex: historyIndex + 1
    });
  },

  selectRecord: (id) => {
    const { records, history, historyIndex, lensState } = get();
    const newLensState = id ? 'selected' : 'idle';

    // Selecting doesn't create a new history entry per se to avoid huge history
    // But we update the current history state's selectedId so undo works better
    if (historyIndex >= 0) {
      history[historyIndex].selectedId = id;
      history[historyIndex].lensState = newLensState;
    }

    set({
      selectedId: id,
      lensState: newLensState,
      lensEvidence: ''
    });
  },

  setFilter: (status) => set({ filterStatus: status }),

  // Audit Lens specific
  setLensEvidence: (evidence) => set({ lensEvidence: evidence }),

  resolveDiscrepancy: () => {
    const { selectedId, lensEvidence, records, history, historyIndex } = get();
    if (!selectedId || !lensEvidence.trim()) {
      set({ lensState: 'conflict' });
      return false; // Rejected without partial updates
    }

    const newRecords = records.map(r => {
      if (r.id === selectedId) {
        return {
          ...r,
          hasDiscrepancy: false,
          status: 'resolved',
          auditEvidence: lensEvidence,
          resolvedAt: new Date().toISOString()
        };
      }
      return r;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    set({
      records: newRecords,
      history: [...newHistory, { records: newRecords, selectedId, lensState: 'resolved' }],
      historyIndex: historyIndex + 1,
      lensState: 'resolved'
    });
    return true;
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const snapshot = history[newIndex];
      set({
        records: snapshot.records,
        selectedId: snapshot.selectedId,
        lensState: snapshot.lensState,
        historyIndex: newIndex,
        lensEvidence: ''
      });
    }
  },

  // Export / Import
  getExportableState: () => {
    const { records, history } = get();
    return {
      schemaVersion: 'flavor-balance-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: get().getDerivedState(),
      history
    };
  },

  importState: (data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      // Validation
      if (parsed.schemaVersion !== 'flavor-balance-v1') throw new Error('Invalid schema version');
      if (!Array.isArray(parsed.records)) throw new Error('Records must be an array');

      // Check duplicate IDs and valid status and bounds
      const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived', 'resolved'];
      const validBalances = ['sweet', 'sour', 'salty', 'bitter', 'umami', 'neutral'];
      const ids = new Set();
      for (const r of parsed.records) {
        if (!r.id) throw new Error('Missing record ID');
        if (ids.has(r.id)) throw new Error(`Duplicate ID: ${r.id}`);
        if (!validStatuses.includes(r.status)) throw new Error(`Invalid status: ${r.status}`);
        if (typeof r.intensity !== 'number' || r.intensity < 1 || r.intensity > 10) {
            throw new Error(`Invalid intensity bound: ${r.intensity}`);
        }
        if (!validBalances.includes(r.balance)) {
            throw new Error(`Invalid balance value: ${r.balance}`);
        }
        ids.add(r.id);
      }

      set({
        records: parsed.records,
        history: [{ records: parsed.records, selectedId: null, lensState: 'idle' }],
        historyIndex: 0,
        selectedId: null,
        lensState: 'idle',
        lensEvidence: ''
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  clearSession: () => set({
    records: [],
    history: [{ records: [], selectedId: null, lensState: 'idle' }],
    historyIndex: 0,
    selectedId: null,
    lensState: 'idle',
    lensEvidence: ''
  })
}));
