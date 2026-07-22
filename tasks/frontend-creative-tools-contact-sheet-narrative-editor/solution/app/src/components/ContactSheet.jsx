import React from 'react';
import { useStore } from '../store.js';

export function ContactSheet() {
  const { frames, bursts, selectedFrameIds, toggleSelection, setCompareIds, decisions } = useStore();

  const handleFrameClick = (frameId, e) => {
    if (e.shiftKey) {
      // Basic shift logic for compare
      const currentSelected = selectedFrameIds.includes(frameId)
        ? selectedFrameIds.filter(id => id !== frameId)
        : [...selectedFrameIds, frameId];
      setCompareIds(currentSelected);
    }
    toggleSelection(frameId);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold mb-4">Contact Sheet</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {frames.map(frame => {
          const isSelected = selectedFrameIds.includes(frame.id);
          const decision = decisions[frame.id] || {};
          const isRepresentative = frame.burstId && bursts[frame.burstId]?.representativeId === frame.id;

          return (
            <div
              key={frame.id}
              onClick={(e) => handleFrameClick(frame.id, e)}
              className={`relative cursor-pointer aspect-video bg-gray-200 border-2 ${
                isSelected ? 'border-blue-500' : 'border-transparent'
              } ${decision.flag === 'reject' ? 'opacity-50 grayscale' : ''}`}
            >
              <img src={frame.url} alt={frame.id} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 flex justify-between">
                <span>{frame.id}</span>
                <span>{decision.rating || 0}★</span>
              </div>
              {isRepresentative && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">REP</div>
              )}
              {frame.burstId && !isRepresentative && (
                <div className="absolute top-1 left-1 bg-gray-600 text-white text-[10px] font-bold px-1 rounded">B</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
