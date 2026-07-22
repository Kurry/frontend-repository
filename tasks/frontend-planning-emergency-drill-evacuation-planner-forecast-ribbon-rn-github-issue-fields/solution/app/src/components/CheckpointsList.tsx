import { useState } from 'react';
import { useAppStore, store } from '../store';
import { Checkpoint, CheckpointStatus } from '../types';
import { Plus, Edit2, Trash2, Archive } from 'lucide-react';
import clsx from 'clsx';

export function CheckpointsList() {
  const { checkpoints, selectedId } = useAppStore();
  const [filter, setFilter] = useState<CheckpointStatus | 'all'>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Checkpoint>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCheckpoints = filter === 'all'
    ? checkpoints
    : checkpoints.filter(c => c.status === filter);

  const handleSave = (id: string) => {
    if (!editForm.name || editForm.name.trim() === '') {
      setErrorMsg("Name is required");
      return;
    }
    if (editForm.predicted_time === undefined || editForm.predicted_time < 0) {
      setErrorMsg("Predicted time must be >= 0");
      return;
    }
    if (editForm.target_time === undefined || editForm.target_time < 0) {
      setErrorMsg("Target time must be >= 0");
      return;
    }

    if (id === 'new') {
      const newCp: Checkpoint = {
        id: `cp-${Date.now()}`,
        name: editForm.name,
        status: editForm.status || 'draft',
        predicted_time: editForm.predicted_time,
        target_time: editForm.target_time,
        headcount: editForm.headcount || 0
      };
      store.addCheckpoint(newCp);
    } else {
      store.updateCheckpoint(id, editForm);
    }
    setEditingId(null);
    setEditForm({});
    setErrorMsg(null);
  };

  const handleCreate = () => {
    setEditingId('new');
    setEditForm({
      name: '',
      status: 'draft',
      predicted_time: 0,
      target_time: 0,
      headcount: 0
    });
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Checkpoints</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-colors cursor-pointer"
        >
          <Plus size={16} /> New
        </button>
      </div>

      <div className="flex gap-2 text-sm border-b border-gray-200 pb-2">
        {['all', 'draft', 'ready', 'changed', 'archived'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={clsx(
              "px-2 py-1 rounded capitalize transition-colors cursor-pointer",
              filter === f ? "bg-gray-200 font-semibold text-gray-800" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {editingId === 'new' && (
        <div className="bg-white p-3 rounded shadow-sm border border-blue-200 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Name"
            value={editForm.name || ''}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            className="border p-1 rounded text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Predicted"
              value={editForm.predicted_time === undefined ? '' : editForm.predicted_time}
              onChange={e => setEditForm({ ...editForm, predicted_time: parseInt(e.target.value) || 0 })}
              className="border p-1 rounded text-sm w-1/2"
            />
            <input
              type="number"
              placeholder="Target"
              value={editForm.target_time === undefined ? '' : editForm.target_time}
              onChange={e => setEditForm({ ...editForm, target_time: parseInt(e.target.value) || 0 })}
              className="border p-1 rounded text-sm w-1/2"
            />
          </div>
          {errorMsg && <div className="text-red-500 text-xs">{errorMsg}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm cursor-pointer">Cancel</button>
            <button onClick={() => handleSave('new')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm cursor-pointer">Save</button>
          </div>
        </div>
      )}

      {filteredCheckpoints.map(cp => (
        <div
          key={cp.id}
          onClick={() => {
            if (editingId !== cp.id) store.selectCheckpoint(cp.id);
          }}
          className={clsx(
            "flex flex-col p-3 rounded border transition-all cursor-pointer relative group",
            selectedId === cp.id ? "border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]" : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          {editingId === cp.id ? (
            <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="border p-1 rounded text-sm"
              />
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value as CheckpointStatus })}
                className="border p-1 rounded text-sm"
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
              {errorMsg && <div className="text-red-500 text-xs">{errorMsg}</div>}
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm cursor-pointer">Cancel</button>
                <button onClick={() => handleSave(cp.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm cursor-pointer">Save</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-800">{cp.name}</h3>
                <span className={clsx(
                  "text-xs px-2 py-0.5 rounded-full capitalize",
                  cp.status === 'ready' ? "bg-green-100 text-green-700" :
                  cp.status === 'archived' ? "bg-gray-100 text-gray-700" :
                  cp.status === 'changed' ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                )}>
                  {cp.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex gap-3">
                <span>Pred: {cp.predicted_time}m</span>
                <span>Tgt: {cp.target_time}m</span>
                <span>HC: {cp.headcount}</span>
              </div>

              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(cp.id); setEditForm(cp); setErrorMsg(null); }}
                  className="p-1 text-gray-500 hover:text-blue-600 bg-white rounded shadow-sm cursor-pointer"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); store.updateCheckpoint(cp.id, { status: 'archived' }); }}
                  className="p-1 text-gray-500 hover:text-gray-700 bg-white rounded shadow-sm cursor-pointer"
                  title="Archive"
                >
                  <Archive size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) store.deleteCheckpoint(cp.id); }}
                  className="p-1 text-gray-500 hover:text-red-600 bg-white rounded shadow-sm cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      {filteredCheckpoints.length === 0 && (
        <div className="text-center text-gray-400 py-8 text-sm">
          No checkpoints found.
        </div>
      )}
    </div>
  );
}
