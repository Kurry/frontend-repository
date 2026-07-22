import { create } from 'zustand';
import type {
  PosterRecord, InkSourceRecord, PrintPassRecord, ScheduleIntervalRecord,
  ProofDecisionRecord, HistoryEvent, CellState, AnnotationRecord, ApprovalRecord
} from './types';
import { F_POSTER, F_PASSES, F_INK_SOURCES, F_EVENTS } from './fixture';

// Helpers
function generateHash(prefix: string) {
  return `${prefix}-${Math.random().toString(16).substring(2, 8)}`;
}

type AppState = {
  poster: PosterRecord;
  passes: Record<string, PrintPassRecord>;
  inkSources: Record<string, InkSourceRecord>;
  intervals: ScheduleIntervalRecord[];
  events: HistoryEvent[];
  cells: CellState[];
  decisions: Record<string, ProofDecisionRecord>;
  annotations: Record<string, AnnotationRecord>;
  approval: ApprovalRecord | null;

  logicalTick: number;
  selectedCells: Set<string>;
  brushedCells: Set<string>;

  correctionRevealed: boolean;
  activeBranchId: string;
  orderHash: string;
  cellProofHash: string;
  scheduleHash: string;
  metricsHash: string;

  // Actions
  reorderPass: (passId: string, newOrder: number) => void;
  advanceClock: (targetTick: number) => void;
  selectCells: (cellIds: string[]) => void;
  commitDecision: (rationale: string, confidence: 'working' | 'tentative' | 'rejected') => void;
  revealCorrection: () => void;
  rebaseRun: () => void;
  approveRun: () => void;
  addAnnotation: (targetId: string, note: string) => void;
  undoEvent: (eventId: string) => void;
  resetSession: () => void;
};

// Pure functions for derived state
export function deriveCells(poster: PosterRecord, passes: PrintPassRecord[], inks: Record<string, InkSourceRecord>): CellState[] {
  const cells: CellState[] = [];
  const cellW = poster.widthUnits / poster.columns;
  const cellH = poster.heightUnits / poster.rows;

  for (let r = 0; r < poster.rows; r++) {
    for (let c = 0; c < poster.columns; c++) {
      const cx = c * cellW;
      const cy = r * cellH;
      const cellId = `c-r${r}-c${c}`;
      const coveringPassIds: string[] = [];
      const orderedContributorIds: string[] = [];

      let [red, green, blue] = poster.backgroundRgb;

      const sortedPasses = [...passes].sort((a, b) => a.order - b.order);

      for (const pass of sortedPasses) {
        // Intersection
        const ix0 = Math.max(cx, pass.mask.x);
        const iy0 = Math.max(cy, pass.mask.y);
        const ix1 = Math.min(cx + cellW, pass.mask.x + pass.mask.width);
        const iy1 = Math.min(cy + cellH, pass.mask.y + pass.mask.height);

        if (ix0 < ix1 && iy0 < iy1) {
          const area = (ix1 - ix0) * (iy1 - iy0);
          if (area >= (cellW * cellH) / 2) {
            coveringPassIds.push(pass.id);
            orderedContributorIds.push(pass.id);
            const ink = inks[pass.inkSourceId];
            if (ink) {
              const alpha = ink.alphaMilli;
              red = Math.floor((red * (1000 - alpha) + ink.rgb[0] * alpha) / 1000);
              green = Math.floor((green * (1000 - alpha) + ink.rgb[1] * alpha) / 1000);
              blue = Math.floor((blue * (1000 - alpha) + ink.rgb[2] * alpha) / 1000);
            }
          }
        }
      }
      cells.push({
        cellId, row: r, col: c, coveringPassIds, orderedContributorIds, rgb: [red, green, blue], selected: false
      });
    }
  }
  return cells;
}

export function deriveSchedule(passes: PrintPassRecord[], inks: Record<string, InkSourceRecord>, logicalTick: number): ScheduleIntervalRecord[] {
  const intervals: ScheduleIntervalRecord[] = [];
  const sortedPasses = [...passes].sort((a, b) => a.order - b.order);
  let currentTick = 0;

  for (let i = 0; i < sortedPasses.length; i++) {
    const pass = sortedPasses[i];
    const ink = inks[pass.inkSourceId];
    if (!ink) continue;

    const printStart = currentTick;
    const printEnd = currentTick + pass.printTicks;

    let printStatus: ScheduleIntervalRecord['status'] = 'queued';
    if (logicalTick >= printEnd) printStatus = 'ready'; // or settle-held/ready contextually, but for simplicity print finishes
    else if (logicalTick >= printStart) printStatus = 'printing';

    intervals.push({
      id: `int-pr-${pass.id}`,
      passId: pass.id,
      kind: 'print',
      startTick: printStart,
      endTick: printEnd,
      predecessorId: i > 0 ? `int-se-${sortedPasses[i-1].id}` : null,
      revisionId: `rev-${pass.id}`,
      status: printStatus
    });

    const settleStart = printEnd;
    const settleEnd = printEnd + ink.settleTicks;

    let settleStatus: ScheduleIntervalRecord['status'] = 'queued';
    if (logicalTick >= settleEnd) settleStatus = 'ready';
    else if (logicalTick >= settleStart) settleStatus = 'settle-held';

    intervals.push({
      id: `int-se-${pass.id}`,
      passId: pass.id,
      kind: 'settle',
      startTick: settleStart,
      endTick: settleEnd,
      predecessorId: `int-pr-${pass.id}`,
      revisionId: `rev-${pass.id}`,
      status: settleStatus
    });

    currentTick = settleEnd;
  }
  return intervals;
}

const initialPasses = Object.fromEntries(F_PASSES.map(p => [p.id, p]));
const initialInks = Object.fromEntries(F_INK_SOURCES.map(i => [i.id, i]));
const initialCells = deriveCells(F_POSTER, Object.values(initialPasses), initialInks);
const initialSchedule = deriveSchedule(Object.values(initialPasses), initialInks, 0);

export const useStore = create<AppState>((set) => ({
  poster: F_POSTER,
  passes: initialPasses,
  inkSources: initialInks,
  intervals: initialSchedule,
  events: F_EVENTS,
  cells: initialCells,
  decisions: {},
  annotations: {},
  approval: null,
  logicalTick: 0,
  selectedCells: new Set(),
  brushedCells: new Set(),
  correctionRevealed: false,
  activeBranchId: 'main',
  orderHash: generateHash('order'),
  cellProofHash: generateHash('cells'),
  scheduleHash: generateHash('sched'),
  metricsHash: generateHash('metrics'),

  reorderPass: (passId, newOrder) => set((state) => {
    const passList = Object.values(state.passes).sort((a, b) => a.order - b.order);
    const passIndex = passList.findIndex(p => p.id === passId);
    if (passIndex === -1) return state;

    const targetIndex = newOrder - 1;
    if (targetIndex < 0 || targetIndex >= passList.length || passIndex === targetIndex) return state;

    const newPassList = [...passList];
    const [moved] = newPassList.splice(passIndex, 1);
    newPassList.splice(targetIndex, 0, moved);

    const updatedPasses = { ...state.passes };
    newPassList.forEach((p, i) => {
      updatedPasses[p.id] = { ...p, order: i + 1 };
    });

    const newCells = deriveCells(state.poster, Object.values(updatedPasses), state.inkSources);
    const newSchedule = deriveSchedule(Object.values(updatedPasses), state.inkSources, state.logicalTick);

    const event: HistoryEvent = {
      id: generateHash('evt'),
      logicalTick: state.logicalTick,
      occurredAt: new Date().toISOString(),
      actorId: 'mara',
      kind: 'reorder-pass',
      status: 'committed',
      parentId: state.events[state.events.length - 1]?.id || null,
      branchId: state.activeBranchId,
      targetId: passId,
      revisionId: generateHash('rev'),
      patch: { oldOrder: passList[passIndex].order, newOrder },
      cancelReason: null,
      stateHash: generateHash('hash')
    };

    return {
      passes: updatedPasses,
      cells: newCells,
      intervals: newSchedule,
      orderHash: generateHash('order'),
      cellProofHash: generateHash('cells'),
      scheduleHash: generateHash('sched'),
      events: [...state.events, event],
      approval: null // invalidate approval
    };
  }),

  advanceClock: (targetTick) => set((state) => {
    if (targetTick <= state.logicalTick) return state;
    const newSchedule = deriveSchedule(Object.values(state.passes), state.inkSources, targetTick);

    const event: HistoryEvent = {
        id: generateHash('evt'),
        logicalTick: targetTick,
        occurredAt: new Date().toISOString(),
        actorId: 'mara',
        kind: 'advance-clock',
        status: 'committed',
        parentId: state.events[state.events.length - 1]?.id || null,
        branchId: state.activeBranchId,
        targetId: 'clock',
        revisionId: generateHash('rev'),
        patch: { oldTick: state.logicalTick, newTick: targetTick },
        cancelReason: null,
        stateHash: generateHash('hash')
    };

    return {
      logicalTick: targetTick,
      intervals: newSchedule,
      events: [...state.events, event]
    };
  }),

  selectCells: (cellIds) => set({ selectedCells: new Set(cellIds), brushedCells: new Set(cellIds) }),

  commitDecision: (rationale, confidence) => set((state) => {
    const decision: ProofDecisionRecord = {
      id: generateHash('decision'),
      posterId: state.poster.id,
      orderHash: state.orderHash,
      cellProofHash: state.cellProofHash,
      scheduleHash: state.scheduleHash,
      metricsHash: state.metricsHash,
      rationale,
      confidence,
      sourceIds: Object.keys(state.inkSources),
      actorId: 'mara',
      logicalAt: new Date().toISOString(),
      parentDecisionId: null,
      correctionIds: [],
      status: 'active'
    };
    return { decisions: { ...state.decisions, [decision.id]: decision } };
  }),

  revealCorrection: () => set((state) => {
    if (state.correctionRevealed) return state;
    const updatedInks = { ...state.inkSources };
    if (updatedInks['ink-cobalt-r2']) {
      updatedInks['ink-cobalt-r2'] = { ...updatedInks['ink-cobalt-r2'], settleTicks: 30 }; // Correction 20 -> 30
    }
    // Note: Do not rebase schedule automatically. User must confirm rebase.
    return {
      correctionRevealed: true,
      inkSources: updatedInks,
      approval: null
    };
  }),

  rebaseRun: () => set((state) => {
    const newSchedule = deriveSchedule(Object.values(state.passes), state.inkSources, state.logicalTick);

    // Create new decision preserving lineage
    let parentDecisionId = null;
    const activeDecisions = Object.values(state.decisions).filter(d => d.status === 'active');
    if (activeDecisions.length > 0) {
      parentDecisionId = activeDecisions[activeDecisions.length - 1].id;
    }

    const decision: ProofDecisionRecord = {
      id: generateHash('decision'),
      posterId: state.poster.id,
      orderHash: state.orderHash,
      cellProofHash: state.cellProofHash,
      scheduleHash: generateHash('sched'),
      metricsHash: state.metricsHash,
      rationale: 'Rebased after settle correction',
      confidence: 'working',
      sourceIds: Object.keys(state.inkSources),
      actorId: 'mara',
      logicalAt: new Date().toISOString(),
      parentDecisionId,
      correctionIds: ['corr-02'],
      status: 'active'
    };

    const updatedDecisions = { ...state.decisions };
    if (parentDecisionId && updatedDecisions[parentDecisionId]) {
       updatedDecisions[parentDecisionId] = { ...updatedDecisions[parentDecisionId], status: 'stale' };
    }
    updatedDecisions[decision.id] = decision;

    const event: HistoryEvent = {
        id: generateHash('evt'),
        logicalTick: state.logicalTick,
        occurredAt: new Date().toISOString(),
        actorId: 'mara',
        kind: 'rebase-run',
        status: 'committed',
        parentId: state.events[state.events.length - 1]?.id || null,
        branchId: state.activeBranchId,
        targetId: 'schedule',
        revisionId: generateHash('rev'),
        patch: {},
        cancelReason: null,
        stateHash: generateHash('hash')
    };

    return {
      intervals: newSchedule,
      scheduleHash: decision.scheduleHash,
      decisions: updatedDecisions,
      events: [...state.events, event]
    };
  }),

  approveRun: () => set((state) => {
    const activeDecisions = Object.values(state.decisions).filter(d => d.status === 'active');
    if (activeDecisions.length === 0) return state; // Block approval
    const approval: ApprovalRecord = {
      id: generateHash('appr'),
      decisionId: activeDecisions[activeDecisions.length - 1].id,
      scheduleHash: state.scheduleHash,
      actorId: 'mara',
      logicalAt: new Date().toISOString(),
      status: 'valid'
    };
    return { approval };
  }),

  addAnnotation: (targetId, note) => set((state) => {
    const ann: AnnotationRecord = {
      id: generateHash('ann'),
      targetId,
      revisionId: 'current',
      note,
      actorId: 'mara',
      logicalAt: new Date().toISOString(),
      replyToId: null
    };
    return { annotations: { ...state.annotations, [ann.id]: ann } };
  }),

  undoEvent: () => set((state) => state),

  resetSession: () => set(() => ({
    passes: initialPasses,
    inkSources: initialInks,
    intervals: initialSchedule,
    events: F_EVENTS,
    cells: initialCells,
    decisions: {},
    annotations: {},
    approval: null,
    logicalTick: 0,
    selectedCells: new Set(),
    brushedCells: new Set(),
    correctionRevealed: false,
    orderHash: generateHash('order'),
    cellProofHash: generateHash('cells'),
    scheduleHash: generateHash('sched')
  }))
}));
