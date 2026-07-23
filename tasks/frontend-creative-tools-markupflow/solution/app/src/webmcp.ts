// WebMCP surface for the MarkupFlow oracle.
//
// Contract: zto-webmcp-v1. Every tool drives the SAME Solid-store domain
// command a human triggers through the visible UI — it never fakes a success
// path the UI could not reach. Drawing / drag-resize / layer-reorder gesture
// mechanics are intentionally NOT exposed here (they stay Playwright-driven);
// structured-editor forbids arbitrary coordinate / DOM mutation via WebMCP, so
// `editor_add` places an annotation at the same fixed default position the
// keyboard-placement control uses, never at caller-supplied pixel coordinates.
//
// Exposed on window as webmcp_session_info / webmcp_list_tools /
// webmcp_invoke_tool. A navigator.modelContext registration is added in
// addition when that surface exists.
import type { ToolType, StrokeWidth, TextStyle } from './store';

const CONTRACT_VERSION = 'zto-webmcp-v1';

export const EDITOR_OBJECT_TYPES: ToolType[] = [
  'rectangle', 'oval', 'line', 'arrow', 'text',
  'blur', 'pixelate', 'spotlight', 'loupe', 'highlighter',
];
export const EDITOR_PROPERTIES = ['color', 'stroke-width', 'text-style', 'font-size'] as const;
export const EDITOR_MODES = ['edit', 'preview'] as const;
const STROKE_WIDTHS: StrokeWidth[] = ['thin', 'medium', 'thick'];
const TEXT_STYLES: TextStyle[] = ['plain', 'bold-caption', 'outline', 'highlight-box', 'shadow'];
const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 72;

export interface WebMcpBridge {
  // read-only view of shared state
  listAnnotations: () => { id: string; type: string }[];
  selectedId: () => string | null;
  imageLoaded: () => boolean;
  viewMode: () => 'edit' | 'preview';
  listProjects: () => { id: string; name: string }[];
  // domain commands (same paths the visible controls use)
  placeAnnotation: (type: ToolType) => string | null;
  selectAnnotation: (id: string | null) => boolean;
  deleteAnnotation: (id: string) => boolean;
  updateSelectedProperty: (key: 'color' | 'strokeWidth' | 'textStyle' | 'fontSize', value: unknown) => boolean;
  setViewMode: (mode: 'edit' | 'preview') => void;
  renderPreview: () => void;
  saveProject: (name: string) => boolean;
  loadProject: (id: string) => boolean;
  deleteProject: (id: string) => boolean;
  // artifact-transfer-v1 (same paths as the header Export/Import/Copy controls;
  // never returns raw file / blob / base64 contents in tool results)
  openExportPreview: () => void;
  triggerExportPng: () => void;
  triggerImport: () => void;
  copyProjectJson: () => void;
  projectByteLength: () => number;
  projectAnnotationCount: () => number;
}

const ARTIFACT_EXPORT_FORMATS = ['json', 'png'] as const;
const ARTIFACT_IMPORT_MODES = ['project-json'] as const;

type Result = Record<string, unknown>;
type Handler = (args: Record<string, unknown>) => Result;
type ToolDescriptor = {
  name: string;
  description: string;
  handler: Handler;
  inputSchema?: Record<string, unknown>;
};

export function registerWebMcp(bridge: WebMcpBridge) {
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v));

  // ---- structured-editor-v1 (prefix "editor") ----------------------------
  const editorSelect: Handler = (args) => {
    const id = args.id == null ? null : String(args.id);
    const ok = bridge.selectAnnotation(id);
    return { ok, operation: 'select', selected: bridge.selectedId() };
  };

  const editorAdd: Handler = (args) => {
    const objectType = String(args.object_type ?? args.type ?? '') as ToolType;
    if (!EDITOR_OBJECT_TYPES.includes(objectType)) {
      return { ok: false, error: `unknown object_type: ${objectType}`, allowed: EDITOR_OBJECT_TYPES };
    }
    if (!bridge.imageLoaded()) {
      return { ok: false, error: 'no image loaded; load an image before adding annotations' };
    }
    const id = bridge.placeAnnotation(objectType);
    return { ok: Boolean(id), operation: 'add', object_type: objectType, id, count: bridge.listAnnotations().length };
  };

  const editorDelete: Handler = (args) => {
    if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
    const id = String(args.id ?? '');
    const ok = bridge.deleteAnnotation(id);
    return { ok, operation: 'delete', id, count: bridge.listAnnotations().length };
  };

  const editorUpdateProperty: Handler = (args) => {
    const property = String(args.property ?? '');
    if (!(EDITOR_PROPERTIES as readonly string[]).includes(property)) {
      return { ok: false, error: `unknown property: ${property}`, allowed: EDITOR_PROPERTIES };
    }
    if (!bridge.selectedId()) return { ok: false, error: 'no annotation selected; call editor_select first' };
    const value = args.value;
    if (property === 'stroke-width') {
      if (!STROKE_WIDTHS.includes(String(value) as StrokeWidth)) {
        return { ok: false, error: `stroke-width must be one of ${STROKE_WIDTHS.join(', ')}` };
      }
      return { ok: bridge.updateSelectedProperty('strokeWidth', String(value)), operation: 'update_property', property, value };
    }
    if (property === 'text-style') {
      if (!TEXT_STYLES.includes(String(value) as TextStyle)) {
        return { ok: false, error: `text-style must be one of ${TEXT_STYLES.join(', ')}` };
      }
      return { ok: bridge.updateSelectedProperty('textStyle', String(value)), operation: 'update_property', property, value };
    }
    if (property === 'font-size') {
      const n = num(value);
      if (!Number.isFinite(n) || n < FONT_SIZE_MIN || n > FONT_SIZE_MAX) {
        return { ok: false, error: `font-size must be a number in [${FONT_SIZE_MIN}, ${FONT_SIZE_MAX}]` };
      }
      return { ok: bridge.updateSelectedProperty('fontSize', n), operation: 'update_property', property, value: n };
    }
    // color
    const color = String(value);
    if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) {
      return { ok: false, error: 'color must be a hex string like #FF0000' };
    }
    return { ok: bridge.updateSelectedProperty('color', color), operation: 'update_property', property, value: color };
  };

  const editorSwitchMode: Handler = (args) => {
    const mode = String(args.mode ?? '');
    if (!(EDITOR_MODES as readonly string[]).includes(mode)) {
      return { ok: false, error: `unknown mode: ${mode}`, allowed: EDITOR_MODES };
    }
    bridge.setViewMode(mode as 'edit' | 'preview');
    return { ok: true, operation: 'switch_mode', mode: bridge.viewMode() };
  };

  const editorPreview: Handler = () => {
    bridge.renderPreview();
    return { ok: true, operation: 'preview', mode: bridge.viewMode(), annotations: bridge.listAnnotations().length };
  };

  // ---- entity-collection-v1 (prefix "entity") ----------------------------
  // Entity = saved annotation project (the persisted saved-configuration collection).
  const entityCreate: Handler = (args) => {
    const name = String(args.name ?? '').trim();
    if (!name) return { ok: false, error: 'name is required' };
    if (!bridge.imageLoaded()) return { ok: false, error: 'load an image before saving a project' };
    const ok = bridge.saveProject(name);
    return { ok, operation: 'create', name, count: bridge.listProjects().length };
  };

  const entitySelect: Handler = (args) => {
    const id = String(args.id ?? '');
    const ok = bridge.loadProject(id);
    return { ok, operation: 'select', id };
  };

  const entityUpdate: Handler = (args) => {
    const id = String(args.id ?? '');
    const project = bridge.listProjects().find((p) => p.id === id);
    if (!project) return { ok: false, error: `no project with id ${id}` };
    const name = args.name == null ? project.name : String(args.name).trim() || project.name;
    const ok = bridge.saveProject(name);
    return { ok, operation: 'update', id, name };
  };

  const entityDelete: Handler = (args) => {
    if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
    const id = String(args.id ?? '');
    const ok = bridge.deleteProject(id);
    return { ok, operation: 'delete', id, count: bridge.listProjects().length };
  };

  // ---- artifact-transfer-v1 (prefix "artifact") --------------------------
  // Export/import/copy drive the SAME surfaces as the visible header controls.
  // The file picker (import) and Blob download / clipboard contents stay with
  // Playwright, so tool results never carry raw file/blob/base64 content — they
  // report the operation outcome plus non-content metadata only.
  const artifactExport: Handler = (args) => {
    const format = String(args.format ?? 'json');
    if (!(ARTIFACT_EXPORT_FORMATS as readonly string[]).includes(format)) {
      return { ok: false, error: `unknown export format: ${format}`, allowed: ARTIFACT_EXPORT_FORMATS };
    }
    if (!bridge.imageLoaded()) {
      return { ok: false, error: 'no image loaded; nothing to export' };
    }
    if (format === 'png') {
      bridge.triggerExportPng();
      return { ok: true, operation: 'export', format: 'png', triggered: true, annotations: bridge.projectAnnotationCount() };
    }
    // json — open the live preview panel (the same surface the header button opens)
    bridge.openExportPreview();
    return { ok: true, operation: 'export', format: 'json', previewOpened: true, schemaVersion: 'markupflow-project-v1', annotations: bridge.projectAnnotationCount(), byteLength: bridge.projectByteLength() };
  };

  const artifactImport: Handler = (args) => {
    const mode = String(args.mode ?? 'project-json');
    if (!(ARTIFACT_IMPORT_MODES as readonly string[]).includes(mode)) {
      return { ok: false, error: `unknown import mode: ${mode}`, allowed: ARTIFACT_IMPORT_MODES };
    }
    // The JSON file itself is chosen through the OS file picker (Playwright's
    // responsibility); we open the same picker the Import project button uses.
    bridge.triggerImport();
    return { ok: true, operation: 'import', mode, fileChooserOpened: true };
  };

  const artifactCopy: Handler = (args) => {
    const format = String(args.format ?? 'json');
    if (format !== 'json') {
      return { ok: false, error: `copy supports format json only, got: ${format}` };
    }
    if (!bridge.imageLoaded()) {
      return { ok: false, error: 'no image loaded; nothing to copy' };
    }
    bridge.copyProjectJson();
    return { ok: true, operation: 'copy', format: 'json', copied: true, byteLength: bridge.projectByteLength() };
  };

  const TOOLS: ToolDescriptor[] = [
    { name: 'editor_select', description: 'Select an annotation object by id (or pass id=null to clear). Same path as clicking a Layer Panel row.', handler: editorSelect },
    { name: 'editor_add', description: `Add an annotation of args.object_type (one of ${EDITOR_OBJECT_TYPES.join(', ')}) at the default placement position. Same store command as keyboard placement; drawing coordinates are not accepted.`, handler: editorAdd },
    { name: 'editor_delete', description: 'Delete an annotation by id. Requires confirm=true.', handler: editorDelete },
    { name: 'editor_update_property', description: `Update a property (${EDITOR_PROPERTIES.join(', ')}) of the currently selected annotation. Same path as the Style controls.`, handler: editorUpdateProperty },
    {
      name: 'editor_switch_mode',
      description: `Switch the workspace view mode (${EDITOR_MODES.join(', ')}). Same path as the header edit/preview buttons.`,
      handler: editorSwitchMode,
      inputSchema: {
        type: 'object',
        // Put preview first so schema-driven clients can exercise a visible
        // state transition from the default edit mode.
        properties: { mode: { type: 'string', enum: ['preview', 'edit'] } },
        required: ['mode'],
        additionalProperties: false,
      },
    },
    { name: 'editor_preview', description: 'Re-flatten the image plus annotations onto the canvas and report the current mode and annotation count.', handler: editorPreview },
    { name: 'entity_create', description: 'Save the current workspace as a named project. Same path as the Save project button.', handler: entityCreate },
    { name: 'entity_select', description: 'Open a saved project by id, restoring its image and annotations. Same path as the Open button.', handler: entitySelect },
    { name: 'entity_update', description: 'Re-save the current workspace into an existing project by id. Same path as the Update button.', handler: entityUpdate },
    { name: 'entity_delete', description: 'Delete a saved project by id. Requires confirm=true.', handler: entityDelete },
    { name: 'artifact_export', description: `Export the workspace. format=${ARTIFACT_EXPORT_FORMATS.join('|')}: png triggers the same client-side PNG flatten+download as Export PNG; json opens the live Export project JSON preview. No raw file/blob/base64 is returned.`, handler: artifactExport },
    { name: 'artifact_import', description: `Import a project. mode=${ARTIFACT_IMPORT_MODES.join('|')}: opens the same JSON file picker as the Import project button. The file content is read by the picker (Playwright), never passed through this tool.`, handler: artifactImport },
    { name: 'artifact_copy', description: 'Copy the live-compiled project JSON to the clipboard (same path as Copy project JSON) and report the byte length. Clipboard contents are not returned.', handler: artifactCopy },
  ];

  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    ...(t.inputSchema ? { inputSchema: t.inputSchema } : {}),
  }));
  w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };

  // Optional-additional: mirror onto navigator.modelContext when present.
  try {
    const nav = navigator as unknown as { modelContext?: { registerTool?: (t: unknown) => void } };
    if (nav.modelContext && typeof nav.modelContext.registerTool === 'function') {
      for (const t of TOOLS) {
        nav.modelContext.registerTool({
          name: t.name,
          description: t.description,
          ...(t.inputSchema ? { inputSchema: t.inputSchema } : {}),
          invoke: (a: Record<string, unknown>) => t.handler(a || {}),
        });
      }
    }
  } catch {
    /* navigator.modelContext is optional; window.* is the mandatory surface */
  }
}
