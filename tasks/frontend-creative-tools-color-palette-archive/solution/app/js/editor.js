// Detail/Editor — a focused dialog panel to create or edit one palette.
// Shares the exact field contract (and store commands) with the WebMCP tools.
import { state, ui, paletteById, createPalette, updatePalette, duplicatePalette, reorderSwatches, notify } from './store.js';
import { PERIODS } from './data.js';
import {
  escapeHtml, fmtHex, isValidHex, validatePalette, parseTags, contrastRatio,
  classifyHarmony, nearestColorName, renderMarkdown, announce, prefersReducedMotion,
  openOverlay, closeOverlay, overlayStack,
} from './lib.js';
import { requestDelete } from './app-bridge.js';

const EMPTY = '';
let draft = null;
let panelEl = null;
let invokerEl = null;
let overlayEntry = null;

export function isEditorOpen() {
  return overlayEntry !== null;
}

export function openEditor(id, invoker) {
  const existing = id !== 'new' ? paletteById(id) : null;
  if (id !== 'new' && !existing) return;
  invokerEl = invoker || document.activeElement;
  draft = {
    id: id === 'new' ? 'new' : existing.id,
    name: existing ? existing.name : '',
    artist: existing ? existing.artist : '',
    period: existing ? existing.period : '',
    tagsInput: existing ? existing.tags.join(', ') : '',
    notes: existing ? existing.notes : '',
    notesMode: existing && existing.notes.trim() ? 'preview' : 'write',
    swatches: existing ? [...existing.swatches.map(fmtHex)] : [EMPTY, EMPTY, EMPTY],
    favorite: existing ? existing.favorite : false,
  };
  ui.editor = { id: draft.id };
  panelEl = document.getElementById('editor-panel');
  renderEditor();
  panelEl.hidden = false;
  panelEl.classList.add('is-open');
  overlayEntry = { el: panelEl, onEscape: () => closeEditor() };
  openOverlay(overlayEntry);
  const first = panelEl.querySelector('#ed-name');
  if (first) first.focus();
  announce(draft.id === 'new' ? 'New palette editor opened.' : `Editing ${draft.name}.`);
}

export function closeEditor(silent = false) {
  if (!panelEl) return;
  panelEl.classList.remove('is-open');
  const finish = () => {
    panelEl.hidden = true;
    ui.editor = null;
    draft = null;
    if (overlayEntry) { closeOverlay(overlayEntry); overlayEntry = null; }
    if (invokerEl && document.contains(invokerEl)) invokerEl.focus();
  };
  if (prefersReducedMotion()) finish();
  else setTimeout(finish, 220);
  if (!silent) announce('Editor closed — back to the archive.');
}

// ---------- draft → record ------------------------------------------------------------------

function draftRecord() {
  return {
    name: draft.name,
    artist: draft.artist,
    period: draft.period,
    swatches: draft.swatches,
    favorite: draft.favorite,
    tags: parseTags(draft.tagsInput),
    notes: draft.notes,
    archived: draft.id !== 'new' ? (paletteById(draft.id)?.archived || false) : false,
  };
}

function draftErrors() {
  // Per-field messages for the inline error slots. The record-level validator
  // returns the first failing field; here we collect each one independently.
  const errs = {};
  const rec = draftRecord();
  const whole = validatePalette({ ...rec, id: 'x' }, { requireId: true });
  if (whole) errs[whole.field] = whole.message;
  if (!rec.name.trim()) errs.name = 'Name is required — give this palette a title.';
  else if (rec.name.length > 80) errs.name = 'Name must be 80 characters or fewer.';
  if (!rec.artist.trim()) errs.artist = 'Artist is required — credit the source work.';
  else if (rec.artist.length > 80) errs.artist = 'Artist must be 80 characters or fewer.';
  if (!rec.period) errs.period = 'Period is required — choose one from the closed period list.';
  else if (!PERIODS.includes(rec.period)) errs.period = 'Period must be one of the closed period list.';
  const filled = rec.swatches.filter((s) => s.trim() !== '');
  const bad = rec.swatches.findIndex((s) => s.trim() !== '' && !isValidHex(s));
  if (bad >= 0) errs.swatches = `Swatch ${bad + 1} must be a six-digit hex with a leading #, like #B3342B.`;
  else if (filled.length < 3) errs.swatches = `Add at least 3 swatches (currently ${filled.length}).`;
  else if (filled.length > 12) errs.swatches = `Remove swatches — the limit is 12 (currently ${filled.length}).`;
  else if (rec.swatches.some((s) => s.trim() === '' && filled.length >= 3)) errs.swatches = 'Every swatch row needs a six-digit hex, or remove the empty row.';
  const tags = parseTags(draft.tagsInput);
  if (tags.length > 6) errs.tags = 'Tags: keep to 6 or fewer.';
  else if (tags.some((t) => t.length > 24)) errs.tags = 'Tags: each tag must be 24 characters or fewer.';
  else if (new Set(tags).size !== tags.length) errs.tags = 'Tags: the same tag appears twice — remove the duplicate.';
  if (draft.notes.length > 2000) errs.notes = `Notes must be 2000 characters or fewer (${draft.notes.length} typed).`;
  return errs;
}

// ---------- render ------------------------------------------------------------------------------

export function renderEditor() {
  if (!draft) return;
  const body = document.getElementById('editor-body');
  const isNew = draft.id === 'new';
  document.getElementById('editor-title').textContent = isNew ? 'New palette' : `Edit — ${draft.name || 'untitled'}`;

  const periodOptions = PERIODS.map(
    (p) => `<option value="${escapeHtml(p)}" ${draft.period === p ? 'selected' : ''}>${escapeHtml(p)}</option>`
  ).join('');

  body.innerHTML = `
    <form id="editor-form" novalidate>
      <div class="ed-field">
        <label for="ed-name">Palette name</label>
        <input id="ed-name" class="ed-input js-draft" data-field="name" type="text" value="${escapeHtml(draft.name)}"
          maxlength="80" autocomplete="off" aria-describedby="err-name">
        <p class="field-error" id="err-name" hidden></p>
      </div>
      <div class="ed-field">
        <label for="ed-artist">Artist</label>
        <input id="ed-artist" class="ed-input js-draft" data-field="artist" type="text" value="${escapeHtml(draft.artist)}"
          maxlength="80" autocomplete="off" aria-describedby="err-artist">
        <p class="field-error" id="err-artist" hidden></p>
      </div>
      <div class="ed-field">
        <label for="ed-period">Period</label>
        <select id="ed-period" class="ed-select js-draft" data-field="period" aria-describedby="err-period">
          <option value="">Choose a period…</option>
          ${periodOptions}
        </select>
        <p class="field-error" id="err-period" hidden></p>
      </div>

      <fieldset class="ed-field ed-swatches">
        <legend>Swatches <span class="ed-hint">(3–12, in order — drag or use the arrows)</span></legend>
        <ul id="ed-swatch-list" class="ed-swatch-list"></ul>
        <p class="field-error" id="err-swatches" hidden></p>
        <button type="button" class="btn btn--ghost btn--mini" id="ed-add-swatch">+ Add swatch</button>
      </fieldset>

      <div class="ed-field">
        <label for="ed-tags">Tags <span class="ed-hint">(comma separated, max 6)</span></label>
        <input id="ed-tags" class="ed-input js-draft" data-field="tagsInput" type="text" value="${escapeHtml(draft.tagsInput)}"
          autocomplete="off" aria-describedby="err-tags" placeholder="night sky, impasto">
        <p class="field-error" id="err-tags" hidden></p>
      </div>

      <div class="ed-field">
        <h3 id="ed-notes-heading">Provenance notes</h3>
        <div class="ed-notes-head">
          <label for="ed-notes"><span class="ed-hint">markdown provenance — Write or Preview</span></label>
          <div class="ed-notes-toggle" role="group" aria-label="Notes mode">
            <button type="button" class="ed-toggle-opt ${draft.notesMode === 'write' ? 'is-active' : ''}" data-mode="write" aria-pressed="${draft.notesMode === 'write'}">Write</button>
            <button type="button" class="ed-toggle-opt ${draft.notesMode === 'preview' ? 'is-active' : ''}" data-mode="preview" aria-pressed="${draft.notesMode === 'preview'}">Preview</button>
          </div>
        </div>
        <textarea id="ed-notes" class="ed-input ed-notes js-draft" data-field="notes" rows="5"
          aria-describedby="err-notes" ${draft.notesMode === 'preview' ? 'hidden' : ''}>${escapeHtml(draft.notes)}</textarea>
        <div id="ed-notes-preview" class="notes-preview" ${draft.notesMode === 'write' ? 'hidden' : ''}></div>
        <p class="field-error" id="err-notes" hidden></p>
      </div>

      <section class="ed-panel-block" aria-labelledby="ed-contrast-heading">
        <h3 id="ed-contrast-heading">Contrast — WCAG pairs</h3>
        <p class="ed-hint">Unique swatch pairs, worst contrast first. AA needs 4.5:1; AAA needs 7:1.</p>
        <div id="ed-contrast"></div>
      </section>

      <section class="ed-panel-block" aria-labelledby="ed-harmony-heading">
        <h3 id="ed-harmony-heading">Harmony analysis</h3>
        <div id="ed-harmony"></div>
      </section>
    </form>

    <div class="ed-footer">
      <label class="ed-fav-toggle">
        <input type="checkbox" id="ed-favorite" ${draft.favorite ? 'checked' : ''}>
        <span>★ Favorite</span>
      </label>
      <span class="ed-footer-spacer"></span>
      ${!isNew ? `<button type="button" class="btn btn--ghost" id="ed-duplicate">Duplicate</button>` : ''}
      ${!isNew ? `<button type="button" class="btn btn--ghost btn--danger" id="ed-delete">Delete palette</button>` : ''}
      <button type="button" class="btn btn--solid" id="ed-save">${isNew ? 'Create palette' : 'Save palette'}</button>
      <button type="button" class="btn btn--ghost" id="ed-cancel">Cancel</button>
    </div>`;

  renderSwatchRows();
  renderEditorAnalysis();
  bindEditorEvents();
}

function renderSwatchRows() {
  const list = document.getElementById('ed-swatch-list');
  list.innerHTML = draft.swatches
    .map((hex, i) => {
      const valid = isValidHex(hex);
      const chipBg = valid ? fmtHex(hex) : 'transparent';
      const name = valid ? nearestColorName(fmtHex(hex)).name : 'awaiting hex';
      return `<li class="swatch-row" data-index="${i}">
        <span class="swatch-row__grip" title="Drag to reorder" aria-hidden="true">
          <svg viewBox="0 0 10 16" width="10" height="16"><g fill="currentColor"><circle cx="2.5" cy="3" r="1.3"/><circle cx="7.5" cy="3" r="1.3"/><circle cx="2.5" cy="8" r="1.3"/><circle cx="7.5" cy="8" r="1.3"/><circle cx="2.5" cy="13" r="1.3"/><circle cx="7.5" cy="13" r="1.3"/></g></svg>
        </span>
        <span class="swatch-row__chip${valid ? '' : ' is-empty'}" data-editor-chip style="background-color:${chipBg}" aria-hidden="true"></span>
        <label class="sr-only" for="ed-hex-${i}">Swatch ${i + 1} hex</label>
        <input id="ed-hex-${i}" class="ed-input ed-hex js-hex-input" data-index="${i}" type="text"
          value="${escapeHtml(hex)}" placeholder="#000000" maxlength="7" spellcheck="false" autocomplete="off">
        <em class="swatch-row__name">${escapeHtml(name)}</em>
        <span class="swatch-row__btns">
          <button type="button" class="ed-mini-btn js-move" data-index="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move swatch ${i + 1} up">↑</button>
          <button type="button" class="ed-mini-btn js-move" data-index="${i}" data-dir="1" ${i === draft.swatches.length - 1 ? 'disabled' : ''} aria-label="Move swatch ${i + 1} down">↓</button>
          <button type="button" class="ed-mini-btn js-remove-swatch" data-index="${i}" aria-label="Remove swatch ${i + 1}">✕</button>
        </span>
      </li>`;
    })
    .join('');
}

export function renderEditorAnalysis() {
  if (!draft) return;
  const errs = draftErrors();
  const fields = ['name', 'artist', 'period', 'swatches', 'tags', 'notes'];
  for (const f of fields) {
    const el = document.getElementById(`err-${f}`);
    if (!el) continue;
    const input = el.parentElement.querySelector('input, select, textarea');
    if (errs[f]) {
      el.hidden = false;
      el.textContent = errs[f];
      if (input) input.setAttribute('aria-invalid', 'true');
    } else {
      el.hidden = true;
      el.textContent = '';
      if (input) input.removeAttribute('aria-invalid');
    }
  }
  const save = document.getElementById('ed-save');
  const valid = Object.keys(errs).length === 0;
  save.disabled = !valid;
  save.setAttribute('aria-disabled', String(!valid));

  renderContrastMatrix();
  renderHarmony();
  if (draft.notesMode === 'preview') {
    const prev = document.getElementById('ed-notes-preview');
    prev.innerHTML = draft.notes.trim()
      ? renderMarkdown(draft.notes)
      : '<p class="notes-empty">No provenance notes yet — switch to Write to add some.</p>';
  }
}

function validSwatchHexes() {
  return draft.swatches.filter((s) => isValidHex(s)).map(fmtHex);
}

function renderContrastMatrix() {
  const host = document.getElementById('ed-contrast');
  const hexes = [...new Set(validSwatchHexes())];
  if (hexes.length < 2) {
    host.innerHTML = '<p class="matrix-empty">Not enough distinct swatches — the contrast matrix needs at least two different hexes.</p>';
    return;
  }
  const pairs = [];
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const ratio = contrastRatio(hexes[i], hexes[j]);
      pairs.push({ a: hexes[i], b: hexes[j], ratio });
    }
  }
  pairs.sort((x, y) => x.ratio - y.ratio); // worst contrast first
  host.innerHTML = `<ol class="matrix-list">` + pairs.map((p) => {
    const aa = p.ratio >= 4.5, aaa = p.ratio >= 7;
    return `<li class="matrix-row${aa ? '' : ' is-fail'}">
      <span class="matrix-chips">
        <span class="matrix-chip" style="background:${p.a}" aria-hidden="true"></span>
        <span class="matrix-chip" style="background:${p.b}" aria-hidden="true"></span>
      </span>
      <span class="matrix-hexes">${p.a} · ${p.b}</span>
      <span class="matrix-ratio">${p.ratio.toFixed(2)}:1</span>
      <span class="matrix-mark${aa ? ' is-pass' : ' is-failtext'}">AA ${aa ? 'Pass' : 'Fail'}</span>
      <span class="matrix-mark${aaa ? ' is-pass' : ' is-failtext'}">AAA ${aaa ? 'Pass' : 'Fail'}</span>
    </li>`;
  }).join('') + `</ol>`;
}

function renderHarmony() {
  const host = document.getElementById('ed-harmony');
  const { hues, classification, detail } = classifyHarmony(validSwatchHexes());
  host.innerHTML = `
    <p class="harmony-hues">${hues.length ? `Hues: ${hues.map((h) => `${h}°`).join(' · ')}` : 'No measurable hues (achromatic palette).'}</p>
    <p class="harmony-class"><strong>${escapeHtml(classification)}</strong> — ${escapeHtml(detail)}</p>`;
}

// ---------- events ------------------------------------------------------------------------------

function bindEditorEvents() {
  const panel = panelEl;
  panel.addEventListener('input', onEditorInput);
  panel.addEventListener('click', onEditorClick);
  panel.addEventListener('change', onEditorChange);
}

function onEditorInput(e) {
  const t = e.target;
  if (t.classList.contains('js-hex-input')) {
    const i = Number(t.dataset.index);
    draft.swatches[i] = t.value;
    const row = t.closest('.swatch-row');
    const chip = row.querySelector('[data-editor-chip]');
    const nameEl = row.querySelector('.swatch-row__name');
    if (isValidHex(t.value)) {
      chip.classList.remove('is-empty');
      chip.style.backgroundColor = fmtHex(t.value);
      nameEl.textContent = nearestColorName(fmtHex(t.value)).name;
    } else {
      chip.classList.add('is-empty');
      chip.style.backgroundColor = 'transparent';
      nameEl.textContent = t.value.trim() ? 'invalid hex' : 'awaiting hex';
    }
    renderEditorAnalysis();
    return;
  }
  if (t.classList.contains('js-draft')) {
    draft[t.dataset.field] = t.value;
    if (t.dataset.field === 'name') {
      document.getElementById('editor-title').textContent = `Edit — ${t.value || 'untitled'}`;
    }
    renderEditorAnalysis();
  }
}

function onEditorChange(e) {
  const t = e.target;
  if (t.id === 'ed-favorite') {
    draft.favorite = t.checked;
  }
  if (t.classList.contains('js-draft') && t.tagName === 'SELECT') {
    draft[t.dataset.field] = t.value;
    renderEditorAnalysis();
  }
}

function onEditorClick(e) {
  const panel = panelEl;
  const t = e.target.closest('button');
  if (!t || !panel) return;
  if (t.classList.contains('js-move')) {
    const i = Number(t.dataset.index);
    const dir = Number(t.dataset.dir);
    moveSwatch(i, i + dir);
    return;
  }
  if (t.classList.contains('js-remove-swatch')) {
    draft.swatches.splice(Number(t.dataset.index), 1);
    if (draft.swatches.length === 0) draft.swatches = [''];
    renderSwatchRows();
    renderEditorAnalysis();
    return;
  }
  if (t.id === 'ed-add-swatch') {
    if (draft.swatches.length >= 12) {
      announce('Swatch limit reached — the field contract allows at most 12.');
      return;
    }
    draft.swatches.push('');
    renderSwatchRows();
    renderEditorAnalysis();
    const inputs = panel.querySelectorAll('.js-hex-input');
    inputs[inputs.length - 1]?.focus();
    return;
  }
  if (t.classList.contains('ed-toggle-opt')) {
    draft.notesMode = t.dataset.mode;
    const ta = document.getElementById('ed-notes');
    const prev = document.getElementById('ed-notes-preview');
    const isPreview = draft.notesMode === 'preview';
    ta.hidden = isPreview;
    prev.hidden = !isPreview;
    for (const b of panel.querySelectorAll('.ed-toggle-opt')) {
      b.classList.toggle('is-active', b.dataset.mode === draft.notesMode);
      b.setAttribute('aria-pressed', String(b.dataset.mode === draft.notesMode));
    }
    renderEditorAnalysis();
    return;
  }
  if (t.id === 'ed-save') { saveDraft(); return; }
  if (t.id === 'ed-cancel') { closeEditor(); return; }
  if (t.id === 'ed-duplicate') {
    const copy = duplicatePalette(draft.id);
    if (copy) {
      announce(`Duplicated — "${copy.name}" added to the archive.`);
      closeEditor();
    }
    return;
  }
  if (t.id === 'ed-delete') {
    requestDelete([draft.id], () => closeEditor(true));
    return;
  }
}

function saveDraft() {
  const errs = draftErrors();
  if (Object.keys(errs).length > 0) { renderEditorAnalysis(); return; }
  const rec = draftRecord();
  rec.swatches = rec.swatches.map(fmtHex);
  if (draft.id === 'new') {
    const p = createPalette(rec);
    announce(`Palette created — ${p.name} is now in the archive.`);
  } else {
    updatePalette(draft.id, rec);
    announce(`Palette saved — ${rec.name} updated across the archive.`);
  }
  closeEditor(true);
}

// ---------- drag reordering ---------------------------------------------------------------------

function moveSwatch(from, to) {
  if (to < 0 || to >= draft.swatches.length || from === to) return;
  if (draft.id !== 'new') {
    // Reordering commits immediately to the shared store — it is the palette's
    // canonical swatch order and an undoable step in its own right.
    reorderSwatches(draft.id, from, to);
    const rec = paletteById(draft.id);
    if (rec) draft.swatches = [...rec.swatches];
  } else {
    const [s] = draft.swatches.splice(from, 1);
    draft.swatches.splice(to, 0, s);
  }
  renderSwatchRows();
  renderEditorAnalysis();
  panelEl?.querySelector(`.js-hex-input[data-index="${to}"]`)?.focus();
}

// Pointer-based drag on swatch rows: the dragged row follows the pointer while
// the others part to show the drop position; releasing commits (undoable).
export function initEditorDrag() {
  const panel = document.getElementById('editor-panel');
  panel.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest('.swatch-row__grip, .swatch-row__chip');
    if (!grip || e.button !== 0) return;
    const row = grip.closest('.swatch-row');
    if (!row) return;
    const list = document.getElementById('ed-swatch-list');
    const rows = [...list.querySelectorAll('.swatch-row')];
    if (rows.length < 2) return;
    const src = Number(row.dataset.index);
    const rowH = row.offsetHeight + 8;
    const startY = e.clientY;
    let target = src;
    const animate = !prefersReducedMotion();
    row.classList.add('is-dragging');
    grip.setPointerCapture?.(e.pointerId);
    e.preventDefault();

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      target = Math.max(0, Math.min(rows.length - 1, src + Math.round(dy / rowH)));
      row.style.transform = `translateY(${dy}px)`;
      rows.forEach((r) => {
        if (r === row) return;
        const i = Number(r.dataset.index);
        let shift = 0;
        if (src < target && i > src && i <= target) shift = -rowH;
        else if (target < src && i >= target && i < src) shift = rowH;
        r.style.transition = animate ? 'transform 0.18s ease' : 'none';
        r.style.transform = shift ? `translateY(${shift}px)` : '';
      });
    };
    const onUp = () => {
      row.classList.remove('is-dragging');
      row.style.transform = '';
      rows.forEach((r) => { r.style.transform = ''; r.style.transition = ''; });
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (target !== src) moveSwatch(src, target);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
}
