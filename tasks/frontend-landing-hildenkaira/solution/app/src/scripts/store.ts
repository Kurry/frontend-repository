import { atom, map } from "nanostores";

export const state = map({
  shortlistedClients: [],
  locale: "en",
  cookieCategories: {
    essential: true,
    marketing: true,
    analytics: true,
    personalization: true
  },
  contactSubmitted: false,
  contactEmail: null,
  activeClient: "Loom House",
  flickIndexByClient: {
    "Loom House": 0,
    "Second Circle": 0,
    "New Current": 0,
    "Roadkind": 0,
    "Motive Lab": 0
  },
  testimonialIndex: 0,
  activeOrganicViews: "0",
  activeLikes: "0"
});

export const undoStack = atom([]);
export const redoStack = atom([]);

export function pushUndo() {
  const s = JSON.parse(JSON.stringify(state.get()));
  undoStack.set([...undoStack.get(), s]);
  redoStack.set([]);
}

export function undo() {
  const u = undoStack.get();
  if (u.length === 0) return;
  const curr = JSON.parse(JSON.stringify(state.get()));
  redoStack.set([...redoStack.get(), curr]);
  const prev = u[u.length - 1];
  undoStack.set(u.slice(0, u.length - 1));
  state.set(prev);
}

export function redo() {
  const r = redoStack.get();
  if (r.length === 0) return;
  const curr = JSON.parse(JSON.stringify(state.get()));
  undoStack.set([...undoStack.get(), curr]);
  const next = r[r.length - 1];
  redoStack.set(r.slice(0, r.length - 1));
  state.set(next);
}

export function resetStore() {
  state.set({
    shortlistedClients: [],
    locale: "en",
    cookieCategories: {
      essential: true,
      marketing: true,
      analytics: true,
      personalization: true
    },
    contactSubmitted: false,
    contactEmail: null,
    activeClient: "Loom House",
    flickIndexByClient: {
      "Loom House": 0,
      "Second Circle": 0,
      "New Current": 0,
      "Roadkind": 0,
      "Motive Lab": 0
    },
    testimonialIndex: 0,
    activeOrganicViews: "0",
    activeLikes: "0"
  });
  undoStack.set([]);
  redoStack.set([]);
}
