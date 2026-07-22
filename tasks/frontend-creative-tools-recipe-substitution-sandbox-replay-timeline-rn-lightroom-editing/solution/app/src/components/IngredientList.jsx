import React, { useState } from 'react';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

const recordSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  substitution: z.string().min(1, 'Substitution is required'),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived'])
});

export function IngredientList() {
  const { records, addRecord, updateRecord, deleteRecord, selectRecord, selectedRecordId } = useStore();
  const [filter, setFilter] = useState('all');
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(recordSchema),
    defaultValues: { name: '', quantity: '', substitution: '', status: 'draft' }
  });

  const onSubmit = (data) => {
    addRecord(data);
    setIsAdding(false);
    reset();
  };

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex flex-col gap-4 border-r pr-4 border-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ingredients</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isAdding ? 'Cancel' : 'Add New'}
        </button>
      </div>

      <div className="flex gap-2 text-sm">
        <span className="text-gray-500 font-medium my-auto">Filter:</span>
        {['all', 'draft', 'ready', 'changed', 'archived'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded capitalize ${filter === f ? 'bg-gray-200 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3 shadow-sm border">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input {...register('quantity')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            {errors.quantity && <span className="text-red-500 text-xs">{errors.quantity.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Substitution</label>
            <input {...register('substitution')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            {errors.substitution && <span className="text-red-500 text-xs">{errors.substitution.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select {...register('status')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button type="submit" className="mt-2 bg-green-600 text-white p-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
            Save Item
          </button>
        </form>
      )}

      {records.length === 0 ? (
        <div className="text-gray-500 italic p-4 text-center border-2 border-dashed rounded">
          No records. Create one or import to begin.
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-2">
          {filteredRecords.map(r => (
            <motion.div
              layout
              key={r.id}
              className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedRecordId === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              onClick={() => selectRecord(r.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{r.name}</h3>
                  <p className="text-sm text-gray-500">{r.quantity} → {r.substitution}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                  r.status === 'ready' ? 'bg-green-100 text-green-800' :
                  r.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                  r.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {r.status}
                </span>
              </div>
              {selectedRecordId === r.id && (
                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteRecord(r.id); }}
                    className="text-red-600 hover:text-red-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
                  >
                    Delete
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
