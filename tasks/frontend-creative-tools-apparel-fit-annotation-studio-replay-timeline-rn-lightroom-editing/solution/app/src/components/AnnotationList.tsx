import React from 'react';
import { useStore, type FilterStatus } from '../store';
import { clsx } from 'clsx';
import { FileText, Scissors, FileCode, Archive } from 'lucide-react';

const statusConfig = {
  draft: { icon: FileText, color: 'text-neutral-500', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  ready: { icon: Scissors, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  changed: { icon: FileCode, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  archived: { icon: Archive, color: 'text-neutral-400', bg: 'bg-neutral-100', border: 'border-neutral-200' },
};

const AnnotationList: React.FC = () => {
  const { getVisibleRecords, filter, setFilter, selectedId, selectRecord } = useStore();
  const records = getVisibleRecords();

  const filters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'ready', label: 'Ready' },
    { value: 'changed', label: 'Changed' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-neutral-200 shrink-0">
        <h2 className="font-semibold text-neutral-800 mb-3">Collection</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter annotations">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={clsx(
                "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                filter === f.value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
            <p className="text-sm">No records found matching current filter.</p>
            <button
              onClick={() => setFilter('all')}
              className="mt-2 text-blue-600 text-sm hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {records.map(record => {
              const config = statusConfig[record.status];
              const Icon = config.icon;
              const isSelected = selectedId === record.id;

              return (
                <li key={record.id}>
                  <button
                    onClick={() => selectRecord(record.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={clsx(
                      "w-full text-left p-3 rounded-md border transition-all flex items-start gap-3",
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                        : "border-transparent hover:bg-neutral-50 hover:border-neutral-200"
                    )}
                  >
                    <div className={clsx("p-2 rounded-md shrink-0 border", config.bg, config.color, config.border)}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium text-neutral-900 truncate">{record.title}</h3>
                        <span className={clsx("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border", config.color, config.bg, config.border)}>
                          {record.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                        <span className="truncate">{record.notes || "No notes"}</span>
                        <span className="whitespace-nowrap font-mono">{record.measurementOffset > 0 ? '+' : ''}{record.measurementOffset}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnnotationList;
