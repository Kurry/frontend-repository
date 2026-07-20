import { derived, get, writable } from 'svelte/store';
import { builtins } from './themes.js';
import { borderValues, cssVar, fontFamilies, nameSchema, sizeValues, themeSchema } from './schema.js';

export const customThemes = writable([]);
export const activeThemeId = writable('builtin-light');
export const previewTab = writable('demo');
export const siteTheme = writable('light');
export const editorNameDraft = writable('light');
export const artifactOpen = writable(false);
export const artifactFormat = writable('css');
export const importDraft = writable('');
export const colorBlindMode = writable('None');
export const compareMode = writable(false);
export const snapshotTheme = writable(null);
export const undoStack = writable([]);
export const redoStack = writable([]);
export const removeConfirmId = writable(null);

export const activeTheme = derived([customThemes, activeThemeId], ([$customThemes, $activeThemeId]) =>
  $customThemes.find((theme) => theme.id === $activeThemeId)
  || builtins.find((theme) => theme.id === $activeThemeId)
  || builtins[0]
);

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const SIZE_MAP = { xs: '0.25rem', sm: '0.375rem', md: '0.5rem', lg: '0.625rem', xl: '0.75rem' };
const FONT_STACKS = {
  Outfit: '"Outfit", "Avenir Next", "Segoe UI", sans-serif',
  'system-ui': 'system-ui, sans-serif',
  monospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  serif: 'Georgia, "Times New Roman", serif',
};

let historyMuted = false;

function pushHistory(before) {
  if (historyMuted || !before) return;
  undoStack.update((stack) => {
    const next = [...stack, clone(before)];
    return next.length > 40 ? next.slice(-40) : next;
  });
  redoStack.set([]);
}

export function uniqueName(seed = 'mytheme') {
  const taken = new Set([
    ...get(customThemes).map((theme) => theme.name.toLowerCase()),
    ...builtins.map((theme) => theme.name.toLowerCase()),
  ]);
  let base = String(seed || 'mytheme').trim() || 'mytheme';
  if (!nameSchema.safeParse(base).success) base = 'mytheme';
  let candidate = base;
  let n = 2;
  while (taken.has(candidate.toLowerCase())) {
    const suffix = ` ${n++}`;
    candidate = `${base.slice(0, Math.max(2, 32 - suffix.length))}${suffix}`;
  }
  return candidate;
}

function asCustom(source, proposedName) {
  const copy = clone(source);
  copy.id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  copy.builtin = false;
  copy.name = uniqueName(proposedName || `${source.name} edit`);
  copy.generatedAt = now();
  return copy;
}

export function selectTheme(id) {
  if (builtins.some((theme) => theme.id === id) || get(customThemes).some((theme) => theme.id === id)) {
    activeThemeId.set(id);
    compareMode.set(false);
    const theme = get(activeTheme);
    editorNameDraft.set(theme.name);
    if (theme.builtin) {
      if (typeof window !== 'undefined') history.replaceState(null, '', `${location.pathname}${location.search}`);
    } else {
      syncHash(theme);
    }
  }
}

export function createTheme(name, source = get(activeTheme)) {
  const clean = (name ?? '').trim();
  const parsed = nameSchema.safeParse(clean);
  if (!parsed.success) return { ok: false, error: `Name: ${parsed.error.issues[0].message}` };
  if (!clean) return { ok: false, error: 'Name: must contain at least 2 characters' };
  if (builtins.some((theme) => theme.name.toLowerCase() === clean.toLowerCase())) {
    return { ok: false, error: 'Name: conflicts with a built-in theme' };
  }
  if (get(customThemes).some((theme) => theme.name.toLowerCase() === clean.toLowerCase())) {
    return { ok: false, error: 'Name: choose a unique name in My themes' };
  }
  const theme = asCustom(source, clean);
  theme.name = clean;
  customThemes.update((items) => [...items, theme]);
  activeThemeId.set(theme.id);
  editorNameDraft.set(theme.name);
  syncHash(theme);
  return { ok: true, theme };
}

function ensureEditable() {
  const current = get(activeTheme);
  if (!current.builtin) return current;
  const before = clone(current);
  const fork = asCustom(current, `${current.name} edit`);
  customThemes.update((items) => [...items, fork]);
  activeThemeId.set(fork.id);
  editorNameDraft.set(fork.name);
  pushHistory(before);
  return fork;
}

export function updateActive(mutator, { recordHistory = true } = {}) {
  const current = get(activeTheme);
  const before = clone(current);
  const editable = current.builtin ? ensureEditable() : current;
  // ensureEditable already pushed history when forking
  if (recordHistory && !current.builtin) pushHistory(before);
  let updated;
  customThemes.update((items) => items.map((theme) => {
    if (theme.id !== editable.id) return theme;
    updated = clone(theme);
    mutator(updated);
    updated.generatedAt = now();
    return updated;
  }));
  if (updated) {
    editorNameDraft.set(updated.name);
    syncHash(updated);
  }
  return updated;
}

export function renameActive(name) {
  const clean = name.trim();
  const result = nameSchema.safeParse(clean);
  if (!result.success) return { ok: false, error: result.error.issues[0].message };
  const current = get(activeTheme);
  if (current.builtin) return { ok: false, error: 'Select or create a custom theme before renaming' };
  if (get(customThemes).some((theme) => theme.name.toLowerCase() === clean.toLowerCase() && theme.id !== current.id)) {
    return { ok: false, error: 'Name must be unique among My themes' };
  }
  updateActive((theme) => { theme.name = clean; });
  return { ok: true };
}

export function updateColor(key, value) {
  const token = key.startsWith('--color-') ? key.slice('--color-'.length) : key;
  return updateActive((theme) => { theme.colors[token] = value; });
}

export function updateRadius(key, value) {
  const field = key.replace(/^--radius-/, '');
  return updateActive((theme) => { theme.radius[field] = value; });
}

export function updateSize(key, value) {
  const field = key.replace(/^--size-/, '');
  return updateActive((theme) => { theme.size[field] = value; });
}

export function updateBorder(value) {
  return updateActive((theme) => { theme.border = borderValues.includes(value) ? value : '1px'; });
}

export function updateEffect(key, value) {
  return updateActive((theme) => { theme[key] = value ? 1 : 0; });
}

export function updateOption(key, value) {
  return updateActive((theme) => { theme.options[key] = value; });
}

export function updateFontFamily(value) {
  if (!fontFamilies.includes(value)) return null;
  return updateActive((theme) => { theme.fontFamily = value; });
}

export function resetActive() {
  const current = get(activeTheme);
  if (current.builtin) return;
  const baseName = current.name.replace(/\s+edit(?:\s+\d+)?$/i, '').toLowerCase();
  const source = builtins.find((theme) => theme.name === baseName) || builtins[0];
  updateActive((theme) => {
    theme.colors = clone(source.colors);
    theme.radius = clone(source.radius);
    theme.size = clone(source.size);
    theme.border = source.border;
    theme.depth = source.depth;
    theme.noise = source.noise;
    theme.fontFamily = source.fontFamily;
    theme.options = clone(source.options);
  });
}

export function randomize() {
  const hex = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
  const faces = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
  updateActive((theme) => {
    for (const key of faces) theme.colors[key] = hex();
    theme.colors['base-100'] = hex();
    theme.colors['base-200'] = hex();
    theme.colors['base-300'] = hex();
    theme.radius.box = ['0rem', '0.25rem', '0.5rem', '1rem', '2rem'][Math.floor(Math.random() * 5)];
    theme.size.field = sizeValues[Math.floor(Math.random() * sizeValues.length)];
    theme.border = borderValues[Math.floor(Math.random() * borderValues.length)];
    theme.depth = Math.random() > 0.5 ? 1 : 0;
    theme.noise = Math.random() > 0.5 ? 1 : 0;
    theme.fontFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
  });
}

export function requestRemove(id) {
  if (!id?.startsWith('custom-')) return;
  removeConfirmId.set(id);
}

export function confirmRemove() {
  const id = get(removeConfirmId);
  removeConfirmId.set(null);
  if (!id) return false;
  return removeTheme(id, true);
}

export function cancelRemove() {
  removeConfirmId.set(null);
}

export function removeTheme(id, confirm = true) {
  if (!confirm || !id?.startsWith('custom-')) return false;
  const before = get(customThemes);
  if (!before.some((theme) => theme.id === id)) return false;
  const after = before.filter((theme) => theme.id !== id);
  customThemes.set(after);
  if (get(activeThemeId) === id) {
    const nextId = after.at(-1)?.id || 'builtin-light';
    activeThemeId.set(nextId);
    const next = get(activeTheme);
    editorNameDraft.set(next.name);
    if (next.builtin) {
      if (typeof window !== 'undefined') history.replaceState(null, '', `${location.pathname}${location.search}`);
    } else {
      syncHash(next);
    }
  }
  return true;
}

export function styleString(theme) {
  const declarations = {};
  for (const [key, value] of Object.entries(theme.colors)) declarations[cssVar(key)] = value;
  declarations['--radius-box'] = theme.radius.box;
  declarations['--radius-field'] = theme.radius.field;
  declarations['--radius-selector'] = theme.radius.selector;
  declarations['--size-field'] = SIZE_MAP[theme.size.field];
  declarations['--size-selector'] = SIZE_MAP[theme.size.selector];
  declarations['--border'] = theme.border;
  declarations['--depth'] = String(theme.depth);
  declarations['--noise'] = String(theme.noise);
  declarations['--font-family'] = FONT_STACKS[theme.fontFamily] || FONT_STACKS.Outfit;
  declarations['font-family'] = FONT_STACKS[theme.fontFamily] || FONT_STACKS.Outfit;
  return Object.entries(declarations).map(([key, value]) => `${key}:${value}`).join(';');
}

export function exportRecord(theme = get(activeTheme)) {
  return {
    name: theme.name,
    colors: clone(theme.colors),
    radius: clone(theme.radius),
    size: clone(theme.size),
    border: theme.border,
    depth: theme.depth,
    noise: theme.noise,
    fontFamily: theme.fontFamily,
    options: clone(theme.options),
    generatedAt: theme.generatedAt || now(),
  };
}

export function cssText(theme) {
  const body = styleString(theme)
    .split(';')
    .filter(Boolean)
    .map((line) => `  ${line};`)
    .join('\n');
  return `[data-theme="${theme.name}"] {\n${body}\n  font-family: var(--font-family);\n}`;
}

export function configText(theme) {
  const record = exportRecord(theme);
  return `module.exports = {\n  themes: {\n    "${record.name}": ${JSON.stringify(record, null, 4).replace(/\n/g, '\n    ')}\n  }\n};\n`;
}

export function artifactText(format = get(artifactFormat), theme = get(activeTheme)) {
  if (format === 'json') return JSON.stringify(exportRecord(theme), null, 2);
  if (format === 'config') return configText(theme);
  return cssText(theme);
}

export function syncHash(theme = get(activeTheme)) {
  if (typeof window === 'undefined' || theme?.builtin) return;
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(exportRecord(theme)))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    history.replaceState(null, '', `${location.pathname}${location.search}#theme=${encoded}`);
  } catch {
    /* ignore encode failures */
  }
}

export function importThemeObject(input) {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.join('.') || 'payload';
    return { ok: false, error: `Import theme error: ${path} ${issue.message}` };
  }
  // Cross-field: defaultDarkTheme requires darkColorScheme
  if (parsed.data.options.defaultDarkTheme && !parsed.data.options.darkColorScheme) {
    return { ok: false, error: 'Import theme error: options.darkColorScheme must be true when defaultDarkTheme is true' };
  }
  const incoming = clone(parsed.data);
  const existing = get(customThemes).find((theme) => theme.name.toLowerCase() === incoming.name.toLowerCase());
  incoming.id = existing?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  incoming.builtin = false;
  customThemes.update((items) => (
    existing
      ? items.map((theme) => (theme.id === existing.id ? incoming : theme))
      : [...items, incoming]
  ));
  activeThemeId.set(incoming.id);
  editorNameDraft.set(incoming.name);
  syncHash(incoming);
  return { ok: true, theme: incoming };
}

export function openArtifact(format = 'css') {
  artifactFormat.set(format);
  artifactOpen.set(true);
}

export function takeSnapshot() {
  snapshotTheme.set(clone(get(activeTheme)));
}

export function setCompare(active) {
  if (active && !get(snapshotTheme)) takeSnapshot();
  compareMode.set(!!active && !!get(snapshotTheme));
}

export function displayedTheme() {
  if (get(compareMode) && get(snapshotTheme)) return get(snapshotTheme);
  return get(activeTheme);
}

export function undo() {
  const stack = get(undoStack);
  if (!stack.length) return false;
  const previous = stack[stack.length - 1];
  const current = clone(get(activeTheme));
  undoStack.set(stack.slice(0, -1));
  redoStack.update((items) => [...items, current]);
  historyMuted = true;
  applyThemeSnapshot(previous);
  historyMuted = false;
  return true;
}

export function redo() {
  const stack = get(redoStack);
  if (!stack.length) return false;
  const next = stack[stack.length - 1];
  const current = clone(get(activeTheme));
  redoStack.set(stack.slice(0, -1));
  undoStack.update((items) => [...items, current]);
  historyMuted = true;
  applyThemeSnapshot(next);
  historyMuted = false;
  return true;
}

function applyThemeSnapshot(snapshot) {
  if (!snapshot) return;
  if (snapshot.builtin || String(snapshot.id || '').startsWith('builtin-')) {
    selectTheme(snapshot.id);
    return;
  }
  const existing = get(customThemes).find((theme) => theme.id === snapshot.id);
  if (existing) {
    customThemes.update((items) => items.map((theme) => (theme.id === snapshot.id ? clone(snapshot) : theme)));
    activeThemeId.set(snapshot.id);
  } else {
    customThemes.update((items) => [...items, clone(snapshot)]);
    activeThemeId.set(snapshot.id);
  }
  editorNameDraft.set(snapshot.name);
  syncHash(snapshot);
}

export function loadHash() {
  if (typeof window === 'undefined') return false;
  const raw = new URLSearchParams(location.hash.slice(1)).get('theme');
  if (!raw) return false;
  try {
    const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))));
    const result = importThemeObject(JSON.parse(json));
    return result.ok;
  } catch {
    // Malformed hash: fall back to seeded default without throwing.
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    customThemes.set([]);
    activeThemeId.set('builtin-light');
    editorNameDraft.set('light');
    return false;
  }
}
