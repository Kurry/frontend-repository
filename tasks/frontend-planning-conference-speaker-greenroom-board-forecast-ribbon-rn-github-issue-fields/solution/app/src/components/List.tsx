import type { Record as AppRecord } from '../types';

interface ListProps {
  records: AppRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusColors: { [key: string]: string } = {
  empty: 'bg-gray-100 text-gray-800',
  draft: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  changed: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-red-100 text-red-800',
};

export function List({ records, selectedId, onSelect }: ListProps) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {records.map(record => (
          <div
            key={record.id}
            onClick={() => onSelect(record.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(record.id); } }}
            tabIndex={0}
            role="button"
            aria-pressed={selectedId === record.id}
            className={`p-4 rounded border transition-all cursor-pointer ${selectedId === record.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 truncate pr-2">{record.title || 'Untitled'}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[record.status]}`}>
                {record.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Speaker: {record.speaker || 'Unassigned'}</p>
              <p>Time: {record.time || 'TBD'}</p>
              <p>Score: {record.forecastScore}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
