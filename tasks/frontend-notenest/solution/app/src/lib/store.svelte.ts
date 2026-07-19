import type { Folder, Note, NoteColor, ChecklistBlock, ChecklistItem, NoteImage } from './types';
import { loadData, saveData, type StoredData } from './persistence';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

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

  constructor() {
    this.#load();
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
    const folder: Folder = {
      id: generateId(),
      name: 'New Folder',
      parentId,
      collapsed: false,
    };
    this.folders.push(folder);
    addToast('Folder created');
    return folder;
  }

  renameFolder(folderId: string, name: string): void {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder && name.trim()) {
      folder.name = name.trim();
    }
  }

  deleteFolder(folderId: string): void {
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

  createNote(folderId: string | null = null): Note | null {
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
    this.notes.push(note);
    this.selectedNoteId = note.id;
    addToast('Note created');
    return note;
  }

  updateNote(noteId: string, updates: Partial<Note>): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      Object.assign(note, updates, { updatedAt: Date.now() });
    }
  }

  deleteNote(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note && !note.deleted) {
      note.deleted = true;
      note.deletedAt = Date.now();
      if (this.selectedNoteId === noteId) {
        this.selectedNoteId = null;
      }
      addToast('Note moved to trash');
    }
  }

  restoreNote(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note && note.deleted) {
      note.deleted = false;
      delete note.deletedAt;
      addToast('Note restored');
    }
  }

  deleteForever(noteId: string): void {
    this.notes = this.notes.filter(n => n.id !== noteId);
    if (this.selectedNoteId === noteId) {
      this.selectedNoteId = null;
    }
    addToast('Note permanently deleted');
  }

  emptyTrash(): void {
    this.notes = this.notes.filter(n => !n.deleted);
    addToast('Trash emptied');
  }

  moveNote(noteId: string, folderId: string | null): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.folderId = folderId;
      note.updatedAt = Date.now();
      addToast('Note moved');
    }
  }

  togglePin(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = Date.now();
    }
  }

  setColor(noteId: string, color: NoteColor): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.color = color;
      note.updatedAt = Date.now();
    }
  }

  addImage(noteId: string, dataUrl: string, name: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.images.push({ id: generateId(), dataUrl, name });
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
    const block: ChecklistBlock = { id: generateId(), items: [] };
    note.checklists.push(block);
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
    const item: ChecklistItem = { id: generateId(), text: 'New item', done: false };
    block.items.push(item);
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
    return this.activeNotes.filter(
      n => n.title.toLowerCase().includes(query) || n.bodyHtml.toLowerCase().includes(query)
    );
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
