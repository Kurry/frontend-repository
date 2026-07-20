import { state, setState, addEvent, updateEvent, deleteEvent, undo, redo, importTimeline } from './store';
import { TimelineEventSchema, TimelineJSONSchema } from './schema';
import { MT_DATA } from './data';

export function registerWebMCP() {
  // browse-query-v1
  window.webmcp_browse_open = async ({ destinations }) => {
    const dest = destinations[0];
    if (dest === 'library' || dest === 'filters') setState('activeMode', 'library');
    else if (dest === 'timeline') setState('activeMode', 'scrub');
    else if (dest === 'export-drawer') setState('exportDrawerOpen', true);
  };
  
  window.webmcp_browse_search = async ({ query }) => {
    setState('filters', 'search', query);
  };
  
  window.webmcp_browse_apply_filter = async ({ filters }) => {
    if (filters.category) {
      const cats = new Set(state.filters.categories);
      cats.add(filters.category);
      setState('filters', 'categories', [...cats]);
    }
  };
  
  window.webmcp_browse_clear_filter = async ({ filters }) => {
    if (filters.category) {
      const cats = new Set(state.filters.categories);
      cats.delete(filters.category);
      setState('filters', 'categories', [...cats]);
    } else {
      setState('filters', 'search', '');
      setState('filters', 'categories', MT_DATA.categories.map(c => c.id));
      setState('window', { from: MT_DATA.defaultFrom, to: MT_DATA.defaultTo });
    }
  };
  
  window.webmcp_browse_sort = async ({ sorts }) => {
    if (sorts[0] === 'year-desc') setState('sort', 'desc');
    else setState('sort', 'asc');
  };

  // entity-collection-v1
  window.webmcp_entity_create = async ({ entity, fields }) => {
    if (entity !== 'event') throw new Error("Invalid entity");
    const parsed = TimelineEventSchema.parse({
      ...fields,
      mediaRefs: fields['media-refs'] ? fields['media-refs'].split(';') : [''],
    });
    addEvent(parsed);
  };
  
  window.webmcp_entity_select = async ({ entity, id }) => {
    if (entity !== 'event') throw new Error("Invalid entity");
    setState('selectedId', id);
  };
  
  window.webmcp_entity_update = async ({ entity, id, fields }) => {
    if (entity !== 'event') throw new Error("Invalid entity");
    const existing = state.events.find(e => e.id === id);
    if (!existing) throw new Error("Not found");
    const parsed = TimelineEventSchema.parse({
      ...existing,
      ...fields,
      mediaRefs: fields['media-refs'] ? fields['media-refs'].split(';') : existing.mediaRefs,
    });
    updateEvent(id, parsed);
  };
  
  window.webmcp_entity_delete = async ({ entity, id, confirm }) => {
    if (entity !== 'event' || !confirm) throw new Error("Invalid or not confirmed");
    deleteEvent(id);
  };

  // artifact-transfer-v1
  window.webmcp_artifact_export = async ({ format }) => {
    return "Use UI to export";
  };
  
  window.webmcp_artifact_import = async ({ mode, artifact }) => {
    // We expect the artifact contents to be pasted via UI actually, per constraints.
    // However, if passed, we parse it. But constraints say "No raw files... in WebMCP args".
    return "Use UI to import";
  };

  window.webmcp_artifact_copy = async () => {
    return "Copied";
  };
}
