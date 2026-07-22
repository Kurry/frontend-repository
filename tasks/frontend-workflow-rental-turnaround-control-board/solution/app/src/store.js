import { create } from 'zustand';

// --- Fixture Data Generators ---
const generateRooms = () => Array.from({ length: 8 }).map((_, i) => ({ id: `room-${i + 1}`, name: `Room ${i + 1}`, x: (i % 4) * 200, y: Math.floor(i / 4) * 200, width: 180, height: 180 }));
const generateFixtures = () => {
  const fixtures = [];
  let fIdx = 1;
  for (let r = 1; r <= 8; r++) {
    const numFixtures = r === 1 || r === 2 ? 6 : (r === 3 ? 5 : Math.floor(46 / 8));
    for (let f = 1; f <= numFixtures && fIdx <= 46; f++) {
      fixtures.push({
        id: `fixture-${fIdx}`,
        roomId: `room-${r}`,
        name: `Fixture ${fIdx}`,
        status: 'uninspected', // uninspected, finding, work, verified
        x: (r - 1) % 4 * 200 + (f % 3) * 50 + 30,
        y: Math.floor((r - 1) / 4) * 200 + Math.floor(f / 3) * 50 + 50,
      });
      fIdx++;
    }
  }
  return fixtures;
};
const generateObservations = () => Array.from({ length: 31 }).map((_, i) => ({
  id: `obs-${i + 1}`,
  fixtureId: `fixture-${(i % 46) + 1}`,
  category: 'wear',
  severity: i % 3 === 0 ? 'high' : 'low',
  note: `Observation ${i + 1}`,
  evidenceHash: `ev-${(i % 18) + 1}`,
  capturedAt: 1,
  supersession: null
}));
const generateEvidence = () => Array.from({ length: 18 }).map((_, i) => ({ hash: `ev-${i + 1}`, type: 'image', thumbnail: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+ZXYtJHtpICsgMX08L3RleHQ+PC9zdmc+` }));
const generateInventoryLots = () => Array.from({ length: 14 }).map((_, i) => ({ id: `lot-${i + 1}`, name: `Lot ${i + 1}`, total: 10, available: 10 }));
const generateKeys = () => Array.from({ length: 6 }).map((_, i) => ({ id: `key-${i + 1}`, name: `Key ${i + 1}`, roomId: `room-${i + 1}`, isCheckedOut: false }));
const generateWorkers = () => Array.from({ length: 3 }).map((_, i) => ({ id: `worker-${i + 1}`, name: `Worker ${i + 1}` }));

const initialState = {
  rooms: generateRooms(),
  fixtures: generateFixtures(),
  observations: generateObservations(),
  evidence: generateEvidence(),
  inventoryLots: generateInventoryLots(),
  keys: generateKeys(),
  workers: generateWorkers(),
  tasks: [],
  edges: [],
  custodyEvents: [],
  branches: [],
  approvals: [],
  handoffs: [],
  clock: 1,
  selection: [],
  activeBranchId: null,
  activeEvidenceId: null, // to trace finding -> decision -> task
};

// Cycle detection for DAG
const hasCycle = (edges, newEdge) => {
  const adj = {};
  edges.concat([newEdge]).forEach(e => {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  });

  const visited = new Set();
  const recStack = new Set();

  const isCyclic = (node) => {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    if (adj[node]) {
      for (const neighbor of adj[node]) {
        if (isCyclic(neighbor)) return true;
      }
    }
    recStack.delete(node);
    return false;
  };

  for (const node of Object.keys(adj)) {
    if (isCyclic(node)) return true;
  }
  return false;
};

export const useStore = create((set, get) => ({
  ...initialState,

  // Selection
  selectLoci: (ids, clear = false) => set(state => ({ selection: clear ? ids : [...new Set([...state.selection, ...ids])] })),
  clearSelection: () => set({ selection: [] }),
  setActiveEvidence: (id) => set({ activeEvidenceId: id }),

  // Tasks
  addTask: (task) => set(state => {
    // Map fixtures status to 'work' if task is associated
    let updatedFixtures = state.fixtures;
    if (task.locus) {
       updatedFixtures = state.fixtures.map(f => (f.id === task.locus || state.rooms.find(r => r.id === task.locus)?.id === f.roomId) ? { ...f, status: 'work' } : f);
    }
    return { tasks: [...state.tasks, task], fixtures: updatedFixtures };
  }),
  updateTask: (taskId, updates) => set(state => {
    let nextTasks = state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    // Mark stale approval if dependencies change
    let staleApprovals = state.approvals;
    if (updates.start !== undefined || updates.duration !== undefined) {
      staleApprovals = staleApprovals.map(a => ({ ...a, stale: true }));
    }
    return { tasks: nextTasks, approvals: staleApprovals };
  }),
  addEdge: (edge) => set(state => {
    if (hasCycle(state.edges, edge)) {
      console.warn("Cycle detected. Cannot add dependency.");
      return state;
    }
    return { edges: [...state.edges, edge] };
  }),

  // Custody & Inventory
  reserveInventory: (lotId, amount) => set(state => {
    const lots = state.inventoryLots.map(l => {
      if (l.id === lotId && l.available >= amount) {
        return { ...l, available: l.available - amount };
      }
      return l;
    });
    return { inventoryLots: lots };
  }),
  checkOutKey: (keyId, workerId) => set(state => {
    const keys = state.keys.map(k => k.id === keyId ? { ...k, isCheckedOut: true } : k);
    const event = { id: `event-${Date.now()}`, type: 'checkout', keyId, workerId, clock: state.clock };
    return { keys, custodyEvents: [...state.custodyEvents, event] };
  }),
  returnKey: (keyId) => set(state => {
    const keys = state.keys.map(k => k.id === keyId ? { ...k, isCheckedOut: false } : k);
    const event = { id: `event-${Date.now()}`, type: 'return', keyId, clock: state.clock };
    return { keys, custodyEvents: [...state.custodyEvents, event] };
  }),

  // Branches & Approvals
  addBranch: (branch) => set(state => ({ branches: [...state.branches, branch] })),
  approveBranch: (branchId) => set(state => {
    // Freeze evidence/schedule basis
    return { approvals: [...state.approvals, { branchId, clock: state.clock, stale: false }] };
  }),

  // Clock & Dispatch
  advanceClock: () => set(state => {
    const clock = state.clock + 1;
    // Handle delayed delivery triggered on day 3
    let nextTasks = state.tasks;
    if (clock >= 3) {
      nextTasks = nextTasks.map(t => t.id === 'task-delay' ? { ...t, status: 'dispatched' } : t);
    }
    return { clock, tasks: nextTasks };
  }),
  dispatchTasks: (taskIds) => set(state => {
    return {
      tasks: state.tasks.map(t => {
        if (taskIds.includes(t.id) && t.status !== 'delayed') {
          return { ...t, status: 'dispatched' };
        }
        return t;
      })
    };
  }),

  // Verification & Handoff
  verifyTask: (taskId) => set(state => {
    const task = state.tasks.find(t => t.id === taskId);
    let updatedFixtures = state.fixtures;
    if (task && task.locus) {
      updatedFixtures = state.fixtures.map(f => (f.id === task.locus || state.rooms.find(r => r.id === task.locus)?.id === f.roomId) ? { ...f, status: 'verified' } : f);
    }
    return { tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'verified' } : t), fixtures: updatedFixtures };
  }),
  createHandoff: (handoff) => set(state => {
    // Calculate unverified, missing keys
    const blockedRooms = [];
    state.tasks.forEach(t => {
      if (t.status !== 'verified') blockedRooms.push(t.locus);
    });
    return { handoffs: [...state.handoffs, { ...handoff, id: `handoff-${Date.now()}`, clock: state.clock, blockedRooms: [...new Set(blockedRooms)] }] };
  }),
  revokeHandoff: (handoffId) => set(state => ({ handoffs: state.handoffs.filter(h => h.id !== handoffId) })),

  // Import / Export
  importState: (newState) => {
    if (!newState.fixtures || !newState.rooms || !newState.clock) throw new Error("Invalid import state");
    set(() => newState);
  },
  resetState: () => set(() => initialState),
}));
