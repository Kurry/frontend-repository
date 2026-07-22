import React, { useState } from 'react';
import { useStore } from '../store';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';

export function PackingList() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState('all');
  const [newItemName, setNewItemName] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const [error, setError] = useState('');

  const filteredRecords = filter === 'all'
    ? state.records
    : state.records.filter(r => r.status === filter);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newItemName) {
      setError('Name is required');
      return;
    }
    const weightNum = parseFloat(newItemWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Weight must be a positive number');
      return;
    }
    setError('');
    dispatch({
      type: 'CREATE_RECORD',
      payload: { name: newItemName, weight: weightNum, status: 'ready', category: 'other' }
    });
    setNewItemName('');
    setNewItemWeight('');
  };

  const handleStatusChange = (id, status) => {
    dispatch({ type: 'UPDATE_RECORD', payload: { id, status } });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Packing Items</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="draft">Draft</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
          <option value="conflict">Conflict</option>
        </select>
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2 items-start">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="w-24">
          <input
            type="number"
            step="0.1"
            placeholder="Weight"
            value={newItemWeight}
            onChange={(e) => setNewItemWeight(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Add</button>
      </form>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <div className="space-y-2">
        {filteredRecords.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No items match this filter.</p>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className={`flex items-center justify-between p-3 border rounded text-sm ${record.status === 'conflict' ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                {record.status === 'conflict' && <AlertCircle className="w-4 h-4 text-red-500" />}
                <div>
                  <div className="font-medium">{record.name}</div>
                  <div className="text-gray-500 text-xs">{record.weight} kg • {record.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={record.status}
                  onChange={(e) => handleStatusChange(record.id, e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                  <option value="conflict">Conflict</option>
                </select>
                {record.status === 'conflict' && (
                  <button
                    onClick={() => dispatch({ type: 'OPEN_RECOVERY_BOARD', payload: record.id })}
                    className="text-red-600 border border-red-200 px-2 py-1 rounded text-xs hover:bg-red-50 bg-white"
                  >
                    Recover
                  </button>
                )}
                <button
                  onClick={() => dispatch({ type: 'DELETE_RECORD', payload: record.id })}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
