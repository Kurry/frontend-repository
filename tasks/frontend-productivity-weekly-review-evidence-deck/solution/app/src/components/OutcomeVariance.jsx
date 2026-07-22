import React from 'react';
import { useAppState, useAppDispatch } from '../store';

export default function OutcomeVariance() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { commitments, outcomes } = state;

  return (
    <div className="border p-4 mb-4 rounded bg-white" data-testid="outcome-variance">
      <h2 className="text-xl font-bold mb-2">Outcome & Variance Classification</h2>
      <div className="space-y-4">
        {commitments.slice(0, 5).map(c => {
          const outcome = outcomes.find(o => o.commitmentId === c.id);
          return (
            <div key={c.id} className="border p-2">
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm">Current Status: {outcome ? outcome.class : 'unverified'}</div>
              <div className="mt-2 flex space-x-2">
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded"
                  onClick={() => dispatch({
                    type: 'CLASSIFY_OUTCOME',
                    payload: { commitmentId: c.id, class: 'completed', variance: { scope: 0, duration: 0 } }
                  })}
                >
                  Mark Completed
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
