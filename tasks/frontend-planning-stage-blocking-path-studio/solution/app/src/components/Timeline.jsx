import React, { useMemo, useState } from 'react';
import { useStore } from '../store';

export function Timeline({ notify }) {
  const store = useStore(); const [running, setRunning] = useState(false);
  const branch = store.score.branches[store.score.activeBranch];
  const beats = useMemo(() => [...new Set(Object.values(branch.waypoints).map((w) => w.beat))].sort((a, b) => a - b), [branch.waypoints]);
  const visible = Array.from({ length: store.fixture.totalBeats }, (_, index) => index + 1);
  const rehearse = (status) => { store.addRehearsalEvent({ id: crypto.randomUUID(), beat: store.currentBeat, status, at: new Date().toISOString() }); setRunning(status === 'start' || status === 'resume'); if (status === 'restart') store.setBeat(1); if (status === 'advance') store.setBeat(Math.min(48, store.currentBeat + 1)); notify(`Rehearsal ${status} recorded at beat ${status === 'restart' ? 1 : store.currentBeat}`); };
  return <section className="timeline" aria-labelledby="timeline-title"><div className="timeline-head"><div><p className="eyebrow">Cue sequence</p><h2 id="timeline-title">Beat timeline</h2></div><div className="rehearsal-controls" aria-label="Rehearsal controls"><span className={`run-state ${running ? 'running' : ''}`}>{running ? 'Running' : 'Ready'}</span>{['start', 'pause', 'advance', 'restart'].map((action) => <button key={action} title={`${action} rehearsal`} onClick={() => rehearse(action)}>{action === 'start' ? '▶' : action === 'pause' ? 'Ⅱ' : action === 'advance' ? '→' : '↺'}<span>{action}</span></button>)}</div></div>
    {!beats.length ? <div className="timeline-empty"><b>No blocking beats yet.</b><span>Add a waypoint to start the cue sequence.</span></div> : <div className="beat-strip" role="list" aria-label="Blocking beats">{visible.map((beat) => { const count = Object.values(branch.waypoints).filter((w) => w.beat === beat).length; return <button aria-label={String(beat)} key={beat} aria-current={store.currentBeat === beat ? 'step' : undefined} className={store.currentBeat === beat ? 'current bg-blue-600' : ''} onClick={() => { store.setBeat(beat); notify(`Previewing beat ${beat}`); }}><span>{beat}</span><small>{count} cue{count === 1 ? '' : 's'}</small></button>; })}</div>}
  </section>;
}
