import { DEFAULT_CODE, DEFAULT_CONFIG, parse, detectDiagramType } from './mermaid.js';
import { mermaidConfigSchema, mermaidSessionSchema, formatZodError } from './schemas.js';

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

export const store = $state({
  code: seed.code,
  mermaid: seed.mermaid, // config document text the Config pane edits
  lastValidMermaid: seed.mermaid, // last config that passed the field contract
  configError: undefined, // undefined or field-named message
  editorMode: seed.editorMode === 'config' ? 'config' : 'code',
  diagramType: detectDiagramType(seed.code) ?? 'flowchart', // closed enum id
  error: undefined, // parser message when the source fails to parse
  theme: (() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  })(),
  renderCount: 0,
  renderMs: 0,
  // The quick-tour banner shows on every page load until dismissed; it is
  // deliberately not persisted so a fresh load always introduces the tool.
  firstRun: true
});

export const dismissCoachmark = () => {
  store.firstRun = false;
};

const persist = () => {
  try {
    localStorage.setItem(
      CODE_STORE_KEY,
      JSON.stringify({ code: store.code, mermaid: store.mermaid, editorMode: store.editorMode })
    );
  } catch {}
};

let revalidateTimer;

const doRevalidate = async () => {
  const code = store.code;
  if (!code.trim()) {
    // Empty source: no parser error banner — the preview pane shows its
    // empty-source message and exports stay disabled.
    store.error = undefined;
    return;
  }
  try {
    await parse(code);
    store.diagramType = detectDiagramType(code) ?? store.diagramType;
    store.error = undefined;
  } catch (error) {
    store.error = error instanceof Error ? error.message : String(error);
  }
};

export const revalidate = () => {
  clearTimeout(revalidateTimer);
  revalidateTimer = setTimeout(() => {
    void doRevalidate();
  }, 100);
};

export const setCode = (code) => {
  store.code = code;
  store.renderCount += 1;
  persist();
  revalidate();
};

export const setConfig = (configStr) => {
  try {
    const parsed = JSON.parse(configStr);
    mermaidConfigSchema.parse(parsed); // throws when the field contract fails
    store.mermaid = configStr;
    store.lastValidMermaid = configStr;
    store.configError = undefined;
  } catch (e) {
    // Keep the typed text in the pane, but never apply an invalid config:
    // the preview keeps rendering with the last valid configuration.
    store.mermaid = configStr;
    if (e instanceof SyntaxError) {
      store.configError = `config document: not valid JSON (${e.message})`;
    } else {
      const { field, message } = formatZodError(e);
      store.configError = field === 'document' ? message : `${field}: ${message}`;
    }
  }
  persist();
  revalidate();
};

export const setEditorMode = (mode) => {
  store.editorMode = mode === 'config' ? 'config' : 'code';
  persist();
};

// The header theme toggle recolors the rendered diagram by writing the
// matching Mermaid Config theme into the config document — the same document
// the Config tab edits and the renderer reads.
export const applyMermaidTheme = () => {
  const theme = store.theme === 'dark' ? 'dark' : 'default';
  let config;
  try {
    config = JSON.parse(store.lastValidMermaid);
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      config = { theme };
    }
  } catch {
    config = { theme };
  }
  config.theme = theme;
  const newConfigStr = JSON.stringify(config, null, 2);
  store.mermaid = newConfigStr;
  store.lastValidMermaid = newConfigStr;
  store.configError = undefined;
  persist();
};

export const setTheme = (theme) => {
  store.theme = theme === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_KEY, store.theme);
  } catch {}
  document.documentElement.classList.toggle('dark', store.theme === 'dark');
  applyMermaidTheme();
  revalidate();
};

export const toggleTheme = () => setTheme(store.theme === 'dark' ? 'light' : 'dark');

export const loadSample = (sample) => setCode(sample.code);

// MermaidSession export package — always the full field contract with the
// session's live values.
export const getSessionJSON = () => {
  let config;
  try {
    config = JSON.parse(store.lastValidMermaid);
  } catch {
    config = { theme: 'default' };
  }
  return JSON.stringify(
    {
      schemaVersion: 'mermaid-session-v1',
      code: store.code,
      config,
      appTheme: store.theme,
      activeTab: store.editorMode,
      diagramType: store.diagramType ?? 'flowchart'
    },
    null,
    2
  );
};

export const importSessionJSON = (jsonStr) => {
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return { ok: false, field: 'document', message: `malformed JSON (${e.message})` };
  }
  try {
    mermaidSessionSchema.parse(parsed);
  } catch (e) {
    // Contract failed: nothing in the workspace is mutated.
    return { ok: false, ...formatZodError(e) };
  }

  // Contract passed — restore every facet together, atomically.
  store.code = parsed.code;
  store.mermaid = JSON.stringify(parsed.config, null, 2);
  store.lastValidMermaid = store.mermaid;
  store.configError = undefined;
  store.theme = parsed.appTheme;
  store.editorMode = parsed.activeTab;
  store.diagramType = parsed.diagramType;

  document.documentElement.classList.toggle('dark', store.theme === 'dark');
  persist();
  try {
    localStorage.setItem(THEME_KEY, store.theme);
  } catch {}

  store.renderCount += 1;
  revalidate();
  return { ok: true };
};

export const importMMD = (mmdStr) => {
  const text = String(mmdStr ?? '');
  // Empty or whitespace-only payloads behave exactly like clearing Code:
  // the workspace stays stable with the empty-source treatment.
  store.code = text.trim() ? text : '';
  store.renderCount += 1;
  persist();
  revalidate();
  return { ok: true };
};

export const init = () => {
  document.documentElement.classList.toggle('dark', store.theme === 'dark');
  void doRevalidate();
};
