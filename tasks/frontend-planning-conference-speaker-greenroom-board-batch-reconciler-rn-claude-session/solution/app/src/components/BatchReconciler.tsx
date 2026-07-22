import React from 'react';
import { useStore } from '../store';
import { CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react';

export const BatchReconciler: React.FC = () => {
  const { records, selectedIds, reconcileBatch, undo, pastStates } = useStore();

  const selectedRecords = records.filter(r => selectedIds.has(r.id));
  const hasSelection = selectedRecords.length > 0;

  const totalDuration = selectedRecords.reduce((acc, r) => acc + r.durationMinutes, 0);

  // Conflict detection: overlap checks or archiving conflicts could go here
  const hasConflicts = selectedRecords.some(r => r.status === 'archived');
  const conflictMessage = hasConflicts ? "Cannot reconcile archived slots." : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Batch Reconciler</h2>
        {pastStates.length > 0 && (
          <button
            onClick={undo}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            title="Undo last mutation"
          >
            <RotateCcw size={16} /> Undo
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {!hasSelection ? (
          <div className="text-center text-gray-500 py-8">
            <HelpCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Select slots from the collection to group them into a batch and reconcile aggregate totals.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-900 mb-2">Selection Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-indigo-600">Selected Slots</p>
                  <p className="text-2xl font-semibold text-indigo-700">{selectedRecords.length}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600">Total Duration</p>
                  <p className="text-2xl font-semibold text-indigo-700">{totalDuration} <span className="text-sm font-normal">min</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview Changes</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  Status will change to <strong>ready</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  Selection will be cleared
                </li>
              </ul>
            </div>

            {hasConflicts && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md">
                {conflictMessage}
              </div>
            )}

            <button
              disabled={hasConflicts}
              onClick={reconcileBatch}
              className={`w-full py-3 rounded-md font-medium text-white shadow-sm transition-colors ${
                hasConflicts
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Reconcile Batch
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
