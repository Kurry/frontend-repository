import React from 'react';
import { useStore, GlazeStatus } from '../store';
import { Circle, FileText, CheckCircle2, AlertCircle, Archive } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const StatusIcon = ({ status }: { status: GlazeStatus }) => {
  switch (status) {
    case 'empty': return <Circle size={16} className="text-gray-300" />;
    case 'draft': return <FileText size={16} className="text-gray-500" />;
    case 'ready': return <CheckCircle2 size={16} className="text-green-500" />;
    case 'changed': return <AlertCircle size={16} className="text-yellow-500" />;
    case 'archived': return <Archive size={16} className="text-gray-400" />;
  }
};

export const GlazeTestsList: React.FC = () => {
  const { records, selectedId, selectRecord } = useStore();
  const [filter, setFilter] = React.useState<GlazeStatus | 'all'>('all');

  const filteredRecords = records.filter(
    (r) => filter === 'all' || r.status === filter
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter status"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredRecords.map((record) => (
          <button
            key={record.id}
            onClick={() => selectRecord(record.id)}
            className={twMerge(
              clsx(
                "w-full flex items-center justify-between p-3 rounded-md text-left transition-colors",
                selectedId === record.id
                  ? "bg-indigo-50 border border-indigo-200"
                  : "hover:bg-gray-50 border border-transparent"
              )
            )}
            aria-current={selectedId === record.id ? 'true' : 'false'}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: record.baseColor }}
              />
              <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                {record.name}
              </span>
            </div>
            <StatusIcon status={record.status} />
          </button>
        ))}
        {filteredRecords.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            No records found.
          </div>
        )}
      </div>
    </div>
  );
};
