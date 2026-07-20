import type { Folder, Note, NoteColor, ChecklistBlock, ChecklistItem, NoteImage } from './types';
import { loadData, saveData, type StoredData } from './persistence';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Session undo/redo keeps full workspace snapshots (including inline image
// dataUrls), so an unbounded stack can accumulate large duplicated strings
// over a long edit/import/export session. Cap depth and drop the oldest
// entries once exceeded — well past what a real editing session needs.
const MAX_UNDO_DEPTH = 100;

// Toast state
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let _toasts: Toast[] = $state([]);

export function getToasts(): Toast[] {
  return _toasts;
}

export function addToast(message: string, type: Toast['type'] = 'success'): void {
  const id = generateId();
  _toasts.push({ id, message, type });
  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
  }, 3000);
}

// Main app state
class AppStore {
  folders: Folder[] = $state([]);
  notes: Note[] = $state([]);
  selectedFolderId: string | null = $state(null); // null = All Notes, 'trash' = Trash
  selectedNoteId: string | null = $state(null);
  searchQuery: string = $state('');
  sidebarOpen: boolean = $state(true);

  // Multi-select set (note ids currently checked for batch actions)
  selectedIds: string[] = $state([]);

  // UI chrome state
  exportOpen: boolean = $state(false);
  importOpen: boolean = $state(false);
  exportTab: 'json' | 'markdown' = $state('json');
  paletteOpen: boolean = $state(false);

  // Session undo/redo history (snapshots of the mutable workspace)
  #undoStack: string[] = $state([]);
  #redoStack: string[] = $state([]);
  // Tracks the in-progress "note field edit" burst so keystroke-level
  // updateNote() calls coalesce into a single undo step instead of one
  // snapshot per character. Any other mutator calls #capture() with no
  // key, which always pushes a fresh snapshot and ends the current burst.
  #captureBurstKey: string | null = null;

  constructor() {
    this.#load();
  }

  // ---- Session history -------------------------------------------------

  #snapshot(): string {
    return JSON.stringify({
      folders: this.folders,
      notes: this.notes,
      selectedFolderId: this.selectedFolderId,
      selectedNoteId: this.selectedNoteId,
      selectedIds: this.selectedIds,
    });
  }

  #capture(burstKey?: string): void {
    if (burstKey !== undefined && burstKey === this.#captureBurstKey) {
      // Still inside the same edit burst — the pre-burst snapshot already covers it.
      return;
    }
    this.#undoStack.push(this.#snapshot());
    if (this.#undoStack.length > MAX_UNDO_DEPTH) {
      this.#undoStack.splice(0, this.#undoStack.length - MAX_UNDO_DEPTH);
    }
    // A new mutating action clears the redo stack.
    if (this.#redoStack.length) this.#redoStack = [];
    this.#captureBurstKey = burstKey ?? null;
  }

  #restore(snap: string): void {
    const data = JSON.parse(snap);
    this.folders = data.folders || [];
    this.notes = data.notes || [];
    this.selectedFolderId = data.selectedFolderId ?? null;
    this.selectedNoteId = data.selectedNoteId ?? null;
    this.selectedIds = data.selectedIds || [];
  }

  get canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  undo(): void {
    if (!this.#undoStack.length) return;
    const current = this.#snapshot();
    const prev = this.#undoStack.pop()!;
    this.#redoStack.push(current);
    this.#restore(prev);
    this.#captureBurstKey = null;
    addToast('Undo');
  }

  redo(): void {
    if (!this.#redoStack.length) return;
    const current = this.#snapshot();
    const next = this.#redoStack.pop()!;
    this.#undoStack.push(current);
    this.#restore(next);
    this.#captureBurstKey = null;
    addToast('Redo');
  }

  // ---- Multi-select ----------------------------------------------------

  isSelected(noteId: string): boolean {
    return this.selectedIds.includes(noteId);
  }

  toggleSelect(noteId: string): void {
    if (this.selectedIds.includes(noteId)) {
      this.selectedIds = this.selectedIds.filter((id) => id !== noteId);
    } else {
      this.selectedIds = [...this.selectedIds, noteId];
    }
  }

  clearSelection(): void {
    this.selectedIds = [];
  }

  batchMove(ids: string[], folderId: string | null): void {
    if (!ids.length) return;
    this.#capture();
    for (const id of ids) {
      const note = this.notes.find((n) => n.id === id && !n.deleted);
      if (note) {
        note.folderId = folderId;
        note.updatedAt = Date.now();
      }
    }
    this.clearSelection();
    addToast(`Moved ${ids.length} note${ids.length === 1 ? '' : 's'}`);
  }

  batchColor(ids: string[], color: NoteColor): void {
    if (!ids.length) return;
    this.#capture();
    for (const id of ids) {
      const note = this.notes.find((n) => n.id === id && !n.deleted);
      if (note) {
        note.color = color;
        note.updatedAt = Date.now();
      }
    }
    this.clearSelection();
    addToast(`Colored ${ids.length} note${ids.length === 1 ? '' : 's'}`);
  }

  batchTrash(ids: string[]): void {
    if (!ids.length) return;
    this.#capture();
    const now = Date.now();
    let trashedCount = 0;
    for (const id of ids) {
      const note = this.notes.find((n) => n.id === id && !n.deleted);
      if (note) {
        note.deleted = true;
        note.deletedAt = now;
        trashedCount += 1;
        if (this.selectedNoteId === id) this.selectedNoteId = null;
      }
    }
    if (trashedCount > 0) {
      addToast(`Moved ${trashedCount} note${trashedCount === 1 ? '' : 's'} to trash`);
    }
    this.clearSelection();
  }

  persist(): void {
    this.#persist();
  }

  #load(): void {
    const data = loadData();
    if (data) {
      this.folders = data.folders || [];
      this.notes = data.notes || [];
    }
    // Default: show sidebar on desktop
    if (typeof window !== 'undefined') {
      this.sidebarOpen = window.innerWidth >= 768;
    }
  }

  #persist(): void {
    const data: StoredData = {
      folders: this.folders,
      notes: this.notes,
      lastNoteId: 0,
      lastFolderId: 0,
      lastChecklistBlockId: 0,
      lastChecklistItemId: 0,
      lastImageId: 0,
    };
    saveData(data);
  }

  // --- Folder operations ---

  createFolder(parentId: string | null = null): Folder {
    this.#capture();
    const folder: Folder = {
      id: generateId(),
      name: 'New Folder',
      parentId,
      collapsed: false,
    };
    this.folders = [...this.folders, folder];
    addToast('Folder created');
    return folder;
  }

  renameFolder(folderId: string, name: string): void {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder && name.trim()) {
      this.#capture();
      folder.name = name.trim();
    }
  }

  deleteFolder(folderId: string): void {
    this.#capture();
    // Move all notes in this folder to root (unfiled)
    this.notes.forEach(n => {
      if (n.folderId === folderId && !n.deleted) {
        n.folderId = null;
      }
    });
    // Move subfolders to root
    this.folders.forEach(f => {
      if (f.parentId === folderId) {
        f.parentId = null;
      }
    });
    this.folders = this.folders.filter(f => f.id !== folderId);
    if (this.selectedFolderId === folderId) {
      this.selectedFolderId = null;
    }
    addToast('Folder deleted');
  }

  toggleFolderCollapse(folderId: string): void {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder) {
      folder.collapsed = !folder.collapsed;
    }
  }

  getFolderChildren(folderId: string | null): Folder[] {
    return this.folders.filter(f => f.parentId === folderId);
  }

  getFolderPath(folderId: string): string {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) return '';
    if (!folder.parentId) return folder.name;
    return this.getFolderPath(folder.parentId) + ' / ' + folder.name;
  }

  getAllFolderPaths(): { id: string; path: string }[] {
    return this.folders.map(f => ({ id: f.id, path: this.getFolderPath(f.id) }));
  }

  getNoteCountInFolder(folderId: string | null): number {
    return this.notes.filter(n => n.folderId === folderId && !n.deleted).length;
  }

  // --- Note operations ---

  #creatingNote = false;

  createNote(folderId: string | null = null): Note | null {
    if (this.#creatingNote) return null;
    this.#creatingNote = true;
    queueMicrotask(() => { this.#creatingNote = false; });

    this.#capture();
    const now = Date.now();
    const note: Note = {
      id: generateId(),
      title: '',
      bodyHtml: '',
      folderId: folderId === 'trash' ? null : folderId,
      pinned: false,
      color: '',
      checklists: [],
      images: [],
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    this.notes = [...this.notes, note];
    this.selectedNoteId = note.id;
    addToast('Note created');
    return note;
  }

  updateNote(noteId: string, updates: Partial<Note>): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      this.#capture(`${noteId}:${Object.keys(updates).sort().join(',')}`);
      Object.assign(note, updates, { updatedAt: Date.now() });
    }
  }

  deleteNote(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note && !note.deleted) {
      this.#capture();
      note.deleted = true;
      note.deletedAt = Date.now();
      if (this.selectedNoteId === noteId) {
        this.selectedNoteId = null;
      }
      // Drop from multi-select so the batch tray doesn't keep counting a
      // note that just left the active list outside the tray's own flow.
      if (this.selectedIds.includes(noteId)) {
        this.selectedIds = this.selectedIds.filter(id => id !== noteId);
      }
      addToast('Note moved to trash');
    }
  }

  restoreNote(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note && note.deleted) {
      this.#capture();
      note.deleted = false;
      delete note.deletedAt;
      addToast('Note restored');
    }
  }

  deleteForever(noteId: string): void {
    this.#capture();
    this.notes = this.notes.filter(n => n.id !== noteId);
    if (this.selectedNoteId === noteId) {
      this.selectedNoteId = null;
    }
    if (this.selectedIds.includes(noteId)) {
      this.selectedIds = this.selectedIds.filter(id => id !== noteId);
    }
    addToast('Note permanently deleted');
  }

  emptyTrash(): void {
    this.#capture();
    this.notes = this.notes.filter(n => !n.deleted);
    // Emptying Trash can remove notes that are still checked in the
    // multi-select set (e.g. selected from the Trash view before this
    // ran) — prune them so the batch tray's count reflects live notes.
    const remainingIds = new Set(this.notes.map(n => n.id));
    if (this.selectedIds.some(id => !remainingIds.has(id))) {
      this.selectedIds = this.selectedIds.filter(id => remainingIds.has(id));
    }
    addToast('Trash emptied');
  }

  moveNote(noteId: string, folderId: string | null): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      this.#capture();
      note.folderId = folderId;
      note.updatedAt = Date.now();
      addToast('Note moved');
    }
  }

  togglePin(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      this.#capture();
      note.pinned = !note.pinned;
      note.updatedAt = Date.now();
    }
  }

  setColor(noteId: string, color: NoteColor): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      this.#capture();
      note.color = color;
      note.updatedAt = Date.now();
    }
  }

  addImage(noteId: string, dataUrl: string, name: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      this.#capture();
      note.images = [...note.images, { id: generateId(), dataUrl, name }];
      note.updatedAt = Date.now();
    }
  }

  removeImage(noteId: string, imageId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.images = note.images.filter(img => img.id !== imageId);
      note.updatedAt = Date.now();
    }
  }

  addChecklistBlock(noteId: string): ChecklistBlock {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return { id: '', items: [] };
    this.#capture();
    const block: ChecklistBlock = {
      id: generateId(),
      items: [{ id: generateId(), text: '', done: false }],
    };
    note.checklists = [...note.checklists, block];
    note.updatedAt = Date.now();
    return block;
  }

  removeChecklistBlock(noteId: string, blockId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.checklists = note.checklists.filter(b => b.id !== blockId);
      note.updatedAt = Date.now();
    }
  }

  addChecklistItem(noteId: string, blockId: string): ChecklistItem {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return { id: '', text: '', done: false };
    const block = note.checklists.find(b => b.id === blockId);
    if (!block) return { id: '', text: '', done: false };
    this.#capture();
    const item: ChecklistItem = { id: generateId(), text: '', done: false };
    const blockIdx = note.checklists.findIndex(b => b.id === blockId);
    const updatedBlock = {
      ...block,
      items: [...block.items, item],
    };
    note.checklists = [
      ...note.checklists.slice(0, blockIdx),
      updatedBlock,
      ...note.checklists.slice(blockIdx + 1),
    ];
    note.updatedAt = Date.now();
    return item;
  }

  updateChecklistItem(noteId: string, blockId: string, itemId: string, text: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;
    const block = note.checklists.find(b => b.id === blockId);
    if (!block) return;
    const item = block.items.find(i => i.id === itemId);
    if (item) {
      item.text = text;
      note.updatedAt = Date.now();
    }
  }

  toggleChecklistItem(noteId: string, blockId: string, itemId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;
    const block = note.checklists.find(b => b.id === blockId);
    if (!block) return;
    const item = block.items.find(i => i.id === itemId);
    if (item) {
      item.done = !item.done;
      note.updatedAt = Date.now();
    }
  }

  removeChecklistItem(noteId: string, blockId: string, itemId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;
    const block = note.checklists.find(b => b.id === blockId);
    if (!block) return;
    block.items = block.items.filter(i => i.id !== itemId);
    note.updatedAt = Date.now();
  }

  // --- Nest artifacts (Export / Import) ---------------------------------

  #noteToRecord(n: Note): Record<string, unknown> {
    const checklist = n.checklists.flatMap((b) =>
      b.items.map((i) => ({ id: i.id, text: i.text, done: i.done }))
    );
    return {
      id: n.id,
      title: n.title.trim() || 'Untitled',
      body: n.bodyHtml,
      folderId: n.folderId,
      pinned: n.pinned,
      color: n.color === '' ? 'none' : n.color,
      checklist,
      images: n.images.map((img) => ({ id: img.id, dataUrl: img.dataUrl })),
      updatedAt: new Date(n.updatedAt).toISOString(),
    };
  }

  exportObject(): Record<string, unknown> {
    return {
      schemaVersion: 'notenest-v1',
      folders: this.folders.map((f) => ({
        id: f.id,
        name: f.name,
        parentId: f.parentId,
        collapsed: f.collapsed,
      })),
      notes: this.activeNotes.map((n) => this.#noteToRecord(n)),
      trash: this.trashNotes.map((n) => this.#noteToRecord(n)),
    };
  }

  exportJson(): string {
    return JSON.stringify(this.exportObject(), null, 2);
  }

  exportMarkdown(): string {
    const lines: string[] = ['# Nest vault', ''];
    const active = this.activeNotes;
    if (!active.length) lines.push('_No notes yet._');
    for (const n of active) {
      const path = n.folderId ? this.getFolderPath(n.folderId) : 'Unfiled';
      lines.push(`## ${n.title || 'Untitled'}`);
      lines.push(`Folder: ${path}`);
      if (n.color) lines.push(`Color: ${n.color}`);
      if (n.pinned) lines.push('Pinned: yes');
      lines.push('');
      const bodyText = n.bodyHtml.replace(/<[^>]*>/g, '').trim();
      if (bodyText) lines.push(bodyText);
      for (const b of n.checklists) {
        for (const i of b.items) {
          lines.push(`- [${i.done ? 'x' : ' '}] ${i.text}`);
        }
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  // Validate + apply a Nest JSON document. Returns a field-named error on failure.
  importNest(text: string): { ok: boolean; field?: string; message?: string } {
    let doc: any;
    try {
      doc = JSON.parse(text);
    } catch {
      return { ok: false, field: 'document', message: 'Nest JSON is not valid JSON' };
    }
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
      return { ok: false, field: 'document', message: 'Nest document must be a single object' };
    }
    if (doc.schemaVersion !== 'notenest-v1') {
      return { ok: false, field: 'schemaVersion', message: 'schemaVersion must be exactly "notenest-v1"' };
    }
    const colors = ['none', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    for (const key of ['folders', 'notes', 'trash']) {
      if (!Array.isArray(doc[key])) {
        return { ok: false, field: key, message: `${key} must be an array` };
      }
    }
    const folderIds = new Set<string>();
    for (const f of doc.folders) {
      if (!f || typeof f.id !== 'string' || !f.id) return { ok: false, field: 'folder.id', message: 'folder id is required' };
      if (typeof f.name !== 'string' || !f.name.trim()) return { ok: false, field: 'folder.name', message: 'folder name cannot be blank' };
      if (f.name.trim().length > 100) return { ok: false, field: 'folder.name', message: 'folder name exceeds 100 characters' };
      if (f.parentId !== null && typeof f.parentId !== 'string') return { ok: false, field: 'folder.parentId', message: 'folder parentId must be a string id or null' };
      folderIds.add(f.id);
    }
    // parentId references + cycle check
    const folderById = new Map<string, any>(doc.folders.map((f: any) => [f.id, f]));
    for (const f of doc.folders) {
      if (f.parentId !== null && !folderIds.has(f.parentId)) {
        return { ok: false, field: 'folder.parentId', message: 'folder parentId references a missing folder' };
      }
      let cur = f.parentId;
      const seen = new Set<string>([f.id]);
      while (cur) {
        if (seen.has(cur)) return { ok: false, field: 'folder.parentId', message: 'folder parentId forms a cycle' };
        seen.add(cur);
        cur = folderById.get(cur)?.parentId ?? null;
      }
    }
    const validateNote = (n: any, scope: string) => {
      if (!n || typeof n.id !== 'string' || !n.id) return { ok: false, field: `${scope}.id`, message: 'note id is required' };
      if (typeof n.title !== 'string' || !n.title.trim()) return { ok: false, field: `${scope}.title`, message: 'note title cannot be blank' };
      if (n.title.trim().length > 200) return { ok: false, field: `${scope}.title`, message: 'note title exceeds 200 characters' };
      if (typeof n.body !== 'string') return { ok: false, field: `${scope}.body`, message: 'note body must be a string' };
      if (n.folderId !== null && !folderIds.has(n.folderId)) return { ok: false, field: `${scope}.folderId`, message: 'note folderId references a missing folder' };
      if (typeof n.pinned !== 'boolean') return { ok: false, field: `${scope}.pinned`, message: 'note pinned must be a boolean' };
      if (!colors.includes(n.color)) return { ok: false, field: `${scope}.color`, message: 'note color is outside the allowed enum' };
      if (!Array.isArray(n.checklist)) return { ok: false, field: `${scope}.checklist`, message: 'note checklist must be an array' };
      for (const it of n.checklist) {
        if (!it || typeof it.id !== 'string') return { ok: false, field: `${scope}.checklist.id`, message: 'checklist item id is required' };
        if (typeof it.text !== 'string' || it.text.length > 500) return { ok: false, field: `${scope}.checklist.text`, message: 'checklist item text is invalid' };
        if (typeof it.done !== 'boolean') return { ok: false, field: `${scope}.checklist.done`, message: 'checklist item done must be a boolean' };
      }
      if (!Array.isArray(n.images)) return { ok: false, field: `${scope}.images`, message: 'note images must be an array' };
      for (const img of n.images) {
        if (!img || typeof img.id !== 'string') return { ok: false, field: `${scope}.images.id`, message: 'image id is required' };
        if (typeof img.dataUrl !== 'string' || !img.dataUrl.startsWith('data:')) return { ok: false, field: `${scope}.images.dataUrl`, message: 'image dataUrl must begin with data:' };
      }
      if (typeof n.updatedAt !== 'string' || Number.isNaN(Date.parse(n.updatedAt))) {
        return { ok: false, field: `${scope}.updatedAt`, message: 'note updatedAt must be an ISO-8601 date string' };
      }
      return null;
    };
    for (const n of doc.notes) {
      const err = validateNote(n, 'note');
      if (err) return err;
    }
    for (const n of doc.trash) {
      const err = validateNote(n, 'trash');
      if (err) return err;
    }
    const noteIds = new Set<string>();
    for (const n of [...doc.notes, ...doc.trash]) {
      if (noteIds.has(n.id)) {
        return { ok: false, field: 'note.id', message: `note id "${n.id}" is duplicated` };
      }
      noteIds.add(n.id);
    }

    // Valid — replace the in-memory workspace.
    this.#capture();
    const recToNote = (n: any, deleted: boolean): Note => ({
      id: n.id,
      title: n.title,
      bodyHtml: n.body,
      folderId: n.folderId,
      pinned: n.pinned,
      color: (n.color === 'none' ? '' : n.color) as NoteColor,
      checklists: n.checklist.length
        ? [{ id: generateId(), items: n.checklist.map((i: any) => ({ id: i.id, text: i.text, done: i.done })) }]
        : [],
      images: n.images.map((img: any) => ({ id: img.id, dataUrl: img.dataUrl, name: img.name || 'image' })),
      createdAt: Date.parse(n.updatedAt),
      updatedAt: Date.parse(n.updatedAt),
      deleted,
      ...(deleted ? { deletedAt: Date.now() } : {}),
    });
    this.folders = doc.folders.map((f: any) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      collapsed: !!f.collapsed,
    }));
    this.notes = [
      ...doc.notes.map((n: any) => recToNote(n, false)),
      ...doc.trash.map((n: any) => recToNote(n, true)),
    ];
    this.selectedNoteId = null;
    this.selectedFolderId = null;
    this.searchQuery = '';
    this.clearSelection();
    addToast('Nest imported');
    return { ok: true };
  }

  // --- Derived getters ---

  get activeNotes(): Note[] {
    return this.notes.filter(n => !n.deleted);
  }

  get trashNotes(): Note[] {
    return this.notes.filter(n => n.deleted);
  }

  get pinnedNotes(): Note[] {
    return this.activeNotes.filter(n => n.pinned);
  }

  get currentNotes(): Note[] {
    if (this.selectedFolderId === 'trash') return [];
    if (this.selectedFolderId === null) {
      // All Notes
      return this.activeNotes;
    }
    return this.activeNotes.filter(n => n.folderId === this.selectedFolderId);
  }

  get filteredNotes(): Note[] {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return [];
    return this.activeNotes.filter((n) => {
      const title = n.title.toLowerCase();
      const body = n.bodyHtml.replace(/<[^>]*>/g, ' ').toLowerCase();
      const checklistText = n.checklists
        .flatMap((b) => b.items.map((i) => i.text))
        .join(' ')
        .toLowerCase();
      const haystack = `${title} ${body} ${checklistText}`;
      return haystack.includes(query);
    });
  }

  get selectedNote(): Note | null {
    return this.notes.find(n => n.id === this.selectedNoteId) || null;
  }

  // --- Virtualized data ---

  generateVirtualizedItems(count: number): { id: string; text: string }[] {
    const items: { id: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      items.push({ id: `virt-${i}`, text: `Virtualized item #${i + 1}` });
    }
    return items;
  }
}

export const store = new AppStore();
