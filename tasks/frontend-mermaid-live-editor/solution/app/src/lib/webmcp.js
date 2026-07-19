// WebMCP surface (contract zto-webmcp-v1). Every tool calls the same domain
// command the visible UI uses — there are no success paths the UI lacks.
import { store, setCode, setEditorMode, setTheme, loadSample } from './state.svelte.js';
import { SAMPLE_DIAGRAMS } from './mermaid.js';
import { downloadSVG, downloadPNG, copySVGMarkup } from './export.js';

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
    description: 'Export the current diagram as an SVG or PNG download.',
    parameters: {
      type: 'object',
      properties: { format: { type: 'string', enum: ['svg', 'png'] } },
      required: ['format']
    },
    handler: async ({ format }) => {
      if (store.error) throw new Error('Cannot export while the diagram has a syntax error');
      const filename = format === 'png' ? await downloadPNG() : downloadSVG();
      return { ok: true, format, filename };
    }
  },
  {
    name: 'artifact_copy',
    module: 'artifact-transfer-v1',
    description: 'Copy the current rendered diagram SVG markup to the clipboard.',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const length = await copySVGMarkup();
      return { ok: true, copied: true, length };
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
