import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addLead } from '../store';

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").refine(val => val.includes('@') && val.split('@')[1].includes('.'), "Must contain a domain segment"),
  company: z.string().optional(),
  interest: z.enum(['Build', 'Solutions', 'Community', 'Enterprise'], { errorMap: () => ({ message: "Invalid interest" }) }),
  privacy_consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),
  message: z.string().optional().refine(val => !val || val.length >= 10, "Message must be at least 10 characters if provided"),
});

type FormValues = z.infer<typeof schema>;

export default function ContactForm() {
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = (data: FormValues) => {
    addLead(data);
    setSuccess(true);
    reset();
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <section className="contact chapter py-24 bg-void relative z-20" id="contact" aria-label="Contact">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="chapter-title text-4xl md:text-5xl font-bold mb-12 tracking-tight text-center">GET IN TOUCH</h2>

        <div className="bg-surface/50 p-8 md:p-12 notch-br border border-white/10 relative overflow-hidden">
          {success ? (
            <div className="absolute inset-0 bg-surface z-10 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-500 ease-in opacity-100">
               <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-6">
                 <span className="text-accent text-2xl">✓</span>
               </div>
               <h3 className="text-2xl display-font font-bold mb-2">Message Sent</h3>
               <p className="text-gray-400">We'll be in touch shortly.</p>
               <button className="btn btn-outline mt-8 notch-br text-current border-current" onClick={() => setSuccess(false)}>Send another</button>
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                <input
                  id="name"
                  type="text"
                  className={`input input-bordered w-full notch-br ${errors.name ? 'input-error' : ''}`}
                  {...register('name')}
                />
                {errors.name && <span className="text-error text-sm mt-1 block" role="alert" aria-live="polite">{errors.name.message}</span>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`input input-bordered w-full notch-br ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && <span className="text-error text-sm mt-1 block" role="alert" aria-live="polite">{errors.email.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">Company (Optional)</label>
                <input
                  id="company"
                  type="text"
                  className="input input-bordered w-full notch-br"
                  {...register('company')}
                />
              </div>
              <div>
                <label htmlFor="interest" className="block text-sm font-medium mb-2">Interest</label>
                <select id="interest" className={`select select-bordered w-full notch-br ${errors.interest ? 'select-error' : ''}`} {...register('interest')}>
                  <option value="">Select an area...</option>
                  <option value="Build">Build</option>
                  <option value="Solutions">Solutions</option>
                  <option value="Community">Community</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
                {errors.interest && <span className="text-error text-sm mt-1 block" role="alert" aria-live="polite">{errors.interest.message}</span>}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">Message (Optional)</label>
              <textarea
                id="message"
                className={`textarea textarea-bordered w-full notch-br h-32 ${errors.message ? 'textarea-error' : ''}`}
                {...register('message')}
              ></textarea>
              {errors.message && <span className="text-error text-sm mt-1 block" role="alert" aria-live="polite">{errors.message.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input id="privacy_consent" type="checkbox" className="checkbox notch-br" {...register('privacy_consent')} />
                <span className="text-sm">I agree to the privacy policy</span>
              </label>
              {errors.privacy_consent && <span className="text-error text-sm block" role="alert" aria-live="polite">{errors.privacy_consent.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary w-full notch-br" disabled={!isValid}>Submit</button>
          </form>
        </div>
      </div>
    </section>
  );
}
