import React, { useState, useMemo } from 'react';
import { useStore, generateId } from '../store.jsx';
import { Search, Plus, Filter, Edit, Archive, Trash2, ShieldAlert } from 'lucide-react';
import { SoundLayerRecordSchema } from '../schemas';

const STATUS_COLORS = {
  empty: 'bg-slate-700 text-slate-300',
  draft: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
  ready: 'bg-green-500/20 text-green-500 border-green-500/50',
  changed: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
  archived: 'bg-slate-600/20 text-slate-400 border-slate-600/50',
  failed: 'bg-red-500/20 text-red-500 border-red-500/50'
};

export const SoundLayers = () => {
  const { session, addRecord, updateRecord, deleteRecord } = useStore();
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const filteredRecords = useMemo(() => {
    return session.records.filter(r => {
      if (filter === 'all') return true;
      return r.status === filter;
    });
  }, [session.records, filter]);

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ ...record, tags: record.tags.join(', ') });
    setErrorMsg(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
    setErrorMsg(null);
  };

  const handleSave = () => {
    try {
      const parsedTags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      const dataToValidate = {
        ...editForm,
        volume: Number(editForm.volume),
        pan: Number(editForm.pan),
        duration: Number(editForm.duration),
        startTime: Number(editForm.startTime),
        tags: parsedTags
      };

      const result = SoundLayerRecordSchema.safeParse(dataToValidate);
      if (!result.success) {
        // Find the first error for simpler recovery feedback
        const firstError = result.error.issues[0];
        setErrorMsg(`Invalid ${firstError.path.join('.')}: ${firstError.message}`);
        return;
      }

      const isNew = !session.records.find(r => r.id === result.data.id);
      if (isNew) {
        addRecord(result.data);
      } else {
        updateRecord(result.data.id, result.data);
      }
      setEditingId(null);
      setEditForm(null);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const handleCreateNew = () => {
    const newRecord = {
      id: generateId(),
      name: "New Layer",
      status: "draft",
      volume: 80,
      pan: 0,
      duration: 10,
      startTime: 0,
      tags: [],
      recoveryNotes: ""
    };
    handleEdit(newRecord);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700 overflow-hidden" data-testid="sound-layers-panel">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 backdrop-blur">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Sound Layers
          <span className="bg-slate-700 text-xs px-2 py-1 rounded-full">{filteredRecords.length}</span>
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 rounded px-3 py-1.5 pr-8 text-sm focus:outline-none focus:border-blue-500"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
              <option value="failed">Failed</option>
            </select>
            <Filter size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleCreateNew}
            disabled={editingId !== null}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center gap-1 text-sm transition-colors disabled:opacity-50"
            aria-label="Create new layer"
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.length === 0 && !editingId && (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-lg">
            No sound layers match the current filter.
          </div>
        )}

        {/* New Item Edit Form always appears at top if it doesn't exist in list yet */}
        {editingId && editForm && !session.records.find(r => r.id === editingId) && (
          <EditFormView
            editForm={editForm}
            setEditForm={setEditForm}
            handleSave={handleSave}
            handleCancel={handleCancel}
            errorMsg={errorMsg}
          />
        )}

        {filteredRecords.map(record => (
          <div key={record.id} className="group relative border border-slate-700 rounded-lg p-3 bg-slate-900/50 hover:bg-slate-800/80 transition-colors">
            {editingId === record.id ? (
              <EditFormView
                editForm={editForm}
                setEditForm={setEditForm}
                handleSave={handleSave}
                handleCancel={handleCancel}
                errorMsg={errorMsg}
              />
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-200">{record.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[record.status] || STATUS_COLORS.empty}`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex gap-4">
                    <span>Vol: {record.volume}%</span>
                    <span>Pan: {record.pan}</span>
                    <span>{record.startTime}s - {record.startTime + record.duration}s</span>
                  </div>
                  {record.tags && record.tags.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {record.tags.map(t => (
                        <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(record)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-blue-600/80 rounded"
                    aria-label="Edit layer"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => updateRecord(record.id, { status: 'archived' })}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-600 rounded"
                    aria-label="Archive layer"
                  >
                    <Archive size={14} />
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-red-600/80 rounded"
                    aria-label="Delete layer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const EditFormView = ({ editForm, setEditForm, handleSave, handleCancel, errorMsg }) => {
  return (
    <div className="bg-slate-900 border border-blue-500/50 rounded-lg p-3 shadow-lg">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={editForm.name}
            onChange={e => setEditForm({...editForm, name: e.target.value})}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            value={editForm.status}
            onChange={e => setEditForm({...editForm, status: e.target.value})}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Volume (0-100)</label>
          <input
            type="number"
            value={editForm.volume}
            onChange={e => setEditForm({...editForm, volume: e.target.value})}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Start Time (s)</label>
          <input
            type="number"
            value={editForm.startTime}
            onChange={e => setEditForm({...editForm, startTime: e.target.value})}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Duration (s)</label>
          <input
            type="number"
            value={editForm.duration}
            onChange={e => setEditForm({...editForm, duration: e.target.value})}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            value={editForm.tags}
            onChange={e => setEditForm({...editForm, tags: e.target.value})}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 flex items-start gap-2 text-sm text-red-400 bg-red-950/30 p-2 rounded">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <p>{errorMsg} - Please correct this to preserve valid state.</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};
