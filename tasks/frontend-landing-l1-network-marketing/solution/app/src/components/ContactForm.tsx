import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addLead, announce } from '../store';

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required — enter at least 2 characters.'),
  email: z.string().min(1, 'Email is required — enter a valid address like name@company.com.')
    .email('Email must be a valid address like name@company.com.')
    .refine(val => val.includes('@') && (val.split('@')[1] || '').includes('.'), 'Email must include a domain, e.g. name@company.com.'),
  company: z.string().optional(),
  interest: z.enum(['Build', 'Solutions', 'Community', 'Enterprise'], { errorMap: () => ({ message: 'Interest is required — choose Build, Solutions, Community, or Enterprise.' }) }),
  privacy_consent: z.literal(true, { errorMap: () => ({ message: 'Privacy consent is required — check the box to continue.' }) }),
  message: z.string().optional().refine(val => !val || val.length >= 10, 'Message must be at least 10 characters when provided.'),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: 'all',
  });

  const onSubmit = (data: ContactFormValues) => {
    addLead(data);
    setSuccess(true);
    announce(`Contact lead captured from ${data.name}. Session leads total updated.`);
    reset();
    setTimeout(() => setSuccess(false), 5000);
  };

  useEffect(() => {
    const resetFromWorkflow = () => { reset(); setSuccess(false); };
    window.addEventListener('ridge:contact-reset', resetFromWorkflow);
    return () => window.removeEventListener('ridge:contact-reset', resetFromWorkflow);
  }, [reset]);

  const errorSummary = Object.values(errors).map(e => e?.message).filter(Boolean).join(' ');

  return (
    <section className="contact chapter py-24 bg-void relative z-20" id="contact" aria-label="Contact">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="chapter-title text-4xl md:text-5xl font-bold mb-12 tracking-tight text-center">GET IN TOUCH</h2>

        <div className="bg-surface/50 p-8 md:p-12 notch-br border border-white/10 relative overflow-hidden">
          {success ? (
            <div className="absolute inset-0 bg-surface z-10 flex flex-col items-center justify-center p-8 text-center success-in">
               <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-6">
                 <span className="text-accent text-2xl" aria-hidden="true">✓</span>
               </div>
               <h3 className="text-2xl display-font font-bold mb-2">Message Sent</h3>
               <p className="text-gray-400">We'll be in touch shortly. Your lead is now in Session leads.</p>
               <button className="btn btn-outline mt-8 notch-br text-current border-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => setSuccess(false)}>Send another</button>
            </div>
          ) : null}

          {/* Persistent polite region announces validation state for assistive tech. */}
          <p className="sr-only" aria-live="polite" role="status">
            {errorSummary ? `Contact form has errors. ${errorSummary}` : ''}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                <input
                  id="name"
                  type="text"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? 'name-err' : undefined}
                  className={`input input-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${errors.name ? 'input-error' : ''}`}
                  {...register('name')}
                />
                {errors.name && <span id="name-err" className="text-error text-sm mt-1 block">{errors.name.message}</span>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'email-err' : undefined}
                  className={`input input-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && <span id="email-err" className="text-error text-sm mt-1 block">{errors.email.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">Company (Optional)</label>
                <input
                  id="company"
                  type="text"
                  className="input input-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  {...register('company')}
                />
              </div>
              <div>
                <label htmlFor="interest" className="block text-sm font-medium mb-2">Interest</label>
                <select id="interest" aria-invalid={errors.interest ? true : undefined} aria-describedby={errors.interest ? 'interest-err' : undefined} className={`select select-bordered w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${errors.interest ? 'select-error' : ''}`} {...register('interest')}>
                  <option value="">Select an area...</option>
                  <option value="Build">Build</option>
                  <option value="Solutions">Solutions</option>
                  <option value="Community">Community</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
                {errors.interest && <span id="interest-err" className="text-error text-sm mt-1 block">{errors.interest.message}</span>}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">Message (Optional)</label>
              <textarea
                id="message"
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? 'message-err' : undefined}
                className={`textarea textarea-bordered w-full notch-br h-32 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${errors.message ? 'textarea-error' : ''}`}
                {...register('message')}
              ></textarea>
              {errors.message && <span id="message-err" className="text-error text-sm mt-1 block">{errors.message.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input id="privacy_consent" type="checkbox" className="checkbox notch-br" aria-invalid={errors.privacy_consent ? true : undefined} {...register('privacy_consent')} />
                <span className="text-sm">I agree to the privacy policy</span>
              </label>
              {errors.privacy_consent && <span className="text-error text-sm block" role="alert">{errors.privacy_consent.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary w-full notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" disabled={!isValid} aria-disabled={!isValid}>Submit</button>
          </form>
        </div>
      </div>
    </section>
  );
}
