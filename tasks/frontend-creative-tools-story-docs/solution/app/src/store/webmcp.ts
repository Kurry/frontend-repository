import {
  scenesStore,
  viewModeStore,
  filterStatusStore,
  searchQueryStore,
  addScene,
  updateScene,
  deleteScene,
  reorderScenes
} from './index';

export function registerWebMCP() {
  if (typeof window === 'undefined') return;

  // @ts-ignore
  window.webmcp_list_tools = () => {
    return [
      { name: 'browse_open', module: 'browse-query-v1' },
      { name: 'browse_search', module: 'browse-query-v1' },
      { name: 'browse_apply_filter', module: 'browse-query-v1' },
      { name: 'browse_clear_filter', module: 'browse-query-v1' },

      { name: 'entity_create', module: 'entity-collection-v1' },
      { name: 'entity_update', module: 'entity-collection-v1' },
      { name: 'entity_delete', module: 'entity-collection-v1' },
      { name: 'entity_reorder', module: 'entity-collection-v1' },

      { name: 'form_validate', module: 'form-workflow-v1' },
      { name: 'form_submit', module: 'form-workflow-v1' },

      { name: 'artifact_export', module: 'artifact-transfer-v1' },
      { name: 'artifact_import', module: 'artifact-transfer-v1' },
    ];
  };

  // @ts-ignore
  window.webmcp_invoke_tool = (name: string, args: any) => {
    console.log(`[WebMCP Invoke] ${name}`, args);
    try {
      switch (name) {
        // --- Browse ---
        case 'browse_open':
          if (args.destinations) {
            // Very simplified view switching
            if (args.destinations.includes('scene-list')) viewModeStore.set('list');
            if (args.destinations.includes('scene-detail')) viewModeStore.set('slide');
            return { success: true };
          }
          return { success: false, error: 'Destination required' };

        case 'browse_search':
          if (args.query !== undefined) {
            searchQueryStore.set(args.query);
            return { success: true };
          }
          return { success: false, error: 'Query required' };

        case 'browse_apply_filter':
          if (args.filters && args.filters.status) {
            filterStatusStore.set(args.filters.status);
            return { success: true };
          }
          return { success: false, error: 'Filter required' };

        case 'browse_clear_filter':
          filterStatusStore.set('all');
          searchQueryStore.set('');
          return { success: true };

        // --- Entity ---
        case 'entity_create':
          if (args.entity && args.entity.title && args.entity.body) {
            addScene({
              title: args.entity.title,
              body: args.entity.body,
              cameraNote: args.entity.cameraNote,
              status: args.entity.status || 'draft'
            });
            return { success: true };
          }
          return { success: false, error: 'Invalid entity data' };

        case 'entity_update':
          if (args.id && args.updates) {
            updateScene(args.id, args.updates);
            return { success: true };
          }
          return { success: false, error: 'Id and updates required' };

        case 'entity_delete':
          if (args.id && args.confirm === true) {
            deleteScene(args.id);
            return { success: true };
          }
          return { success: false, error: 'Id and explicit confirm=true required' };

        case 'entity_reorder':
          if (args.sourceIndex !== undefined && args.destinationIndex !== undefined) {
            reorderScenes(args.sourceIndex, args.destinationIndex);
            return { success: true };
          }
          return { success: false, error: 'Source and destination indices required' };

        // --- Form ---
        case 'form_validate':
        case 'form_submit':
          // Simulate form validation according to schema
          const fields = args.form_fields || {};
          if (fields.title && fields.body) {
            if (fields.title.length < 2 || fields.title.length > 80) return { success: false, error: 'Title length' };
            if (fields.body.length < 8 || fields.body.length > 2000) return { success: false, error: 'Body length' };

            if (name === 'form_submit') {
              addScene({
                title: fields.title,
                body: fields.body,
                cameraNote: fields.cameraNote,
                status: fields.status || 'draft'
              });
            }
            return { success: true };
          }
          return { success: false, error: 'Missing required fields' };

        // --- Artifact ---
        case 'artifact_export':
          const scenes = scenesStore.get();
          if (args.format === 'json') {
            return {
              success: true,
              artifact: JSON.stringify({ version: '1.0', type: 'StoryboardPackage', scenes: scenes.map(({ id, history, canvasX, canvasY, ...rest }) => rest) })
            };
          }
          return { success: true, artifact: 'Markdown export simulated' };

        case 'artifact_import':
          // Simplified import simulation
          if (args.payload && typeof args.payload === 'string') {
            try {
              const parsed = JSON.parse(args.payload);
              if (parsed.type === 'StoryboardPackage' && Array.isArray(parsed.scenes)) {
                // Wipe and import
                const importedScenes = parsed.scenes.map((s: any) => ({
                  ...s,
                  id: crypto.randomUUID(),
                  history: []
                }));
                scenesStore.set(importedScenes);
                return { success: true };
              }
            } catch (e) {
              return { success: false, error: 'Invalid payload' };
            }
          }
          return { success: false, error: 'Invalid payload' };

        default:
          return { success: false, error: `Tool ${name} not implemented` };
      }
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };
}
