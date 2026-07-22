export type DomainState = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface RestockTask {
  id: string;
  title: string;
  description: string;
  quantity: number;
  status: DomainState;
}

export interface DerivedSummary {
  totalTasks: number;
  byStatus: Record<DomainState, number>;
}

export interface CanvasHistoryEvent {
  action: 'move' | 'create' | 'update' | 'delete';
  recordId: string;
  previousStatus?: DomainState;
  newStatus?: DomainState;
  previousRecord?: RestockTask;
  timestamp: string;
}

export interface CommunityFridgeRestockPlannerSession {
  schemaVersion: 'fridge-restock-v1';
  exportedAt: string;
  records: RestockTask[];
  derived: DerivedSummary;
  history: CanvasHistoryEvent[];
}

export interface DraftTask {
  title: string;
  description: string;
  quantity: number;
}
