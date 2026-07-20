// COMBINED PATCH SCRIPT

window.webmcp_session_info = function() {
    return {
        contract_version: "zto-webmcp-v1",
        modules: [
            "structured-editor-v1",
            "entity-collection-v1",
            "artifact-transfer-v1"
        ]
    };
};

window.webmcp_list_tools = function() {
    return {
        tools: [
            { name: "editor_select" },
            { name: "editor_update_property" },
            { name: "editor_preview" },
            { name: "entity_create" },
            { name: "entity_select" },
            { name: "entity_update" },
            { name: "entity_delete" },
            { name: "artifact_export" },
            { name: "artifact_import" },
            { name: "artifact_copy" },
            { name: "artifact_convert" }
        ]
    };
};

function setInput(el, val) {
    if (!el) return;
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// The color swatches under "Change Colors" open a <dialog> with Palette /
// Picker tabs; the Picker tab's plain text input accepts both oklch() and
// #RRGGBB strings and commits on Enter. There is no native
// input[type=color] anywhere in this app, so that's the only real path to
// change a color token through the UI.
async function setThemeColor(key, value) {
    const swatchBtn = document.querySelector(`button[aria-label^="Choose --color-${key}:"]`);
    if (!swatchBtn) return false;
    swatchBtn.click();
    await wait(150);
    const dialog = Array.from(document.querySelectorAll('dialog')).find(d => d.hasAttribute('open'));
    if (!dialog) return false;
    const pickerTab = dialog.querySelectorAll('.tabs label.tab')[1];
    if (pickerTab) {
        pickerTab.click();
        await wait(100);
    }
    const textInput = dialog.querySelector('input[type="text"]');
    if (!textInput) return false;
    setInput(textInput, value);
    textInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait(100);
    return true;
}

window.webmcp_invoke_tool = async function(toolName, args) {
    try {
        if (toolName === 'entity_create') {
            // The hold-to-add control only listens for mousedown/touchstart
            // paired with mouseup/touchend after a sustained ~3s press - it
            // has no click listener at all, so a bare click() is a silent
            // no-op. Gesture/timing fidelity is Playwright's job per the
            // module bindings ("Hold-to-add press timing stays Playwright
            // when mechanism matters"), but WebMCP still has to land the
            // real state change, so hold long enough to clear the threshold.
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Hold to add'));
            if (!btn) return { status: "error", error: "Hold to add theme control not found" };
            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            await wait(3300);
            btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            return { status: "success", result: {} };
        }
        if (toolName === 'editor_update_property') {
            if (args && args.property === 'color' && args.key) {
                const applied = await setThemeColor(args.key, args.value);
                if (!applied) return { status: "error", error: `Color control for ${args.key} not found` };
                return { status: "success", result: {} };
            }
            return { status: "error", error: `Unsupported editor_update_property property: ${args && args.property}` };
        }
        return { status: "error", error: `Unsupported tool: ${toolName}` };
    } catch (e) {
        return { status: "error", error: e.message };
    }
};

// Accessibility fixes
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (window._lastOpener) {
        window._lastOpener.focus();
    }
  }
});
document.addEventListener('click', (e) => {
    if (e.target.closest('button, summary')) {
        window._lastOpener = e.target.closest('button, summary');
    }
});

const style = document.createElement('style');
style.innerHTML = `
  .theme-generator input[type="color"]:focus {
    outline: 2px solid currentColor !important;
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
      * {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
      }
  }
`;
document.head.appendChild(style);

// ---------------------------------------------------------------------
// The live preview's resolved theme lives as inline CSS custom properties
// (colors, radius, size, border, depth, noise) on a single element - the
// only element on the page whose style attribute carries `--color-base-100`.
// Undo/redo, snapshot/compare, and the contrast matrix all read/derive from
// this element instead of guessing at component internals.
// ---------------------------------------------------------------------
function getPreviewRoot() {
    return document.querySelector('[style*="--color-base-100"]');
}

function parseStyleMap(styleText) {
    const map = {};
    if (!styleText) return map;
    styleText.split(';').forEach(decl => {
        const idx = decl.indexOf(':');
        if (idx === -1) return;
        const key = decl.slice(0, idx).trim();
        const val = decl.slice(idx + 1).trim();
        if (key) map[key] = val;
    });
    return map;
}

// ---- Undo / Redo -------------------------------------------------------
const tokenHistory = {
    undoStack: [],
    redoStack: [],
    applying: false,
    lastStyle: null,
    pendingBefore: null,
    debounceTimer: null,
};
let undoBtnRef = null;
let redoBtnRef = null;

function refreshUndoRedoButtons() {
    if (undoBtnRef) undoBtnRef.disabled = tokenHistory.undoStack.length === 0;
    if (redoBtnRef) redoBtnRef.disabled = tokenHistory.redoStack.length === 0;
}

function initTokenHistory() {
    const root = getPreviewRoot();
    if (!root) return;
    tokenHistory.lastStyle = root.getAttribute('style');
    const historyObserver = new MutationObserver(() => {
        if (tokenHistory.applying) return;
        const current = root.getAttribute('style');
        if (current === tokenHistory.lastStyle) return;
        if (tokenHistory.pendingBefore === null) {
            tokenHistory.pendingBefore = tokenHistory.lastStyle;
        }
        tokenHistory.lastStyle = current;
        clearTimeout(tokenHistory.debounceTimer);
        // Coalesce a burst of rapid mutations (e.g. a slider drag) into a
        // single undo step, matching one logical edit.
        tokenHistory.debounceTimer = setTimeout(() => {
            if (tokenHistory.pendingBefore !== null && tokenHistory.pendingBefore !== tokenHistory.lastStyle) {
                tokenHistory.undoStack.push(tokenHistory.pendingBefore);
                if (tokenHistory.undoStack.length > 50) tokenHistory.undoStack.shift();
                tokenHistory.redoStack.length = 0;
            }
            tokenHistory.pendingBefore = null;
            refreshUndoRedoButtons();
        }, 400);
    });
    historyObserver.observe(root, { attributes: true, attributeFilter: ['style'] });
}

// Restores color and radius tokens that differ between the current preview
// state and a target snapshot by driving the same real controls a user
// would (the color dialog, the radius radios) so editor swatches, preview,
// and artifact text all stay in sync - a DOM-only style swap would only
// affect this one element. Other tokens (size/border/depth/noise/font)
// have no safe, non-gesture control path and are left untouched.
async function applyStyleSnapshot(targetStyleText) {
    const root = getPreviewRoot();
    if (!root || !targetStyleText) return;
    const targetMap = parseStyleMap(targetStyleText);
    const currentMap = parseStyleMap(root.getAttribute('style'));
    tokenHistory.applying = true;
    try {
        for (const key of Object.keys(targetMap)) {
            if (targetMap[key] === currentMap[key]) continue;
            if (key.startsWith('--color-')) {
                await setThemeColor(key.slice('--color-'.length), targetMap[key]);
            } else if (key.startsWith('--radius-')) {
                const radio = document.querySelector(`input[type="radio"][name="${key}"][value="${targetMap[key]}"]`);
                if (radio) radio.click();
            }
        }
    } finally {
        // The color dialog's commit doesn't land on the preview element
        // synchronously with the Enter keydown - give the app's own
        // reactivity time to actually apply it before re-enabling history
        // capture, or this restoration gets misrecorded as a fresh edit and
        // wipes the redo stack it just populated.
        await wait(900);
        const freshRoot = getPreviewRoot();
        tokenHistory.lastStyle = freshRoot ? freshRoot.getAttribute('style') : null;
        tokenHistory.applying = false;
    }
}

async function undoToken() {
    if (!tokenHistory.undoStack.length) return;
    const root = getPreviewRoot();
    const current = root ? root.getAttribute('style') : null;
    const prev = tokenHistory.undoStack.pop();
    tokenHistory.redoStack.push(current);
    refreshUndoRedoButtons();
    await applyStyleSnapshot(prev);
    refreshUndoRedoButtons();
}

async function redoToken() {
    if (!tokenHistory.redoStack.length) return;
    const root = getPreviewRoot();
    const current = root ? root.getAttribute('style') : null;
    const next = tokenHistory.redoStack.pop();
    tokenHistory.undoStack.push(current);
    refreshUndoRedoButtons();
    await applyStyleSnapshot(next);
    refreshUndoRedoButtons();
}

// ---- Snapshot / Before-After compare -----------------------------------
// A single named snapshot slot (not a saved-rows list): captures the full
// resolved style string and, on Compare, swaps it onto the preview element
// directly (no app-state mutation, so live edits are preserved underneath),
// restoring the live snapshot when Compare is turned back off.
const compareState = { snapshotStyle: null, liveStyleCache: null, active: false };

function takeSnapshot() {
    const root = getPreviewRoot();
    if (!root) return;
    compareState.snapshotStyle = root.getAttribute('style');
}

function setCompare(active) {
    const root = getPreviewRoot();
    if (!root) return;
    tokenHistory.applying = true;
    if (active) {
        if (!compareState.snapshotStyle) {
            tokenHistory.applying = false;
            return;
        }
        compareState.liveStyleCache = root.getAttribute('style');
        root.setAttribute('style', compareState.snapshotStyle);
        compareState.active = true;
    } else {
        if (compareState.liveStyleCache) {
            root.setAttribute('style', compareState.liveStyleCache);
        }
        compareState.active = false;
    }
    // MutationObserver delivers records as a microtask; wait past it before
    // re-enabling history capture so this preview-only swap isn't recorded
    // as a token edit.
    setTimeout(() => {
        const freshRoot = getPreviewRoot();
        tokenHistory.lastStyle = freshRoot ? freshRoot.getAttribute('style') : null;
        tokenHistory.applying = false;
    }, 50);
}

// ---- Color blindness filter + font family --------------------------------
function injectGlobalPatchStyles() {
    if (document.getElementById('patch-global-style')) return;
    const globalStyle = document.createElement('style');
    globalStyle.id = 'patch-global-style';
    globalStyle.textContent = `
        :root { --patch-cb-filter: none; --patch-font-family: inherit; }
        [style*="--color-base-100"] {
            filter: var(--patch-cb-filter, none);
            font-family: var(--patch-font-family, inherit);
            transition: filter 0.3s ease;
        }
    `;
    document.head.appendChild(globalStyle);

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.innerHTML = `
        <filter id="patch-cb-protanopia" color-interpolation-filters="linearRGB">
            <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/>
        </filter>
        <filter id="patch-cb-deuteranopia" color-interpolation-filters="linearRGB">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/>
        </filter>
        <filter id="patch-cb-tritanopia" color-interpolation-filters="linearRGB">
            <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/>
        </filter>
    `;
    document.body.appendChild(svg);
}

function setColorBlindFilter(mode) {
    const map = {
        None: 'none',
        Protanopia: 'url(#patch-cb-protanopia)',
        Deuteranopia: 'url(#patch-cb-deuteranopia)',
        Tritanopia: 'url(#patch-cb-tritanopia)',
    };
    document.documentElement.style.setProperty('--patch-cb-filter', map[mode] || 'none');
}

let selectedFontFamily = null;
const FONT_STACKS = {
    Outfit: '"Outfit", sans-serif',
    'system-ui': 'system-ui, sans-serif',
    monospace: 'ui-monospace, monospace',
    serif: 'Georgia, serif',
};
function setFontFamily(name) {
    selectedFontFamily = name;
    document.documentElement.style.setProperty('--patch-font-family', FONT_STACKS[name] || 'inherit');
}

// ---- Contrast matrix -----------------------------------------------------
// Resolves each oklch() custom property to sRGB via the browser's own color
// engine rather than reimplementing oklch math. getComputedStyle(...).color
// now echoes back the original color function (e.g. "oklch(1 0 0)") instead
// of normalizing to rgb(), so parse it with a 2D canvas instead: fillStyle
// accepts any CSS color syntax, and getImageData always reads back plain
// sRGB 0-255 bytes regardless of the input color space.
function resolveToRgb(colorStr) {
    if (!colorStr) return null;
    const canvas = resolveToRgb._canvas || (resolveToRgb._canvas = document.createElement('canvas'));
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    try {
        ctx.fillStyle = colorStr;
    } catch (e) {
        return null;
    }
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return [data[0], data[1], data[2]];
}
function relLuminance([r, g, b]) {
    const ch = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
function contrastRatio(a, b) {
    const l1 = relLuminance(a), l2 = relLuminance(b);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

const CONTRAST_PAIRS = [
    ['base-100', 'base-content'], ['base-200', 'base-content'], ['base-300', 'base-content'],
    ['primary', 'primary-content'], ['secondary', 'secondary-content'], ['accent', 'accent-content'],
    ['neutral', 'neutral-content'], ['info', 'info-content'], ['success', 'success-content'],
    ['warning', 'warning-content'], ['error', 'error-content'],
];

let contrastMatrixEl = null;
function renderContrastMatrix() {
    if (!contrastMatrixEl) return;
    const root = getPreviewRoot();
    if (!root) return;
    const cs = getComputedStyle(root);
    const rows = CONTRAST_PAIRS.map(([bg, fg]) => {
        const bgVal = cs.getPropertyValue(`--color-${bg}`).trim();
        const fgVal = cs.getPropertyValue(`--color-${fg}`).trim();
        if (!bgVal || !fgVal) return '';
        const bgRgb = resolveToRgb(bgVal);
        const fgRgb = resolveToRgb(fgVal);
        if (!bgRgb || !fgRgb) return '';
        const ratio = contrastRatio(bgRgb, fgRgb);
        const aa = ratio >= 4.5;
        const aaa = ratio >= 7;
        return `<tr>
            <td class="pe-2">${bg} / ${fg}</td>
            <td class="pe-2 font-mono">${ratio.toFixed(2)}:1</td>
            <td class="pe-2">${aa ? '<span class="badge badge-success badge-xs">AA pass</span>' : '<span class="badge badge-error badge-xs">AA fail</span>'}</td>
            <td>${aaa ? '<span class="badge badge-success badge-xs">AAA pass</span>' : '<span class="badge badge-ghost badge-xs">AAA fail</span>'}</td>
        </tr>`;
    }).join('');
    contrastMatrixEl.innerHTML = `<table class="text-xs w-full"><tbody>${rows}</tbody></table>`;
}

// Injecting the studio controls the moment the Options heading first
// appears races Svelte's post-hydration mismatch recovery (this page logs a
// `hydration_mismatch` warning): that recovery can still replace this DOM
// section shortly after first paint and silently discard freshly-inserted
// nodes. Re-query fresh elements after a short settle delay instead of
// reusing references captured during the racy first observer callback.
function injectStudioControls() {
    const h3s = Array.from(document.querySelectorAll('h3'));
    const optionsH3 = h3s.find(h => h.textContent.includes('Options'));
    if (!optionsH3) return;

    initTokenHistory();
    injectGlobalPatchStyles();

    // Insert alongside the Default theme / Default dark theme / Dark color
    // scheme toggles, which are plain siblings of the Options h3 (there's no
    // dedicated wrapper div for the section) - not at the end of the whole
    // editor column (optionsH3.parentElement), which lands new content after
    // Reset/Remove too.
    const toggleRows = [];
    let sib = optionsH3.nextElementSibling;
    while (sib && !sib.classList.contains('divider')) {
        toggleRows.push(sib);
        sib = sib.nextElementSibling;
    }
    let insertRef = toggleRows[toggleRows.length - 1] || optionsH3;
    const insertAfter = (el) => { insertRef.insertAdjacentElement('afterend', el); insertRef = el; };

    // Font Family
    const fontDiv = document.createElement('div');
    fontDiv.className = 'w-full';
    fontDiv.innerHTML = `
        <label class="label"><span class="label-text">Font family</span></label>
        <select class="select select-bordered select-sm w-full">
            <option value="Outfit">Outfit</option>
            <option value="system-ui">system-ui</option>
            <option value="monospace">monospace</option>
            <option value="serif">serif</option>
        </select>
    `;
    insertAfter(fontDiv);
    fontDiv.querySelector('select').addEventListener('change', (e) => setFontFamily(e.target.value));

    // Undo / Redo / Snapshot / Compare / Color blindness
    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'flex flex-wrap gap-2 mt-4 w-full items-center';
    toolsDiv.innerHTML = `
        <button type="button" class="btn btn-sm" data-role="undo" disabled>Undo</button>
        <button type="button" class="btn btn-sm" data-role="redo" disabled>Redo</button>
        <button type="button" class="btn btn-sm" data-role="snapshot">Snapshot</button>
        <label class="label cursor-pointer flex gap-2"><span class="label-text">Compare</span><input type="checkbox" class="toggle" data-role="compare" disabled /></label>
        <label class="label cursor-pointer flex gap-2"><span class="label-text">Color Blindness</span>
            <select class="select select-bordered select-xs" data-role="colorblind">
                <option>None</option>
                <option>Protanopia</option>
                <option>Deuteranopia</option>
                <option>Tritanopia</option>
            </select>
        </label>
        <span class="text-xs opacity-60" data-role="snapshot-hint">No snapshot saved yet</span>
    `;
    insertAfter(toolsDiv);

    undoBtnRef = toolsDiv.querySelector('[data-role="undo"]');
    redoBtnRef = toolsDiv.querySelector('[data-role="redo"]');
    undoBtnRef.addEventListener('click', () => undoToken());
    redoBtnRef.addEventListener('click', () => redoToken());
    const compareCb = toolsDiv.querySelector('[data-role="compare"]');
    toolsDiv.querySelector('[data-role="snapshot"]').addEventListener('click', () => {
        takeSnapshot();
        compareCb.disabled = false;
        toolsDiv.querySelector('[data-role="snapshot-hint"]').textContent = 'Snapshot saved';
    });
    compareCb.addEventListener('change', (e) => setCompare(e.target.checked));
    toolsDiv.querySelector('[data-role="colorblind"]').addEventListener('change', (e) => setColorBlindFilter(e.target.value));

    const matrixDiv = document.createElement('div');
    matrixDiv.className = 'mt-4 p-2 bg-base-200 rounded w-full';
    matrixDiv.innerHTML = `<div class="text-xs font-semibold mb-1">Contrast Matrix (AA/AAA)</div>`;
    const matrixTable = document.createElement('div');
    matrixDiv.appendChild(matrixTable);
    contrastMatrixEl = matrixTable;
    insertAfter(matrixDiv);
    renderContrastMatrix();

    const previewRootForMatrix = getPreviewRoot();
    if (previewRootForMatrix) {
        new MutationObserver(() => renderContrastMatrix()).observe(previewRootForMatrix, { attributes: true, attributeFilter: ['style'] });
    }
}

let uiPatched = false;
const observer = new MutationObserver(() => {
    // Accessibility: Aria labels on swatch chips
    document.querySelectorAll('button .grid.grid-cols-4').forEach(chip => {
        if (!chip.hasAttribute('aria-label')) {
            chip.setAttribute('aria-label', 'Color preview');
        }
    });

    // Name field label
    const nameInput = document.querySelector('input[placeholder="mytheme"]');
    if (nameInput) {
        if (!nameInput.id) nameInput.id = 'theme-name';
        const labelText = nameInput.parentElement.querySelector('span');
        // The input already sits inside an outer `label.input` wrapper, which
        // implicitly associates it with that wrapper's text. Wrapping the inner
        // "Name" span in its own `<label for="theme-name">` would nest a label
        // inside a label — invalid HTML and ambiguous for assistive tech.
        // Instead, give the span an id and point the input at it via
        // aria-labelledby so the accessible name is explicit without nesting.
        if (labelText && !nameInput.hasAttribute('aria-labelledby')) {
            if (!labelText.id) labelText.id = 'theme-name-label';
            nameInput.setAttribute('aria-labelledby', labelText.id);
        }

        // Remove strict lower-case validation pattern
        if (nameInput.hasAttribute('pattern')) {
            nameInput.removeAttribute('pattern');
        }
        // Contrast fix
        nameInput.style.color = 'var(--fallback-bc,oklch(var(--bc)/1))';
        if (nameInput.parentElement) nameInput.parentElement.style.color = 'var(--fallback-bc,oklch(var(--bc)/1))';
    }

    // Heading hierarchy fix
    const h1s = document.querySelectorAll('h1');
    h1s.forEach(h1 => {
        if (h1.textContent.includes('Components Demo')) {
            const h2 = document.createElement('h2');
            h2.className = h1.className;
            h2.textContent = h1.textContent;
            h1.replaceWith(h2);
        }
    });

    if (!uiPatched) {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const optionsH3 = h3s.find(h => h.textContent.includes('Options'));
        if (optionsH3) {
            uiPatched = true;
            setTimeout(injectStudioControls, 800);
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Artifact center config format and copy fix
const exportObserver = new MutationObserver(() => {
    // Fix double-remove deletes exactly one
    const removeBtns = document.querySelectorAll('button');
    removeBtns.forEach(btn => {
        if (btn.textContent.includes('Remove') && !btn.hasAttribute('data-remove-patched')) {
            btn.setAttribute('data-remove-patched', 'true');
            btn.addEventListener('click', (e) => {
                btn.disabled = true; // prevent double click
                setTimeout(() => btn.disabled = false, 500);
            });
        }
    });
});
exportObserver.observe(document.body, { childList: true, subtree: true });

// Fix JSON export missing required contract fields
const origJSONStringify = JSON.stringify;
JSON.stringify = function(value, replacer, space) {
    if (value && typeof value === 'object' && value.colors && value.name) {
        // Intercept Theme JSON payload to inject missing contract fields.
        // Operate on a shallow clone (and a cloned `options`) instead of the
        // live object so serializing a theme for export never mutates
        // application state that the editor/preview still reference.
        const clone = Object.assign({}, value);
        clone.fontFamily = selectedFontFamily || clone.fontFamily || "Outfit";
        if (clone.radius && typeof clone.radius !== 'object') {
            // make radius an object
            clone.radius = {
                box: clone.radius,
                field: clone.radius,
                selector: clone.radius
            };
        } else if (!clone.radius) {
             clone.radius = { box: "1rem", field: "0.5rem", selector: "0.5rem" };
        }
        if (clone.size && typeof clone.size !== 'object') {
            clone.size = {
                field: clone.size,
                selector: clone.size
            };
        } else if (!clone.size) {
             clone.size = { field: "1rem", selector: "1rem" };
        }
        // The theme object's real toggle fields are `default`, `prefersdark`,
        // and `color-scheme` (bound directly to the Options controls) - the
        // app never nests them under an `options` object itself. Map them
        // onto the contract-required options.defaultTheme/defaultDarkTheme/
        // darkColorScheme booleans rather than conflating dark-theme-default
        // with dark-color-scheme or dropping fields.
        const defaultTheme = typeof clone.default === 'boolean' ? clone.default : !!(clone.options && clone.options.defaultTheme);
        const defaultDarkTheme = typeof clone.prefersdark === 'boolean' ? clone.prefersdark : !!(clone.options && clone.options.defaultDarkTheme);
        const darkColorScheme = clone['color-scheme'] === 'dark' ? true
            : clone['color-scheme'] === 'light' ? false
            : !!(clone.options && clone.options.darkColorScheme);
        clone.options = { defaultTheme, defaultDarkTheme, darkColorScheme };
        delete clone.default;
        delete clone.prefersdark;
        delete clone['color-scheme'];
        return origJSONStringify(clone, replacer, space);
    }
    return origJSONStringify(value, replacer, space);
};
