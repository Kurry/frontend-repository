import React, { useEffect } from 'react';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  duration: z.number().min(1).max(120, "Duration exceeds maximum of 120 minutes"),
  requiredPlayers: z.number().min(1, "At least 1 player required").max(8, "Maximum 8 players")
});

type FormValues = z.infer<typeof schema>;

export const ConflictDialog: React.FC = () => {
  const { conflictDialogData, setConflictDialogData, resolveConflict } = useStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (conflictDialogData?.record) {
      reset({
        title: conflictDialogData.record.title,
        duration: conflictDialogData.record.duration,
        requiredPlayers: conflictDialogData.record.requiredPlayers
      });
    }
  }, [conflictDialogData, reset]);

  if (!conflictDialogData) return null;

  const onSubmit = (data: FormValues) => {
    resolveConflict(conflictDialogData.record.id, data, conflictDialogData.intendedStatus);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Resolve Conflict</h2>
          <p className="text-sm text-gray-600 mb-4">
            Cannot move to <strong className="capitalize">{conflictDialogData.intendedStatus}</strong>.
          </p>
          <div className="bg-red-50 text-red-700 p-3 rounded border border-red-100 text-sm mb-6">
            {conflictDialogData.reason}
          </div>

          <form id="conflict-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                {...register('title')}
                className={`w-full text-sm border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
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
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={() => setConflictDialogData(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            form="conflict-form"
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Resolve & Move
          </button>
        </div>
      </div>
    </div>
  );
};
