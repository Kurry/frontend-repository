import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RidgeEvent, addEvent, updateEvent, announce } from '../store';

const schema = z.object({
  title: z.string().min(2, 'Title is required — enter at least 2 characters.'),
  date: z.string().min(1, 'Date is required — use YYYY-MM-DD, e.g. 2026-10-15.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use the format YYYY-MM-DD, e.g. 2026-10-15.'),
  city: z.string().min(2, 'City is required — enter at least 2 characters.'),
  category: z.enum(['Summit', 'Meetup', 'Workshop', 'Hackathon', 'Webinar'], { errorMap: () => ({ message: 'Category must be Summit, Meetup, Workshop, Hackathon, or Webinar.' }) }),
  status: z.enum(['upcoming', 'featured', 'past'], { errorMap: () => ({ message: 'Status must be upcoming, featured, or past.' }) }),
  featured: z.boolean(),
}).refine(data => {
  if (data.featured) return data.status === 'featured';
  if (data.status === 'featured') return data.featured === true;
  return true;
}, {
  message: 'Featured and status must agree: a featured event requires status "featured" and vice versa.',
  path: ['featured']
});

type FormValues = z.infer<typeof schema>;

interface Props {
  eventToEdit: RidgeEvent | null;
  onClose: () => void;
}

export default function EventForm({ eventToEdit, onClose }: Props) {
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'all',
    defaultValues: eventToEdit ? {
      title: eventToEdit.title,
      date: eventToEdit.date,
      city: eventToEdit.city,
      category: eventToEdit.category,
      status: eventToEdit.status,
      featured: eventToEdit.featured,
    } : {
      title: '',
      date: '',
      city: '',
      category: 'Meetup',
      status: 'upcoming',
      featured: false,
    }
  });

  const featured = watch('featured');
  const status = watch('status');
  const previousNonFeaturedStatus = useRef<'upcoming' | 'past'>(eventToEdit?.status === 'past' ? 'past' : 'upcoming');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (featured && status !== 'featured') {
      previousNonFeaturedStatus.current = status;
      setValue('status', 'featured');
    } else if (!featured && status === 'featured') {
      setValue('status', previousNonFeaturedStatus.current);
    } else if (!featured) {
      previousNonFeaturedStatus.current = status;
    }
    trigger();
  }, [featured, setValue, status, trigger]);

  useEffect(() => {
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, []);

  const onSubmit = (data: FormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (eventToEdit) {
      updateEvent({ ...data, id: eventToEdit.id });
      announce(`Event updated: ${data.title}.`);
    } else {
      addEvent(data);
      announce(`Event created: ${data.title}.`);
    }
    onClose();
  };

  const errorSummary = Object.values(errors).map(e => e?.message).filter(Boolean).join(' ');

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const f = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled'));
    if (f.length === 0) return;
    const first = f[0], last = f[f.length - 1];
    const active = document.activeElement as HTMLElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 backdrop-in" role="dialog" aria-modal="true" aria-label={eventToEdit ? 'Edit event' : 'Create event'} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} onKeyDown={trapFocus} className="bg-surface border border-white/10 rounded-xl notch-br p-6 md:p-8 w-full max-w-lg shadow-2xl relative overlay-in">
        <h2 className="text-2xl font-bold display-font mb-6">{eventToEdit ? 'Edit Event' : 'Create Event'}</h2>

        {/* Persistent polite region: announces the current validation state. */}
        <p className="sr-only" aria-live="polite" role="status">
          {errorSummary ? `Form has errors. ${errorSummary}` : ''}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="ef-title" className="block text-sm font-medium mb-1">Title</label>
            <input
              id="ef-title"
              ref={firstFieldRef}
              type="text"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? 'ef-title-err' : undefined}
              className={`input input-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${errors.title ? 'input-error' : ''}`}
              {...register('title')}
            />
            {errors.title && <span id="ef-title-err" className="text-error text-sm mt-1 block">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ef-date" className="block text-sm font-medium mb-1">Date (YYYY-MM-DD)</label>
              <input
                id="ef-date"
                type="text"
                inputMode="numeric"
                aria-invalid={errors.date ? true : undefined}
                aria-describedby={errors.date ? 'ef-date-err' : undefined}
                className={`input input-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${errors.date ? 'input-error' : ''}`}
                {...register('date')}
              />
              {errors.date && <span id="ef-date-err" className="text-error text-sm mt-1 block">{errors.date.message}</span>}
            </div>
            <div>
              <label htmlFor="ef-city" className="block text-sm font-medium mb-1">City</label>
              <input
                id="ef-city"
                type="text"
                aria-invalid={errors.city ? true : undefined}
                aria-describedby={errors.city ? 'ef-city-err' : undefined}
                className={`input input-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${errors.city ? 'input-error' : ''}`}
                {...register('city')}
              />
              {errors.city && <span id="ef-city-err" className="text-error text-sm mt-1 block">{errors.city.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ef-category" className="block text-sm font-medium mb-1">Category</label>
              <select id="ef-category" className="select select-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" {...register('category')}>
                <option value="Summit">Summit</option>
                <option value="Meetup">Meetup</option>
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Webinar">Webinar</option>
              </select>
            </div>
            <div>
              <label htmlFor="ef-status" className="block text-sm font-medium mb-1">Status</label>
              <select id="ef-status" className="select select-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" {...register('status')}>
                <option value="upcoming">Upcoming</option>
                <option value="featured">Featured</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input id="ef-featured" type="checkbox" className="checkbox notch-br" {...register('featured')} />
            <label htmlFor="ef-featured" className="text-sm cursor-pointer">Featured Event</label>
          </div>
          {errors.featured && <span className="text-error text-sm block" role="alert">{errors.featured.message}</span>}

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
            <button type="button" className="btn btn-ghost notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" disabled={!isValid} aria-disabled={!isValid}>
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
