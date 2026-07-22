export type SoundLayerStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface TimelineCheckpoint {
  id: string;
  timestamp: number;
  status: SoundLayerStatus;
  description: string;
}

export interface SoundLayer {
  id: string;
  name: string;
  status: SoundLayerStatus;
  checkpoints: TimelineCheckpoint[];
  currentCheckpointId: string | null;
}

export interface SoundscapeSceneSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: SoundLayer[];
  selectedRecordId: string | null;
  derived: {
    totalRecords: number;
    statusCounts: Record<SoundLayerStatus, number>;
  };
  history: any[];
}

export interface HistoryEntry {
  records: SoundLayer[];
  selectedRecordId: string | null;
}
