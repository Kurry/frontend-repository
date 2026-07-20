<script>
import { untrack, onMount } from 'svelte';
import { createForm } from 'felte';
import { validator } from '@felte/validator-zod';
import { transmissionSchema, channelSchema, passcodeSchema, sessionArchiveSchema } from './stores.js';
import { createDialog, createSelect, melt, createToaster, createToolbar } from '@melt-ui/svelte';
import { Lock, LockOpen, Plus, Folder, Trash, Archive, Download, Upload, Copy, FileText, Check, MagnifyingGlass, Broadcast, FloppyDisk } from 'phosphor-svelte';
import { fly, fade } from 'svelte/transition';
import { flip } from 'svelte/animate';

import {
  channels, memos, decommissioned, themeCore, themeCores, revealedIds,
  activeChannel, searchQuery, activeMemoId, showDecommissioned,
  toasts, showToast, createMemo, createChannel, filteredMemos, formatTimestamp,
  BLANK_TITLE_MSG, commandCreateMemo, commandUpdateMemo, commandDecommission
} from './stores.js';

let newChannelName = $state('');
let showNewChannel = $state(false);
let channelError = $state('');
let titleError = $state('');
let memoTitle = $state('');
let memoBody = $state('');
let showMobileSidebar = $state(false);
let showPasscodeModal = $state(false);
let passcodeMode = $state('set');
let passcodeInput = $state('');
let passcodeError = $state('');
let passcodeInputEl = $state(null);
let showConfirmPurge = $state(false);
let purgeTarget = $state(null);
let purgeCancelEl = $state(null);
let dragIndex = $state(null);
let dropIndex = $state(null);
let selToolbar = $state({ visible: false, x: 0, y: 0, start: 0, end: 0 });
let draftOpen = $state(false);
let draftData = $state(null);
let bodyEl = $state(null);
let renderTick = $state(0);
let lastFocused = null;

let showSessionArchive = $state(false);
let importError = $state('');

const toaster = createToaster();
const toolbar = createToolbar();
const channelSelectMelt = createSelect();
const prioritySelectMelt = createSelect();
const themeSelectMelt = createSelect();

const { elements: { content: passcodeContent, overlay: passcodeOverlay, title: passcodeMeltTitle, description: passcodeMeltDesc, close: passcodeClose } } = createDialog();
const { elements: { content: purgeContent, overlay: purgeOverlay, title: purgeMeltTitle, description: purgeMeltDesc, close: purgeClose } } = createDialog();
const { elements: { content: archiveContent, overlay: archiveOverlay, title: archiveMeltTitle, description: archiveMeltDesc, close: archiveClose } } = createDialog();

const { form: newChannelForm, errors: channelErrors } = createForm({
  extend: validator({ schema: channelSchema }),
  onSubmit: (values, context) => {
    const name = values.name.trim();
    if (allChannels.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      context.setErrors({ name: 'Channel name already exists.' });
      return;
    }
    const c = createChannel(name);
    channels.update((cs) => [...cs, c]);
    activeChannel.set(c.id);
    showNewChannel = false;
    context.reset();
  }
});

function submitPasscodeWithValues(val, context) {
  passcodeInput = val;
  submitPasscode();
}
const { form: passcodeFelte, errors: passcodeErrors } = createForm({
  extend: validator({ schema: passcodeSchema }),
  onSubmit: (values, context) => {
    submitPasscodeWithValues(values.passcode, context);
  }
});

const { form: transmissionForm, errors: transErrors, setTouched: setTransTouched, validate: validateTrans } = createForm({
  extend: validator({ schema: transmissionSchema }),
  onSubmit: (values, context) => {
    if (draftOpen) {
      memoTitle = values.title;
      commitDraft();
    } else if (activeMemo) {
      updateMemo(activeMemo.id, { title: values.title, channelId: values.channelId, priority: values.priority });
    }
  }
});

const { form: sessionArchiveForm, errors: sessionArchiveErrors } = createForm({
  extend: validator({ schema: sessionArchiveSchema }),
  onSubmit: (values, context) => {
    let payload;
    try {
      payload = JSON.parse(values.payload);
    } catch (e) {
      importError = 'Invalid JSON payload';
      return;
    }
    const err = validateSessionArchive(payload);
    if (err) {
      importError = err;
      return;
    }
    applySessionArchive(payload);
    showSessionArchive = false;
    showToast('Archive imported successfully');
  }
});

function buildSessionPayload() {
  return {
    version: 1,
    themeCore: themeClassToCore($themeCore),
    channels: $channels,
    memos: $memos,
    decommissioned: $decommissioned,
    exportedAt: new Date().toISOString()
  };
}

function handleSessionExport(fmt) {
  const payload = buildSessionPayload();
  let content = '';
  if (fmt === 'session-json') content = JSON.stringify(payload, null, 2);
  else if (fmt === 'txt') content = $memos.map(m => m.title + '\n' + m.body).join('\n\n');
  else if (fmt === 'md') content = $memos.map(m => '# ' + m.title + '\n\n' + m.body).join('\n\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fmt === 'session-json' ? 'cipherlog-session.json' : 'session_archive.' + fmt;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported as ' + fmt);
}


let allChannels = $derived($channels);
let allMemos = $derived($memos);
let allDec = $derived($decommissioned);
let activeCh = $derived($activeChannel);
let activeM = $derived($activeMemoId);
let showDec = $derived($showDecommissioned);
let fMemos = $derived($filteredMemos);
let toastList = $derived($toasts);
let revealedSet = $derived($revealedIds);
let activeMemo = $derived(allMemos.find((m) => m.id === activeM) || null);
let editorOpen = $derived(draftOpen || !!activeMemo);
let curChannelId = $derived(draftOpen ? draftData?.channelId : activeMemo?.channelId);
let curPriority = $derived(draftOpen ? (draftData?.priority || 'standard') : (activeMemo?.priority || 'standard'));
let curLocked = $derived(draftOpen ? !!draftData?.locked : !!activeMemo?.locked);
let curHidden = $derived(
  draftOpen
    ? !!draftData?.locked && !draftData?.revealed
    : activeMemo ? activeMemo.locked && !revealedSet.has(activeMemo.id) : false
);
let words = $derived(memoBody.trim() ? memoBody.trim().split(/\s+/).length : 0);
let chars = $derived(memoBody.length);

$effect(() => {
  document.documentElement.className = $themeCore || '';
});

$effect(() => {
  renderTick;
  const el = bodyEl;
  if (!el) return;
  untrack(() => {
    el.innerHTML = buildMarkedHTML(memoBody, currentMarks());
  });
});

$effect(() => {
  if (showPasscodeModal) {
    requestAnimationFrame(() => passcodeInputEl && passcodeInputEl.focus());
  }
});

$effect(() => {
  if (showConfirmPurge) {
    requestAnimationFrame(() => purgeCancelEl && purgeCancelEl.focus());
  }
});

$effect(() => {
  const handler = () => {
    const sel = document.getSelection();
    if (!bodyEl || !sel || sel.rangeCount === 0 || sel.isCollapsed ||
        !bodyEl.contains(sel.anchorNode) || !bodyEl.contains(sel.focusNode)) {
      if (selToolbar.visible) selToolbar = { ...selToolbar, visible: false };
      return;
    }
    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(bodyEl);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end = start + range.toString().length;
    if (end <= start) {
      if (selToolbar.visible) selToolbar = { ...selToolbar, visible: false };
      return;
    }
    const rect = range.getBoundingClientRect();
    selToolbar = {
      visible: true,
      x: Math.max(8, Math.min(rect.left, window.innerWidth - 300)),
      y: Math.max(8, rect.top - 56),
      start,
      end
    };
  };
  document.addEventListener('selectionchange', handler);
  return () => document.removeEventListener('selectionchange', handler);
});

function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMarkedHTML(text, marks) {
  const t = text || '';
  const valid = (marks || [])
    .filter((m) => m.start >= 0 && m.end <= t.length && m.end > m.start)
    .sort((a, b) => a.start - b.start);
  let out = '';
  let pos = 0;
  for (const m of valid) {
    if (m.start < pos) continue;
    out += escHtml(t.slice(pos, m.start));
    const cls = m.type === 'classified' ? 'mark-classified' : 'mark-priority';
    out += '<span class="' + cls + '">' + escHtml(t.slice(m.start, m.end)) + '</span>';
    pos = m.end;
  }
  out += escHtml(t.slice(pos));
  return out;
}

function remapMarks(marks, newText) {
  const out = [];
  for (const m of marks || []) {
    if (!m.text) {
      if (m.end <= newText.length) out.push(m);
      continue;
    }
    if (newText.slice(m.start, m.end) === m.text) { out.push(m); continue; }
    const idx = newText.indexOf(m.text);
    if (idx >= 0) out.push({ ...m, start: idx, end: idx + m.text.length });
  }
  return out;
}

function currentMarks() {
  if (draftOpen) return draftData?.marks || [];
  return activeMemo?.marks || [];
}

function updateMemo(id, patch) {
  commandUpdateMemo(id, patch);
}

function isHidden(memo) {
  return memo.locked && !revealedSet.has(memo.id);
}

function bodyPreview(memo) {
  const b = (memo.body || '').replace(/\s+/g, ' ').trim();
  if (!b) return 'No body text yet';
  return b.length > 120 ? b.slice(0, 120) + '…' : b;
}

function priorityLabel(p) {
  if (p === 'high') return 'High';
  if (p === 'low') return 'Low';
  return 'Standard';
}

function channelName(id) {
  const ch = allChannels.find((c) => c.id === id);
  return ch ? ch.name : '';
}

function focusTitle() {
  requestAnimationFrame(() => {
    const inp = document.getElementById('memo-title-input');
    if (inp) inp.focus();
  });
}

function openNewTransmission() {
  if (draftOpen) { focusTitle(); return; }
  let channelId = activeCh;
  if (!channelId && allChannels.length > 0) channelId = allChannels[0].id;
  if (!channelId) {
    const dc = createChannel('General');
    channels.update((cs) => [...cs, dc]);
    channelId = dc.id;
  }
  draftData = { channelId, priority: 'standard', locked: false, passcode: null, revealed: false, marks: [] };
  draftOpen = true;
  activeMemoId.set(null);
  showDecommissioned.set(false);
  showMobileSidebar = false;
  memoTitle = '';
  memoBody = '';
  titleError = '';
  renderTick++;
  focusTitle();
}

function commitDraft() {
  const d = draftData;
  const res = commandCreateMemo({
    title: memoTitle.trim(),
    channelId: d.channelId,
    priority: d.priority,
    body: memoBody,
    locked: d.locked,
    passcode: d.passcode,
    marks: d.marks
  });
  if (res.error) { titleError = res.error; return; }
  const m = res.memo;
  if (d.revealed) {
    revealedIds.update((s) => { const n = new Set(s); n.add(m.id); return n; });
  }
  draftOpen = false;
  draftData = null;
  activeMemoId.set(m.id);
  showToast('Transmission created');
}

function discardDraft() {
  draftOpen = false;
  draftData = null;
  activeMemoId.set(null);
  titleError = '';
  showToast('Draft discarded');
}

function handleTitleInput() {
  if (memoTitle.trim()) {
    titleError = '';
    if (draftOpen) commitDraft();
    else if (activeMemo) updateMemo(activeMemo.id, { title: memoTitle.trim() });
  } else if (!draftOpen && activeMemo) {
    titleError = BLANK_TITLE_MSG;
  }
}

function handleBodyInput() {
  if (!bodyEl) return;
  const t = bodyEl.textContent;
  memoBody = t;
  if (draftOpen) {
    draftData.marks = remapMarks(draftData.marks, t);
  } else if (activeMemo && !isHidden(activeMemo)) {
    updateMemo(activeMemo.id, { body: t, marks: remapMarks(activeMemo.marks, t) });
  }
}

function openMemo(id) {
  const m = allMemos.find((x) => x.id === id);
  if (!m) return;
  draftOpen = false;
  draftData = null;
  activeMemoId.set(id);
  showDecommissioned.set(false);
  memoTitle = m.title;
  memoBody = m.body || '';
  titleError = '';
  renderTick++;
}

function handleBackToList() {
  if (!memoTitle.trim()) {
    titleError = BLANK_TITLE_MSG;
    focusTitle();
    return;
  }
  if (activeMemo) updateMemo(activeMemo.id, { title: memoTitle.trim() });
  activeMemoId.set(null);
  draftOpen = false;
  draftData = null;
  selToolbar = { ...selToolbar, visible: false };
}

function closeEditorSilently() {
  draftOpen = false;
  draftData = null;
  activeMemoId.set(null);
  titleError = '';
}

function toggleChannel(cid) {
  activeChannel.set(activeCh === cid ? null : cid);
  closeEditorSilently();
  showDecommissioned.set(false);
  showMobileSidebar = false;
}

function handleShowAll() {
  activeChannel.set(null);
  closeEditorSilently();
  showDecommissioned.set(false);
  showMobileSidebar = false;
}

function openDecommissioned() {
  closeEditorSilently();
  showDecommissioned.set(true);
  showMobileSidebar = false;
}

function handleNewChannel() {
  const name = newChannelName.trim();
  if (!name) {
    channelError = 'Enter a channel name of at least one character.';
    return;
  }
  if (allChannels.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
    channelError = 'That channel name is in use. Enter a different name.';
    return;
  }
  channelError = '';
  channels.update((cs) => [...cs, createChannel(name)]);
  newChannelName = '';
  showNewChannel = false;
  showToast('Channel created');
}

function moveChannel(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= allChannels.length) return;
  const chs = [...allChannels];
  const tmp = chs[i];
  chs[i] = chs[j];
  chs[j] = tmp;
  channels.set(chs);
}

function handleDeleteChannel(cid) {
  const rest = allChannels.filter((c) => c.id !== cid);
  const hasMemos = allMemos.some((m) => m.channelId === cid) || allDec.some((m) => m.channelId === cid);
  if (rest.length === 0 && hasMemos) {
    showToast('Add another channel before removing this one.');
    return;
  }
  if (rest.length > 0) {
    const fb = rest[0].id;
    memos.update((ms) => ms.map((m) => (m.channelId === cid ? { ...m, channelId: fb } : m)));
    decommissioned.update((ds) => ds.map((m) => (m.channelId === cid ? { ...m, channelId: fb } : m)));
  }
  channels.update((cs) => cs.filter((c) => c.id !== cid));
  if (activeCh === cid) activeChannel.set(null);
  showToast('Channel removed');
}

function handleDecommission(id) {
  if (commandDecommission(id)) showToast('Transmission decommissioned');
}

function handleRestore(id) {
  const memo = allDec.find((m) => m.id === id);
  if (!memo) return;
  const rest = { ...memo };
  delete rest.decommissionedAt;
  decommissioned.update((ds) => ds.filter((m) => m.id !== id));
  memos.update((ms) => [...ms, rest]);
  showToast('Transmission restored');
}

function openPurge(id) {
  lastFocused = document.activeElement;
  purgeTarget = id;
  showConfirmPurge = true;
}

function closePurgeModal() {
  showConfirmPurge = false;
  purgeTarget = null;
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function handlePurge() {
  if (!purgeTarget) return;
  decommissioned.update((ds) => ds.filter((m) => m.id !== purgeTarget));
  showConfirmPurge = false;
  purgeTarget = null;
  showToast('Transmission purged');
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function handleLockToggle() {
  if (!curLocked) {
    lastFocused = document.activeElement;
    passcodeMode = 'set';
    passcodeInput = '';
    passcodeError = '';
    showPasscodeModal = true;
    return;
  }
  if (curHidden) {
    lastFocused = document.activeElement;
    passcodeMode = 'unlock';
    passcodeInput = '';
    passcodeError = '';
    showPasscodeModal = true;
    return;
  }
  applyUnlock();
}

function applyUnlock() {
  if (draftOpen) {
    draftData.locked = false;
    draftData.passcode = null;
    draftData.revealed = false;
  } else if (activeMemo) {
    updateMemo(activeMemo.id, { locked: false, passcode: null });
    revealedIds.update((s) => { const n = new Set(s); n.delete(activeMemo.id); return n; });
  }
  showToast('Transmission unlocked');
}

function openReveal() {
  lastFocused = document.activeElement;
  passcodeMode = 'reveal';
  passcodeInput = '';
  passcodeError = '';
  showPasscodeModal = true;
}

function closePasscodeModal() {
  showPasscodeModal = false;
  passcodeError = '';
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function handleSubmitPasscode() {
  const code = passcodeInput;
  if (code.length !== 4) {
    passcodeError = 'Enter exactly four characters.';
    return;
  }
  if (passcodeMode === 'set') {
    if (draftOpen) {
      draftData.locked = true;
      draftData.passcode = code;
      draftData.revealed = false;
    } else if (activeMemo) {
      updateMemo(activeMemo.id, { locked: true, passcode: code });
      revealedIds.update((s) => { const n = new Set(s); n.delete(activeMemo.id); return n; });
    }
    showToast('Transmission locked');
  } else {
    const stored = draftOpen ? draftData?.passcode : activeMemo?.passcode;
    if (code !== stored) {
      passcodeError = 'That passcode does not match. Check the four-character code and try again.';
      return;
    }
    if (passcodeMode === 'unlock') {
      applyUnlock();
    } else {
      if (draftOpen) {
        draftData.revealed = true;
      } else if (activeMemo) {
        revealedIds.update((s) => { const n = new Set(s); n.add(activeMemo.id); return n; });
      }
      showToast('Transmission revealed for this session');
    }
  }
  showPasscodeModal = false;
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function handleChannelChange(v) {
  if (draftOpen) draftData.channelId = v;
  else if (activeMemo) updateMemo(activeMemo.id, { channelId: v });
}

function handlePriorityChange(v) {
  if (draftOpen) draftData.priority = v;
  else if (activeMemo) updateMemo(activeMemo.id, { priority: v });
}

function markText(type) {
  const { start, end } = selToolbar;
  if (end <= start) { selToolbar = { ...selToolbar, visible: false }; return; }
  const text = memoBody.slice(start, end);
  const existing = currentMarks();
  const merged = [
    ...existing.filter((m) => !(m.start < end && m.end > start)),
    { start, end, type, text }
  ].sort((a, b) => a.start - b.start);
  if (draftOpen) draftData.marks = merged;
  else if (activeMemo) updateMemo(activeMemo.id, { marks: merged });
  selToolbar = { ...selToolbar, visible: false };
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
  renderTick++;
  showToast(type === 'classified' ? 'Marked as classified' : 'Marked as priority');
}

function handleExport(memo, fmt) {
  const body = memo.body || '';
  const content = fmt === 'md' ? '# ' + memo.title + '\n\n' + body : memo.title + '\n\n' + body;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (memo.title || 'transmission').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50) + '.' + fmt;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported as .' + fmt);
}

function handleDragStart(e, i) {
  dragIndex = i;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(i));
}

function handleDragOver(e, i) {
  e.preventDefault();
  if (dragIndex !== null && dragIndex !== i) dropIndex = i;
}

function handleDrop(e, i) {
  e.preventDefault();
  if (dragIndex === null || dragIndex === i) { dragIndex = null; dropIndex = null; return; }
  const chs = [...allChannels];
  const moved = chs.splice(dragIndex, 1)[0];
  chs.splice(i, 0, moved);
  channels.set(chs);
  dragIndex = null;
  dropIndex = null;
}

function handleDragEnd() {
  dragIndex = null;
  dropIndex = null;
}

function handleWindowKey(e) {
  if (e.key !== 'Escape') return;
  if (selToolbar.visible) { selToolbar = { ...selToolbar, visible: false }; return; }
  if (showPasscodeModal) { closePasscodeModal(); return; }
  if (showConfirmPurge) { closePurgeModal(); return; }
  if (showNewChannel) { showNewChannel = false; return; }
  if (showMobileSidebar) { showMobileSidebar = false; }
}

// ---------------------------------------------------------------------------
// WebMCP action surface (contract zto-webmcp-v1).
// Every tool handler calls the exact same store command or component function
// that the visible control uses — no success path exists that the UI lacks.
// Modules: entity-collection-v1 (memo) + browse-query-v1 (memos / views).
// ---------------------------------------------------------------------------
const WEBMCP_CONTRACT = 'zto-webmcp-v1';
const THEME_CORES = [
  { core: 'default', name: 'Default', class: '' },
  { core: 'matrix-green', name: 'Matrix Green', class: 'theme-matrix-green' },
  { core: 'neon-cyan', name: 'Neon Cyan', class: 'theme-neon-cyan' },
  { core: 'blood-red', name: 'Blood Red', class: 'theme-blood-red' },
  { core: 'ghost-white', name: 'Ghost White', class: 'theme-ghost-white' },
  { core: 'amber-terminal', name: 'Amber Terminal', class: 'theme-amber-terminal' }
];
const ENTITY_PRIORITIES = ['high', 'standard', 'low'];
const ENTITY_UPDATE_FIELDS = ['title', 'body', 'priority', 'channel'];

function resolveMemo(ref) {
  const list = $memos;
  if (ref == null) return null;
  const key = String(ref);
  return list.find((m) => m.id === key) ||
    list.find((m) => (m.title || '').toLowerCase() === key.toLowerCase()) || null;
}

function resolveChannelId(name) {
  if (name == null) return undefined;
  const key = String(name).toLowerCase();
  const ch = $channels.find((c) => (c.name || '').toLowerCase() === key);
  return ch ? ch.id : null;
}

function resolveThemeClass(ref) {
  if (ref == null) return null;
  const key = String(ref).toLowerCase();
  const hit = THEME_CORES.find((t) => t.core === key || t.name.toLowerCase() === key || t.class === key);
  return hit ? hit.class : null;
}

// Reverse of resolveThemeClass: the internal themeCore store holds a CSS class
// (e.g. 'theme-blood-red', or '' before a core is chosen), but the session
// archive field contract requires the bare enum key (e.g. 'blood-red'). Falls
// back to the first named core so export never emits the internal-only 'default'.
function themeClassToCore(cls) {
  const hit = THEME_CORES.find((t) => t.core !== 'default' && t.class === cls);
  return hit ? hit.core : THEME_CORES[1].core;
}

const SESSION_THEME_CORE_KEYS = THEME_CORES.filter((t) => t.core !== 'default').map((t) => t.core);

function validateEntityContractList(list) {
  if (!Array.isArray(list)) return false;
  return list.every((m) => {
    if (!m || typeof m !== 'object') return false;
    if (!ENTITY_PRIORITIES.includes(m.priority)) return false;
    if (m.locked && !(typeof m.passcode === 'string' && m.passcode.length === 4)) return false;
    if (m.marks !== undefined) {
      if (!Array.isArray(m.marks)) return false;
      if (!m.marks.every((mk) => mk && typeof mk.start === 'number' && typeof mk.end === 'number' && mk.end > mk.start)) return false;
    }
    return true;
  });
}

function validateChannelContractList(list) {
  if (!Array.isArray(list)) return false;
  return list.every((c) => c && typeof c.name === 'string' && c.name.trim().length >= 1 && c.name.length <= 40);
}

// Validates a parsed session archive payload against the transmission, channel,
// and session field contracts before any store is touched, so a schema-invalid
// import never applies partial state. Returns null when valid, else an error
// string naming the offending field or rule.
function validateSessionArchive(payload) {
  if (!payload || typeof payload !== 'object') return 'Payload must be a JSON object.';
  if (payload.version !== 1) return 'version must be exactly 1.';
  if (!Array.isArray(payload.channels)) return 'channels is required and must be an array.';
  if (!Array.isArray(payload.memos)) return 'memos is required and must be an array.';
  if (!Array.isArray(payload.decommissioned)) return 'decommissioned is required and must be an array.';
  if (!SESSION_THEME_CORE_KEYS.includes(payload.themeCore)) return 'themeCore must be one of ' + SESSION_THEME_CORE_KEYS.join(', ') + '.';
  if (!validateChannelContractList(payload.channels)) return 'A channel name is empty or longer than 40 characters.';
  if (!validateEntityContractList(payload.memos)) return 'A memo violates the priority, passcode, or mark field contract.';
  if (!validateEntityContractList(payload.decommissioned)) return 'A decommissioned memo violates the priority, passcode, or mark field contract.';
  return null;
}

// Applies an already-validated session archive payload to the shared stores.
// Only called after validateSessionArchive returns null, so this is always
// an all-or-nothing replace — never a partial one.
function applySessionArchive(payload) {
  channels.set(payload.channels);
  memos.set(payload.memos);
  decommissioned.set(payload.decommissioned);
  themeCore.set(resolveThemeClass(payload.themeCore) ?? '');
}

const WEBMCP_TOOLS = [
  {
    name: 'entity_create_memo',
    module: 'entity-collection-v1',
    operation: 'create',
    description: 'Create a transmission (memo) in the shared collection with a title, optional channel name, and optional priority (high|standard|low).',
    inputSchema: { type: 'object', required: ['title'], properties: {
      title: { type: 'string' },
      channel: { type: 'string' },
      priority: { type: 'string', enum: ENTITY_PRIORITIES }
    } },
    handler(args = {}) {
      let channelId;
      if (args.channel != null) {
        const cid = resolveChannelId(args.channel);
        if (cid === null) return { ok: false, error: 'No channel named "' + args.channel + '".' };
        channelId = cid;
      }
      const priority = args.priority != null ? String(args.priority) : 'standard';
      if (!ENTITY_PRIORITIES.includes(priority)) return { ok: false, error: 'priority must be one of ' + ENTITY_PRIORITIES.join(', ') };
      const res = commandCreateMemo({ title: args.title, channelId, priority });
      if (res.error) return { ok: false, error: res.error };
      showToast('Transmission created');
      return { ok: true, id: res.memo.id, title: res.memo.title };
    }
  },
  {
    name: 'entity_select_memo',
    module: 'entity-collection-v1',
    operation: 'select',
    description: 'Open a transmission by id or exact title in the main editor.',
    inputSchema: { type: 'object', required: ['memo'], properties: { memo: { type: 'string' } } },
    handler(args = {}) {
      const memo = resolveMemo(args.memo);
      if (!memo) return { ok: false, error: 'No matching transmission.' };
      openMemo(memo.id);
      return { ok: true, id: memo.id, title: memo.title };
    }
  },
  {
    name: 'entity_update_memo',
    module: 'entity-collection-v1',
    operation: 'update',
    description: 'Update one bounded field (title, body, priority, or channel) of a transmission. priority is high|standard|low; channel is an existing channel name.',
    inputSchema: { type: 'object', required: ['memo', 'field', 'value'], properties: {
      memo: { type: 'string' },
      field: { type: 'string', enum: ENTITY_UPDATE_FIELDS },
      value: { type: 'string' }
    } },
    handler(args = {}) {
      const memo = resolveMemo(args.memo);
      if (!memo) return { ok: false, error: 'No matching transmission.' };
      const field = String(args.field || '');
      if (!ENTITY_UPDATE_FIELDS.includes(field)) return { ok: false, error: 'field must be one of ' + ENTITY_UPDATE_FIELDS.join(', ') };
      let patch;
      if (field === 'priority') {
        const v = String(args.value);
        if (!ENTITY_PRIORITIES.includes(v)) return { ok: false, error: 'priority must be one of ' + ENTITY_PRIORITIES.join(', ') };
        patch = { priority: v };
      } else if (field === 'channel') {
        const cid = resolveChannelId(args.value);
        if (!cid) return { ok: false, error: 'No channel named "' + args.value + '".' };
        patch = { channelId: cid };
      } else if (field === 'title') {
        const v = String(args.value).trim();
        if (!v) return { ok: false, error: BLANK_TITLE_MSG };
        patch = { title: v };
      } else {
        patch = { body: String(args.value) };
      }
      commandUpdateMemo(memo.id, patch);
      if (activeM === memo.id) {
        if (field === 'title') memoTitle = patch.title;
        if (field === 'body') { memoBody = patch.body; renderTick++; }
      }
      return { ok: true, id: memo.id, field };
    }
  },
  {
    name: 'entity_delete_memo',
    module: 'entity-collection-v1',
    operation: 'delete',
    description: 'Decommission a transmission, removing it from the main list (requires confirm=true).',
    inputSchema: { type: 'object', required: ['memo', 'confirm'], properties: {
      memo: { type: 'string' },
      confirm: { type: 'boolean' }
    } },
    handler(args = {}) {
      if (args.confirm !== true) return { ok: false, error: 'Deletion requires confirm=true.' };
      const memo = resolveMemo(args.memo);
      if (!memo) return { ok: false, error: 'No matching transmission.' };
      handleDecommission(memo.id);
      return { ok: true, id: memo.id };
    }
  },
  {
    name: 'browse_open',
    module: 'browse-query-v1',
    operation: 'open',
    description: 'Open a declared destination view: transmissions (main list) or decommissioned.',
    inputSchema: { type: 'object', required: ['destination'], properties: {
      destination: { type: 'string', enum: ['transmissions', 'decommissioned'] }
    } },
    handler(args = {}) {
      const dest = String(args.destination || '');
      if (dest === 'transmissions') { handleShowAll(); return { ok: true, destination: dest }; }
      if (dest === 'decommissioned') { openDecommissioned(); return { ok: true, destination: dest }; }
      return { ok: false, error: 'destination must be transmissions or decommissioned.' };
    }
  },
  {
    name: 'browse_search',
    module: 'browse-query-v1',
    operation: 'search',
    description: 'Set the memo-list search query, filtering visible memos by title or body.',
    inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string' } } },
    handler(args = {}) {
      searchQuery.set(String(args.query == null ? '' : args.query));
      return { ok: true, query: $searchQuery };
    }
  },
  {
    name: 'browse_apply_filter',
    module: 'browse-query-v1',
    operation: 'apply_filter',
    description: 'Apply the channel filter to the memo list by channel name. filter must be "channel".',
    inputSchema: { type: 'object', required: ['filter', 'value'], properties: {
      filter: { type: 'string', enum: ['channel'] },
      value: { type: 'string' }
    } },
    handler(args = {}) {
      if (String(args.filter) !== 'channel') return { ok: false, error: 'filter must be "channel".' };
      const cid = resolveChannelId(args.value);
      if (!cid) return { ok: false, error: 'No channel named "' + args.value + '".' };
      activeChannel.set(cid);
      closeEditorSilently();
      showDecommissioned.set(false);
      return { ok: true, filter: 'channel', value: args.value };
    }
  },
  {
    name: 'browse_clear_filter',
    module: 'browse-query-v1',
    operation: 'clear_filter',
    description: 'Clear the active channel filter and show all channels.',
    inputSchema: { type: 'object', properties: {} },
    handler() { handleShowAll(); return { ok: true }; }
  },
  {
    name: 'browse_set_theme',
    module: 'browse-query-v1',
    operation: 'set_theme',
    description: 'Switch the Theme Core accent. theme is one of default, matrix-green, neon-cyan, blood-red, ghost-white, amber-terminal.',
    inputSchema: { type: 'object', required: ['theme'], properties: {
      theme: { type: 'string', enum: THEME_CORES.map((t) => t.core) }
    } },
    handler(args = {}) {
      const cls = resolveThemeClass(args.theme);
      if (cls === null) return { ok: false, error: 'Unknown theme core.' };
      themeCore.set(cls);
      return { ok: true, theme: String(args.theme) };
    }
  },
  {
    name: 'artifact_export_session',
    module: 'artifact-transfer-v1',
    operation: 'export',
    description: 'Export session archive',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['session-json', 'txt', 'md'] } } },
    handler(args = {}) {
      const fmt = args.format || 'session-json';
      handleSessionExport(fmt);
      return { ok: true, format: fmt };
    }
  },
  {
    name: 'artifact_import_session',
    module: 'artifact-transfer-v1',
    operation: 'import',
    description: 'Import session archive',
    inputSchema: { type: 'object', required: ['payload'], properties: { payload: { type: 'string' }, mode: { type: 'string', enum: ['session-json'] } } },
    handler(args = {}) {
      let payload;
      try {
        payload = JSON.parse(args.payload);
      } catch (e) {
        return { ok: false, error: 'Invalid JSON' };
      }
      const err = validateSessionArchive(payload);
      if (err) return { ok: false, error: err };
      applySessionArchive(payload);
      showToast('Archive imported successfully');
      return { ok: true };
    }
  },
  {
    name: 'artifact_copy_session',
    module: 'artifact-transfer-v1',
    operation: 'copy',
    description: 'Copy session archive to clipboard',
    inputSchema: { type: 'object', properties: {} },
    handler(args = {}) {
      const payload = JSON.stringify(buildSessionPayload());
      navigator.clipboard.writeText(payload).catch(()=>{});
      showToast('Copied to clipboard');
      return { ok: true };
    }
  }
];

function webmcpListTools() {
  return WEBMCP_TOOLS.map((t) => ({
    name: t.name, module: t.module, operation: t.operation,
    description: t.description, inputSchema: t.inputSchema
  }));
}

function webmcpSessionInfo() {
  return {
    contract_version: WEBMCP_CONTRACT,
    app: 'CipherLog',
    modules: ['entity-collection-v1', 'browse-query-v1', 'artifact-transfer-v1'],
    tool_count: WEBMCP_TOOLS.length,
    tools: WEBMCP_TOOLS.map((t) => t.name)
  };
}

function webmcpInvokeTool(name, args) {
  const tool = WEBMCP_TOOLS.find((t) => t.name === name);
  if (!tool) return { ok: false, error: 'Unknown tool: ' + name };
  try {
    return tool.handler(args || {});
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

onMount(() => {
  window.webmcp_session_info = webmcpSessionInfo;
  window.webmcp_list_tools = webmcpListTools;
  window.webmcp_invoke_tool = webmcpInvokeTool;
  try {
    if (navigator && typeof navigator === 'object') {
      navigator.modelContext = navigator.modelContext || {};
      navigator.modelContext.zto = {
        contract_version: WEBMCP_CONTRACT,
        session_info: webmcpSessionInfo,
        list_tools: webmcpListTools,
        invoke_tool: webmcpInvokeTool
      };
    }
  } catch (e) {
    // navigator.modelContext is optional-additional; window.* is the contract.
  }
});
</script>

<svelte:window onkeydown={handleWindowKey} />

<div class="app-root">
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <button class="btn-secondary mobile-menu-btn" aria-expanded={showMobileSidebar}
                onclick={() => (showMobileSidebar = !showMobileSidebar)}>Channels</button>
        <h1 class="app-title">CipherLog</h1>
      </div>
      <div class="header-right">
        <div class="theme-ctrl">
          <label class="theme-label" for="theme-select">Theme Core</label>
          <select id="theme-select" class="theme-select" value={$themeCore}
                  onchange={(e) => themeCore.set(e.target.value)}>
            <option value="">Default</option>
            {#each themeCores as tc (tc.class)}
              <option value={tc.class}>{tc.name}</option>
            {/each}
          </select>
        </div>
        <button class="btn-secondary" onclick={() => { importError = ''; showSessionArchive = true; }}>Session Archive</button>
        <button class="btn-primary" onclick={openNewTransmission}>Create New Transmission</button>
      </div>
    </div>
  </header>

  {#if showMobileSidebar}
    <div class="mobile-overlay" role="presentation" onclick={() => (showMobileSidebar = false)}>
      <div class="mobile-sidebar" role="presentation" onclick={(e) => e.stopPropagation()}>
        {@render channelList('mobile')}
      </div>
    </div>
  {/if}

  <div class="main-layout">
    <aside class="desktop-sidebar">
      {@render channelList('desktop')}
    </aside>
    <main class="main-content">
      {#if showDec}
        {@render decommissionedView()}
      {:else if editorOpen}
        {@render memoEditor()}
      {:else}
        {@render memoList()}
      {/if}
    </main>
  </div>

  <div class="toast-container" role="status" aria-live="polite">
    {#each toastList as toast (toast.id)}
      <div class="toast-item" aria-live="polite">{toast.message}</div>
    {/each}
  </div>

  {#if showPasscodeModal}
    <div class="modal-overlay" role="presentation" onclick={closePasscodeModal}>
      <div class="modal-box" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
        <h2 id="passcode-title" class="modal-title" >{passcodeMode === 'set' ? 'Set passcode' : 'Enter passcode'}</h2>
        <p id="passcode-description" class="modal-desc">
          {#if passcodeMode === 'set'}
            Enter a four-character local passcode. This only conceals the body on this device; it is not encryption or account security.
          {:else if passcodeMode === 'unlock'}
            Enter the four-character local passcode to remove this device-only concealment.
          {:else}
            Enter the four-character local passcode to reveal this transmission for this viewing session.
          {/if}
        </p>
        <label class="field-label" for="passcode-input">Passcode</label>
        <input id="passcode-input" type="text" maxlength="4" autocomplete="off"
               bind:this={passcodeInputEl} bind:value={passcodeInput} class="passcode-input"
               aria-describedby="passcode-description"
               onkeydown={(e) => e.key === 'Enter' && handleSubmitPasscode()} />
        {#if passcodeError}<p class="error-text" role="alert">{passcodeError}</p>{/if}
        <div class="modal-actions">
          <button class="btn-secondary modal-btn" onclick={closePasscodeModal}>Cancel</button>
          <button class="btn-primary modal-btn" onclick={handleSubmitPasscode}>
            {passcodeMode === 'set' ? 'Lock' : passcodeMode === 'unlock' ? 'Unlock' : 'Reveal'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showConfirmPurge}
    <div class="modal-overlay" role="presentation" onclick={closePurgeModal}>
      <div class="modal-box" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
        <h2 id="purge-title" class="modal-title" >Purge transmission</h2>
        <p class="modal-desc">This action cannot be undone. The transmission will be permanently deleted.</p>
        <div class="modal-actions">
          <button class="btn-secondary modal-btn" bind:this={purgeCancelEl} onclick={closePurgeModal}>Cancel</button>
          <button class="btn-danger modal-btn" onclick={handlePurge}>Purge</button>
        </div>
      </div>
    </div>
  {/if}

  {#if selToolbar.visible}
    <div class="sel-toolbar" role="toolbar" aria-label="Text marking" style="left:{selToolbar.x}px;top:{selToolbar.y}px;">
      <button class="sel-btn" onmousedown={(e) => e.preventDefault()} onclick={() => markText('classified')}>Mark Classified</button>
      <button class="sel-btn" onmousedown={(e) => e.preventDefault()} onclick={() => markText('priority')}>Mark Priority</button>
    </div>
  {/if}

  {@render sessionArchivePanel()}
</div>

{#snippet channelList(prefix)}
  <div class="channel-list-root">
    <div class="channel-header">
      <h2 class="channel-title">Channels</h2>
      <button class="new-ch-btn" onclick={() => { showNewChannel = true; newChannelName = ''; channelError = ''; }}>Add New Channel</button>
    </div>
    {#if showNewChannel}
      <div class="new-ch-form">
        <label class="field-label" for="{prefix}-new-channel-input">Channel name</label>
        <input id="{prefix}-new-channel-input" type="text" bind:value={newChannelName} class="new-ch-input"
               onkeydown={(e) => { if (e.key === 'Enter') handleNewChannel(); }} />
        {#if channelError}<p class="error-text" role="alert">{channelError}</p>{/if}
        <div class="new-ch-actions">
          <button class="btn-primary btn-compact" onclick={handleNewChannel}>Create</button>
          <button class="btn-secondary btn-compact" onclick={() => (showNewChannel = false)}>Cancel</button>
        </div>
      </div>
    {/if}
    <button class="show-all-btn" class:active={!activeCh && !showDec} onclick={handleShowAll}>Show All Channels</button>
    <div class="channel-items" role="list">
      {#each allChannels as ch, i (ch.id)}
        {#if dropIndex === i && dragIndex !== null}
          <div class="drop-indicator"></div>
        {/if}
        <div class="channel-row" role="listitem" class:dragging={dragIndex === i} draggable="true"
             ondragstart={(e) => handleDragStart(e, i)}
             ondragover={(e) => handleDragOver(e, i)}
             ondrop={(e) => handleDrop(e, i)}
             ondragend={handleDragEnd}>
          <span class="drag-handle" aria-hidden="true">::</span>
          <button class="channel-btn" class:active={activeCh === ch.id} onclick={() => toggleChannel(ch.id)}>{ch.name}</button>
          <button class="ch-icon-btn" aria-label="Move {ch.name} up" disabled={i === 0}
                  onclick={() => moveChannel(i, -1)}>&#9650;</button>
          <button class="ch-icon-btn" aria-label="Move {ch.name} down" disabled={i === allChannels.length - 1}
                  onclick={() => moveChannel(i, 1)}>&#9660;</button>
          <button class="ch-icon-btn" aria-label="Remove {ch.name} channel" onclick={() => handleDeleteChannel(ch.id)}>&#10005;</button>
        </div>
      {/each}
      {#if allChannels.length === 0}
        <div class="empty-msg">No channels yet. Select Add New Channel to organize transmissions.</div>
      {/if}
    </div>
    <div class="decomm-link">
      <button class="decomm-btn" class:active={showDec} onclick={openDecommissioned}>Decommissioned ({allDec.length})</button>
    </div>
  </div>
{/snippet}

{#snippet memoCardBadge(memo)}
  <span class="corner-badge badge-{memo.priority || 'standard'}">{priorityLabel(memo.priority)}</span>
{/snippet}

{#snippet redactionStatus(compact)}
  <span class="redaction-status" class:compact>
    <span class="redacted" aria-label="Locally concealed body">[ENCRYPTED]</span>
    <span class="local-only-note">Local concealment only — not encryption or account security</span>
  </span>
{/snippet}

{#snippet memoList()}
  <div class="view-root">
    <div class="field search-field">
      <label class="field-label" for="search-input">Search</label>
      <input id="search-input" type="text" value={$searchQuery} class="search-input"
             placeholder="Search by title or body"
             oninput={(e) => searchQuery.set(e.target.value)}
             onkeydown={(e) => { if (e.key === 'Escape') { searchQuery.set(''); e.stopPropagation(); } }} />
    </div>
    {#if activeCh}
      <div class="filter-bar">
        <span class="filter-label">Filtering:</span>
        <span class="filter-tag">{channelName(activeCh) || 'Unknown'}</span>
        <button class="btn-secondary btn-compact" onclick={handleShowAll}>Show All Channels</button>
      </div>
    {/if}
    {#if fMemos.length === 0}
      <div class="empty-state">
        {#if allMemos.length > 0}
          <div class="empty-icon" aria-hidden="true"><MagnifyingGlass size="24" aria-label="Search" /></div>
          <p class="empty-title">No matching transmissions</p>
          <p class="empty-sub">Adjust your search or channel filter to see more results.</p>
        {:else}
          <div class="empty-icon" aria-hidden="true"><Broadcast size="24" aria-label="Transmission" /></div>
          <p class="empty-title">No transmissions yet</p>
          <p class="empty-sub">Start logging your transmissions.</p>
        {/if}
      </div>
    {:else}
      <div class="memo-cards">
        {#each fMemos as memo (memo.id)}
          <div class="memo-card interactive-card" transition:fade={{ duration: 150 }} animate:flip={{ duration: 150 }} role="button" tabindex="0"
               aria-label="Open {memo.title || 'transmission'}"
               onclick={() => openMemo(memo.id)}
               onkeydown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMemo(memo.id); } }}>
            {@render memoCardBadge(memo)}
            <div class="card-title-row">
              <h3 class="card-title">{memo.title}</h3>
              {#if memo.locked}<span class="lock-chip">Locked</span>{/if}
              <span class="ch-tag">{channelName(memo.channelId)}</span>
            </div>
            <p class="card-preview">
              {#if isHidden(memo)}{@render redactionStatus(true)}{:else}{bodyPreview(memo)}{/if}
            </p>
            <div class="card-footer">
              <p class="card-time">First transmitted {formatTimestamp(memo.created)} &middot; Last modified {formatTimestamp(memo.lastModified)}</p>
              <button class="btn-secondary card-action" onclick={(e) => { e.stopPropagation(); handleDecommission(memo.id); }}>Decommission</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}


{#snippet sessionArchivePanel()}
  {#if showSessionArchive}
    <div class="modal-overlay" role="presentation"  transition:fade={{ duration: 150 }}>
      <div class="modal-box" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
        <h2 id="archive-title" class="modal-title" >Session Archive</h2>
        <p class="modal-desc">Export or import the full session archive JSON.</p>

        <div class="modal-actions" style="margin-bottom: 16px;">
          <button class="btn-primary" onclick={() => handleSessionExport('session-json')}>Export session-json</button>
          <button class="btn-secondary" onclick={() => handleSessionExport('txt')}>Export TXT</button>
          <button class="btn-secondary" onclick={() => handleSessionExport('md')}>Export MD</button>
          <button class="btn-secondary" onclick={() => { navigator.clipboard.writeText(JSON.stringify(buildSessionPayload())); showToast('Copied to clipboard'); }}>Copy JSON</button>
        </div>

        <form use:sessionArchiveForm>
          <label class="field-label" for="import-payload">Import session JSON</label>
          <textarea name="payload" id="import-payload" class="editor-title" style="min-height: 100px; font-size: 14px; font-family: monospace;" placeholder="{`{...}`}"></textarea>
          {#if $sessionArchiveErrors.payload}<p class="error-text" aria-live="polite">{$sessionArchiveErrors.payload[0]}</p>{/if}
          {#if importError}<p class="error-text" aria-live="polite">{importError}</p>{/if}
          <div class="modal-actions" style="margin-top: 12px;">
            <button type="button" class="btn-secondary" onclick={() => showSessionArchive = false}>Close</button>
            <button type="submit" class="btn-primary">Import</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
{/snippet}

{#snippet decommissionedView()}
  <div class="view-root">
    <div class="view-header">
      <h2 class="view-title">Decommissioned</h2>
      <button class="btn-secondary" onclick={handleShowAll}>Return to list</button>
    </div>
    {#if allDec.length === 0}
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true"><Archive size="24" aria-label="Decommissioned" /></div>
        <p class="empty-title">Nothing is decommissioned</p>
        <p class="empty-sub">Transmissions you decommission appear here for review.</p>
      </div>
    {:else}
      <div class="memo-cards">
        {#each allDec as memo (memo.id)}
          <div class="memo-card" transition:fade={{ duration: 150 }} animate:flip={{ duration: 150 }}>
            {@render memoCardBadge(memo)}
            <div class="card-title-row">
              <h3 class="card-title">{memo.title}</h3>
              {#if memo.locked}<span class="lock-chip">Locked</span>{/if}
              <span class="ch-tag">{channelName(memo.channelId)}</span>
            </div>
            <p class="card-preview">
              {#if isHidden(memo)}{@render redactionStatus(true)}{:else}{bodyPreview(memo)}{/if}
            </p>
            <div class="card-footer">
              <p class="card-time">Decommissioned {formatTimestamp(memo.decommissionedAt)}</p>
              <div class="card-actions">
                <button class="btn-secondary card-action" onclick={() => handleRestore(memo.id)}>Restore</button>
                <button class="btn-danger card-action" onclick={() => openPurge(memo.id)}>Purge</button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet memoEditor()}
  <div class="view-root">
    <form use:transmissionForm class="editor-form" onsubmit={(e) => e.preventDefault()}>
    <div class="editor-top">
      <button type="button" class="btn-secondary" onclick={handleBackToList}>Return to list</button>
      {#if draftOpen}
        <button type="button" class="btn-secondary" onclick={discardDraft}>Discard draft</button>
      {/if}
    </div>
    <div class="field">
      <label class="field-label" for="memo-title-input">Title</label>
      <input name="title" id="memo-title-input" type="text" bind:value={memoTitle} class="editor-title"
             placeholder="Transmission title" oninput={handleTitleInput}
             onkeydown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
      {#if $transErrors.title}<p class="error-text shake" role="alert" aria-live="polite">{$transErrors.title[0]}</p>{/if}
      {#if titleError}<p class="error-text shake" role="alert" aria-live="polite">{titleError}</p>{/if}
    </div>
    <div class="editor-controls">
      <div class="ctrl-group">
        <label class="field-label" for="channel-select">Channel</label>
        <select name="channelId" id="channel-select" class="ctrl-select" value={curChannelId}
                onchange={(e) => handleChannelChange(e.target.value)}>
          {#each allChannels as ch (ch.id)}
            <option value={ch.id}>{ch.name}</option>
          {/each}
        </select>
      </div>
      <div class="ctrl-group">
        <label class="field-label" for="priority-select">Priority</label>
        <select name="priority" id="priority-select" class="ctrl-select" value={curPriority}
                onchange={(e) => handlePriorityChange(e.target.value)}>
          <option value="high">High</option>
          <option value="standard">Standard</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="ctrl-group">
        <span class="field-label" id="lock-label">Lock</span>
        <div class="lock-btns">
          <button class="btn-secondary" onclick={handleLockToggle}>{curLocked ? 'Unlock' : 'Lock'}</button>
          {#if curHidden}
            <button class="btn-secondary" onclick={openReveal}>Reveal</button>
          {/if}
        </div>
      </div>
    </div>
    <div class="field">
      <div class="field-label" id="body-label">Body</div>
      {#if curHidden}
        <div class="body-locked" role="status" aria-live="polite">
          {@render redactionStatus(false)}
          <p class="locked-hint">Select Reveal and enter the passcode to view this body for this session.</p>
        </div>
      {:else}
        <div class="body-editor" contenteditable="plaintext-only" role="textbox" aria-multiline="true"
             aria-labelledby="body-label" data-placeholder="Type the transmission body"
             bind:this={bodyEl} oninput={handleBodyInput}></div>
        <input type="hidden" name="body" value={memoBody} />
        <p class="body-hint">Select text in the body to reveal the Mark Classified and Mark Priority controls.</p>
      {/if}
    </div>
    <div class="editor-hud">
      <div class="hud-group">
        <span class="hud-stat">{words} {words === 1 ? 'word' : 'words'}</span>
        <span class="hud-stat">{chars} {chars === 1 ? 'character' : 'characters'}</span>
      </div>
      <div class="hud-group">
        {#if activeMemo}
          <span class="hud-stat">First transmitted {formatTimestamp(activeMemo.created)}</span>
          <span class="hud-stat">Last modified {formatTimestamp(activeMemo.lastModified)}</span>
        {:else}
          <span class="hud-stat">Draft &mdash; add a title to log it</span>
        {/if}
      </div>
    </div>
    {#if activeMemo}
      <div class="editor-actions">
        <button type="button" class="btn-secondary" onclick={() => handleExport(activeMemo, 'txt')}>Export as .txt</button>
        <button type="button" class="btn-secondary" onclick={() => handleExport(activeMemo, 'md')}>Export as .md</button>
        <button type="button" class="btn-secondary" onclick={() => handleDecommission(activeMemo.id)}>Decommission</button>
      </div>
    {/if}
    </form>
  </div>
{/snippet}

<style>
  .app-root { min-height: 100vh; background: var(--color-background); }
  .app-header { background: var(--color-secondary); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 16px; }
  .header-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .header-left { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; min-width: 0; }
  .header-right { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; min-width: 0; }
  .app-title { color: #FFFFFF; font-size: 34px; font-weight: 700; letter-spacing: 1px; margin: 0; }
  .mobile-menu-btn { display: none; }
  .theme-ctrl { display: flex; align-items: center; gap: 8px; }
  .theme-label { font-size: 13px; font-weight: 600; color: #E6EEF7; }
  .theme-select { min-height: 48px; padding: 8px 12px; border: 1px solid var(--color-border-strong); border-radius: 6px; font-size: 15px; font-family: inherit; background: #FFFFFF; color: var(--color-text-primary); cursor: pointer; }

  .main-layout { display: flex; max-width: 1200px; margin: 0 auto; min-height: calc(100vh - 80px); }
  .desktop-sidebar { width: 256px; flex-shrink: 0; background: var(--color-background); border-right: 1px solid rgba(0, 0, 0, 0.1); }
  .main-content { flex: 1; min-width: 0; padding: 16px; }

  @media (max-width: 768px) {
    .mobile-menu-btn { display: inline-flex; align-items: center; }
    .desktop-sidebar { display: none; }
    .app-title { font-size: 34px; }
  }
  @media (max-width: 480px) {
    .app-header { padding: 12px; }
    .header-inner,
    .header-right { width: 100%; }
    .header-right { align-items: stretch; }
    .theme-ctrl { width: 100%; min-width: 0; }
    .theme-select { flex: 1; min-width: 0; }
    .header-right > .btn-primary { width: 100%; }
    .main-content { padding: 12px; }
  }
  .mobile-overlay { position: fixed; inset: 0; z-index: 40; background: rgba(0, 0, 0, 0.5); }
  .mobile-sidebar { height: 100%; width: min(300px, 88vw); background: var(--color-background); overflow-y: auto; }

  .channel-list-root { padding: 16px; display: flex; flex-direction: column; height: 100%; }
  .channel-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
  .channel-title { font-size: 17px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .new-ch-btn { font-size: 13px; color: var(--color-accent-ink); font-weight: 700; background: none; border: none; cursor: pointer; padding: 8px; min-height: 40px; font-family: inherit; border-radius: 6px; }
  .new-ch-btn:hover { background: rgba(0, 0, 0, 0.06); }
  .new-ch-form { background: #FFFFFF; border: 1px solid var(--color-border-strong); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
  .new-ch-input { width: 100%; padding: 10px 12px; min-height: 44px; border: 1px solid var(--color-border-strong); border-radius: 6px; font-size: 15px; outline: none; margin-bottom: 8px; font-family: inherit; }
  .new-ch-input:focus { border-color: var(--color-accent-ink); }
  .new-ch-actions { display: flex; gap: 8px; }
  .btn-compact { padding: 8px 16px; min-height: 40px; font-size: 13px; }

  .show-all-btn { width: 100%; text-align: left; padding: 12px; min-height: 48px; border-radius: 6px; font-size: 15px; margin-bottom: 4px; border: none; cursor: pointer; font-family: inherit; background: transparent; color: var(--color-text-primary); }
  .show-all-btn:hover { background: rgba(0, 0, 0, 0.05); }
  .show-all-btn.active { font-weight: 700; background: rgba(0, 0, 0, 0.06); color: var(--color-accent-ink); }

  .channel-items { flex: 1; overflow-y: auto; }
  .channel-row { display: flex; align-items: center; gap: 4px; border-radius: 6px; padding: 0 4px; margin-bottom: 2px; }
  .channel-row:hover { background: rgba(0, 0, 0, 0.05); }
  .channel-row.dragging { opacity: 0.4; }
  .drag-handle { opacity: 0.5; font-size: 12px; cursor: grab; padding: 0 2px; }
  .channel-btn { flex: 1; min-width: 0; text-align: left; min-height: 48px; padding: 8px; font-size: 15px; background: none; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .channel-btn.active { font-weight: 700; color: var(--color-accent-ink); background: rgba(0, 0, 0, 0.06); }
  .ch-icon-btn { width: 36px; height: 36px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: #3C3C43; background: #FFFFFF; border: 1px solid var(--color-border-strong); border-radius: 6px; cursor: pointer; padding: 0; }
  .ch-icon-btn:hover { background: rgba(0, 0, 0, 0.08); }
  .ch-icon-btn:disabled { opacity: 0.4; cursor: default; }
  .drop-indicator { border-top: 3px solid var(--color-accent-ink); margin: 2px 0; }
  .empty-msg { padding: 24px 8px; font-size: 15px; color: #3C3C43; }
  .decomm-link { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0, 0, 0, 0.1); }
  .decomm-btn { width: 100%; text-align: left; padding: 12px; min-height: 48px; border-radius: 6px; font-size: 15px; color: var(--color-text-primary); background: none; border: none; cursor: pointer; font-family: inherit; }
  .decomm-btn:hover { background: rgba(0, 0, 0, 0.05); }
  .decomm-btn.active { font-weight: 700; background: rgba(0, 0, 0, 0.06); color: var(--color-accent-ink); }

  .view-root { max-width: 720px; margin: 0 auto; width: 100%; }
  .view-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
  .view-title { font-size: 17px; font-weight: 700; margin: 0; }
  .field { margin-bottom: 16px; }
  .field-label { display: block; font-size: 13px; font-weight: 600; color: #3C3C43; margin-bottom: 4px; }
  .search-input { width: 100%; padding: 12px 16px; min-height: 48px; border: 1px solid var(--color-border-strong); border-radius: 6px; font-size: 17px; background: #FFFFFF; outline: none; font-family: inherit; }
  .search-input:focus { border-color: var(--color-accent-ink); }
  .filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; }
  .filter-label { font-size: 13px; color: #3C3C43; font-weight: 600; }
  .filter-tag { font-size: 13px; padding: 4px 12px; border-radius: 10px; background: var(--color-accent-soft); color: var(--color-accent-ink); font-weight: 700; }

  .empty-state { text-align: center; padding: 56px 16px; color: #3C3C43; }
  .empty-icon { font-size: 44px; margin-bottom: 12px; }
  .empty-title { font-size: 17px; font-weight: 600; margin: 0 0 4px 0; }
  .empty-sub { font-size: 15px; margin: 0; }

  .memo-cards { display: flex; flex-direction: column; gap: 12px; }
  .memo-card { position: relative; background: #FFFFFF; border: 1px solid var(--color-border-strong); border-radius: 6px; padding: 16px; }
  .interactive-card { cursor: pointer; transition: box-shadow 0.15s ease; }
  .interactive-card:hover { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14); }
  .corner-badge { position: absolute; top: 0; right: 0; font-size: 12px; font-weight: 700; padding: 4px 12px; border-top-right-radius: 5px; border-bottom-left-radius: 6px; }
  .badge-high { background: var(--color-accent-ink); color: #FFFFFF; }
  .badge-standard { background: var(--color-accent-soft); color: var(--color-accent-ink); border-left: 1px solid var(--color-accent-ink); border-bottom: 1px solid var(--color-accent-ink); }
  .badge-low { background: #FFFFFF; color: var(--color-accent-ink); border-left: 1px dashed var(--color-accent-ink); border-bottom: 1px dashed var(--color-accent-ink); }
  .card-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 4px; padding-right: 88px; }
  .card-title { font-size: 17px; font-weight: 700; margin: 0; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
  .lock-chip { font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 10px; background: #1D1D1E; color: #F5F5F7; }
  .ch-tag { font-size: 12px; padding: 2px 10px; border-radius: 10px; background: rgba(0, 0, 0, 0.06); color: #3C3C43; }
  .card-preview { font-size: 17px; margin: 0 0 8px 0; color: #3C3C43; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .redaction-status { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 6px; max-width: 100%; white-space: normal; }
  .redaction-status.compact { gap: 2px; }
  .local-only-note { color: #3C3C43; font-family: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0; line-height: 1.35; }
  .card-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
  .card-time { font-size: 13px; color: #55555C; margin: 0; }
  .card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .card-action { padding: 10px 18px; min-height: 48px; font-size: 13px; }

  .editor-top { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .editor-title { width: 100%; font-size: 22px; font-weight: 600; padding: 10px 14px; min-height: 48px; border: 1px solid var(--color-border-strong); border-radius: 6px; outline: none; background: #FFFFFF; font-family: inherit; color: var(--color-text-primary); }
  .editor-title:focus { border-color: var(--color-accent-ink); }
  .editor-title::placeholder { color: #6E6E73; }
  .error-text { font-size: 14px; color: #C4001D; margin: 6px 0 0 0; }
  .editor-controls { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid rgba(0, 0, 0, 0.1); }
  .ctrl-group { display: flex; flex-direction: column; }
  .lock-btns { display: flex; flex-wrap: wrap; gap: 8px; }
  .ctrl-select { min-height: 48px; padding: 8px 12px; border: 1px solid var(--color-border-strong); border-radius: 6px; font-size: 15px; background: #FFFFFF; cursor: pointer; outline: none; font-family: inherit; color: var(--color-text-primary); }
  .ctrl-select:focus { border-color: var(--color-accent-ink); }

  .body-editor { width: 100%; max-width: 64ch; min-height: 280px; padding: 16px; border: 1px solid var(--color-border-strong); border-radius: 6px; font-family: monospace; font-size: 17px; line-height: 1.5; background: #FFFFFF; color: var(--color-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; outline: none; }
  .body-editor:focus { border-color: var(--color-accent-ink); }
  .body-editor:empty::before { content: attr(data-placeholder); color: #6E6E73; }
  .body-hint { font-size: 13px; color: #55555C; margin: 6px 0 0 0; }
  .body-locked { padding: 24px 16px; border: 1px solid var(--color-border-strong); border-radius: 6px; background: #FFFFFF; }
  .locked-hint { font-size: 14px; color: #3C3C43; margin: 12px 0 0 0; }

  .editor-hud { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 16px; margin-top: 16px; padding: 12px 16px; background: var(--color-secondary); border-radius: 6px; }
  .hud-group { display: flex; flex-wrap: wrap; gap: 8px 16px; }
  .hud-stat { font-family: monospace; font-size: 13px; color: #B9C6CE; letter-spacing: 0.5px; }
  .editor-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }

  .toast-container { position: fixed; bottom: 24px; right: 16px; z-index: 60; display: flex; flex-direction: column; gap: 8px; max-width: calc(100vw - 32px); }
  .toast-item { background: var(--color-secondary); color: #F5F5F7; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; min-width: 200px; max-width: 100%; animation: toastIn 0.3s ease forwards; }

  .modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.6); padding: 16px; }
  .modal-box { border-radius: 6px; padding: 24px; width: min(380px, 100%); background: #FFFFFF; border: 1px solid var(--color-border-strong); }
  .modal-title { font-size: 17px; font-weight: 700; margin: 0 0 8px 0; }
  .modal-desc { font-size: 15px; color: #3C3C43; margin: 0 0 16px 0; }
  .modal-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .modal-btn { flex: 1; }
  .passcode-input { width: 100%; padding: 10px 16px; min-height: 48px; border: 1px solid var(--color-border-strong); border-radius: 6px; font-family: monospace; font-size: 20px; text-align: center; letter-spacing: 8px; background: #FFFFFF; outline: none; }
  .passcode-input:focus { border-color: var(--color-accent-ink); }

  .sel-toolbar { position: fixed; z-index: 70; display: flex; gap: 4px; background: var(--color-secondary); border: 1px solid var(--color-border-strong); border-radius: 6px; padding: 4px; }
  .sel-btn { padding: 10px 14px; min-height: 44px; font-size: 13px; font-weight: 600; color: #FFFFFF; background: none; border: none; cursor: pointer; border-radius: 6px; font-family: inherit; }
  .sel-btn:hover { background: rgba(255, 255, 255, 0.15); }
</style>
