import React, { useState } from 'react';
import { useStore } from '../store/store';
import { Undo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpatialComposer() {
  const { records, placeInSpatialComposer, undo, derived } = useStore();
  const [selectedId, setSelectedId] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  const placedRecords = records.filter(r => r.spatialComposerState?.placed);
  const unplacedRecords = records.filter(r => !r.spatialComposerState?.placed);

  const handleCanvasClick = (e) => {
    if (!selectedId) return;

    // Simple bounding check for "capacity" logic
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check conflict (too close to another item)
    const isConflict = placedRecords.some(r => {
      const dx = r.spatialComposerState.x - x;
      const dy = r.spatialComposerState.y - y;
      return Math.sqrt(dx*dx + dy*dy) < 50; // 50px capacity radius
    });

    if (isConflict) {
      setConflictError("Capacity conflict: Cannot place here.");
      setTimeout(() => setConflictError(null), 3000);
      return;
    }

    placeInSpatialComposer(selectedId, x, y);
    setSelectedId(null);
  };

  const handleKeyDown = (e) => {
    // Alternate input for placing (simulate click in center if enter pressed and item selected)
    if (e.key === 'Enter' && selectedId) {
      // Find empty spot roughly
      placeInSpatialComposer(selectedId, 150, 150);
      setSelectedId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-md overflow-hidden" onKeyDown={handleKeyDown} tabIndex="0">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Spatial Composer</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-blue-600">{derived.summary}</span>
          <button
            onClick={undo}
            className="flex items-center gap-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            aria-label="Undo last action"
          >
            <Undo size={16} /> Undo
          </button>
        </div>
      </div>

      {conflictError && <div className="bg-red-100 text-red-700 p-2 text-sm">{conflictError}</div>}

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Selection sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto shrink-0 flex flex-col gap-2">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">Unplaced Ingredients</h3>
          {unplacedRecords.length === 0 && <p className="text-xs text-gray-500">All items placed.</p>}
          {unplacedRecords.map(record => (
            <button
              key={record.id}
              onClick={() => setSelectedId(record.id)}
              className={`p-2 text-left rounded text-sm border transition-colors ${selectedId === record.id ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-100'}`}
              aria-label={`Select ${record.name} to place`}
            >
              <div className="font-medium">{record.name}</div>
              <div className="text-xs text-gray-500">{record.amount}{record.unit}</div>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div
          className={`flex-1 relative overflow-hidden bg-slate-50 cursor-crosshair ${selectedId ? 'ring-2 ring-inset ring-blue-400' : ''}`}
          onClick={handleCanvasClick}
          aria-label="Composer Canvas. Click to place selected item."
          role="region"
        >
          {selectedId && <div className="absolute top-2 left-2 pointer-events-none text-blue-600 text-sm font-medium animate-pulse">Click canvas to place selected item...</div>}

          <AnimatePresence>
            {placedRecords.map(record => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, x: record.spatialComposerState.x - 40, y: record.spatialComposerState.y - 40 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs text-center p-2 shadow-lg cursor-default border-2 border-white"
                title={`${record.name} (${record.status})`}
              >
                <div className="truncate w-full">{record.name}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
