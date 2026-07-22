import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { AlertTriangle, ArrowRight, Undo } from 'lucide-react';

export function RecoveryBoard() {
  const { state, dispatch } = useStore();
  const [resolutionCategory, setResolutionCategory] = useState('');

  const selectedRecord = state.records.find(r => r.id === state.selectedItemId);

  useEffect(() => {
    if (selectedRecord) {
      setResolutionCategory(selectedRecord.category);
    }
  }, [selectedRecord]);

  if (!state.recoveryBoardOpen || !selectedRecord) return null;

  const handleResolve = () => {
    if (!resolutionCategory) return;

    dispatch({
      type: 'RESOLVE_CONFLICT',
      payload: {
        id: selectedRecord.id,
        updates: { category: resolutionCategory }
      }
    });
  };

  const handleCancel = () => {
    dispatch({ type: 'CLOSE_RECOVERY_BOARD' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Recovery Board</h2>
        </div>

        <p className="text-gray-700 mb-6 text-sm">
          Resolve conflict for <span className="font-semibold">{selectedRecord.name}</span> by assigning a valid category to move it back to ready status.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current State</label>
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div>Name: {selectedRecord.name}</div>
              <div>Weight: {selectedRecord.weight} kg</div>
              <div>Category: {selectedRecord.category}</div>
            </div>
          </div>

          <div className="flex justify-center text-gray-400">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Category</label>
            <select
              value={resolutionCategory}
              onChange={(e) => setResolutionCategory(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="toiletries">Toiletries</option>
              <option value="clothing">Clothing</option>
              <option value="documents">Documents</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!resolutionCategory}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Resolve & Restore
          </button>
        </div>
      </div>
    </div>
  );
}

export function Summary() {
  const { state } = useStore();

  const totalWeight = state.records.filter(r => r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
  const readyCount = state.records.filter(r => r.status === 'ready').length;
  const conflictCount = state.records.filter(r => r.status === 'conflict').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Total Active Weight:</span>
        <span className="font-semibold">{totalWeight.toFixed(2)} kg</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Ready Items:</span>
        <span className="font-semibold">{readyCount}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Conflicts to Resolve:</span>
        <span className={`font-semibold ${conflictCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {conflictCount}
        </span>
      </div>
    </div>
  );
}
