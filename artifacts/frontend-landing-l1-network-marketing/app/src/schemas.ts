import { z } from 'zod';
import { isIsoCalendarDate } from './store';

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').refine(
    (value) => value.includes('@') && value.split('@')[1].includes('.'),
    'Must contain a domain segment',
  ),
  company: z.string().optional(),
  interest: z.enum(['Build', 'Solutions', 'Community', 'Enterprise'], { error: 'Interest is required' }),
  privacy_consent: z.literal(true, { error: 'Privacy consent is required' }),
  message: z.string().optional().refine((value) => !value || value.length >= 10, 'Message must be at least 10 characters if provided'),
});

export const leadSchema = z.object({
  id: z.string().min(1, 'Lead id is required'),
  kind: z.literal('contact'),
  submittedAt: z.string().datetime('submittedAt must be an ISO timestamp'),
  payload: contactSchema,
});

export const eventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  date: z.string().refine(isIsoCalendarDate, 'Must be a real calendar date in YYYY-MM-DD format'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  category: z.enum(['Summit', 'Meetup', 'Workshop', 'Hackathon', 'Webinar'], { error: 'Invalid category' }),
  status: z.enum(['upcoming', 'featured', 'past'], { error: 'Invalid status' }),
  featured: z.boolean(),
}).refine((data) => (data.featured ? data.status === 'featured' : data.status !== 'featured'), {
  message: 'If featured is true, status must be featured, and vice versa.',
  path: ['featured'],
});
