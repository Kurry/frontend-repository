import { createReducer, on } from '@ngrx/store';
import * as BudgetActions from './budget.actions';
import { BudgetDefinition, Expense, ExpenseCategory, Period, RecurringRule } from '../models/models';
import { SEED_BUDGET_DEFINITIONS, SEED_CATEGORIES, SEED_EXPENSES, SEED_PERIOD } from './seed-data';
import { loadPersistedState } from './persistence';

export interface BudgetState {
  view: 'dashboard' | 'expenses' | 'settings' | 'export';
  expenses: Expense[];
  categories: ExpenseCategory[];
  budgetDefinitions: BudgetDefinition[];
  period: Period;
  filterCategoryId: string | null;
  displayName: string;
  thresholdPercent: number;
  recurringRules: RecurringRule[];
  nextExpenseSeq: number;
  nextCategorySeq: number;
  undoStack: any[];
  redoStack: any[];
}

const defaultState: BudgetState = {
  view: 'dashboard',
  expenses: SEED_EXPENSES,
  categories: SEED_CATEGORIES,
  budgetDefinitions: SEED_BUDGET_DEFINITIONS,
  period: SEED_PERIOD,
  filterCategoryId: null,
  displayName: 'john@app.com',
  thresholdPercent: 80,
  recurringRules: [],
  nextExpenseSeq: SEED_EXPENSES.length + 1,
  nextCategorySeq: 1,
  undoStack: [],
  redoStack: [],
};

const persisted = loadPersistedState();

export const initialState: BudgetState = persisted ? { ...defaultState, ...persisted, view: 'dashboard' } : defaultState;

function shiftPeriod(period: Period, delta: number): Period {
  const totalMonths = period.year * 12 + (period.month - 1) + delta;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return { month, year };
}

function saveUndoState(state: BudgetState): BudgetState {
  const { undoStack, redoStack, ...rest } = state;
  return {
    ...state,
    undoStack: [...undoStack, rest],
    redoStack: [],
  };
}

function nextExpenseSequence(expenses: Expense[]): number {
  return expenses.reduce((max, expense) => {
    const match = /^e(\d+)$/.exec(expense.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;
}

function nextCategorySequence(categories: ExpenseCategory[]): number {
  return categories.reduce((max, category) => {
    const match = /^custom-(\d+)$/.exec(category.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;
}

export const budgetReducer = createReducer(
  initialState,
  on(BudgetActions.undo, (state) => {
    if (state.undoStack.length === 0) return state;
    const previousState = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    const { undoStack, redoStack, ...rest } = state;
    return {
      ...previousState,
      undoStack: newUndoStack,
      redoStack: [...state.redoStack, rest],
    };
  }),
  on(BudgetActions.redo, (state) => {
    if (state.redoStack.length === 0) return state;
    const nextState = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);
    const { undoStack, redoStack, ...rest } = state;
    return {
      ...nextState,
      undoStack: [...state.undoStack, rest],
      redoStack: newRedoStack,
    };
  }),
  on(BudgetActions.setView, (state, { view }) => ({ ...state, view })),
  on(BudgetActions.addExpense, (state, { value, datetime, categoryId, counterparty }) => {
    const id = 'e' + state.nextExpenseSeq;
    const d = new Date(datetime);
    const period: Period = { month: d.getMonth() + 1, year: d.getFullYear() };
    const expense: Expense = { id, value, datetime, categoryId, counterparty, period };
    const saved = saveUndoState(state);
    return {
      ...saved,
      expenses: [...saved.expenses, expense],
      nextExpenseSeq: saved.nextExpenseSeq + 1,
    };
  }),
  on(BudgetActions.updateExpense, (state, { id, value, datetime, categoryId, counterparty }) => {
    const d = new Date(datetime);
    const period: Period = { month: d.getMonth() + 1, year: d.getFullYear() };
    const saved = saveUndoState(state);
    return {
      ...saved,
      expenses: saved.expenses.map((e) =>
        e.id === id ? { ...e, value, datetime, categoryId, counterparty, period } : e
      ),
    };
  }),
  on(BudgetActions.deleteExpense, (state, { id }) => {
    const saved = saveUndoState(state);
    return {
      ...saved,
      expenses: saved.expenses.filter((e) => e.id !== id),
    };
  }),
  on(BudgetActions.importExpenses, (state, { expenses }) => {
    if (expenses.length === 0) return state;
    const saved = saveUndoState(state);
    return {
      ...saved,
      expenses: [...saved.expenses, ...expenses],
    };
  }),
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
    const saved = saveUndoState(state);
    return {
      ...saved,
      categories: [...saved.categories, category],
      budgetDefinitions: [...saved.budgetDefinitions, { categoryId: id, maxExpenses: 0 }],
      nextCategorySeq: saved.nextCategorySeq + 1,
    };
  }),
  on(BudgetActions.renameCategory, (state, { id, name }) => {
    const saved = saveUndoState(state);
    return {
      ...saved,
      categories: saved.categories.map((c) => (c.id === id ? { ...c, name } : c)),
    };
  }),
  on(BudgetActions.deleteCategory, (state, { id }) => {
    const saved = saveUndoState(state);
    return {
      ...saved,
      categories: saved.categories.filter((c) => c.id !== id),
      budgetDefinitions: saved.budgetDefinitions.filter((b) => b.categoryId !== id),
    };
  }),
  on(BudgetActions.setDisplayName, (state, { name }) => {
    if (state.displayName === name) return state;
    return { ...saveUndoState(state), displayName: name };
  }),
  on(BudgetActions.setThresholdPercent, (state, { thresholdPercent }) => {
    if (state.thresholdPercent === thresholdPercent) return state;
    return { ...saveUndoState(state), thresholdPercent };
  }),
  on(BudgetActions.hydrateState, (state, { state: persisted }) => {
    const saved = saveUndoState(state);
    return {
      ...saved,
      ...persisted,
      nextExpenseSeq: Array.isArray(persisted.expenses)
        ? nextExpenseSequence(persisted.expenses)
        : saved.nextExpenseSeq,
      nextCategorySeq: Array.isArray(persisted.categories)
        ? nextCategorySequence(persisted.categories)
        : saved.nextCategorySeq,
    };
  })
);
