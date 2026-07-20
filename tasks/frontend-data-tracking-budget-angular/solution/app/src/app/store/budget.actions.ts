import { createAction, props } from '@ngrx/store';
import { Expense, Period } from '../models/models';

export const setView = createAction(
  '[App] Set View',
  props<{ view: 'dashboard' | 'expenses' | 'settings' | 'export' }>()
);

export const addExpense = createAction(
  '[Expenses] Add Expense',
  props<{ value: number; datetime: string; categoryId: string; counterparty: string }>()
);

export const updateExpense = createAction(
  '[Expenses] Update Expense',
  props<{ id: string; value: number; datetime: string; categoryId: string; counterparty: string }>()
);

export const deleteExpense = createAction(
  '[Expenses] Delete Expense',
  props<{ id: string }>()
);

export const setFilterCategory = createAction(
  '[Expenses] Set Filter Category',
  props<{ categoryId: string | null }>()
);

export const setPeriod = createAction(
  '[Period] Set Period',
  props<{ period: Period }>()
);

export const nextPeriod = createAction('[Period] Next Period');
export const previousPeriod = createAction('[Period] Previous Period');

export const addCategory = createAction(
  '[Settings] Add Category',
  props<{ name: string }>()
);

export const renameCategory = createAction(
  '[Settings] Rename Category',
  props<{ id: string; name: string }>()
);

export const deleteCategory = createAction(
  '[Settings] Delete Category',
  props<{ id: string }>()
);

export const setDisplayName = createAction(
  '[Settings] Set Display Name',
  props<{ name: string }>()
);

export const setThresholdPercent = createAction(
  '[Settings] Set Threshold Percent',
  props<{ thresholdPercent: number }>()
);

export const undo = createAction('[App] Undo');
export const redo = createAction('[App] Redo');

export const hydrateState = createAction(
  '[App] Hydrate State',
  props<{ state: any }>()
);
