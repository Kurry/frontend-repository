import { useState, useCallback, useRef } from 'react';

// Domain statuses
export const STATUSES = ['draft', 'ready', 'changed', 'conflict', 'archived'];

// Deterministic seed
export const INITIAL_RECORDS = [
  { id: 'rec_1', title: 'Main Entrance Evacuation', location: 'Lobby', expectedHeadcount: 150, constraintCanvasState: 'ready' },
  { id: 'rec_2', title: 'Secondary Exit Route', location: 'Stairwell B', expectedHeadcount: 45, constraintCanvasState: 'draft' },
  { id: 'rec_3', title: 'IT Server Room Protocol', location: 'Basement', expectedHeadcount: 5, constraintCanvasState: 'changed' },
  { id: 'rec_4', title: 'Rooftop Assembly', location: 'Roof', expectedHeadcount: 0, constraintCanvasState: 'conflict', conflictReason: 'Headcount missing' },
  { id: 'rec_5', title: 'Cafeteria Clear', location: '1st Floor', expectedHeadcount: 200, constraintCanvasState: 'archived' },
];

export function useDrillStore() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const historyRef = useRef([{ records: INITIAL_RECORDS }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((newRecords) => {
    const newHistory = historyRef.current.slice(0, historyIndex + 1);
    newHistory.push({ records: newRecords });
    historyRef.current = newHistory;
    setHistoryIndex(newHistory.length - 1);
    setRecords(newRecords);
  }, [historyIndex]);

  const addRecord = useCallback((record) => {
    const newRecord = { ...record, id: `rec_${Date.now()}` };
    const newRecords = [...records, newRecord];
    saveToHistory(newRecords);
    return newRecord.id;
  }, [records, saveToHistory]);

  const updateRecord = useCallback((id, updates) => {
    const newRecords = records.map(r => r.id === id ? { ...r, ...updates } : r);
    saveToHistory(newRecords);
  }, [records, saveToHistory]);

  const deleteRecord = useCallback((id) => {
    const newRecords = records.filter(r => r.id !== id);
    saveToHistory(newRecords);
  }, [records, saveToHistory]);

  const replaceRecords = useCallback((newRecords, pushToHistory = true) => {
    if (pushToHistory) {
      saveToHistory(newRecords);
    } else {
      setRecords(newRecords);
    }
  }, [saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setRecords(historyRef.current[newIndex].records);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < historyRef.current.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setRecords(historyRef.current[newIndex].records);
    }
  }, [historyIndex]);

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    replaceRecords,
    undo,
    redo,
    historyIndex,
    historyLength: historyRef.current.length,
    history: historyRef.current
  };
}
