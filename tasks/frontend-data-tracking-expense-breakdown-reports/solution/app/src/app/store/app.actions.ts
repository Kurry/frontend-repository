import { createAction, props } from '@ngrx/store';
import type { AppState, Transaction } from '../core/model';

export const createTransaction = createAction(
  '[Ledger] Create transaction',
  props<{ transaction: Transaction }>(),
);
export const updateTransaction = createAction(
  '[Ledger] Update transaction',
  props<{ transaction: Transaction }>(),
);
export const deleteTransactions = createAction('[Ledger] Delete transactions', props<{ ids: string[] }>());
export const bulkCategorize = createAction(
  '[Ledger] Bulk categorize',
  props<{ ids: string[]; category: string }>(),
);
export const importTransactions = createAction(
  '[Ledger] Import transactions',
  props<{ transactions: Transaction[]; mode: 'replace' | 'append' }>(),
);

export const toggleSelect = createAction('[Ledger] Toggle select', props<{ id: string }>());
export const setSelection = createAction('[Ledger] Set selection', props<{ ids: string[] }>());
export const clearSelection = createAction('[Ledger] Clear selection');

export const setChartMode = createAction('[Ledger] Set chart mode', props<{ mode: 'breakdown' | 'trends' }>());
export const setCeiling = createAction('[Ledger] Set burn-rate ceiling', props<{ ceiling: number }>());

export const applyFilter = createAction(
  '[Ledger] Apply filter',
  props<{ key: keyof AppState['filters']; value: string | null }>(),
);
export const clearFilters = createAction('[Ledger] Clear filters');

export const setSort = createAction(
  '[Ledger] Set sort',
  props<{ key: 'date' | 'amount'; dir: 'asc' | 'desc' }>(),
);

export const showToast = createAction('[Ledger] Show toast', props<{ message: string; nonce: number }>());
export const hideToast = createAction('[Ledger] Hide toast');

export const openDrawer = createAction('[Ledger] Open export drawer', props<{ tab: 'markdown' | 'json' }>());
export const closeDrawer = createAction('[Ledger] Close export drawer');

export const openPalette = createAction('[Ledger] Open command palette');
export const closePalette = createAction('[Ledger] Close command palette');

export const openImport = createAction('[Ledger] Open import panel');
export const closeImport = createAction('[Ledger] Close import panel');

export const openDialog = createAction(
  '[Ledger] Open transaction dialog',
  props<{ mode: 'create' | 'edit'; id: string | null; prefill: Record<string, string> | null }>(),
);
export const closeDialog = createAction('[Ledger] Close transaction dialog');

export const openConfirm = createAction(
  '[Ledger] Open delete confirm',
  props<{ kind: 'single' | 'bulk'; ids: string[] }>(),
);
export const closeConfirm = createAction('[Ledger] Close delete confirm');

export const setDrill = createAction('[Ledger] Set sankey drill', props<{ category: string | null }>());
export const flashCategory = createAction('[Ledger] Flash legend', props<{ category: string; nonce: number }>());
