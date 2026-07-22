import React from 'react';
import { useAppState, useAppDispatch } from '../store';
import { exportArtifacts } from '../webmcp';

export default function ReviewClose() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="border p-4 mb-4 rounded bg-white" data-testid="review-close">
      <h2 className="text-xl font-bold mb-2">Review Close & Late Evidence</h2>
      <div className="text-sm mb-4">Status: {state.closed ? 'Closed' : 'Open'}</div>

      <div className="flex space-x-2">
        {!state.closed && (
          <button
            className="bg-red-500 text-white px-3 py-1 rounded"
            onClick={() => dispatch({ type: 'CLOSE_REVIEW' })}
          >
            Close Review
          </button>
        )}
        {state.closed && (
          <button
            className="bg-yellow-500 text-white px-3 py-1 rounded"
            onClick={() => dispatch({ type: 'REBASE_REVIEW' })}
          >
            Rebase (Late Evidence)
          </button>
        )}
        <button
          className="bg-gray-800 text-white px-3 py-1 rounded"
          onClick={() => exportArtifacts(state)}
        >
          Export Artifacts
        </button>
      </div>
    </div>
  );
}
