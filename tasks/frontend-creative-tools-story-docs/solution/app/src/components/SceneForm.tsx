import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@nanostores/react';
import { scenesStore, addScene, updateScene } from '../store';

const schema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(80, "Title must be at most 80 characters").refine(val => val.trim().length > 0, "Title cannot be empty"),
  body: z.string().trim().min(8, "Body must be at least 8 characters").max(2000, "Body must be at most 2000 characters").refine(val => val.trim().length > 0, "Body cannot be empty"),
  cameraNote: z.string().trim().max(200, "Camera Note must be at most 200 characters").optional().transform(val => val === "" ? undefined : val),
  status: z.enum(['draft', 'review', 'ready'], {
    errorMap: () => ({ message: "Status must be draft, review, or ready" })
  }).default('draft')
});

type FormData = z.infer<typeof schema>;

interface Props {
  sceneId?: string; // undefined means new scene
  onClose: () => void;
}

export function SceneForm({ sceneId, onClose }: Props) {
  const scenes = useStore(scenesStore);
  const scene = sceneId ? scenes.find(s => s.id === sceneId) : undefined;

  const formRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors, isValid, isDirty }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: scene ? {
      title: scene.title,
      body: scene.body,
      cameraNote: scene.cameraNote || '',
      status: scene.status
    } : {
      title: '',
      body: '',
      cameraNote: '',
      status: 'draft'
    }
  });

  useEffect(() => {
    if (formRef.current) {
      formRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const onSubmit = (data: FormData) => {
    if (sceneId) {
      updateScene(sceneId, data);
    } else {
      addScene(data as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        ref={formRef}
        tabIndex={-1}
        className="w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 id="dialog-title" className="text-xl font-bold">{sceneId ? 'Edit Scene' : 'Add Scene'}</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

          {/* Announcer for screen readers */}
          <div className="sr-only" aria-live="polite">
            {Object.keys(errors).length > 0 && `Form has ${Object.keys(errors).length} errors.`}
            {errors.title && `Title error: ${errors.title.message}`}
            {errors.body && `Body error: ${errors.body.message}`}
            {errors.cameraNote && `Camera Note error: ${errors.cameraNote.message}`}
            {errors.status && `Status error: ${errors.status.message}`}
          </div>

          <div className="form-control w-full">
            <label className="label" htmlFor="title-input">
              <span className="label-text font-medium text-gray-700">Title <span className="text-red-500">*</span></span>
            </label>
            <input
              id="title-input"
              type="text"
              className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
              {...register('title')}
              placeholder="e.g. Harbor Opening"
            />
            {errors.title && (
              <label className="label">
                <span className="label-text-alt text-error font-medium">{errors.title.message}</span>
              </label>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label" htmlFor="body-input">
              <span className="label-text font-medium text-gray-700">Body (Markdown) <span className="text-red-500">*</span></span>
            </label>
            <textarea
              id="body-input"
              className={`textarea textarea-bordered w-full h-32 ${errors.body ? 'textarea-error' : ''}`}
              {...register('body')}
              placeholder="Scene description..."
            ></textarea>
            {errors.body && (
              <label className="label">
                <span className="label-text-alt text-error font-medium">{errors.body.message}</span>
              </label>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label" htmlFor="camera-input">
              <span className="label-text font-medium text-gray-700">Camera Note</span>
            </label>
            <input
              id="camera-input"
              type="text"
              className={`input input-bordered w-full ${errors.cameraNote ? 'input-error' : ''}`}
              {...register('cameraNote')}
              placeholder="e.g. Pan left, wide angle"
            />
            {errors.cameraNote && (
              <label className="label">
                <span className="label-text-alt text-error font-medium">{errors.cameraNote.message}</span>
              </label>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label" htmlFor="status-input">
              <span className="label-text font-medium text-gray-700">Status <span className="text-red-500">*</span></span>
            </label>
            <select
              id="status-input"
              className={`select select-bordered w-full ${errors.status ? 'select-error' : ''}`}
              {...register('status')}
            >
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="ready">Ready</option>
            </select>
            {errors.status && (
              <label className="label">
                <span className="label-text-alt text-error font-medium">{errors.status.message}</span>
              </label>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-yellow-400 hover:bg-yellow-500 border-none text-gray-900"
              disabled={!isValid && (isDirty || sceneId !== undefined)}
            >
              {sceneId ? 'Save Changes' : 'Create Scene'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
