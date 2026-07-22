import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Undo2 } from 'lucide-react';

export function SpatialComposer({ records, selectedRecordId, onPlace, onUndo, canUndo }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const gridSize = 10;
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => ({
    x: i % gridSize,
    y: Math.floor(i / gridSize)
  }));

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const handleCellClick = (x, y) => {
    if (selectedRecordId) {
      // Signature mutation: place a selected record in a spatial composer and rebalance capacity
      // For demonstration, we simply increase capacity slightly upon placement
      onPlace(selectedRecordId, { x, y }, selectedRecord.capacity + 5);
    }
  };

  const handleKeyDown = (e, x, y) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(x, y);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative p-8">

      <div className="absolute top-6 left-6 flex items-center gap-4">
        <h2 className="text-slate-300 font-medium tracking-widest text-sm uppercase">Spatial Composer</h2>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          aria-label="Undo last action"
        >
          <Undo2 size={16} />
          <span>Undo</span>
        </button>
      </div>

      <div className="absolute top-6 right-6">
        {selectedRecord ? (
          <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-lg flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
             <div>
               <div className="text-xs text-slate-400 uppercase tracking-wider">Selected Tool</div>
               <div className="text-slate-200 font-medium">{selectedRecord.name}</div>
             </div>
          </div>
        ) : (
          <div className="text-slate-500 text-sm">Select a segment to place</div>
        )}
      </div>

      <div
        className="grid gap-1 p-4 bg-slate-900/50 rounded-xl border border-slate-800 shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Spatial composer canvas"
      >
        {cells.map(cell => {
          const placedRecord = records.find(r => r.composerPosition?.x === cell.x && r.composerPosition?.y === cell.y);

          return (
            <div
              key={`${cell.x}-${cell.y}`}
              role="gridcell"
              tabIndex={0}
              onClick={() => handleCellClick(cell.x, cell.y)}
              onKeyDown={(e) => handleKeyDown(e, cell.x, cell.y)}
              onMouseEnter={() => setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
              className={clsx(
                "w-12 h-12 rounded-md transition-all cursor-pointer relative",
                placedRecord ? (
                  placedRecord.status === 'conflict' ? "bg-red-900/40 border-red-500 border-2" :
                  placedRecord.status === 'changed' ? "bg-blue-900/40 border-blue-500 border-2" :
                  "bg-indigo-900/40 border-indigo-500 border-2"
                ) : (
                  "bg-slate-800/30 border border-slate-700 hover:bg-slate-700 hover:border-slate-500"
                ),
                selectedRecordId && !placedRecord && hoveredCell?.x === cell.x && hoveredCell?.y === cell.y && "bg-indigo-900/20 border-indigo-400 border-dashed"
              )}
            >
              {placedRecord && (
                <motion.div
                  layoutId={`record-${placedRecord.id}`}
                  initial={false}
                  animate={{ scale: 1 }}
                  className="absolute inset-1 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
                  style={{
                    backgroundColor: placedRecord.status === 'conflict' ? '#ef4444' : placedRecord.status === 'changed' ? '#3b82f6' : '#6366f1'
                  }}
                >
                  {placedRecord.capacity}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
