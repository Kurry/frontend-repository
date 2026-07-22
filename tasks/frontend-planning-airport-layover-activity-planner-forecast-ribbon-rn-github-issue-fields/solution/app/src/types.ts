export type ActivityStatus = "empty" | "draft" | "ready" | "changed" | "archived";

export interface LayoverActivity {
  id: string;
  title: string;
  duration: number; // in minutes
  cost: number;
  status: ActivityStatus;
}

export interface DerivedState {
  totalDuration: number;
  totalCost: number;
}

export interface ForecastState {
  recordId: string | null;
  proposedDuration: number;
  proposedCost: number;
}

export interface AirportLayoverActivityPlannerSession {
  schemaVersion: "layover-plan-v1";
  exportedAt: string;
  records: LayoverActivity[];
  derived: DerivedState;
  history: {
    records: LayoverActivity[];
    derived: DerivedState;
  }[];
}
