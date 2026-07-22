import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { z } from 'zod';
import clsx from 'clsx';

const STATUS_COLORS = {
  draft: 'bg-amber-100 text-amber-800 border-amber-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  changed: 'bg-blue-100 text-blue-800 border-blue-200',
  archived: 'bg-slate-100 text-slate-800 border-slate-200',
  conflict: 'bg-red-100 text-red-800 border-red-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const blockSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['draft', 'ready', 'changed', 'archived', 'conflict', 'resolved']),
  dimensions: z.string().regex(/^\d+x\d+$/, 'Format must be WxH (e.g., 10x10)')
});

export function QuiltBlocksList() {
  const { records, createRecord, updateRecord, deleteRecord, selectRecoveryRecord, recoveryBoardSelection } = useStore();
  const [filter, setFilter] = useState('all');

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter(r => r.status === filter);
  }, [records, filter]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Collection</h2>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white"
            data-testid="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="draft">Draft</option>
            <option value="conflict">Conflict</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
        <div className="grid grid-cols-1 gap-4">
          <NewBlockForm onCreate={createRecord} />

          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white" data-testid="empty-state">
              No blocks found for the selected filter.
            </div>
          ) : (
            filteredRecords.map(record => (
              <BlockRow
                key={record.id}
                record={record}
                isSelected={recoveryBoardSelection === record.id}
                onSelect={() => selectRecoveryRecord(record.id)}
                onUpdate={(updates) => updateRecord(record.id, updates)}
                onDelete={() => deleteRecord(record.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NewBlockForm({ onCreate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', status: 'draft', dimensions: '10x10' });
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const valid = blockSchema.parse(formData);
      onCreate(valid);
      setIsAdding(false);
      setFormData({ name: '', status: 'draft', dimensions: '10x10' });
      setError(null);
    } catch (err) {
      setError(err.errors[0].message);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-blue-50/50 rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:text-primary transition-colors font-medium"
        data-testid="btn-add-block"
      >
        <Plus size={20} /> Add New Block
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" data-testid="form-add-block">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Name</label>
          <input
            autoFocus
            type="text"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
            placeholder="Block Name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Dimensions</label>
          <input
            type="text"
            value={formData.dimensions}
            onChange={e => setFormData(p => ({ ...p, dimensions: e.target.value }))}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
            placeholder="WxH"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Status</label>
          <select
            value={formData.status}
            onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="conflict">Conflict</option>
          </select>
        </div>
      </div>

      {error && <div className="text-red-500 text-xs mb-4">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md font-medium">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-md font-medium hover:bg-primary-dark">Save Block</button>
      </div>
    </form>
  );
}

function BlockRow({ record, isSelected, onSelect, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(record);
  const [error, setError] = useState(null);

  const handleSave = () => {
    try {
      const valid = blockSchema.parse(editData);
      onUpdate(valid);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err.errors[0].message);
    }
  };

  const handleCancel = () => {
    setEditData(record);
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-primary rounded-xl p-4 shadow-sm relative">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <input
            autoFocus
            type="text"
            value={editData.name}
            onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            value={editData.dimensions}
            onChange={e => setEditData(p => ({ ...p, dimensions: e.target.value }))}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
          />
          <select
            value={editData.status}
            onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
            <option value="conflict">Conflict</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={handleCancel} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md" aria-label="Cancel edit"><X size={16} /></button>
          <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" aria-label="Save edit"><Check size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group cursor-pointer",
        isSelected ? "border-primary ring-1 ring-primary shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow"
      )}
      onClick={onSelect}
      data-testid={`block-row-${record.id}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if(e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-slate-900 truncate">{record.name}</h3>
          <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium border", STATUS_COLORS[record.status])}>
            {record.status}
          </span>
        </div>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <span>{record.dimensions}</span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-xs">{record.id}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
          aria-label="Edit block"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if(window.confirm('Are you sure you want to delete this block?')) onDelete();
          }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete block"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
