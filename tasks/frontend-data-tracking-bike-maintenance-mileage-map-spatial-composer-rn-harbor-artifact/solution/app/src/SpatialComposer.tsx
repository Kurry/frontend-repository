import React, { useRef, useState } from 'react';
import { useStore } from './store';

export const SpatialComposer: React.FC = () => {
  const { records, spatialState, mutateSpatialComposer } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const record_id = e.dataTransfer.getData('record_id');
    if (!record_id) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mutateSpatialComposer(record_id, x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Keyboard accessibility
  const [selectedForKeyboard, setSelectedForKeyboard] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedForKeyboard) return;
    const step = 20;
    const existing = spatialState.find(s => s.record_id === selectedForKeyboard);
    let newX = existing ? existing.x : 50;
    let newY = existing ? existing.y : 50;

    if (e.key === 'ArrowUp') newY -= step;
    if (e.key === 'ArrowDown') newY += step;
    if (e.key === 'ArrowLeft') newX -= step;
    if (e.key === 'ArrowRight') newX += step;
    if (e.key === 'Enter') {
      mutateSpatialComposer(selectedForKeyboard, newX, newY);
      setSelectedForKeyboard(null);
      return;
    }
    mutateSpatialComposer(selectedForKeyboard, newX, newY);
  };

  const unassigned = records.filter(r => !spatialState.find(s => s.record_id === r.id));

  return (
    <div className="flex flex-col h-full bg-slate-50 border p-4">
      <h2 className="text-xl font-bold mb-4">Spatial Composer</h2>

      <div className="mb-4 text-sm text-gray-600">
        Drag a record here or select one via keyboard and use arrows to move. Press Enter to confirm.
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto p-2 border bg-white">
        {unassigned.map(r => (
          <button
            key={r.id}
            onClick={() => { setSelectedForKeyboard(r.id); mutateSpatialComposer(r.id, 50, 50); }}
            className="p-2 bg-blue-100 text-blue-800 text-sm whitespace-nowrap rounded hover:bg-blue-200"
          >
            Select: {r.service_type}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-white border-2 border-dashed border-gray-300 relative focus:outline-none focus:border-blue-500 overflow-hidden"
      >
        {spatialState.map(state => {
          const record = records.find(r => r.id === state.record_id);
          if (!record) return null;
          const isSelected = selectedForKeyboard === record.id;
          return (
            <div
              key={state.record_id}
              className={`absolute p-2 shadow-md rounded text-sm transition-all duration-300 ease-in-out cursor-grab ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-green-50'}`}
              style={{ left: state.x, top: state.y, transform: 'translate(-50%, -50%)' }}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('record_id', record.id); setSelectedForKeyboard(null); }}
              onClick={() => setSelectedForKeyboard(record.id)}
            >
              <div className="font-bold text-xs">{record.service_type}</div>
              <div className="text-[10px] text-gray-500">{record.status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
