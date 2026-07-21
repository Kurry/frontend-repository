import { ActionReducer, MetaReducer } from '@ngrx/store';
import { BudgetState } from './budget.reducer';

// Bumping this version invalidates localStorage written by earlier oracle builds
// (which seeded unrelated rows such as "Tech Corner"), forcing a clean re-seed on
// the first load after an upgrade while still preserving a session across reloads
// within the same build (criterion 1.11 / 1.33).
const STORAGE_KEY = 'budget-angular-state-v2';
const CURRENT_VERSION = 2;

interface PersistedEnvelope {
  __version: number;
  state: Partial<BudgetState>;
}

export function loadPersistedState(): Partial<BudgetState> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as PersistedEnvelope | Partial<BudgetState>;
    // Accept either the new envelope or a same-version bare object.
    if (parsed && typeof parsed === 'object' && '__version' in parsed) {
      const envelope = parsed as PersistedEnvelope;
      if (envelope.__version !== CURRENT_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return undefined;
      }
      const { undoStack: _u, redoStack: _r, ...rest } = envelope.state ?? {};
      void _u;
      void _r;
      return rest;
    }
    // Unknown / legacy shape from a prior build: discard so the seed wins.
    localStorage.removeItem(STORAGE_KEY);
    return undefined;
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
      void undoStack;
      void redoStack;
      const envelope: PersistedEnvelope = { __version: CURRENT_VERSION, state: persisted };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // ignore quota / serialization errors
    }
    return nextState;
  };
}

export const metaReducers: MetaReducer<any>[] = [localStorageMetaReducer];
