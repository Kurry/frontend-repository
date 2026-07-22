import React from 'react';
import { useAppState, useAppDispatch } from '../store';

export default function Branches() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { branches, commitments } = state;

  return (
    <div className="border p-4 mb-4 rounded bg-white" data-testid="branches">
      <h2 className="text-xl font-bold mb-2">Carry-forward Scenarios</h2>
      <div className="mb-4">
        <button
          className="bg-purple-500 text-white px-3 py-1 rounded"
          onClick={() => dispatch({
            type: 'BRANCH_SCENARIO',
            payload: { id: `branch-${Date.now()}`, type: 'defer', commitmentId: commitments[0].id }
          })}
        >
          Create Defer Branch
        </button>
      </div>
      <div className="space-y-2">
        {branches.map(b => {
          const commit = commitments.find(c => c.id === b.commitmentId);
          return (
            <div key={b.id} className="border p-2">
              <div className="font-semibold">Branch: {b.id}</div>
              <div className="text-sm">Action: {b.type}</div>
              <div className="text-sm">Target: {commit?.title}</div>
            </div>
          );
        })}
        {branches.length === 0 && <div className="text-sm text-gray-500">No branches created yet.</div>}
      </div>
    </div>
  );
}
