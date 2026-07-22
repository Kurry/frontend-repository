export type LaneId = 'unassigned' | 'compost' | 'recycle' | 'trash';

export type RecordStatus = 'draft' | 'ready' | 'changed' | 'archived' | 'conflict' | 'resolved';

export interface WasteRecord {
  id: string;
  name: string;
  weight: number;
  lane: LaneId;
  status: RecordStatus;
}

export interface WasteHistoryEntry {
  id: string;
  timestamp: string;
  recordId: string;
  action: 'create' | 'update' | 'archive' | 'move' | 'resolve';
  details: string;
}

export interface WasteDiversionSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: WasteRecord[];
  history: WasteHistoryEntry[];
  derived?: {
    totalWeight: number;
    compostWeight: number;
    recycleWeight: number;
    trashWeight: number;
    diversionRate: number;
  };
}
