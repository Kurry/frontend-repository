export type WasteEventStatus = 'draft' | 'ready' | 'changed' | 'archived' | 'conflict' | 'resolved';

export interface WasteEvent {
  id: string;
  name: string;
  date: string;
  status: WasteEventStatus;
  weightKg: number;
  category: string;
  notes?: string;
  recoveryBoardState?: {
    x: number;
    y: number;
    selected: boolean;
  };
}

export interface HouseholdWasteDiversionTrackerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: WasteEvent[];
  derived: {
    summary: {
      totalEvents: number;
      totalWeightKg: number;
      readyCount: number;
      conflictCount: number;
      resolvedCount: number;
    };
  };
  history: any[]; // Simple history tracking for undo
}
