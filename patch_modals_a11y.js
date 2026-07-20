const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

// Add role="dialog" and aria-modal="true" to Modals
code = code.replace(/<Modal(?=\s|>)/g, '<Modal role="dialog" aria-modal="true"');

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
