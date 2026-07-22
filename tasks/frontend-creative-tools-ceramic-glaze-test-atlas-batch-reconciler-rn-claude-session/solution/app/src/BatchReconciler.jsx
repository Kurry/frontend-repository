import React, { useState } from 'react';
import { useStore } from './store';
import { Layers, Undo, AlertCircle } from 'lucide-react';

export default function BatchReconciler({ selectedIds, clearSelection }) {
  const { reconcileBatch, undo, history, derived } = useStore();
  const [batchName, setBatchName] = useState('');
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleGroup = () => {
    if (selectedIds.length === 0) {
      setError('Select at least one record to group.');
      return;
    }
    if (!batchName.trim()) {
      setError('Batch name is required.');
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      reconcileBatch(selectedIds, batchName);
      setBatchName('');
      setError('');
      clearSelection();
      setIsAnimating(false);
    }, 300); // Wait for animation
  };

  return (
    <div className="bg-slate-50 rounded-lg shadow border border-slate-200 p-4 w-full md:w-80 shrink-0 flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Layers size={20} /> Batch Reconciler
          </h2>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="text-slate-500 hover:text-slate-800 disabled:opacity-50 p-1 rounded"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo size={18} />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Group selected records into a batch and reconcile aggregate totals.
        </p>

        <div className={`bg-white p-3 rounded border border-slate-200 mb-4 transform transition-all duration-300 ease-in-out ${isAnimating ? 'scale-105 shadow-md border-indigo-300 motion-reduce:transform-none motion-reduce:transition-none' : ''}`}>
          <div className="text-sm text-slate-500 mb-1">Selected for batch</div>
          <div className="text-2xl font-bold text-slate-800">{selectedIds.length}</div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            placeholder="Batch Name"
            value={batchName}
            onChange={e => setBatchName(e.target.value)}
            className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-3 flex items-center gap-1" aria-live="polite">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          onClick={handleGroup}
          className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 transition-colors"
        >
          Group into Batch
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Derived Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Tests</span>
            <span className="font-medium">{derived.summary.totalTests}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Batched Tests</span>
            <span className="font-medium">{derived.summary.testsInBatches}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Batches</span>
            <span className="font-medium">{derived.summary.totalBatches}</span>
          </div>
          {derived.summary.latestBatchName && (
            <div className={`flex justify-between mt-2 pt-2 border-t border-slate-100 transition-all duration-300 ${isAnimating ? 'opacity-50 motion-reduce:opacity-100 motion-reduce:transition-none' : 'opacity-100'}`}>
              <span className="text-slate-500 text-xs">Latest: {derived.summary.latestBatchName}</span>
              <span className="font-medium text-xs">{derived.summary.latestBatchTotal}g</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
