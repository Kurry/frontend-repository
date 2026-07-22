import React from 'react';
import { useStore } from '../store';

const Summary: React.FC = () => {
  const { getDerivedState } = useStore();
  const { totalRecords, statusCounts } = getDerivedState();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 shrink-0">
      <h2 className="font-semibold text-neutral-800 mb-4">Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-neutral-50 rounded-md border border-neutral-100 flex flex-col">
          <span className="text-xs text-neutral-500 uppercase font-medium mb-1">Total</span>
          <span className="text-2xl font-semibold text-neutral-900">{totalRecords}</span>
        </div>
        <div className="p-3 bg-blue-50 rounded-md border border-blue-100 flex flex-col">
          <span className="text-xs text-blue-600/80 uppercase font-medium mb-1">Changed</span>
          <span className="text-2xl font-semibold text-blue-700">{statusCounts.changed}</span>
        </div>
        <div className="p-3 bg-green-50 rounded-md border border-green-100 flex flex-col">
          <span className="text-xs text-green-600/80 uppercase font-medium mb-1">Ready</span>
          <span className="text-2xl font-semibold text-green-700">{statusCounts.ready}</span>
        </div>
        <div className="p-3 bg-neutral-100 rounded-md border border-neutral-200 flex flex-col">
          <span className="text-xs text-neutral-500 uppercase font-medium mb-1">Draft</span>
          <span className="text-2xl font-semibold text-neutral-700">{statusCounts.draft}</span>
        </div>
      </div>
    </div>
  );
};

export default Summary;
