import { create } from 'zustand';
import type { PlanState, AppActions, Capsule, RehearsalEvent } from './types';

// Fixture initialization
const initialCapsules: Capsule[] = [
  { capsuleId: 'CAP-A01', variant: 'coral', trackId: 'TRACK-A', bayIndex: 0, trayX: null, trayY: null, lotId: 'L1', patternId: 'P1', sequenceOrdinal: 1, actor: 'System', revision: 1, status: 'planned' },
  { capsuleId: 'CAP-A02', variant: 'indigo', trackId: 'TRACK-A', bayIndex: 1, trayX: null, trayY: null, lotId: 'L1', patternId: 'P2', sequenceOrdinal: 2, actor: 'System', revision: 1, status: 'planned' },
  { capsuleId: 'CAP-A03', variant: 'coral', trackId: 'TRACK-A', bayIndex: 2, trayX: null, trayY: null, lotId: 'L1', patternId: 'P1', sequenceOrdinal: 3, actor: 'System', revision: 1, status: 'planned' },
  { capsuleId: 'CAP-A04', variant: 'coral', trackId: 'TRACK-A', bayIndex: 4, trayX: null, trayY: null, lotId: 'L1', patternId: 'P1', sequenceOrdinal: 4, actor: 'System', revision: 1, status: 'planned' },
  { capsuleId: 'CAP-A05', variant: 'indigo', trackId: 'TRACK-A', bayIndex: 5, trayX: null, trayY: null, lotId: 'L1', patternId: 'P2', sequenceOrdinal: 5, actor: 'System', revision: 1, status: 'planned' },
  { capsuleId: 'CAP-A06', variant: 'coral', trackId: 'TRACK-A', bayIndex: 6, trayX: null, trayY: null, lotId: 'L1', patternId: 'P1', sequenceOrdinal: 6, actor: 'System', revision: 1, status: 'planned' },
  { capsuleId: 'CAP-A07', variant: 'indigo', trackId: 'TRACK-A', bayIndex: 7, trayX: null, trayY: null, lotId: 'L1', patternId: 'P2', sequenceOrdinal: 7, actor: 'System', revision: 1, status: 'planned' },
  { capsuleId: 'CAP-17', variant: 'indigo', trackId: null, bayIndex: null, trayX: 980, trayY: 180, lotId: 'L2', patternId: 'P2', sequenceOrdinal: null, actor: 'Ari', revision: 2, status: 'tray' }
];

export const initialState: PlanState = {
  schema: "fictional-spiral-refill/1.0",
  planId: "PLAN-01",
  revision: 16,
  machine: { machineId: "MACHINE-01", trackIds: ["TRACK-A", "TRACK-B", "TRACK-C"] },
  tracks: [
    { trackId: 'TRACK-A', cx: 270, cy: 300 },
    { trackId: 'TRACK-B', cx: 570, cy: 300 },
    { trackId: 'TRACK-C', cx: 870, cy: 300 },
  ],
  bays: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  capsules: initialCapsules,
  demands: [
    { vendOffset: 1, variant: 'coral' },
    { vendOffset: 2, variant: 'indigo' },
    { vendOffset: 3, variant: 'coral' },
    { vendOffset: 4, variant: 'indigo' },
    { vendOffset: 5, variant: 'coral' },
    { vendOffset: 6, variant: 'indigo' },
    { vendOffset: 7, variant: 'coral' },
    { vendOffset: 8, variant: 'indigo' },
  ],
  profiles: [],
  issues: [
    { issueId: 'ISSUE-04', type: 'missing-variant', description: 'missing-indigo-at-4', resolved: false, relatedOffset: 4 }
  ],
  comments: [],
  rehearsal: { status: 'not-run', playhead: 0, events: [], mark: null },
  selection: { kind: 'none', ids: [], primaryId: null },
  viewport: { x: 0, y: 0, zoom: 1 },
  history: { anchorEventId: 'EVT-01', currentEventId: 'EVT-01', events: [], branches: [] },
  approval: null,
  generatedAt: null,
  exportedAt: null,
  scenarioId: 'Baseline',
  demandBrush: null
};

// Undo stack
let historyStates: PlanState[] = [];
let futureStates: PlanState[] = [];

export const useStore = create<PlanState & AppActions>((set) => ({
  ...initialState,

  insertCapsule: (capsuleId, trackId, bayIndex) => {
    set((state) => {
      // Validate
      const cap = state.capsules.find(c => c.capsuleId === capsuleId);
      if (!cap || cap.status !== 'tray') return state; // Invalid return
      if (bayIndex < 0 || bayIndex > 11 || !Number.isInteger(bayIndex)) return state;
      const existing = state.capsules.find(c => c.trackId === trackId && c.bayIndex === bayIndex);
      if (existing) return state;

      historyStates.push(JSON.parse(JSON.stringify(state)));
      futureStates = [];

      const newCapsules = state.capsules.map(c =>
        c.capsuleId === capsuleId ? { ...c, trackId, bayIndex, trayX: null, trayY: null, status: 'planned' as const, revision: state.revision + 1 } : c
      );

      // Check if ISSUE-04 is resolved
      const newIssues = state.issues.map(iss => {
        if (iss.issueId === 'ISSUE-04' && cap.variant === 'indigo' && bayIndex === 3) {
          return { ...iss, resolved: true };
        }
        return iss;
      });

      return {
        capsules: newCapsules,
        issues: newIssues,
        revision: state.revision + 1,
        approval: null // Stales approval
      };
    });
  },

  undo: () => set(state => {
    if (historyStates.length === 0) return state;
    futureStates.push(JSON.parse(JSON.stringify(state)));
    const previous = historyStates.pop()!;
    // Preserve comments
    return { ...previous, comments: state.comments };
  }),

  redo: () => set(state => {
    if (futureStates.length === 0) return state;
    historyStates.push(JSON.parse(JSON.stringify(state)));
    const next = futureStates.pop()!;
    return { ...next, comments: state.comments };
  }),

  setSelection: (selection) => set({ selection }),
  setViewport: (viewport) => set({ viewport }),
  setDemandBrush: (start, end) => set({ demandBrush: { start, end } }),

  startRehearsal: () => set(state => {
    return { rehearsal: { ...state.rehearsal, status: 'ready', playhead: 0, events: [], mark: null } };
  }),

  stepRehearsal: () => set(state => {
    if (state.rehearsal.status === 'not-run') return state;
    if (state.rehearsal.playhead >= state.demands.length) return state;

    const offset = state.rehearsal.playhead + 1;
    const currentDemand = state.demands.find(d => d.vendOffset === offset);
    if (!currentDemand) return state;

    // Fictional rehearsal logic: shift capsules in Track A
    const trackACapsules = state.capsules.filter(c => c.trackId === 'TRACK-A').sort((a, b) => (a.bayIndex || 0) - (b.bayIndex || 0));
    const firstCap = trackACapsules.find(c => c.bayIndex === 0);

    const event: RehearsalEvent = {
      capsuleId: firstCap?.capsuleId || '',
      trackId: 'TRACK-A',
      vendOffset: offset,
      expectedVariant: currentDemand.variant,
      actualVariant: firstCap?.variant || null,
      sourceBayIndex: 0
    };

    return {
      rehearsal: {
        ...state.rehearsal,
        playhead: state.rehearsal.playhead + 1,
        status: 'advance',
        events: [...state.rehearsal.events, event]
      }
    };
  }),

  resetRehearsal: () => set(state => ({ rehearsal: { ...state.rehearsal, status: 'not-run', playhead: 0, events: [], mark: null } })),
  markRehearsal: () => set(state => ({ rehearsal: { ...state.rehearsal, mark: 'verified', status: 'mark' } })),

  addComment: (comment) => set(state => ({ comments: [...state.comments, comment] })),
  resolveComment: (commentId) => set(state => ({
    comments: state.comments.map(c => c.commentId === commentId ? { ...c, resolved: true } : c)
  })),

  loadState: (newState) => set(() => newState)
}));

export const getInventoryStats = (capsules: Capsule[]) => {
  const stats = { coral: { tray: 0, planned: 0 }, indigo: { tray: 0, planned: 0 }, mint: { tray: 0, planned: 0 }, amber: { tray: 0, planned: 0 } };
  capsules.forEach(c => {
    if (c.status === 'tray' || c.status === 'planned') {
      stats[c.variant][c.status]++;
    }
  });
  return stats;
}
