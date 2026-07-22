export type BrewStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface TimelineCheckpoint {
  id: string;
  timestamp: string; // RFC3339
  notes: string;
  rating: number; // 1-5
  waterTemperature: number; // 80-100 Celsius
  grindSize: number; // 1-10
  brewTime: number; // seconds
}

export interface BrewExperiment {
  id: string;
  name: string;
  bean: string;
  roastDate: string; // YYYY-MM-DD
  status: BrewStatus;
  timelineState: TimelineCheckpoint[];
}

export interface CoffeeBrewExperimentLogSession {
  schemaVersion: 'brew-experiment-v1';
  exportedAt: string; // RFC3339
  records: BrewExperiment[];
  derived: {
    summary: {
      total: number;
      ready: number;
      archived: number;
      avgRating: number;
    }
  };
  history: any[]; // simplify history for now, just array of past states
}
