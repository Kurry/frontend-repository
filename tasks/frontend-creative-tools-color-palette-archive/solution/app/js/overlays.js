// Every overlay surface: Export drawer (with import + catalog sheet + print),
// comparison dialog, confirm dialog, batch-tag dialog, subscribe popup,
// menu/cart drawers, and the first-browse coachmark. All are real dialogs —
// focus moves in, Tab stays trapped, Escape dismisses, focus returns.
import { state, ui, paletteById, importArchive, batchTag, notify } from './store.js';
import {
  escapeHtml, fmtHex, hexToHsl, hueDistance, validateArchive, renderMarkdown,
  announce, copyText, openOverlay, closeOverlay, prefersReducedMotion,
} from './lib.js';
import {
  EXPORT_TABS, buildExportText, buildCatalogHtml, downloadText, exportFilename,
} from './exporter.js';

const $ = (sel, root = document) => root.querySelector(sel);

function openPanel(el, onEscape) {
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-open'));
  const entry = { el, onEscape };
  openOverlay(entry);
  return entry;
}

function closePanel(el, entry, after) {
  el.classList.remove('is-open');
  const finish = () => {
    el.hidden = true;
    closeOverlay(entry);
    after?.();
  };
  if (prefersReducedMotion()) finish();
  else setTimeout(finish, 240);
}

// ================= Export drawer =============================================

let exportEntry = null;
let exportInvoker = null;

export function isExportOpen() { return exportEntry !== null; }

export function openExport(tab, invoker) {
  if (tab && EXPORT_TABS.some((t) => t.id === tab)) ui.exportTab = tab;
  exportInvoker = invoker || document.activeElement;
  const el = $('#export-drawer');
  exportEntry = openPanel(el, () => closeExport());
  renderExportDrawer();
  el.querySelector('#export-close')?.focus();
  announce('Export drawer opened.');
}

export function closeExport(silent = false) {
  if (!exportEntry) return;
  const entry = exportEntry;
  exportEntry = null;
  ui.exportOpen = false;
  if (exportInvoker && document.contains(exportInvoker)) exportInvoker.focus();
  closePanel($('#export-drawer'), entry, () => {
    exportInvoker = null;
  });
  if (!silent) announce('Export drawer closed.');
}

export function renderExportDrawer() {
  const el = $('#export-drawer');
  if (el.hidden) return;
  for (const tab of document.querySelectorAll('#export-tabs [data-tab]')) {
    const active = tab.dataset.tab === ui.exportTab;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  const isCatalog = ui.exportTab === 'catalog';
  $('#export-preview').hidden = isCatalog;
  $('#catalog-preview').hidden = !isCatalog;
  $('#export-actions').style.visibility = isCatalog ? 'hidden' : 'visible';
  $('#btn-print').hidden = !isCatalog;
  if (isCatalog) {
    $('#catalog-preview').innerHTML = buildCatalogHtml(state.palettes);
  } else {
    $('#export-preview').textContent = buildExportText(ui.exportTab, state.palettes);
  }
}

export function copyExport() {
  const text = buildExportText(ui.exportTab, state.palettes);
  copyText(text).then((ok) => {
    if (!ok) return;
    const btn = $('#btn-copy-export');
    btn.classList.add('is-copied');
    const label = btn.dataset.label;
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = label; btn.classList.remove('is-copied'); }, 1200);
    const tab = EXPORT_TABS.find((t) => t.id === ui.exportTab);
    announce(`Copied the ${tab.label} export to the clipboard.`);
  });
}

export function downloadExport() {
  const text = buildExportText(ui.exportTab, state.palettes);
  downloadText(exportFilename(ui.exportTab), text);
  announce(`Download started — ${exportFilename(ui.exportTab)}.`);
}

export function printCatalog() {
  $('#catalog-print').innerHTML = buildCatalogHtml(state.palettes);
  announce('Opening the browser print preview of the catalog sheet.');
  setTimeout(() => { try { window.print(); } catch { /* headless: no-op */ } }, 120);
}

// ---------- import ------------------------------------------------------------

export function runImport() {
  const feedback = $('#import-feedback');
  const textarea = $('#import-input');
  const text = textarea.value.trim();
  const fail = (msg) => {
    feedback.className = 'import-feedback is-error';
    feedback.hidden = false;
    feedback.textContent = `Import failed — ${msg}`;
    announce(`Import failed. ${msg}`);
  };
  if (!text) {
    fail('paste an archive JSON document into the import field first.');
    return;
  }
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (err) {
    fail(`the import field does not contain valid JSON (${err.message}).`);
    return;
  }
  const schemaErr = validateArchive(doc);
  if (schemaErr) {
    fail(schemaErr);
    return;
  }
  importArchive(doc);
  feedback.className = 'import-feedback is-success';
  feedback.hidden = false;
  feedback.textContent = `Imported ${doc.palettes.length} palette${doc.palettes.length === 1 ? '' : 's'} — the library now matches the archive document.`;
  textarea.value = '';
  announce(`Imported ${doc.palettes.length} palettes. The library matches the archive document.`);
  renderExportDrawer();
}

// ================= Comparison ==================================================

let compareEntry = null;
let compareInvoker = null;

export function openCompare(invoker) {
  if (state.multiSelect.length !== 2) return;
  compareInvoker = invoker || document.activeElement;
  ui.compareOpen = true;
  ui.compareA = ui.compareA && paletteById(ui.compareA) ? ui.compareA : state.multiSelect[0];
  ui.compareB = ui.compareB && paletteById(ui.compareB) ? ui.compareB : state.multiSelect[1];
  if (ui.compareA === ui.compareB) ui.compareB = state.multiSelect.find((id) => id !== ui.compareA) || ui.compareB;
  const el = $('#compare-dialog');
  compareEntry = openPanel(el, () => closeCompare());
  renderCompare();
  el.querySelector('#compare-close')?.focus();
  announce('Comparison opened.');
}

export function closeCompare(silent = false) {
  if (!compareEntry) return;
  const entry = compareEntry;
  compareEntry = null;
  ui.compareOpen = false;
  closePanel($('#compare-dialog'), entry, () => {
    if (compareInvoker && document.contains(compareInvoker)) compareInvoker.focus();
  });
  if (!silent) announce('Comparison closed.');
}

function compareOptions(current) {
  return state.palettes
    .map(
      (p) =>
        `<option value="${escapeHtml(p.id)}" ${p.id === current ? 'selected' : ''}>${escapeHtml(p.name)}${p.archived ? ' (archived)' : ''}</option>`
    )
    .join('');
}

export function renderCompare() {
  const el = $('#compare-dialog');
  if (el.hidden) return;
  const a = paletteById(ui.compareA);
  const b = paletteById(ui.compareB);
  $('#compare-select-a').innerHTML = compareOptions(ui.compareA);
  $('#compare-select-b').innerHTML = compareOptions(ui.compareB);
  const body = $('#compare-body');
  if (!a || !b) {
    body.innerHTML = '<p class="compare-empty">Both compared palettes must exist in the archive.</p>';
    return;
  }
  const rows = [];
  const len = Math.max(a.swatches.length, b.swatches.length);
  for (let i = 0; i < len; i++) {
    const ha = a.swatches[i] ? fmtHex(a.swatches[i]) : null;
    const hb = b.swatches[i] ? fmtHex(b.swatches[i]) : null;
    let delta;
    if (ha && hb) {
      const hslA = hexToHsl(ha), hslB = hexToHsl(hb);
      const dh = Math.round(hueDistance(Math.round(hslA.h), Math.round(hslB.h)));
      const dl = Math.round(Math.abs(hslA.l - hslB.l) * 100);
      delta = `<span class="compare-delta">ΔHue ${dh}°<br>ΔLightness ${dl}%</span>`;
    } else {
      delta = `<span class="compare-delta compare-delta--unmatched">No counterpart</span>`;
    }
    rows.push(`<div class="compare-row${ha && hb ? '' : ' is-unmatched'}">
      <span class="compare-chip${ha ? '' : ' is-missing'}" ${ha ? `style="background:${ha}"` : ''} aria-label="${ha || 'no swatch at this position in the left palette'}">${ha || '—'}</span>
      ${delta}
      <span class="compare-chip${hb ? '' : ' is-missing'}" ${hb ? `style="background:${hb}"` : ''} aria-label="${hb || 'no swatch at this position in the right palette'}">${hb || '—'}</span>
    </div>`);
  }
  body.innerHTML = `
    <div class="compare-grid">
      <div class="compare-col">
        <label class="sr-only" for="compare-select-a">Swap left palette</label>
        <p class="compare-name">${escapeHtml(a.name)}</p>
        <p class="compare-byline">${escapeHtml(a.artist)} · ${escapeHtml(a.period)}</p>
      </div>
      <div class="compare-col-mid" aria-hidden="true"><span>Δ</span></div>
      <div class="compare-col">
        <label class="sr-only" for="compare-select-b">Swap right palette</label>
        <p class="compare-name">${escapeHtml(b.name)}</p>
        <p class="compare-byline">${escapeHtml(b.artist)} · ${escapeHtml(b.period)}</p>
      </div>
    </div>
    ${rows.join('')}`;
}

// ================= Confirm dialog ==============================================

let confirmEntry = null;

export function confirmDialog({ title, body, confirmLabel, onConfirm }) {
  const el = $('#confirm-dialog');
  $('#confirm-title').textContent = title;
  $('#confirm-body').textContent = body;
  const confirmBtn = $('#confirm-ok');
  confirmBtn.textContent = confirmLabel;
  const cancelBtn = $('#confirm-cancel');
  const cleanup = () => {
    if (confirmEntry) { closeOverlay(confirmEntry); confirmEntry = null; }
    el.hidden = true;
    el.classList.remove('is-open');
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;
  };
  cancelBtn.onclick = () => { cleanup(); cancelBtn.focus?.(); };
  confirmBtn.onclick = () => { cleanup(); onConfirm?.(); };
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-open'));
  confirmEntry = { el, onEscape: () => cancelBtn.onclick() };
  openOverlay(confirmEntry);
  cancelBtn.focus();
}

// ================= Batch tag dialog ==============================================

let batchTagEntry = null;

export function openBatchTag(invoker) {
  const el = $('#batch-tag-dialog');
  $('#batch-tag-input').value = '';
  $('#batch-tag-error').hidden = true;
  $('#batch-tag-count').textContent = `${state.multiSelect.length} palettes selected`;
  const entry = openPanel(el, () => closeBatchTag());
  batchTagEntry = entry;
  el.querySelector('#batch-tag-input').focus();
  announce('Batch tag dialog opened.');
}

export function closeBatchTag() {
  if (!batchTagEntry) return;
  const entry = batchTagEntry;
  batchTagEntry = null;
  closePanel($('#batch-tag-dialog'), entry);
}

export function applyBatchTag() {
  const input = $('#batch-tag-input');
  const err = $('#batch-tag-error');
  const tag = input.value.trim().toLowerCase();
  if (!tag || tag.length > 24) {
    err.hidden = false;
    err.textContent = 'Tags: enter one tag of 1–24 characters.';
    input.focus();
    return;
  }
  const n = state.multiSelect.length;
  batchTag(state.multiSelect, tag);
  closeBatchTag();
  announce(`Tag "${tag}" applied to ${n} palettes.`);
}

// ================= Subscribe popup ================================================

let popupEntry = null;
let idleTimer = null;
const IDLE_MS = 45000;

export function initPopup() {
  const reset = () => {
    if (ui.popupDismissed || ui.popupOpen) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => showPopup(), IDLE_MS);
  };
  // Only genuine user scrolling (wheel / touch / keyboard) should trigger the
  // deep-scroll reveal — programmatic scrolls (focus-into-view, anchor jumps,
  // automation) must not pop the dialog over the user's work.
  let userScrollArmed = false;
  const arm = () => { userScrollArmed = true; };
  window.addEventListener('wheel', arm, { passive: true });
  window.addEventListener('touchmove', arm, { passive: true });
  window.addEventListener('pointermove', throttle(reset, 800), { passive: true });
  window.addEventListener('keydown', (e) => {
    reset();
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) arm();
  }, { passive: true });
  window.addEventListener('scroll', () => {
    if (!userScrollArmed) return;
    userScrollArmed = false;
    reset();
    if (ui.popupDismissed || ui.popupOpen) return;
    const doc = document.documentElement;
    const scrolled = window.scrollY + window.innerHeight;
    if (scrolled >= doc.scrollHeight * 0.5) showPopup();
  }, { passive: true });
  reset();
}

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

export function showPopup(force = false) {
  if (ui.popupOpen || (ui.popupDismissed && !force)) return;
  if (force) ui.popupDismissed = false;
  const el = $('#subscribe-popup');
  ui.popupOpen = true;
  if (el.hasAttribute('popover') && typeof el.showPopover === 'function' && !el.matches(':popover-open')) el.showPopover();
  else el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  popupEntry = { el, onEscape: () => dismissPopup() };
  openOverlay(popupEntry);
  el.querySelector('#popup-close')?.focus();
  announce('Subscribe popup opened — press Escape to dismiss it.');
}

export function dismissPopup(viaSubmit = false) {
  if (!ui.popupOpen) return;
  ui.popupOpen = false;
  ui.popupDismissed = true; // stays dismissed for the rest of the session
  const el = $('#subscribe-popup');
  el.classList.remove('is-visible');
  if (popupEntry) { closeOverlay(popupEntry); popupEntry = null; }
  setTimeout(() => {
    if (el.hasAttribute('popover') && typeof el.hidePopover === 'function' && el.matches(':popover-open')) el.hidePopover();
    else el.hidden = true;
  }, prefersReducedMotion() ? 0 : 380);
  announce(viaSubmit ? 'Subscribed — the popup is dismissed for this session.' : 'Popup dismissed for this session.');
}

export function submitPopup() {
  const input = $('#popup-email');
  const err = $('#popup-error');
  const success = $('#popup-success');
  const email = input.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) {
    err.hidden = false;
    err.textContent = 'Email: enter a valid address with an @ and a domain, like name@studio.com.';
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return; // popup stays open
  }
  err.hidden = true;
  input.removeAttribute('aria-invalid');
  $('#popup-form').hidden = true;
  success.hidden = false;
  announce('Subscribed — you are on the list.');
  setTimeout(() => dismissPopup(true), prefersReducedMotion() ? 0 : 1400);
}

// ================= Menu + cart drawers =============================================

let menuEntry = null;
let cartEntry = null;

export function openMenu() {
  const el = $('#menu-drawer');
  menuEntry = openPanel(el, () => closeMenu());
  el.querySelector('#menu-close')?.focus();
  announce('Menu opened.');
}
export function closeMenu() {
  if (!menuEntry) return;
  const entry = menuEntry;
  menuEntry = null;
  closePanel($('#menu-drawer'), entry);
}

export function openCart() {
  const el = $('#cart-drawer');
  cartEntry = openPanel(el, () => closeCart());
  el.querySelector('#cart-close')?.focus();
  announce('Cart opened — the cart is empty.');
}
export function closeCart() {
  if (!cartEntry) return;
  const entry = cartEntry;
  cartEntry = null;
  closePanel($('#cart-drawer'), entry);
}

// ================= Coachmark (first-browse hint) ====================================

let coachShown = false;
let coachTimer = null;

export function showCoachmark() {
  const el = $('#coachmark');
  el.hidden = false;
  el.classList.add('is-visible');
  coachShown = true;
}

export function initCoachmark() {
  coachTimer = setTimeout(() => { if (!coachShown) showCoachmark(); }, 1800);
}

export function dismissCoachmark() {
  const el = $('#coachmark');
  el.classList.remove('is-visible');
  setTimeout(() => { el.hidden = true; }, prefersReducedMotion() ? 0 : 250);
}
