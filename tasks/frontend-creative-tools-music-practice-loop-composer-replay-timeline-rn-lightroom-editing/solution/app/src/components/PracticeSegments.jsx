import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function PracticeSegments({ records, selectedId, onSelect, onCreate, onUpdate, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [errors, setErrors] = useState({});

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const startEdit = (record, e) => {
    e.stopPropagation();
    setEditingId(record.id);
    setEditForm({ name: record.name, duration: record.duration, status: record.status });
    setErrors({});
  };

  const saveEdit = (id, e) => {
    e.stopPropagation();
    const newErrors = {};
    if (!editForm.name || editForm.name.trim() === '') {
      newErrors.name = 'Name is required';
    }
    if (editForm.duration === undefined || editForm.duration < 0 || editForm.duration > 600) {
      newErrors.duration = 'Duration must be between 0 and 600';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onUpdate(id, editForm);
    setEditingId(null);
    setErrors({});
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <h2 className="font-semibold text-foreground">Practice Segments</h2>
        <button onClick={onCreate} aria-label="Create Segment" className="p-1.5 hover:bg-muted rounded-md text-foreground transition-colors">
          <Plus size={18} />
        </button>
      </div>
      <div className="p-2 border-b border-border">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full p-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-ring focus:outline-none"
          aria-label="Filter segments"
        >
          <option value="all">All</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
          <option value="conflict">Conflict</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.length === 0 && (
          <div className="text-center p-4 text-muted-foreground text-sm">No segments match filter.</div>
        )}
        {filteredRecords.map(r => (
          <div
            key={r.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedId === r.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30 bg-background'}`}
            onClick={() => onSelect(r.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(r.id) }}
          >
            {editingId === r.id ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <div>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className={`w-full p-1 text-sm border rounded ${errors.name ? 'border-destructive' : 'border-input'}`}
                  />
                  {errors.name && <div className="text-[10px] text-destructive mt-0.5">{errors.name}</div>}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={editForm.duration}
                      onChange={e => setEditForm({...editForm, duration: Number(e.target.value)})}
                      className={`w-full p-1 text-sm border rounded ${errors.duration ? 'border-destructive' : 'border-input'}`}
                    />
                    {errors.duration && <div className="text-[10px] text-destructive mt-0.5">{errors.duration}</div>}
                  </div>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                    className="p-1 text-sm border rounded w-1/2"
                  >
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                    <option value="conflict">Conflict</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-muted rounded">Cancel</button>
                  <button onClick={(e) => saveEdit(r.id, e)} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm truncate pr-2">{r.name || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase
                      ${r.status === 'ready' ? 'bg-green-100 text-green-800' :
                        r.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                        r.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        r.status === 'conflict' ? 'bg-red-100 text-red-800' :
                        r.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'}`}>
                      {r.status}
                    </span>
                    <span>{r.duration}s</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={(e) => startEdit(r, e)} aria-label="Edit" className="text-muted-foreground hover:text-primary"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(r.id); }} aria-label="Delete" className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
