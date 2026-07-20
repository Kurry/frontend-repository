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
export const selectThresholdPercent = createSelector(selectBudgetState, (s) => s.thresholdPercent);
export const selectCanUndo = createSelector(selectBudgetState, (s) => s.undoStack.length > 0);
export const selectCanRedo = createSelector(selectBudgetState, (s) => s.redoStack.length > 0);

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
  variance: number;
  isOverBudget: boolean;
  projectedOverage: boolean;
  projected: number;
  overThreshold: boolean;
}

export const selectBudgetsByCategory = createSelector(
  selectCategories,
  selectBudgetDefinitions,
  selectExpensesForPeriod,
  selectThresholdPercent,
  selectPeriod,
  (categories, definitions, expenses, thresholdPercent, period): CategoryBudgetView[] => {
    const now = new Date();
    const daysInMonth = new Date(period.year, period.month, 0).getDate();
    const isCurrentMonth = period.year === now.getFullYear() && period.month === now.getMonth() + 1;
    const daysElapsed = expenses.length === 0
      ? 0
      : isCurrentMonth
        ? now.getDate()
        : Math.max(...expenses.map(expense => Number(expense.datetime.slice(8, 10))));

    return categories.map((c) => {
      const def = definitions.find((d) => d.categoryId === c.id);
      const maxExpenses = def ? def.maxExpenses : 0;
      const categoryExpenses = expenses.filter((e) => e.categoryId === c.id);
      const currentExpenses = categoryExpenses
        .reduce((sum, e) => sum + e.value, 0);
      const left = maxExpenses - currentExpenses;
      const leftPercentage = maxExpenses > 0 ? Math.min(100, (100 * currentExpenses) / maxExpenses) : 0;

      const variance = maxExpenses - currentExpenses;
      const isOverBudget = currentExpenses > maxExpenses;

      const overThreshold = maxExpenses > 0 && currentExpenses >= (maxExpenses * (thresholdPercent / 100));
      const projected = daysElapsed > 0 ? (currentExpenses / daysElapsed) * daysInMonth : 0;
      const projectedOverage = maxExpenses > 0 && projected > maxExpenses;

      return {
        categoryId: c.id,
        name: c.name,
        currentExpenses,
        maxExpenses,
        left,
        leftPercentage,
        variance,
        isOverBudget,
        projectedOverage,
        projected,
        overThreshold
      };
    });
  }
);

export const selectBudgetSummary = createSelector(selectBudgetsByCategory, (rows) => {
  const totalBudget = rows.reduce((sum, r) => sum + r.maxExpenses, 0);
  const totalExpenses = rows.reduce((sum, r) => sum + r.currentExpenses, 0);
  return { totalBudget, totalExpenses, totalLeft: totalBudget - totalExpenses };
});
