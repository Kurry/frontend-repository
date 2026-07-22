import { createStore, produce } from 'solid-js/store';
import { INITIAL_CUES, INITIAL_RESOURCES, INITIAL_CREW } from './fixture';

export const [state, setState] = createStore({
  schemaVersion: "live-cue-run-sheet/v1",
  fixtureId: "fixture-01",
  timezone: "UTC",
  cues: JSON.parse(JSON.stringify(INITIAL_CUES)),
  resources: INITIAL_RESOURCES,
  crew: INITIAL_CREW,
  checkpoints: [],
  history: [],
  historyIndex: -1,
  branchState: { A: 'primary', B: 'primary' }, // primary or contingency
  rehearsalState: {
    active: false,
    clockTime: 0,
    events: [],
    ledger: []
  },
  liveState: {
    active: false,
    clockTime: 0,
    events: [],
    corrections: []
  },
  annotations: {}
});

export function pushHistory() {
  setState(produce(s => {
    const currentState = {
      cues: JSON.parse(JSON.stringify(s.cues)),
      branchState: JSON.parse(JSON.stringify(s.branchState))
    };
    s.history = s.history.slice(0, s.historyIndex + 1);
    s.history.push(currentState);
    s.historyIndex = s.history.length - 1;
  }));
}

export function undo() {
  if (state.historyIndex > 0) {
    setState('historyIndex', state.historyIndex - 1);
    const prev = state.history[state.historyIndex];
    setState('cues', JSON.parse(JSON.stringify(prev.cues)));
    setState('branchState', JSON.parse(JSON.stringify(prev.branchState)));
  }
}

export function redo() {
  if (state.historyIndex < state.history.length - 1) {
    setState('historyIndex', state.historyIndex + 1);
    const next = state.history[state.historyIndex];
    setState('cues', JSON.parse(JSON.stringify(next.cues)));
    setState('branchState', JSON.parse(JSON.stringify(next.branchState)));
  }
}

// Initialize history on load
if (state.history.length === 0) {
  pushHistory();
}

export function moveCue(cueId, newTime, newLane) {
  setState(produce(s => {
    const cue = s.cues.find(c => c.id === cueId);
    if (!cue) return;
    const snappedTime = Math.round(newTime / 5) * 5;
    if (snappedTime < 0) return;
    if (newLane) cue.lane = newLane;
    if (cue.trigger.type === 'after' && cue.trigger.sourceCueId && !cue.isFixed && !cue.isLocked) {
       const sourceCue = s.cues.find(c => c.id === cue.trigger.sourceCueId);
       if (sourceCue) {
          const sourceEnd = sourceCue.plannedStart + sourceCue.duration;
          cue.trigger.offset = snappedTime - sourceEnd;
       }
    } else {
       cue.plannedStart = snappedTime;
    }
  }));
  pushHistory();
}

export function resizeCue(cueId, newDuration) {
  setState(produce(s => {
    const cue = s.cues.find(c => c.id === cueId);
    if (!cue) return;
    const snapped = Math.max(5, Math.round(newDuration / 5) * 5);
    cue.duration = snapped;
  }));
  pushHistory();
}

export function assignResource(cueId, ownerId, resourceIds) {
  setState(produce(s => {
    const cue = s.cues.find(c => c.id === cueId);
    if (!cue) return;
    if (ownerId) cue.ownerId = ownerId;
    if (resourceIds) cue.resourceIds = resourceIds;
  }));
  pushHistory();
}

export function connectTrigger(cueId, type, sourceCueId, offset = 0) {
  setState(produce(s => {
    if (cueId === sourceCueId) return;
    const cue = s.cues.find(c => c.id === cueId);
    if (!cue) return;
    cue.trigger = { type, sourceCueId, offset };
  }));
  pushHistory();
}

export function toggleReadiness(cueId) {
  setState(produce(s => {
    const cue = s.cues.find(c => c.id === cueId);
    if (cue) cue.ready = !cue.ready;
  }));
  pushHistory();
}

export function triggerContingencyBranch(groupId, choice) {
  setState(produce(s => {
    if (s.branchState[groupId]) {
      s.branchState[groupId] = choice;
    }
  }));
  pushHistory();
}

export function saveCheckpoint(name) {
  setState(produce(s => {
    if (s.checkpoints.length >= 2) s.checkpoints.shift();
    s.checkpoints.push({
      name,
      cues: JSON.parse(JSON.stringify(s.cues)),
      branchState: JSON.parse(JSON.stringify(s.branchState)),
      timestamp: Date.now()
    });
  }));
}
