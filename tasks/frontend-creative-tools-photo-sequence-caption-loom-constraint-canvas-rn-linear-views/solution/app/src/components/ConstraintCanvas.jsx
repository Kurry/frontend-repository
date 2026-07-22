import React from 'react';
import { ConstraintCanvasLane } from './ConstraintCanvasLane';

export function ConstraintCanvas() {
  const lanes = [
    { id: 'idle', label: 'Idle' },
    { id: 'selected', label: 'Selected' },
    { id: 'changed', label: 'Changed' },
    { id: 'conflict', label: 'Conflict' },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden p-6 gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Constraint Canvas</h1>
          <p className="text-gray-500 mt-1">Drag records across constraint lanes to resolve conflicts.</p>
        </div>
      </div>

      <div className="flex gap-4 h-full overflow-x-auto pb-2">
        {lanes.map(lane => (
          <ConstraintCanvasLane key={lane.id} laneId={lane.id} label={lane.label} />
        ))}
      </div>
    </div>
  );
}
