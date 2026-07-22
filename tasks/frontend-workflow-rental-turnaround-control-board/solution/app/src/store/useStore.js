import { create } from 'zustand';

// Deterministic constants
const INITIAL_ROOMS = [
  { id: 'r1', name: 'Living Room' }, { id: 'r2', name: 'Kitchen' },
  { id: 'r3', name: 'Bedroom 1' }, { id: 'r4', name: 'Bedroom 2' },
  { id: 'r5', name: 'Bathroom 1' }, { id: 'r6', name: 'Bathroom 2' },
  { id: 'r7', name: 'Hallway' }, { id: 'r8', name: 'Utility Closet' },
];

const generateFixtures = () => {
  const fixtures = [];
  let id = 1;
  for (const room of INITIAL_ROOMS) {
    const numFixtures = room.name.includes('Bathroom') ? 8 : (room.name === 'Kitchen' ? 10 : 4);
    for (let i = 0; i < numFixtures && id <= 46; i++, id++) {
      fixtures.push({ id: `f${id}`, roomId: room.id, name: `Fixture ${id}` });
    }
  }
  while (id <= 46) {
    fixtures.push({ id: `f${id}`, roomId: 'r1', name: `Fixture ${id}` });
    id++;
  }
  return fixtures;
};

const generateObservations = (fixtures) => {
  return Array.from({ length: 31 }, (_, i) => ({
    id: `obs${i+1}`,
    fixtureId: fixtures[i % fixtures.length].id,
    severity: i % 3 === 0 ? 'high' : (i % 2 === 0 ? 'medium' : 'low'),
    note: `Observation detail ${i+1}`,
    evidenceHash: `hash-${i+1}-${Math.random().toString(36).substr(2, 6)}`,
    capturedAt: 1,
    supersededBy: null,
  }));
};

const INITIAL_FIXTURES = generateFixtures();
const INITIAL_OBSERVATIONS = generateObservations(INITIAL_FIXTURES);

const INITIAL_INVENTORY = Array.from({ length: 14 }, (_, i) => ({
  id: `lot${i+1}`, name: `Lot ${i+1}`, total: 10, reserved: 0, consumed: 0,
}));

const INITIAL_KEYS = Array.from({ length: 6 }, (_, i) => ({
  id: `key${i+1}`, name: `Key ${i+1}`, status: 'available',
}));

const initialState = {
  rooms: INITIAL_ROOMS,
  fixtures: INITIAL_FIXTURES,
  observations: INITIAL_OBSERVATIONS,
  tasks: [],
  edges: [],
  inventory: INITIAL_INVENTORY,
  keys: INITIAL_KEYS,
  custodyEvents: [],
  branches: [],
  approvals: [],
  handoffs: [],
  logicalClock: 1,
  selectedFixtures: [],
};

const hasCycle = (edges, newEdge) => {
  const adj = {};
  edges.concat(newEdge).forEach(e => {
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push(e.to);
  });
  const visited = new Set();
  const recStack = new Set();
  const dfs = (node) => {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    recStack.add(node);
    if (adj[node]) {
      for (const neighbor of adj[node]) {
        if (dfs(neighbor)) return true;
      }
    }
    recStack.delete(node);
    return false;
  };
  for (const node of Object.keys(adj)) {
    if (dfs(node)) return true;
  }
  return false;
};

export const useStore = create((set, get) => ({
  ...initialState,

  toggleFixtureSelection: (fixtureId) => set((state) => {
    const selected = state.selectedFixtures.includes(fixtureId)
      ? state.selectedFixtures.filter(id => id !== fixtureId)
      : [...state.selectedFixtures, fixtureId];
    return { selectedFixtures: selected };
  }),
  clearSelection: () => set({ selectedFixtures: [] }),
  selectLasso: (fixtureIds) => set({ selectedFixtures: fixtureIds }),

  advanceClock: () => set((state) => ({ logicalClock: state.logicalClock + 1 })),

  createTask: (task) => set((state) => ({
    tasks: [...state.tasks, {
      ...task,
      id: `t${Date.now()}`,
      status: 'pending',
      isDispatched: false,
      isVerified: false
    }]
  })),

  updateTask: (taskId, updates) => set((state) => {
    // Prevent overlaps if modifying start/duration
    const tasks = state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    if (updates.startDay !== undefined || updates.duration !== undefined) {
      const updatedTask = tasks.find(t => t.id === taskId);
      const overlaps = tasks.some(t =>
        t.id !== taskId &&
        t.assignee === updatedTask.assignee &&
        t.startDay < updatedTask.startDay + updatedTask.duration &&
        updatedTask.startDay < t.startDay + t.duration
      );
      if (overlaps) return state; // Revert if overlap
    }
    return { tasks };
  }),

  addEdge: (from, to) => set((state) => {
    if (hasCycle(state.edges, { from, to })) return state;
    return { edges: [...state.edges, { from, to }] };
  }),

  reserveInventory: (lotId, amount) => set((state) => ({
    inventory: state.inventory.map(lot => lot.id === lotId ? { ...lot, reserved: lot.reserved + amount } : lot)
  })),

  consumeInventory: (lotId, amount) => set((state) => ({
    inventory: state.inventory.map(lot => lot.id === lotId ? { ...lot, reserved: Math.max(0, lot.reserved - amount), consumed: lot.consumed + amount } : lot)
  })),

  issueKey: (keyId, worker) => set((state) => {
    if (state.keys.find(k => k.id === keyId).status !== 'available') return state;
    return {
      keys: state.keys.map(k => k.id === keyId ? { ...k, status: 'checked-out' } : k),
      custodyEvents: [...state.custodyEvents, { id: `ce${Date.now()}`, keyId, action: 'checkout', worker, timestamp: state.logicalClock }]
    };
  }),

  returnKey: (keyId) => set((state) => ({
    keys: state.keys.map(k => k.id === keyId ? { ...k, status: 'available' } : k),
    custodyEvents: [...state.custodyEvents, { id: `ce${Date.now()}`, keyId, action: 'return', timestamp: state.logicalClock }]
  })),

  branchScope: (fixtureId, decision) => set((state) => ({
    branches: [...state.branches, { id: `b${Date.now()}`, fixtureId, decision, timestamp: state.logicalClock }]
  })),

  approveBranch: (branchId) => set((state) => ({
    approvals: [...state.approvals, { id: `a${Date.now()}`, branchId, timestamp: state.logicalClock, stale: false }]
  })),

  markApprovalsStale: (fixtureId) => set((state) => ({
    approvals: state.approvals.map(a => {
      const branch = state.branches.find(b => b.id === a.branchId);
      return branch?.fixtureId === fixtureId ? { ...a, stale: true } : a;
    })
  })),

  dispatchTask: (taskId) => set((state) => {
    // Check prerequisites
    const preds = state.edges.filter(e => e.to === taskId).map(e => e.from);
    const allPredsVerified = preds.every(pId => state.tasks.find(t => t.id === pId)?.isVerified);
    if (!allPredsVerified) return state;

    return {
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, isDispatched: true, status: 'in-progress' } : t)
    };
  }),

  verifyTask: (taskId) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'completed', isVerified: true } : t)
  })),

  triggerDelay: (taskId) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, duration: t.duration + 1 } : t)
  })),

  partialHandoff: () => set((state) => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.isVerified).length;
    return {
      handoffs: [...state.handoffs, { id: `h${Date.now()}`, type: completed === total ? 'full' : 'partial', timestamp: state.logicalClock }]
    };
  }),

  recoverHandoff: (handoffId) => set((state) => ({
    handoffs: state.handoffs.filter(h => h.id !== handoffId)
  })),

  resetState: (newState) => set(newState || initialState),
}));
