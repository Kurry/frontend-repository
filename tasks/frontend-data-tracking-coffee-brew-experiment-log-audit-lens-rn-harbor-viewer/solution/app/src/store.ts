import { useState } from 'react';
import type { CoffeeBrewExperimentLogSession, BrewExperimentRecord, HistoryEvent, DerivedState, ExperimentStatus } from './types';

export const createInitialSession = (numSeeds = 0): CoffeeBrewExperimentLogSession => {
  const records: BrewExperimentRecord[] = [];

  if (numSeeds > 0) {
    // Seed boundary/valid/conflict cases
    records.push({
      id: 'r-bound-min',
      name: 'Boundary Min',
      date: '2023-01-01',
      beanWeight: 0.1,
      waterWeight: 1.0,
      status: 'ready',
      evidence: '',
      auditLensState: 'idle'
    });
    records.push({
      id: 'r-bound-max',
      name: 'Boundary Max',
      date: '2023-12-31',
      beanWeight: 100.0,
      waterWeight: 2000.0,
      status: 'ready',
      evidence: '',
      auditLensState: 'idle'
    });
    records.push({
      id: 'r-empty',
      name: '',
      date: '',
      beanWeight: 15.0,
      waterWeight: 250.0,
      status: 'empty',
      evidence: '',
      auditLensState: 'idle'
    });
    records.push({
      id: 'r-conflict',
      name: 'Conflict Case',
      date: '2023-05-15',
      beanWeight: 20.0,
      waterWeight: 300.0,
      status: 'draft',
      evidence: '',
      auditLensState: 'conflict'
    });

    for (let i = records.length; i < numSeeds; i++) {
      records.push({
        id: `r-seed-${i}`,
        name: `Seed Record ${i}`,
        date: '2023-06-01',
        beanWeight: 18.0 + (i % 5),
        waterWeight: 300.0 + (i % 50),
        status: i % 2 === 0 ? 'draft' : 'ready',
        evidence: '',
        auditLensState: 'idle'
      });
    }
  }

  return {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records,
    derived: {
      summary: { totalRecords: records.length, resolvedCount: 0, conflictCount: 1 }
    },
    history: []
  };
};

export const computeDerived = (records: BrewExperimentRecord[]): DerivedState => {
  let resolvedCount = 0;
  let conflictCount = 0;
  for (const r of records) {
    if (r.auditLensState === 'resolved') resolvedCount++;
    if (r.auditLensState === 'conflict') conflictCount++;
  }
  return {
    summary: { totalRecords: records.length, resolvedCount, conflictCount }
  };
};

export const useStore = () => {
  const [session, setSession] = useState<CoffeeBrewExperimentLogSession>(createInitialSession(105)); // >100 for performance testing
  const [historyStack, setHistoryStack] = useState<CoffeeBrewExperimentLogSession[]>([]);

  const pushState = (newState: CoffeeBrewExperimentLogSession) => {
    setHistoryStack(prev => [...prev, session]);
    setSession(newState);
  };

  const undo = () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, prev.length - 1));
    setSession(previousState);
  };

  const createRecord = (record: Omit<BrewExperimentRecord, 'id' | 'auditLensState'>) => {
    const newRecord: BrewExperimentRecord = {
      ...record,
      id: `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      auditLensState: 'idle'
    };
    const newRecords = [...session.records, newRecord];
    const newEvent: HistoryEvent = { timestamp: new Date().toISOString(), action: 'create', recordId: newRecord.id, details: `Created ${newRecord.name}` };
    pushState({
      ...session,
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...session.history, newEvent]
    });
  };

  const updateRecord = (id: string, updates: Partial<BrewExperimentRecord>) => {
    const newRecords = session.records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || 'changed' as ExperimentStatus } : r);
    const newEvent: HistoryEvent = { timestamp: new Date().toISOString(), action: 'update', recordId: id, details: `Updated ${id}` };
    pushState({
      ...session,
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...session.history, newEvent]
    });
  };

  const deleteRecord = (id: string) => {
    const newRecords = session.records.filter(r => r.id !== id);
    const newEvent: HistoryEvent = { timestamp: new Date().toISOString(), action: 'delete', recordId: id, details: `Deleted ${id}` };
    pushState({
      ...session,
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...session.history, newEvent]
    });
  };

  const attachEvidence = (id: string, evidence: string) => {
    // The canonical mutation: attach evidence and resolve discrepancy
    const newRecords = session.records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          evidence,
          auditLensState: 'resolved' as const,
          status: 'ready' as const
        };
      }
      return r;
    });

    const newEvent: HistoryEvent = { timestamp: new Date().toISOString(), action: 'attach_evidence', recordId: id, details: `Attached evidence to ${id} and resolved` };
    pushState({
      ...session,
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...session.history, newEvent]
    });
  };

  const importSession = (imported: any) => {
    if (imported?.schemaVersion !== 'v1' || !Array.isArray(imported?.records)) return false;
    // basic field validation could go here
    const validRecords = imported.records.every((r: any) => typeof r.id === 'string' && typeof r.beanWeight === 'number' && typeof r.waterWeight === 'number');
    if (!validRecords) return false;

    const newSession: CoffeeBrewExperimentLogSession = {
      ...imported,
      exportedAt: new Date().toISOString(),
      derived: computeDerived(imported.records)
    };
    pushState(newSession);
    return true;
  };

  const clearSession = () => {
    pushState(createInitialSession(0));
  };

  return {
    session,
    createRecord,
    updateRecord,
    deleteRecord,
    attachEvidence,
    importSession,
    clearSession,
    undo,
    canUndo: historyStack.length > 0
  };
};
