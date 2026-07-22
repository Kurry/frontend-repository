import React, { useState } from 'react';
import { useStore } from '../store';
import type { DomainStatus, RecipeIngredient } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { z } from 'zod';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().min(0.1, 'Must be positive').max(100, 'Too large'),
  unit: z.enum(['cup', 'tbsp', 'tsp', 'g', 'oz']),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived'])
});

export const RecipeIngredients: React.FC = () => {
  const { records, selectedId, selectRecord, addRecord, updateRecord, deleteRecord } = useStore();
  const [filterStatus, setFilterStatus] = useState<DomainStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  // Editor state
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RecipeIngredient>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredRecords = records.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleStartEdit = (record: RecipeIngredient, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(record.id);
    setEditForm({ ...record });
    setErrors({});
  };

  const handleStartCreate = () => {
    setIsEditing('new');
    setEditForm({
      name: '',
      amount: 1,
      unit: 'cup',
      status: 'draft'
    });
    setErrors({});
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const validData = ingredientSchema.parse(editForm);
      if (isEditing === 'new') {
        addRecord(validData as RecipeIngredient);
      } else if (isEditing) {
        updateRecord(isEditing, validData);
      }
      setIsEditing(null);
    } catch (err: any) {
      if (err.errors) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this ingredient?')) {
      deleteRecord(id);
    }
  };

  const StatusBadge: React.FC<{status: DomainStatus}> = ({status}) => {
    const colors = {
      empty: 'bg-slate-100 text-slate-500',
      draft: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      changed: 'bg-amber-100 text-amber-700',
      archived: 'bg-purple-100 text-purple-700'
    };
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${colors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="p-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-800">Ingredients ({records.length})</h2>
          <button
            onClick={handleStartCreate}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Add new ingredient"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full py-1.5 px-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isEditing === 'new' && (
          <div className="bg-white p-3 rounded-md shadow-sm border border-blue-200 mb-3 text-sm">
            <div className="font-medium text-slate-700 mb-2">New Ingredient</div>
            <div className="space-y-2">
              <div>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Name"
                  className="w-full border rounded px-2 py-1"
                />
                {errors.name && <div className="text-red-500 text-xs mt-0.5">{errors.name}</div>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={editForm.amount || ''}
                    onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})}
                    placeholder="Amt"
                    className="w-full border rounded px-2 py-1"
                  />
                  {errors.amount && <div className="text-red-500 text-xs mt-0.5">{errors.amount}</div>}
                </div>
                <div className="w-16">
                  <select
                    value={editForm.unit || 'cup'}
                    onChange={e => setEditForm({...editForm, unit: e.target.value})}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="g">g</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
              </div>
              <div>
                <select
                  value={editForm.status || 'draft'}
                  onChange={e => setEditForm({...editForm, status: e.target.value as DomainStatus})}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="empty">empty</option>
                  <option value="draft">draft</option>
                  <option value="ready">ready</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsEditing(null)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                <button onClick={handleSave} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        )}

        {filteredRecords.length === 0 && isEditing !== 'new' && (
          <div className="text-center text-sm text-slate-500 py-8">
            <p>No ingredients found.</p>
            {filterStatus !== 'all' && <button onClick={() => setFilterStatus('all')} className="text-blue-600 hover:underline mt-1">Clear filter</button>}
          </div>
        )}

        <AnimatePresence>
          {filteredRecords.map(record => {
            if (isEditing === record.id) {
              return (
                <div key={record.id} className="bg-white p-3 rounded-md shadow-sm border border-blue-200 mb-2 text-sm">
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full border rounded px-2 py-1"
                      />
                      {errors.name && <div className="text-red-500 text-xs mt-0.5">{errors.name}</div>}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={editForm.amount || ''}
                          onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})}
                          className="w-full border rounded px-2 py-1"
                        />
                        {errors.amount && <div className="text-red-500 text-xs mt-0.5">{errors.amount}</div>}
                      </div>
                      <div className="w-16">
                        <select
                          value={editForm.unit || 'cup'}
                          onChange={e => setEditForm({...editForm, unit: e.target.value})}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="cup">cup</option>
                          <option value="tbsp">tbsp</option>
                          <option value="tsp">tsp</option>
                          <option value="g">g</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <select
                        value={editForm.status || 'draft'}
                        onChange={e => setEditForm({...editForm, status: e.target.value as DomainStatus})}
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="empty">empty</option>
                        <option value="draft">draft</option>
                        <option value="ready">ready</option>
                        <option value="changed">changed</option>
                        <option value="archived">archived</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={(e) => { e.stopPropagation(); setIsEditing(null); }} className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                      <button onClick={handleSave} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={record.id}
                onClick={() => selectRecord(record.id)}
                className={`p-3 rounded-md mb-2 cursor-pointer border transition-colors group relative ${
                  selectedId === record.id
                    ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{record.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{record.amount} {record.unit}</div>
                  </div>
                  <StatusBadge status={record.status} />
                </div>

                {record.substitute && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded p-1.5 border border-amber-100/50">
                    <span className="font-semibold">Sub:</span> {record.substituteAmount} {record.substituteUnit} {record.substitute}
                  </div>
                )}

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-sm shadow-sm backdrop-blur-sm">
                  <button onClick={(e) => handleStartEdit(record, e)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={12} /></button>
                  <button onClick={(e) => handleDelete(record.id, e)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
