const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

// I used `useWorkflowStore(state => state.selectedNodeId || state.selectedEdgeId)` inline inside the component body but not as a hook, which breaks rules of hooks.
// `hasSelection` should not call `useWorkflowStore` directly like that.

const hookOld = `const hasSelection = nodes.some(n => n.selected) || edges.some(e => e.selected) || useWorkflowStore(state => state.selectedNodeId || state.selectedEdgeId);`;
const hookNew = `const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectedEdgeId = useWorkflowStore((state) => state.selectedEdgeId);
  const hasSelection = nodes.some(n => n.selected) || edges.some(e => e.selected) || selectedNodeId || selectedEdgeId;`;

code = code.replace(hookOld, hookNew);

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
