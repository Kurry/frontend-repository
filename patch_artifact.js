const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

// Replace ArtifactModal with ArtifactPanel
// Replace <Modal passiveModal open={open} ...> with <aside className={`artifact-panel \${open ? 'open' : 'closed'}`}> ...
// We need to keep the empty state logic if nodes.length === 0

const oldArtifactModal = `function ArtifactModal() {
  const open = useWorkflowStore((state) => state.ui.modal === 'artifact');
  const mode = useWorkflowStore((state) => state.ui.artifactMode);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const activeName = useWorkflowStore((state) => state.activeWorkflowName);
  const close = useWorkflowStore((state) => state.closeModal);
  const setMode = useWorkflowStore((state) => state.setArtifactMode);
  const exportDefinition = useWorkflowStore((state) => state.exportDefinition);
  const exportMermaid = useWorkflowStore((state) => state.exportMermaid);
  const showToast = useWorkflowStore((state) => state.showToast);
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString());
  useEffect(() => { if (open) setGeneratedAt(new Date().toISOString()); }, [open, nodes, edges, activeName]);
  const content = useMemo(() => {
    if (!open) return '';
    if (mode === 'mermaid') return exportMermaid();
    const definition = exportDefinition();
    return JSON.stringify({ ...definition, generatedAt }, null, 2);
  }, [open, mode, nodes, edges, activeName, generatedAt, exportDefinition, exportMermaid]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(content); showToast('success', \`\${mode === 'json' ? 'JSON' : 'Mermaid'} copied to clipboard.\`); }
    catch { showToast('error', 'Clipboard access was unavailable. Select the preview text to copy it.'); }
  };
  const download = () => {
    const blob = new Blob([content], { type: mode === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = mode === 'json' ? 'workflow.json' : 'workflow.mmd';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <Modal passiveModal open={open} modalHeading="Export workflow" modalLabel="Live artifact preview" onRequestClose={close} size="lg">
      <div className="artifact-tabs" role="tablist" aria-label="Export format">
        <Button kind={mode === 'json' ? 'secondary' : 'ghost'} size="sm" renderIcon={Code} onClick={() => setMode('json')} role="tab" aria-selected={mode === 'json'}>JSON</Button>
        <Button kind={mode === 'mermaid' ? 'secondary' : 'ghost'} size="sm" renderIcon={Flow} onClick={() => setMode('mermaid')} role="tab" aria-selected={mode === 'mermaid'}>Mermaid</Button>
      </div>
      <pre className="artifact-preview" aria-label={\`\${mode} artifact preview\`}>{content}</pre>
      <div className="artifact-actions">
        <Button kind="primary" size="sm" renderIcon={Download} onClick={download}>{\`\${mode === 'json' ? 'Download workflow.json' : 'Download workflow.mmd'}\`}</Button>
        <Button kind="tertiary" size="sm" renderIcon={Copy} onClick={copy}>{\`\${mode === 'json' ? 'Copy JSON' : 'Copy Mermaid'}\`}</Button>
      </div>
    </Modal>
  );
}`;

const newArtifactPanel = `function ArtifactPanel() {
  const open = useWorkflowStore((state) => state.ui.artifactPanelOpen);
  const toggle = useWorkflowStore((state) => state.toggleArtifactPanel);
  const mode = useWorkflowStore((state) => state.ui.artifactMode);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const activeName = useWorkflowStore((state) => state.activeWorkflowName);
  const setMode = useWorkflowStore((state) => state.setArtifactMode);
  const exportDefinition = useWorkflowStore((state) => state.exportDefinition);
  const exportMermaid = useWorkflowStore((state) => state.exportMermaid);
  const showToast = useWorkflowStore((state) => state.showToast);
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString());
  useEffect(() => { if (open) setGeneratedAt(new Date().toISOString()); }, [open, nodes, edges, activeName]);

  const isEmpty = nodes.length === 0;

  const content = useMemo(() => {
    if (!open || isEmpty) return '';
    if (mode === 'mermaid') return exportMermaid();
    const definition = exportDefinition();
    return JSON.stringify({ ...definition, generatedAt }, null, 2);
  }, [open, mode, nodes, edges, activeName, generatedAt, exportDefinition, exportMermaid, isEmpty]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(content); showToast('success', \`\${mode === 'json' ? 'JSON' : 'Mermaid'} copied to clipboard.\`); }
    catch { showToast('error', 'Clipboard access was unavailable. Select the preview text to copy it.'); }
  };

  const download = () => {
    const blob = new Blob([content], { type: mode === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = mode === 'json' ? 'workflow.json' : 'workflow.mmd';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <aside className={\`artifact-panel \${open ? 'open' : 'closed'}\`} aria-label="Artifact">
      <div className="panel-heading">
        {open && <div><span className="eyebrow">EXPORT</span><h2>Artifact</h2></div>}
        <Button hasIconOnly iconDescription={open ? 'Close Artifact' : 'Open Artifact'} renderIcon={open ? Close : Code} kind="ghost" size="sm" onClick={toggle} />
      </div>
      {open && (
        <div className="artifact-content" style={{ padding: '0 12px 16px' }}>
          {isEmpty ? (
            <div className="empty-state">
              <Code size={24} />
              <strong>Empty canvas</strong>
              <span>Add nodes from the palette to build a workflow and generate artifacts.</span>
            </div>
          ) : (
            <>
              <div className="artifact-tabs" role="tablist" aria-label="Export format">
                <Button kind={mode === 'json' ? 'secondary' : 'ghost'} size="sm" renderIcon={Code} onClick={() => setMode('json')} role="tab" aria-selected={mode === 'json'}>JSON</Button>
                <Button kind={mode === 'mermaid' ? 'secondary' : 'ghost'} size="sm" renderIcon={Flow} onClick={() => setMode('mermaid')} role="tab" aria-selected={mode === 'mermaid'}>Mermaid</Button>
              </div>
              <pre className="artifact-preview" aria-label={\`\${mode} artifact preview\`}>{content}</pre>
              <div className="artifact-actions">
                <Button kind="primary" size="sm" renderIcon={Download} onClick={download}>{mode === 'json' ? 'Download workflow.json' : 'Download workflow.mmd'}</Button>
                <Button kind="tertiary" size="sm" renderIcon={Copy} onClick={copy}>{mode === 'json' ? 'Copy JSON' : 'Copy Mermaid'}</Button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}`;

if (code.includes(oldArtifactModal)) {
    code = code.replace(oldArtifactModal, newArtifactPanel);
} else {
    // If exact match fails, replace using regex or string splits
    console.log("Could not find oldArtifactModal block.");
    let lines = code.split('\n');
    let startIdx = lines.findIndex(l => l.startsWith('function ArtifactModal()'));
    let endIdx = -1;
    let bracketCount = 0;
    for(let i=startIdx; i<lines.length; i++) {
        if (lines[i].includes('{')) bracketCount += (lines[i].match(/\{/g) || []).length;
        if (lines[i].includes('}')) bracketCount -= (lines[i].match(/\}/g) || []).length;
        if (bracketCount === 0) {
            endIdx = i;
            break;
        }
    }
    if(startIdx !== -1 && endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx + 1, newArtifactPanel);
        code = lines.join('\n');
    }
}

// Replace <ArtifactModal /> with nothing since we render <ArtifactPanel /> alongside <SavedPanel />
code = code.replace(/<ArtifactModal \/>/g, '');

// Also change "openModal('artifact')" to "toggleArtifactPanel()" in Toolbar
code = code.replace(
  /<Button kind="ghost" size="sm" renderIcon={Export} onClick={\(\) => openModal\('artifact'\)}>Export<\/Button>/,
  '<Button kind="ghost" size="sm" renderIcon={Code} onClick={useWorkflowStore(state => state.toggleArtifactPanel)}>Artifact</Button>'
);

// Add <ArtifactPanel /> to <main className="workspace"> next to <SavedPanel />
code = code.replace(
  /<SavedPanel \/>\n      <\/main>/,
  '<SavedPanel />\n        <ArtifactPanel />\n      </main>'
);

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
