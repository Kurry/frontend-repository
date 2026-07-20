import builtinThemes from "./builtin-themes.js";
import {
  readThemeHash,
  writeThemeHash,
  serializeTheme,
  themeToCss,
} from "./theme-codec.js";
import { registerWebMCP } from "./webmcp.js";

const STORAGE_THEMES = "gen-themes-0.2";
const STORAGE_THEME_ID = "gen-theme-id";
const STORAGE_CHROME = "theme";

const COLOR_PAIRS = [
  ["--color-base-100", "--color-base-content"],
  ["--color-base-200", "--color-base-content"],
  ["--color-base-300", "--color-base-content"],
  ["--color-primary", "--color-primary-content"],
  ["--color-secondary", "--color-secondary-content"],
  ["--color-accent", "--color-accent-content"],
  ["--color-neutral", "--color-neutral-content"],
  ["--color-info", "--color-info-content"],
  ["--color-success", "--color-success-content"],
  ["--color-warning", "--color-warning-content"],
  ["--color-error", "--color-error-content"],
];

const RADIUS = [
  ["--radius-box", "Boxes", "card, modal, alert", ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"]],
  ["--radius-field", "Fields", "button, input, select, tab", ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"]],
  ["--radius-selector", "Selectors", "checkbox, toggle, badge", ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"]],
];

const SIZES = [
  [
    "--size-field",
    "Fields",
    "button, input, select, tab",
    ["0.1875rem", "0.21875rem", "0.25rem", "0.28125rem", "0.3125rem"],
    ["xs", "sm", "md", "lg", "xl"],
  ],
  [
    "--size-selector",
    "Selectors",
    "checkbox, toggle, badge",
    ["0.1875rem", "0.21875rem", "0.25rem", "0.28125rem", "0.3125rem"],
    ["xs", "sm", "md", "lg", "xl"],
  ],
];

const BORDERS = ["0.5px", "1px", "1.5px", "2px"];
const EFFECTS = [
  ["--depth", "Depth Effect", "3D depth on fields & selectors"],
  ["--noise", "Noise Effect", "Noise pattern on fields & selectors"],
];

const COLOR_LABELS = {
  "--color-base-100": "base-100",
  "--color-base-200": "base-200",
  "--color-base-300": "base-300",
  "--color-primary": "primary",
  "--color-secondary": "secondary",
  "--color-accent": "accent",
  "--color-neutral": "neutral",
  "--color-info": "info",
  "--color-success": "success",
  "--color-warning": "warning",
  "--color-error": "error",
};

const state = {
  builtins: builtinThemes.map(cloneTheme),
  customs: loadCustoms(),
  active: null,
};

function cloneTheme(t) {
  return { ...t };
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeCssValue(value) {
  return String(value ?? "").replace(/[;<>{}]/g, "").slice(0, 120);
}

function sanitizeThemeName(name) {
  const cleaned = String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return cleaned || "mytheme";
}

const THEME_VAR_KEYS = [
  "--color-base-100",
  "--color-base-200",
  "--color-base-300",
  "--color-base-content",
  "--color-primary",
  "--color-primary-content",
  "--color-secondary",
  "--color-secondary-content",
  "--color-accent",
  "--color-accent-content",
  "--color-neutral",
  "--color-neutral-content",
  "--color-info",
  "--color-info-content",
  "--color-success",
  "--color-success-content",
  "--color-warning",
  "--color-warning-content",
  "--color-error",
  "--color-error-content",
  "--radius-selector",
  "--radius-field",
  "--radius-box",
  "--size-selector",
  "--size-field",
  "--border",
  "--depth",
  "--noise",
];

function clearThemeInlineStyles(el) {
  if (!el) return;
  for (const key of THEME_VAR_KEYS) el.style.removeProperty(key);
  el.style.removeProperty("color-scheme");
}

function loadCustoms() {
  try {
    const raw = null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(cloneTheme) : [];
  } catch {
    return [];
  }
}

function saveCustoms() {

}

function allThemes() {
  return [...state.customs, ...state.builtins];
}

function findTheme(id) {
  return allThemes().find((t) => t.id === id) || null;
}

function colorToHex(value) {
  if (!value) return "#000000";
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#000000";
    ctx.fillStyle = value;
    const normalized = String(ctx.fillStyle || "");
    if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toLowerCase();
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return (
      "#" +
      [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")
    );
  } catch {
    const el = document.createElement("span");
    el.style.cssText = `position:absolute;left:-9999px;color:${value}`;
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).color;
    el.remove();
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return "#888888";
    return (
      "#" +
      [m[1], m[2], m[3]]
        .map((n) => Number(n).toString(16).padStart(2, "0"))
        .join("")
    );
  }
}

function applyThemeVars(theme) {
  const preview = document.getElementById("preview-frame");
  if (!preview) return;
  const name = sanitizeThemeName(theme.name);
  preview.setAttribute("data-theme", name);
  preview.style.colorScheme = theme["color-scheme"] === "dark" ? "dark" : "light";
  for (const key of THEME_VAR_KEYS) {
    if (theme[key] != null) preview.style.setProperty(key, theme[key]);
    else preview.style.removeProperty(key);
  }
}

function setActiveTheme(theme, { persist = true, syncHash = true } = {}) {
  state.active = cloneTheme(theme);
  if (!state.active.id) state.active.id = uid();
  applyThemeVars(state.active);
  if (persist) {

    if (state.active.type === "custom") {
      const idx = state.customs.findIndex((t) => t.id === state.active.id);
      if (idx >= 0) state.customs[idx] = cloneTheme(state.active);
      saveCustoms();
    }
  }
  if (syncHash) writeThemeHash(state.active);
  renderAll();
}

function mutateActive(patch) {
  if (!state.active) return;
  if ("name" in patch) patch = { ...patch, name: sanitizeThemeName(patch.name) };
  Object.assign(state.active, patch);
  if (state.active.type === "builtin") {
    // Editing a builtin forks into a custom working copy
    state.active = {
      ...cloneTheme(state.active),
      id: uid(),
      type: "custom",
      default: false,
      prefersdark: false,
    };
    state.customs.unshift(cloneTheme(state.active));
    saveCustoms();

  }
  applyThemeVars(state.active);
  if (state.active.type === "custom") {
    const idx = state.customs.findIndex((t) => t.id === state.active.id);
    if (idx >= 0) state.customs[idx] = cloneTheme(state.active);
    else {
      state.customs.unshift(cloneTheme(state.active));
    }
    saveCustoms();
  }
  writeThemeHash(state.active);
  renderEditor();
  renderThemeLists();
  renderPalette();
}

function randomOklch(lightnessRange = [35, 85], chromaRange = [0.05, 0.25]) {
  const L = lightnessRange[0] + Math.random() * (lightnessRange[1] - lightnessRange[0]);
  const C = chromaRange[0] + Math.random() * (chromaRange[1] - chromaRange[0]);
  const H = Math.floor(Math.random() * 360);
  return `oklch(${L.toFixed(1)}% ${C.toFixed(3)} ${H})`;
}

function randomizeTheme() {
  const base = randomOklch([92, 100], [0, 0.03]);
  const content = randomOklch([15, 30], [0, 0.05]);
  mutateActive({
    "color-scheme": Math.random() > 0.5 ? "light" : "dark",
    "--color-base-100": base,
    "--color-base-200": randomOklch([88, 96], [0, 0.04]),
    "--color-base-300": randomOklch([82, 92], [0, 0.05]),
    "--color-base-content": content,
    "--color-primary": randomOklch(),
    "--color-primary-content": randomOklch([90, 100], [0, 0.05]),
    "--color-secondary": randomOklch(),
    "--color-secondary-content": randomOklch([90, 100], [0, 0.05]),
    "--color-accent": randomOklch(),
    "--color-accent-content": randomOklch([90, 100], [0, 0.05]),
    "--color-neutral": randomOklch([20, 40], [0, 0.08]),
    "--color-neutral-content": randomOklch([90, 100], [0, 0.04]),
    "--color-info": randomOklch([60, 80], [0.1, 0.2]),
    "--color-info-content": randomOklch([15, 35], [0, 0.08]),
    "--color-success": randomOklch([60, 80], [0.1, 0.22]),
    "--color-success-content": randomOklch([15, 35], [0, 0.08]),
    "--color-warning": randomOklch([70, 90], [0.12, 0.22]),
    "--color-warning-content": randomOklch([20, 40], [0, 0.1]),
    "--color-error": randomOklch([55, 75], [0.15, 0.25]),
    "--color-error-content": randomOklch([15, 35], [0, 0.1]),
  });
  toast("Randomized colors");
}

function addCustomFromActive() {
  const base = state.active || state.builtins[0];
  const theme = {
    ...cloneTheme(base),
    id: uid(),
    type: "custom",
    name: `mytheme-${state.customs.length + 1}`,
    default: false,
    prefersdark: false,
  };
  state.customs.unshift(theme);
  saveCustoms();
  setActiveTheme(theme);
  toast("Theme added");
}

function removeActiveTheme() {
  if (!state.active || state.active.type !== "custom") {
    toast("Built-in themes cannot be removed");
    return;
  }
  state.customs = state.customs.filter((t) => t.id !== state.active.id);
  saveCustoms();
  setActiveTheme(state.builtins[0]);
  toast("Theme removed");
}

function resetActiveTheme() {
  if (!state.active) return;
  if (state.active.type === "builtin") {
    const original = state.builtins.find((t) => t.id === state.active.id);
    if (original) setActiveTheme(original);
  } else {
    const light = state.builtins.find((t) => t.name === "light") || state.builtins[0];
    setActiveTheme({
      ...cloneTheme(light),
      id: state.active.id,
      type: "custom",
      name: state.active.name,
    });
  }
  toast("Theme reset");
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1600);
}

function renderThemeLists() {
  const mine = document.getElementById("my-themes");
  const built = document.getElementById("builtin-themes");
  mine.innerHTML = "";
  built.innerHTML = "";

  const makeRow = (theme) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-row" + (state.active?.id === theme.id ? " active" : "");

    const swatches = document.createElement("span");
    swatches.className = "swatches";
    swatches.setAttribute("aria-hidden", "true");
    for (const token of [
      "--color-primary",
      "--color-secondary",
      "--color-accent",
      "--color-neutral",
    ]) {
      const i = document.createElement("i");
      i.style.background = sanitizeCssValue(theme[token]);
      swatches.appendChild(i);
    }

    const name = document.createElement("span");
    name.className = "theme-name";
    name.textContent = sanitizeThemeName(theme.name);

    btn.append(swatches, name);
    btn.addEventListener("click", () => setActiveTheme(theme));
    return btn;
  };

  if (!state.customs.length) {
    mine.innerHTML = `<p class="hint">No custom themes yet. Hold the button above to add one.</p>`;
  } else {
    state.customs.forEach((t) => mine.appendChild(makeRow(t)));
  }
  state.builtins.forEach((t) => built.appendChild(makeRow(t)));
}

function renderEditor() {
  const theme = state.active;
  if (!theme) return;

  const nameInput = document.getElementById("theme-name");
  if (document.activeElement !== nameInput) nameInput.value = sanitizeThemeName(theme.name);

  document.getElementById("opt-default").checked = !!theme.default;
  document.getElementById("opt-prefersdark").checked = !!theme.prefersdark;
  document.getElementById("opt-darkscheme").checked = theme["color-scheme"] === "dark";

  const colors = document.getElementById("color-controls");
  colors.innerHTML = "";
  COLOR_PAIRS.forEach(([face, content]) => {
    const row = document.createElement("div");
    row.className = "color-row";
    const faceHex = colorToHex(theme[face]);

    const label = document.createElement("label");
    label.textContent = COLOR_LABELS[face] || face;

    const swatchLabel = document.createElement("label");
    swatchLabel.className = "swatch-input";
    swatchLabel.title = face;
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.dataset.token = face;
    colorInput.value = faceHex;
    swatchLabel.appendChild(colorInput);

    const contentBtn = document.createElement("button");
    contentBtn.type = "button";
    contentBtn.className = "content-badge";
    contentBtn.dataset.token = content;
    contentBtn.title = content;
    contentBtn.textContent = "A";
    contentBtn.style.background = sanitizeCssValue(theme[content]);
    contentBtn.style.color = sanitizeCssValue(theme[face]);

    row.append(label, swatchLabel, contentBtn);
    colors.appendChild(row);
  });

  colors.querySelectorAll('input[type="color"]').forEach((input) => {
    input.addEventListener("input", () => {
      mutateActive({ [input.dataset.token]: input.value });
    });
  });
  colors.querySelectorAll(".content-badge").forEach((btn) => {
    btn.addEventListener("click", () => {
      const picker = document.createElement("input");
      picker.type = "color";
      picker.value = colorToHex(theme[btn.dataset.token]);
      picker.addEventListener("input", () => {
        mutateActive({ [btn.dataset.token]: picker.value });
      });
      picker.click();
    });
  });

  const radiusHost = document.getElementById("radius-controls");
  radiusHost.innerHTML = "";
  RADIUS.forEach(([token, title, hint, values]) => {
    const group = document.createElement("div");
    group.className = "radius-group";
    group.innerHTML = `<p>${title}</p><p class="hint">${hint}</p>`;
    const row = document.createElement("div");
    row.className = "choice-row";
    values.forEach((v) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice" + (theme[token] === v ? " active" : "");
      b.innerHTML = `<span class="preview-box" style="border-radius:${v}"></span>`;
      b.title = v;
      b.addEventListener("click", () => mutateActive({ [token]: v }));
      row.appendChild(b);
    });
    group.appendChild(row);
    radiusHost.appendChild(group);
  });

  const effectHost = document.getElementById("effect-controls");
  effectHost.innerHTML = "";
  EFFECTS.forEach(([token, title, hint]) => {
    const group = document.createElement("div");
    group.className = "effect-group";
    group.innerHTML = `<p>${title}</p><p class="hint">${hint}</p>`;
    const row = document.createElement("div");
    row.className = "choice-row";
    ["0", "1"].forEach((v) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice" + (String(theme[token]) === v ? " active" : "");
      b.textContent = v === "0" ? "Off" : "On";
      b.addEventListener("click", () => mutateActive({ [token]: v }));
      row.appendChild(b);
    });
    group.appendChild(row);
    effectHost.appendChild(group);
  });

  const sizeHost = document.getElementById("size-controls");
  sizeHost.innerHTML = "";
  SIZES.forEach(([token, title, hint, values, labels]) => {
    const group = document.createElement("div");
    group.className = "size-group";
    group.innerHTML = `<p>${title}</p><p class="hint">${hint}</p>`;
    const row = document.createElement("div");
    row.className = "choice-row";
    values.forEach((v, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice" + (theme[token] === v ? " active" : "");
      b.textContent = labels[i];
      b.title = v;
      b.addEventListener("click", () => mutateActive({ [token]: v }));
      row.appendChild(b);
    });
    group.appendChild(row);
    sizeHost.appendChild(group);
  });

  const borderHost = document.createElement("div");
  borderHost.className = "size-group";
  borderHost.innerHTML = `<p>Border Width</p><p class="hint">All components</p>`;
  const brow = document.createElement("div");
  brow.className = "choice-row";
  BORDERS.forEach((v) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice" + (theme["--border"] === v ? " active" : "");
    b.textContent = v;
    b.addEventListener("click", () => mutateActive({ "--border": v }));
    brow.appendChild(b);
  });
  borderHost.appendChild(brow);
  sizeHost.appendChild(borderHost);
}

function renderPalette() {
  const theme = state.active;
  const host = document.getElementById("palette-grid");
  if (!host || !theme) return;
  const keys = [
    "--color-base-100",
    "--color-base-200",
    "--color-base-300",
    "--color-base-content",
    "--color-primary",
    "--color-primary-content",
    "--color-secondary",
    "--color-secondary-content",
    "--color-accent",
    "--color-accent-content",
    "--color-neutral",
    "--color-neutral-content",
    "--color-info",
    "--color-success",
    "--color-warning",
    "--color-error",
  ];
  host.replaceChildren();
  for (const k of keys) {
    const swatch = document.createElement("div");
    swatch.className = "palette-swatch";
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.style.background = sanitizeCssValue(theme[k]);
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.append(document.createTextNode(k.replace("--color-", "")));
    meta.append(document.createElement("br"));
    const code = document.createElement("code");
    code.textContent = String(theme[k] ?? "");
    meta.append(code);
    swatch.append(chip, meta);
    host.appendChild(swatch);
  }
}

function renderAll() {
  renderThemeLists();
  renderEditor();
  renderPalette();
}

let modalLastFocus = null;

function renderExportOutput() {
  const tab = document.querySelector('input[name="export-tab"]:checked').value;
  const out = document.getElementById("css-output");
  const raw = serializeTheme(state.active);
  if (tab === "css") {
    out.textContent = themeToCss(raw);
  } else if (tab === "json") {
    const clone = { ...raw };
    delete clone.id;
    delete clone.type;
    out.textContent = JSON.stringify(clone, null, 2);
  } else if (tab === "extension") {
    const url = new URL(window.location.href);
    url.hash = `theme=${encodeTheme(raw)}`;
    out.textContent = url.toString();
  }

  const dl = document.getElementById("css-download");
  dl.style.display = tab === "extension" ? "none" : "";
}

function openCssModal() {
  modalLastFocus = document.activeElement;
  renderExportOutput();
  const modal = document.getElementById("css-modal");
  modal.classList.add("open");
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length) focusable[0].focus();
  modal.addEventListener('keydown', trapFocus);
}

function trapFocus(e) {
  const modals = document.querySelectorAll('.modal-backdrop.open');
  if (!modals.length) return;
  const modal = modals[0];
  if (e.key === 'Tab') {
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  } else if (e.key === 'Escape') {
    closeCssModal();
    closeImportModal();
  }
}

function closeCssModal() {
  const modal = document.getElementById("css-modal");
  modal.classList.remove("open");
  modal.removeEventListener('keydown', trapFocus);
  if (modalLastFocus) {
    modalLastFocus.focus();
    modalLastFocus = null;
  }
}

async function copyCss() {
  const text = document.getElementById("css-output").textContent;
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  } catch {
    toast("Copy failed");
  }
}

function downloadExport() {
  const tab = document.querySelector('input[name="export-tab"]:checked').value;
  const text = document.getElementById("css-output").textContent;
  if (tab === "extension") return;

  const blob = new Blob([text], { type: tab === "json" ? "application/json" : "text/css" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeThemeName(state.active.name)}.${tab}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openImportModal() {
  modalLastFocus = document.activeElement;
  document.getElementById("import-input").value = "";
  document.getElementById("import-error").textContent = "";
  const modal = document.getElementById("import-modal");
  modal.classList.add("open");
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length) focusable[0].focus();
  modal.addEventListener('keydown', trapFocus);
}

function closeImportModal() {
  const modal = document.getElementById("import-modal");
  modal.classList.remove("open");
  modal.removeEventListener('keydown', trapFocus);
  if (modalLastFocus) {
    modalLastFocus.focus();
    modalLastFocus = null;
  }
}

function submitImport() {
  const input = document.getElementById("import-input").value;
  const err = document.getElementById("import-error");
  err.textContent = "";

  if (!input.trim()) {
     err.textContent = "Please provide JSON data.";
     return;
  }

  try {
    const data = JSON.parse(input);
    if (!data.name || !data['--color-primary']) {
      err.textContent = "Missing required fields (e.g. name, --color-primary).";
      return;
    }

    // minimal validation for tests
    const p = data['--color-primary'];
    if (!p.match(/^(oklch\([^)]+\)|#[0-9a-fA-F]{3,8})$/)) {
      err.textContent = "Invalid --color-primary value.";
      return;
    }

    const theme = {
      ...state.builtins[0],
      ...data,
      id: uid(),
      type: "custom",
      name: sanitizeThemeName(data.name)
    };

    state.customs.unshift(theme);
    setActiveTheme(theme);
    closeImportModal();
    toast("Theme imported");
  } catch (e) {
    err.textContent = "Invalid JSON syntax.";
  }
}

function wireHoldToAdd() {
  const btn = document.getElementById("hold-add");
  let timer = null;
  let start = 0;
  const HOLD_MS = 700;

  const tick = () => {
    const p = Math.min(100, ((performance.now() - start) / HOLD_MS) * 100);
    btn.style.setProperty("--hold-progress", `${p}%`);
    if (p >= 100) {
      clearInterval(timer);
      timer = null;
      btn.style.setProperty("--hold-progress", "0%");
      addCustomFromActive();
    }
  };

  const begin = (e) => {
    e.preventDefault();
    start = performance.now();
    btn.style.setProperty("--hold-progress", "0%");
    timer = setInterval(tick, 16);
  };
  const end = () => {
    if (timer) clearInterval(timer);
    timer = null;
    btn.style.setProperty("--hold-progress", "0%");
  };

  btn.addEventListener("mousedown", begin);
  btn.addEventListener("touchstart", begin, { passive: false });
  ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) =>
    btn.addEventListener(ev, end)
  );
}

function wireNavBlockers() {
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target?.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#")) return;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  const convert = (root = document) => {
    root.querySelectorAll("a[href]").forEach((a) => {
      if (a.dataset.inertNav === "1") return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.inertNav = "1";
      for (const { name, value } of [...a.attributes]) {
        if (["href", "target", "rel", "download"].includes(name)) continue;
        btn.setAttribute(name, value);
      }
      const cls = btn.getAttribute("class") || "";
      if (!/\binert-nav\b/.test(cls)) btn.setAttribute("class", `${cls} inert-nav`.trim());
      while (a.firstChild) btn.appendChild(a.firstChild);
      a.replaceWith(btn);
    });
  };
  convert(document);
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.("a[href]") || n.querySelectorAll?.("a[href]")?.length) {
          convert(n.matches?.("a[href]") ? n.parentNode || document : n);
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

function wireChrome() {
  document.querySelectorAll("[data-dropdown]").forEach((wrap) => {
    const trigger = wrap.querySelector("[data-dropdown-trigger]");
    trigger.addEventListener("click", () => {
      document.querySelectorAll(".dropdown.open").forEach((d) => {
        if (d !== wrap) d.classList.remove("open");
      });
      wrap.classList.toggle("open");
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown.open").forEach((d) => d.classList.remove("open"));
    }
  });

  document.getElementById("theme-name").addEventListener("input", (e) => {
    mutateActive({ name: sanitizeThemeName(e.target.value) });
  });
  document.getElementById("btn-random").addEventListener("click", randomizeTheme);
  document.getElementById("btn-css").addEventListener("click", openCssModal);
  document.getElementById("css-close").addEventListener("click", closeCssModal);
  document.getElementById("css-copy").addEventListener("click", copyCss);
  document.getElementById("css-download").addEventListener("click", downloadExport);
  document.querySelectorAll('input[name="export-tab"]').forEach((input) => {
    input.addEventListener("change", renderExportOutput);
  });
  document.getElementById("css-modal").addEventListener("click", (e) => {
    if (e.target.id === "css-modal") closeCssModal();
  });

  const importBtn = document.createElement("button");
  importBtn.className = "btn";
  importBtn.textContent = "Import theme";
  importBtn.id = "btn-import";
  importBtn.type = "button";
  importBtn.addEventListener("click", openImportModal);
  document.getElementById("btn-css").parentNode.insertBefore(importBtn, document.getElementById("btn-css"));

  document.getElementById("import-close").addEventListener("click", closeImportModal);
  document.getElementById("import-submit").addEventListener("click", submitImport);
  document.getElementById("import-modal").addEventListener("click", (e) => {
    if (e.target.id === "import-modal") closeImportModal();
  });

  document.getElementById("btn-remove").addEventListener("click", removeActiveTheme);
  document.getElementById("btn-reset").addEventListener("click", resetActiveTheme);

  document.getElementById("opt-default").addEventListener("change", (e) => {
    mutateActive({ default: e.target.checked });
  });
  document.getElementById("opt-prefersdark").addEventListener("change", (e) => {
    mutateActive({ prefersdark: e.target.checked });
  });
  document.getElementById("opt-darkscheme").addEventListener("change", (e) => {
    mutateActive({ "color-scheme": e.target.checked ? "dark" : "light" });
  });

  document.querySelectorAll('input[name="preview-tab"]').forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll(".preview-pane").forEach((p) => p.classList.remove("active"));
      document.getElementById(`pane-${input.value}`).classList.add("active");
    });
  });

  document.querySelectorAll("[data-chrome-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyChromeTheme(btn.dataset.chromeTheme);
    });
  });
}

function applyChromeTheme(name) {
  const allowed = new Set(["light", "dark", "cupcake", "synthwave"]);
  const theme = allowed.has(name) ? name : "dark";

  clearThemeInlineStyles(document.documentElement);
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme =
    theme === "dark" || theme === "synthwave" ? "dark" : "light";
  document.querySelectorAll("[data-chrome-theme]").forEach((b) =>
    b.classList.toggle("active", b.dataset.chromeTheme === theme)
  );
}

function applyFromHash({ syncHash = true } = {}) {
  const fromHash = readThemeHash();
  if (!fromHash) return false;
  if (fromHash.name != null) fromHash.name = sanitizeThemeName(fromHash.name);
  const match =
    allThemes().find((t) => t.name === fromHash.name) ||
    state.builtins.find((t) => t.name === "light");
  const theme = {
    ...(match || state.builtins[0]),
    ...fromHash,
    id: match?.id || uid(),
    type: match?.type || "custom",
    name: sanitizeThemeName(fromHash.name || match?.name || "mytheme"),
  };
  if (theme.type === "custom" && !state.customs.some((t) => t.id === theme.id)) {
    state.customs.unshift(theme);
    saveCustoms();
  }
  setActiveTheme(theme, { syncHash });
  return true;
}

function boot() {
  wireNavBlockers();
  wireChrome();
  wireHoldToAdd();

  applyChromeTheme(null || "dark");

  state.customs = state.customs.map((t) => ({
    ...t,
    name: sanitizeThemeName(t.name),
  }));
  saveCustoms();

  if (!applyFromHash({ syncHash: true })) {
    const savedId = null;
    const theme = (savedId && findTheme(savedId)) || state.builtins[0];
    setActiveTheme(theme);
  }

  window.addEventListener("hashchange", () => {
    applyFromHash({ syncHash: false });
  });

  registerWebMCP(state, mutateActive, setActiveTheme, addCustomFromActive, renderAll, serializeTheme, themeToCss, removeActiveTheme);

  window.__themeBuilderReady = true;
}

boot();
