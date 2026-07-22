import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStore } from '../store';
import type { Record } from '../store';

const schema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['draft', 'ready', 'failed', 'recovered', 'archived'] as const),
  difficulty: z.number().min(1).max(10),
  linkedScenarioId: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditRecordProps {
  recordId?: string; // If undefined, creating new
  onClose: () => void;
}

export function EditRecord({ recordId, onClose }: EditRecordProps) {
  const records = useStore((state) => state.records);
  const addRecord = useStore((state) => state.addRecord);
  const updateRecord = useStore((state) => state.updateRecord);

  const existingRecord = recordId ? records.find(r => r.id === recordId) : null;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existingRecord ? {
      id: existingRecord.id,
      title: existingRecord.title,
      description: existingRecord.description,
      status: existingRecord.status,
      difficulty: existingRecord.difficulty,
      linkedScenarioId: existingRecord.linkedScenarioId,
    } : {
      id: `sc-${Date.now()}`,
      title: '',
      description: '',
      status: 'draft',
      difficulty: 1,
      linkedScenarioId: null,
    },
  });

  const onSubmit = (data: FormData) => {
    if (recordId) {
      updateRecord(recordId, data);
    } else {
      addRecord({
        ...data,
        recoveryBoardState: 'idle',
      } as Record);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">{recordId ? 'Edit Scenario' : 'Create Scenario'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID</label>
            <input
              {...register('id')}
              disabled={!!recordId}
              className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100"
            />
            {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              {...register('title')}
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              className="w-full border border-slate-300 rounded px-3 py-2 min-h-[80px]"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full border border-slate-300 rounded px-3 py-2 bg-white"
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="failed">Failed</option>
                <option value="recovered">Recovered</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty (1-10)</label>
              <input
                type="number"
                {...register('difficulty', { valueAsNumber: true })}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
              {errors.difficulty && <p className="text-red-500 text-xs mt-1">{errors.difficulty.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
