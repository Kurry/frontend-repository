import { Station, AppState, StoreState, StationStatus } from "./types";

export const INITIAL_STATE: AppState = {
  schemaVersion: "v1",
  exportedAt: new Date().toISOString(),
  records: Array.from({ length: 110 }).map((_, i) => ({
    id: `station-${i}`,
    name: `Station ${i}`,
    status: (i < 5 ? "ready" : "draft") as StationStatus,
    lane: i < 5 ? `Lane ${ (i % 3) + 1 }` : null,
    teacher: `Teacher ${i % 10}`,
    capacity: 10 + (i % 5) * 5,
  })).concat([
    {
      id: "station-conflict",
      name: "Conflict Station",
      status: "ready" as StationStatus,
      lane: "Lane 1",
      teacher: "Teacher Conflict",
      capacity: 20
    },
    {
      id: "station-to-move",
      name: "Station to Move",
      status: "draft" as StationStatus,
      lane: null,
      teacher: "Teacher Conflict",
      capacity: 15
    }
  ]),
  derived: {
    summary: {
      totalStations: 0,
      laneCapacities: {},
    },
  },
};

export function computeDerived(state: AppState): AppState {
  const laneCapacities: Record<string, number> = {};
  let totalStations = 0;

  state.records.forEach((record) => {
    if (record.status !== "archived") {
      totalStations++;
      if (record.lane) {
        laneCapacities[record.lane] = (laneCapacities[record.lane] || 0) + record.capacity;
      }
    }
  });

  return {
    ...state,
    derived: {
      summary: {
        totalStations,
        laneCapacities,
      },
    },
  };
}

let storeState: StoreState = {
  current: computeDerived(INITIAL_STATE),
  history: [],
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

export function getState() {
  return storeState.current;
}

export function dispatch(action: (state: AppState) => AppState) {
  const nextState = action(storeState.current);
  if (nextState !== storeState.current) {
    storeState = {
      current: computeDerived(nextState),
      history: [...storeState.history, storeState.current],
    };
    notify();
  }
}

export function undo() {
  if (storeState.history.length > 0) {
    const previous = storeState.history[storeState.history.length - 1];
    storeState = {
      current: previous,
      history: storeState.history.slice(0, -1),
    };
    notify();
  }
}

export function validateMove(stationId: string, toLane: string | null): string | null {
  const state = storeState.current;
  const station = state.records.find(r => r.id === stationId);
  if (!station) return "Station not found";

  if (toLane !== null) {
    // Constraint: No two stations in the same lane can have the same teacher
    const conflict = state.records.find(
      (r) => r.lane === toLane && r.id !== stationId && r.teacher === station.teacher && r.status !== "archived"
    );
    if (conflict) {
      return `Conflict: ${conflict.teacher} is already assigned to a station in ${toLane}.`;
    }
  }
  return null;
}

export function moveStation(stationId: string, toLane: string | null) {
  const error = validateMove(stationId, toLane);
  if (error) {
    console.error(error);
    return false;
  }
  dispatch((state) => ({
    ...state,
    records: state.records.map((r) =>
      r.id === stationId ? { ...r, lane: toLane, status: "changed" } : r
    ),
  }));
  return true;
}

export function updateStation(stationId: string, updates: Partial<Station>) {
  dispatch((state) => ({
    ...state,
    records: state.records.map((r) =>
      r.id === stationId ? { ...r, ...updates, status: "changed" } : r
    ),
  }));
}

export function addStation(station: Omit<Station, "id" | "status">) {
  dispatch((state) => ({
    ...state,
    records: [
      ...state.records,
      { ...station, id: `station-${Date.now()}`, status: "draft" },
    ],
  }));
}

export function deleteStation(stationId: string) {
  dispatch((state) => ({
    ...state,
    records: state.records.map(r => r.id === stationId ? { ...r, status: "archived" } : r),
  }));
}

export function importState(jsonString: string) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.schemaVersion !== "v1") {
      throw new Error("Invalid schema version");
    }
    dispatch(() => ({
      ...parsed,
      exportedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error("Import failed", e);
  }
}

export function clearSession() {
  dispatch(() => ({
    schemaVersion: "v1",
    exportedAt: new Date().toISOString(),
    records: [],
    derived: {
      summary: {
        totalStations: 0,
        laneCapacities: {},
      },
    },
  }));
  storeState.history = [];
}
