import React from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight } from 'phosphor-react';
import { $events, $eventsManagerOpen, formatEventDate } from '../store';

export default function FeaturedInitiative() {
  const events = useStore($events);
  const featured = events.find(event => event.featured);

  return (
    <section className="featured-initiative bg-void py-8 relative z-20" aria-labelledby="featured-initiative-title">
      <div className="container mx-auto px-4">
        <div className="surface-copy bg-surface notch-br-lg p-7 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-end border border-current/10">
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-accent font-bold mb-3">Featured initiative</p>
            <h2 id="featured-initiative-title" className="text-2xl md:text-3xl font-bold display-font">
              {featured?.title ?? 'Shape the next Ridge initiative'}
            </h2>
            <p className="opacity-70 mt-2">
              {featured ? `${featured.city} · ${formatEventDate(featured.date)} · ${featured.category}` : 'Create a featured event to publish it across the landing experience.'}
            </p>
          </div>
          <button type="button" className="cta btn btn-primary notch-br gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => $eventsManagerOpen.set(true)}>
            Manage initiatives <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
