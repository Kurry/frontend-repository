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
  overThreshold: boolean;
}

export const selectBudgetsByCategory = createSelector(
  selectCategories,
  selectBudgetDefinitions,
  selectExpensesForPeriod,
  selectThresholdPercent,
  (categories, definitions, expenses, thresholdPercent): CategoryBudgetView[] =>
    categories.map((c) => {
      const def = definitions.find((d) => d.categoryId === c.id);
      const maxExpenses = def ? def.maxExpenses : 0;
      const currentExpenses = expenses
        .filter((e) => e.categoryId === c.id)
        .reduce((sum, e) => sum + e.value, 0);
      const left = maxExpenses - currentExpenses;
      const leftPercentage = maxExpenses > 0 ? Math.min(100, (100 * currentExpenses) / maxExpenses) : 0;

      const variance = maxExpenses - currentExpenses;
      const isOverBudget = currentExpenses > maxExpenses;

      // Simple projection: if over budget, then it's a projected overage. We could be smarter about days left in month.
      // Assuming for this task a projected overage flag might just be if it's over budget or will be.
      // Wait, let's calculate days passed vs days in month to project.
      let projectedOverage = false;
      const overThreshold = maxExpenses > 0 && currentExpenses >= (maxExpenses * (thresholdPercent / 100));

      if (expenses.length > 0 && maxExpenses > 0) {
          const now = new Date();
          const p = expenses[0].period;
          const daysInMonth = new Date(p.year, p.month, 0).getDate();

          let currentDay = now.getDate();
          if (p.year !== now.getFullYear() || p.month !== (now.getMonth() + 1)) {
              currentDay = daysInMonth;
          }
          const dailyRate = currentExpenses / currentDay;
          const projectedTotal = dailyRate * daysInMonth;
          if (projectedTotal > maxExpenses) {
              projectedOverage = true;
          }
      }

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
        overThreshold
      };
    })
);

export const selectBudgetSummary = createSelector(selectBudgetsByCategory, (rows) => {
  const totalBudget = rows.reduce((sum, r) => sum + r.maxExpenses, 0);
  const totalExpenses = rows.reduce((sum, r) => sum + r.currentExpenses, 0);
  return { totalBudget, totalExpenses, totalLeft: totalBudget - totalExpenses };
});
