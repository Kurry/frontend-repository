import { useState } from 'react';
import { useStore } from '../store';
import type { DomainState, DrillCheckpoint } from '../types';
import { Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function CheckpointsList() {
  const { records, filter, setFilter, deleteRecord, selectForRecovery, createRecord, updateRecord, selectedRecordId } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DrillCheckpoint>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', description: '', area: '' });
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const handleCreate = () => {
    if (!newForm.title || !newForm.area) {
      setError('Title and Area are required.');
      return;
    }
    createRecord(newForm);
    setIsCreating(false);
    setNewForm({ title: '', description: '', area: '' });
    setError(null);
  };

  const handleUpdate = (id: string) => {
    if (editForm.title === '' || editForm.area === '') {
      setError('Title and Area cannot be empty.');
      return;
    }
    updateRecord(id, editForm);
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const handleEditClick = (record: DrillCheckpoint) => {
    setEditingId(record.id);
    setEditForm(record);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Checkpoints</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-slate-300 rounded px-2 py-1 text-sm bg-white text-slate-700"
            aria-label="Filter records by status"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Add Checkpoint
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-medium text-slate-700 mb-2">New Checkpoint</h3>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <div className="grid gap-2">
            <input
              placeholder="Title"
              value={newForm.title}
              onChange={e => setNewForm({...newForm, title: e.target.value})}
              className="border border-slate-300 rounded px-2 py-1 text-slate-700 w-full"
            />
            <input
              placeholder="Area"
              value={newForm.area}
              onChange={e => setNewForm({...newForm, area: e.target.value})}
              className="border border-slate-300 rounded px-2 py-1 text-slate-700 w-full"
            />
            <textarea
              placeholder="Description"
              value={newForm.description}
              onChange={e => setNewForm({...newForm, description: e.target.value})}
              className="border border-slate-300 rounded px-2 py-1 text-slate-700 w-full"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-700 px-3 py-1">Cancel</button>
              <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {filteredRecords.length === 0 && !isCreating ? (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          No checkpoints found. Add a new checkpoint or change the filter.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              className={cn(
                "p-4 rounded-lg border transition-all",
                selectedRecordId === record.id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              {editingId === record.id ? (
                <div className="grid gap-2">
                  {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                  <input
                    value={editForm.title || ''}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="border border-slate-300 rounded px-2 py-1 text-slate-700 w-full font-medium"
                  />
                  <input
                    value={editForm.area || ''}
                    onChange={e => setEditForm({...editForm, area: e.target.value})}
                    className="border border-slate-300 rounded px-2 py-1 text-slate-700 w-full text-sm"
                  />
                  <select
                    value={editForm.status || 'draft'}
                    onChange={e => setEditForm({...editForm, status: e.target.value as DomainState})}
                    className="border border-slate-300 rounded px-2 py-1 text-slate-700 w-full text-sm"
                  >
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="border border-slate-300 rounded px-2 py-1 text-slate-700 w-full text-sm"
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 px-3 py-1 text-sm">Cancel</button>
                    <button onClick={() => handleUpdate(record.id)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">{record.title}</h4>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        record.status === 'ready' ? "bg-green-100 text-green-700" :
                        record.status === 'draft' ? "bg-amber-100 text-amber-700" :
                        record.status === 'archived' ? "bg-slate-200 text-slate-700" :
                        record.status === 'empty' ? "bg-gray-100 text-gray-500" :
                        "bg-blue-100 text-blue-700" // changed
                      )}>
                        {record.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mb-2 font-medium">{record.area}</div>
                    <p className="text-sm text-slate-600">{record.description}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => selectForRecovery(record.id)}
                      className="flex items-center gap-1 text-sm px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                      title="Move into recovery path"
                    >
                      <ShieldAlert size={16} />
                      Recovery
                    </button>
                    <button
                      onClick={() => handleEditClick(record)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      aria-label="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if(confirm('Are you sure you want to delete this checkpoint?')) {
                          deleteRecord(record.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
