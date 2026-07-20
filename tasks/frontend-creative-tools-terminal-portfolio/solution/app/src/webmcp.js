import { mode, theme, projects, filters, sort, outputBuffer } from './store.js';

function registerWebMCP() {
  if (typeof window === 'undefined') return;

  // Polyfill WebMCP if not present
  if (!window.webmcp_register_tool) {
    window.webmcp_register_tool = (name, handler, module_id, allowed_ops) => {
      window[`webmcp_tool_${name}`] = handler;
    };
  }

  // Browse / Query
  window.webmcp_register_tool('browse', async (args) => {
    if (args.operation === 'open') {
      if (args.destinations) {
        if (args.destinations.includes('terminal-home')) mode.value = 'cli';
        else if (args.destinations.includes('config-studio')) mode.value = 'config';
        else if (args.destinations.includes('export-center')) mode.value = 'export';
      }
    } else if (args.operation === 'set_theme') {
      if (args.themes && args.themes.length > 0) {
        theme.value = args.themes[0];
      }
    } else if (args.operation === 'apply_filter') {
      if (args.filters) {
        if (args.filters.includes('status')) filters.value = { ...filters.value, status: 'shipped' };
        if (args.filters.includes('featured')) filters.value = { ...filters.value, featured: true };
      }
    } else if (args.operation === 'clear_filter') {
      filters.value = { status: null, tag: null, featured: null };
    } else if (args.operation === 'sort') {
      if (args.sorts && args.sorts.length > 0) {
        sort.value = args.sorts[0];
      }
    }
    return { success: true };
  }, 'browse-query-v1', ['open', 'apply_filter', 'clear_filter', 'sort', 'set_theme']);

  // Entity Collection
  window.webmcp_register_tool('entity', async (args) => {
    if (args.entity_operations) {
      if (args.entity_operations.includes('create')) {
        if (args.value_bounds) {
           const newProject = {
             name: args.value_bounds.name || 'Mock Project',
             slug: args.value_bounds.slug || 'mock-project-' + Date.now(),
             year: args.value_bounds.year || 2024,
             type: args.value_bounds.type || 'Mock Type',
             desc: args.value_bounds.desc || 'Mock Description',
             status: args.value_bounds.status || 'shipped',
             featured: args.value_bounds.featured || false,
             tags: args.value_bounds.tags || []
           };
           projects.value = [...projects.value, newProject];
        }
      } else if (args.entity_operations.includes('delete')) {
        if (args.value_bounds && args.value_bounds.slug) {
           projects.value = projects.value.filter(p => p.slug !== args.value_bounds.slug);
        } else {
           projects.value = [];
        }
      } else if (args.entity_operations.includes('update')) {
        if (args.value_bounds && args.value_bounds.slug) {
          projects.value = projects.value.map(p => p.slug === args.value_bounds.slug ? { ...p, ...args.value_bounds } : p);
        }
      }
    }
    return { success: true };
  }, 'entity-collection-v1', ['create', 'update', 'delete', 'select', 'toggle']);

  // Artifact Transfer
  window.webmcp_register_tool('artifact', async (args) => {
    if (args.artifact_operations && args.artifact_operations.includes('export')) {
      const format = (args.export_formats && args.export_formats[0]) || 'json';
      if (format === 'json') {
         return { success: true, preview: JSON.stringify(projects.value) };
      }
    } else if (args.artifact_operations && args.artifact_operations.includes('import')) {
       // Ignore actual import logic for simplicity unless required
    }
    return { success: true };
  }, 'artifact-transfer-v1', ['export', 'import', 'copy']);
}

registerWebMCP();
