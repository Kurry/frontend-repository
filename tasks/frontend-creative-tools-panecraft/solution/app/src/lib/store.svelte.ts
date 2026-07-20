import {
  dataSources,
  getDataSourceById,
  metricsFor,
  dimensionsFor,
} from '../data/mockData';

export type PaneType = 'line' | 'bar' | 'donut' | 'table' | 'counter';
export type PaneSize = 'small' | 'medium' | 'large';
export type RefreshInterval = 'off' | '30s' | '5m';
export type DateRange = 'today' | 'last-7-days' | 'last-30-days' | 'last-90-days';
export type ShareAccess = 'public' | 'private';
export type WizardStep = 'choose-source' | 'choose-type' | 'configure';

export const PANE_TYPES: PaneType[] = ['line', 'bar', 'donut', 'table', 'counter'];
export const PANE_SIZES: PaneSize[] = ['small', 'medium', 'large'];
export const REFRESH_INTERVALS: RefreshInterval[] = ['off', '30s', '5m'];

export const PANE_TYPE_LABELS: Record<PaneType, string> = {
  line: 'Line Chart',
  bar: 'Bar Chart',
  donut: 'Donut Chart',
  table: 'Data Table',
  counter: 'Counter',
};

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today Only' },
  { value: 'last-7-days', label: 'Last 7 Days' },
  { value: 'last-30-days', label: 'Last 30 Days' },
  { value: 'last-90-days', label: 'Last 90 Days' },
];

export function dateRangeLabel(range: DateRange): string {
  return DATE_RANGES.find((r) => r.value === range)?.label ?? range;
}

export interface Pane {
  id: string;
  title: string;
  type: PaneType;
  source: string;
  metric: string;
  dimension: string | null;
  size: PaneSize;
  refreshInterval: RefreshInterval;
  lastRefreshTime: number;
  refreshTick: number;
}

export interface Page {
  id: string;
  name: string;
  panes: Pane[];
}

export interface SavedAnalysis {
  id: string;
  name: string;
  source: string;
  metric: string;
  updatedAt: number;
}

export interface ConflictChoice {
  label: string;
  action: () => void;
}

export interface ConflictResolution {
  message: string;
  choices: ConflictChoice[];
}

export interface PaneConfig {
  source: string;
  type: PaneType;
  metric: string;
  dimension: string | null;
  size: PaneSize;
  refreshInterval: RefreshInterval;
}

export type FieldError = { field: string; message: string };
export type ActionResult = { ok: true } | { ok: false; field: string; message: string };

// ---- storage ----------------------------------------------------------------

const STORAGE_KEY = 'panecraft-state';
const SAVED_ANALYSES_KEY = 'panecraft-saved-analyses';
const COLLAB_KEY = 'panecraft-collaboration';

let storageAvailable = $state(true);

function probeStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = `__panecraft-probe-${Date.now()}`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

const storage = probeStorage();
storageAvailable = storage !== null;

let storageWarning = $state(
  storageAvailable ? '' : 'Persistent storage is unavailable, so changes will not persist beyond this session.',
);

function readJson<T>(key: string): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    storageWarning = 'Persistent storage is unavailable, so changes will not persist beyond this session.';
  }
}

// ---- ids --------------------------------------------------------------------

let idCounter = 1;
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

// ---- field-contract validation ----------------------------------------------

export function validatePaneConfig(config: {
  source?: unknown;
  type?: unknown;
  metric?: unknown;
  dimension?: unknown;
  size?: unknown;
  refreshInterval?: unknown;
}): ActionResult {
  const source = typeof config.source === 'string' ? config.source : '';
  if (!getDataSourceById(source)) {
    return {
      ok: false,
      field: 'source',
      message: `source must be one of ${dataSources.map((ds) => ds.id).join(', ')}.`,
    };
  }
  const type = config.type as PaneType;
  if (!PANE_TYPES.includes(type)) {
    return {
      ok: false,
      field: 'type',
      message: `type must be one of ${PANE_TYPES.join(', ')}.`,
    };
  }
  const metric = typeof config.metric === 'string' ? config.metric.trim() : '';
  if (!metric) {
    return { ok: false, field: 'metric', message: 'metric is required and must name a column on the chosen source.' };
  }
  if (!metricsFor(source).includes(metric)) {
    return {
      ok: false,
      field: 'metric',
      message: `metric must be one of: ${metricsFor(source).join(', ')}.`,
    };
  }
  const isChart = type === 'line' || type === 'bar' || type === 'donut';
  const dimension = config.dimension === undefined || config.dimension === null || config.dimension === ''
    ? null
    : typeof config.dimension === 'string'
      ? config.dimension.trim()
      : null;
  if (isChart) {
    if (!dimension) {
      return {
        ok: false,
        field: 'dimension',
        message: `dimension is required for ${PANE_TYPE_LABELS[type]} panes.`,
      };
    }
    if (!dimensionsFor(source).includes(dimension)) {
      return {
        ok: false,
        field: 'dimension',
        message: `dimension must be one of: ${dimensionsFor(source).join(', ')}.`,
      };
    }
    if (dimension === metric) {
      return {
        ok: false,
        field: 'dimension',
        message: 'dimension must be a different column than metric for chart panes.',
      };
    }
  } else if (dimension !== null) {
    return {
      ok: false,
      field: 'dimension',
      message: `dimension must be null for ${PANE_TYPE_LABELS[type]} panes.`,
    };
  }
  const size = config.size as PaneSize;
  if (!PANE_SIZES.includes(size)) {
    return { ok: false, field: 'size', message: `size must be one of ${PANE_SIZES.join(', ')}.` };
  }
  const refreshInterval = config.refreshInterval as RefreshInterval;
  if (!REFRESH_INTERVALS.includes(refreshInterval)) {
    return {
      ok: false,
      field: 'refreshInterval',
      message: `refreshInterval must be one of ${REFRESH_INTERVALS.join(', ')}.`,
    };
  }
  return { ok: true };
}

export function validatePageName(name: string): ActionResult {
  const clean = name.trim();
  if (!clean) {
    return { ok: false, field: 'name', message: 'name is required (1 to 40 characters).' };
  }
  if (clean.length > 40) {
    return { ok: false, field: 'name', message: 'name must be 40 characters or fewer.' };
  }
  return { ok: true };
}

export function validateSavedAnalysis(
  candidate: { name: string; source: string; metric: string },
  excludeId?: string,
): ActionResult {
  const clean = candidate.name.trim();
  if (!clean) {
    return { ok: false, field: 'name', message: 'name is required (1 to 60 characters).' };
  }
  if (clean.length > 60) {
    return { ok: false, field: 'name', message: 'name must be 60 characters or fewer.' };
  }
  const duplicate = savedAnalyses.find(
    (item) => item.name.toLowerCase() === clean.toLowerCase() && item.id !== excludeId,
  );
  if (duplicate) {
    return { ok: false, field: 'name', message: `name "${clean}" is already used by another saved analysis.` };
  }
  if (!getDataSourceById(candidate.source)) {
    return {
      ok: false,
      field: 'source',
      message: `source must be one of ${dataSources.map((ds) => ds.id).join(', ')}.`,
    };
  }
  const metric = candidate.metric.trim();
  if (!metric || !metricsFor(candidate.source).includes(metric)) {
    return {
      ok: false,
      field: 'metric',
      message: `metric must be one of: ${metricsFor(candidate.source).join(', ')}.`,
    };
  }
  return { ok: true };
}

// ---- workspace state ----------------------------------------------------------

function defaultPane(
  title: string,
  type: PaneType,
  source: string,
  metric: string,
  dimension: string | null,
  size: PaneSize,
): Pane {
  return {
    id: generateId('pane'),
    title,
    type,
    source,
    metric,
    dimension,
    size,
    refreshInterval: 'off',
    lastRefreshTime: Date.now(),
    refreshTick: 0,
  };
}

function createDefaultPages(): Page[] {
  return [
    {
      id: generateId('page'),
      name: 'Dashboard',
      panes: [
        defaultPane('Traffic trend', 'line', 'website-analytics', 'pageViews', 'date', 'medium'),
        defaultPane('Revenue by category', 'bar', 'sales-sheet', 'revenue', 'category', 'medium'),
        defaultPane('Open support volume', 'counter', 'support-tickets', '_count', null, 'small'),
      ],
    },
  ];
}

const LEGACY_DATE_RANGES: Record<string, DateRange> = {
  '1': 'today',
  '7': 'last-7-days',
  '30': 'last-30-days',
  '90': 'last-90-days',
};

interface PersistedState {
  pages: Page[];
  activePageId: string;
  dateRange?: DateRange;
}

function normalizePane(raw: Record<string, unknown>): Pane | null {
  const source = (raw.source ?? raw.dataSourceId) as string;
  if (typeof source !== 'string' || !getDataSourceById(source)) return null;
  const type = (PANE_TYPES.includes(raw.type as PaneType) ? raw.type : 'line') as PaneType;
  const isChart = type === 'line' || type === 'bar' || type === 'donut';
  const dimension = typeof raw.dimension === 'string' && raw.dimension ? raw.dimension : null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : generateId('pane'),
    title: typeof raw.title === 'string' && raw.title ? raw.title : 'Pane',
    type,
    source,
    metric: typeof raw.metric === 'string' && raw.metric ? raw.metric : metricsFor(source)[0] ?? '_count',
    dimension: isChart ? dimension : null,
    size: PANE_SIZES.includes(raw.size as PaneSize) ? (raw.size as PaneSize) : 'small',
    refreshInterval: REFRESH_INTERVALS.includes(raw.refreshInterval as RefreshInterval)
      ? (raw.refreshInterval as RefreshInterval)
      : 'off',
    lastRefreshTime: Date.now(),
    refreshTick: typeof raw.refreshTick === 'number' ? raw.refreshTick : 0,
  };
}

function loadPages(): { pages: Page[]; activePageId: string; dateRange: DateRange } {
  const saved = readJson<PersistedState>(STORAGE_KEY);
  if (saved?.pages?.length) {
    const pages: Page[] = [];
    for (const rawPage of saved.pages) {
      const name = typeof rawPage?.name === 'string' && rawPage.name.trim() ? rawPage.name.trim() : 'Untitled';
      const panes = (Array.isArray(rawPage?.panes) ? rawPage.panes : [])
        .map((raw) => normalizePane(raw as Record<string, unknown>))
        .filter((pane): pane is Pane => pane !== null);
      pages.push({
        id: typeof rawPage.id === 'string' && rawPage.id ? rawPage.id : generateId('page'),
        name,
        panes,
      });
    }
    if (pages.length) {
      const rawRange = String(saved.dateRange ?? '');
      const dateRange = (DATE_RANGES.some((r) => r.value === rawRange)
        ? rawRange
        : LEGACY_DATE_RANGES[rawRange] ?? 'last-30-days') as DateRange;
      return {
        pages,
        activePageId: pages.some((p) => p.id === saved.activePageId) ? saved.activePageId : pages[0]!.id,
        dateRange,
      };
    }
  }
  const pages = createDefaultPages();
  return { pages, activePageId: pages[0]!.id, dateRange: 'last-30-days' };
}

const initial = loadPages();

let pages = $state<Page[]>(initial.pages);
let activePageId = $state(initial.activePageId);
let dateRange = $state<DateRange>(initial.dateRange);

// Dialog / surface visibility
let showDataSourcePreview = $state<string | null>(null); // source id
let showSharePanel = $state(false);
let showCollaboration = $state(false);
let exportCenter = $state<{ open: boolean; tab: 'workspace-json' | 'markdown-report'; mode: 'export' | 'import' }>({
  open: false,
  tab: 'workspace-json',
  mode: 'export',
});

let isOffline = $state(false);
let conflictResolution = $state<ConflictResolution | null>(null);

// Edit Pane target (opened by the pane's Edit control or entity_pane_select).
let editingPane = $state<{ paneId: string; pageId: string } | null>(null);
// The most recently created pane id, used for the settle/glow microinteraction.
let lastCreatedPaneId = $state<string | null>(null);
let lastCreatedTimer: ReturnType<typeof setTimeout> | null = null;

// Cross-pane crosshair sync (innovation aid): the date label currently hovered
// in any time-series pane, mirrored as a crosshair by the other time-series panes.
let hoveredDateLabel = $state<string | null>(null);

// Transient announcements for the polite live region.
let announcement = $state('');
let announcementStamp = $state(0);

export function announce(message: string) {
  announcement = message;
  announcementStamp += 1;
}

export function getAnnouncement(): { message: string; stamp: number } {
  return { message: announcement, stamp: announcementStamp };
}

// ---- saved analyses -----------------------------------------------------------

function loadSavedAnalyses(): SavedAnalysis[] {
  const saved = readJson<unknown>(SAVED_ANALYSES_KEY);
  if (Array.isArray(saved)) {
    const parsed: SavedAnalysis[] = [];
    for (const raw of saved as Record<string, unknown>[]) {
      if (!raw || typeof raw !== 'object') continue;
      const source = (raw.source ?? raw.sourceId) as string;
      if (typeof raw.name !== 'string' || !getDataSourceById(source)) continue;
      parsed.push({
        id: typeof raw.id === 'string' && raw.id ? raw.id : generateId('analysis'),
        name: raw.name,
        source,
        metric: typeof raw.metric === 'string' && raw.metric ? raw.metric : metricsFor(source)[0] ?? '',
        updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
      });
    }
    if (parsed.length || Array.isArray(saved)) return parsed;
  }
  return [
    {
      id: 'analysis-website-pulse',
      name: 'Website pulse',
      source: 'website-analytics',
      metric: 'sessions',
      updatedAt: Date.now(),
    },
  ];
}

let savedAnalyses = $state<SavedAnalysis[]>(loadSavedAnalyses());

export function getSavedAnalyses(): SavedAnalysis[] {
  return savedAnalyses;
}

function persistAnalyses() {
  writeJson(SAVED_ANALYSES_KEY, savedAnalyses);
}

export function createSavedAnalysis(candidate: { name: string; source: string; metric: string }):
  ActionResult & { id?: string } {
  const check = validateSavedAnalysis(candidate);
  if (!check.ok) return check;
  const created: SavedAnalysis = {
    id: generateId('analysis'),
    name: candidate.name.trim(),
    source: candidate.source,
    metric: candidate.metric.trim(),
    updatedAt: Date.now(),
  };
  savedAnalyses.push(created);
  persistAnalyses();
  return { ok: true, id: created.id };
}

export function updateSavedAnalysis(id: string, candidate: { name: string; source: string; metric: string }): ActionResult {
  const existing = savedAnalyses.find((item) => item.id === id);
  if (!existing) return { ok: false, field: 'name', message: 'That analysis no longer exists.' };
  const check = validateSavedAnalysis(candidate, id);
  if (!check.ok) return check;
  existing.name = candidate.name.trim();
  existing.source = candidate.source;
  existing.metric = candidate.metric.trim();
  existing.updatedAt = Date.now();
  persistAnalyses();
  return { ok: true };
}

export function deleteSavedAnalysis(id: string) {
  const index = savedAnalyses.findIndex((item) => item.id === id);
  if (index < 0) return;
  savedAnalyses.splice(index, 1);
  persistAnalyses();
}

// ---- derived + basic getters ---------------------------------------------------

const activePage = $derived(pages.find((page) => page.id === activePageId) ?? pages[0]!);

export function getPages(): Page[] {
  return pages;
}

export function getActivePageId(): string {
  return activePageId;
}

export function setActivePageId(id: string) {
  if (!pages.some((page) => page.id === id)) return;
  activePageId = id;
  persist();
}

export function getActivePage(): Page {
  return activePage;
}

export function getDateRange(): DateRange {
  return dateRange;
}

export function setDateRange(range: DateRange) {
  if (!DATE_RANGES.some((r) => r.value === range)) return;
  dateRange = range;
  persist();
}

export function getShowDataSourcePreview(): string | null {
  return showDataSourcePreview;
}

export function setShowDataSourcePreview(sourceId: string | null) {
  showDataSourcePreview = sourceId;
}

export function getShowSharePanel(): boolean {
  return showSharePanel;
}

export function setShowSharePanel(value: boolean) {
  showSharePanel = value;
}

export function getShowCollaboration(): boolean {
  return showCollaboration;
}

export function setShowCollaboration(value: boolean) {
  showCollaboration = value;
}

export function getExportCenter() {
  return exportCenter;
}

export function openExportCenter(mode: 'export' | 'import', tab: 'workspace-json' | 'markdown-report' = 'workspace-json') {
  exportCenter.open = true;
  exportCenter.mode = mode;
  exportCenter.tab = tab;
}

export function closeExportCenter() {
  exportCenter.open = false;
}

export function getIsOffline(): boolean {
  return isOffline;
}

export function setIsOffline(value: boolean) {
  isOffline = value;
}

export function getConflictResolution(): ConflictResolution | null {
  return conflictResolution;
}

export function setConflictResolution(value: ConflictResolution | null) {
  conflictResolution = value;
}

export function getHoveredDateLabel(): string | null {
  return hoveredDateLabel;
}

export function setHoveredDateLabel(label: string | null) {
  hoveredDateLabel = label;
}

export function getStorageWarning(): string {
  return storageWarning;
}

export function getEditingPane(): { paneId: string; pageId: string } | null {
  return editingPane;
}

export function setEditingPane(value: { paneId: string; pageId: string } | null) {
  editingPane = value;
}

export function getLastCreatedPaneId(): string | null {
  return lastCreatedPaneId;
}

// ---- page + pane commands -------------------------------------------------------

function persist() {
  writeJson(STORAGE_KEY, { pages, activePageId, dateRange });
}

export function addPage(name: string): ActionResult & { id?: string } {
  const check = validatePageName(name);
  if (!check.ok) return check;
  const newPage: Page = { id: generateId('page'), name: name.trim(), panes: [] };
  pages.push(newPage);
  activePageId = newPage.id;
  persist();
  return { ok: true, id: newPage.id };
}

export function renamePage(pageId: string, newName: string): ActionResult {
  const page = pages.find((candidate) => candidate.id === pageId);
  if (!page) return { ok: false, field: 'name', message: 'That page no longer exists.' };
  const check = validatePageName(newName);
  if (!check.ok) return check;
  page.name = newName.trim();
  persist();
  return { ok: true };
}

export function deletePage(pageId: string): ActionResult {
  if (pages.length <= 1) {
    return { ok: false, field: 'name', message: 'The last remaining page cannot be deleted.' };
  }
  const index = pages.findIndex((page) => page.id === pageId);
  if (index < 0) return { ok: false, field: 'name', message: 'That page no longer exists.' };
  pages.splice(index, 1);
  if (activePageId === pageId) {
    activePageId = pages[Math.min(index, pages.length - 1)]!.id;
  }
  persist();
  return { ok: true };
}

export function createPane(pageId: string, config: PaneConfig & { title?: string }): ActionResult & { id?: string } {
  const check = validatePaneConfig(config);
  if (!check.ok) return check;
  const page = pages.find((candidate) => candidate.id === pageId);
  if (!page) return { ok: false, field: 'source', message: 'That page no longer exists.' };
  const src = getDataSourceById(config.source)!;
  const pane: Pane = {
    id: generateId('pane'),
    title: config.title?.trim() || `${src.name} ${PANE_TYPE_LABELS[config.type]}`,
    type: config.type,
    source: config.source,
    metric: config.metric.trim(),
    dimension: config.dimension,
    size: config.size,
    refreshInterval: config.refreshInterval,
    lastRefreshTime: Date.now(),
    refreshTick: 0,
  };
  page.panes.push(pane);
  lastCreatedPaneId = pane.id;
  if (lastCreatedTimer) clearTimeout(lastCreatedTimer);
  lastCreatedTimer = setTimeout(() => {
    lastCreatedPaneId = null;
  }, 2_500);
  persist();
  return { ok: true, id: pane.id };
}

export function updatePane(pageId: string, paneId: string, updates: Partial<Pane>): ActionResult {
  const pane = pages.find((page) => page.id === pageId)?.panes.find((candidate) => candidate.id === paneId);
  if (!pane) return { ok: false, field: 'source', message: 'That pane no longer exists.' };
  const merged: PaneConfig = {
    source: updates.source ?? pane.source,
    type: updates.type ?? pane.type,
    metric: updates.metric ?? pane.metric,
    dimension: updates.dimension !== undefined ? updates.dimension : pane.dimension,
    size: updates.size ?? pane.size,
    refreshInterval: updates.refreshInterval ?? pane.refreshInterval,
  };
  const isPartialEnumOnly =
    Object.keys(updates).every((key) =>
      ['size', 'refreshInterval', 'lastRefreshTime', 'refreshTick', 'title'].includes(key));
  if (!isPartialEnumOnly) {
    const check = validatePaneConfig(merged);
    if (!check.ok) return check;
  }
  const cleanUpdates: Partial<Pane> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) (cleanUpdates as Record<string, unknown>)[key] = value;
  }
  delete cleanUpdates.source;
  delete cleanUpdates.type;
  delete cleanUpdates.metric;
  delete cleanUpdates.dimension;
  delete cleanUpdates.size;
  delete cleanUpdates.refreshInterval;
  Object.assign(pane, cleanUpdates, {
    source: merged.source,
    type: merged.type,
    metric: merged.metric.trim(),
    dimension: merged.dimension,
    size: merged.size,
    refreshInterval: merged.refreshInterval,
  });
  persist();
  return { ok: true };
}

export function deletePane(pageId: string, paneId: string) {
  const page = pages.find((candidate) => candidate.id === pageId);
  if (!page) return;
  const index = page.panes.findIndex((pane) => pane.id === paneId);
  if (index < 0) return;
  page.panes.splice(index, 1);
  persist();
}

function targetIndex(page: Page, paneId: string, direction: 'up' | 'down' | 'left' | 'right'): number {
  const index = page.panes.findIndex((pane) => pane.id === paneId);
  if (index < 0) return -1;
  const columns = 4;
  const row = Math.floor(index / columns);
  const column = index % columns;
  if (direction === 'up' && row > 0) return index - columns;
  if (direction === 'down' && index + columns < page.panes.length) return index + columns;
  if (direction === 'left' && column > 0) return index - 1;
  if (direction === 'right' && column < columns - 1 && index < page.panes.length - 1) return index + 1;
  return index;
}

export function movePane(pageId: string, paneId: string, direction: 'up' | 'down' | 'left' | 'right') {
  const page = pages.find((candidate) => candidate.id === pageId);
  if (!page) return;
  const index = page.panes.findIndex((pane) => pane.id === paneId);
  const nextIndex = targetIndex(page, paneId, direction);
  if (index < 0 || nextIndex < 0 || nextIndex === index) return;
  const [pane] = page.panes.splice(index, 1);
  page.panes.splice(nextIndex, 0, pane!);
  persist();
}

export function canMovePane(pageId: string, paneId: string, direction: 'up' | 'down' | 'left' | 'right'): boolean {
  const page = pages.find((candidate) => candidate.id === pageId);
  if (!page) return false;
  const index = page.panes.findIndex((pane) => pane.id === paneId);
  return index >= 0 && targetIndex(page, paneId, direction) !== index;
}

// ---- Create Pane wizard (shared state so the UI and WebMCP drive one draft) ----

export interface WizardDraft {
  open: boolean;
  step: WizardStep;
  source: string;
  type: PaneType;
  metric: string;
  dimension: string;
  title: string;
  size: PaneSize;
  refreshInterval: RefreshInterval;
  errors: Record<string, string>;
}

const emptyDraft = (): WizardDraft => ({
  open: false,
  step: 'choose-source',
  source: '',
  type: 'line',
  metric: '',
  dimension: '',
  title: '',
  size: 'small',
  refreshInterval: 'off',
  errors: {},
});

let wizard = $state<WizardDraft>(emptyDraft());
// Idempotency guard: a submit in flight cannot create a second pane.
let wizardSubmitting = false;
// Coachmark: point at Export after the first pane create/edit of the session.
let coachmark = $state<{ open: boolean; step: number }>({ open: false, step: 0 });
let coachSeenKey = 'panecraft-coach-seen';

export function getWizard(): WizardDraft {
  return wizard;
}

export function openCreateWizard() {
  wizard.open = true;
  wizard.errors = {};
}

export function closeCreateWizard() {
  wizard = emptyDraft();
}

export function setWizardField(field: 'source' | 'type' | 'metric' | 'dimension' | 'title' | 'size' | 'refreshInterval', value: string) {
  (wizard as unknown as Record<string, unknown>)[field] = value;
  // Clear the field's error as soon as the user revisits it.
  if (wizard.errors[field]) {
    const next = { ...wizard.errors };
    delete next[field];
    wizard.errors = next;
  }
  if (field === 'source') {
    wizard.metric = '';
    wizard.dimension = '';
  }
  if (field === 'type') {
    wizard.dimension = '';
  }
}

export function validateWizardStep(step: WizardStep): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 'choose-source') {
    if (!wizard.source) errors.source = 'data-source is required — pick one of the bundled sources.';
  } else if (step === 'configure') {
    const check = validatePaneConfig({
      source: wizard.source,
      type: wizard.type,
      metric: wizard.metric,
      dimension: wizard.dimension,
      size: wizard.size,
      refreshInterval: wizard.refreshInterval,
    });
    if (!check.ok) errors[check.field] = check.message;
  }
  return errors;
}

export function wizardStepValid(step: WizardStep): boolean {
  return Object.keys(validateWizardStep(step)).length === 0;
}

export function wizardAdvance(): ActionResult {
  const errors = validateWizardStep(wizard.step);
  if (Object.keys(errors).length) {
    wizard.errors = errors;
    const field = Object.keys(errors)[0]!;
    return { ok: false, field, message: errors[field]! };
  }
  if (wizard.step === 'choose-source') wizard.step = 'choose-type';
  else if (wizard.step === 'choose-type') wizard.step = 'configure';
  return { ok: true };
}

export function wizardReturn() {
  if (wizard.step === 'configure') wizard.step = 'choose-type';
  else if (wizard.step === 'choose-type') wizard.step = 'choose-source';
}

export function submitCreateWizard(): ActionResult & { id?: string } {
  if (wizardSubmitting) return { ok: false, field: 'metric', message: 'Create Pane is already in progress.' };
  const errors = validateWizardStep('configure');
  if (Object.keys(errors).length) {
    wizard.errors = errors;
    const field = Object.keys(errors)[0]!;
    return { ok: false, field, message: errors[field]! };
  }
  wizardSubmitting = true;
  try {
    // The pane lands on whichever page is active when the wizard completes —
    // starting a wizard on one page and finishing it on another is supported.
    const result = createPane(activePageId, {
      source: wizard.source,
      type: wizard.type,
      metric: wizard.metric,
      dimension: wizard.dimension || null,
      size: wizard.size,
      refreshInterval: wizard.refreshInterval,
      title: wizard.title,
    });
    if (result.ok) {
      closeCreateWizard();
      announce('Pane created.');
      maybeCoachAfterEdit();
    } else {
      wizard.errors = { [result.field]: result.message };
    }
    return result;
  } finally {
    wizardSubmitting = false;
  }
}

function maybeCoachAfterEdit() {
  try {
    if (storage?.getItem(coachSeenKey)) return;
    storage?.setItem(coachSeenKey, '1');
  } catch {
    /* coachmark is best-effort */
  }
  coachmark.open = true;
  coachmark.step = 0;
}

export function getCoachmark() {
  return coachmark;
}

export function advanceCoachmark() {
  if (coachmark.step >= 2) coachmark.open = false;
  else coachmark.step += 1;
}

export function dismissCoachmark() {
  coachmark.open = false;
}

// ---- workspace artifact (Export / Import / Copy) -------------------------------

export interface WorkspaceDocument {
  schemaVersion: 'panecraft-workspace-v1';
  activePageId: string;
  dateRange: DateRange;
  pages: {
    id: string;
    name: string;
    panes: {
      id: string;
      title?: string;
      source: string;
      type: PaneType;
      metric: string;
      dimension: string | null;
      size: PaneSize;
      refreshInterval: RefreshInterval;
    }[];
  }[];
  savedAnalyses: { name: string; source: string; metric: string }[];
}

export function compileWorkspaceExport(): WorkspaceDocument {
  return {
    schemaVersion: 'panecraft-workspace-v1',
    activePageId,
    dateRange,
    pages: pages.map((page) => ({
      id: page.id,
      name: page.name,
      panes: page.panes.map((pane) => ({
        id: pane.id,
        title: pane.title,
        source: pane.source,
        type: pane.type,
        metric: pane.metric,
        dimension: pane.dimension,
        size: pane.size,
        refreshInterval: pane.refreshInterval,
      })),
    })),
    savedAnalyses: savedAnalyses.map((analysis) => ({
      name: analysis.name,
      source: analysis.source,
      metric: analysis.metric,
    })),
  };
}

export function compileMarkdownReport(): string {
  const lines: string[] = [
    '# PaneCraft Workspace Report',
    '',
    `Generated ${new Date().toISOString()}`,
    '',
    `Active date range: **${dateRangeLabel(dateRange)}**`,
    '',
  ];
  for (const page of pages) {
    lines.push(`## Page: ${page.name}${page.id === activePageId ? ' (active)' : ''}`, '');
    if (page.panes.length === 0) {
      lines.push('_No panes on this page._', '');
      continue;
    }
    lines.push('| Pane | Type | Source | Metric | Dimension | Size | Refresh |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const pane of page.panes) {
      lines.push(
        `| ${pane.title} | ${pane.type} | ${pane.source} | ${pane.metric} | ${pane.dimension ?? '—'} | ${pane.size} | ${pane.refreshInterval} |`,
      );
    }
    lines.push('');
  }
  lines.push('## Saved analyses', '');
  if (savedAnalyses.length === 0) {
    lines.push('_No saved analyses._', '');
  } else {
    for (const analysis of savedAnalyses) {
      lines.push(`- **${analysis.name}** — ${analysis.source} / ${analysis.metric}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function validateWorkspaceDocument(raw: unknown): ActionResult & { doc?: WorkspaceDocument } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, field: 'document', message: 'Workspace JSON must be a single object.' };
  }
  const data = raw as Record<string, unknown>;
  if (data.schemaVersion !== 'panecraft-workspace-v1') {
    return {
      ok: false,
      field: 'schemaVersion',
      message: 'schemaVersion must be exactly panecraft-workspace-v1.',
    };
  }
  if (!Array.isArray(data.pages) || data.pages.length === 0) {
    return { ok: false, field: 'pages', message: 'pages must be a non-empty array.' };
  }
  if (typeof data.activePageId !== 'string' || !data.activePageId) {
    return { ok: false, field: 'activePageId', message: 'activePageId must be a non-empty string.' };
  }
  if (typeof data.dateRange !== 'string' || !DATE_RANGES.some((r) => r.value === data.dateRange)) {
    return {
      ok: false,
      field: 'dateRange',
      message: `dateRange must be one of ${DATE_RANGES.map((r) => r.value).join(', ')}.`,
    };
  }
  const nextPages: Page[] = [];
  for (let pi = 0; pi < data.pages.length; pi++) {
    const rawPage = data.pages[pi] as Record<string, unknown>;
    if (!rawPage || typeof rawPage !== 'object') {
      return { ok: false, field: `pages[${pi}]`, message: 'each page must be an object.' };
    }
    if (typeof rawPage.id !== 'string' || !rawPage.id) {
      return { ok: false, field: `pages[${pi}].id`, message: 'each page requires a non-empty id.' };
    }
    const nameCheck = validatePageName(String(rawPage.name ?? ''));
    if (!nameCheck.ok) {
      return { ok: false, field: `pages[${pi}].name`, message: nameCheck.message };
    }
    const rawPanes = Array.isArray(rawPage.panes) ? rawPage.panes : [];
    const panes: Pane[] = [];
    for (let ni = 0; ni < rawPanes.length; ni++) {
      const rawPane = rawPanes[ni] as Record<string, unknown>;
      const where = `pages[${pi}].panes[${ni}]`;
      if (!rawPane || typeof rawPane !== 'object') {
        return { ok: false, field: where, message: 'each pane must be an object.' };
      }
      const check = validatePaneConfig({
        source: rawPane.source,
        type: rawPane.type,
        metric: rawPane.metric,
        dimension: rawPane.dimension,
        size: rawPane.size,
        refreshInterval: rawPane.refreshInterval,
      });
      if (!check.ok) {
        return { ok: false, field: `${where}.${check.field}`, message: check.message };
      }
      panes.push({
        id: typeof rawPane.id === 'string' && rawPane.id ? rawPane.id : generateId('pane'),
        title: typeof rawPane.title === 'string' && rawPane.title ? rawPane.title : `${rawPane.source} ${PANE_TYPE_LABELS[rawPane.type as PaneType]}`,
        type: rawPane.type as PaneType,
        source: rawPane.source as string,
        metric: (rawPane.metric as string).trim(),
        dimension: (rawPane.dimension as string | null) ?? null,
        size: rawPane.size as PaneSize,
        refreshInterval: rawPane.refreshInterval as RefreshInterval,
        lastRefreshTime: Date.now(),
        refreshTick: 0,
      });
    }
    nextPages.push({ id: rawPage.id as string, name: (rawPage.name as string).trim(), panes });
  }
  if (!nextPages.some((page) => page.id === data.activePageId)) {
    return { ok: false, field: 'activePageId', message: 'activePageId must reference one of the imported pages.' };
  }
  const rawAnalyses = Array.isArray(data.savedAnalyses) ? data.savedAnalyses : [];
  const nextAnalyses: SavedAnalysis[] = [];
  const seenNames = new Set<string>();
  for (let ai = 0; ai < rawAnalyses.length; ai++) {
    const rawAnalysis = rawAnalyses[ai] as Record<string, unknown>;
    const where = `savedAnalyses[${ai}]`;
    if (!rawAnalysis || typeof rawAnalysis !== 'object') {
      return { ok: false, field: where, message: 'each saved analysis must be an object.' };
    }
    const name = typeof rawAnalysis.name === 'string' ? rawAnalysis.name.trim() : '';
    if (!name || name.length > 60) {
      return { ok: false, field: `${where}.name`, message: 'name is required (1 to 60 characters).' };
    }
    if (seenNames.has(name.toLowerCase())) {
      return { ok: false, field: `${where}.name`, message: `duplicate saved-analysis name "${name}".` };
    }
    seenNames.add(name.toLowerCase());
    if (!getDataSourceById(String(rawAnalysis.source ?? ''))) {
      return {
        ok: false,
        field: `${where}.source`,
        message: `source must be one of ${dataSources.map((ds) => ds.id).join(', ')}.`,
      };
    }
    const metric = typeof rawAnalysis.metric === 'string' ? rawAnalysis.metric.trim() : '';
    if (!metric || !metricsFor(String(rawAnalysis.source)).includes(metric)) {
      return {
        ok: false,
        field: `${where}.metric`,
        message: `metric must be one of: ${metricsFor(String(rawAnalysis.source)).join(', ')}.`,
      };
    }
    nextAnalyses.push({
      id: generateId('analysis'),
      name,
      source: String(rawAnalysis.source),
      metric,
      updatedAt: Date.now(),
    });
  }

  return {
    ok: true,
    doc: {
      schemaVersion: 'panecraft-workspace-v1',
      activePageId: data.activePageId as string,
      dateRange: data.dateRange as DateRange,
      pages: nextPages.map((page) => ({
        id: page.id,
        name: page.name,
        panes: page.panes.map((pane) => ({
          id: pane.id,
          title: pane.title,
          source: pane.source,
          type: pane.type,
          metric: pane.metric,
          dimension: pane.dimension,
          size: pane.size,
          refreshInterval: pane.refreshInterval,
        })),
      })),
      savedAnalyses: nextAnalyses.map((analysis) => ({ name: analysis.name, source: analysis.source, metric: analysis.metric })),
    },
  } satisfies ActionResult & { doc?: WorkspaceDocument };
}

export function applyWorkspaceImport(raw: unknown): ActionResult & { pageCount?: number; paneCount?: number } {
  const validated = validateWorkspaceDocument(raw);
  if (!validated.ok || !validated.doc) {
    return { ok: false, field: validated.ok ? 'document' : (validated as { field: string }).field, message: validated.ok ? 'Invalid workspace document.' : (validated as { message: string }).message };
  }
  const doc = validated.doc;
  // Apply atomically: validation above has already proved the whole document
  // conforms, so either every entity lands or none do.
  pages = doc.pages.map((page) => ({
    id: page.id,
    name: page.name,
    panes: page.panes.map((pane) => ({
      id: pane.id,
      title: pane.title ?? 'Pane',
      type: pane.type,
      source: pane.source,
      metric: pane.metric,
      dimension: pane.dimension,
      size: pane.size,
      refreshInterval: pane.refreshInterval,
      lastRefreshTime: Date.now(),
      refreshTick: 0,
    })),
  }));
  activePageId = doc.activePageId;
  dateRange = doc.dateRange;
  savedAnalyses = doc.savedAnalyses.map((analysis) => ({
    id: generateId('analysis'),
    name: analysis.name,
    source: analysis.source,
    metric: analysis.metric,
    updatedAt: Date.now(),
  }));
  persist();
  persistAnalyses();
  const paneCount = pages.reduce((sum, page) => sum + page.panes.length, 0);
  return { ok: true, pageCount: pages.length, paneCount };
}

// ---- data helpers ---------------------------------------------------------------

export function filterRowsByDateRange(
  rows: Record<string, unknown>[],
  dateColumn: string | undefined,
  range: DateRange,
): Record<string, unknown>[] {
  if (!dateColumn) return rows;
  const daysBack = range === 'today' ? 1 : range === 'last-7-days' ? 7 : range === 'last-30-days' ? 30 : 90;
  const cutoff = new Date();
  cutoff.setHours(23, 59, 59, 999);
  cutoff.setDate(cutoff.getDate() - daysBack);
  return rows.filter((row) => new Date(String(row[dateColumn])) >= cutoff);
}

export function applyJitter(value: number, tick: number): number {
  if (tick === 0) return value;
  const jitter = (((tick * 7 + 13) % 11) - 5) / 100;
  return Math.round(value * (1 + jitter));
}

// ---- collaboration persistence ---------------------------------------------------

export function persistCollaboration(state: unknown) {
  writeJson(COLLAB_KEY, state);
}

export function loadCollaboration<T>(): T | null {
  return readJson<T>(COLLAB_KEY);
}

// ---- refresh ticker ----------------------------------------------------------------

let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

export function startRefreshTicker(): () => void {
  if (!refreshIntervalId) {
    refreshIntervalId = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const page of pages) {
        for (const pane of page.panes) {
          if (pane.refreshInterval === 'off') continue;
          const intervalMs = pane.refreshInterval === '30s' ? 30_000 : 300_000;
          if (now - pane.lastRefreshTime >= intervalMs) {
            pane.lastRefreshTime = now;
            pane.refreshTick += 1;
            changed = true;
          }
        }
      }
      if (changed) persist();
    }, 1_000);
  }

  return () => {
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }
  };
}
