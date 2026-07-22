import React from 'react';
import { useStore } from '../store/useStore';
import { blockStatuses } from '../utils/schema';

export function LinearView() {
  const { records, activeFilter, setFilter, setSelectedRecord, selectedRecordId } = useStore();

  const visibleRecords = activeFilter
    ? records.filter((r) => r.status === activeFilter)
    : records;

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold">Linear Filtered View</h2>
      </div>

      <div className="p-2 border-b flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 text-xs rounded-full border ${
            !activeFilter ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        {blockStatuses.map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 text-xs rounded-full border capitalize ${
              activeFilter === status ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {visibleRecords.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No blocks found for this filter.</div>
        ) : (
          <div className="flex flex-col gap-1">
            {visibleRecords.map(record => (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record.id)}
                className={`p-2 rounded cursor-pointer flex justify-between items-center text-sm ${
                  selectedRecordId === record.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
              >
                <span className="truncate max-w-[150px] font-medium">{record.blockName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] capitalize font-bold lane-${record.status}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
