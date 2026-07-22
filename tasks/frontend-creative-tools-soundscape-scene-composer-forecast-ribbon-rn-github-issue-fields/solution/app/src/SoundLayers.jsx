import React, { useState } from 'react';
import { useStore, ACTIONS, STATES } from './store';
import { Play, Pause, Square, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function SoundLayers() {
  const { state, dispatch } = useStore();
  const [filterState, setFilterState] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', duration: 0, volume: 100 });
  const [error, setError] = useState(null);

  const filteredRecords = state.records.filter(r => filterState === 'all' || r.state === filterState);

  const handleCreate = () => {
    dispatch({ type: ACTIONS.CREATE_RECORD, payload: { name: 'New Track', state: 'draft', duration: 30, volume: 80 } });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this layer?")) return;
    dispatch({ type: ACTIONS.DELETE_RECORD, payload: { id } });
  };

  const handleSelect = (id) => {
    dispatch({ type: ACTIONS.SELECT_RECORD, payload: { id } });
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ name: record.name, duration: record.duration, volume: record.volume });
    setError(null);
  };

  const saveEdit = (id) => {
    // Exact field boundaries: duration > 0, volume 0-100.
    if (editForm.duration < 0 || editForm.duration > 3600) {
      setError("Duration must be between 0 and 3600 seconds.");
      return; // preserve prior valid record, explain recovery
    }
    if (editForm.volume < 0 || editForm.volume > 100) {
      setError("Volume must be between 0 and 100.");
      return;
    }
    if (!editForm.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    dispatch({ type: ACTIONS.UPDATE_RECORD, payload: { id, updates: editForm } });
    setEditingId(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  }

  const handleStateChange = (id, newState) => {
    dispatch({ type: ACTIONS.UPDATE_RECORD, payload: { id, updates: { state: newState } } });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
        <h2 className="text-lg font-semibold text-slate-800">Sound Layers</h2>
        <button
          onClick={handleCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Create Layer"
        >
          Add Layer
        </button>
      </div>

      <div className="p-3 border-b border-slate-200 bg-slate-100 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterState('all')}
          className={cn("px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors", filterState === 'all' ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-300")}
        >
          All
        </button>
        {STATES.map(s => (
          <button
            key={s}
            onClick={() => setFilterState(s)}
            className={cn("px-3 py-1 text-sm rounded-full capitalize whitespace-nowrap transition-colors", filterState === s ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-300")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center p-8 text-slate-400">
            <Square className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No layers found in this state.</p>
          </div>
        ) : (
          filteredRecords.map((record, index) => {
            const isSelected = state.selectedRecordId === record.id;
            const isEditing = editingId === record.id;

            return (
              <div
                key={record.id}
                className={cn(
                  "flex flex-col p-3 rounded-lg border transition-all cursor-pointer relative group",
                  isSelected ? "bg-indigo-50 border-indigo-300 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                )}
                onClick={() => !isEditing && handleSelect(record.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isEditing) handleSelect(record.id);
                  }
                }}
              >
                {isEditing ? (
                  <div className="space-y-3" onClick={e => e.stopPropagation()}>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                       <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Duration (s)</label>
                          <input
                            type="number"
                            value={editForm.duration}
                            onChange={e => setEditForm({...editForm, duration: parseFloat(e.target.value) || 0})}
                            className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                       </div>
                       <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Vol (%)</label>
                          <input
                            type="number"
                            value={editForm.volume}
                            onChange={e => setEditForm({...editForm, volume: parseFloat(e.target.value) || 0})}
                            className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                       </div>
                    </div>
                    {error && (
                      <div className="text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded border border-red-100">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => saveEdit(record.id)} className="px-3 py-1 text-xs font-medium bg-slate-800 text-white rounded hover:bg-slate-700">Save</button>
                      <button onClick={cancelEdit} className="px-3 py-1 text-xs font-medium bg-slate-200 text-slate-700 rounded hover:bg-slate-300">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{record.name}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full capitalize font-medium",
                          record.state === 'ready' ? "bg-emerald-100 text-emerald-800" :
                          record.state === 'draft' ? "bg-amber-100 text-amber-800" :
                          record.state === 'changed' ? "bg-blue-100 text-blue-800" :
                          record.state === 'archived' ? "bg-slate-200 text-slate-600" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {record.state}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex gap-3">
                        <span>{record.duration}s</span>
                        <span>Vol: {record.volume}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                       <button
                         onClick={(e) => { e.stopPropagation(); startEdit(record); }}
                         className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                         aria-label={`Edit ${record.name}`}
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                       </button>
                       <button
                         onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                         className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                         aria-label={`Delete ${record.name}`}
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
