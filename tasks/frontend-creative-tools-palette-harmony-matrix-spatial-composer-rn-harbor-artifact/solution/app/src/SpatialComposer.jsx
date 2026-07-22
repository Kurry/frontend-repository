import React, { useRef, useState, useEffect } from 'react';
import { useStore } from './state';
import { MousePointerClick, Undo } from 'lucide-react';

export default function SpatialComposer() {
  const { records, derived, mutateInComposer, undo, selectRecord } = useStore();
  const composerRef = useRef(null);

  const selectedRecord = records.find(r => r.id === derived.selectedId);
  const totalCapacity = derived.totalCapacity;

  const [localCapacity, setLocalCapacity] = useState(0);

  useEffect(() => {
    if (selectedRecord) {
      setLocalCapacity(selectedRecord.capacity);
    }
  }, [selectedRecord]);

  const handleComposerClick = (e) => {
    if (!selectedRecord) return;

    const rect = composerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to percentage
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    mutateInComposer(selectedRecord.id, { x: percentX, y: percentY }, localCapacity);
  };

  const handleKeyDown = (e) => {
    if (!selectedRecord) return;

    const moveAmount = 5;
    let newX = selectedRecord.position.x;
    let newY = selectedRecord.position.y;

    if (e.key === 'ArrowUp') newY = Math.max(0, newY - moveAmount);
    if (e.key === 'ArrowDown') newY = Math.min(100, newY + moveAmount);
    if (e.key === 'ArrowLeft') newX = Math.max(0, newX - moveAmount);
    if (e.key === 'ArrowRight') newX = Math.min(100, newX + moveAmount);

    if (newX !== selectedRecord.position.x || newY !== selectedRecord.position.y) {
      e.preventDefault();
      mutateInComposer(selectedRecord.id, { x: newX, y: newY }, localCapacity);
    }
  };

  const handleCapacityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setLocalCapacity(val);
    }
  };

  const applyMutation = () => {
    if (selectedRecord) {
      mutateInComposer(selectedRecord.id, selectedRecord.position, localCapacity);
    }
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded bg-white shadow-sm h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MousePointerClick size={20} />
          Spatial Composer
        </h2>
        <button
          onClick={undo}
          className="text-gray-600 hover:text-black p-2 border rounded hover:bg-gray-50 flex items-center gap-1"
          aria-label="Undo last mutation"
        >
          <Undo size={16} /> Undo
        </button>
      </div>

      <div className="flex gap-4 mb-2 items-end">
         <div className="flex-1">
           <label className="block text-sm font-medium text-gray-700">Selected Capacity</label>
           <input
             type="number"
             value={localCapacity}
             onChange={handleCapacityChange}
             disabled={!selectedRecord}
             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
           />
         </div>
         <button
            onClick={applyMutation}
            disabled={!selectedRecord}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
         >
            Rebalance
         </button>
      </div>

      <div
        ref={composerRef}
        className="relative flex-1 border-2 border-dashed border-gray-300 rounded bg-gray-50 overflow-hidden cursor-crosshair min-h-[300px]"
        onClick={handleComposerClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label="Spatial Composer Canvas"
      >
        {!selectedRecord && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            Select a record to place
          </div>
        )}

        {records.filter(r => r.status === 'ready' || r.status === 'changed').map(record => (
          <div
            key={record.id}
            className={`absolute w-8 h-8 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out cursor-pointer ${derived.selectedId === record.id ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'opacity-70'}`}
            style={{
              left: `${record.position.x}%`,
              top: `${record.position.y}%`,
              backgroundColor: record.hex,
              width: `${Math.max(16, record.capacity)}px`,
              height: `${Math.max(16, record.capacity)}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              selectRecord(record.id);
            }}
            title={`${record.hex} (Capacity: ${record.capacity})`}
          />
        ))}
      </div>

      <div className="text-sm text-gray-500" aria-live="polite">
        Total Capacity: {totalCapacity} / 1000
      </div>
    </div>
  );
}
