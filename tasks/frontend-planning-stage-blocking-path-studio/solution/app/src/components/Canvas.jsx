import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';

export function Canvas({ onEdit, notify }) {
  const store = useStore();
  const svg = useRef(null);
  const branch = store.score.branches[store.score.activeBranch];
  const entities = [...store.fixture.actors, ...store.fixture.props];
  const scale = 64;
  const positions = useMemo(() => Object.fromEntries(entities.map((entity) => {
    const points = Object.entries(branch.waypoints).filter(([, w]) => w.entityId === entity.id).sort((a, b) => a[1].beat - b[1].beat);
    if (!points.length) return [entity.id, null];
    let before = points[0][1]; let after = points.at(-1)[1];
    for (const [, point] of points) { if (point.beat <= store.currentBeat) before = point; if (point.beat >= store.currentBeat) { after = point; break; } }
    const ratio = before.beat === after.beat ? 0 : (store.currentBeat - before.beat) / (after.beat - before.beat);
    return [entity.id, { x: before.x + (after.x - before.x) * ratio, y: before.y + (after.y - before.y) * ratio, facing: before.facing + (after.facing - before.facing) * ratio }];
  })), [branch.waypoints, entities, store.currentBeat]);
  const selectedPoints = Object.entries(branch.waypoints).filter(([, w]) => w.entityId === store.selectedEntity).sort((a, b) => a[1].beat - b[1].beat);

  const choose = (entity, waypointKey) => {
    store.selectEntity(entity.id); if (waypointKey) store.selectWaypoint(waypointKey);
    notify(`${entity.name} selected at beat ${store.currentBeat}`);
  };
  const stageClick = (event) => {
    if (store.activeTool !== 'path' || !store.selectedEntity) return;
    const rect = svg.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(12, ((event.clientX - rect.left) / rect.width) * 12));
    const y = Math.max(0, Math.min(8, ((event.clientY - rect.top) / rect.height) * 8));
    const key = `${store.selectedEntity}-b${store.currentBeat}`;
    const data = { entityId: store.selectedEntity, beat: store.currentBeat, x: +x.toFixed(1), y: +y.toFixed(1), facing: 90, type: 'walk', hold: false };
    branch.waypoints[key] ? store.updateWaypoint(key, data) : store.addWaypoint(data);
    notify(`Path waypoint placed at ${data.x}, ${data.y} metres`);
  };

  return <section className="canvas-wrap" aria-labelledby="stage-title">
    <div className="canvas-toolbar"><div><span className="pulse-dot" aria-hidden="true" />Beat {store.currentBeat} preview</div><p id="stage-help">Tip: choose Path, select an entity, then click the stage to place its waypoint.</p></div>
    <div className="stage-scroll"><svg ref={svg} id="stage-title" role="img" aria-label={`Drawing room stage map at beat ${store.currentBeat}; ${entities.length} actors and props`} viewBox={`0 0 ${12 * scale} ${8 * scale}`} preserveAspectRatio="xMidYMid meet" onClick={stageClick}>
      <defs><pattern id="grid" width={scale} height={scale} patternUnits="userSpaceOnUse"><path d={`M ${scale} 0 L 0 0 0 ${scale}`} className="grid-line" /></pattern><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity=".28" /></filter></defs>
      <rect width="100%" height="100%" rx="16" className="stage-floor" />
      <rect width="100%" height="100%" rx="16" fill="url(#grid)" />
      <text x="24" y="34" className="stage-label">UPSTAGE</text><text x="24" y={8 * scale - 20} className="stage-label">DOWNSTAGE · AUDIENCE</text>
      {store.fixture.entrances.map((item) => <g key={item.id} aria-label={`${item.name} entrance`}><rect x={item.x * scale} y={item.y * scale} width={item.width * scale} height={item.height * scale} className="entrance" /><text x={(item.x + item.width / 2) * scale} y={(item.y + .38) * scale} textAnchor="middle" className="entrance-label">{item.name}</text></g>)}
      {store.fixture.obstacles.map((item) => <g key={item.id} aria-label={item.name}><rect x={item.x * scale} y={item.y * scale} width={item.width * scale} height={item.height * scale} rx="8" className="obstacle" /><text x={(item.x + item.width / 2) * scale} y={(item.y + item.height / 2) * scale} textAnchor="middle" dominantBaseline="middle" className="obstacle-label">{item.name}</text></g>)}
      {(store.activeTool === 'path' || store.activeTool === 'analysis') && selectedPoints.length > 1 && <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} points={selectedPoints.map(([, p]) => `${p.x * scale},${p.y * scale}`).join(' ')} className="path-line" />}
      {entities.map((entity, index) => {
        const pos = positions[entity.id]; if (!pos) return null;
        const prop = entity.id.startsWith('p'); const selected = store.selectedEntity === entity.id;
        const key = branch.waypoints[`${entity.id}-b${store.currentBeat}`] ? `${entity.id}-b${store.currentBeat}` : Object.keys(branch.waypoints).find((k) => branch.waypoints[k].entityId === entity.id);
        const labelY = prop ? 31 + (index % 2) * 16 : 38;
        return <motion.g key={entity.id} initial={false} animate={{ x: pos.x * scale, y: pos.y * scale, rotate: pos.facing }} transition={{ type: 'spring', stiffness: 240, damping: 26 }} tabIndex={0} role="button" aria-label={`${entity.name}, ${prop ? 'prop' : 'actor'}, position ${pos.x.toFixed(1)} by ${pos.y.toFixed(1)} metres${selected ? ', selected' : ''}`} aria-pressed={selected} className={`entity ${prop ? 'prop' : 'actor'} ${selected ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); choose(entity, key); }} onDoubleClick={(e) => { e.stopPropagation(); choose(entity, key); onEdit(); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(entity, key); } if (e.key === 'e') onEdit(); }}>
          <title>{entity.name}: {prop ? 'stage prop' : 'company member'}</title>
          {selected && <circle r="27" className="selection-ring" />}
          {prop ? <rect x="-11" y="-11" width="22" height="22" rx="5" fill={entity.color} filter="url(#shadow)" /> : <><circle r="18" fill={entity.color} filter="url(#shadow)" /><path d="M 5 0 L 17 0" className="facing" /></>}
          <g transform={`rotate(${-pos.facing})`}><rect x="-37" y={-labelY - 13} width="74" height="23" rx="11" className="entity-label-bg" /><text y={-labelY + 3} textAnchor="middle" className="entity-label">{entity.name}</text></g>
        </motion.g>;
      })}
    </svg></div>
    <div className="legend" aria-label="Stage legend"><span><i className="legend-actor" />Actor</span><span><i className="legend-prop" />Prop</span><span><i className="legend-path" />Selected path</span><span><i className="legend-entrance" />Entrance</span></div>
  </section>;
}
