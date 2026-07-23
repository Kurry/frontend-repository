import {
  mode, theme, filters, sort, selected, configTab, outputBuffer,
  projects, createProject, updateProject, deleteProject, toggleFeatured,
  THEMES,
} from './store.js';
import { processCommand } from './commands.js';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'];
const DESTINATIONS = ['terminal-home', 'project-detail', 'about', 'config-studio', 'export-center', 'profiles'];
const FILTERS = ['status', 'tag', 'featured'];
const SORTS = ['name-asc', 'name-desc'];
const ENTITY_FIELDS = ['title', 'summary', 'slug', 'status', 'tags', 'year', 'featured'];
const EXPORT_FORMATS = ['json', 'config', 'css'];

function note(text) {
  outputBuffer.value = [...outputBuffer.value, { id: `mcp-${Date.now()}`, text, type: 'success' }];
}

function afterRender(action) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const success = action();
      resolve(success ? { success: true } : { success: false, error: 'The visible control is not available' });
    }));
  });
}

function boundedString(value, label, max = 200) {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) {
    throw new Error(`${label} must be a non-empty string of at most ${max} characters`);
  }
  return value;
}

function projectFields(args) {
  const raw = args?.fields ?? args;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const fields = {};
  if (raw.name !== undefined) fields.name = raw.name;
  else if (raw.title !== undefined) fields.name = raw.title;
  if (raw.slug !== undefined) fields.slug = raw.slug;
  if (raw.summary !== undefined) fields.summary = raw.summary;
  if (raw.status !== undefined) fields.status = raw.status;
  if (raw.year !== undefined) fields.year = typeof raw.year === 'string' ? (raw.year === '' ? '' : Number(raw.year)) : raw.year;
  if (raw.featured !== undefined) fields.featured = typeof raw.featured === 'string' ? raw.featured === 'true' : Boolean(raw.featured);
  if (raw.tags !== undefined) {
    if (typeof raw.tags === 'string') {
      try { fields.tags = JSON.parse(raw.tags); }
      catch { fields.tags = raw.tags.split(',').map((t) => t.trim()).filter(Boolean); }
    } else {
      fields.tags = raw.tags;
    }
  }
  if (raw.type !== undefined) fields.type = raw.type;
  return fields;
}

function registerWebMCP() {
  if (typeof window === 'undefined') return;

  const tools = [
    {
      name: 'browse.open', module: 'browse-query-v1', description: 'Open a declared portfolio destination.',
      handler: (args) => {
        const destination = boundedString(args.destination, 'destination', 64);
        if (!DESTINATIONS.includes(destination)) return { success: false, error: `Unknown destination: ${destination}` };
        if (destination === 'terminal-home') mode.value = 'cli';
        if (destination === 'about') { mode.value = 'cli'; processCommand('/about'); }
        if (destination === 'project-detail') { mode.value = 'cli'; processCommand('/work'); }
        if (destination === 'config-studio') { mode.value = 'config'; configTab.value = 'identity'; }
        if (destination === 'profiles') { mode.value = 'config'; configTab.value = 'profiles'; }
        if (destination === 'export-center') mode.value = 'export';
        return { success: true, destination };
      },
    },
    {
      name: 'browse.search', module: 'browse-query-v1', description: 'Search projects by visible text.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', default: 'project' } },
        required: ['query']
      },
      annotations: { readOnlyHint: true },
      handler: (args) => {
        const query = boundedString(args.query, 'query').toLowerCase();
        const matches = projects.value
          .filter((project) => [project.name, project.slug, project.summary].some((value) => String(value).toLowerCase().includes(query)))
          .map((project) => ({ id: project.slug, title: project.name }));
        return { success: true, matches };
      },
    },
    {
      name: 'browse.apply_filter', module: 'browse-query-v1', description: 'Apply one declared project filter.',
      handler: (args) => {
        const filter = boundedString(args.filter, 'filter', 32);
        if (!FILTERS.includes(filter)) return { success: false, error: `Unknown filter: ${filter}` };
        const value = args.value === undefined ? '' : String(args.value);
        const next = { ...filters.value };
        if (filter === 'status') {
          if (!['shipped', 'wip', 'archived'].includes(value)) return { success: false, error: 'status must be shipped, wip, or archived' };
          next.status = value;
        } else if (filter === 'tag') {
          next.tag = boundedString(value, 'value', 24);
        } else {
          if (value !== 'true' && value !== 'false') return { success: false, error: 'featured must be true or false' };
          next.featured = value === 'true';
        }
        filters.value = next;
        mode.value = 'board';
        return { success: true, filter, value };
      },
    },
    {
      name: 'browse.clear_filter', module: 'browse-query-v1', description: 'Clear one or all project filters.',
      handler: (args) => {
        const filter = args.filter;
        if (filter !== undefined && !FILTERS.includes(filter)) return { success: false, error: `Unknown filter: ${filter}` };
        filters.value = filter === undefined
          ? { status: null, tag: null, featured: null }
          : { ...filters.value, [filter]: null };
        mode.value = 'board';
        return { success: true, filter: filter ?? 'all' };
      },
    },
    {
      name: 'browse.sort', module: 'browse-query-v1', description: 'Apply a declared project name sort.',
      handler: (args) => {
        const nextSort = boundedString(args.sort, 'sort', 32);
        if (!SORTS.includes(nextSort)) return { success: false, error: `Unknown sort: ${nextSort}` };
        sort.value = nextSort;
        mode.value = 'board';
        return { success: true, sort: nextSort };
      },
    },
    {
      name: 'browse.set_theme', module: 'browse-query-v1', description: 'Switch to a declared portfolio theme.',
      handler: (args) => {
        const nextTheme = boundedString(args.theme, 'theme', 16);
        if (!THEMES.includes(nextTheme)) return { success: false, error: `theme must be one of ${THEMES.join(', ')}` };
        theme.value = nextTheme;
        return { success: true, theme: nextTheme };
      },
    },
    {
      name: 'entity.create', module: 'entity-collection-v1', description: 'Create a project using declared fields.',
      handler: (args) => {
        const result = createProject(projectFields(args));
        if (!result.ok) return { success: false, errors: result.errors };
        mode.value = 'board';
        return { success: true, id: result.value.slug };
      },
    },
    {
      name: 'entity.select', module: 'entity-collection-v1', description: 'Select a project by public slug.',
      handler: (args) => {
        const id = boundedString(args.id, 'id', 128);
        const project = projects.value.find((candidate) => candidate.slug === id);
        if (!project) return { success: false, error: `No project with slug ${id}` };
        selected.value = [id];
        mode.value = 'board';
        return { success: true, id };
      },
    },
    {
      name: 'entity.update', module: 'entity-collection-v1', description: 'Update declared fields on a project.',
      handler: (args) => {
        const id = boundedString(args.id, 'id', 128);
        const result = updateProject(id, projectFields(args));
        if (!result.ok) return { success: false, errors: result.errors };
        mode.value = 'board';
        return { success: true, id: result.value.slug };
      },
    },
    {
      name: 'entity.delete', module: 'entity-collection-v1', description: 'Delete a project with explicit confirmation.',
      handler: (args) => {
        const id = boundedString(args.id, 'id', 128);
        if (args.confirm !== true) return { success: false, error: 'delete requires confirm=true' };
        const result = deleteProject(id);
        if (!result.ok) return { success: false, error: `No project with slug ${id}` };
        mode.value = 'board';
        return { success: true, id };
      },
    },
    {
      name: 'entity.toggle', module: 'entity-collection-v1', description: 'Toggle the featured field on a project.',
      handler: (args) => {
        const id = boundedString(args.id, 'id', 128);
        if (args.field !== undefined && args.field !== 'featured') return { success: false, error: 'only featured is toggleable' };
        const result = toggleFeatured(id);
        if (!result.ok) return { success: false, error: result.message };
        mode.value = 'board';
        return { success: true, id, featured: result.featured };
      },
    },
    {
      name: 'artifact.import', module: 'artifact-transfer-v1', description: 'Open the declared visible Portfolio JSON import surface.',
      handler: (args) => {
        if (args.mode !== 'declared-portfolio') return { success: false, error: 'mode must be declared-portfolio' };
        mode.value = 'export';
        configTab.value = 'import';
        return afterRender(() => {
          const textarea = document.getElementById('import-textarea');
          textarea?.focus();
          return Boolean(textarea);
        }).then((result) => ({ ...result, mode: 'declared-portfolio', completed: false }));
      },
    },
    {
      name: 'artifact.export', module: 'artifact-transfer-v1', description: 'Trigger a visible declared-format download.',
      handler: (args) => {
        const format = boundedString(args.format, 'format', 16);
        if (!EXPORT_FORMATS.includes(format)) return { success: false, error: `format must be one of ${EXPORT_FORMATS.join(', ')}` };
        mode.value = 'export';
        const label = format === 'json' ? 'Portfolio JSON' : format === 'config' ? 'Terminal Config' : 'Theme CSS';
        return afterRender(() => {
          const tab = Array.from(document.querySelectorAll('[role="tab"]')).find((candidate) => candidate.textContent?.trim() === label);
          tab?.click();
          return Boolean(tab);
        }).then((tabResult) => {
          if (!tabResult.success) return tabResult;
          return afterRender(() => {
            const button = document.querySelector(`button[aria-label="Download ${label}"]`);
            button?.click();
            return Boolean(button);
          });
        }).then((result) => ({ ...result, format }));
      },
    },
    {
      name: 'artifact.copy', module: 'artifact-transfer-v1', description: 'Trigger the visible copy control for the active export tab.',
      handler: () => {
        mode.value = 'export';
        return afterRender(() => {
          const button = document.querySelector('button[aria-label^="Copy "]');
          button?.click();
          return Boolean(button);
        });
      },
    },
  ];

  const byName = new Map(tools.map((tool) => [tool.name, tool]));
  window.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    destinations: DESTINATIONS,
    tools: tools.map((tool) => tool.name),
  });
  window.webmcp_list_tools = () => tools.map(
    ({ name, module, description, inputSchema, annotations }) =>
      ({ name, module, description, inputSchema, annotations })
  );
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = byName.get(name);
    if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`);
    try { return await tool.handler(args); }
    catch (error) { return { success: false, error: error instanceof Error ? error.message : String(error) }; }
  };
}

registerWebMCP();
