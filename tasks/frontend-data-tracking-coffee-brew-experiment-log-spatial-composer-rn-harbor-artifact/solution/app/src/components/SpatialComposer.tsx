import React, { useRef } from 'react';
import { useStore } from '../store';
import { motion, useReducedMotion } from 'framer-motion';
import { RefreshCw, Undo2 } from 'lucide-react';

export const SpatialComposer: React.FC = () => {
  const { records, selectedRecordId, placeInSpatialComposer, rebalanceCapacity, undo } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const spatialRecords = records.filter(r => r.spatialPosition);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!selectedRecordId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Bounds check to keep within container
    const boundedX = Math.max(0, Math.min(x, rect.width - 150));
    const boundedY = Math.max(0, Math.min(y, rect.height - 80));

    placeInSpatialComposer(selectedRecordId, boundedX, boundedY);
  };

  const handleCanvasKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedRecordId || !containerRef.current) return;

    if (e.key === 'Enter') {
      const rect = containerRef.current.getBoundingClientRect();
      placeInSpatialComposer(selectedRecordId, rect.width / 2 - 75, rect.height / 2 - 40);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Spatial Composer</h2>
          <p className="text-sm text-slate-500">
            {selectedRecordId ? 'Click or press Enter on the canvas to place selected record.' : 'Select a record to place.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="Undo"
          >
            <Undo2 size={16} /> Undo (Ctrl+Z)
          </button>
          <button
            onClick={rebalanceCapacity}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none shadow-sm"
          >
            <RefreshCw size={16} /> Rebalance Capacity
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        onKeyDown={handleCanvasKeyDown}
        tabIndex={0}
        className="flex-1 relative overflow-hidden bg-slate-50 cursor-crosshair focus:ring-4 focus:ring-inset focus:ring-blue-500 outline-none"
        aria-label="Spatial composer canvas"
      >
        {spatialRecords.map(r => (
          <motion.div
            key={r.id}
            layout
            initial={false}
            animate={{ x: r.spatialPosition!.x, y: r.spatialPosition!.y }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute w-[150px] p-3 rounded-lg shadow-md border cursor-default select-none ${
              selectedRecordId === r.id ? 'bg-blue-100 border-blue-400 z-10' : 'bg-white border-slate-300'
            }`}
          >
            <div className="font-medium text-sm text-slate-800 truncate" title={r.name}>{r.name}</div>
            <div className="text-xs text-slate-500 mt-1">{r.status}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
