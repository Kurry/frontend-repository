const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

// Replace Toolbar export with toggleArtifactPanel
code = code.replace(
  '<Button kind="ghost" size="sm" renderIcon={Export} onClick={() => openModal(\'artifact\')}>Export</Button>',
  '<Button kind="ghost" size="sm" renderIcon={Code} onClick={useWorkflowStore((state) => state.toggleArtifactPanel)}>Artifact</Button>'
);
fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
