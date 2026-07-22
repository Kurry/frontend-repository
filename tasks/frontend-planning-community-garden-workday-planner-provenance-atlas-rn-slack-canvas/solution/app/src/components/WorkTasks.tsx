import { useState } from 'react';
import type { WorkTask, TaskStatus } from '../types';
import { Plus, Edit2, Archive, AlertCircle, Link } from 'lucide-react';

interface WorkTasksProps {
  tasks: WorkTask[];
  onAdd: (task: Partial<WorkTask>) => void;
  onUpdate: (id: string, updates: Partial<WorkTask>) => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

export function WorkTasks({
  tasks,
  onAdd,
  onUpdate,
  selectedTaskId,
  onSelectTask
}: WorkTasksProps) {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkTask>>({});
  const [error, setError] = useState<string | null>(null);

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  const handleSave = (id: string) => {
    // Validation
    if (!editForm.title?.trim()) {
      setError('Title is required');
      return;
    }

    if (editForm.budget !== undefined && editForm.budget < 0) {
      setError('Budget cannot be negative');
      return;
    }

    onUpdate(id, editForm);
    setIsEditing(null);
    setEditForm({});
    setError(null);
  };

  const handleAddNew = () => {
    const newTask: Partial<WorkTask> = {
      title: 'New Task',
      description: '',
      status: 'draft',
      dependencies: [],
      provenanceStatus: 'idle'
    };
    onAdd(newTask);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          Work Tasks
          <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">
            {tasks.length}
          </span>
        </h2>
        <div className="flex gap-2">
          <select
            className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskStatus | 'all')}
            aria-label="Filter tasks"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
            aria-label="Add new task"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <AlertCircle size={32} className="mb-2 opacity-50" />
            <p>No tasks found in this view.</p>
            <p className="text-sm mt-1">Try changing the filter or adding a new task.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedTaskId === task.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
              } ${task.status === 'archived' ? 'opacity-70' : ''}`}
            >
              {isEditing === task.id ? (
                <div className="space-y-3">
                  {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={editForm.title || ''}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Task Title *"
                  />
                  <textarea
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={editForm.description || ''}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Description"
                  />
                  <div className="flex gap-2">
                    <select
                      className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={editForm.status || 'draft'}
                      onChange={e => setEditForm({...editForm, status: e.target.value as TaskStatus})}
                    >
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <input
                      type="number"
                      className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={editForm.budget || ''}
                      onChange={e => setEditForm({...editForm, budget: parseFloat(e.target.value) || 0})}
                      placeholder="Budget"
                      min="0"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500">Dependencies (Task IDs)</label>
                    <select
                      multiple
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={editForm.dependencies || []}
                      onChange={e => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setEditForm({...editForm, dependencies: selected});
                      }}
                    >
                      {tasks.filter(t => t.id !== task.id).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => { setIsEditing(null); setError(null); }}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(task.id)}
                      className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={() => onSelectTask(task.id)} className="cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-800 line-clamp-1">{task.title}</h3>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        task.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                        task.status === 'archived' ? 'bg-slate-200 text-slate-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status}
                      </span>
                      <div className="relative group ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(task.id);
                            setEditForm(task);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          aria-label="Edit task"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdate(task.id, { status: 'archived' });
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          aria-label="Archive task"
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {task.description || 'No description provided.'}
                  </p>

                  {task.dependencies && task.dependencies.length > 0 && (
                     <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Link size={12} />
                        <span>{task.dependencies.length} dependencies</span>
                     </div>
                  )}

                  {task.provenanceStatus && task.provenanceStatus !== 'idle' && (
                    <div className={`mt-3 text-xs p-2 rounded flex items-center gap-2 ${
                      task.provenanceStatus === 'conflict' ? 'bg-red-50 text-red-700 border border-red-100' :
                      task.provenanceStatus === 'resolved' ? 'bg-green-50 text-green-700 border border-green-100' :
                      task.provenanceStatus === 'selected' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      'bg-slate-50 text-slate-700 border border-slate-100'
                    }`}>
                      <AlertCircle size={12} />
                      <span className="font-medium">Provenance:</span>
                      <span className="capitalize">{task.provenanceStatus}</span>
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
