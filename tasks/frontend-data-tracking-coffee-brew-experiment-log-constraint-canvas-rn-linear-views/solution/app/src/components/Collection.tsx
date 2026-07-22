import React, { useState } from 'react';
import type { Experiment, ExperimentStatus } from '../types';

interface Props {
  experiments: Experiment[];
  onAdd: (exp: Omit<Experiment, 'id' | 'status'>) => void;
  onUpdate: (id: string, updates: Partial<Experiment>) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const Collection: React.FC<Props> = ({ experiments, onAdd, onUpdate, onArchive, onDelete }) => {
  const [filter, setFilter] = useState<ExperimentStatus | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = filter === 'all' ? experiments : experiments.filter((e) => e.status === filter);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd({
      name: newName,
      parameters: { temperature: 93, grindSize: 15, brewTime: 180 },
      lane: 'temperature',
    });
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Experiments</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-sm border-gray-300 rounded-md p-1 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none"
          data-testid="status-filter"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="conflict">Conflict</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">No experiments found.</div>
        ) : (
          filtered.map((exp) => (
            <div key={exp.id} className="p-3 border rounded-md bg-gray-50 flex justify-between items-center group">
              {editingId === exp.id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 text-sm border p-1 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => { onUpdate(exp.id, { name: editName }); setEditingId(null); }}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 cursor-pointer" onClick={() => { setEditingId(exp.id); setEditName(exp.name); }}>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      {exp.name}
                      <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✎ Edit</span>
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{exp.status} • {exp.lane}</div>
                  </div>
                  <div className="flex gap-2">
                    {exp.status !== 'archived' && (
                      <button
                        onClick={() => onArchive(exp.id)}
                        className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 bg-gray-200 rounded"
                        data-testid={`archive-${exp.id}`}
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(exp.id)}
                      className="text-xs text-red-600 hover:text-red-900 px-2 py-1 bg-red-100 rounded"
                      data-testid={`delete-${exp.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleAdd} className="mt-auto pt-4 border-t border-gray-100">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Experiment name..."
            className="w-full text-sm border border-gray-300 rounded p-2 mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
            data-testid="new-experiment-input"
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition-colors">
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-gray-200 text-gray-700 text-sm py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-auto w-full py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
          data-testid="add-experiment-btn"
        >
          + Add Experiment
        </button>
      )}
    </div>
  );
};
