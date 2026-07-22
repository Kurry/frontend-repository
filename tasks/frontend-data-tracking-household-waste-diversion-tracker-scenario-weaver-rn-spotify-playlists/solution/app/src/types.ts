export type EventStatus = "draft" | "ready" | "changed" | "archived";
export type ScenarioState = "idle" | "selected" | "changed" | "conflict" | "resolved";

export interface WasteEvent {
  id: string;
  name: string;
  status: EventStatus;
  scenarioState: ScenarioState;
  weightLb: number;
  date: string;
}

export interface DerivedSummary {
  totalWeight: number;
  draftCount: number;
  readyCount: number;
  changedCount: number;
  archivedCount: number;
}

export interface EventHistoryEntry {
  timestamp: string;
  eventId: string;
  action: string;
  previousState: Partial<WasteEvent>;
  newState: Partial<WasteEvent>;
}

export interface HouseholdWasteDiversionTrackerSession {
  schemaVersion: "waste-diversion-v1-scenario-weaver";
  exportedAt: string;
  records: WasteEvent[];
  derived: DerivedSummary;
  history: EventHistoryEntry[];
}
