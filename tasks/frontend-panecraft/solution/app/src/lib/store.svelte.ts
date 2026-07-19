import type { DataSource } from '../data/mockData';

export type PaneType = 'line' | 'bar' | 'donut' | 'table' | 'counter';
export type PaneSize = 'small' | 'medium' | 'large';
export type RefreshInterval = 'off' | '30s' | '5m';
export type DateRange = '1' | '7' | '30' | '90';
export type ShareAccess = 'public' | 'private';

export interface Pane {
  id: string;
  title: string;
  type: PaneType;
  dataSourceId: string;
  metric: string;
  dimension?: string;
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

interface SavedState {
  pages: Page[];
  activePageId: string;
}

export interface ConflictChoice {
  label: string;
  action: () => void;
}

export interface ConflictResolution {
  message: string;
  choices: ConflictChoice[];
}

const STORAGE_KEY = 'panecraft-state';

function safeGetStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function loadState(): SavedState | null {
  const storage = safeGetStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as SavedState : null;
  } catch {
    return null;
  }
}

function saveState(state: SavedState) {
  const storage = safeGetStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The workspace remains usable when storage is unavailable or full.
  }
}

let idCounter = 1;
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

function defaultPane(
  title: string,
  type: PaneType,
  dataSourceId: string,
  metric: string,
  dimension: string | undefined,
  size: PaneSize,
): Pane {
  return {
    id: generateId('pane'),
    title,
    type,
    dataSourceId,
    metric,
    dimension,
    size,
    refreshInterval: 'off',
    lastRefreshTime: Date.now(),
    refreshTick: 0,
  };
}

function createDefaultPages(): Page[] {
  return [{
    id: generateId('page'),
    name: 'Dashboard',
    panes: [
      defaultPane('Traffic trend', 'line', 'website-analytics', 'pageViews', 'date', 'medium'),
      defaultPane('Revenue by category', 'bar', 'sales-sheet', 'revenue', 'category', 'medium'),
      defaultPane('Open support volume', 'counter', 'support-tickets', '_count', undefined, 'small'),
    ],
  }];
}

let pages = $state<Page[]>([]);
let activePageId = $state('');
let dateRange = $state<DateRange>('30');
let showCreateWizard = $state(false);
let showDataSourcePreview = $state<DataSource | null>(null);
let showSharePanel = $state(false);
let editingPane = $state<{ paneId: string; pageId: string } | null>(null);

let isOffline = $state(false);
let conflictResolution = $state<ConflictResolution | null>(null);

const saved = loadState();
if (saved?.pages?.length) {
  pages = saved.pages.map((page) => ({
    id: page.id,
    name: page.name,
    panes: (page.panes ?? []).map((pane) => ({
      ...pane,
      lastRefreshTime: Date.now(),
      refreshTick: pane.refreshTick ?? 0,
    })),
  }));
  activePageId = pages.some((page) => page.id === saved.activePageId)
    ? saved.activePageId
    : pages[0]!.id;
} else {
  pages = createDefaultPages();
  activePageId = pages[0]!.id;
}

const activePage = $derived(pages.find((page) => page.id === activePageId) ?? pages[0]!);

function persist() {
  saveState({
    pages: pages.map((page) => ({
      id: page.id,
      name: page.name,
      panes: page.panes,
    })),
    activePageId,
  });
}

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
  dateRange = range;
}

export function getShowCreateWizard(): boolean {
  return showCreateWizard;
}

export function setShowCreateWizard(value: boolean) {
  showCreateWizard = value;
}

export function getShowDataSourcePreview(): DataSource | null {
  return showDataSourcePreview;
}

export function setShowDataSourcePreview(source: DataSource | null) {
  showDataSourcePreview = source;
}

export function getShowSharePanel(): boolean {
  return showSharePanel;
}

export function setShowSharePanel(value: boolean) {
  showSharePanel = value;
}

export function getEditingPane() {
  return editingPane;
}

export function setEditingPane(value: { paneId: string; pageId: string } | null) {
  editingPane = value;
}

export function addPage(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return;
  const newPage: Page = {
    id: generateId('page'),
    name: cleanName,
    panes: [],
  };
  pages.push(newPage);
  activePageId = newPage.id;
  persist();
}

export function renamePage(pageId: string, newName: string) {
  const page = pages.find((candidate) => candidate.id === pageId);
  const cleanName = newName.trim();
  if (!page || !cleanName) return;
  page.name = cleanName;
  persist();
}

export function deletePage(pageId: string) {
  if (pages.length <= 1) return;
  const index = pages.findIndex((page) => page.id === pageId);
  if (index < 0) return;
  pages.splice(index, 1);
  if (activePageId === pageId) {
    activePageId = pages[Math.min(index, pages.length - 1)]!.id;
  }
  persist();
}

export function addPane(pageId: string, pane: Omit<Pane, 'id' | 'lastRefreshTime' | 'refreshTick'>) {
  const page = pages.find((candidate) => candidate.id === pageId);
  if (!page) return;
  page.panes.push({
    ...pane,
    id: generateId('pane'),
    lastRefreshTime: Date.now(),
    refreshTick: 0,
  });
  persist();
}

export function updatePane(pageId: string, paneId: string, updates: Partial<Pane>) {
  const pane = pages.find((page) => page.id === pageId)?.panes.find((candidate) => candidate.id === paneId);
  if (!pane) return;
  Object.assign(pane, updates);
  persist();
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

export function filterRowsByDateRange(
  rows: Record<string, any>[],
  dateColumn: string | undefined,
  range: DateRange,
): Record<string, any>[] {
  if (!dateColumn) return rows;
  const cutoff = new Date();
  cutoff.setHours(23, 59, 59, 999);
  cutoff.setDate(cutoff.getDate() - Number(range));
  return rows.filter((row) => new Date(String(row[dateColumn])) >= cutoff);
}

export function applyJitter(value: number, tick: number): number {
  if (tick === 0) return value;
  const jitter = ((tick * 7 + 13) % 11 - 5) / 100;
  return Math.round(value * (1 + jitter));
}

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
