import { useState } from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const BrewList: React.FC = () => {
  const { records, activeRecordId, selectRecord, deleteRecord } = useStore();
  const [filter, setFilter] = useState<string>('all');

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
      <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white">
        <h2 className="text-lg font-semibold text-stone-800">Experiments</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border-stone-300 rounded border px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-stone-500"
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
        {filteredRecords.length === 0 ? (
          <div className="text-stone-500 text-center py-4 text-sm">No experiments found.</div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              onClick={() => selectRecord(record.id)}
              className={twMerge(
                clsx(
                  "p-3 rounded-md cursor-pointer border transition-colors flex justify-between items-center group",
                  activeRecordId === record.id
                    ? "bg-amber-50 border-amber-300 shadow-sm"
                    : "bg-white border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                )
              )}
            >
              <div>
                <div className="font-medium text-stone-800">{record.title}</div>
                <div className="text-xs text-stone-500 mt-1 flex gap-2">
                  <span>{record.beanWeight}g in</span>
                  <span>•</span>
                  <span>{record.waterVolume}ml out</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={clsx(
                  "text-xs px-2 py-0.5 rounded-full capitalize font-medium",
                  record.status === 'ready' ? "bg-green-100 text-green-700" :
                  record.status === 'draft' ? "bg-stone-100 text-stone-600" :
                  record.status === 'changed' ? "bg-blue-100 text-blue-700" :
                  "bg-stone-100 text-stone-600"
                )}>
                  {record.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Are you sure you want to delete this experiment?')) deleteRecord(record.id);
                  }}
                  className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 focus:opacity-100"
                  aria-label="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
