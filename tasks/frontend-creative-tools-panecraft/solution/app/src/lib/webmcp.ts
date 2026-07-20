// WebMCP surface for the PaneCraft oracle.
//
// Every tool drives the SAME shared store action that the visible UI control
// invokes — pane-create calls store.addPane (the Create Pane wizard's Create
// button), pane-update calls store.updatePane (the Edit dialog + Size/Refresh
// controls), pane-delete calls store.deletePane (the Delete confirmation),
// pane-reorder calls store.movePane (the Move Up/Down/Left/Right buttons),
// and the page tools call store.addPage / setActivePageId / renamePage /
// deletePage (the page-tab controls). No tool fabricates a success state the
// visible UI cannot reach. Exposed on window as
// webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.
//
// Deliberately NOT exposed (mechanics_exclusions — Playwright-observed only):
// the shared date-range filter recompute, chart hover/tooltip, refresh-tick
// timing/animation, the collaboration merge convergence visual, and page-tab
// reorder/scroll. The command-session tools may start/stop the shared refresh
// ticker and flip the shared offline flag (both real store state the UI
// produces) but never force a tick or drive the merge convergence itself.
//
// artifact-transfer-v1: export/copy call the same store.compileWorkspaceExport
// / compileMarkdownReport the Workspace panel's Download/Copy buttons call,
// returning counts (never raw JSON/Markdown bytes, per the module's no-
// artifact-contents restriction). Import has no legal way to receive file
// bytes through WebMCP args, so it honestly returns ok:false instead of
// faking a success the file-picker-only UI path cannot reach.

import * as store from './store';
import { dataSources, getDataSourceById } from '../data/mockData';
import type { Pane, PaneType, PaneSize, RefreshInterval } from './store';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['entity-collection-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'];

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
  const found = dataSources.find(
    (ds) => ds.id === s || ds.name.toLowerCase() === s,
  );
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

// Mirror CreatePaneWizard's availableMetrics: numeric columns, plus a _count
// row-count metric for the sales-sheet and support-tickets sources.
function metricsFor(sourceId: string): string[] {
  const src = getDataSourceById(sourceId);
  if (!src) return [];
  const metrics = [...src.numericColumns];
  if (src.id === 'support-tickets' || src.id === 'sales-sheet') metrics.push('_count');
  return metrics;
}
// Mirror CreatePaneWizard's availableDimensions.
function dimensionsFor(sourceId: string): string[] {
  const src = getDataSourceById(sourceId);
  if (!src) return [];
  const dims: string[] = [];
  if (src.dateColumn) dims.push(src.dateColumn);
  if (src.categoryColumn) dims.push(src.categoryColumn);
  for (const col of src.columns) {
    if (col !== src.dateColumn && col !== src.categoryColumn && !src.numericColumns.includes(col)) {
      dims.push(col);
    }
  }
  return [...new Set(dims)];
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
    id: pane.id, pageId, title: pane.title, type: pane.type,
    source: pane.dataSourceId, metric: pane.metric, dimension: pane.dimension ?? null,
    size: pane.size, refreshInterval: pane.refreshInterval,
  };
}

// ---- entity-collection-v1 (panes) ------------------------------------------

function paneCreate(args: Record<string, unknown>) {
  const sourceId = resolveSourceId(args.source ?? args['data-source']);
  if (!sourceId) return { ok: false, error: `unknown data source: ${args.source ?? args['data-source']}` };
  const type = resolveType(args.type ?? 'line');
  if (!type) return { ok: false, error: `unknown pane type: ${args.type}` };
  const metric = String(args.metric ?? args['metric-column'] ?? '').trim();
  if (!metric || !metricsFor(sourceId).includes(metric)) {
    return { ok: false, error: `metric must be one of: ${metricsFor(sourceId).join(', ')}` };
  }
  let dimension = args.dimension ?? args['dimension-column'];
  const needsDimension = type !== 'counter' && type !== 'table';
  if (needsDimension) {
    const dim = String(dimension ?? '').trim();
    if (!dim || !dimensionsFor(sourceId).includes(dim)) {
      return { ok: false, error: `chart panes need a dimension; one of: ${dimensionsFor(sourceId).join(', ')}` };
    }
    dimension = dim;
  } else {
    dimension = undefined;
  }
  const size = resolveSize(args.size ?? 'small');
  if (!size) return { ok: false, error: 'size must be small | medium | large' };
  const refreshInterval = resolveRefresh(args['refresh-interval'] ?? args.refreshInterval ?? 'off');
  if (!refreshInterval) return { ok: false, error: 'refresh-interval must be off | 30s | 5m' };

  const src = getDataSourceById(sourceId)!;
  const typeLabel = ({ line: 'Line Chart', bar: 'Bar Chart', donut: 'Donut Chart', table: 'Data Table', counter: 'Counter' } as const)[type];
  const title = String(args.title ?? '').trim() || `${src.name} ${typeLabel}`;
  const pageId = String(args.pageId ?? store.getActivePageId());

  const before = store.getPages().find((p) => p.id === pageId)?.panes.length ?? 0;
  // Same domain command the wizard's "Create Pane" button calls.
  store.addPane(pageId, { title, type, dataSourceId: sourceId, metric, dimension: dimension as string | undefined, size, refreshInterval });
  const panes = store.getPages().find((p) => p.id === pageId)?.panes ?? [];
  const created = panes[panes.length - 1];
  return { ok: before + 1 === panes.length, pane: created ? paneView(pageId, created) : null, count: panes.length };
}

function paneSelect(args: Record<string, unknown>) {
  const loc = findPaneLocation(String(args.paneId ?? args.id ?? ''), args.pageId ? String(args.pageId) : undefined);
  if (!loc) return { ok: false, error: 'pane not found' };
  // Same path as clicking a pane's "Edit" control: open the editor for it.
  store.setEditingPane({ paneId: loc.pane.id, pageId: loc.pageId });
  return { ok: true, editing: true, pane: paneView(loc.pageId, loc.pane) };
}

function paneUpdate(args: Record<string, unknown>) {
  const loc = findPaneLocation(String(args.paneId ?? args.id ?? ''), args.pageId ? String(args.pageId) : undefined);
  if (!loc) return { ok: false, error: 'pane not found' };
  const updates: Partial<Pane> = {};
  if (args.source !== undefined || args['data-source'] !== undefined) {
    const sid = resolveSourceId(args.source ?? args['data-source']);
    if (!sid) return { ok: false, error: 'unknown data source' };
    updates.dataSourceId = sid;
  }
  const effectiveSource = updates.dataSourceId ?? loc.pane.dataSourceId;
  if (args.type !== undefined) {
    const t = resolveType(args.type);
    if (!t) return { ok: false, error: 'unknown pane type' };
    updates.type = t;
  }
  if (args.metric !== undefined || args['metric-column'] !== undefined) {
    const m = String(args.metric ?? args['metric-column']).trim();
    if (!metricsFor(effectiveSource).includes(m)) return { ok: false, error: `metric must be one of: ${metricsFor(effectiveSource).join(', ')}` };
    updates.metric = m;
  }
  if (args.dimension !== undefined || args['dimension-column'] !== undefined) {
    const d = String(args.dimension ?? args['dimension-column']).trim();
    if (d && !dimensionsFor(effectiveSource).includes(d)) return { ok: false, error: `dimension must be one of: ${dimensionsFor(effectiveSource).join(', ')}` };
    updates.dimension = d || undefined;
  }
  if (args.size !== undefined) {
    const s = resolveSize(args.size);
    if (!s) return { ok: false, error: 'size must be small | medium | large' };
    updates.size = s;
  }
  if (args['refresh-interval'] !== undefined || args.refreshInterval !== undefined) {
    const r = resolveRefresh(args['refresh-interval'] ?? args.refreshInterval);
    if (!r) return { ok: false, error: 'refresh-interval must be off | 30s | 5m' };
    updates.refreshInterval = r;
    updates.lastRefreshTime = Date.now();
    updates.refreshTick = 0;
  }
  if (args.title !== undefined) {
    const t = String(args.title).trim();
    if (t) updates.title = t;
  }
  if (Object.keys(updates).length === 0) return { ok: false, error: 'no recognised fields to update' };
  // Same domain command the Edit dialog / Size / Refresh controls call.
  store.updatePane(loc.pageId, loc.pane.id, updates);
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
  store.addPage(name); // Same command Add Page calls; also makes it active.
  const pages = store.getPages();
  const created = pages[pages.length - 1];
  return { ok: pages.length === before + 1, page: { id: created.id, name: created.name }, activePageId: store.getActivePageId() };
}

function pageSelect(args: Record<string, unknown>) {
  const id = String(args.id ?? args.pageId ?? '');
  if (!store.getPages().some((p) => p.id === id)) return { ok: false, error: 'page not found' };
  store.setActivePageId(id); // Same command a page tab click calls.
  return { ok: store.getActivePageId() === id, activePageId: store.getActivePageId() };
}

function pageRename(args: Record<string, unknown>) {
  const id = String(args.id ?? args.pageId ?? '');
  const name = String(args.name ?? '').trim();
  if (!store.getPages().some((p) => p.id === id)) return { ok: false, error: 'page not found' };
  if (!name) return { ok: false, error: 'name is required' };
  store.renamePage(id, name); // Same command the inline rename commits.
  return { ok: store.getPages().find((p) => p.id === id)?.name === name, id, name };
}

function pageDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
  const id = String(args.id ?? args.pageId ?? '');
  if (!store.getPages().some((p) => p.id === id)) return { ok: false, error: 'page not found' };
  if (store.getPages().length <= 1) return { ok: false, error: 'cannot delete the last remaining page' };
  store.deletePage(id); // Same command the delete-page confirmation calls.
  return { ok: !store.getPages().some((p) => p.id === id), count: store.getPages().length };
}

// ---- form-workflow-v1 (Create Pane wizard: choose-source/type/configure) ---
// The wizard's step/selection state is component-local, so these tools keep a
// draft that mirrors the wizard exactly and end by calling the SAME
// store.addPane the wizard's Create Pane button invokes — one success path.

type Draft = { step: 'choose-source' | 'choose-type' | 'configure'; source: string | null; type: PaneType | null; metric: string | null; dimension: string | null; title: string | null };
const STEPS: Draft['step'][] = ['choose-source', 'choose-type', 'configure'];
let draft: Draft = { step: 'choose-source', source: null, type: null, metric: null, dimension: null, title: null };

function draftView() {
  return {
    step: draft.step, 'data-source': draft.source, 'pane-type': draft.type,
    'metric-column': draft.metric, 'dimension-column': draft.dimension, title: draft.title,
  };
}

function formValidate(args: Record<string, unknown>) {
  if (args.source ?? args['data-source']) draft.source = resolveSourceId(args.source ?? args['data-source']);
  if (args.type ?? args['pane-type']) draft.type = resolveType(args.type ?? args['pane-type']);
  if (args.metric ?? args['metric-column']) draft.metric = String(args.metric ?? args['metric-column']).trim();
  if (args.dimension ?? args['dimension-column']) draft.dimension = String(args.dimension ?? args['dimension-column']).trim();
  const errors: string[] = [];
  if (!draft.source) errors.push('data-source is required');
  if (!draft.type) errors.push('pane-type is required');
  if (draft.source && (!draft.metric || !metricsFor(draft.source).includes(draft.metric))) errors.push('metric-column is required and must be valid for the source');
  const needsDim = draft.type && draft.type !== 'counter' && draft.type !== 'table';
  if (needsDim && draft.source && (!draft.dimension || !dimensionsFor(draft.source).includes(draft.dimension))) errors.push('dimension-column is required for chart panes');
  return { ok: errors.length === 0, valid: errors.length === 0, errors, draft: draftView() };
}

function formAdvance(args: Record<string, unknown>) {
  // Set the value(s) for the current step, then move forward one step.
  if (draft.step === 'choose-source' && (args['data-source'] ?? args.source ?? args.value) !== undefined) {
    draft.source = resolveSourceId(args['data-source'] ?? args.source ?? args.value);
    if (!draft.source) return { ok: false, error: 'unknown data source' };
  } else if (draft.step === 'choose-type' && (args['pane-type'] ?? args.type ?? args.value) !== undefined) {
    draft.type = resolveType(args['pane-type'] ?? args.type ?? args.value);
    if (!draft.type) return { ok: false, error: 'unknown pane type' };
  } else if (draft.step === 'configure') {
    if (args['metric-column'] ?? args.metric) draft.metric = String(args['metric-column'] ?? args.metric).trim();
    if (args['dimension-column'] ?? args.dimension) draft.dimension = String(args['dimension-column'] ?? args.dimension).trim();
    if (args.title !== undefined) draft.title = String(args.title).trim() || null;
  }
  const idx = STEPS.indexOf(draft.step);
  if (idx < STEPS.length - 1) draft.step = STEPS[idx + 1];
  return { ok: true, draft: draftView() };
}

function formReturn() {
  const idx = STEPS.indexOf(draft.step);
  if (idx > 0) draft.step = STEPS[idx - 1];
  return { ok: true, draft: draftView() };
}

function formSubmit(args: Record<string, unknown>) {
  // Allow direct field passing too (mirrors filling all steps then Create).
  if (args['data-source'] ?? args.source) draft.source = resolveSourceId(args['data-source'] ?? args.source);
  if (args['pane-type'] ?? args.type) draft.type = resolveType(args['pane-type'] ?? args.type);
  if (args['metric-column'] ?? args.metric) draft.metric = String(args['metric-column'] ?? args.metric).trim();
  if (args['dimension-column'] ?? args.dimension) draft.dimension = String(args['dimension-column'] ?? args.dimension).trim();
  if (args.title !== undefined) draft.title = String(args.title).trim() || null;
  const check = formValidate({});
  if (!check.valid) return { ok: false, error: 'wizard is incomplete', errors: check.errors, draft: draftView() };
  const result = paneCreate({
    source: draft.source!, type: draft.type!, metric: draft.metric!,
    dimension: draft.dimension ?? undefined, title: draft.title ?? undefined,
  });
  if ((result as { ok: boolean }).ok) {
    draft = { step: 'choose-source', source: null, type: null, metric: null, dimension: null, title: null };
    store.setShowCreateWizard(false);
  }
  return result;
}

function formCancel() {
  draft = { step: 'choose-source', source: null, type: null, metric: null, dimension: null, title: null };
  store.setShowCreateWizard(false); // Same as the wizard's close control.
  return { ok: true, cancelled: true, draft: draftView() };
}

// ---- command-session-v1 (refresh ticker + offline collaboration flag) ------
// start/pause/stop drive the shared refresh ticker store.startRefreshTicker()
// that App.svelte mounts; connect/disconnect flip the shared offline flag the
// Collaboration Scenario's Go Online/Go Offline toggle reads. Tick timing and
// merge convergence stay Playwright-observed and are never forced here.

let stopTicker: (() => void) | null = null;

function sessionStart(args: Record<string, unknown>) {
  const demo = String(args.demo ?? 'refresh-tick');
  if (!stopTicker) stopTicker = store.startRefreshTicker();
  return { ok: true, demo, running: true };
}
function sessionPause() {
  if (stopTicker) { stopTicker(); stopTicker = null; }
  return { ok: true, running: false, paused: true };
}
function sessionStop() {
  if (stopTicker) { stopTicker(); stopTicker = null; }
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
  if (args.demo === 'refresh-tick') {
     // do nothing
  }
  // Tick advancement and merge convergence are Playwright-observed only; this
  // reports the live session state rather than fabricating a forced tick.
  const panes = store.getPages().flatMap((p) => p.panes);
  return {
    ok: true,
    tickerRunning: stopTicker !== null,
    offline: store.getIsOffline(),
    refreshingPanes: panes.filter((pn) => pn.refreshInterval !== 'off').map((pn) => ({ id: pn.id, refreshInterval: pn.refreshInterval, refreshTick: pn.refreshTick })),
    note: 'refresh-tick timing and collaboration merge convergence are observed live, not forced by WebMCP',
  };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  // entity-collection-v1 — panes
  { name: 'entity_pane_create', description: 'Create a pane on a page via the same store.addPane the Create Pane wizard calls. args: source (id or name), type (line|bar|donut|table|counter), metric (a metric-column or _count), dimension (required for line/bar/donut), size (small|medium|large), refresh-interval (off|30s|5m), title, pageId (defaults to the active page).', handler: paneCreate },
  { name: 'entity_pane_select', description: 'Open a pane in the editor (same as its Edit control). args: paneId, optional pageId.', handler: paneSelect },
  { name: 'entity_pane_update', description: 'Update a pane in place via the same store.updatePane the Edit dialog / Size / Refresh controls call. args: paneId, optional pageId, and any of source, type, metric, dimension, size, refresh-interval, title.', handler: paneUpdate },
  { name: 'entity_pane_delete', description: 'Delete a pane via the same store.deletePane the Delete confirmation calls. args: paneId, optional pageId, confirm=true (required).', handler: paneDelete },
  { name: 'entity_pane_reorder', description: 'Move a pane one grid cell via the same store.movePane the Move Up/Down/Left/Right buttons call. args: paneId, optional pageId, direction (up|down|left|right). Fails at a grid boundary, matching the disabled buttons.', handler: paneReorder },
  // entity-collection-v1 — pages
  { name: 'entity_page_create', description: 'Add a page via the same store.addPage the Add Page control calls (also makes it active). args: name (optional).', handler: pageCreate },
  { name: 'entity_page_select', description: 'Switch the active page via the same store.setActivePageId a page-tab click calls. args: id.', handler: pageSelect },
  { name: 'entity_page_rename', description: 'Rename a page via the same store.renamePage the inline rename commits. args: id, name.', handler: pageRename },
  { name: 'entity_page_delete', description: 'Delete a page via the same store.deletePage the delete-page confirmation calls. args: id, confirm=true (required). Refuses to delete the last page.', handler: pageDelete },
  // form-workflow-v1 — Create Pane wizard
  { name: 'form_pane_validate', description: 'Validate the Create Pane draft against the wizard rules (source+type+metric required; charts need a dimension). Optionally sets fields first. args: data-source, pane-type, metric-column, dimension-column.', handler: formValidate },
  { name: 'form_pane_advance', description: 'Set the current wizard step field(s) and move forward one step (choose-source -> choose-type -> configure), mirroring the Next button. args depend on the step: data-source, pane-type, metric-column, dimension-column, title.', handler: formAdvance },
  { name: 'form_pane_return', description: 'Step the Create Pane wizard back one step, mirroring the Back button.', handler: formReturn },
  { name: 'form_pane_submit', description: 'Submit the Create Pane wizard: validate the draft and, if complete, add the pane via the SAME store.addPane the Create Pane button calls. Accepts all fields directly too. args: data-source, pane-type, metric-column, dimension-column, title.', handler: formSubmit },
  { name: 'form_pane_cancel', description: 'Cancel the Create Pane wizard, clearing the draft and closing the dialog.', handler: formCancel },
  // command-session-v1 — refresh ticker + collaboration offline flag
  { name: 'session_workspace_start', description: 'Start the shared refresh ticker (store.startRefreshTicker) that App.svelte mounts. args: demo (refresh-tick).', handler: sessionStart },
  { name: 'session_workspace_pause', description: 'Pause the shared refresh ticker.', handler: sessionPause },
  { name: 'session_workspace_stop', description: 'Stop the shared refresh ticker.', handler: sessionStop },
  { name: 'session_workspace_connect', description: 'Go online for the Collaboration Scenario (store.setIsOffline(false)) — the same shared flag the Go Online button reads.', handler: sessionConnect },
  { name: 'session_workspace_disconnect', description: 'Go offline for the Collaboration Scenario (store.setIsOffline(true)) — the same shared flag the Go Offline button reads.', handler: sessionDisconnect },
  { name: 'session_workspace_advance', description: 'Report the live session state (ticker running, offline flag, per-pane refresh ticks). Tick timing and merge convergence are Playwright-observed, not forced here.', handler: sessionAdvance },
];



export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}

// ---- artifact-transfer-v1 ---------------------------------------------------
// export/copy call the SAME store.compileWorkspaceExport / compileMarkdownReport
// the Workspace panel's Download/Copy buttons call — real compilation, not a
// fabricated ok:true. Per the module restriction ("no raw files, blobs, or
// artifact contents in WebMCP arguments or results") the compiled JSON/Markdown
// itself is never put in the tool result — only counts that prove the same
// command ran; the actual bytes (download, clipboard write) stay Playwright's
// to observe. Import cannot legally receive file content through WebMCP args
// at all, so there is no real command for this tool to drive — it reports
// ok:false rather than fake a success the file-picker-only UI path can't reach.

function artifactExport(args: Record<string, unknown>) {
  const format = String(args.format ?? 'workspace-json');
  if (format === 'workspace-json') {
    const workspace = store.compileWorkspaceExport();
    const paneCount = workspace.pages.reduce((sum, p) => sum + p.panes.length, 0);
    return { ok: true, format, pageCount: workspace.pages.length, paneCount };
  }
  if (format === 'markdown-report') {
    const report = store.compileMarkdownReport();
    return { ok: true, format, length: report.length };
  }
  return { ok: false, error: 'format must be workspace-json | markdown-report' };
}

function artifactImport() {
  return {
    ok: false,
    error: 'workspace import requires selecting a file via the Import file picker; file-picker interaction and file bytes are Playwright-only and cannot be driven through WebMCP.',
  };
}

function artifactCopy(args: Record<string, unknown>) {
  const format = String(args.format ?? 'workspace-json');
  if (format !== 'workspace-json') return { ok: false, error: 'format must be workspace-json' };
  // Same compile command the Copy Workspace JSON button calls; the clipboard
  // write itself remains Playwright-observed.
  const workspace = store.compileWorkspaceExport();
  const paneCount = workspace.pages.reduce((sum, p) => sum + p.panes.length, 0);
  return { ok: true, format, pageCount: workspace.pages.length, paneCount };
}

TOOLS.push(
  { name: 'artifact_workspace_export', description: 'Compile the workspace export via the same store.compileWorkspaceExport / compileMarkdownReport the Download buttons call. args: format (workspace-json|markdown-report). Returns counts only — actual JSON/Markdown bytes stay Playwright-observed.', handler: artifactExport },
  { name: 'artifact_workspace_import', description: 'Always returns ok:false: workspace import requires real file bytes from the file picker, which cannot travel through WebMCP arguments per the artifact-transfer-v1 contract. Use Playwright to drive the Import file picker.', handler: artifactImport },
  { name: 'artifact_workspace_copy', description: 'Compile the same workspace JSON the Copy Workspace JSON button copies via store.compileWorkspaceExport. args: format (workspace-json). Returns counts only; the clipboard write stays Playwright-observed.', handler: artifactCopy },
);
