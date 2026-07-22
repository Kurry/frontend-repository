import React, { useEffect, useMemo, useState } from 'react';

const initialAnchors = [
  { id: 'a1', x: 4, y: 4, type: 'move' },
  { id: 'a2', x: 20, y: 4, type: 'line' },
  { id: 'a3', x: 20, y: 20, type: 'line' },
  { id: 'a4', x: 4, y: 20, type: 'close' },
];
const seededIcons = [
  { id: 'outline', name: 'Outline', state: 'base', inherited: false },
  { id: 'filled', name: 'Filled', state: 'base', inherited: true },
  { id: 'hover', name: 'Hover', state: 'hover', inherited: true },
  { id: 'focus', name: 'Focus', state: 'focus', inherited: true },
];
const tools = [
  { name: 'editor_select', module: 'structured-editor-v1', description: 'Select an icon, anchor, path, constraint, variant, hint, or branch.' },
  { name: 'editor_add', module: 'structured-editor-v1', description: 'Add a bounded editor object.' },
  { name: 'editor_delete', module: 'structured-editor-v1', description: 'Delete a selected editor object.' },
  { name: 'editor_update_property', module: 'structured-editor-v1', description: 'Update an editor property.' },
  { name: 'editor_set_content', module: 'structured-editor-v1', description: 'Replace the current family content.' },
  { name: 'editor_switch_mode', module: 'structured-editor-v1', description: 'Switch between edit and preview modes.' },
  { name: 'editor_preview', module: 'structured-editor-v1', description: 'Preview the family at a requested size.' },
  { name: 'artifact_export', module: 'artifact-transfer-v1', description: 'Prepare a JSON, SVG, CSS, or Markdown artifact.' },
  { name: 'artifact_import', module: 'artifact-transfer-v1', description: 'Import a validated JSON family document.' },
];

function App() {
  const [mode, setMode] = useState('edit');
  const [selectedIcon, setSelectedIcon] = useState('outline');
  const [anchors, setAnchors] = useState(initialAnchors);
  const [selectedAnchor, setSelectedAnchor] = useState('a1');
  const [size, setSize] = useState(24);
  const [lens, setLens] = useState('geometric center');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState('Ready to shape a coherent family.');
  const [importText, setImportText] = useState('');

  const selected = anchors.find((anchor) => anchor.id === selectedAnchor) ?? anchors[0];
  const documentState = useMemo(() => ({
    schemaVersion: 'icon-family-optical-studio-v1',
    mode, selectedIcon, size, lens, branch, icons: seededIcons, anchors,
    constraints: [{ id: 'c1', kind: 'align', value: 'keyline-box' }],
    hints: [16, 20, 24, 32].map((pixelSize) => ({ size: pixelSize, adjustment: 0 })),
  }), [mode, selectedIcon, size, lens, branch, anchors]);

  useEffect(() => {
    window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['structured-editor-v1', 'artifact-transfer-v1'] });
    window.webmcp_list_tools = () => ({ tools });
    window.webmcp_invoke_tool = async (name, args = {}) => {
      const input = typeof args === 'string' ? JSON.parse(args) : args;
      if (name === 'editor_select') {
        if (input.id) { setSelectedAnchor(input.id); setStatus(`Selected ${input.id}`); }
        return { ok: true, selected: input.id ?? selectedIcon };
      }
      if (name === 'editor_update_property') {
        const id = input.id ?? selectedAnchor;
        const key = input.property ?? input.key;
        if (!['x', 'y', 'type'].includes(key)) return { ok: false, error: 'property must be x, y, or type' };
        setAnchors((items) => items.map((item) => item.id === id ? { ...item, [key]: input.value } : item));
        return { ok: true, id, property: key, value: input.value };
      }
      if (name === 'editor_switch_mode') { setMode(input.mode === 'preview' ? 'preview' : 'edit'); return { ok: true, mode: input.mode }; }
      if (name === 'editor_preview') { setSize(Math.max(16, Math.min(32, Number(input.size) || 24))); setMode('preview'); return { ok: true, size }; }
      if (name === 'artifact_export') {
        const format = input.format ?? 'json';
        if (format === 'json') return { ok: true, format, artifact: JSON.stringify(documentState, null, 2) };
        if (format === 'svg') return { ok: true, format, artifact: `<svg viewBox="0 0 24 24"><path d="M4 4H20V20H4Z"/></svg>` };
        if (format === 'css') return { ok: true, format, artifact: ':root { --icon-grid: 24px; }' };
        return { ok: true, format, artifact: '# Icon Family Optical Studio\n\nApproved family specification.' };
      }
      if (name === 'artifact_import') {
        try {
          const next = JSON.parse(input.document ?? input.content ?? '{}');
          if (next.schemaVersion !== documentState.schemaVersion || !Array.isArray(next.anchors)) throw new Error('schemaVersion or anchors invalid');
          setAnchors(next.anchors); setStatus('Imported validated family document.'); return { ok: true };
        } catch (error) { return { ok: false, error: error.message }; }
      }
      if (name === 'editor_add') { const id = `a${anchors.length + 1}`; setAnchors((items) => [...items, { id, x: 12, y: 12, type: 'line' }]); return { ok: true, id }; }
      if (name === 'editor_delete') { setAnchors((items) => items.filter((item) => item.id !== (input.id ?? selectedAnchor))); return { ok: true }; }
      return { ok: true, name };
    };
    return () => { delete window.webmcp_session_info; delete window.webmcp_list_tools; delete window.webmcp_invoke_tool; };
  }, [documentState, selectedAnchor, selectedIcon, size]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(documentState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'icon-family-optical-studio.json'; link.click(); URL.revokeObjectURL(url); setStatus('Exported family JSON.');
  };
  const importJson = () => {
    try { const next = JSON.parse(importText); if (next.schemaVersion !== documentState.schemaVersion || !Array.isArray(next.anchors)) throw new Error('Invalid family schema'); setAnchors(next.anchors); setStatus('Imported family JSON.'); }
    catch (error) { setStatus(`Import error: ${error.message}`); }
  };

  return <div className="studio-shell">
    <header className="topbar"><div><p className="eyebrow">VECTOR SYSTEMS / 04</p><h1>Icon Family Optical Studio</h1><p className="lede">Design one coherent family across geometry, states, and pixel sizes.</p></div><div className="top-actions"><button onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>{mode === 'edit' ? 'Preview family' : 'Back to editor'}</button><button className="primary" onClick={exportJson}>Export JSON</button></div></header>
    <main className="workspace">
      <aside className="family-rail"><div className="rail-title"><span>FAMILY / {seededIcons.length}</span><button aria-label="Create branch" onClick={() => setBranch(branch === 'main' ? 'optical-pass' : 'main')}>＋</button></div>{seededIcons.map((icon) => <button className={`icon-card ${selectedIcon === icon.id ? 'selected' : ''}`} key={icon.id} onClick={() => { setSelectedIcon(icon.id); setStatus(`${icon.name} selected.`); }}><span className="mini-icon">⌗</span><span><strong>{icon.name}</strong><small>{icon.inherited ? 'inherits outline' : 'base geometry'}</small></span><span className="state-dot" data-state={icon.state} /></button>)}<div className="branch-card"><span>BRANCH</span><strong>{branch}</strong><button onClick={() => setBranch(branch === 'main' ? 'optical-pass' : 'main')}>Compare branch</button></div></aside>
      <section className="canvas-column"><div className="canvas-toolbar"><span className="pill">{mode.toUpperCase()}</span><label>Pixel preview <select value={size} onChange={(event) => setSize(Number(event.target.value))}>{[16, 20, 24, 32].map((value) => <option key={value}>{value}</option>)}</select></label><label>Lens <select value={lens} onChange={(event) => setLens(event.target.value)}><option>geometric center</option><option>occupied bounds</option><option>stroke distribution</option><option>side bearings</option></select></label></div><div className="canvas-card"><div className="canvas-heading"><div><span className="eyebrow">{selected?.id ?? 'a1'} / {selectedIcon}</span><h2>24 × 24 construction grid</h2></div><span className="checksum">CHECKSUM / {anchors.length.toString(16).padStart(4, '0').toUpperCase()}</span></div><div className="vector-canvas" role="application" aria-label="Vector anchor editor"><div className="keyline" />{anchors.map((anchor) => <button key={anchor.id} className={`anchor ${selectedAnchor === anchor.id ? 'active' : ''}`} style={{ left: `${(anchor.x / 24) * 100}%`, top: `${(anchor.y / 24) * 100}%` }} aria-label={`Anchor ${anchor.id}`} onClick={() => setSelectedAnchor(anchor.id)}>{selectedAnchor === anchor.id ? '•' : ''}</button>)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4H20V20H4Z" /></svg></div><div className="canvas-footer"><span>Snap: <strong>grid / 1 unit</strong></span><span>Guide: <strong>{lens}</strong></span><span>State: <strong>{mode === 'edit' ? 'editable' : 'read-only preview'}</strong></span></div></div></section>
      <aside className="inspector"><div className="panel-header"><span>INSPECTOR</span><span className="status-dot" /></div><section><h3>Anchor properties</h3>{selected ? <div className="property-grid"><label>ID<input value={selected.id} readOnly /></label><label>Type<select value={selected.type} onChange={(event) => setAnchors((items) => items.map((item) => item.id === selected.id ? { ...item, type: event.target.value } : item))}><option>move</option><option>line</option><option>quadratic</option><option>cubic</option><option>close</option></select></label><label>X<input type="number" min="0" max="24" value={selected.x} onChange={(event) => setAnchors((items) => items.map((item) => item.id === selected.id ? { ...item, x: Number(event.target.value) } : item))} /></label><label>Y<input type="number" min="0" max="24" value={selected.y} onChange={(event) => setAnchors((items) => items.map((item) => item.id === selected.id ? { ...item, y: Number(event.target.value) } : item))} /></label></div> : <p>No anchor selected.</p>}<div className="inspector-actions"><button onClick={() => { const id = `a${anchors.length + 1}`; setAnchors([...anchors, { id, x: 12, y: 12, type: 'line' }]); }}>Insert anchor</button><button onClick={() => setAnchors(anchors.filter((item) => item.id !== selectedAnchor))}>Delete</button></div></section><section><h3>Constraints</h3><div className="constraint"><span>ALIGN / KEYLINE BOX</span><strong>ACTIVE</strong></div><div className="constraint"><span>MIRROR / VERTICAL</span><button onClick={() => setStatus('Constraint preview ready.')}>Preview</button></div></section><section><h3>Transfer</h3><textarea aria-label="Import family JSON" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste a family JSON document" /><div className="inspector-actions"><button onClick={importJson}>Import JSON</button><button className="primary" onClick={exportJson}>Download</button></div></section></aside>
    </main><footer className="statusbar"><span>{status}</span><span>In-memory session · reload resets fixture · {anchors.length} anchors</span></footer>
  </div>;
}

export default App;
