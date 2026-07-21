// WebMCP contract: zto-webmcp-v1 with browse-query-v1, entity-collection-v1,
// and artifact-transfer-v1. Every handler calls the same store command the
// visible UI uses, and validation is shared verbatim — MCP can never do what
// the form would reject. No raw files, blobs, base64, or artifact contents in
// arguments or results.
import { toggleSelect, 
  state, ui, paletteById, visiblePalettes,
  createPalette, updatePalette, deletePalettes, toggleFavorite,
  batchArchive, restorePalettes, importArchive, setViewState, notify,
} from './store.js';
import { PERIODS } from './data.js';
import { validatePalette, validateArchive, copyText } from './lib.js';
import { openExport, closeExport, openCompare, closeCompare, isExportOpen } from './overlays.js';
import { openEditor, closeEditor } from './editor.js';
import { buildExportText, buildCatalogHtml } from './exporter.js';

const BROWSE_DESTINATIONS = ['archive-grid', 'palette-detail', 'filters', 'export-drawer', 'comparison'];
const EXPORT_FORMATS = ['css', 'utility-theme', 'scss', 'json'];
const ENTITY_FIELDS = ['name', 'artist', 'swatches', 'favorite', 'period', 'tags', 'notes', 'archived'];

function ok(extra = {}) { return { success: true, ...extra }; }
import { announce } from "./lib.js";
function fail(error) { announce(`WebMCP Error: ${error}`); return { success: false, error }; }

function closeOverlaysForBrowse() {
  if (ui.editor) closeEditor(true);
  if (ui.compareOpen) closeCompare(true);
  if (isExportOpen()) closeExport(true);
}

const handlers = {
  // ---------- browse-query-v1 ----------
  browse_open(args) {
    const dest = args?.destination;
    if (!BROWSE_DESTINATIONS.includes(dest)) {
      return fail(`destination must be one of: ${BROWSE_DESTINATIONS.join(', ')}`);
    }
    if (dest === 'palette-detail') {
      if (!args.entity_id || !paletteById(args.entity_id)) {
        return fail('entity_id is required and must reference an existing palette');
      }
      if (isExportOpen()) closeExport(true);
      openEditor(args.entity_id);
      return ok({ destination: dest, entity_id: args.entity_id });
    }
    if (dest === 'export-drawer') {
      if (ui.editor) closeEditor(true);
      if (ui.compareOpen) closeCompare(true);
      openExport();
      return ok({ destination: dest, format: ui.exportTab });
    }
    if (dest === 'comparison') {
      if (state.multiSelect.length !== 2) {
        return fail('comparison needs exactly two selected palettes (select them with entity_select first)');
      }
      closeOverlaysForBrowse();
      openCompare();
      return ok({ destination: dest, comparing: state.multiSelect });
    }
    // archive-grid and filters return to the browse canvas
    closeOverlaysForBrowse();
    if (dest === 'filters') {
      document.getElementById('PaletteLibrary')?.scrollIntoView({ block: 'start' });
    }
    return ok({ destination: dest });
  },

  browse_search(args) {
    const query = typeof args?.query === 'string' ? args.query : '';
    setViewState({ search: query });
    return ok({ query, visible_palettes: visiblePalettes().length });
  },

  browse_apply_filter(args) {
    const { filter, value } = args || {};
    if (filter === 'period') {
      if (value !== '' && !PERIODS.includes(value)) {
        return fail('period value must be one of the closed period list (or "" for all)');
      }
      setViewState({ periodFilter: value });
      return ok({ filter, value, visible_palettes: visiblePalettes().length });
    }
    if (filter === 'tag') {
      const known = new Set();
      for (const p of state.palettes) if (!p.archived) for (const t of p.tags) known.add(t);
      if (typeof value !== 'string' || !known.has(value)) {
        return fail('tag value must be a tag currently in use on a non-archived palette');
      }
      setViewState({ tagFacet: value });
      return ok({ filter, value, visible_palettes: visiblePalettes().length });
    }
    if (filter === 'archived') {
      const on = value === true || value === 'true';
      setViewState({ archivedFacet: on });
      return ok({ filter, value: on, visible_palettes: visiblePalettes().length });
    }
    return fail('filter must be one of: period, tag, archived');
  },

  browse_clear_filter(args) {
    const { filter } = args || {};
    if (filter === 'period') { setViewState({ periodFilter: '' }); return ok({ filter }); }
    if (filter === 'tag') { setViewState({ tagFacet: null }); return ok({ filter }); }
    if (filter === 'archived') { setViewState({ archivedFacet: false }); return ok({ filter }); }
    return fail('filter must be one of: period, tag, archived');
  },

  browse_sort(args) {
    const { sort } = args || {};
    if (sort !== 'name-asc' && sort !== 'name-desc') {
      return fail('sort must be one of: name-asc, name-desc');
    }
    setViewState({ nameSort: sort });
    return ok({ sort });
  },

  // ---------- entity-collection-v1 ----------
  entity_create(args) {
    if (args?.entity !== 'palette') return fail('entity must be "palette"');
    const err = validatePalette(args.fields || {});
    if (err) return fail(`${err.field}: ${err.message}`);
    const p = createPalette(args.fields);
    return ok({ entity_id: p.id, name: p.name, visible_palettes: visiblePalettes().length });
  },

  entity_select(args) {
    if (args?.entity !== 'palette') return fail('entity must be "palette"');
    if (!args.entity_id || !paletteById(args.entity_id)) {
      return fail('entity_id is required and must reference an existing palette');
    }
    toggleSelect(args.entity_id);
    return ok({ entity_id: args.entity_id, selected: state.multiSelect });
  },

  entity_update(args) {
    if (args?.entity !== 'palette') return fail('entity must be "palette"');
    const existing = paletteById(args?.entity_id);
    if (!existing) return fail('entity_id must reference an existing palette');
    if (!args.fields || typeof args.fields !== 'object') return fail('fields object is required');
    const unknown = Object.keys(args.fields).filter((k) => k !== 'id' && !ENTITY_FIELDS.includes(k));
    if (unknown.length) return fail(`unknown field(s): ${unknown.join(', ')} — allowed: ${ENTITY_FIELDS.join(', ')}`);
    const { id: _ignored, ...patch } = args.fields;
    const merged = { ...existing, ...patch, id: existing.id };
    const err = validatePalette(merged);
    if (err) return fail(`${err.field}: ${err.message}`);
    updatePalette(existing.id, patch);
    return ok({ entity_id: existing.id });
  },

  entity_delete(args) {
    if (args?.entity !== 'palette') return fail('entity must be "palette"');
    if (!args.entity_id || !paletteById(args.entity_id)) {
      return fail('entity_id is required and must reference an existing palette');
    }
    if (args.confirm !== true) return fail('delete requires explicit confirm=true');
    deletePalettes([args.entity_id]);
    return ok({ entity_id: args.entity_id, visible_palettes: visiblePalettes().length });
  },

  entity_toggle(args) {
    if (args?.entity !== 'palette') return fail('entity must be "palette"');
    const existing = paletteById(args?.entity_id);
    if (!existing) return fail('entity_id is required and must reference an existing palette');
    if (args.field === 'favorite') {
      toggleFavorite([existing.id]);
      return ok({ entity_id: existing.id, favorite: !existing.favorite });
    }
    if (args.field === 'archived') {
      if (existing.archived) restorePalettes([existing.id]);
      else batchArchive([existing.id]);
      return ok({ entity_id: existing.id, archived: !existing.archived });
    }
    return fail('field must be one of: favorite, archived');
  },

  // ---------- artifact-transfer-v1 ----------
  artifact_export(args) {
    const format = args?.format;
    if (format !== undefined && !EXPORT_FORMATS.includes(format)) {
      return fail(`format must be one of: ${EXPORT_FORMATS.join(', ')}`);
    }
    openExport(format || ui.exportTab);
    return ok({
      format: ui.exportTab,
      palettes: state.palettes.length,
      note: 'Export drawer is open; the preview compiles live from the shared store.',
    });
  },

  artifact_copy(args) {
    const format = args?.format ?? ui.exportTab;
    if (!EXPORT_FORMATS.includes(format)) {
      return fail(`format must be one of: ${EXPORT_FORMATS.join(', ')}`);
    }
    if (isExportOpen()) {
      ui.exportTab = format;
    } else {
      openExport(format);
    }
    const text = buildExportText(format, state.palettes);
    // Clipboard contents are Playwright's responsibility — the result reports
    // the action, never the artifact text.
    return copyText(text).then((done) =>
      done ? ok({ format, clipboard: 'written' }) : fail('clipboard write was refused by the browser')
    );
  },

  artifact_import(args) {
    if (args?.mode !== 'archive-json') return fail('mode must be "archive-json"');
    const err = validateArchive(args.data);
    if (err) return fail(err);
    importArchive(args.data);
    return ok({ palettes: args.data.palettes.length });
  },

  artifact_print_preview() {
    const live = state.palettes.filter((p) => !p.archived);
    const host = document.getElementById('catalog-print');
    if (host) host.innerHTML = buildCatalogHtml(state.palettes);
    return ok({ palettes_listed: live.length, note: 'Catalog sheet compiled for the browser print preview.' });
  },
};

const TOOL_DEFS = [
  {
    name: 'browse_open',
    description: 'Open a declared destination: archive-grid, palette-detail (requires entity_id), filters, export-drawer, or comparison (requires exactly two selected palettes).',
    inputSchema: {
      type: 'object',
      properties: {
        destination: { type: 'string', enum: BROWSE_DESTINATIONS },
        entity_id: { type: 'string', description: 'Required for palette-detail' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'browse_search',
    description: 'Filter palettes by search text (matches name, artist, and tags case-insensitively), same as the Search input.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'browse_apply_filter',
    description: 'Apply a declared filter: period (closed period list), tag (a tag in use), or archived (boolean).',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['period', 'tag', 'archived'] },
        value: { description: 'period string, tag string, or boolean for archived' },
      },
      required: ['filter', 'value'],
    },
  },
  {
    name: 'browse_clear_filter',
    description: 'Clear a declared filter: period, tag, or archived.',
    inputSchema: {
      type: 'object',
      properties: { filter: { type: 'string', enum: ['period', 'tag', 'archived'] } },
      required: ['filter'],
    },
  },
  {
    name: 'browse_sort',
    description: 'Sort palettes by name: name-asc (A–Z) or name-desc (Z–A).',
    inputSchema: {
      type: 'object',
      properties: { sort: { type: 'string', enum: ['name-asc', 'name-desc'] } },
      required: ['sort'],
    },
  },
  {
    name: 'entity_create',
    description: 'Create a palette. fields must satisfy the palette field contract (name, artist, period from the closed list, 3–12 six-digit hex swatches, optional favorite/tags/notes/archived).',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['palette'] },
        fields: { type: 'object' },
      },
      required: ['entity', 'fields'],
    },
  },
  {
    name: 'entity_select',
    description: 'Select a palette (sets the multi-select to just this palette, like checking its card).',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['palette'] },
        entity_id: { type: 'string' },
      },
      required: ['entity', 'entity_id'],
    },
  },
  {
    name: 'entity_update',
    description: `Update palette fields: ${ENTITY_FIELDS.join(', ')}. The merged record is validated with the same field contract as the editor form.`,
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['palette'] },
        entity_id: { type: 'string' },
        fields: { type: 'object' },
      },
      required: ['entity', 'entity_id', 'fields'],
    },
  },
  {
    name: 'entity_delete',
    description: 'Delete a palette. Requires explicit confirm=true, mirroring the UI confirmation dialog.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['palette'] },
        entity_id: { type: 'string' },
        confirm: { type: 'boolean' },
      },
      required: ['entity', 'entity_id', 'confirm'],
    },
  },
  {
    name: 'entity_toggle',
    description: 'Toggle a boolean field on a palette: favorite or archived.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['palette'] },
        entity_id: { type: 'string' },
        field: { type: 'string', enum: ['favorite', 'archived'] },
      },
      required: ['entity', 'entity_id', 'field'],
    },
  },
  {
    name: 'artifact_export',
    description: 'Open the Export drawer on a format tab: css, utility-theme, scss, or json. Previews compile live from the shared store; no artifact content is returned.',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: EXPORT_FORMATS } },
      required: ['format'],
    },
  },
  {
    name: 'artifact_copy',
    description: 'Copy the export preview of a format to the clipboard (same handler as the Copy export button). Reports success, never the copied text.',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: EXPORT_FORMATS } },
    },
  },
  {
    name: 'artifact_import',
    description: 'Import an archive JSON document (mode archive-json). Validated against palette-archive.v1; invalid payloads are rejected and leave the library untouched.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['archive-json'] },
        data: { type: 'object', description: 'The parsed archive JSON document' },
      },
      required: ['mode', 'data'],
    },
  },
  {
    name: 'artifact_print_preview',
    description: 'Compile the print-optimized catalog sheet (every non-archived palette) for the browser print preview.',
    inputSchema: { type: 'object', properties: {} },
  },
];

export function registerWebMCP() {
  const w = window;
  w.webmcp_list_tools = () => TOOL_DEFS;
  w.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    app: 'Palette Library — Object and Archive',
    modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tools: TOOL_DEFS.map((t) => t.name),
  });
  w.webmcp_invoke_tool = (name, args) => {
    const handler = handlers[name];
    if (!handler) return fail(`Unknown tool: ${name}`);
    try {
      return handler(args || {});
    } catch (err) {
      return fail(`Invocation error: ${err.message}`);
    }
  };
}
