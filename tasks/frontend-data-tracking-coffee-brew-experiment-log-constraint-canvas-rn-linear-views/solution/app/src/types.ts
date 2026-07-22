export type ExperimentStatus = 'draft' | 'ready' | 'changed' | 'archived' | 'conflict' | 'resolved';

export type ConstraintLane = 'temperature' | 'grindSize' | 'brewTime';

export interface BrewParameters {
  temperature?: number;
  grindSize?: number;
  brewTime?: number;
}

export interface Experiment {
  id: string;
  name: string;
  status: ExperimentStatus;
  parameters: BrewParameters;
  notes?: string;
  lane: ConstraintLane;
}

export interface ArtifactSchema {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Experiment[];
  derived: {
    summary: string;
  };
  history: {
    timestamp: string;
    action: string;
    recordId?: string;
  }[];
}
