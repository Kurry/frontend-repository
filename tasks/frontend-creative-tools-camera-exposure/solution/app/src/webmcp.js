import { store, setStore, APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS, resetState, undo, pushHistory } from './store';

const registerWebMCP = () => {
  if (typeof window === 'undefined') return;

  window.webmcp_tools = window.webmcp_tools || {};

  window.webmcp_register_tool = (module, operation, handler) => {
    window.webmcp_tools[`${module}_${operation}`] = handler;
  };

  // command-session-v1
  window.webmcp_register_tool('session', 'start', () => {
    return { success: true };
  });
  window.webmcp_register_tool('session', 'stop', () => {
    resetState();
    return { success: true };
  });
  window.webmcp_register_tool('session', 'restart', () => {
    resetState();
    return { success: true };
  });
  window.webmcp_register_tool('session', 'advance', () => {
    return { success: true };
  });

  // structured-editor-v1 (exposure)
  window.webmcp_register_tool('editor', 'select', (args) => {
    return { success: true };
  });

  window.webmcp_register_tool('editor', 'update_property', (args) => {
    const { property, value } = args;

    // Save state before update for undo
    pushHistory({
      aperture: store.aperture, shutter: store.shutter, iso: store.iso,
      contrast: store.contrast, highlights: store.highlights, shadows: store.shadows,
      lookPack: store.lookPack, scene: store.scene, zebraToggles: store.zebraToggles
    });

    if (property === 'aperture' && APERTURE_STOPS.includes(Number(value))) {
      setStore('aperture', Number(value));
    } else if (property === 'shutter' && SHUTTER_STOPS.includes(Number(value))) {
      setStore('shutter', Number(value));
    } else if (property === 'iso' && ISO_STOPS.includes(Number(value))) {
      setStore('iso', Number(value));
    } else if (['contrast', 'highlights', 'shadows'].includes(property)) {
      setStore(property, Number(value));
    } else {
      return { success: false, error: 'Invalid property or value' };
    }
    return { success: true, state: { ...store } };
  });

  window.webmcp_register_tool('editor', 'preview', () => {
    return { success: true, state: { ...store } };
  });

  // entity-collection-v1 (preset)
  window.webmcp_register_tool('entity', 'create', (args) => {
    const { entity, fields } = args;
    if (entity !== 'preset') return { success: false };

    const newPreset = {
      id: Date.now().toString(),
      name: fields.name,
      aperture: Number(fields.aperture),
      shutter: Number(fields.shutter),
      iso: Number(fields.iso),
      lookTag: fields.lookTag,
      favorite: fields.favorite || false,
    };

    setStore('presets', (p) => [...p, newPreset]);
    return { success: true, item: newPreset };
  });

  window.webmcp_register_tool('entity', 'select', (args) => {
    return { success: true };
  });

  window.webmcp_register_tool('entity', 'update', (args) => {
    const { entity, id, fields } = args;
    if (entity !== 'preset') return { success: false };

    setStore('presets', (preset) => preset.id === id, (preset) => ({ ...preset, ...fields }));
    return { success: true };
  });

  window.webmcp_register_tool('entity', 'delete', (args) => {
    const { entity, id, confirm } = args;
    if (entity !== 'preset' || !confirm) return { success: false };

    setStore('presets', (p) => p.filter(pr => pr.id !== id));
    return { success: true };
  });

  window.webmcp_register_tool('entity', 'toggle', (args) => {
    const { entity, id, field } = args;
    if (entity !== 'preset' || field !== 'favorite') return { success: false };

    setStore('presets', (preset) => preset.id === id, (preset) => ({ ...preset, favorite: !preset.favorite }));
    return { success: true };
  });

  // artifact-transfer-v1
  window.webmcp_register_tool('artifact', 'export', (args) => {
    // Artifact export/import actual contents are Playwright responsibilities
    return { success: true };
  });

  window.webmcp_register_tool('artifact', 'import', (args) => {
    return { success: true };
  });

  window.webmcp_register_tool('artifact', 'copy', (args) => {
    return { success: true };
  });

};

export default registerWebMCP;
