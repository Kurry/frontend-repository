export type ExperimentStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type ScenarioState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface BrewExperiment {
  id: string;
  title: string;
  status: ExperimentStatus;
  scenarioState: ScenarioState;

  bean: string;
  roastDate: string; // ISO date string
  grindSetting: string;
  waterTemp: number; // in Celsius
  dose: number; // in grams
  yield: number; // in grams
  time: number; // in seconds
  notes: string;

  derived: {
    ratio: string;
    extractionEstimate: string;
  };
}

export interface CoffeeBrewExperimentLogSession {
  schemaVersion: 'v1';
  exportedAt: string; // RFC3339
  records: BrewExperiment[];
  derived: {
    summary: string;
    totalExperiments: number;
    scenarioChanges: number;
  };
  history: {
    action: string;
    timestamp: string;
  }[];
}
