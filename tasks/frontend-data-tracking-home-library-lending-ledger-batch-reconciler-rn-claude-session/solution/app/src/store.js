import { create } from 'zustand';

// Seeded books
const initialBooks = [
  { id: '1', title: 'The Dispossessed', author: 'Ursula K. Le Guin', status: 'ready', condition: 'good' },
  { id: '2', title: 'Dune', author: 'Frank Herbert', status: 'draft', condition: 'poor' },
  { id: '3', title: 'Neuromancer', author: 'William Gibson', status: 'archived', condition: 'good' },
  { id: '4', title: 'Foundation', author: 'Isaac Asimov', status: 'ready', condition: 'excellent' },
];

export const useStore = create((set, get) => ({
  schemaVersion: 'v1',
  exportedAt: null,
  books: initialBooks,

  // derived/session state
  selectedBookIds: [],
  batchReconcilerState: 'idle', // 'idle', 'selected', 'changed', 'conflict', 'resolved'
  aggregateTotals: { total: 0, ready: 0, draft: 0, archived: 0 },
  history: [], // undo stack for canonical mutation

  // Actions
  addBook: (book) => set((state) => ({ books: [...state.books, book] })),

  updateBook: (id, updates) => set((state) => ({
    books: state.books.map(b => b.id === id ? { ...b, ...updates } : b)
  })),

  deleteBook: (id) => set((state) => ({
    books: state.books.filter(b => b.id !== id),
    selectedBookIds: state.selectedBookIds.filter(selId => selId !== id)
  })),

  toggleSelection: (id) => set((state) => {
    const isSelected = state.selectedBookIds.includes(id);
    const newSelection = isSelected
      ? state.selectedBookIds.filter(bId => bId !== id)
      : [...state.selectedBookIds, id];

    return {
      selectedBookIds: newSelection,
      batchReconcilerState: newSelection.length > 0 ? 'selected' : 'idle'
    };
  }),

  // Canonical mutation
  reconcileBatch: (targetStatus) => set((state) => {
    if (state.selectedBookIds.length === 0) return {};

    // Save history for undo
    const currentStateToSave = {
      books: [...state.books],
      selectedBookIds: [...state.selectedBookIds],
      batchReconcilerState: state.batchReconcilerState,
      aggregateTotals: { ...state.aggregateTotals }
    };

    const newBooks = state.books.map(b =>
      state.selectedBookIds.includes(b.id) ? { ...b, status: targetStatus } : b
    );

    // Calculate new aggregate totals from the selection's new state
    const targetStatusCount = newBooks.filter(b => state.selectedBookIds.includes(b.id)).length;

    return {
      books: newBooks,
      batchReconcilerState: 'resolved',
      aggregateTotals: {
        total: state.selectedBookIds.length,
        [targetStatus]: targetStatusCount,
      },
      history: [...state.history, currentStateToSave]
    };
  }),

  undoReconcile: () => set((state) => {
    if (state.history.length === 0) return {};
    const previousState = state.history[state.history.length - 1];
    return {
      ...previousState,
      history: state.history.slice(0, -1)
    };
  }),

  // Artifact transfer
  exportArtifact: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.books.map(b => ({
        ...b,
        batchReconcilerState: state.selectedBookIds.includes(b.id) ? state.batchReconcilerState : 'idle'
      })),
      derived: {
        summary: state.aggregateTotals
      },
      history: state.history
    };
  },

  importArtifact: (artifact) => set(() => {
    if (artifact.schemaVersion !== 'v1' || !Array.isArray(artifact.records)) {
      return {}; // invalid import is a no-op
    }

    // simplistic validation, if fields are completely wrong it fails
    const isValid = artifact.records.every(r => r.id && r.title && r.status);
    if (!isValid) return {};

    const importedIds = artifact.records.map(r => r.id);
    const uniqueIds = new Set(importedIds).size === importedIds.length;
    if (!uniqueIds) return {};

    return {
      books: artifact.records.map(r => ({
        id: r.id,
        title: r.title,
        author: r.author || 'Unknown',
        status: r.status,
        condition: r.condition || 'good'
      })),
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      history: artifact.history || [],
      aggregateTotals: artifact.derived?.summary || { total: 0, ready: 0, draft: 0, archived: 0 },
      selectedBookIds: [],
      batchReconcilerState: 'idle'
    };
  }),

  clearSession: () => set(() => ({
    books: [],
    selectedBookIds: [],
    batchReconcilerState: 'idle',
    aggregateTotals: { total: 0, ready: 0, draft: 0, archived: 0 },
    history: [],
    exportedAt: null
  }))
}));
