import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

const initialRecords = [
  { id: 'p1', content: 'Hero enters', status: 'ready', timing: 5 },
  { id: 'p2', content: 'Villain monologues', status: 'conflict', timing: 10, error: 'Timing exceeds bounds' },
  { id: 'p3', content: 'Fight scene', status: 'draft', timing: 8 },
  { id: 'p4', content: 'Hero wins', status: 'empty', timing: 0 },
];

export const StoreProvider = ({ children }) => {
  const [records, setRecords] = useState(initialRecords);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Undo stack keeps track of entire session states for simplicity
  const [undoStack, setUndoStack] = useState([]);

  const pushToUndo = useCallback(() => {
    setUndoStack(prev => [...prev, { records, history, selectedId }]);
  }, [records, history, selectedId]);

  const addRecord = useCallback((record) => {
    pushToUndo();
    setRecords(prev => [...prev, { ...record, id: `p${Date.now()}` }]);
    setHistory(prev => [...prev, { action: 'add', timestamp: new Date().toISOString() }]);
  }, [pushToUndo]);

  const updateRecord = useCallback((id, updates) => {
    pushToUndo();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    setHistory(prev => [...prev, { action: 'update', id, timestamp: new Date().toISOString() }]);
  }, [pushToUndo]);

  const deleteRecord = useCallback((id) => {
    pushToUndo();
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(null);
    setHistory(prev => [...prev, { action: 'delete', id, timestamp: new Date().toISOString() }]);
  }, [pushToUndo, selectedId]);

  // The signature mutation: move a failed record into a recovery path and repair its downstream consequences.
  const recoverRecord = useCallback((id, repairUpdates) => {
    pushToUndo();
    setRecords(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, ...repairUpdates, status: 'resolved', error: null };
      }
      return r;
    }));
    setHistory(prev => [...prev, { action: 'recover', id, timestamp: new Date().toISOString() }]);
  }, [pushToUndo]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setRecords(lastState.records);
    setHistory(lastState.history);
    setSelectedId(lastState.selectedId);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  const loadSession = useCallback((session) => {
    setUndoStack([]);
    setRecords(session.records);
    setHistory(session.history || []);
    setSelectedId(null);
  }, []);

  const derived = useMemo(() => {
    const totalTiming = records.reduce((acc, r) => acc + (r.timing || 0), 0);
    const statusCounts = records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    return { totalTiming, statusCounts };
  }, [records]);

  const value = {
    records,
    history,
    selectedId,
    setSelectedId,
    addRecord,
    updateRecord,
    deleteRecord,
    recoverRecord,
    undo,
    canUndo: undoStack.length > 0,
    derived,
    loadSession,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
