// CipherLog shared application state (Svelte 5 stores).
//
// State model mirrors the API-shaped field contracts in the PRD so the record a
// form creates IS the would-be request body, and session export/import speak the
// same schema. Memo records store the channel by its case-sensitive NAME (the
// transmission field contract's `channel`), with firstTransmitted + lastModified
// ISO timestamps and marks of { start, end, kind }. Each memo also carries an
// internal `id` used purely for Svelte keying and DOM lookup; that id is stripped
// on session export so the emitted payload matches the contract exactly.
//
// Persistence: channels, memos, decommissioned, theme core, custom channel order,
// the active channel filter, the search query, the active memo, the active view,
// the memo-list sort direction, and the onboarding flag all persist to localStorage
// so a full reload restores the exact committed state (every configured facet
// survives coherently — none silently reverts). Storage access is guarded so an
// unavailable/throwing localStorage (private mode, quota, disabled) never crashes
// the build; state then lives in memory for the session. The set of locked memos
// whose body is currently revealed is session-only and NEVER persisted, so a full
// refresh always returns a locked memo to its redacted state.

import { writable, derived, get } from 'svelte/store';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// API-shaped Zod schemas. Messages name the offending field AND the fix so the
// inline validation copy reads as guidance, not a bare "Invalid".
// ---------------------------------------------------------------------------
export const transmissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is blank. Enter a title of at least one character to save this transmission.')
    .max(120, 'Title is too long. Keep the Title to 120 characters or fewer.'),
  body: z
    .string()
    .max(20000, 'Body is too long. Keep the Body to 20000 characters or fewer.'),
  priority: z.enum(['high', 'standard', 'low'], {
    errorMap: () => ({ message: 'Priority must be one of High, Standard, or Low.' })
  }),
  channel: z
    .string()
    .min(1, 'Channel is blank. Assign this transmission to an existing channel.')
});

export const channelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Channel name is blank. Enter a name of at least one character.')
    .max(40, 'Channel name is too long. Keep the name to 40 characters or fewer.')
});

export const passcodeSchema = z.object({
  passcode: z
    .string()
    .regex(/^[A-Za-z0-9]{4}$/, 'Passcode must be exactly four letters or digits. Enter a four-character passcode.')
});

export const sessionArchiveSchema = z.object({
  payload: z.string().min(1, 'Session JSON is empty. Paste a previously exported session archive.')
});

// ---------------------------------------------------------------------------
// Guarded localStorage helpers.
// ---------------------------------------------------------------------------
function storageAvailable() {
  try {
    if (typeof localStorage === 'undefined') return false;
    const k = '__cipherlog_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

function loadFromStorage(key, fallback) {
  if (!storageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Quota or disabled mid-session: keep state in memory; never throw.
  }
}

// ---------------------------------------------------------------------------
// Theme cores. The internal store holds the bare core key (e.g. 'blood-red');
// '' means the default core whose accent is the base blue (#007AFF). The CSS
// class is derived as `theme-<core>`.
// ---------------------------------------------------------------------------
export const THEME_CORES = [
  { core: 'matrix-green', name: 'Matrix Green', cssClass: 'theme-matrix-green' },
  { core: 'neon-cyan', name: 'Neon Cyan', cssClass: 'theme-neon-cyan' },
  { core: 'blood-red', name: 'Blood Red', cssClass: 'theme-blood-red' },
  { core: 'ghost-white', name: 'Ghost White', cssClass: 'theme-ghost-white' },
  { core: 'amber-terminal', name: 'Amber Terminal', cssClass: 'theme-amber-terminal' }
];
export const THEME_CORE_KEYS = THEME_CORES.map((t) => t.core);

export function themeCoreToCssClass(core) {
  return core ? 'theme-' + core : '';
}

export const themeCore = writable(loadFromStorage('cipherlog-theme', ''));
themeCore.subscribe((v) => saveToStorage('cipherlog-theme', v));

// ---------------------------------------------------------------------------
// Collections. Stored memos carry an internal id; we strip any stray `revealed`
// flag (a session-only concept) so it can never leak into storage.
// ---------------------------------------------------------------------------
function stripSession(list) {
  return (Array.isArray(list) ? list : []).map((m) => {
    if (!m || typeof m !== 'object') return m;
    const { revealed, ...rest } = m;
    return rest;
  });
}

function normalizeMemo(m) {
  // Defensive normalization for data coming from storage/import so the app never
  // crashes on a slightly malformed but otherwise acceptable record.
  if (!m || typeof m !== 'object') return m;
  return {
    id: m.id || generateId(),
    title: typeof m.title === 'string' ? m.title : '',
    body: typeof m.body === 'string' ? m.body : '',
    priority: ['high', 'standard', 'low'].includes(m.priority) ? m.priority : 'standard',
    channel: typeof m.channel === 'string' ? m.channel : '',
    locked: !!m.locked,
    passcode: m.locked && typeof m.passcode === 'string' ? m.passcode : (m.locked ? null : null),
    marks: Array.isArray(m.marks) ? m.marks.filter((mk) => mk && typeof mk.start === 'number' && typeof mk.end === 'number' && mk.end > mk.start) : [],
    firstTransmitted: typeof m.firstTransmitted === 'string' ? m.firstTransmitted : new Date().toISOString(),
    lastModified: typeof m.lastModified === 'string' ? m.lastModified : new Date().toISOString()
  };
}

export const channels = writable(loadFromStorage('cipherlog-channels', []));
channels.subscribe((v) => saveToStorage('cipherlog-channels', v));

export const memos = writable(stripSession(loadFromStorage('cipherlog-memos', [])).map(normalizeMemo));
memos.subscribe((v) => saveToStorage('cipherlog-memos', stripSession(v)));

export const decommissioned = writable(stripSession(loadFromStorage('cipherlog-decommissioned', [])).map(normalizeMemo));
decommissioned.subscribe((v) => saveToStorage('cipherlog-decommissioned', stripSession(v)));

// Session-only revealed set: never persisted.
export const revealedIds = writable(new Set());

// UI chrome (all persisted so every configured facet survives a reload).
export const activeChannel = writable(loadFromStorage('cipherlog-active-channel', null));
activeChannel.subscribe((v) => saveToStorage('cipherlog-active-channel', v));
export const searchQuery = writable(loadFromStorage('cipherlog-search-query', ''));
searchQuery.subscribe((v) => saveToStorage('cipherlog-search-query', v));
export const activeMemoId = writable(loadFromStorage('cipherlog-active-memo-id', null));
activeMemoId.subscribe((v) => saveToStorage('cipherlog-active-memo-id', v));
export const showDecommissioned = writable(loadFromStorage('cipherlog-show-decommissioned', false));
showDecommissioned.subscribe((v) => saveToStorage('cipherlog-show-decommissioned', v));
export const sortDir = writable(loadFromStorage('cipherlog-sort-dir', 'desc'));
sortDir.subscribe((v) => saveToStorage('cipherlog-sort-dir', v));
export const onboarded = writable(loadFromStorage('cipherlog-onboarded', false));
onboarded.subscribe((v) => saveToStorage('cipherlog-onboarded', v));

// ---------------------------------------------------------------------------
// Toasts. A toast may carry an action (e.g. Undo for a decommission) which keeps
// it on screen longer so the cancel/undo path is reachable.
// ---------------------------------------------------------------------------
export const toasts = writable([]);
let toastId = 0;
export function showToast(message, action) {
  const id = ++toastId;
  const ttl = action && action.label ? 6000 : 2800;
  toasts.update((t) => [...t, { id, message, action: action || null }]);
  setTimeout(() => {
    toasts.update((t) => t.filter((toast) => toast.id !== id));
  }, ttl);
  return id;
}
export function dismissToast(id) {
  toasts.update((t) => t.filter((toast) => toast.id !== id));
}

// ---------------------------------------------------------------------------
// Derived views. filteredMemos is the single source for the list; it combines the
// channel filter and the search text with AND semantics over the shared memos
// collection (never a second copy) and sorts by the configured sort direction.
// ---------------------------------------------------------------------------
export const filteredMemos = derived(
  [memos, activeChannel, searchQuery, sortDir],
  ([$memos, $activeChannel, $searchQuery, $sortDir]) => {
    let result = $memos.slice();
    if ($activeChannel) {
      result = result.filter((m) => m.channel === $activeChannel);
    }
    const q = ($searchQuery || '').trim().toLowerCase();
    if (q) {
      result = result.filter(
        (m) => (m.title || '').toLowerCase().includes(q) || (m.body || '').toLowerCase().includes(q)
      );
    }
    const dir = $sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => dir * (new Date(a.lastModified) - new Date(b.lastModified)));
    return result;
  }
);

// Per-channel memo counts for the sidebar activity visualization.
export const channelCounts = derived([memos, decommissioned], ([$memos, $dec]) => {
  const counts = {};
  for (const m of $memos) counts[m.channel] = (counts[m.channel] || 0) + 1;
  for (const m of $dec) counts[m.channel] = (counts[m.channel] || 0) + 1;
  return counts;
});

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export const VALID_PRIORITIES = ['high', 'standard', 'low'];
export const BLANK_TITLE_MSG = 'Title is blank. Enter a title of at least one character to save this transmission.';

// ---------------------------------------------------------------------------
// Shared domain commands. Both the visible UI controls and the WebMCP tool
// handlers call these, so the two drive the identical store-mutation code path —
// WebMCP exposes no success path the UI lacks.
// ---------------------------------------------------------------------------

// Memo -> session-archive transmission payload (contract shape, no internal id).
export function memoToPayload(m) {
  return {
    title: m.title,
    body: m.body,
    priority: m.priority,
    channel: m.channel,
    locked: !!m.locked,
    passcode: m.locked ? (m.passcode || null) : null,
    marks: (m.marks || []).map((mk) => ({ start: mk.start, end: mk.end, kind: mk.kind })),
    firstTransmitted: m.firstTransmitted,
    lastModified: m.lastModified
  };
}

// Channel -> session-archive channel payload (contract shape, no internal id).
export function channelToPayload(c) {
  return { name: c.name };
}

export function channelNameExists(name, exceptId) {
  const key = (name || '').trim().toLowerCase();
  if (!key) return false;
  return get(channels).some((c) => c.id !== exceptId && (c.name || '').toLowerCase() === key);
}

// Create and commit a memo into the shared collection. `channel` is a channel
// NAME (case-sensitive). Returns { memo } on success or { error } otherwise.
export function commandCreateMemo({ title, channel, priority = 'standard', body = '', locked = false, passcode = null, marks = [] } = {}) {
  const t = (title || '').trim();
  if (!t) return { error: BLANK_TITLE_MSG };
  if (t.length > 120) return { error: 'Title is too long. Keep the Title to 120 characters or fewer.' };
  const ch = (channel || '').trim();
  if (!ch) return { error: 'Channel is blank. Assign this transmission to an existing channel.' };
  if (!get(channels).some((c) => c.name === ch)) return { error: 'Channel "' + ch + '" does not exist. Add it first or pick an existing channel.' };
  const pr = VALID_PRIORITIES.includes(priority) ? priority : 'standard';
  const b = typeof body === 'string' ? body : '';
  if (b.length > 20000) return { error: 'Body is too long. Keep the Body to 20000 characters or fewer.' };
  const now = new Date().toISOString();
  const m = {
    id: generateId(),
    title: t,
    body: b,
    priority: pr,
    channel: ch,
    locked: !!locked,
    passcode: locked ? (passcode || null) : null,
    marks: Array.isArray(marks) ? marks.filter((mk) => mk && typeof mk.start === 'number' && typeof mk.end === 'number' && mk.end > mk.start && mk.end <= b.length) : [],
    firstTransmitted: now,
    lastModified: now
  };
  memos.update((ms) => [...ms, m]);
  return { memo: m };
}

// Patch a memo by id and stamp lastModified (a real edit). Returns true if found.
export function commandUpdateMemo(id, patch, { stamp = true } = {}) {
  let found = false;
  memos.update((ms) => ms.map((m) => {
    if (m.id !== id) return m;
    found = true;
    const next = { ...m, ...patch };
    if (stamp) next.lastModified = new Date().toISOString();
    return next;
  }));
  return found;
}

// Patch WITHOUT stamping lastModified (for live title/channel/priority edits that
// should reflect immediately but are not a "save" of the body).
export function commandPatchMemo(id, patch) {
  return commandUpdateMemo(id, patch, { stamp: false });
}

export function commandDecommission(id) {
  const memo = get(memos).find((m) => m.id === id);
  if (!memo) return null;
  memos.update((ms) => ms.filter((m) => m.id !== id));
  const record = { ...memo, decommissionedAt: new Date().toISOString() };
  decommissioned.update((ds) => [...ds, record]);
  if (get(activeMemoId) === id) activeMemoId.set(null);
  return memo;
}

export function commandRestore(id) {
  const memo = get(decommissioned).find((m) => m.id === id);
  if (!memo) return false;
  const { decommissionedAt, ...rest } = memo;
  decommissioned.update((ds) => ds.filter((m) => m.id !== id));
  memos.update((ms) => [...ms, rest]);
  return true;
}

export function commandPurge(id) {
  const had = get(decommissioned).some((m) => m.id === id);
  if (!had) return false;
  decommissioned.update((ds) => ds.filter((m) => m.id !== id));
  return true;
}

// Reorder the channels array (sidebar order == array order).
export function commandReorderChannels(fromIndex, toIndex) {
  channels.update((cs) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= cs.length || toIndex >= cs.length || fromIndex === toIndex) return cs;
    const next = cs.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  });
}

export function commandCreateChannel(name) {
  const t = (name || '').trim();
  if (!t) return { error: 'Channel name is blank. Enter a name of at least one character.' };
  if (t.length > 40) return { error: 'Channel name is too long. Keep the name to 40 characters or fewer.' };
  if (channelNameExists(t)) return { error: 'A channel named "' + t + '" already exists (names are case-insensitive). Choose a different name.' };
  const c = { id: generateId(), name: t };
  channels.update((cs) => [...cs, c]);
  return { channel: c };
}

// ---------------------------------------------------------------------------
// Session archive build + validate + apply (the same logic the WebMCP artifact
// tools and the visible Session archive panel both call).
// ---------------------------------------------------------------------------
export function buildSessionArchive() {
  const core = get(themeCore) || THEME_CORE_KEYS[0]; // default projects to a valid enum key on export
  return {
    version: 1,
    themeCore: THEME_CORE_KEYS.includes(core) ? core : THEME_CORE_KEYS[0],
    channels: get(channels).map(channelToPayload),
    memos: get(memos).map(memoToPayload),
    decommissioned: get(decommissioned).map(memoToPayload),
    exportedAt: new Date().toISOString()
  };
}

function validateMemoList(list, label) {
  if (!Array.isArray(list)) return label + ' must be an array.';
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    if (!m || typeof m !== 'object') return label + '[' + i + '] is not an object.';
    if (typeof m.title !== 'string' || m.title.trim().length < 1 || m.title.length > 120) return label + '[' + i + '].title must be a non-empty string of at most 120 characters.';
    if (typeof m.body !== 'string' || m.body.length > 20000) return label + '[' + i + '].body must be a string of at most 20000 characters.';
    if (!VALID_PRIORITIES.includes(m.priority)) return label + '[' + i + '].priority must be one of high, standard, low.';
    if (typeof m.channel !== 'string' || m.channel.length < 1) return label + '[' + i + '].channel must be a non-empty string.';
    if (typeof m.locked !== 'boolean') return label + '[' + i + '].locked must be a boolean.';
    if (m.locked && (typeof m.passcode !== 'string' || m.passcode.length !== 4)) return label + '[' + i + '] is locked but its passcode is not exactly four characters.';
    if (typeof m.firstTransmitted !== 'string' || typeof m.lastModified !== 'string') return label + '[' + i + '] must include firstTransmitted and lastModified ISO-8601 timestamps.';
    if (!Array.isArray(m.marks)) return label + '[' + i + '].marks must be an array.';
    for (let j = 0; j < m.marks.length; j++) {
      const mk = m.marks[j];
      if (!mk || typeof mk.start !== 'number' || typeof mk.end !== 'number' || mk.start < 0 || mk.end <= mk.start || mk.end > m.body.length) return label + '[' + i + '].marks[' + j + '] has an invalid range (end must be greater than start and within the body).';
      if (mk.kind !== 'classified' && mk.kind !== 'priority') return label + '[' + i + '].marks[' + j + '].kind must be classified or priority.';
    }
  }
  return null;
}

function validateChannelList(list) {
  if (!Array.isArray(list)) return 'channels must be an array.';
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (!c || typeof c.name !== 'string' || c.name.trim().length < 1 || c.name.length > 40) return 'channels[' + i + '].name must be a non-empty string of at most 40 characters.';
  }
  return null;
}

// Validate a parsed archive against the field contracts. Returns null when valid,
// otherwise a string naming the offending field or rule. Nothing is applied until
// this returns null, so an invalid import can never leave partial state.
export function validateSessionArchive(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Session JSON must be a single object with version, themeCore, channels, memos, decommissioned, and exportedAt.';
  if (!('version' in payload)) return 'version is missing. It must be exactly 1.';
  if (!('channels' in payload)) return 'channels is missing. It must be an array of channel objects.';
  if (!('memos' in payload)) return 'memos is missing. It must be an array of transmission objects.';
  if (!('decommissioned' in payload)) return 'decommissioned is missing. It must be an array of transmission objects.';
  if (payload.version !== 1) return 'version must be exactly 1 (got ' + JSON.stringify(payload.version) + ').';
  if (!THEME_CORE_KEYS.includes(payload.themeCore)) return 'themeCore must be one of ' + THEME_CORE_KEYS.join(', ') + '.';
  if (typeof payload.exportedAt !== 'string') return 'exportedAt must be an ISO-8601 timestamp string.';
  const ce = validateChannelList(payload.channels);
  if (ce) return ce;
  const me = validateMemoList(payload.memos, 'memos');
  if (me) return me;
  const de = validateMemoList(payload.decommissioned, 'decommissioned');
  if (de) return de;
  return null;
}

// All-or-nothing apply of an already-validated archive. Regenerates internal ids
// and maps channel names back to ids-free name references.
export function applySessionArchive(payload) {
  const newChannels = payload.channels.map((c) => ({ id: generateId(), name: c.name }));
  const mapMemo = (m) => {
    const now = new Date().toISOString();
    return {
      id: generateId(),
      title: m.title,
      body: m.body,
      priority: m.priority,
      channel: m.channel,
      locked: !!m.locked,
      passcode: m.locked ? (m.passcode || null) : null,
      marks: (m.marks || []).map((mk) => ({ start: mk.start, end: mk.end, kind: mk.kind })),
      firstTransmitted: m.firstTransmitted || now,
      lastModified: m.lastModified || now
    };
  };
  channels.set(newChannels);
  memos.set(payload.memos.map(mapMemo));
  decommissioned.set(payload.decommissioned.map(mapMemo));
  themeCore.set(THEME_CORE_KEYS.includes(payload.themeCore) ? payload.themeCore : '');
  revealedIds.set(new Set());
  activeChannel.set(null);
  activeMemoId.set(null);
}

// ---------------------------------------------------------------------------
// AP-style timestamp formatting, e.g. "July 10, 2026, 4:38 a.m."
// ---------------------------------------------------------------------------
const AP_MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
export function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const month = AP_MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  let timePart;
  if (hours === 12 && minutes === 0) timePart = 'noon';
  else if (hours === 0 && minutes === 0) timePart = 'midnight';
  else {
    const h = hours % 12 === 0 ? 12 : hours % 12;
    const mm = String(minutes).padStart(2, '0');
    timePart = h + ':' + mm + ' ' + (hours < 12 ? 'a.m.' : 'p.m.');
  }
  return month + ' ' + day + ', ' + year + ', ' + timePart;
}
