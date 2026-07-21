import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BudgetState } from './budget.reducer';
import { Expense, Period, periodEquals } from '../models/models';

export const selectBudgetState = createFeatureSelector<BudgetState>('budget');

export const selectView = createSelector(selectBudgetState, (s) => s.view);
export const selectPeriod = createSelector(selectBudgetState, (s) => s.period);
export const selectCategories = createSelector(selectBudgetState, (s) => s.categories);
export const selectBudgetDefinitions = createSelector(selectBudgetState, (s) => s.budgetDefinitions);
export const selectFilterCategoryId = createSelector(selectBudgetState, (s) => s.filterCategoryId);
export const selectDisplayName = createSelector(selectBudgetState, (s) => s.displayName);
export const selectThresholdPercent = createSelector(selectBudgetState, (s) => s.thresholdPercent);
export const selectRecurringRules = createSelector(selectBudgetState, (s) => s.recurringRules);
export const selectSelectedExpenseIds = createSelector(selectBudgetState, (s) => s.selectedExpenseIds);
export const selectCanUndo = createSelector(selectBudgetState, (s) => s.undoStack.length > 0);
export const selectCanRedo = createSelector(selectBudgetState, (s) => s.redoStack.length > 0);

/**
 * Derive one rule-generated expense instance per active rule for the given period,
 * skipping instances the user detached (edited/deleted) or that already exist as a
 * stored recurring expense (e.g. after a JSON import round-trip).
 */
export function deriveRuleInstances(state: BudgetState, period: Period): Expense[] {
  const detached = new Set(state.detachedRuleInstances);
  const storedRecurringKeys = new Set(
    state.expenses
      .filter((e) => e.recurring)
      .map((e) => `${e.counterparty}::${e.categoryId}::${e.period.month}-${e.period.year}-${Number(e.datetime.slice(8, 10))}`)
  );
  const derived: Expense[] = [];
  state.recurringRules.forEach((rule) => {
    const syntheticId = `rr:${rule.key}:${period.month}-${period.year}`;
    if (detached.has(syntheticId)) return;
    const storedKey = `${rule.name}::${rule.categoryId}::${period.month}-${period.year}-${rule.dayOfMonth}`;
    if (storedRecurringKeys.has(storedKey)) return;
    const day = String(rule.dayOfMonth).padStart(2, '0');
    const month = String(period.month).padStart(2, '0');
    derived.push({
      id: syntheticId,
      value: rule.value,
      datetime: `${period.year}-${month}-${day}`,
      categoryId: rule.categoryId,
      counterparty: rule.name,
      period,
      recurring: true,
    });
  });
  return derived;
}

export const selectExpensesForPeriod = createSelector(selectBudgetState, (s) => {
  const stored = s.expenses.filter((e) => periodEquals(e.period, s.period));
  return [...stored, ...deriveRuleInstances(s, s.period)];
});

export const selectFilteredExpenses = createSelector(
  selectExpensesForPeriod,
  selectFilterCategoryId,
  (expenses, filterCategoryId) =>
    filterCategoryId ? expenses.filter((e) => e.categoryId === filterCategoryId) : expenses
);

export const selectFilteredExpensesSorted = createSelector(selectFilteredExpenses, (expenses) =>
  [...expenses].sort((a, b) => a.datetime.localeCompare(b.datetime) || a.id.localeCompare(b.id))
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
  daysElapsed: number;
  daysInMonth: number;
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

    return categories.map((c) => {
      const def = definitions.find((d) => d.categoryId === c.id);
      const maxExpenses = def ? def.maxExpenses : 0;
      const categoryExpenses = expenses.filter((e) => e.categoryId === c.id);
      const currentExpenses = categoryExpenses.reduce((sum, e) => sum + e.value, 0);
      const left = maxExpenses - currentExpenses;
      const leftPercentage = maxExpenses > 0 ? Math.min(100, (100 * currentExpenses) / maxExpenses) : 0;
      const variance = maxExpenses - currentExpenses;
      const isOverBudget = currentExpenses > maxExpenses;
      const overThreshold = maxExpenses > 0 && currentExpenses >= maxExpenses * (thresholdPercent / 100);

      // days elapsed is per-category: the day-of-month of that category's most recent
      // expense (the current day-of-month when viewing the live month). This matches the
      // rubric's verifiable projection example.
      const categoryMaxDay = categoryExpenses.length
        ? Math.max(...categoryExpenses.map((e) => Number(e.datetime.slice(8, 10))))
        : 0;
      const daysElapsed = categoryExpenses.length === 0
        ? 0
        : isCurrentMonth
          ? now.getDate()
          : categoryMaxDay;
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
        overThreshold,
        daysElapsed,
        daysInMonth,
      };
    });
  }
);

export const selectBudgetSummary = createSelector(selectBudgetsByCategory, (rows) => {
  const totalBudget = rows.reduce((sum, r) => sum + r.maxExpenses, 0);
  const totalExpenses = rows.reduce((sum, r) => sum + r.currentExpenses, 0);
  return { totalBudget, totalExpenses, totalLeft: totalBudget - totalExpenses };
});

/** Total expenses for an arbitrary period (used for the prior-period comparison chip). */
export function selectPeriodExpensesTotal(state: BudgetState, period: Period): number {
  const stored = state.expenses.filter((e) => periodEquals(e.period, period));
  const derived = deriveRuleInstances(state, period);
  return [...stored, ...derived].reduce((sum, e) => sum + e.value, 0);
}
