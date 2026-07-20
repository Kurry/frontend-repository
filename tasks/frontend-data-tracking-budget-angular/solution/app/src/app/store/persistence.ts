import { ActionReducer, MetaReducer } from '@ngrx/store';
import { BudgetState } from './budget.reducer';

const STORAGE_KEY = 'budget-angular-state-v1';

export function loadPersistedState(): Partial<BudgetState> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const { undoStack, redoStack, ...persisted } = JSON.parse(raw);
    return persisted;
  } catch {
    return undefined;
  }
}

export function localStorageMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    const nextState = reducer(state, action);
    try {
      const { budget } = nextState;
      const { undoStack, redoStack, ...persisted } = budget;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // ignore quota / serialization errors
    }
    return nextState;
  };
}

export const metaReducers: MetaReducer<any>[] = [localStorageMetaReducer];
