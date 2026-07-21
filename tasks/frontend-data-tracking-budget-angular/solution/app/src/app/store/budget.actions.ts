import { createAction, props } from '@ngrx/store';
import { Expense, Period, RecurringRule } from '../models/models';

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

export const importExpenses = createAction(
  '[Import] Commit CSV Expenses',
  props<{ expenses: Expense[] }>()
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

export const addRecurringRule = createAction(
  '[Recurring] Add Rule',
  props<{ rule: RecurringRule }>()
);

export const updateRecurringRule = createAction(
  '[Recurring] Update Rule',
  props<{ key: string; rule: RecurringRule }>()
);

export const deleteRecurringRule = createAction(
  '[Recurring] Delete Rule',
  props<{ key: string }>()
);

export const detachRecurringInstance = createAction(
  '[Recurring] Detach Instance',
  props<{ syntheticId: string }>()
);

export const bulkCategorize = createAction(
  '[Expenses] Bulk Categorize',
  props<{ ids: string[]; categoryId: string }>()
);

export const bulkDelete = createAction(
  '[Expenses] Bulk Delete',
  props<{ ids: string[] }>()
);

export const setSelection = createAction(
  '[Expenses] Set Selection',
  props<{ ids: string[] }>()
);

export const undo = createAction('[App] Undo');
export const redo = createAction('[App] Redo');

export const hydrateState = createAction(
  '[App] Hydrate State',
  props<{ state: any }>()
);
