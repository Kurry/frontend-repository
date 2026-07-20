// WebMCP surface (contract zto-webmcp-v1). Every tool calls the same domain
// command the visible UI uses — there are no success paths the UI lacks.
import { store, setCode, setEditorMode, setTheme, loadSample, getSessionJSON, importSessionJSON, importMMD } from './state.svelte.js';
import { SAMPLE_DIAGRAMS } from './mermaid.js';
import { downloadSVG, downloadPNG, copySVGMarkup, downloadMMD, downloadJSON, copyToClipboard } from './export.js';

const SESSION = {
  contract_version: 'zto-webmcp-v1',
  app: 'mermaid-live-editor',
  modules: ['structured-editor-v1', 'browse-query-v1', 'artifact-transfer-v1']
};

const SAMPLE_IDS = SAMPLE_DIAGRAMS.map((s) => s.id);

const waitForPreview = () =>
  new Promise((resolve) => setTimeout(resolve, 350)); // let the render effect settle

const TOOLS = [
  // ----- structured-editor-v1: the diagram document editor -----
  {
    name: 'editor_set_content',
    module: 'structured-editor-v1',
    description: 'Replace the diagram source in the code editor with new Mermaid syntax.',
    parameters: {
      type: 'object',
      properties: { object_type: { type: 'string', enum: ['diagram'] }, content: { type: 'string' } },
      required: ['content']
    },
    handler: async ({ content }) => {
      setEditorMode('code');
      setCode(String(content));
      await waitForPreview();
      return { ok: true, editorMode: store.editorMode, error: store.error ?? null };
    }
  },
  {
    name: 'editor_switch_mode',
    module: 'structured-editor-v1',
    description: 'Switch the editor between the diagram code tab and the config tab.',
    parameters: {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['code', 'config'] } },
      required: ['mode']
    },
    handler: ({ mode }) => {
      setEditorMode(mode);
      return { ok: true, editorMode: store.editorMode };
    }
  },
  {
    name: 'editor_preview',
    module: 'structured-editor-v1',
    description: 'Read the current preview state: diagram type, error, and whether an SVG rendered.',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      await waitForPreview();
      const svg = document.querySelector('#container svg');
      return {
        ok: true,
        diagramType: store.diagramType ?? null,
        error: store.error ?? null,
        rendered: !!svg
      };
    }
  },
  // ----- browse-query-v1: sample diagrams + theme -----
  {
    name: 'browse_open',
    module: 'browse-query-v1',
    description: 'Load one of the seeded sample diagrams into the editor and preview.',
    parameters: {
      type: 'object',
      properties: { destination: { type: 'string', enum: SAMPLE_IDS } },
      required: ['destination']
    },
    handler: async ({ destination }) => {
      const sample = SAMPLE_DIAGRAMS.find((s) => s.id === destination);
      if (!sample) throw new Error(`Unknown destination: ${destination}`);
      setEditorMode('code');
      loadSample(sample);
      await waitForPreview();
      return { ok: true, destination, diagramType: store.diagramType ?? null };
    }
  },
  {
    name: 'browse_set_theme',
    module: 'browse-query-v1',
    description: 'Switch the application theme between light and dark.',
    parameters: {
      type: 'object',
      properties: { theme: { type: 'string', enum: ['light', 'dark'] } },
      required: ['theme']
    },
    handler: ({ theme }) => {
      setTheme(theme);
      return { ok: true, theme: store.theme };
    }
  },
  // ----- artifact-transfer-v1: export the diagram -----
  {
    name: 'artifact_export',
    module: 'artifact-transfer-v1',
    description: 'Export the current diagram as an SVG, PNG, MMD, or JSON download.',
    parameters: {
      type: 'object',
      properties: { format: { type: 'string', enum: ['svg', 'png', 'mmd', 'json'] } },
      required: ['format']
    },
    handler: async ({ format }) => {
      if (store.error && format !== 'json') throw new Error('Cannot export while the diagram has a syntax error');
      if (!store.code.trim() && format !== 'json') throw new Error('Cannot export empty diagram');
      let filename;
      if (format === 'png') filename = await downloadPNG();
      else if (format === 'svg') filename = downloadSVG();
      else if (format === 'mmd') filename = downloadMMD(store.code);
      else if (format === 'json') filename = downloadJSON(getSessionJSON());
      return { ok: true, format, filename };
    }
  },
  {
    name: 'artifact_copy',
    module: 'artifact-transfer-v1',
    description: 'Copy the current rendered diagram SVG markup or Session JSON to the clipboard.',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const length = await copySVGMarkup();
      return { ok: true, copied: true, length };
    }
  },
  {
    name: 'artifact_import',
    module: 'artifact-transfer-v1',
    description: 'Import MMD or Session JSON payload.',
    parameters: {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['mmd', 'session-json'] }, payload: { type: 'string' } },
      required: ['mode', 'payload']
    },
    handler: async ({ mode, payload }) => {
      if (mode === 'mmd') {
        const result = importMMD(payload);
        if (!result.ok) throw new Error(result.error);
      } else {
        const result = importSessionJSON(payload);
        if (!result.ok) throw new Error(result.error);
      }
      await waitForPreview();
      return { ok: true, mode };
    }
  }
];

export const installWebMCP = () => {
  const list = () =>
    TOOLS.map((t) => ({
      name: t.name,
      module: t.module,
      description: t.description,
      parameters: t.parameters
    }));

  window.webmcp_session_info = () => ({ ...SESSION, tools: TOOLS.map((t) => t.name) });
  window.webmcp_list_tools = () => list();
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return await tool.handler(args || {});
  };

  // Optional navigator.modelContext mirror.
  try {
    if (navigator && typeof navigator === 'object') {
      navigator.modelContext = {
        session_info: window.webmcp_session_info,
        list_tools: window.webmcp_list_tools,
        invoke_tool: window.webmcp_invoke_tool
      };
    }
  } catch {
    /* non-fatal */
  }
};
