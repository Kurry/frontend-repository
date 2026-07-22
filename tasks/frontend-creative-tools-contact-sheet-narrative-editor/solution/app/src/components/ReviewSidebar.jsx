import React from 'react';
import { useStore } from '../store.js';

export function ReviewSidebar() {
  const { selectedFrameIds, decisions, setDecision, reviewState, approveReview } = useStore();

  const handleDecision = (field, value) => {
    selectedFrameIds.forEach(id => {
      setDecision(id, { [field]: value });
    });
  };

  return (
    <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-4 overflow-y-auto">
      <div>
        <h3 className="font-bold mb-2">Decisions ({selectedFrameIds.length})</h3>
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={() => handleDecision('rating', star)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 py-1 rounded">
              {star}★
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={() => handleDecision('flag', 'pick')} className="flex-1 bg-green-100 text-green-800 py-1 rounded">Pick</button>
          <button onClick={() => handleDecision('flag', 'reject')} className="flex-1 bg-red-100 text-red-800 py-1 rounded">Reject</button>
        </div>
        <select onChange={(e) => handleDecision('cullReason', e.target.value)} className="w-full mt-2 text-sm p-1 bg-gray-50 border rounded">
          <option value="">Cull Reason...</option>
          <option value="duplicate">Duplicate</option>
          <option value="focus">Focus</option>
          <option value="exposure">Exposure</option>
        </select>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-bold mb-2">Review & Approve</h3>
        {reviewState.stale && <div className="text-yellow-600 text-xs mb-2">⚠️ Changes made since last approval</div>}
        <button
          onClick={approveReview}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Approve Edit
        </button>
      </div>
    </div>
  );
}
