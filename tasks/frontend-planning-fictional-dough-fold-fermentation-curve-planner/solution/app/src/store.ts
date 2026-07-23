import { create } from 'zustand';
import { parseISO, formatISO, addMinutes, differenceInMinutes } from 'date-fns';

export type ActivityBand = {
  id: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  creditsPerMinute: number;
  label: string;
};

export type EventType = 'mix' | 'fold' | 'shape' | 'chill';

export type PlanEvent = {
  id: string;
  type: EventType;
  start: string; // UTC ISO string
  durationMinutes: number;
  actorId: string;
  label: string;
};

export type HistoryAction = {
  id: string;
  actorId: string;
  kind: 'MOVE_EVENT';
  eventId: string;
  from: string;
  to: string;
  committedAt: string;
  active: boolean; // For undo/redo
};

export type HistoryAnchor = {
  id: string;
  coversThrough: string;
  stateHash: string;
  counts: Record<string, number>;
};

export type DiagnosticSeverity = 'error' | 'warning';

export type Diagnostic = {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  entityId?: string;
  measured?: number;
  required?: number;
  recoveryText?: string;
  active: boolean;
  resolvedAt?: string | null;
  responsibleActions?: string[];
};

export type PlanState = {
  planId: string;
  title: string;
  date: string;
  timeZone: string;
  windowStart: string; // UTC ISO string
  windowEnd: string;   // UTC ISO string
  creditTarget: number;
  recoveryMinutes: number;
  foldGapBounds: [number, number]; // min, max
  shapeBufferMinimumMinutes: number;
  activityBands: ActivityBand[];
  events: PlanEvent[];
  actors: { id: string; name: string }[];
  historyAnchor: HistoryAnchor | null;
  history: HistoryAction[];
  validation: { stateHash: string; validatedAt: string } | null;
  status: 'draft' | 'approved';
  approvedAt: string | null;

  // View State
  selectedEventId: string | null;
  timelineViewportStart: string;
  timelineViewportEnd: string;
  curveBrushStart: string | null;
  curveBrushEnd: string | null;
  inspectorTab: 'impact' | 'cumulative';
  compactSelectedEventId: string | null;
  curveMode: 'timeline' | 'full'; // for compact view
  activeActorId: string;
};

type StoreActions = {
  moveEvent: (eventId: string, newStart: string) => boolean;
  selectEvent: (eventId: string | null) => void;
  undoActorAction: (actorId: string) => void;
  redoActorAction: (actorId: string) => void;
  validatePlan: () => void;
  approvePlan: () => void;
  setBrush: (start: string | null, end: string | null) => void;
  setViewport: (start: string, end: string) => void;
  setActiveActor: (actorId: string) => void;
  setInspectorTab: (tab: 'impact' | 'cumulative') => void;
  loadState: (state: Partial<PlanState>) => void;
};

const INITIAL_EVENTS: PlanEvent[] = [
  { id: 'EV-M01', type: 'mix', start: '2026-10-17T08:00:00Z', durationMinutes: 10, actorId: 'ACT-SYSTEM', label: 'Mix' },
  { id: 'EV-F01', type: 'fold', start: '2026-10-17T08:40:00Z', durationMinutes: 5, actorId: 'ACT-SYSTEM', label: 'Fold one' },
  { id: 'EV-F02', type: 'fold', start: '2026-10-17T09:20:00Z', durationMinutes: 5, actorId: 'ACT-SYSTEM', label: 'Fold two' },
  { id: 'EV-F03', type: 'fold', start: '2026-10-17T10:05:00Z', durationMinutes: 5, actorId: 'ACT-SYSTEM', label: 'Fold three' },
  { id: 'EV-S01', type: 'shape', start: '2026-10-17T12:00:00Z', durationMinutes: 15, actorId: 'ACT-SYSTEM', label: 'Shape' },
  { id: 'EV-C01', type: 'chill', start: '2026-10-17T12:25:00Z', durationMinutes: 20, actorId: 'ACT-SYSTEM', label: 'Chill handoff' },
];

const INITIAL_BANDS: ActivityBand[] = [
  { id: 'AB-01', start: '08:00', end: '09:25', creditsPerMinute: 1, label: 'Quiet bench' },
  { id: 'AB-02', start: '09:25', end: '10:30', creditsPerMinute: 2, label: 'Amber bench' },
  { id: 'AB-03', start: '10:30', end: '13:00', creditsPerMinute: 1, label: 'Quiet bench' },
];

const initialState: PlanState = {
  planId: 'PLN-01',
  title: 'Moonrise Test Loaf',
  date: '2026-10-17',
  timeZone: 'UTC',
  windowStart: '2026-10-17T08:00:00Z',
  windowEnd: '2026-10-17T13:00:00Z',
  creditTarget: 250,
  recoveryMinutes: 10,
  foldGapBounds: [30, 60],
  shapeBufferMinimumMinutes: 10,
  activityBands: INITIAL_BANDS,
  events: INITIAL_EVENTS,
  actors: [
    { id: 'ACT-SYSTEM', name: 'Fixture' },
    { id: 'ACT-ARI', name: 'Ari Vale' },
    { id: 'ACT-SOL', name: 'Sol Renn' },
  ],
  historyAnchor: { id: 'H-000', coversThrough: '2026-10-17T08:00:00Z', stateHash: '', counts: {} },
  history: [],
  validation: null,
  status: 'draft',
  approvedAt: null,

  selectedEventId: 'EV-F02',
  timelineViewportStart: '2026-10-17T08:20:00Z',
  timelineViewportEnd: '2026-10-17T12:20:00Z',
  curveBrushStart: '2026-10-17T08:20:00Z',
  curveBrushEnd: '2026-10-17T12:20:00Z',
  inspectorTab: 'impact',
  compactSelectedEventId: 'EV-F02',
  curveMode: 'timeline',
  activeActorId: 'ACT-ARI',
};

// --- Helper Functions for State Derivations ---

export const getBaseDate = () => '2026-10-17';

export const timeToDate = (timeStr: string) => parseISO(`2026-10-17T${timeStr}:00Z`);

export const computeFoldGaps = (events: PlanEvent[]) => {
  const folds = events.filter(e => e.type === 'fold').sort((a, b) => a.start.localeCompare(b.start));
  const gaps: { start: string, end: string, minutes: number }[] = [];
  for (let i = 0; i < folds.length - 1; i++) {
    const start = parseISO(folds[i].start);
    const end = parseISO(folds[i+1].start);
    gaps.push({
      start: formatISO(start),
      end: formatISO(end),
      minutes: differenceInMinutes(end, start)
    });
  }
  return gaps;
};

export const computeExclusions = (events: PlanEvent[], recoveryMinutes: number) => {
  const folds = events.filter(e => e.type === 'fold');
  return folds.map(f => {
    const start = parseISO(f.start);
    return {
      start: formatISO(start),
      end: formatISO(addMinutes(start, recoveryMinutes))
    };
  });
};

export const computeCurve = (state: PlanState) => {
  const samples = [];

  const start = parseISO(state.windowStart);
  const end = parseISO(state.windowEnd);

  const exclusions = computeExclusions(state.events, state.recoveryMinutes);

  let targetReachedAt: string | null = null;

  // Pre-calculate band rates per minute
  const bandRates: Record<number, number> = {};
  state.activityBands.forEach(band => {
    const bStart = timeToDate(band.start).getTime();
    const bEnd = timeToDate(band.end).getTime();
    for (let t = bStart; t < bEnd; t += 60000) {
      bandRates[t] = band.creditsPerMinute;
    }
  });

  const exclusionMap: Record<number, boolean> = {};
  exclusions.forEach(ex => {
    const exStart = parseISO(ex.start).getTime();
    const exEnd = parseISO(ex.end).getTime();
    for (let t = exStart; t < exEnd; t += 60000) {
      exclusionMap[t] = true;
    }
  });

  for (let t = start.getTime(); t <= end.getTime(); t += 300000) { // 5 min intervals
    // To get exactly accurate integral, we integrate minute by minute from start up to t
    let baseline = 0;
    let excluded = 0;

    for (let m = start.getTime(); m < t; m += 60000) {
      const rate = bandRates[m] || 0;
      baseline += rate;
      if (exclusionMap[m]) {
        excluded += rate;
      }
    }

    const net = baseline - excluded;

    if (net >= state.creditTarget && !targetReachedAt) {
      targetReachedAt = formatISO(new Date(t));
    }

    samples.push({
      sampleAt: formatISO(new Date(t)),
      baselineCredit: baseline,
      excludedCredit: excluded,
      netCredit: net,
      targetReached: net >= state.creditTarget
    });
  }

  return { samples, targetReachedAt };
};

export const computeDiagnostics = (state: PlanState) => {
  const diagnostics: Diagnostic[] = [];
  const gaps = computeFoldGaps(state.events);
  const { targetReachedAt } = computeCurve(state);

  // Check gaps
  gaps.forEach((gap, i) => {
    if (gap.minutes < state.foldGapBounds[0] || gap.minutes > state.foldGapBounds[1]) {
      diagnostics.push({
        id: `DG-GAP-${i}`,
        severity: 'error',
        message: `Fold gap out of bounds: ${gap.minutes}m (must be ${state.foldGapBounds[0]}-${state.foldGapBounds[1]}m)`,
        active: true
      });
    }
  });

  // Shape buffer
  const shape = state.events.find(e => e.type === 'shape');
  if (shape && targetReachedAt) {
    const shapeStart = parseISO(shape.start);
    const targetTime = parseISO(targetReachedAt);
    const buffer = differenceInMinutes(shapeStart, targetTime);

    if (buffer < state.shapeBufferMinimumMinutes) {
      const minStart = formatISO(addMinutes(targetTime, state.shapeBufferMinimumMinutes));
      diagnostics.push({
        id: 'DG-SHAPE-BUFFER',
        severity: 'warning',
        message: 'Shape buffer insufficient',
        entityId: shape.id,
        measured: buffer,
        required: state.shapeBufferMinimumMinutes,
        recoveryText: `Move Shape to ${minStart.substring(11, 16)} or later`,
        active: true
      });
    }
  }

  return diagnostics;
};

export const getStateHash = (state: PlanState) => {
  // Simplified hash for demo purposes. Real impl would use crypto.subtle and canonical JSON
  const s = JSON.stringify({
    planId: state.planId,
    title: state.title,
    date: state.date,
    timeZone: state.timeZone,
    windowStart: state.windowStart,
    windowEnd: state.windowEnd,
    creditTarget: state.creditTarget,
    recoveryMinutes: state.recoveryMinutes,
    foldGapBounds: state.foldGapBounds,
    shapeBufferMinimumMinutes: state.shapeBufferMinimumMinutes,
    activityBands: state.activityBands,
    events: state.events
  });
  return "hash-" + s.length + "-" + Array.from(s).reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

export const usePlanStore = create<PlanState & StoreActions>()((set, get) => ({
  ...initialState,

  moveEvent: (eventId, newStart) => {
    const state = get();
    const event = state.events.find(e => e.id === eventId);
    if (!event) return false;

    // Reject non-5-minute alignment
    const newStartDate = parseISO(newStart);
    if (newStartDate.getMinutes() % 5 !== 0) return false;

    // Check bounds constraints (simulated)
    const proposedEvents = state.events.map(e => e.id === eventId ? { ...e, start: newStart } : e);
    const gaps = computeFoldGaps(proposedEvents);
    const invalidGap = gaps.find(g => g.minutes < state.foldGapBounds[0] || g.minutes > state.foldGapBounds[1]);

    if (invalidGap) return false;

    const actionId = `H-${String(state.history.length + 1).padStart(3, '0')}`;
    const action: HistoryAction = {
      id: actionId,
      actorId: state.activeActorId,
      kind: 'MOVE_EVENT',
      eventId,
      from: event.start,
      to: newStart,
      committedAt: new Date().toISOString(),
      active: true
    };

    set((state) => ({
      events: state.events.map(e => e.id === eventId ? { ...e, start: newStart } : e),
      history: [...state.history, action],
      validation: null, // invalidate
      approvedAt: null, // invalidate
      status: 'draft',
      selectedEventId: eventId
    }));
    return true;
  },

  selectEvent: (eventId) => set({ selectedEventId: eventId }),

  undoActorAction: (actorId) => {
    set((state) => {
      // Find the most recent active action for this actor
      const actions = [...state.history];
      for (let i = actions.length - 1; i >= 0; i--) {
        if (actions[i].actorId === actorId && actions[i].active) {
          actions[i] = { ...actions[i], active: false };
          // Recompute state by applying active actions sequentially
          let newEvents = [...INITIAL_EVENTS];
          for (const a of actions) {
            if (a.active && a.kind === 'MOVE_EVENT') {
              newEvents = newEvents.map(e => e.id === a.eventId ? { ...e, start: a.to } : e);
            }
          }
          return { history: actions, events: newEvents, validation: null, approvedAt: null };
        }
      }
      return state;
    });
  },

  redoActorAction: (actorId) => {
     set((state) => {
      const actions = [...state.history];
      for (let i = 0; i < actions.length; i++) {
        if (actions[i].actorId === actorId && !actions[i].active) {
          actions[i] = { ...actions[i], active: true };
          let newEvents = [...INITIAL_EVENTS];
          for (const a of actions) {
            if (a.active && a.kind === 'MOVE_EVENT') {
              newEvents = newEvents.map(e => e.id === a.eventId ? { ...e, start: a.to } : e);
            }
          }
          return { history: actions, events: newEvents, validation: null, approvedAt: null };
        }
      }
      return state;
    });
  },

  validatePlan: () => {
    const hash = getStateHash(get());
    set({ validation: { stateHash: hash, validatedAt: new Date().toISOString() } });
  },

  approvePlan: () => {
    set({ status: 'approved', approvedAt: new Date().toISOString() });
  },

  setBrush: (start, end) => set({ curveBrushStart: start, curveBrushEnd: end }),
  setViewport: (start, end) => set({ timelineViewportStart: start, timelineViewportEnd: end }),
  setActiveActor: (actorId) => set({ activeActorId: actorId }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),
  loadState: (newState) => set(newState)
}));
