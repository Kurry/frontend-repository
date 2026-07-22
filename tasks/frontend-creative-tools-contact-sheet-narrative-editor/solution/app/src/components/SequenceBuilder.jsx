import React from 'react';
import { useStore } from '../store.js';

export function SequenceBuilder() {
  const { sequenceSlots, frames, crops, updateSequenceSlot } = useStore();

  return (
    <div className="h-48 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-2 flex flex-col">
      <div className="text-sm font-semibold mb-2">Narrative Sequence (12 Slots)</div>
      <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
        {sequenceSlots.map((slot, index) => {
          const frame = slot.frameId ? frames.find(f => f.id === slot.frameId) : null;
          const crop = frame ? (crops[frame.id] || { rotation: 0 }) : null;

          return (
            <div key={slot.id} className="min-w-[120px] max-w-[120px] flex flex-col border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded overflow-hidden">
              <div className="text-[10px] text-center bg-gray-200 dark:bg-gray-800 py-0.5">{index + 1}</div>
              <div className="flex-1 flex items-center justify-center bg-black relative">
                {frame ? (
                  <img src={frame.url} style={{ transform: `rotate(${crop.rotation || 0}deg)` }} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500">Empty</span>
                )}
              </div>
              <div className="p-1">
                <input
                  type="text"
                  value={slot.caption}
                  onChange={(e) => updateSequenceSlot(slot.id, { caption: e.target.value })}
                  placeholder="Caption..."
                  className="w-full text-xs bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
