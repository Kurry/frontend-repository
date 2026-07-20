import { createAction, props } from '@ngrx/store';
import { Transaction, AppState } from './app.state';

export const createTransaction = createAction('[App] Create Transaction', props<{ transaction: Transaction }>());
export const updateTransaction = createAction('[App] Update Transaction', props<{ transaction: Transaction }>());
export const deleteTransaction = createAction('[App] Delete Transaction', props<{ id: string }>());
export const deleteTransactions = createAction('[App] Delete Transactions', props<{ ids: string[] }>());
export const deleteAllTransactions = createAction('[App] Delete All Transactions');
export const selectTransaction = createAction('[App] Select Transaction', props<{ id: string }>());
export const deselectTransaction = createAction('[App] Deselect Transaction', props<{ id: string }>());
export const toggleTransactionSelection = createAction('[App] Toggle Transaction Selection', props<{ id: string }>());
export const clearSelection = createAction('[App] Clear Selection');

export const setChartMode = createAction('[App] Set Chart Mode', props<{ mode: 'breakdown' | 'trends' }>());
export const setBurnRateCeiling = createAction('[App] Set Burn Rate Ceiling', props<{ ceiling: number }>());

export const applyFilter = createAction('[App] Apply Filter', props<{ filterType: keyof AppState['filters'], value: string | null }>());
export const clearFilters = createAction('[App] Clear Filters');

export const showToast = createAction('[App] Show Toast', props<{ message: string }>());
export const hideToast = createAction('[App] Hide Toast');

export const toggleDrawer = createAction('[App] Toggle Drawer', props<{ open: boolean }>());
export const toggleCommandPalette = createAction('[App] Toggle Command Palette', props<{ open: boolean }>());

export const importTransactions = createAction('[App] Import Transactions', props<{ transactions: Transaction[] }>());
