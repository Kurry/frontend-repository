import { createReducer, on } from '@ngrx/store';
import * as BudgetActions from './budget.actions';
import { BudgetDefinition, Expense, ExpenseCategory, Period, RecurringRule } from '../models/models';
import { SEED_BUDGET_DEFINITIONS, SEED_CATEGORIES, SEED_EXPENSES, SEED_PERIOD } from './seed-data';
import { loadPersistedState } from './persistence';

export interface RecurringRuleState extends RecurringRule {
  key: string;
}

export interface BudgetState {
  view: 'dashboard' | 'expenses' | 'settings' | 'export';
  expenses: Expense[];
  categories: ExpenseCategory[];
  budgetDefinitions: BudgetDefinition[];
  period: Period;
  filterCategoryId: string | null;
  displayName: string;
  thresholdPercent: number;
  recurringRules: RecurringRuleState[];
  detachedRuleInstances: string[];
  selectedExpenseIds: string[];
  nextExpenseSeq: number;
  nextCategorySeq: number;
  nextRuleSeq: number;
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
  detachedRuleInstances: [],
  selectedExpenseIds: [],
  nextExpenseSeq: SEED_EXPENSES.length + 1,
  nextCategorySeq: 1,
  nextRuleSeq: 1,
  undoStack: [],
  redoStack: [],
};

const persisted = loadPersistedState();

export const initialState: BudgetState = persisted
  ? {
      ...defaultState,
      ...persisted,
      recurringRules: (persisted as any).recurringRules ?? [],
      detachedRuleInstances: (persisted as any).detachedRuleInstances ?? [],
      selectedExpenseIds: [],
      nextRuleSeq: (persisted as any).nextRuleSeq ?? 1,
      view: 'dashboard',
    }
  : defaultState;

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

function nextRuleSequence(rules: RecurringRuleState[]): number {
  return rules.reduce((max, rule) => {
    const match = /^r(\d+)$/.exec(rule.key);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;
}

export function isDerivedExpenseId(id: string): boolean {
  return id.startsWith('rr:');
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
      selectedExpenseIds: [],
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
      selectedExpenseIds: [],
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
      selectedExpenseIds: saved.selectedExpenseIds.filter((sid) => sid !== id),
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
  on(BudgetActions.setPeriod, (state, { period }) => ({ ...state, period, selectedExpenseIds: [] })),
  on(BudgetActions.nextPeriod, (state) => ({ ...state, period: shiftPeriod(state.period, 1), selectedExpenseIds: [] })),
  on(BudgetActions.previousPeriod, (state) => ({ ...state, period: shiftPeriod(state.period, -1), selectedExpenseIds: [] })),
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
      recurringRules: saved.recurringRules.filter((r) => r.categoryId !== id),
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
  on(BudgetActions.addRecurringRule, (state, { rule }) => {
    const key = 'r' + state.nextRuleSeq;
    const saved = saveUndoState(state);
    return {
      ...saved,
      recurringRules: [...saved.recurringRules, { key, ...rule }],
      nextRuleSeq: saved.nextRuleSeq + 1,
    };
  }),
  on(BudgetActions.updateRecurringRule, (state, { key, rule }) => {
    const saved = saveUndoState(state);
    return {
      ...saved,
      recurringRules: saved.recurringRules.map((r) => (r.key === key ? { key, ...rule } : r)),
    };
  }),
  on(BudgetActions.deleteRecurringRule, (state, { key }) => {
    const saved = saveUndoState(state);
    return {
      ...saved,
      recurringRules: saved.recurringRules.filter((r) => r.key !== key),
    };
  }),
  on(BudgetActions.detachRecurringInstance, (state, { syntheticId }) => {
    if (state.detachedRuleInstances.includes(syntheticId)) return state;
    const saved = saveUndoState(state);
    return { ...saved, detachedRuleInstances: [...saved.detachedRuleInstances, syntheticId] };
  }),
  on(BudgetActions.bulkCategorize, (state, { ids, categoryId }) => {
    if (ids.length === 0) return state;
    const idSet = new Set(ids);
    const realIds = ids.filter((id) => !isDerivedExpenseId(id));
    const derivedIds = ids.filter((id) => isDerivedExpenseId(id));
    const saved = saveUndoState(state);
    const derivedById = new Map<string, Expense>();
    // Build derived instances for the current period to materialise any selected derived rows.
    const period = saved.period;
    const detached = new Set(saved.detachedRuleInstances);
    const storedRecurringKeys = new Set(
      saved.expenses
        .filter((e) => e.recurring)
        .map((e) => `${e.counterparty}::${e.categoryId}::${e.period.month}-${e.period.year}-${Number(e.datetime.slice(8, 10))}`)
    );
    saved.recurringRules.forEach((rule) => {
      const syntheticId = `rr:${rule.key}:${period.month}-${period.year}`;
      if (detached.has(syntheticId)) return;
      const storedKey = `${rule.name}::${rule.categoryId}::${period.month}-${period.year}-${rule.dayOfMonth}`;
      if (storedRecurringKeys.has(storedKey)) return;
      const day = String(rule.dayOfMonth).padStart(2, '0');
      const month = String(period.month).padStart(2, '0');
      derivedById.set(syntheticId, {
        id: syntheticId,
        value: rule.value,
        datetime: `${period.year}-${month}-${day}`,
        categoryId: rule.categoryId,
        counterparty: rule.name,
        period,
        recurring: true,
      });
    });
    const materialised: Expense[] = derivedIds
      .filter((id) => idSet.has(id) && derivedById.has(id))
      .map((id) => {
        const inst = derivedById.get(id)!;
        return { ...inst, id: 'e' + saved.nextExpenseSeq + materialised.length, categoryId, recurring: false };
      });
    // Recalculate nextExpenseSeq accounting for materialised rows.
    const nextSeq = saved.nextExpenseSeq + materialised.length;
    return {
      ...saved,
      expenses: [
        ...saved.expenses.map((e) => (realIds.includes(e.id) ? { ...e, categoryId } : e)),
        ...materialised,
      ],
      detachedRuleInstances: [...saved.detachedRuleInstances, ...derivedIds.filter((id) => idSet.has(id))],
      nextExpenseSeq: nextSeq,
      selectedExpenseIds: [],
    };
  }),
  on(BudgetActions.bulkDelete, (state, { ids }) => {
    if (ids.length === 0) return state;
    const realIds = new Set(ids.filter((id) => !isDerivedExpenseId(id)));
    const derivedIds = ids.filter((id) => isDerivedExpenseId(id));
    const saved = saveUndoState(state);
    return {
      ...saved,
      expenses: saved.expenses.filter((e) => !realIds.has(e.id)),
      detachedRuleInstances: [...saved.detachedRuleInstances, ...derivedIds],
      selectedExpenseIds: [],
    };
  }),
  on(BudgetActions.setSelection, (state, { ids }) => ({ ...state, selectedExpenseIds: ids })),
  on(BudgetActions.hydrateState, (state, { state: persistedState }) => {
    const saved = saveUndoState(state);
    const merged = {
      ...saved,
      ...persistedState,
      selectedExpenseIds: [],
      detachedRuleInstances: Array.isArray(persistedState.detachedRuleInstances) ? persistedState.detachedRuleInstances : saved.detachedRuleInstances,
      recurringRules: Array.isArray(persistedState.recurringRules) ? persistedState.recurringRules : saved.recurringRules,
      nextExpenseSeq: Array.isArray(persistedState.expenses)
        ? nextExpenseSequence(persistedState.expenses)
        : saved.nextExpenseSeq,
      nextCategorySeq: Array.isArray(persistedState.categories)
        ? nextCategorySequence(persistedState.categories)
        : saved.nextCategorySeq,
      nextRuleSeq: Array.isArray(persistedState.recurringRules)
        ? nextRuleSequence(persistedState.recurringRules)
        : saved.nextRuleSeq,
    };
    return merged;
  })
);
