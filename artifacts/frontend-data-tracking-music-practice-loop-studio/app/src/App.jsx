import React, { useEffect, useRef, useState } from 'react';
import { Activity, Calendar, Check, ChevronRight, Download, FileUp, Moon, Pause, Play, Plus, RotateCcw, Sparkles, Sun, Trash2 } from 'lucide-react';
import { registerWebMCP } from './webmcp';

const measures = Array.from({ length: 64 }, (_, index) => ({ id: index + 1, section: String.fromCharCode(65 + Math.floor(index / 16)) }));
const seededTakes = [
  { id: 'take-1', label: 'Reference', events: [{ measure: 5, beat: 1, type: 'note' }, { measure: 12, beat: 3, type: 'note' }] },
  { id: 'take-2', label: 'Latest take', events: [{ measure: 5, beat: 1.2, type: 'error' }, { measure: 12, beat: 3.1, type: 'note' }] },
];
const seedLoops = [{ id: 'loop-1', name: 'Phrase 1 start', start: 1, end: 8, reps: 5, rules: 'success' }];
const formats = {
  'practice-dossier-json': ['application/json', 'practice_dossier.json'],
  'practice-events-csv': ['text/csv', 'practice_events.csv'],
  'score-overlay-svg': ['image/svg+xml', 'score_overlay.svg'],
  'practice-schedule-ics': ['text/calendar', 'practice_schedule.ics'],
  'practice-summary-md': ['text/markdown', 'practice_summary.md'],
};

function read(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}

export default function App() {
  const [loops, setLoops] = useState(() => read('mpls_loops', seedLoops));
  const [selectedRange, setSelectedRange] = useState(() => read('mpls_range', { start: 1, end: 1 }));
  const [schedule, setSchedule] = useState(() => read('mpls_schedule', [{ day: 3, loop: 'loop-1', status: 'due' }]));
  const [workspace, setWorkspace] = useState(() => read('mpls_workspace', 'score'));
  const [theme, setTheme] = useState(() => read('mpls_theme', 'light'));
  const [accent, setAccent] = useState(() => read('mpls_accent', 'blue'));
  const [compact, setCompact] = useState(() => read('mpls_compact', false));
  const [sessionState, setSessionState] = useState('idle');
  const [takes, setTakes] = useState(seededTakes);
  const [loopName, setLoopName] = useState('');
  const [loopReps, setLoopReps] = useState(5);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tourStep, setTourStep] = useState(() => read('mpls_tour_complete', false) ? -1 : 0);
  const importRef = useRef(null);
  const stateRef = useRef(null);
  const timerRef = useRef(null);

  stateRef.current = { loops, selectedRange, sessionState, currentBPM: 120, takes, schedule, activeWorkspace: workspace };

  const notify = (text) => {
    clearTimeout(timerRef.current);
    setMessage(text);
    timerRef.current = setTimeout(() => setMessage(''), 2600);
  };
  const persist = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); };
  useEffect(() => persist('mpls_loops', loops), [loops]);
  useEffect(() => persist('mpls_range', selectedRange), [selectedRange]);
  useEffect(() => persist('mpls_schedule', schedule), [schedule]);
  useEffect(() => persist('mpls_workspace', workspace), [workspace]);
  useEffect(() => persist('mpls_theme', theme), [theme]);
  useEffect(() => persist('mpls_accent', accent), [accent]);
  useEffect(() => persist('mpls_compact', compact), [compact]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const addLoop = (values) => {
    const loop = { id: `loop-${Date.now()}-${Math.random().toString(16).slice(2)}`, rules: 'standard', ...values };
    setLoops(current => [...current, loop]);
    notify(`Created “${loop.name}”`);
    return loop;
  };
  const createLoop = () => {
    const reps = Number(loopReps);
    if (!loopName.trim()) { setError('Enter a loop name so you can identify it later.'); return; }
    if (!Number.isInteger(reps) || reps < 1 || reps > 100) { setError('Repetitions must be a whole number from 1 to 100.'); return; }
    setError('');
    addLoop({ name: loopName.trim(), start: selectedRange.start, end: selectedRange.end, reps });
    setLoopName('');
  };
  const updateLoop = (id, property, value) => {
    let found = false;
    setLoops(current => current.map(loop => { if (loop.id !== id) return loop; found = true; return { ...loop, [property]: value }; }));
    return found;
  };
  const deleteLoop = (id) => {
    const found = stateRef.current.loops.find(loop => loop.id === id);
    if (!found) return false;
    setLoops(current => current.filter(loop => loop.id !== id));
    setSchedule(current => current.filter(item => item.loop !== id));
    notify(`Deleted “${found.name}”`);
    return true;
  };
  const setMode = (mode) => { setWorkspace(mode); return true; };
  const startSession = () => { setSessionState('playing'); notify('Practice session started'); return true; };
  const pauseSession = () => { if (stateRef.current.sessionState !== 'playing') return false; setSessionState('paused'); notify('Practice session paused'); return true; };
  const resumeSession = () => { if (stateRef.current.sessionState !== 'paused') return false; setSessionState('playing'); notify('Practice session resumed'); return true; };
  const stopSession = () => { setSessionState('idle'); notify('Practice session stopped'); return true; };
  const toggleSchedule = (day, loopId) => {
    const existing = stateRef.current.schedule.find(item => item.day === day && item.loop === loopId);
    const status = existing?.status === 'approved' ? 'due' : 'approved';
    setSchedule(current => existing ? current.map(item => item.day === day && item.loop === loopId ? { ...item, status } : item) : [...current, { day, loop: loopId, status }]);
    notify(`Day ${day} marked ${status}`);
    return status;
  };
  const dossier = () => ({ schemaVersion: 'music-practice-dossier/v1', exportedAt: new Date().toISOString(), loops: stateRef.current.loops, selectedRange: stateRef.current.selectedRange, sessionState: stateRef.current.sessionState, takes: stateRef.current.takes, schedule: stateRef.current.schedule });
  const artifactContents = (format) => {
    const data = dossier();
    if (format === 'practice-events-csv') return `take,event,measure,beat,type\n${takes.flatMap(take => take.events.map((event, index) => `${take.id},${index},${event.measure},${event.beat},${event.type}`)).join('\n')}`;
    if (format === 'score-overlay-svg') return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Practice score overlay"><text x="10" y="24">Measures ${selectedRange.start}-${selectedRange.end}</text></svg>`;
    if (format === 'practice-schedule-ics') return `BEGIN:VCALENDAR\nVERSION:2.0\n${schedule.map(item => `BEGIN:VEVENT\nUID:${item.loop}-day-${item.day}@practice-studio\nSUMMARY:Practice ${item.loop}\nDTSTART;VALUE=DATE:202601${String(item.day).padStart(2, '0')}\nEND:VEVENT`).join('\n')}\nEND:VCALENDAR`;
    if (format === 'practice-summary-md') return `# Practice Summary\n\nLoops: ${loops.length}\nSelected measures: ${selectedRange.start}-${selectedRange.end}\nTakes: ${takes.length}\n`;
    return JSON.stringify(data, null, 2);
  };
  const exportArtifact = (format = 'practice-dossier-json') => {
    const selected = formats[format] ? format : 'practice-dossier-json';
    const [type, name] = formats[selected];
    const url = URL.createObjectURL(new Blob([artifactContents(selected)], { type }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
    notify(`Downloaded ${name}`); return true;
  };
  const copyDossier = () => { const text = JSON.stringify(dossier()); navigator.clipboard?.writeText(text); notify('Copied practice dossier JSON'); return text.length; };
  const importDossier = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.schemaVersion !== 'music-practice-dossier/v1' || !Array.isArray(data.loops)) throw new Error('schema');
        setLoops(data.loops); setSchedule(Array.isArray(data.schedule) ? data.schedule : []); setTakes(Array.isArray(data.takes) ? data.takes : seededTakes);
        if (data.selectedRange) setSelectedRange(data.selectedRange);
        setSessionState(['idle', 'playing', 'paused'].includes(data.sessionState) ? data.sessionState : 'idle');
        setError(''); notify(`Imported ${data.loops.length} loops`);
      } catch { setError('Import failed. Choose a valid practice-dossier JSON file.'); }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    registerWebMCP({
      state: () => stateRef.current,
      select: (type, id) => type === 'practice-loop' ? stateRef.current.loops.some(loop => loop.id === id) : stateRef.current.takes.some(take => take.events.some((_, index) => `${take.id}-event-${index}` === id)),
      createLoop: addLoop, deleteLoop, updateLoop,
      setRange: setSelectedRange, showMode: setMode, toggleSchedule,
      start: startSession, pause: pauseSession, resume: resumeSession, stop: stopSession, restart: startSession,
      exportArtifact, openImport: () => importRef.current?.click(), copyDossier,
    });
  });

  const completeTour = () => { setTourStep(-1); persist('mpls_tour_complete', true); notify('Tour complete — your first loop is ready'); };
  const rangeLabel = `${selectedRange.start}–${selectedRange.end}`;
  const activeAccent = accent === 'coral' ? '#e45745' : accent === 'green' ? '#16865c' : '#2563eb';

  return (
    <div className={`app ${theme} ${compact ? 'compact' : ''}`} style={{ '--accent': activeAccent }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="live-region" role="status" aria-live="polite" aria-atomic="true">{message}</div>
      {message && <div className="toast"><Check aria-hidden="true" />{message}</div>}
      {tourStep >= 0 && <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <Sparkles aria-hidden="true" />
        <div><strong id="tour-title">{tourStep === 0 ? 'Build a focused practice loop' : 'Track it across every workspace'}</strong><p>{tourStep === 0 ? 'Select a measure, name the phrase, and choose repetitions.' : 'Loops, sessions, takes, schedules, and exports stay synchronized.'}</p></div>
        <button onClick={() => tourStep === 0 ? setTourStep(1) : completeTour()}>{tourStep === 0 ? 'Next' : 'Start practicing'}<ChevronRight aria-hidden="true" /></button>
        <button className="tour-skip" onClick={completeTour}>Skip tour</button>
      </div>}
      <header className="app-header">
        <div className="brand"><Activity aria-hidden="true" /><div><h1>Practice Loop Studio</h1><p>Turn difficult measures into deliberate progress.</p></div></div>
        <div className="header-actions">
          <label className="button"><FileUp aria-hidden="true" />Import dossier<input ref={importRef} type="file" accept="application/json,.json" onChange={importDossier} /></label>
          <button onClick={copyDossier}>Copy JSON</button><button onClick={() => exportArtifact()}><Download aria-hidden="true" />Export</button>
          <button aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => setTheme(value => { const next = value === 'light' ? 'dark' : 'light'; persist('mpls_theme', next); return next; })}>{theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</button>
        </div>
      </header>
      <nav className="workspace-nav" aria-label="Practice workspaces">
        {['score', 'loops', 'tempo', 'takes', 'schedule'].map(tab => <button key={tab} aria-current={workspace === tab ? 'page' : undefined} onClick={() => setWorkspace(tab)}>{tab}</button>)}
      </nav>
      <main id="main-content">
        <aside className="session-summary" aria-label="Session summary">
          <div><span>Selected range</span><strong data-testid="range-summary">Measures {rangeLabel}</strong></div>
          <div><span>Saved loops</span><strong data-testid="loop-count">{loops.length}</strong></div>
          <div><span>Session</span><strong className={`state ${sessionState}`}>{sessionState}</strong></div>
          <div><span>Scheduled</span><strong>{schedule.length} days</strong></div>
        </aside>

        {workspace === 'score' && <section className="panel score-panel" data-workspace="score">
          <div className="section-heading"><div><p className="eyebrow">Define</p><h2>Score strip</h2></div><p>Click one measure, then Shift+click another to span a phrase.</p></div>
          <div className="score-strip" role="group" aria-label={`Score measures, selected ${rangeLabel}`}>
            {measures.map(measure => {
              const selected = measure.id >= selectedRange.start && measure.id <= selectedRange.end;
              return <button key={measure.id} aria-pressed={selected} aria-label={`Measure ${measure.id}, section ${measure.section}${selected ? ', selected' : ''}`} onClick={event => setSelectedRange(current => event.shiftKey ? { start: Math.min(current.start, measure.id), end: Math.max(current.end, measure.id) } : { start: measure.id, end: measure.id })}><span>{measure.section}</span><b>{measure.id}</b></button>;
            })}
          </div>
          <form className="loop-form" onSubmit={event => { event.preventDefault(); createLoop(); }} noValidate>
            <div><label htmlFor="loop-name">Loop name</label><input id="loop-name" value={loopName} onChange={event => { setLoopName(event.target.value); if (error) setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'loop-error' : undefined} placeholder="e.g. Bridge syncopation" /></div>
            <div><label htmlFor="loop-reps">Repetitions</label><input id="loop-reps" type="number" min="1" max="100" value={loopReps} onChange={event => setLoopReps(event.target.value)} /></div>
            <button className="primary" type="submit"><Plus aria-hidden="true" />Create loop</button>
            {error && <p id="loop-error" className="field-error" role="alert">{error}</p>}
          </form>
        </section>}

        {workspace === 'loops' && <section className="panel" data-workspace="loops">
          <div className="section-heading"><div><p className="eyebrow">Library</p><h2>Saved loops</h2></div><p>{loops.length} focused {loops.length === 1 ? 'phrase' : 'phrases'} ready to practice.</p></div>
          {loops.length === 0 ? <div className="empty-state"><Sparkles aria-hidden="true" /><h3>Your loop library is empty</h3><p>Return to Score, select a phrase, and create your first practice loop.</p><button className="primary" onClick={() => setWorkspace('score')}>Create a loop</button></div> : <div className="loop-grid">{loops.map(loop => <article className="loop-card" key={loop.id} data-loop-id={loop.id}>
            <div><span className="measure-chip">Measures {loop.start}–{loop.end}</span>{editingId === loop.id ? <input aria-label={`Edit name for ${loop.name}`} autoFocus defaultValue={loop.name} onBlur={event => { updateLoop(loop.id, 'name', event.target.value.trim() || loop.name); setEditingId(null); notify('Loop name updated'); }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setEditingId(null); }} /> : <h3>{loop.name}</h3>}<p>{loop.reps} repetitions · {loop.rules} rule</p></div>
            <div className="card-actions"><button onClick={() => setEditingId(loop.id)}>Edit loop</button><button className="danger" onClick={() => deleteLoop(loop.id)}><Trash2 aria-hidden="true" />Delete</button></div>
          </article>)}</div>}
        </section>}

        {workspace === 'tempo' && <section className="tempo-grid" data-workspace="tempo">
          <div className="panel"><div className="section-heading"><div><p className="eyebrow">Shape</p><h2>Tempo ramp</h2></div><p>Five repetitions rise from control to performance tempo.</p></div><svg className="tempo-chart" role="img" aria-label="Tempo rises from 80 to 120 BPM across five repetitions" viewBox="0 0 500 180"><path d="M20 145 C110 140 120 112 200 110 S320 54 480 38"/><g>{[[20,145],[135,125],[250,92],[365,55],[480,38]].map(([x,y], i) => <circle key={x} cx={x} cy={y} r="8"><title>Repetition {i + 1}: {80 + i * 10} BPM</title></circle>)}</g></svg><div className="tempo-labels">{[80,90,100,110,120].map((bpm,index) => <span key={bpm}>Rep {index + 1}<b>{bpm} BPM</b></span>)}</div></div>
          <div className="panel runner"><p className="eyebrow">Run</p><h2>Session runner</h2><div className={`pulse ${sessionState}`} aria-hidden="true"/><strong className="bpm">120 <small>BPM</small></strong><p className="runner-state">{sessionState === 'idle' ? 'Ready for measures ' + rangeLabel : sessionState === 'playing' ? 'Playing · repetition 1 of 5' : 'Paused · progress preserved'}</p><div className="runner-actions">{sessionState === 'playing' ? <button className="round" aria-label="Pause session" title="Pause session" onClick={pauseSession}><Pause aria-hidden="true" /></button> : <button className="round primary" aria-label={sessionState === 'paused' ? 'Resume session' : 'Start session'} title={sessionState === 'paused' ? 'Resume session' : 'Start session'} onClick={sessionState === 'paused' ? resumeSession : startSession}><Play aria-hidden="true" /></button>}<button className="round" aria-label="Stop and reset session" title="Stop and reset session" onClick={stopSession}><RotateCcw aria-hidden="true" /></button></div></div>
        </section>}

        {workspace === 'takes' && <section className="panel" data-workspace="takes"><div className="section-heading"><div><p className="eyebrow">Compare</p><h2>Take alignment</h2></div><button className="primary" onClick={() => { setTakes(current => current.map((take,index) => index ? { ...take, label: 'Aligned take' } : take)); notify('Accepted alignment for latest take'); }}><Check aria-hidden="true" />Accept alignment</button></div><div className="takes">{takes.map(take => <article key={take.id}><div><strong>{take.label}</strong><span>{take.events.length} events</span></div><div className="timeline">{take.events.map((event,index) => <button key={index} style={{ left: `${event.measure / 16 * 92}%` }} aria-label={`${take.label}, measure ${event.measure}, beat ${event.beat}, ${event.type}`} title={`Measure ${event.measure}, beat ${event.beat}`} className={event.type}/>)}</div></article>)}</div></section>}

        {workspace === 'schedule' && <section className="panel" data-workspace="schedule"><div className="section-heading"><div><p className="eyebrow">Plan</p><h2>21-day schedule</h2></div><p>Select a day to approve its first assigned loop.</p></div><div className="schedule-grid">{Array.from({ length: 21 }, (_, index) => { const day = index + 1; const item = schedule.find(entry => entry.day === day); const loop = loops.find(entry => entry.id === item?.loop); return <button key={day} className={item?.status || ''} onClick={() => loops[0] ? toggleSchedule(day, item?.loop || loops[0].id) : notify('Create a loop before scheduling practice')}><span>Day {day}</span>{item ? <strong>{loop?.name || item.loop}<small>{item.status}</small></strong> : <em>Open</em>}</button>; })}</div></section>}

        <section className="preferences" aria-labelledby="preferences-title"><div><p className="eyebrow">Personalize</p><h2 id="preferences-title">Studio preferences</h2></div><label>Accent<select value={accent} onChange={event => { setAccent(event.target.value); persist('mpls_accent', event.target.value); }}><option value="blue">Tempo blue</option><option value="coral">Warm coral</option><option value="green">Stage green</option></select></label><label className="toggle"><input type="checkbox" checked={compact} onChange={event => { setCompact(event.target.checked); persist('mpls_compact', event.target.checked); }} />Compact spacing</label></section>
      </main>
    </div>
  );
}
