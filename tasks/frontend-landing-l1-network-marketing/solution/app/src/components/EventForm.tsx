import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RidgeEvent, addEvent, updateEvent, EventStatus, EventCategory } from '../store';

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  city: z.string().min(2, "City must be at least 2 characters"),
  category: z.enum(['Summit', 'Meetup', 'Workshop', 'Hackathon', 'Webinar'], { errorMap: () => ({ message: "Invalid category" }) }),
  status: z.enum(['upcoming', 'featured', 'past'], { errorMap: () => ({ message: "Invalid status" }) }),
  featured: z.boolean(),
}).refine(data => {
  if (data.featured) return data.status === 'featured';
  if (data.status === 'featured') return data.featured === true;
  return true;
}, {
  message: "If featured is true, status must be featured, and vice versa.",
  path: ["featured"] // Put error on featured field
});

type FormValues = z.infer<typeof schema>;

interface Props {
  eventToEdit: RidgeEvent | null;
  onClose: () => void;
}

export default function EventForm({ eventToEdit, onClose }: Props) {
  const { register, handleSubmit, formState: { errors, isValid }, reset, watch, setValue, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  // Cross-field logic enforcing during edit
  useEffect(() => {
    if (featured && status !== 'featured') setValue('status', 'featured');
    if (!featured && status === 'featured') setValue('status', 'upcoming');
    trigger();
  }, [featured, setValue, status, trigger]);

  const onSubmit = (data: FormValues) => {
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
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
            <input
              id="title"
              type="text"
              className={`input input-bordered w-full notch-br ${errors.title ? 'input-error' : ''}`}
              {...register('title')}
            />
            {errors.title && <span className="text-error text-sm mt-1" role="alert" aria-live="polite">{errors.title.message}</span>}
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
              {errors.date && <span className="text-error text-sm mt-1" role="alert" aria-live="polite">{errors.date.message}</span>}
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
              <input
                id="city"
                type="text"
                className={`input input-bordered w-full notch-br ${errors.city ? 'input-error' : ''}`}
                {...register('city')}
              />
              {errors.city && <span className="text-error text-sm mt-1" role="alert" aria-live="polite">{errors.city.message}</span>}
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
          {errors.featured && <span className="text-error text-sm block" role="alert" aria-live="polite">{errors.featured.message}</span>}

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
            <button type="button" className="btn btn-ghost notch-br" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary notch-br" disabled={!isValid}>
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
