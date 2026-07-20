import { usePaletteStore } from './stores/palette';

export function registerWebMCP() {
  const store = usePaletteStore();

  window.webmcp_browse_apply_filter = (args) => {
    if (args.filter === 'period') {
      store.periodFilter = args.value;
      return { status: 'success' };
    }
    return { status: 'error', message: 'Unknown filter' };
  };

  window.webmcp_browse_clear_filter = () => {
    store.periodFilter = '';
    return { status: 'success' };
  };

  window.webmcp_browse_open = (args) => {
    if (['library-grid', 'palette-detail', 'export-drawer', 'layout-simulator', 'contrast-matrix', 'color-wheel'].includes(args.destination)) {
      // simulate navigation or view switch if mapped
      return { status: 'success' };
    }
    return { status: 'error', message: 'Unknown destination' };
  };

  window.webmcp_entity_create = (args) => {
    if (args.entity === 'palette') {
      store.addPalette(args.data);
      return { status: 'success', id: store.palettes[store.palettes.length - 1].id };
    }
    return { status: 'error' };
  };

  window.webmcp_entity_select = (args) => {
    if (args.entity === 'palette') {
      store.selectedPaletteId = args.id;
      return { status: 'success' };
    }
    return { status: 'error' };
  };

  window.webmcp_entity_update = (args) => {
    if (args.entity === 'palette') {
      store.updatePalette(args.id, args.data);
      return { status: 'success' };
    }
    return { status: 'error' };
  };

  window.webmcp_entity_delete = (args) => {
    if (args.entity === 'palette') {
      if (!args.confirm) return { status: 'error', message: 'Confirm required' };
      store.deletePalette(args.id);
      return { status: 'success' };
    }
    return { status: 'error' };
  };

  window.webmcp_entity_toggle = (args) => {
     if (args.entity === 'palette') {
        store.toggleFavorite(args.id);
        return { status: 'success' };
     }
     return { status: 'error' };
  };

  window.webmcp_artifact_export = (args) => {
     const validFormats = ['css', 'utility-theme', 'scss', 'library-json'];
     if (!validFormats.includes(args.format)) {
        return { status: 'error', message: 'Invalid format' };
     }
     // Normally triggers a download. In MCP, we acknowledge the action.
     return { status: 'success' };
  };

  window.webmcp_artifact_import = (args) => {
     if (args.mode !== 'library-json') return { status: 'error', message: 'Invalid mode' };
     try {
       const parsed = JSON.parse(args.data);
       store.palettes = parsed;
       return { status: 'success' };
     } catch (e) {
       return { status: 'error', message: 'Invalid JSON' };
     }
  };

  window.webmcp_artifact_copy = () => {
    return { status: 'success' };
  };
}
