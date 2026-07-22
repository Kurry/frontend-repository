import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/Store';
import { FastForward, Rewind, PlayCircle, History } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const ReplayTimeline = () => {
  const { state, scrubTimeline } = useStore();
  const trackRef = useRef<HTMLDivElement>(null);

  const selectedRecord = state.records.find(r => r.id === state.selectedRecordId);

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-950 p-8">
        <div className="text-stone-500 flex flex-col items-center gap-4 text-center">
          <History size={48} className="opacity-20" />
          <p className="text-lg font-medium">No Layer Selected</p>
          <p className="text-sm">Select a sound layer to view and scrub its timeline.</p>
        </div>
      </div>
    );
  }

  const checkpoints = selectedRecord.checkpoints;
  const currentIdx = checkpoints.findIndex(c => c.id === selectedRecord.currentCheckpointId);
  const progress = checkpoints.length > 1 ? (currentIdx / (checkpoints.length - 1)) * 100 : 0;

  const handleCheckpointClick = (checkpointId: string) => {
    scrubTimeline(selectedRecord.id, checkpointId);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ready': return 'bg-emerald-500';
      case 'changed': return 'bg-amber-500';
      case 'draft': return 'bg-indigo-500';
      case 'empty': return 'bg-stone-500';
      case 'archived': return 'bg-rose-500';
      default: return 'bg-stone-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-stone-950 p-4 md:p-8 min-w-0 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-100 truncate">{selectedRecord.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Current Status:</span>
          <span className={twMerge("px-2 py-0.5 rounded text-xs font-medium text-white shadow-sm", getStatusColor(selectedRecord.status))}>
            {selectedRecord.status}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto">
        <div className="relative" ref={trackRef}>
          {/* Track background */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-stone-800 -translate-y-1/2 rounded-full overflow-hidden">
             <div
                className="h-full bg-indigo-600 transition-all duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
             />
          </div>

          {/* Checkpoints */}
          <div className="relative flex justify-between items-center z-10">
            {checkpoints.map((cp, idx) => {
              const isCurrent = cp.id === selectedRecord.currentCheckpointId;
              const isPast = idx <= currentIdx;

              return (
                <div key={cp.id} className="relative group flex flex-col items-center">
                  <button
                    onClick={() => handleCheckpointClick(cp.id)}
                    className={twMerge(
                      "w-6 h-6 rounded-full border-4 transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:hover:scale-100 flex items-center justify-center cursor-pointer hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-950 focus:ring-indigo-500",
                      isCurrent ? "bg-white border-indigo-500 scale-125" :
                      isPast ? "bg-indigo-500 border-stone-900" : "bg-stone-800 border-stone-900"
                    )}
                    aria-label={`Scrub to ${cp.status}`}
                  />

                  {/* Tooltip */}
                  <div className="absolute top-8 w-max opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none bg-stone-800 text-stone-200 text-xs px-2 py-1 rounded shadow-lg pointer-events-none text-center z-20">
                    <div className="font-semibold capitalize text-indigo-300">{cp.status}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{cp.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 flex items-center justify-center gap-6">
          <button
            onClick={() => {
              if (currentIdx > 0) handleCheckpointClick(checkpoints[currentIdx - 1].id);
            }}
            disabled={currentIdx === 0}
            className="p-3 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Rewind size={24} />
          </button>

          <button className="p-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20">
            <PlayCircle size={32} />
          </button>

          <button
            onClick={() => {
              if (currentIdx < checkpoints.length - 1) handleCheckpointClick(checkpoints[currentIdx + 1].id);
            }}
            disabled={currentIdx === checkpoints.length - 1}
            className="p-3 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <FastForward size={24} />
          </button>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          Scrub the timeline to restore prior checkpoints. Linked views will update instantly.
        </p>
      </div>
    </div>
  );
};
