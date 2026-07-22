import { useState } from 'react';
import { useAppStore } from '../store';
import { RecordSchema, DOMAIN_STATUSES } from '../schema';
import { Plus, Trash2, Edit } from 'lucide-react';

export function LessonBlocksList() {
  const { records, createRecord, updateRecord, deleteRecord, selectedRecordId, selectRecord } = useAppStore();
  const [filter, setFilter] = useState<string>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ title: '', capacity: 10, status: 'empty' as any });
  const [formError, setFormError] = useState<string | null>(null);

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const startCreate = () => {
    setEditingId('new');
    setFormState({ title: '', capacity: 10, status: 'empty' });
    setFormError(null);
  };

  const startEdit = (id: string) => {
    const rec = records.find(r => r.id === id);
    if (rec) {
      setEditingId(id);
      setFormState({ title: rec.title, capacity: rec.capacity, status: rec.status });
      setFormError(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormError(null);
  };

  const saveForm = () => {
    const parsed = RecordSchema.omit({ id: true }).safeParse({
      title: formState.title,
      capacity: Number(formState.capacity),
      status: formState.status
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }

    if (editingId === 'new') {
      createRecord(parsed.data);
    } else if (editingId) {
      updateRecord(editingId, parsed.data);
    }
    setEditingId(null);
    setFormError(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Lesson Blocks</h2>

        <div className="flex space-x-2 mb-4">
          <select
            className="border rounded px-2 py-1 flex-1 text-sm bg-slate-50"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {DOMAIN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={startCreate}
            className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
            title="Create Block"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {editingId === 'new' && (
          <div className="border border-blue-300 bg-blue-50 p-3 rounded-lg space-y-2">
            <h3 className="font-medium text-sm text-blue-900">New Block</h3>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <input
              placeholder="Title"
              className="w-full border rounded px-2 py-1 text-sm"
              value={formState.title}
              onChange={e => setFormState({...formState, title: e.target.value})}
            />
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Capacity"
                className="w-1/2 border rounded px-2 py-1 text-sm"
                value={formState.capacity}
                onChange={e => setFormState({...formState, capacity: Number(e.target.value)})}
              />
              <select
                className="w-1/2 border rounded px-2 py-1 text-sm"
                value={formState.status}
                onChange={e => setFormState({...formState, status: e.target.value as any})}
              >
                {DOMAIN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <button onClick={cancelEdit} className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
              <button onClick={saveForm} className="px-3 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        )}

        {filteredRecords.map(r => (
          <div
            key={r.id}
            className={`border p-3 rounded-lg transition-colors group cursor-pointer ${
              selectedRecordId === r.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => selectRecord(r.id)}
          >
            {editingId === r.id ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                {formError && <p className="text-xs text-red-600">{formError}</p>}
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={formState.title}
                  onChange={e => setFormState({...formState, title: e.target.value})}
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    className="w-1/2 border rounded px-2 py-1 text-sm"
                    value={formState.capacity}
                    onChange={e => setFormState({...formState, capacity: Number(e.target.value)})}
                  />
                  <select
                    className="w-1/2 border rounded px-2 py-1 text-sm"
                    value={formState.status}
                    onChange={e => setFormState({...formState, status: e.target.value as any})}
                  >
                    {DOMAIN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={cancelEdit} className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                  <button onClick={saveForm} className="px-3 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-slate-800 break-words line-clamp-2 pr-2">{r.title}</h3>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => startEdit(r.id)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => deleteRecord(r.id)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${
                      r.status === 'ready' ? 'bg-green-500' :
                      r.status === 'empty' ? 'bg-slate-300' :
                      r.status === 'draft' ? 'bg-yellow-400' :
                      r.status === 'changed' ? 'bg-blue-400' : 'bg-slate-700'
                    }`} />
                    {r.status}
                  </span>
                  <span>Cap: {r.capacity}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && editingId !== 'new' && (
          <p className="text-sm text-slate-500 text-center py-8">No lesson blocks found.</p>
        )}
      </div>
    </div>
  );
}
