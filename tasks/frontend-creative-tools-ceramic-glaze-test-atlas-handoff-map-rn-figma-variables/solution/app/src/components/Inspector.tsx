import React from 'react';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const Inspector: React.FC = () => {
  const { records, selectedId, updateRecord } = useStore();

  const selectedRecord = records.find((r) => r.id === selectedId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: selectedRecord?.name || '',
      notes: selectedRecord?.notes || '',
    },
  });

  React.useEffect(() => {
    if (selectedRecord) {
      reset({
        name: selectedRecord.name,
        notes: selectedRecord.notes,
      });
    }
  }, [selectedRecord, reset]);

  if (!selectedRecord) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 flex items-center justify-center text-sm text-gray-500">
        No record selected
      </div>
    );
  }

  const onSubmit = (data: FormValues) => {
    if (selectedId) {
      updateRecord(selectedId, { name: data.name, notes: data.notes });
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Inspector</h2>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              {...register('name')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save size={16} className="mr-2" />
            Save Details
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Derived Summary</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium text-gray-900 capitalize">{selectedRecord.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Owner</dt>
              <dd className="font-medium text-gray-900 capitalize">{selectedRecord.owner.replace('-', ' ')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Readiness</dt>
              <dd className="font-medium text-gray-900 capitalize">{selectedRecord.readiness}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
