export type RestockStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface RestockTask {
  id: string;
  name: string;
  itemCategory: string;
  quantity: number;
  unit: string;
  status: RestockStatus;
  scenarioState?: {
    originalId: string;
    branchedAt: string;
    changes: string[];
    conflict?: string;
  };
}

export interface DerivedState {
  summary: {
    totalItems: number;
    draftCount: number;
    readyCount: number;
    changedCount: number;
    archivedCount: number;
  };
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  action: string;
  taskId?: string;
  details: string;
}

export interface AppState {
  schemaVersion: 'v1';
  exportedAt: string;
  records: RestockTask[];
  derived: DerivedState;
  history: HistoryEvent[];
}
