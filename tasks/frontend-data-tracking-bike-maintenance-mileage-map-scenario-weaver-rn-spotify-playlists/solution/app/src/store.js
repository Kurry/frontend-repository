import { useState, useCallback, useEffect } from 'react';

const SCHEMA_VERSION = 'task-specific-v1';

const createInitialState = () => ({
  schemaVersion: SCHEMA_VERSION,
  exportedAt: null,
  records: [],
  derived: {
    totalRecords: 0,
    scenarios: 0
  },
  history: []
});

export const useStore = () => {
  const [state, setState] = useState(createInitialState());

  const updateDerivedState = (records) => {
    return {
      totalRecords: records.length,
      scenarios: records.filter(r => r.isScenario).length
    };
  };

  const createRecord = useCallback((recordData) => {
    setState(prev => {
      const newRecord = {
        ...recordData,
        id: crypto.randomUUID(),
        status: 'draft',
        isScenario: false,
        order: prev.records.length
      };
      const newRecords = [...prev.records, newRecord];
      const newState = {
        ...prev,
        records: newRecords,
        derived: updateDerivedState(newRecords),
        history: [...prev.history, { type: 'CREATE', recordId: newRecord.id, previousRecords: prev.records }]
      };
      window.__APP_STATE__ = newState;
      return newState;
    });
  }, []);

  const updateRecord = useCallback((id, updates) => {
    setState(prev => {
      const newRecords = prev.records.map(r => r.id === id ? { ...r, ...updates, status: 'changed' } : r);
      const newState = {
        ...prev,
        records: newRecords,
        derived: updateDerivedState(newRecords),
        history: [...prev.history, { type: 'UPDATE', recordId: id, previousRecords: prev.records }]
      };
      window.__APP_STATE__ = newState;
      return newState;
    });
  }, []);

  const archiveRecord = useCallback((id) => {
    setState(prev => {
      const newRecords = prev.records.map(r => r.id === id ? { ...r, status: 'archived' } : r);
      const newState = {
        ...prev,
        records: newRecords,
        derived: updateDerivedState(newRecords),
        history: [...prev.history, { type: 'ARCHIVE', recordId: id, previousRecords: prev.records }]
      };
      window.__APP_STATE__ = newState;
      return newState;
    });
  }, []);

  const branchScenario = useCallback((id) => {
    setState(prev => {
      const sourceRecord = prev.records.find(r => r.id === id);
      if (!sourceRecord) return prev;

      const newScenario = {
        ...sourceRecord,
        id: crypto.randomUUID(),
        status: 'draft',
        isScenario: true,
        sourceId: id,
        name: `${sourceRecord.name} (Scenario)`,
        order: prev.records.length
      };

      const newRecords = [...prev.records, newScenario];
      const newState = {
        ...prev,
        records: newRecords,
        derived: updateDerivedState(newRecords),
        history: [...prev.history, { type: 'BRANCH_SCENARIO', sourceId: id, newId: newScenario.id, previousRecords: prev.records }]
      };
      window.__APP_STATE__ = newState;
      return newState;
    });
  }, []);

  const reorderRecords = useCallback((draggedId, targetId) => {
    setState(prev => {
      const newRecords = [...prev.records];
      const draggedIndex = newRecords.findIndex(r => r.id === draggedId);
      const targetIndex = newRecords.findIndex(r => r.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [draggedItem] = newRecords.splice(draggedIndex, 1);
      newRecords.splice(targetIndex, 0, draggedItem);

      // Update order field
      newRecords.forEach((r, idx) => r.order = idx);

      const newState = {
        ...prev,
        records: newRecords,
        derived: updateDerivedState(newRecords),
        history: [...prev.history, { type: 'REORDER', previousRecords: prev.records }]
      };
      window.__APP_STATE__ = newState;
      return newState;
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;

      const lastAction = prev.history[prev.history.length - 1];
      const newRecords = lastAction.previousRecords || [];

      const newState = {
        ...prev,
        records: newRecords,
        derived: updateDerivedState(newRecords),
        history: prev.history.slice(0, -1)
      };
      window.__APP_STATE__ = newState;
      return newState;
    });
  }, []);

  const importData = useCallback((data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        throw new Error('Invalid schema version');
      }

      const newState = {
        ...parsed,
        exportedAt: new Date().toISOString()
      };

      setState(newState);
      window.__APP_STATE__ = newState;
    } catch (e) {
      console.error('Import failed', e);
      return e.message;
    }
  }, []);

  const clear = useCallback(() => {
    setState(createInitialState());
    window.__APP_STATE__ = createInitialState();
  }, []);

  useEffect(() => {
    window.__APP_STATE__ = state;
    window.__APP_ACTIONS__ = {
      createRecord,
      updateRecord,
      archiveRecord,
      branchScenario,
      reorderRecords,
      undo,
      importData,
      clear
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, createRecord, updateRecord, archiveRecord, branchScenario, reorderRecords, undo, importData, clear]);

  return {
    state,
    actions: {
      createRecord,
      updateRecord,
      archiveRecord,
      branchScenario,
      reorderRecords,
      undo,
      importData,
      clear
    }
  };
};
