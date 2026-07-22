import React, { useState } from 'react';
import { useStore, STATUSES } from '../store';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export function PhotoSequenceList({ selectedId, onSelect }) {
  const { records, addRecord, updateRecord, deleteRecord, validationError, clearValidationError } = useStore();
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  const startEdit = (record, e) => {
    e.stopPropagation();
    setEditingId(record.id);
    setEditForm(record);
  };

  const saveEdit = (e) => {
    e.stopPropagation();
    const res = updateRecord(editingId, editForm);
    if (!res?.error) {
      setEditingId(null);
    }
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {validationError && (
        <div className="p-3 bg-red-100 text-red-800 text-sm border-b border-red-200 flex justify-between items-start">
          <span>{validationError}</span>
          <button onClick={clearValidationError} className="ml-2 text-red-600 hover:text-red-900"><X size={14}/></button>
        </div>
      )}
      <div className="p-4 border-b border-gray-200 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Sequences</h2>
          <button
            onClick={addRecord}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Add Record"
          >
            <Plus size={16} />
          </button>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.map(record => (
          <div
            key={record.id}
            onClick={() => onSelect(record.id)}
            className={cn(
              "p-3 rounded border cursor-pointer transition-all duration-200 ease-in-out",
              selectedId === record.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300",
              "transform motion-reduce:transform-none"
            )}
          >
            {editingId === record.id ? (
              <div className="space-y-2 text-sm" onClick={e => e.stopPropagation()}>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="w-full p-1 border rounded"
                  placeholder="Title"
                />
                <input
                  value={editForm.caption}
                  onChange={e => setEditForm({...editForm, caption: e.target.value})}
                  className="w-full p-1 border rounded"
                  placeholder="Caption"
                />
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                  className="w-full p-1 border rounded"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={cancelEdit} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={14}/></button>
                  <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded"><Save size={14}/></button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="overflow-hidden">
                  <div className="font-medium truncate">{record.title || 'Untitled'}</div>
                  <div className="text-xs text-gray-500 truncate">{record.caption || 'No caption'}</div>
                  <div className="mt-2 text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded-full",
                      record.status === 'ready' ? "bg-green-100 text-green-800" :
                      record.status === 'changed' ? "bg-amber-100 text-amber-800" :
                      record.status === 'archived' ? "bg-gray-100 text-gray-800" :
                      "bg-blue-100 text-blue-800"
                    )}>
                      {record.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={(e) => startEdit(record, e)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Edit2 size={14}/></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">No records found.</div>
        )}
      </div>
    </div>
  );
}
