import React from 'react';
import { useStore } from '@nanostores/react';
import { $events, $eventsManagerOpen } from '../store';
import { ArrowRight } from 'phosphor-react';

export default function GlobalEvents() {
  const events = useStore($events);
  const featuredEvent = events.find(e => e.featured) || events[0];

  return (
    <section className="events chapter py-24 bg-surface text-current relative z-20" id="events" aria-label="Global Events">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="events-copy">
          <h2 className="events-headline text-5xl md:text-7xl font-bold display-font tracking-tight mb-8 min-h-[4rem]" id="eventsHeadline" aria-label="RIDGE GLOBAL EVENTS">
            {/* Decoded by JS */}
          </h2>
          <div className="events-blurb text-xl text-gray-400 max-w-lg mb-8" id="eventsBlurb" aria-hidden="true">
            {/* Handled by JS animation if needed, or fallback */}
            <p>Join our worldwide network of developers, founders, and enterprise partners building the future of institutional infrastructure.</p>
          </div>
          <p className="sr-only" id="eventsBlurbA11y">
            Join our worldwide network of developers, founders, and enterprise partners building the future of institutional infrastructure.
          </p>
          <button
            type="button"
            className="btn btn-outline notch-br text-current border-current"
            onClick={() => $eventsManagerOpen.set(true)}
          >
            View all events
          </button>
        </div>

        {featuredEvent && (
          <div className="events-card notch-br bg-void border border-white/10 p-8 lg:p-12 text-white group hover:border-white/20 transition-colors">
            <div className="events-card-block mb-8">
              <span className="w-12 h-1 bg-accent block mb-4"></span>
              <p className="text-sm font-bold tracking-widest uppercase text-accent mb-2">Featured / {featuredEvent.category}</p>
              <h3 className="text-3xl display-font font-bold line-clamp-2">{featuredEvent.title}</h3>
              <p className="text-gray-400 mt-2">{featuredEvent.city} — {new Date(featuredEvent.date).toLocaleDateString()}</p>
            </div>
            <button type="button" className="cta notch-br btn btn-primary flex items-center gap-2 group-hover:brightness-110 transition-all">
              Learn more <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
