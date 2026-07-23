import React from 'react';
import { CAMPUS_NODES } from './fixture';

export default function FloorStack({ activeBuilding, activeFloor, onSelectFloor }) {
  if (!activeBuilding) return null;

  // Get floors for this building
  const floors = Array.from(
    new Set(CAMPUS_NODES.filter(n => n.building === activeBuilding).map(n => n.floor))
  ).sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
      <h3 className="text-xs font-bold text-slate-500 uppercase">{activeBuilding} Floors</h3>
      <div className="flex flex-col gap-1">
        {floors.map(f => (
          <button
            key={f}
            onClick={() => onSelectFloor(activeBuilding, f)}
            className={`px-3 py-1 text-xs rounded text-left border ${
              f === activeFloor
                ? 'bg-blue-100 border-blue-300 text-blue-800 font-medium'
                : 'bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            Floor {f}
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
