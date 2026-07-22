export type DomainStatus = "empty" | "draft" | "ready" | "changed" | "archived";

export interface SpatialComposerState {
  x: number;
  y: number;
  capacity: number;
}

export interface SpeakerSlotRecord {
  id: string;
  speakerName: string;
  topic: string;
  duration: number;
  status: DomainStatus;
  spatialComposerState: SpatialComposerState;
}

export interface DerivedState {
  summary: {
    totalCapacity: number;
    readyCount: number;
  };
}

export interface SessionHistoryEntry {
  action: string;
  timestamp: string;
  stateSnapshot: Omit<ConferenceSpeakerGreenroomBoardSession, "history">;
}

export interface ConferenceSpeakerGreenroomBoardSession {
  schemaVersion: "v1";
  exportedAt: string;
  records: SpeakerSlotRecord[];
  derived: DerivedState;
  history: SessionHistoryEntry[];
}
