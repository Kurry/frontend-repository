import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export function SpatialComposer() {
  const { records, selectedRecordId, placeRecordInComposer, removeRecordFromComposer, getDerivedState } = useStore();
  const composerRef = useRef(null);
  const [error, setError] = useState(null);

  const placedRecords = records.filter(r => r.position);
  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const { totalCapacity, activeCount, maxCapacity } = getDerivedState();
  const capacityWarning = totalCapacity > maxCapacity * 0.8;

  const handleComposerClick = (e) => {
    if (!selectedRecordId) return;

    // Check if we're clicking an existing placed record
    if (e.target.closest('.placed-record')) return;

    const rect = composerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 50; // offset for center
    const y = e.clientY - rect.top - 25;

    const currentPlacedCapacity = records
      .filter(r => r.position && r.id !== selectedRecordId)
      .reduce((sum, r) => sum + r.capacity, 0);

    if (currentPlacedCapacity + (selectedRecord?.capacity || 0) > maxCapacity) {
        setError(`Cannot place: Exceeds max capacity of ${maxCapacity}`);
        setTimeout(() => setError(null), 3000);
        return;
    }

    placeRecordInComposer(selectedRecordId, { x, y });
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10 shrink-0">
        <div>
          <h2 className="text-lg font-bold">Spatial Composer</h2>
          <p className="text-sm text-gray-500">
            {selectedRecordId ? `Select a location to place "${selectedRecord?.name}"` : 'Select a card from the sidebar to place it'}
          </p>
        </div>
        <div className="flex gap-4">
           <div className={`p-2 rounded text-sm ${capacityWarning ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-800'}`}>
              <span className="font-semibold">Capacity:</span> {totalCapacity} / {maxCapacity}
           </div>
           <div className="p-2 bg-blue-50 text-blue-800 rounded text-sm">
              <span className="font-semibold">Active:</span> {activeCount}
           </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-2 text-center text-sm z-20 shrink-0 border-b border-red-200 shadow-sm" aria-live="polite">
          {error}
        </div>
      )}

      <div
        ref={composerRef}
        className="flex-1 relative cursor-crosshair overflow-auto border-4 border-dashed border-gray-200 m-4 rounded-lg bg-white"
        onClick={handleComposerClick}
        data-testid="composer-canvas"
        style={{ minHeight: '400px' }}
      >
        <AnimatePresence>
          {placedRecords.map(record => (
            <motion.div
              key={record.id}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={prefersReducedMotion ? false : { opacity: 1, scale: 1, x: record.position.x, y: record.position.y }}
              exit={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`placed-record absolute w-24 h-16 p-2 rounded shadow-md flex flex-col justify-center items-center cursor-default text-xs
                ${selectedRecordId === record.id ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-white border border-gray-300'}`}
              style={prefersReducedMotion ? { left: record.position.x, top: record.position.y } : undefined}
            >
              <div className="font-bold truncate w-full text-center">{record.name}</div>
              <div className={selectedRecordId === record.id ? 'text-blue-100' : 'text-gray-500'}>Cap: {record.capacity}</div>
              <button
                onClick={(e) => { e.stopPropagation(); removeRecordFromComposer(record.id); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {placedRecords.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            Composer Canvas - Click to place selected card
          </div>
        )}
      </div>
    </div>
  );
}
