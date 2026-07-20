import { DEFAULT_CODE, DEFAULT_CONFIG, parse } from './mermaid.js';
import { mermaidConfigSchema, mermaidSessionSchema } from './schemas.js';

const CODE_STORE_KEY = 'codeStore';
const THEME_KEY = 'mermaid-editor-theme';
const FIRST_RUN_KEY = 'mermaid-first-run';

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
  mermaid: seed.mermaid, // valid mermaid config string
  lastValidMermaid: seed.mermaid, // track last valid config
  configError: undefined, // undefined or string message
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
  renderCount: 0,
  firstRun: (() => {
    try {
      return !localStorage.getItem(FIRST_RUN_KEY);
    } catch {
      return true;
    }
  })()
});

export const dismissCoachmark = () => {
  store.firstRun = false;
  try {
    localStorage.setItem(FIRST_RUN_KEY, 'done');
  } catch {}
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
  if (!store.code.trim()) {
    store.diagramType = undefined;
    store.error = undefined;
    return;
  }
  try {
    const { diagramType } = await parse(store.code);
    store.diagramType = diagramType;
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
    mermaidConfigSchema.parse(parsed); // will throw if invalid
    store.mermaid = configStr;
    store.lastValidMermaid = configStr;
    store.configError = undefined;
  } catch (e) {
    store.mermaid = configStr; // keep it in state so editor doesn't lose it
    if (e instanceof SyntaxError) {
      store.configError = "Invalid JSON";
    } else {
      store.configError = e.errors?.[0]?.message || String(e);
    }
  }
  persist();
  revalidate(); // Re-render with lastValidMermaid (done in Preview)
};

export const setEditorMode = (mode) => {
  store.editorMode = mode === 'config' ? 'config' : 'code';
  persist();
};

export const applyMermaidTheme = () => {
  try {
    const config = JSON.parse(store.lastValidMermaid);
    config.theme = store.theme === 'dark' ? 'dark' : 'default';
    const newConfigStr = JSON.stringify(config, null, 2);
    store.mermaid = newConfigStr;
    store.lastValidMermaid = newConfigStr;
    store.configError = undefined;
  } catch {
    const newConfigStr = JSON.stringify({ theme: store.theme === 'dark' ? 'dark' : 'default' }, null, 2);
    store.mermaid = newConfigStr;
    store.lastValidMermaid = newConfigStr;
    store.configError = undefined;
  }
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

export const getSessionJSON = () => {
  return JSON.stringify({
    schemaVersion: 'mermaid-session-v1',
    code: store.code,
    config: JSON.parse(store.lastValidMermaid),
    appTheme: store.theme,
    activeTab: store.editorMode,
    diagramType: store.diagramType
  }, null, 2);
};

export const importSessionJSON = (jsonStr) => {
  try {
    const parsed = JSON.parse(jsonStr);
    mermaidSessionSchema.parse(parsed);
    
    // update all state atomically
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
  } catch (e) {
    if (e instanceof SyntaxError) {
       return { ok: false, error: "Invalid JSON", field: "document" };
    }
    const err = e.errors?.[0];
    return { ok: false, error: err?.message || String(e), field: err?.path?.[0] || 'document' };
  }
};

export const importMMD = (mmdStr) => {
  if (!mmdStr.trim()) {
    store.code = '';
    store.renderCount += 1;
    persist();
    revalidate();
    return { ok: true };
  }
  setCode(mmdStr);
  return { ok: true };
};

export const init = () => {
  document.documentElement.classList.toggle('dark', store.theme === 'dark');
  void doRevalidate();
};
