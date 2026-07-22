import React, { useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export default function BatchReconciler() {
  const { selectedBookIds, batchReconcilerState, aggregateTotals, history, reconcileBatch, undoReconcile } = useStore();
  const [targetStatus, setTargetStatus] = useState('ready');

  const selectedCount = selectedBookIds.length;
  const isIdle = batchReconcilerState === 'idle';

  return (
    <div className="flex flex-col gap-6">
      {/* Undo Section */}
      {history.length > 0 && (
        <div className="flex justify-between items-center bg-yellow-50 border border-yellow-200 p-3 rounded">
          <span className="text-sm text-yellow-800">Changes made.</span>
          <button
            onClick={undoReconcile}
            className="text-sm bg-white border border-yellow-300 px-3 py-1 rounded text-yellow-900 hover:bg-yellow-100"
          >
            Undo Last Action
          </button>
        </div>
      )}

      {/* Main Action Area */}
      <div className="flex flex-col gap-4">
        <div className="bg-gray-50 p-4 rounded border flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold mb-1">{selectedCount}</p>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Books Selected</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Reconcile Status To:</label>
          <select
            className="border p-2 rounded"
            value={targetStatus}
            onChange={e => setTargetStatus(e.target.value)}
            disabled={isIdle}
          >
            <option value="ready">Ready</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          onClick={() => reconcileBatch(targetStatus)}
          disabled={isIdle}
          className={`py-2 rounded font-medium transition ${isIdle ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          Reconcile Batch
        </button>

        {batchReconcilerState === 'resolved' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded text-center mt-2"
          >
            Successfully reconciled!
          </motion.div>
        )}
      </div>

      {/* Summary Section */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3">Derived Summary (Last Action)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded border flex justify-between">
            <span className="text-gray-500">Processed</span>
            <span className="font-medium">{aggregateTotals.total}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded border flex justify-between">
            <span className="text-gray-500">Ready</span>
            <span className="font-medium">{aggregateTotals.ready || 0}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded border flex justify-between">
            <span className="text-gray-500">Draft</span>
            <span className="font-medium">{aggregateTotals.draft || 0}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded border flex justify-between">
            <span className="text-gray-500">Archived</span>
            <span className="font-medium">{aggregateTotals.archived || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
