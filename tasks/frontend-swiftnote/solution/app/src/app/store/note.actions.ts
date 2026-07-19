import { createAction, props } from '@ngrx/store';
import { Note } from '../models/note.model';

export const createNote = createAction('[Note] Create Note');
export const updateNote = createAction('[Note] Update Note', props<{ id: string; changes: Partial<Note> }>());
export const deleteNote = createAction('[Note] Delete Note', props<{ id: string }>());
export const selectNote = createAction('[Note] Select Note', props<{ id: string | null }>());
export const pinNote = createAction('[Note] Pin Note', props<{ id: string }>());
export const duplicateNote = createAction('[Note] Duplicate Note', props<{ id: string }>());
export const loadSampleData = createAction('[Note] Load Sample Data');
export const loadFromStorage = createAction('[Note] Load From Storage', props<{ notes: Note[]; selectedNoteId: string | null }>());

export const setSearchQuery = createAction('[UI] Set Search Query', props<{ query: string }>());
export const toggleFocusMode = createAction('[UI] Toggle Focus Mode');
export const openQuickSwitcher = createAction('[UI] Open Quick Switcher');
export const closeQuickSwitcher = createAction('[UI] Close Quick Switcher');
export const openShortcuts = createAction('[UI] Open Shortcuts');
export const closeShortcuts = createAction('[UI] Close Shortcuts');
export const showToast = createAction('[UI] Show Toast', props<{ message: string }>());
export const clearToast = createAction('[UI] Clear Toast');
export const toggleSidebar = createAction('[UI] Toggle Sidebar');
