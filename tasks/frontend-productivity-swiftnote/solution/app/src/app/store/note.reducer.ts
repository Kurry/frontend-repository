import { createReducer, on } from '@ngrx/store';
import { ActionReducer } from '@ngrx/store';
import { Note } from '../models/note.model';
import * as NoteActions from './note.actions';

export interface AppState {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  focusMode: boolean;
  quickSwitcherOpen: boolean;
  shortcutsOpen: boolean;
  toastMessage: string | null;
  sidebarCollapsed: boolean;
  workspaceExportOpen: boolean;
  workspaceImportOpen: boolean;
  txtExportOpen: boolean;
}

function createInitialState(): AppState {
  const base: AppState = {
    notes: [],
    selectedNoteId: null,
    searchQuery: '',
    focusMode: false,
    quickSwitcherOpen: false,
    shortcutsOpen: false,
    toastMessage: null,
    sidebarCollapsed: false,
    workspaceExportOpen: false,
    workspaceImportOpen: false,
    txtExportOpen: false,
  };

  try {
    if (typeof localStorage === 'undefined') return base;
    const raw = localStorage.getItem('swiftnote-state');
    if (!raw) return base;
    const persisted = JSON.parse(raw) as Partial<Pick<AppState, 'notes' | 'selectedNoteId'>>;
    if (!Array.isArray(persisted.notes)) return base;

    const notes = persisted.notes.filter((note): note is Note =>
      Boolean(
        note &&
        typeof note.id === 'string' &&
        typeof note.title === 'string' &&
        typeof note.body === 'string' &&
        Array.isArray(note.images) &&
        typeof note.pinned === 'boolean' &&
        typeof note.createdAt === 'number' &&
        typeof note.updatedAt === 'number'
      )
    );
    const selectedNoteId = notes.some(note => note.id === persisted.selectedNoteId)
      ? persisted.selectedNoteId ?? null
      : notes[0]?.id ?? null;

    return { ...base, notes, selectedNoteId };
  } catch {
    return base;
  }
}

const initialState: AppState = createInitialState();

let _idCounter = 0;
function generateId(): string {
  return `note-${Date.now()}-${++_idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

const TOPICS = ['Meeting', 'Project', 'Idea', 'Todo', 'Research', 'Note', 'Task', 'Plan', 'Draft', 'Memo'];
const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
  'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon'];

function generateSampleNotes(count: number): Note[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `sample-${i}`,
    title: `${TOPICS[i % TOPICS.length]} ${i + 1}`,
    body: `This is sample note ${i + 1}. ${WORDS[i % WORDS.length]} ${WORDS[(i + 3) % WORDS.length]} ${WORDS[(i + 7) % WORDS.length]}. Content for demonstration purposes.`,
    images: [],
    pinned: false,
    createdAt: now - (count - i) * 1000,
    updatedAt: now - (count - i) * 1000,
  }));
}

export const noteReducer = createReducer(
  initialState,

  on(NoteActions.loadFromStorage, (state, { notes, selectedNoteId }) => ({
    ...state,
    notes,
    selectedNoteId,
  })),

  on(NoteActions.createNote, (state) => {
    const id = generateId();
    const note: Note = {
      id,
      title: '',
      body: '',
      images: [],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return {
      ...state,
      notes: [note, ...state.notes],
      selectedNoteId: id,
      searchQuery: '',
    };
  }),

  on(NoteActions.updateNote, (state, { id, changes }) => ({
    ...state,
    notes: state.notes.map(n =>
      n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n
    ),
  })),

  on(NoteActions.deleteNote, (state, { id }) => {
    const remaining = state.notes.filter(n => n.id !== id);
    const wasSelected = state.selectedNoteId === id;
    const newSelected = wasSelected
      ? (remaining.length > 0 ? remaining[0].id : null)
      : state.selectedNoteId;
    return {
      ...state,
      notes: remaining,
      selectedNoteId: newSelected,
    };
  }),

  on(NoteActions.selectNote, (state, { id }) => ({
    ...state,
    selectedNoteId: id,
    quickSwitcherOpen: false,
  })),

  on(NoteActions.pinNote, (state, { id }) => ({
    ...state,
    notes: state.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n),
  })),

  on(NoteActions.duplicateNote, (state, { id }) => {
    const source = state.notes.find(n => n.id === id);
    if (!source) return state;
    const newId = generateId();
    const duplicate: Note = {
      id: newId,
      title: source.title ? `${source.title} (duplicate)` : 'Untitled (duplicate)',
      body: source.body,
      images: source.images.map(img => ({ ...img })),
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return {
      ...state,
      notes: [duplicate, ...state.notes],
      selectedNoteId: newId,
      searchQuery: '',
    };
  }),

  on(NoteActions.loadSampleData, (state) => {
    const sampleNotes = generateSampleNotes(10000);
    const userNotes = state.notes.filter(n => !n.id.startsWith('sample-'));
    return {
      ...state,
      notes: [...userNotes, ...sampleNotes],
    };
  }),

  on(NoteActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query,
  })),

  on(NoteActions.toggleFocusMode, (state) => ({
    ...state,
    focusMode: !state.focusMode,
  })),

  on(NoteActions.openQuickSwitcher, (state) => ({
    ...state,
    quickSwitcherOpen: true,
  })),

  on(NoteActions.closeQuickSwitcher, (state) => ({
    ...state,
    quickSwitcherOpen: false,
  })),

  on(NoteActions.openShortcuts, (state) => ({
    ...state,
    shortcutsOpen: true,
  })),

  on(NoteActions.closeShortcuts, (state) => ({
    ...state,
    shortcutsOpen: false,
  })),

  on(NoteActions.showToast, (state, { message }) => ({
    ...state,
    toastMessage: message,
  })),

  on(NoteActions.clearToast, (state) => ({
    ...state,
    toastMessage: null,
  })),

  on(NoteActions.toggleSidebar, (state) => ({
    ...state,
    sidebarCollapsed: !state.sidebarCollapsed,
  })),

  on(NoteActions.openWorkspaceExport, (state) => ({
    ...state,
    workspaceExportOpen: true,
    workspaceImportOpen: false,
    txtExportOpen: false,
    quickSwitcherOpen: false,
    shortcutsOpen: false,
  })),
  on(NoteActions.closeWorkspaceExport, (state) => ({ ...state, workspaceExportOpen: false })),
  on(NoteActions.openWorkspaceImport, (state) => ({
    ...state,
    workspaceImportOpen: true,
    workspaceExportOpen: false,
    txtExportOpen: false,
    quickSwitcherOpen: false,
    shortcutsOpen: false,
  })),
  on(NoteActions.closeWorkspaceImport, (state) => ({ ...state, workspaceImportOpen: false })),
  on(NoteActions.openTxtExport, (state) => ({
    ...state,
    txtExportOpen: true,
    workspaceExportOpen: false,
    workspaceImportOpen: false,
    quickSwitcherOpen: false,
    shortcutsOpen: false,
  })),
  on(NoteActions.closeTxtExport, (state) => ({ ...state, txtExportOpen: false })),

  on(NoteActions.importWorkspace, (state, { notes, selectedNoteId }) => ({
    ...state,
    notes,
    selectedNoteId: notes.some(n => n.id === selectedNoteId) ? selectedNoteId : (notes[0]?.id ?? null),
    searchQuery: '',
    workspaceImportOpen: false,
  })),
);

export interface RootState {
  app: AppState;
}

// Meta-reducer: persist user notes to localStorage after each action
export function localStorageMetaReducer(reducer: ActionReducer<RootState>): ActionReducer<RootState> {
  return function (state, action) {
    const nextState = reducer(state, action);
    try {
      if (typeof localStorage !== 'undefined') {
        const appState = nextState?.app;
        if (appState) {
          const notesToSave = appState.notes.filter(n => !n.id.startsWith('sample-'));
          const persisted = {
            notes: notesToSave,
            selectedNoteId: notesToSave.some(n => n.id === appState.selectedNoteId)
              ? appState.selectedNoteId
              : (notesToSave[0]?.id ?? null),
          };
          localStorage.setItem('swiftnote-state', JSON.stringify(persisted));
        }
      }
    } catch {
      // localStorage unavailable or full
    }
    return nextState;
  };
}
