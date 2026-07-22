import React, { useEffect } from 'react';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApparelFitAnnotationSchema, type ApparelFitAnnotation } from '../schema';
import { Trash2, Save } from 'lucide-react';
import { clsx } from 'clsx';

const Editor: React.FC = () => {
  const { records, selectedId, updateRecord, deleteRecord } = useStore();

  const record = selectedId ? records[selectedId] : null;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApparelFitAnnotation>({
    resolver: zodResolver(ApparelFitAnnotationSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (record) {
      reset(record);
    }
  }, [record, reset]);

  if (!record) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex-1 flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
        <h2 className="text-xl font-medium text-neutral-800 mb-2">No annotation selected</h2>
        <p className="text-neutral-500">Select an item from the collection to view and edit its details.</p>
      </div>
    );
  }

  const onSubmit = (data: ApparelFitAnnotation) => {
    updateRecord(data.id, data);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this annotation?')) {
      deleteRecord(record.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col min-h-0">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-neutral-800 truncate pr-4">Editing: {record.title}</h2>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete annotation"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto min-h-0 flex-1">
        <form id="editor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('id')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="title" className="text-sm font-medium text-neutral-700">Title <span className="text-red-500">*</span></label>
              <input
                id="title"
                {...register('title')}
                className={clsx(
                  "w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  errors.title ? "border-red-300 focus:border-red-500" : "border-neutral-300 focus:border-blue-500"
                )}
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium text-neutral-700">Status <span className="text-red-500">*</span></label>
              <select
                id="status"
                {...register('status')}
                className={clsx(
                  "w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  errors.status ? "border-red-300 focus:border-red-500" : "border-neutral-300 focus:border-blue-500"
                )}
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
              {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="measurementOffset" className="text-sm font-medium text-neutral-700">Measurement Offset (inches) <span className="text-red-500">*</span></label>
            <input
              id="measurementOffset"
              type="number"
              step="0.125"
              {...register('measurementOffset', { valueAsNumber: true })}
              className={clsx(
                "w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                errors.measurementOffset ? "border-red-300 focus:border-red-500" : "border-neutral-300 focus:border-blue-500"
              )}
            />
            {errors.measurementOffset && <p className="text-xs text-red-600 mt-1">{errors.measurementOffset.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium text-neutral-700">Notes</label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className={clsx(
                "w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none",
                errors.notes ? "border-red-300 focus:border-red-500" : "border-neutral-300 focus:border-blue-500"
              )}
            />
            {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Editor;
