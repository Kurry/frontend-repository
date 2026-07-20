import { z } from 'zod';
export const transmissionSchema = z.object({
  title: z.string().min(1, 'Title is blank. Enter a title of at least one character to save this transmission.').max(120, 'Title too long'),
  body: z.string().optional(),
  priority: z.enum(['high', 'standard', 'low']),
  channelId: z.string().min(1, 'Channel is required')
});
export const channelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long')
});
export const passcodeSchema = z.object({
  passcode: z.string().length(4, 'Enter exactly four characters.')
});
export const sessionArchiveSchema = z.object({
  payload: z.string().min(1, 'Payload is required')
});
import { writable, derived, get } from 'svelte/store';

function loadFromStorage(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const data = localStorage.getItem(key);
    if (data === null) return fallback;
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // storage unavailable; state stays in memory
  }
}

export const themeCores = [
  { name: 'Matrix Green', class: 'theme-matrix-green' },
  { name: 'Neon Cyan', class: 'theme-neon-cyan' },
  { name: 'Blood Red', class: 'theme-blood-red' },
  { name: 'Ghost White', class: 'theme-ghost-white' },
  { name: 'Amber Terminal', class: 'theme-amber-terminal' }
];

// '' means the base accent (no core selected yet).
export const themeCore = writable(loadFromStorage('cipherlog-theme', ''));
themeCore.subscribe((v) => saveToStorage('cipherlog-theme', v));

function stripRevealed(list) {
  return (Array.isArray(list) ? list : []).map((m) => {
    const { revealed, ...rest } = m;
    return rest;
  });
}

export const channels = writable(loadFromStorage('cipherlog-channels', []));
channels.subscribe((v) => saveToStorage('cipherlog-channels', v));

export const memos = writable(stripRevealed(loadFromStorage('cipherlog-memos', [])));
memos.subscribe((v) => saveToStorage('cipherlog-memos', stripRevealed(v)));

export const decommissioned = writable(stripRevealed(loadFromStorage('cipherlog-decommissioned', [])));
decommissioned.subscribe((v) => saveToStorage('cipherlog-decommissioned', stripRevealed(v)));

// Session-only set of memo ids whose locked body is revealed. Never persisted,
// so a full page refresh always returns locked memos to their hidden state.
export const revealedIds = writable(new Set());

export const activeChannel = writable(loadFromStorage('cipherlog-active-channel', null));
activeChannel.subscribe((v) => saveToStorage('cipherlog-active-channel', v));
export const searchQuery = writable(loadFromStorage('cipherlog-search-query', ''));
searchQuery.subscribe((v) => saveToStorage('cipherlog-search-query', v));
export const activeMemoId = writable(loadFromStorage('cipherlog-active-memo-id', null));
activeMemoId.subscribe((v) => saveToStorage('cipherlog-active-memo-id', v));
export const showDecommissioned = writable(loadFromStorage('cipherlog-show-decommissioned', false));
showDecommissioned.subscribe((v) => saveToStorage('cipherlog-show-decommissioned', v));

export const toasts = writable([]);

let toastId = 0;
export function showToast(message) {
  const id = ++toastId;
  toasts.update((t) => [...t, { id, message }]);
  setTimeout(() => {
    toasts.update((t) => t.filter((toast) => toast.id !== id));
  }, 2600);
}

export const filteredMemos = derived(
  [memos, activeChannel, searchQuery],
  ([$memos, $activeChannel, $searchQuery]) => {
    let result = [...$memos];
    if ($activeChannel) {
      result = result.filter((m) => m.channelId === $activeChannel);
    }
    if ($searchQuery.trim()) {
      const q = $searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) =>
          (m.title || '').toLowerCase().includes(q) ||
          (m.body || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    return result;
  }
);

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function createMemo(title, channelId) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: title || '',
    body: '',
    channelId,
    priority: 'standard',
    locked: false,
    passcode: null,
    marks: [],
    created: now,
    lastModified: now
  };
}

export function createChannel(name) {
  return { id: generateId(), name };
}

export const BLANK_TITLE_MSG = 'Title is blank. Enter a title of at least one character to save this transmission.';

// ---------------------------------------------------------------------------
// Shared domain commands. Both the visible UI controls (App.svelte) and the
// WebMCP tool handlers call these functions, so the two drive the identical
// store-mutation code path — WebMCP exposes no success path the UI lacks.
// ---------------------------------------------------------------------------

// Ensure at least one channel exists and return the channel id to file a new
// memo under. Mirrors openNewTransmission's default-channel behavior.
export function ensureChannelId(preferredId) {
  const chs = get(channels);
  if (preferredId && chs.some((c) => c.id === preferredId)) return preferredId;
  const active = get(activeChannel);
  if (active && chs.some((c) => c.id === active)) return active;
  if (chs.length > 0) return chs[0].id;
  const dc = createChannel('General');
  channels.update((cs) => [...cs, dc]);
  return dc.id;
}

const VALID_PRIORITIES = ['high', 'standard', 'low'];

// Create and commit a memo into the shared collection. Returns { memo } on
// success or { error } when the title is blank. commitDraft (the visible New
// Transmission flow) and the WebMCP entity_create_memo tool both call this.
export function commandCreateMemo({ title, channelId, priority = 'standard', body = '', locked = false, passcode = null, marks = [] }) {
  const t = (title || '').trim();
  if (!t) return { error: BLANK_TITLE_MSG };
  const cid = ensureChannelId(channelId);
  const pr = VALID_PRIORITIES.includes(priority) ? priority : 'standard';
  const m = createMemo(t, cid);
  m.body = body || '';
  m.priority = pr;
  m.locked = !!locked;
  m.passcode = passcode;
  m.marks = Array.isArray(marks) ? marks : [];
  memos.update((ms) => [...ms, m]);
  return { memo: m };
}

// Patch a memo field in the shared collection and stamp lastModified. Both the
// visible editor controls and the WebMCP entity_update_memo tool call this.
export function commandUpdateMemo(id, patch) {
  let found = false;
  memos.update((ms) => ms.map((m) => {
    if (m.id !== id) return m;
    found = true;
    return { ...m, ...patch, lastModified: new Date().toISOString() };
  }));
  return found;
}

// Move a memo out of the main list into the Decommissioned collection. Both the
// visible Decommission control and the WebMCP entity_delete_memo tool call this.
export function commandDecommission(id) {
  const memo = get(memos).find((m) => m.id === id);
  if (!memo) return false;
  memos.update((ms) => ms.filter((m) => m.id !== id));
  decommissioned.update((ds) => [...ds, { ...memo, decommissionedAt: new Date().toISOString() }]);
  if (get(activeMemoId) === id) activeMemoId.set(null);
  return true;
}

// AP-style date and time formatting, e.g. "July 10, 2026, 4:38 a.m."
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
  if (hours === 12 && minutes === 0) {
    timePart = 'noon';
  } else if (hours === 0 && minutes === 0) {
    timePart = 'midnight';
  } else {
    const h = hours % 12 === 0 ? 12 : hours % 12;
    const mm = String(minutes).padStart(2, '0');
    const suffix = hours < 12 ? 'a.m.' : 'p.m.';
    timePart = h + ':' + mm + ' ' + suffix;
  }
  return month + ' ' + day + ', ' + year + ', ' + timePart;
}
