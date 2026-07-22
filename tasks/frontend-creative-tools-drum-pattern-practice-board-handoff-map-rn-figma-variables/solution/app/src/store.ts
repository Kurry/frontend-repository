import { useState, useCallback, useMemo, useEffect } from 'react';

export type PatternStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface DrumPattern {
  id: string;
  name: string;
  status: PatternStatus;
  owner: string | null;
  beats: boolean[][]; // 4 tracks, 16 steps each
}

export interface SessionData {
  schemaVersion: 'v1';
  exportedAt: string;
  records: DrumPattern[];
  derived: {
    summary: {
      total: number;
      ready: number;
      archived: number;
      assigned: number;
    }
  };
  history: string[]; // Event history strings
}

let initialRecords: DrumPattern[] = [];
for (let i = 0; i < 100; i++) {
  initialRecords.push({
    id: `pattern-${i}`,
    name: `Pattern ${i}`,
    status: i % 10 === 0 ? 'empty' : (i % 5 === 0 ? 'draft' : 'ready'),
    owner: null,
    beats: Array(4).fill(Array(16).fill(false))
  });
}

// Minimal hook-based state
export function usePatternStore() {
  const [records, setRecords] = useState<DrumPattern[]>(initialRecords);
  const [history, setHistory] = useState<{ records: DrumPattern[], action: string }[]>([]);
  const [eventHistory, setEventHistory] = useState<string[]>(['Session started']);

  const pushHistory = useCallback((newRecords: DrumPattern[], action: string) => {
    setHistory(prev => [...prev, { records, action }]);
    setEventHistory(prev => [...prev, action]);
    setRecords(newRecords);
  }, [records]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRecords(last.records);
      setEventHistory(e => [...e, `Undo: ${last.action}`]);
      return prev.slice(0, -1);
    });
  }, []);

  const derivedSummary = useMemo(() => {
    return {
      total: records.length,
      ready: records.filter(r => r.status === 'ready').length,
      archived: records.filter(r => r.status === 'archived').length,
      assigned: records.filter(r => r.owner !== null).length,
    }
  }, [records]);

  return { records, setRecords, history, pushHistory, undo, eventHistory, derivedSummary };
}
