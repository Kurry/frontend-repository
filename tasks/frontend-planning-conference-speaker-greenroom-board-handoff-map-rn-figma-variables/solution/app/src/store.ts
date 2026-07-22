import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SpeakerRecord, ConferenceSpeakerGreenroomBoardSession, HistoryEvent } from './types';
import { z } from 'zod';

const recordSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  topic: z.string().min(1),
  status: z.enum(['draft', 'ready', 'changed', 'archived']),
  owner: z.string().nullable(),
  readiness: z.number().min(0).max(100)
});

const sessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(recordSchema),
  derived: z.object({
    summary: z.object({
      total: z.number(),
      ready: z.number(),
      draft: z.number(),
      archived: z.number()
    })
  }),
  history: z.array(z.any())
});

let globalRecords: SpeakerRecord[] = [];
for (let i = 1; i <= 100; i++) {
  globalRecords.push({
    id: `rec-${i}`,
    name: `Speaker ${i}`,
    topic: `Topic ${i}`,
    status: i % 10 === 0 ? 'archived' : 'draft',
    owner: null,
    readiness: 0
  });
}
let globalHistory: HistoryEvent[] = [{ action: 'init', timestamp: new Date().toISOString() }];

export function useStore() {
  const [records, setRecords] = useState<SpeakerRecord[]>(globalRecords);
  const [history, setHistory] = useState<HistoryEvent[]>(globalHistory);
  const [undoStack, setUndoStack] = useState<{records: SpeakerRecord[], history: HistoryEvent[]}[]>([]);

  useEffect(() => {
    globalRecords = records;
    globalHistory = history;
  }, [records, history]);

  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev, { records, history }]);
  }, [records, history]);

  const addHistory = useCallback((event: Omit<HistoryEvent, 'timestamp'>) => {
    setHistory(prev => [...prev, { ...event, timestamp: new Date().toISOString() }]);
  }, []);

  const createRecord = useCallback((record: SpeakerRecord) => {
    saveState();
    const parsed = recordSchema.safeParse(record);
    if (!parsed.success) return false;
    setRecords(prev => [...prev, parsed.data]);
    addHistory({ action: 'create', recordId: record.id });
    return true;
  }, [saveState, addHistory]);

  const updateRecord = useCallback((id: string, updates: Partial<SpeakerRecord>) => {
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const nextRecord = { ...records[idx], ...updates, status: 'changed' as const };
    const parsed = recordSchema.safeParse(nextRecord);
    if (!parsed.success) return false;

    saveState();
    setRecords(prev => {
      const next = [...prev];
      next[idx] = parsed.data;
      return next;
    });
    addHistory({ action: 'update', recordId: id, details: updates });
    return true;
  }, [records, saveState, addHistory]);

  const archiveRecord = useCallback((id: string) => {
    saveState();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'archived' } : r));
    addHistory({ action: 'archive', recordId: id });
  }, [saveState, addHistory]);

  const connectOwner = useCallback((id: string, owner: string, readiness: number) => {
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const nextRecord = {
      ...records[idx],
      owner,
      readiness,
      status: readiness === 100 ? 'ready' as const : 'changed' as const
    };
    const parsed = recordSchema.safeParse(nextRecord);
    if (!parsed.success) return false;

    saveState();
    setRecords(prev => {
      const next = [...prev];
      next[idx] = parsed.data;
      return next;
    });
    addHistory({ action: 'connect_owner', recordId: id, details: { owner, readiness } });
    return true;
  }, [records, saveState, addHistory]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setRecords(lastState.records);
    setHistory(lastState.history);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  const derived = useMemo(() => {
    return {
      summary: {
        total: records.length,
        ready: records.filter(r => r.status === 'ready').length,
        draft: records.filter(r => r.status === 'draft').length,
        archived: records.filter(r => r.status === 'archived').length,
      }
    };
  }, [records]);

  const getSession = useCallback((): ConferenceSpeakerGreenroomBoardSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
  }, [records, derived, history]);

  const importSession = useCallback((data: unknown) => {
    const parsed = sessionSchema.safeParse(data);
    if (!parsed.success) return false;
    saveState();
    setRecords(parsed.data.records);
    setHistory([...parsed.data.history, { action: 'import', timestamp: new Date().toISOString() }]);
    return true;
  }, [saveState]);

  const clearSession = useCallback(() => {
    saveState();
    setRecords([]);
    setHistory([{ action: 'clear', timestamp: new Date().toISOString() }]);
  }, [saveState]);

  return {
    records,
    derived,
    history,
    createRecord,
    updateRecord,
    archiveRecord,
    connectOwner,
    undo,
    getSession,
    importSession,
    clearSession,
    canUndo: undoStack.length > 0
  };
}

export type StoreType = ReturnType<typeof useStore>;
