// WebMCP surface (zto-webmcp-v1): structured-editor-v1 + entity-collection-v1
// + artifact-transfer-v1. Handlers call the exact same state actions the
// visible UI uses — no parallel copies of state.
import {
  state, activeTheme, selectTheme, selectByName, notify,
  setColor, setRadius, setFontFamily, createTheme, validateRename,
  removeTheme, importFromText, uniqueName, pushExternalHistory, snapshotState,
  syncHash,
} from './state.js';
import { COLOR_KEYS, RADIUS_VALUES, RADIUS_GROUPS, FONT_FAMILIES } from './data.js';
import { openArtifact, copyArtifact, showToast } from './ui.js';

const MODULES = [
  { id: 'structured-editor-v1', title: 'Structured editor', tool_name_prefix: 'editor' },
  { id: 'entity-collection-v1', title: 'Entity collection', tool_name_prefix: 'entity' },
  { id: 'artifact-transfer-v1', title: 'Artifact transfer', tool_name_prefix: 'artifact' },
];

const obj = (properties, required = []) => ({ type: 'object', properties, required });
const str = (description, enums) => ({ type: 'string', description, ...(enums ? { enum: enums } : {}) });

const TOOLS = [
  {
    name: 'editor_select',
    description: "Select the theme object being edited (built-in or custom). Same action as clicking a Themes panel row.",
    inputSchema: obj({
      object_type: str('Object type', ['theme']),
      name: str('Theme name to select (built-in or My themes)'),
    }, ['object_type', 'name']),
  },
  {
    name: 'editor_update_property',
    description: "Update one editor property of the active theme: a color token, a radius group, or the font family. Editing a built-in forks an editable copy, exactly like the visible editor.",
    inputSchema: obj({
      object_type: str('Object type', ['theme']),
      property: str('Editor property', ['color', 'radius', 'font']),
      token: str("For property=color: color key, e.g. '--color-primary' or 'primary'"),
      value: str("New value: #RRGGBB for color, one of 0rem/0.25rem/0.5rem/1rem/2rem for radius, or a font family id (outfit/system/serif/mono)"),
      group: str('For property=radius: radius group', RADIUS_GROUPS),
    }, ['object_type', 'property', 'value']),
  },
  {
    name: 'editor_preview',
    description: 'Refresh the live preview from the active theme tokens and optionally switch its visible tab.',
    inputSchema: obj({
      object_type: str('Object type', ['theme']),
      tab: str('Visible preview tab', ['demo', 'variants', 'palette']),
    }, ['object_type']),
  },
  {
    name: 'editor_switch_mode',
    description: "Switch the editor between 'edit' and 'compare' modes. Compare turns on the Before/After preview against the latest snapshot (saving one first if none exists) — the same state the visible Before/After toggle uses.",
    inputSchema: obj({
      object_type: str('Object type', ['theme']),
      mode: str('Editor mode', ['edit', 'compare']),
    }, ['object_type', 'mode']),
  },
  {
    name: 'entity_create',
    description: 'Create a theme entity in My themes (same as completing Hold to add theme). Selects the new theme.',
    inputSchema: obj({
      entity: str('Entity type', ['theme']),
      fields: {
        type: 'object',
        description: 'Fields for the new theme',
        properties: {
          name: str('Theme name (2-30 chars; letters, digits, spaces, - and _)'),
          tokens: { type: 'object', description: "Optional initial tokens, e.g. { colors: { '--color-primary': '#123456' } }" },
        },
      },
    }, ['entity']),
  },
  {
    name: 'entity_select',
    description: 'Select a My themes entity as the active theme.',
    inputSchema: obj({
      entity: str('Entity type', ['theme']),
      name: str('Theme name to select'),
    }, ['entity', 'name']),
  },
  {
    name: 'entity_update',
    description: 'Update fields (name and/or tokens) of a theme entity in My themes.',
    inputSchema: obj({
      entity: str('Entity type', ['theme']),
      name: str('Theme name of the entity to update (defaults to the active theme)'),
      fields: {
        type: 'object',
        properties: {
          name: str('New name'),
          tokens: { type: 'object', description: "Token patch, e.g. { colors: { '--color-primary': '#123456' }, radius: { box: '1rem' } }" },
        },
      },
    }, ['entity', 'fields']),
  },
  {
    name: 'entity_delete',
    description: 'Delete a theme entity from My themes. Requires confirm=true.',
    inputSchema: obj({
      entity: str('Entity type', ['theme']),
      name: str('Theme name to delete (defaults to the active custom theme)'),
      confirm: { type: 'boolean', description: 'Must be true to delete' },
    }, ['entity', 'confirm']),
  },
  {
    name: 'artifact_export',
    description: 'Export the active theme in the given format and open it in the visible Artifact center tab.',
    inputSchema: obj({ format: str('Export format', ['css', 'json', 'config']) }, ['format']),
  },
  {
    name: 'artifact_import',
    description: "Import the declared-theme JSON currently pasted into the visible Import theme field. Invalid payloads are rejected with named field errors and change nothing.",
    inputSchema: obj({ mode: str('Import mode', ['declared-theme']) }, ['mode']),
  },
  {
    name: 'artifact_copy',
    description: 'Copy the given artifact format of the active theme to the clipboard (same as the visible Copy button).',
    inputSchema: obj({ format: str('Format to copy', ['css', 'json', 'config']) }, ['format']),
  },
  {
    name: 'artifact_convert',
    description: 'Convert the active theme between artifact formats and show the result in the matching Artifact center tab.',
    inputSchema: obj({ conversion: str('Conversion', ['css-to-json', 'json-to-config']) }, ['conversion']),
  },
];

const err = (message) => ({ ok: false, error: message });

function normalizeColorKey(token) {
  if (!token) return null;
  const t = String(token).startsWith('--color-') ? String(token) : `--color-${token}`;
  return COLOR_KEYS.includes(t) ? t : null;
}

function applyTokenPatch(theme, tokens) {
  let changed = false;
  if (tokens && typeof tokens === 'object') {
    if (tokens.colors && typeof tokens.colors === 'object') {
      for (const [k, v] of Object.entries(tokens.colors)) {
        const key = normalizeColorKey(k);
        if (key && /^#[0-9a-fA-F]{6}$/.test(String(v))) { theme.colors[key] = String(v).toLowerCase(); changed = true; }
      }
    }
    if (tokens.radius && typeof tokens.radius === 'object') {
      for (const g of RADIUS_GROUPS) if (RADIUS_VALUES.includes(tokens.radius[g])) { theme.radius[g] = tokens.radius[g]; changed = true; }
    }
    if (tokens.size && typeof tokens.size === 'object') {
      for (const k of ['field', 'selector']) if (['xs', 'sm', 'md', 'lg', 'xl'].includes(tokens.size[k])) { theme.size[k] = tokens.size[k]; changed = true; }
    }
    if (typeof tokens.border === 'string' && ['0.5px', '1px', '1.5px', '2px'].includes(tokens.border)) { theme.border = tokens.border; changed = true; }
    if (typeof tokens.depth === 'boolean') { theme.depth = tokens.depth ? 1 : 0; changed = true; }
    if (typeof tokens.noise === 'boolean') { theme.noise = tokens.noise ? 1 : 0; changed = true; }
    if (typeof tokens.fontFamily === 'string' && FONT_FAMILIES.some((f) => f.id === tokens.fontFamily)) { theme.fontFamily = tokens.fontFamily; changed = true; }
  }
  return changed;
}

const handlers = {
  editor_select(args) {
    if (args.object_type !== 'theme') return err("object_type must be 'theme'");
    if (!selectByName(args.name)) return err(`No theme named '${args.name}'`);
    return { ok: true, active: activeTheme().name };
  },

  editor_update_property(args) {
    if (args.object_type !== 'theme') return err("object_type must be 'theme'");
    const before = snapshotState();
    if (args.property === 'color') {
      const key = normalizeColorKey(args.token || args.key);
      if (!key) return err(`Unknown color token '${args.token || args.key}'. Use keys like --color-primary.`);
      if (!setColor(key, String(args.value))) return err(`Value must be a #RRGGBB hex color (got '${args.value}')`);
    } else if (args.property === 'radius') {
      const group = RADIUS_GROUPS.includes(args.group) ? args.group : 'box';
      if (!setRadius(group, String(args.value))) return err(`radius.${group} must be one of ${RADIUS_VALUES.join(', ')}`);
    } else if (args.property === 'font') {
      const id = String(args.value).toLowerCase();
      if (!setFontFamily(id)) return err(`fontFamily must be one of ${FONT_FAMILIES.map((f) => f.id).join(', ')}`);
    } else {
      return err("property must be one of 'color', 'radius', 'font'");
    }
    pushExternalHistory(before);
    const t = activeTheme();
    return { ok: true, active: t.name, property: args.property, applied: args.property === 'color' ? { [normalizeColorKey(args.token || args.key)]: t.colors[normalizeColorKey(args.token || args.key)] } : String(args.value) };
  },

  editor_preview(args) {
    if (args.tab) {
      if (!['demo', 'variants', 'palette'].includes(args.tab)) return err("tab must be one of 'demo', 'variants', 'palette'");
      const tab = document.querySelector(`[data-tab="${args.tab}"]`);
      if (!tab) return err(`Preview tab '${args.tab}' is unavailable`);
      tab.click();
    }
    return { ok: true, preview_tab: state.previewTab, active: activeTheme().name };
  },

  editor_switch_mode(args) {
    const mode = String(args.mode || '').toLowerCase();
    if (mode !== 'edit' && mode !== 'compare') return err("mode must be 'edit' or 'compare'");
    // Drive the same state the visible Before/After toggle uses.
    const btn = document.getElementById('btn-compare');
    const wantOn = mode === 'compare';
    if ((btn?.getAttribute('aria-checked') === 'true') !== wantOn) btn?.click();
    return { ok: true, mode };
  },

  entity_create(args) {
    if (args.entity !== 'theme') return err("entity must be 'theme'");
    const fields = args.fields || {};
    const name = fields.name?.trim() ? fields.name.trim() : uniqueName('my-theme');
    const res = createTheme(name);
    if (!res.ok) return err(res.error);
    // initial tokens are part of the create gesture — no extra history entry
    if (applyTokenPatch(res.theme, fields.tokens)) notify('structure');
    return { ok: true, name: res.theme.name, count: state.customs.length };
  },

  entity_select(args) {
    if (args.entity !== 'theme') return err("entity must be 'theme'");
    if (!selectByName(args.name)) return err(`No theme named '${args.name}'`);
    return { ok: true, active: activeTheme().name };
  },

  entity_update(args) {
    if (args.entity !== 'theme') return err("entity must be 'theme'");
    const fields = args.fields || {};
    const before = snapshotState();
    let target = null;
    if (args.name) target = state.customs.find((c) => c.name === args.name || c.name === String(args.name).trim());
    if (!target) {
      const act = activeTheme();
      if (act.builtin) {
        if (!fields.name && !fields.tokens) return err('The active theme is a built-in; pass name to target a My themes entity');
      } else target = act;
    }
    if (!target) {
      // editing a built-in via entity_update forks like the visible editor
      const res = createTheme(fields.name || uniqueName(`${activeTheme().name}-edit`));
      if (!res.ok) return err(res.error);
      applyTokenPatch(res.theme, fields.tokens);
      return { ok: true, name: res.theme.name, count: state.customs.length };
    }
    state.activeId = target.id;
    if (fields.name && fields.name.trim() !== target.name) {
      const check = validateRename(fields.name);
      if (!check.ok) return err(check.error);
      const clash = state.customs.find((c) => c.id !== target.id && c.name.toLowerCase() === check.value.toLowerCase());
      if (clash) return err(`A theme named '${check.value}' already exists in My themes`);
      target.name = check.value;
    }
    applyTokenPatch(target, fields.tokens);
    pushExternalHistory(before);
    syncHash();
    notify('structure');
    return { ok: true, name: target.name };
  },

  entity_delete(args) {
    if (args.entity !== 'theme') return err("entity must be 'theme'");
    if (args.confirm !== true) return err('entity_delete requires confirm=true');
    let target = null;
    if (args.name) target = state.customs.find((c) => c.name === String(args.name).trim() || c.name === args.name);
    if (!target) {
      const act = activeTheme();
      if (!act.builtin && !args.name) target = act;
    }
    if (!target) return err(`No My themes entity named '${args.name || '(active)'}'`);
    const res = removeTheme(target.id, false);
    if (!res.ok) return err(res.error);
    return { ok: true, deleted: target.name, count: state.customs.length };
  },

  artifact_export(args) {
    const fmt = String(args.format || '').toLowerCase();
    if (!['css', 'json', 'config'].includes(fmt)) return err("format must be one of 'css', 'json', 'config'");
    openArtifact(fmt, { focus: false });
    return { ok: true, format: fmt, theme: activeTheme().name };
  },

  artifact_import(args) {
    if (args.mode !== 'declared-theme') return err("mode must be 'declared-theme'");
    const field = document.getElementById('import-src');
    const text = field?.value || '';
    if (!text.trim()) return err('The visible Import theme field is empty — paste a declared-theme JSON payload first');
    const res = importFromText(text);
    if (!res.ok) return { ok: false, errors: res.errors };
    return { ok: true, imported: res.theme.name, count: state.customs.length };
  },

  async artifact_copy(args) {
    const fmt = String(args.format || '').toLowerCase();
    if (!['css', 'json', 'config'].includes(fmt)) return err("format must be one of 'css', 'json', 'config'");
    await copyArtifact(fmt);
    return { ok: true, format: fmt };
  },

  artifact_convert(args) {
    const conv = String(args.conversion || '').toLowerCase();
    if (conv !== 'css-to-json' && conv !== 'json-to-config') return err("conversion must be 'css-to-json' or 'json-to-config'");
    const target = conv === 'css-to-json' ? 'json' : 'config';
    openArtifact(target, { focus: false });
    return { ok: true, conversion: conv, format: target };
  },
};

export function registerWebMCP() {
  const afterRender = async (result) => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return result;
  };
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    app: 'daisyui-theme-generator',
    modules: MODULES,
  });

  window.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));

  window.webmcp_invoke_tool = async (name, args = {}) => {
    const handler = handlers[name];
    if (!handler) return { ok: false, error: `Unknown tool '${name}'` };
    try {
      return afterRender(await handler(args || {}));
    } catch (e) {
      return { ok: false, error: `Tool '${name}' failed: ${e?.message || e}` };
    }
  };

  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
