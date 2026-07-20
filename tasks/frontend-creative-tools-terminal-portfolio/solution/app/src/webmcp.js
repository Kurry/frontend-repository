import { mode, theme, projects, filters, sort, outputBuffer, THEMES } from './store.js';
import * as v from 'valibot';
import { ProjectSchema } from './forms.jsx';
import { processCommand } from './commands.js';

function validationMessage(result) {
  const issue = result.issues[0];
  const path = issue.path?.map(segment => segment.key).filter(key => key !== undefined).join('.') || 'project';
  return `${path}: ${issue.message}`;
}

function registerWebMCP() {
  if (typeof window === 'undefined') return;

  const registry = new Map();
  const registerTool = (name, handler, moduleId, allowedOperations) => {
    registry.set(name, {
      handler,
      definition: {
        name,
        description: `${moduleId} operations: ${allowedOperations.join(', ')}`,
        inputSchema: { type: 'object', additionalProperties: true },
      },
    });
    if (window.webmcp_register_tool) {
      window.webmcp_register_tool(name, handler, moduleId, allowedOperations);
    } else {
      window[`webmcp_tool_${name}`] = handler;
    }
  };

  // Browse / Query
  registerTool('browse', async (args) => {
    if (args.operation === 'open') {
      if (args.destinations) {
        if (args.destinations.includes('terminal-home')) {
          mode.value = 'cli';
        } else if (args.destinations.includes('about')) {
          mode.value = 'cli';
          processCommand('/about');
        } else if (args.destinations.includes('project-detail')) {
          mode.value = 'cli';
          processCommand('/work');
        } else if (args.destinations.includes('config-studio') || args.destinations.includes('profiles')) {
          mode.value = 'config';
        } else if (args.destinations.includes('export-center')) {
          mode.value = 'export';
        }
      }
    } else if (args.operation === 'set_theme') {
      if (args.themes && args.themes.length > 0) {
        const nextTheme = args.themes[0];
        if (!THEMES.includes(nextTheme)) {
          throw new Error(`theme: must be one of ${THEMES.join(', ')}`);
        }
        theme.value = nextTheme;
      }
    } else if (args.operation === 'apply_filter') {
      if (args.filters) {
        const values = { ...(args.value_bounds || {}) };
        for (const key of ['status', 'tag', 'featured']) {
          if (args[key] !== undefined) values[key] = args[key];
        }
        const next = { ...filters.value };
        if (args.filters.includes('status')) next.status = values.status ?? 'shipped';
        if (args.filters.includes('featured')) next.featured = values.featured ?? true;
        if (args.filters.includes('tag') && values.tag !== undefined) next.tag = values.tag;
        filters.value = next;
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
  registerTool('entity', async (args) => {
    if (args.entity_operations) {
      if (args.entity_operations.includes('create')) {
        if (!args.value_bounds) throw new Error('Project create requires value_bounds');
        const newProject = {
          name: args.value_bounds.name,
          slug: args.value_bounds.slug,
          year: args.value_bounds.year,
          type: args.value_bounds.type,
          summary: args.value_bounds.summary,
          status: args.value_bounds.status,
          featured: args.value_bounds.featured ?? false,
          tags: args.value_bounds.tags ?? []
        };
        const result = v.safeParse(ProjectSchema, newProject);
        if (!result.success) throw new Error(validationMessage(result));
        if (projects.value.some(project => project.slug === result.output.slug)) {
          throw new Error('slug: project slug must be unique');
        }
        if (result.output.featured && projects.value.filter(project => project.featured).length >= 3) {
          throw new Error('featured: maximum 3 featured projects allowed');
        }
        projects.value = [...projects.value, result.output];
      } else if (args.entity_operations.includes('delete')) {
        if (args.confirm !== true) throw new Error('Project delete requires confirm=true');
        const slug = args.value_bounds?.slug;
        if (!slug) throw new Error('Project delete requires value_bounds.slug');
        projects.value = projects.value.filter(p => p.slug !== slug);
      } else if (args.entity_operations.includes('update')) {
        const slug = args.value_bounds?.slug;
        if (!slug) throw new Error('Project update requires value_bounds.slug');
        const existing = projects.value.find(p => p.slug === slug);
        if (!existing) throw new Error(`No project with slug: ${slug}`);
        const merged = { ...existing, ...args.value_bounds };
        const result = v.safeParse(ProjectSchema, merged);
        if (!result.success) throw new Error(validationMessage(result));
        if (projects.value.some(project => project.slug === result.output.slug && project.slug !== slug)) {
          throw new Error('slug: project slug must be unique');
        }
        if (result.output.featured && projects.value.filter(project => project.featured && project.slug !== slug).length >= 3) {
          throw new Error('featured: maximum 3 featured projects allowed');
        }
        projects.value = projects.value.map(p => p.slug === slug ? result.output : p);
      } else if (args.entity_operations.includes('toggle')) {
        const slug = args.value_bounds?.slug;
        if (!slug) throw new Error('Project toggle requires value_bounds.slug');
        const existing = projects.value.find(p => p.slug === slug);
        if (!existing) throw new Error(`No project with slug: ${slug}`);
        const nextFeatured = !existing.featured;
        if (nextFeatured && projects.value.filter(project => project.featured).length >= 3) {
          throw new Error('featured: maximum 3 featured projects allowed');
        }
        projects.value = projects.value.map(p => p.slug === slug ? { ...p, featured: nextFeatured } : p);
      }
    }
    return { success: true };
  }, 'entity-collection-v1', ['create', 'update', 'delete', 'select', 'toggle']);

  // Artifact Transfer
  registerTool('artifact', async (args) => {
    if (args.artifact_operations && args.artifact_operations.includes('export')) {
      const format = (args.export_formats && args.export_formats[0]) || 'json';
      const formatLabels = { json: 'Portfolio JSON', config: 'Terminal Config', css: 'Theme CSS' };
      if (formatLabels[format]) {
         mode.value = 'export';
         outputBuffer.value = [...outputBuffer.value, { text: `${formatLabels[format]} ready in Export Center.`, type: 'success' }];
         return { success: true, format };
      }
      throw new Error('export format must be json, config, or css');
    } else if (args.artifact_operations && args.artifact_operations.includes('import')) {
       mode.value = 'export';
       outputBuffer.value = [...outputBuffer.value, { text: 'Import Portfolio JSON is ready in Export Center.', type: 'success' }];
       return { success: true, readyForUi: true, mode: 'declared-portfolio' };
    } else if (args.artifact_operations && args.artifact_operations.includes('copy')) {
       mode.value = 'export';
       outputBuffer.value = [...outputBuffer.value, { text: 'Copy controls are ready in Export Center.', type: 'success' }];
       return { success: true, readyForUi: true };
    }
    throw new Error('artifact operation must be export, import, or copy');
  }, 'artifact-transfer-v1', ['export', 'import', 'copy']);

  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tools: [...registry.keys()],
  });
  window.webmcp_list_tools = () => [...registry.values()].map(({ definition }) => definition);
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = registry.get(name);
    if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`);
    return tool.handler(args);
  };
}

registerWebMCP();
