import React, { useState } from 'react';
import { useStore } from '../store/Store';
import type { SoundLayerStatus } from '../types';
import { Play, Pause, Trash2, Edit2, Check, X, FileAudio } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const statuses: SoundLayerStatus[] = ['empty', 'draft', 'ready', 'changed', 'archived'];

export const SoundLayersList = () => {
  const { state, createRecord, deleteRecord, selectRecord, updateRecord } = useStore();
  const [filter, setFilter] = useState<SoundLayerStatus | 'all'>('all');

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState<SoundLayerStatus>('draft');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<SoundLayerStatus>('draft');

  const [errorMsg, setErrorMsg] = useState('');

  const filteredRecords = state.records.filter(r => filter === 'all' || r.status === filter);

  const handleCreate = () => {
    if (!newName.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    createRecord(newName, newStatus);
    setIsCreating(false);
    setNewName('');
    setNewStatus('draft');
    setErrorMsg('');
  };

  const startEdit = (id: string, name: string, status: SoundLayerStatus) => {
    setEditingId(id);
    setEditName(name);
    setEditStatus(status);
    setErrorMsg('');
  };

  const handleUpdate = () => {
    if (!editName.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    if (editingId) {
      updateRecord(editingId, editName, editStatus);
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-1/3 md:h-full bg-stone-900 border-b md:border-r border-stone-800 w-full md:w-80 shrink-0">
      <div className="p-4 border-b border-stone-800">
        <h2 className="text-sm font-semibold text-stone-200 uppercase tracking-wider mb-4">Sound Layers</h2>

        <div className="flex items-center gap-2 mb-4">
          <select
            className="bg-stone-800 text-stone-200 text-sm rounded px-2 py-1 border border-stone-700 flex-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded transition-colors"
            onClick={() => setIsCreating(true)}
            aria-label="New Layer"
          >
            <Play size={20} className="transform rotate-90" />
          </button>
        </div>

        {isCreating && (
          <div className="bg-stone-800 p-3 rounded mb-4 border border-stone-700 text-sm">
            <input
              autoFocus
              className="w-full bg-stone-900 text-stone-200 rounded px-2 py-1 mb-2 border border-stone-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="Layer Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <select
              className="w-full bg-stone-900 text-stone-200 rounded px-2 py-1 mb-2 border border-stone-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as SoundLayerStatus)}
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errorMsg && <div className="text-red-400 text-xs mb-2">{errorMsg}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsCreating(false)} className="text-stone-400 hover:text-stone-200"><X size={16}/></button>
              <button onClick={handleCreate} className="text-indigo-400 hover:text-indigo-300"><Check size={16}/></button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredRecords.length === 0 ? (
          <div className="text-stone-500 text-sm text-center mt-10 px-4">
            No sound layers found. Create one to get started.
          </div>
        ) : (
          <ul className="space-y-1">
            {filteredRecords.map(record => {
              const isSelected = state.selectedRecordId === record.id;

              if (editingId === record.id) {
                return (
                  <li key={record.id} className="bg-stone-800 p-2 rounded border border-indigo-500 text-sm">
                    <input
                      autoFocus
                      className="w-full bg-stone-900 text-stone-200 rounded px-2 py-1 mb-2 border border-stone-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                    <select
                      className="w-full bg-stone-900 text-stone-200 rounded px-2 py-1 mb-2 border border-stone-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as SoundLayerStatus)}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errorMsg && <div className="text-red-400 text-xs mb-2">{errorMsg}</div>}
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-200"><X size={16}/></button>
                      <button onClick={handleUpdate} className="text-indigo-400 hover:text-indigo-300"><Check size={16}/></button>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={record.id}
                  onClick={() => selectRecord(record.id)}
                  className={twMerge(
                    "flex items-center justify-between p-2 rounded cursor-pointer transition-colors group",
                    isSelected ? "bg-indigo-900/40 border border-indigo-500/50" : "hover:bg-stone-800 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileAudio size={16} className={isSelected ? "text-indigo-400" : "text-stone-500"} />
                    <div className="truncate">
                      <div className="text-sm font-medium text-stone-200 truncate">{record.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5 capitalize">{record.status}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(record.id, record.name, record.status); }}
                      className="p-1 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-700"
                      aria-label="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if(confirm('Delete layer?')) deleteRecord(record.id); }}
                      className="p-1 text-stone-400 hover:text-red-400 rounded hover:bg-stone-700"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
