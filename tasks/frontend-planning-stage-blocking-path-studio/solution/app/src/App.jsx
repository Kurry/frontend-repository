import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Timeline } from './components/Timeline';
import { useStore } from './store';
import { bindWebMCP } from './webmcp';

const tools = [
  ['select', 'Select', 'Inspect and edit a stage object'], ['path', 'Path', 'Place or retime a waypoint'],
  ['face', 'Face', 'Rotate the selected actor'], ['handoff', 'Handoff', 'Transfer prop custody'],
  ['analysis', 'Analyze', 'Check collision, access, and sightlines'], ['rehearsal', 'Rehearse', 'Run and repair this sequence'],
];

function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const key = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = [...ref.current.querySelectorAll('button,input,select')];
        const first = focusable[0]; const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section ref={ref} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} className="modal"><div className="modal-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label={`Close ${title}`} onClick={onClose}>×</button></div>{children}</section></div>;
}

export default function App() {
  const store = useStore();
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ entityId: 'a1', beat: 2, x: 2, y: 2, facing: 90, type: 'walk', hold: false });
  const [error, setError] = useState('');
  const toastTimer = useRef();
  const branch = store.score.branches[store.score.activeBranch];
  const selected = store.selectedWaypoint ? branch.waypoints[store.selectedWaypoint] : null;
  const waypointRows = Object.entries(branch.waypoints).filter(([, waypoint]) => store.filter === 'all' || (store.filter === 'actor' ? waypoint.entityId.startsWith('a') : waypoint.entityId.startsWith('p'))).sort((a, b) => store.sortDirection === 'asc' ? a[1].beat - b[1].beat || a[0].localeCompare(b[0]) : b[1].beat - a[1].beat || b[0].localeCompare(a[0]));

  useEffect(() => { bindWebMCP(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []);
  useEffect(() => { document.documentElement.dataset.theme = store.theme; document.documentElement.dataset.density = store.density; }, [store.theme, store.density]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const notify = (message) => {
    clearTimeout(toastTimer.current); store.setFeedbackMessage(message);
    toastTimer.current = setTimeout(() => store.setFeedbackMessage(''), 3200);
  };
  const changeTool = (tool) => { store.setTool(tool); notify(`${tools.find(([id]) => id === tool)?.[1] || tool} mode active`); if (tool === 'analysis') { store.analyze(); } };
  const add = (event) => {
    event.preventDefault(); const beat = Number(form.beat); const x = Number(form.x); const y = Number(form.y);
    if (!form.entityId || beat < 1 || beat > 48 || x < 0 || x > 12 || y < 0 || y > 8) { setError('Beat must be 1–48; position must remain inside the 12 m × 8 m stage.'); return; }
    store.addWaypoint({ ...form, beat, x, y, facing: Number(form.facing), hold: Boolean(form.hold) }); setError(''); setDialog(null); notify(`Waypoint added at beat ${beat}`);
  };
  const update = (event) => {
    event.preventDefault(); const beat = Number(form.beat); const x = Number(form.x); const y = Number(form.y);
    if (!selected || beat < 1 || beat > 48 || x < 0 || x > 12 || y < 0 || y > 8) { setError('Enter a beat from 1–48 and a position within stage bounds.'); return; }
    store.updateWaypoint(store.selectedWaypoint, { ...form, beat, x, y, facing: Number(form.facing) }); setError(''); setDialog(null); notify(`Waypoint updated for beat ${beat}`);
  };
  const openEdit = () => { if (!selected) { notify('Select a waypoint before editing.'); return; } setForm(selected); setDialog('edit'); };
  const remove = () => { if (!store.selectedWaypoint) { notify('Select a waypoint before deleting.'); return; } store.removeWaypoint(store.selectedWaypoint); setDialog(null); notify('Waypoint deleted from every view'); };
  const exportScore = () => { const a = document.createElement('a'); a.href = `data:application/json;charset=utf-8,${encodeURIComponent(store.exportState())}`; a.download = 'stage-blocking-score.json'; a.click(); notify('Canonical score exported'); };
  const importScore = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { store.importState(reader.result); setDialog(null); notify('Score imported and all views synchronized'); } catch (cause) { setError(cause.message); } }; reader.readAsText(file); };
  const voice = () => { const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) { notify('Voice control is unavailable in this browser. Use the labeled toolbar controls.'); return; } const recognition = new Recognition(); recognition.onresult = (e) => { const value = e.results[0][0].transcript.toLowerCase(); const match = tools.find(([, label]) => value.includes(label.toLowerCase())); if (match) changeTool(match[0]); else notify(`Voice command “${value}” was not recognized`); }; recognition.start(); notify('Listening for a tool name'); };

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true">SB</span><div><h1>Stage Blocking Path Studio</h1><p>Direct movement. Preserve causality.</p></div></div>
      <div className="top-actions">
        <label className="branch-field"><span>Branch</span><select aria-label="Select branch" value={store.score.activeBranch} onChange={(e) => { store.checkoutBranch(e.target.value); notify(`Switched to ${e.target.value}`); }}>{Object.keys(store.score.branches).map((name) => <option key={name}>{name}</option>)}</select></label>
        <button className="button ghost" onClick={() => setDialog('branch')}>New branch</button>
        <button className="button approve" onClick={() => { store.approveScore(); notify(`Branch ${store.score.activeBranch} approved`); }}>Approve</button>
        <button className="button ghost" data-action="export" onClick={exportScore}>Export</button>
        <button className="button primary" onClick={() => setDialog('artifacts')}>Artifacts</button>
      </div>
    </header>

    <div className="workspace">
      <aside className={`sidebar ${store.sidebarOpen ? '' : 'collapsed'}`} aria-label="Studio tools">
        <div className="sidebar-head"><h2>Direction desk</h2><button className="icon-button" aria-label={store.sidebarOpen ? 'Collapse tools' : 'Expand tools'} onClick={() => store.setSidebarOpen(!store.sidebarOpen)}>{store.sidebarOpen ? '‹' : '›'}</button></div>
        {store.sidebarOpen && <>
          <p className="eyebrow">Blocking modes</p>
          <nav className="tool-grid">{tools.map(([id, label, help]) => <button key={id} className={`tool ${store.activeTool === id ? 'active' : ''}`} aria-pressed={store.activeTool === id} title={help} onClick={() => changeTool(id)}><span className="tool-dot" aria-hidden="true" /> <span><strong>{label}</strong><small>{help}</small></span></button>)}</nav>
          <div className="sidebar-section"><div className="section-title"><h3>Waypoints</h3><span className="count" aria-label={`${Object.keys(branch.waypoints).length} waypoints`}>{Object.keys(branch.waypoints).length}</span></div>
            <div className="row-controls"><select aria-label="Filter waypoints" value={store.filter} onChange={(e) => store.setFilter(e.target.value)}><option value="all">All entities</option><option value="actor">Actors</option><option value="prop">Props</option></select><button className="icon-button" aria-label={`Sort ${store.sortDirection === 'asc' ? 'descending' : 'ascending'}`} onClick={() => store.setSortDirection(store.sortDirection === 'asc' ? 'desc' : 'asc')}>{store.sortDirection === 'asc' ? '↑' : '↓'}</button></div>
            <div className="waypoint-list" aria-label="Filtered waypoint list">{waypointRows.length ? waypointRows.slice(0, 8).map(([key, waypoint]) => { const entity = [...store.fixture.actors, ...store.fixture.props].find((item) => item.id === waypoint.entityId); return <button key={key} className={store.selectedWaypoint === key ? 'selected' : ''} onClick={() => { store.selectWaypoint(key); store.selectEntity(waypoint.entityId); store.setBeat(waypoint.beat); notify(`${entity.name} waypoint selected at beat ${waypoint.beat}`); }}><span>{entity.name}</span><b>Beat {waypoint.beat}</b></button>; }) : <p>No waypoints match this filter.</p>}</div>
            <button className="button primary wide" onClick={() => { setForm({ entityId: 'a1', beat: Math.min(48, store.currentBeat + 1), x: 2, y: 2, facing: 90, type: 'walk', hold: false }); setDialog('create'); }}>Add waypoint</button>
            <button className="text-button clear-action" onClick={() => setDialog('clear')}>Clear branch blocking</button>
          </div>
          <div className="sidebar-section"><div className="section-title"><h3>Preferences</h3></div><div className="segmented"><button aria-pressed={store.theme === 'dark'} onClick={() => store.setTheme('dark')}>Dark</button><button aria-pressed={store.theme === 'light'} onClick={() => store.setTheme('light')}>Light</button></div><div className="segmented"><button aria-pressed={store.density === 'comfortable'} onClick={() => store.setDensity('comfortable')}>Roomy</button><button aria-pressed={store.density === 'compact'} onClick={() => store.setDensity('compact')}>Compact</button></div><button className="button ghost wide" onClick={voice}>Voice control</button></div>
          <button className="help-link" onClick={() => setDialog('welcome')}>Open guided tour</button>
        </>}
      </aside>

      <main className="main-stage">
        <section className="stage-header"><div><p className="eyebrow">Act I · Scene 3</p><h2>The drawing room</h2></div><div className="stage-stats"><span><b>{store.currentBeat}</b> current beat</span><span><b>{Object.keys(branch.waypoints).length}</b> waypoints</span><span className={store.score.approval ? 'approved' : ''}><b>{store.score.approval ? 'Approved' : 'Draft'}</b> status</span></div></section>
        <Canvas onEdit={openEdit} notify={notify} />
        <Timeline notify={notify} />
      </main>

      <aside className="inspector" aria-label="Inspector panel"><div className="section-title"><h2>Inspector</h2><span className="status-pill">Live</span></div>
        {selected ? <div className="inspector-content"><p className="eyebrow">Selected waypoint</p><h3>{[...store.fixture.actors, ...store.fixture.props].find((e) => e.id === selected.entityId)?.name}</h3><dl><div><dt>Beat</dt><dd>{selected.beat}</dd></div><div><dt>Position</dt><dd>{selected.x.toFixed(1)}, {selected.y.toFixed(1)} m</dd></div><div><dt>Facing</dt><dd>{selected.facing}°</dd></div><div><dt>Movement</dt><dd>{selected.type}</dd></div></dl><button className="button primary wide" onClick={openEdit}>Edit waypoint</button><button className="button danger wide" onClick={() => setDialog('delete')}>Delete waypoint</button></div> : <div className="empty-state"><span aria-hidden="true">◎</span><h3>No waypoint selected</h3><p>Select an actor or prop on stage to inspect its blocking.</p></div>}
        <div className="analysis-card"><div className="section-title"><h3>Live analysis</h3><button className="text-button" onClick={() => { store.analyze(); notify('Stage analysis refreshed'); }}>Run</button></div>{store.analysisFindings.length ? <ul>{store.analysisFindings.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Run analysis to inspect collisions, access, and sightlines at this beat.</p>}</div>
      </aside>
    </div>

    <div className="offline-badge" title="Your work is persisted locally"><span aria-hidden="true" /> Offline-ready</div>
    <div className="toast-region" aria-live="polite" aria-atomic="true">{store.feedbackMessage && <div className="toast"><span aria-hidden="true">✓</span>{store.feedbackMessage}</div>}</div>

    {(dialog === 'create' || dialog === 'edit') && <Dialog title={dialog === 'create' ? 'Add waypoint' : 'Edit waypoint'} onClose={() => { setDialog(null); setError(''); }}><form onSubmit={dialog === 'create' ? add : update} className="form-grid"><label>Entity<select value={form.entityId} disabled={dialog === 'edit'} onChange={(e) => setForm({ ...form, entityId: e.target.value })}>{[...store.fixture.actors, ...store.fixture.props].map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>Beat<input type="number" value={form.beat} onChange={(e) => setForm({ ...form, beat: e.target.value })} /></label><label>X position (m)<input type="number" min="0" max="12" step="0.1" value={form.x} onChange={(e) => setForm({ ...form, x: e.target.value })} /></label><label>Y position (m)<input type="number" min="0" max="8" step="0.1" value={form.y} onChange={(e) => setForm({ ...form, y: e.target.value })} /></label><label>Facing (degrees)<input type="number" min="0" max="359" value={form.facing} onChange={(e) => setForm({ ...form, facing: e.target.value })} /></label><label>Movement<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>walk</option><option>cross</option><option>entrance</option><option>exit</option><option>place</option></select></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button ghost" onClick={() => setDialog(null)}>Cancel</button><button className="button primary">{dialog === 'create' ? 'Add waypoint' : 'Save waypoint'}</button></div></form></Dialog>}
    {dialog === 'delete' && <Dialog title="Delete waypoint?" onClose={() => setDialog(null)}><p>This removes the selected waypoint from the stage, timeline, analysis, and exported score.</p><div className="modal-actions"><button className="button ghost" onClick={() => setDialog(null)}>Keep waypoint</button><button className="button danger" onClick={remove}>Delete waypoint</button></div></Dialog>}
    {dialog === 'clear' && <Dialog title="Clear branch blocking?" onClose={() => setDialog(null)}><p>This removes every waypoint from the active branch. The empty stage remains usable and can be repopulated immediately.</p><div className="modal-actions"><button className="button ghost" onClick={() => setDialog(null)}>Keep blocking</button><button className="button danger" onClick={() => { store.clearWaypoints(); setDialog(null); notify('Branch cleared — add a waypoint to rebuild the sequence'); }}>Clear all waypoints</button></div></Dialog>}
    {dialog === 'branch' && <Dialog title="Create blocking branch" onClose={() => setDialog(null)}><form onSubmit={(e) => { e.preventDefault(); const name = new FormData(e.currentTarget).get('name').trim(); if (!name || store.score.branches[name]) { setError('Enter a unique branch name.'); return; } store.createBranch(name); setDialog(null); setError(''); notify(`Branch ${name} created from current blocking`); }}><label>Branch name<input name="name" autoFocus placeholder="alternate-entrance" /></label>{error && <p role="alert" className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="button ghost" onClick={() => setDialog(null)}>Cancel</button><button className="button primary">Create branch</button></div></form></Dialog>}
    {dialog === 'artifacts' && <Dialog title="Artifact transfer" onClose={() => setDialog(null)}><div className="artifact-grid"><button className="artifact" onClick={exportScore}><b>Canonical JSON</b><span>Round-trip the complete score</span></button><button className="artifact" onClick={() => { navigator.clipboard?.writeText(store.exportState()); notify('Canonical score copied to clipboard'); }}><b>Copy score</b><span>Share structured session data</span></button><label className="artifact"><b>Import JSON</b><span>Restore a canonical score</span><input aria-label="Import canonical score" type="file" accept="application/json,.json" onChange={importScore} /></label></div>{error && <p role="alert" className="form-error">{error}</p>}</Dialog>}
    {dialog === 'welcome' && <Dialog title="Welcome to the rehearsal room" onClose={() => { store.setOnboardingSeen(true); setDialog(null); }}><div className="onboarding"><p className="eyebrow">A three-step blocking workflow</p><ol><li><b>Place the company.</b><span>Add or select a waypoint, then position it on the stage.</span></li><li><b>Test the movement.</b><span>Switch beats, run analysis, and inspect path continuity.</span></li><li><b>Lock the score.</b><span>Rehearse, repair findings, approve a branch, and export.</span></li></ol><button className="button primary wide" onClick={() => { store.setOnboardingSeen(true); setDialog(null); notify('Tour complete — select a stage object to begin'); }}>Enter the studio</button></div></Dialog>}
  </div>;
}
