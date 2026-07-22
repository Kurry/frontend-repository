import React from 'react';
import { useStore } from '../store';
import { FileText, Archive, AlertTriangle, CheckCircle, Edit3, Trash2 } from 'lucide-react';

const STATE_ICONS = {
  draft: <Edit3 className="w-4 h-4 text-slate-400" />,
  ready: <CheckCircle className="w-4 h-4 text-green-500" />,
  changed: <FileText className="w-4 h-4 text-blue-500" />,
  conflict: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  archived: <Archive className="w-4 h-4 text-slate-400" />
};

export function ScenarioList() {
  const { records, selectedId, setSelectedId, filterState, setFilterState, addRecord, deleteRecord } = useStore();

  const filteredRecords = filterState === 'all'
    ? records
    : records.filter(r => r.state === filterState);

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-800">Scenarios</h2>
          <button
            onClick={addRecord}
            className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded"
          >
            + New
          </button>
        </div>

        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="w-full text-sm p-2 bg-slate-100 border-none rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All States</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="conflict">Conflict</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredRecords.map(record => (
          <div
            key={record.id}
            onClick={() => setSelectedId(record.id)}
            className={`group flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${selectedId === record.id ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-slate-200 border border-transparent'}`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0">{STATE_ICONS[record.state]}</div>
              <div className="truncate">
                <div className={`text-sm font-medium truncate ${selectedId === record.id ? 'text-blue-900' : 'text-slate-700'}`}>
                  {record.title}
                </div>
                <div className="text-xs text-slate-500 flex gap-2">
                  <span>Cost: {record.cost}</span>
                  <span>Likelihood: {record.likelihood}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
              className={`p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded ${selectedId === record.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
              title="Delete scenario"
              aria-label="Delete scenario"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="p-4 text-center text-sm text-slate-500 italic">
            No scenarios match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
