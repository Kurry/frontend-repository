import React, { useRef, useState, useEffect } from 'react';
import { useStore, store } from '../store';
import { motion, useReducedMotion } from 'framer-motion';

export default function SpatialComposer() {
  const records = useStore(s => s.records);
  const selectedRecordId = useStore(s => s.selectedRecordId);
  const spatialGeometry = useStore(s => s.spatialGeometry);
  const filter = useStore(s => s.filter);
  const containerRef = useRef(null);

  const prefersReducedMotion = useReducedMotion();

  const handleDragEnd = (id, event, info) => {
    // Snap to grid
    const snap = 120;
    const currentPos = spatialGeometry[id] || { x: 0, y: 0 };
    const x = Math.round((currentPos.x + info.offset.x) / snap) * snap;
    const y = Math.round((currentPos.y + info.offset.y) / snap) * snap;

    // Boundary check (prevent moving completely out of bounds for basic safety)
    const boundedX = Math.max(0, x);
    const boundedY = Math.max(0, y);

    store.dispatch({
      type: 'MOVE_RECORD',
      payload: { id, x: boundedX, y: boundedY }
    });
  };

  const visibleRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex-1 bg-slate-100 overflow-auto relative p-8 h-full" ref={containerRef}>
      <div className="min-w-[1200px] min-h-[1200px] relative">
        {visibleRecords.map(record => {
          const isSelected = record.id === selectedRecordId;
          const pos = spatialGeometry[record.id] || { x: 0, y: 0 };

          return (
            <motion.div
              key={record.id}
              className={`absolute w-[100px] h-[100px] p-2 rounded shadow-sm border-2 cursor-grab active:cursor-grabbing flex flex-col justify-center items-center text-center select-none ${
                isSelected
                  ? 'bg-blue-50 border-blue-500 z-10 shadow-md'
                  : 'bg-white border-slate-200 z-0'
              } ${
                record.status === 'changed' ? 'ring-2 ring-amber-400 ring-offset-1' : ''
              }`}
              animate={prefersReducedMotion ? false : { x: pos.x, y: pos.y }}
              style={prefersReducedMotion ? { left: pos.x, top: pos.y } : {}}
              drag
              dragMomentum={false}
              onDragEnd={(e, info) => handleDragEnd(record.id, e, info)}
              onPointerDown={(e) => {
                  e.stopPropagation();
                  store.dispatch({ type: 'SELECT_RECORD', payload: record.id });
              }}
              // Keyboard equivalent for accessibility
              tabIndex={0}
              onKeyDown={(e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                     store.dispatch({ type: 'SELECT_RECORD', payload: record.id });
                 }
                 if (!isSelected) return;
                 const step = 120;
                 let newX = pos.x;
                 let newY = pos.y;
                 if (e.key === 'ArrowRight') newX += step;
                 if (e.key === 'ArrowLeft') newX = Math.max(0, newX - step);
                 if (e.key === 'ArrowDown') newY += step;
                 if (e.key === 'ArrowUp') newY = Math.max(0, newY - step);

                 if (newX !== pos.x || newY !== pos.y) {
                    e.preventDefault();
                    store.dispatch({ type: 'MOVE_RECORD', payload: { id: record.id, x: newX, y: newY } });
                 }
              }}
            >
              <div className="font-semibold text-sm truncate w-full text-slate-800">{record.name}</div>
              <div className="text-xs text-slate-500 mt-1">{record.type}</div>
              <div className="mt-2 text-xs font-medium text-slate-400">Cap: {record.capacity}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
