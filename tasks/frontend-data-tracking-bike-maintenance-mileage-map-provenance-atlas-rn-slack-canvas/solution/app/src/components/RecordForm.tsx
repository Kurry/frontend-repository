
import { useStore, ServiceRecord } from '../store';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const recordSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  mileage: z.number().min(0, 'Mileage must be non-negative'),
});

type RecordFormData = z.infer<typeof recordSchema>;

export function RecordForm({ recordToEdit, onCancel }: { recordToEdit?: ServiceRecord, onCancel?: () => void }) {
  const { createRecord, updateRecord } = useStore();
  const { register, handleSubmit, formState: { errors } } = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: recordToEdit ? {
      title: recordToEdit.title,
      date: recordToEdit.date,
      mileage: recordToEdit.mileage,
    } : {
      title: '',
      date: new Date().toISOString().split('T')[0],
      mileage: 0,
    }
  });

  const onSubmit = (data: RecordFormData) => {
    if (recordToEdit) {
      updateRecord(recordToEdit.id, data);
    } else {
      createRecord(data);
    }
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded shadow-sm bg-white">
      <h3 className="font-bold text-lg">{recordToEdit ? 'Edit Record' : 'New Record'}</h3>

      <div>
        <label className="block text-sm font-medium">Title</label>
        <input {...register('title')} className="mt-1 block w-full border rounded p-2" />
        {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium">Date</label>
        <input {...register('date')} type="date" className="mt-1 block w-full border rounded p-2" />
        {errors.date && <span className="text-red-500 text-sm">{errors.date.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium">Mileage</label>
        <input {...register('mileage', { valueAsNumber: true })} type="number" className="mt-1 block w-full border rounded p-2" />
        {errors.mileage && <span className="text-red-500 text-sm">{errors.mileage.message}</span>}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
        )}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </div>
    </form>
  );
}
