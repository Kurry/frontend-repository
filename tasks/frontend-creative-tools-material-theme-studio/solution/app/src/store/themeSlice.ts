import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PaletteColor {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

export interface ThemeOptions {
  palette: {
    type: 'light' | 'dark';
    primary: PaletteColor;
    secondary: PaletteColor;
    error: PaletteColor;
    warning: PaletteColor;
    info: PaletteColor;
    success: PaletteColor;
    background?: { default: string; paper: string };
    text?: { primary: string; secondary: string; disabled?: string; hint?: string };
    divider?: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    button?: { textTransform: string };
  };
  shape: {
    borderRadius: number;
  };
  spacing?: number;
}

export interface SavedTheme {
  id: string;
  name: string;
  options: ThemeOptions;
  updatedAt: number;
  fonts?: string[];
  versions?: { name: string; options: ThemeOptions; createdAt: number }[];
}

export interface AppState {
  themes: SavedTheme[];
  activeId: string;
  activeOptions: ThemeOptions;
  tab: 'preview' | 'components' | 'saved' | 'export';
  device: 'phone' | 'tablet' | 'desktop';
  sample: string;
  tool: 'palette' | 'fonts' | 'typography' | 'snippets';
  colorBlindness: 'None' | 'Protanopia' | 'Deuteranopia' | 'Tritanopia';
  compareMode: boolean;
  fonts: string[];
  undoStack: ThemeOptions[];
  redoStack: ThemeOptions[];
  editorSyncing: boolean;
  dirty: boolean;
  searchQuery: string;
}

export const defaultPaletteColor = (hex: string): PaletteColor => ({
  main: hex,
  light: hex,
  dark: hex,
  contrastText: '#ffffff',
});

const defaultThemeOptions: ThemeOptions = {
  palette: {
    type: 'light',
    primary: defaultPaletteColor('#1976d2'),
    secondary: defaultPaletteColor('#dc004e'),
    error: defaultPaletteColor('#f44336'),
    warning: defaultPaletteColor('#ff9800'),
    info: defaultPaletteColor('#2196f3'),
    success: defaultPaletteColor('#4caf50'),
    background: { default: '#fafafa', paper: '#ffffff' },
    text: { primary: 'rgba(0, 0, 0, 0.87)', secondary: 'rgba(0, 0, 0, 0.54)', disabled: 'rgba(0, 0, 0, 0.38)', hint: 'rgba(0, 0, 0, 0.38)' },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    fontSize: 14,
    button: { textTransform: 'uppercase' },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
};

const seedThemes: SavedTheme[] = [
  { id: 'default', name: 'Default Theme', options: JSON.parse(JSON.stringify(defaultThemeOptions)), updatedAt: Date.now() },
  { id: 'dark-starter', name: 'Dark Starter', options: { ...JSON.parse(JSON.stringify(defaultThemeOptions)), palette: { ...JSON.parse(JSON.stringify(defaultThemeOptions)).palette, type: 'dark', primary: defaultPaletteColor('#90caf9'), secondary: defaultPaletteColor('#f48fb1') } }, updatedAt: Date.now() },
  { id: 'green', name: 'Forest', options: { ...JSON.parse(JSON.stringify(defaultThemeOptions)), palette: { ...JSON.parse(JSON.stringify(defaultThemeOptions)).palette, primary: defaultPaletteColor('#2e7d32'), secondary: defaultPaletteColor('#ff6f00') } }, updatedAt: Date.now() },
];

function loadInitialState(): Partial<AppState> {
  try {
    const rawThemes = localStorage.getItem('themeStudio_themes');
    const rawActiveId = localStorage.getItem('themeStudio_activeId');
    if (rawThemes) {
      const themes = JSON.parse(rawThemes);
      const activeId = rawActiveId || (themes.length > 0 ? themes[0].id : 'default');
      const activeTheme = themes.find((t: SavedTheme) => t.id === activeId) || themes[0];
      return {
        themes,
        activeId: activeTheme ? activeTheme.id : 'default',
        activeOptions: activeTheme ? JSON.parse(JSON.stringify(activeTheme.options)) : JSON.parse(JSON.stringify(seedThemes[0].options)),
        fonts: activeTheme && activeTheme.fonts ? [...activeTheme.fonts] : ['Roboto']
      };
    }
  } catch (e) {
  }
  return {};
}

const loadedState = loadInitialState();

const initialState: AppState = {
  themes: loadedState.themes || seedThemes,
  activeId: loadedState.activeId || 'default',
  activeOptions: loadedState.activeOptions || JSON.parse(JSON.stringify(seedThemes[0].options)),
  tab: 'preview',
  device: 'desktop',
  sample: 'instructions',
  tool: 'palette',
  colorBlindness: 'None',
  compareMode: false,
  fonts: loadedState.fonts || ['Roboto'],
  undoStack: [],
  redoStack: [],
  editorSyncing: false,
  dirty: false,
  searchQuery: '',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTab: (state, action: PayloadAction<AppState['tab']>) => {
      state.tab = action.payload;
    },
    setDevice: (state, action: PayloadAction<AppState['device']>) => {
      state.device = action.payload;
    },
    setSample: (state, action: PayloadAction<string>) => {
      state.sample = action.payload;
    },
    setTool: (state, action: PayloadAction<AppState['tool']>) => {
      state.tool = action.payload;
    },
    setColorBlindness: (state, action: PayloadAction<AppState['colorBlindness']>) => {
      state.colorBlindness = action.payload;
    },
    setCompareMode: (state, action: PayloadAction<boolean>) => {
      state.compareMode = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    loadTheme: (state, action: PayloadAction<string>) => {
      const theme = state.themes.find(t => t.id === action.payload);
      if (theme) {
        state.activeId = theme.id;
        state.activeOptions = JSON.parse(JSON.stringify(theme.options));
        state.dirty = false;
        state.undoStack = [];
        state.redoStack = [];
        if (theme.fonts) {
            state.fonts = [...theme.fonts];
        } else {
            state.fonts = ['Roboto'];
        }
      }
    },
    updateActiveOptions: (state, action: PayloadAction<ThemeOptions>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state.activeOptions)));
      state.redoStack = [];
      state.activeOptions = action.payload;
      state.dirty = true;
    },
    updateActiveOptionsSilent: (state, action: PayloadAction<ThemeOptions>) => {
      state.activeOptions = action.payload;
      state.dirty = true;
    },
    undo: (state) => {
      if (state.undoStack.length > 0) {
        state.redoStack.push(JSON.parse(JSON.stringify(state.activeOptions)));
        state.activeOptions = state.undoStack.pop()!;
      }
    },
    redo: (state) => {
      if (state.redoStack.length > 0) {
        state.undoStack.push(JSON.parse(JSON.stringify(state.activeOptions)));
        state.activeOptions = state.redoStack.pop()!;
      }
    },
    saveTheme: (state) => {
      const themeIndex = state.themes.findIndex(t => t.id === state.activeId);
      if (themeIndex >= 0) {
        state.themes[themeIndex].options = JSON.parse(JSON.stringify(state.activeOptions));
        state.themes[themeIndex].updatedAt = Date.now();
        state.dirty = false;
      }
    },
    createTheme: (state, action: PayloadAction<{ id: string; name: string; options?: ThemeOptions }>) => {
      const newOptions = action.payload.options ? JSON.parse(JSON.stringify(action.payload.options)) : JSON.parse(JSON.stringify(state.activeOptions));
      const newTheme: SavedTheme = {
        id: action.payload.id,
        name: action.payload.name,
        options: newOptions,
        updatedAt: Date.now(),
        fonts: ['Roboto']
      };
      state.themes.push(newTheme);
    },
    updateTheme: (state, action: PayloadAction<{ id: string; name: string; options?: ThemeOptions }>) => {
      const theme = state.themes.find(t => t.id === action.payload.id);
      if (theme) {
        theme.name = action.payload.name;
        if (action.payload.options) {
            theme.options = JSON.parse(JSON.stringify(action.payload.options));
            theme.updatedAt = Date.now();
            if (state.activeId === theme.id) {
                state.activeOptions = JSON.parse(JSON.stringify(action.payload.options));
                state.dirty = false;
            }
        }
      }
    },
    deleteTheme: (state, action: PayloadAction<string>) => {
      state.themes = state.themes.filter(t => t.id !== action.payload);
      if (state.activeId === action.payload && state.themes.length > 0) {
          state.activeId = '';
      }
    },
    addVersion: (state, action: PayloadAction<string>) => {
        const theme = state.themes.find(t => t.id === state.activeId);
        if (theme) {
            if (!theme.versions) theme.versions = [];
            theme.versions.push({
                name: action.payload,
                options: JSON.parse(JSON.stringify(state.activeOptions)),
                createdAt: Date.now()
            });
        }
    },
    restoreVersion: (state, action: PayloadAction<ThemeOptions>) => {
        state.undoStack.push(JSON.parse(JSON.stringify(state.activeOptions)));
        state.redoStack = [];
        state.activeOptions = JSON.parse(JSON.stringify(action.payload));
        state.dirty = true;
    },
    importTheme: (state, action: PayloadAction<ThemeOptions>) => {
        state.undoStack.push(JSON.parse(JSON.stringify(state.activeOptions)));
        state.redoStack = [];
        state.activeOptions = JSON.parse(JSON.stringify(action.payload));
        state.dirty = true;
    },
    addFont: (state, action: PayloadAction<string>) => {
        if (!state.fonts.includes(action.payload)) {
            state.fonts.push(action.payload);
            const theme = state.themes.find(t => t.id === state.activeId);
            if (theme) {
                theme.fonts = [...state.fonts];
            }
        }
    },
    removeFont: (state, action: PayloadAction<string>) => {
        if (action.payload !== 'Roboto') {
            state.fonts = state.fonts.filter(f => f !== action.payload);
            const theme = state.themes.find(t => t.id === state.activeId);
            if (theme) {
                theme.fonts = [...state.fonts];
            }
        }
    },
    applySnippet: (state, action: PayloadAction<ThemeOptions>) => {
        state.undoStack.push(JSON.parse(JSON.stringify(state.activeOptions)));
        state.redoStack = [];
        state.activeOptions = JSON.parse(JSON.stringify(action.payload));
        state.dirty = true;
    }
  },
});

export const {
  setTab, setDevice, setSample, setTool, setColorBlindness, setCompareMode, setSearchQuery,
  loadTheme, updateActiveOptions, updateActiveOptionsSilent, undo, redo, saveTheme,
  createTheme, updateTheme, deleteTheme, addVersion, restoreVersion, importTheme,
  addFont, removeFont, applySnippet
} = themeSlice.actions;

export default themeSlice.reducer;
