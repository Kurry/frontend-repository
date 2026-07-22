import React, { useState } from 'react';
import { useStore, useFilteredRecords, BikeServiceRecordSchema } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Plus, Trash2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = BikeServiceRecordSchema.omit({ id: true });
type FormValues = z.infer<typeof formSchema>;

export const RecordList: React.FC = () => {
  const records = useFilteredRecords();
  const { selectedRecordId, selectRecord, setFilter, filterStatus, deleteRecord, createRecord, updateRecord } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'empty',
      mileage: 0,
      notes: '',
      owner: 'unassigned',
      readiness: 0,
    }
  });

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      updateRecord(editingId, data);
      setEditingId(null);
    } else {
      createRecord(data);
      setIsCreating(false);
    }
    reset();
  };

  const startEdit = (e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    setEditingId(record.id);
    reset({ ...record });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          Records
        </h2>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border rounded p-1 max-w-[100px]"
          >
            <option value="all">All</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); reset({ status: 'empty', mileage: 0, notes: '', owner: 'unassigned', readiness: 0 }); }}
            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence>
          {isCreating && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-blue-50 p-3 rounded shadow-sm border border-blue-200"
            >
              <h3 className="font-semibold mb-2">New Record</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="block text-gray-700">Notes</label>
                  <input {...register('notes')} className="w-full border rounded p-1" />
                  {errors.notes && <span className="text-red-500 text-xs">{errors.notes.message}</span>}
                </div>
                <div>
                  <label className="block text-gray-700">Mileage</label>
                  <input type="number" {...register('mileage', { valueAsNumber: true })} className="w-full border rounded p-1" />
                  {errors.mileage && <span className="text-red-500 text-xs">{errors.mileage.message}</span>}
                </div>
                <div>
                  <label className="block text-gray-700">Status</label>
                  <select {...register('status')} className="w-full border rounded p-1">
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-2 py-1 bg-gray-200 rounded">Cancel</button>
                  <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">Save</button>
                </div>
              </div>
            </motion.form>
          )}

          {records.map(record => (
            <motion.div
              layout
              key={record.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-3 border rounded cursor-pointer transition-colors ${selectedRecordId === record.id ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-50'}`}
              onClick={() => selectRecord(record.id)}
            >
              {editingId === record.id ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 text-sm" onClick={e => e.stopPropagation()}>
                   <div>
                    <label className="block text-gray-700">Notes</label>
                    <input {...register('notes')} className="w-full border rounded p-1" />
                    {errors.notes && <span className="text-red-500 text-xs">{errors.notes.message}</span>}
                  </div>
                  <div>
                    <label className="block text-gray-700">Mileage</label>
                    <input type="number" {...register('mileage', { valueAsNumber: true })} className="w-full border rounded p-1" />
                    {errors.mileage && <span className="text-red-500 text-xs">{errors.mileage.message}</span>}
                  </div>
                  <div>
                    <label className="block text-gray-700">Status</label>
                    <select {...register('status')} className="w-full border rounded p-1">
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button type="button" onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-200 rounded">Cancel</button>
                    <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">Save</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium text-gray-800 line-clamp-1">{record.notes || 'No notes'}</div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${record.status === 'ready' ? 'bg-green-100 text-green-800' : record.status === 'archived' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Mileage: {record.mileage.toLocaleString()}</div>
                  <div className="flex justify-between items-center mt-2">
                     <span className="text-xs text-blue-600 font-medium capitalize">Owner: {record.owner.replace('_', ' ')}</span>
                     <div className="flex gap-1">
                        <button onClick={(e) => startEdit(e, record)} className="p-1 text-gray-500 hover:text-blue-600" aria-label="Edit record"><Edit className="w-4 h-4"/></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }} className="p-1 text-gray-500 hover:text-red-600" aria-label="Delete record"><Trash2 className="w-4 h-4"/></button>
                     </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
          {records.length === 0 && !isCreating && (
            <div className="text-center p-8 text-gray-500">
              <p>No records found.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
