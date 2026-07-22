export type ComponentStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface FlavorComponent {
  id: string;
  name: string;
  intensity: number;
  notes: string;
  status: ComponentStatus;
}

export type BatchReconcilerState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface DerivedSummary {
  totalIntensity: number;
  count: number;
  readyCount: number;
  batchIds: string[];
}

export interface AppState {
  records: FlavorComponent[];
  batchReconcilerState: BatchReconcilerState;
  derived: DerivedSummary;
}

export interface RecipeFlavorBalanceStudioSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: FlavorComponent[];
  derived: DerivedSummary;
  history: AppState[];
}
