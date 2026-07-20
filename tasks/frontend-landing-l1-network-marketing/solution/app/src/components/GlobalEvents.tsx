import React from 'react';
import { useStore } from '@nanostores/react';
import { $events, $eventsManagerOpen } from '../store';
import { ArrowRight } from 'phosphor-react';

const BLURB_LINES = [
  'Join our worldwide network',
  'of developers, founders, and',
  'enterprise partners building',
  'the future of institutional infrastructure.',
];

function formatCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export default function GlobalEvents() {
  const events = useStore($events);
  const featuredEvent = events.find(e => e.featured);
  const listedEvents = events.filter(event => event.id !== featuredEvent?.id);

  return (
    <section className="events chapter py-24 bg-surface text-current relative z-20" id="events" aria-label="Global Events">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="events-copy">
          <h2 className="events-headline text-5xl md:text-7xl font-bold display-font tracking-tight mb-8 min-h-[4rem]" id="eventsHeadline" aria-label="RIDGE GLOBAL EVENTS">
            {[...'RIDGE GLOBAL EVENTS'].map((character, index) => (
              <span key={index} data-decode-character={character} aria-hidden="true">{character}</span>
            ))}
          </h2>
          <div className="events-blurb text-xl text-gray-400 max-w-lg mb-8" id="eventsBlurb" aria-hidden="true">
            {BLURB_LINES.map(line => (
              <div key={line} className="overflow-hidden">
                <span className="blurb-line block -translate-y-full">{line}</span>
              </div>
            ))}
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
              <p className="text-gray-400 mt-2">
                {featuredEvent.city} — <time dateTime={featuredEvent.date}>{formatCalendarDate(featuredEvent.date)}</time>
              </p>
            </div>
            <button type="button" className="cta notch-br btn btn-primary flex items-center gap-2 group-hover:brightness-110 transition-all">
              Learn more <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Event listings">
          {listedEvents.map(event => (
            <article key={event.id} className="notch-br border border-current/10 p-5 bg-void/5">
              <p className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
                {event.status} / {event.category}
              </p>
              <h3 className="text-xl display-font font-bold">{event.title}</h3>
              <p className="text-gray-500 mt-2">
                {event.city} — <time dateTime={event.date}>{formatCalendarDate(event.date)}</time>
              </p>
            </article>
          ))}
          {!events.length && (
            <p className="text-gray-500 md:col-span-2 xl:col-span-3">No events are currently listed.</p>
          )}
        </div>

      </div>
    </section>
  );
}
