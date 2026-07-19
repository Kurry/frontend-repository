import { DEFAULT_CODE, DEFAULT_CONFIG, parse } from './mermaid.js';

const CODE_STORE_KEY = 'codeStore';
const THEME_KEY = 'mermaid-editor-theme';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
};

const defaultState = {
  code: DEFAULT_CODE,
  mermaid: DEFAULT_CONFIG,
  editorMode: 'code' // 'code' | 'config'
};

const seed = readJSON(CODE_STORE_KEY, { ...defaultState });

// The single mutable input state (Svelte 5 runes). Reads are reactive; every
// write funnels through the update helpers below, which persist to
// localStorage and re-validate the source so the preview always tracks it.
export const store = $state({
  code: seed.code,
  mermaid: seed.mermaid,
  editorMode: seed.editorMode === 'config' ? 'config' : 'code',
  diagramType: undefined,
  error: undefined, // string message when the source fails to parse
  theme: (() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  })(),
  renderCount: 0
});

const persist = () => {
  try {
    localStorage.setItem(
      CODE_STORE_KEY,
      JSON.stringify({ code: store.code, mermaid: store.mermaid, editorMode: store.editorMode })
    );
  } catch {
    /* storage unavailable — stay in-memory */
  }
};

// Re-parse the current source; publish diagramType or an error message.
const revalidate = async () => {
  try {
    const { diagramType } = await parse(store.code);
    store.diagramType = diagramType;
    JSON.parse(store.mermaid);
    store.error = undefined;
  } catch (error) {
    store.error = error instanceof Error ? error.message : String(error);
  }
};

export const setCode = (code) => {
  store.code = code;
  store.renderCount += 1;
  persist();
  void revalidate();
};

export const setConfig = (config) => {
  store.mermaid = config;
  persist();
  void revalidate();
};

export const setEditorMode = (mode) => {
  store.editorMode = mode === 'config' ? 'config' : 'code';
  persist();
};

export const applyMermaidTheme = () => {
  try {
    const config = JSON.parse(store.mermaid);
    config.theme = store.theme === 'dark' ? 'dark' : 'default';
    store.mermaid = JSON.stringify(config, null, 2);
  } catch {
    store.mermaid = JSON.stringify({ theme: store.theme === 'dark' ? 'dark' : 'default' }, null, 2);
  }
  persist();
};

export const setTheme = (theme) => {
  store.theme = theme === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_KEY, store.theme);
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('dark', store.theme === 'dark');
  applyMermaidTheme();
  void revalidate();
};

export const toggleTheme = () => setTheme(store.theme === 'dark' ? 'light' : 'dark');

// Load a sample diagram source (from the Sample Diagrams picker).
export const loadSample = (sample) => setCode(sample.code);

export const init = () => {
  document.documentElement.classList.toggle('dark', store.theme === 'dark');
  void revalidate();
};
