import { createStore, reconcile } from "solid-js/store";

export const [state, setState] = createStore({
  schemaVersion: "palette-harmony-v1",
  exportedAt: new Date().toISOString(),
  records: [],
  derived: {
    recoveryBoardState: {
      selectedId: null,
      zoom: 100
    },
    summary: {
      total: 0,
      failed: 0,
      resolved: 0
    }
  },
  history: []
});

export const addRecord = (record) => {
  setState("records", (prev) => [...prev, record]);
  updateDerived();
  addHistory("Created record " + record.id);
};

export const updateRecord = (id, updates) => {
  setState("records", (r) => r.id === id, updates);
  updateDerived();
  addHistory("Updated record " + id);
};

export const removeRecord = (id) => {
  setState("records", (prev) => prev.filter(r => r.id !== id));
  if (state.derived.recoveryBoardState.selectedId === id) {
    setState("derived", "recoveryBoardState", "selectedId", null);
  }
  updateDerived();
  addHistory("Removed record " + id);
};

export const setRecoverySelected = (id) => {
  setState("derived", "recoveryBoardState", "selectedId", id);
};

const updateDerived = () => {
  const total = state.records.length;
  const failed = state.records.filter(r => r.status === 'conflict').length;
  const resolved = state.records.filter(r => r.status === 'resolved').length;
  setState("derived", "summary", { total, failed, resolved });
};

const addHistory = (event) => {
  setState("history", (prev) => [...prev, { timestamp: new Date().toISOString(), event }]);
};

export const clearSession = () => {
  setState(reconcile({
    schemaVersion: "palette-harmony-v1",
    exportedAt: new Date().toISOString(),
    records: [],
    derived: {
      recoveryBoardState: {
        selectedId: null,
        zoom: 100
      },
      summary: { total: 0, failed: 0, resolved: 0 }
    },
    history: []
  }));
};

export const importSession = (data) => {
  if (data.schemaVersion !== "palette-harmony-v1") return false;

  // Validate
  if (!Array.isArray(data.records) || !data.derived || !Array.isArray(data.history)) {
    return false;
  }

  data.exportedAt = new Date().toISOString();
  setState(reconcile(data));
  return true;
};
