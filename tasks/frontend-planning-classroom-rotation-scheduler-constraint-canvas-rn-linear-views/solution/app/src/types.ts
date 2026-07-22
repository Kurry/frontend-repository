export type StationStatus = "draft" | "ready" | "changed" | "archived";

export interface Station {
  id: string;
  name: string;
  status: StationStatus;
  lane: string | null;
  teacher: string;
  capacity: number;
}

export interface AppState {
  schemaVersion: "v1";
  exportedAt: string;
  records: Station[];
  derived: {
    summary: {
      totalStations: number;
      laneCapacities: Record<string, number>;
    };
  };
}

export interface StoreState {
  current: AppState;
  history: AppState[];
}
