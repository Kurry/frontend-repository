import React, { useEffect, useMemo, useState } from 'react';

const seed = [
  { id: 'RV-101', title: 'Audit event taxonomy', points: 3, status: 'ready', lane: 'Next' },
  { id: 'RV-102', title: 'Instrument reading latency', points: 5, status: 'ready', lane: 'Next' },
  { id: 'RV-103', title: 'Document cohort signals', points: 2, status: 'blocked', lane: 'Later' },
  { id: 'RV-104', title: 'Ship velocity dashboard', points: 8, status: 'ready', lane: 'Later' },
];
const tools = [
  { name: 'entity_select', module: 'entity-collection-v1' },
  { name: 'entity_update', module: 'entity-collection-v1' },
  { name: 'entity_toggle', module: 'entity-collection-v1' },
  { name: 'browse_filter', module: 'browse-query-v1' },
  { name: 'form_submit', module: 'form-workflow-v1' },
  { name: 'artifact_export', module: 'artifact-transfer-v1' },
  { name: 'artifact_import', module: 'artifact-transfer-v1' },
];

function App() {
  const [items, setItems] = useState(seed);
  const [phase, setPhase] = useState('calibrate');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('Calibrate your reading capacity, then shape a deliberate backlog.');
  const [velocity, setVelocity] = useState(13);
  const phases = ['calibrate', 'order', 'allocate', 'project', 'log', 'focus', 'rollover'];
  const visible = items.filter((item) => filter === 'all' || item.status === filter);
  const artifact = useMemo(() => ({ schemaVersion: 'reading-velocity-v1', velocity, phase, items }), [velocity, phase, items]);

  useEffect(() => {
    window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['entity-collection-v1', 'browse-query-v1', 'form-workflow-v1', 'artifact-transfer-v1'] });
    window.webmcp_list_tools = () => ({ tools: tools.map((tool) => ({ ...tool, description: `Reading velocity ${tool.name.replace('_', ' ')} operation.` })) });
    window.webmcp_invoke_tool = async (name, args = {}) => {
      const input = typeof args === 'string' ? JSON.parse(args) : args;
      if (name === 'entity_select') { setSelected(input.id ?? items[0]?.id); setStatus(`Selected ${input.id ?? items[0]?.id}.`); return { ok: true, selected: input.id ?? items[0]?.id }; }
      if (name === 'entity_update') { setItems((list) => list.map((item) => item.id === input.id ? { ...item, ...input.patch } : item)); return { ok: true, id: input.id }; }
      if (name === 'entity_toggle') { setItems((list) => list.map((item) => item.id === input.id ? { ...item, status: item.status === 'done' ? 'ready' : 'done' } : item)); return { ok: true, id: input.id }; }
      if (name === 'browse_filter') { setFilter(input.status ?? 'all'); setStatus(`Filter: ${input.status ?? 'all'}`); return { ok: true, filter: input.status ?? 'all' }; }
      if (name === 'form_submit') { const title = String(input.title ?? '').trim(); if (!title) return { ok: false, error: 'title is required' }; const id = `RV-${Date.now().toString().slice(-4)}`; setItems((list) => [...list, { id, title, points: Number(input.points) || 1, status: 'ready', lane: 'Next' }]); return { ok: true, id }; }
      if (name === 'artifact_export') return { ok: true, format: 'json', artifact: JSON.stringify(artifact, null, 2) };
      if (name === 'artifact_import') { try { const next = JSON.parse(input.document ?? '{}'); if (next.schemaVersion !== 'reading-velocity-v1' || !Array.isArray(next.items)) throw new Error('schemaVersion or items invalid'); setItems(next.items); setVelocity(next.velocity ?? 13); setPhase(next.phase ?? 'calibrate'); return { ok: true }; } catch (error) { return { ok: false, error: error.message }; } }
      return { ok: false, error: 'unknown tool' };
    };
    return () => { delete window.webmcp_session_info; delete window.webmcp_list_tools; delete window.webmcp_invoke_tool; };
  }, [artifact, items]);

  const advance = () => { const next = phases[(phases.indexOf(phase) + 1) % phases.length]; setPhase(next); setStatus(`Phase advanced to ${next}.`); };
  const exportJson = () => { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' })); link.download = 'reading-velocity-session.json'; link.click(); setStatus('Session JSON downloaded.'); };
  const importJson = () => { try { const next = JSON.parse(importText); if (next.schemaVersion !== 'reading-velocity-v1' || !Array.isArray(next.items)) throw new Error('schemaVersion or items invalid'); setItems(next.items); setVelocity(next.velocity ?? 13); setPhase(next.phase ?? 'calibrate'); setStatus('Session imported.'); } catch (error) { setStatus(`Import error: ${error.message}`); } };

  return <div className="app"><header><div><p className="eyebrow">READING SYSTEM / FIELD NOTE 07</p><h1>&lt;Reading Velocity Backlog Observatory&gt;</h1><p className="intro">A calm instrument for turning unfinished reading into visible momentum.</p></div><div className="header-actions"><button onClick={advance}>Advance phase</button><button className="accent" onClick={exportJson}>Export session</button></div></header><nav className="phase-nav" aria-label="Workflow phases">{phases.map((name) => <button key={name} className={phase === name ? 'active' : ''} onClick={() => setPhase(name)}><span>{String(phases.indexOf(name) + 1).padStart(2, '0')}</span>{name}</button>)}</nav><main><section className="calibration"><div><p className="eyebrow">CURRENT PHASE / {phase}</p><h2>{phase === 'calibrate' ? 'Calibrate the week' : phase === 'order' ? 'Order the signal' : 'Observe the backlog'}</h2><p>{status}</p></div><label className="velocity">Reading capacity <output>{velocity} pages / day</output><input aria-label="Reading capacity" type="range" min="1" max="40" value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} /></label></section><section className="board"><div className="board-head"><div><p className="eyebrow">BACKLOG / {visible.length} VISIBLE</p><h2>Work in the reading queue</h2></div><select aria-label="Filter backlog" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All signals</option><option value="ready">Ready</option><option value="blocked">Blocked</option><option value="done">Done</option></select></div><div className="cards">{visible.map((item) => <article className={`card ${selected === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelected(item.id)}><div className="card-top"><span>{item.id}</span><button aria-label={`Toggle ${item.title}`} onClick={(e) => { e.stopPropagation(); setItems((list) => list.map((candidate) => candidate.id === item.id ? { ...candidate, status: candidate.status === 'done' ? 'ready' : 'done' } : candidate)); }}>{item.status === 'done' ? 'Done' : 'Mark done'}</button></div><h3>{item.title}</h3><div className="card-meta"><span>{item.points} points</span><span>{item.lane}</span><span className={`tag ${item.status}`}>{item.status}</span></div></article>)}</div></section><section className="transfer"><div><p className="eyebrow">USEFUL END STATE</p><h2>Session artifact</h2><p>Export the live queue and bring it back without a page reload.</p></div><div className="transfer-controls"><textarea aria-label="Import session JSON" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste reading-velocity-v1 JSON"/><div><button onClick={importJson}>Import</button><button className="accent" onClick={exportJson}>Download JSON</button></div></div></section></main><footer><span>In-memory fixture · reload resets the observatory</span><span>{items.length} records / phase {phases.indexOf(phase) + 1} of {phases.length}</span></footer></div>;
}
export default App;
