import { useState } from 'react';
import { useStore } from '../store';
import type { ColorRecord } from '../store';
import { Plus, Trash2, Edit2, Check, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name required'),
  colorValue: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
});

export const ColorsCollection = () => {
  const { records, filterStatus, setFilterStatus, createRecord, updateRecord, deleteRecord, selectRecord, selectedRecordId } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', colorValue: '#000000' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  const statuses: (ColorRecord['status'] | 'all')[] = ['all', 'empty', 'draft', 'ready', 'changed', 'archived'];

  const validateForm = (data: typeof formData) => {
    const result = formSchema.safeParse(data);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(e => {
        if (e.path[0]) newErrors[e.path[0].toString()] = e.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleCreate = () => {
    if (validateForm(formData)) {
      createRecord({
        name: formData.name,
        colorValue: formData.colorValue,
        status: 'draft',
        evidence: 'Manually created record',
        lineage: 'good'
      });
      setIsCreating(false);
      setFormData({ name: '', colorValue: '#000000' });
    }
  };

  const handleUpdate = (id: string) => {
    if (validateForm(formData)) {
      updateRecord(id, { name: formData.name, colorValue: formData.colorValue });
      setEditingId(null);
    }
  };

  const startEdit = (record: ColorRecord) => {
    setFormData({ name: record.name, colorValue: record.colorValue });
    setErrors({});
    setEditingId(record.id);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="relative inline-block text-sm">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="appearance-none bg-white border border-neutral-300 rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter colors by status"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <Filter className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <button
          onClick={() => { setIsCreating(true); setFormData({ name: 'New Color', colorValue: '#cccccc' }); setErrors({}); }}
          className="flex items-center gap-1 text-sm bg-blue-600 text-white px-2 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          aria-label="Create new color"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full text-sm p-1.5 rounded border ${errors.name ? 'border-red-500' : 'border-neutral-300'}`}
                    placeholder="Name"
                    aria-label="New color name"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colorValue}
                    onChange={e => setFormData({...formData, colorValue: e.target.value})}
                    className="w-8 h-8 rounded cursor-pointer p-0 border-0"
                    aria-label="New color value"
                  />
                  <input
                    type="text"
                    value={formData.colorValue}
                    onChange={e => setFormData({...formData, colorValue: e.target.value})}
                    className={`flex-1 text-sm p-1.5 rounded border ${errors.colorValue ? 'border-red-500' : 'border-neutral-300'}`}
                    aria-label="New hex value"
                  />
                </div>
                {errors.colorValue && <p className="text-xs text-red-600">{errors.colorValue}</p>}
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-neutral-700" aria-label="Cancel create"><X className="w-4 h-4" /></button>
                  <button onClick={handleCreate} className="text-blue-600 hover:text-blue-800" aria-label="Confirm create"><Check className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          )}

          {filteredRecords.length === 0 && !isCreating && (
            <div className="text-sm text-neutral-500 text-center py-4 bg-white rounded-lg border border-neutral-200 border-dashed">
              No colors found. Adjust filter or create a new one.
            </div>
          )}

          {filteredRecords.map((record) => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={record.id}
              className={`group flex flex-col p-3 rounded-lg border transition-all cursor-pointer ${selectedRecordId === record.id ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
              onClick={() => { if (editingId !== record.id) selectRecord(record.id); }}
            >
              {editingId === record.id ? (
                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full text-sm p-1 border rounded ${errors.name ? 'border-red-500' : 'border-neutral-300'}`}
                    aria-label="Edit name"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.colorValue}
                      onChange={e => setFormData({...formData, colorValue: e.target.value})}
                      className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                      aria-label="Edit color"
                    />
                    <input
                      type="text"
                      value={formData.colorValue}
                      onChange={e => setFormData({...formData, colorValue: e.target.value})}
                      className={`w-24 text-sm p-1 border rounded ${errors.colorValue ? 'border-red-500' : 'border-neutral-300'}`}
                      aria-label="Edit hex"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="p-1 text-neutral-500 hover:bg-neutral-100 rounded" aria-label="Cancel edit"><X className="w-4 h-4" /></button>
                    <button onClick={() => handleUpdate(record.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" aria-label="Save edit"><Check className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-6 h-6 rounded-md shadow-inner shrink-0" style={{ backgroundColor: record.colorValue }} aria-hidden="true" />
                      <div className="truncate">
                        <h3 className="text-sm font-medium text-neutral-900 truncate">{record.name}</h3>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">{record.colorValue}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(record); }} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded" aria-label={`Edit ${record.name}`}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label={`Delete ${record.name}`}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    {/* Mobile visible controls */}
                    <div className="flex items-center gap-1 md:hidden">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(record); }} className="p-2 text-neutral-500" aria-label={`Edit ${record.name}`}><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }} className="p-2 text-neutral-500" aria-label={`Delete ${record.name}`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                      ${record.status === 'ready' ? 'bg-green-100 text-green-800' :
                        record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        record.status === 'changed' ? 'bg-orange-100 text-orange-800' :
                        record.status === 'archived' ? 'bg-neutral-200 text-neutral-700' :
                        'bg-neutral-100 text-neutral-600'}
                    `}>
                      {record.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                      ${record.lineage === 'bad' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}
                    `}>
                      {record.lineage} lineage
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
