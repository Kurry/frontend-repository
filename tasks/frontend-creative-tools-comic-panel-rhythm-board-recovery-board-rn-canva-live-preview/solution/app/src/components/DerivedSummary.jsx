import React from 'react';
import { useStore } from '../Store';

export const DerivedSummary = () => {
  const { derived } = useStore();

  return (
    <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
      <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-3">Derived Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Timing</p>
          <p className="text-2xl font-light text-gray-900">{derived.totalTiming}s</p>
        </div>
        <div className="bg-gray-50 p-3 rounded border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Status Breakdown</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(derived.statusCounts).map(([status, count]) => (
              <span key={status} className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
