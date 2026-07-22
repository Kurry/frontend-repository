import React, { useState } from 'react';
import { useStore } from './useStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export default function DrumPatterns() {
  const { state, set } = useStore();
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', tempo: 120, status: 'draft' });
  const [error, setError] = useState(null);

  const addPattern = () => set(s => s.records.push({ id: generateId(), name: 'New Pattern', tempo: 120, status: 'empty', evidence: null }));
  const deletePattern = (id) => set(s => { s.records = s.records.filter(r => r.id !== id); if (s.auditLensState.selectedId === id) { s.auditLensState.selectedId = null; s.auditLensState.mode = 'idle'; } });

  const startEdit = (record) => { setEditingId(record.id); setEditForm({ name: record.name, tempo: record.tempo, status: record.status }); setError(null); };
  const saveEdit = (id) => {
    if (!editForm.name.trim()) return setError('Name required.');
    if (editForm.tempo < 40 || editForm.tempo > 300) return setError('Tempo must be 40-300.');
    set(s => {
      const record = s.records.find(r => r.id === id);
      if (record) { record.name = editForm.name.trim(); record.tempo = parseInt(editForm.tempo); record.status = editForm.status; }
    });
    setEditingId(null); setError(null);
  };

  const filteredRecords = filter === 'all' ? state.records : state.records.filter(r => r.status === filter);

  return (
    <div className="flex flex-col gap-4 p-4 border border-zinc-200 rounded-md bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Drum Patterns</h2>
        <div className="flex gap-2">
            <select className="border rounded px-2 py-1 text-sm bg-zinc-50" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All</option><option value="empty">Empty</option><option value="draft">Draft</option><option value="ready">Ready</option><option value="changed">Changed</option><option value="archived">Archived</option>
            </select>
            <button onClick={addPattern} className="flex items-center gap-1 px-3 py-1 bg-zinc-900 text-white rounded text-sm hover:bg-zinc-800"><Plus size={16} /> New</button>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-h-[300px]">
        {filteredRecords.length === 0 ? <div className="text-zinc-500 text-sm p-8 border-dashed border">No patterns</div> :
            filteredRecords.map(record => (
              <div key={record.id} className="flex flex-col gap-2 p-3 border rounded border-zinc-200 hover:border-zinc-300">
                  {editingId === record.id ? (
                      <div className="flex gap-2">
                          <input type="text" className="border px-2 py-1 flex-1 text-sm rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
                          <input type="number" className="border px-2 py-1 w-20 text-sm rounded" value={editForm.tempo} onChange={e => setEditForm({...editForm, tempo: e.target.value})} />
                          <select className="border px-2 py-1 text-sm rounded" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                              <option value="empty">Empty</option><option value="draft">Draft</option><option value="ready">Ready</option><option value="changed">Changed</option><option value="archived">Archived</option>
                          </select>
                          <button onClick={() => saveEdit(record.id)} className="bg-green-600 text-white text-sm px-2 rounded">Save</button>
                          <button onClick={() => setEditingId(null)} className="bg-zinc-200 text-sm px-2 rounded">Cancel</button>
                          {error && <div className="text-red-500 text-xs w-full block mt-1">{error}</div>}
                      </div>
                  ) : (
                      <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                              <span className="font-medium text-sm">{record.name}</span>
                              <span className="text-xs text-zinc-500">Tempo: {record.tempo} | Status: {record.status}</span>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => startEdit(record)}><Edit2 size={16} /></button>
                              <button onClick={() => deletePattern(record.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                          </div>
                      </div>
                  )}
              </div>
            ))
        }
      </div>
    </div>
  );
}
