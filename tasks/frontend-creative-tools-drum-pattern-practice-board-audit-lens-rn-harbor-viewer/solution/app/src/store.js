export const initialState = {
  records: [],
  derived: {
    summary: { total: 0, discrepancies: 0, resolved: 0 }
  },
  history: [],
  auditLensState: { mode: 'idle', selectedId: null }
};

export const createStore = () => {
  let state = JSON.parse(JSON.stringify(initialState));
  let listeners = [];

  const notify = () => listeners.forEach(l => l());

  const updateDerived = (currentState) => {
    let discrepancies = 0;
    let resolved = 0;
    currentState.records.forEach(r => {
      if (r.status === 'changed') discrepancies++;
      if (r.status === 'ready' || r.status === 'archived') resolved++;
    });
    currentState.derived.summary = { total: currentState.records.length, discrepancies, resolved };
  }

  const set = (updater) => {
    const prevState = JSON.parse(JSON.stringify(state));
    const nextState = updater(state);
    if (nextState !== undefined) state = nextState;
    updateDerived(state);
    notify();
  };

  return {
    get: () => state,
    set,
    subscribe: (listener) => { listeners.push(listener); return () => { listeners = listeners.filter(l => l !== listener); }; },
    reset: (newState) => { state = newState || JSON.parse(JSON.stringify(initialState)); updateDerived(state); notify(); },
    pushHistory: (snapshot) => { state.history.push(snapshot); notify(); },
    undo: () => { if (state.history.length > 0) { state = state.history.pop(); notify(); } }
  };
};

export const store = createStore();
