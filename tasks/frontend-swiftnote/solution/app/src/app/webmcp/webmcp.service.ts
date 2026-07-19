import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/note.reducer';
import { Note } from '../models/note.model';
import {
  selectNotes, selectSelectedNoteId, selectFilteredNotes,
  selectFocusMode, selectQuickSwitcherOpen, selectShortcutsOpen,
} from '../store/note.selectors';
import * as NoteActions from '../store/note.actions';

/**
 * WebMCP surface for SwiftNote (contract zto-webmcp-v1).
 *
 * Every tool dispatches the SAME NgRx action the visible UI dispatches — there is
 * no success path here that the human UI lacks. Handlers read the latest store
 * snapshot (kept in sync via a single subscription) so bounded ids/values can be
 * validated before the domain command runs.
 *
 *   window.webmcp_session_info()
 *   window.webmcp_list_tools()
 *   window.webmcp_invoke_tool(name, args)
 *
 * Modules:
 *   entity-collection-v1 (prefix "entity") — create, select, update, delete, toggle
 *   browse-query-v1      (prefix "browse") — open, search
 */

const ENTITY_FIELDS = ['title', 'body'] as const;
type EntityField = (typeof ENTITY_FIELDS)[number];

const DESTINATIONS = ['editor', 'quick-switcher', 'shortcuts', 'focus-mode'] as const;
type Destination = (typeof DESTINATIONS)[number];

const TITLE_MAX = 200;
const BODY_MAX = 20000;

interface Tool {
  description: string;
  handler(args: Record<string, unknown>): unknown;
}

declare global {
  interface Window {
    webmcp_session_info?: () => unknown;
    webmcp_list_tools?: () => unknown;
    webmcp_invoke_tool?: (name: string, args?: Record<string, unknown>) => unknown;
  }
}

@Injectable({ providedIn: 'root' })
export class WebmcpService {
  private store = inject(Store);

  // Latest store snapshot, kept current by the subscription below.
  private notes: Note[] = [];
  private filtered: Note[] = [];
  private selectedNoteId: string | null = null;
  private focusMode = false;
  private quickSwitcherOpen = false;
  private shortcutsOpen = false;

  register(): void {
    if (typeof window === 'undefined') return;

    this.store.select(selectNotes).subscribe(v => (this.notes = v));
    this.store.select(selectFilteredNotes).subscribe(v => (this.filtered = v));
    this.store.select(selectSelectedNoteId).subscribe(v => (this.selectedNoteId = v));
    this.store.select(selectFocusMode).subscribe(v => (this.focusMode = v));
    this.store.select(selectQuickSwitcherOpen).subscribe(v => (this.quickSwitcherOpen = v));
    this.store.select(selectShortcutsOpen).subscribe(v => (this.shortcutsOpen = v));

    const tools = this.buildTools();

    window.webmcp_session_info = () => ({
      contract_version: 'zto-webmcp-v1',
      app: 'swiftnote',
      modules: ['entity-collection-v1', 'browse-query-v1'],
      entity: 'note',
      entity_operations: ['create', 'select', 'update', 'delete', 'toggle'],
      entity_fields: [...ENTITY_FIELDS],
      browsable_entity: 'notes',
      destinations: [...DESTINATIONS],
      tool_count: Object.keys(tools).length,
    });
    window.webmcp_list_tools = () =>
      Object.keys(tools).map(name => ({ name, description: tools[name].description }));
    window.webmcp_invoke_tool = (name: string, args?: Record<string, unknown>) => {
      const tool = tools[name];
      if (!tool) throw new Error('Unknown WebMCP tool: ' + name);
      return tool.handler(args || {});
    };

    // Optional-additional: navigator.modelContext registration (same handlers).
    try {
      const nav = navigator as unknown as {
        modelContext?: { registerTool?: (t: unknown) => void };
      };
      if (nav.modelContext && typeof nav.modelContext.registerTool === 'function') {
        for (const name of Object.keys(tools)) {
          nav.modelContext.registerTool({
            name,
            description: tools[name].description,
            execute: (args: Record<string, unknown>) => tools[name].handler(args || {}),
          });
        }
      }
    } catch {
      // navigator.modelContext not available — window.* surface is authoritative.
    }
  }

  private buildTools(): Record<string, Tool> {
    const findNote = (id: unknown): Note | undefined =>
      typeof id === 'string' ? this.notes.find(n => n.id === id) : undefined;

    return {
      // ---- entity-collection-v1 ----------------------------------------
      entity_create: {
        description:
          'Create a new untitled note (same as the New Note / Create note control). ' +
          'Returns the new note id and the updated note count.',
        handler: () => {
          this.store.dispatch(NoteActions.createNote());
          this.store.dispatch(NoteActions.showToast({ message: 'New note created' }));
          return { ok: true, id: this.selectedNoteId, count: this.notes.length };
        },
      },
      entity_select: {
        description:
          'Select an existing note by id so it opens in the editor (same as clicking ' +
          'its sidebar row). Requires a known note id.',
        handler: (args) => {
          const note = findNote(args['id']);
          if (!note) return { ok: false, error: 'Unknown note id' };
          this.store.dispatch(NoteActions.selectNote({ id: note.id }));
          return { ok: true, id: note.id, selected: this.selectedNoteId };
        },
      },
      entity_update: {
        description:
          'Update a note field. field must be one of: title, body. value is a bounded ' +
          'string (title ≤ 200 chars, body ≤ 20000). Dispatches the same edit ' +
          'command the editor inputs use; no generic patch object is accepted.',
        handler: (args) => {
          const note = findNote(args['id']);
          if (!note) return { ok: false, error: 'Unknown note id' };
          const field = args['field'];
          if (typeof field !== 'string' || !ENTITY_FIELDS.includes(field as EntityField)) {
            return { ok: false, error: 'field must be one of: ' + ENTITY_FIELDS.join(', ') };
          }
          const value = args['value'];
          if (typeof value !== 'string') {
            return { ok: false, error: 'value must be a string' };
          }
          const max = field === 'title' ? TITLE_MAX : BODY_MAX;
          if (value.length > max) {
            return { ok: false, error: `value exceeds ${max} characters` };
          }
          const changes: Partial<Note> = { [field]: value } as Partial<Note>;
          this.store.dispatch(NoteActions.updateNote({ id: note.id, changes }));
          return { ok: true, id: note.id, field, value };
        },
      },
      entity_delete: {
        description:
          'Permanently delete a note by id (same as confirming the Delete control). ' +
          'Requires confirm=true; without it nothing is deleted.',
        handler: (args) => {
          const note = findNote(args['id']);
          if (!note) return { ok: false, error: 'Unknown note id' };
          if (args['confirm'] !== true) {
            return { ok: false, error: 'delete requires confirm=true' };
          }
          this.store.dispatch(NoteActions.deleteNote({ id: note.id }));
          this.store.dispatch(NoteActions.showToast({ message: 'Note deleted' }));
          return { ok: true, id: note.id, count: this.notes.length };
        },
      },
      entity_toggle: {
        description:
          'Toggle a note’s pinned state (same as the Pin control). Pinned notes sort ' +
          'above unpinned notes in the sidebar regardless of edit time.',
        handler: (args) => {
          const note = findNote(args['id']);
          if (!note) return { ok: false, error: 'Unknown note id' };
          this.store.dispatch(NoteActions.pinNote({ id: note.id }));
          const updated = this.notes.find(n => n.id === note.id);
          return { ok: true, id: note.id, pinned: updated ? updated.pinned : !note.pinned };
        },
      },

      // ---- browse-query-v1 ---------------------------------------------
      browse_open: {
        description:
          'Open an app view/mode. destination must be one of: editor, quick-switcher, ' +
          'shortcuts, focus-mode. Dispatches the same command the matching control uses.',
        handler: (args) => {
          const dest = args['destination'];
          if (typeof dest !== 'string' || !DESTINATIONS.includes(dest as Destination)) {
            return { ok: false, error: 'destination must be one of: ' + DESTINATIONS.join(', ') };
          }
          switch (dest as Destination) {
            case 'quick-switcher':
              if (!this.quickSwitcherOpen) this.store.dispatch(NoteActions.openQuickSwitcher());
              break;
            case 'shortcuts':
              if (!this.shortcutsOpen) this.store.dispatch(NoteActions.openShortcuts());
              break;
            case 'focus-mode':
              if (!this.focusMode) this.store.dispatch(NoteActions.toggleFocusMode());
              break;
            case 'editor':
              if (this.quickSwitcherOpen) this.store.dispatch(NoteActions.closeQuickSwitcher());
              if (this.shortcutsOpen) this.store.dispatch(NoteActions.closeShortcuts());
              if (this.focusMode) this.store.dispatch(NoteActions.toggleFocusMode());
              break;
          }
          return {
            ok: true,
            destination: dest,
            focusMode: this.focusMode,
            quickSwitcherOpen: this.quickSwitcherOpen,
            shortcutsOpen: this.shortcutsOpen,
          };
        },
      },
      browse_search: {
        description:
          'Set the sidebar Search Notes query, filtering the note list by title or body ' +
          'match (same as typing in the Search Notes input). Returns the number of ' +
          'matching notes. Pass an empty query to clear the search.',
        handler: (args) => {
          const query = args['query'];
          if (typeof query !== 'string') {
            return { ok: false, error: 'query must be a string' };
          }
          if (query.length > 200) {
            return { ok: false, error: 'query exceeds 200 characters' };
          }
          this.store.dispatch(NoteActions.setSearchQuery({ query }));
          return { ok: true, query, matches: this.filtered.length };
        },
      },
    };
  }
}
