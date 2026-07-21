import { Injectable, inject, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { Note } from '../models/note.model';
import {
  selectNotes, selectSelectedNoteId, selectFilteredNotes,
  selectFocusMode, selectQuickSwitcherOpen, selectShortcutsOpen,
  selectWorkspaceExportOpen, selectWorkspaceImportOpen, selectTxtExportOpen,
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

const ENTITY_FIELDS = ['title', 'body', 'pinned'] as const;
type EntityField = (typeof ENTITY_FIELDS)[number];

const DESTINATIONS = ['editor', 'quick-switcher', 'shortcuts', 'focus-mode', 'workspace-export', 'workspace-import'] as const;
type Destination = (typeof DESTINATIONS)[number];

const ARTIFACT_OPERATIONS = ['export', 'import', 'copy'] as const;
const EXPORT_FORMATS = ['workspace-json', 'txt'] as const;
const IMPORT_MODES = ['workspace-json'] as const;

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
  private zone = inject(NgZone);

  private notesSnap = this.store.selectSignal(selectNotes);
  private filteredSnap = this.store.selectSignal(selectFilteredNotes);
  private selectedSnap = this.store.selectSignal(selectSelectedNoteId);
  private focusModeSnap = this.store.selectSignal(selectFocusMode);
  private quickSwitcherSnap = this.store.selectSignal(selectQuickSwitcherOpen);
  private shortcutsSnap = this.store.selectSignal(selectShortcutsOpen);
  private workspaceExportSnap = this.store.selectSignal(selectWorkspaceExportOpen);
  private workspaceImportSnap = this.store.selectSignal(selectWorkspaceImportOpen);
  private txtExportSnap = this.store.selectSignal(selectTxtExportOpen);

  register(): void {
    if (typeof window === 'undefined') return;

    const tools = this.buildTools();

    window.webmcp_session_info = () => ({
      contract_version: 'zto-webmcp-v1',
      app: 'swiftnote',
      modules: ['entity-collection-v1', 'browse-query-v1', 'artifact-transfer-v1'],
      entity: 'note',
      entity_operations: ['create', 'select', 'update', 'delete', 'toggle'],
      entity_fields: [...ENTITY_FIELDS],
      browsable_entity: 'notes',
      destinations: [...DESTINATIONS],
      artifact_operations: [...ARTIFACT_OPERATIONS],
      export_formats: [...EXPORT_FORMATS],
      import_modes: [...IMPORT_MODES],
      tool_count: Object.keys(tools).length,
    });
    window.webmcp_list_tools = () =>
      Object.keys(tools).map(name => ({ name, description: tools[name].description }));
    // Every invocation runs inside Angular's zone so the visible UI (sidebar,
    // editor, overlays, counts) re-renders synchronously with the store change —
    // the same code path a human control triggers.
    window.webmcp_invoke_tool = (name: string, args?: Record<string, unknown>) => {
      const tool = tools[name];
      if (!tool) throw new Error('Unknown WebMCP tool: ' + name);
      return this.zone.run(() => tool.handler(args || {}));
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
            execute: (args: Record<string, unknown>) => this.zone.run(() => tools[name].handler(args || {})),
          });
        }
      }
    } catch {
      // navigator.modelContext not available — window.* surface is authoritative.
    }
  }

  private buildTools(): Record<string, Tool> {
    const findNote = (id: unknown): Note | undefined =>
      typeof id === 'string' ? this.notesSnap().find(n => n.id === id) : undefined;

    const entityCreate: Tool = {
      description:
        'Create a new untitled note (same as the New Note / Create note control). ' +
        'Returns the new note id and the updated note count.',
      handler: () => {
        this.store.dispatch(NoteActions.createNote());
        this.store.dispatch(NoteActions.showToast({ message: 'Note created' }));
        return { ok: true, id: this.selectedSnap(), count: this.notesSnap().length };
      },
    };

    const entitySelect: Tool = {
      description:
        'Select an existing note by id so it opens in the editor (same as clicking ' +
        'its sidebar row). Requires a known note id.',
      handler: (args) => {
        const note = findNote(args['id']);
        if (!note) return { ok: false, error: 'Unknown note id' };
        this.store.dispatch(NoteActions.selectNote({ id: note.id }));
        return { ok: true, id: note.id, selectedNoteId: this.selectedSnap() };
      },
    };

    const entityUpdate: Tool = {
      description:
        'Update a note field. field must be one of: title, body, pinned. For title/body ' +
        'value is a bounded string (title ≤ 200 chars, body ≤ 20000); for pinned value is ' +
        'a boolean. Dispatches the same edit command the editor/pin controls use; no ' +
        'generic patch object is accepted.',
      handler: (args) => {
        const note = findNote(args['id']);
        if (!note) return { ok: false, error: 'Note id was not found.' };
        const field = args['field'];
        if (typeof field !== 'string' || !ENTITY_FIELDS.includes(field as EntityField)) {
          return { ok: false, error: 'field must be one of: ' + ENTITY_FIELDS.join(', ') };
        }
        const value = args['value'];
        if (field === 'pinned') {
          if (typeof value !== 'boolean') {
            return { ok: false, error: 'pinned value must be a boolean' };
          }
          if (note.pinned !== value) {
            this.store.dispatch(NoteActions.pinNote({ id: note.id }));
          }
          return { ok: true, id: note.id, field, value };
        }
        if (typeof value !== 'string') {
          return { ok: false, error: 'value must be a string' };
        }
        const max = field === 'title' ? TITLE_MAX : BODY_MAX;
        const length = field === 'title' ? value.trim().length : value.length;
        if (length > max) {
          return { ok: false, error: `value exceeds ${max} characters` };
        }
        const changes: Partial<Note> = { [field]: value } as Partial<Note>;
        this.store.dispatch(NoteActions.updateNote({ id: note.id, changes }));
        return { ok: true, id: note.id, field, value };
      },
    };

    const entityDelete: Tool = {
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
        return { ok: true, id: note.id, deleted: true, count: this.notesSnap().length };
      },
    };

    const entityToggle: Tool = {
      description:
        'Toggle a note’s pinned state (same as the Pin control). Pinned notes sort ' +
        'above unpinned notes in the sidebar regardless of edit time.',
      handler: (args) => {
        const note = findNote(args['id']);
        if (!note) return { ok: false, error: 'Unknown note id' };
        this.store.dispatch(NoteActions.pinNote({ id: note.id }));
        const updated = this.notesSnap().find(n => n.id === note.id);
        return { ok: true, id: note.id, pinned: updated ? updated.pinned : !note.pinned };
      },
    };

    return {
      entity_create: entityCreate,
      entity_select: entitySelect,
      entity_update: entityUpdate,
      entity_delete: entityDelete,
      entity_toggle: entityToggle,
      entity_select_note: entitySelect,
      entity_update_note: entityUpdate,
      entity_delete_note: entityDelete,
      entity_create_note: entityCreate,
      entity_toggle_note: entityToggle,
      browse_open: {
        description:
          'Open an app view/mode. destination must be one of: ' + DESTINATIONS.join(', ') +
          '. Dispatches the same command the matching control uses.',
        handler: (args) => {
          const dest = args['destination'];
          if (typeof dest !== 'string' || !DESTINATIONS.includes(dest as Destination)) {
            return { ok: false, error: 'destination must be one of: ' + DESTINATIONS.join(', ') };
          }
          switch (dest as Destination) {
            case 'quick-switcher':
              if (!this.quickSwitcherSnap()) this.store.dispatch(NoteActions.openQuickSwitcher());
              break;
            case 'shortcuts':
              if (!this.shortcutsSnap()) this.store.dispatch(NoteActions.openShortcuts());
              break;
            case 'focus-mode':
              if (!this.focusModeSnap()) this.store.dispatch(NoteActions.toggleFocusMode());
              break;
            case 'workspace-export':
              if (!this.workspaceExportSnap()) this.store.dispatch(NoteActions.openWorkspaceExport());
              break;
            case 'workspace-import':
              if (!this.workspaceImportSnap()) this.store.dispatch(NoteActions.openWorkspaceImport());
              break;
            case 'editor':
              if (this.quickSwitcherSnap()) this.store.dispatch(NoteActions.closeQuickSwitcher());
              if (this.shortcutsSnap()) this.store.dispatch(NoteActions.closeShortcuts());
              if (this.workspaceExportSnap()) this.store.dispatch(NoteActions.closeWorkspaceExport());
              if (this.workspaceImportSnap()) this.store.dispatch(NoteActions.closeWorkspaceImport());
              if (this.txtExportSnap()) this.store.dispatch(NoteActions.closeTxtExport());
              if (this.focusModeSnap()) this.store.dispatch(NoteActions.toggleFocusMode());
              break;
          }
          return {
            ok: true,
            destination: dest,
            focusMode: this.focusModeSnap(),
            quickSwitcherOpen: this.quickSwitcherSnap(),
            shortcutsOpen: this.shortcutsSnap(),
            workspaceExportOpen: this.workspaceExportSnap(),
            workspaceImportOpen: this.workspaceImportSnap(),
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
          return { ok: true, query, matches: this.filteredSnap().length };
        },
      },

      // ---- artifact-transfer-v1 ----------------------------------------
      // No raw file bytes, blobs, or artifact contents cross this boundary — the
      // tools open the same Export Workspace / Import Workspace / Export as .txt
      // surfaces the UI uses; download bytes and clipboard remain Playwright's job.
      artifact_export: {
        description:
          'Open an export surface. format must be one of: workspace-json, txt. ' +
          'workspace-json opens Export Workspace (live Workspace JSON preview); ' +
          'txt opens Export as .txt (filename dialog). Same surfaces as the UI ' +
          'controls; no file contents are returned.',
        handler: (args) => {
          const format = args['format'];
          if (typeof format !== 'string' || !EXPORT_FORMATS.includes(format as (typeof EXPORT_FORMATS)[number])) {
            return { ok: false, error: 'format must be one of: ' + EXPORT_FORMATS.join(', ') };
          }
          if (format === 'txt') {
            if (!this.selectedSnap()) return { ok: false, error: 'no note is open to export' };
            this.store.dispatch(NoteActions.openTxtExport());
          } else {
            this.store.dispatch(NoteActions.openWorkspaceExport());
          }
          return { ok: true, format, opened: true };
        },
      },
      artifact_copy: {
        description:
          'Open Export Workspace so the visible Copy button can be used. format ' +
          'must be workspace-json. This tool does not itself write to the ' +
          'clipboard — per the artifact-transfer contract, actually clicking ' +
          'Copy (and verifying clipboard contents) remains a Playwright ' +
          'responsibility.',
        handler: (args) => {
          const format = args['format'];
          if (format !== 'workspace-json') {
            return { ok: false, error: 'format must be workspace-json' };
          }
          this.store.dispatch(NoteActions.openWorkspaceExport());
          return { ok: true, format, opened: true };
        },
      },
      artifact_import: {
        description:
          'Open Import Workspace so a workspace-json payload can be pasted and ' +
          'confirmed (same surface as the Import Workspace control). mode must be ' +
          'workspace-json. Per the artifact-transfer contract, file contents are ' +
          'never passed through WebMCP arguments — paste + confirm is Playwright-driven.',
        handler: (args) => {
          const mode = args['mode'];
          if (mode !== undefined && mode !== 'workspace-json') {
            return { ok: false, error: 'mode must be workspace-json' };
          }
          this.store.dispatch(NoteActions.openWorkspaceImport());
          return { ok: true, mode: 'workspace-json', opened: true };
        },
      },
    };
  }
}
