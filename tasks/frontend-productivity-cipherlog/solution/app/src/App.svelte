<script>
import { onMount, tick } from 'svelte';
import { createForm } from 'felte';
import { validator } from '@felte/validator-zod';
import { fly, fade, scale } from 'svelte/transition';
import { flip } from 'svelte/animate';
import {
  LockSimple, LockKey, Trash, Archive, FileText, MagnifyingGlass,
  Broadcast, FloppyDisk, PencilSimple, X, List, Keyboard, Microphone
} from 'phosphor-svelte';
import {
  channels, memos, decommissioned, themeCore, THEME_CORES, THEME_CORE_KEYS, themeCoreToCssClass,
  revealedIds, activeChannel, searchQuery, activeMemoId, showDecommissioned, sortDir, onboarded,
  toasts, showToast, dismissToast, filteredMemos, channelCounts, formatTimestamp,
  transmissionSchema, channelSchema, passcodeSchema, sessionArchiveSchema,
  VALID_PRIORITIES, BLANK_TITLE_MSG,
  commandCreateMemo, commandUpdateMemo, commandPatchMemo, commandDecommission, commandRestore,
  commandPurge, commandReorderChannels, commandCreateChannel, channelNameExists,
  buildSessionArchive, validateSessionArchive, applySessionArchive, memoToPayload
} from './stores.js';
import { get, fromStore } from 'svelte/store';

// ---------------------------------------------------------------------------
// Local component state
// ---------------------------------------------------------------------------
let newChannelName = $state('');
let showNewChannel = $state(false);
let channelError = $state('');

let memoTitle = $state('');
let bodyText = $state('');
let bodyError = $state('');
let editing = $state(false);          // body textarea shown (vs rendered marks view)
let titleError = $state('');

let showMobileSidebar = $state(false);
let showShortcuts = $state(false);

// Passcode dialog
let passcodeOpen = $state(false);
let passcodeMode = $state('set');      // 'set' | 'reveal' | 'unlock'
let passcodeInput = $state('');
let passcodeError = $state('');
let passcodeRef = $state(null);

// Purge dialog
let purgeOpen = $state(false);
let purgeTarget = $state(null);
let purgeRef = $state(null);

// Decommission confirmation (warning before destructive move + Undo toast after)
let decommOpen = $state(false);
let decommTarget = $state(null);
let decommRef = $state(null);

// Channel drag & drop
let dragIndex = $state(null);
let dropIndex = $state(null);

// Selection toolbar
let selToolbar = $state({ visible: false, x: 0, y: 0, start: 0, end: 0 });
let bodyViewEl = $state(null);

// Draft (new transmission) + a parked draft so interleaved flows don't corrupt state
let draftOpen = $state(false);
let draft = $state(null);
let parkedDraft = $state(null);

// Session archive panel + simulated-async progress
let archiveOpen = $state(false);
let archiveRef = $state(null);
let importText = $state('');
let importError = $state('');
let archiveBusy = $state(false);
let archiveSteps = $state([]);

// Onboarding tour
let showOnboard = $state(false);
let onboardStep = $state(0);

// Dialog focus-trap refs for the active dialog
let lastFocused = null;

// Reactive store bridges (Svelte 5 fromStore) so script + template stay in sync.
const channels$ = fromStore(channels);
const memos$ = fromStore(memos);
const decommissioned$ = fromStore(decommissioned);
const themeCore$ = fromStore(themeCore);
const revealedIds$ = fromStore(revealedIds);
const activeChannel$ = fromStore(activeChannel);
const searchQuery$ = fromStore(searchQuery);
const activeMemoId$ = fromStore(activeMemoId);
const showDecommissioned$ = fromStore(showDecommissioned);
const sortDir$ = fromStore(sortDir);
const onboarded$ = fromStore(onboarded);
const toasts$ = fromStore(toasts);
const filteredMemos$ = fromStore(filteredMemos);
const channelCounts$ = fromStore(channelCounts);

let activeMemo = $derived(memos$.current.find((m) => m.id === activeMemoId$.current) || null);
let editorOpen = $derived(draftOpen || !!activeMemo);
let curChannel = $derived(draftOpen ? draft?.channel : activeMemo?.channel);
let curPriority = $derived(draftOpen ? (draft?.priority || 'standard') : (activeMemo?.priority || 'standard'));
let curLocked = $derived(draftOpen ? !!draft?.locked : !!activeMemo?.locked);
let curHidden = $derived(draftOpen ? (!!draft?.locked && !draft?.revealed) : (!!activeMemo?.locked && !revealedIds$.current.has(activeMemo.id)));
let curMarks = $derived(draftOpen ? (draft?.marks || []) : (activeMemo?.marks || []));
let words = $derived(bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0);
let chars = $derived(bodyText.length);
let maxCount = $derived(channelCounts$.current ? Math.max(1, ...Object.values(channelCounts$.current)) : 1);
let prefersReduced = $state(
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
);

$effect(() => { document.documentElement.className = themeCoreToCssClass(themeCore$.current); });

// ---------------------------------------------------------------------------
// Felte forms (channel add, passcode, session import). validateOn change so the
// inline per-field error appears before the user presses submit.
// ---------------------------------------------------------------------------
const { form: channelForm, errors: channelErrors, reset: channelReset } = createForm({
  extend: validator({ schema: channelSchema, validateOn: { change: true, blur: true, submit: true } }),
  onSubmit: (values) => {
    const res = commandCreateChannel(values.name);
    if (res.error) { channelError = res.error; return; }
    activeChannel.set(res.channel.name);
    showNewChannel = false;
    newChannelName = '';
    channelError = '';
    channelReset();
    showToast('Channel created: ' + res.channel.name);
  }
});

const { form: passcodeForm, errors: passcodeErrors, reset: passcodeReset } = createForm({
  extend: validator({ schema: passcodeSchema, validateOn: { change: true, blur: true, submit: true } }),
  onSubmit: (values) => submitPasscode(values.passcode)
});

const { form: importForm, errors: importErrors } = createForm({
  extend: validator({ schema: sessionArchiveSchema, validateOn: { change: true, blur: true, submit: true } }),
  onSubmit: () => runImport()
});

// Live import validation: surface the contract error as the user pastes, before
// they press Import (forms_validate_inline_before_submit).
$effect(() => {
  const t = importText;
  if (!t || !t.trim()) { importError = ''; return; }
  let parsed;
  try { parsed = JSON.parse(t); } catch (e) { importError = 'Session JSON is not valid JSON. Fix the syntax (check brackets, quotes, and commas) and try again.'; return; }
  importError = validateSessionArchive(parsed) || '';
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function buildMarkedHTML(text, marks) {
  const t = text || '';
  const valid = (marks || []).filter((m) => m && m.start >= 0 && m.end <= t.length && m.end > m.start && (m.kind === 'classified' || m.kind === 'priority')).sort((a, b) => a.start - b.start);
  let out = ''; let pos = 0;
  for (const m of valid) {
    if (m.start < pos) continue;
    out += escHtml(t.slice(pos, m.start));
    out += '<span class="' + (m.kind === 'classified' ? 'mark-classified' : 'mark-priority') + '">' + escHtml(t.slice(m.start, m.end)) + '</span>';
    pos = m.end;
  }
  out += escHtml(t.slice(pos));
  return out;
}
function remapMarks(marks, newText) {
  const out = [];
  for (const m of marks || []) {
    if (m.end > newText.length) continue;
    if (m.text != null && newText.slice(m.start, m.end) !== m.text) {
      const idx = newText.indexOf(m.text);
      if (idx >= 0) out.push({ ...m, start: idx, end: idx + m.text.length });
      continue;
    }
    out.push(m);
  }
  return out;
}
function priorityLabel(p) { return p === 'high' ? 'High' : p === 'low' ? 'Low' : 'Standard'; }
function isHidden(m) { return m.locked && !revealedIds$.current.has(m.id); }
function bodyPreview(m) {
  if (isHidden(m)) return null;
  const b = (m.body || '').replace(/\s+/g, ' ').trim();
  if (!b) return 'No body text yet';
  return b.length > 140 ? b.slice(0, 140) + '…' : b;
}

// ---------------------------------------------------------------------------
// Focus trap for hand-rolled dialogs: captures the opener, traps Tab, handles
// Escape, and restores focus to the opener on close.
// ---------------------------------------------------------------------------
function trapFocus(el, onClose, autofocusSel) {
  if (!el) return () => {};
  const prev = document.activeElement;
  const focusables = () => Array.from(el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((n) => !n.disabled && n.offsetParent !== null);
  const af = (autofocusSel && el.querySelector(autofocusSel)) || focusables()[0];
  requestAnimationFrame(() => af && af.focus && af.focus());
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1];
    const active = document.activeElement;
    if (!el.contains(active)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }
  el.addEventListener('keydown', onKey, true);
  return () => { el.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); };
}
$effect(() => { if (passcodeOpen && passcodeRef) return trapFocus(passcodeRef, closePasscode, '#passcode-input'); });
$effect(() => { if (purgeOpen && purgeRef) return trapFocus(purgeRef, closePurge, '[data-autofocus]'); });
$effect(() => { if (decommOpen && decommRef) return trapFocus(decommRef, closeDecommConfirm, '[data-autofocus]'); });
$effect(() => { if (archiveOpen && archiveRef) return trapFocus(archiveRef, () => (archiveOpen = false), null); });

// ---------------------------------------------------------------------------
// Editor flows
// ---------------------------------------------------------------------------
function focusTitle() { requestAnimationFrame(() => { const i = document.getElementById('memo-title-input'); if (i) i.focus(); }); }

function openNewTransmission() {
  if (parkedDraft) { resumeDraft(parkedDraft); parkedDraft = null; return; }
  if (draftOpen) { focusTitle(); return; }
  let channel = activeChannel$.current;
  if (!channel && channels$.current.length) channel = channels$.current[0].name;
  if (!channel) {
    const res = commandCreateChannel('General');
    channel = res.channel ? res.channel.name : 'General';
  }
  draft = { channel, priority: 'standard', locked: false, passcode: null, revealed: false, marks: [] };
  draftOpen = true; editing = true;
  activeMemoId.set(null); showDecommissioned.set(false); showMobileSidebar = false;
  memoTitle = ''; bodyText = ''; bodyError = ''; titleError = '';
  focusTitle();
}
function resumeDraft(d) {
  draft = { ...d, marks: (d.marks || []).slice() };
  draftOpen = true; editing = true;
  activeMemoId.set(null); showDecommissioned.set(false);
  memoTitle = d.title || ''; bodyText = d.body || ''; bodyError = ''; titleError = '';
  focusTitle();
}
function parkCurrentDraft() {
  parkedDraft = { ...draft, title: memoTitle, body: bodyText, marks: (draft?.marks || []).slice() };
}
function saveTransmission() {
  const title = memoTitle.trim();
  if (!title) { titleError = BLANK_TITLE_MSG; shakeTitle(); focusTitle(); return; }
  if (title.length > 120) { titleError = 'Title is too long. Keep the Title to 120 characters or fewer.'; shakeTitle(); return; }
  if (bodyText.length > 20000) { bodyError = 'Body is too long. Keep the Body to 20000 characters or fewer.'; return; }
  bodyError = '';
  const d = draft;
  const res = commandCreateMemo({ title, channel: d.channel, priority: d.priority, body: bodyText, locked: d.locked, passcode: d.passcode, marks: d.marks });
  if (res.error) { titleError = res.error; shakeTitle(); return; }
  const m = res.memo;
  if (d.revealed) revealedIds.update((s) => new Set(s).add(m.id));
  draftOpen = false; draft = null; parkedDraft = null; editing = false;
  activeMemoId.set(m.id); bodyText = m.body;
  showToast('Transmission created: ' + m.title);
}
function saveEdits() {
  if (!activeMemo) return;
  const title = memoTitle.trim();
  if (!title) { titleError = BLANK_TITLE_MSG; shakeTitle(); focusTitle(); return; }
  if (title.length > 120) { titleError = 'Title is too long. Keep the Title to 120 characters or fewer.'; shakeTitle(); return; }
  if (bodyText.length > 20000) { bodyError = 'Body is too long. Keep the Body to 20000 characters or fewer.'; return; }
  bodyError = '';
  commandUpdateMemo(activeMemo.id, { title, channel: curChannel, priority: curPriority, body: bodyText, marks: activeMemo.marks });
  editing = false;
  showToast('Transmission saved: ' + title);
}
function beginEdit() { editing = true; bodyError = ''; requestAnimationFrame(() => { const t = document.getElementById('body-editor'); if (t) t.focus(); }); }
function cancelEdit() { editing = false; bodyError = ''; bodyText = activeMemo ? (activeMemo.body || '') : bodyText; }
function discardDraft() { draftOpen = false; draft = null; parkedDraft = null; editing = false; titleError = ''; memoTitle = ''; bodyText = ''; }

let titleShake = $state(false);
function shakeTitle() { titleShake = false; requestAnimationFrame(() => (titleShake = true)); }

function handleTitleInput() {
  titleError = '';
  // Live-apply a valid title to the existing record (preview updates without a save).
  if (!draftOpen && activeMemo) {
    const t = memoTitle.trim();
    if (t && t.length <= 120) commandPatchMemo(activeMemo.id, { title: t });
  }
}
function handleChannelChange(name) {
  if (draftOpen) { if (draft) draft.channel = name; }
  else if (activeMemo) commandPatchMemo(activeMemo.id, { channel: name });
}
function handlePriorityChange(p) {
  if (draftOpen) { if (draft) draft.priority = p; }
  else if (activeMemo) commandPatchMemo(activeMemo.id, { priority: p });
}

function openMemo(id) {
  const m = memos$.current.find((x) => x.id === id);
  if (!m) return;
  if (draftOpen) parkCurrentDraft();
  draftOpen = false; editing = false;
  activeMemoId.set(id); showDecommissioned.set(false);
  memoTitle = m.title; bodyText = m.body || ''; titleError = ''; bodyError = '';
  selToolbar = { ...selToolbar, visible: false };
}
function backToList() {
  if (draftOpen) { parkCurrentDraft(); draftOpen = false; draft = null; }
  activeMemoId.set(null); editing = false; selToolbar = { ...selToolbar, visible: false };
}

// ---------------------------------------------------------------------------
// Channel sidebar
// ---------------------------------------------------------------------------
function toggleChannel(name) {
  activeChannel.set(activeChannel$.current === name ? null : name);
  showDecommissioned.set(false); showMobileSidebar = false;
}
function handleShowAll() { activeChannel.set(null); showDecommissioned.set(false); showMobileSidebar = false; }
function openDecommissionedView() { showDecommissioned.set(true); showMobileSidebar = false; selToolbar = { ...selToolbar, visible: false }; }
function cancelNewChannel() { showNewChannel = false; newChannelName = ''; channelError = ''; channelReset(); }
function handleDeleteChannel(id) {
  const name = (channels$.current.find((c) => c.id === id) || {}).name;
  const rest = channels$.current.filter((c) => c.id !== id);
  const hasMemos = memos$.current.some((m) => m.channel === name) || decommissioned$.current.some((m) => m.channel === name);
  if (rest.length === 0 && hasMemos) { showToast('Add another channel before removing “' + name + '”.'); return; }
  if (rest.length > 0) {
    const fb = rest[0].name;
    memos.update((ms) => ms.map((m) => (m.channel === name ? { ...m, channel: fb } : m)));
    decommissioned.update((ds) => ds.map((m) => (m.channel === name ? { ...m, channel: fb } : m)));
  }
  channels.update((cs) => cs.filter((c) => c.id !== id));
  if (activeChannel$.current === name) activeChannel.set(null);
  showToast('Channel removed: ' + name);
}

function onDragStart(e, i) { dragIndex = i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (err) {} }
function onDragOver(e, i) { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) dropIndex = i; }
function onDrop(e, i) { e.preventDefault(); if (dragIndex === null || dragIndex === i) { dragIndex = null; dropIndex = null; return; } commandReorderChannels(dragIndex, i); dragIndex = null; dropIndex = null; }
function onDragEnd() { dragIndex = null; dropIndex = null; }

// ---------------------------------------------------------------------------
// Decommission / restore / purge (UI warns first; WebMCP confirm=true skips dialog)
// ---------------------------------------------------------------------------
function openDecommConfirm(id) { decommTarget = id; decommOpen = true; }
function closeDecommConfirm() { decommOpen = false; decommTarget = null; }
function applyDecommission(id) {
  const m = commandDecommission(id);
  if (!m) return null;
  if (activeMemoId$.current === id) { activeMemoId.set(null); editing = false; }
  showToast('Transmission decommissioned: ' + m.title, { label: 'Undo', run: () => { commandRestore(id); showToast('Transmission restored: ' + m.title); } });
  return m;
}
function confirmDecommission() {
  const id = decommTarget;
  decommOpen = false; decommTarget = null;
  if (id) applyDecommission(id);
}
function handleDecommission(id) { openDecommConfirm(id); }
function handleRestore(id) {
  const m = decommissioned$.current.find((x) => x.id === id);
  if (commandRestore(id) && m) showToast('Transmission restored: ' + m.title);
}
function openPurge(id) { lastFocused = document.activeElement; purgeTarget = id; purgeOpen = true; }
function closePurge() { purgeOpen = false; purgeTarget = null; }
function handlePurge() {
  if (!purgeTarget) return;
  const id = purgeTarget;
  const m = decommissioned$.current.find((x) => x.id === id);
  commandPurge(id);
  purgeOpen = false; purgeTarget = null;
  if (m) showToast('Transmission purged: ' + m.title);
}

// ---------------------------------------------------------------------------
// Lock / reveal
// ---------------------------------------------------------------------------
function handleLockToggle() {
  if (!curLocked) { passcodeMode = 'set'; }
  else if (curHidden) { passcodeMode = 'reveal'; }
  else { applyUnlock(); return; }
  passcodeInput = ''; passcodeError = ''; passcodeOpen = true; passcodeReset();
}
function openReveal() { passcodeMode = 'reveal'; passcodeInput = ''; passcodeError = ''; passcodeOpen = true; passcodeReset(); }
function closePasscode() { passcodeOpen = false; passcodeError = ''; }
function applyUnlock() {
  if (draftOpen) { draft.locked = false; draft.passcode = null; draft.revealed = false; }
  else if (activeMemo) { commandUpdateMemo(activeMemo.id, { locked: false, passcode: null }); revealedIds.update((s) => { const n = new Set(s); n.delete(activeMemo.id); return n; }); }
  showToast('Transmission unlocked');
}
function submitPasscode(code) {
  if (!/^[A-Za-z0-9]{4}$/.test(code || '')) { passcodeError = 'Passcode must be exactly four letters or digits. Enter a four-character passcode.'; return; }
  if (passcodeMode === 'set') {
    if (draftOpen) { draft.locked = true; draft.passcode = code; draft.revealed = false; }
    else if (activeMemo) { commandUpdateMemo(activeMemo.id, { locked: true, passcode: code }); revealedIds.update((s) => { const n = new Set(s); n.delete(activeMemo.id); return n; }); }
    passcodeOpen = false; showToast('Transmission locked');
    return;
  }
  const stored = draftOpen ? draft?.passcode : activeMemo?.passcode;
  if (code !== stored) { passcodeError = 'That passcode does not match. Check the four-character code and try again.'; return; }
  if (passcodeMode === 'unlock') { applyUnlock(); }
  else {
    if (draftOpen) draft.revealed = true;
    else if (activeMemo) revealedIds.update((s) => new Set(s).add(activeMemo.id));
    showToast('Transmission revealed for this session');
  }
  passcodeOpen = false;
}

// ---------------------------------------------------------------------------
// Text selection marking (real selection toolbar over the rendered body)
// ---------------------------------------------------------------------------
function onSelectionChange() {
  if (!bodyViewEl || editing) { if (selToolbar.visible) selToolbar = { ...selToolbar, visible: false }; return; }
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !bodyViewEl.contains(sel.anchorNode) || !bodyViewEl.contains(sel.focusNode)) {
    if (selToolbar.visible) selToolbar = { ...selToolbar, visible: false };
    return;
  }
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange(); pre.selectNodeContents(bodyViewEl); pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length; const end = start + range.toString().length;
  if (end <= start) { if (selToolbar.visible) selToolbar = { ...selToolbar, visible: false }; return; }
  const rect = range.getBoundingClientRect();
  selToolbar = { visible: true, x: Math.max(8, Math.min(rect.left, window.innerWidth - 300)), y: Math.max(8, rect.top - 52), start, end };
}
function markText(kind) {
  const { start, end } = selToolbar;
  if (end <= start) { selToolbar = { ...selToolbar, visible: false }; return; }
  const text = bodyText.slice(start, end);
  const merged = [...curMarks.filter((m) => !(m.start < end && m.end > start)), { start, end, kind, text }].sort((a, b) => a.start - b.start);
  if (draftOpen) { if (draft) draft.marks = merged; }
  else if (activeMemo) commandUpdateMemo(activeMemo.id, { marks: merged });
  const sel = window.getSelection(); if (sel) sel.removeAllRanges();
  selToolbar = { ...selToolbar, visible: false };
  showToast(kind === 'classified' ? 'Marked as classified' : 'Marked as priority');
}

// ---------------------------------------------------------------------------
// Per-memo export (real downloads; programmatic Blob, no native dialog in headless)
// ---------------------------------------------------------------------------
function download(filename, content, type) {
  const blob = new Blob([content], { type: type || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportMemo(memo, fmt) {
  const body = memo.body || '';
  const content = fmt === 'md' ? '# ' + memo.title + '\n\n' + body : memo.title + '\n\n' + body;
  const safe = (memo.title || 'transmission').replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 50) || 'transmission';
  download(safe + '.' + fmt, content);
  showToast('Exported ' + memo.title + ' as .' + fmt);
}

// ---------------------------------------------------------------------------
// Session archive: build, simulated-async progress, import, copy
// ---------------------------------------------------------------------------
function archiveCounts() { const p = buildSessionArchive(); return { channels: p.channels.length, memos: p.memos.length, decommissioned: p.decommissioned.length }; }
function archiveJSON() { return JSON.stringify(buildSessionArchive(), null, 2); }

function highlightJSON(str) {
  const esc = escHtml(str);
  return esc.replace(/("(\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\b(null)\b|\b(-?\d+(?:\.\d+)?)\b/g, (m, strLit, _inner, colon, bool, nul, num) => {
    if (strLit) return colon ? '<span class="tok-key">' + strLit + '</span><span class="tok-punct">' + colon + '</span>' : '<span class="tok-str">' + strLit + '</span>';
    if (bool) return '<span class="tok-bool">' + bool + '</span>';
    if (nul) return '<span class="tok-null">' + nul + '</span>';
    if (num) return '<span class="tok-num">' + num + '</span>';
    return m;
  }).replace(/([{}\[\],])/g, '<span class="tok-punct">$1</span>');
}

function runProgressSteps(steps, onDone) {
  archiveBusy = true;
  archiveSteps = steps.map((label, i) => ({ label, state: i === 0 ? 'active' : 'pending' }));
  let i = 0;
  const step = () => {
    if (i > 0) archiveSteps = archiveSteps.map((s, idx) => ({ ...s, state: idx < i ? 'done' : idx === i ? 'active' : 'pending' }));
    if (i >= steps.length) { archiveBusy = false; onDone && onDone(); return; }
    i++;
    setTimeout(step, 220);
  };
  setTimeout(step, 220);
}

function handleSessionExport(fmt) {
  if (fmt === 'session-json') {
    runProgressSteps(['Compiling channels, memos, and theme', 'Serializing archive JSON', 'Writing cipherlog-session.json'], () => {
      download('cipherlog-session.json', archiveJSON(), 'application/json');
      showToast('Session archive downloaded as cipherlog-session.json');
    });
  } else {
    const payload = buildSessionArchive();
    const content = fmt === 'md' ? payload.memos.map((m) => '# ' + m.title + '\n\n' + m.body).join('\n\n') : payload.memos.map((m) => m.title + '\n' + m.body).join('\n\n');
    download('cipherlog-session.' + fmt, content);
    showToast('Exported session as .' + fmt);
  }
}
function handleCopyJSON() {
  runProgressSteps(['Compiling archive JSON', 'Copying to clipboard'], () => {
    const text = archiveJSON();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(() => {});
    showToast('Copied session JSON to clipboard');
  });
}
function runImport() {
  const t = importText.trim();
  if (!t) { importError = 'Session JSON is empty. Paste a previously exported session archive.'; return; }
  let parsed;
  try { parsed = JSON.parse(t); } catch (e) { importError = 'Session JSON is not valid JSON. Fix the syntax and try again.'; return; }
  const err = validateSessionArchive(parsed);
  if (err) { importError = err; return; }
  runProgressSteps(['Validating field contracts', 'Replacing channels, memos, and theme'], () => {
    applySessionArchive(parsed);
    importText = ''; importError = '';
    showToast('Session archive imported successfully');
  });
}

// WebMCP-facing synchronous import/export/copy (state applied immediately so
// follow-up automation reads consistent state; the panel still opens).
function webmcpExportSession() { download('cipherlog-session.json', archiveJSON(), 'application/json'); archiveOpen = true; showToast('Session archive downloaded as cipherlog-session.json'); }
function webmcpCopySession() { const t = archiveJSON(); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(() => {}); archiveOpen = true; showToast('Copied session JSON to clipboard'); return t; }
function webmcpImportSession(text) {
  let parsed; try { parsed = JSON.parse(text); } catch (e) { return { ok: false, error: 'Invalid JSON' }; }
  const err = validateSessionArchive(parsed); if (err) return { ok: false, error: err };
  applySessionArchive(parsed); archiveOpen = true; showToast('Session archive imported successfully'); return { ok: true };
}

// ---------------------------------------------------------------------------
// Global keyboard shortcuts + swipe gesture (alternative input)
// ---------------------------------------------------------------------------
function isTypingTarget(el) { if (!el) return false; const tag = el.tagName; return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable; }
function handleWindowKey(e) {
  if (e.key === 'Escape') {
    if (selToolbar.visible) { selToolbar = { ...selToolbar, visible: false }; return; }
    if (showShortcuts) { showShortcuts = false; return; }
    if (decommOpen) { closeDecommConfirm(); return; }
    if (showMobileSidebar) { showMobileSidebar = false; return; }
    return;
  }
  if (passcodeOpen || purgeOpen || decommOpen) return;
  if (isTypingTarget(e.target)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openNewTransmission(); }
  else if (e.key === '/') { e.preventDefault(); const s = document.getElementById('search-input'); if (s) s.focus(); }
  else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); showDecommissioned$.current ? handleShowAll() : openDecommissionedView(); }
  else if (e.key === '?') { e.preventDefault(); showShortcuts = !showShortcuts; }
}
let touchStartX = 0, touchStartY = 0;
function onTouchStart(e) { if (!e.touches || !e.touches[0]) return; touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
function onTouchEnd(e) {
  if (!e.changedTouches || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - touchStartX; const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
  if (dx > 0 && touchStartX < 36 && !showDecommissioned$.current) { showMobileSidebar = true; }
  else if (dx < 0 && showMobileSidebar) { showMobileSidebar = false; }
}

// Voice search (Web Speech API) — alternative input path for the search field.
let voiceListening = $state(false);
function startVoiceSearch() {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) { showToast('Voice search is not available in this browser'); return; }
  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
  voiceListening = true;
  rec.onresult = (ev) => {
    const said = (ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) || '';
    if (said) { searchQuery.set(said.trim()); showToast('Voice search: ' + said.trim()); }
  };
  rec.onerror = () => { voiceListening = false; showToast('Voice search ended'); };
  rec.onend = () => { voiceListening = false; };
  try { rec.start(); } catch (e) { voiceListening = false; showToast('Voice search could not start'); }
}

// ---------------------------------------------------------------------------
// Onboarding tour
// ---------------------------------------------------------------------------
const ONBOARD_STEPS = [
  { eyebrow: 'Welcome to CipherLog', title: 'Log covert transmissions', body: 'CipherLog is a client-side transmission log. Press “Create New Transmission” (or hit N) to file your first entry. Everything stays on this device.' },
  { eyebrow: 'Step 2 of 4', title: 'Organize into channels', body: 'Add channels in the left rail and drag the ⠿ handle to reorder them. The bars show live transmission volume per channel. Filter by clicking a channel.' },
  { eyebrow: 'Step 3 of 4', title: 'Lock and mark sensitive text', body: 'Use Lock for a device-only 4-character concealment (not encryption). Select body text to Mark Classified (blur until hover) or Mark Priority.' },
  { eyebrow: 'Step 4 of 4', title: 'Theme, archive, and shortcuts', body: 'Switch the Theme Core to recolor the console. Export/Import the full session as schema-valid JSON. Press ? anytime for keyboard shortcuts.' }
];
function nextOnboard() { if (onboardStep < ONBOARD_STEPS.length - 1) onboardStep++; else finishOnboard(); }
function finishOnboard() { showOnboard = false; onboarded.set(true); }

// ---------------------------------------------------------------------------
// WebMCP action surface (contract zto-webmcp-v1). Every handler calls the same
// store command / component function as the visible control. Not graded; present
// for the delivery contract and self-test.
// ---------------------------------------------------------------------------
const WEBMCP_CONTRACT = 'zto-webmcp-v1';
const WEBMCP_THEMES = ['default', ...THEME_CORE_KEYS];
const UPDATE_FIELDS = ['title', 'body', 'priority', 'channel', 'locked'];

function resolveMemoRef(ref) {
  if (ref == null) return null;
  const key = String(ref);
  const list = memos$.current;
  return list.find((m) => m.id === key) || list.find((m) => (m.title || '').toLowerCase() === key.toLowerCase()) || null;
}
function resolveChannelName(ref) {
  if (ref == null) return null;
  const key = String(ref).toLowerCase();
  const ch = channels$.current.find((c) => (c.name || '').toLowerCase() === key);
  return ch ? ch.name : null;
}
function resolveThemeKey(ref) {
  if (ref == null) return null;
  const key = String(ref).toLowerCase();
  if (key === 'default') return '';
  if (THEME_CORE_KEYS.includes(key)) return key;
  const byName = THEME_CORES.find((t) => t.name.toLowerCase() === key);
  return byName ? byName.core : null;
}

const WEBMCP_TOOLS = [
  { name: 'entity_create_memo', module: 'entity-collection-v1', operation: 'create',
    description: 'Create a transmission with a title, optional channel name, and optional priority (high|standard|low).',
    inputSchema: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, channel: { type: 'string' }, priority: { type: 'string', enum: VALID_PRIORITIES } } },
    handler(a = {}) {
      const channel = a.channel != null ? resolveChannelName(a.channel) : (activeChannel$.current || (channels$.current[0] && channels$.current[0].name));
      if (a.channel != null && !channel) return { ok: false, error: 'No channel named "' + a.channel + '".' };
      const priority = a.priority != null ? String(a.priority) : 'standard';
      if (!VALID_PRIORITIES.includes(priority)) return { ok: false, error: 'priority must be one of ' + VALID_PRIORITIES.join(', ') };
      const res = commandCreateMemo({ title: a.title, channel, priority, body: a.body || '' });
      if (res.error) return { ok: false, error: res.error };
      showDecommissioned.set(false);
      showToast('Transmission created: ' + res.memo.title);
      return { ok: true, id: res.memo.id, title: res.memo.title };
    } },
  { name: 'entity_select_memo', module: 'entity-collection-v1', operation: 'select',
    description: 'Open a transmission by id or exact title in the editor.',
    inputSchema: { type: 'object', required: ['memo'], properties: { memo: { type: 'string' } } },
    handler(a = {}) { const m = resolveMemoRef(a.memo); if (!m) return { ok: false, error: 'No matching transmission.' }; openMemo(m.id); return { ok: true, id: m.id, title: m.title }; } },
  { name: 'entity_update_memo', module: 'entity-collection-v1', operation: 'update',
    description: 'Update one bounded field (title, body, priority, channel, or locked) of a transmission.',
    inputSchema: { type: 'object', required: ['memo', 'field', 'value'], properties: { memo: { type: 'string' }, field: { type: 'string', enum: UPDATE_FIELDS }, value: {} } },
    handler(a = {}) {
      const m = resolveMemoRef(a.memo); if (!m) return { ok: false, error: 'No matching transmission.' };
      const field = String(a.field || ''); if (!UPDATE_FIELDS.includes(field)) return { ok: false, error: 'field must be one of ' + UPDATE_FIELDS.join(', ') };
      let patch = {};
      if (field === 'priority') { if (!VALID_PRIORITIES.includes(String(a.value))) return { ok: false, error: 'priority must be one of ' + VALID_PRIORITIES.join(', ') }; patch = { priority: String(a.value) }; }
      else if (field === 'channel') { const name = resolveChannelName(a.value); if (!name) return { ok: false, error: 'No channel named "' + a.value + '".' }; patch = { channel: name }; }
      else if (field === 'title') { const v = String(a.value).trim(); if (!v) return { ok: false, error: BLANK_TITLE_MSG }; patch = { title: v }; }
      else if (field === 'locked') { patch = { locked: String(a.value) === 'true', passcode: String(a.value) === 'true' ? (m.passcode || null) : null }; }
      else patch = { body: String(a.value) };
      commandUpdateMemo(m.id, patch);
      if (activeMemoId$.current === m.id) { if (field === 'title') memoTitle = patch.title; if (field === 'body') bodyText = patch.body; }
      return { ok: true, id: m.id, field };
    } },
  { name: 'entity_delete_memo', module: 'entity-collection-v1', operation: 'delete',
    description: 'Decommission a transmission (requires confirm=true).',
    inputSchema: { type: 'object', required: ['memo', 'confirm'], properties: { memo: { type: 'string' }, confirm: { type: 'boolean' } } },
    handler(a = {}) { if (a.confirm !== true) return { ok: false, error: 'Deletion requires confirm=true.' }; const m = resolveMemoRef(a.memo); if (!m) return { ok: false, error: 'No matching transmission.' }; applyDecommission(m.id); return { ok: true, id: m.id }; } },
  { name: 'browse_open', module: 'browse-query-v1', operation: 'open',
    description: 'Open a declared destination: transmissions, decommissioned, or session-archive.',
    inputSchema: { type: 'object', required: ['destination'], properties: { destination: { type: 'string', enum: ['transmissions', 'decommissioned', 'session-archive'] } } },
    handler(a = {}) { const d = String(a.destination || ''); if (d === 'transmissions') { handleShowAll(); return { ok: true, destination: d }; } if (d === 'decommissioned') { openDecommissionedView(); return { ok: true, destination: d }; } if (d === 'session-archive') { importError = ''; archiveOpen = true; return { ok: true, destination: d }; } return { ok: false, error: 'destination must be transmissions, decommissioned, or session-archive.' }; } },
  { name: 'browse_search', module: 'browse-query-v1', operation: 'search',
    description: 'Set the memo-list search query.',
    inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string' } } },
    handler(a = {}) { const q = String(a.query == null ? '' : a.query); searchQuery.set(q); return { ok: true, query: q }; } },
  { name: 'browse_apply_filter', module: 'browse-query-v1', operation: 'apply_filter',
    description: 'Apply the channel filter by channel name.',
    inputSchema: { type: 'object', required: ['filter', 'value'], properties: { filter: { type: 'string', enum: ['channel'] }, value: { type: 'string' } } },
    handler(a = {}) { if (String(a.filter) !== 'channel') return { ok: false, error: 'filter must be "channel".' }; const name = resolveChannelName(a.value); if (!name) return { ok: false, error: 'No channel named "' + a.value + '".' }; activeChannel.set(name); showDecommissioned.set(false); return { ok: true, filter: 'channel', value: name }; } },
  { name: 'browse_clear_filter', module: 'browse-query-v1', operation: 'clear_filter',
    description: 'Clear the active channel filter.',
    inputSchema: { type: 'object', properties: {} },
    handler() { handleShowAll(); return { ok: true }; } },
  { name: 'browse_set_theme', module: 'browse-query-v1', operation: 'set_theme',
    description: 'Switch the Theme Core. theme is one of ' + WEBMCP_THEMES.join(', ') + '.',
    inputSchema: { type: 'object', required: ['theme'], properties: { theme: { type: 'string', enum: WEBMCP_THEMES } } },
    handler(a = {}) { const k = resolveThemeKey(a.theme); if (k === null) return { ok: false, error: 'Unknown theme core.' }; themeCore.set(k); return { ok: true, theme: String(a.theme) }; } },
  { name: 'artifact_export_session', module: 'artifact-transfer-v1', operation: 'export',
    description: 'Export the session archive (session-json, txt, or md).',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['session-json', 'txt', 'md'] } } },
    handler(a = {}) { const fmt = a.format || 'session-json'; if (fmt === 'session-json') webmcpExportSession(); else handleSessionExport(fmt); return { ok: true, format: fmt }; } },
  { name: 'artifact_import_session', module: 'artifact-transfer-v1', operation: 'import',
    description: 'Import a session archive JSON string.',
    inputSchema: { type: 'object', required: ['payload'], properties: { payload: { type: 'string' }, mode: { type: 'string', enum: ['session-json'] } } },
    handler(a = {}) { return webmcpImportSession(String(a.payload || '')); } },
  { name: 'artifact_copy_session', module: 'artifact-transfer-v1', operation: 'copy',
    description: 'Copy the session archive JSON to the clipboard.',
    inputSchema: { type: 'object', properties: {} },
    handler() { webmcpCopySession(); return { ok: true }; } }
];

function webmcpSessionInfo() { return { contract_version: WEBMCP_CONTRACT, app: 'CipherLog', modules: ['entity-collection-v1', 'browse-query-v1', 'artifact-transfer-v1'], tool_count: WEBMCP_TOOLS.length, tools: WEBMCP_TOOLS.map((t) => t.name) }; }
function webmcpListTools() { return WEBMCP_TOOLS.map((t) => ({ name: t.name, module: t.module, operation: t.operation, description: t.description, inputSchema: t.inputSchema })); }
function webmcpInvokeTool(name, args) { const tool = WEBMCP_TOOLS.find((t) => t.name === name); if (!tool) return { ok: false, error: 'Unknown tool: ' + name }; try { return tool.handler(args || {}); } catch (e) { return { ok: false, error: String((e && e.message) || e) }; } }

onMount(() => {
  // WebMCP globals (contract surface).
  window.webmcp_session_info = webmcpSessionInfo;
  window.webmcp_list_tools = webmcpListTools;
  window.webmcp_invoke_tool = webmcpInvokeTool;

  prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hydrate editor fields when an active memo was restored from localStorage.
  const restoredId = activeMemoId$.current;
  if (restoredId) {
    const m = memos$.current.find((x) => x.id === restoredId);
    if (m) { memoTitle = m.title; bodyText = m.body || ''; }
    else activeMemoId.set(null);
  }

  document.addEventListener('selectionchange', onSelectionChange);

  // Ambient parallax (skipped under reduced motion).
  let ticking = false;
  const ambient = document.querySelector('.ambient');
  function onScroll() {
    if (prefersReduced || !ambient) return;
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ambient.style.transform = 'translateY(' + Math.round(window.scrollY * 0.22) + 'px)'; ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if (!onboarded$.current) showOnboard = true;

  return () => { document.removeEventListener('selectionchange', onSelectionChange); window.removeEventListener('scroll', onScroll); };
});
</script>

<svelte:window onkeydown={handleWindowKey} />

<div class="app-root" ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
  <div class="ambient" aria-hidden="true"><div class="ambient-sweep"></div></div>

  <a class="skip-link" href="#main">Skip to transmissions</a>

  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <button class="btn-secondary btn-compact mobile-menu-btn" aria-expanded={showMobileSidebar} aria-controls="mobile-sidebar" onclick={() => (showMobileSidebar = !showMobileSidebar)}><List size="18" weight="bold" aria-hidden="true" /> Channels</button>
        <h1 class="app-title"><span class="blink" aria-hidden="true"></span>CipherLog</h1>
      </div>
      <div class="header-right">
        <div class="theme-ctrl">
          <label class="theme-label" for="theme-select">Theme Core</label>
          <select id="theme-select" class="theme-select" value={$themeCore} onchange={(e) => themeCore.set(e.target.value)} aria-label="Theme Core">
            <option value="">Default</option>
            {#each THEME_CORES as tc (tc.core)}<option value={tc.core}>{tc.name}</option>{/each}
          </select>
        </div>
        <button class="btn-secondary btn-compact" onclick={() => { importError = ''; archiveOpen = true; }} title="Export or import the full session archive (Export session / Import session)">Session Archive</button>
        <button class="icon-btn" onclick={() => (showShortcuts = !showShortcuts)} aria-label="Keyboard shortcuts" aria-expanded={showShortcuts} title="Keyboard shortcuts (?)"><Keyboard size="20" aria-hidden="true" /></button>
        <button class="btn-primary" onclick={openNewTransmission}>Create New Transmission</button>
      </div>
    </div>
  </header>

  {#if showMobileSidebar}
    <div class="mobile-overlay" transition:fade={{ duration: 160 }} onclick={() => (showMobileSidebar = false)}>
      <div id="mobile-sidebar" class="mobile-sidebar" transition:fly={{ x: -24, duration: 200 }} onclick={(e) => e.stopPropagation()}>
        {@render channelList('mobile')}
      </div>
    </div>
  {/if}

  <div class="main-layout">
    <aside class="desktop-sidebar">
      {@render channelList('desktop')}
    </aside>
    <main id="main" class="main-content">
      {#key $showDecommissioned ? 'dec' : editorOpen ? 'editor' : 'list'}
        <div transition:fade={{ duration: 160 }}>
          {#if $showDecommissioned}
            {@render decommissionedView()}
          {:else if editorOpen}
            {@render memoEditor()}
          {:else}
            {@render memoList()}
          {/if}
        </div>
      {/key}
    </main>
  </div>

  <!-- Toasts (role=status + per-toast aria-live; Undo action for decommission). -->
  <div class="toast-container" role="status" aria-live="polite" aria-atomic="false">
    {#each $toasts as toast (toast.id)}
      <div class="toast-item" class:warn={!!toast.action} transition:fly={{ x: 40, duration: 220 }} role="status" aria-live="polite">
        <span>{toast.message}</span>
        {#if toast.action}<button class="toast-undo" onclick={() => { toast.action.run(); dismissToast(toast.id); }}>{toast.action.label}</button>{/if}
      </div>
    {/each}
  </div>

  <!-- Passcode dialog -->
  {#if passcodeOpen}
    <div class="modal-overlay" transition:fade={{ duration: 160 }} onclick={closePasscode}>
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="passcode-title" aria-describedby="passcode-desc" transition:scale={{ start: 0.94, duration: 180 }} bind:this={passcodeRef} onclick={(e) => e.stopPropagation()}>
        <div class="modal-head">
          <h2 id="passcode-title" class="modal-title">{passcodeMode === 'set' ? 'Set local passcode' : passcodeMode === 'unlock' ? 'Remove local concealment' : 'Reveal transmission'}</h2>
          <button class="modal-close" onclick={closePasscode} aria-label="Close passcode dialog"><X size="16" aria-hidden="true" /></button>
        </div>
        <p id="passcode-desc" class="modal-desc">
          {#if passcodeMode === 'set'}Enter a four-character local passcode (letters or digits). This only conceals the body on this device; it is not encryption or account security.{:else if passcodeMode === 'unlock'}Enter the four-character local passcode to remove this device-only concealment permanently.{:else}Enter the four-character local passcode to reveal this transmission for this viewing session only.{/if}
        </p>
        <form use:passcodeForm onsubmit={(e) => e.preventDefault()}>
          <label class="field-label" for="passcode-input">Passcode (4 characters)</label>
          <input id="passcode-input" name="passcode" type="text" maxlength="4" autocomplete="off" inputmode="text" bind:value={passcodeInput} class="passcode-input" onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitPasscode(passcodeInput); } }} />
          {#if $passcodeErrors.passcode}<p class="error-text shake" role="alert">{$passcodeErrors.passcode[0]}</p>{/if}
          {#if passcodeError}<p class="error-text shake" role="alert">{passcodeError}</p>{/if}
          <div class="modal-actions">
            <button type="button" class="btn-secondary modal-btn" onclick={closePasscode}>Cancel</button>
            <button type="submit" class="btn-primary modal-btn">{passcodeMode === 'set' ? 'Lock' : passcodeMode === 'unlock' ? 'Unlock' : 'Reveal'}</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Purge confirmation dialog -->
  {#if purgeOpen}
    <div class="modal-overlay" transition:fade={{ duration: 160 }} onclick={closePurge}>
      <div class="modal-box" role="alertdialog" aria-modal="true" aria-labelledby="purge-title" aria-describedby="purge-desc" transition:scale={{ start: 0.94, duration: 180 }} bind:this={purgeRef} onclick={(e) => e.stopPropagation()}>
        <div class="modal-head">
          <h2 id="purge-title" class="modal-title">Purge transmission</h2>
          <button class="modal-close" onclick={closePurge} aria-label="Cancel purge"><X size="16" aria-hidden="true" /></button>
        </div>
        <p id="purge-desc" class="modal-desc">This action is irreversible. The transmission will be permanently deleted and cannot be restored.</p>
        <div class="modal-actions">
          <button type="button" class="btn-secondary modal-btn" data-autofocus="true" onclick={closePurge}>Cancel purge</button>
          <button type="button" class="btn-danger modal-btn" onclick={handlePurge}>Purge permanently</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Decommission confirmation warning -->
  {#if decommOpen}
    <div class="modal-overlay" transition:fade={{ duration: 160 }} onclick={closeDecommConfirm}>
      <div class="modal-box" role="alertdialog" aria-modal="true" aria-labelledby="decomm-title" aria-describedby="decomm-desc" transition:scale={{ start: 0.94, duration: 180 }} bind:this={decommRef} onclick={(e) => e.stopPropagation()}>
        <div class="modal-head">
          <h2 id="decomm-title" class="modal-title">Decommission transmission</h2>
          <button class="modal-close" onclick={closeDecommConfirm} aria-label="Cancel decommission"><X size="16" aria-hidden="true" /></button>
        </div>
        <p id="decomm-desc" class="modal-desc">This moves the transmission into cold storage (Decommissioned). You can Restore it later, or cancel now to leave it in the list.</p>
        <div class="modal-actions">
          <button type="button" class="btn-secondary modal-btn" data-autofocus="true" onclick={closeDecommConfirm}>Cancel</button>
          <button type="button" class="btn-primary modal-btn" onclick={confirmDecommission}>Decommission</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Selection toolbar -->
  {#if selToolbar.visible}
    <div class="sel-toolbar" role="toolbar" aria-label="Text marking" style="left:{selToolbar.x}px;top:{selToolbar.y}px;" transition:scale={{ start: 0.9, duration: 120 }}>
      <button class="sel-btn" onmousedown={(e) => e.preventDefault()} onclick={() => markText('classified')}>Mark Classified</button>
      <button class="sel-btn" onmousedown={(e) => e.preventDefault()} onclick={() => markText('priority')}>Mark Priority</button>
    </div>
  {/if}

  <!-- Session archive panel -->
  {#if archiveOpen}
    <div class="modal-overlay" transition:fade={{ duration: 160 }} onclick={() => (archiveOpen = false)}>
      <div class="modal-box wide" role="dialog" aria-modal="true" aria-labelledby="archive-title" transition:scale={{ start: 0.96, duration: 180 }} bind:this={archiveRef} onclick={(e) => e.stopPropagation()}>
        <div class="modal-head">
          <h2 id="archive-title" class="modal-title">Session Archive</h2>
          <button class="modal-close" onclick={() => (archiveOpen = false)} aria-label="Close session archive"><X size="16" aria-hidden="true" /></button>
        </div>
        <p class="modal-desc">Export or import the full session as schema-valid JSON. The preview reflects every create, edit, lock, priority, channel, decommission, restore, purge, theme, and reorder made this session.</p>

        <div class="archive-counts" aria-hidden="true">
          <span class="count-pill">{archiveCounts().channels} channels</span>
          <span class="count-pill">{archiveCounts().memos} memos</span>
          <span class="count-pill">{archiveCounts().decommissioned} decommissioned</span>
        </div>

        <div class="archive-grid">
          <div>
            <p class="field-label" id="export-label">Export session</p>
            <div class="archive-actions" role="group" aria-labelledby="export-label">
              <button class="btn-primary btn-compact" onclick={() => handleSessionExport('session-json')} disabled={archiveBusy}>{#if archiveBusy}<span class="spinner" aria-hidden="true"></span> {/if}Download JSON</button>
              <button class="btn-secondary btn-compact" onclick={handleCopyJSON} disabled={archiveBusy}>Copy JSON</button>
              <button class="btn-secondary btn-compact" onclick={() => handleSessionExport('txt')} disabled={archiveBusy}>Export as .txt</button>
              <button class="btn-secondary btn-compact" onclick={() => handleSessionExport('md')} disabled={archiveBusy}>Export as .md</button>
            </div>
            {#if archiveBusy}
              <ul class="progress-steps" aria-live="polite" aria-label="Export progress">
                {#each archiveSteps as s}<li class="progress-step {s.state}"><span class="dot" aria-hidden="true">{s.state === 'done' ? '✓' : ''}</span>{s.label}</li>{/each}
              </ul>
            {/if}
            <p class="field-label" style="margin-top:14px;">Live JSON preview</p>
            <pre class="json-preview" aria-label="Session archive JSON preview">{@html highlightJSON(archiveJSON())}</pre>
          </div>

          <form class="archive-import" use:importForm onsubmit={(e) => e.preventDefault()}>
            <label class="field-label" for="import-payload">Import session JSON</label>
            <textarea id="import-payload" name="payload" bind:value={importText} placeholder="Paste a previously exported session archive JSON object"></textarea>
            {#if $importErrors.payload}<p class="error-text" role="alert">{$importErrors.payload[0]}</p>{/if}
            {#if importError}<p class="error-text" role="alert">{importError}</p>{/if}
            <div class="modal-actions">
              <button type="submit" class="btn-primary" disabled={archiveBusy}>{#if archiveBusy}<span class="spinner" aria-hidden="true"></span> {/if}Import session</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}

  <!-- Shortcuts popover -->
  {#if showShortcuts}
    <div class="shortcuts-pop" role="dialog" aria-label="Keyboard shortcuts" transition:scale={{ start: 0.96, duration: 140 }}>
      <h2>Keyboard shortcuts</h2>
      <div class="kbd-row"><span>New transmission</span><span class="kbd">N</span></div>
      <div class="kbd-row"><span>Focus search</span><span class="kbd">/</span></div>
      <div class="kbd-row"><span>Toggle Decommissioned</span><span class="kbd">D</span></div>
      <div class="kbd-row"><span>This panel</span><span class="kbd">?</span></div>
      <div class="kbd-row"><span>Close / dismiss</span><span class="kbd">Esc</span></div>
      <p class="body-hint" style="margin-top:8px;">On touch devices, swipe right from the left edge to open Channels.</p>
    </div>
  {/if}

  <!-- Onboarding tour (non-blocking) -->
  {#if showOnboard}
    <div class="onboard" role="region" aria-label="Getting started with CipherLog" transition:fly={{ y: 24, duration: prefersReduced ? 0 : 240 }}>
      <p class="onboard-eyebrow">{ONBOARD_STEPS[onboardStep].eyebrow}</p>
      <p class="onboard-title">{ONBOARD_STEPS[onboardStep].title}</p>
      <p class="onboard-body">{ONBOARD_STEPS[onboardStep].body}</p>
      <div class="onboard-foot">
        <div class="onboard-dots" aria-hidden="true">{#each ONBOARD_STEPS as _, i}<span class="d" class:on={i === onboardStep}></span>{/each}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn-text" onclick={finishOnboard}>Skip tour</button>
          <button class="btn-primary btn-compact" onclick={nextOnboard}>{onboardStep === ONBOARD_STEPS.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  {/if}
</div>

{#snippet channelList(prefix)}
  <nav class="channel-list-root" aria-label="Channels and views">
    <div class="channel-header">
      <h2 class="channel-title">Channels</h2>
      <button class="btn-text" onclick={() => { showNewChannel = true; newChannelName = ''; channelError = ''; channelReset(); requestAnimationFrame(() => { const i = document.getElementById(prefix + '-new-channel-input'); if (i) i.focus(); }); }}>Add New Channel</button>
    </div>
    {#if showNewChannel}
      <form class="new-ch-form" use:channelForm onsubmit={(e) => e.preventDefault()} transition:fade={{ duration: 140 }}>
        <label class="field-label" for="{prefix}-new-channel-input">Channel name</label>
        <input id="{prefix}-new-channel-input" name="name" type="text" maxlength="40" bind:value={newChannelName} class="new-ch-input" placeholder="e.g. Ops" onkeydown={(e) => { if (e.key === 'Escape') { e.preventDefault(); cancelNewChannel(); } }} />
        {#if $channelErrors.name}<p class="error-text" role="alert">{$channelErrors.name[0]}</p>{/if}
        {#if channelError}<p class="error-text" role="alert">{channelError}</p>{/if}
        <div class="new-ch-actions">
          <button type="submit" class="btn-primary btn-compact">Create</button>
          <button type="button" class="btn-secondary btn-compact" onclick={cancelNewChannel}>Cancel</button>
        </div>
      </form>
    {/if}
    <button class="show-all-btn" class:active={!$activeChannel && !$showDecommissioned} onclick={handleShowAll} aria-pressed={!$activeChannel && !$showDecommissioned}>Show All Channels</button>
    <div class="channel-items" role="list">
      {#each $channels as ch, i (ch.id)}
        {#if dropIndex === i && dragIndex !== null}<div class="drop-indicator" role="presentation"></div>{/if}
        <div class="channel-row" role="listitem" class:dragging={dragIndex === i} draggable="true" ondragstart={(e) => onDragStart(e, i)} ondragover={(e) => onDragOver(e, i)} ondrop={(e) => onDrop(e, i)} ondragend={onDragEnd}>
          <div class="channel-row-top">
            <span class="drag-handle" aria-hidden="true" title="Drag to reorder">⠿</span>
            <button class="channel-btn" class:active={$activeChannel === ch.name} aria-current={$activeChannel === ch.name ? 'true' : undefined} onclick={() => toggleChannel(ch.name)} title="Filter to {ch.name}">{ch.name}</button>
            <button class="ch-icon-btn" aria-label="Move {ch.name} up" disabled={i === 0} onclick={() => commandReorderChannels(i, i - 1)} title="Move up">▲</button>
            <button class="ch-icon-btn" aria-label="Move {ch.name} down" disabled={i === $channels.length - 1} onclick={() => commandReorderChannels(i, i + 1)} title="Move down">▼</button>
            <button class="ch-icon-btn" aria-label="Remove {ch.name} channel" onclick={() => handleDeleteChannel(ch.id)} title="Remove channel"><Trash size="14" weight="bold" aria-hidden="true" /></button>
          </div>
          <div class="channel-viz" aria-hidden="true">
            <svg viewBox="0 0 100 6" preserveAspectRatio="none" height="6" aria-hidden="true"><rect x="0" y="0" width="100" height="6" rx="3" fill="rgba(0,0,0,0.06)"></rect><rect x="0" y="0" width={Math.round((($channelCounts[ch.name] || 0) / maxCount) * 100)} height="6" rx="3" fill="var(--color-accent)"></rect></svg>
            <span class="viz-count">{$channelCounts[ch.name] || 0}</span>
          </div>
        </div>
      {/each}
      {#if $channels.length === 0}
        <p class="empty-msg">No channels yet. Select <strong>Add New Channel</strong> to create your first channel and organize transmissions.</p>
      {/if}
    </div>
    <div class="decomm-link">
      <button class="decomm-btn" class:active={$showDecommissioned} aria-current={$showDecommissioned ? 'true' : undefined} onclick={openDecommissionedView}><Archive size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:6px;" />Decommissioned ({$decommissioned.length})</button>
    </div>
  </nav>
{/snippet}

{#snippet memoCardBadge(memo)}
  <span class="corner-badge badge-{memo.priority || 'standard'}">{priorityLabel(memo.priority)}</span>
{/snippet}

{#snippet redactionStatus(compact)}
  <span class="redaction-status" class:compact>
    <span class="redacted" role="img" aria-label="Body concealed on this device">[ENCRYPTED]</span>
    <span class="local-only-note">Local concealment only — not encryption or account security</span>
  </span>
{/snippet}

{#snippet memoList()}
  <div class="view-root">
    <div class="view-header">
      <h2 class="view-title">Transmissions <span class="view-count">{$filteredMemos.length} shown</span></h2>
    </div>
    <div class="list-toolbar">
      <div class="field grow">
        <label class="field-label" for="search-input">Search</label>
        <div class="search-row">
          <input id="search-input" type="search" value={$searchQuery} class="search-input" placeholder="Search by title or body" oninput={(e) => searchQuery.set(e.target.value)} onkeydown={(e) => { if (e.key === 'Escape') { searchQuery.set(''); e.currentTarget.value = ''; e.stopPropagation(); } }} />
          <button type="button" class="icon-btn search-voice" class:listening={voiceListening} onclick={startVoiceSearch} aria-label={voiceListening ? 'Listening for voice search' : 'Start voice search'} title="Voice search"><Microphone size="18" weight="bold" aria-hidden="true" /></button>
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="sort-select">Sort order</label>
        <select id="sort-select" class="sort-select" value={$sortDir} onchange={(e) => sortDir.set(e.target.value)} aria-label="Sort transmissions">
          <option value="desc">Newest modified first</option>
          <option value="asc">Oldest modified first</option>
        </select>
      </div>
    </div>
    {#if $activeChannel}
      <div class="filter-bar">
        <span class="filter-label">Filtering by channel:</span>
        <span class="filter-tag">{$activeChannel}</span>
        <button class="btn-secondary btn-compact" onclick={handleShowAll}>Show All Channels</button>
      </div>
    {/if}
    {#if $filteredMemos.length === 0}
      <div class="empty-state">
        {#if $memos.length > 0}
          <div class="empty-icon" aria-hidden="true"><MagnifyingGlass size="32" aria-hidden="true" /></div>
          <p class="empty-title">No matching transmissions</p>
          <p class="empty-sub">Nothing matches this channel filter and search together. Adjust the search text or select Show All Channels.</p>
        {:else}
          <div class="empty-icon" aria-hidden="true"><Broadcast size="32" aria-hidden="true" /></div>
          <p class="empty-title">No transmissions yet</p>
          <p class="empty-sub">Select <strong>Create New Transmission</strong> to log your first covert transmission.</p>
        {/if}
      </div>
    {:else}
      <div class="memo-cards">
        {#each $filteredMemos as memo (memo.id)}
          <div class="memo-card interactive-card" transition:fly={{ y: 14, duration: 220 }} animate:flip={{ duration: 200 }} role="button" tabindex="0" aria-label="Open transmission {memo.title || 'untitled'}" onclick={() => openMemo(memo.id)} onkeydown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMemo(memo.id); } }}>
            {@render memoCardBadge(memo)}
            <div class="card-title-row">
              <h3 class="card-title">{memo.title}</h3>
              {#if memo.locked}<span class="lock-chip"><LockSimple size="12" weight="bold" aria-hidden="true" style="vertical-align:-2px;margin-right:3px;" />Locked</span>{/if}
              <span class="ch-tag">{memo.channel}</span>
            </div>
            <p class="card-preview">{#if isHidden(memo)}{@render redactionStatus(true)}{:else}{bodyPreview(memo)}{/if}</p>
            <div class="card-footer">
              <p class="card-time">First transmitted {formatTimestamp(memo.firstTransmitted)} · Last modified {formatTimestamp(memo.lastModified)}</p>
              <button class="btn-secondary card-action" onclick={(e) => { e.stopPropagation(); handleDecommission(memo.id); }}>Decommission</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet decommissionedView()}
  <div class="view-root">
    <div class="view-header">
      <h2 class="view-title">Decommissioned <span class="view-count">{$decommissioned.length} held</span></h2>
      <button class="btn-secondary" onclick={handleShowAll}>Return to list</button>
    </div>
    {#if $decommissioned.length === 0}
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true"><Archive size="32" aria-hidden="true" /></div>
        <p class="empty-title">Nothing is decommissioned</p>
        <p class="empty-sub">Transmissions you decommission move here for review. Restore returns one to the list; Purge deletes it for good after confirmation.</p>
      </div>
    {:else}
      <div class="memo-cards">
        {#each $decommissioned as memo (memo.id)}
          <div class="memo-card" transition:fly={{ y: 14, duration: 220 }} animate:flip={{ duration: 200 }}>
            {@render memoCardBadge(memo)}
            <div class="card-title-row">
              <h3 class="card-title">{memo.title}</h3>
              {#if memo.locked}<span class="lock-chip">Locked</span>{/if}
              <span class="ch-tag">{memo.channel}</span>
            </div>
            <p class="card-preview">{#if isHidden(memo)}{@render redactionStatus(true)}{:else}{bodyPreview(memo)}{/if}</p>
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
    <div class="editor-top">
      <button type="button" class="btn-secondary" onclick={backToList}>Return to list</button>
      {#if draftOpen}<button type="button" class="btn-secondary" onclick={discardDraft}>Discard draft</button>{/if}
      {#if !draftOpen && activeMemo}
        {#if editing}<button type="button" class="btn-secondary" onclick={cancelEdit}>Cancel editing</button>
        {:else}<button type="button" class="btn-primary" onclick={beginEdit}><PencilSimple size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:5px;" />Edit body</button>{/if}
      {/if}
    </div>

    <h2 class="view-title" style="margin-bottom:14px;">{draftOpen ? 'Compose transmission' : 'Edit transmission'}</h2>

    <div class="field">
      <label class="field-label" for="memo-title-input">Title</label>
      <input id="memo-title-input" type="text" maxlength="160" bind:value={memoTitle} class="editor-title" class:shake={titleShake} placeholder="Transmission title" oninput={handleTitleInput} onanimationend={() => (titleShake = false)} onkeydown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
      {#if titleError}<p class="error-text shake" role="alert" aria-live="assertive">{titleError}</p>{/if}
    </div>

    <div class="editor-controls">
      <div class="ctrl-group">
        <label class="field-label" for="channel-select">Channel</label>
        <select id="channel-select" class="ctrl-select" value={curChannel} onchange={(e) => handleChannelChange(e.target.value)} aria-label="Channel">
          {#each $channels as ch (ch.id)}<option value={ch.name}>{ch.name}</option>{/each}
        </select>
      </div>
      <div class="ctrl-group">
        <label class="field-label" for="priority-select">Priority</label>
        <select id="priority-select" class="ctrl-select" value={curPriority} onchange={(e) => handlePriorityChange(e.target.value)} aria-label="Priority">
          <option value="high">High</option>
          <option value="standard">Standard</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="ctrl-group">
        <span class="field-label" id="lock-label">Cipher lock</span>
        <div class="lock-btns" role="group" aria-labelledby="lock-label">
          <button class="btn-secondary" onclick={handleLockToggle} aria-pressed={curLocked}>{#if curLocked}<LockKey size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:5px;" />Unlock{:else}<LockSimple size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:5px;" />Lock{/if}</button>
          {#if curHidden}<button class="btn-secondary" onclick={openReveal}>Reveal</button>{/if}
        </div>
      </div>
    </div>

    <div class="field">
      {#if curHidden}
        <p class="field-label" id="body-label-locked">Body</p>
        <div class="body-locked" role="status" aria-live="polite" aria-labelledby="body-label-locked">
          {@render redactionStatus(false)}
          <p class="locked-hint">Select <strong>Reveal</strong> and enter the four-character passcode to view this body for this session only.</p>
        </div>
      {:else if editing}
        <label class="field-label" for="body-editor">Body</label>
        <textarea id="body-editor" class="body-editor" bind:value={bodyText} placeholder="Type the transmission body. Select text after saving to mark it Classified or Priority." oninput={() => { if (bodyText.length <= 20000) bodyError = ''; }}></textarea>
        {#if bodyError}<p class="error-text" role="alert">{bodyError}</p>{/if}
        <p class="body-hint">Save to commit the body. In the rendered view, select text to reveal the Mark Classified and Mark Priority controls.</p>
      {:else}
        <p class="field-label" id="body-label-view">Body</p>
        <div class="body-view" bind:this={bodyViewEl} aria-labelledby="body-label-view">{@html buildMarkedHTML(bodyText, curMarks)}</div>
        <p class="body-hint">Select a range of text above to reveal the marking toolbar. Choose <strong>Edit body</strong> to change the text.</p>
      {/if}
    </div>

    <div class="editor-hud">
      <div class="hud-group">
        <span class="hud-stat">{words} {words === 1 ? 'word' : 'words'}</span>
        <span class="hud-stat">{chars} {chars === 1 ? 'character' : 'characters'}</span>
      </div>
      <div class="hud-group">
        {#if activeMemo}
          <span class="hud-stat">First transmitted {formatTimestamp(activeMemo.firstTransmitted)}</span>
          <span class="hud-stat">Last modified {formatTimestamp(activeMemo.lastModified)}</span>
        {:else}
          <span class="hud-stat">Draft — add a title and save to log it</span>
        {/if}
      </div>
    </div>

    <div class="editor-actions">
      {#if draftOpen}
        <button type="button" class="btn-primary" onclick={saveTransmission}><FloppyDisk size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:5px;" />Save transmission</button>
      {:else if activeMemo}
        {#if editing}
          <button type="button" class="btn-primary" onclick={saveEdits}><FloppyDisk size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:5px;" />Save changes</button>
        {/if}
        <button type="button" class="btn-secondary" onclick={() => exportMemo(activeMemo, 'txt')}><FileText size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:5px;" />Export as .txt</button>
        <button type="button" class="btn-secondary" onclick={() => exportMemo(activeMemo, 'md')}><FileText size="16" weight="bold" aria-hidden="true" style="vertical-align:-3px;margin-right:5px;" />Export as .md</button>
        <button type="button" class="btn-secondary" onclick={() => handleDecommission(activeMemo.id)}>Decommission</button>
      {/if}
    </div>
  </div>
{/snippet}
