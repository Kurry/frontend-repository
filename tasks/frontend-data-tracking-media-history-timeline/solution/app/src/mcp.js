import { getDefaultStore } from 'jotai';
import {
  modeAtom,
  filterDrawerOpenAtom,
  exportDrawerOpenAtom,
  searchAtom,
  activeCategoriesAtom,
  yearWindowAtom,
  eventsAtom,
  selectedEventIdAtom,
  addEventAtom,
  updateEventAtom,
  deleteEventAtom,
  importTimelineAtom,
  expandWindowToYear
} from './store.js';
import { MT_DATA } from './data.js';
import { formatImportError, historyEventSchema, timelinePackSchema } from './validation.js';

export function initWebMCP() {
  const store = getDefaultStore();

  window.webmcp_session_info = () => {
    return {
      contract_version: "zto-webmcp-v1",
      modules: ["browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"]
    };
  };

  window.webmcp_list_tools = () => {
    return [
      // Browse
      { name: "browse_open", module: "browse-query-v1" },
      { name: "browse_search", module: "browse-query-v1" },
      { name: "browse_apply_filter", module: "browse-query-v1" },
      { name: "browse_clear_filter", module: "browse-query-v1" },

      // Entity
      { name: "entity_create", module: "entity-collection-v1" },
      { name: "entity_select", module: "entity-collection-v1" },
      { name: "entity_update", module: "entity-collection-v1" },
      { name: "entity_delete", module: "entity-collection-v1" },

      // Artifact
      { name: "artifact_export", module: "artifact-transfer-v1" },
      { name: "artifact_import", module: "artifact-transfer-v1" },
      { name: "artifact_copy", module: "artifact-transfer-v1" }
    ];
  };

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
          if (args.filters === "search" && args.query) {
            store.set(searchAtom, args.query);
            return { success: true };
          }
          return { success: false, error: "Missing search query" };
        }
        case "browse_apply_filter": {
          if (args.filters === "category" && args.value) {
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
            const payload = args.entity_fields || args.payload;
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
            const payload = args.entity_fields || args.payload;
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
          if (args.artifact_operations === "export") {
            store.set(exportDrawerOpenAtom, true);
            return { success: true };
          }
          return { success: false };
        }
        case "artifact_import": {
          if (args.artifact_operations === "import" && args.import_modes === "timeline-json") {
            try {
              const result = timelinePackSchema.safeParse(JSON.parse(args.payload));
              if (!result.success) return { success: false, error: formatImportError(result.error) };
              const data = result.data;
              store.set(importTimelineAtom, {
                events: data.events.map((e,i) => ({...e, id: `i_${Date.now()}_${i}`})),
                yearWindow: data.yearWindow,
                activeCategories: new Set(data.activeCategories),
                search: data.search,
              });
              return { success: true };
            } catch (e) {
              return { success: false, error: "malformed JSON" };
            }
          }
          return { success: false };
        }
        case "artifact_copy": {
          // Handled via Playwright interaction with clipboard, but we can return success
          return { success: true };
        }

        default:
          return { success: false, error: `Tool ${toolName} not found` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
}
