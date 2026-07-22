import { create } from 'zustand';

// Generate 100 seeded nodes
const generateSeedNodes = () => {
  const statuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
  const nodes = [];
  for (let i = 1; i <= 100; i++) {
    nodes.push({
      id: `node-${i}`,
      title: `Story Node ${i}`,
      content: i % 2 === 0 ? `Content for node ${i}. It leads to some choices.` : '',
      status: statuses[i % statuses.length],
      owner: i % 3 === 0 ? 'Alex' : (i % 3 === 1 ? 'Jordan' : 'Unassigned'),
      readiness: i % 4 === 0 ? 'complete' : 'pending'
    });
  }
  return nodes;
};

const initialState = {
  records: generateSeedNodes(),
  history: [], // For undo
  historyIndex: -1,
  selectedNodeId: null,
  filterStatus: 'all',
  error: null
};

// Derived state computation
export const computeDerived = (records) => {
  const summary = {
    total: records.length,
    empty: 0,
    draft: 0,
    ready: 0,
    changed: 0,
    archived: 0,
    unassigned: 0,
    assigned: 0,
  };

  records.forEach(r => {
    if (summary[r.status] !== undefined) {
      summary[r.status]++;
    }
    if (r.owner === 'Unassigned' || !r.owner) {
      summary.unassigned++;
    } else {
      summary.assigned++;
    }
  });

  return { summary };
};

export const useStore = create((set, get) => ({
  ...initialState,

  derived: computeDerived(initialState.records),

  // Push state to history before mutating
  _pushHistory: () => {
    const { records, history, historyIndex, selectedNodeId } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ records: JSON.parse(JSON.stringify(records)), selectedNodeId });
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  createNode: (node) => {
    get()._pushHistory();
    set((state) => {
      const newRecords = [...state.records, { ...node, id: `node-${Date.now()}` }];
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        selectedNodeId: node.id,
        error: null
      };
    });
  },

  updateNode: (id, updates) => {
    get()._pushHistory();
    set((state) => {
      const newRecords = state.records.map((r) => r.id === id ? { ...r, ...updates } : r);
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        error: null
      };
    });
  },

  deleteNode: (id) => {
    get()._pushHistory();
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== id);
      return {
        records: newRecords,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        derived: computeDerived(newRecords),
        error: null
      };
    });
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  setFilterStatus: (status) => {
    set({ filterStatus: status });
  },

  // Signature Mutation: connect a selected record to a handoff owner and update readiness
  connectOwner: (id, owner, readiness) => {
    get()._pushHistory();
    set((state) => {
      const newRecords = state.records.map((r) => {
        if (r.id === id) {
          // Determine status based on change
          const newStatus = readiness === 'complete' ? 'ready' : 'changed';
          return { ...r, owner, readiness, status: newStatus };
        }
        return r;
      });
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        error: null
      };
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= 0) {
      const previousState = history[historyIndex];
      set({
        records: previousState.records,
        selectedNodeId: previousState.selectedNodeId,
        derived: computeDerived(previousState.records),
        historyIndex: historyIndex - 1,
        error: null
      });
    }
  },

  exportArtifact: () => {
    const { records, history, derived } = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
  },

  importArtifact: (data) => {
    try {
      if (typeof data !== 'object' || !data) throw new Error("Invalid format");
      if (data.schemaVersion !== 'v1') throw new Error("Invalid schemaVersion: expected v1");
      if (!Array.isArray(data.records)) throw new Error("Records must be an array");

      const statuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
      const uniqueIds = new Set();

      data.records.forEach(r => {
        if (!r.id || typeof r.id !== 'string') throw new Error("Missing or invalid record id");
        if (uniqueIds.has(r.id)) throw new Error(`Duplicate record id: ${r.id}`);
        uniqueIds.add(r.id);

        if (!statuses.includes(r.status)) throw new Error(`Invalid status: ${r.status} for record ${r.id}`);
        // Basic required field checks
        if (typeof r.title !== 'string') throw new Error(`Missing or invalid title for record ${r.id}`);
      });

      set({
        records: data.records,
        history: data.history || [],
        historyIndex: data.history ? data.history.length - 1 : -1,
        selectedNodeId: null,
        derived: computeDerived(data.records),
        error: null
      });
    } catch (err) {
      set({ error: err.message });
    }
  },

  clearError: () => set({ error: null }),
  clearAll: () => set({ ...initialState, records: [], derived: computeDerived([]) })
}));
