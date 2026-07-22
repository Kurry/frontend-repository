import { useState, useCallback, useEffect } from 'react';

// Domain statuses for records
export const STATUSES = ['draft', 'ready', 'changed', 'archived'];

// Scenario weaver states
export const SCENARIO_STATES = ['idle', 'selected', 'changed', 'conflict', 'resolved'];

export const useAppState = () => {
  const [records, setRecords] = useState([]);
  const [derived, setDerived] = useState({ summary: {} });
  const [history, setHistory] = useState([]);

  // Undo stack
  const [pastStates, setPastStates] = useState([]);

  const [scenarioState, setScenarioState] = useState('idle');
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const saveToHistory = useCallback((newState) => {
    setPastStates((prev) => {
      const newPast = [...prev, { records, derived, history }];
      // keep last 20
      return newPast.slice(-20);
    });
  }, [records, derived, history]);

  const setFullState = useCallback((newState) => {
    setRecords(newState.records || []);
    setDerived(newState.derived || { summary: {} });
    setHistory(newState.history || []);
  }, []);

  const addRecord = useCallback((record) => {
    saveToHistory();
    setRecords((prev) => {
      const updated = [...prev, record];
      updateDerived(updated);
      return updated;
    });
  }, [saveToHistory]);

  const updateRecord = useCallback((id, updates) => {
    saveToHistory();
    setRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      updateDerived(updated);
      return updated;
    });
  }, [saveToHistory]);

  const deleteRecord = useCallback((id) => {
    saveToHistory();
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      updateDerived(updated);
      return updated;
    });
  }, [saveToHistory]);

  const reorderRecords = useCallback((startIndex, endIndex) => {
      saveToHistory();
      setRecords((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        updateDerived(result);
        return result;
      });
  }, [saveToHistory]);

  const updateDerived = (currentRecords) => {
    const summary = currentRecords.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    setDerived({ summary });
  };

  const branchScenario = useCallback((id, variantUpdates) => {
    saveToHistory();
    setRecords((prev) => {
      const recordIndex = prev.findIndex(r => r.id === id);
      if (recordIndex === -1) return prev;
      const record = prev[recordIndex];
      const newRecord = {
        ...record,
        ...variantUpdates,
        id: `branched-${record.id}-${Date.now()}`,
        status: 'changed',
        scenarioWeaverState: 'resolved'
      };
      const updated = [...prev];
      updated.splice(recordIndex + 1, 0, newRecord);
      updateDerived(updated);
      setHistory((h) => [...h, { type: 'BRANCH', originalId: record.id, newId: newRecord.id, timestamp: new Date().toISOString() }]);
      return updated;
    });
    setScenarioState('resolved');
  }, [saveToHistory]);

  const undo = useCallback(() => {
    if (pastStates.length === 0) return;
    const previous = pastStates[pastStates.length - 1];
    setPastStates((prev) => prev.slice(0, -1));
    setFullState(previous);
    setScenarioState('idle');
    setSelectedRecordId(null);
  }, [pastStates, setFullState]);

  // Handle Ctrl/Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return {
    records,
    derived,
    history,
    scenarioState,
    selectedRecordId,
    setScenarioState,
    setSelectedRecordId,
    addRecord,
    updateRecord,
    deleteRecord,
    reorderRecords,
    branchScenario,
    undo,
    setFullState
  };
};
