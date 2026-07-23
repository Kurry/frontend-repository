import React from 'react';
import { CAMPUS_NODES, CAMPUS_EDGES } from './fixture';

export default function Map({ route, activeBuilding, activeFloor }) {
  // Simple bounding box for nodes
  const minX = -73.9630, maxX = -73.9610;
  const minY = 40.8070, maxY = 40.8085;

  const width = 600;
  const height = 400;

  const project = (lng, lat) => {
    const x = ((lng - minX) / (maxX - minX)) * width;
    const y = ((maxY - lat) / (maxY - minY)) * height;
    return { x, y };
  };

  const visibleNodes = CAMPUS_NODES.filter(n => {
    if (n.type === 'outdoor') return true;
    if (n.building === activeBuilding && n.floor === activeFloor) return true;
    return false;
  });

  const visibleEdges = CAMPUS_EDGES.filter(e => {
    const s = CAMPUS_NODES.find(n => n.id === e.source);
    const t = CAMPUS_NODES.find(n => n.id === e.target);
    if (!s || !t) return false;

    // Show edge if both nodes are visible
    return visibleNodes.find(n => n.id === s.id) && visibleNodes.find(n => n.id === t.id);
  });

  // Extract route edge ids
  const routeEdgeIds = new Set(route ? route.segments.map(s => s.id) : []);

  return (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center relative overflow-hidden p-4 rounded border border-slate-300">
      <svg aria-label="Campus Map" role="img" width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" className="bg-white shadow-inner rounded border border-slate-200">
        {/* Draw Edges */}
        {visibleEdges.map(e => {
          const s = CAMPUS_NODES.find(n => n.id === e.source);
          const t = CAMPUS_NODES.find(n => n.id === e.target);
          const ps = project(s.lng, s.lat);
          const pt = project(t.lng, t.lat);
          const isRoute = routeEdgeIds.has(e.id);

          return (
            <line
              key={e.id}
              x1={ps.x} y1={ps.y} x2={pt.x} y2={pt.y}
              stroke={isRoute ? "#2563eb" : "#cbd5e1"}
              strokeWidth={isRoute ? 4 : 2}
            />
          );
        })}

        {/* Draw Nodes */}
        {visibleNodes.map(n => {
          const p = project(n.lng, n.lat);
          return (
            <circle
              key={n.id}
              cx={p.x} cy={p.y} r={5}
              fill={n.type === 'outdoor' ? "#10b981" : "#8b5cf6"}
              stroke="#fff"
              strokeWidth={1}
            />
          );
        })}
      </svg>
    </div>
  );
}
