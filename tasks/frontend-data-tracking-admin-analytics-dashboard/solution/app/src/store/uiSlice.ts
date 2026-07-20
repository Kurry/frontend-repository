import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  theme: 'light' | 'dark';
  activeView: 'operations-overview' | 'all-users' | 'add-user' | 'roles' | 'permissions' | 'user-logs' | 'user-stats' | 'user-payments' | 'user-products';
  sidebarOpen: boolean;
  filterRole: string;
  filterStatus: string;
  sortCriteria: 'last-active' | 'newest' | 'highest-spend' | 'name-az';
  exportDrawerOpen: boolean;
  exportPreviewTab: 'json' | 'csv';
}

const initialState: UIState = {
  theme: 'dark',
  activeView: 'operations-overview',
  sidebarOpen: false,
  filterRole: '',
  filterStatus: '',
  sortCriteria: 'newest',
  exportDrawerOpen: false,
  exportPreviewTab: 'json',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      document.documentElement.setAttribute("data-theme", action.payload);
      localStorage.setItem("theme", action.payload);
    },
    setActiveView: (state, action: PayloadAction<UIState['activeView']>) => {
      state.activeView = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setFilterRole: (state, action: PayloadAction<string>) => {
      state.filterRole = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterStatus = action.payload;
    },
    setSortCriteria: (state, action: PayloadAction<UIState['sortCriteria']>) => {
      state.sortCriteria = action.payload;
    },
    setExportDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.exportDrawerOpen = action.payload;
    },
    setExportPreviewTab: (state, action: PayloadAction<'json' | 'csv'>) => {
      state.exportPreviewTab = action.payload;
    },
  },
});

export const { setTheme, setActiveView, setSidebarOpen, setFilterRole, setFilterStatus, setSortCriteria, setExportDrawerOpen, setExportPreviewTab } = uiSlice.actions;
export default uiSlice.reducer;
