import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BudgetState } from './budget.reducer';
import { periodEquals } from '../models/models';

export const selectBudgetState = createFeatureSelector<BudgetState>('budget');

export const selectView = createSelector(selectBudgetState, (s) => s.view);
export const selectPeriod = createSelector(selectBudgetState, (s) => s.period);
export const selectCategories = createSelector(selectBudgetState, (s) => s.categories);
export const selectBudgetDefinitions = createSelector(selectBudgetState, (s) => s.budgetDefinitions);
export const selectFilterCategoryId = createSelector(selectBudgetState, (s) => s.filterCategoryId);
export const selectDisplayName = createSelector(selectBudgetState, (s) => s.displayName);

export const selectExpensesForPeriod = createSelector(
  selectBudgetState,
  (s) => s.expenses.filter((e) => periodEquals(e.period, s.period))
);

export const selectFilteredExpenses = createSelector(
  selectExpensesForPeriod,
  selectFilterCategoryId,
  (expenses, filterCategoryId) =>
    filterCategoryId ? expenses.filter((e) => e.categoryId === filterCategoryId) : expenses
);

export const selectFilteredExpensesSorted = createSelector(selectFilteredExpenses, (expenses) =>
  [...expenses].sort((a, b) => a.datetime.localeCompare(b.datetime))
);

export interface CategoryBudgetView {
  categoryId: string;
  name: string;
  currentExpenses: number;
  maxExpenses: number;
  left: number;
  leftPercentage: number;
}

export const selectBudgetsByCategory = createSelector(
  selectCategories,
  selectBudgetDefinitions,
  selectExpensesForPeriod,
  (categories, definitions, expenses): CategoryBudgetView[] =>
    categories.map((c) => {
      const def = definitions.find((d) => d.categoryId === c.id);
      const maxExpenses = def ? def.maxExpenses : 0;
      const currentExpenses = expenses
        .filter((e) => e.categoryId === c.id)
        .reduce((sum, e) => sum + e.value, 0);
      const left = maxExpenses - currentExpenses;
      const leftPercentage = maxExpenses > 0 ? Math.min(100, (100 * currentExpenses) / maxExpenses) : 0;
      return { categoryId: c.id, name: c.name, currentExpenses, maxExpenses, left, leftPercentage };
    })
);

export const selectBudgetSummary = createSelector(selectBudgetsByCategory, (rows) => {
  const totalBudget = rows.reduce((sum, r) => sum + r.maxExpenses, 0);
  const totalExpenses = rows.reduce((sum, r) => sum + r.currentExpenses, 0);
  return { totalBudget, totalExpenses, totalLeft: totalBudget - totalExpenses };
});
