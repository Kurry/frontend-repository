const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', 'utf-8');

// Add past/future to the blank run or rather to the store state
// Let's replace the useWorkflowStore definition to include past, future, pushHistory, undo, redo, and update deleteSelected, selected properties.

code = code.replace(
  'selectedNodeId: null,\n  selectedEdgeId: null,',
  'selectedNodeId: null,\n  selectedEdgeId: null,\n  past: [],\n  future: [],'
);

// We need to implement pushHistory
const pushHistoryStr = `
  pushHistory: () => set((state) => {
    const current = { nodes: structuredClone(state.nodes), edges: structuredClone(state.edges) };
    return { past: [...state.past, current], future: [] };
  }),
  undo: () => set((state) => {
    if (state.past.length === 0) return {};
    const current = { nodes: structuredClone(state.nodes), edges: structuredClone(state.edges) };
    const previous = state.past[state.past.length - 1];
    return {
      nodes: previous.nodes,
      edges: previous.edges,
      past: state.past.slice(0, -1),
      future: [current, ...state.future],
      selectedNodeId: null,
      selectedEdgeId: null,
    };
  }),
  redo: () => set((state) => {
    if (state.future.length === 0) return {};
    const current = { nodes: structuredClone(state.nodes), edges: structuredClone(state.edges) };
    const next = state.future[0];
    return {
      nodes: next.nodes,
      edges: next.edges,
      past: [...state.past, current],
      future: state.future.slice(1),
      selectedNodeId: null,
      selectedEdgeId: null,
    };
  }),
`;

code = code.replace(
  'onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),',
  'onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),\n' + pushHistoryStr
);

// We need to call pushHistory in addNode, addConnection, updateNode, deleteSelected, deleteObject
// wait, we can't call pushHistory inside set() because get() is needed, or we just do it inside the action.
fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', code);
