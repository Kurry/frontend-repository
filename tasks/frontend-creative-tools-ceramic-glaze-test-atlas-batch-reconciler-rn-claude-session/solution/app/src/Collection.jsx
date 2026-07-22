import React, { useState } from 'react';
import { useStore } from './store';
import { Search, Plus, Archive, Edit2, AlertCircle } from 'lucide-react';

export default function Collection({ selectedIds, toggleSelection }) {
  const { records, createRecord, updateRecord, archiveRecord } = useStore();
  const [filter, setFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({ name: '', amount: '', temperature: '' });
  const [error, setError] = useState('');

  const filteredRecords = records.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const validate = (data) => {
    if (!data.name.trim()) return "Name is required";
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0 || amount > 1000) return "Amount must be between 1 and 1000";
    const temp = Number(data.temperature);
    if (isNaN(temp) || temp < 1000 || temp > 1300) return "Temperature must be between 1000 and 1300";
    return null;
  };

  const handleSave = () => {
    const err = validate(formData);
    if (err) {
      setError(err);
      return;
    }

    if (editingId) {
      updateRecord(editingId, { ...formData, amount: Number(formData.amount), temperature: Number(formData.temperature) });
    } else {
      createRecord({ ...formData, amount: Number(formData.amount), temperature: Number(formData.temperature) });
    }

    setFormData({ name: '', amount: '', temperature: '' });
    setIsCreating(false);
    setEditingId(null);
    setError('');
  };

  const startEdit = (record) => {
    setFormData({ name: record.name, amount: record.amount.toString(), temperature: record.temperature.toString() });
    setEditingId(record.id);
    setIsCreating(false);
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Glaze Tests</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter glaze tests"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); setFormData({name: '', amount: '', temperature: ''}); setError(''); }}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1 text-sm transition-colors duration-200"
          >
            <Plus size={16} /> New Test
          </button>
        </div>
      </div>

      {(isCreating || editingId) && (
        <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:transition-none motion-reduce:animate-none">
          <h3 className="font-medium mb-3">{editingId ? 'Edit Test' : 'New Test'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="text" placeholder="Name"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number" placeholder="Amount (g)"
              value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number" placeholder="Temp (°C)"
              value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm mb-3 flex items-center gap-1" aria-live="polite">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setIsCreating(false); setEditingId(null); setError(''); }}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-gray-50 rounded border border-dashed border-gray-300 animate-in fade-in duration-500 motion-reduce:transition-none motion-reduce:animate-none">
          No tests found.
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[600px]">
          <ul className="space-y-2">
            {filteredRecords.map(record => (
              <li
                key={record.id}
                className={`flex items-center justify-between p-3 border rounded transition-all duration-300 ease-out motion-reduce:transition-none ${selectedIds.includes(record.id) ? 'bg-blue-50 border-blue-300 scale-[1.01] motion-reduce:transform-none' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(record.id)}
                    onChange={() => toggleSelection(record.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 transition-colors"
                    aria-label={`Select ${record.name}`}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{record.name}</h4>
                    <div className="text-xs text-gray-500 flex gap-2">
                      <span>{record.amount}g</span>
                      <span>•</span>
                      <span>{record.temperature}°C</span>
                      {record.batchId && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">Batch: {record.batchId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full transition-colors duration-300 ${
                    record.status === 'ready' ? 'bg-green-100 text-green-800' :
                    record.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                  <button onClick={() => startEdit(record)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors" aria-label="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => archiveRecord(record.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors" aria-label="Archive">
                    <Archive size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
