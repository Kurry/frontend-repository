const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', 'utf-8');

code = code.replace(
  "if (!nodes.length) return { error: 'There is nothing to run.' };",
  "if (!nodes.length) return { error: 'There is nothing to run. Drag nodes from the palette onto the canvas to begin.' };"
);

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', code);
