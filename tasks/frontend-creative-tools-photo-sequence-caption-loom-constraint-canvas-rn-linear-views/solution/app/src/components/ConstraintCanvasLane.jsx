import React from 'react';
import { useAppState } from '../store';

export function ConstraintCanvasLane({ laneId, label }) {
  const { state, dispatch } = useAppState();

  const recordsInLane = state.records.filter(r => r.canvasState === laneId);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');

    const recordId = e.dataTransfer.getData('text/plain');
    if (!recordId) return;

    const record = state.records.find(r => r.id === recordId);
    if (!record || record.canvasState === laneId) return;

    if (laneId === 'conflict') {
      alert("Conflict lane drop rejected.");
      return;
    }

    dispatch({
      type: 'RESOLVE_CONSTRAINT',
      payload: { id: recordId, targetLane: laneId, originalLane: record.canvasState }
    });
  };

  return (
    <div
      className="flex flex-col h-full bg-gray-100 rounded-lg p-3 min-w-[250px] border-2 border-transparent transition-colors flex-1"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-700 capitalize">{label}</h3>
        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
          {recordsInLane.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-[100px]">
        {recordsInLane.map(record => (
          <div
            key={record.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', record.id);
              e.dataTransfer.effectAllowed = 'move';
              e.currentTarget.classList.add('opacity-50');
            }}
            onDragEnd={(e) => {
              e.currentTarget.classList.remove('opacity-50');
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const targetLanes = ['idle', 'selected', 'changed', 'resolved'];
                    const currentIndex = targetLanes.indexOf(laneId);
                    const nextIndex = (currentIndex + 1) % targetLanes.length;
                    const nextLane = targetLanes[nextIndex];
                    dispatch({
                      type: 'RESOLVE_CONSTRAINT',
                      payload: { id: record.id, targetLane: nextLane, originalLane: record.canvasState }
                    });
                }
            }}
            tabIndex={0}
            className={`p-3 bg-white border border-gray-200 rounded shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${laneId === 'resolved' ? 'border-green-300' : ''}`}
            aria-label={`${record.title}, currently in ${laneId}. Press Enter to move to next lane.`}
          >
            <div className="font-medium text-gray-800">{record.title}</div>
            <div className="text-xs text-gray-500 mt-1">Status: {record.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
