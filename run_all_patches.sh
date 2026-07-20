#!/bin/bash
set -e
echo "Running patches..."

cd tasks/frontend-creative-tools-terminal-portfolio/solution/app

cat << 'JS1' > patch_state.js
const fs = require('fs');
let appJs = fs.readFileSync('assets/app.js', 'utf8');

const stateStoreCode = \`
  // ============ CENTRAL STATE ============
  const state = {
    projects: [...PROJECTS],
    identity: {
      displayName: 'Your Name',
      email: 'hello@example.com',
      location: 'Your City, Country',
      bio: 'Product designer and Design Systems Lead'
    },
    skills: [
      { name: 'Product Design', pct: 97 },
      { name: 'Design Systems', pct: 95 },
      { name: 'UX Research & Strategy', pct: 90 },
      { name: 'UI & Visual Design', pct: 95 },
      { name: 'Data Visualization', pct: 88 },
      { name: 'Brand & Identity', pct: 85 },
      { name: 'Design Leadership', pct: 92 },
      { name: 'Accessibility (WCAG)', pct: 90 },
      { name: 'Prototyping & Motion', pct: 85 },
      { name: 'Workshop Facilitation', pct: 88 }
    ],
    featuredSlugs: [],
    profiles: [],
    theme: 'dark',
    consent: 'not_set',
    activeMode: 'cli',
    filters: { status: null, tag: null, featured: null },
    sort: 'name-asc',
    history: [],
    undoStack: [],
    redoStack: []
  };

  const listeners = [];
  function subscribe(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(fn => fn(state)); }

  // Normalize project slugs and types
  state.projects = state.projects.map(p => {
    return {
      name: p.name || p.title,
      slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      summary: p.summary || p.desc,
      status: p.status || 'shipped',
      tags: p.tags || [],
      year: parseInt(p.year) || 2024,
      featured: p.featured || false,
      type: p.type,
      stats: p.stats
    };
  });
\`;

appJs = appJs.replace('// ============ COMMAND FUNCTIONS ============', stateStoreCode + '\\n  // ============ COMMAND FUNCTIONS ============');

const updateProjectsCommand = \`
  let PROJECT_COMMANDS = {};
  function updateProjectCommands() {
    PROJECT_COMMANDS = {};
    state.projects.forEach(p => {
      PROJECT_COMMANDS['/' + p.slug] = { desc: p.name, fn: () => cmdProject(p.slug) };
    });
  }
  updateProjectCommands();
  subscribe(updateProjectCommands);
\`;

appJs = appJs.replace(/const PROJECT_COMMANDS = \\{[\\s\\S]*?\\}\\;/m, updateProjectsCommand);

fs.writeFileSync('assets/app.js', appJs);
JS1
node patch_state.js

cat << 'JS2' > patch_work.js
const fs = require('fs');
let appJs = fs.readFileSync('assets/app.js', 'utf8');

appJs = appJs.replace(
  /function cmdWork\\(\\)\s*\\{[\\s\\S]*?return container;\\s*\\}/,
  \`function cmdWork() { state.activeMode = 'board'; notify(); return [{ text: 'Opening Projects Board...', cls: 'accent' }]; }\`
);

appJs = appJs.replace(
  /function cmdProject\\(projectName\\) \\{[\\s\\S]*?return container;\\s*\\}/,
  \`function cmdProject(projectName) {
    const project = state.projects.find(p => p.name === projectName || p.slug === projectName);
    if (!project) return [{ text: '  Project "' + projectName + '" not found.', cls: 'red' }];
    const container = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = \\`
      <span class="project-year">\\\${project.year}</span>
      <div class="project-name">\\\${project.name}</div>
      <div class="project-type">\\\${project.type || 'Project'}</div>
      <div class="project-desc">\\\${project.summary}</div>
      <div class="project-tags">\\\${project.tags.map(t => \\\`<span class="project-tag">\\\${t}</span>\\\`).join('')}</div>
      \\\${project.stats ? \\\`<div class="project-stats">\\\${project.stats.map(s => \\\`<span class="project-stat">✦ \\\${s}</span>\\\`).join('')}</div>\\\` : ''}
      \\\${project.status ? \\\`<div class="project-status">\\\${project.status}</div>\\\` : ''}
    \\`;
    container.appendChild(card);
    const hint = document.createElement('div');
    hint.className = 'output-line dim';
    hint.style.marginTop = '12px';
    hint.textContent = '  → /work for all projects  •  /contact to discuss this project';
    container.appendChild(hint);
    return container;
  }\`
);

fs.writeFileSync('assets/app.js', appJs);
JS2
node patch_work.js

cat << 'JS3' > patch_shell_ops.js
const fs = require('fs');
let appJs = fs.readFileSync('assets/app.js', 'utf8');

const shellCommands = \`
  const SHELL_OPS = {
    '/create': { desc: 'Create a new project', fn: () => [{ text: 'Use Config Studio to create projects. /config', cls: 'accent' }] },
    '/delete': { desc: 'Delete a project', fn: () => [{ text: 'Use Config Studio to delete projects. /config', cls: 'accent' }] },
    '/edit': { desc: 'Edit a project', fn: () => [{ text: 'Use Config Studio to edit projects. /config', cls: 'accent' }] },
    '/undo': { desc: 'Undo last action', fn: cmdUndo },
    '/redo': { desc: 'Redo last undone action', fn: cmdRedo },
    '/export': { desc: 'Export portfolio JSON', fn: () => { state.activeMode = 'export'; notify(); return [{ text: 'Opening Export Center...', cls: 'accent' }]; } },
    '/import': { desc: 'Import portfolio JSON', fn: () => { state.activeMode = 'import'; notify(); return [{ text: 'Opening Import interface...', cls: 'accent' }]; } }
  };
  Object.assign(NAV_COMMANDS, SHELL_OPS);

  function pushHistoryState(action, reverseAction) {
    state.undoStack.push({ action, reverseAction });
    state.redoStack = [];
    notify();
  }

  function cmdUndo() {
    if (state.undoStack.length === 0) return [{ text: 'Nothing to undo.', cls: 'dim' }];
    const lastOp = state.undoStack.pop();
    state.redoStack.push(lastOp);
    lastOp.reverseAction();
    notify();
    return [{ text: 'Undo successful.', cls: 'accent' }];
  }

  function cmdRedo() {
    if (state.redoStack.length === 0) return [{ text: 'Nothing to redo.', cls: 'dim' }];
    const nextOp = state.redoStack.pop();
    state.undoStack.push(nextOp);
    nextOp.action();
    notify();
    return [{ text: 'Redo successful.', cls: 'accent' }];
  }

  function doCreateProject(projectData) {
    state.projects.push(projectData);
    PROJECT_COMMANDS['/' + projectData.slug] = { desc: projectData.name, fn: () => cmdProject(projectData.slug) };
    notify();
  }

  function doDeleteProject(slug) {
    const idx = state.projects.findIndex(p => p.slug === slug);
    if (idx !== -1) {
      state.projects.splice(idx, 1);
      delete PROJECT_COMMANDS['/' + slug];
      notify();
    }
  }
\`;

appJs = appJs.replace(
  /\\/\\/ ============ EVENT LISTENERS ============\\n/,
  shellCommands + '\\n  // ============ EVENT LISTENERS ============\\n'
);

// Add /config to NAV_COMMANDS directly
appJs = appJs.replace(
  /const NAV_COMMANDS = \\{/,
  \`const NAV_COMMANDS = {
    '/config': {
      desc: 'Open Config Studio',
      fn: () => { state.activeMode = 'config'; notify(); return [{text: 'Opening Config Studio...', cls: 'accent'}]; }
    },\`
);

fs.writeFileSync('assets/app.js', appJs);
JS3
node patch_shell_ops.js

cat << 'JS4' > patch_modes.js
const fs = require('fs');
let appJs = fs.readFileSync('assets/app.js', 'utf8');

const modeToggling = \`
  function renderActiveMode() {
    const welcomeBox = document.getElementById('welcomeBox');
    const outputArea = document.getElementById('outputArea');
    const inputArea = document.querySelector('.input-area');
    const terminalBody = document.getElementById('terminalBody');

    ['projectsBoard', 'configStudio', 'exportCenter', 'importCenter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    if (state.activeMode === 'cli') {
      welcomeBox.style.display = 'flex';
      outputArea.style.display = 'block';
      inputArea.style.display = 'flex';
      return;
    }

    welcomeBox.style.display = 'none';
    outputArea.style.display = 'none';
    inputArea.style.display = 'none';

    if (state.activeMode === 'board') {
      const board = document.createElement('div');
      board.id = 'projectsBoard';
      board.className = 'projects-board-mode p-4';
      board.innerHTML = \\\`<div class="output-line heading mb-4">Projects Board</div>\\\`;

      const controls = document.createElement('div');
      controls.className = 'board-controls flex gap-2 mb-4';
      controls.innerHTML = \\`
        <button type="button" id="btnFilterShipped" class="btn btn-sm \\\${state.filters.status === 'shipped' ? 'btn-primary' : ''}">Shipped</button>
        <button type="button" id="btnFilterWip" class="btn btn-sm \\\${state.filters.status === 'wip' ? 'btn-primary' : ''}">WIP</button>
        <button type="button" id="btnFilterArchived" class="btn btn-sm \\\${state.filters.status === 'archived' ? 'btn-primary' : ''}">Archived</button>
        <button type="button" id="btnClearFilter" class="btn btn-sm">Clear Filter</button>
        <button type="button" id="btnSortName" class="btn btn-sm">\\\${state.sort === 'name-asc' ? 'Sort Z-A' : 'Sort A-Z'}</button>
        <button type="button" id="btnBackToCli" class="btn btn-sm btn-outline">Back to CLI</button>
      \\`;
      board.appendChild(controls);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

      let displayProjects = state.projects.filter(p => {
        if (state.filters.status && p.status !== state.filters.status) return false;
        if (state.filters.tag && !p.tags.includes(state.filters.tag)) return false;
        if (state.filters.featured && !p.featured) return false;
        return true;
      });

      displayProjects.sort((a, b) => {
        if (state.sort === 'name-desc') return b.name.localeCompare(a.name);
        return a.name.localeCompare(b.name);
      });

      if (displayProjects.length === 0) {
        grid.innerHTML = \\\`<div class="dim">No projects found. Create Project.</div>\\\`;
      } else {
        displayProjects.forEach(p => {
          const card = document.createElement('div');
          card.className = 'project-card';
          card.innerHTML = \\`
            <span class="project-year">\\\${p.year}</span>
            <div class="project-name">\\\${p.name}</div>
            <div class="project-type">\\\${p.status}</div>
            <div class="project-desc">\\\${p.summary}</div>
            <div class="project-tags">\\\${p.tags.map(t => \\\`<span class="project-tag">\\\${t}</span>\\\`).join('')}</div>
            \\\${p.featured ? '<div class="project-stat">⭐ Featured</div>' : ''}
            <div class="mt-2 flex gap-2">
              <button type="button" class="btn btn-xs btn-error btn-delete-project" data-slug="\\\${p.slug}">Delete</button>
              <button type="button" class="btn btn-xs btn-outline btn-duplicate-project" data-slug="\\\${p.slug}">Duplicate</button>
            </div>
          \\`;
          grid.appendChild(card);
        });
      }
      board.appendChild(grid);
      terminalBody.appendChild(board);

      board.querySelector('#btnFilterShipped').addEventListener('click', () => { state.filters.status = 'shipped'; notify(); });
      board.querySelector('#btnFilterWip').addEventListener('click', () => { state.filters.status = 'wip'; notify(); });
      board.querySelector('#btnFilterArchived').addEventListener('click', () => { state.filters.status = 'archived'; notify(); });
      board.querySelector('#btnClearFilter').addEventListener('click', () => { state.filters.status = null; state.filters.tag = null; state.filters.featured = null; notify(); });
      board.querySelector('#btnSortName').addEventListener('click', () => { state.sort = state.sort === 'name-asc' ? 'name-desc' : 'name-asc'; notify(); });
      board.querySelector('#btnBackToCli').addEventListener('click', () => { state.activeMode = 'cli'; notify(); });

      board.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slug = e.target.dataset.slug;
          const p = state.projects.find(x => x.slug === slug);
          const card = e.target.closest('.project-card');
          pushHistoryState(() => doDeleteProject(slug), () => doCreateProject(p));
          if (card) {
            card.classList.add('deleting');
            setTimeout(() => { doDeleteProject(slug); }, 300);
          } else {
            doDeleteProject(slug);
          }
        });
      });

      board.querySelectorAll('.btn-duplicate-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slug = e.target.dataset.slug;
          const p = state.projects.find(x => x.slug === slug);
          const newProj = JSON.parse(JSON.stringify(p));
          newProj.name = newProj.name + ' (copy)';
          newProj.slug = newProj.slug + '-' + Date.now();
          newProj.featured = false;
          pushHistoryState(() => doCreateProject(newProj), () => doDeleteProject(newProj.slug));
          doCreateProject(newProj);
        });
      });
    } else if (state.activeMode === 'config') {
      const config = document.createElement('div');
      config.id = 'configStudio';
      config.className = 'config-studio-mode p-4';
      config.innerHTML = \\`
        <div class="output-line heading mb-4">Config Studio</div>
        <button type="button" id="btnBackToCliConfig" class="btn btn-sm btn-outline mb-4">Back to CLI</button>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 class="font-bold mb-2">Create Project</h3>
            <form id="createProjectForm" class="flex flex-col gap-2">
              <label class="form-control">
                <div class="label"><span class="label-text">Name</span></div>
                <input type="text" id="cp-name" class="input input-sm input-bordered" required minlength="1" maxlength="80">
              </label>
              <label class="form-control">
                <div class="label"><span class="label-text">Slug</span></div>
                <input type="text" id="cp-slug" class="input input-sm input-bordered" required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" maxlength="48">
              </label>
              <label class="form-control">
                <div class="label"><span class="label-text">Summary</span></div>
                <textarea id="cp-summary" class="textarea textarea-sm textarea-bordered" required minlength="1" maxlength="280"></textarea>
              </label>
              <label class="form-control">
                <div class="label"><span class="label-text">Status</span></div>
                <select id="cp-status" class="select select-sm select-bordered">
                  <option value="shipped">Shipped</option>
                  <option value="wip">WIP</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label class="form-control">
                <div class="label"><span class="label-text">Year</span></div>
                <input type="number" id="cp-year" class="input input-sm input-bordered" required min="2000" max="2100" value="2024">
              </label>
              <label class="cursor-pointer label">
                <span class="label-text">Featured</span>
                <input type="checkbox" id="cp-featured" class="checkbox checkbox-sm" />
              </label>
              <button type="submit" class="btn btn-sm btn-primary">Create</button>
              <div id="cp-error" class="text-error text-xs" aria-live="polite"></div>
            </form>
          </div>
          <div>
            <h3 class="font-bold mb-2">Config Diff</h3>
            <div id="configDiffArea" class="text-xs font-mono bg-base-200 p-2 rounded max-h-64 overflow-y-auto">
               <div class="diff-identity text-success">+ identity.displayName</div>
               <div class="diff-projects text-success">+ project added</div>
               <div class="diff-skills text-info">~ skills reordered</div>
               <div class="diff-theme text-warning">~ theme changed</div>
               <div class="diff-featured text-info">~ featured pins altered</div>
            </div>
          </div>
        </div>
      \\`;
      terminalBody.appendChild(config);

      config.querySelector('#btnBackToCliConfig').addEventListener('click', () => { state.activeMode = 'cli'; notify(); });

      config.querySelector('#createProjectForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn.disabled) return;
        btn.disabled = true;

        const errorEl = config.querySelector('#cp-error');
        errorEl.textContent = '';

        const name = config.querySelector('#cp-name').value;
        const slug = config.querySelector('#cp-slug').value;
        const summary = config.querySelector('#cp-summary').value;
        const status = config.querySelector('#cp-status').value;
        const year = parseInt(config.querySelector('#cp-year').value);
        const featured = config.querySelector('#cp-featured').checked;

        if (state.projects.some(p => p.slug === slug)) {
          errorEl.textContent = 'Error: Slug must be unique.';
          btn.disabled = false;
          return;
        }

        if (featured && state.projects.filter(p => p.featured).length >= 3) {
          errorEl.textContent = 'featured-limit: At most 3 projects may have featured true.';
          btn.disabled = false;
          return;
        }

        const newProj = { name, slug, summary, status, year, featured, tags: [], type: 'Project', desc: summary };
        pushHistoryState(() => doCreateProject(newProj), () => doDeleteProject(newProj.slug));
        doCreateProject(newProj);

        e.target.reset();
        errorEl.textContent = 'Project created successfully!';
        setTimeout(() => { errorEl.textContent = ''; btn.disabled = false; }, 3000);
      });

    } else if (state.activeMode === 'export') {
      const exp = document.createElement('div');
      exp.id = 'exportCenter';
      exp.className = 'export-center-mode p-4';

      const payload = {
        schemaVersion: "1.0",
        identity: state.identity,
        theme: state.theme,
        consent: state.consent,
        projects: state.projects.map(p => ({
          name: p.name, slug: p.slug, summary: p.summary, status: p.status, tags: p.tags, year: p.year, featured: p.featured
        })),
        skills: state.skills,
        featuredSlugs: state.projects.filter(p => p.featured).map(p => p.slug),
        profiles: state.profiles
      };

      exp.innerHTML = \\`
        <div class="output-line heading mb-4">Export Center</div>
        <button type="button" id="btnBackToCliExport" class="btn btn-sm btn-outline mb-4">Back to CLI</button>
        <div class="tabs tabs-bordered">
          <a class="tab tab-active">Portfolio JSON</a>
          <a class="tab">Terminal Config</a>
          <a class="tab">Theme CSS</a>
        </div>
        <div class="mt-4">
          <textarea class="textarea textarea-bordered w-full h-64 font-mono text-xs" readonly>\\\${JSON.stringify(payload, null, 2)}</textarea>
          <div class="flex gap-2 mt-2">
            <button type="button" class="btn btn-sm" id="btnCopyJson">Copy JSON</button>
          </div>
        </div>
      \\`;
      terminalBody.appendChild(exp);

      exp.querySelector('#btnBackToCliExport').addEventListener('click', () => { state.activeMode = 'cli'; notify(); });

    } else if (state.activeMode === 'import') {
      const imp = document.createElement('div');
      imp.id = 'importCenter';
      imp.className = 'import-center-mode p-4';

      imp.innerHTML = \\`
        <div class="output-line heading mb-4">Import JSON</div>
        <button type="button" id="btnBackToCliImport" class="btn btn-sm btn-outline mb-4">Back to CLI</button>
        <form id="importForm" class="flex flex-col gap-2">
          <textarea id="importPayload" class="textarea textarea-bordered w-full h-64 font-mono text-xs" required placeholder="Paste JSON here"></textarea>
          <button type="submit" class="btn btn-sm btn-primary w-fit">Import</button>
          <div id="importError" class="text-error text-xs mt-2" aria-live="polite"></div>
        </form>
      \\`;
      terminalBody.appendChild(imp);

      imp.querySelector('#btnBackToCliImport').addEventListener('click', () => { state.activeMode = 'cli'; notify(); });

      imp.querySelector('#importForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const errEl = imp.querySelector('#importError');
        errEl.textContent = '';
        try {
          const payload = JSON.parse(imp.querySelector('#importPayload').value);
          if (payload.schemaVersion !== "1.0") throw new Error('schemaVersion must be exactly 1.0');
          if (!payload.identity || !payload.theme || !payload.consent) throw new Error('Missing core fields');
          if (!Array.isArray(payload.projects) || !Array.isArray(payload.skills)) throw new Error('Missing arrays');

          state.identity = payload.identity;
          state.theme = payload.theme;
          state.consent = payload.consent;
          state.projects = payload.projects;
          state.skills = payload.skills;
          notify();
          errEl.className = 'text-success text-xs mt-2';
          errEl.textContent = 'Import successful!';
        } catch (err) {
          errEl.className = 'text-error text-xs mt-2';
          errEl.textContent = 'Validation Error: ' + err.message;
        }
      });
    }
  }

  subscribe(renderActiveMode);
\`;

appJs = appJs.replace(
  /\\/\\/ ============ EVENT LISTENERS ============\\n/,
  modeToggling + '\\n  // ============ EVENT LISTENERS ============\\n'
);

fs.writeFileSync('assets/app.js', appJs);
JS4
node patch_modes.js

cat << 'JS5' > patch_webmcp.js
const fs = require('fs');
let appJs = fs.readFileSync('assets/app.js', 'utf8');

const webmcpCode = \`
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
\`;
appJs += '\\n' + webmcpCode;
fs.writeFileSync('assets/app.js', appJs);
JS5
node patch_webmcp.js

cat << 'JS6' > patch_themes_a11y.js
const fs = require('fs');

let appJs = fs.readFileSync('assets/app.js', 'utf8');

appJs = appJs.replace(
  /document\\.documentElement\\.className = '';\\s*currentTheme = 'dark';/g,
  \`document.documentElement.className = ''; document.documentElement.setAttribute('data-theme', 'dark'); currentTheme = 'dark'; state.theme = 'dark'; notify();\`
);
appJs = appJs.replace(
  /document\\.documentElement\\.className = 'theme-light';\\s*currentTheme = 'light';/g,
  \`document.documentElement.className = 'theme-light'; document.documentElement.setAttribute('data-theme', 'light'); currentTheme = 'light'; state.theme = 'light'; notify();\`
);
appJs = appJs.replace(
  /document\\.documentElement\\.className = 'theme-retro';\\s*currentTheme = 'retro';/g,
  \`document.documentElement.className = 'theme-retro'; document.documentElement.setAttribute('data-theme', 'retro'); currentTheme = 'retro'; state.theme = 'retro'; notify();\`
);
appJs = appJs.replace(
  /document\\.documentElement\\.className = 'theme-glass';\\s*currentTheme = 'glass';/g,
  \`document.documentElement.className = 'theme-glass'; document.documentElement.setAttribute('data-theme', 'glass'); currentTheme = 'glass'; state.theme = 'glass'; notify();\`
);

appJs = appJs.replace(
  /const row = document\\.createElement\\('div'\\);/g,
  \`const row = document.createElement('button'); row.type = 'button';\`
);

appJs = appJs.replace(/icon: 'in'/g, "icon: '❖'");
appJs = appJs.replace(/icon: 'fb'/g, "icon: '❖'");
appJs = appJs.replace(/icon: 'ig'/g, "icon: '❖'");

appJs = appJs.replace(
  /'your work', 'your projects'/,
  "'your work', 'your projects', 'show my work'"
);

appJs = appJs.replace(
  /<span class="cmd-desc" style="text-transform:uppercase;/g,
  '<span class="cmd-desc" style="text-transform:capitalize;'
);

appJs = appJs.replace(
  /<span class="input-prompt">&gt;<\\/span>\\n\\s*<div class="input-wrapper">/,
  \`<div class="recent-chips" id="recentChips" style="display:flex;gap:4px;margin-bottom:8px"></div>
      <span class="input-prompt">&gt;</span>
      <div class="input-wrapper">\`
);

appJs = appJs.replace(
  /\\/\\/ Save to history\\n\\s*commandHistory\\.unshift\\(input\\.trim\\(\\)\\);/,
  \`// Save to history
    commandHistory.unshift(input.trim());
    const chipsEl = document.getElementById('recentChips');
    if (chipsEl) {
      const distinct = [...new Set(commandHistory)].slice(0, 3);
      chipsEl.innerHTML = distinct.map(c => \\\`<span class="chip" style="font-size:0.7rem;padding:2px 6px;background:rgba(255,255,255,0.1);border-radius:4px;cursor:pointer" onclick="document.getElementById('cmdInput').value='\\\${c}';document.getElementById('cmdInput').focus()">\\\${c}</span>\\\`).join('');
    }\`
);

// Add missing explicit labels
appJs = appJs.replace(
  /<div class="label"><span class="label-text">Name<\\/span><\\/div>\\s*<input type="text" id="cp-name"/g,
  \`<label class="label" for="cp-name"><span class="label-text">Name</span></label>
                <input type="text" id="cp-name"\`
);
appJs = appJs.replace(
  /<div class="label"><span class="label-text">Slug<\\/span><\\/div>\\s*<input type="text" id="cp-slug"/g,
  \`<label class="label" for="cp-slug"><span class="label-text">Slug</span></label>
                <input type="text" id="cp-slug"\`
);
appJs = appJs.replace(
  /<div class="label"><span class="label-text">Summary<\\/span><\\/div>\\s*<textarea id="cp-summary"/g,
  \`<label class="label" for="cp-summary"><span class="label-text">Summary</span></label>
                <textarea id="cp-summary"\`
);
appJs = appJs.replace(
  /<div class="label"><span class="label-text">Status<\\/span><\\/div>\\s*<select id="cp-status"/g,
  \`<label class="label" for="cp-status"><span class="label-text">Status</span></label>
                <select id="cp-status"\`
);
appJs = appJs.replace(
  /<div class="label"><span class="label-text">Year<\\/span><\\/div>\\s*<input type="number" id="cp-year"/g,
  \`<label class="label" for="cp-year"><span class="label-text">Year</span></label>
                <input type="number" id="cp-year"\`
);
appJs = appJs.replace(
  /<span class="label-text">Featured<\\/span>\\s*<input type="checkbox" id="cp-featured"/g,
  \`<label class="label-text" for="cp-featured">Featured</label>
                <input type="checkbox" id="cp-featured"\`
);
appJs = appJs.replace(
  /<textarea id="importPayload"/g,
  \`<label class="sr-only" for="importPayload">Portfolio JSON</label><textarea id="importPayload"\`
);

appJs = appJs.replace(
  /<div class="output-area" id="outputArea"><\\/div>/g,
  \`<div class="output-area" id="outputArea" aria-live="polite"></div>\`
);

fs.writeFileSync('assets/app.js', appJs);

let indexHtml = fs.readFileSync('index.html', 'utf8');

indexHtml = indexHtml.replace(
  /<div class="titlebar-dot red" title="Close"><\\/div>/g,
  '<button type="button" class="titlebar-dot red" title="Close terminal" aria-label="Close terminal"></button>'
);
indexHtml = indexHtml.replace(
  /<div class="titlebar-dot yellow" title="Minimize"><\\/div>/g,
  '<button type="button" class="titlebar-dot yellow" title="Minimize terminal" aria-label="Minimize terminal"></button>'
);
indexHtml = indexHtml.replace(
  /<div class="titlebar-dot green" title="Maximize"><\\/div>/g,
  '<button type="button" class="titlebar-dot green" title="Maximize terminal" aria-label="Maximize terminal"></button>'
);
indexHtml = indexHtml.replace(
  /<div class="output-area" id="outputArea"><\\/div>/g,
  \`<div class="output-area" id="outputArea" aria-live="polite"></div>\`
);
indexHtml = indexHtml.replace(
  /<input\\s*type="text"\\s*class="input-field"\\s*id="cmdInput"/,
  \`<label for="cmdInput" class="sr-only">Command Prompt</label>\\n        <input\\n          type="text"\\n          class="input-field"\\n          id="cmdInput"\`
);

fs.writeFileSync('index.html', indexHtml);
JS6
node patch_themes_a11y.js

cat << 'CSS1' > patch_css.js
const fs = require('fs');
let css = fs.readFileSync('assets/app.css', 'utf8');

css += \`
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideFadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }

.text-error, .text-success, .feedback-line { animation: fadeIn 0.3s ease-out; }
.config-studio-mode, .export-center-mode, .projects-board-mode, .import-center-mode { animation: fadeIn 0.3s ease-out; }
.project-card { animation: slideFadeIn 0.3s ease-out forwards; }
.project-card.deleting { animation: slideFadeOut 0.3s ease-out forwards; }
.tabs .tab { transition: all 0.2s ease-in-out; }

@media (max-width: 480px) {
  .terminal-window { width: 100vw !important; max-width: 100vw !important; min-width: 0 !important; border: none; margin: 0 !important; }
  .input-area, .terminal-body { width: 100vw !important; max-width: 100vw !important; box-sizing: border-box !important; }
  .input-area { padding-left: 10px; padding-right: 10px; }
  .input-wrapper input { width: 100%; }
  .config-studio-mode, .export-center-mode, .projects-board-mode, .import-center-mode { padding: 10px; width: 100%; box-sizing: border-box; overflow-x: hidden; }
  .grid { grid-template-columns: 1fr; }
  .welcome-box { grid-template-columns: 1fr; }
  .tabs { flex-wrap: wrap; }
  .board-controls { flex-wrap: wrap; }
  .welcome-box pre.pixel-art { display: none; }
  .input-prompt { display: none; }
  body { overflow-x: hidden; }
}

@media (prefers-reduced-motion: reduce) {
  .text-error, .text-success, .feedback-line, .config-studio-mode, .export-center-mode, .projects-board-mode, .import-center-mode, .project-card, .project-card.deleting { animation: none !important; }
}
\`;

fs.writeFileSync('assets/app.css', css);
CSS1
node patch_css.js

rm *.js
echo "All scripts applied successfully"
