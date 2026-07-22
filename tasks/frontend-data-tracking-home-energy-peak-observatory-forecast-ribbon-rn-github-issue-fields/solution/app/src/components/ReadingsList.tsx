import { useState } from 'react';
import type { EnergyReading, ReadingStatus } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Edit2, Trash2, FilePlus, ChevronRight } from 'lucide-react';

interface ReadingsListProps {
  records: EnergyReading[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (record: EnergyReading) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  className?: string;
}

export function ReadingsList({ records, selectedId, onSelect, onEdit, onDelete, onCreateNew, className }: ReadingsListProps) {
  const [filter, setFilter] = useState<ReadingStatus | 'all'>('all');

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <div className={twMerge(clsx("bg-white border border-gray-200 rounded-md flex flex-col overflow-hidden", className))}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-800">Energy Readings</h3>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          New
        </button>
      </div>

      <div className="p-2 border-b border-gray-100 flex gap-2">
        {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              "px-3 py-1 text-xs font-medium rounded-full transition-colors capitalize",
              filter === status
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {filteredRecords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <p>No records found.</p>
            <p className="text-sm mt-1">Try changing the filter or create a new record.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredRecords.map(record => {
              const isSelected = record.id === selectedId;
              return (
                <li
                  key={record.id}
                  className={clsx(
                    "group flex items-center p-3 cursor-pointer transition-colors relative",
                    isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
                  )}
                  onClick={() => onSelect(record.id)}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                  <div className="flex-1 flex flex-col gap-1 pl-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">#{record.id}</span>
                      <span className={clsx(
                        "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm",
                        record.status === 'ready' && "bg-green-100 text-green-700",
                        record.status === 'draft' && "bg-gray-100 text-gray-600",
                        record.status === 'changed' && "bg-amber-100 text-amber-700",
                        record.status === 'archived' && "bg-slate-100 text-slate-500"
                      )}>
                        {record.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Base: {record.value}</span>
                      {record.forecastProjection !== undefined && (
                        <span>Proj: {record.forecastProjection}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-4 gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(record); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                      aria-label={`Edit record ${record.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      aria-label={`Delete record ${record.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={clsx("w-5 h-5 ml-1 transition-colors", isSelected ? "text-blue-500" : "text-gray-300")} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
