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

export function loadCatalog(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.version || !data.events || !data.leads || !data.counts) {
      throw new Error("Missing keys");
    }

    // Cross-field validation (featured == true <-> status == 'featured')
    for (const e of data.events) {
       if (e.featured && e.status !== 'featured') throw new Error("Invalid cross-field: featured but status not featured");
       if (e.status === 'featured' && !e.featured) throw new Error("Invalid cross-field: status featured but not featured");
       // Basic enum check
       if (!['upcoming', 'featured', 'past'].includes(e.status)) throw new Error("Invalid status enum");
       if (!['Summit', 'Meetup', 'Workshop', 'Hackathon', 'Webinar'].includes(e.category)) throw new Error("Invalid category enum");
    }

    $events.set(data.events);
    if (Array.isArray(data.leads)) {
      $leads.set(data.leads);
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
