import React from 'react';
import { useAppStore } from '../store';

export const Summary: React.FC = () => {
  const { derived } = useAppStore();

  return (
    <div className="bg-white p-4 shadow rounded-lg mb-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{derived.summary.totalEvents}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Weight</p>
          <p className="text-2xl font-bold text-gray-900">{derived.summary.totalWeight} lbs</p>
        </div>
        <div className="p-3 bg-green-50 rounded-md border border-green-100">
          <p className="text-sm text-green-700 font-medium">Ready for Handoff</p>
          <p className="text-2xl font-bold text-green-800">{derived.summary.readyCount}</p>
        </div>
      </div>
    </div>
  );
};
