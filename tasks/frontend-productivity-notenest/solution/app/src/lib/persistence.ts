// NoteNest is an in-memory workspace by contract: shared state lives only in
// Svelte runes for the session. A page reload returns the app to its seeded
// baseline. Session work survives exclusively through the downloadable Nest
// JSON / Markdown vault artifacts and the WebMCP export surface — never through
// localStorage, sessionStorage, IndexedDB, or any other browser persistence.

export interface StoredData {
  folders: any[];
  notes: any[];
  lastNoteId: number;
  lastFolderId: number;
  lastChecklistBlockId: number;
  lastChecklistItemId: number;
  lastImageId: number;
}

// No browser storage is read: the workspace always starts from its baseline.
export function loadData(): StoredData | null {
  return null;
}

// No-op: state is intentionally never written to any browser persistence store.
export function saveData(_data: StoredData): void {
  /* intentionally in-memory only */
}
