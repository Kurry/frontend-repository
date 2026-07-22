import React, { useState } from 'react';
import { useAppState } from '../store';

export function PhotoSequenceList() {
  const { state, dispatch } = useAppState();
  const [filter, setFilter] = useState('all');

  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState('draft');
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('draft');

  const filteredRecords = filter === 'all'
    ? state.records
    : state.records.filter(r => r.status === filter);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Title cannot be empty. Please enter a valid title to create the record.');
      return;
    }
    setError(null);
    dispatch({
      type: 'CREATE_RECORD',
      payload: {
        id: Math.random().toString(36).substring(7),
        title: newTitle,
        status: newStatus
      }
    });
    setNewTitle('');
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditTitle(record.title);
    setEditStatus(record.status);
    setError(null);
  };

  const saveEdit = (id) => {
    if (!editTitle.trim()) {
      setError('Title cannot be empty. Reverting to previous valid state.');
      const oldRecord = state.records.find(r => r.id === id);
      setEditTitle(oldRecord?.title || '');
      return;
    }
    setError(null);
    dispatch({
      type: 'UPDATE_RECORD',
      payload: {
        id,
        updates: {
          title: editTitle,
          status: editStatus
        }
      }
    });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border-r border-gray-200 h-full w-80 bg-gray-50 shrink-0">
      <h2 className="text-lg font-bold text-gray-900">Photo Sequences</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Filter by Status</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded border-gray-300 bg-white"
        >
          <option value="all">All</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="p-2 bg-red-100 text-red-800 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
        {filteredRecords.map(record => (
          <div key={record.id} className="p-3 bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow">
            {editingId === record.id ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="p-1 border rounded w-full"
                />
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="p-1 border rounded w-full bg-white text-sm"
                >
                  <option value="empty">Empty</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => saveEdit(record.id)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Save</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start group">
                <div className="flex-1 cursor-pointer" onClick={() => startEdit(record)}>
                  <h3 className="font-semibold text-gray-800">{record.title}</h3>
                  <span className={`inline-block px-2 py-1 mt-1 text-xs font-medium rounded-full
                    ${record.status === 'ready' ? 'bg-green-100 text-green-800' :
                      record.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                      record.status === 'empty' ? 'bg-gray-100 text-gray-800' :
                      record.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}>
                    {record.status}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">Lane: {record.canvasState}</span>
                </div>
                <div className="flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => dispatch({ type: 'DELETE_RECORD', payload: { id: record.id } })}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label={`Delete ${record.title}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                  <button
                    onClick={() => startEdit(record)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                    aria-label={`Edit ${record.title}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-gray-500 text-center py-4">No records found.</div>
        )}
      </div>

      <form onSubmit={handleCreate} className="mt-auto border-t border-gray-200 pt-4 flex flex-col gap-2">
        <h3 className="text-sm font-bold text-gray-900">New Sequence</h3>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Title..."
          className="p-2 border rounded border-gray-300"
        />
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="p-2 border rounded border-gray-300 bg-white"
        >
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-medium">
          Add
        </button>
      </form>
    </div>
  );
}
