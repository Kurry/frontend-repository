import React, { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot } from '../store';

export function Summary() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const records = state.records;

  const totalTasks = records.length;
  const draftCount = records.filter(r => r.status === 'draft').length;
  const readyCount = records.filter(r => r.status === 'ready').length;
  const changedCount = records.filter(r => r.status === 'changed').length;
  const archivedCount = records.filter(r => r.status === 'archived').length;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Derived Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div>
          <p className="text-xs text-gray-500 font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Draft</p>
          <p className="text-2xl font-bold text-gray-600">{draftCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Ready</p>
          <p className="text-2xl font-bold text-green-600">{readyCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Changed</p>
          <p className="text-2xl font-bold text-yellow-600">{changedCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Archived</p>
          <p className="text-2xl font-bold text-red-600">{archivedCount}</p>
        </div>
      </div>
    </div>
  );
}
