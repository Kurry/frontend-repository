import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addScene } from '@/store';

const schema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(80, 'Title must be less than 80 characters'),
  body: z.string().trim().min(8, 'Body must be at least 8 characters').max(2000, 'Body must be less than 2000 characters'),
  cameraNote: z.string().trim().max(200, 'Camera note must be less than 200 characters').optional().transform(val => val === '' ? undefined : val),
  status: z.enum(['draft', 'review', 'ready']).default('draft'),
});

type FormData = z.infer<typeof schema>;

interface AddSceneFormProps {
  onClose: () => void;
}

export function AddSceneForm({ onClose }: AddSceneFormProps) {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
        status: 'draft',
        cameraNote: ''
    }
  });

  const onSubmit = (data: FormData) => {
    addScene(data);
    onClose();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add Scene</h3>
        <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle" aria-label="Cancel">✕</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="scene-title" className="label"><span className="label-text font-medium">Title</span></label>
          <input
            id="scene-title"
            {...register('title')}
            className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
            placeholder="Scene title"
          />
          {errors.title && <span className="text-error text-sm mt-1 block" role="alert" aria-live="polite">{errors.title.message}</span>}
        </div>

        <div>
          <label htmlFor="scene-body" className="label"><span className="label-text font-medium">Description</span></label>
          <textarea
            id="scene-body"
            {...register('body')}
            className={`textarea textarea-bordered w-full h-24 resize-none ${errors.body ? 'textarea-error' : ''}`}
            placeholder="Describe the action..."
          />
          {errors.body && <span className="text-error text-sm mt-1 block" role="alert" aria-live="polite">{errors.body.message}</span>}
        </div>

        <div>
          <label htmlFor="scene-camera" className="label"><span className="label-text font-medium">Camera Note <span className="text-gray-400 font-normal">(Optional)</span></span></label>
          <input
            id="scene-camera"
            {...register('cameraNote')}
            className={`input input-bordered w-full ${errors.cameraNote ? 'input-error' : ''}`}
            placeholder="e.g., Close up on hands"
          />
          {errors.cameraNote && <span className="text-error text-sm mt-1 block" role="alert" aria-live="polite">{errors.cameraNote.message}</span>}
        </div>

        <div>
          <label htmlFor="scene-status" className="label"><span className="label-text font-medium">Status</span></label>
          <select id="scene-status" {...register('status')} className="select select-bordered w-full max-w-xs">
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="ready">Ready</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={!isValid} className="btn btn-primary bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-none">Create Scene</button>
        </div>
      </form>
    </div>
  );
}
