import { usePaletteStore } from './stores/palette';
import { palettePackageSchema, paletteSchema } from './paletteSchema';

const TOOLS = [
  ['browse_apply_filter', 'browse-query-v1'],
  ['browse_clear_filter', 'browse-query-v1'],
  ['browse_open', 'browse-query-v1'],
  ['entity_create', 'entity-collection-v1'],
  ['entity_select', 'entity-collection-v1'],
  ['entity_update', 'entity-collection-v1'],
  ['entity_delete', 'entity-collection-v1'],
  ['entity_toggle', 'entity-collection-v1'],
  ['artifact_export', 'artifact-transfer-v1'],
  ['artifact_import', 'artifact-transfer-v1'],
  ['artifact_copy', 'artifact-transfer-v1'],
].map(([name, module]) => ({ name, module }));

export function registerWebMCP() {
  const store = usePaletteStore();
  const ok = (extra = {}) => ({ status: 'success', ...extra });
  const error = message => ({ status: 'error', message });
  const scrollTo = id => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const handlers = {
    browse_apply_filter(args = {}) {
      if ((args.filter ?? args.filters) !== 'period') return error('Unknown filter');
      store.periodFilter = args.value ?? '';
      return ok({ value: store.periodFilter });
    },
    browse_clear_filter() {
      store.periodFilter = '';
      return ok();
    },
    browse_open(args = {}) {
      const destination = args.destination ?? args.destinations;
      const elementIds = {
        'library-grid': 'library-grid',
        'palette-detail': 'palette-detail',
        'export-drawer': 'export-drawer',
        'layout-simulator': 'layout-simulator',
        'contrast-matrix': 'contrast-matrix',
        'color-wheel': 'color-wheel',
      };
      if (!elementIds[destination]) return error('Unknown destination');
      if (destination === 'library-grid') store.activeView = 'palette';
      if (destination === 'palette-detail') store.selectedPaletteId = args.id ?? store.selectedPaletteId ?? store.palettes[0]?.id ?? null;
      scrollTo(elementIds[destination]);
      return ok({ destination });
    },
    entity_create(args = {}) {
      if (args.entity !== 'palette') return error('Unknown entity');
      const result = paletteSchema.safeParse(args.data ?? args.entity_fields ?? args.payload);
      if (!result.success) return error(result.error.issues[0].message);
      store.addPalette(result.data);
      return ok({ id: store.palettes.at(-1).id });
    },
    entity_select(args = {}) {
      if (args.entity !== 'palette' || !store.palettes.some(palette => palette.id === args.id)) return error('Palette not found');
      store.selectedPaletteId = args.id;
      scrollTo('palette-detail');
      return ok({ id: args.id });
    },
    entity_update(args = {}) {
      if (args.entity !== 'palette') return error('Unknown entity');
      if (!args.id || !store.palettes.some(palette => palette.id === args.id)) return error('Palette not found');
      const result = paletteSchema.safeParse(args.data ?? args.entity_fields ?? args.payload);
      if (!result.success) return error(result.error.issues[0].message);
      store.updatePalette(args.id, result.data);
      return ok({ id: args.id });
    },
    entity_delete(args = {}) {
      if (args.entity !== 'palette') return error('Unknown entity');
      if (!args.id || !store.palettes.some(palette => palette.id === args.id)) return error('Palette not found');
      if (!args.confirm) return error('Confirm required');
      store.deletePalette(args.id);
      return ok({ id: args.id });
    },
    entity_toggle(args = {}) {
      if (args.entity !== 'palette') return error('Unknown entity');
      if (!args.id || !store.palettes.some(palette => palette.id === args.id)) return error('Palette not found');
      store.toggleFavorite(args.id);
      return ok({ id: args.id });
    },
    artifact_export(args = {}) {
      const format = args.format ?? args.export_formats;
      if (!['css', 'utility-theme', 'scss', 'library-json'].includes(format)) return error('Invalid format');
      scrollTo('export-drawer');
      return ok({ format });
    },
    artifact_import(args = {}) {
      if ((args.mode ?? args.import_modes) !== 'library-json') return error('Invalid mode');
      try {
        const result = palettePackageSchema.safeParse(JSON.parse(args.data ?? args.payload));
        if (!result.success) {
          const issue = result.error.issues[0];
          return error(`${issue.path.join('.') || 'document'} ${issue.message}`);
        }
        store.replacePalettes(result.data.palettes);
        return ok({ count: store.palettes.length });
      } catch {
        return error('Invalid JSON');
      }
    },
    artifact_copy() {
      scrollTo('export-drawer');
      return ok();
    },
  };

  for (const [name, handler] of Object.entries(handlers)) window[`webmcp_${name}`] = handler;
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    app: 'O&A Palette Library',
    modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tools: TOOLS.map(tool => tool.name),
  });
  window.webmcp_list_tools = () => TOOLS;
  window.webmcp_invoke_tool = (name, args = {}) => handlers[name]?.(args) ?? error(`Unknown tool: ${name}`);
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
