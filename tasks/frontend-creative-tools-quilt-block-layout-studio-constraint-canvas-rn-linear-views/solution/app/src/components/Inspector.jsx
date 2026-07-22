import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { blockStatuses } from '../utils/schema';

const FormSchema = z.object({
  blockName: z.string().min(1, 'Name is required').max(50, 'Max 50 chars'),
  size: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
  status: z.enum(blockStatuses)
});

export function Inspector() {
  const { records, selectedRecordId, updateRecord, createRecord, deleteRecord } = useStore();

  const record = records.find(r => r.id === selectedRecordId);
  const isCreating = selectedRecordId === 'new';

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: record || { blockName: '', size: 25, status: 'draft' }
  });

  useEffect(() => {
    if (record) {
      reset({
        blockName: record.blockName,
        size: record.size,
        status: record.status
      });
    } else if (isCreating) {
      reset({ blockName: '', size: 25, status: 'draft' });
    }
  }, [record, isCreating, reset]);

  const onSubmit = (data) => {
    if (isCreating) {
      createRecord(data);
    } else if (record) {
      updateRecord(record.id, data);
    }
  };

  if (!record && !isCreating) {
    return (
      <div className="p-6 h-full flex items-center justify-center text-gray-500 text-sm">
        Select a block to inspect or create a new one.
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">{isCreating ? 'Create Block' : 'Edit Block'}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Block Name</label>
          <input
            {...register('blockName')}
            className={`w-full p-2 border rounded ${errors.blockName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.blockName && <span className="text-xs text-red-500 mt-1 block">{errors.blockName.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Size (1-100)</label>
          <input
            type="number"
            {...register('size', { valueAsNumber: true })}
            className={`w-full p-2 border rounded ${errors.size ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.size && <span className="text-xs text-red-500 mt-1 block">{errors.size.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...register('status')}
            className={`w-full p-2 border rounded ${errors.status ? 'border-red-500' : 'border-gray-300'} capitalize`}
          >
            {blockStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.status && <span className="text-xs text-red-500 mt-1 block">{errors.status.message}</span>}
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" className="flex-1 bg-primary text-white py-2 rounded hover:bg-primary-dark transition">
            Save
          </button>
          {!isCreating && (
            <button
              type="button"
              onClick={() => deleteRecord(record.id)}
              className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
