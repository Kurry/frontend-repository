// WebMCP surface — contract zto-webmcp-v1. Every tool handler calls the exact
// same store command the visible UI uses; there are no success paths the UI
// lacks, no window.* ground-truth leaks, and no artifact contents/blobs pass
// through arguments or results.
import { useStore } from './store';

const S = () => useStore.getState();

const SESSION = {
  contract_version: 'zto-webmcp-v1',
  app: 'material-ui-theme-creator',
  modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1']
};

interface Tool {
  name: string;
  module: string;
  description: string;
  parameters: unknown;
  handler: (args: any) => any | Promise<any>;
}

const TOOLS: Tool[] = [
  // ---- structured-editor-v1 : the material-theme options editor ----
  {
    name: 'editor_select',
    module: 'structured-editor-v1',
    description: 'Select the material-theme document and read its current live options.',
    parameters: {
      type: 'object',
      properties: { object_type: { type: 'string', enum: ['material-theme'] } }
    },
    handler: () => {
      S().setTab('preview');
      const o = S().options;
      return { ok: true, object_type: 'material-theme', paletteType: o.palette.type, name: S().themeName };
    }
  },
  {
    name: 'editor_update_property',
    module: 'structured-editor-v1',
    description: 'Update a palette color, typography value, or shape borderRadius on the live theme.',
    parameters: {
      type: 'object',
      properties: {
        property: { type: 'string', enum: ['palette', 'typography', 'shape'] },
        path: { type: 'string', description: 'e.g. primary.main, text.primary (palette only)' },
        value: { type: 'string', description: '#RRGGBB for palette; numeric string for shape/fontSize; family name for fontFamily' }
      },
      required: ['property', 'value']
    },
    handler: ({ property, path, value }) => {
      if (property === 'palette') {
        const res = S().setPaletteColor(path || 'primary.main', String(value));
        return { ok: res.ok, ...(res.ok ? {} : { error: res.error, field: res.field }) };
      }
      if (property === 'shape') {
        const res = S().setShapeRadius(Number(value));
        return { ok: res.ok, ...(res.ok ? {} : { error: res.error, field: res.field }) };
      }
      // typography
      if (path === 'fontFamily') {
        S().setFontFamily(String(value));
        return { ok: true };
      }
      const res = S().setFontSize(Number(value));
      return { ok: res.ok, ...(res.ok ? {} : { error: res.error, field: res.field }) };
    }
  },
  {
    name: 'editor_preview',
    module: 'structured-editor-v1',
    description: 'Read the live preview state: palette type, contrast summary, and export byte sizes.',
    parameters: { type: 'object', properties: {} },
    handler: () => {
      const o = S().options;
      const contrast = S().contrast().map((r) => ({ id: r.id, ratio: r.ratio, level: r.level }));
      return {
        ok: true,
        paletteType: o.palette.type,
        borderRadius: o.shape.borderRadius,
        contrast,
        jsonBytes: S().jsonArtifact().length,
        cssBytes: S().cssArtifact().length
      };
    }
  },
  {
    name: 'editor_switch_mode',
    module: 'structured-editor-v1',
    description: 'Switch the workspace mode between the Preview, Components, and Saved Themes tabs.',
    parameters: {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['preview', 'components', 'saved'] } },
      required: ['mode']
    },
    handler: ({ mode }) => {
      S().setTab(mode);
      return { ok: true, mode: S().tab };
    }
  },

  // ---- entity-collection-v1 : saved themes ----
  {
    name: 'entity_create',
    module: 'entity-collection-v1',
    description: 'Create a saved theme from the current live options (same as the New Theme form).',
    parameters: {
      type: 'object',
      properties: { name: { type: 'string', maxLength: 64 } },
      required: ['name']
    },
    handler: ({ name }) => {
      const res = S().createTheme(String(name ?? ''));
      return { ok: res.ok, count: S().savedThemes.length, ...(res.ok ? {} : { error: res.error, field: res.field }) };
    }
  },
  {
    name: 'entity_select',
    module: 'entity-collection-v1',
    description: 'Load a saved theme by id into the shared editor/preview state.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id']
    },
    handler: ({ id }) => {
      const exists = S().savedThemes.some((t) => t.id === id);
      if (!exists) return { ok: false, error: 'Unknown theme id' };
      S().loadTheme(String(id));
      return { ok: true, activeThemeId: S().activeThemeId };
    }
  },
  {
    name: 'entity_update',
    module: 'entity-collection-v1',
    description: 'Update a saved theme: field=name renames it, field=palette sets a live color then saves options.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        field: { type: 'string', enum: ['name', 'palette'] },
        value: { type: 'string' },
        path: { type: 'string', description: 'palette color path when field=palette, e.g. primary.main' }
      },
      required: ['id', 'field', 'value']
    },
    handler: ({ id, field, value, path }) => {
      if (field === 'name') {
        const res = S().renameTheme(String(id), String(value));
        return { ok: res.ok, ...(res.ok ? {} : { error: res.error, field: res.field }) };
      }
      // palette: operate on that theme as the active one
      if (S().activeThemeId !== id) S().loadTheme(String(id));
      const res = S().setPaletteColor(path || 'primary.main', String(value));
      if (!res.ok) return { ok: false, error: res.error, field: res.field };
      S().saveActiveOptions();
      return { ok: true };
    }
  },
  {
    name: 'entity_delete',
    module: 'entity-collection-v1',
    description: 'Delete a saved theme by id. Requires confirm=true.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      required: ['id', 'confirm']
    },
    handler: ({ id, confirm }) => {
      if (confirm !== true) return { ok: false, error: 'Delete requires confirm=true' };
      const existed = S().savedThemes.some((t) => t.id === id);
      if (!existed) return { ok: false, error: 'Unknown theme id' };
      S().deleteTheme(String(id));
      return { ok: true, count: S().savedThemes.length };
    }
  },

  // ---- artifact-transfer-v1 : export / import / copy ----
  {
    name: 'artifact_export',
    module: 'artifact-transfer-v1',
    description: 'Open the Theme Files drawer and report the byte size of the JSON or CSS artifact (no contents returned).',
    parameters: {
      type: 'object',
      properties: { format: { type: 'string', enum: ['json', 'css'] } },
      required: ['format']
    },
    handler: ({ format }) => {
      S().setExportOpen(true);
      const bytes = format === 'css' ? S().cssArtifact().length : S().jsonArtifact().length;
      return { ok: true, format, bytes };
    }
  },
  {
    name: 'artifact_import',
    module: 'artifact-transfer-v1',
    description: 'Open the Import dialog for a declared-theme package (paste/file stays a Playwright action).',
    parameters: {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['declared-theme'] } },
      required: ['mode']
    },
    handler: () => {
      S().setImportOpen(true);
      return { ok: true, mode: 'declared-theme' };
    }
  },
  {
    name: 'artifact_copy',
    module: 'artifact-transfer-v1',
    description: 'Copy the current JSON or CSS artifact to the clipboard (same as the drawer Copy control).',
    parameters: {
      type: 'object',
      properties: { format: { type: 'string', enum: ['json', 'css'] } },
      required: ['format']
    },
    handler: async ({ format }) => {
      const text = format === 'css' ? S().cssArtifact() : S().jsonArtifact();
      await S().copyText(text, format === 'css' ? 'CSS' : 'JSON');
      return { ok: true, format, bytes: text.length };
    }
  }
];

export function installWebMCP(): void {
  const list = () =>
    TOOLS.map((t) => ({ name: t.name, module: t.module, description: t.description, parameters: t.parameters }));

  (window as any).webmcp_session_info = () => ({ ...SESSION, tools: TOOLS.map((t) => t.name) });
  (window as any).webmcp_list_tools = () => list();
  (window as any).webmcp_invoke_tool = async (name: string, args: any = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return await tool.handler(args || {});
  };

  try {
    (navigator as any).modelContext = {
      session_info: (window as any).webmcp_session_info,
      list_tools: (window as any).webmcp_list_tools,
      invoke_tool: (window as any).webmcp_invoke_tool
    };
  } catch {
    /* non-fatal */
  }
}
