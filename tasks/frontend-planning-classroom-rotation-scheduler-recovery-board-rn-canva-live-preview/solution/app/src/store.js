export const initialRecords = [
  { id: 'rec-1', name: 'Station A', status: 'ready', failed: false },
  { id: 'rec-2', name: 'Station B', status: 'draft', failed: false },
  { id: 'rec-3', name: 'Station C', status: 'changed', failed: true },
];

export const createInitialState = () => ({
  records: [...initialRecords],
  derived: { summary: { total: 3, failedCount: 1 } },
  history: [],
  historyIndex: -1,
});

export const computeDerived = (records) => {
  return {
    summary: {
      total: records.length,
      failedCount: records.filter(r => r.failed).length,
    }
  };
};

export const pushHistory = (state, newRecords) => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(state.records);
  return {
    records: newRecords,
    derived: computeDerived(newRecords),
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const undo = (state) => {
  if (state.historyIndex < 0) return state;
  const prevRecords = state.history[state.historyIndex];
  return {
    ...state,
    records: prevRecords,
    derived: computeDerived(prevRecords),
    historyIndex: state.historyIndex - 1,
  };
};
