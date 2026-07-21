// Renders the library canvas + controls from the shared store. Every surface
// derives from the same state, so a mutation echoes across all layouts at once.
import {
  state, ui, visiblePalettes, nomenclatureRows, swatchTiles, tagCounts, paletteById,
} from './store.js';
import { PERIODS } from './data.js';
import {
  escapeHtml, fmtHex, isLight, nearestColorName, simulateVision, announce, copyText,
} from './lib.js';

const $ = (sel, root = document) => root.querySelector(sel);

// ---------- swatch copy (shared micro-interaction) ---------------------------

const copyTimers = new WeakMap();

export async function copySwatch(el) {
  const hex = fmtHex(el.getAttribute('data-hex'));
  if (!hex) return;
  const ok = await copyText(hex);
  if (!ok) return;
  el.classList.remove('is-copied', 'is-flashing');
  // restart the flash animation even on rapid repeat clicks
  void el.offsetWidth;
  el.classList.add('is-copied', 'is-flashing');
  el.querySelectorAll('.copy-label').forEach((node) => node.remove());
  const label = document.createElement('span');
  label.className = 'copy-label';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = 'Copied';
  el.append(label);
  if (copyTimers.has(el)) clearTimeout(copyTimers.get(el));
  copyTimers.set(el, setTimeout(() => {
    el.classList.remove('is-copied', 'is-flashing');
    label.remove();
  }, 1000));
  const { name } = nearestColorName(hex);
  announce(`Copied ${hex} — ${name} — to the clipboard.`);
}

// ---------- vision simulation -------------------------------------------------

export function applyVision() {
  const mode = state.vision;
  const scope = document.querySelectorAll('#library-canvas [data-hex], #hue-strip [data-hex]');
  for (const el of scope) {
    const hex = fmtHex(el.getAttribute('data-hex'));
    el.style.backgroundColor = mode === 'none' ? hex : simulateVision(hex, mode);
  }
}

// ---------- controls strip ------------------------------------------------------

export function renderControls() {
  for (const btn of document.querySelectorAll('.palette-library__toggle-option')) {
    const active = btn.dataset.view === state.view;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  const period = $('#PeriodFilter');
  if (period && period.value !== state.periodFilter) period.value = state.periodFilter;
  const sort = $('#NameSort');
  if (sort && sort.value !== state.nameSort) sort.value = state.nameSort;
  const vision = $('#VisionSimulation');
  if (vision && vision.value !== state.vision) vision.value = state.vision;

  const undo = $('#btn-undo'), redo = $('#btn-redo');
  const { canUndo, canRedo } = undoState();
  undo.disabled = !canUndo;
  undo.setAttribute('aria-disabled', String(!canUndo));
  redo.disabled = !canRedo;
  redo.setAttribute('aria-disabled', String(!canRedo));

  const compare = $('#btn-compare');
  const n = state.multiSelect.length;
  compare.disabled = n !== 2;
  $('#compare-hint').textContent =
    n === 2
      ? 'Two palettes selected — ready to compare.'
      : `Select exactly two palettes to compare (${n} selected).`;
}

function undoState() {
  // import lazily to avoid a module cycle
  return { canUndo: undoCan(), canRedo: redoCan() };
}
let undoCan = () => false, redoCan = () => false;
export function bindUndoState(u, r) { undoCan = u; redoCan = r; }

// ---------- facets row -----------------------------------------------------------

export function renderFacets() {
  const input = $('#search-input');
  if (input && input.value !== state.search) input.value = state.search;

  const wrap = $('#tag-facets');
  const counts = tagCounts();
  wrap.innerHTML = counts
    .map(([tag, count]) => {
      const active = state.tagFacet === tag;
      return `<button type="button" class="tag-chip${active ? ' is-active' : ''}" data-tag="${escapeHtml(tag)}"
        aria-pressed="${active}" aria-label="Filter by tag ${escapeHtml(tag)} — ${count} palette${count === 1 ? '' : 's'}">
        ${escapeHtml(tag)}<span class="tag-chip__count">${count}</span></button>`;
    })
    .join('');

  const archived = $('#archived-toggle');
  archived.classList.toggle('is-active', state.archivedFacet);
  archived.setAttribute('aria-pressed', String(state.archivedFacet));
  const archivedCount = state.palettes.filter((p) => p.archived).length;
  archived.innerHTML = `Archived<span class="tag-chip__count">${archivedCount}</span>`;
}

// ---------- count + canvas ---------------------------------------------------------

function describeFilters() {
  const bits = [];
  if (state.search.trim()) bits.push(`“${state.search.trim()}”`);
  if (state.tagFacet) bits.push(`tag: ${state.tagFacet}`);
  if (state.periodFilter) bits.push(`period: ${state.periodFilter}`);
  return bits.join(' + ');
}

export function renderCanvas() {
  const list = visiblePalettes();
  const canvas = $('#library-canvas');
  const empty = $('#empty-state');
  const nomen = $('#nomenclature-view');
  const paletteV = $('#palette-view');
  const swatchV = $('#swatch-view');

  canvas.hidden = false;
  for (const v of [nomen, paletteV, swatchV]) {
    v.classList.toggle('active', v.dataset.view === state.view);
  }

  if (state.palettes.length === 0) {
    canvas.hidden = true;
    empty.hidden = false;
    empty.innerHTML = `
      <p class="empty-state__title">The archive is empty</p>
      <p class="empty-state__copy">Every collection starts with a single palette. Add the first one — a name, an artist, a period, and at least three swatches.</p>
      <button type="button" class="btn btn--solid js-create">Create palette</button>`;
    renderCountLine(0, 0, 0);
    return;
  }

  if (list.length === 0) {
    canvas.hidden = true;
    empty.hidden = false;
    const desc = describeFilters();
    empty.innerHTML = `
      <p class="empty-state__title">No palettes match ${escapeHtml(desc)}</p>
      <p class="empty-state__copy">Nothing in the archive carries this combination. Loosen the search or clear the active filters to see the full collection.</p>
      <button type="button" class="btn btn--solid js-clear-all">Clear all filters</button>`;
    const inScope = state.palettes.filter((p) => (state.archivedFacet ? p.archived : !p.archived)).length;
    renderCountLine(0, inScope, 0);
    return;
  }

  empty.hidden = true;
  renderNomenclature(nomen, list);
  renderPaletteView(paletteV, list);
  renderSwatchView(swatchV, list);
  const rows = nomenclatureRows(list);
  renderCountLine(list.length, state.palettes.filter((p) => (state.archivedFacet ? p.archived : !p.archived)).length, rows.length);
}

function renderCountLine(visible, inScope, indexed) {
  const el = $('#library-count');
  const isFiltered = state.search.trim() || state.tagFacet || state.periodFilter;
  if (state.archivedFacet) {
    el.textContent = `${visible} archived palette${visible === 1 ? '' : 's'} · ${indexed} colour${indexed === 1 ? '' : 's'} indexed`;
  } else if (isFiltered) {
    el.textContent = `${visible} of ${inScope} palettes · ${indexed} colour${indexed === 1 ? '' : 's'} shown`;
  } else {
    el.textContent = `${inScope} palettes · ${indexed} colour${indexed === 1 ? '' : 's'} indexed`;
  }
}

// ---------- nomenclature --------------------------------------------------------------

function renderNomenclature(container, list) {
  const rows = nomenclatureRows(list);
  const header = `<div class="nomenclature-row nomenclature-row--header" aria-hidden="true">
      <span>Swatch</span><span>Hex</span><span>Historical name</span><span>Source</span></div>`;
  container.innerHTML =
    header +
    rows
      .map((row) => {
        const { name, note } = nearestColorName(row.hex);
        return `<div class="nomenclature-row" data-hex-row="${escapeHtml(row.hex)}">
          <button type="button" class="nomenclature-swatch js-copy" data-hex="${escapeHtml(row.hex)}"
            style="background-color:${escapeHtml(row.hex)}" aria-label="Copy ${escapeHtml(row.hex)} (${escapeHtml(name)})">
            </button>
          <span class="nomenclature-hex">${escapeHtml(row.hex)}</span>
          <span class="nomenclature-namecell">
            <em class="nomenclature-name">${escapeHtml(name)}</em>
            <span class="nomenclature-note">${escapeHtml(note)}</span>
          </span>
          <span class="nomenclature-source">
            <button type="button" class="nomenclature-source__title js-open-palette" data-palette-id="${escapeHtml(row.srcId || '')}"
              data-palette-name="${escapeHtml(row.title)}">${escapeHtml(row.title)}</button>
            <span class="nomenclature-source__artist">${escapeHtml(row.artist)}</span>
          </span>
        </div>`;
      })
      .join('');
  // Resolve source palette ids (nomenclatureRows gives titles; map back).
  for (const el of container.querySelectorAll('.js-open-palette')) {
    const name = el.getAttribute('data-palette-name');
    const p = list.find((pal) => pal.name === name);
    el.setAttribute('data-palette-id', p ? p.id : '');
  }
}

// ---------- palette view -----------------------------------------------------------------

function starSvg(filled) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" class="fav-star${filled ? ' is-filled' : ''}">
    <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"
      fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

function renderPaletteView(container, list) {
  container.innerHTML = list
    .map((p) => {
      const swatches = p.swatches
        .map((hex) => {
          const h = fmtHex(hex);
          const ink = isLight(h) ? 'rgba(18,18,16,0.9)' : 'rgba(249,248,242,0.96)';
          return `<button type="button" class="palette-card__swatch js-copy" data-hex="${escapeHtml(h)}"
            style="background-color:${escapeHtml(h)}" aria-label="Copy ${escapeHtml(h)}">
            <span class="palette-card__swatch-hex" style="color:${ink}">${escapeHtml(h)}</span>
            </button>`;
        })
        .join('');
      const selected = state.multiSelect.includes(p.id);
      const enter = ui.lastCreatedId === p.id ? ' card-enter' : '';
      const archivedBadge = p.archived
        ? `<span class="palette-card__badge">Archived</span>
           <button type="button" class="btn btn--ghost btn--mini js-restore" data-palette-id="${escapeHtml(p.id)}">Restore</button>`
        : '';
      const tags = p.tags.length
        ? `<div class="palette-card__meta-row"><span class="palette-card__meta-label">tags</span>
             <span class="palette-card__meta-tags">${p.tags.map((t) => escapeHtml(t)).join(' · ')}</span></div>`
        : '';
      return `<article class="palette-card${selected ? ' is-selected' : ''}${enter}" data-palette-id="${escapeHtml(p.id)}">
        <label class="palette-card__select">
          <input type="checkbox" class="js-select" data-palette-id="${escapeHtml(p.id)}" ${selected ? 'checked' : ''}
            aria-label="Select ${escapeHtml(p.name)}">
        </label>
        <button type="button" class="palette-card__fav js-fav" data-palette-id="${escapeHtml(p.id)}"
          aria-pressed="${p.favorite}" aria-label="${p.favorite ? 'Remove' : 'Mark'} favorite — ${escapeHtml(p.name)}">${starSvg(p.favorite)}</button>
        <div class="palette-card__swatches" style="--swatch-count:${p.swatches.length}">${swatches}</div>
        <div class="palette-card__meta">
          <div class="palette-card__meta-row">
            <span class="palette-card__meta-label">title</span>
            <button type="button" class="palette-card__meta-title js-open-palette" data-palette-id="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>
          </div>
          <div class="palette-card__meta-row">
            <span class="palette-card__meta-label">artist</span>
            <span class="palette-card__meta-artist">${escapeHtml(p.artist)}</span>
          </div>
          <div class="palette-card__meta-row">
            <span class="palette-card__meta-label">period</span>
            <span class="palette-card__meta-period">${escapeHtml(p.period)}</span>
          </div>
          ${tags}
        </div>
        ${archivedBadge}
      </article>`;
    })
    .join('');
  ui.lastCreatedId = null;
}

// ---------- swatch view ---------------------------------------------------------------------

function renderSwatchView(container, list) {
  const tiles = swatchTiles(list);
  container.innerHTML = tiles
    .map((t) => {
      const { name } = nearestColorName(t.hex);
      const ink = isLight(t.hex) ? 'rgba(18,18,16,0.85)' : 'rgba(249,248,242,0.95)';
      return `<button type="button" class="swatch-tile js-copy" data-hex="${escapeHtml(t.hex)}"
        style="background-color:${escapeHtml(t.hex)}"
        aria-label="Copy ${escapeHtml(t.hex)} (${escapeHtml(name)}) from ${escapeHtml(t.palette)}">
        <span class="swatch-tile__title" style="color:${ink}">${escapeHtml(t.palette)}</span>
        <span class="swatch-tile__name" style="color:${ink}">${escapeHtml(name)}</span>
        <span class="swatch-tile__hex" style="color:${ink}">${escapeHtml(t.hex)}</span>
      </button>`;
    })
    .join('');
}

// ---------- hue spectrum strip (interactive index aid) -----------------------------------------

export function renderHueStrip() {
  const strip = $('#hue-strip');
  // Spectrum always reflects the full non-archived collection.
  const list = state.palettes.filter((p) => !p.archived);
  const rows = nomenclatureRows(list);
  strip.innerHTML = rows
    .map(
      (r) => `<button type="button" class="hue-chip js-hue-chip" data-hex="${escapeHtml(r.hex)}"
        style="background-color:${escapeHtml(r.hex)}"
        aria-label="Locate ${escapeHtml(r.hex)} in the nomenclature index"></button>`
    )
    .join('');
}

export function spotlightRow(hex) {
  const row = document.querySelector(`.nomenclature-row[data-hex-row="${CSS.escape(hex)}"]`);
  if (!row) return;
  row.scrollIntoView({ block: 'center', behavior: 'auto' });
  row.classList.remove('is-spotlight');
  void row.offsetWidth;
  row.classList.add('is-spotlight');
  setTimeout(() => row.classList.remove('is-spotlight'), 1600);
}

// ---------- selection tray ------------------------------------------------------------------------

export function renderTray() {
  const tray = $('#selection-tray');
  const n = state.multiSelect.length;
  if (n === 0) {
    tray.hidden = true;
    return;
  }
  tray.hidden = false;
  $('#tray-count').textContent = `${n} selected`;
  $('#tray-compare').disabled = n !== 2;
}

// ---------- master render ------------------------------------------------------------------------------

export function renderAll() {
  renderControls();
  renderFacets();
  renderCanvas();
  renderTray();
  renderHueStrip();
  applyVision();
}
