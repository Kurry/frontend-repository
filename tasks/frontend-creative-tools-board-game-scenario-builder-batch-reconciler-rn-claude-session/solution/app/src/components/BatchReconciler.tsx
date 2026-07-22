import { useState } from 'react';
import { useStore } from '../store';

interface BatchReconcilerProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function BatchReconciler({ selectedIds, onClearSelection }: BatchReconcilerProps) {
  const batchReconcile = useStore((state) => state.batchReconcile);
  const undoLastMutation = useStore((state) => state.undoLastMutation);
  const historyLength = useStore((state) => state.history.length);
  const derived = useStore((state) => state.derived);

  const [newStatus, setNewStatus] = useState<string>('ready');

  const handleReconcile = () => {
    if (selectedIds.length === 0) return;
    batchReconcile(selectedIds, newStatus as any);
    onClearSelection();
  };

  return (
    <div className="bg-white p-6 border-l border-gray-200 shadow-xl flex flex-col h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Batch Reconciler</h2>

      <div className="flex-1 flex flex-col gap-6">
        {/* Actions section */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <h3 className="font-semibold mb-3 text-sm text-gray-700">Mutation</h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="batch-status">New Status for Selected Cards</label>
              <select
                id="batch-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white"
                disabled={selectedIds.length === 0}
              >
                <option value="empty">Empty</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <button
              onClick={handleReconcile}
              disabled={selectedIds.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
            >
              Reconcile Aggregate Totals ({selectedIds.length} selected)
            </button>

            <button
              onClick={undoLastMutation}
              disabled={historyLength === 0}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
            >
              Undo Last Mutation
            </button>
          </div>
        </div>

        {/* Derived State section */}
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h3 className="font-semibold mb-3 text-sm text-blue-900">Derived Decision State</h3>

          {derived.lastBatchTime ? (
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex justify-between border-b border-blue-200 pb-1">
                <span>Last Batch Size:</span>
                <span className="font-bold">{derived.lastBatchSize}</span>
              </div>
              <div className="flex justify-between border-b border-blue-200 pb-1">
                <span>Avg Difficulty:</span>
                <span className="font-bold">{derived.lastBatchAvgDifficulty}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Last Reconciled:</span>
                <span className="text-xs text-blue-600">{new Date(derived.lastBatchTime).toLocaleTimeString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-blue-600 italic">No reconciliation performed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
