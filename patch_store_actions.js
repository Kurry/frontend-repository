const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', 'utf-8');

// For addNode:
code = code.replace(
  'const node = {',
  'get().pushHistory();\n    const node = {'
);

// For addConnection:
code = code.replace(
  "const edge = { ...connection, id: connection.id || `edge-${source.id}-${target.id}-${Date.now().toString(36)}`, sourceHandle: 'out', targetHandle: 'in', type: 'smoothstep' };\n    set((current) => ({ edges: addEdge(edge, current.edges) }));",
  "get().pushHistory();\n    const edge = { ...connection, id: connection.id || `edge-${source.id}-${target.id}-${Date.now().toString(36)}`, sourceHandle: 'out', targetHandle: 'in', type: 'smoothstep' };\n    set((current) => ({ edges: addEdge(edge, current.edges) }));"
);

// For deleteSelected: (Wait, I will update deleteSelected entirely in step 2, but let's add pushHistory there anyway, and for updateNode)
code = code.replace(
  'updateNode: (id, values) => set((state) => ({',
  'updateNode: (id, values) => { get().pushHistory(); set((state) => ({'
);
code = code.replace(
  'announcement: \'Node configuration saved\',\n  })),',
  'announcement: \'Node configuration saved\',\n  })); },'
);

// For deleteObject:
code = code.replace(
  'deleteObject: (kind, id) => {',
  'deleteObject: (kind, id) => {\n    get().pushHistory();'
);

// For onNodesChange: we should probably hook pushHistory onto drag end in App.jsx. Let's do that later.

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', code);
