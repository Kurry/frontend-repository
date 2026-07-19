import { ActionReducer, MetaReducer } from '@ngrx/store';
import { BudgetState } from './budget.reducer';

const STORAGE_KEY = 'budget-angular-state-v1';

export function loadPersistedState(): Partial<BudgetState> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function localStorageMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    const nextState = reducer(state, action);
    try {
      const { budget } = nextState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
    } catch {
      // ignore quota / serialization errors
    }
    return nextState;
  };
}

export const metaReducers: MetaReducer<any>[] = [localStorageMetaReducer];
