import React from 'react';
import { CAMPUS_NODES } from './fixture';

export default function FloorStack({ activeBuilding, activeFloor, onSelectFloor, project }) {
  if (!activeBuilding) return null;

  // Get floors for this building
  const floors = Array.from(
    new Set(CAMPUS_NODES.filter(n => n.building === activeBuilding).map(n => n.floor))
  ).sort((a, b) => b - a);

  // Render a mini map for the floor to meet cf-02 (aligned visual stacking)
  const renderMiniMap = (floor) => {
    const nodes = CAMPUS_NODES.filter(n => n.building === activeBuilding && n.floor === floor);
    if (!nodes.length || !project) return null;

    return (
      <svg viewBox="0 0 600 400" width="100%" height="40px" className="pointer-events-none opacity-50 absolute inset-0 mx-auto w-full">
        {nodes.map(n => {
          const p = project(n.lng, n.lat);
          return (
            <circle
              key={n.id}
              cx={p.x} cy={p.y} r={10}
              fill="#8b5cf6"
              stroke="#fff"
              strokeWidth={2}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
      <h3 className="text-xs font-bold text-slate-500 uppercase">{activeBuilding} Floors</h3>
      <div className="flex flex-col gap-1">
        {floors.map(f => (
          <button
            key={f}
            onClick={() => onSelectFloor(activeBuilding, f)}
            className={`relative overflow-hidden px-3 py-3 text-xs rounded text-left border ${
              f === activeFloor
                ? 'bg-blue-100 border-blue-300 text-blue-800 font-medium shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="relative z-10">Floor {f}</span>
            {renderMiniMap(f)}
          </button>
        ))}
      </div>
      <button
        onClick={() => onSelectFloor(null, null)}
        className="mt-2 text-xs text-red-500 hover:underline text-left"
      >
        Exit Building
      </button>
    </div>
  );
}
