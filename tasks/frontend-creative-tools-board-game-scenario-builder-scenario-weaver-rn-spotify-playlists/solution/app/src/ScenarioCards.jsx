import React, { useState } from 'react';
import { useStore } from './store';
import { Plus, Edit2, Trash2, ChevronRight, FileJson } from 'lucide-react';

export function ScenarioCards() {
  const { records, filterStatus, setFilterStatus, createRecord, deleteRecord, selectForWeaver, weaverState } = useStore();
  const [editingId, setEditingId] = useState(null);

  const filteredRecords = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'changed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Scenario Cards</h2>
          <button
            onClick={() => createRecord({ title: 'New Scenario' })}
            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded"
          >
            <Plus size={16} className="mr-1" /> Add
          </button>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filter records"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No records found.
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className={`p-3 border rounded-lg transition-colors cursor-pointer ${weaverState.selectedId === record.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
              onClick={() => selectForWeaver(record.id)}
              onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') selectForWeaver(record.id) }}
              tabIndex={0}
              role="button"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{record.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{record.description || 'No description'}</p>
                </div>
                <div className="ml-3 flex flex-col items-end space-y-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(record.status)} capitalize`}>
                    {record.status}
                  </span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      aria-label={`Delete ${record.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
