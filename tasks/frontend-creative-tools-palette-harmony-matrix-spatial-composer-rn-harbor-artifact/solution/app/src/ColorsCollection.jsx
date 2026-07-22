import React, { useState } from 'react';
import { useStore } from './state';
import { Palette, Plus, Trash2, Edit2 } from 'lucide-react';
import { z } from 'zod';

const colorSchema = z.object({
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g., #ff0000)")
});

export default function ColorsCollection() {
  const { records, createRecord, updateRecord, deleteRecord, selectRecord, derived } = useStore();
  const [filter, setFilter] = useState('all');

  const [newHex, setNewHex] = useState('#000000');
  const [newError, setNewError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editHex, setEditHex] = useState('');
  const [editError, setEditError] = useState('');

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const handleCreate = (e) => {
    e.preventDefault();
    try {
      colorSchema.parse({ hex: newHex });
      createRecord(newHex);
      setNewHex('#000000');
      setNewError('');
    } catch (err) {
      setNewError(err.errors[0].message);
    }
  };

  const handleEditStart = (record) => {
    setEditingId(record.id);
    setEditHex(record.hex);
    setEditError('');
  };

  const handleEditSave = (id) => {
    try {
      colorSchema.parse({ hex: editHex });
      updateRecord(id, { hex: editHex });
      setEditingId(null);
      setEditError('');
    } catch (err) {
      setEditError(`Invalid: ${err.errors[0].message}. Previous valid state preserved.`);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditError('');
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this color?')) {
      deleteRecord(id);
    }
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded bg-white shadow-sm h-full max-h-[800px]">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Palette size={20} />
          Colors Collection
        </h2>
        <select
          className="border rounded p-1 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter colors by status"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            type="text"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            className="w-full border rounded p-2 text-sm"
            placeholder="#hexcolor"
            aria-label="New color hex"
          />
          {newError && <p className="text-red-500 text-xs mt-1" role="alert">{newError}</p>}
        </div>
        <input
            type="color"
            value={newHex.match(/^#[0-9a-fA-F]{6}$/) ? newHex : '#000000'}
            onChange={(e) => setNewHex(e.target.value)}
            className="w-10 h-10 border-0 p-0 rounded cursor-pointer"
            aria-label="Color picker"
        />
        <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700" aria-label="Add Color">
          <Plus size={20} />
        </button>
      </form>

      <div className="overflow-y-auto flex-1 pr-2 space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center text-gray-500 mt-8" role="status">
            <p>No colors found for this filter.</p>
            <p className="text-sm">Add a new color above or change the filter.</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className={`flex items-center gap-2 p-2 border rounded ${derived.selectedId === record.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'} ${record.status === 'archived' ? 'opacity-50' : ''}`}
              onClick={() => selectRecord(record.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && selectRecord(record.id)}
            >
              <div
                className="w-6 h-6 rounded border flex-shrink-0"
                style={{ backgroundColor: record.hex }}
                aria-hidden="true"
              />

              {editingId === record.id ? (
                <div className="flex-1 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editHex}
                      onChange={e => setEditHex(e.target.value)}
                      className="border rounded px-1 text-sm flex-1"
                      autoFocus
                    />
                    <button onClick={() => handleEditSave(record.id)} className="bg-blue-500 text-white px-2 text-xs rounded">Save</button>
                    <button onClick={handleEditCancel} className="bg-gray-300 px-2 text-xs rounded">Cancel</button>
                  </div>
                  {editError && <p className="text-red-500 text-xs" role="alert">{editError}</p>}
                </div>
              ) : (
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <span className="font-mono text-sm truncate">{record.hex}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">{record.status}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditStart(record); }}
                      className="text-gray-500 hover:text-blue-600 p-1"
                      aria-label={`Edit ${record.hex}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateRecord(record.id, { status: record.status === 'archived' ? 'changed' : 'archived' }); }}
                      className="text-xs text-gray-500 hover:text-black p-1"
                      aria-label={record.status === 'archived' ? 'Unarchive' : 'Archive'}
                    >
                      {record.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                      className="text-gray-500 hover:text-red-600 p-1"
                      aria-label={`Delete ${record.hex}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
