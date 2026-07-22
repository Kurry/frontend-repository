import React, { useState } from 'react';
import { useStore } from '../Store';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const colors = {
    empty: 'bg-gray-100 text-gray-800',
    draft: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    changed: 'bg-yellow-100 text-yellow-800',
    conflict: 'bg-red-100 text-red-800',
    resolved: 'bg-purple-100 text-purple-800'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.empty}`}>
      {status}
    </span>
  );
};

export const ComicPanels = () => {
  const { records, addRecord, updateRecord, deleteRecord, setSelectedId } = useStore();
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTiming, setEditTiming] = useState(0);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleEdit = (r) => {
    setEditingId(r.id);
    setEditContent(r.content);
    setEditTiming(r.timing);
  };

  const saveEdit = (id) => {
    updateRecord(id, { content: editContent, timing: parseInt(editTiming, 10) || 0, status: 'changed' });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Collection</h2>
        <div className="flex gap-2">
          <select
            className="text-sm border border-gray-300 rounded p-1"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="conflict">Conflict</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            onClick={() => addRecord({ content: 'New Panel', status: 'empty', timing: 0 })}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.map(r => (
          <div key={r.id} className="border border-gray-200 rounded p-3 hover:border-indigo-300 transition-colors group bg-white shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <StatusBadge status={r.status} />
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {r.status === 'conflict' ? (
                  <button onClick={() => setSelectedId(r.id)} className="text-red-600 hover:bg-red-50 p-1 rounded text-xs border border-red-200">
                    Recover
                  </button>
                ) : null}
                {editingId === r.id ? (
                  <button onClick={() => saveEdit(r.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={16}/></button>
                ) : (
                  <button onClick={() => handleEdit(r)} className="text-gray-500 hover:text-indigo-600 p-1 rounded"><Edit2 size={16}/></button>
                )}
                <button onClick={() => deleteRecord(r.id)} className="text-gray-500 hover:text-red-600 p-1 rounded"><Trash2 size={16}/></button>
              </div>
            </div>

            {editingId === r.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full border border-gray-300 p-1 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="number"
                  value={editTiming}
                  onChange={e => setEditTiming(e.target.value)}
                  className="w-24 border border-gray-300 p-1 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-800">{r.content}</p>
                <div className="mt-2 text-xs text-gray-500 flex gap-2">
                  <span>Timing: {r.timing}s</span>
                  {r.error && <span className="text-red-500 font-medium">{r.error}</span>}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">No panels found.</div>
        )}
      </div>
    </div>
  );
};
