import React, { useState, useEffect, useRef } from 'react';
import { useAppStore, getDerivedState } from '../state';

export const Composer: React.FC = () => {
  const { records, composer, mutateCapacity, undo } = useAppStore();
  const derived = getDerivedState(records);

  const selectedRecord = records.find(r => r.id === composer.selectedRecordId);
  const [localCapacity, setLocalCapacity] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (selectedRecord) {
      setLocalCapacity(selectedRecord.capacity);
    } else {
      setLocalCapacity(0);
    }
  }, [selectedRecord, composer.composerStatus]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedRecord) return;
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedRecord || !isDragging.current) return;
    updateFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const updateFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newCap = Math.max(1, Math.min(1000, Math.round(percentage * 1000)));
    setLocalCapacity(newCap);
  };

  const handleMutate = () => {
    if (!selectedRecord) return;
    mutateCapacity(localCapacity);
  };

  return (
    <div className="bg-white p-4 shadow rounded flex-1 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Spatial Composer</h2>

      <div className="flex gap-4 mb-4 text-sm font-semibold p-2 bg-gray-100 rounded">
        <div>Total Valid Capacity: {derived.totalCapacity}</div>
        <div>Total Checkpoints: {derived.totalCheckpoints}</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded p-4 relative overflow-hidden transition-all duration-300 min-h-[300px]">
        {composer.composerStatus === 'conflict' && (
          <div className="absolute top-2 left-2 right-2 bg-red-100 text-red-700 p-2 text-sm rounded font-semibold text-center z-10" role="alert">
            Conflicting mutation rejected. Capacity must be between 1 and 1000.
          </div>
        )}

        {!selectedRecord ? (
          <div className="text-gray-400 font-medium">Select a record from the collection to compose</div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold">{selectedRecord.name}</h3>
              <p className="text-gray-500 text-sm mb-2">ID: {selectedRecord.id} | Status: {selectedRecord.status}</p>
            </div>

            <div className="w-full flex flex-col items-center gap-4">
              <div
                className="w-full relative h-16 bg-gray-200 rounded-full cursor-pointer overflow-hidden border border-gray-300 shadow-inner"
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: 'none' }}
                aria-label="Drag to rebalance capacity"
                role="slider"
                aria-valuenow={localCapacity}
                aria-valuemin={1}
                aria-valuemax={1000}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    setLocalCapacity(prev => Math.min(1000, prev + 10));
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    setLocalCapacity(prev => Math.max(1, prev - 10));
                  }
                }}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-none pointer-events-none"
                  style={{ width: `${(localCapacity / 1000) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold bg-white/70 px-2 py-1 rounded shadow-sm text-gray-800 select-none">
                    {localCapacity}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <label className="text-sm font-semibold">Exact Value:</label>
                <input
                  type="number"
                  value={localCapacity}
                  onChange={(e) => setLocalCapacity(Number(e.target.value))}
                  className="border-2 border-blue-400 rounded p-1 text-center w-20 focus:outline-none focus:border-blue-600 focus:ring-2 ring-blue-300 transition-all"
                  placeholder="100"
                />
              </div>

              <div className="flex gap-2 w-full mt-4">
                <button type="button" onClick={handleMutate} className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition-colors">Apply Mutation</button>
                <button type="button" onClick={undo} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded hover:bg-gray-300 transition-colors">Undo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
