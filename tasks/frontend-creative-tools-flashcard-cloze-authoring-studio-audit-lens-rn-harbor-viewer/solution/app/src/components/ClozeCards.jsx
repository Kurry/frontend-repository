import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Archive, CheckCircle } from 'lucide-react';

export default function ClozeCards({ records, setRecords, onSelect, selectedId, setHistory }) {
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ front: '', back: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const statuses = ['all', 'empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'];

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleAdd = () => {
    const newRecord = {
      id: `record-${Date.now()}`,
      front: '',
      back: '',
      status: 'empty',
      evidence: null,
      auditDiscrepancy: null
    };

    setHistory(prev => [...prev, { type: 'CREATE', record: newRecord, timestamp: Date.now() }]);
    setRecords([...records, newRecord]);
    setEditingId(newRecord.id);
    setEditForm({ front: '', back: '' });
    setErrorMsg('');
  };

  const handleSaveEdit = (id) => {
    if (!editForm.front.trim() || !editForm.back.trim()) {
      setErrorMsg('Both fields are required to be valid strings. Recovering prior valid state.');
      setTimeout(() => setErrorMsg(''), 3000);
      setEditingId(null);
      return;
    }

    setRecords(records.map(r => {
      if (r.id === id) {
        const updated = { ...r, front: editForm.front, back: editForm.back, status: 'draft' };
        setHistory(prev => [...prev, { type: 'UPDATE', record: updated, previousRecord: r, timestamp: Date.now() }]);
        return updated;
      }
      return r;
    }));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    const recordToDelete = records.find(r => r.id === id);
    setHistory(prev => [...prev, { type: 'DELETE', record: recordToDelete, timestamp: Date.now() }]);
    setRecords(records.filter(r => r.id !== id));
    if (selectedId === id) onSelect(null);
  };

  const handleArchive = (id) => {
    setRecords(records.map(r => {
      if (r.id === id) {
        const updated = { ...r, status: 'archived' };
        setHistory(prev => [...prev, { type: 'ARCHIVE', record: updated, previousRecord: r, timestamp: Date.now() }]);
        return updated;
      }
      return r;
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Cloze Cards</h2>
          <button
            onClick={handleAdd}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            aria-label="Add new record"
          >
            <Plus size={16} />
          </button>
        </div>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-100 text-red-700 text-sm border-b border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No records match the current filter.</div>
        ) : (
          filtered.map(record => (
            <div
              key={record.id}
              onClick={() => { if(editingId !== record.id) onSelect(record.id) }}
              className={`p-3 border rounded-lg transition-all cursor-pointer ${
                selectedId === record.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              } ${record.status === 'archived' ? 'opacity-60 bg-gray-50' : ''}`}
            >
              {editingId === record.id ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <input
                    className="w-full p-2 text-sm border rounded"
                    placeholder="Front content..."
                    value={editForm.front}
                    onChange={e => setEditForm({...editForm, front: e.target.value})}
                  />
                  <input
                    className="w-full p-2 text-sm border rounded"
                    placeholder="Back content (cloze)..."
                    value={editForm.back}
                    onChange={e => setEditForm({...editForm, back: e.target.value})}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(record.id)}
                      className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col group relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      record.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      record.status === 'conflict' ? 'bg-red-100 text-red-700' :
                      record.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {record.status}
                    </span>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditForm({front: record.front, back: record.back}); setEditingId(record.id); }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleArchive(record.id); }}
                        className="p-1 text-gray-400 hover:text-orange-600"
                        title="Archive"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">{record.front || 'Empty record'}</div>
                  <div className="text-xs text-gray-500 truncate">{record.back}</div>

                  {record.evidence && (
                    <div className="mt-2 text-xs text-blue-600 flex items-center">
                      <CheckCircle size={12} className="mr-1" />
                      Evidence attached
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
