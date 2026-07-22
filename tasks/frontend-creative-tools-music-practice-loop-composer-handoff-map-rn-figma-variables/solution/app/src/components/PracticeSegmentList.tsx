import React, { useState } from 'react';
import { useAppStore } from '../store';
import { DomainState, Readiness, PracticeSegmentSchema } from '../types';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

export function PracticeSegmentList() {
  const { records, filterStatus, setFilterStatus, addRecord, updateRecord, deleteRecord, selectedRecordId, setSelectedRecordId } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', domainState: 'draft' as DomainState });
  const [errors, setErrors] = useState<{name?: string}>({});

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.domainState === filterStatus);

  const handleCreate = () => {
    try {
      const valid = z.object({ name: z.string().min(1, "Name is required").max(100) }).parse({ name: formData.name });
      addRecord({ name: valid.name, domainState: formData.domainState, owner: null, readiness: 'not_ready' });
      setIsCreating(false);
      setFormData({ name: '', domainState: 'draft' });
      setErrors({});
    } catch (e) {
      if (e instanceof z.ZodError) {
        const newErrs: any = {};
        e.errors.forEach(err => { newErrs[err.path[0]] = err.message; });
        setErrors(newErrs);
      }
    }
  };

  const handleUpdate = (id: string, currentName: string) => {
    try {
      const valid = z.object({ name: z.string().min(1, "Name is required").max(100) }).parse({ name: formData.name });
      updateRecord(id, { name: valid.name });
      setEditingId(null);
      setErrors({});
    } catch (e) {
       if (e instanceof z.ZodError) {
        const newErrs: any = {};
        e.errors.forEach(err => { newErrs[err.path[0]] = err.message; });
        setErrors(newErrs);
      }
    }
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setFormData({ name: r.name, domainState: r.domainState });
    setErrors({});
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Practice Segments</h2>
          <button
            onClick={() => { setIsCreating(true); setFormData({ name: '', domainState: 'draft' }); }}
            className="p-1 hover:bg-slate-100 rounded text-slate-600"
            aria-label="New Practice Segment"
          >
            <Plus size={20} />
          </button>
        </div>
        <select
          className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          aria-label="Filter by Status"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="conflict">Conflict</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-3 rounded border border-blue-200 shadow-sm"
            >
              <input
                type="text"
                placeholder="Segment Name"
                className={`w-full p-2 border rounded text-sm mb-1 ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              {errors.name && <p className="text-xs text-red-500 mb-2">{errors.name}</p>}
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsCreating(false)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                <button onClick={handleCreate} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"><Check size={14} className="mr-1"/> Save</button>
              </div>
            </motion.div>
          )}

          {filteredRecords.map(r => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={r.id}
              className={`p-3 rounded border cursor-pointer transition-colors ${selectedRecordId === r.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-blue-200'}`}
              onClick={() => setSelectedRecordId(r.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRecordId(r.id); } }}
            >
              {editingId === r.id ? (
                <div onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    className={`w-full p-1 border rounded text-sm mb-1 ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {errors.name && <p className="text-xs text-red-500 mb-1">{errors.name}</p>}
                  <div className="flex justify-end gap-1 mt-2">
                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><X size={14}/></button>
                    <button onClick={() => handleUpdate(r.id, r.name)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Check size={14}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm text-slate-800 truncate pr-2">{r.name}</div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(r); }} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Edit"><Edit2 size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteRecord(r.id); }} className="text-slate-400 hover:text-red-600 p-1" aria-label="Delete"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${getStatusColor(r.domainState)}`}>
                      {r.domainState}
                    </span>
                    {r.owner && <span className="text-slate-500 truncate">Owner: {r.owner}</span>}
                  </div>
                </>
              )}
            </motion.div>
          ))}
          {filteredRecords.length === 0 && !isCreating && (
            <div className="text-center p-4 text-sm text-slate-500">
              No segments found. Create one or clear filters.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function getStatusColor(status: string) {
  switch(status) {
    case 'draft': return 'bg-slate-100 text-slate-700 border border-slate-200';
    case 'ready': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'changed': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'archived': return 'bg-slate-200 text-slate-500 border border-slate-300';
    case 'conflict': return 'bg-red-100 text-red-700 border border-red-200';
    case 'resolved': return 'bg-green-100 text-green-700 border border-green-200';
    default: return 'bg-slate-100 text-slate-700';
  }
}
