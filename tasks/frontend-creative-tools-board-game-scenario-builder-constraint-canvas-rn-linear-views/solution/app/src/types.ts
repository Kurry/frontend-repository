export type ScenarioStatus = 'draft' | 'ready' | 'changed' | 'conflict' | 'resolved';

export interface ScenarioRecord {
  id: string;
  title: string;
  description: string;
  requiredPlayers: number;
  duration: number;
  status: ScenarioStatus;
  archived: boolean;
  conflictReason?: string;
}

export interface ScenarioSessionState {
  schemaVersion: 'v1';
  exportedAt: string;
  records: ScenarioRecord[];
  derived: {
    totalRecords: number;
    conflictCount: number;
  };
  history: any[];
}

export type ViewMode = 'constraint-canvas' | 'filtered-view';

export const STATUS_LANES: ScenarioStatus[] = ['draft', 'ready', 'changed', 'conflict', 'resolved'];
