export type BrewStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type ReadinessLevel = 'low' | 'medium' | 'high';

export interface HandoffMapState {
  owner: string;
  readiness: ReadinessLevel;
  x?: number;
  y?: number;
}

export interface BrewExperiment {
  id: string;
  title: string;
  beanWeight: number; // in grams
  waterVolume: number; // in ml
  temperature: number; // in celsius
  status: BrewStatus;
  handoffMapState: HandoffMapState;
}

export interface DerivedState {
  summary: string;
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  recordId?: string;
  details: string;
}

export interface CoffeeBrewExperimentLogSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: BrewExperiment[];
  derived: DerivedState;
  history: HistoryEntry[];
}
