import React from 'react';
import { useStore } from '../store';

export const ActionPanel = () => {
  const clock = useStore(state => state.clock);
  const advanceClock = useStore(state => state.advanceClock);
  const dispatchTasks = useStore(state => state.dispatchTasks);
  const tasks = useStore(state => state.tasks);
  const addBranch = useStore(state => state.addBranch);
  const approveBranch = useStore(state => state.approveBranch);
  const activeBranchId = useStore(state => state.activeBranchId);
  const createHandoff = useStore(state => state.createHandoff);
  const revokeHandoff = useStore(state => state.revokeHandoff);
  const handoffs = useStore(state => state.handoffs);

  return (
    <div className="mt-4 border p-4 bg-white rounded shadow-sm flex flex-col gap-4">
      <div className="flex gap-4 items-center flex-wrap">
        <div className="font-bold">Clock: Day {clock}</div>
        <button className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors" onClick={advanceClock}>Advance Clock</button>
        <button
          className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 transition-colors"
          onClick={() => dispatchTasks(tasks.map(t => t.id))}
        >
          Dispatch Previews
        </button>
      </div>

      <div className="flex gap-4 items-center flex-wrap border-t pt-2">
        <button
          className="px-3 py-1 bg-teal-500 text-white rounded text-sm hover:bg-teal-600 transition-colors"
          onClick={() => {
            const bId = `branch-${Date.now()}`;
            addBranch({ id: bId, name: 'Scope Branch', status: 'pending' });
            useStore.setState({ activeBranchId: bId });
          }}
        >
          Create Branch
        </button>
        {activeBranchId && (
          <button
            className="px-3 py-1 bg-teal-700 text-white rounded text-sm hover:bg-teal-800 transition-colors"
            onClick={() => {
              approveBranch(activeBranchId);
              useStore.setState({ activeBranchId: null });
            }}
          >
            Approve Branch
          </button>
        )}
      </div>

      <div className="flex gap-4 items-center flex-wrap border-t pt-2">
        <button
          className="px-3 py-1 bg-pink-500 text-white rounded text-sm hover:bg-pink-600 transition-colors"
          onClick={() => createHandoff({ type: 'partial' })}
        >
          Partial Handoff
        </button>
        {handoffs.map(h => (
          <button
            key={h.id}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
            onClick={() => revokeHandoff(h.id)}
          >
            Revoke Handoff {h.id.split('-')[1]}
          </button>
        ))}
      </div>
    </div>
  );
};
