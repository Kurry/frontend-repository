const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', 'utf-8');

// For confirmLoadWorkflow
code = code.replace(
  'executionToken += 1;\n    stopElapsed();\n    set((current) => ({',
  'get().pushHistory();\n    executionToken += 1;\n    stopElapsed();\n    set((current) => ({'
);

// For confirmImport
code = code.replace(
  'executionToken += 1;\n    stopElapsed();\n    set((state) => ({',
  'get().pushHistory();\n    executionToken += 1;\n    stopElapsed();\n    set((state) => ({'
);

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', code);
