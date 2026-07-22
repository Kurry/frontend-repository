import React, { useState } from 'react';
import { useStore, store, LessonStatus, LessonBlock } from './store';
import { Plus, Edit2, Trash2, X, Check, Filter } from 'lucide-react';

const statusColors: Record<LessonStatus, string> = {
  empty: 'bg-slate-100 text-slate-600 border-slate-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  changed: 'bg-blue-50 text-blue-700 border-blue-200',
  archived: 'bg-slate-100 text-slate-400 border-slate-200 line-through'
};

export default function LessonBlocks() {
  const session = useStore(state => state);
  const records = session.records;

  const [filter, setFilter] = useState<LessonStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('45');
  const [status, setStatus] = useState<LessonStatus>('draft');
  const [error, setError] = useState<{field: string, msg: string} | null>(null);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const startEdit = (record: LessonBlock) => {
    setEditingId(record.id);
    setTitle(record.title);
    setDuration(record.duration.toString());
    setStatus(record.status);
    setError(null);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setTitle('');
    setDuration('45');
    setStatus('draft');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setError(null);
  };

  const validate = () => {
    if (!title.trim()) {
      setError({ field: 'title', msg: 'Title cannot be empty.' });
      return false;
    }
    const durNum = parseInt(duration, 10);
    if (isNaN(durNum) || durNum < 5 || durNum > 240) {
      setError({ field: 'duration', msg: 'Duration must be between 5 and 240 minutes.' });
      return false;
    }
    return true;
  };

  const save = () => {
    if (!validate()) return;

    if (isCreating) {
      store.addRecord({
        id: `rec-${Date.now()}`,
        title: title.trim(),
        duration: parseInt(duration, 10),
        status,
        forecastRibbonState: 'idle'
      });
      setIsCreating(false);
    } else if (editingId) {
      store.updateRecord(editingId, {
        title: title.trim(),
        duration: parseInt(duration, 10),
        status
      });
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Lesson Blocks</h2>
          <p className="text-sm text-slate-500 mt-1">Manage content modules and their readiness.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 rounded-md p-1">
            <Filter size={16} className="text-slate-400 mx-2" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 cursor-pointer py-1 pr-8"
              aria-label="Filter status"
            >
              <option value="all">All Statuses</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Block
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

          {isCreating && (
            <div className="border-2 border-indigo-200 bg-indigo-50/30 rounded-lg p-4 shadow-sm">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2"><Plus size={16}/> Create Block</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                  <input type="text" value={title} onChange={e => {setTitle(e.target.value); if(error?.field==='title') setError(null);}} className={`w-full border rounded p-2 text-sm bg-white ${error?.field === 'title' ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`} placeholder="Lesson title" />
                  {error?.field === 'title' && <p className="text-red-500 text-xs mt-1">{error.msg}</p>}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Duration (min)</label>
                    <input type="number" value={duration} onChange={e => {setDuration(e.target.value); if(error?.field==='duration') setError(null);}} className={`w-full border rounded p-2 text-sm bg-white ${error?.field === 'duration' ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`} min="5" max="240" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as LessonStatus)} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                {error?.field === 'duration' && <p className="text-red-500 text-xs mt-1">{error.msg}</p>}
                <div className="flex gap-2 pt-2">
                  <button onClick={save} className="flex-1 bg-indigo-600 text-white rounded py-1.5 text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-1"><Check size={16}/> Save</button>
                  <button onClick={cancelEdit} className="flex-1 bg-slate-200 text-slate-700 rounded py-1.5 text-sm font-medium hover:bg-slate-300 flex items-center justify-center gap-1"><X size={16}/> Cancel</button>
                </div>
              </div>
            </div>
          )}

          {filteredRecords.map(record => {
            if (editingId === record.id) {
              return (
                <div key={record.id} className="border-2 border-indigo-200 bg-white rounded-lg p-4 shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                      <input type="text" value={title} onChange={e => {setTitle(e.target.value); if(error?.field==='title') setError(null);}} className={`w-full border rounded p-2 text-sm bg-white ${error?.field === 'title' ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`} />
                      {error?.field === 'title' && <p className="text-red-500 text-xs mt-1">{error.msg}</p>}
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Duration (min)</label>
                        <input type="number" value={duration} onChange={e => {setDuration(e.target.value); if(error?.field==='duration') setError(null);}} className={`w-full border rounded p-2 text-sm bg-white ${error?.field === 'duration' ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`} min="5" max="240" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as LessonStatus)} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                          <option value="empty">Empty</option>
                          <option value="draft">Draft</option>
                          <option value="ready">Ready</option>
                          <option value="changed">Changed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                    {error?.field === 'duration' && <p className="text-red-500 text-xs mt-1">{error.msg}</p>}
                    <div className="flex gap-2 pt-2">
                      <button onClick={save} className="flex-1 bg-indigo-600 text-white rounded py-1.5 text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-1"><Check size={16}/> Save</button>
                      <button onClick={cancelEdit} className="flex-1 bg-slate-200 text-slate-700 rounded py-1.5 text-sm font-medium hover:bg-slate-300 flex items-center justify-center gap-1"><X size={16}/> Cancel</button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={record.id} className="group border border-slate-200 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded border ${statusColors[record.status]} uppercase tracking-wider`}>
                    {record.status}
                  </span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 focus-within:opacity-100">
                    <button onClick={() => startEdit(record)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" aria-label="Edit record">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => store.deleteRecord(record.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label="Delete record">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className={`font-semibold text-slate-800 mb-1 ${record.status === 'archived' ? 'opacity-60' : ''}`}>{record.title}</h3>
                <div className="text-sm text-slate-500 flex items-center gap-2 mt-auto pt-4">
                   <div className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">{record.duration} min</div>
                   <div className="text-xs font-mono text-slate-400 truncate ml-auto">{record.id}</div>
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && !isCreating && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <BookOpen size={48} className="mb-4 opacity-50" />
              <p className="text-slate-600 font-medium">No lesson blocks found.</p>
              <p className="text-sm mt-1">Try adjusting filters or create a new block.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
