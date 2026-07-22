import React, { useState } from 'react';
import { useStore } from '../Store';
import { motion, AnimatePresence } from 'framer-motion';

const LANES = ['Hour 1', 'Hour 2', 'Hour 3'];

export function ConstraintCanvas() {
  const { state, dispatch } = useStore();
  const activeRecords = state.records.filter(r => r.status !== 'archived');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<string | null>(null);

  const getLaneRecords = (lane: string) => activeRecords.filter(r => r.lane === lane);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, lane: string) => {
    e.preventDefault();
    setDragOverLane(lane);
  };

  const handleDragLeave = () => {
    setDragOverLane(null);
  };

  const handleDrop = (e: React.DragEvent, targetLane: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setDraggedId(null);
    setDragOverLane(null);
    if (!id) return;

    const record = activeRecords.find(r => r.id === id);
    if (!record) return;

    const laneRecords = getLaneRecords(targetLane);
    const hasConflict = laneRecords.length > 0 && laneRecords[0].id !== id;

    const newStatus = hasConflict ? 'changed' : 'ready';

    dispatch({
      type: 'UPDATE',
      payload: { ...record, lane: targetLane, status: newStatus }
    });
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 bg-gray-50 flex gap-4 h-full">
      {LANES.map(lane => {
        const laneRecords = getLaneRecords(lane);
        const isOver = dragOverLane === lane;
        const hasConflict = laneRecords.length > 1;

        return (
          <div
            key={lane}
            onDragOver={(e) => handleDragOver(e, lane)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, lane)}
            className={`flex-1 min-w-[250px] flex flex-col gap-3 p-4 rounded-xl transition-colors border-2 ${
              isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-100 border-transparent'
            }`}
          >
            <div className="flex justify-between items-center text-sm font-semibold text-gray-600 mb-2">
              <span>{lane}</span>
              {hasConflict && <span className="text-red-500 text-xs">Conflict</span>}
            </div>

            <AnimatePresence>
              {laneRecords.map(record => (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, record.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`p-3 rounded-lg shadow-sm border bg-white cursor-grab active:cursor-grabbing ${
                    record.status === 'changed' || hasConflict ? 'border-red-400 border-l-4 shadow-red-100' :
                    record.status === 'ready' ? 'border-green-400 border-l-4' :
                    'border-gray-200 border-l-4'
                  } ${draggedId === record.id ? 'opacity-50' : ''}`}
                >
                  <div className="font-medium text-gray-800">{record.title}</div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{record.duration} min</span>
                    <span className="capitalize">{record.status}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {laneRecords.length === 0 && (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-400 text-sm text-center">
                Drag activities here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
