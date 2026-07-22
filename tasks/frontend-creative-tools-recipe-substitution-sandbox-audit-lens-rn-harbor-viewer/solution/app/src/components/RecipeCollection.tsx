import React, { useState } from 'react';
import { useStore } from '../store';
import { Status, StatusEnum, IngredientRecordSchema } from '../types';
import { Edit2, Trash2, CheckCircle, AlertCircle, Plus, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

export function RecipeCollection() {
  const { records, filterStatus, setFilterStatus, deleteRecord, setActiveSelection, activeSelectionId, updateRecord, addRecord } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editValues, setEditValues] = useState<{name: string; quantity: number; unit: string; status: Status}>({ name: '', quantity: 0, unit: '', status: 'changed' });
  const [errors, setErrors] = useState<{name?: string; quantity?: string; unit?: string}>({});

  const filteredRecords = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  const validate = () => {
    try {
      IngredientRecordSchema.pick({ name: true, quantity: true, unit: true }).parse({
        name: editValues.name,
        quantity: editValues.quantity,
        unit: editValues.unit
      });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: any = {};
        err.errors.forEach(e => {
          if (e.path[0]) fieldErrors[e.path[0]] = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setIsCreating(false);
    setEditValues({ name: r.name, quantity: r.quantity, unit: r.unit, status: r.status });
    setErrors({});
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingId(null);
    setEditValues({ name: '', quantity: 0, unit: 'g', status: 'draft' });
    setErrors({});
  };

  const handleSaveEdit = (id: string) => {
    if (!validate()) return;
    updateRecord(id, editValues);
    setEditingId(null);
  };

  const handleSaveCreate = () => {
    if (!validate()) return;
    addRecord({ name: editValues.name, quantity: editValues.quantity, unit: editValues.unit });
    setIsCreating(false);
  };

  const handleArchive = (id: string) => {
    updateRecord(id, { status: 'archived' });
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow p-4 border border-slate-200 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Recipe Ingredients</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
            className="border rounded p-1 text-sm bg-slate-50"
          >
            <option value="all">All Statuses</option>
            {StatusEnum.options.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleCreateNew} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 pr-2 space-y-2">
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 border border-blue-300 bg-blue-50 rounded-md shadow-sm mb-2"
            >
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input type="text" placeholder="Name" value={editValues.name} onChange={e => { setEditValues(v => ({...v, name: e.target.value})); validate(); }} className={`w-full border p-1 text-sm ${errors.name ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                  </div>
                  <div className="w-20">
                    <input type="number" min="0" value={editValues.quantity} onChange={e => { setEditValues(v => ({...v, quantity: Number(e.target.value)})); validate(); }} className={`w-full border p-1 text-sm ${errors.quantity ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.quantity && <span className="text-xs text-red-500">{errors.quantity}</span>}
                  </div>
                  <div className="w-20">
                    <input type="text" placeholder="Unit" value={editValues.unit} onChange={e => { setEditValues(v => ({...v, unit: e.target.value})); validate(); }} className={`w-full border p-1 text-sm ${errors.unit ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.unit && <span className="text-xs text-red-500">{errors.unit}</span>}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button onClick={() => setIsCreating(false)} className="text-slate-600 px-3 py-1 bg-slate-100 rounded text-sm font-medium">Cancel</button>
                  <button onClick={handleSaveCreate} disabled={Object.keys(errors).length > 0} className="text-white px-3 py-1 bg-blue-600 disabled:opacity-50 rounded text-sm font-medium">Create</button>
                </div>
              </div>
            </motion.div>
          )}

          {filteredRecords.length === 0 && !isCreating && (
            <div className="text-slate-500 italic text-sm p-4">No records found. Clear filter to see more.</div>
          )}
          {filteredRecords.map(r => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={r.id}
              className={`p-3 border rounded-md shadow-sm flex items-center justify-between group ${activeSelectionId === r.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} ${r.status === 'archived' ? 'opacity-60 bg-slate-50' : ''}`}
              onClick={() => setActiveSelection(r.id)}
            >
              {editingId === r.id ? (
                <div className="flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
                   <div className="flex gap-2">
                    <div className="flex-1">
                      <input type="text" value={editValues.name} onChange={e => { setEditValues(v => ({...v, name: e.target.value})); validate(); }} className={`w-full border p-1 text-sm ${errors.name ? 'border-red-500' : 'border-slate-300'}`} />
                      {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                    </div>
                    <div className="w-20">
                      <input type="number" min="0" value={editValues.quantity} onChange={e => { setEditValues(v => ({...v, quantity: Number(e.target.value)})); validate(); }} className={`w-full border p-1 text-sm ${errors.quantity ? 'border-red-500' : 'border-slate-300'}`} />
                      {errors.quantity && <span className="text-xs text-red-500">{errors.quantity}</span>}
                    </div>
                    <div className="w-20">
                      <input type="text" value={editValues.unit} onChange={e => { setEditValues(v => ({...v, unit: e.target.value})); validate(); }} className={`w-full border p-1 text-sm ${errors.unit ? 'border-red-500' : 'border-slate-300'}`} />
                      {errors.unit && <span className="text-xs text-red-500">{errors.unit}</span>}
                    </div>
                    <div className="w-28">
                      <select value={editValues.status} onChange={e => setEditValues(v => ({...v, status: e.target.value as Status}))} className="w-full border p-1 text-sm">
                        {StatusEnum.options.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => setEditingId(null)} className="text-slate-600 px-3 py-1 bg-slate-100 rounded text-sm font-medium">Cancel</button>
                    <button onClick={() => handleSaveEdit(r.id)} disabled={Object.keys(errors).length > 0} className="text-white px-3 py-1 bg-green-600 disabled:opacity-50 rounded text-sm font-medium">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 cursor-pointer" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActiveSelection(r.id)}>
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      {r.name}
                      {r.discrepancy && <AlertCircle className="w-4 h-4 text-red-500" title={r.discrepancy} />}
                      {r.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="text-sm text-slate-500 flex gap-3">
                      <span>{r.quantity} {r.unit}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs uppercase tracking-wider">{r.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="text-slate-400 hover:text-blue-600 p-1" title="Edit" aria-label="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {r.status !== 'archived' && (
                      <button onClick={(e) => { e.stopPropagation(); handleArchive(r.id); }} className="text-slate-400 hover:text-orange-600 p-1" title="Archive" aria-label="Archive">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteRecord(r.id); }} className="text-slate-400 hover:text-red-600 p-1" title="Delete" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
