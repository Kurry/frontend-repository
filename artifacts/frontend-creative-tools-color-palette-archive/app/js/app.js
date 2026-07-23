// App entry: wires the static chrome to the store, boots overlays, keyboard
// shortcuts, scroll reveals, and registers the WebMCP surface.
import {
  state, ui, subscribe, setViewState, toggleSelect, clearSelection,
  toggleFavorite, batchArchive, restorePalettes, undo, redo, canUndo, canRedo,
  paletteById,
} from './store.js';
import { renderAll, renderCanvas, copySwatch, spotlightRow, bindUndoState } from './render.js';
import { openEditor, closeEditor, isEditorOpen, initEditorDrag } from './editor.js';
import {
  openExport, closeExport, renderExportDrawer, copyExport, downloadExport, printCatalog, runImport,
  openCompare, closeCompare, renderCompare, openBatchTag, applyBatchTag, closeBatchTag,
  initPopup, showPopup, dismissPopup, submitPopup,
  openMenu, closeMenu, openCart, closeCart, initCoachmark, dismissCoachmark,
} from './overlays.js';
import { requestDelete } from './app-bridge.js';
import { registerWebMCP } from './webmcp.js';
import { announce, prefersReducedMotion, trapKeydown, isOverlayOpen, fmtHex } from './lib.js';

const $ = (sel, root = document) => root.querySelector(sel);

// ---------- store → UI ---------------------------------------------------------

bindUndoState(canUndo, canRedo);
subscribe(() => {
  renderAll();
  renderExportDrawer(); // live previews while the drawer is open
  if (ui.compareOpen) renderCompare();
  // The store auto-closes the editor when its palette disappears (undo/redo,
  // delete) — mirror that on the panel itself.
  if (ui.editor === null && isEditorOpen()) closeEditor(true);
});

// ---------- library canvas (delegated) ---------------------------------------------

function onCanvasClick(e) {
  const copy = e.target.closest('.js-copy');
  if (copy) { e.preventDefault(); copySwatch(copy); return; }

  const hueChip = e.target.closest('.js-hue-chip');
  if (hueChip) {
    const hex = fmtHex(hueChip.getAttribute('data-hex'));
    if (state.view !== 'nomenclature') setViewState({ view: 'nomenclature' });
    copySwatch(hueChip);
    requestAnimationFrame(() => spotlightRow(hex));
    return;
  }

  const open = e.target.closest('.js-open-palette');
  if (open) {
    const id = open.getAttribute('data-palette-id');
    if (id) openEditor(id, open);
    return;
  }

  const fav = e.target.closest('.js-fav');
  if (fav) {
    const id = fav.getAttribute('data-palette-id');
    const p = paletteById(id);
    if (p) {
      toggleFavorite([id]);
      announce(p.favorite ? `Removed favorite from ${p.name}.` : `Marked ${p.name} as a favorite.`);
    }
    return;
  }

  const restore = e.target.closest('.js-restore');
  if (restore) {
    const p = paletteById(restore.getAttribute('data-palette-id'));
    if (p) { restorePalettes([p.id]); announce(`${p.name} restored to the default layouts.`); }
    return;
  }

  const create = e.target.closest('.js-create');
  if (create) { openEditor('new', create); return; }

  const clearAll = e.target.closest('.js-clear-all');
  if (clearAll) {
    setViewState({ search: '', tagFacet: null, periodFilter: '', archivedFacet: false });
    announce('Filters cleared — the full collection is back.');
    return;
  }
}

$('#library-canvas').addEventListener('click', onCanvasClick);
$('#library-canvas').addEventListener('change', (e) => {
  const sel = e.target.closest('.js-select');
  if (sel) toggleSelect(sel.getAttribute('data-palette-id'));
});
$('#empty-state').addEventListener('click', onCanvasClick);
$('#hue-strip').addEventListener('click', onCanvasClick);

// ---------- controls strip -------------------------------------------------------------

for (const btn of document.querySelectorAll('.palette-library__toggle-option')) {
  btn.addEventListener('click', () => setViewState({ view: btn.dataset.view }));
}

$('#PeriodFilter').addEventListener('change', (e) => {
  setViewState({ periodFilter: e.target.value });
  announce(e.target.value ? `Period filter: ${e.target.value}.` : 'Period filter cleared.');
});

$('#NameSort').addEventListener('change', (e) => {
  setViewState({ nameSort: e.target.value });
  announce(e.target.value === 'name-asc' ? 'Sorted by name A to Z.' : 'Sorted by name Z to A.');
});

$('#VisionSimulation').addEventListener('change', (e) => {
  setViewState({ vision: e.target.value });
  announce(e.target.value === 'none' ? 'Vision simulation off — true colours restored.' : `Vision simulation: ${e.target.value}.`);
});

$('#btn-undo').addEventListener('click', () => { if (undo()) announce('Undo — previous state restored.'); });
$('#btn-redo').addEventListener('click', () => { if (redo()) announce('Redo — change reapplied.'); });
$('#btn-create').addEventListener('click', (e) => openEditor('new', e.currentTarget));
$('#btn-export').addEventListener('click', (e) => openExport(undefined, e.currentTarget));
$('#btn-compare').addEventListener('click', (e) => openCompare(e.currentTarget));

$('#search-input').addEventListener('input', (e) => setViewState({ search: e.target.value }));

$('#tag-facets').addEventListener('click', (e) => {
  const chip = e.target.closest('.tag-chip');
  if (!chip) return;
  const tag = chip.getAttribute('data-tag');
  setViewState({ tagFacet: state.tagFacet === tag ? null : tag });
});

$('#archived-toggle').addEventListener('click', () => {
  setViewState({ archivedFacet: !state.archivedFacet });
  announce(state.archivedFacet ? 'Showing archived palettes.' : 'Hiding archived palettes.');
});

// ---------- selection tray ------------------------------------------------------------

$('#tray-favorite').addEventListener('click', () => {
  const n = state.multiSelect.length;
  if (!n) return;
  toggleFavorite([...state.multiSelect]);
  announce(`Batch favorite toggled on ${n} palettes.`);
});
$('#tray-tag').addEventListener('click', () => { if (state.multiSelect.length) openBatchTag(); });
$('#tray-archive').addEventListener('click', () => {
  const ids = [...state.multiSelect];
  if (!ids.length) return;
  if (!prefersReducedMotion()) {
    for (const id of ids) {
      document.querySelector(`.palette-card[data-palette-id="${CSS.escape(id)}"]`)?.classList.add('card-exit');
    }
    setTimeout(() => { batchArchive(ids); announce(`${ids.length} palettes archived — find them under the Archived facet.`); }, 240);
  } else {
    batchArchive(ids);
    announce(`${ids.length} palettes archived.`);
  }
});
$('#tray-compare').addEventListener('click', (e) => openCompare(e.currentTarget));
$('#tray-delete').addEventListener('click', () => requestDelete([...state.multiSelect]));
$('#tray-clear').addEventListener('click', () => { clearSelection(); announce('Selection cleared.'); });

// ---------- editor panel chrome ----------------------------------------------------------

$('#editor-close').addEventListener('click', () => closeEditor());
initEditorDrag();

// ---------- export drawer -------------------------------------------------------------------

$('#export-close').addEventListener('click', () => closeExport());
$('#export-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (!tab) return;
  ui.exportTab = tab.dataset.tab;
  renderExportDrawer();
});
$('#export-tabs').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const tabs = [...document.querySelectorAll('#export-tabs [data-tab]')];
  const i = tabs.findIndex((t) => t.classList.contains('is-active'));
  const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  ui.exportTab = next.dataset.tab;
  renderExportDrawer();
  next.focus();
  e.preventDefault();
});
$('#btn-copy-export').addEventListener('click', copyExport);
$('#btn-download-export').addEventListener('click', downloadExport);
$('#btn-print').addEventListener('click', printCatalog);
$('#btn-import').addEventListener('click', runImport);
$('#import-file').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { $('#import-input').value = String(reader.result || ''); };
  reader.readAsText(file);
});

// ---------- comparison + dialogs ------------------------------------------------------------

$('#compare-close').addEventListener('click', () => closeCompare());
$('#compare-select-a').addEventListener('change', (e) => { ui.compareA = e.target.value; renderCompare(); announce('Left palette swapped — deltas recomputed.'); });
$('#compare-select-b').addEventListener('change', (e) => { ui.compareB = e.target.value; renderCompare(); announce('Right palette swapped — deltas recomputed.'); });
$('#batch-tag-apply').addEventListener('click', applyBatchTag);
$('#batch-tag-cancel').addEventListener('click', closeBatchTag);
// ---------- subscribe popup ---------------------------------------------------------------------

$('#popup-close').addEventListener('click', () => dismissPopup());
$('#popup-form').addEventListener('submit', (e) => { e.preventDefault(); submitPopup(); });
$('#footer-newsletter').addEventListener('click', () => showPopup());
initPopup();

// ---------- menu + cart + coachmark ----------------------------------------------------------------

$('#btn-menu').addEventListener('click', openMenu);
$('#menu-close').addEventListener('click', closeMenu);
for (const item of document.querySelectorAll('#menu-drawer [data-scroll]')) {
  item.addEventListener('click', () => {
    closeMenu();
    document.querySelector(item.dataset.scroll)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}
$('#menu-export').addEventListener('click', () => { closeMenu(); openExport('json'); });
$('#menu-hint').addEventListener('click', () => {
  closeMenu();
  const cm = $('#coachmark');
  cm.hidden = false;
  requestAnimationFrame(() => cm.classList.add('is-visible'));
});

$('#btn-cart').addEventListener('click', openCart);
$('#cart-close').addEventListener('click', closeCart);
$('#cart-export').addEventListener('click', () => { closeCart(); openExport('json'); });

$('#coachmark-dismiss').addEventListener('click', dismissCoachmark);
initCoachmark();

// ---------- keyboard shortcuts (power users) ---------------------------------------------------------

document.addEventListener('keydown', (e) => {
  trapKeydown(e); // Tab trap + Escape for the topmost overlay
  if (e.defaultPrevented) return;

  const t = e.target;
  const inField = t instanceof HTMLElement && (
    t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable
  );

  if ((e.metaKey || e.ctrlKey) && !e.altKey && t instanceof HTMLElement) {
    if (e.key.toLowerCase() === 'z' && !inField) {
      e.preventDefault();
      if (e.shiftKey) { if (redo()) announce('Redo — change reapplied.'); }
      else if (undo()) announce('Undo — previous state restored.');
    }
    return;
  }

  if (inField || isOverlayOpen()) return;

  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const order = ['nomenclature', 'palette', 'swatch'];
    const i = order.indexOf(state.view);
    const next = order[(i + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
    setViewState({ view: next });
    announce(`${next === 'nomenclature' ? 'Nomenclature' : next === 'palette' ? 'Palette' : 'Swatch'} view active.`);
    e.preventDefault();
  } else if (e.key === 'e' || e.key === 'E') {
    openExport(undefined, $('#btn-export'));
    e.preventDefault();
  } else if (e.key === '/') {
    e.preventDefault();
    $('#search-input').focus();
  }
});

// ---------- scroll reveals + footer reveal ---------------------------------------------------------

function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -4% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

// The footer follows the archive in normal flow, so no compensating blank
// padding is needed and its controls remain directly clickable.
function syncFooterReveal() {
  const main = document.getElementById('MainContent');
  if (!main) return;
  main.style.setProperty('padding-bottom', '0px', 'important');
}

// ---------- boot -----------------------------------------------------------------------------------------

renderAll();
initReveals();
syncFooterReveal();
window.addEventListener('resize', syncFooterReveal);
window.addEventListener('load', syncFooterReveal);
registerWebMCP();
