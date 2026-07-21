// WebMCP surface for the PaneCraft oracle.
//
// Every tool drives the SAME shared store action that the visible UI control
// invokes — pane-create calls store.createPane (the Create Pane wizard's
// Create button path), pane-update calls store.updatePane (the Edit dialog +
// Size/Refresh controls), pane-delete calls store.deletePane (the Delete
// confirmation), pane-reorder calls store.movePane (the Move Up/Down/Left/Right
// buttons), the form tools drive the SAME store wizard draft the visible
// Create Pane wizard renders, the session tools flip the same offline flag and
// open the same Collaboration Scenario modal as the visible controls, and the
// artifact tools compile through store.compileWorkspaceExport /
// compileMarkdownReport and open the same Export center / Import surface the
// header buttons open. No tool fabricates a success state the visible UI
// cannot reach. Exposed on window as webmcp_session_info / webmcp_list_tools /
// webmcp_invoke_tool.
//
// Deliberately NOT forced (mechanics_exclusions — Playwright-observed only):
// the shared date-range filter recompute, chart hover/tooltip, refresh-tick
// timing/animation, the collaboration merge convergence visual, page-tab
// reorder/scroll, file-picker interaction, clipboard contents, and downloaded
// artifact bytes.

import * as store from './store';
import { dataSources, getDataSourceById } from '../data/mockData';
import type { Pane, PaneType, PaneSize, RefreshInterval } from './store';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = [
  { id: 'entity-collection-v1', bound: 'pane (create, select, update, delete, reorder) and page (create, select, rename, delete)' },
  { id: 'form-workflow-v1', bound: 'Create Pane wizard steps choose-source, choose-type, configure (validate, submit, cancel, advance, return)' },
  { id: 'command-session-v1', bound: 'refresh ticker + collaboration session (start, pause, stop, connect, disconnect, advance)', demos: ['refresh-tick', 'collaboration-scenario', 'go-offline', 'go-online'] },
  { id: 'artifact-transfer-v1', bound: 'Export center / Import workspace (export, import, copy)', export_formats: ['workspace-json', 'markdown-report'], import_modes: ['workspace'] },
];

const SESSION_DEMOS = ['refresh-tick', 'collaboration-scenario', 'go-offline', 'go-online'];

// ---- value coercion --------------------------------------------------------

const PANE_TYPES: Record<string, PaneType> = {
  line: 'line', 'line chart': 'line',
  bar: 'bar', 'bar chart': 'bar',
  donut: 'donut', 'donut chart': 'donut',
  table: 'table', 'data table': 'table',
  counter: 'counter',
};
const PANE_SIZES: Record<string, PaneSize> = { small: 'small', medium: 'medium', large: 'large' };
const REFRESH_INTERVALS: Record<string, RefreshInterval> = {
  off: 'off', '30s': '30s', 'every 30s': '30s', '5m': '5m', 'every 5m': '5m',
};

function resolveSourceId(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  const found = dataSources.find((ds) => ds.id === s || ds.name.toLowerCase() === s);
  return found ? found.id : null;
}

function resolveType(v: unknown): PaneType | null {
  return PANE_TYPES[String(v ?? '').trim().toLowerCase()] ?? null;
}
function resolveSize(v: unknown): PaneSize | null {
  return PANE_SIZES[String(v ?? '').trim().toLowerCase()] ?? null;
}
function resolveRefresh(v: unknown): RefreshInterval | null {
  return REFRESH_INTERVALS[String(v ?? '').trim().toLowerCase()] ?? null;
}

function findPaneLocation(paneId: string, pageIdHint?: string): { pageId: string; pane: Pane } | null {
  const pages = store.getPages();
  if (pageIdHint) {
    const page = pages.find((p) => p.id === pageIdHint);
    const pane = page?.panes.find((pn) => pn.id === paneId);
    if (page && pane) return { pageId: page.id, pane };
  }
  for (const page of pages) {
    const pane = page.panes.find((pn) => pn.id === paneId);
    if (pane) return { pageId: page.id, pane };
  }
  return null;
}

function paneView(pageId: string, pane: Pane) {
  return {
    id: pane.id,
    pageId,
    title: pane.title,
    type: pane.type,
    source: pane.source,
    metric: pane.metric,
    dimension: pane.dimension ?? null,
    size: pane.size,
    refreshInterval: pane.refreshInterval,
  };
}

// ---- entity-collection-v1 (panes) ------------------------------------------

function paneCreate(args: Record<string, unknown>) {
  const sourceId = resolveSourceId(args.source ?? args['data-source']);
  if (!sourceId) return { ok: false, field: 'source', error: `source must be one of ${dataSources.map((ds) => ds.id).join(', ')}` };
  const type = resolveType(args.type ?? 'line');
  if (!type) return { ok: false, field: 'type', error: 'type must be line | bar | donut | table | counter' };
  const metric = String(args.metric ?? args['metric-column'] ?? '').trim();
  const rawDimension = args.dimension ?? args['dimension-column'];
  const dimension = rawDimension === null || rawDimension === undefined || rawDimension === '' ? null : String(rawDimension).trim();
  const size = resolveSize(args.size ?? 'small');
  if (!size) return { ok: false, field: 'size', error: 'size must be small | medium | large' };
  const refreshInterval = resolveRefresh(args['refresh-interval'] ?? args.refreshInterval ?? 'off');
  if (!refreshInterval) return { ok: false, field: 'refreshInterval', error: 'refresh-interval must be off | 30s | 5m' };

  const src = getDataSourceById(sourceId)!;
  const typeLabel = store.PANE_TYPE_LABELS[type];
  const title = String(args.title ?? '').trim() || `${src.name} ${typeLabel}`;
  const pageId = String(args.pageId ?? store.getActivePageId());

  const before = store.getPages().find((p) => p.id === pageId)?.panes.length ?? 0;
  // Same domain command the wizard's Create Pane button calls (via
  // store.submitCreateWizard) — one validated success path.
  const result = store.createPane(pageId, { source: sourceId, type, metric, dimension, size, refreshInterval, title });
  if (!result.ok) {
    return { ok: false, field: (result as { field: string }).field, error: (result as { message: string }).message };
  }
  const panes = store.getPages().find((p) => p.id === pageId)?.panes ?? [];
  const created = panes[panes.length - 1];
  return { ok: before + 1 === panes.length, pane: created ? paneView(pageId, created) : null, count: panes.length };
}

function paneSelect(args: Record<string, unknown>) {
  const loc = findPaneLocation(String(args.paneId ?? args.id ?? ''), args.pageId ? String(args.pageId) : undefined);
  if (!loc) return { ok: false, error: 'pane not found' };
  // Same path as clicking a pane's Edit control: open the editor for it.
  store.setEditingPane({ paneId: loc.pane.id, pageId: loc.pageId });
  return { ok: true, editing: true, pane: paneView(loc.pageId, loc.pane) };
}

function paneUpdate(args: Record<string, unknown>) {
  const loc = findPaneLocation(String(args.paneId ?? args.id ?? ''), args.pageId ? String(args.pageId) : undefined);
  if (!loc) return { ok: false, error: 'pane not found' };
  const updates: Partial<Pane> = {};
  if (args.source !== undefined || args['data-source'] !== undefined) {
    const sid = resolveSourceId(args.source ?? args['data-source']);
    if (!sid) return { ok: false, field: 'source', error: `source must be one of ${dataSources.map((ds) => ds.id).join(', ')}` };
    updates.source = sid;
  }
  if (args.type !== undefined) {
    const t = resolveType(args.type);
    if (!t) return { ok: false, field: 'type', error: 'type must be line | bar | donut | table | counter' };
    updates.type = t;
  }
  if (args.metric !== undefined || args['metric-column'] !== undefined) {
    updates.metric = String(args.metric ?? args['metric-column']).trim();
  }
  if (args.dimension !== undefined || args['dimension-column'] !== undefined) {
    const raw = args.dimension ?? args['dimension-column'];
    updates.dimension = raw === null || String(raw).trim() === '' ? null : String(raw).trim();
  }
  if (args.size !== undefined) {
    const s = resolveSize(args.size);
    if (!s) return { ok: false, field: 'size', error: 'size must be small | medium | large' };
    updates.size = s;
  }
  if (args['refresh-interval'] !== undefined || args.refreshInterval !== undefined) {
    const r = resolveRefresh(args['refresh-interval'] ?? args.refreshInterval);
    if (!r) return { ok: false, field: 'refreshInterval', error: 'refresh-interval must be off | 30s | 5m' };
    updates.refreshInterval = r;
    updates.lastRefreshTime = Date.now();
    updates.refreshTick = 0;
  }
  if (args.title !== undefined) {
    const t = String(args.title).trim();
    if (t) updates.title = t;
  }
  if (Object.keys(updates).length === 0) return { ok: false, error: 'no recognised fields to update' };
  // Same domain command the Edit dialog / Size / Refresh controls call —
  // it validates the merged PaneConfig against the field contract.
  const result = store.updatePane(loc.pageId, loc.pane.id, updates);
  if (!result.ok) {
    return { ok: false, field: (result as { field: string }).field, error: (result as { message: string }).message };
  }
  const after = findPaneLocation(loc.pane.id, loc.pageId)!;
  return { ok: true, pane: paneView(after.pageId, after.pane) };
}

function paneDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
  const loc = findPaneLocation(String(args.paneId ?? args.id ?? ''), args.pageId ? String(args.pageId) : undefined);
  if (!loc) return { ok: false, error: 'pane not found' };
  const pageId = loc.pageId;
  // Same domain command the Delete confirmation dialog calls.
  store.deletePane(pageId, loc.pane.id);
  const gone = !findPaneLocation(loc.pane.id, pageId);
  return { ok: gone, id: loc.pane.id, count: store.getPages().find((p) => p.id === pageId)?.panes.length ?? 0 };
}

function paneReorder(args: Record<string, unknown>) {
  const dir = String(args.direction ?? '').trim().toLowerCase();
  if (!['up', 'down', 'left', 'right'].includes(dir)) return { ok: false, error: 'direction must be up | down | left | right' };
  const loc = findPaneLocation(String(args.paneId ?? args.id ?? ''), args.pageId ? String(args.pageId) : undefined);
  if (!loc) return { ok: false, error: 'pane not found' };
  const direction = dir as 'up' | 'down' | 'left' | 'right';
  if (!store.canMovePane(loc.pageId, loc.pane.id, direction)) {
    return { ok: false, error: `cannot move ${direction} from the current grid boundary` };
  }
  const before = store.getPages().find((p) => p.id === loc.pageId)!.panes.findIndex((pn) => pn.id === loc.pane.id);
  // Same domain command the Move Up/Down/Left/Right buttons call.
  store.movePane(loc.pageId, loc.pane.id, direction);
  const after = store.getPages().find((p) => p.id === loc.pageId)!.panes.findIndex((pn) => pn.id === loc.pane.id);
  return { ok: before !== after, from: before, to: after };
}

// ---- entity-collection-v1 (pages, via the same store actions) --------------

function pageCreate(args: Record<string, unknown>) {
  const name = String(args.name ?? '').trim() || `Page ${store.getPages().length + 1}`;
  const before = store.getPages().length;
  const result = store.addPage(name); // Same command Add Page calls; also makes it active.
  if (!result.ok) return { ok: false, field: 'name', error: (result as { message: string }).message };
  const pages = store.getPages();
  const created = pages[pages.length - 1];
  return { ok: pages.length === before + 1, page: { id: created!.id, name: created!.name }, activePageId: store.getActivePageId() };
}

function pageSelect(args: Record<string, unknown>) {
  const id = String(args.id ?? args.pageId ?? '');
  if (!store.getPages().some((p) => p.id === id)) return { ok: false, error: 'page not found' };
  store.setActivePageId(id); // Same command a page tab click calls.
  return { ok: store.getActivePageId() === id, activePageId: store.getActivePageId() };
}

function pageRename(args: Record<string, unknown>) {
  const id = String(args.id ?? args.pageId ?? '');
  const name = String(args.name ?? '');
  if (!store.getPages().some((p) => p.id === id)) return { ok: false, error: 'page not found' };
  const result = store.renamePage(id, name); // Same command the inline rename commits.
  if (!result.ok) return { ok: false, field: 'name', error: (result as { message: string }).message };
  return { ok: store.getPages().find((p) => p.id === id)?.name === name.trim(), id, name: name.trim() };
}

function pageDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
  const id = String(args.id ?? args.pageId ?? '');
  if (!store.getPages().some((p) => p.id === id)) return { ok: false, error: 'page not found' };
  const result = store.deletePage(id); // Same command the delete-page confirmation calls.
  if (!result.ok) return { ok: false, error: (result as { message: string }).message };
  return { ok: !store.getPages().some((p) => p.id === id), count: store.getPages().length };
}

// ---- form-workflow-v1 (Create Pane wizard) ----------------------------------
// These tools mutate the SAME store wizard draft the visible Create Pane
// wizard renders — advancing a step or setting a field through WebMCP is
// visible in the open wizard — and submit ends in the same
// store.submitCreateWizard the wizard's Create Pane button invokes.

function draftView() {
  const wizard = store.getWizard();
  return {
    step: wizard.step,
    'data-source': wizard.source || null,
    'pane-type': wizard.type,
    'metric-column': wizard.metric || null,
    'dimension-column': wizard.dimension || null,
    title: wizard.title || null,
    size: wizard.size,
    'refresh-interval': wizard.refreshInterval,
  };
}

function applyDraftArgs(args: Record<string, unknown>) {
  const source = args['data-source'] ?? args.source;
  if (source !== undefined && source !== null && source !== '') {
    const sid = resolveSourceId(source);
    if (sid) store.setWizardField('source', sid);
  }
  const type = args['pane-type'] ?? args.type;
  if (type !== undefined && type !== null && type !== '') {
    const t = resolveType(type);
    if (t) store.setWizardField('type', t);
  }
  const metric = args['metric-column'] ?? args.metric;
  if (metric !== undefined && metric !== null && metric !== '') {
    store.setWizardField('metric', String(metric).trim());
  }
  if (args['dimension-column'] !== undefined || args.dimension !== undefined) {
    const raw = args['dimension-column'] ?? args.dimension;
    store.setWizardField('dimension', raw === null ? '' : String(raw).trim());
  }
  if (args.title !== undefined) store.setWizardField('title', String(args.title).trim());
  if (args.size !== undefined) {
    const s = resolveSize(args.size);
    if (s) store.setWizardField('size', s);
  }
  const refresh = args['refresh-interval'] ?? args.refreshInterval;
  if (refresh !== undefined) {
    const r = resolveRefresh(refresh);
    if (r) store.setWizardField('refreshInterval', r);
  }
}

function formValidate(args: Record<string, unknown>) {
  if (!store.getWizard().open) store.openCreateWizard(); // make the wizard visible like the UI control does
  applyDraftArgs(args);
  const wizard = store.getWizard();
  const errors: string[] = [];
  const stepErrors = store.validateWizardStep('configure');
  if (!wizard.source) errors.push('data-source is required');
  for (const message of Object.values(stepErrors)) errors.push(message);
  return { ok: errors.length === 0, valid: errors.length === 0, errors, draft: draftView() };
}

function formAdvance(args: Record<string, unknown>) {
  if (!store.getWizard().open) store.openCreateWizard();
  applyDraftArgs(args);
  // Same command as the wizard's Next button: validate the current step, then
  // move forward (choose-source -> choose-type -> configure).
  const result = store.wizardAdvance();
  if (!result.ok) {
    return { ok: false, error: (result as { message: string }).message, field: (result as { field: string }).field, draft: draftView() };
  }
  return { ok: true, draft: draftView() };
}

function formReturn() {
  store.wizardReturn(); // Same command as the wizard's Back button.
  return { ok: true, draft: draftView() };
}

function formSubmit(args: Record<string, unknown>) {
  if (!store.getWizard().open) store.openCreateWizard();
  applyDraftArgs(args);
  // Same command as the wizard's Create Pane button.
  const result = store.submitCreateWizard();
  if (!result.ok) {
    return { ok: false, error: (result as { message: string }).message, field: (result as { field: string }).field, draft: draftView() };
  }
  return { ok: true, paneId: (result as { id?: string }).id ?? null, draft: draftView() };
}

function formCancel() {
  store.closeCreateWizard(); // Same as the wizard's close control.
  return { ok: true, cancelled: true, draft: draftView() };
}

// ---- command-session-v1 (refresh ticker + collaboration session) ------------
// start/pause/stop drive the shared refresh ticker store.startRefreshTicker()
// that App.svelte mounts; connect/disconnect flip the shared offline flag the
// Collaboration Scenario's Go Online/Go Offline toggle reads; advance accepts
// the four declared demos (refresh-tick, collaboration-scenario, go-offline,
// go-online). Tick timing and merge convergence stay Playwright-observed and
// are never forced here.

let stopTicker: (() => void) | null = null;

function sessionStart(args: Record<string, unknown>) {
  const demo = String(args.demo ?? 'refresh-tick');
  if (!SESSION_DEMOS.includes(demo)) {
    return { ok: false, error: `demo must be one of ${SESSION_DEMOS.join(', ')}` };
  }
  if (!stopTicker) stopTicker = store.startRefreshTicker();
  if (demo === 'collaboration-scenario') store.setShowCollaboration(true); // same command as the Collaboration Scenario control
  if (demo === 'go-offline') store.setIsOffline(true);
  if (demo === 'go-online') store.setIsOffline(false);
  return { ok: true, demo, running: true };
}

function sessionPause() {
  if (stopTicker) {
    stopTicker();
    stopTicker = null;
  }
  return { ok: true, running: false, paused: true };
}

function sessionStop() {
  if (stopTicker) {
    stopTicker();
    stopTicker = null;
  }
  return { ok: true, running: false };
}

function sessionConnect() {
  store.setIsOffline(false); // go-online: same flag the Go Online button sets.
  return { ok: true, demo: 'go-online', offline: store.getIsOffline() };
}

function sessionDisconnect() {
  store.setIsOffline(true); // go-offline: same flag the Go Offline button sets.
  return { ok: true, demo: 'go-offline', offline: store.getIsOffline() };
}

function sessionAdvance(args: Record<string, unknown>) {
  const demo = String(args.demo ?? 'refresh-tick');
  if (!SESSION_DEMOS.includes(demo)) {
    return { ok: false, error: `demo must be one of ${SESSION_DEMOS.join(', ')}` };
  }
  // go-offline / go-online flip the same shared flag the modal's toggle sets;
  // collaboration-scenario opens the same modal the visible control opens.
  if (demo === 'go-offline') store.setIsOffline(true);
  if (demo === 'go-online') store.setIsOffline(false);
  if (demo === 'collaboration-scenario') store.setShowCollaboration(true);
  const panes = store.getPages().flatMap((p) => p.panes);
  return {
    ok: true,
    demo,
    demos: SESSION_DEMOS,
    tickerRunning: stopTicker !== null,
    offline: store.getIsOffline(),
    collaborationOpen: store.getShowCollaboration(),
    refreshingPanes: panes
      .filter((pn) => pn.refreshInterval !== 'off')
      .map((pn) => ({ id: pn.id, refreshInterval: pn.refreshInterval, refreshTick: pn.refreshTick })),
    note: 'refresh-tick timing and collaboration merge convergence are observed live, not forced by WebMCP',
  };
}

// ---- artifact-transfer-v1 ----------------------------------------------------
// export/copy call the SAME store.compileWorkspaceExport / compileMarkdownReport
// the Export center's Copy/Download buttons call; import opens the SAME Import
// workspace surface the header Import button opens and reports the import mode
// (the pasted/file bytes themselves remain Playwright responsibilities, per the
// module's no-artifact-contents restriction — results carry counts only).

function artifactExport(args: Record<string, unknown>) {
  const format = String(args.format ?? 'workspace-json');
  if (format === 'workspace-json') {
    const workspace = store.compileWorkspaceExport();
    const paneCount = workspace.pages.reduce((sum, p) => sum + p.panes.length, 0);
    return {
      ok: true,
      format,
      schemaVersion: workspace.schemaVersion,
      pageCount: workspace.pages.length,
      paneCount,
      savedAnalysisCount: workspace.savedAnalyses.length,
      dateRange: workspace.dateRange,
    };
  }
  if (format === 'markdown-report') {
    const report = store.compileMarkdownReport();
    return { ok: true, format, length: report.length };
  }
  return { ok: false, error: 'format must be workspace-json | markdown-report' };
}

function artifactImport(args: Record<string, unknown>) {
  const mode = String(args.mode ?? 'workspace');
  if (mode !== 'workspace') return { ok: false, error: 'import mode must be workspace' };
  // Open the same Import workspace surface the header Import button opens.
  store.openExportCenter('import');
  return {
    ok: true,
    mode,
    surface: 'import-workspace',
    note: 'The Import surface is open; pasting or picking the Workspace JSON file remains a Playwright responsibility (file bytes cannot travel through WebMCP arguments).',
  };
}

function artifactCopy(args: Record<string, unknown>) {
  const format = String(args.format ?? 'workspace-json');
  if (format !== 'workspace-json' && format !== 'markdown-report') {
    return { ok: false, error: 'format must be workspace-json | markdown-report' };
  }
  // Same compile command the Export center Copy button calls; the clipboard
  // write itself remains Playwright-observed.
  if (format === 'workspace-json') {
    const workspace = store.compileWorkspaceExport();
    const paneCount = workspace.pages.reduce((sum, p) => sum + p.panes.length, 0);
    return { ok: true, format, pageCount: workspace.pages.length, paneCount };
  }
  const report = store.compileMarkdownReport();
  return { ok: true, format, length: report.length };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  // entity-collection-v1 — panes
  { name: 'entity_pane_create', description: 'Create a pane on a page via the same store.createPane the Create Pane wizard calls. args: source (website-analytics|sales-sheet|support-tickets), type (line|bar|donut|table|counter), metric (a column on the source, or _count), dimension (required for line/bar/donut, null for table/counter), size (small|medium|large), refresh-interval (off|30s|5m), title, pageId (defaults to the active page).', handler: paneCreate },
  { name: 'entity_pane_select', description: 'Open a pane in the editor (same as its Edit control). args: paneId, optional pageId.', handler: paneSelect },
  { name: 'entity_pane_update', description: 'Update a pane in place via the same store.updatePane the Edit dialog / Size / Refresh controls call; the merged PaneConfig is validated against the field contract. args: paneId, optional pageId, and any of source, type, metric, dimension, size, refresh-interval, title.', handler: paneUpdate },
  { name: 'entity_pane_delete', description: 'Delete a pane via the same store.deletePane the Delete confirmation calls. args: paneId, optional pageId, confirm=true (required).', handler: paneDelete },
  { name: 'entity_pane_reorder', description: 'Move a pane one grid cell via the same store.movePane the Move Up/Down/Left/Right buttons call. args: paneId, optional pageId, direction (up|down|left|right). Fails at a grid boundary, matching the disabled buttons.', handler: paneReorder },
  // entity-collection-v1 — pages
  { name: 'entity_page_create', description: 'Add a page via the same store.addPage the Add Page control calls (also makes it active). args: name (optional, 1-40 characters).', handler: pageCreate },
  { name: 'entity_page_select', description: 'Switch the active page via the same store.setActivePageId a page-tab click calls. args: id.', handler: pageSelect },
  { name: 'entity_page_rename', description: 'Rename a page via the same store.renamePage the inline rename commits. args: id, name (1-40 characters).', handler: pageRename },
  { name: 'entity_page_delete', description: 'Delete a page via the same store.deletePage the delete-page confirmation calls. args: id, confirm=true (required). Refuses to delete the last page.', handler: pageDelete },
  // form-workflow-v1 — Create Pane wizard (drives the same store wizard the UI renders)
  { name: 'form_pane_validate', description: 'Validate the Create Pane draft through the same store.validateWizardStep the wizard uses (opens the wizard if closed). Optionally sets fields first. args: data-source, pane-type, metric-column, dimension-column.', handler: formValidate },
  { name: 'form_pane_advance', description: 'Set the current wizard step field(s) and move forward one step (choose-source -> choose-type -> configure) via the same store.wizardAdvance the Next button calls; invalid steps return the inline field error. args depend on the step: data-source, pane-type, metric-column, dimension-column, title, size, refresh-interval.', handler: formAdvance },
  { name: 'form_pane_return', description: 'Step the Create Pane wizard back one step via the same store.wizardReturn the Back button calls.', handler: formReturn },
  { name: 'form_pane_submit', description: 'Submit the Create Pane wizard via the SAME store.submitCreateWizard the Create Pane button calls: validates the full PaneConfig and, if valid, adds the pane to the active page. args: data-source, pane-type, metric-column, dimension-column, title, size, refresh-interval.', handler: formSubmit },
  { name: 'form_pane_cancel', description: 'Cancel the Create Pane wizard via the same store.closeCreateWizard the close control calls, clearing the draft.', handler: formCancel },
  // command-session-v1 — refresh ticker + collaboration session
  { name: 'session_workspace_start', description: 'Start the shared refresh ticker (store.startRefreshTicker) that App.svelte mounts. args: demo (one of refresh-tick, collaboration-scenario, go-offline, go-online; collaboration-scenario opens the Collaboration Scenario modal).', handler: sessionStart },
  { name: 'session_workspace_pause', description: 'Pause the shared refresh ticker.', handler: sessionPause },
  { name: 'session_workspace_stop', description: 'Stop the shared refresh ticker.', handler: sessionStop },
  { name: 'session_workspace_connect', description: 'Go online for the Collaboration Scenario (store.setIsOffline(false)) — the same shared flag the Go Online button sets.', handler: sessionConnect },
  { name: 'session_workspace_disconnect', description: 'Go offline for the Collaboration Scenario (store.setIsOffline(true)) — the same shared flag the Go Offline button sets.', handler: sessionDisconnect },
  { name: 'session_workspace_advance', description: 'Advance the session with one of the declared demos: refresh-tick (reports live per-pane refresh ticks; timing stays Playwright-observed), collaboration-scenario (opens the Collaboration Scenario modal), go-offline, go-online. args: demo (refresh-tick|collaboration-scenario|go-offline|go-online).', handler: sessionAdvance },
  // artifact-transfer-v1 — Export center / Import workspace
  { name: 'artifact_workspace_export', description: 'Compile the workspace export via the same store.compileWorkspaceExport / compileMarkdownReport the Export center Download buttons call. args: format (workspace-json|markdown-report). Returns counts and the schemaVersion only — actual JSON/Markdown bytes stay Playwright-observed.', handler: artifactExport },
  { name: 'artifact_workspace_import', description: 'Open the Import workspace surface (the same one the header Import button opens) in import mode workspace. args: mode (workspace). Pasting or picking the Workspace JSON file stays a Playwright responsibility; file bytes cannot travel through WebMCP arguments.', handler: artifactImport },
  { name: 'artifact_workspace_copy', description: 'Compile the same artifact the Export center Copy button copies via store.compileWorkspaceExport / compileMarkdownReport. args: format (workspace-json|markdown-report). Returns counts only; the clipboard write stays Playwright-observed.', handler: artifactCopy },
];

function normalize(value: unknown): unknown {
  // Defensively round-trip through JSON so Svelte state proxies can never leak
  // into the CDP serialization path (which would surface as a TypeError).
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { ok: false, error: 'result was not serializable' };
  }
}

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () =>
    normalize({
      contract_version: CONTRACT_VERSION,
      modules: MODULES.map((m) => m.id),
      module_bindings: MODULES,
      session_demos: SESSION_DEMOS,
      tools: TOOLS.map((t) => t.name),
    });
  w.webmcp_list_tools = () => normalize(TOOLS.map((t) => ({ name: t.name, description: t.description })));
  w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return normalize(tool.handler(args || {}));
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
