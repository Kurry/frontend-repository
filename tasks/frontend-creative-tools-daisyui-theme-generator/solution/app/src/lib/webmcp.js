import { get } from 'svelte/store';
import {
  activeTheme,
  activeThemeId,
  artifactOpen,
  createTheme,
  customThemes,
  importDraft,
  importThemeObject,
  openArtifact,
  previewTab,
  removeTheme,
  renameActive,
  selectTheme,
  setCompare,
  updateColor,
  updateFontFamily,
  updateRadius,
} from './stores.js';
import { builtins } from './themes.js';
import { colorKeys, fontFamilies, radiusValues } from './schema.js';

const ok = (result = {}) => ({ status: 'success', result });
const fail = (error) => ({ status: 'error', error });

const themeByName = (name) => [...builtins, ...get(customThemes)].find(
  (theme) => theme.name.toLowerCase() === String(name || '').toLowerCase()
);

const selectByName = (name) => {
  const item = themeByName(name);
  if (!item) return fail('Theme was not found');
  selectTheme(item.id);
  return ok({ selected: item.name });
};

const handlers = {
  editor_select: ({ name }) => selectByName(name),

  editor_update_property: ({ property, key, token, value }) => {
    const field = key || token;
    if (property === 'color') {
      const colorKey = String(field || '').replace(/^--color-/, '');
      if (!colorKeys.includes(colorKey)) return fail('Unknown color token');
      updateColor(colorKey, value);
      return ok({ theme: get(activeTheme).name, property: 'color', key: colorKey, value });
    }
    if (property === 'radius') {
      const radiusKey = String(field || '').replace(/^--radius-/, '');
      const map = { box: 'box', field: 'field', selector: 'selector', '--radius-box': 'box', '--radius-field': 'field', '--radius-selector': 'selector' };
      const mapped = map[field] || map[radiusKey];
      if (!mapped || !radiusValues.includes(value)) return fail('Radius value is not editable');
      updateRadius(mapped, value);
      return ok({ theme: get(activeTheme).name, property: 'radius', key: mapped, value });
    }
    if (property === 'font') {
      if (!fontFamilies.includes(value)) return fail('Font family is not supported');
      updateFontFamily(value);
      return ok({ theme: get(activeTheme).name, property: 'font', value });
    }
    return fail('Property is not editable');
  },

  editor_preview: ({ mode = 'edit' } = {}) => {
    if (mode === 'compare') {
      setCompare(true);
      previewTab.set('palette');
    } else {
      setCompare(false);
      previewTab.set('demo');
    }
    return ok({ mode, compare: mode === 'compare' });
  },

  entity_create: ({ name } = {}) => {
    const result = createTheme(name);
    if (!result.ok) return fail(result.error);
    return ok({ name: result.theme.name, id: result.theme.id });
  },

  entity_select: ({ name, id } = {}) => {
    if (id) {
      if (builtins.some((theme) => theme.id === id) || get(customThemes).some((theme) => theme.id === id)) {
        selectTheme(id);
        return ok({ selected: get(activeTheme).name });
      }
      return fail('Theme was not found');
    }
    return selectByName(name);
  },

  entity_update: ({ id, field, token, key, value } = {}) => {
    if (id && id !== get(activeThemeId)) {
      const match = get(customThemes).find((theme) => theme.id === id);
      if (!match) return fail('Select the theme before updating it');
      selectTheme(id);
    }
    if (field === 'name') {
      const result = renameActive(value);
      return result.ok ? ok({ name: value }) : fail(result.error);
    }
    if (field === 'tokens') {
      const colorKey = String(token || key || '').replace(/^--color-/, '');
      if (colorKeys.includes(colorKey)) {
        updateColor(colorKey, value);
        return ok({ field, key: colorKey, value });
      }
      const radiusKey = String(token || key || '').replace(/^--radius-/, '');
      if (['box', 'field', 'selector'].includes(radiusKey) && radiusValues.includes(value)) {
        updateRadius(radiusKey, value);
        return ok({ field, key: radiusKey, value });
      }
      if ((token === 'fontFamily' || key === 'fontFamily') && fontFamilies.includes(value)) {
        updateFontFamily(value);
        return ok({ field, key: 'fontFamily', value });
      }
    }
    return fail('Entity field is not editable');
  },

  entity_delete: ({ id, confirm } = {}) => {
    if (confirm !== true) return fail('Delete requires confirm=true');
    const target = id || get(activeThemeId);
    const removed = removeTheme(target, true);
    return removed ? ok({ id: target }) : fail('Theme could not be deleted');
  },

  artifact_export: ({ format } = {}) => {
    if (!['css', 'json', 'config'].includes(format)) return fail('Unsupported export format');
    openArtifact(format);
    return ok({ format, theme: get(activeTheme).name });
  },

  artifact_import: ({ mode } = {}) => {
    if (mode !== 'declared-theme') return fail('Unsupported import mode');
    openArtifact('json');
    const raw = get(importDraft).trim();
    if (!raw) return fail('Paste declared-theme JSON into the visible Import field, then invoke again');
    try {
      const result = importThemeObject(JSON.parse(raw));
      if (!result.ok) return fail(result.error);
      importDraft.set('');
      return ok({ name: result.theme.name });
    } catch {
      return fail('Import theme error: payload must be valid JSON');
    }
  },

  artifact_copy: ({ format } = {}) => {
    if (!['css', 'json', 'config'].includes(format)) return fail('Unsupported copy format');
    openArtifact(format);
    return ok({ format, theme: get(activeTheme).name, visiblePostcondition: 'Use Copy in the Artifact center' });
  },

  artifact_convert: ({ mode } = {}) => {
    if (!['css-to-json', 'json-to-config'].includes(mode)) return fail('Unsupported conversion mode');
    openArtifact(mode === 'json-to-config' ? 'config' : 'json');
    return ok({ mode, theme: get(activeTheme).name });
  },
};

const TOOLS = Object.keys(handlers).map((name) => ({ name }));

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tools: TOOLS.map((tool) => tool.name),
  });
  window.webmcp_list_tools = () => ({ tools: TOOLS });
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const handler = handlers[name];
    if (!handler) return fail(`Unsupported tool: ${name}`);
    try {
      return handler(args || {});
    } catch (error) {
      return fail(error.message || String(error));
    }
  };
}
