// ClockCraft in-memory application state (Svelte 5 runes).
// NO browser storage of any kind: a reload returns to the empty baseline.
// Every mutating command flows through `commit`, which records an explicit
// history snapshot with branching. The visible UI and the WebMCP tool
// handlers both call these same functions, so they can never diverge.

export type Category = 'Meaningful' | 'Neutral' | 'Draining';
export type Reason = 'Internal' | 'External' | null;
export type Filter = 'all' | 'meaningful' | 'neutral' | 'draining';

export interface TimeEntry {
  id: string;
  name: string;
  category: Category;
  tag: string | null;
  durationMinutes: number;
  startTime: string; // YYYY-MM-DDTHH:mm
  interruptionReason: Reason;
}

export interface Snapshot {
  entries: TimeEntry[];
  tags: string[];
  label: string;
}

export const CATS: Category[] = ['Meaningful', 'Neutral', 'Draining'];
export const CAT_LOWER: Record<Category, Filter> = {
  Meaningful: 'meaningful',
  Neutral: 'neutral',
  Draining: 'draining'
};
export const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'meaningful', label: 'Meaningful' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'draining', label: 'Draining' }
];

const START_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const S = $state({
  branches: [[{ entries: [], tags: [], label: 'Empty session' }]] as Snapshot[][],
  cursors: [0],
  branchIndex: 0,
  filter: 'all' as Filter,
  search: '',
  selected: [] as string[],
  timer: { running: false, name: '', category: '' as Category | '', tag: null as string | null, startedAt: 0 },
  tick: 0,
  interruption: false,
  overlay: null as null | { which: string; editId?: string },
  toasts: [] as { id: number; text: string; kind?: string }[],
  tooltip: null as null | { x: number; y: number; text: string },
  theme: 'light' as 'light' | 'dark',
  sound: 'off' as 'off' | 'rain' | 'focus',
  target: 120,
  coach: true,
  importing: false,
  reduced: false,
  importDraft: null as null | { text: string; name: string; result: ImportResult },
  manualOpen: false,
  scrollTarget: null as null | string,
  pendingSwitch: null as null | { name: string; category: Category; tag: string | null },
  exportTab: 'json' as 'json' | 'csv',
  liveRegion: ''
});

let _returnFocus: Element | null = null;
let _toastId = 0;

function clone<T>(x: T): T {
  // JSON round-trip: structuredClone cannot clone Svelte $state proxies.
  return JSON.parse(JSON.stringify(x));
}
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---- derived reads ----------------------------------------------------------
export function current(): Snapshot {
  return S.branches[S.branchIndex][S.cursors[S.branchIndex]];
}
export function entries(): TimeEntry[] {
  return current().entries;
}
export function tags(): string[] {
  return current().tags;
}

export function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function todayKey(): string {
  return dateKey(new Date());
}
export function entryDate(e: TimeEntry): string {
  return e.startTime.slice(0, 10);
}
export function localInputNow(): string {
  const d = new Date();
  return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
export function fmtDur(min: number): string {
  return `${min} min`;
}
export function fmtTimeOfDay(startTime: string): string {
  return startTime.slice(11, 16);
}
export function fmtDayLabel(ymd: string): string {
  const d = new Date(ymd + 'T00:00:00');
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
}

export function isToday(e: TimeEntry): boolean {
  return entryDate(e) === todayKey();
}
export function todayEntries(list: TimeEntry[] = entries()): TimeEntry[] {
  return list.filter(isToday);
}
export function todayMinutes(list: TimeEntry[] = entries()): number {
  return todayEntries(list).reduce((a, e) => a + e.durationMinutes, 0);
}
export function catMinutesToday(list: TimeEntry[] = entries()): Record<Category, number> {
  const m: Record<Category, number> = { Meaningful: 0, Neutral: 0, Draining: 0 };
  for (const e of todayEntries(list)) m[e.category] += e.durationMinutes;
  return m;
}
export function meaningfulRatio(list: TimeEntry[] = entries()): number {
  const m = catMinutesToday(list);
  const tot = m.Meaningful + m.Draining;
  return tot === 0 ? 50 : Math.round((m.Meaningful / tot) * 100);
}
export function streakDays(list: TimeEntry[] = entries()): number {
  const byDay = new Map<string, { m: number; d: number }>();
  for (const e of list) {
    const k = entryDate(e);
    const o = byDay.get(k) || { m: 0, d: 0 };
    if (e.category === 'Meaningful') o.m += e.durationMinutes;
    if (e.category === 'Draining') o.d += e.durationMinutes;
    byDay.set(k, o);
  }
  const qualifies = (k: string) => {
    const o = byDay.get(k);
    return !!o && o.m > o.d;
  };
  const has = (k: string) => byDay.has(k);
  let streak = 0;
  let started = false;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const k = dateKey(d);
    if (!started) {
      if (has(k) && qualifies(k)) {
        started = true;
        streak = 1;
      } else if (has(k) && !qualifies(k)) {
        break;
      } else if (i !== 0) {
        break;
      }
    } else {
      if (qualifies(k)) streak++;
      else break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function weekDays(): string[] {
  const d = new Date();
  const diffToMon = (d.getDay() + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - diffToMon);
  const arr: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    arr.push(dateKey(x));
  }
  return arr;
}
export interface WeekBar {
  key: string;
  label: string;
  m: number;
  n: number;
  d: number;
  total: number;
}
export function weeklyData(list: TimeEntry[] = entries()): WeekBar[] {
  const days = weekDays();
  const byDay = new Map<string, Record<Category, number>>();
  for (const k of days) byDay.set(k, { Meaningful: 0, Neutral: 0, Draining: 0 });
  for (const e of list) {
    const k = entryDate(e);
    if (byDay.has(k)) byDay.get(k)![e.category] += e.durationMinutes;
  }
  return days.map((k) => {
    const c = byDay.get(k)!;
    return {
      key: k,
      label: k === todayKey() ? 'Today' : DOW[new Date(k + 'T00:00:00').getDay()],
      m: c.Meaningful,
      n: c.Neutral,
      d: c.Draining,
      total: c.Meaningful + c.Neutral + c.Draining
    };
  });
}
export interface HeatCell {
  key: string;
  total: number;
  level: number;
  label: string;
  /** Meaningful − Draining minutes for the day (drives lean tint so category edits update the cell). */
  lean: number;
}
export function heatmapData(list: TimeEntry[] = entries()): HeatCell[] {
  const byDay = new Map<string, { total: number; m: number; d: number }>();
  for (const e of list) {
    const k = entryDate(e);
    const o = byDay.get(k) || { total: 0, m: 0, d: 0 };
    o.total += e.durationMinutes;
    if (e.category === 'Meaningful') o.m += e.durationMinutes;
    if (e.category === 'Draining') o.d += e.durationMinutes;
    byDay.set(k, o);
  }
  const cells: HeatCell[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 83; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    const k = dateKey(x);
    const o = byDay.get(k) || { total: 0, m: 0, d: 0 };
    const total = o.total;
    cells.push({
      key: k,
      total,
      level: total === 0 ? 0 : total <= 30 ? 1 : total <= 90 ? 2 : total <= 180 ? 3 : 4,
      label: fmtDayLabel(k),
      lean: o.m - o.d
    });
  }
  return cells;
}

export function matches(e: TimeEntry): boolean {
  if (S.filter !== 'all' && CAT_LOWER[e.category] !== S.filter) return false;
  const q = S.search.trim().toLowerCase();
  if (q) {
    const hay = (e.name + ' ' + (e.tag || '')).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
export function visibleEntries(list: TimeEntry[] = entries()): TimeEntry[] {
  return list.filter(matches);
}
export function timelineEntries(list: TimeEntry[] = entries()): TimeEntry[] {
  return list
    .filter(isToday)
    .filter((e) => S.filter === 'all' || CAT_LOWER[e.category] === S.filter)
    .sort((a, b) => (a.startTime < b.startTime ? 1 : -1));
}
export function listEntries(list: TimeEntry[] = entries()): TimeEntry[] {
  return visibleEntries(list).sort((a, b) => (a.startTime < b.startTime ? 1 : -1));
}

export function elapsedSec(): number {
  return S.timer.running ? Math.max(0, Math.floor((S.tick - S.timer.startedAt) / 1000)) : 0;
}

// ---- history ----------------------------------------------------------------
function commit(newEntries: TimeEntry[], newTags: string[], label?: string) {
  const snap: Snapshot = { entries: clone(newEntries), tags: clone(newTags), label: label || 'Edit' };
  const bi = S.branchIndex;
  const cu = S.cursors[bi];
  const branch = S.branches[bi];
  if (cu < branch.length - 1) {
    const base = branch.slice(0, cu + 1);
    const nb = [...base, snap];
    S.branches = [...S.branches, nb];
    S.cursors = [...S.cursors, nb.length - 1];
    S.branchIndex = S.branches.length - 1;
  } else {
    const nb = [...branch, snap];
    S.branches = S.branches.map((b, i) => (i === bi ? nb : b));
    S.cursors = S.cursors.map((c, i) => (i === bi ? nb.length - 1 : c));
  }
  S.selected = [];
}
export function canUndo(): boolean {
  return S.cursors[S.branchIndex] > 0;
}
export function canRedo(): boolean {
  return S.cursors[S.branchIndex] < S.branches[S.branchIndex].length - 1;
}
export function undo() {
  if (canUndo()) {
    const bi = S.branchIndex;
    S.cursors = S.cursors.map((c, i) => (i === bi ? c - 1 : c));
    S.selected = [];
  }
}
export function redo() {
  if (canRedo()) {
    const bi = S.branchIndex;
    S.cursors = S.cursors.map((c, i) => (i === bi ? c + 1 : c));
    S.selected = [];
  }
}
export function selectBranch(i: number) {
  if (i < 0 || i >= S.branches.length) return;
  S.branchIndex = i;
  S.cursors = S.cursors.map((c, idx) => (idx === i ? S.branches[i].length - 1 : c));
  S.selected = [];
}
export function goToSnapshot(i: number) {
  const bi = S.branchIndex;
  const len = S.branches[bi].length;
  if (i < 0 || i >= len) return;
  S.cursors = S.cursors.map((c, idx) => (idx === bi ? i : c));
  S.selected = [];
}

// ---- mutations --------------------------------------------------------------
export function addEntry(p: {
  name: string;
  category: Category;
  tag: string | null;
  durationMinutes: number;
  startTime: string;
  interruptionReason: Reason;
}): TimeEntry {
  const e: TimeEntry = {
    id: uid(),
    name: p.name.trim(),
    category: p.category,
    tag: p.tag,
    durationMinutes: p.durationMinutes,
    startTime: p.startTime,
    interruptionReason: p.interruptionReason
  };
  commit([...entries(), e], tags(), `Add “${e.name}”`);
  return e;
}
export function updateEntry(id: string, patch: Partial<TimeEntry>) {
  commit(
    entries().map((e) =>
      e.id === id
        ? {
            ...e,
            ...patch,
            name: patch.name !== undefined ? String(patch.name).trim() : e.name,
            tag: patch.tag === undefined ? e.tag : patch.tag === null || String(patch.tag).trim() === '' ? null : String(patch.tag).trim()
          }
        : e
    ),
    tags(),
    'Edit entry'
  );
}
export function deleteEntry(id: string) {
  const e = entries().find((x) => x.id === id);
  commit(
    entries().filter((x) => x.id !== id),
    tags(),
    `Delete “${e ? e.name : id}”`
  );
  toast(`Deleted “${e ? e.name : 'entry'}”`, 'delete');
}
export function bulkSetCategory(ids: string[], cat: Category) {
  if (!ids.length) return;
  commit(
    entries().map((e) => (ids.includes(e.id) ? { ...e, category: cat } : e)),
    tags(),
    `Set ${ids.length} to ${cat}`
  );
  S.selected = [];
  toast(`Set ${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} to ${cat}`, 'save');
}
export function replaceCollection(newEntries: TimeEntry[], newTags: string[]) {
  commit(newEntries, newTags, 'Import session');
}
export function createTag(name: string): boolean {
  const t = name.trim();
  if (!t || t.length > 40) return false;
  if (tags().includes(t)) return false;
  commit(entries(), [...tags(), t], `Add tag “${t}”`);
  return true;
}
export function deleteTag(name: string) {
  commit(
    entries().map((e) => (e.tag === name ? { ...e, tag: null } : e)),
    tags().filter((t) => t !== name),
    `Delete tag “${name}”`
  );
}
export function applyScenario() {
  addEntry({
    name: 'Scenario focus block',
    category: 'Meaningful',
    tag: null,
    durationMinutes: 25,
    startTime: todayKey() + 'T09:00',
    interruptionReason: null
  });
}

// ---- overlays / focus return -----------------------------------------------
export function openOverlay(which: string, editId?: string) {
  _returnFocus = typeof document !== 'undefined' ? document.activeElement : null;
  S.overlay = { which, editId };
}
export function closeOverlay() {
  S.overlay = null;
  const el = _returnFocus as any;
  _returnFocus = null;
  if (el && typeof el.focus === 'function') {
    try {
      el.focus();
    } catch {
      /* ignore */
    }
  }
}

// ---- toasts / tooltip -------------------------------------------------------
export function toast(text: string, kind?: string) {
  const id = ++_toastId;
  S.toasts = [...S.toasts, { id, text, kind }];
  S.liveRegion = text;
  setTimeout(() => {
    S.toasts = S.toasts.filter((t) => t.id !== id);
  }, 2600);
  setTimeout(() => {
    if (S.liveRegion === text) S.liveRegion = '';
  }, 2800);
}
export function announce(text: string) {
  S.liveRegion = text;
}
export function showTip(x: number, y: number, text: string) {
  S.tooltip = { x, y, text };
}
export function hideTip() {
  S.tooltip = null;
}

// ---- validation -------------------------------------------------------------
export function validateEntryFields(
  v: { name?: any; category?: any; tag?: any; durationMinutes?: any; startTime?: any; interruptionReason?: any },
  existingTags?: string[]
): Record<string, string> {
  const errs: Record<string, string> = {};
  const name = String(v.name ?? '').trim();
  if (!name) errs.name = 'Name is required — enter the activity name.';
  else if (name.length > 120) errs.name = 'Name is too long — keep it to 120 characters or fewer.';
  if (!(CATS as string[]).includes(String(v.category))) errs.category = 'Category is required — choose Meaningful, Neutral, or Draining.';
  const tagRaw = v.tag;
  const tag = tagRaw === null || tagRaw === undefined || String(tagRaw).trim() === '' ? null : String(tagRaw).trim();
  if (tag !== null) {
    if (tag.length > 40) errs.tag = 'Tag is too long — keep it to 40 characters or fewer.';
    else if (existingTags && !existingTags.includes(tag)) errs.tag = 'Tag must be an existing custom tag, or leave it empty.';
  }
  const raw = v.durationMinutes;
  const dn = Number(raw);
  if (raw === undefined || raw === null || String(raw).trim() === '') errs.durationMinutes = 'Duration is required — enter whole minutes from 1 to 1440.';
  else if (!Number.isFinite(dn) || !Number.isInteger(dn)) errs.durationMinutes = 'Duration must be a whole number from 1 to 1440.';
  else if (dn < 1 || dn > 1440) errs.durationMinutes = 'Duration must be between 1 and 1440 minutes.';
  const st = String(v.startTime ?? '');
  if (!START_RE.test(st)) errs.startTime = 'Start time is required in YYYY-MM-DDTHH:mm 24-hour format.';
  else {
    const dt = new Date(st);
    if (Number.isNaN(dt.getTime())) errs.startTime = 'Start time is not a valid date and time.';
  }
  const ir = v.interruptionReason;
  if (ir !== null && ir !== undefined && ir !== '') {
    if (ir !== 'Internal' && ir !== 'External') errs.interruptionReason = 'Interruption reason must be Internal or External.';
  }
  return errs;
}

// ---- export / import --------------------------------------------------------
export function rollupFor(list: TimeEntry[]) {
  return { todayMinutes: todayMinutes(list), meaningfulRatio: meaningfulRatio(list), streakDays: streakDays(list) };
}
export function buildSessionObject(list: TimeEntry[], tg: string[]) {
  return {
    schemaVersion: 'clockcraft.session.v1',
    exportedAt: new Date().toISOString(),
    tags: tg.map((name) => ({ name })),
    entries: list.map((e) => ({
      name: e.name,
      category: e.category,
      tag: e.tag,
      durationMinutes: e.durationMinutes,
      startTime: e.startTime,
      interruptionReason: e.interruptionReason
    })),
    rollup: rollupFor(list)
  };
}
export function sessionJSONText(list: TimeEntry[] = entries(), tg: string[] = tags()): string {
  return JSON.stringify(buildSessionObject(list, tg), null, 2);
}
function csvField(v: any): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
export function timesheetCSV(list: TimeEntry[] = entries()): string {
  const header = ['name', 'category', 'tag', 'durationMinutes', 'startTime', 'interruptionReason'];
  const rows = list.map((e) => [e.name, e.category, e.tag, e.durationMinutes, e.startTime, e.interruptionReason].map(csvField).join(','));
  return [header.join(','), ...rows].join('\n');
}

export interface ImportResult {
  ok: boolean;
  errors: { field: string; message: string }[];
  entries: TimeEntry[];
  tags: string[];
}
export function parseImport(text: string): ImportResult {
  const errs: { field: string; message: string }[] = [];
  let doc: any;
  try {
    doc = JSON.parse(text);
  } catch (e: any) {
    return { ok: false, errors: [{ field: '(document)', message: 'Import is not valid JSON — ' + (e && e.message ? e.message : 'parse error') }], entries: [], tags: [] };
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc))
    return { ok: false, errors: [{ field: '(document)', message: 'Session JSON must be a single object, not an array.' }], entries: [], tags: [] };
  if (doc.schemaVersion !== 'clockcraft.session.v1') errs.push({ field: 'schemaVersion', message: 'schemaVersion must be "clockcraft.session.v1".' });
  if (typeof doc.exportedAt !== 'string' || !doc.exportedAt) errs.push({ field: 'exportedAt', message: 'exportedAt must be an ISO-8601 timestamp string.' });
  if (!Array.isArray(doc.tags)) errs.push({ field: 'tags', message: 'tags must be an array of { name } objects.' });
  if (!Array.isArray(doc.entries)) errs.push({ field: 'entries', message: 'entries must be an array of time-entry records.' });
  const tgNames: string[] = [];
  if (Array.isArray(doc.tags)) {
    doc.tags.forEach((t: any, i: number) => {
      if (!t || typeof t !== 'object' || typeof t.name !== 'string' || !t.name.trim()) errs.push({ field: `tags[${i}].name`, message: 'Each tag needs a non-empty name.' });
      else if (t.name.trim().length > 40) errs.push({ field: `tags[${i}].name`, message: 'Tag name must be 40 characters or fewer.' });
      else tgNames.push(t.name.trim());
    });
  }
  const parsedEntries: TimeEntry[] = [];
  let entryErrorCount = 0;
  if (Array.isArray(doc.entries)) {
    doc.entries.forEach((e: any, i: number) => {
      const fe = validateEntryFields(
        { name: e && e.name, category: e && e.category, tag: e && e.tag, durationMinutes: e && e.durationMinutes, startTime: e && e.startTime, interruptionReason: e && e.interruptionReason },
        tgNames
      );
      for (const k in fe) {
        errs.push({ field: `entries[${i}].${k}`, message: fe[k] });
        entryErrorCount++;
      }
      if (Object.keys(fe).length === 0) {
        parsedEntries.push({
          id: uid(),
          name: String(e.name).trim(),
          category: e.category,
          tag: e.tag === null || e.tag === undefined || String(e.tag).trim() === '' ? null : String(e.tag).trim(),
          durationMinutes: Number(e.durationMinutes),
          startTime: String(e.startTime),
          interruptionReason: e.interruptionReason === null || e.interruptionReason === undefined ? null : e.interruptionReason
        });
      }
    });
  }
  if (!doc.rollup || typeof doc.rollup !== 'object') {
    errs.push({ field: 'rollup', message: 'rollup with todayMinutes, meaningfulRatio, and streakDays is required.' });
  } else if (entryErrorCount === 0 && Array.isArray(doc.entries) && parsedEntries.length === doc.entries.length) {
    const r = rollupFor(parsedEntries);
    if (typeof doc.rollup.todayMinutes !== 'number' || doc.rollup.todayMinutes !== r.todayMinutes)
      errs.push({ field: 'rollup.todayMinutes', message: `rollup.todayMinutes (${doc.rollup.todayMinutes}) does not match the entries (${r.todayMinutes}).` });
    if (typeof doc.rollup.meaningfulRatio !== 'number' || Math.abs(doc.rollup.meaningfulRatio - r.meaningfulRatio) > 0.5)
      errs.push({ field: 'rollup.meaningfulRatio', message: `rollup.meaningfulRatio (${doc.rollup.meaningfulRatio}) does not match the entries (${r.meaningfulRatio}).` });
    if (typeof doc.rollup.streakDays !== 'number' || doc.rollup.streakDays !== r.streakDays)
      errs.push({ field: 'rollup.streakDays', message: `rollup.streakDays (${doc.rollup.streakDays}) does not match the entries (${r.streakDays}).` });
  }
  if (errs.length) return { ok: false, errors: errs, entries: [], tags: [] };
  return { ok: true, errors: [], entries: parsedEntries, tags: tgNames };
}

// ---- timer ------------------------------------------------------------------
function beginLive(name: string, category: Category, tag: string | null, toastKind: string, toastText: string) {
  S.timer = { running: true, name, category, tag, startedAt: Date.now() };
  S.tick = Date.now();
  toast(toastText, toastKind);
}
export function startTimer(name: string, category: Category | '', tag: string | null, opts?: { reason?: Reason }): boolean {
  const n = name.trim();
  if (!n || !category) return false;
  if (S.timer.running) {
    const elapsed = Date.now() - S.timer.startedAt;
    const prev = S.timer.name || 'Untitled session';
    if (elapsed < 25 * 60 * 1000) {
      const reason = opts?.reason;
      if (reason === 'Internal' || reason === 'External') {
        commitTimerEntry(reason, { silent: true });
        beginLive(n, category, tag, 'switch', `Switched timers — “${prev}” saved`);
        return true;
      }
      S.pendingSwitch = { name: n, category, tag };
      S.interruption = true;
      openOverlay('interruption');
      return true;
    }
    const dur = Math.max(1, Math.round(elapsed / 60000));
    commitTimerEntry(null, { silent: true });
    beginLive(n, category, tag, 'switch', `Switched timers — “${prev}” saved (${dur} min)`);
    return true;
  }
  beginLive(n, category, tag, 'timer', `Timer started — “${n}”`);
  return true;
}
export function stopTimer(reason?: Reason) {
  if (!S.timer.running) return;
  const elapsed = Date.now() - S.timer.startedAt;
  if (elapsed < 25 * 60 * 1000) {
    if (reason === 'Internal' || reason === 'External') {
      commitTimerEntry(reason);
      return;
    }
    S.pendingSwitch = null;
    S.interruption = true;
    openOverlay('interruption');
    return;
  }
  commitTimerEntry(null);
}
function commitTimerEntry(reason: Reason, opts?: { silent?: boolean }) {
  if (!S.timer.running && !S.timer.startedAt) return;
  const elapsed = Math.max(0, Date.now() - S.timer.startedAt);
  const dur = Math.max(1, Math.round(elapsed / 60000) || 1);
  const name = S.timer.name || 'Untitled session';
  const category = (S.timer.category as Category) || 'Meaningful';
  const tag = S.timer.tag;
  addEntry({ name, category, tag, durationMinutes: dur, startTime: localInputNow(), interruptionReason: reason });
  S.timer = { running: false, name: '', category: '', tag: null, startedAt: 0 };
  S.interruption = false;
  if (S.overlay && S.overlay.which === 'interruption') closeOverlay();
  if (!opts?.silent) toast(`Saved “${name}” — ${dur} min`, 'save');
}
export function confirmInterruption(reason: Reason) {
  if (!reason) return;
  if (!S.timer.running && !S.timer.startedAt) {
    S.interruption = false;
    S.pendingSwitch = null;
    if (S.overlay && S.overlay.which === 'interruption') closeOverlay();
    return;
  }
  const pending = S.pendingSwitch;
  const prev = S.timer.name || 'Untitled session';
  commitTimerEntry(reason, { silent: !!pending });
  if (pending) {
    S.pendingSwitch = null;
    beginLive(pending.name, pending.category, pending.tag, 'switch', `Switched timers — “${prev}” saved`);
  }
}
export function cancelInterruption() {
  S.interruption = false;
  S.pendingSwitch = null;
  if (S.overlay && S.overlay.which === 'interruption') closeOverlay();
}
export function restartTimer(opts?: { reason?: Reason }): boolean {
  if (S.timer.running) {
    const name = S.timer.name;
    const category = S.timer.category as Category;
    const tag = S.timer.tag;
    if (!name || !category) return false;
    return startTimer(name, category, tag, opts);
  }
  const list = entries();
  if (!list.length) return false;
  const last = [...list].sort((a, b) => (a.startTime < b.startTime ? 1 : -1))[0];
  return startTimer(last.name, last.category, last.tag, opts);
}

// ---- simple setters ---------------------------------------------------------
export function setTheme(t: 'light' | 'dark') {
  S.theme = t;
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', t);
}
export function toggleTheme() {
  setTheme(S.theme === 'light' ? 'dark' : 'light');
}
export function setSound(m: 'off' | 'rain' | 'focus') {
  S.sound = m;
}
export function setTarget(n: number) {
  const v = Math.max(1, Math.min(1440, Math.round(Number(n) || 0)));
  S.target = v;
}
export function dismissCoach() {
  S.coach = false;
}
export function setFilter(f: Filter) {
  S.filter = f;
}
export function setSearch(q: string) {
  S.search = q;
}
export function toggleSelect(id: string) {
  S.selected = S.selected.includes(id) ? S.selected.filter((x) => x !== id) : [...S.selected, id];
}
export function clearSelection() {
  S.selected = [];
}
export function setManualOpen(o: boolean) {
  S.manualOpen = o;
}
export function setScrollTarget(id: string | null) {
  S.scrollTarget = id;
}
export function setReduced(b: boolean) {
  S.reduced = b;
}
export function setExportTab(t: 'json' | 'csv') {
  S.exportTab = t;
}

// ---- import flow (with simulated async load) --------------------------------
export function beginImport(text: string, name: string): ImportResult {
  const result = parseImport(text);
  S.importDraft = { text, name, result };
  return result;
}
export function clearImportDraft() {
  S.importDraft = null;
}
export function confirmImport() {
  const d = S.importDraft;
  if (!d || !d.result.ok) return;
  const imported = d.result.entries;
  const importedTags = d.result.tags;
  const fname = d.name;
  S.importing = true;
  setTimeout(() => {
    replaceCollection(imported, importedTags);
    S.importing = false;
    S.importDraft = null;
    if (S.overlay && S.overlay.which === 'import') closeOverlay();
    toast(`Imported ${imported.length} ${imported.length === 1 ? 'entry' : 'entries'} from ${fname}`, 'import');
  }, 420);
}

// ---- clipboard / download ---------------------------------------------------
function fallbackCopy(text: string, label: string) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast(`${label} copied to clipboard`, 'copy');
  } catch {
    toast('Copy failed', 'copy');
  }
}
export function copyText(text: string, label: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast(`${label} copied to clipboard`, 'copy')).catch(() => fallbackCopy(text, label));
  } else {
    fallbackCopy(text, label);
  }
}
export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
