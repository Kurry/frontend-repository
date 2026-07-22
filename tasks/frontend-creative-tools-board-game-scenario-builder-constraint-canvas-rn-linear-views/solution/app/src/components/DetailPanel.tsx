import React, { useEffect } from 'react';
import { useStore } from '../store';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  duration: z.number().min(1).max(120, "Duration exceeds maximum of 120 minutes"),
  requiredPlayers: z.number().min(1, "At least 1 player required").max(8, "Maximum 8 players")
});

type FormValues = z.infer<typeof schema>;

export const DetailPanel: React.FC = () => {
  const { records, selectedRecordId, setSelectedRecordId, updateRecord } = useStore();
  const record = records.find(r => r.id === selectedRecordId);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: record?.title || '',
      description: record?.description || '',
      duration: record?.duration || 15,
      requiredPlayers: record?.requiredPlayers || 1
    }
  });

  useEffect(() => {
    if (record) {
      reset({
        title: record.title,
        description: record.description,
        duration: record.duration,
        requiredPlayers: record.requiredPlayers
      });
    }
  }, [record, reset]);

  if (!record) return null;

  const onSubmit = (data: FormValues) => {
    updateRecord(record.id, data);
  };

  return (
    <div className="w-80 bg-white border-l shadow-xl flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-medium text-gray-900">Edit Scenario</h2>
        <button onClick={() => setSelectedRecordId(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <form id="edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              {...register('title')}
              className={`w-full text-sm border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className={`w-full text-sm border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (m)</label>
              <input
                type="number"
                {...register('duration', { valueAsNumber: true })}
                className={`w-full text-sm border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Players</label>
              <input
                type="number"
                {...register('requiredPlayers', { valueAsNumber: true })}
                className={`w-full text-sm border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${errors.requiredPlayers ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.requiredPlayers && <p className="text-red-500 text-xs mt-1">{errors.requiredPlayers.message}</p>}
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Status</span>
            <span className="font-medium text-gray-900 capitalize">{record.status}</span>
          </div>
          {record.status === 'conflict' && record.conflictReason && (
            <div className="bg-red-50 text-red-700 p-2 rounded text-xs border border-red-100 mt-2">
              <strong>Conflict:</strong> {record.conflictReason}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <button
          form="edit-form"
          type="submit"
          disabled={!isDirty}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
