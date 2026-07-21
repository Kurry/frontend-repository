// Studio shell, panels, and all visible-UI wiring. The WebMCP handlers call
// the same state actions these controls use.
import {
  BUILTINS, COLOR_KEYS, BASE_KEYS, SEMANTIC_NAMES, CHIP_KEYS,
  RADIUS_VALUES, RADIUS_GROUPS, SIZE_VALUES, SIZE_KINDS, BORDER_VALUES,
  FONT_FAMILIES, FIELD_HEIGHT, SELECTOR_SIZE, prettyToken, chipHexes,
} from './data.js';
import { toCSS, toJSON, toConfig } from './format.js';
import {
  state, subscribe, activeTheme, selectTheme, removeTheme, leavingRows,
  createTheme, renameActive, validateRename, undo, redo, setColor, setRadius,
  setSize, setBorder, setEffect, setFontFamily, setOption, resetActive,
  randomize, importFromText, saveSnapshot, restoreSnapshotTokens,
  diffAgainstSnapshot, loadFromHash, syncHash, watchHash, snapshotState,
  pushExternalHistory, uniqueName,
} from './state.js';
import { PREVIEW_TABS } from './preview-content.js';

const NOISE_TEX = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- shell ----
export function buildShell() {
  document.getElementById('app').innerHTML = `
  <div class="shell" data-site-theme="${state.siteTheme}">
    <header class="chrome">
      <div class="announce">
        <span class="announce-pulse" aria-hidden="true"></span>
        <p class="announce-text">daisyUI 5.6 is now available — faster builds, new themes, smaller CSS</p>
        <button class="announce-btn" type="button" data-inert>See what’s new</button>
      </div>
      <nav class="navbar" aria-label="Studio">
        <h1 class="brand"><button class="brand-btn" type="button" data-inert>daisy<span class="brand-accent">UI</span></button><span class="brand-tag">Theme Studio</span></h1>
        <div class="chrome-actions">
          <div class="dd" data-dd="version">
            <button class="chrome-btn dd-trigger" type="button" aria-haspopup="menu" aria-expanded="false">
              <span class="dd-label">${state.version}</span><span class="dd-caret" aria-hidden="true">&#9662;</span>
            </button>
            <ul class="dd-menu" role="menu" aria-label="Version" hidden>
              ${['5.6.18', '5.5.12', '5.0.28', '4.12.14'].map((v) => `
                <li role="none"><button class="dd-item" role="menuitem" type="button" data-version="${v}">${v}${v === state.version ? ' <span class="dd-cur">&#10003; current</span>' : ''}</button></li>`).join('')}
            </ul>
          </div>
          <button class="chrome-btn stars" type="button" data-inert aria-label="GitHub stars, 41 thousand"><span aria-hidden="true">&#9733;</span> 41k</button>
          <div class="dd" data-dd="site">
            <button class="chrome-btn dd-trigger" type="button" aria-haspopup="menu" aria-expanded="false">
              <span class="dd-label">${state.siteTheme === 'dark' ? 'Dark' : 'Light'}</span><span class="dd-caret" aria-hidden="true">&#9662;</span>
            </button>
            <ul class="dd-menu" role="menu" aria-label="Chrome theme" hidden>
              <li role="none"><button class="dd-item" role="menuitemradio" aria-checked="${state.siteTheme === 'light'}" type="button" data-site="light">Light</button></li>
              <li role="none"><button class="dd-item" role="menuitemradio" aria-checked="${state.siteTheme === 'dark'}" type="button" data-site="dark">Dark</button></li>
            </ul>
          </div>
          <div class="dd" data-dd="lang">
            <button class="chrome-btn dd-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Language">
              <span class="dd-label">${state.language}</span><span class="dd-caret" aria-hidden="true">&#9662;</span>
            </button>
            <ul class="dd-menu" role="menu" aria-label="Language" hidden>
              ${['EN', 'ES', 'DE', 'FR', 'JA', 'PT'].map((l) => `
                <li role="none"><button class="dd-item" role="menuitemradio" aria-checked="${l === state.language}" type="button" data-lang="${l}">${l}</button></li>`).join('')}
            </ul>
          </div>
        </div>
      </nav>
    </header>

    <main class="workspace">
      <section class="panel themes-panel" aria-labelledby="themes-h">
        <div class="panel-head"><h2 id="themes-h">Themes</h2><span class="panel-note">${BUILTINS.length} built-in</span></div>
        <button id="hold-add" class="hold-add" type="button">
          <span class="hold-fill" aria-hidden="true"></span>
          <span class="hold-label"><span class="hold-icon" aria-hidden="true">&#43;</span> Hold to add theme</span>
        </button>
        <div class="my-themes-block">
          <h3 id="my-themes-h" class="side-h">My Themes <span class="count-pill" id="my-count">0</span></h3>
          <ul id="my-themes" class="theme-list" aria-labelledby="my-themes-h"></ul>
        </div>
        <h3 id="builtin-themes-h" class="side-h">Built-in Themes</h3>
        <ul id="builtin-themes" class="theme-list" aria-labelledby="builtin-themes-h">
          ${BUILTINS.map((t) => themeRowHTML(t)).join('')}
        </ul>
        <div class="snapshots-block">
          <h3 class="side-h">Snapshots <span class="count-pill" id="snap-count">0</span></h3>
          <ul id="snapshot-list" class="theme-list"></ul>
        </div>
      </section>

      <section class="panel editor-panel" aria-labelledby="editor-h">
        <div class="panel-head">
          <h2 id="editor-h">Editor</h2>
          <div class="editor-toolbar" role="group" aria-label="History and randomize">
            <button id="btn-undo" class="mini-btn" type="button" disabled>Undo</button>
            <button id="btn-redo" class="mini-btn" type="button" disabled>Redo</button>
            <button id="btn-random" class="mini-btn mini-btn-acc" type="button"><span class="rand-icon" aria-hidden="true">&#8645;</span> Random</button>
          </div>
        </div>

        <div class="field name-field">
          <label class="field-label" for="theme-name">Name</label>
          <input id="theme-name" class="text-input" type="text" placeholder="mytheme" autocomplete="off"
                 aria-describedby="name-hint name-error" spellcheck="false" />
          <p id="name-hint" class="hint">2–30 chars · letters, digits, spaces, - and _</p>
          <p id="name-error" class="field-error" aria-live="polite"></p>
        </div>

        <h3 class="side-h">Change Colors</h3>
        <div class="color-grid">
          <div class="color-base">
            ${BASE_KEYS.map((k) => colorControlHTML(k)).join('')}
          </div>
          ${SEMANTIC_NAMES.map((n) => `
            <div class="color-pair">
              <span class="pair-name">${n[0].toUpperCase() + n.slice(1)}</span>
              ${colorControlHTML(`--color-${n}`)}${colorControlHTML(`--color-${n}-content`)}
            </div>`).join('')}
        </div>

        <h3 class="side-h">Radius</h3>
        ${RADIUS_GROUPS.map((g) => segRowHTML('radius', g, RADIUS_VALUES, radiusChipHTML)).join('')}

        <h3 class="side-h">Sizes</h3>
        ${SIZE_KINDS.map((k) => segRowHTML('size', k, SIZE_VALUES, (v) => `<span class="size-chip size-${k}-${v}"></span>`)).join('')}
        ${segRowHTML('border', 'width', BORDER_VALUES, (v) => `<span class="border-chip" style="height:${v}"></span>`)}

        <h3 class="side-h">Effects</h3>
        <div class="switch-row">${switchHTML('depth', 'Depth')}${switchHTML('noise', 'Noise')}</div>

        <h3 class="side-h">Options</h3>
        <div class="switch-col">
          ${switchHTML('defaultTheme', 'Default theme')}
          ${switchHTML('defaultDarkTheme', 'Default dark theme')}
          ${switchHTML('darkColorScheme', 'Dark color scheme')}
        </div>
        <button id="btn-reset" class="mini-btn" type="button">Reset tokens</button>

        <h3 class="side-h">Font Family</h3>
        <div class="seg" role="group" aria-label="Font family" data-seg="font">
          ${FONT_FAMILIES.map((f) => `<button class="seg-btn" type="button" data-font="${f.id}" aria-pressed="false" aria-label="Font family ${f.label}">${f.label}</button>`).join('')}
        </div>

        <h3 class="side-h">Contrast Matrix</h3>
        <div id="contrast-matrix" class="matrix" aria-live="off"></div>

        <div class="editor-actions">
          <button id="btn-css" class="primary-btn" type="button">CSS <span class="btn-sub">Artifact center</span></button>
        </div>
      </section>

      <section class="panel preview-panel" aria-labelledby="preview-h">
        <div class="preview-chrome">
          <h2 id="preview-h">Live Preview</h2>
          <div class="tabs" role="tablist" aria-label="Preview tabs">
            ${PREVIEW_TABS.map((t, i) => `<button class="tab" role="tab" type="button" id="tab-${t.id}" aria-selected="${i === 0}" aria-controls="tabpanel-${t.id}" tabindex="${i === 0 ? 0 : -1}" data-tab="${t.id}">${t.label}</button>`).join('')}
          </div>
          <div class="preview-tools">
            <label class="cb-label" for="cb-filter">Color blindness</label>
            <select id="cb-filter" class="cb-select">
              <option value="none">None</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
            <label class="compare-wrap">
              <button id="btn-compare" class="switch" role="switch" aria-checked="false" type="button" aria-label="Before and after compare"></button>
              <span>Before / After</span>
            </label>
            <button id="btn-snap" class="mini-btn" type="button">Save Snapshot</button>
          </div>
        </div>
        <div id="diff-callout" class="diff-callout" hidden>
          <p class="diff-title">Token diff vs snapshot</p>
          <ul id="diff-list"></ul>
        </div>
        <div class="preview-viewport">
          <div class="preview-stage" id="preview-stage" role="tabpanel" aria-labelledby="tab-demo">
            ${PREVIEW_TABS.map((t, i) => `<div class="pv-panel" data-panel="${t.id}" ${i === 0 ? '' : 'hidden'}>${t.html}</div>`).join('')}
          </div>
          <div class="preview-stage compare-stage" id="compare-stage" aria-hidden="true"></div>
        </div>
        <svg class="cb-defs" aria-hidden="true" focusable="false">
          <filter id="cb-prot"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>
          <filter id="cb-deut"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>
          <filter id="cb-trit"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>
        </svg>
      </section>
    </main>

    <div class="artifact-overlay" id="artifact-overlay" hidden>
      <div class="artifact" role="dialog" aria-modal="true" aria-labelledby="artifact-h">
        <div class="artifact-head">
          <h2 id="artifact-h">Artifact Center</h2>
          <button class="icon-btn" id="artifact-close" type="button" aria-label="Close artifact center">&#10005;</button>
        </div>
        <div class="artifact-tabs" role="tablist" aria-label="Artifact formats">
          <button class="tab" role="tab" type="button" id="atab-css" aria-selected="true" aria-controls="artifact-body" data-atab="css">CSS</button>
          <button class="tab" role="tab" type="button" id="atab-json" aria-selected="false" aria-controls="artifact-body" tabindex="-1" data-atab="json">JSON</button>
          <button class="tab" role="tab" type="button" id="atab-config" aria-selected="false" aria-controls="artifact-body" tabindex="-1" data-atab="config">Config</button>
        </div>
        <pre id="artifact-body" class="artifact-body" role="tabpanel" aria-labelledby="atab-css" tabindex="0"><code id="artifact-code"></code></pre>
        <div class="artifact-actions">
          <button id="btn-copy" class="mini-btn" type="button">Copy CSS</button>
          <button id="btn-download" class="mini-btn" type="button">Download theme.css</button>
        </div>
        <div class="import-block">
          <h3 class="side-h" id="import-h">Import Theme</h3>
          <label class="field-label" for="import-src">Declared-theme JSON</label>
          <textarea id="import-src" class="import-src" rows="5" aria-describedby="import-hint import-msg"
            placeholder='{"name":"my-theme","colors":{"--color-primary":"#4b28d7", ...},"radius":{...},"size":{...},"effects":{...},"options":{...},"generatedAt":"...Z"}'></textarea>
          <p id="import-hint" class="hint">Paste an exported theme JSON — the same request-body contract the JSON tab emits.</p>
          <ul id="import-msg" class="field-error-list" role="alert"></ul>
          <button id="btn-import" class="mini-btn" type="button">Import Theme</button>
        </div>
      </div>
    </div>

    <aside class="coachmark" id="coachmark" aria-label="Getting started">
      <p class="coach-title">New to the studio?</p>
      <p>Press <strong>Hold to add theme</strong>, edit tokens, then open the <strong>CSS</strong> button — the Artifact center exports your theme as CSS, JSON (the request body), or Config.</p>
      <button id="coach-dismiss" class="mini-btn" type="button">Got it</button>
    </aside>

    <div class="toast" id="toast" hidden></div>
    <p class="sr-live" id="sr-live" role="status" aria-live="polite"></p>
  </div>`;
}

// ------------------------------------------------------------- fragments ---
function themeRowHTML(t) {
  const chipLabel = `color preview for ${t.name}: ` + CHIP_KEYS.map((k, i) => `${k.replace('--color-', '')} ${t.colors[k]}`).join(', ');
  return `<li class="theme-row-wrap" data-row="${t.id}">
    <button class="theme-row" type="button" data-select="${t.id}" aria-pressed="${t.id === state.activeId}">
      <span class="chip" role="img" aria-label="${esc(chipLabel)}">${CHIP_KEYS.map((k) => `<i style="background:${t.colors[k]}"></i>`).join('')}</span>
      <span class="tname">${esc(t.name)}</span>
      <span class="active-mark" ${t.id === state.activeId ? '' : 'hidden'}>&#10003; Active</span>
    </button>
    ${t.builtin
      ? `<button class="row-remove row-remove-builtin" type="button" data-remove="${t.id}" aria-label="Remove ${esc(t.name)} (built-in)">Remove</button>`
      : `<button class="row-remove" type="button" data-remove="${t.id}" aria-label="Remove ${esc(t.name)}">Remove</button>`}
  </li>`;
}

function colorControlHTML(key) {
  const label = prettyToken(key);
  return `<span class="color-ctl">
    <input class="color-input" type="color" id="clr${key}" data-color="${key}" aria-label="${label} color" />
    <label class="color-label" for="clr${key}">${esc(label)}</label>
  </span>`;
}

function radiusChipHTML(v) {
  return `<span class="radius-chip" style="border-radius:${v}"></span>`;
}

function segRowHTML(kind, group, values, chipFn) {
  const label = kind === 'radius' ? `${group[0].toUpperCase() + group.slice(1)} radius`
    : kind === 'size' ? `${group[0].toUpperCase() + group.slice(1)} size` : 'Border width';
  return `<div class="ctl-row">
    <span class="ctl-label" id="lbl-${kind}-${group}">${label}</span>
    <div class="seg" role="group" aria-labelledby="lbl-${kind}-${group}" data-seg="${kind}" data-group="${group}">
      ${values.map((v) => `<button class="seg-btn" type="button" data-val="${v}" aria-pressed="false" aria-label="${label} ${v}">${chipFn(v)}</button>`).join('')}
    </div>
  </div>`;
}

function switchHTML(key, label) {
  return `<span class="switch-cell">
    <button class="switch" role="switch" aria-checked="false" type="button" id="sw-${key}" data-switch="${key}" aria-label="${label}"></button>
    <label class="switch-label" for="sw-${key}" id="swl-${key}">${label}</label>
  </span>`;
}

// ------------------------------------------------------------ rendering ----
let els = {};

function refreshThemeLists() {
  els.myCount.textContent = String(state.customs.length);
  const mine = state.customs.map((t) => themeRowHTML(t)).join('');
  const ghosts = [...leavingRows.values()].map((t) => `<li class="theme-row-wrap row-leaving" aria-hidden="true">
    <span class="theme-row theme-row-ghost"><span class="chip">${CHIP_KEYS.map((k) => `<i style="background:${t.colors[k]}"></i>`).join('')}</span>
    <span class="tname">${esc(t.name)}</span></span></li>`).join('');
  els.myThemes.innerHTML = state.customs.length || leavingRows.size
    ? mine + ghosts
    : `<li class="empty-state">Themes you create appear here.<br />Press and hold <strong>Hold to add theme</strong> for about three seconds, or fork a built-in by editing one of its tokens.</li>`;
  // built-in rows: refresh pressed state + chips only
  for (const t of BUILTINS) {
    const btn = $(`[data-select="${t.id}"]`, els.builtinThemes);
    if (!btn) continue;
    const on = t.id === state.activeId;
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-active', on);
    const mark = $('.active-mark', btn);
    if (mark) mark.hidden = !on;
  }
  for (const t of state.customs) {
    const btn = $(`[data-select="${t.id}"]`, els.myThemes);
    if (!btn) continue;
    const on = t.id === state.activeId;
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-active', on);
    const mark = $('.active-mark', btn);
    if (mark) mark.hidden = !on;
  }
  els.snapCount.textContent = String(state.snapshots.length);
  els.snapList.innerHTML = state.snapshots.length
    ? state.snapshots.map((s) => `<li class="theme-row-wrap">
        <button class="theme-row snap-row" type="button" data-snap="${s.id}" aria-label="Restore snapshot ${esc(s.name)}">
          <span class="chip" role="img" aria-label="snapshot color preview">${CHIP_KEYS.map((k) => `<i style="background:${s.tokens.colors[k]}"></i>`).join('')}</span>
          <span class="tname">${esc(s.name)}</span>
        </button></li>`).join('')
    : `<li class="empty-state empty-state-sm">No snapshots yet — save one to compare before/after edits.</li>`;
}

function refreshEditorControls() {
  const t = activeTheme();
  if (document.activeElement !== els.nameInput) els.nameInput.value = t.builtin ? '' : t.name;
  setNameError('');
  for (const key of COLOR_KEYS) {
    const input = $(`[data-color="${key}"]`);
    if (input) input.value = t.colors[key];
  }
  for (const g of RADIUS_GROUPS) syncSeg('radius', g, t.radius[g]);
  for (const k of SIZE_KINDS) syncSeg('size', k, t.size[k]);
  syncSeg('border', 'width', t.border);
  for (const f of FONT_FAMILIES) {
    const b = $(`[data-font="${f.id}"]`);
    if (b) b.setAttribute('aria-pressed', String(t.fontFamily === f.id));
  }
  setSwitch('depth', t.depth === 1);
  setSwitch('noise', t.noise === 1);
  setSwitch('defaultTheme', !!t.options.defaultTheme);
  setSwitch('defaultDarkTheme', !!t.options.defaultDarkTheme);
  setSwitch('darkColorScheme', !!t.options.darkColorScheme);
  els.undoBtn.disabled = !state.past.length;
  els.redoBtn.disabled = !state.future.length;
}

function syncSeg(kind, group, value) {
  const seg = $(`.seg[data-seg="${kind}"][data-group="${group}"]`);
  if (!seg) return;
  for (const b of $$('.seg-btn', seg)) {
    const on = b.dataset.val === value;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('is-on', on);
  }
}

function setSwitch(key, on) {
  const sw = $(`#sw-${key}`);
  if (!sw) return;
  sw.setAttribute('aria-checked', String(!!on));
  sw.classList.toggle('is-on', !!on);
}

function setNameError(msg) {
  els.nameError.textContent = msg;
  els.nameInput.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

// --------------------------------------------------------- live surfaces ---
function stageVars(t) {
  const v = {};
  for (const key of COLOR_KEYS) v[key] = t.colors[key];
  v['--radius-box'] = t.radius.box;
  v['--radius-field'] = t.radius.field;
  v['--radius-selector'] = t.radius.selector;
  v['--size-field'] = FIELD_HEIGHT[t.size.field];
  v['--size-selector'] = SELECTOR_SIZE[t.size.selector];
  v['--border'] = t.border;
  v['--depth'] = String(t.depth);
  v['--noise'] = String(t.noise);
  v['--noise-tex'] = t.noise ? NOISE_TEX : 'none';
  v['--font'] = FONT_FAMILIES.find((f) => f.id === t.fontFamily)?.css || FONT_FAMILIES[0].css;
  v['color-scheme'] = t.options.darkColorScheme ? 'dark' : 'light';
  return Object.entries(v).map(([k, val]) => `${k}:${val}`).join(';');
}

function updateSurfaces() {
  const t = activeTheme();
  els.stage.setAttribute('style', stageVars(t));
  // row chips (custom + builtin) follow live token values
  for (const th of [...state.customs, ...BUILTINS]) {
    const row = $(`[data-select="${th.id}"]`);
    if (!row) continue;
    $$('.chip i', row).forEach((el, i) => { el.style.background = th.colors[CHIP_KEYS[i]]; });
    const chip = $('.chip', row);
    if (chip) chip.setAttribute('aria-label', `color preview for ${th.name}: ` + CHIP_KEYS.map((k) => `${k.replace('--color-', '')} ${th.colors[k]}`).join(', '));
  }
  updateMatrix(t);
  updatePalette(t);
  updateArtifactText();
  updateDiffCallout();
  if (state.compareOn) refreshCompareStage();
  els.undoBtn.disabled = !state.past.length;
  els.redoBtn.disabled = !state.future.length;
}

function updateMatrix(t) {
  const pairs = SEMANTIC_NAMES.map((n) => ({ label: n[0].toUpperCase() + n.slice(1), face: t.colors[`--color-${n}`], content: t.colors[`--color-${n}-content`] }));
  pairs.unshift({ label: 'Base', face: t.colors['--color-base-100'], content: t.colors['--color-base-content'] });
  els.matrix.innerHTML = pairs.map((p) => {
    const ratio = contrastOf(p.face, p.content);
    return `<div class="cm-row">
      <span class="cm-name">${p.label}</span>
      <span class="cm-sample" style="background:${p.face};color:${p.content}">Aa</span>
      <span class="cm-ratio">${ratio.toFixed(2)}:1</span>
      <span class="cm-badge ${ratio >= 4.5 ? 'cm-pass' : 'cm-fail'}">AA ${ratio >= 4.5 ? '&#10003;' : '&#10005;'}</span>
      <span class="cm-badge ${ratio >= 7 ? 'cm-pass' : 'cm-fail'}">AAA ${ratio >= 7 ? '&#10003;' : '&#10005;'}</span>
    </div>`;
  }).join('');
}

function contrastOf(a, b) {
  const lum = (hex) => {
    const n = parseInt(String(hex).replace('#', ''), 16);
    const c = (s) => { const v = ((n >> s) & 255) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * c(16) + 0.7152 * c(8) + 0.0722 * c(0);
  };
  const l1 = lum(a); const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function updatePalette(t) {
  for (const el of $$('.pv-swatch', els.stage)) {
    const key = el.dataset.swatch;
    const chip = $('.pv-swatch-chip', el);
    const hex = $('.pv-swatch-hex', el);
    if (chip) chip.style.background = t.colors[key];
    if (hex) hex.textContent = t.colors[key];
  }
  for (const el of $$('[data-node]', els.stage)) {
    el.style.fill = t.colors[`--color-${el.dataset.node}`];
  }
  const base = $('.pv-diagram-base', els.stage);
  if (base) base.style.fill = t.colors['--color-base-200'];
}

const FMT_LABEL = { css: 'CSS', json: 'JSON', config: 'Config' };
function artifactText(fmt) {
  const t = activeTheme();
  if (fmt === 'css') return toCSS(t);
  if (fmt === 'json') return JSON.stringify(toJSON(t), null, 2);
  return toConfig(t);
}

function updateArtifactText() {
  if (!state.artifactOpen) return;
  els.artifactCode.textContent = artifactText(state.artifactTab);
}

function updateDiffCallout() {
  const diffs = state.compareOn ? diffAgainstSnapshot() : [];
  els.diffCallout.hidden = !(state.compareOn && diffs.length);
  els.diffList.innerHTML = diffs.slice(0, 8).map((d) =>
    `<li><code>${esc(d.token)}</code> <span class="diff-arrow">${esc(d.from)} &#8594; ${esc(d.to)}</span></li>`).join('')
    + (diffs.length > 8 ? `<li>…and ${diffs.length - 8} more token${diffs.length - 8 > 1 ? 's' : ''}</li>` : '');
}

// ------------------------------------------------------------ overlays -----
let lastOverlayOpener = null;

function openArtifact(tab = state.artifactTab, { focus = true } = {}) {
  state.artifactTab = tab;
  state.artifactOpen = true;
  syncArtifactTabs();
  els.artifactCode.textContent = artifactText(tab);
  els.overlay.hidden = false;
  document.body.classList.add('modal-open');
  if (focus) {
    lastOverlayOpener = document.activeElement;
    $(`#atab-${tab}`)?.focus();
  }
}

function closeArtifact() {
  state.artifactOpen = false;
  els.overlay.hidden = true;
  document.body.classList.remove('modal-open');
  (lastOverlayOpener || els.cssBtn)?.focus?.();
  lastOverlayOpener = null;
}

function syncArtifactTabs() {
  for (const b of $$('.artifact-tabs .tab')) {
    const on = b.dataset.atab === state.artifactTab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  }
  els.artifactBody.setAttribute('aria-labelledby', `atab-${state.artifactTab}`);
  const lbl = FMT_LABEL[state.artifactTab];
  els.copyBtn.textContent = `Copy ${lbl}`;
  els.downloadBtn.textContent = state.artifactTab === 'css' ? 'Download theme.css'
    : state.artifactTab === 'json' ? 'Download theme.json' : 'Download theme.config.json';
}

let toastTimer = null;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  els.toast.classList.add('show');
  els.srLive.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.classList.remove('show'); setTimeout(() => { els.toast.hidden = true; }, 220); }, 1800);
}

// ------------------------------------------------------------- dropdowns ---
function closeAllMenus(except) {
  for (const dd of $$('.dd')) {
    if (dd === except) continue;
    const menu = $('.dd-menu', dd);
    const trig = $('.dd-trigger', dd);
    if (menu && !menu.hidden) { menu.hidden = true; trig.setAttribute('aria-expanded', 'false'); }
  }
}

function toggleMenu(dd, open) {
  const menu = $('.dd-menu', dd);
  const trig = $('.dd-trigger', dd);
  const willOpen = open ?? menu.hidden;
  closeAllMenus(willOpen ? dd : null);
  menu.hidden = !willOpen;
  trig.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) {
    menu.classList.add('menu-in');
    $('.dd-item', menu)?.focus();
  }
}

// --------------------------------------------------------- hold to add -----
const HOLD_MS = 3000;
let holdRaf = 0;
let holdStart = 0;
let holding = false;

function holdTick() {
  const p = Math.min(1, (performance.now() - holdStart) / HOLD_MS);
  els.holdFill.style.width = `${(p * 100).toFixed(1)}%`;
  els.holdBtn.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  if (p >= 1) {
    finishHold(true);
    return;
  }
  holdRaf = requestAnimationFrame(holdTick);
}

function startHold(e) {
  if (holding) return;
  holding = true;
  holdStart = performance.now();
  els.holdBtn.classList.add('holding');
  try { e?.preventDefault?.(); } catch { /* noop */ }
  holdRaf = requestAnimationFrame(holdTick);
}

function cancelHold() {
  if (!holding) return;
  holding = false;
  cancelAnimationFrame(holdRaf);
  els.holdBtn.classList.remove('holding');
  els.holdFill.style.width = '0%';
  els.holdBtn.setAttribute('aria-valuenow', '0');
}

function finishHold(completed) {
  if (!holding) return;
  holding = false;
  cancelAnimationFrame(holdRaf);
  els.holdBtn.classList.remove('holding');
  els.holdBtn.classList.add('hold-done');
  setTimeout(() => els.holdBtn.classList.remove('hold-done'), 500);
  els.holdFill.style.width = '0%';
  els.holdBtn.setAttribute('aria-valuenow', '0');
  if (completed) {
    const res = createTheme(uniqueName('my-theme'));
    if (res.ok) {
      showToast(`Theme added — ${res.theme.name}`);
      const row = $(`[data-row="${res.theme.id}"]`);
      row?.classList.add('row-pop');
    }
  }
}

// ----------------------------------------------------------- comparison ----
function setCompare(on) {
  state.compareOn = !!on;
  if (on && !state.snapshots.length) {
    const snap = saveSnapshot();
    showToast(`Snapshot saved — ${snap.name}`);
  }
  els.compareBtn.setAttribute('aria-checked', String(state.compareOn));
  els.compareBtn.classList.toggle('is-on', state.compareOn);
  if (state.compareOn) refreshCompareStage();
  els.viewport.classList.toggle('compare-on', state.compareOn);
  updateDiffCallout();
}

function refreshCompareStage() {
  const snap = state.snapshots[state.snapshots.length - 1];
  if (!snap) return;
  els.compareStage.innerHTML = els.stage.innerHTML;
  const fake = { ...activeTheme(), ...snap.tokens, colors: snap.tokens.colors, radius: snap.tokens.radius, size: snap.tokens.size, options: snap.tokens.options };
  els.compareStage.setAttribute('style', stageVars(fake));
  for (const el of $$('.pv-swatch', els.compareStage)) {
    const key = el.dataset.swatch;
    $('.pv-swatch-chip', el)?.setAttribute('style', `background:${fake.colors[key]}`);
    const hex = $('.pv-swatch-hex', el);
    if (hex) hex.textContent = fake.colors[key];
  }
  for (const el of $$('[data-node]', els.compareStage)) el.style.fill = fake.colors[`--color-${el.dataset.node}`];
}

// --------------------------------------------------------------- wiring ----
export function initUI() {
  buildShell();
  els = {
    shell: $('.shell'),
    myThemes: $('#my-themes'), myCount: $('#my-count'),
    builtinThemes: $('#builtin-themes'),
    snapList: $('#snapshot-list'), snapCount: $('#snap-count'),
    nameInput: $('#theme-name'), nameError: $('#name-error'),
    undoBtn: $('#btn-undo'), redoBtn: $('#btn-redo'), randomBtn: $('#btn-random'),
    resetBtn: $('#btn-reset'), cssBtn: $('#btn-css'),
    matrix: $('#contrast-matrix'),
    stage: $('#preview-stage'), compareStage: $('#compare-stage'), viewport: $('.preview-viewport'),
    compareBtn: $('#btn-compare'), snapBtn: $('#btn-snap'), diffCallout: $('#diff-callout'), diffList: $('#diff-list'),
    cbFilter: $('#cb-filter'),
    holdBtn: $('#hold-add'), holdFill: $('#hold-add .hold-fill'),
    overlay: $('#artifact-overlay'), artifactBody: $('#artifact-body'), artifactCode: $('#artifact-code'),
    copyBtn: $('#btn-copy'), downloadBtn: $('#btn-download'),
    importSrc: $('#import-src'), importMsg: $('#import-msg'), importBtn: $('#btn-import'),
    toast: $('#toast'), srLive: $('#sr-live'), coach: $('#coachmark'),
  };
  els.holdBtn.setAttribute('role', 'button');
  els.holdBtn.setAttribute('aria-label', 'Hold to add theme — press and hold for three seconds');

  subscribe((event) => {
    if (event === 'structure') {
      refreshThemeLists();
      refreshEditorControls();
    }
    if (event === 'tokens') {
      refreshEditorControls();
    }
    updateSurfaces();
  });

  wireChrome();
  wireThemeLists();
  wireEditor();
  wirePreview();
  wireArtifact();
  wireHold();
  wireCoach();
  wireShortcuts();

  loadFromHash();
  refreshThemeLists();
  refreshEditorControls();
  updateSurfaces();
  syncHash();
  watchHash();
  document.documentElement.classList.add('app-ready');
}

function wireChrome() {
  document.addEventListener('click', (e) => {
    const inert = e.target.closest('[data-inert]');
    if (inert) e.preventDefault();
    if (!e.target.closest('.dd')) closeAllMenus();
  });
  for (const dd of $$('.dd')) {
    const trig = $('.dd-trigger', dd);
    const menu = $('.dd-menu', dd);
    trig.addEventListener('click', () => toggleMenu(dd));
    trig.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); toggleMenu(dd, true); }
    });
    menu.addEventListener('keydown', (e) => {
      const items = $$('.dd-item', menu);
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape') { toggleMenu(dd, false); trig.focus(); }
      else if (e.key === 'Tab') { toggleMenu(dd, false); }
    });
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.dd-item');
      if (!item) return;
      if (item.dataset.version) {
        state.version = item.dataset.version;
        $('.dd[data-dd="version"] .dd-label').textContent = state.version;
        $$('.dd-item', menu).forEach((b) => { b.innerHTML = b.dataset.version + (b.dataset.version === state.version ? ' <span class="dd-cur">&#10003; current</span>' : ''); });
      }
      if (item.dataset.site) {
        state.siteTheme = item.dataset.site;
        els.shell.dataset.siteTheme = state.siteTheme;
        $('.dd[data-dd="site"] .dd-label').textContent = state.siteTheme === 'dark' ? 'Dark' : 'Light';
        $$('.dd-item', menu).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.site === state.siteTheme)));
      }
      if (item.dataset.lang) {
        state.language = item.dataset.lang;
        $('.dd[data-dd="lang"] .dd-label').textContent = state.language;
        $$('.dd-item', menu).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lang === state.language)));
      }
      toggleMenu(dd, false);
      trig.focus();
    });
  }
}

function wireThemeLists() {
  document.addEventListener('click', (e) => {
    const sel = e.target.closest('[data-select]');
    if (sel && !e.target.closest('[data-remove]')) {
      selectTheme(sel.dataset.select);
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const id = rm.dataset.remove;
      const t = [...BUILTINS, ...state.customs].find((x) => x.id === id);
      const res = removeTheme(id);
      if (!res.ok && t?.builtin) showToast(`${t.name} is a built-in theme and can’t be removed`);
      else if (res.ok) showToast(`Removed ${res.theme.name}`);
      return;
    }
    const snap = e.target.closest('[data-snap]');
    if (snap) {
      restoreSnapshotTokens(snap.dataset.snap);
      showToast('Snapshot tokens restored');
    }
  });
}

let renameTimer = 0;
function wireEditor() {
  // name field: live validation, debounced commit on input, commit on blur/Enter
  els.nameInput.addEventListener('input', () => {
    const check = validateRename(els.nameInput.value);
    setNameError(check.ok ? '' : check.error);
    clearTimeout(renameTimer);
    if (check.ok && check.value !== activeTheme().name) {
      renameTimer = setTimeout(() => {
        const c = renameActive(els.nameInput.value);
        if (c.ok) els.nameInput.value = c.value;
      }, 450);
    }
  });
  els.nameInput.addEventListener('change', () => {
    clearTimeout(renameTimer);
    const c = renameActive(els.nameInput.value);
    setNameError(c.ok ? '' : c.error);
    if (c.ok) els.nameInput.value = c.value;
  });
  els.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); els.nameInput.blur(); }
  });

  // color pickers: live update + history bookends per gesture
  let colorPending = null;
  document.addEventListener('focusin', (e) => {
    if (e.target.matches?.('[data-color]')) colorPending = snapshotState();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.activeElement && document.activeElement.matches('[data-color]')) {
      e.preventDefault();
      document.activeElement.blur();
    }
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest?.('[data-color]');
    if (el) {
      const wasBuiltin = activeTheme().builtin;
      setColor(el.dataset.color, el.value);
      if (wasBuiltin && colorPending) {
        const snap = snapshotState();
        colorPending.customs = snap.customs;
        colorPending.activeId = snap.activeId;
      }
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest?.('[data-color]');
    if (el && colorPending) {
      pushExternalHistory(colorPending);
      colorPending = null;
    }
  });

  // segmented radius/size/border + font selectors with arrow-key stepping
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    const seg = btn.closest('.seg');
    if (btn.getAttribute('aria-pressed') === 'true') return;
    applySeg(seg, btn.dataset);
  });
  document.addEventListener('keydown', (e) => {
    const btn = e.target.closest?.('.seg-btn');
    if (!btn) return;
    const seg = btn.closest('.seg');
    const btns = $$('.seg-btn', seg);
    const i = btns.indexOf(btn);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = (i + 1) % btns.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = (i - 1 + btns.length) % btns.length;
    if (next >= 0) {
      e.preventDefault();
      btns[next].focus();
      if (btns[next].getAttribute('aria-pressed') !== 'true') applySeg(seg, btns[next].dataset);
    }
  });

  function applySeg(seg, data) {
    pushExternalHistory(snapshotState());
    if (seg.dataset.seg === 'radius') setRadius(seg.dataset.group, data.val);
    else if (seg.dataset.seg === 'size') setSize(seg.dataset.group, data.val);
    else if (seg.dataset.seg === 'border') setBorder(data.val);
    else if (seg.dataset.seg === 'font') setFontFamily(data.font);
    els.undoBtn.disabled = false;
  }

  document.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-switch]');
    if (sw) {
      const key = sw.dataset.switch;
      const next = sw.getAttribute('aria-checked') !== 'true';
      pushExternalHistory(snapshotState());
      if (key === 'depth') setEffect('depth', next);
      else if (key === 'noise') setEffect('noise', next);
      else setOption(key, next);
      return;
    }
    if (e.target.closest('#btn-undo')) { undo(); return; }
    if (e.target.closest('#btn-redo')) { redo(); return; }
    if (e.target.closest('#btn-random')) {
      randomize();
      els.randomBtn.classList.remove('spin');
      void els.randomBtn.offsetWidth;
      els.randomBtn.classList.add('spin');
      return;
    }
    if (e.target.closest('#btn-reset')) {
      if (resetActive()) showToast('Tokens reset to defaults');
      else showToast('Built-in themes are already pristine');
      return;
    }
    if (e.target.closest('#btn-css')) { openArtifact('css'); return; }
    if (e.target.closest('#btn-snap')) {
      const s = saveSnapshot();
      showToast(`Snapshot saved — ${s.name}`);
      return;
    }
    if (e.target.closest('#btn-compare')) {
      setCompare(!state.compareOn);
      return;
    }
  });
}

function wirePreview() {
  const tablist = $('.tabs[role="tablist"]');
  const tabs = $$('.tab', tablist);
  const activateTab = (tab) => {
    state.previewTab = tab.dataset.tab;
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    }
    for (const p of $$('.pv-panel', els.stage)) p.hidden = p.dataset.panel !== state.previewTab;
    els.stage.setAttribute('aria-labelledby', tab.id);
  };
  tablist.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) { activateTab(tab); tab.focus(); }
  });
  tablist.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) { e.preventDefault(); activateTab(tabs[next]); tabs[next].focus(); }
  });

  els.cbFilter.addEventListener('change', () => {
    state.colorBlind = els.cbFilter.value;
    els.viewport.dataset.cb = state.colorBlind;
  });

  // range output feedback inside the demo tab
  document.addEventListener('input', (e) => {
    if (e.target.matches?.('.pv-range-input')) {
      const out = e.target.closest('.pv-range')?.querySelector('.pv-range-out');
      if (out) out.textContent = `${e.target.value}%`;
    }
  });
}

function wireArtifact() {
  const atabs = $$('.artifact-tabs .tab');
  const activateATab = (tab) => {
    state.artifactTab = tab.dataset.atab;
    syncArtifactTabs();
    updateArtifactText();
  };
  $('.artifact-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) { activateATab(tab); tab.focus(); }
  });
  $('.artifact-tabs').addEventListener('keydown', (e) => {
    const i = atabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % atabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + atabs.length) % atabs.length;
    if (next >= 0) { e.preventDefault(); activateATab(atabs[next]); atabs[next].focus(); }
  });

  $('#artifact-close').addEventListener('click', closeArtifact);
  els.overlay.addEventListener('mousedown', (e) => { if (e.target === els.overlay) closeArtifact(); });
  els.overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeArtifact(); return; }
    if (e.key !== 'Tab') return;
    const focusables = $$('button, [href], textarea, [tabindex]:not([tabindex="-1"])', $('.artifact')).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  els.copyBtn.addEventListener('click', () => copyArtifact(state.artifactTab));
  els.downloadBtn.addEventListener('click', () => downloadArtifact(state.artifactTab));

  els.importBtn.addEventListener('click', () => {
    const res = importFromText(els.importSrc.value);
    if (res.ok) {
      els.importMsg.innerHTML = '';
      els.importSrc.value = '';
      showToast(`Imported ${res.theme.name}`);
    } else {
      els.importMsg.innerHTML = res.errors.map((er) => `<li>${esc(er)}</li>`).join('');
    }
  });
}

export async function copyArtifact(fmt) {
  const text = artifactText(fmt);
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      ta.remove();
    } catch { ok = false; }
  }
  showToast(`${FMT_LABEL[fmt]} copied to clipboard`);
  return ok;
}

export function downloadArtifact(fmt) {
  const text = artifactText(fmt);
  const fname = fmt === 'css' ? 'theme.css' : fmt === 'json' ? 'theme.json' : 'theme.config.json';
  const type = fmt === 'css' ? 'text/css' : 'application/json';
  try {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Downloaded ${fname}`);
  } catch {
    showToast('Download unavailable in this browser');
  }
}

function wireHold() {
  const btn = els.holdBtn;
  btn.addEventListener('pointerdown', (e) => { if (e.button === 0 || e.pointerType !== 'mouse') startHold(e); });
  btn.addEventListener('pointerup', () => { holding && (performance.now() - holdStart >= HOLD_MS ? finishHold(true) : (cancelHold(), 0)); });
  btn.addEventListener('pointerleave', cancelHold);
  btn.addEventListener('pointercancel', cancelHold);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); startHold(null); }
  });
  btn.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cancelHold(); }
  });
}

function wireCoach() {
  $('#coach-dismiss').addEventListener('click', () => { els.coach.hidden = true; });
}

function wireShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) { if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { e.preventDefault(); undo(); } }
    else if ((key === 'z' && e.shiftKey) || key === 'y') { if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { e.preventDefault(); redo(); } }
  });
}

export { openArtifact, closeArtifact, showToast };
