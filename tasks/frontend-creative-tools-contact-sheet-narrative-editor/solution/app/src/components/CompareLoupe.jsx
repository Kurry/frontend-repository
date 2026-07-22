import React from 'react';
import { useStore } from '../store.js';

export function CompareLoupe() {
  const { compareIds, frames, crops, setCrop } = useStore();

  if (compareIds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500">
        Select frames to compare
      </div>
    );
  }

  const compareFrames = compareIds.map(id => frames.find(f => f.id === id)).filter(Boolean);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium">
        Compare Loupe ({compareFrames.length})
      </div>
      <div className={`flex-1 grid gap-1 p-1 bg-gray-900 ${
        compareFrames.length === 1 ? 'grid-cols-1' :
        compareFrames.length === 2 ? 'grid-cols-2' :
        compareFrames.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
      }`}>
        {compareFrames.map(frame => {
          const crop = crops[frame.id] || { rotation: 0 };
          return (
            <div key={frame.id} className="relative bg-black flex items-center justify-center overflow-hidden">
              <img
                src={frame.url}
                alt={frame.id}
                style={{ transform: `rotate(${crop.rotation || 0}deg)` }}
                className="max-w-full max-h-full object-contain transition-transform"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex gap-2">
                <span>{frame.id}</span>
                <button onClick={() => setCrop(frame.id, { ...crop, rotation: ((crop.rotation || 0) + 90) % 360 })} className="underline">Rotate</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
