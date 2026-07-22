import React, { useState } from 'react';
import { Plus, Edit2, Archive, Trash2, Filter, X } from 'lucide-react';

const statuses = ['draft', 'ready', 'changed', 'archived'];

export default function PhotoSequenceCollection({ records, onAdd, onUpdate, onDelete, selectedId, onSelect }) {
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: 'draft', owner: '' });
  const [error, setError] = useState(null);

  const filteredRecords = filter === 'all'
    ? records
    : records.filter(r => r.status === filter);

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ ...record });
    setError(null);
  };

  const handleSaveEdit = () => {
    if (!editForm.title.trim()) {
      setError('Title is required. Please provide a valid title to save the record.');
      return;
    }
    onUpdate(editingId, editForm);
    setEditingId(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const handleAddNew = () => {
    const newRecord = {
      id: Date.now().toString(),
      title: 'New Sequence',
      status: 'draft',
      owner: ''
    };
    onAdd(newRecord);
    handleEdit(newRecord);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80 shrink-0">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Photo Sequences</h2>
          <button
            onClick={handleAddNew}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Add new sequence"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Sequences</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center p-4 text-gray-500 text-sm">
            No sequences found. Create one to get started.
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className={`mb-2 p-3 rounded-lg border cursor-pointer ${selectedId === record.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => onSelect(record.id)}
            >
              {editingId === record.id ? (
                <div className="space-y-3" onClick={e => e.stopPropagation()}>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      className={`mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
                      value={editForm.title}
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Status</label>
                    <select
                      className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Owner</label>
                    <input
                      type="text"
                      className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={editForm.owner}
                      onChange={e => setEditForm({...editForm, owner: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate pr-2">{record.title}</h3>
                    <div className="flex space-x-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      {record.status !== 'archived' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdate(record.id, { ...record, status: 'archived' }); }}
                          className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                          title="Archive"
                        >
                          <Archive size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span className={`w-2 h-2 rounded-full ${
                        record.status === 'ready' ? 'bg-green-500' :
                        record.status === 'changed' ? 'bg-yellow-500' :
                        record.status === 'archived' ? 'bg-gray-400' : 'bg-blue-500'
                      }`}></span>
                      <span>{record.status}</span>
                    </span>
                    {record.owner && <span>{record.owner}</span>}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
