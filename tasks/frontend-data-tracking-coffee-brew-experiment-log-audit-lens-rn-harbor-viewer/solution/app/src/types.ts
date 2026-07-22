export type ExperimentStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type AuditLensState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface CoffeeBrewExperimentLogSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: BrewExperimentRecord[];
  derived: DerivedState;
  history: HistoryEvent[];
}

export interface BrewExperimentRecord {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  beanWeight: number; // 0.1 to 100.0
  waterWeight: number; // 1.0 to 2000.0
  status: ExperimentStatus;
  evidence: string; // URL or text
  auditLensState: AuditLensState;
  notes?: string;
}

export interface DerivedState {
  summary: {
    totalRecords: number;
    resolvedCount: number;
    conflictCount: number;
  };
}

export interface HistoryEvent {
  timestamp: string;
  action: string;
  recordId?: string;
  details: string;
}
