import { useState } from 'react';
import type { EnergyReading, SessionData } from '../types';
import { formatISO } from 'date-fns';

const initialRecords: EnergyReading[] = [
  {
    id: 'r1',
    value: 120.5,
    timestamp: formatISO(new Date(Date.now() - 86400000 * 2)),
    status: 'ready',
    lineage: [{ id: 'l1', source: 'SmartMeter1', timestamp: formatISO(new Date(Date.now() - 86400000 * 2)), status: 'valid' }]
  },
  {
    id: 'r2',
    value: 450.2,
    timestamp: formatISO(new Date(Date.now() - 86400000 * 1)),
    status: 'changed',
    lineage: [
      { id: 'l2', source: 'SmartMeter1', timestamp: formatISO(new Date(Date.now() - 86400000 * 1)), status: 'valid' },
      { id: 'l3', source: 'ManualOverride', timestamp: formatISO(new Date()), status: 'conflict' }
    ],
    notes: 'Unusually high reading'
  }
];

// Generate 100+ records for performance test
for (let i = 3; i <= 105; i++) {
  initialRecords.push({
    id: `r${i}`,
    value: Math.random() * 200 + 100,
    timestamp: formatISO(new Date(Date.now() - 86400000 * i)),
    status: 'archived',
    lineage: [{ id: `l${i}`, source: 'SmartMeter1', timestamp: formatISO(new Date(Date.now() - 86400000 * i)), status: 'valid' }]
  });
}

export const useStore = () => {
  const [records, setRecords] = useState<EnergyReading[]>(initialRecords);
  const [history, setHistory] = useState<EnergyReading[][]>([initialRecords]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const saveState = (newRecords: EnergyReading[]) => {
    setHistory((prev) => [...prev, newRecords]);
    setRecords(newRecords);
  };

  const undo = () => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      setRecords(newHistory[newHistory.length - 1]);
      return newHistory;
    });
  };

  const addRecord = (record: EnergyReading) => {
    saveState([...records, record]);
  };

  const updateRecord = (record: EnergyReading) => {
    saveState(records.map(r => r.id === record.id ? record : r));
  };

  const deleteRecord = (id: string) => {
    saveState(records.filter(r => r.id !== id));
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const quarantineLineage = (recordId: string, lineageId: string) => {
    saveState(records.map(r => {
      if (r.id === recordId) {
        const newLineage = r.lineage.map(l =>
          l.id === lineageId ? { ...l, status: 'quarantined' as const } : l
        );
        return {
          ...r,
          status: 'quarantined' as const,
          lineage: newLineage
        };
      }
      return r;
    }));
  };

  const importData = (data: SessionData) => {
    setRecords(data.records);
    if (data.history) {
      setHistory(data.history);
    } else {
      setHistory([data.records]);
    }
    setSelectedRecordId(data.selectedRecordId ?? null);
  };

  const getDerivedSummary = () => {
    const total = records.length;
    const quarantined = records.filter(r => r.status === 'quarantined').length;
    const avg = records.reduce((sum, r) => sum + r.value, 0) / (total || 1);

    return {
      totalReadings: total,
      averageValue: Number(avg.toFixed(2)),
      quarantinedCount: quarantined
    };
  };

  const exportData = (): SessionData => {
    return {
      schemaVersion: 'v1',
      exportedAt: formatISO(new Date()),
      records,
      derived: {
        summary: getDerivedSummary()
      },
      history,
      selectedRecordId
    };
  };

  return {
    records,
    selectedRecordId,
    setSelectedRecordId,
    addRecord,
    updateRecord,
    deleteRecord,
    undo,
    quarantineLineage,
    importData,
    exportData,
    summary: getDerivedSummary()
  };
};

let globalStoreContext: any = null;
export const setGlobalStore = (store: any) => { globalStoreContext = store; };
export const getGlobalStore = () => globalStoreContext;
