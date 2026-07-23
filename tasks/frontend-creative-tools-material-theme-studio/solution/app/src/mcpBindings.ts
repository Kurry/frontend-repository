import { store } from './store/store';
import {
  createTheme,
  loadTheme,
  updateTheme,
  deleteTheme,
  updateActiveOptions,
  importTheme,
  setTab
} from './store/themeSlice';
import { parseImportedTheme } from './utils/importTheme';
import { copyThemeArtifact, ThemeArtifactFormat } from './utils/themeArtifacts';

function mergePalette(
  current: ReturnType<typeof store.getState>['theme']['activeOptions']['palette'],
  patch: Partial<ReturnType<typeof store.getState>['theme']['activeOptions']['palette']>
) {
  const merged = { ...current, ...patch };
  const colorKeys = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
  for (const key of colorKeys) {
    if (patch[key]) merged[key] = { ...current[key], ...patch[key] };
  }
  if (patch.background) merged.background = { ...current.background!, ...patch.background };
  if (patch.text) merged.text = { ...current.text!, ...patch.text };
  return merged;
}

function mergeThemeOptions(
  current: ReturnType<typeof store.getState>['theme']['activeOptions'],
  patch: Partial<ReturnType<typeof store.getState>['theme']['activeOptions']>
) {
  return {
    ...current,
    ...patch,
    palette: patch.palette ? mergePalette(current.palette, patch.palette) : current.palette,
    typography: patch.typography ? { ...current.typography, ...patch.typography } : current.typography,
    shape: patch.shape ? { ...current.shape, ...patch.shape } : current.shape,
  };
}

export function initializeWebMCP() {
  const w = window as any;
  w.webmcp_session_info = () => ({
    modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    contract_version: 'zto-webmcp-v1'
  });

  w.webmcp_list_tools = () => [
    {
      name: 'editor_select',
      module: 'structured-editor-v1',
      operation: 'select',
      description: 'Select a saved material theme for editing',
      inputSchema: {
        type: 'object',
        properties: {
          object_type: { const: 'material-theme' },
          id: { type: 'string', default: 'default' },
        },
        required: ['object_type', 'id'],
        additionalProperties: false,
      },
    },
    {
      name: 'editor_update_property',
      module: 'structured-editor-v1',
      operation: 'update_property',
      description: 'Update a palette, typography, or shape property group',
      inputSchema: {
        type: 'object',
        properties: {
          object_type: { const: 'material-theme' },
          property: { type: 'string', enum: ['palette', 'typography', 'shape'] },
          value: { type: 'object', default: { primary: { main: '#1565c0' } } },
        },
        required: ['object_type', 'property', 'value'],
        additionalProperties: false,
      },
    },
    {
      name: 'editor_preview',
      module: 'structured-editor-v1',
      operation: 'preview',
      description: 'Open the framed preview for the active material theme',
      inputSchema: {
        type: 'object',
        properties: { object_type: { const: 'material-theme' } },
        additionalProperties: false,
      },
    },
    {
      name: 'entity_create',
      module: 'entity-collection-v1',
      operation: 'create',
      description: 'Create and select a saved theme',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', minLength: 1, maxLength: 64 },
          palette: { type: 'object' },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
    {
      name: 'entity_select',
      module: 'entity-collection-v1',
      operation: 'select',
      description: 'Select a saved theme',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', default: 'default' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
    {
      name: 'entity_update',
      module: 'entity-collection-v1',
      operation: 'update',
      description: 'Rename or update a saved theme',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', default: 'default' },
          name: { type: 'string', minLength: 1, maxLength: 64 },
          palette: { type: 'object' },
          options: { type: 'object' },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
    {
      name: 'entity_delete',
      module: 'entity-collection-v1',
      operation: 'delete',
      description: 'Delete a saved theme after explicit confirmation',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', default: 'green' },
          confirm: { const: true },
        },
        required: ['id', 'confirm'],
        additionalProperties: false,
      },
    },
    {
      name: 'artifact_export',
      module: 'artifact-transfer-v1',
      operation: 'export',
      description: 'Open the export workspace for JSON or CSS',
      inputSchema: {
        type: 'object',
        properties: { format: { type: 'string', enum: ['json', 'css'] } },
        required: ['format'],
        additionalProperties: false,
      },
    },
    {
      name: 'artifact_import',
      module: 'artifact-transfer-v1',
      operation: 'import',
      description: 'Import a declared ThemeOptions JSON payload',
      inputSchema: {
        type: 'object',
        properties: {
          mode: { const: 'declared-theme' },
          payload: { type: 'object' },
        },
        required: ['mode', 'payload'],
        additionalProperties: false,
      },
    },
    {
      name: 'artifact_copy',
      module: 'artifact-transfer-v1',
      operation: 'copy',
      description: 'Copy the active JSON or CSS artifact',
      inputSchema: {
        type: 'object',
        properties: { format: { type: 'string', enum: ['json', 'css'], default: 'json' } },
        additionalProperties: false,
      },
    },
  ];

  w.webmcp_invoke_tool = async (name: string, args: any) => {
    switch (name) {
      case 'entity_create': {
        const themeName = typeof args.name === 'string' ? args.name.trim() : '';
        if (!themeName) throw new Error('name is required');
        if (themeName.length > 64) throw new Error('name must be at most 64 characters');
        if (store.getState().theme.themes.some(theme => theme.name === themeName)) {
          throw new Error('name must be unique');
        }
        const id = args.id || 'theme-' + Date.now();
        if (store.getState().theme.themes.some(theme => theme.id === id)) {
          throw new Error('id must be unique');
        }
        const current = store.getState().theme.activeOptions;
        const options = args.palette ? { ...current, palette: mergePalette(current.palette, args.palette) } : current;
        store.dispatch(createTheme({ id, name: themeName, options }));
        store.dispatch(setTab('saved'));
        store.dispatch(closeThemeForm());
        return { success: true };
      }
      case 'entity_select': {
        if (!store.getState().theme.themes.some(theme => theme.id === args.id)) {
          throw new Error(`Theme not found: ${args.id}`);
        }
        store.dispatch(loadTheme(args.id));
        return { success: true };
      }
      case 'entity_update': {
        const themes = store.getState().theme.themes;
        const theme = themes.find(candidate => candidate.id === args.id);
        if (!theme) {
          throw new Error(`Theme not found: ${args.id}`);
        }
        let name = theme.name;
        if (args.name !== undefined) {
          if (typeof args.name !== 'string' || !args.name.trim()) throw new Error('name is required');
          name = args.name.trim();
          if (name.length > 64) throw new Error('name must be at most 64 characters');
          if (themes.some(candidate => candidate.id !== theme.id && candidate.name === name)) {
            throw new Error('name must be unique');
          }
        }
        let options;
        if (args.palette !== undefined || args.options !== undefined) {
          let merged = JSON.parse(JSON.stringify(theme.options));
          if (args.palette !== undefined) {
            if (!args.palette || typeof args.palette !== 'object' || Array.isArray(args.palette)) {
              throw new Error('palette must be an object');
            }
            merged.palette = mergePalette(merged.palette, args.palette);
          }
          if (args.options !== undefined) {
            if (!args.options || typeof args.options !== 'object' || Array.isArray(args.options)) {
              throw new Error('options must be an object');
            }
            merged = mergeThemeOptions(merged, args.options);
          }
          options = parseImportedTheme({ name, ...merged });
        }
        store.dispatch(updateTheme({ id: args.id, name, options }));
        return { success: true, id: args.id, name };
      }
      case 'entity_delete':
        if (!args.confirm) throw new Error("delete requires confirm=true");
        store.dispatch(deleteTheme(args.id));
        return { success: true };

      case 'editor_select': {
        if (args.object_type !== 'material-theme') {
          throw new Error('object_type must be material-theme');
        }
        if (!store.getState().theme.themes.some(theme => theme.id === args.id)) {
          throw new Error(`Theme not found: ${args.id}`);
        }
        store.dispatch(loadTheme(args.id));
        return { success: true };
      }
      case 'editor_update_property': {
        if (args.object_type !== 'material-theme') {
          throw new Error('object_type must be material-theme');
        }
        if (!['palette', 'typography', 'shape'].includes(args.property)) {
          throw new Error('property must be palette, typography, or shape');
        }
        if (!args.value || typeof args.value !== 'object' || Array.isArray(args.value)) {
          throw new Error('value must be an object');
        }

        const currentOptions = store.getState().theme.activeOptions;
        const newOptions = JSON.parse(JSON.stringify(currentOptions));
        if (args.property === 'palette') {
          newOptions.palette = mergePalette(newOptions.palette, args.value);
        } else if (args.property === 'typography') {
          newOptions.typography = { ...newOptions.typography, ...args.value };
        } else {
          newOptions.shape = { ...newOptions.shape, ...args.value };
        }
        store.dispatch(updateActiveOptions(newOptions));
        return { success: true };
      }
      case 'editor_preview': {
        if (args.object_type !== undefined && args.object_type !== 'material-theme') {
          throw new Error('object_type must be material-theme');
        }
        // Surface the framed sample site + editor source for the current options.
        store.dispatch(setTab('preview'));
        return { success: true };
      }

      case 'artifact_export': {
        if (args.format !== 'json' && args.format !== 'css') throw new Error('format must be json or css');
        store.dispatch(setTab('export'));
        return { success: true, format: args.format };
      }
      case 'artifact_import': {
        if (args.mode !== 'declared-theme') {
          throw new Error('mode must be declared-theme');
        }
        try {
          store.dispatch(importTheme(parseImportedTheme(args.payload)));
          return { success: true };
        } catch (e: any) {
          throw new Error(e.message);
        }
      }
      case 'artifact_copy': {
        const state = store.getState();
        const format: ThemeArtifactFormat = args.format ?? 'json';
        if (format !== 'json' && format !== 'css') throw new Error('format must be json or css');
        const activeTheme = state.theme.themes.find(t => t.id === state.theme.activeId);
        await copyThemeArtifact(format, activeTheme?.name ?? 'Theme', state.theme.activeOptions);
        return { success: true };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
}
