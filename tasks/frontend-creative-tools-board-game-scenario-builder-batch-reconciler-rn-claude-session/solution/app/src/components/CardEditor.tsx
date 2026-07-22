import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScenarioCardSchema } from '../types';
import type { ScenarioCard } from '../types';
import { useStore } from '../store';

const FormSchema = ScenarioCardSchema.omit({ id: true });
type FormData = z.infer<typeof FormSchema>;

interface CardEditorProps {
  initialData?: ScenarioCard;
  onClose: () => void;
}

export function CardEditor({ initialData, onClose }: CardEditorProps) {
  const addRecord = useStore((state) => state.addRecord);
  const updateRecord = useStore((state) => state.updateRecord);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(FormSchema) as any,
    defaultValues: initialData || {
      title: '',
      description: '',
      status: 'draft',
      difficulty: 1,
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        title: '',
        description: '',
        status: 'draft',
        difficulty: 1,
      });
    }
  }, [initialData, reset]);

  const onSubmit = (data: FormData) => {
    try {
      if (initialData) {
        updateRecord(initialData.id, data);
      } else {
        addRecord(data);
      }
      setErrorMsg(null);
      onClose();
    } catch (err: any) {
      setErrorMsg('Failed to save record. Please check boundaries and try again.');
    }
  };

  return (
    <div className="bg-white p-6 border-l border-gray-200 shadow-xl w-full h-full overflow-y-auto" role="dialog" aria-labelledby="editor-title">
      <h2 id="editor-title" className="text-xl font-bold mb-4">{initialData ? 'Edit Scenario' : 'Create Scenario'}</h2>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm" aria-live="polite">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 flex flex-col">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">Title *</label>
          <input
            id="title"
            {...register('title')}
            className={`w-full p-2 border rounded ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            aria-invalid={errors.title ? "true" : "false"}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1" aria-live="polite">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">Description</label>
          <textarea
            id="description"
            {...register('description')}
            className={`w-full p-2 border rounded min-h-[100px] ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            aria-invalid={errors.description ? "true" : "false"}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1" aria-live="polite">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">Status</label>
          <select
            id="status"
            {...register('status')}
            className="w-full p-2 border rounded border-gray-300 bg-white"
          >
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          {errors.status && <p className="text-red-500 text-xs mt-1" aria-live="polite">{errors.status.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="difficulty">Difficulty (1-10)</label>
          <input
            id="difficulty"
            type="number"
            {...register('difficulty', { valueAsNumber: true })}
            className={`w-full p-2 border rounded ${errors.difficulty ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            aria-invalid={errors.difficulty ? "true" : "false"}
          />
          {errors.difficulty && <p className="text-red-500 text-xs mt-1" aria-live="polite">{errors.difficulty.message}</p>}
        </div>

        <div className="pt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Save Scenario
          </button>
        </div>
      </form>
    </div>
  );
}
