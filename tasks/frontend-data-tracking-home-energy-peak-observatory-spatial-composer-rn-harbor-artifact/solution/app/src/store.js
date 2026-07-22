import { createStore } from 'solid-js/store';

const initialRecords = [
  { id: 'rec-1', name: 'Main Panel', capacity: 200, used: 150, status: 'ready' },
  { id: 'rec-2', name: 'Sub Panel A', capacity: 100, used: 80, status: 'ready' },
  { id: 'rec-3', name: 'Sub Panel B', capacity: 100, used: 100, status: 'conflict' },
  { id: 'rec-4', name: 'Garage', capacity: 50, used: 0, status: 'empty' },
];

export const [store, setStore] = createStore({
  schemaVersion: 'energy-peak-v1',
  exportedAt: null,
  records: initialRecords,
  derived: {
    totalCapacity: 450,
    totalUsed: 330,
    activeSelection: null,
    spatialComposerActive: false,
  },
  history: [],
});

export const addRecord = (record) => {
  setStore('history', (h) => [...h, JSON.parse(JSON.stringify(store))]);
  setStore('records', (records) => [...records, record]);
  updateDerived();
};

export const updateRecord = (id, updates) => {
  setStore('history', (h) => [...h, JSON.parse(JSON.stringify(store))]);
  setStore('records', (r) => r.id === id, updates);
  updateDerived();
};

export const deleteRecord = (id) => {
  setStore('history', (h) => [...h, JSON.parse(JSON.stringify(store))]);
  setStore('records', (records) => records.filter(r => r.id !== id));
  updateDerived();
};

export const selectRecord = (id) => {
  setStore('derived', 'activeSelection', id);
  if (id) {
    setStore('derived', 'spatialComposerActive', true);
  } else {
    setStore('derived', 'spatialComposerActive', false);
  }
};

export const rebalanceCapacity = (id, newCapacity) => {
  const record = store.records.find(r => r.id === id);
  if (!record) return;

  setStore('history', (h) => [...h, JSON.parse(JSON.stringify(store))]);

  let newStatus = 'changed';
  if (record.used > newCapacity) {
    newStatus = 'conflict';
  } else if (newCapacity === 0 && record.used === 0) {
    newStatus = 'empty';
  } else {
    newStatus = 'resolved';
  }

  setStore('records', (r) => r.id === id, { capacity: newCapacity, status: newStatus });
  updateDerived();
};

export const undo = () => {
  if (store.history.length === 0) return;
  const previousState = store.history[store.history.length - 1];

  setStore({
    records: previousState.records,
    derived: previousState.derived,
    history: store.history.slice(0, -1),
  });
};

export const importArtifact = (data) => {
  if (data.schemaVersion !== 'energy-peak-v1') return false;
  if (!Array.isArray(data.records)) return false;

  setStore({
    schemaVersion: data.schemaVersion,
    exportedAt: new Date().toISOString(),
    records: data.records,
    derived: data.derived || { totalCapacity: 0, totalUsed: 0, activeSelection: null, spatialComposerActive: false },
    history: [],
  });

  updateDerived();
  return true;
};

export const clearArtifact = () => {
  setStore({
    records: [],
    derived: {
      totalCapacity: 0,
      totalUsed: 0,
      activeSelection: null,
      spatialComposerActive: false,
    },
    history: [],
  });
};

const updateDerived = () => {
  let capacity = 0;
  let used = 0;
  for (let i = 0; i < store.records.length; i++) {
    capacity += parseInt(store.records[i].capacity) || 0;
    used += parseInt(store.records[i].used) || 0;
  }
  setStore('derived', 'totalCapacity', capacity);
  setStore('derived', 'totalUsed', used);
};
