import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore } from '@nanostores/react';
import * as z from 'zod';
import { addScene } from '@/store';
import {
  createStepStore,
  closeAddScene,
  formDefaultsStore,
  formExternalErrorsStore,
  showToast,
  type CreateStep,
} from '@/store/ui';
import { STATUSES } from '@/lib/schema';
import { Ri } from '../common/Ri';
import { clsx } from 'clsx';

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(80, 'Title must be at most 80 characters'),
  body: z
    .string()
    .trim()
    .min(8, 'Body must be at least 8 characters')
    .max(2000, 'Body must be at most 2,000 characters'),
  cameraNote: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(200, 'Camera note must be at most 200 characters').optional()
  ),
  status: z.enum(STATUSES, {
    errorMap: () => ({ message: 'Status must be one of draft, review, or ready' }),
  }),
});

type FormData = z.infer<typeof schema>;

const STEPS: CreateStep[] = ['intro', 'edit', 'review'];

export function AddSceneForm() {
  const step = useStore(createStepStore);
  const defaults = useStore(formDefaultsStore);
  const externalErrors = useStore(formExternalErrorsStore);
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    trigger,
    setError,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'all',
    defaultValues: { title: '', body: '', cameraNote: '', status: 'draft' },
  });

  useEffect(() => {
    reset({
      title: defaults?.title ?? '',
      body: defaults?.body ?? '',
      cameraNote: defaults?.cameraNote ?? '',
      status: (['draft', 'review', 'ready'].includes(defaults?.status ?? '') ? defaults?.status : 'draft') as FormData['status'],
    });
    if (externalErrors) {
      for (const [field, message] of Object.entries(externalErrors)) {
        setError(field as keyof FormData, { type: 'external', message });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (s: CreateStep) => createStepStore.set(s);
  const stepIndex = STEPS.indexOf(step);

  const commit = (values: FormData) => {
    if (submittingRef.current) return; // double-activation guard: exactly one scene
    submittingRef.current = true;
    try {
      const scene = addScene({
        title: values.title,
        body: values.body,
        cameraNote: values.cameraNote || undefined,
        status: values.status,
      });
      showToast(`Scene Added as Scene ${scene.order}`);
      closeAddScene();
    } finally {
      setTimeout(() => {
        submittingRef.current = false;
      }, 0);
    }
  };

  const onReviewSubmit = handleSubmit(commit);

  const errorSummary = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean)
    .join(' ');

  const fieldClass = (invalid: boolean) =>
    clsx(
      'w-full rounded-xl border bg-white px-3.5 text-sm text-gray-800 shadow-sm transition-colors placeholder:text-gray-400',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
      invalid ? 'border-red-400 bg-red-50/40 focus-visible:ring-red-300' : 'border-gray-300 hover:border-gray-400'
    );

  return (
    <section
      aria-label="Add Scene"
      className="form-enter overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5"
    >
      {/* Stepper */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-[#fafaf8] px-5 py-3">
        <Ri name="add-line" size={16} className="text-yellow-600" />
        <span className="text-sm font-bold tracking-tight text-gray-900">Add Scene</span>
        <ol className="ml-3 hidden items-center gap-1.5 sm:flex" aria-label="Create steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              <span
                className={clsx(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize',
                  i === stepIndex ? 'bg-yellow-400 text-yellow-950' : i < stepIndex ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-400'
                )}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-3 bg-gray-200" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <button
          type="button"
          aria-label="Cancel Add Scene"
          onClick={closeAddScene}
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          <Ri name="close-line" size={17} />
        </button>
      </div>

      {step === 'intro' && (
        <div className="px-5 py-6 sm:px-6">
          <h3 className="text-lg font-bold tracking-tight text-gray-900">Start a new scene</h3>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gray-600">
            A scene is one storyboard card: a <strong>title</strong>, a markdown{' '}
            <strong>description</strong> (with optional checklists), an optional <strong>camera note</strong>,
            and a <strong>status</strong>. You will review everything before it joins the board.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => goTo('edit')}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-yellow-950 shadow-sm shadow-yellow-400/40 transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
            >
              Start
              <Ri name="arrow-right-s-line" size={17} />
            </button>
            <button
              type="button"
              onClick={closeAddScene}
              className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'edit' && (
        <form
          className="px-5 py-5 sm:px-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(() => goTo('review'))(e);
          }}
          noValidate
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="scene-title" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Title <span className="font-medium normal-case text-gray-400">(2–80 characters)</span>
              </label>
              <input
                id="scene-title"
                type="text"
                placeholder="Scene title"
                aria-invalid={errors.title ? true : undefined}
                aria-describedby={errors.title ? 'scene-title-error' : undefined}
                className={clsx('h-11', fieldClass(!!errors.title))}
                {...register('title')}
              />
              {errors.title && (
                <p id="scene-title-error" role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                  <Ri name="alert-line" size={13} />
                  Title: {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="scene-body" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Description <span className="font-medium normal-case text-gray-400">(8–2,000 characters, markdown supported)</span>
              </label>
              <textarea
                id="scene-body"
                rows={4}
                placeholder={'Describe the action…\n\n- [ ] checklist lines render as real checkboxes'}
                aria-invalid={errors.body ? true : undefined}
                aria-describedby={errors.body ? 'scene-body-error' : undefined}
                className={clsx('resize-y py-2.5', fieldClass(!!errors.body))}
                {...register('body')}
              />
              {errors.body && (
                <p id="scene-body-error" role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                  <Ri name="alert-line" size={13} />
                  Description: {errors.body.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="scene-camera" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Camera Note <span className="font-medium normal-case text-gray-400">(optional, ≤200)</span>
                </label>
                <input
                  id="scene-camera"
                  type="text"
                  placeholder="e.g. Close-up on hands"
                  aria-invalid={errors.cameraNote ? true : undefined}
                  aria-describedby={errors.cameraNote ? 'scene-camera-error' : undefined}
                  className={clsx('h-11', fieldClass(!!errors.cameraNote))}
                  {...register('cameraNote')}
                />
                {errors.cameraNote && (
                  <p id="scene-camera-error" role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                    <Ri name="alert-line" size={13} />
                    Camera note: {errors.cameraNote.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="scene-status" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Status
                </label>
                <select
                  id="scene-status"
                  aria-invalid={errors.status ? true : undefined}
                  className={clsx('h-11', fieldClass(!!errors.status))}
                  {...register('status')}
                >
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="ready">Ready</option>
                </select>
                {errors.status && (
                  <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                    <Ri name="alert-line" size={13} />
                    Status: {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Polite live region announces validation problems as well as showing them inline. */}
          <p className="sr-only" aria-live="polite">
            {errorSummary}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goTo('intro')}
              className="inline-flex h-11 items-center gap-1 rounded-xl px-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Ri name="arrow-left-s-line" size={17} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeAddScene}
                className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                Cancel
              </button>
              {/* Stays disabled until valid; a press attempt while disabled surfaces per-field errors. */}
              <button
                type="submit"
                disabled={!isValid}
                onMouseDown={() => {
                  if (!isValid) trigger();
                }}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-yellow-950 shadow-sm shadow-yellow-400/40 transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
              >
                Review Scene
                <Ri name="arrow-right-s-line" size={17} />
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 'review' && (
        <form
          className="px-5 py-5 sm:px-6"
          onSubmit={(e) => {
            e.preventDefault();
            onReviewSubmit(e);
          }}
        >
          <div className="rounded-xl border border-gray-200 bg-[#fafaf8] p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold tracking-tight text-gray-900">{getValues('title')}</h3>
              <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 ring-1 ring-inset ring-gray-200">
                {getValues('status')}
              </span>
            </div>
            {getValues('cameraNote') && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-sky-700">
                <Ri name="camera-line" size={13} />
                {getValues('cameraNote')}
              </p>
            )}
            <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{getValues('body')}</p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goTo('edit')}
              className="inline-flex h-11 items-center gap-1 rounded-xl px-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Ri name="arrow-left-s-line" size={17} />
              Back
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-yellow-950 shadow-sm shadow-yellow-400/40 transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
            >
              <Ri name="check-line" size={16} />
              Add Scene
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
