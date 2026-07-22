import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { WasteEvent, DerivedSummary, EventHistoryEntry, HouseholdWasteDiversionTrackerSession, EventStatus, ScenarioState } from "./types";

interface State {
  records: WasteEvent[];
  history: EventHistoryEntry[];
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const nowISO = () => new Date().toISOString();

const calculateDerived = (records: WasteEvent[]): DerivedSummary => {
  return records.reduce((acc, r) => {
    acc.totalWeight += r.weightLb;
    if (r.status === "draft") acc.draftCount++;
    if (r.status === "ready") acc.readyCount++;
    if (r.status === "changed") acc.changedCount++;
    if (r.status === "archived") acc.archivedCount++;
    return acc;
  }, { totalWeight: 0, draftCount: 0, readyCount: 0, changedCount: 0, archivedCount: 0 });
};

// Seed records as per PRD
const initialRecords: WasteEvent[] = [
  { id: "seed1", name: "Cardboard Box", status: "draft", scenarioState: "idle", weightLb: 5, date: "2026-07-22" },
  { id: "seed2", name: "Glass Bottles", status: "ready", scenarioState: "selected", weightLb: 15, date: "2026-07-22" },
  { id: "seed3", name: "Plastic Wrap", status: "changed", scenarioState: "changed", weightLb: 3, date: "2026-07-22" },
  { id: "seed4", name: "Old Electronics", status: "draft", scenarioState: "conflict", weightLb: 40, date: "2026-07-22" },
];

export const useAppStore = () => {
  const [state, setState] = useState<State>({
    records: initialRecords,
    history: []
  });

  const [undoStack, setUndoStack] = useState<State[]>([]);

  const pushState = (newState: State) => {
    setUndoStack((prev) => [...prev, state]);
    setState(newState);
  };

  const addRecord = (record: Omit<WasteEvent, "id">) => {
    const newRecord: WasteEvent = { ...record, id: generateId() };
    const historyEntry: EventHistoryEntry = {
      timestamp: nowISO(),
      eventId: newRecord.id,
      action: "create",
      previousState: {},
      newState: newRecord
    };
    pushState({
      records: [...state.records, newRecord],
      history: [...state.history, historyEntry]
    });
  };

  const updateRecord = (id: string, updates: Partial<WasteEvent>) => {
    const record = state.records.find((r) => r.id === id);
    if (!record) return;

    // Bounds checking
    if (updates.weightLb !== undefined && (updates.weightLb < 0 || updates.weightLb > 10000)) {
        return; // Reject out of bounds
    }

    const newRecord = { ...record, ...updates };
    const historyEntry: EventHistoryEntry = {
      timestamp: nowISO(),
      eventId: id,
      action: "update",
      previousState: record,
      newState: newRecord
    };
    pushState({
      records: state.records.map((r) => (r.id === id ? newRecord : r)),
      history: [...state.history, historyEntry]
    });
  };

  const deleteRecord = (id: string) => {
    const record = state.records.find((r) => r.id === id);
    if (!record) return;
    const historyEntry: EventHistoryEntry = {
      timestamp: nowISO(),
      eventId: id,
      action: "delete",
      previousState: record,
      newState: {}
    };
    pushState({
      records: state.records.filter((r) => r.id !== id),
      history: [...state.history, historyEntry]
    });
  };

  const branchScenario = (id: string, newWeight: number) => {
    const record = state.records.find((r) => r.id === id);
    if (!record) return;
    if (newWeight < 0 || newWeight > 10000) return;

    const newRecord = { ...record, scenarioState: "changed" as ScenarioState, status: "changed" as EventStatus, weightLb: newWeight };
    const historyEntry: EventHistoryEntry = {
      timestamp: nowISO(),
      eventId: id,
      action: "branch_scenario",
      previousState: record,
      newState: newRecord
    };
    pushState({
      records: state.records.map((r) => (r.id === id ? newRecord : r)),
      history: [...state.history, historyEntry]
    });
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setState(previousState);
  };

  const exportData = (): HouseholdWasteDiversionTrackerSession => {
    return {
      schemaVersion: "waste-diversion-v1-scenario-weaver",
      exportedAt: nowISO(),
      records: state.records,
      derived: calculateDerived(state.records),
      history: state.history
    };
  };

  const importData = (data: any) => {
    if (data.schemaVersion !== "waste-diversion-v1-scenario-weaver") return;
    if (!Array.isArray(data.records)) return;

    // validate
    const ids = new Set();
    const validRecords = data.records.every((r: any) => {
        if (ids.has(r.id)) return false;
        ids.add(r.id);
        return typeof r.id === "string" &&
        typeof r.name === "string" &&
        ["draft", "ready", "changed", "archived"].includes(r.status) &&
        ["idle", "selected", "changed", "conflict", "resolved"].includes(r.scenarioState) &&
        typeof r.weightLb === "number" && r.weightLb >= 0 && r.weightLb <= 10000
    });

    if (!validRecords) return;

    setState({
      records: data.records,
      history: data.history || []
    });
    setUndoStack([]);
  };

  const clearData = () => {
      setState({ records: [], history: [] });
      setUndoStack([]);
  }

  const derived = useMemo(() => calculateDerived(state.records), [state.records]);

  return {
    state,
    derived,
    addRecord,
    updateRecord,
    deleteRecord,
    branchScenario,
    undo,
    exportData,
    importData,
    clearData
  };
};

export type StoreType = ReturnType<typeof useAppStore>;
export const StoreContext = createContext<StoreType | null>(null);

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Missing StoreContext.Provider");
  return store;
};
