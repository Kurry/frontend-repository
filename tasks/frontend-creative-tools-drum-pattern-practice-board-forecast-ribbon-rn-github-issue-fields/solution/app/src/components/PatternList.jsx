import React, { useState } from 'react';

const statuses = ['all', 'empty', 'draft', 'ready', 'changed', 'archived'];

export default function PatternList({ patterns, selectedPatternId, onSelect, onAdd, onDelete }) {
  const [filter, setFilter] = useState('all');
  const filteredPatterns = patterns.filter(p => filter === 'all' || p.status === filter);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filter:</label>
          <select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1.5 border">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={onAdd} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Add Pattern
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredPatterns.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No patterns found.</div>
        ) : (
          filteredPatterns.map(pattern => (
            <div key={pattern.id} onClick={() => onSelect(pattern.id)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedPatternId === pattern.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 bg-white hover:bg-gray-50'}`} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(pattern.id)}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-gray-900 truncate pr-2">{pattern.title}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${pattern.status === 'ready' ? 'bg-green-100 text-green-800' : pattern.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : pattern.status === 'archived' ? 'bg-gray-100 text-gray-800' : pattern.status === 'changed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{pattern.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Tempo: {pattern.tempo}</span>
                <button onClick={(e) => { e.stopPropagation(); onDelete(pattern.id); }} className="text-red-600 hover:text-red-800 ml-2">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
