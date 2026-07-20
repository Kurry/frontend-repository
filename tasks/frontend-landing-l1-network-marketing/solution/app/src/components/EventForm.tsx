import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RidgeEvent, addEvent, updateEvent } from '../store';
import { eventSchema } from '../schemas';

type FormValues = import('zod').infer<typeof eventSchema>;

interface Props {
  eventToEdit: RidgeEvent | null;
  onClose: () => void;
}

export default function EventForm({ eventToEdit, onClose }: Props) {
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors, isValid }, reset, watch, setValue, trigger } = useForm<FormValues>({
    resolver: zodResolver(eventSchema),
    mode: 'onChange',
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
  const validationMessage = Object.values(errors)
    .map(error => error?.message)
    .filter(Boolean)
    .join('. ');

  useEffect(() => {
    reset(eventToEdit ? {
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
    });
    submittingRef.current = false;
    setIsSubmitting(false);
    void trigger();
  }, [eventToEdit, reset, trigger]);

  // Cross-field logic enforcing during edit
  useEffect(() => {
    if (featured && status !== 'featured') setValue('status', 'featured', { shouldValidate: true });
    if (!featured && status === 'featured') setValue('status', 'upcoming', { shouldValidate: true });
  }, [featured, setValue, status]);

  const onSubmit = (data: FormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    if (eventToEdit) {
      updateEvent({ ...data, id: eventToEdit.id });
    } else {
      addEvent(data);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onKeyDown={handleKeyDown} role="dialog" aria-modal="true">
      <div className="bg-surface border border-white/10 rounded-xl notch-br p-6 md:p-8 w-full max-w-lg shadow-2xl relative">
        <h2 className="text-2xl font-bold display-font mb-6">{eventToEdit ? 'Edit Event' : 'Create Event'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="sr-only" aria-live="polite" aria-atomic="true">{validationMessage}</p>
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
            <input
              id="title"
              type="text"
              className={`input input-bordered w-full notch-br ${errors.title ? 'input-error' : ''}`}
              {...register('title')}
            />
            {errors.title && <span className="text-error text-sm mt-1">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">Date (YYYY-MM-DD)</label>
              <input
                id="date"
                type="text"
                className={`input input-bordered w-full notch-br ${errors.date ? 'input-error' : ''}`}
                {...register('date')}
              />
              {errors.date && <span className="text-error text-sm mt-1">{errors.date.message}</span>}
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
              <input
                id="city"
                type="text"
                className={`input input-bordered w-full notch-br ${errors.city ? 'input-error' : ''}`}
                {...register('city')}
              />
              {errors.city && <span className="text-error text-sm mt-1">{errors.city.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
              <select id="category" className="select select-bordered w-full notch-br" {...register('category')}>
                <option value="Summit">Summit</option>
                <option value="Meetup">Meetup</option>
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Webinar">Webinar</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
              <select id="status" className="select select-bordered w-full notch-br" {...register('status')}>
                <option value="upcoming">Upcoming</option>
                <option value="featured">Featured</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input id="featured" type="checkbox" className="checkbox notch-br" {...register('featured')} />
            <label htmlFor="featured" className="text-sm cursor-pointer">Featured Event</label>
          </div>
          {errors.featured && <span className="text-error text-sm block">{errors.featured.message}</span>}

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
            <button type="button" className="btn btn-ghost notch-br" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary notch-br" disabled={!isValid || isSubmitting}>
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
