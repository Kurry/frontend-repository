import { getDefaultStore } from 'jotai';
import {
  modeAtom,
  filterDrawerOpenAtom,
  exportDrawerOpenAtom,
  exportDrawerTabAtom,
  searchAtom,
  activeCategoriesAtom,
  yearWindowAtom,
  eventsAtom,
  selectedEventIdAtom,
  addEventAtom,
  updateEventAtom,
  deleteEventAtom,
  expandWindowToYear
} from './store.js';
import { MT_DATA } from './data.js';
import { formatImportError, historyEventSchema } from './validation.js';

const objectSchema = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const eventInputSchema = objectSchema({
  title: { type: 'string', minLength: 1, maxLength: 120 },
  type: { type: 'string', enum: ['First Appearance', 'Mass Adoption', 'Standardization', 'Obsoletion', 'Commemoration'] },
  timestamp: { type: 'string', format: 'date-time' },
  mediaRefs: { type: 'array', minItems: 1, maxItems: 6, items: { type: 'string', minLength: 1, maxLength: 64 } },
  year: { type: 'integer', minimum: MT_DATA.yearMin, maximum: MT_DATA.yearMax },
  place: { type: 'string', minLength: 1, maxLength: 80 },
  categories: { type: 'array', minItems: 1, items: { type: 'string', enum: MT_DATA.categories.map(category => category.id) } },
  summary: { type: 'string', minLength: 1, maxLength: 2000 },
  detail: { type: 'string', minLength: 1, maxLength: 4000 },
}, ['title', 'type', 'timestamp', 'mediaRefs', 'year', 'place', 'categories', 'summary', 'detail']);
const defaultEvent = {
  title: 'Schema round-trip event', type: 'First Appearance', timestamp: '1900-01-01T00:00:00.000Z',
  mediaRefs: ['schema-round-trip'], year: 1900, place: 'Detroit', categories: ['Print Press'],
  summary: 'A visible event created through the declared contract.', detail: 'This event verifies that contract mutations reach the rendered timeline.',
};
const existingIds = MT_DATA.events.map(event => event.id);
const TOOL_DESCRIPTORS = [
  { name: 'browse_open', module: 'browse-query-v1', description: 'Open a declared timeline destination.', inputSchema: objectSchema({ destination: { type: 'string', enum: ['library', 'timeline', 'event-detail', 'filters', 'export-drawer'] }, id: { type: 'string', enum: existingIds } }, ['destination']) },
  { name: 'browse_search', module: 'browse-query-v1', description: 'Query live timeline events without changing visible filters.', inputSchema: objectSchema({ query: { type: 'string', minLength: 1, maxLength: 200 } }, ['query']) },
  { name: 'browse_apply_filter', module: 'browse-query-v1', description: 'Apply a declared category or search filter.', inputSchema: { ...objectSchema({ filter: { type: 'string', enum: ['search', 'category'] }, value: { type: 'string', maxLength: 200 } }, ['filter', 'value']), default: { filter: 'search', value: 'schema-round-trip' } } },
  { name: 'browse_clear_filter', module: 'browse-query-v1', description: 'Clear timeline filters.', inputSchema: objectSchema() },
  { name: 'entity_create', module: 'entity-collection-v1', description: 'Create one schema-valid event.', inputSchema: { ...objectSchema({ entity: { type: 'string', const: 'event' }, fields: eventInputSchema }, ['entity', 'fields']), default: { entity: 'event', fields: defaultEvent } } },
  { name: 'entity_select', module: 'entity-collection-v1', description: 'Select one event by public id.', inputSchema: objectSchema({ entity: { type: 'string', const: 'event' }, id: { type: 'string', enum: existingIds } }, ['entity', 'id']) },
  { name: 'entity_update', module: 'entity-collection-v1', description: 'Replace the declared fields of one event.', inputSchema: { ...objectSchema({ entity: { type: 'string', const: 'event' }, id: { type: 'string', enum: existingIds }, fields: eventInputSchema }, ['entity', 'id', 'fields']), default: { entity: 'event', id: existingIds[0], fields: { ...MT_DATA.events[0], title: `${MT_DATA.events[0].title} updated` } } } },
  { name: 'entity_delete', module: 'entity-collection-v1', description: 'Delete one event after explicit confirmation.', inputSchema: objectSchema({ entity: { type: 'string', const: 'event' }, id: { type: 'string', enum: existingIds }, confirm: { type: 'boolean', const: true } }, ['entity', 'id', 'confirm']) },
  { name: 'artifact_export', module: 'artifact-transfer-v1', description: 'Trigger the visible JSON or CSV download control.', inputSchema: objectSchema({ operation: { type: 'string', const: 'export' }, format: { type: 'string', enum: ['json', 'csv'] } }, ['operation', 'format']) },
  { name: 'artifact_import', module: 'artifact-transfer-v1', description: 'Open the visible timeline-json import surface without accepting file contents.', inputSchema: objectSchema({ operation: { type: 'string', const: 'import' }, mode: { type: 'string', enum: ['timeline-json'] } }, ['operation', 'mode']) },
  { name: 'artifact_copy', module: 'artifact-transfer-v1', description: 'Trigger the visible copy control for JSON or CSV.', inputSchema: objectSchema({ operation: { type: 'string', const: 'copy' }, format: { type: 'string', enum: ['json', 'csv'] } }, ['operation', 'format']) },
];

const afterRender = action => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(action()))));

export function initWebMCP() {
  const store = getDefaultStore();

  window.webmcp_session_info = () => {
    return {
      contract_version: "zto-webmcp-v1",
      modules: ["browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"]
    };
  };

  window.webmcp_list_tools = () => TOOL_DESCRIPTORS;

  window.webmcp_invoke_tool = (toolName, args) => {
    try {
      switch (toolName) {
        // Browse
        case "browse_open": {
          const destination = args.destinations ?? args.destination;
          if (destination === "timeline") store.set(modeAtom, "explore");
          else if (destination === "library") store.set(modeAtom, "library");
          else if (destination === "filters") store.set(filterDrawerOpenAtom, true);
          else if (destination === "export-drawer") store.set(exportDrawerOpenAtom, true);
          else if (destination === "event-detail") {
            const id = args.id ?? store.get(selectedEventIdAtom) ?? store.get(eventsAtom)[0]?.id;
            const target = id ? store.get(eventsAtom).find(event => event.id === id) : null;
            if (!target) return { success: false, error: "Event not found" };
            expandWindowToYear(store.get, store.set, target.year);
            store.set(modeAtom, "explore");
            store.set(selectedEventIdAtom, id);
          } else return { success: false, error: "Unknown destination" };
          return { success: true, destination };
        }
        case "browse_search": {
          if (typeof args.query !== 'string' || !args.query.trim()) return { success: false, error: 'Missing search query' };
          const query = args.query.trim().toLowerCase();
          const events = store.get(eventsAtom)
            .filter(event => `${event.title} ${event.place} ${event.summary} ${event.detail}`.toLowerCase().includes(query))
            .map(({ id, title, year, place, categories }) => ({ id, title, year, place, categories }));
          return { success: true, query, count: events.length, events };
        }
        case "browse_apply_filter": {
          const filter = args.filter ?? args.filters;
          if (filter === 'search' && typeof args.value === 'string') {
            store.set(searchAtom, args.value);
            return { success: true, filter, value: args.value };
          }
          if (filter === "category" && args.value) {
            if (!MT_DATA.categories.some(category => category.id === args.value)) {
              return { success: false, error: "Unknown category" };
            }
            const cats = new Set(store.get(activeCategoriesAtom));
            cats.add(args.value);
            store.set(activeCategoriesAtom, cats);
            return { success: true };
          }
          return { success: false };
        }
        case "browse_clear_filter": {
          store.set(searchAtom, "");
          store.set(activeCategoriesAtom, new Set(MT_DATA.categories.map(c => c.id)));
          store.set(yearWindowAtom, { from: MT_DATA.defaultFrom, to: MT_DATA.defaultTo });
          return { success: true };
        }

        // Entity
        case "entity_create": {
          if (args.entity === "event") {
            const payload = args.fields || args.entity_fields || args.payload;
            const result = historyEventSchema.safeParse(payload);
            if (!result.success) return { success: false, error: formatImportError(result.error) };
            store.set(addEventAtom, result.data);
            return { success: true };
          }
          return { success: false };
        }
        case "entity_select": {
          if (args.entity === "event" && args.id) {
            const target = store.get(eventsAtom).find(event => event.id === args.id);
            if (!target) {
              return { success: false, error: "Event not found" };
            }
            expandWindowToYear(store.get, store.set, target.year);
            store.set(modeAtom, "explore");
            store.set(selectedEventIdAtom, args.id);
            return { success: true };
          }
          return { success: false };
        }
        case "entity_update": {
          if (args.entity === "event" && args.id) {
            const payload = args.fields || args.entity_fields || args.payload;
            const result = historyEventSchema.safeParse(payload);
            if (!result.success) return { success: false, error: formatImportError(result.error) };
            if (!store.get(eventsAtom).some(event => event.id === args.id)) return { success: false, error: "Event not found" };
            store.set(updateEventAtom, { ...result.data, id: args.id });
            return { success: true };
          }
          return { success: false };
        }
        case "entity_delete": {
          if (args.entity === "event" && args.id && args.confirm) {
            store.set(deleteEventAtom, args.id);
            return { success: true };
          }
          return { success: false };
        }

        // Artifact
        case "artifact_export": {
          const operation = args.operation ?? args.artifact_operations;
          const format = args.format ?? args.export_formats;
          if (operation !== 'export' || !['json', 'csv'].includes(format)) return { success: false, error: 'Export requires json or csv format' };
          store.set(exportDrawerTabAtom, format);
          store.set(exportDrawerOpenAtom, true);
          return afterRender(() => {
            const label = format === 'json' ? 'Download JSON' : 'Download CSV';
            const control = Array.from(document.querySelectorAll('a')).find(node => node.textContent?.trim() === label);
            control?.click();
            return control ? { success: true, operation, format, visible: 'export-drawer' } : { success: false, error: 'Visible download control unavailable' };
          });
        }
        case "artifact_import": {
          const operation = args.operation ?? args.artifact_operations;
          const mode = args.mode ?? args.import_modes;
          if (operation !== 'import' || mode !== 'timeline-json') return { success: false, error: 'Import mode must be timeline-json' };
          store.set(exportDrawerTabAtom, 'import');
          store.set(exportDrawerOpenAtom, true);
          return afterRender(() => {
            const control = document.querySelector('#import-file-input');
            control?.focus();
            return control ? { success: true, operation, mode, completed: false, visible: 'import-surface' } : { success: false, error: 'Visible import control unavailable' };
          });
        }
        case "artifact_copy": {
          const operation = args.operation ?? args.artifact_operations;
          const format = args.format ?? args.export_formats;
          if (operation !== 'copy' || !['json', 'csv'].includes(format)) return { success: false, error: 'Copy requires json or csv format' };
          store.set(exportDrawerTabAtom, format);
          store.set(exportDrawerOpenAtom, true);
          return afterRender(() => {
            const control = Array.from(document.querySelectorAll('button')).find(node => node.textContent?.trim() === 'Copy');
            control?.click();
            return control ? { success: true, operation, format, triggered: true } : { success: false, error: 'Visible copy control unavailable' };
          });
        }

        default:
          return { success: false, error: `Tool ${toolName} not found` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
}
