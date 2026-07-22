import { createMemo, createEffect, onCleanup } from 'solid-js';
import { animate } from 'motion';
import { store, updateRecord, scrubTimeline, restoreCheckpoint, deleteRecord } from '../store';

export default function Workspace() {
  const activeRecord = createMemo(() => store.records.find(r => r.id === store.activeRecordId));

  let boxRef;
  let animationCache = null;

  // Use createEffect with reduced-motion check to perform causal motion when timeline changes
  createEffect(() => {
    const record = activeRecord();
    if (record && boxRef) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const xPos = (record.timelineState / 100) * 300; // Move up to 300px
      const scale = 0.5 + (record.timelineState / 100) * 0.5; // Scale from 0.5 to 1

      if (prefersReducedMotion) {
        boxRef.style.transform = `translateX(${xPos}px) scale(${scale})`;
      } else {
        if (animationCache) animationCache.stop();
        animationCache = animate(boxRef, { x: xPos, scale: scale }, { duration: 0.3, ease: 'easeOut' });
      }
    }
  });

  const handleTitleChange = (e) => {
    if (activeRecord()) {
      updateRecord(activeRecord().id, { title: e.target.value });
    }
  };

  const handleDescriptionChange = (e) => {
    if (activeRecord()) {
      updateRecord(activeRecord().id, { description: e.target.value });
    }
  };

  const handleTimelineChange = (e) => {
    if (activeRecord()) {
      scrubTimeline(activeRecord().id, parseInt(e.target.value, 10));
    }
  };

  const handleUndo = () => {
      if(activeRecord() && activeRecord().history.length > 0) {
          // Restore to the first checkpoint for demonstration of Undo
          restoreCheckpoint(activeRecord().id, 0);
      }
  };

  // Listen for keyboard undo (Ctrl+Z or Cmd+Z)
  createEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });


  return (
    <div class="flex-1 flex flex-col bg-gray-100 overflow-hidden relative">
      {activeRecord() ? (
        <div class="h-full flex flex-col">
          <div class="p-6 bg-white border-b border-gray-200 shadow-sm z-10 flex justify-between items-center">
            <div class="flex-1 max-w-2xl">
              <input
                type="text"
                class="text-2xl font-bold text-gray-900 border-none outline-none w-full bg-transparent focus:bg-gray-50 focus:ring-2 focus:ring-blue-100 rounded px-2 py-1 -ml-2"
                value={activeRecord().title}
                onInput={handleTitleChange}
                aria-label="Scenario Title"
              />
              <textarea
                class="text-sm text-gray-600 mt-2 border border-transparent hover:border-gray-200 outline-none w-full bg-transparent focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-300 rounded p-2 -ml-2 resize-none"
                value={activeRecord().description}
                onInput={handleDescriptionChange}
                rows="2"
                aria-label="Scenario Description"
              />

              {activeRecord().status === 'conflict' && (
                  <div class="mt-2 p-2 bg-red-100 border border-red-300 text-red-800 text-sm rounded">
                      This scenario is in a conflicting state. Please adjust the timeline or title to resolve.
                  </div>
              )}
            </div>

            <div class="flex space-x-2">
                <button
                  class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors"
                  onClick={handleUndo}
                  title="Undo last change (Ctrl+Z)"
                >
                  Undo
                </button>
                <button
                  class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
                  onClick={() => deleteRecord(activeRecord().id)}
                >
                  Archive/Delete
                </button>
            </div>
          </div>

          <div class="flex-1 p-8 flex flex-col items-center justify-center overflow-hidden">

            {/* Visual representation of the item that animates */}
            <div class="w-full max-w-lg h-64 border-2 border-dashed border-gray-300 rounded-xl relative bg-white/50 flex items-center mb-12">
               <div
                 ref={boxRef}
                 class={`w-24 h-24 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-lg ${
                   activeRecord().status === 'ready' ? 'bg-green-500' :
                   activeRecord().status === 'draft' ? 'bg-yellow-500' :
                   activeRecord().status === 'archived' ? 'bg-gray-500' :
                   activeRecord().status === 'conflict' ? 'bg-red-500' :
                   'bg-blue-500'
                 }`}
               >
                 {activeRecord().timelineState}%
               </div>
            </div>

            <div class="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="flex justify-between items-center mb-4">
                <label class="font-semibold text-gray-700">Replay Timeline</label>
                <span class="text-sm text-gray-500 font-mono">{activeRecord().timelineState}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeRecord().timelineState}
                onInput={handleTimelineChange}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                aria-label="Scrub Timeline"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-2 px-1">
                <span>Start</span>
                <span>End</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div class="h-full flex items-center justify-center text-gray-400">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>Select a scenario card to begin editing.</p>
          </div>
        </div>
      )}
    </div>
  );
}
