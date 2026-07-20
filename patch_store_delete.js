const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', 'utf-8');

const newDeleteSelected = `deleteSelected: () => {
    get().pushHistory();
    set((state) => {
      const selectedNodes = new Set(state.nodes.filter(n => n.selected).map(n => n.id));
      const selectedEdges = new Set(state.edges.filter(e => e.selected).map(e => e.id));
      if (selectedNodes.size === 0 && selectedEdges.size === 0 && !state.selectedNodeId && !state.selectedEdgeId) return {};
      if (state.selectedNodeId) selectedNodes.add(state.selectedNodeId);
      if (state.selectedEdgeId) selectedEdges.add(state.selectedEdgeId);

      const newNodes = state.nodes.filter(n => !selectedNodes.has(n.id));
      const newEdges = state.edges.filter(e => !selectedEdges.has(e.id) && !selectedNodes.has(e.source) && !selectedNodes.has(e.target));
      return { nodes: newNodes, edges: newEdges, selectedNodeId: null, selectedEdgeId: null };
    });
  },`;

const oldStr = `deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId } = get();
    if (selectedNodeId) {
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== selectedNodeId),
        edges: state.edges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId),
        selectedNodeId: null,
      }));
    } else if (selectedEdgeId) {
      set((state) => ({ edges: state.edges.filter((edge) => edge.id !== selectedEdgeId), selectedEdgeId: null }));
    }
  },`;

code = code.replace(oldStr, newDeleteSelected);
fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', code);
