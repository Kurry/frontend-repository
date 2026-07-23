import React, { useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { $events, $eventsFilter, $eventsSort, $eventsManagerOpen, formatEventDate } from '../store';
import { ArrowRight } from 'phosphor-react';

// MotionManager owns the descendants of these nodes while the kinetic intro is
// running. Keeping the intro in a memoized leaf prevents event/filter updates
// from reconciling away that animation-owned markup.
const KineticEventIntro = React.memo(function KineticEventIntro() {
  return (
    <div className="events-copy">
      <h2 className="events-headline text-5xl md:text-7xl font-bold display-font tracking-tight mb-8 min-h-[4rem]" id="eventsHeadline" aria-label="RIDGE GLOBAL EVENTS">
        {/* Decoded by JS */}
      </h2>
      <div className="events-blurb text-xl opacity-70 max-w-lg mb-8" id="eventsBlurb" aria-hidden="true">
        <p>Join our worldwide network of developers, founders, and enterprise partners building the future of institutional infrastructure.</p>
      </div>
      <p className="sr-only" id="eventsBlurbA11y">
        Join our worldwide network of developers, founders, and enterprise partners building the future of institutional infrastructure.
      </p>
      <button
        type="button"
        className="btn btn-outline notch-br text-current border-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => $eventsManagerOpen.set(true)}
      >
        View all events
      </button>
    </div>
  );
});

export default function GlobalEvents() {
  const events = useStore($events);
  const filter = useStore($eventsFilter);
  const sort = useStore($eventsSort);

  const featuredEvents = useMemo(() => events.filter(e => e.featured), [events]);

  // Landing listing mirrors the manager's shared collection, filter, and sort so
  // create / edit / delete / filter are reflected here without a reload.
  const listing = useMemo(() => {
    return events.filter(e => {
      if (filter.status && e.status !== filter.status) return false;
      if (filter.category && e.category !== filter.category) return false;
      return true;
    }).sort((a, b) => {
      const va = String(a[sort.by]).toLowerCase();
      const vb = String(b[sort.by]).toLowerCase();
      const comp = va.localeCompare(vb);
      return sort.direction === 'asc' ? comp : -comp;
    });
  }, [events, filter, sort]);

  const filtered = Boolean(filter.status || filter.category);

  return (
    <section className="events surface-copy chapter py-24 bg-surface relative z-20" id="events" aria-label="Global Events">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        <KineticEventIntro />

        <div className="flex flex-col gap-4">
          {featuredEvents.length === 0 ? (
            <div className="events-card void-copy notch-br bg-void border border-white/10 p-8 lg:p-12">
              <span className="w-12 h-1 bg-accent block mb-4"></span>
              <p className="text-sm font-bold tracking-widest uppercase text-accent mb-2">Featured</p>
              <p className="opacity-70">No featured events yet — mark an event featured in Events Manager to surface it here.</p>
            </div>
          ) : (
            featuredEvents.map((fe) => (
              <div key={fe.id} className="events-card void-copy notch-br bg-void border border-white/10 p-8 lg:p-12 group hover:border-white/30 transition-colors" data-featured-event={fe.id}>
                <div className="events-card-block mb-8">
                  <span className="w-12 h-1 bg-accent block mb-4"></span>
                  <p className="text-sm font-bold tracking-widest uppercase text-accent mb-2">Featured / {fe.category}</p>
                  <h3 className="text-3xl display-font font-bold line-clamp-2">{fe.title}</h3>
                  <p className="opacity-70 mt-2">{fe.city} — {formatEventDate(fe.date)}</p>
                </div>
                <button type="button" className="cta notch-br btn btn-primary flex items-center gap-2 group-hover:brightness-110 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                  Learn more <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live landing listing (shares the manager's collection / filter / sort) */}
      <div className="container mx-auto px-4 mt-12">
        <div className="void-copy notch-br bg-void border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold display-font tracking-wide">Global Events lineup</h3>
            {filtered && (
              <button
                type="button"
                className="btn btn-ghost btn-sm opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => $eventsFilter.set({ status: '', category: '' })}
              >
                Clear filters
              </button>
            )}
          </div>
          {listing.length === 0 ? (
            <p className="opacity-70 text-sm py-6 text-center">No events match the active filter.</p>
          ) : (
            <ul className="divide-y divide-white/5" data-events-listing aria-label="Global events listing">
              {listing.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 py-3" data-event-row={e.id}>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{e.title}</p>
                    <p className="text-xs opacity-60">{e.city} · {e.category}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <time className="text-sm opacity-70 tabular-nums" dateTime={e.date}>{formatEventDate(e.date)}</time>
                    <span className={`badge badge-sm notch-br ${e.status === 'featured' ? 'badge-accent' : e.status === 'past' ? 'badge-neutral' : 'badge-primary'}`}>{e.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
