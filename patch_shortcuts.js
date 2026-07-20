const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

// Add shortcuts for undo, redo, artifact
const hookOld = `if (typing || activeModal) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && (selectedNodeId || selectedEdgeId)) {
        event.preventDefault();
        deleteSelected();
      }`;

const hookNew = `if (typing || activeModal) return;
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === 'z') {
          event.preventDefault();
          if (event.shiftKey) {
            useWorkflowStore.getState().redo();
          } else {
            useWorkflowStore.getState().undo();
          }
        }
        if (event.key.toLowerCase() === 'y') {
          event.preventDefault();
          useWorkflowStore.getState().redo();
        }
        if (event.key.toLowerCase() === 'e') { // Artifact toggle
          event.preventDefault();
          useWorkflowStore.getState().toggleArtifactPanel();
        }
      }
      const hasSelection = useWorkflowStore.getState().nodes.some(n => n.selected) || useWorkflowStore.getState().edges.some(e => e.selected);
      if ((event.key === 'Delete' || event.key === 'Backspace') && (selectedNodeId || selectedEdgeId || hasSelection)) {
        event.preventDefault();
        deleteSelected();
      }`;

code = code.replace(hookOld, hookNew);

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
