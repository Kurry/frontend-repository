import { useState } from 'react';
import { useStore } from '../store';
import { RecordStatus } from '../types';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export default function TaskBoard() {
  const records = useStore(state => state.records);
  const selectedRecordId = useStore(state => state.selectedRecordId);
  const selectRecord = useStore(state => state.selectRecord);
  const createRecord = useStore(state => state.createRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const deleteRecord = useStore(state => state.deleteRecord);

  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');

  const [isCreating, setIsCreating] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<RecordStatus>('draft');
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleCreate = () => {
    if (!newTaskName.trim()) {
      setCreateError("Task name is required");
      return;
    }
    createRecord(newTaskName, newTaskStatus);
    setIsCreating(false);
    setNewTaskName('');
    setNewTaskStatus('draft');
    setCreateError(null);
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditTaskName(currentName);
    setEditError(null);
  };

  const saveEdit = (id: string, currentStatus: RecordStatus) => {
    if (!editTaskName.trim()) {
      setEditError("Task name is required");
      return;
    }
    updateRecord(id, editTaskName, currentStatus);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Restock Tasks</h2>
        <div className="flex gap-2 items-center">
          <select
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
            title="Create Task"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isCreating && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Task name"
                className="border border-slate-300 rounded px-2 py-1 w-full"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-between items-center">
                <select
                  className="border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                  value={newTaskStatus}
                  onChange={e => setNewTaskStatus(e.target.value as RecordStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => { setIsCreating(false); setCreateError(null); }} className="text-slate-500 hover:text-slate-700"><X size={18} /></button>
                  <button onClick={handleCreate} className="text-blue-600 hover:text-blue-800"><Check size={18} /></button>
                </div>
              </div>
              {createError && <p className="text-red-600 text-xs mt-1">{createError}</p>}
            </div>
          </div>
        )}

        {records.length === 0 && !isCreating ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No restock tasks available.
          </div>
        ) : filteredRecords.length === 0 && !isCreating ? (
           <div className="text-center py-8 text-slate-500 text-sm">
            No tasks match the current filter.
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedRecordId === record.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => selectRecord(record.id)}
            >
              {editingId === record.id ? (
                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                    value={editTaskName}
                    onChange={e => setEditTaskName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="text-slate-500"><X size={16} /></button>
                    <button onClick={() => saveEdit(record.id, record.status)} className="text-blue-600"><Check size={16} /></button>
                  </div>
                  {editError && <p className="text-red-600 text-xs">{editError}</p>}
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-900 leading-tight mb-1">{record.task}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {record.status}
                    </span>
                  </div>
                  <div className="flex gap-2 text-slate-400">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(record.id, record.task); }}
                      className="hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                      className="hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
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