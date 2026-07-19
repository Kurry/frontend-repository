import { createReducer, on } from '@ngrx/store';
import * as BudgetActions from './budget.actions';
import { BudgetDefinition, Expense, ExpenseCategory, Period } from '../models/models';
import { SEED_BUDGET_DEFINITIONS, SEED_CATEGORIES, SEED_EXPENSES, SEED_PERIOD } from './seed-data';
import { loadPersistedState } from './persistence';

export interface BudgetState {
  view: 'dashboard' | 'expenses' | 'settings';
  expenses: Expense[];
  categories: ExpenseCategory[];
  budgetDefinitions: BudgetDefinition[];
  period: Period;
  filterCategoryId: string | null;
  displayName: string;
  nextExpenseSeq: number;
  nextCategorySeq: number;
}

const defaultState: BudgetState = {
  view: 'dashboard',
  expenses: SEED_EXPENSES,
  categories: SEED_CATEGORIES,
  budgetDefinitions: SEED_BUDGET_DEFINITIONS,
  period: SEED_PERIOD,
  filterCategoryId: null,
  displayName: 'john@app.com',
  nextExpenseSeq: SEED_EXPENSES.length + 1,
  nextCategorySeq: 1,
};

const persisted = loadPersistedState();

export const initialState: BudgetState = persisted ? { ...defaultState, ...persisted, view: 'dashboard' } : defaultState;

function shiftPeriod(period: Period, delta: number): Period {
  const totalMonths = period.year * 12 + (period.month - 1) + delta;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return { month, year };
}

export const budgetReducer = createReducer(
  initialState,
  on(BudgetActions.setView, (state, { view }) => ({ ...state, view })),
  on(BudgetActions.addExpense, (state, { value, datetime, categoryId, counterparty }) => {
    const id = 'e' + state.nextExpenseSeq;
    const d = new Date(datetime);
    const period: Period = { month: d.getMonth() + 1, year: d.getFullYear() };
    const expense: Expense = { id, value, datetime, categoryId, counterparty, period };
    return {
      ...state,
      expenses: [...state.expenses, expense],
      nextExpenseSeq: state.nextExpenseSeq + 1,
    };
  }),
  on(BudgetActions.updateExpense, (state, { id, value, datetime, categoryId, counterparty }) => {
    const d = new Date(datetime);
    const period: Period = { month: d.getMonth() + 1, year: d.getFullYear() };
    return {
      ...state,
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, value, datetime, categoryId, counterparty, period } : e
      ),
    };
  }),
  on(BudgetActions.deleteExpense, (state, { id }) => ({
    ...state,
    expenses: state.expenses.filter((e) => e.id !== id),
  })),
  on(BudgetActions.setFilterCategory, (state, { categoryId }) => ({
    ...state,
    filterCategoryId: categoryId,
  })),
  on(BudgetActions.setPeriod, (state, { period }) => ({ ...state, period })),
  on(BudgetActions.nextPeriod, (state) => ({ ...state, period: shiftPeriod(state.period, 1) })),
  on(BudgetActions.previousPeriod, (state) => ({ ...state, period: shiftPeriod(state.period, -1) })),
  on(BudgetActions.addCategory, (state, { name }) => {
    const id = 'custom-' + state.nextCategorySeq;
    const category: ExpenseCategory = { id, name, counterpartyPatterns: [] };
    return {
      ...state,
      categories: [...state.categories, category],
      budgetDefinitions: [...state.budgetDefinitions, { categoryId: id, maxExpenses: 0 }],
      nextCategorySeq: state.nextCategorySeq + 1,
    };
  }),
  on(BudgetActions.renameCategory, (state, { id, name }) => ({
    ...state,
    categories: state.categories.map((c) => (c.id === id ? { ...c, name } : c)),
  })),
  on(BudgetActions.deleteCategory, (state, { id }) => ({
    ...state,
    categories: state.categories.filter((c) => c.id !== id),
    budgetDefinitions: state.budgetDefinitions.filter((b) => b.categoryId !== id),
  })),
  on(BudgetActions.setDisplayName, (state, { name }) => ({ ...state, displayName: name })),
  on(BudgetActions.hydrateState, (state, { state: persisted }) => ({
    ...state,
    ...persisted,
  }))
);
