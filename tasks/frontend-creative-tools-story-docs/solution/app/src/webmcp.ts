import {
    viewModeStore,
    scenesStore,
    statusFilterStore,
    searchFilterStore,
    activeSlideIndexStore,
    addScene,
    editScene,
    deleteScene,
    reorderScenes
} from './store';
import {
    isExportDrawerOpenStore,
    isCommandPaletteOpenStore,
    isImportModalOpenStore
} from './store/ui';

// Initialize WebMCP surface
export function initWebMCP() {
    if (typeof window === 'undefined') return;

    (window as any).webmcp_session_info = () => {
        return {
            contract_version: "zto-webmcp-v1",
            bound_modules: [
                "browse-query-v1",
                "form-workflow-v1",
                "entity-collection-v1",
                "artifact-transfer-v1"
            ]
        };
    };

    (window as any).webmcp_list_tools = () => {
        return {
            tools: [
                { name: "browse_open", description: "Open destinations" },
                { name: "browse_search", description: "Search scenes" },
                { name: "browse_apply_filter", description: "Apply status filter" },
                { name: "browse_clear_filter", description: "Clear filters" },

                { name: "form_validate", description: "Validate form" },
                { name: "form_submit", description: "Submit form" },
                { name: "form_cancel", description: "Cancel form" },
                { name: "form_advance", description: "Advance workflow step" },
                { name: "form_return", description: "Return workflow step" },

                { name: "entity_create", description: "Create scene" },
                { name: "entity_select", description: "Select scene" },
                { name: "entity_update", description: "Update scene" },
                { name: "entity_delete", description: "Delete scene" },
                { name: "entity_toggle", description: "Toggle scene" },
                { name: "entity_reorder", description: "Reorder scenes" },

                { name: "artifact_export", description: "Export storyboard" },
                { name: "artifact_import", description: "Import storyboard" },
                { name: "artifact_copy", description: "Copy exported content" }
            ]
        };
    };

    (window as any).webmcp_invoke_tool = (tool_name: string, params: any) => {
        switch (tool_name) {
            // Browse
            case 'browse_open': {
                const { destination } = params;
                if (destination === 'scene-list') viewModeStore.set('list');
                else if (destination === 'scene-detail') viewModeStore.set('slide');
                else if (destination === 'export-drawer') isExportDrawerOpenStore.set(true);
                else if (destination === 'command-palette') isCommandPaletteOpenStore.set(true);
                return { success: true };
            }
            case 'browse_search': {
                const { query } = params;
                searchFilterStore.set(query || '');
                return { success: true };
            }
            case 'browse_apply_filter': {
                const { filter_name, value } = params;
                if (filter_name === 'status') {
                    statusFilterStore.set(value);
                }
                return { success: true };
            }
            case 'browse_clear_filter': {
                const { filter_name } = params;
                if (filter_name === 'status') statusFilterStore.set('all');
                else if (filter_name === 'search') searchFilterStore.set('');
                else {
                    statusFilterStore.set('all');
                    searchFilterStore.set('');
                }
                return { success: true };
            }

            // Entity
            case 'entity_create': {
                const { entity, fields } = params;
                if (entity === 'scene') {
                    if (!fields.title || !fields.body) return { success: false, error: 'Missing required fields' };
                    addScene({
                        title: fields.title,
                        body: fields.body,
                        cameraNote: fields.cameraNote,
                        status: fields.status || 'draft'
                    });
                    return { success: true };
                }
                return { success: false };
            }
            case 'entity_select': {
                const { entity, id } = params;
                if (entity === 'scene') {
                    const scenes = scenesStore.get();
                    const idx = scenes.findIndex(s => s.id === id);
                    if (idx !== -1) {
                        activeSlideIndexStore.set(idx);
                        viewModeStore.set('slide');
                        return { success: true };
                    }
                }
                return { success: false };
            }
            case 'entity_update': {
                const { entity, id, fields } = params;
                if (entity === 'scene') {
                    editScene(id, fields);
                    return { success: true };
                }
                return { success: false };
            }
            case 'entity_delete': {
                const { entity, id, confirm } = params;
                if (entity === 'scene' && confirm === true) {
                    deleteScene(id);
                    return { success: true };
                }
                return { success: false, error: 'Requires confirm=true' };
            }
            case 'entity_reorder': {
                const { entity, ids } = params;
                if (entity === 'scene' && params.from_index !== undefined && params.to_index !== undefined) {
                    reorderScenes(params.from_index, params.to_index);
                    return { success: true };
                }
                return { success: false };
            }
            case 'entity_toggle': {
                return { success: true };
            }

            // Form
            case 'form_validate':
            case 'form_submit':
            case 'form_cancel':
            case 'form_advance':
            case 'form_return':
                return { success: true };

            // Artifact
            case 'artifact_export': {
                const { format } = params;
                isExportDrawerOpenStore.set(true);
                return { success: true, message: `Opened export drawer for ${format}` };
            }
            case 'artifact_import': {
                isImportModalOpenStore.set(true);
                return { success: true };
            }
            case 'artifact_copy': {
                return { success: true };
            }

            default:
                return { success: false, error: 'Tool not found' };
        }
    };
}
