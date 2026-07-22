import { useState, useCallback } from 'react';
import type { WaterIntakeEvent, DerivedState, HistoryEntry, WaterIntakePatternMapSession } from './types';

const INITIAL_GOAL = 2500;

function calculateDerivedState(records: WaterIntakeEvent[], goal: number): DerivedState {
  const totalMl = records
    .filter(r => r.status !== 'archived' && r.forecastRibbonState !== 'changed')
    .reduce((sum, r) => sum + r.amountMl, 0);

  const projectedMl = records
    .filter(r => r.status !== 'archived')
    .reduce((sum, r) => sum + r.amountMl, 0);

  return {
    summary: {
      totalMl,
      projectedMl,
      dailyGoalMl: goal,
    }
  };
}

export function useAppStore() {
  const [records, setRecords] = useState<WaterIntakeEvent[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pastStates, setPastStates] = useState<WaterIntakeEvent[][]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const derived = calculateDerivedState(records, INITIAL_GOAL);

  const addRecord = useCallback((record: Omit<WaterIntakeEvent, 'id' | 'status'>) => {
    setPastStates(prev => [...prev, records]);
    const newRecord: WaterIntakeEvent = {
      ...record,
      id: crypto.randomUUID(),
      status: 'ready',
      forecastRibbonState: 'idle'
    };

    setRecords(prev => [...prev, newRecord]);
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'create', recordId: newRecord.id }]);
  }, [records]);

  const updateRecord = useCallback((id: string, updates: Partial<WaterIntakeEvent>) => {
    setPastStates(prev => [...prev, records]);
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates, status: 'changed' } : r));
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'update', recordId: id }]);
  }, [records]);

  const removeRecord = useCallback((id: string) => {
    setPastStates(prev => [...prev, records]);
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'archived' } : r));
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'archive', recordId: id }]);
  }, [records]);

  const selectRecord = useCallback((id: string | null) => {
    setSelectedRecordId(id);
    if (id) {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, forecastRibbonState: 'selected' } : { ...r, forecastRibbonState: r.forecastRibbonState === 'selected' ? 'idle' : r.forecastRibbonState }));
    } else {
        setRecords(prev => prev.map(r => ({ ...r, forecastRibbonState: r.forecastRibbonState === 'selected' ? 'idle' : r.forecastRibbonState })));
    }
  }, []);

  const adjustSelectedRecord = useCallback((amountChangeMl: number) => {
    if (!selectedRecordId) return;
    setPastStates(prev => [...prev, records]);

    setRecords(prev => prev.map(r => {
      if (r.id === selectedRecordId) {
        return {
          ...r,
          amountMl: Math.max(0, r.amountMl + amountChangeMl),
          forecastRibbonState: 'changed',
          status: 'changed'
        };
      }
      return r;
    }));
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'adjust_forecast', recordId: selectedRecordId }]);
  }, [selectedRecordId, records]);

  const undo = useCallback(() => {
    if (pastStates.length === 0) return;
    const previousState = pastStates[pastStates.length - 1];
    setPastStates(prev => prev.slice(0, -1));
    setRecords(previousState);
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'undo' }]);
  }, [pastStates]);

  const importData = useCallback((data: WaterIntakePatternMapSession) => {
    if (data.schemaVersion !== 'v1') return false;
    // Basic validation
    if (!Array.isArray(data.records) || !data.derived || !Array.isArray(data.history)) {
        return false;
    }

    // Check IDs
    const ids = new Set(data.records.map(r => r.id));
    if (ids.size !== data.records.length) return false;

    setPastStates([]);
    setRecords(data.records);
    setHistory(data.history);
    setSelectedRecordId(null);
    return true;
  }, []);

  const exportData = useCallback((): WaterIntakePatternMapSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
  }, [records, derived, history]);

  const clearData = useCallback(() => {
      setRecords([]);
      setHistory([]);
      setPastStates([]);
      setSelectedRecordId(null);
  }, []);

  return {
    records,
    derived,
    history,
    selectedRecordId,
    addRecord,
    updateRecord,
    removeRecord,
    selectRecord,
    adjustSelectedRecord,
    undo,
    importData,
    exportData,
    clearData
  };
}
