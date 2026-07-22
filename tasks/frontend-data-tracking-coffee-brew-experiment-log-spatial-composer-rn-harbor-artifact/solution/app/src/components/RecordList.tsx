import React, { useState } from 'react';
import { useStore } from '../store';
import type { ExperimentStatus } from '../store';


export const RecordList: React.FC = () => {
  const { records, selectRecord, selectedRecordId } = useStore();
  const [filter, setFilter] = useState<ExperimentStatus | 'all'>('all');

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Brew Experiments</h2>
        <select
          className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as ExperimentStatus | 'all')}
          aria-label="Filter records"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map(r => (
          <div
            key={r.id}
            onClick={() => selectRecord(r.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                selectRecord(r.id);
              }
            }}
            tabIndex={0}
            className={`p-3 rounded-lg border cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 outline-none ${
              selectedRecordId === r.id
                ? 'bg-blue-50 border-blue-300 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-slate-800">{r.name}</h3>
                <span className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-medium ${
                  r.status === 'archived' ? 'bg-slate-200 text-slate-600' :
                  r.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  r.status === 'ready' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {r.status}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {r.coffee} • {r.doseWeight}g in, {r.yieldWeight}g out
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 p-4 text-sm">No records found.</div>
        )}
      </div>
    </div>
  );
};
