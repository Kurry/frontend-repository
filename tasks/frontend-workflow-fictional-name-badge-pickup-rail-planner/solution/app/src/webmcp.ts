import { useStore } from './store';

export function registerWebMCP() {
    if (typeof window === 'undefined') return;

    (window as any).webmcp_session_info = () => {
        return {
            app_name: 'Fictional Badge Rail Planner',
            version: '1.0.0',
            state: 'ready'
        };
    };

    (window as any).webmcp_list_tools = () => {
        return [
            // Editor Operations
            { name: 'editor_select', description: 'Select a badge or element' },
            { name: 'editor_update_property', description: 'Update a property' },
            { name: 'editor_switch_mode', description: 'Switch mode' },
            { name: 'editor_preview', description: 'Preview badge move' },
            { name: 'editor_set_content', description: 'Set editor content' },

            // Entity Operations
            { name: 'entity_create', description: 'Create an entity' },
            { name: 'entity_select', description: 'Select an entity' },
            { name: 'entity_update', description: 'Update an entity' },
            { name: 'entity_delete', description: 'Delete an entity' },
            { name: 'entity_toggle', description: 'Toggle entity' },

            // Artifact Operations
            { name: 'artifact_export', description: 'Export packet zip' },
            { name: 'artifact_import', description: 'Import JSON plan' },
            { name: 'artifact_copy', description: 'Copy artifact' }
        ];
    };

    (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
        const state = useStore.getState();

        try {
            switch (toolName) {
                case 'editor_select':
                case 'entity_select':
                    if (args.type === 'badge' && args.id) {
                        state.setSelection({ kind: 'badge', ids: [args.id], primaryId: args.id });
                        return { changed: true, result: `Selected ${args.id}` };
                    }
                    break;

                case 'editor_preview':
                    if (args.badgeId && args.hookId && args.slotNumber !== undefined) {
                        state.previewBadgeMove(args.badgeId, args.hookId, args.slotNumber);
                        return { changed: true, result: 'Previewing move' };
                    }
                    break;

                case 'editor_update_property':
                    if (args.action === 'confirm_move' && state.dragPreview) {
                        state.confirmPreview();
                        return { changed: true, result: 'Move confirmed' };
                    }
                    break;

                case 'artifact_export':
                    // Mocking export for WebMCP since actual uses JSZip and DOM a.click()
                    return { changed: false, result: 'Export invoked via Playwright' };

                default:
                    return { changed: false, result: `Tool ${toolName} not implemented or invoked incorrectly.` };
            }
        } catch (e: any) {
            return { changed: false, error: e.message };
        }

        return { changed: false, result: 'No action taken' };
    };
}
