/**
 * WebMCP surface for LineForge (contract zto-webmcp-v1).
 *
 * Every tool calls the SAME store command the visible UI control calls — there
 * is no success path here that the interface itself lacks, and delete requires
 * confirm=true. The registry is exposed on window as:
 *
 *   window.webmcp_session_info()
 *   window.webmcp_list_tools()
 *   window.webmcp_invoke_tool(name, args)
 *
 * Modules:
 *   browse-query-v1    (prefix "browse")  — open, search, apply_filter,
 *                                            clear_filter, set_theme
 *   entity-collection-v1 (prefix "entity")— create, select, update, delete,
 *                                            toggle
 *   command-session-v1 (prefix "session") — start, pause, resume, disconnect,
 *                                            restart, advance, trigger_demo
 */

import { OPENINGS, FAMILIES } from './openings';
import {
  currentOpening, currentOpeningId, favorites, savedLines, boardTheme,
  searchQuery, showFavoritesOnly, showSavedPanel, selectedNodeId, userLine,
  practiceActive, relay, showExportCenter,
  getNodeMoves, loadOpening, toggleFavorite, setBoardTheme,
  startPractice, exitPractice, resetToStart, stepNext,
  addSavedLine, loadSavedLine, deleteSavedLine, updateSavedLine,
  relayStart, relayPause, relayReconnect, relayDisconnect, relayDeliverOutOfOrder,
  buildStudyPack, buildCurrentPGN, toSavedLinePayload, validateTagsNotes
} from './store';

const THEMES = ['classic', 'forest', 'slate'];
const DESTINATIONS = ['library', 'explorer', 'practice', 'notable-games', 'saved-lines', 'export-center'];
const FILTERS = ['favorites', 'family'];
const DEMOS = ['deliver-out-of-order'];
const EXPORT_FORMATS = ['study-pack-json', 'pgn'];
const IMPORT_MODES = ['study-pack'];

function requireOpening() {
  const o = currentOpening.value;
  if (!o) return { ok: false, error: 'Load an opening first (entity_select or browse_open practice).' };
  return { ok: true, opening: o };
}

function findSaved(ref) {
  const lines = savedLines.value;
  return lines.find(l => l.id === ref) || lines.find(l => l.name === ref) || null;
}

export function initWebmcp() {
  const tools = {
    // ---- browse-query-v1 --------------------------------------------------
    browse_open: {
      description:
        'Open a LineForge view: library, explorer, practice, notable-games, ' +
        'saved-lines. Drives the same mode/panel toggles as the UI controls.',
      handler(args) {
        const dest = (args || {}).destination;
        if (!DESTINATIONS.includes(dest)) {
          return { ok: false, error: 'Unknown destination; use one of ' + DESTINATIONS.join(', ') };
        }
        if (dest === 'saved-lines') { showSavedPanel.value = true; return { ok: true, destination: dest, savedPanelOpen: true }; }
        if (dest === 'export-center') { showExportCenter.value = true; return { ok: true, destination: dest, exportCenterOpen: true }; }
        if (dest === 'practice') {
          const g = requireOpening(); if (!g.ok) return g;
          startPractice();
          return { ok: true, destination: dest, practiceActive: practiceActive.value };
        }
        // library / explorer / notable-games: leave practice, close overlay
        showSavedPanel.value = false;
        showExportCenter.value = false;
        if (practiceActive.value && dest !== 'notable-games') exitPractice();
        if (dest !== 'library') { const g = requireOpening(); if (!g.ok) return g; }
        return { ok: true, destination: dest, practiceActive: practiceActive.value };
      }
    },
    browse_search: {
      description: 'Type a query into the opening-library search box (matches name, code, or family).',
      handler(args) {
        const q = (args || {}).query;
        if (typeof q !== 'string') return { ok: false, error: 'query must be a string' };
        if (q.length > 200) return { ok: false, error: 'query too long (max 200 chars)' };
        searchQuery.value = q;
        return { ok: true, query: q };
      }
    },
    browse_apply_filter: {
      description:
        'Apply a library filter. filter="favorites" enables Favorites Only; ' +
        'filter="family" with value=<family name> narrows the list to that family.',
      handler(args) {
        args = args || {};
        const f = args.filter;
        if (!FILTERS.includes(f)) return { ok: false, error: 'Unknown filter; use one of ' + FILTERS.join(', ') };
        if (f === 'favorites') { showFavoritesOnly.value = true; return { ok: true, filter: f, favoritesOnly: true }; }
        const value = args.value;
        if (!FAMILIES.includes(value)) return { ok: false, error: 'Unknown family; use one of ' + FAMILIES.join(', ') };
        searchQuery.value = value;
        return { ok: true, filter: f, value };
      }
    },
    browse_clear_filter: {
      description: 'Clear a library filter. filter="favorites" disables Favorites Only; filter="family" clears the search box.',
      handler(args) {
        const f = (args || {}).filter;
        if (!FILTERS.includes(f)) return { ok: false, error: 'Unknown filter; use one of ' + FILTERS.join(', ') };
        if (f === 'favorites') { showFavoritesOnly.value = false; return { ok: true, filter: f, favoritesOnly: false }; }
        searchQuery.value = '';
        return { ok: true, filter: f, query: '' };
      }
    },
    browse_set_theme: {
      description: 'Set the board color theme: classic, forest, or slate (same as the Board theme selector).',
      handler(args) {
        const theme = (args || {}).theme;
        if (!THEMES.includes(theme)) return { ok: false, error: 'Unknown theme; use one of ' + THEMES.join(', ') };
        setBoardTheme(theme);
        return { ok: true, theme: boardTheme.value };
      }
    },

    // ---- entity-collection-v1 --------------------------------------------
    entity_create: {
      description:
        'Create a saved line. entity="saved-line", name=<1-80 chars>, tags=<optional array ' +
        'of up to 8 tags from the allowed set>, notes=<optional string up to 280 chars>: ' +
        'stores the currently displayed move sequence into My Saved Lines (same as Save this line).',
      handler(args) {
        args = args || {};
        if (args.entity !== 'saved-line') return { ok: false, error: 'entity must be "saved-line"' };
        const g = requireOpening(); if (!g.ok) return g;
        const name = typeof args.name === 'string' ? args.name.trim() : '';
        if (!name) return { ok: false, error: 'name is required' };
        if (name.length > 80) return { ok: false, error: 'name too long (max 80 chars)' };
        const tags = args.tags !== undefined ? args.tags : undefined;
        const notes = args.notes !== undefined ? args.notes : undefined;
        const fieldError = validateTagsNotes(tags, notes);
        if (fieldError) return { ok: false, error: fieldError };
        const path = getNodeMoves();
        const moves = path.length > 0 ? path : [...g.opening.moves];
        const nid = selectedNodeId.value;
        let snapshot = null;
        const ul = userLine.value;
        if (nid.startsWith('user-') && ul) {
          const idx = parseInt(nid.split('-')[1], 10);
          snapshot = { base: ul.base, moves: ul.moves.slice(0, idx + 1) };
        }
        const id = addSavedLine(name, g.opening.id, moves, snapshot, { tags, notes });
        const line = findSaved(id);
        return { ok: true, id, count: savedLines.value.length, savedLine: toSavedLinePayload(line) };
      }
    },
    entity_select: {
      description:
        'Select an entity. entity="opening", id=<opening id> loads that opening; ' +
        'entity="saved-line", id=<saved id or name> loads that saved line into the explorer.',
      handler(args) {
        args = args || {};
        if (args.entity === 'opening') {
          const o = OPENINGS.find(x => x.id === args.id);
          if (!o) return { ok: false, error: 'Unknown opening id' };
          loadOpening(o.id);
          return { ok: true, entity: 'opening', id: o.id, name: o.name };
        }
        if (args.entity === 'saved-line') {
          const line = findSaved(args.id);
          if (!line) return { ok: false, error: 'Unknown saved line' };
          loadSavedLine(line);
          return { ok: true, entity: 'saved-line', id: line.id, name: line.name };
        }
        return { ok: false, error: 'entity must be "opening" or "saved-line"' };
      }
    },
    entity_update: {
      description:
        'Update a saved line. entity="saved-line", id=<saved id>, and one or more of: ' +
        'name=<new 1-80 char name>, tags=<array of up to 8 tags from the allowed set>, ' +
        'notes=<string up to 280 chars>.',
      handler(args) {
        args = args || {};
        if (args.entity !== 'saved-line') return { ok: false, error: 'entity must be "saved-line"' };
        const line = findSaved(args.id);
        if (!line) return { ok: false, error: 'Unknown saved line' };
        const patch = {};
        if (args.name !== undefined) {
          const name = typeof args.name === 'string' ? args.name.trim() : '';
          if (!name) return { ok: false, error: 'name is required' };
          if (name.length > 80) return { ok: false, error: 'name too long (max 80 chars)' };
          patch.name = name;
        }
        if (args.tags !== undefined || args.notes !== undefined) {
          const fieldError = validateTagsNotes(args.tags, args.notes);
          if (fieldError) return { ok: false, error: fieldError };
          if (args.tags !== undefined) patch.tags = args.tags;
          if (args.notes !== undefined) patch.notes = args.notes;
        }
        if (Object.keys(patch).length === 0) {
          return { ok: false, error: 'at least one of name, tags, notes is required' };
        }
        updateSavedLine(line.id, patch);
        const updated = findSaved(line.id);
        return { ok: true, id: line.id, savedLine: toSavedLinePayload(updated) };
      }
    },
    entity_delete: {
      description: 'Delete a saved line. entity="saved-line", id=<saved id>, confirm=true (required).',
      handler(args) {
        args = args || {};
        if (args.entity !== 'saved-line') return { ok: false, error: 'entity must be "saved-line"' };
        if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
        const line = findSaved(args.id);
        if (!line) return { ok: false, error: 'Unknown saved line' };
        deleteSavedLine(line.id);
        return { ok: true, id: line.id, count: savedLines.value.length };
      }
    },
    entity_toggle: {
      description: 'Toggle an opening Favorite star. entity="favorite", id=<opening id>.',
      handler(args) {
        args = args || {};
        if (args.entity !== 'favorite') return { ok: false, error: 'entity must be "favorite"' };
        const o = OPENINGS.find(x => x.id === args.id);
        if (!o) return { ok: false, error: 'Unknown opening id' };
        toggleFavorite(o.id);
        return { ok: true, id: o.id, favorited: favorites.value.includes(o.id) };
      }
    },

    // ---- command-session-v1 ----------------------------------------------
    session_start: {
      description: 'Start the live-relay event stream (same as the Live relay Start button).',
      handler() { relayStart(); return { ok: true, status: relay.value.status }; }
    },
    session_pause: {
      description: 'Pause the live-relay stream (same as the Pause button).',
      handler() { relayPause(); return { ok: true, status: relay.value.status }; }
    },
    session_resume: {
      description: 'Resume/reconnect the live-relay stream, catching up buffered events once (same as Reconnect).',
      handler() { relayReconnect(); return { ok: true, status: relay.value.status }; }
    },
    session_disconnect: {
      description: 'Disconnect the live-relay stream (same as the Disconnect button).',
      handler() { relayDisconnect(); return { ok: true, status: relay.value.status }; }
    },
    session_restart: {
      description: 'Reset the exploration board to the opening start position (same as Reset to start).',
      handler() {
        const g = requireOpening(); if (!g.ok) return g;
        resetToStart();
        return { ok: true, selectedNode: selectedNodeId.value };
      }
    },
    session_advance: {
      description: 'Advance one move with the Next move scrubber (same as the Next move button).',
      handler() {
        const g = requireOpening(); if (!g.ok) return g;
        const before = getNodeMoves().length;
        stepNext();
        return { ok: true, selectedNode: selectedNodeId.value, advanced: getNodeMoves().length !== before };
      }
    },
    session_trigger_demo: {
      description: 'Trigger a live-relay demo. demo="deliver-out-of-order" delivers events out of timestamp order plus a duplicate.',
      handler(args) {
        const demo = (args || {}).demo;
        if (!DEMOS.includes(demo)) return { ok: false, error: 'Unknown demo; use one of ' + DEMOS.join(', ') };
        relayDeliverOutOfOrder();
        return { ok: true, demo, status: relay.value.status, applied: relay.value.applied.length };
      }
    },

    // ---- artifact-transfer-v1 --------------------------------------------
    artifact_export: {
      description:
        'Open Export center for an artifact. format="study-pack-json" or "pgn". ' +
        'Opens the same Export center panel as the visible control; artifact bytes ' +
        'and the download interaction stay Playwright-driven.',
      handler(args) {
        const format = (args || {}).format;
        if (!EXPORT_FORMATS.includes(format)) {
          return { ok: false, error: 'Unknown format; use one of ' + EXPORT_FORMATS.join(', ') };
        }
        showExportCenter.value = true;
        const bytes = format === 'pgn' ? buildCurrentPGN().length : JSON.stringify(buildStudyPack()).length;
        return { ok: true, format, exportCenterOpen: true, byteLength: bytes };
      }
    },
    artifact_copy: {
      description:
        'Open Export center to copy an artifact. format="study-pack-json" or "pgn". ' +
        'Clipboard contents stay a Playwright responsibility.',
      handler(args) {
        const format = (args || {}).format;
        if (!EXPORT_FORMATS.includes(format)) {
          return { ok: false, error: 'Unknown format; use one of ' + EXPORT_FORMATS.join(', ') };
        }
        showExportCenter.value = true;
        return { ok: true, format, exportCenterOpen: true };
      }
    },
    artifact_import: {
      description:
        'Open Export center import panel. mode="study-pack". The pasted JSON / file ' +
        'picker interaction stays a Playwright responsibility per the contract.',
      handler(args) {
        const mode = (args || {}).mode;
        if (!IMPORT_MODES.includes(mode)) {
          return { ok: false, error: 'Unknown mode; use one of ' + IMPORT_MODES.join(', ') };
        }
        showExportCenter.value = true;
        return { ok: true, mode, exportCenterOpen: true };
      }
    }
  };

  const objectSchema = (properties = {}, required = []) => ({ type: 'object', additionalProperties: false, ...(required.length ? { required } : {}), properties });
  const fieldsSchema = { type: 'object', additionalProperties: { type: 'string', maxLength: 200 } };
  const emptySchema = objectSchema();
  const entityFields = ['name', 'opening-code', 'moves', 'ply', 'tags', 'notes', 'side-to-move'];
  const tagList = value => value === undefined ? undefined : String(value).split(',').map(tag => tag.trim()).filter(Boolean);
  const registry = {
    'browse.open': { description: 'Open a declared destination (route, tab, section, or item).', inputSchema: objectSchema({ destination: { type: 'string', enum: DESTINATIONS, description: 'Declared destination' } }, ['destination']), handler: tools.browse_open.handler },
    'browse.search': { description: 'Search within the browsable surface.', inputSchema: objectSchema({ query: { type: 'string', maxLength: 200 } }, ['query']), handler: tools.browse_search.handler },
    'browse.apply_filter': { description: 'Apply a declared filter.', inputSchema: objectSchema({ filter: { type: 'string', enum: FILTERS }, value: { type: 'string', maxLength: 200 } }, ['filter']), handler: tools.browse_apply_filter.handler },
    'browse.clear_filter': { description: 'Clear one or all declared filters.', inputSchema: objectSchema({ filter: { type: 'string', enum: FILTERS } }), handler: args => { if (!args.filter) { showFavoritesOnly.value = false; searchQuery.value = ''; return { ok: true, filter: 'all' }; } return tools.browse_clear_filter.handler(args); } },
    'browse.set_theme': { description: 'Switch to a declared theme.', inputSchema: objectSchema({ theme: { type: 'string', enum: THEMES } }, ['theme']), handler: tools.browse_set_theme.handler },
    'entity.create': { description: 'Create an entity using declared fields.', inputSchema: objectSchema({ fields: fieldsSchema }), handler: ({ fields = {} }) => tools.entity_create.handler({ entity: 'saved-line', name: fields.name, tags: tagList(fields.tags), notes: fields.notes }) },
    'entity.select': { description: 'Select an entity by public id.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 } }, ['id']), handler: ({ id }) => tools.entity_select.handler({ entity: findSaved(id) ? 'saved-line' : 'opening', id }) },
    'entity.update': { description: 'Update declared fields on an entity.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, fields: fieldsSchema }, ['id', 'fields']), handler: ({ id, fields }) => tools.entity_update.handler({ entity: 'saved-line', id, name: fields.name, tags: tagList(fields.tags), notes: fields.notes }) },
    'entity.delete': { description: 'Delete an entity with explicit confirmation.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, confirm: { type: 'boolean', const: true } }, ['id', 'confirm']), handler: ({ id, confirm }) => tools.entity_delete.handler({ entity: 'saved-line', id, confirm }) },
    'entity.toggle': { description: 'Toggle a boolean field on an entity.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, field: { type: 'string', enum: entityFields } }, ['id']), handler: ({ id }) => tools.entity_toggle.handler({ entity: 'favorite', id }) },
    'session.start': { description: 'Invoke session operation: start.', inputSchema: emptySchema, handler: tools.session_start.handler },
    'session.pause': { description: 'Invoke session operation: pause.', inputSchema: emptySchema, handler: tools.session_pause.handler },
    'session.resume': { description: 'Invoke session operation: resume.', inputSchema: emptySchema, handler: tools.session_resume.handler },
    'session.disconnect': { description: 'Invoke session operation: disconnect.', inputSchema: emptySchema, handler: tools.session_disconnect.handler },
    'session.restart': { description: 'Invoke session operation: restart.', inputSchema: emptySchema, handler: tools.session_restart.handler },
    'session.advance': { description: 'Invoke session operation: advance.', inputSchema: emptySchema, handler: tools.session_advance.handler },
    'session.trigger_demo': { description: 'Trigger a declared demo.', inputSchema: objectSchema({ demo: { type: 'string', enum: DEMOS } }, ['demo']), handler: tools.session_trigger_demo.handler },
    'artifact.import': { description: 'Start a declared import mode (no file bytes in WebMCP).', inputSchema: objectSchema({ mode: { type: 'string', enum: IMPORT_MODES } }, ['mode']), handler: tools.artifact_import.handler },
    'artifact.export': { description: 'Export using a declared format (no blob/base64 in results).', inputSchema: objectSchema({ format: { type: 'string', enum: EXPORT_FORMATS } }, ['format']), handler: tools.artifact_export.handler },
    'artifact.copy': { description: 'Trigger copy via the visible control (clipboard verified in Playwright).', inputSchema: emptySchema, handler: async () => { showExportCenter.value = true; await new Promise(resolve => setTimeout(resolve, 0)); const button = document.querySelector('[data-export-copy="study-pack"]'); if (!button) return { ok: false, error: 'Visible copy control not found' }; button.click(); for (let i = 0; i < 100; i++) { await new Promise(resolve => setTimeout(resolve, 20)); const label = button.textContent || ''; if (label.includes('Copied!')) return { ok: true, copy_triggered: true }; if (label.includes('Copy failed')) return { ok: false, error: 'Visible copy control reported failure' }; } return { ok: false, error: 'Visible copy control did not settle' }; } },
  };
  const validateInput = (schema, input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return 'arguments must be an object';
    const properties = schema.properties || {};
    const unknown = Object.keys(input).find(key => !(key in properties)); if (unknown) return `unknown argument: ${unknown}`;
    const missing = (schema.required || []).find(key => input[key] === undefined); if (missing) return `missing required argument: ${missing}`;
    for (const [key, rule] of Object.entries(properties)) {
      const value = input[key]; if (value === undefined) continue;
      if (rule.type === 'string' && typeof value !== 'string') return `${key} must be a string`;
      if (rule.type === 'boolean' && typeof value !== 'boolean') return `${key} must be a boolean`;
      if (rule.enum && !rule.enum.includes(value)) return `${key} is outside the declared enum`;
      if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${rule.const}`;
      if (rule.maxLength && value.length > rule.maxLength) return `${key} is too long`;
      if (rule.type === 'object') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return `${key} must be an object`;
        const badField = Object.keys(value).find(field => !entityFields.includes(field)); if (badField) return `Unknown field: ${badField}`;
        const badValue = Object.entries(value).find(([, fieldValue]) => typeof fieldValue !== 'string' || fieldValue.length > 200); if (badValue) return `${key}.${badValue[0]} must be a string of at most 200 characters`;
      }
    }
    return '';
  };

  window.webmcp_session_info = function () {
    return {
      contract_version: 'zto-webmcp-v1',
      app: 'lineforge',
      modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
      browsable_entity: 'openings',
      destinations: DESTINATIONS.slice(),
      filters: FILTERS.slice(),
      themes: THEMES.slice(),
      entities: ['opening', 'saved-line', 'favorite'],
      entity_operations: ['create', 'select', 'update', 'delete', 'toggle'],
      entity_fields: ['name', 'opening-code', 'moves', 'ply', 'tags', 'notes', 'side-to-move'],
      session_operations: ['start', 'pause', 'resume', 'disconnect', 'restart', 'advance', 'trigger_demo'],
      demos: DEMOS.slice(),
      artifact_operations: ['export', 'import', 'copy'],
      export_formats: EXPORT_FORMATS.slice(),
      import_modes: IMPORT_MODES.slice(),
      tool_names: Object.keys(registry),
      tool_count: Object.keys(registry).length
    };
  };
  window.webmcp_list_tools = function () {
    return Object.entries(registry).map(([name, tool]) => ({ name, description: tool.description, inputSchema: tool.inputSchema }));
  };
  window.webmcp_invoke_tool = async function (name, args = {}) {
    const tool = registry[name];
    if (!tool) return { ok: false, error: 'unknown_tool: ' + name };
    const error = validateInput(tool.inputSchema, args); if (error) return { ok: false, error };
    try { return await tool.handler(args); } catch (cause) { return { ok: false, error: String(cause?.message || cause) }; }
  };
  try { if (navigator.modelContext?.registerTool) Object.entries(registry).forEach(([name, tool]) => navigator.modelContext.registerTool({ name, description: tool.description, inputSchema: tool.inputSchema, invoke: args => window.webmcp_invoke_tool(name, args || {}) })); } catch {}
}
