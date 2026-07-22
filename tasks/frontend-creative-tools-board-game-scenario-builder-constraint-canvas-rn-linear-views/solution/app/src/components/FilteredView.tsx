import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { ScenarioStatus, STATUS_LANES } from '../types';
import { Clock, Users, AlertCircle, Trash, Archive } from 'lucide-react';

export const FilteredView: React.FC = () => {
  const { records, selectedRecordId, setSelectedRecordId, deleteRecord, archiveRecord } = useStore();
  const [filterStatus, setFilterStatus] = useState<ScenarioStatus | 'all'>('all');

  const filteredRecords = useMemo(() => {
    let res = records.filter(r => !r.archived);
    if (filterStatus !== 'all') {
      res = res.filter(r => r.status === filterStatus);
    }
    return res;
  }, [records, filterStatus]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Filtered View</h2>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_LANES.map(status => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Duration</th>
              <th className="px-6 py-3 font-medium">Players</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                  No records found for this filter.
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr
                  key={record.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedRecordId === record.id ? 'bg-blue-50/50' : ''}`}
                  onClick={() => setSelectedRecordId(record.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{record.title || 'Untitled'}</span>
                      {record.status === 'conflict' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[300px] mt-0.5">{record.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      record.status === 'ready' ? 'bg-green-100 text-green-800' :
                      record.status === 'conflict' ? 'bg-red-100 text-red-800' :
                      record.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                      record.status === 'changed' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {record.duration}m
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      {record.requiredPlayers}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); archiveRecord(record.id); }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
