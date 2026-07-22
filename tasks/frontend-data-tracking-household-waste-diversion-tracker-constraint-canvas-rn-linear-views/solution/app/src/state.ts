import { useState, useCallback, useMemo } from 'react';
import type { WasteRecord, WasteHistoryEntry, WasteDiversionSession, LaneId, RecordStatus } from './types';

const INITIAL_RECORDS: WasteRecord[] = [
  { id: '1', name: 'Banana Peels', weight: 1.5, lane: 'unassigned', status: 'draft' },
  { id: '2', name: 'Cardboard Box', weight: 3.0, lane: 'recycle', status: 'ready' },
  { id: '3', name: 'Plastic Bag', weight: 0.5, lane: 'trash', status: 'ready' },
];

export function useWasteTrackerState() {
  const [records, setRecords] = useState<WasteRecord[]>(INITIAL_RECORDS);
  const [history, setHistory] = useState<WasteHistoryEntry[]>([]);
  const [pastStates, setPastStates] = useState<{records: WasteRecord[], history: WasteHistoryEntry[]}[]>([]);

  const addHistory = useCallback((action: WasteHistoryEntry['action'], recordId: string, details: string) => {
    setHistory(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      recordId,
      action,
      details,
    }]);
  }, []);

  const saveState = useCallback(() => {
    setPastStates(prev => [...prev, { records: [...records], history: [...history] }]);
  }, [records, history]);

  const undo = useCallback(() => {
    setPastStates(prev => {
      if (prev.length === 0) return prev;
      const newPast = [...prev];
      const prevState = newPast.pop()!;
      setRecords(prevState.records);
      setHistory(prevState.history);
      return newPast;
    });
  }, []);

  const addRecord = useCallback((record: Omit<WasteRecord, 'id' | 'status' | 'lane'>) => {
    saveState();
    const newRecord: WasteRecord = {
      ...record,
      id: Date.now().toString(),
      status: 'draft',
      lane: 'unassigned'
    };
    setRecords(prev => [...prev, newRecord]);
    addHistory('create', newRecord.id, `Created ${record.name}`);
  }, [saveState, addHistory]);

  const updateRecord = useCallback((id: string, updates: Partial<WasteRecord>) => {
    saveState();
    setRecords(prev => prev.map(r => {
      if (r.id === id) {
        let newStatus = r.status;
        if (updates.weight !== undefined && r.lane === 'compost' && updates.weight > 10) {
          newStatus = 'conflict';
        } else if (r.status === 'conflict' && updates.weight !== undefined && updates.weight <= 10) {
          newStatus = 'resolved';
        } else {
          newStatus = 'changed';
        }
        return { ...r, ...updates, status: newStatus };
      }
      return r;
    }));
    addHistory('update', id, `Updated record ${id}`);
  }, [saveState, addHistory]);

  const archiveRecord = useCallback((id: string) => {
    saveState();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'archived' } : r));
    addHistory('archive', id, `Archived record ${id}`);
  }, [saveState, addHistory]);

  const moveRecord = useCallback((id: string, newLane: LaneId) => {
    saveState();
    setRecords(prev => prev.map(r => {
      if (r.id === id) {
        let status: RecordStatus = 'changed';
        if (newLane === 'compost' && r.weight > 10) {
           status = 'conflict';
        }
        return { ...r, lane: newLane, status };
      }
      return r;
    }));
    addHistory('move', id, `Moved to ${newLane}`);
  }, [saveState, addHistory]);

  const resolveConflict = useCallback((id: string) => {
    saveState();
    setRecords(prev => prev.map(r => {
      if (r.id === id && r.status === 'conflict') {
        return { ...r, status: 'resolved' };
      }
      return r;
    }));
    addHistory('resolve', id, `Resolved conflict for ${id}`);
  }, [saveState, addHistory]);

  const exportData = useCallback((): WasteDiversionSession => {
    const totalWeight = records.filter(r => r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
    const compostWeight = records.filter(r => r.lane === 'compost' && r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
    const recycleWeight = records.filter(r => r.lane === 'recycle' && r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
    const trashWeight = records.filter(r => r.lane === 'trash' && r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
    const diversionRate = totalWeight > 0 ? ((compostWeight + recycleWeight) / totalWeight) * 100 : 0;

    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      history,
      derived: {
        totalWeight,
        compostWeight,
        recycleWeight,
        trashWeight,
        diversionRate
      }
    };
  }, [records, history]);

  const importData = useCallback((data: any) => {
    if (data?.schemaVersion !== 'v1' || !Array.isArray(data.records) || !Array.isArray(data.history)) {
      console.error("Invalid import data");
      return false; // Invalid schema
    }
    saveState();
    setRecords(data.records);
    setHistory(data.history);
    return true;
  }, [saveState]);

  const derivedSummary = useMemo(() => {
    const totalWeight = records.filter(r => r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
    const compostWeight = records.filter(r => r.lane === 'compost' && r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
    const recycleWeight = records.filter(r => r.lane === 'recycle' && r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);
    const trashWeight = records.filter(r => r.lane === 'trash' && r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0);

    return {
      totalWeight,
      compostWeight,
      recycleWeight,
      trashWeight,
      diversionRate: totalWeight > 0 ? ((compostWeight + recycleWeight) / totalWeight) * 100 : 0
    };
  }, [records]);

  return {
    records,
    history,
    derivedSummary,
    addRecord,
    updateRecord,
    archiveRecord,
    moveRecord,
    resolveConflict,
    undo,
    exportData,
    importData,
    canUndo: pastStates.length > 0
  };
}
