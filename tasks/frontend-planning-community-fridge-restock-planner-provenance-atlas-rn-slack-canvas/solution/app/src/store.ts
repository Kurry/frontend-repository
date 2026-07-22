import { useState, useCallback, useMemo } from 'react';
import type { RestockRecord, Status, LineageState, Artifact } from './types.js';
import { RecordSchema, ArtifactSchema } from './types.js';

export function useAppStore() {
  const [records, setRecords] = useState<RestockRecord[]>([]);
  const [history, setHistory] = useState<{ records: RestockRecord[], action: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pushHistory = (newRecords: RestockRecord[], action: string) => {
    setHistory(prev => [...prev, { records, action }]);
    setRecords(newRecords);
  };

  const seed = useCallback(() => {
    const seeded: RestockRecord[] = [
      { id: '1', status: 'empty', name: 'Milk', quantity: 0, source: 'Local Dairy', lineageState: 'idle' },
      { id: '2', status: 'draft', name: 'Bread', quantity: 50, source: 'Bakery Co', lineageState: 'idle' },
      { id: '3', status: 'ready', name: 'Apples', quantity: 100, source: 'Orchard Farm', lineageState: 'idle' },
      { id: '4', status: 'changed', name: 'Eggs', quantity: 200, source: 'Poultry Inc', lineageState: 'conflict' },
    ];
    // pad to 100+ for performance check
    for(let i=5; i<=105; i++) {
       seeded.push({ id: String(i), status: 'archived', name: `Archived Item ${i}`, quantity: 10, source: 'Old Source', lineageState: 'idle' });
    }
    pushHistory(seeded, 'seed');
  }, []);

  const addRecord = useCallback((rec: Omit<RestockRecord, 'id' | 'status' | 'lineageState'>) => {
    const newRecord: RestockRecord = {
      ...rec,
      id: crypto.randomUUID(),
      status: 'draft',
      lineageState: 'idle',
    };
    pushHistory([newRecord, ...records], 'add');
  }, [records]);

  const updateRecord = useCallback((id: string, updates: Partial<RestockRecord>) => {
    const newRecords = records.map(r => r.id === id ? { ...r, ...updates } : r);
    pushHistory(newRecords, 'update');
  }, [records]);

  const deleteRecord = useCallback((id: string) => {
    pushHistory(records.filter(r => r.id !== id), 'delete');
    if (selectedId === id) setSelectedId(null);
  }, [records, selectedId]);

  // The signature interaction
  const traceAndQuarantine = useCallback((id: string) => {
    const newRecords = records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'changed' as Status,
          lineageState: 'resolved' as LineageState,
        };
      }
      return r;
    });
    pushHistory(newRecords, 'traceAndQuarantine');
    setSelectedId(null); // clear selection on quarantine
  }, [records]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRecords(last.records);
      return prev.slice(0, -1);
    });
  }, []);

  const derived = useMemo(() => {
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
    const summary = `${records.length} items total, ${records.filter(r => r.status === 'ready').length} ready`;
    return { totalQuantity, summary };
  }, [records]);

  const exportArtifact = useCallback(() => {
    const art: Artifact = {
      schemaVersion: 'fridge-restock-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history: history.map(h => h.action),
    };
    return JSON.stringify(art, null, 2);
  }, [records, derived, history]);

  const importArtifact = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const validated = ArtifactSchema.parse(parsed);

      // valid import restores structure and regenerates exportedAt
      pushHistory(validated.records, 'import');
    } catch (err) {
      console.error("Invalid artifact", err);
      // invalid bounds make no state change
    }
  }, [pushHistory]);

  const clear = useCallback(() => {
    pushHistory([], 'clear');
    setSelectedId(null);
  }, [pushHistory]);

  const selectLineage = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  return {
    records,
    derived,
    history,
    selectedId,
    seed,
    addRecord,
    updateRecord,
    deleteRecord,
    traceAndQuarantine,
    undo,
    exportArtifact,
    importArtifact,
    clear,
    selectLineage,
  };
}

export type Store = ReturnType<typeof useAppStore>;
