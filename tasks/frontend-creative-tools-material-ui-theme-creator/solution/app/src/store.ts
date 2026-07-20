import { create } from 'zustand';
import {
  applyPreset,
  contrastMatrix,
  defaultOptions,
  exportCSS,
  exportJSON,
  firstError,
  optionsToSource,
  PRESETS,
  seedThemes,
  sourceToOptions,
  themePackageSchema,
  type ContrastRow,
  type Intent,
  type PaletteType,
  type SavedTheme,
  type ThemeOptions
} from './domain';

export type MainTab = 'preview' | 'components' | 'saved';
export type Device = 'phone' | 'tablet' | 'desktop';
export type ColorBlind = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export const TEMPLATES = ['Instructions', 'Sign Up', 'Dashboard', 'Blog', 'Pricing', 'Checkout'] as const;
export type Template = (typeof TEMPLATES)[number];

export interface Toast {
  id: number;
  text: string;
}

// New Theme / Rename / Snapshot live in the store (not component state) so the
// panel stays open across main-tab switches — the interleaved create flow.
export type NamePanelMode = 'new' | 'rename' | 'snapshot';
export interface NamePanelState {
  mode: NamePanelMode;
  themeId?: string;
}

export interface RecentCommand {
  id: string;
  label: string;
}

interface Result {
  ok: boolean;
  error?: string;
  field?: string;
}

const MAX_HISTORY = 60;

interface State {
  savedThemes: SavedTheme[];
  activeThemeId: string | null;
  themeName: string;
  options: ThemeOptions;
  source: string;
  sourceError: string | null;
  fonts: string[];

  tab: MainTab;
  device: Device;
  template: Template;
  colorBlind: ColorBlind;
  compareBefore: boolean;
  lastSnapshotOptions: ThemeOptions | null;

  history: ThemeOptions[];
  historyIndex: number;

  commandOpen: boolean;
  commandQuery: string;
  exportOpen: boolean;
  importOpen: boolean;
  tutorialOpen: boolean;

  saveStatus: string;
  toasts: Toast[];
  liveMessage: string;
  copyMessage: string;
  namePanel: NamePanelState | null;
  recentCommands: RecentCommand[];

  // derived
  contrast: () => ContrastRow[];
  jsonArtifact: () => string;
  cssArtifact: () => string;

  // actions
  setTab: (t: MainTab) => void;
  setDevice: (d: Device) => void;
  setTemplate: (t: Template) => void;
  setColorBlind: (c: ColorBlind) => void;
  toggleCompare: () => void;

  applyOptions: (next: ThemeOptions, opts?: { record?: boolean; regenSource?: boolean }) => void;
  setSource: (src: string) => void;
  setPaletteColor: (path: string, value: string) => Result;
  setPaletteType: (type: PaletteType) => void;
  applyPresetById: (id: string) => void;
  setShapeRadius: (n: number) => Result;
  setFontSize: (n: number) => Result;
  setFontFamily: (name: string) => void;
  addFont: (name: string) => void;

  undo: () => void;
  redo: () => void;
  gotoHistory: (index: number) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  createTheme: (name: string) => Result;
  renameTheme: (id: string, name: string) => Result;
  saveActiveOptions: () => void;
  deleteTheme: (id: string) => void;
  loadTheme: (id: string) => void;

  saveSnapshot: (name: string) => Result;
  restoreSnapshot: (index: number) => void;

  importPackage: (text: string) => Result;

  setCommandOpen: (v: boolean) => void;
  setCommandQuery: (q: string) => void;
  setExportOpen: (v: boolean) => void;
  setImportOpen: (v: boolean) => void;
  setTutorialOpen: (v: boolean) => void;

  setNamePanel: (v: NamePanelState | null) => void;
  pushRecentCommand: (id: string, label: string) => void;

  copyText: (text: string, label: string) => Promise<void>;
  pushToast: (text: string) => void;
  dismissToast: (id: number) => void;
  announce: (msg: string) => void;
}

let toastSeq = 1;
let announceSeq = 0;

function clampHistory(hist: ThemeOptions[], idx: number): { history: ThemeOptions[]; historyIndex: number } {
  if (hist.length <= MAX_HISTORY) return { history: hist, historyIndex: idx };
  const drop = hist.length - MAX_HISTORY;
  return { history: hist.slice(drop), historyIndex: Math.max(0, idx - drop) };
}

export const useStore = create<State>((set, get) => {
  const seeds = seedThemes();
  const initialOptions = defaultOptions('light');
  return {
    savedThemes: seeds,
    activeThemeId: null,
    themeName: 'Untitled Theme',
    options: initialOptions,
    source: optionsToSource(initialOptions),
    sourceError: null,
    fonts: ['Roboto', 'Roboto Mono', 'Roboto Slab'],

    tab: 'preview',
    device: 'desktop',
    template: 'Instructions',
    colorBlind: 'off',
    compareBefore: false,
    lastSnapshotOptions: null,

    history: [initialOptions],
    historyIndex: 0,

    commandOpen: false,
    commandQuery: '',
    exportOpen: false,
    importOpen: false,
    tutorialOpen: false,

    saveStatus: 'All changes saved',
    toasts: [],
    liveMessage: '',
    copyMessage: '',
    namePanel: null,
    recentCommands: [],

    contrast: () => contrastMatrix(get().options),
    jsonArtifact: () => exportJSON(get().themeName, get().options),
    cssArtifact: () => exportCSS(get().options),

    setTab: (t) => set({ tab: t }),
    setDevice: (d) => set({ device: d }),
    setTemplate: (t) => set({ template: t }),
    setColorBlind: (c) => set({ colorBlind: c }),
    toggleCompare: () => set((s) => ({ compareBefore: !s.compareBefore })),

    applyOptions: (next, opts = {}) => {
      const record = opts.record ?? true;
      const regenSource = opts.regenSource ?? true;
      set((s) => {
        const patch: Partial<State> = {
          options: next,
          saveStatus: 'All changes saved',
          sourceError: null
        };
        if (regenSource) patch.source = optionsToSource(next);
        if (record) {
          const trimmed = s.history.slice(0, s.historyIndex + 1);
          trimmed.push(next);
          const c = clampHistory(trimmed, trimmed.length - 1);
          patch.history = c.history;
          patch.historyIndex = c.historyIndex;
        }
        return patch;
      });
    },

    setSource: (src) => {
      const res = sourceToOptions(src);
      if (res.ok) {
        // Formatting (or whitespace-only typing) parses back to options equal
        // to the current state: refresh the text without recording a no-op
        // history entry, so Format Source never adds a spurious undo step or
        // scrubber state.
        if (JSON.stringify(res.options) === JSON.stringify(get().options)) {
          set({ source: src, sourceError: null, saveStatus: 'All changes saved' });
          return;
        }
        set({ source: src, sourceError: null });
        get().applyOptions(res.options, { record: true, regenSource: false });
      } else {
        set({ source: src, sourceError: res.error, saveStatus: 'Unsaved source changes' });
      }
    },

    setPaletteColor: (path, value) => {
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
        return { ok: false, error: `${path} must be a #RRGGBB hex color`, field: path };
      }
      const next = structuredClone(get().options);
      const parts = path.split('.');
      let cur: any = next.palette;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] ?? (cur[parts[i]] = {});
      cur[parts[parts.length - 1]] = value;
      get().applyOptions(next);
      return { ok: true };
    },

    setPaletteType: (type) => {
      const next = structuredClone(get().options);
      next.palette.type = type;
      const base = defaultOptions(type);
      // recolor surfaces to sensible defaults for the new type
      next.palette.background = base.palette.background;
      next.palette.text = base.palette.text;
      next.palette.divider = base.palette.divider;
      get().applyOptions(next);
      get().announce(`Palette type set to ${type}`);
    },

    applyPresetById: (id) => {
      const preset = PRESETS.find((p) => p.id === id);
      if (!preset) return;
      const next = applyPreset(get().options, preset);
      get().applyOptions(next);
      get().pushToast(`${preset.name} preset applied`);
    },

    setShapeRadius: (n) => {
      if (typeof n !== 'number' || Number.isNaN(n) || n < 0 || n > 24) {
        return { ok: false, error: 'shape.borderRadius must be from 0 to 24', field: 'borderRadius' };
      }
      const next = structuredClone(get().options);
      next.shape.borderRadius = n;
      get().applyOptions(next);
      return { ok: true };
    },

    setFontSize: (n) => {
      if (typeof n !== 'number' || Number.isNaN(n) || n < 10 || n > 24) {
        return { ok: false, error: 'fontSize must be from 10 to 24', field: 'fontSize' };
      }
      const next = structuredClone(get().options);
      next.typography.fontSize = n;
      get().applyOptions(next);
      return { ok: true };
    },

    setFontFamily: (name) => {
      const next = structuredClone(get().options);
      next.typography.fontFamily = name || 'Roboto';
      get().applyOptions(next);
    },

    addFont: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      set((s) => (s.fonts.includes(trimmed) ? {} : { fonts: [...s.fonts, trimmed] }));
      get().pushToast(`Font ${trimmed} added`);
    },

    undo: () => {
      const { historyIndex, history } = get();
      if (historyIndex <= 0) return;
      const idx = historyIndex - 1;
      get().applyOptions(history[idx], { record: false, regenSource: true });
      set({ historyIndex: idx });
    },
    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex >= history.length - 1) return;
      const idx = historyIndex + 1;
      get().applyOptions(history[idx], { record: false, regenSource: true });
      set({ historyIndex: idx });
    },
    gotoHistory: (index) => {
      const { history } = get();
      const idx = Math.max(0, Math.min(index, history.length - 1));
      get().applyOptions(history[idx], { record: false, regenSource: true });
      set({ historyIndex: idx });
    },
    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    createTheme: (name) => {
      const trimmed = (name ?? '').trim();
      const pkg = { name: trimmed, paletteType: get().options.palette.type, themeOptions: get().options };
      const parsed = themePackageSchema.safeParse(pkg);
      if (!parsed.success) {
        const fe = firstError(parsed.error);
        get().announce(fe.message);
        return { ok: false, error: fe.message, field: fe.path };
      }
      if (get().savedThemes.some((t) => t.name === trimmed)) {
        const msg = 'name must be unique among saved themes';
        get().announce(msg);
        return { ok: false, error: msg, field: 'name' };
      }
      const id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const record: SavedTheme = {
        id,
        name: trimmed,
        paletteType: pkg.paletteType,
        themeOptions: structuredClone(get().options),
        snapshots: []
      };
      set((s) => ({ savedThemes: [...s.savedThemes, record], activeThemeId: id, themeName: trimmed }));
      get().announce(`Saved theme ${trimmed} created`);
      get().pushToast(`Saved theme ${trimmed} created`);
      return { ok: true };
    },

    renameTheme: (id, name) => {
      // The rename panel is non-modal and stays open across tab switches, so
      // the target can be deleted while it is open — fail instead of silently
      // reporting a rename that matched no theme.
      if (!get().savedThemes.some((t) => t.id === id)) {
        const msg = 'That theme no longer exists';
        get().announce(msg);
        return { ok: false, error: msg, field: 'name' };
      }
      const trimmed = (name ?? '').trim();
      if (!trimmed) {
        get().announce('name is required');
        return { ok: false, error: 'name is required', field: 'name' };
      }
      if (trimmed.length > 64) {
        get().announce('name must be at most 64 characters');
        return { ok: false, error: 'name must be at most 64 characters', field: 'name' };
      }
      if (get().savedThemes.some((t) => t.id !== id && t.name === trimmed)) {
        const msg = 'name must be unique among saved themes';
        get().announce(msg);
        return { ok: false, error: msg, field: 'name' };
      }
      set((s) => ({
        savedThemes: s.savedThemes.map((t) => (t.id === id ? { ...t, name: trimmed } : t)),
        themeName: s.activeThemeId === id ? trimmed : s.themeName
      }));
      get().announce(`Theme renamed to ${trimmed}`);
      return { ok: true };
    },

    saveActiveOptions: () => {
      const { activeThemeId, options, themeName } = get();
      if (!activeThemeId) return;
      set((s) => ({
        savedThemes: s.savedThemes.map((t) =>
          t.id === activeThemeId
            ? { ...t, themeOptions: structuredClone(options), paletteType: options.palette.type, name: themeName }
            : t
        ),
        saveStatus: 'All changes saved'
      }));
      get().pushToast('Options saved to theme');
      get().announce('Options saved to the active theme');
    },

    deleteTheme: (id) => {
      set((s) => ({
        savedThemes: s.savedThemes.filter((t) => t.id !== id),
        activeThemeId: s.activeThemeId === id ? null : s.activeThemeId,
        themeName: s.activeThemeId === id ? 'Untitled Theme' : s.themeName
      }));
      get().announce('Saved theme deleted');
    },

    loadTheme: (id) => {
      const theme = get().savedThemes.find((t) => t.id === id);
      if (!theme) return;
      const opts = structuredClone(theme.themeOptions);
      set({ activeThemeId: id, themeName: theme.name, lastSnapshotOptions: structuredClone(opts) });
      get().applyOptions(opts);
      get().pushToast(`Loaded ${theme.name}`);
      get().announce(`Loaded saved theme ${theme.name}`);
    },

    saveSnapshot: (name) => {
      const { activeThemeId } = get();
      if (!activeThemeId) {
        const msg = 'Load a saved theme before taking a snapshot';
        get().announce(msg);
        return { ok: false, error: msg, field: 'name' };
      }
      const trimmed = (name ?? '').trim();
      if (!trimmed) {
        get().announce('name is required');
        return { ok: false, error: 'name is required', field: 'name' };
      }
      if (trimmed.length > 64) {
        get().announce('name must be at most 64 characters');
        return { ok: false, error: 'name must be at most 64 characters', field: 'name' };
      }
      const snap = { name: trimmed, themeOptions: structuredClone(get().options) };
      set((s) => ({
        savedThemes: s.savedThemes.map((t) =>
          t.id === activeThemeId ? { ...t, snapshots: [...t.snapshots, snap] } : t
        ),
        lastSnapshotOptions: structuredClone(get().options)
      }));
      get().pushToast(`Snapshot ${trimmed} saved`);
      get().announce(`Snapshot ${trimmed} saved`);
      return { ok: true };
    },

    restoreSnapshot: (index) => {
      const { activeThemeId, savedThemes } = get();
      const theme = savedThemes.find((t) => t.id === activeThemeId);
      if (!theme) return;
      const snap = theme.snapshots[index];
      if (!snap) return;
      get().applyOptions(structuredClone(snap.themeOptions));
      set({ lastSnapshotOptions: structuredClone(snap.themeOptions) });
      get().pushToast(`Snapshot ${snap.name} restored`);
    },

    importPackage: (text) => {
      let obj: unknown;
      try {
        obj = JSON.parse(text);
      } catch {
        const msg = 'Import failed: themeOptions JSON is malformed';
        get().announce(msg);
        return { ok: false, error: msg };
      }
      if (Array.isArray(obj)) {
        const msg = 'Import failed: expected a single theme package object, not an array';
        get().announce(msg);
        return { ok: false, error: msg };
      }
      const parsed = themePackageSchema.safeParse(obj);
      if (!parsed.success) {
        const fe = firstError(parsed.error);
        const msg = `Import failed: ${fe.message}`;
        get().announce(msg);
        return { ok: false, error: msg, field: fe.path };
      }
      const pkg = parsed.data;
      set({ themeName: pkg.name });
      get().applyOptions(structuredClone(pkg.themeOptions) as ThemeOptions);
      get().pushToast(`Imported ${pkg.name}`);
      get().announce(`Imported theme ${pkg.name}`);
      return { ok: true };
    },

    setCommandOpen: (v) => set({ commandOpen: v, commandQuery: v ? '' : get().commandQuery }),
    setCommandQuery: (q) => set({ commandQuery: q }),
    setExportOpen: (v) => set({ exportOpen: v }),
    setImportOpen: (v) => set({ importOpen: v }),
    setTutorialOpen: (v) => set({ tutorialOpen: v }),

    setNamePanel: (v) => set({ namePanel: v }),
    pushRecentCommand: (id, label) =>
      set((s) => ({
        recentCommands: [{ id, label }, ...s.recentCommands.filter((r) => r.id !== id)].slice(0, 4)
      })),

    copyText: async (text, label) => {
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      } catch {
        /* clipboard may be unavailable in headless; still confirm visibly */
      }
      // alternate an invisible marker so identical consecutive confirmations
      // still change the live-region text and re-announce
      announceSeq++;
      const marker = announceSeq % 2 ? '' : '​';
      set({ copyMessage: `${label} copied to clipboard${marker}` });
      get().pushToast(`${label} copied to clipboard`);
      get().announce(`${label} copied to clipboard`);
    },

    pushToast: (text) => {
      const id = toastSeq++;
      set((s) => ({ toasts: [...s.toasts, { id, text }] }));
      setTimeout(() => get().dismissToast(id), 2600);
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    announce: (msg) => {
      // set directly (never blank first, so an observer always finds the text)
      // and alternate an invisible marker so identical consecutive messages
      // still change the region content and re-announce for AT
      announceSeq++;
      const marker = announceSeq % 2 ? '' : '​';
      set({ liveMessage: `${msg}${marker}` });
    }
  };
});

export function intentList(): Intent[] {
  return ['primary', 'secondary', 'error', 'warning', 'info', 'success'];
}
