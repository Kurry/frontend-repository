import { createStore, produce } from 'solid-js/store';
import { MT_DATA } from '../data';

const initialState = {
  events: MT_DATA.events.map(e => ({...e, isUserManaged: false})),
  window: { from: MT_DATA.defaultFrom, to: MT_DATA.defaultTo },
  filters: { categories: MT_DATA.categories.map(c => c.id), search: '' },
  activeMode: 'scrub', // 'scrub' or 'library'
  selectedId: null,
  sort: 'asc',
  undoHistory: [],
  redoHistory: [],
  exportDrawerOpen: false,
  importDiagnostic: null,
  lastMutation: null, // e.g. "Created event", "Batch delete"
};

export const [state, setState] = createStore(initialState);

// Actions
export const addEvent = (eventData) => {
  const newEvent = {
    ...eventData,
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2),
    isUserManaged: true,
  };
  setState(produce(s => {
    s.undoHistory.push({ type: 'CREATE', event: newEvent });
    s.redoHistory = [];
    s.events.push(newEvent);
    s.lastMutation = 'Created event';
  }));
  return newEvent;
};

export const updateEvent = (id, eventData) => {
  setState(produce(s => {
    const idx = s.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      s.undoHistory.push({ type: 'UPDATE', event: { ...s.events[idx] }, newEvent: { ...s.events[idx], ...eventData } });
      s.redoHistory = [];
      s.events[idx] = { ...s.events[idx], ...eventData };
      s.lastMutation = 'Updated event';
    }
  }));
};

export const deleteEvent = (id) => {
  setState(produce(s => {
    const ev = s.events.find(e => e.id === id);
    if (ev) {
      s.undoHistory.push({ type: 'DELETE', event: ev });
      s.redoHistory = [];
      s.events = s.events.filter(e => e.id !== id);
      s.lastMutation = 'Deleted event';
      if (s.selectedId === id) s.selectedId = null;
    }
  }));
};

export const batchCategorize = (ids, category) => {
  setState(produce(s => {
    const originalEvents = [];
    const newEvents = [];
    ids.forEach(id => {
      const idx = s.events.findIndex(e => e.id === id);
      if (idx !== -1) {
        originalEvents.push({ ...s.events[idx] });
        s.events[idx].categories = [category];
        newEvents.push({ ...s.events[idx] });
      }
    });
    if (originalEvents.length > 0) {
      s.undoHistory.push({ type: 'BATCH_CATEGORIZE', originalEvents, newEvents });
      s.redoHistory = [];
      s.lastMutation = 'Batch categorized';
    }
  }));
};

export const batchDelete = (ids) => {
  setState(produce(s => {
    const deletedEvents = s.events.filter(e => ids.includes(e.id));
    if (deletedEvents.length > 0) {
      s.undoHistory.push({ type: 'BATCH_DELETE', events: deletedEvents });
      s.redoHistory = [];
      s.events = s.events.filter(e => !ids.includes(e.id));
      if (ids.includes(s.selectedId)) s.selectedId = null;
      s.lastMutation = 'Batch deleted';
    }
  }));
};

export const undo = () => {
  setState(produce(s => {
    const action = s.undoHistory.pop();
    if (!action) return;
    s.redoHistory.push(action);
    switch (action.type) {
      case 'CREATE':
        s.events = s.events.filter(e => e.id !== action.event.id);
        if (s.selectedId === action.event.id) s.selectedId = null;
        break;
      case 'UPDATE':
        const idxUpdate = s.events.findIndex(e => e.id === action.event.id);
        if (idxUpdate !== -1) s.events[idxUpdate] = action.event;
        break;
      case 'DELETE':
        s.events.push(action.event);
        break;
      case 'BATCH_CATEGORIZE':
        action.originalEvents.forEach(orig => {
          const idx = s.events.findIndex(e => e.id === orig.id);
          if (idx !== -1) s.events[idx] = orig;
        });
        break;
      case 'BATCH_DELETE':
        s.events.push(...action.events);
        break;
      case 'IMPORT':
        s.events = action.oldEvents;
        s.window = action.oldWindow;
        s.filters.categories = action.oldCategories;
        break;
    }
  }));
};

export const redo = () => {
  setState(produce(s => {
    const action = s.redoHistory.pop();
    if (!action) return;
    s.undoHistory.push(action);
    switch (action.type) {
      case 'CREATE':
        s.events.push(action.event);
        break;
      case 'UPDATE':
        const idxUpdate = s.events.findIndex(e => e.id === action.newEvent.id);
        if (idxUpdate !== -1) s.events[idxUpdate] = action.newEvent;
        break;
      case 'DELETE':
        s.events = s.events.filter(e => e.id !== action.event.id);
        if (s.selectedId === action.event.id) s.selectedId = null;
        break;
      case 'BATCH_CATEGORIZE':
        action.newEvents.forEach(neu => {
          const idx = s.events.findIndex(e => e.id === neu.id);
          if (idx !== -1) s.events[idx] = neu;
        });
        break;
      case 'BATCH_DELETE':
        const ids = action.events.map(e => e.id);
        s.events = s.events.filter(e => !ids.includes(e.id));
        if (ids.includes(s.selectedId)) s.selectedId = null;
        break;
      case 'IMPORT':
        s.events = action.newEvents;
        s.window = action.newWindow;
        s.filters.categories = action.newCategories;
        break;
    }
  }));
};

export const importTimeline = (data) => {
  setState(produce(s => {
    s.undoHistory.push({
      type: 'IMPORT',
      oldEvents: [...s.events],
      oldWindow: { ...s.window },
      oldCategories: [...s.filters.categories],
      newEvents: data.events.map((e, i) => ({...e, isUserManaged: true, id: 'imp_' + Date.now().toString(36) + i})),
      newWindow: { ...data.window },
      newCategories: [...data.enabledCategories],
    });
    s.redoHistory = [];
    s.events = data.events.map((e, i) => ({...e, isUserManaged: true, id: 'imp_' + Date.now().toString(36) + i}));
    s.window = { from: data.window.fromYear, to: data.window.toYear };
    s.filters.categories = [...data.enabledCategories];
    s.lastMutation = 'Imported timeline';
  }));
};
