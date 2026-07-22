import React from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export function ReplayTimeline() {
  const { records, selectedRecordId, recordHistories, restoreCheckpoint, mutateRecordWithHistory, globalUndo } = useStore();

  const record = records.find(r => r.id === selectedRecordId);
  const history = recordHistories[selectedRecordId] || (record ? [{ timestamp: Date.now(), state: record }] : []);

  if (!record) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-gray-500">Select an ingredient to view and scrub its timeline.</p>
      </div>
    );
  }

  const handleTimelineScrub = (e) => {
    const value = parseInt(e.target.value, 10);
    // When scrubbing, we restore checkpoint immediately
    restoreCheckpoint(record.id, value);
  };

  const handleEdit = (field, value) => {
    // This represents a meaningful mutation that adds to history
    // We update timelineState to changed/conflict depending on logic, let's keep it simple
    mutateRecordWithHistory(record.id, { [field]: value, timelineState: 'changed', status: 'changed' });
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{record.name}</h2>
          <p className="text-sm text-gray-500">Timeline State: <span className="font-semibold text-indigo-600 capitalize">{record.timelineState}</span></p>
        </div>
        <button
          onClick={globalUndo}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Undo Last Mutation
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-1 relative overflow-hidden">
        <h3 className="text-lg font-medium mb-4">Edit & Mutate</h3>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${record.id}-${record.timelineState}-${history.length}`} // Key changes on mutation to trigger motion
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4 mb-8"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Substitution Value</label>
              <input
                type="text"
                value={record.substitution}
                onChange={(e) => handleEdit('substitution', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-4">
               <div className="flex-1">
                 <label className="block text-sm font-medium text-gray-700">Quantity</label>
                 <input
                   type="text"
                   value={record.quantity}
                   onChange={(e) => handleEdit('quantity', e.target.value)}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"
                 />
               </div>
               <div className="flex-1">
                 <label className="block text-sm font-medium text-gray-700">Set Status (Conflict/Resolve)</label>
                 <select
                   value={record.timelineState}
                   onChange={(e) => handleEdit('timelineState', e.target.value)}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"
                 >
                   <option value="idle">Idle</option>
                   <option value="selected">Selected</option>
                   <option value="changed">Changed</option>
                   <option value="conflict">Conflict</option>
                   <option value="resolved">Resolved</option>
                 </select>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto border-t pt-6">
          <h3 className="text-lg font-medium mb-2">Replay Timeline Scrub</h3>
          <p className="text-sm text-gray-500 mb-4">Drag the slider to restore a prior checkpoint.</p>

          {history.length > 0 ? (
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max={Math.max(0, history.length - 1)}
                value={history.length - 1} // Currently at the end of the history array
                onChange={handleTimelineScrub}
                className="w-full cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>Start</span>
                <span>{history.length} checkpoints</span>
                <span>Current</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">No history recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
