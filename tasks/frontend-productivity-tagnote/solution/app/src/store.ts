import type { AppState, HistoryBranch, HistoryEntry, HistoryState, Note } from './types';
import { generateId, getAllTags } from './utils';

const MAX_HISTORY = 50;

function emptyState(): AppState {
  return { notes: [], todoTags: [] };
}

function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState;
}

export function loadState(): AppState {
  return emptyState();
}

export function saveState(_state: AppState): void {
  // good-app: in-memory only — no browser storage
}

export function createInitialHistory(): HistoryState {
  return {
    past: [],
    present: emptyState(),
    future: [],
    branchId: generateId(),
    branches: [],
  };
}

export function pushHistory(history: HistoryState, label: string): HistoryState {
  const entry: HistoryEntry = {
    state: cloneState(history.present),
    timestamp: Date.now(),
    label,
  };
  const past = [...history.past, entry].slice(-MAX_HISTORY);
  return {
    ...history,
    past,
    future: [],
    branchId: history.branchId,
  };
}

export function pushHistoryAndPresent(
  history: HistoryState,
  newState: AppState,
  label: string
): HistoryState {
  let branches = [...history.branches];
  if (history.future.length > 0) {
    const abandoned = history.future[history.future.length - 1];
    branches = [
      ...branches,
      {
        id: generateId(),
        label: `Branch: ${abandoned.label}`,
        state: cloneState(abandoned.state),
      },
    ];
  }

  const entry: HistoryEntry = {
    state: cloneState(history.present),
    timestamp: Date.now(),
    label,
  };
  const past = [...history.past, entry].slice(-MAX_HISTORY);
  return {
    ...history,
    past,
    present: newState,
    future: [],
    branches,
  };
}

export function undo(history: HistoryState): HistoryState {
  if (history.past.length === 0) return history;
  const prev = history.past[history.past.length - 1];
  const past = history.past.slice(0, -1);
  const future: HistoryEntry = {
    state: cloneState(history.present),
    timestamp: Date.now(),
    label: 'Redo point',
  };
  return {
    ...history,
    past,
    present: cloneState(prev.state),
    future: [future, ...history.future],
  };
}

export function redo(history: HistoryState): HistoryState {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  const future = history.future.slice(1);
  const past: HistoryEntry = {
    state: cloneState(history.present),
    timestamp: Date.now(),
    label: 'Undo point',
  };
  return {
    ...history,
    past: [...history.past, past],
    present: cloneState(next.state),
    future,
  };
}

export function jumpToPastSnapshot(history: HistoryState, index: number): HistoryState {
  if (index < 0 || index >= history.past.length) return history;
  const selected = history.past[index];
  const future = [
    {
      state: cloneState(history.present),
      timestamp: Date.now(),
      label: 'Current state',
    },
    ...history.past.slice(index + 1).map((entry) => ({
      ...entry,
      state: cloneState(entry.state),
    })),
    ...history.future.map((entry) => ({
      ...entry,
      state: cloneState(entry.state),
    })),
  ];
  const past = history.past.slice(0, index).map((entry) => ({
    ...entry,
    state: cloneState(entry.state),
  }));
  return {
    ...history,
    past,
    present: cloneState(selected.state),
    future,
  };
}

export function jumpToFutureSnapshot(history: HistoryState, index: number): HistoryState {
  if (index < 0 || index >= history.future.length) return history;
  const selected = history.future[index];
  const past = [
    ...history.past.map((entry) => ({
      ...entry,
      state: cloneState(entry.state),
    })),
    {
      state: cloneState(history.present),
      timestamp: Date.now(),
      label: 'Previous state',
    },
    ...history.future.slice(0, index).map((entry) => ({
      ...entry,
      state: cloneState(entry.state),
    })),
  ];
  const future = history.future.slice(index + 1).map((entry) => ({
    ...entry,
    state: cloneState(entry.state),
  }));
  return {
    ...history,
    past,
    present: cloneState(selected.state),
    future,
  };
}

export function applyBranch(history: HistoryState, branch: HistoryBranch): HistoryState {
  const past: HistoryEntry = {
    state: cloneState(history.present),
    timestamp: Date.now(),
    label: 'Before branch apply',
  };
  return {
    ...history,
    past: [...history.past, past],
    present: cloneState(branch.state),
    future: [],
    branchId: branch.id,
  };
}

export function addNote(
  state: AppState,
  text: string,
  file?: { name: string; size: number },
  marks: Note['marks'] = []
): AppState {
  const tags = getAllTags(text);
  if (file && !tags.includes('file')) {
    tags.push('file');
  }
  const note: Note = {
    id: generateId(),
    text,
    tags,
    marks,
    createdAt: Date.now(),
    pinned: false,
    archived: false,
    done: false,
    file,
  };
  return {
    ...state,
    notes: [...state.notes, note],
  };
}

export function attachFileToNote(
  state: AppState,
  noteId: string,
  file: { name: string; size: number }
): AppState {
  return {
    ...state,
    notes: state.notes.map((n) => {
      if (n.id !== noteId) return n;
      const tags = [...n.tags];
      if (!tags.includes('file')) tags.push('file');
      return { ...n, file, tags };
    }),
  };
}

export function editNote(
  state: AppState,
  noteId: string,
  newText: string,
  marks?: Note['marks']
): AppState {
  return {
    ...state,
    notes: state.notes.map((n) => {
      if (n.id === noteId) {
        const tags = getAllTags(newText);
        if (n.file && !tags.includes('file')) {
          tags.push('file');
        }
        return {
          ...n,
          text: newText,
          tags,
          marks: marks ?? n.marks ?? [],
        };
      }
      return n;
    }),
  };
}

export function deleteNote(state: AppState, noteId: string): AppState {
  return {
    ...state,
    notes: state.notes.filter((n) => n.id !== noteId),
  };
}

export function togglePin(state: AppState, noteId: string): AppState {
  return {
    ...state,
    notes: state.notes.map((n) => {
      if (n.id === noteId) return { ...n, pinned: !n.pinned };
      return n;
    }),
  };
}

export function toggleArchive(state: AppState, noteId: string): AppState {
  return {
    ...state,
    notes: state.notes.map((n) => {
      if (n.id === noteId) return { ...n, archived: !n.archived };
      return n;
    }),
  };
}

export function toggleDone(state: AppState, noteId: string): AppState {
  return {
    ...state,
    notes: state.notes.map((n) => {
      if (n.id === noteId) return { ...n, done: !n.done };
      return n;
    }),
  };
}

export function toggleTodoTag(state: AppState, tag: string): AppState {
  const t = tag.toLowerCase();
  const todoTags = state.todoTags.includes(t)
    ? state.todoTags.filter((x) => x !== t)
    : [...state.todoTags, t];
  return { ...state, todoTags };
}

export function getTagMap(notes: Note[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return map;
}

export function filterByTag(notes: Note[], tag: string): Note[] {
  const t = tag.toLowerCase();
  return notes.filter((n) => n.tags.includes(t));
}

export function filterBySearch(notes: Note[], query: string, todoTags: string[] = []): Note[] {
  if (!query.trim()) return notes;
  const q = query.toLowerCase().trim();
  const tokens = q.split(' ');

  return notes.filter((n) => {
    let match = true;
    for (const token of tokens) {
      if (token.startsWith('tag:')) {
        const t = token.slice(4);
        if (!n.tags.includes(t)) match = false;
      } else if (token === 'done:open') {
        if (n.done || !n.tags.some((t) => todoTags.includes(t))) match = false;
      } else if (token === 'done:done') {
        if (!n.done || !n.tags.some((t) => todoTags.includes(t))) match = false;
      } else if (!n.text.toLowerCase().includes(token) && !n.tags.some((t) => t.includes(token))) {
        match = false;
      }
    }
    return match;
  });
}

export function filterByDate(notes: Note[], dateKey: string): Note[] {
  return notes.filter((n) => {
    const d = new Date(n.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return key === dateKey;
  });
}

export interface VisibleNotesFilters {
  showArchived: boolean;
  activeTag: string | null;
  activeDateFilter: string | null;
  searchQuery: string;
}

export function computeVisibleNotes(
  notes: Note[],
  todoTags: string[],
  filters: VisibleNotesFilters
): Note[] {
  let visible: Note[];
  if (filters.showArchived) {
    visible = notes.filter((n) => n.archived);
  } else {
    visible = notes.filter((n) => !n.archived);
    if (filters.activeTag) visible = filterByTag(visible, filters.activeTag);
    if (filters.activeDateFilter) visible = filterByDate(visible, filters.activeDateFilter);
  }
  if (filters.searchQuery.trim()) {
    visible = filterBySearch(visible, filters.searchQuery, todoTags);
  }
  return visible;
}

export function bulkArchive(state: AppState, noteIds: string[]): AppState {
  const ids = new Set(noteIds);
  return {
    ...state,
    notes: state.notes.map((n) => (ids.has(n.id) ? { ...n, archived: true } : n)),
  };
}

export function bulkPin(state: AppState, noteIds: string[]): AppState {
  const ids = new Set(noteIds);
  return {
    ...state,
    notes: state.notes.map((n) => (ids.has(n.id) ? { ...n, pinned: true } : n)),
  };
}

export function bulkDelete(state: AppState, noteIds: string[]): AppState {
  const ids = new Set(noteIds);
  return {
    ...state,
    notes: state.notes.filter((n) => !ids.has(n.id)),
  };
}
