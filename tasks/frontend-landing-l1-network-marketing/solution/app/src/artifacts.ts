import type { Lead, RidgeEvent, Theme } from './store';

export function buildCatalogJson(events: RidgeEvent[], leads: Lead[], theme: Theme) {
  return JSON.stringify({
    version: 1,
    theme,
    counts: {
      events: events.length,
      leads: leads.length,
      upcoming: events.filter((event) => event.status === 'upcoming').length,
      featured: events.filter((event) => event.status === 'featured').length,
      past: events.filter((event) => event.status === 'past').length,
    },
    events,
    leads,
  }, null, 2);
}

export function buildEventsIcs(events: RidgeEvent[]) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ridge//Events//EN',
    ...events.map((event) => [
      'BEGIN:VEVENT',
      `UID:${event.id}@ridge`,
      `DTSTART:${event.date.replace(/-/g, '')}T000000Z`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.city}`,
      `DESCRIPTION:${event.category} - ${event.status}`,
      'END:VEVENT',
    ].join('\r\n')),
    'END:VCALENDAR',
  ].join('\r\n');
}

export function buildLeadsJson(leads: Lead[], theme: Theme) {
  return JSON.stringify({
    version: 1,
    theme,
    counts: { total: leads.length },
    leads,
  }, null, 2);
}

export async function copyArtifactText(text: string) {
  await navigator.clipboard.writeText(text);
}
