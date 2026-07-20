import { store } from './store/store';
import {
  createTheme,
  loadTheme,
  updateTheme,
  deleteTheme,
  updateActiveOptions,
  importTheme
} from './store/themeSlice';

export function initializeWebMCP() {
  const w = window as any;
  w.webmcp_session_info = () => ({
    modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    contract_version: 'zto-webmcp-v1'
  });

  w.webmcp_list_tools = () => [
    { name: 'editor_select', description: 'Select an editor object' },
    { name: 'editor_update_property', description: 'Update an editor property' },
    { name: 'editor_preview', description: 'Preview an editor object' },
    { name: 'entity_create', description: 'Create an entity' },
    { name: 'entity_select', description: 'Select an entity' },
    { name: 'entity_update', description: 'Update an entity' },
    { name: 'entity_delete', description: 'Delete an entity' },
    { name: 'artifact_export', description: 'Export an artifact' },
    { name: 'artifact_import', description: 'Import an artifact' },
    { name: 'artifact_copy', description: 'Copy an artifact' },
  ];

  w.webmcp_invoke_tool = async (name: string, args: any) => {
    switch (name) {
      case 'entity_create': {
        const id = args.id || 'theme-' + Date.now();
        const options = args.palette ? { ...store.getState().theme.activeOptions, palette: args.palette } : store.getState().theme.activeOptions;
        store.dispatch(createTheme({ id, name: args.name, options }));
        return { success: true };
      }
      case 'entity_select':
        store.dispatch(loadTheme(args.id));
        return { success: true };
      case 'entity_update':
        store.dispatch(updateTheme({ id: args.id, name: args.name, options: args.options }));
        return { success: true };
      case 'entity_delete':
        if (!args.confirm) throw new Error("delete requires confirm=true");
        store.dispatch(deleteTheme(args.id));
        return { success: true };

      case 'editor_select':
        if (args.object_type === 'material-theme') {
            store.dispatch(loadTheme(args.id));
        }
        return { success: true };
      case 'editor_update_property': {
        if (args.object_type === 'material-theme') {
          const currentOptions = store.getState().theme.activeOptions;
          const newOptions = JSON.parse(JSON.stringify(currentOptions));
          if (args.property === 'palette') {
             newOptions.palette = { ...newOptions.palette, ...args.value };
          } else if (args.property === 'typography') {
             newOptions.typography = { ...newOptions.typography, ...args.value };
          } else if (args.property === 'shape') {
             newOptions.shape = { ...newOptions.shape, ...args.value };
          }
          store.dispatch(updateActiveOptions(newOptions));
        }
        return { success: true };
      }
      case 'editor_preview':
        return { success: true };

      case 'artifact_export': {
        const state = store.getState();
        const activeOptions = state.theme.activeOptions;
        const activeTheme = state.theme.themes.find(t => t.id === state.theme.activeId);
        if (args.format === 'json') {
           return { success: true, text: JSON.stringify({ name: activeTheme?.name ?? 'Theme', ...activeOptions }, null, 2) };
        } else if (args.format === 'css') {
           return { success: true, text: '...' };
        }
        return { success: true };
      }
      case 'artifact_import': {
        if (args.mode === 'declared-theme') {
            try {
                store.dispatch(importTheme(args.payload as any));
                return { success: true };
            } catch (e: any) {
                throw new Error(e.message);
            }
        }
        return { success: true };
      }
      case 'artifact_copy':
        return { success: true };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
}
