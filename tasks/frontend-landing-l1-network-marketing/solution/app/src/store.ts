import { atom, map } from 'nanostores';

export type EventStatus = 'upcoming' | 'featured' | 'past';
export type EventCategory = 'Summit' | 'Meetup' | 'Workshop' | 'Hackathon' | 'Webinar';
export type Theme = 'light' | 'dark';

export interface RidgeEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  city: string;
  category: EventCategory;
  status: EventStatus;
  featured: boolean;
}

export interface LeadPayload {
  name: string;
  email: string;
  company?: string;
  interest: 'Build' | 'Solutions' | 'Community' | 'Enterprise';
  privacy_consent: boolean;
  message?: string;
}

export interface Lead {
  id: string;
  kind: 'contact';
  submittedAt: string;
  payload: LeadPayload;
}

export const EVENT_STATUSES: EventStatus[] = ['upcoming', 'featured', 'past'];
export const EVENT_CATEGORIES: EventCategory[] = ['Summit', 'Meetup', 'Workshop', 'Hackathon', 'Webinar'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Initial seed
const SEED_EVENTS: RidgeEvent[] = [
  { id: '1', title: 'Ridge Summit 2026', date: '2026-10-15', city: 'Denver', category: 'Summit', status: 'featured', featured: true },
  { id: '2', title: 'Builder Meetup SF', date: '2026-08-01', city: 'San Francisco', category: 'Meetup', status: 'upcoming', featured: false },
  { id: '3', title: 'Enterprise Workshop', date: '2026-09-12', city: 'New York', category: 'Workshop', status: 'upcoming', featured: false },
  { id: '4', title: 'Global Hackathon', date: '2026-11-05', city: 'Online', category: 'Hackathon', status: 'upcoming', featured: false },
  { id: '5', title: 'DeFi Webinar', date: '2026-07-20', city: 'Online', category: 'Webinar', status: 'past', featured: false },
  { id: '6', title: 'Network Update', date: '2026-06-15', city: 'London', category: 'Meetup', status: 'past', featured: false },
];

export const $events = atom<RidgeEvent[]>(SEED_EVENTS);
export const $leads = atom<Lead[]>([]);
export const $theme = atom<Theme>('light');

export const $eventsFilter = map<{ status: EventStatus | '', category: EventCategory | '' }>({ status: '', category: '' });
export const $eventsSort = map<{ by: 'date' | 'title', direction: 'asc' | 'desc' }>({ by: 'date', direction: 'asc' });
export const $selectedEventIds = atom<string[]>([]);

export const $megaMenuOpen = atom(false);
export const $eventsManagerOpen = atom(false);
export const $commandPaletteOpen = atom(false);
export const $exportCatalogOpen = atom(false);

// Persistent polite status region (mounted once in AppClient) for cross-component
// announcements: copy confirmations, import results, validation summaries.
export const $a11yStatus = atom('');
let a11ySeq = 0;
export function announce(message: string) {
  if (!message) return;
  a11ySeq += 1;
  $a11yStatus.set(`${message} `);
  // Clear after a few seconds so the region does not stay permanently populated.
  const seq = a11ySeq;
  setTimeout(() => { if (seq === a11ySeq) $a11yStatus.set(''); }, 4000);
}

// Undo / Redo stacks for events
interface HistoryState {
  events: RidgeEvent[];
}
export const $historyUndo = atom<HistoryState[]>([]);
export const $historyRedo = atom<HistoryState[]>([]);

export function saveHistoryState() {
  const current = $events.get();
  const undoStack = $historyUndo.get();
  $historyUndo.set([...undoStack, { events: [...current] }]);
  $historyRedo.set([]); // Clear redo stack on new action
}

export function undoEventAction() {
  const undoStack = $historyUndo.get();
  if (undoStack.length === 0) return;
  const lastState = undoStack[undoStack.length - 1];
  const currentState = $events.get();

  $historyRedo.set([...$historyRedo.get(), { events: [...currentState] }]);
  $events.set(lastState.events);
  $historyUndo.set(undoStack.slice(0, -1));
}

export function redoEventAction() {
  const redoStack = $historyRedo.get();
  if (redoStack.length === 0) return;
  const nextState = redoStack[redoStack.length - 1];
  const currentState = $events.get();

  $historyUndo.set([...$historyUndo.get(), { events: [...currentState] }]);
  $events.set(nextState.events);
  $historyRedo.set(redoStack.slice(0, -1));
}

export function addEvent(event: Omit<RidgeEvent, 'id'>) {
  saveHistoryState();
  const newEvent = { ...event, id: Math.random().toString(36).substr(2, 9) };
  $events.set([...$events.get(), newEvent]);
}

export function updateEvent(updated: RidgeEvent) {
  saveHistoryState();
  const current = $events.get();
  $events.set(current.map(e => e.id === updated.id ? updated : e));
}

export function deleteEvents(ids: string[]) {
  if (ids.length === 0) return;
  saveHistoryState();
  const current = $events.get();
  $events.set(current.filter(e => !ids.includes(e.id)));
  $selectedEventIds.set([]);
}

export function addLead(payload: LeadPayload) {
  const newLead: Lead = {
    id: Math.random().toString(36).substr(2, 9),
    kind: 'contact',
    submittedAt: new Date().toISOString(),
    payload
  };
  $leads.set([newLead, ...$leads.get()]); // Prepend
}

export function undoLastLead() {
  const current = $leads.get();
  if (current.length > 0) {
    $leads.set(current.slice(1));
  }
}

export function resetSessionToSeed() {
  $events.set(SEED_EVENTS);
  $leads.set([]);
  $theme.set('light');
  $megaMenuOpen.set(false);
  $eventsFilter.set({ status: '', category: '' });
  $eventsSort.set({ by: 'date', direction: 'asc' });
  $historyUndo.set([]);
  $historyRedo.set([]);
}

// Consistent display format used by Events Manager rows AND the Global Events
// listings / featured slots so date formatting matches across surfaces.
export function formatEventDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface LoadCatalogResult { ok: boolean; error?: string; }

export function loadCatalog(jsonStr: string, catalogName = 'catalog'): LoadCatalogResult {
  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: `Import failed: ${catalogName} is not valid JSON.` };
  }
  if (!data || typeof data !== 'object') {
    return { ok: false, error: `Import failed: ${catalogName} is not a catalog object.` };
  }
  for (const key of ['version', 'theme', 'events', 'leads', 'counts']) {
    if (!(key in data)) {
      return { ok: false, error: `Import failed: ${catalogName} is missing the required "${key}" key.` };
    }
  }
  if (!Array.isArray(data.events)) {
    return { ok: false, error: `Import failed: ${catalogName} "events" must be an array.` };
  }
  if (!Array.isArray(data.leads)) {
    return { ok: false, error: `Import failed: ${catalogName} "leads" must be an array.` };
  }
  if (data.version !== 1 || (data.theme !== 'light' && data.theme !== 'dark')) {
    return { ok: false, error: `Import failed: ${catalogName} has an invalid version or theme.` };
  }
  if (!data.counts || typeof data.counts !== 'object') {
    return { ok: false, error: `Import failed: ${catalogName} "counts" must be an object.` };
  }
  for (const e of data.events) {
    if (!e || typeof e.id !== 'string' || e.id.length === 0) {
      return { ok: false, error: `Import failed: ${catalogName} has an event with an invalid id.` };
    }
    if (typeof e.title !== 'string' || e.title.length < 2) {
      return { ok: false, error: `Import failed: ${catalogName} has an event with an invalid title.` };
    }
    if (typeof e.date !== 'string' || !DATE_RE.test(e.date)) {
      return { ok: false, error: `Import failed: ${catalogName} has an event with an invalid date.` };
    }
    if (typeof e.city !== 'string' || e.city.length < 2) {
      return { ok: false, error: `Import failed: ${catalogName} has an event with an invalid city.` };
    }
    if (!EVENT_CATEGORIES.includes(e.category)) {
      return { ok: false, error: `Import failed: ${catalogName} has an event with an invalid category.` };
    }
    if (!EVENT_STATUSES.includes(e.status)) {
      return { ok: false, error: `Import failed: ${catalogName} has an event with an invalid status.` };
    }
    if (typeof e.featured !== 'boolean') {
      return { ok: false, error: `Import failed: ${catalogName} has an event with an invalid featured flag.` };
    }
    if (e.featured && e.status !== 'featured') {
      return { ok: false, error: `Import failed: ${catalogName} breaks the featured/status rule (featured true requires status featured).` };
    }
    if (e.status === 'featured' && e.featured !== true) {
      return { ok: false, error: `Import failed: ${catalogName} breaks the featured/status rule (status featured requires featured true).` };
    }
  }
  for (const lead of data.leads) {
    if (!lead || typeof lead !== 'object' || typeof lead.id !== 'string' || lead.id.length === 0) {
      return { ok: false, error: `Import failed: ${catalogName} has a lead with an invalid id.` };
    }
    if (lead.kind !== 'contact' || typeof lead.submittedAt !== 'string' || Number.isNaN(Date.parse(lead.submittedAt))) {
      return { ok: false, error: `Import failed: ${catalogName} has an invalid contact lead envelope.` };
    }
    const payload = lead.payload;
    if (!payload || typeof payload !== 'object' || typeof payload.name !== 'string' || payload.name.length < 2) {
      return { ok: false, error: `Import failed: ${catalogName} has a lead with an invalid name.` };
    }
    if (typeof payload.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return { ok: false, error: `Import failed: ${catalogName} has a lead with an invalid email.` };
    }
    if (!['Build', 'Solutions', 'Community', 'Enterprise'].includes(payload.interest) || payload.privacy_consent !== true) {
      return { ok: false, error: `Import failed: ${catalogName} has a lead with invalid interest or privacy consent.` };
    }
    if (payload.company !== undefined && typeof payload.company !== 'string') {
      return { ok: false, error: `Import failed: ${catalogName} has a lead with an invalid company.` };
    }
    if (payload.message !== undefined && (typeof payload.message !== 'string' || (payload.message.length > 0 && payload.message.length < 10))) {
      return { ok: false, error: `Import failed: ${catalogName} has a lead with an invalid message.` };
    }
  }
  const expectedCounts = {
    events: data.events.length,
    leads: data.leads.length,
    upcoming: data.events.filter((event: any) => event.status === 'upcoming').length,
    featured: data.events.filter((event: any) => event.status === 'featured').length,
    past: data.events.filter((event: any) => event.status === 'past').length,
  };
  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (!Number.isInteger(data.counts[key]) || data.counts[key] < 0 || data.counts[key] !== expected) {
      return { ok: false, error: `Import failed: ${catalogName} has an invalid "counts.${key}" value.` };
    }
  }

  $events.set(data.events.map((e: any) => ({
    id: String(e.id ?? Math.random().toString(36).slice(2, 9)),
    title: e.title,
    date: e.date,
    city: e.city,
    category: e.category,
    status: e.status,
    featured: Boolean(e.featured),
  })));
  $leads.set(data.leads.map((lead: any) => ({
    id: lead.id,
    kind: 'contact' as const,
    submittedAt: lead.submittedAt,
    payload: {
      name: lead.payload.name,
      email: lead.payload.email,
      company: lead.payload.company,
      interest: lead.payload.interest,
      privacy_consent: true,
      message: lead.payload.message,
    },
  })));
  $theme.set(data.theme);
  $eventsFilter.set({ status: '', category: '' });
  $historyUndo.set([]);
  $historyRedo.set([]);
  $selectedEventIds.set([]);
  return { ok: true };
}
