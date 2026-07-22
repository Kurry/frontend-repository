import React, { useState } from 'react';
import { useStore } from './store';
import type { WasteEventStatus } from './types';
import { Trash2, Edit2, AlertCircle } from 'lucide-react';

export default function WasteEventsList() {
  const { records, deleteRecord, moveToRecovery } = useStore();
  const [filter, setFilter] = useState<WasteEventStatus | 'all'>('all');

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Waste Events ({filteredRecords.length})</h2>
        <select
          className="border border-slate-300 rounded px-2 py-1 text-sm bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
          <option value="conflict">Conflict</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="overflow-y-auto flex-1 border border-slate-200 rounded">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No records found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-700">Name</th>
                <th className="px-4 py-2 font-medium text-slate-700">Date</th>
                <th className="px-4 py-2 font-medium text-slate-700">Weight (kg)</th>
                <th className="px-4 py-2 font-medium text-slate-700">Status</th>
                <th className="px-4 py-2 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-slate-900">{record.name}</td>
                  <td className="px-4 py-2 text-slate-600">{record.date}</td>
                  <td className="px-4 py-2 text-slate-600">{record.weightKg}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      record.status === 'conflict' ? 'bg-red-100 text-red-700' :
                      record.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      record.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToRecovery(record.id)}
                        className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-50"
                        title="Move to Recovery"
                      >
                        <AlertCircle size={16} />
                      </button>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
