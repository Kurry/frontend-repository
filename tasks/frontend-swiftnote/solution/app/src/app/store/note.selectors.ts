import { createSelector } from '@ngrx/store';
import { RootState } from './note.reducer';

const selectAppState = (state: RootState) => state.app;

export const selectNotes = createSelector(selectAppState, s => s.notes);
export const selectSelectedNoteId = createSelector(selectAppState, s => s.selectedNoteId);
export const selectSearchQuery = createSelector(selectAppState, s => s.searchQuery);
export const selectFocusMode = createSelector(selectAppState, s => s.focusMode);
export const selectQuickSwitcherOpen = createSelector(selectAppState, s => s.quickSwitcherOpen);
export const selectShortcutsOpen = createSelector(selectAppState, s => s.shortcutsOpen);
export const selectToastMessage = createSelector(selectAppState, s => s.toastMessage);
export const selectSidebarCollapsed = createSelector(selectAppState, s => s.sidebarCollapsed);

export const selectSelectedNote = createSelector(
  selectNotes,
  selectSelectedNoteId,
  (notes, id) => notes.find(n => n.id === id) ?? null
);

export const selectSortedNotes = createSelector(selectNotes, (notes) => {
  const pinned = [...notes.filter(n => n.pinned)].sort((a, b) => b.updatedAt - a.updatedAt);
  const unpinned = [...notes.filter(n => !n.pinned)].sort((a, b) => b.updatedAt - a.updatedAt);
  return [...pinned, ...unpinned];
});

export const selectFilteredNotes = createSelector(
  selectSortedNotes,
  selectSearchQuery,
  (notes, query) => {
    if (!query.trim()) return notes;
    const lower = query.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(lower) ||
      n.body.toLowerCase().includes(lower)
    );
  }
);

export const selectTotalNotesCount = createSelector(selectNotes, n => n.length);
