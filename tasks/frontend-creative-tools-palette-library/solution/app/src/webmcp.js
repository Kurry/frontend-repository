import { usePaletteStore } from './stores/palette';
import { palettePackageSchema, paletteSchema, PALETTE_PERIODS, buildPalettePackage } from './paletteSchema';
import { slugify } from './colorUtils';
import { writeClipboard, scrollToId } from './composables/useDialog';

// Exactly the declared operations from the Bindings block — nothing more.
const TOOLS = [
  { name: 'browse_open', module: 'browse-query-v1' },
  { name: 'browse_apply_filter', module: 'browse-query-v1' },
  { name: 'browse_clear_filter', module: 'browse-query-v1' },
  { name: 'entity_create', module: 'entity-collection-v1' },
  { name: 'entity_select', module: 'entity-collection-v1' },
  { name: 'entity_update', module: 'entity-collection-v1' },
  { name: 'entity_delete', module: 'entity-collection-v1' },
  { name: 'entity_toggle', module: 'entity-collection-v1' },
  { name: 'artifact_export', module: 'artifact-transfer-v1' },
  { name: 'artifact_import', module: 'artifact-transfer-v1' },
  { name: 'artifact_copy', module: 'artifact-transfer-v1' },
];

const DESTINATIONS = [
  'library-grid',
  'palette-detail',
  'export-drawer',
  'layout-simulator',
  'contrast-matrix',
  'color-wheel',
];

const EXPORT_FORMATS = ['css', 'utility-theme', 'scss', 'library-json'];

export function registerWebMCP() {
  const store = usePaletteStore();
  const ok = (extra = {}) => ({ status: 'success', ...extra });
  const error = (message) => ({ status: 'error', message });

  const findPalette = (id) => store.palettes.find((p) => p.id === id);

  const handlers = {
    // ---- browse-query-v1 -------------------------------------------------
    browse_open(args = {}) {
      const destination = args.destination ?? args.destinations;
      if (!DESTINATIONS.includes(destination)) {
        return error(`Unknown destination: ${destination}. Declared: ${DESTINATIONS.join(', ')}`);
      }
      if (destination === 'library-grid') {
        store.activeView = 'palette';
        store.detailOpen = false;
        scrollToId('library-grid');
      } else if (destination === 'palette-detail') {
        const id = args.id ?? store.selectedPaletteId ?? store.palettes[0]?.id;
        if (!findPalette(id)) return error('No palette available to open');
        store.openDetail(id);
        scrollToId('palette-detail');
      } else if (destination === 'export-drawer') {
        if (args.format && EXPORT_FORMATS.includes(args.format)) store.exportFormat = args.format;
        store.exportOpen = true;
        scrollToId('export-drawer');
      } else if (destination === 'layout-simulator') {
        store.simulatorOpen = true;
        scrollToId('layout-simulator');
      } else if (destination === 'contrast-matrix' || destination === 'color-wheel') {
        const id = args.id ?? store.selectedPaletteId ?? store.palettes[0]?.id;
        if (!findPalette(id)) return error('No palette available to open');
        store.openDetail(id);
        scrollToId(destination);
      }
      return ok({ destination, visible: true });
    },

    browse_apply_filter(args = {}) {
      if ((args.filter ?? args.filters) !== 'period') return error("Only the 'period' filter is declared");
      const value = args.value ?? '';
      if (value !== '' && !PALETTE_PERIODS.includes(value)) {
        return error(`Unknown period: ${value}`);
      }
      store.periodFilter = value;
      return ok({ filter: 'period', value: store.periodFilter, visible: true });
    },

    browse_clear_filter() {
      store.periodFilter = '';
      return ok({ filter: 'period', value: '', visible: true });
    },

    // ---- entity-collection-v1 ---------------------------------------------
    entity_create(args = {}) {
      if (args.entity !== 'palette') return error("Only the 'palette' entity is declared");
      const result = paletteSchema.safeParse(args.data ?? args.entity_fields ?? args.payload);
      if (!result.success) return error(firstIssue(result));
      const created = store.addPalette(result.data);
      return ok({ id: created.id, count: store.palettes.length, visible: true });
    },

    entity_select(args = {}) {
      if (args.entity !== 'palette') return error("Only the 'palette' entity is declared");
      if (!findPalette(args.id)) return error('Palette not found');
      store.openDetail(args.id);
      return ok({ id: args.id, visible: true });
    },

    entity_update(args = {}) {
      if (args.entity !== 'palette') return error("Only the 'palette' entity is declared");
      const existing = findPalette(args.id);
      if (!existing) return error('Palette not found');
      const patch = args.data ?? args.entity_fields ?? args.payload ?? {};
      const merged = {
        name: patch.name ?? existing.name,
        period: patch.period ?? existing.period,
        swatches: patch.swatches ?? existing.swatches,
        favorite: patch.favorite ?? existing.favorite ?? false,
      };
      const result = paletteSchema.safeParse(merged);
      if (!result.success) return error(firstIssue(result));
      store.updatePalette(args.id, result.data);
      return ok({ id: args.id, visible: true });
    },

    entity_delete(args = {}) {
      if (args.entity !== 'palette') return error("Only the 'palette' entity is declared");
      if (!findPalette(args.id)) return error('Palette not found');
      if (args.confirm !== true) return error('Delete requires confirm=true');
      store.deletePalette(args.id);
      return ok({ id: args.id, count: store.palettes.length, visible: true });
    },

    entity_toggle(args = {}) {
      if (args.entity !== 'palette') return error("Only the 'palette' entity is declared");
      const existing = findPalette(args.id);
      if (!existing) return error('Palette not found');
      store.toggleFavorite(args.id);
      return ok({ id: args.id, favorite: !existing.favorite, visible: true });
    },

    // ---- artifact-transfer-v1 ----------------------------------------------
    artifact_export(args = {}) {
      const format = args.format ?? args.export_formats;
      if (!EXPORT_FORMATS.includes(format)) {
        return error(`Invalid format: ${format}. Declared: ${EXPORT_FORMATS.join(', ')}`);
      }
      store.exportFormat = format;
      store.exportOpen = true;
      scrollToId('export-drawer');
      return ok({ format, visible: true });
    },

    async artifact_copy(args = {}) {
      const format = args.format ?? store.exportFormat;
      if (!EXPORT_FORMATS.includes(format)) {
        return error(`Invalid format: ${format}. Declared: ${EXPORT_FORMATS.join(', ')}`);
      }
      store.exportFormat = format;
      store.exportOpen = true;
      const text = artifactText(store, format);
      const copied = await writeClipboard(text);
      return ok({ format, copied, visible: true });
    },

    artifact_import(args = {}) {
      if ((args.mode ?? args.import_modes) !== 'library-json') {
        return error("Only the 'library-json' import mode is declared");
      }
      let parsed;
      try {
        parsed = typeof (args.data ?? args.payload) === 'string' ? JSON.parse(args.data ?? args.payload) : args.data ?? args.payload;
      } catch {
        return error('Invalid package: the payload is not valid JSON');
      }
      const result = palettePackageSchema.safeParse(parsed);
      if (!result.success) return error(firstIssue(result, 'Invalid package'));
      store.replacePalettes(result.data.palettes);
      return ok({ count: store.palettes.length, visible: true });
    },
  };

  function firstIssue(result, prefix = 'Invalid palette') {
    const issue = result.error.issues[0];
    const where = issue.path.length ? issue.path.join('.') : 'document';
    return `${prefix}: ${where} — ${issue.message}`;
  }

  for (const [name, handler] of Object.entries(handlers)) {
    window[`webmcp_${name}`] = handler;
  }

  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    app: 'O&A Palette Library',
    modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tools: TOOLS.map((t) => t.name),
  });
  window.webmcp_list_tools = () => TOOLS;
  window.webmcp_invoke_tool = (name, args = {}) =>
    handlers[name] ? handlers[name](args) : error(`Unknown tool: ${name}`);
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}

/** Same artifact text the visible export drawer preview shows. */
function artifactText(store, format) {
  const palettes = store.palettes;
  if (format === 'css') {
    let out = '/* O&A Palette Library — exported CSS custom properties */\n';
    for (const p of palettes) {
      out += `\n/* ${p.name} — ${p.period} */\n.palette-${slugify(p.name)} {\n`;
      p.swatches.forEach((hex, i) => {
        out += `  --swatch-${i + 1}: ${hex};\n`;
      });
      out += '}\n';
    }
    return out;
  }
  if (format === 'utility-theme') {
    let out = '// O&A Palette Library — theme.extend.colors\nexport const theme = {\n  extend: {\n    colors: {\n';
    for (const p of palettes) {
      out += `      '${slugify(p.name)}': [${p.swatches.map((s) => `'${s}'`).join(', ')}], // ${p.name}\n`;
    }
    return `${out}    },\n  },\n};\n`;
  }
  if (format === 'scss') {
    let out = '// O&A Palette Library — $palettes map\n$palettes: (\n';
    for (const p of palettes) {
      out += `  '${slugify(p.name)}': (${p.swatches.join(', ')}), // ${p.name}\n`;
    }
    return `${out});\n`;
  }
  return JSON.stringify(buildPalettePackage(palettes), null, 2);
}
