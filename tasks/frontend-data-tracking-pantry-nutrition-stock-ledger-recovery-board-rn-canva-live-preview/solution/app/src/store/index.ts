import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Ingredient, SessionHistoryEntry, PantrySession } from '../types';
import { generateSeedData, calculateDerivedStats } from '../utils/seed';

export function usePantryStore() {
  const [records, setRecords] = useState<Ingredient[]>([]);
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      const seed = generateSeedData();
      setRecords(seed);
      setHistory([{ action: 'init', timestamp: new Date().toISOString(), stateSnapshot: seed }]);
      setInitialized(true);
    }
  }, [initialized]);

  const derivedStats = useMemo(() => calculateDerivedStats(records), [records]);

  const pushHistory = useCallback((action: string, newRecords: Ingredient[]) => {
    setHistory(prev => [...prev, {
      action,
      timestamp: new Date().toISOString(),
      stateSnapshot: newRecords
    }]);
  }, []);

  const addRecord = useCallback((record: Ingredient) => {
    setRecords(prev => {
      const next = [...prev, record];
      pushHistory('add_record', next);
      return next;
    });
  }, [pushHistory]);

  const updateRecord = useCallback((id: string, updates: Partial<Ingredient>) => {
    setRecords(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      pushHistory('update_record', next);
      return next;
    });
  }, [pushHistory]);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      pushHistory('delete_record', next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      const nextHistory = prev.slice(0, -1);
      setRecords(nextHistory[nextHistory.length - 1].stateSnapshot);
      return nextHistory;
    });
  }, []);

  const importSession = useCallback((session: PantrySession) => {
    if (session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
      return false;
    }
    setRecords(session.records);
    setHistory(session.history || [{ action: 'import', timestamp: new Date().toISOString(), stateSnapshot: session.records }]);
    return true;
  }, []);

  const exportSession = useCallback((): PantrySession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: derivedStats,
      history
    };
  }, [records, derivedStats, history]);

  return {
    records,
    history,
    derivedStats,
    addRecord,
    updateRecord,
    deleteRecord,
    undo,
    importSession,
    exportSession
  };
}
