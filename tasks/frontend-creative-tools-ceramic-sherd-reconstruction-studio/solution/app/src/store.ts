import { useReducer, useEffect } from "react";
import type { State, Transform, Candidate } from "./types";
import { FIXTURE_SHERDS, FIXTURE_EDGES, FIXTURE_CANDIDATES } from "./fixture";
import { evaluateCandidateMatch } from "./geometry";

const INITIAL_STATE: State = {
  sherds: FIXTURE_SHERDS,
  edges: FIXTURE_EDGES,
  candidates: FIXTURE_CANDIDATES,
  notes: {},
  revisions: {},
  events: {},
  currentRevisionId: "rev-initial",
  logicalClock: 1,
  lateFragmentRevealed: false,
  selection: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  branches: [],
};

type HistoryState = {
  past: State[];
  present: State;
  future: State[];
};

const INITIAL_HISTORY: HistoryState = {
  past: [],
  present: INITIAL_STATE,
  future: []
};

type Action =
  | { type: "SET_SELECTION"; ids: string[] }
  | { type: "TRANSFORM_SHERDS"; updates: { id: string; transform: Transform }[] }
  | { type: "UPDATE_CANDIDATE"; id: string; update: Partial<Candidate> }
  | { type: "REVEAL_LATE_FRAGMENT" }
  | { type: "IMPORT_STATE"; state: State }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CREATE_BRANCH"; fromRevisionId: string }
  | { type: "MERGE_BRANCH"; fromRevisionId: string }
  | { type: "SET_VIEWPORT"; viewport: { x: number; y: number; zoom: number } };

function generateHash(obj: any): string {
  return btoa(JSON.stringify(obj)).substring(0, 64).padEnd(64, '0').toLowerCase();
}

function applyEvent(state: State, operation: string, targetIds: string[], capture: "immediate" | "transaction", updates: Partial<State>): State {
  const newEventId = "evt-" + state.logicalClock;
  const newRevId = "rev-" + state.logicalClock;

  const newState = {
    ...state,
    ...updates,
    logicalClock: state.logicalClock + 1,
  };

  newState.events = {
    ...state.events,
    [newEventId]: {
      id: newEventId,
      logicalTime: state.logicalClock,
      actorId: "reviewer-sol",
      operation,
      targetIds,
      beforeHash: generateHash(state),
      afterHash: generateHash(newState),
      capture
    }
  };

  newState.revisions = {
    ...state.revisions,
    [newRevId]: {
      id: newRevId,
      parentIds: [state.currentRevisionId],
      eventIds: [newEventId],
      stateHash: generateHash(newState),
      artifactHash: generateHash(newState.candidates),
      proofStatus: "draft" as const
    }
  };

  newState.currentRevisionId = newRevId;
  return newState;
}

export function rootReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SELECTION":
      return { ...state, selection: action.ids };

    case "TRANSFORM_SHERDS": {
      const newSherds = { ...state.sherds };
      for (const update of action.updates) {
        newSherds[update.id] = { ...newSherds[update.id], transform: update.transform };
      }

      const newCandidates = { ...state.candidates };
      let candidatesUpdated = false;

      // Compute geometry metrics inside the reducer to guarantee UI/WebMCP parity
      for (const c of Object.values(newCandidates)) {
         if (c.status !== "unreviewed") continue;
         const edgeA = state.edges[c.edgeAId];
         const edgeB = state.edges[c.edgeBId];
         const sherdAId = edgeA.sherdId;
         const sherdBId = edgeB.sherdId;

         const involvesUpdate = action.updates.some(u => u.id === sherdAId || u.id === sherdBId);
         if (involvesUpdate) {
            const metrics = evaluateCandidateMatch(newSherds[sherdAId].transform, newSherds[sherdBId].transform, edgeA, edgeB);
            if (metrics.endpointResidualMm < 10.0) { // Slightly larger threshold to catch approaches
               newCandidates[c.id] = { ...c, metrics };
               candidatesUpdated = true;
            }
         }
      }

      const updates: Partial<State> = { sherds: newSherds };
      if (candidatesUpdated) updates.candidates = newCandidates;

      return applyEvent(state, "transform", action.updates.map(u => u.id), "immediate", updates);
    }

    case "UPDATE_CANDIDATE": {
      const candidate = state.candidates[action.id];
      if (!candidate) return state;

      const newCandidates = {
        ...state.candidates,
        [action.id]: { ...candidate, ...action.update }
      };

      return applyEvent(state, "update-candidate", [action.id], "immediate", { candidates: newCandidates });
    }

    case "REVEAL_LATE_FRAGMENT": {
      return applyEvent(state, "reveal", ["SH-29"], "immediate", { lateFragmentRevealed: true });
    }

    case "CREATE_BRANCH": {
       const newBranchId = "branch-" + state.logicalClock;
       return applyEvent(state, "branch", [newBranchId], "transaction", { branches: [...state.branches, newBranchId] });
    }

    case "IMPORT_STATE":
      return action.state;

    case "SET_VIEWPORT":
      return { ...state, viewport: action.viewport };

    default:
      return state;
  }
}

function historyReducer(history: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "UNDO": {
      if (history.past.length === 0) return history;
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, history.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [history.present, ...history.future]
      };
    }
    case "REDO": {
      if (history.future.length === 0) return history;
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      return {
        past: [...history.past, history.present],
        present: next,
        future: newFuture
      };
    }
    default: {
      const newPresent = rootReducer(history.present, action);
      if (newPresent === history.present) return history;

      if (action.type === "SET_SELECTION" || action.type === "SET_VIEWPORT") {
         return { ...history, present: newPresent };
      }

      return {
        past: [...history.past, history.present],
        present: newPresent,
        future: []
      };
    }
  }
}

let globalHistory = INITIAL_HISTORY;
let globalDispatch: React.Dispatch<Action> | null = null;

export function useGlobalStore() {
  const [history, dispatch] = useReducer(historyReducer, globalHistory);

  useEffect(() => {
    globalHistory = history;
    globalDispatch = dispatch;
  }, [history]);

  return { state: history.present, dispatch };
}

export function getGlobalState() {
  return globalHistory.present;
}

export function dispatchGlobal(action: Action) {
  if (globalDispatch) {
    globalDispatch(action);
  } else {
    globalHistory = historyReducer(globalHistory, action);
  }
}
