import React, { useState } from 'react';
import { pushHistory, undo } from '../store.js';

export function RecoveryBoard({ state, setState }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleRecover = () => {
    if (!selectedId) return;
    setState(prev => {
      const newRecords = prev.records.map(r =>
        r.id === selectedId
          ? { ...r, failed: false, status: 'ready', recoveryBoardState: 'resolved' }
          : r
      );
      return pushHistory(prev, newRecords);
    });
    setSelectedId(null);
  };

  const handleUndo = () => {
    setState(prev => undo(prev));
  };

  const failedRecords = state.records.filter(r => r.failed);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recovery Board</h2>
        <button
          onClick={handleUndo}
          disabled={state.historyIndex < 0}
          className="text-sm px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
        >
          Undo
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded border">
          <span className="text-gray-500">Total Stations:</span>
          <span className="ml-2 font-bold">{state.derived.summary.total}</span>
        </div>
        <div className="p-3 bg-red-50 rounded border border-red-100 text-red-800">
          <span className="text-red-600/70">Requires Recovery:</span>
          <span className="ml-2 font-bold">{state.derived.summary.failedCount}</span>
        </div>
      </div>

      <div className="space-y-3">
        {failedRecords.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded border border-dashed text-gray-500 italic">
            No failed stations require recovery.
          </div>
        ) : (
          failedRecords.map(record => (
            <div
              key={record.id}
              onClick={() => setSelectedId(record.id)}
              className={`p-4 border rounded cursor-pointer transition-all duration-200 ease-in-out transform ${
                selectedId === record.id
                  ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-md'
                  : 'hover:border-gray-400 bg-white hover:shadow-sm'
              }`}
            >
              <div className="font-medium text-red-700">{record.name}</div>
              <div className="text-sm text-gray-500 mt-1">Status: {record.status}</div>
            </div>
          ))
        )}
      </div>

      {selectedId && (
        <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-sm text-gray-600 mb-3">
            Move this failed record into a recovery path and repair its downstream consequences.
          </p>
          <button
            onClick={handleRecover}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
          >
            Resolve & Recover
          </button>
        </div>
      )}
    </div>
  );
}
