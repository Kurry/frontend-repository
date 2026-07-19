// WebMCP action surface for NoteNest.
//
// Contract: zto-webmcp-v1. Modules: entity-collection-v1, browse-query-v1,
// structured-editor-v1. Every tool below is bound to a real product operation
// and calls the SAME store command the visible UI control calls — there is no
// success path the UI does not also have. Destructive operations require an
// explicit confirm=true, mirroring the app's confirm dialogs.
//
// Formatting toolbar actions (bold / italic / bulleted list) are intentionally
// NOT exposed here: they depend on the live text selection inside the
// contenteditable body and must stay driven through the real UI control path
// (see mechanics exclusions), so a state shortcut cannot fabricate them.

import { store } from './store.svelte';
import type { NoteColor } from './types';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['entity-collection-v1', 'browse-query-v1', 'structured-editor-v1'];

const COLORS: NoteColor[] = ['', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

type ToolResult = Record<string, unknown>;

interface ToolDef {
  name: string;
  module: string;
  operation: string;
  description: string;
  run: (args: Record<string, any>) => ToolResult;
}

function requireNote(noteId: string) {
  const note = store.notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`No note with id "${noteId}"`);
  return note;
}

function requireFolder(folderId: string) {
  const folder = store.folders.find((f) => f.id === folderId);
  if (!folder) throw new Error(`No folder with id "${folderId}"`);
  return folder;
}

function requireConfirm(args: Record<string, any>) {
  if (args.confirm !== true) {
    throw new Error('This operation is destructive and requires confirm=true');
  }
}

const TOOLS: ToolDef[] = [
  // -------------------------------------------------------------------------
  // browse-query-v1 — navigation and global search
  // -------------------------------------------------------------------------
  {
    name: 'browse_open',
    module: 'browse-query-v1',
    operation: 'open',
    description:
      'Open a top-level destination view. destination: "all-notes" | "trash".',
    run: (args) => {
      const destination = String(args.destination ?? '');
      if (destination !== 'all-notes' && destination !== 'trash') {
        throw new Error('destination must be "all-notes" or "trash"');
      }
      store.selectedFolderId = destination === 'trash' ? 'trash' : null;
      store.selectedNoteId = null;
      store.searchQuery = '';
      return { ok: true, destination, selectedFolderId: store.selectedFolderId };
    },
  },
  {
    name: 'browse_search',
    module: 'browse-query-v1',
    operation: 'search',
    description:
      'Run global search across every note title and body. args: { query: string }.',
    run: (args) => {
      store.searchQuery = String(args.query ?? '');
      return { ok: true, query: store.searchQuery, resultCount: store.filteredNotes.length };
    },
  },
  {
    name: 'browse_clear_filter',
    module: 'browse-query-v1',
    operation: 'clear_filter',
    description: 'Clear the active global search query and restore the full list.',
    run: () => {
      store.searchQuery = '';
      return { ok: true, query: '' };
    },
  },

  // -------------------------------------------------------------------------
  // entity-collection-v1 — folders and notes
  // -------------------------------------------------------------------------
  {
    name: 'entity_create_folder',
    module: 'entity-collection-v1',
    operation: 'create',
    description:
      'Create a folder. args: { name?: string, parentId?: string|null }. Omit parentId (or null) for a root folder.',
    run: (args) => {
      const parentId = args.parentId == null ? null : String(args.parentId);
      if (parentId) requireFolder(parentId);
      const folder = store.createFolder(parentId);
      if (typeof args.name === 'string' && args.name.trim()) {
        store.renameFolder(folder.id, args.name);
      }
      return { ok: true, id: folder.id, name: folder.name };
    },
  },
  {
    name: 'entity_create_note',
    module: 'entity-collection-v1',
    operation: 'create',
    description:
      'Create a note in a folder (or unfiled). args: { folderId?: string|null, title?: string }.',
    run: (args) => {
      const folderId = args.folderId == null ? null : String(args.folderId);
      if (folderId) requireFolder(folderId);
      const note = store.createNote(folderId);
      if (!note) throw new Error('Failed to create note');
      if (typeof args.title === 'string' && args.title.trim()) {
        store.updateNote(note.id, { title: args.title.trim() });
      }
      return { ok: true, id: note.id, title: store.notes.find((n) => n.id === note.id)?.title ?? '' };
    },
  },
  {
    name: 'entity_select_note',
    module: 'entity-collection-v1',
    operation: 'select',
    description: 'Select a note so it opens in the editor. args: { noteId: string }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      store.selectedNoteId = note.id;
      return { ok: true, noteId: note.id, title: note.title };
    },
  },
  {
    name: 'entity_select_folder',
    module: 'entity-collection-v1',
    operation: 'select',
    description:
      'Select a folder view in the sidebar. args: { folderId: string|null } (null = All Notes).',
    run: (args) => {
      const folderId = args.folderId == null ? null : String(args.folderId);
      if (folderId) requireFolder(folderId);
      store.selectedFolderId = folderId;
      store.selectedNoteId = null;
      store.searchQuery = '';
      return { ok: true, folderId };
    },
  },
  {
    name: 'entity_update_note',
    module: 'entity-collection-v1',
    operation: 'update',
    description:
      'Update a note title and/or body text. args: { noteId: string, title?: string, body?: string }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      const updates: Record<string, string> = {};
      if (typeof args.title === 'string') {
        if (!args.title.trim()) throw new Error('title cannot be blank');
        updates.title = args.title.trim();
      }
      if (typeof args.body === 'string') updates.bodyHtml = args.body;
      store.updateNote(note.id, updates);
      return { ok: true, noteId: note.id };
    },
  },
  {
    name: 'entity_rename_folder',
    module: 'entity-collection-v1',
    operation: 'update',
    description: 'Rename a folder. args: { folderId: string, name: string }.',
    run: (args) => {
      const folder = requireFolder(String(args.folderId));
      const name = String(args.name ?? '');
      if (!name.trim()) throw new Error('name cannot be blank');
      store.renameFolder(folder.id, name);
      return { ok: true, folderId: folder.id, name: folder.name };
    },
  },
  {
    name: 'entity_move_note',
    module: 'entity-collection-v1',
    operation: 'update',
    description:
      'Move a note to a folder (or unfiled). args: { noteId: string, folderId: string|null }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      const folderId = args.folderId == null ? null : String(args.folderId);
      if (folderId) requireFolder(folderId);
      store.moveNote(note.id, folderId);
      return { ok: true, noteId: note.id, folderId };
    },
  },
  {
    name: 'entity_set_color',
    module: 'entity-collection-v1',
    operation: 'update',
    description:
      'Assign a color label to a note. args: { noteId: string, color: "" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      const color = String(args.color ?? '') as NoteColor;
      if (!COLORS.includes(color)) throw new Error(`color must be one of: ${COLORS.join(', ')}`);
      store.setColor(note.id, color);
      return { ok: true, noteId: note.id, color };
    },
  },
  {
    name: 'entity_toggle_pin',
    module: 'entity-collection-v1',
    operation: 'toggle',
    description: 'Toggle a note between pinned and unpinned. args: { noteId: string }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      store.togglePin(note.id);
      return { ok: true, noteId: note.id, pinned: note.pinned };
    },
  },
  {
    name: 'entity_toggle_checklist_item',
    module: 'entity-collection-v1',
    operation: 'toggle',
    description:
      'Toggle a checklist item done/undone. args: { noteId, blockId, itemId }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      const blockId = String(args.blockId);
      const itemId = String(args.itemId);
      const block = note.checklists.find((b) => b.id === blockId);
      const item = block?.items.find((i) => i.id === itemId);
      if (!item) throw new Error('No such checklist item');
      store.toggleChecklistItem(note.id, blockId, itemId);
      return { ok: true, noteId: note.id, itemId, done: item.done };
    },
  },
  {
    name: 'entity_delete_note',
    module: 'entity-collection-v1',
    operation: 'delete',
    description:
      'Move a note to Trash (not permanent). args: { noteId: string, confirm: true }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      requireConfirm(args);
      store.deleteNote(note.id);
      return { ok: true, noteId: note.id, deleted: note.deleted };
    },
  },
  {
    name: 'entity_delete_folder',
    module: 'entity-collection-v1',
    operation: 'delete',
    description:
      'Delete a folder; its notes move to the root level. args: { folderId: string, confirm: true }.',
    run: (args) => {
      requireFolder(String(args.folderId));
      requireConfirm(args);
      store.deleteFolder(String(args.folderId));
      return { ok: true, folderId: String(args.folderId) };
    },
  },
  {
    name: 'entity_restore_note',
    module: 'entity-collection-v1',
    operation: 'update',
    description: 'Restore a note from Trash to its folder. args: { noteId: string }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      store.restoreNote(note.id);
      return { ok: true, noteId: note.id, deleted: note.deleted };
    },
  },
  {
    name: 'entity_delete_forever',
    module: 'entity-collection-v1',
    operation: 'delete',
    description:
      'Permanently delete a note from Trash. args: { noteId: string, confirm: true }.',
    run: (args) => {
      requireNote(String(args.noteId));
      requireConfirm(args);
      store.deleteForever(String(args.noteId));
      return { ok: true, noteId: String(args.noteId) };
    },
  },
  {
    name: 'entity_empty_trash',
    module: 'entity-collection-v1',
    operation: 'delete',
    description: 'Permanently clear the entire Trash. args: { confirm: true }.',
    run: (args) => {
      requireConfirm(args);
      store.emptyTrash();
      return { ok: true, trashCount: store.trashNotes.length };
    },
  },

  // -------------------------------------------------------------------------
  // structured-editor-v1 — note body document
  // -------------------------------------------------------------------------
  {
    name: 'editor_set_content',
    module: 'structured-editor-v1',
    operation: 'set_content',
    description:
      'Replace a note body with HTML content. args: { noteId: string, html: string }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      store.updateNote(note.id, { bodyHtml: String(args.html ?? '') });
      return { ok: true, noteId: note.id };
    },
  },
  {
    name: 'editor_add_checklist',
    module: 'structured-editor-v1',
    operation: 'add',
    description:
      'Insert a checklist block into a note body (same as "Insert Checklist"). args: { noteId: string }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      const block = store.addChecklistBlock(note.id);
      return { ok: true, noteId: note.id, blockId: block.id };
    },
  },
  {
    name: 'editor_add_checklist_item',
    module: 'structured-editor-v1',
    operation: 'add',
    description:
      'Add one item to a checklist block. args: { noteId, blockId, text?: string }.',
    run: (args) => {
      const note = requireNote(String(args.noteId));
      const blockId = String(args.blockId);
      const block = note.checklists.find((b) => b.id === blockId);
      if (!block) throw new Error('No such checklist block');
      const item = store.addChecklistItem(note.id, blockId);
      if (typeof args.text === 'string' && args.text) {
        store.updateChecklistItem(note.id, blockId, item.id, args.text);
      }
      return { ok: true, noteId: note.id, blockId, itemId: item.id };
    },
  },
];

const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

export function registerWebmcp(): void {
  if (typeof window === 'undefined') return;

  const listTools = () =>
    TOOLS.map((t) => ({
      name: t.name,
      module: t.module,
      operation: t.operation,
      description: t.description,
    }));

  const w = window as any;

  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    title: 'NoteNest',
    modules: MODULES,
    tool_count: TOOLS.length,
  });

  w.webmcp_list_tools = () => listTools();

  w.webmcp_invoke_tool = (name: string, args: Record<string, any> = {}) => {
    const tool = TOOL_MAP.get(name);
    if (!tool) throw new Error(`Unknown tool "${name}"`);
    return tool.run(args ?? {});
  };

  // Optional: expose a navigator.modelContext registration alongside window.*
  try {
    const nav = navigator as any;
    if (nav && typeof nav === 'object') {
      nav.modelContext = nav.modelContext || {};
      nav.modelContext.tools = listTools();
      nav.modelContext.invoke = w.webmcp_invoke_tool;
    }
  } catch {
    // navigator not extensible in this environment; window.* surface is authoritative
  }
}
