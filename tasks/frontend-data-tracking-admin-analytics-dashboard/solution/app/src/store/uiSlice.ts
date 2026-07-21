import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SortKey } from '../data';

export type ViewKey =
  | 'operations-overview' | 'all-users' | 'add-user' | 'edit-user'
  | 'roles' | 'permissions' | 'user-logs' | 'user-stats' | 'user-payments' | 'user-products'
  | 'export-drawer';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast { id: string; kind: ToastKind; title: string; body?: string; }
export interface ConfirmState { open: boolean; title: string; body: string; ids: string[]; }

export interface UIState {
  theme: 'light' | 'dark';
  accent: 'teal' | 'amber' | 'sky' | 'rose';
  activeView: ViewKey;
  sidebarOpen: boolean;
  expandedGroup: string | null;
  filterRole: string;
  filterStatus: string;
  search: string;
  sort: SortKey;
  exportOpen: boolean;
  exportTab: 'json' | 'csv';
  density: 'comfortable' | 'compact';
  selection: string[];
  editingId: string | null;
  toasts: Toast[];
  confirm: ConfirmState;
  lastMutation: string | null;
  draftUserForm: any;
}

const initialState: UIState = {
  theme: 'dark',
  accent: 'teal',
  activeView: 'operations-overview',
  sidebarOpen: false,
  expandedGroup: 'users',
  filterRole: '',
  filterStatus: '',
  search: '',
  sort: 'newest',
  exportOpen: false,
  exportTab: 'json',
  density: 'comfortable',
  selection: [],
  editingId: null,
  toasts: [],
  confirm: { open: false, title: '', body: '', ids: [] },
  lastMutation: null,
  draftUserForm: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (s, a: PayloadAction<'light' | 'dark'>) => { s.theme = a.payload; },
    toggleTheme: (s) => { s.theme = s.theme === 'dark' ? 'light' : 'dark'; },
    setAccent: (s, a: PayloadAction<UIState['accent']>) => { s.accent = a.payload; },
    setActiveView: (s, a: PayloadAction<ViewKey>) => { s.activeView = a.payload; if (a.payload !== 'edit-user') s.editingId = null; },
    setSidebarOpen: (s, a: PayloadAction<boolean>) => { s.sidebarOpen = a.payload; },
    setExpandedGroup: (s, a: PayloadAction<string | null>) => { s.expandedGroup = s.expandedGroup === a.payload ? null : a.payload; },
    setFilterRole: (s, a: PayloadAction<string>) => { s.filterRole = a.payload; },
    setFilterStatus: (s, a: PayloadAction<string>) => { s.filterStatus = a.payload; },
    setSearch: (s, a: PayloadAction<string>) => { s.search = a.payload; },
    setSort: (s, a: PayloadAction<SortKey>) => { s.sort = a.payload; },
    setExportOpen: (s, a: PayloadAction<boolean>) => { s.exportOpen = a.payload; },
    setExportTab: (s, a: PayloadAction<'json' | 'csv'>) => { s.exportTab = a.payload; },
    setDensity: (s, a: PayloadAction<UIState['density']>) => { s.density = a.payload; },
    setSelection: (s, a: PayloadAction<string[]>) => { s.selection = a.payload; },
    toggleSelection: (s, a: PayloadAction<string>) => {
      const i = s.selection.indexOf(a.payload);
      if (i >= 0) s.selection.splice(i, 1); else s.selection.push(a.payload);
    },
    clearSelection: (s) => { s.selection = []; },
    setEditingId: (s, a: PayloadAction<string | null>) => { s.editingId = a.payload; s.activeView = a.payload ? 'edit-user' : 'all-users'; },
    pushToast: (s, a: PayloadAction<Omit<Toast, 'id'>>) => {
      s.toasts.push({ ...a.payload, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
    },
    dismissToast: (s, a: PayloadAction<string>) => { s.toasts = s.toasts.filter((t) => t.id !== a.payload); },
    setConfirm: (s, a: PayloadAction<ConfirmState>) => { s.confirm = a.payload; },
    setLastMutation: (s, a: PayloadAction<string | null>) => { s.lastMutation = a.payload; },
    setDraftUserForm: (s, a: PayloadAction<any>) => { s.draftUserForm = a.payload; },
    resetFilters: (s) => { s.filterRole = ''; s.filterStatus = ''; s.search = ''; },
  },
});

export const {
  setTheme, toggleTheme, setAccent, setActiveView, setSidebarOpen, setExpandedGroup,
  setFilterRole, setFilterStatus, setSearch, setSort, setExportOpen, setExportTab, setDensity,
  setSelection, toggleSelection, clearSelection, setEditingId, pushToast, dismissToast,
  setConfirm, setLastMutation, setDraftUserForm, resetFilters,
} = uiSlice.actions;
export default uiSlice.reducer;
