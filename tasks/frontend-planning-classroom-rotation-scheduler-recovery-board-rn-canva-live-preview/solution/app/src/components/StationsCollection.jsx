import React, { useState } from 'react';
import { pushHistory } from '../store.js';

export function StationsCollection({ state, setState }) {
  const [filter, setFilter] = useState('all');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) {
      setError('Name is required');
      return;
    }
    if (newName.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }
    setError('');
    const newRecord = {
      id: `rec-${Date.now()}`,
      name: newName.trim(),
      status: 'draft',
      failed: false
    };

    setState(prev => pushHistory(prev, [...prev.records, newRecord]));
    setNewName('');
  };

  const handleArchive = (id) => {
    setState(prev => {
      const newRecords = prev.records.map(r => r.id === id ? { ...r, status: 'archived' } : r);
      return pushHistory(prev, newRecords);
    });
  };

  const visibleRecords = filter === 'all' ? state.records : state.records.filter(r => r.status === filter);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Stations Collection</h2>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="New station name"
            className="w-full border p-2 rounded"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Station</button>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'draft', 'ready', 'changed', 'archived'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm capitalize ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visibleRecords.length === 0 ? (
          <p className="text-gray-500 italic py-4">No stations found.</p>
        ) : (
          visibleRecords.map(record => (
            <div key={record.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition-colors group">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{record.name}</span>
                <span className="ml-3 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border">{record.status}</span>
                {record.failed && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-200">Failed</span>}
              </div>
              <button
                onClick={() => handleArchive(record.id)}
                className="text-sm text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 rounded hover:bg-red-50"
              >
                Archive
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
