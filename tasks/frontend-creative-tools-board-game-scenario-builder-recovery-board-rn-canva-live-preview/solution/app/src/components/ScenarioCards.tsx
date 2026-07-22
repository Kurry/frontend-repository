import { useState } from 'react';
import { useStore } from '../store';
import type { Status } from '../store';
import { EditRecord } from './EditRecord';

export function ScenarioCards() {
  const records = useStore((state) => state.records);
  const deleteRecord = useStore((state) => state.deleteRecord);

  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredRecords = filter === 'all'
    ? records
    : records.filter((r) => r.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Scenario Cards</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Status | 'all')}
            className="border border-slate-300 rounded px-2 py-1 text-sm bg-white"
            aria-label="Filter by status"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="failed">Failed</option>
            <option value="recovered">Recovered</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Create
          </button>
        </div>
      </div>

      {isCreating && (
        <EditRecord
          onClose={() => setIsCreating(false)}
        />
      )}

      {editingId && (
        <EditRecord
          recordId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
            No scenario cards found matching the current filter.
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="border border-slate-200 rounded p-4 bg-white shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{record.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${record.status === 'draft' ? 'bg-slate-100 text-slate-700' : ''}
                  ${record.status === 'ready' ? 'bg-green-100 text-green-700' : ''}
                  ${record.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                  ${record.status === 'recovered' ? 'bg-blue-100 text-blue-700' : ''}
                  ${record.status === 'archived' ? 'bg-gray-100 text-gray-700' : ''}
                `}>
                  {record.status}
                </span>
              </div>
              <p className="text-sm text-slate-600">{record.description}</p>
              <div className="text-xs text-slate-500 flex justify-between mt-auto pt-2 border-t border-slate-100">
                <span>Diff: {record.difficulty}</span>
                <span>ID: {record.id}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditingId(record.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this record?')) {
                      deleteRecord(record.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
