const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

// Add Undo/Redo/Undo to Toolbar and add icons

if (!code.includes('Undo,')) {
    code = code.replace(
      'Upload,\n  WarningFilled,\n} from \'@carbon/icons-react\';',
      'Upload,\n  WarningFilled,\n  Undo,\n  Redo,\n} from \'@carbon/icons-react\';'
    );
}

const oldToolbarActions = `<div className="toolbar-actions">
        <Button kind="primary" size="sm" renderIcon={Play} onClick={startRun} disabled={busy}>Run</Button>
        {(run.phase === 'running' || run.phase === 'pausing') && <Button kind="secondary" size="sm" renderIcon={Pause} onClick={pauseRun} disabled={run.phase === 'pausing'}>{run.phase === 'pausing' ? 'Pausing…' : 'Pause'}</Button>}
        {run.phase === 'paused' && <Button kind="secondary" size="sm" renderIcon={Play} onClick={resumeRun}>Resume</Button>}
        {run.phase === 'failed' && <Button kind="danger--tertiary" size="sm" renderIcon={Restart} onClick={retryFailed}>Retry from failed node</Button>}
        <div className="toolbar-divider" />
        <Button kind="tertiary" size="sm" renderIcon={Save} onClick={() => openModal('save')}>Save</Button>
        <Button kind="ghost" size="sm" renderIcon={Code} onClick={useWorkflowStore(state => state.toggleArtifactPanel)}>Artifact</Button>
        <Button hasIconOnly iconDescription="Import workflow" renderIcon={Upload} kind="ghost" size="sm" onClick={() => openModal('import')} />
        <Button hasIconOnly iconDescription="Cycle node selection (Alt+N)" renderIcon={DataConnected} kind="ghost" size="sm" onClick={cycleNodeSelection} />
      </div>`;

const newToolbarActions = `const pastLength = useWorkflowStore((state) => state.past.length);
  const futureLength = useWorkflowStore((state) => state.future.length);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const deleteSelected = useWorkflowStore((state) => state.deleteSelected);
  const hasSelection = nodes.some(n => n.selected) || edges.some(e => e.selected) || useWorkflowStore(state => state.selectedNodeId || state.selectedEdgeId);

  return (
    <section className="workflow-toolbar" aria-label="Workflow controls">
      <div className="toolbar-actions">
        <Button kind="primary" size="sm" renderIcon={Play} onClick={startRun} disabled={busy}>Run</Button>
        {(run.phase === 'running' || run.phase === 'pausing') && <Button kind="secondary" size="sm" renderIcon={Pause} onClick={pauseRun} disabled={run.phase === 'pausing'}>{run.phase === 'pausing' ? 'Pausing…' : 'Pause'}</Button>}
        {run.phase === 'paused' && <Button kind="secondary" size="sm" renderIcon={Play} onClick={resumeRun}>Resume</Button>}
        {run.phase === 'failed' && <Button kind="danger--tertiary" size="sm" renderIcon={Restart} onClick={retryFailed}>Retry from failed node</Button>}
        <div className="toolbar-divider" />
        <Button hasIconOnly iconDescription="Undo" renderIcon={Undo} kind="ghost" size="sm" onClick={undo} disabled={pastLength === 0} />
        <Button hasIconOnly iconDescription="Redo" renderIcon={Redo} kind="ghost" size="sm" onClick={redo} disabled={futureLength === 0} />
        <Button kind="tertiary" size="sm" renderIcon={Save} onClick={() => openModal('save')}>Save</Button>
        <Button kind="ghost" size="sm" renderIcon={Code} onClick={useWorkflowStore(state => state.toggleArtifactPanel)}>Artifact</Button>
        <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} onClick={deleteSelected} disabled={!hasSelection}>Delete selected</Button>
        <Button hasIconOnly iconDescription="Import workflow" renderIcon={Upload} kind="ghost" size="sm" onClick={() => openModal('import')} />
        <Button hasIconOnly iconDescription="Cycle node selection (Alt+N)" renderIcon={DataConnected} kind="ghost" size="sm" onClick={cycleNodeSelection} />
      </div>`;

code = code.replace(
  'return (\n    <section className="workflow-toolbar" aria-label="Workflow controls">\n      <div className="toolbar-actions">\n        <Button kind="primary" size="sm" renderIcon={Play} onClick={startRun} disabled={busy}>Run</Button>\n        {(run.phase === \'running\' || run.phase === \'pausing\') && <Button kind="secondary" size="sm" renderIcon={Pause} onClick={pauseRun} disabled={run.phase === \'pausing\'}>{run.phase === \'pausing\' ? \'Pausing…\' : \'Pause\'}</Button>}\n        {run.phase === \'paused\' && <Button kind="secondary" size="sm" renderIcon={Play} onClick={resumeRun}>Resume</Button>}\n        {run.phase === \'failed\' && <Button kind="danger--tertiary" size="sm" renderIcon={Restart} onClick={retryFailed}>Retry from failed node</Button>}\n        <div className="toolbar-divider" />\n        <Button kind="tertiary" size="sm" renderIcon={Save} onClick={() => openModal(\'save\')}>Save</Button>\n        <Button kind="ghost" size="sm" renderIcon={Code} onClick={useWorkflowStore(state => state.toggleArtifactPanel)}>Artifact</Button>\n        <Button hasIconOnly iconDescription="Import workflow" renderIcon={Upload} kind="ghost" size="sm" onClick={() => openModal(\'import\')} />\n        <Button hasIconOnly iconDescription="Cycle node selection (Alt+N)" renderIcon={DataConnected} kind="ghost" size="sm" onClick={cycleNodeSelection} />\n      </div>',
  newToolbarActions
);

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
