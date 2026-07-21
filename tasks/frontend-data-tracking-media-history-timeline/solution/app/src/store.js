import { atom } from 'jotai';
import { MT_DATA } from './data.js';

// Base seeded data
const seedEvents = MT_DATA.events.map(ev => ({ ...ev, isSeeded: true }));
const defaultCategories = new Set(MT_DATA.categories.map(c => c.id));

// Atoms
export const eventsAtom = atom(seedEvents);
export const yearWindowAtom = atom({ from: MT_DATA.defaultFrom, to: MT_DATA.defaultTo });
export const activeCategoriesAtom = atom(defaultCategories);
export const searchAtom = atom("");
export const modeAtom = atom("explore"); // 'explore' or 'library'
export const selectedEventIdAtom = atom(null);

export const filterDrawerOpenAtom = atom(false);
export const aboutModalOpenAtom = atom(false);
export const exportDrawerOpenAtom = atom(false);
export const exportDrawerTabAtom = atom("json");
export const importDiagnosticAtom = atom("");

// Undo/Redo Stacks
export const undoHistoryAtom = atom([]);
export const redoHistoryAtom = atom([]);

// Session personalization (in-memory only — reload resets to seeded state)
export const sessionDefaultWindowAtom = atom(null);
export const paperToneAtom = atom('cool'); // 'cool' | 'warm' | 'slate'
export const densityAtom = atom('cozy');   // 'cozy' | 'compact'

// Last-mutation feedback chip
export const lastMutationAtom = atom(null); // { kind, label, at }

// Selectors
export const filteredEventsAtom = atom((get) => {
  const events = get(eventsAtom);
  const search = get(searchAtom).toLowerCase();
  const activeCats = get(activeCategoriesAtom);
  const yw = get(yearWindowAtom);

  return events.filter(ev => {
    // 1. Check year window bounds
    if (ev.year < yw.from || ev.year > yw.to) return false;

    // 2. Check category bounds
    const hasActiveCat = ev.categories.some(c => activeCats.has(c));
    if (!hasActiveCat) return false;

    // 3. Search
    if (search) {
      const matchText = `${ev.title} ${ev.place} ${ev.summary} ${ev.detail}`.toLowerCase();
      if (!matchText.includes(search)) return false;
    }

    return true;
  });
});

export const categoryTallyAtom = atom((get) => {
  const filtered = get(filteredEventsAtom);
  const tally = {};
  MT_DATA.categories.forEach(c => { tally[c.id] = 0; });

  filtered.forEach(ev => {
    ev.categories.forEach(c => {
      if (tally[c] !== undefined) {
        tally[c]++;
      }
    });
  });
  return tally;
});

// Helpers
// Expand the visible year window minimally so `year` falls inside it.
// Guarantees a valid create/edit is immediately visible in Library + stage.
export const expandWindowToYear = (get, set, year) => {
  const w = get(yearWindowAtom);
  if (year >= w.from && year <= w.to) return;
  const from = Math.max(MT_DATA.yearMin, Math.min(w.from, year));
  const to = Math.min(MT_DATA.yearMax, Math.max(w.to, year));
  set(yearWindowAtom, { from, to });
};

export const fullSpanAtom = atom(null, (get, set) => {
  set(yearWindowAtom, { from: MT_DATA.yearMin, to: MT_DATA.yearMax });
});

export const saveSessionDefaultAtom = atom(null, (get, set) => {
  set(sessionDefaultWindowAtom, { ...get(yearWindowAtom) });
});

// Mutators with History Support
const eventsSnapshot = (get) => ({ scope: 'events', events: get(eventsAtom) });
const timelineSnapshot = (get) => ({
  scope: 'timeline',
  events: get(eventsAtom),
  yearWindow: get(yearWindowAtom),
  activeCategories: get(activeCategoriesAtom),
  search: get(searchAtom),
});

const restoreTimelineSnapshot = (set, snapshot) => {
  set(eventsAtom, snapshot.events);
  if (snapshot.scope === 'timeline') {
    set(yearWindowAtom, snapshot.yearWindow);
    set(activeCategoriesAtom, snapshot.activeCategories);
    set(searchAtom, snapshot.search);
  }
};

const currentSnapshotFor = (get, snapshot) => (
  snapshot.scope === 'timeline' ? timelineSnapshot(get) : eventsSnapshot(get)
);

const pushHistory = (get, set, newEvents) => {
  const undo = get(undoHistoryAtom);
  set(undoHistoryAtom, [...undo, eventsSnapshot(get)]);
  set(redoHistoryAtom, []); // Clear redo on new action
  set(eventsAtom, newEvents);
};

export const importTimelineAtom = atom(null, (get, set, timeline) => {
  set(undoHistoryAtom, [...get(undoHistoryAtom), timelineSnapshot(get)]);
  set(redoHistoryAtom, []);
  set(eventsAtom, timeline.events);
  set(yearWindowAtom, timeline.yearWindow);
  set(activeCategoriesAtom, timeline.activeCategories);
  set(searchAtom, timeline.search);
  set(lastMutationAtom, { kind: 'import', label: `${timeline.events.length} events`, at: Date.now() });
});

export const addEventAtom = atom(null, (get, set, event) => {
  const newEvent = { ...event, id: `u_${Date.now()}_${Math.random()}` };
  pushHistory(get, set, [...get(eventsAtom), newEvent]);
  expandWindowToYear(get, set, newEvent.year);
  set(lastMutationAtom, { kind: 'added', label: newEvent.title, at: Date.now() });
});

export const updateEventAtom = atom(null, (get, set, updatedEvent) => {
  const current = get(eventsAtom);
  const newEvents = current.map(e => e.id === updatedEvent.id ? updatedEvent : e);
  pushHistory(get, set, newEvents);
  expandWindowToYear(get, set, updatedEvent.year);
  set(lastMutationAtom, { kind: 'updated', label: updatedEvent.title, at: Date.now() });
});

export const deleteEventAtom = atom(null, (get, set, eventId) => {
  const current = get(eventsAtom);
  const removed = current.find(e => e.id === eventId);
  const newEvents = current.filter(e => e.id !== eventId);
  pushHistory(get, set, newEvents);
  if (get(selectedEventIdAtom) === eventId) {
    set(selectedEventIdAtom, null);
  }
  set(lastMutationAtom, { kind: 'deleted', label: removed ? removed.title : '', at: Date.now() });
});

export const bulkSetCategoryAtom = atom(null, (get, set, { eventIds, categoryId }) => {
  const current = get(eventsAtom);
  const newEvents = current.map(e => {
    if (eventIds.includes(e.id) && !e.categories.includes(categoryId)) {
      return { ...e, categories: [...e.categories, categoryId] };
    }
    return e;
  });
  pushHistory(get, set, newEvents);
  set(lastMutationAtom, { kind: 'bulk-category', label: `${eventIds.length} events`, at: Date.now() });
});

export const bulkDeleteAtom = atom(null, (get, set, eventIds) => {
  const current = get(eventsAtom);
  const newEvents = current.filter(e => !eventIds.includes(e.id));
  pushHistory(get, set, newEvents);
  if (eventIds.includes(get(selectedEventIdAtom))) {
    set(selectedEventIdAtom, null);
  }
  set(lastMutationAtom, { kind: 'bulk-delete', label: `${eventIds.length} events`, at: Date.now() });
});

export const undoAtom = atom(null, (get, set) => {
  const undo = get(undoHistoryAtom);
  if (undo.length === 0) return;
  const previous = undo[undo.length - 1];

  set(undoHistoryAtom, undo.slice(0, -1));
  set(redoHistoryAtom, [...get(redoHistoryAtom), currentSnapshotFor(get, previous)]);
  restoreTimelineSnapshot(set, previous);
  set(lastMutationAtom, { kind: 'undo', label: '', at: Date.now() });
});

export const redoAtom = atom(null, (get, set) => {
  const redo = get(redoHistoryAtom);
  if (redo.length === 0) return;
  const next = redo[redo.length - 1];

  set(redoHistoryAtom, redo.slice(0, -1));
  set(undoHistoryAtom, [...get(undoHistoryAtom), currentSnapshotFor(get, next)]);
  restoreTimelineSnapshot(set, next);
  set(lastMutationAtom, { kind: 'redo', label: '', at: Date.now() });
});

export const resetFiltersAtom = atom(null, (get, set) => {
  set(searchAtom, "");
  set(activeCategoriesAtom, defaultCategories);
  set(yearWindowAtom, { from: MT_DATA.defaultFrom, to: MT_DATA.defaultTo });
});
