import React from 'react';
import { useStore } from '../store';

export const ComparisonReview: React.FC = () => {
  const { branch, setBranch, recordDecision, history } = useStore();

  const branches = ['Shallow Draft', 'Balanced Reveal'];

  return (
    <div className="p-4 bg-white border-t text-sm flex gap-6">
      <div className="flex-1">
        <h3 className="font-semibold mb-2">Comparison Branch</h3>
        <select
          className="border p-1 text-sm w-full"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        >
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <div className="mt-4 flex gap-2">
          <button
            className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 text-xs"
            onClick={() => {
              recordDecision({
                id: `decision-${Date.now()}`,
                status: 'working',
                rationale: 'the deeper coral window keeps the center silhouette while balancing the side reveals',
                confidence: 'working',
                sourceIds: ['paper-coral-r3', 'scene-symbolic-window-r5'],
                revisionId: 'r1'
              });
            }}
          >
            Record Decision
          </button>
        </div>
      </div>

      <div className="flex-1 border-l pl-4">
        <h3 className="font-semibold mb-2">History & Approval</h3>
        <div className="text-xs text-gray-600 max-h-24 overflow-y-auto">
          {history.map(h => (
            <div key={h.id}>
              [{h.id}] {h.kind} ({h.stateHash})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
