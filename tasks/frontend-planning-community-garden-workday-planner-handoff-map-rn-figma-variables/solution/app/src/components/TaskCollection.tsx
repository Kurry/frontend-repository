import React, { useState, useMemo } from 'react';
import type { WorkTask, DomainStatus } from '../types';
import { Edit2, Archive, Plus } from 'lucide-react';
import clsx from 'clsx';

export const TaskCollection: React.FC<{
  records: WorkTask[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  addRecord: (task: Omit<WorkTask, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<WorkTask>) => void;
  archiveRecord: (id: string) => void;
}> = ({ records, onSelect, selectedId, addRecord, updateRecord, archiveRecord }) => {
  const [filter, setFilter] = useState<DomainStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkTask>>({});
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return filter === 'all' ? records : records.filter(r => r.status === filter);
  }, [records, filter]);

  const handleStartEdit = (task: WorkTask) => {
    setEditingId(task.id);
    setEditForm(task);
    setError(null);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    if (!editForm.title?.trim() || !editForm.description?.trim()) {
      setError('Title and description are required.');
      return;
    }

    // Exact bounds / validation for requiredDate
    if (editForm.requiredDate) {
      const d = new Date(editForm.requiredDate);
      if (isNaN(d.getTime())) {
         setError('Invalid date format.');
         return;
      }
      if (d.getFullYear() < 2020 || d.getFullYear() > 2030) {
         setError('Date must be between 2020 and 2030 to be valid.');
         return;
      }
    }

    updateRecord(editingId, editForm);
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const handleAdd = () => {
    addRecord({
      title: 'New Task',
      description: 'Task description',
      status: 'draft',
      area: 'North',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Work Tasks</h2>
        <button
          onClick={handleAdd}
          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200 motion-reduce:transition-none"
          aria-label="Add new task"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="p-2 border-b border-gray-200 bg-gray-50 flex gap-2 overflow-x-auto">
        {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-3 py-1 text-sm rounded-full capitalize transition-colors duration-200 motion-reduce:transition-none",
              filter === f ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.map(task => (
          <div
            key={task.id}
            onClick={() => onSelect(task.id)}
            className={clsx(
              "p-3 rounded-lg border transition-all duration-200 motion-reduce:transition-none cursor-pointer shadow-sm relative group",
              selectedId === task.id ? "border-green-500 ring-1 ring-green-500 bg-green-50" : "border-gray-200 hover:border-green-300 bg-white"
            )}
          >
            {editingId === task.id ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Task Title"
                  className="w-full border border-gray-300 rounded p-1 text-sm focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={editForm.description || ''}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description"
                  className="w-full border border-gray-300 rounded p-1 text-sm focus:ring-1 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <select
                    value={editForm.status || 'draft'}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as DomainStatus })}
                    className="w-1/2 border border-gray-300 rounded p-1 text-sm focus:ring-1 focus:ring-green-500"
                  >
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select
                    value={editForm.area || ''}
                    onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-1/2 border border-gray-300 rounded p-1 text-sm focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">No Area</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Greenhouse">Greenhouse</option>
                  </select>
                </div>
                <input
                  type="date"
                  value={editForm.requiredDate ? editForm.requiredDate.split('T')[0] : ''}
                  onChange={e => setEditForm({ ...editForm, requiredDate: e.target.value })}
                  className="w-full border border-gray-300 rounded p-1 text-sm focus:ring-1 focus:ring-green-500"
                />
                {error && <div className="text-red-500 text-xs bg-red-50 p-1 rounded border border-red-200">{error}</div>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setEditingId(null); setError(null); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleSaveEdit} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors duration-200 motion-reduce:transition-none">Save</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div className="pr-12">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                    <div className="flex gap-2 mt-1">
                      {task.area && <span className="text-[10px] text-gray-500 font-medium">Area: {task.area}</span>}
                      {task.requiredDate && <span className="text-[10px] text-gray-500 font-medium">Due: {task.requiredDate.split('T')[0]}</span>}
                    </div>
                  </div>
                  <span className={clsx(
                    "absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold",
                    task.status === 'ready' ? 'bg-green-100 text-green-800' :
                    task.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'changed' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'empty' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-200 text-gray-500' // archived
                  )}>
                    {task.status}
                  </span>
                </div>
                {task.handoffOwner && (
                  <div className="mt-2 text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">
                    Owner: {task.handoffOwner}
                  </div>
                )}
                <div className="absolute bottom-2 right-2 hidden group-hover:flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleStartEdit(task)} className="p-1.5 bg-white shadow rounded border border-gray-200 text-gray-600 hover:text-blue-600 transition-colors duration-200 motion-reduce:transition-none"><Edit2 size={14} /></button>
                  <button onClick={() => archiveRecord(task.id)} className="p-1.5 bg-white shadow rounded border border-gray-200 text-gray-600 hover:text-yellow-600 transition-colors duration-200 motion-reduce:transition-none"><Archive size={14} /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center p-8 text-gray-400 text-sm">
            No tasks found in this view.
          </div>
        )}
      </div>
    </div>
  );
};
