const fs = require('fs');

let appJs = fs.readFileSync('tasks/frontend-creative-tools-terminal-portfolio/solution/app/assets/app.js', 'utf8');

// The WebMCP code is placed AFTER the IIFE. Let's move it inside.
const webmcpCode = `
  // ============ WEBMCP BINDINGS ============
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    client_state: state
  });

  window.webmcp_list_tools = () => [
    { name: "browse_open" },
    { name: "browse_search" },
    { name: "browse_apply_filter" },
    { name: "browse_clear_filter" },
    { name: "browse_sort" },
    { name: "browse_set_theme" },
    { name: "entity_create" },
    { name: "entity_select" },
    { name: "entity_update" },
    { name: "entity_delete" },
    { name: "entity_toggle" },
    { name: "artifact_export" },
    { name: "artifact_import" },
    { name: "artifact_copy" }
  ];

  window.webmcp_invoke_tool = async (tool_name, args = {}) => {
    switch (tool_name) {
      case 'browse_open':
        if (args.destination === 'terminal-home') { state.activeMode = 'cli'; notify(); }
        else if (args.destination === 'project-detail') { executeCommand('/' + args.slug); }
        else if (args.destination === 'about') { executeCommand('/about'); }
        else if (args.destination === 'config-studio') { state.activeMode = 'config'; notify(); }
        else if (args.destination === 'export-center') { state.activeMode = 'export'; notify(); }
        else if (args.destination === 'profiles') { state.activeMode = 'config'; notify(); }
        return { success: true };
      case 'browse_search': return { success: true };
      case 'browse_apply_filter':
        if (args.filter === 'status') state.filters.status = args.value;
        else if (args.filter === 'tag') state.filters.tag = args.value;
        else if (args.filter === 'featured') state.filters.featured = args.value === 'true' || args.value === true;
        notify();
        return { success: true };
      case 'browse_clear_filter':
        state.filters = { status: null, tag: null, featured: null };
        notify();
        return { success: true };
      case 'browse_sort':
        if (args.sort === 'name-asc' || args.sort === 'name-desc') { state.sort = args.sort; notify(); }
        return { success: true };
      case 'browse_set_theme':
        if (['dark', 'light', 'retro', 'glass'].includes(args.theme)) executeCommand('/' + args.theme);
        return { success: true };
      case 'entity_create':
        if (args.entity === 'project') {
          const newProj = {
            name: args.fields.title || args.fields.name,
            slug: args.fields.slug,
            summary: args.fields.summary,
            status: args.fields.status || 'shipped',
            tags: args.fields.tags || [],
            year: args.fields.year || 2024,
            featured: args.fields.featured || false,
            type: 'Project', desc: args.fields.summary
          };
          pushHistoryState(() => doCreateProject(newProj), () => doDeleteProject(newProj.slug));
          doCreateProject(newProj);
        }
        return { success: true };
      case 'entity_select':
        if (args.entity === 'project') executeCommand('/' + args.slug);
        return { success: true };
      case 'entity_update':
        if (args.entity === 'project') {
          const idx = state.projects.findIndex(p => p.slug === args.slug);
          if (idx !== -1) {
            const oldProj = JSON.parse(JSON.stringify(state.projects[idx]));
            const updated = { ...state.projects[idx], ...args.fields };
            if (args.fields.title) updated.name = args.fields.title;
            pushHistoryState(
              () => { const i = state.projects.findIndex(p => p.slug === oldProj.slug); if (i !== -1) state.projects[i] = updated; notify(); },
              () => { const i = state.projects.findIndex(p => p.slug === oldProj.slug); if (i !== -1) state.projects[i] = oldProj; notify(); }
            );
            state.projects[idx] = updated;
            notify();
          }
        }
        return { success: true };
      case 'entity_delete':
        if (args.entity === 'project' && args.confirm) {
          const p = state.projects.find(x => x.slug === args.slug);
          if (p) {
            pushHistoryState(() => doDeleteProject(args.slug), () => doCreateProject(p));
            doDeleteProject(args.slug);
          }
        }
        return { success: true };
      case 'entity_toggle':
        if (args.entity === 'project' && args.field === 'featured') {
          const p = state.projects.find(x => x.slug === args.slug);
          if (p) { p.featured = !p.featured; notify(); }
        }
        return { success: true };
      case 'artifact_export':
        state.activeMode = 'export'; notify(); return { success: true };
      case 'artifact_import':
        state.activeMode = 'import'; notify(); return { success: true };
      case 'artifact_copy': return { success: true };
      default: throw new Error('Unknown tool: ' + tool_name);
    }
  };
`;

// Remove the existing WebMCP block that's outside the IIFE
appJs = appJs.replace(/\/\/ ============ WEBMCP BINDINGS ============\n[\s\S]*/, '');

// Place it before the end of the IIFE
appJs = appJs.replace(/\}\)\(\)\;/, webmcpCode + '\n})();');

fs.writeFileSync('tasks/frontend-creative-tools-terminal-portfolio/solution/app/assets/app.js', appJs);

console.log('WebMCP bindings moved inside IIFE.');
