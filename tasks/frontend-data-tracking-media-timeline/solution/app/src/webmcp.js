import {
  state,
  setState,
  addEvent,
  updateEvent,
  deleteEvent,
  openDetail,
  toggleSelection,
  setMode,
  setSearch,
  clearFilters,
  setSort,
  openExport,
  setExportTab,
  openImport,
} from "./store";
import { normalizeEvent, validateEventFields } from "./schema";
import { CATEGORY_IDS, TYPES, YEAR_MIN, YEAR_MAX } from "./data";

const CONTRACT_VERSION = "zto-webmcp-v1";
const DESTINATIONS = ["timeline", "library", "event-detail", "filters", "export-drawer"];
const SORTS = ["year-asc", "year-desc"];
const FORMATS = ["timeline-json", "events-csv", "window-markdown"];

function fieldsFromArgs(args = {}) {
  const fields = {};
  for (const key of ["title", "type", "timestamp", "year", "place", "categories", "summary", "source"]) {
    if (Object.prototype.hasOwnProperty.call(args, key)) fields[key] = args[key];
  }
  if (Object.prototype.hasOwnProperty.call(args, "media-refs")) fields.mediaRefs = args["media-refs"];
  return fields;
}

function ensureVisible(event) {
  setState("activeMode", "library");
  setState("search", "");
  setState("enabledCategories", (current) => {
    const enabled = new Set(current);
    event.categories.forEach((category) => enabled.add(category));
    return [...enabled];
  });
  setState("window", (window) => ({
    from: Math.max(YEAR_MIN, Math.min(window.from, event.year)),
    to: Math.min(YEAR_MAX, Math.max(window.to, event.year)),
  }));
}

function requireEvent(id) {
  const event = state.events.find((item) => item.id === id);
  if (!event) throw new Error(`Event not found: ${id}`);
  return event;
}

function requireUserEvent(id) {
  const event = requireEvent(id);
  if (event.source === "corpus") throw new Error("Seeded corpus events are read-only");
  return event;
}

function focusVisibleControl(id) {
  setTimeout(() => document.getElementById(id)?.focus(), 0);
}

const HANDLERS = {
  browse_open: async ({ destination } = {}) => {
    if (!DESTINATIONS.includes(destination)) throw new Error(`Unsupported destination: ${destination}`);
    if (destination === "timeline") setMode("scrub");
    else if (destination === "library" || destination === "filters") setMode("library");
    else if (destination === "export-drawer") openExport();
    else {
      const first = state.events[0];
      if (!first) throw new Error("No event is available to open");
      openDetail(first.id);
    }
    return { ok: true, destination, activeMode: state.activeMode };
  },
  browse_search: async ({ query } = {}) => {
    if (typeof query !== "string") throw new Error("query must be a string");
    setMode("library");
    setSearch(query.slice(0, 200));
    return { ok: true, search: state.search };
  },
  browse_apply_filter: async ({ filter, value } = {}) => {
    setMode("library");
    if (filter === "category") {
      if (!CATEGORY_IDS.includes(value)) throw new Error("category must use the closed enum");
      setState("enabledCategories", [value]);
    } else if (filter === "search") {
      if (typeof value !== "string" || value.length > 200) throw new Error("search must be a string of at most 200 characters");
      setSearch(value);
    } else {
      throw new Error("filter must be category or search");
    }
    return { ok: true, filter, enabledCategories: state.enabledCategories.slice(), search: state.search };
  },
  browse_clear_filter: async () => {
    clearFilters();
    return { ok: true, enabledCategories: state.enabledCategories.slice(), search: state.search, window: { ...state.window } };
  },
  browse_sort: async ({ sort } = {}) => {
    if (!SORTS.includes(sort)) throw new Error(`sort must be one of: ${SORTS.join(", ")}`);
    setSort(sort === "year-asc" ? "asc" : "desc");
    return { ok: true, sort };
  },

  entity_create: async ({ entity, fields } = {}) => {
    if (entity !== "event") throw new Error(`Unsupported entity: ${entity}`);
    const record = normalizeEvent(fieldsFromArgs(fields), "user");
    const { ok, errors } = validateEventFields(record);
    if (!ok) throw new Error(`Validation failed: ${Object.values(errors).join(" ")}`);
    const event = addEvent(record);
    ensureVisible(event);
    return { ok: true, id: event.id, count: state.events.length };
  },
  entity_select: async ({ entity, id } = {}) => {
    if (entity !== "event") throw new Error(`Unsupported entity: ${entity}`);
    requireEvent(id);
    openDetail(id);
    return { ok: true, selectedId: state.selectedId };
  },
  entity_update: async ({ entity, id, fields } = {}) => {
    if (entity !== "event") throw new Error(`Unsupported entity: ${entity}`);
    const existing = requireUserEvent(id);
    const record = normalizeEvent({ ...existing, ...fieldsFromArgs(fields) }, existing.source);
    const { ok, errors } = validateEventFields(record);
    if (!ok) throw new Error(`Validation failed: ${Object.values(errors).join(" ")}`);
    const updated = updateEvent(id, record);
    if (!updated) throw new Error("Seeded corpus events are read-only");
    ensureVisible(updated);
    return { ok: true, id };
  },
  entity_delete: async ({ entity, id, confirm } = {}) => {
    if (entity !== "event") throw new Error(`Unsupported entity: ${entity}`);
    if (confirm !== true) throw new Error("Delete requires confirm=true");
    requireUserEvent(id);
    const removed = deleteEvent(id);
    return { ok: removed, id, count: state.events.length - (removed ? 1 : 0) };
  },
  entity_toggle: async ({ entity, id } = {}) => {
    if (entity !== "event") throw new Error(`Unsupported entity: ${entity}`);
    requireUserEvent(id);
    toggleSelection(id);
    return { ok: true, id, selected: state.selection.includes(id) };
  },

  artifact_export: async ({ format } = {}) => {
    if (!FORMATS.includes(format)) throw new Error(`Unsupported export format: ${format}`);
    setExportTab(format);
    openExport(format);
    return { ok: true, format, eventCount: state.events.length, previewVisible: true };
  },
  artifact_import: async ({ mode } = {}) => {
    if (mode !== "timeline-json") throw new Error(`Unsupported import mode: ${mode}`);
    openImport();
    focusVisibleControl("import-text");
    return { ok: true, mode, importSurfaceOpen: state.importOpen };
  },
  artifact_copy: async ({ format } = {}) => {
    if (!FORMATS.includes(format)) throw new Error(`Unsupported copy format: ${format}`);
    setExportTab(format);
    openExport(format);
    focusVisibleControl("timeline-export-copy");
    return { ok: true, format, copyControlVisible: true };
  },
};

const entityFields = {
  title: { type: "string", minLength: 1, maxLength: 120 },
  type: { type: "string", enum: TYPES },
  timestamp: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$" },
  "media-refs": { type: "array", minItems: 1, maxItems: 8, items: { type: "string", minLength: 1, maxLength: 64 } },
  year: { type: "integer", minimum: YEAR_MIN, maximum: YEAR_MAX },
  place: { type: "string", minLength: 1, maxLength: 80 },
  categories: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", enum: CATEGORY_IDS } },
  summary: { type: "string", minLength: 1, maxLength: 2000 },
  source: { type: "string", minLength: 1 },
};

const createFieldsSchema = {
  type: "object",
  properties: entityFields,
  required: ["title", "type", "timestamp", "media-refs", "year", "place", "categories", "summary"],
  additionalProperties: false,
};

const updateFieldsSchema = {
  type: "object",
  properties: entityFields,
  minProperties: 1,
  additionalProperties: false,
};

const TOOL_DEFS = [
  { name: "browse_open", description: "Switch the visible surface (timeline, library, filters, event-detail, export-drawer).", inputSchema: { type: "object", properties: { destination: { type: "string", enum: DESTINATIONS } }, required: ["destination"], additionalProperties: false } },
  { name: "browse_search", description: "Set the free-text search over title/place/summary.", inputSchema: { type: "object", properties: { query: { type: "string", maxLength: 200 } }, required: ["query"], additionalProperties: false } },
  { name: "browse_apply_filter", description: "Apply a closed-enum category or free-text search filter.", inputSchema: { oneOf: [
    { type: "object", properties: { filter: { const: "category" }, value: { type: "string", enum: CATEGORY_IDS } }, required: ["filter", "value"], additionalProperties: false },
    { type: "object", properties: { filter: { const: "search" }, value: { type: "string", maxLength: 200 } }, required: ["filter", "value"], additionalProperties: false },
  ] } },
  { name: "browse_clear_filter", description: "Restore all categories, empty search, and the default year window.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "browse_sort", description: "Set the library year sort.", inputSchema: { type: "object", properties: { sort: { type: "string", enum: SORTS } }, required: ["sort"], additionalProperties: false } },
  { name: "entity_create", description: "Create a user-managed timeline event using the visible form's field contract.", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["event"] }, fields: createFieldsSchema }, required: ["entity", "fields"], additionalProperties: false } },
  { name: "entity_select", description: "Open the detail for an event.", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["event"] }, id: { type: "string", minLength: 1 } }, required: ["entity", "id"], additionalProperties: false } },
  { name: "entity_update", description: "Update a user-managed event using the visible form's field contract.", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["event"] }, id: { type: "string", minLength: 1 }, fields: updateFieldsSchema }, required: ["entity", "id", "fields"], additionalProperties: false } },
  { name: "entity_delete", description: "Delete a user-managed event (confirm=true required).", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["event"] }, id: { type: "string", minLength: 1 }, confirm: { const: true } }, required: ["entity", "id", "confirm"], additionalProperties: false } },
  { name: "entity_toggle", description: "Toggle a user-managed event's multi-select membership.", inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["event"] }, id: { type: "string", minLength: 1 } }, required: ["entity", "id"], additionalProperties: false } },
  { name: "artifact_export", description: "Open a live export preview without returning artifact contents.", inputSchema: { type: "object", properties: { format: { type: "string", enum: FORMATS } }, required: ["format"], additionalProperties: false } },
  { name: "artifact_import", description: "Open the Timeline JSON import surface; file and text contents remain browser-driven.", inputSchema: { type: "object", properties: { mode: { type: "string", enum: ["timeline-json"] } }, required: ["mode"], additionalProperties: false } },
  { name: "artifact_copy", description: "Open the selected preview and focus its visible Copy control; clipboard interaction remains browser-driven.", inputSchema: { type: "object", properties: { format: { type: "string", enum: FORMATS } }, required: ["format"], additionalProperties: false } },
];

export function registerWebMCP() {
  const sessionInfo = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"],
    tools: TOOL_DEFS.map((tool) => tool.name),
    bindings: {
      browsable_entity: "timeline-events",
      destinations: DESTINATIONS,
      filters: ["category", "search"],
      sorts: SORTS,
      entity: "event",
      entity_operations: ["create", "select", "update", "delete", "toggle"],
      entity_fields: ["title", "type", "timestamp", "media-refs", "year", "place", "categories", "summary", "source"],
      artifact_operations: ["export", "import", "copy"],
      export_formats: FORMATS,
      import_modes: ["timeline-json"],
    },
  });

  window.webmcp_session_info = sessionInfo;
  window.webmcp_list_tools = () => TOOL_DEFS.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }));
  window.webmcp_invoke_tool = async (name, args) => {
    const handler = HANDLERS[name];
    if (!handler) throw new Error(`Unknown tool: ${name}`);
    return handler(args || {});
  };
  window.webmcp = { sessionInfo, listTools: window.webmcp_list_tools, invokeTool: window.webmcp_invoke_tool };
}
