import React, { useState } from 'react';
import { cn, slotToTime, calculateDemand } from '../lib/utils';
import { motion } from 'framer-motion';

export function TimeCanvas({
  blocks,
  tasks,
  appointments,
  breaks,
  capacityCurve,
  onBlockPlace,
  draggedTask
}) {
  const [previewSlot, setPreviewSlot] = useState(null);
  const slots = Array.from({ length: 48 }, (_, i) => i);

  const handleDrop = (slot) => {
    if (!draggedTask) return;
    const dur = draggedTask.splittable ? draggedTask.minChunk : draggedTask.duration;
    onBlockPlace({
      id: Date.now().toString(),
      taskId: draggedTask.id,
      start: slot,
      duration: dur,
      locked: false,
      chunkIndex: 0
    });
    setPreviewSlot(null);
  };

  const handleDragOver = (e, slot) => {
    e.preventDefault();
    if (previewSlot !== slot) {
      setPreviewSlot(slot);
    }
  };

  const adjustedCapacity = [...capacityCurve];
  breaks.forEach(br => {
    if (br.duration >= 1) {
      const endSlot = br.start + br.duration;
      if (endSlot < 48) adjustedCapacity[endSlot] = Math.min(10, adjustedCapacity[endSlot] + 1);
      if (endSlot + 1 < 48) adjustedCapacity[endSlot + 1] = Math.min(10, adjustedCapacity[endSlot + 1] + 1);
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-xl border shadow-sm overflow-hidden p-4">
      <h2 className="font-semibold text-lg mb-4">Capacity Time-Block Canvas</h2>

      <div className="flex-1 overflow-y-auto relative border border-gray-100">
        {slots.map(slot => {
          const demand = calculateDemand(blocks, tasks, slot);
          const capacity = adjustedCapacity[slot];
          const overload = demand > capacity;

          return (
            <div
              key={slot}
              onDragOver={(e) => handleDragOver(e, slot)}
              onDrop={() => handleDrop(slot)}
              className={cn(
                "flex items-stretch border-b border-gray-50 h-10 relative",
                slot % 4 === 0 && "border-t border-gray-200"
              )}
            >
              <div className="w-16 flex-shrink-0 text-xs text-gray-400 p-1 bg-gray-50 border-r">
                {slot % 4 === 0 ? slotToTime(slot) : ''}
              </div>

              <div className="flex-1 relative bg-gray-50/50">
                <div
                  className={cn(
                    "absolute bottom-0 top-0 left-0 bg-blue-100 opacity-20",
                    overload && "bg-red-200 opacity-40"
                  )}
                  style={{ width: `${(capacity / 10) * 100}%` }}
                />

                {demand > 0 && (
                  <div
                    className={cn(
                      "absolute bottom-2 top-2 left-0 rounded-r-md z-10",
                      overload ? "bg-red-500" : "bg-blue-500"
                    )}
                    style={{ width: `${(demand / 10) * 100}%` }}
                  />
                )}

                {previewSlot === slot && draggedTask && (
                  <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500/50 border-dashed z-20 pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}

        {appointments.map(a => (
          <div
            key={a.id}
            className="absolute right-0 w-1/4 bg-purple-100 border-l-4 border-purple-500 flex items-center justify-center text-xs font-semibold text-purple-700 opacity-80"
            style={{ top: `${a.start * 2.5}rem`, height: `${a.duration * 2.5}rem` }}
          >
            {a.title}
          </div>
        ))}

        {breaks.map(b => (
          <div
            key={b.id}
            className="absolute left-16 right-1/4 bg-green-50/80 border-y border-green-200 flex items-center px-2 text-xs text-green-600 opacity-80"
            style={{ top: `${b.start * 2.5}rem`, height: `${b.duration * 2.5}rem` }}
          >
            Break: {b.title}
          </div>
        ))}

        {blocks.map(b => {
          const task = tasks.find(t => t.id === b.taskId);
          if (!task) return null;

          return (
            <motion.div
              layout
              key={b.id}
              className={cn(
                "absolute left-16 right-1/4 bg-white border-2 rounded shadow-md z-30 p-2 cursor-pointer",
                b.locked ? "border-gray-400 bg-gray-100" : "border-blue-500"
              )}
              style={{ top: `${b.start * 2.5}rem`, height: `${b.duration * 2.5}rem` }}
            >
              <div className="font-semibold text-sm">{task.title}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>{b.duration * 15}m</span>
                {b.locked && <span>🔒 Locked</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
