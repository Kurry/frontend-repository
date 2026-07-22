import { useState, useCallback, useMemo } from 'react';

// Domain statuses: empty, draft, ready, changed, archived
// Spatial visual states: idle, selected, changed, conflict, resolved

const INITIAL_RECORDS = Array.from({ length: 100 }, (_, i) => ({
  id: `record-${i + 1}`,
  name: `Practice Segment ${i + 1}`,
  status: i === 0 ? 'empty' : i < 10 ? 'draft' : i < 90 ? 'ready' : 'archived',
  capacity: 10 + (i % 5) * 5,
  composerPosition: null, // null means not placed in the spatial composer
}));

export function useAppState() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [history, setHistory] = useState([]); // for undo
  const [exportError, setExportError] = useState(null);

  const derivedSummary = useMemo(() => {
    const placed = records.filter(r => r.composerPosition !== null);
    const totalCapacity = placed.reduce((sum, r) => sum + r.capacity, 0);
    const conflicts = placed.filter(r => r.status === 'conflict');
    return {
      placedCount: placed.length,
      totalCapacity,
      hasConflicts: conflicts.length > 0,
      conflictIds: conflicts.map(c => c.id)
    };
  }, [records]);

  const pushHistory = useCallback((prevRecords) => {
    setHistory(h => [...h, prevRecords].slice(-50)); // keep last 50 states
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const newHistory = [...h];
      const prevState = newHistory.pop();
      setRecords(prevState);
      return newHistory;
    });
  }, []);

  const updateRecord = useCallback((id, updates) => {
    setRecords(prev => {
      pushHistory(prev);
      return prev.map(r => r.id === id ? { ...r, ...updates } : r);
    });
  }, [pushHistory]);

  const addRecord = useCallback((record) => {
    setRecords(prev => {
      pushHistory(prev);
      return [...prev, record];
    });
  }, [pushHistory]);

  const deleteRecord = useCallback((id) => {
    setRecords(prev => {
      pushHistory(prev);
      return prev.filter(r => r.id !== id);
    });
  }, [pushHistory]);

  // Canonical mutation: place a selected record in a spatial composer and rebalance capacity
  const placeRecordInComposer = useCallback((id, position, newCapacity) => {
    setRecords(prev => {
      pushHistory(prev);
      return prev.map(r => {
        if (r.id === id) {
          const isConflict = prev.some(other => other.id !== id && other.composerPosition && other.composerPosition.x === position.x && other.composerPosition.y === position.y);
          return {
            ...r,
            composerPosition: position,
            capacity: newCapacity,
            status: isConflict ? 'conflict' : 'changed'
          };
        }
        return r;
      });
    });
  }, [pushHistory]);

  const clearSession = useCallback(() => {
    setRecords(INITIAL_RECORDS);
    setHistory([]);
    setSelectedRecordId(null);
  }, []);

  const importSession = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.schemaVersion !== 'v1') throw new Error('Invalid schemaVersion');
      if (!Array.isArray(data.records)) throw new Error('Invalid records array');

      const ids = new Set();
      for (const r of data.records) {
        if (ids.has(r.id)) throw new Error('Duplicate ID found');
        if (!r.id || !r.status || typeof r.capacity !== 'number') throw new Error('Invalid record format');
        ids.add(r.id);
      }

      setRecords(data.records);
      setHistory(data.history || []);
      setExportError(null);
    } catch (err) {
      setExportError(err.message);
    }
  }, []);

  const generateExport = useCallback(() => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: derivedSummary,
      history
    };
  }, [records, derivedSummary, history]);

  return {
    records,
    selectedRecordId,
    setSelectedRecordId,
    derivedSummary,
    updateRecord,
    addRecord,
    deleteRecord,
    placeRecordInComposer,
    undo,
    canUndo: history.length > 0,
    clearSession,
    importSession,
    generateExport,
    exportError,
    setExportError
  };
}
