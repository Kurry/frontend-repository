import React from 'react';
import { useStore } from '../store';

export function SummaryPanel() {
  const { getSummary } = useStore();
  const stats = getSummary();

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 flex flex-col hidden lg:flex">
      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Project Summary</h2>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500">Total Records</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Status Breakdown</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Draft</span>
              <span className="font-medium">{stats.draft}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Ready</span>
              <span className="font-medium">{stats.ready}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-600">Changed</span>
              <span className="font-medium">{stats.changed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Archived</span>
              <span className="font-medium">{stats.archived}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-400">Empty</span>
              <span className="font-medium">{stats.empty}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Net Forecast Delta</p>
          <p className={`text-xl font-bold ${stats.totalForecastDelta > 0 ? 'text-green-600' : stats.totalForecastDelta < 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {stats.totalForecastDelta > 0 ? '+' : ''}{stats.totalForecastDelta}
          </p>
        </div>
      </div>
    </div>
  );
}
