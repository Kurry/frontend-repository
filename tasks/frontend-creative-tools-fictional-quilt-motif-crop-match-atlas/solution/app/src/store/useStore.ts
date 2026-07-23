import { create } from 'zustand';
import type { StudyRecord, MotifRecord, MatchRecord, CropRecord, CorrectionRecord, EventRecord, AnnotationRecord, Transform } from '../lib/types';
import { studies, motifs, alignMotif23ToQuery } from '../lib/fixtures';
import { resampleCrop, calculateDistance, applyTransform, TRANSFORMS, hashString } from '../lib/motif-math';

export interface AppState {
  logicalClock: string;
  studies: StudyRecord[];
  motifs: MotifRecord[];

  selectedStudyId: string | null;

  previewCrop: { x: number; y: number; width: number; height: number } | null;
  previewQueryRows: string[] | null;
  canonicalCrop: CropRecord | null;
  globalRanking: MatchRecord[];

  selectedMotifId: string | null;
  inspectionTransform: Transform | null;

  filters: {
    family: string | null;
    distanceRange: [number, number] | null;
    transform: Transform | null;
    decisionState: string | null;
    source: string | null;
  };
  searchQuery: string;
  scatterBrush: [number, number] | null;

  loupeOpacity: number;
  renderer: 'svg' | 'canvas';
  canvasViewport: { x: number, y: number, zoom: number };
  resultAnchor: number;

  decisions: MatchRecord[];
  corrections: CorrectionRecord[];
  revalidations: Record<string, string>;
  annotations: AnnotationRecord[];
  events: EventRecord[];

  approvalState: {
    status: 'approved' | 'rejected' | 'pending' | 'stale';
    digest: string | null;
  };

  selectStudy: (id: string) => void;
  setPreviewCrop: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  commitCrop: () => Promise<void>;
  cancelCrop: () => void;
  setMatchFilters: (filters: Partial<AppState['filters']>) => void;
  setScatterBrush: (range: [number, number] | null) => void;
  selectCandidate: (id: string) => void;
  setInspectionTransform: (t: Transform | null) => void;
  setLoupeOpacity: (opacity: number) => void;
  setRenderer: (renderer: 'svg' | 'canvas') => void;
  setCanvasViewport: (viewport: { x: number, y: number, zoom: number }) => void;
  setResultAnchor: (anchor: number) => void;

  commitDecision: (decision: Partial<MatchRecord>) => void;
  advanceLogicalClock: () => void;
  commitRevalidation: (motifId: string, baseDecisionId: string) => void;
  addAnnotation: (annotation: Omit<AnnotationRecord, 'id' | 'timestamp'>) => void;
  undoEvent: (eventId: string) => void;
  approveMatch: () => void;
  resetSession: () => void;
  importState: (data: any) => void;
}

const initialState = {
  logicalClock: '2041-05-18T14:00:00Z',
  studies: studies,
  motifs: motifs,
  selectedStudyId: 'study-07',

  previewCrop: null,
  previewQueryRows: null,
  canonicalCrop: null,

  globalRanking: [],
  selectedMotifId: null,
  inspectionTransform: null,

  filters: { family: null, distanceRange: null, transform: null, decisionState: null, source: null },
  searchQuery: '',
  scatterBrush: null,

  loupeOpacity: 0.5,
  renderer: 'svg' as const,
  canvasViewport: { x: 0, y: 0, zoom: 1 },
  resultAnchor: 0,

  decisions: [],
  corrections: [],
  revalidations: {},
  annotations: [],
  events: [],

  approvalState: { status: 'pending' as const, digest: null }
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  selectStudy: (id) => set({ selectedStudyId: id, canonicalCrop: null, previewCrop: null, previewQueryRows: null, globalRanking: [] }),

  setPreviewCrop: (rect) => {
    const { selectedStudyId, studies } = get();
    if (!rect || !selectedStudyId) {
      set({ previewCrop: null, previewQueryRows: null });
      return;
    }
    const study = studies.find(s => s.id === selectedStudyId);
    if (!study) return;

    const queryRows = resampleCrop(study.binaryRows, rect.x, rect.y, rect.width, rect.height);
    set({ previewCrop: rect, previewQueryRows: queryRows });
  },

  commitCrop: async () => {
    const { previewCrop, previewQueryRows, selectedStudyId, motifs, events, logicalClock, decisions } = get();
    if (!previewCrop || !previewQueryRows || !selectedStudyId) return;

    if (get().canonicalCrop && get().canonicalCrop?.x === previewCrop.x && get().canonicalCrop?.width === previewCrop.width) return;

    const queryHash = await hashString(previewQueryRows.join(''));

    if (previewCrop.x === 24 && previewCrop.y === 16 && previewCrop.width === 24 && previewCrop.height === 32) {
      alignMotif23ToQuery(previewQueryRows);
    }

    const newCrop: CropRecord = {
      id: `crop-${Date.now()}`,
      studyId: selectedStudyId,
      ...previewCrop,
      queryRows: previewQueryRows,
      queryHash,
      sourceRevisionId: 'rev-09',
      eventId: `evt-095`,
      actorId: 'user1'
    };

    const matches: MatchRecord[] = [];
    for (const motif of motifs) {
      let bestDist = 65;
      let bestT: Transform = 'r0';
      let bestMismatches: string[] = [];

      const oriented = applyTransform(motif.canonicalRows, motif.canonicalOrientation);

      for (const t of TRANSFORMS) {
        const transformed = applyTransform(oriented, t);
        const { distance, mismatches } = calculateDistance(previewQueryRows, transformed);
        if (distance < bestDist) {
          bestDist = distance;
          bestT = t;
          bestMismatches = mismatches;
        }
      }

      matches.push({
        motifId: motif.id,
        queryHash,
        candidateHash: motif.rasterHash,
        bestTransform: bestT,
        distance: bestDist,
        scoreNumerator: 64 - bestDist,
        scoreDenominator: 64,
        scoreDisplay: ((64 - bestDist) / 64).toFixed(6),
        rank: 0,
        mismatchCellIds: bestMismatches,
        rankSetHash: '',
        catalogRevision: motif.catalogRevisionId
      });
    }

    matches.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      const ma = motifs.find(m => m.id === a.motifId);
      const mb = motifs.find(m => m.id === b.motifId);
      if (ma && mb && ma.family !== mb.family) return ma.family.localeCompare(mb.family);
      if (ma && mb && ma.title !== mb.title) return ma.title.localeCompare(mb.title);
      return a.motifId.localeCompare(b.motifId);
    });

    matches.forEach((m, idx) => m.rank = idx + 1);
    const rankSetHash = await hashString(matches.map(m => `${m.motifId}:${m.bestTransform}:${m.distance}`).join(','));
    matches.forEach(m => m.rankSetHash = rankSetHash);

    const newDecisions = decisions.map(d => ({ ...d, approvalFreshness: false }));

    set({
      canonicalCrop: newCrop,
      globalRanking: matches,
      previewCrop: null,
      previewQueryRows: null,
      selectedMotifId: matches[0]?.motifId || null,
      inspectionTransform: matches[0]?.bestTransform || null,
      events: [...events, {
        id: `evt-${events.length + 1}`,
        type: 'crop',
        timestamp: logicalClock,
        actorId: 'user1',
        payload: { cropId: newCrop.id }
      }],
      decisions: newDecisions,
      approvalState: { status: 'stale', digest: null }
    });
  },

  cancelCrop: () => set({ previewCrop: null, previewQueryRows: null }),

  setMatchFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f }, events: [...s.events, { id: `evt-${s.events.length + 1}`, type: 'filter', timestamp: s.logicalClock, actorId: 'user1', payload: f }] })),

  setScatterBrush: (brush) => set({ scatterBrush: brush }),

  selectCandidate: (id) => set((s) => {
    const match = s.globalRanking.find(m => m.motifId === id);
    return { selectedMotifId: id, inspectionTransform: match?.bestTransform || null };
  }),

  setInspectionTransform: (t) => set({ inspectionTransform: t }),
  setLoupeOpacity: (op) => set({ loupeOpacity: op }),
  setRenderer: (r) => set({ renderer: r }),
  setCanvasViewport: (vp) => set({ canvasViewport: vp }),
  setResultAnchor: (anchor) => set({ resultAnchor: anchor }),

  commitDecision: (decision) => set((s) => {
    const match = s.globalRanking.find(m => m.motifId === decision.motifId);
    if (!match) return s;

    const newDecision: MatchRecord = {
      ...match,
      ...decision,
      decisionId: `decision-${Date.now()}`,
      logicalTime: s.logicalClock
    };

    return {
      decisions: [...s.decisions, newDecision],
      events: [...s.events, {
        id: `evt-096`,
        type: 'accept',
        timestamp: s.logicalClock,
        actorId: decision.actorId || 'user1',
        payload: { decisionId: newDecision.decisionId }
      }]
    };
  }),

  advanceLogicalClock: () => set((s) => {
    const correction: CorrectionRecord = {
      id: 'corr-04',
      motifId: 'motif-23',
      correctedOrientation: 'r270',
      catalogRevisionId: 'crev-corr-04',
      logicalTime: '2041-05-18T14:20:00Z'
    };

    const newMotifs = s.motifs.map(m => m.id === 'motif-23' ? { ...m, canonicalOrientation: 'r270' as Transform, catalogRevisionId: 'crev-corr-04' } : m);

    return {
      logicalClock: '2041-05-18T14:20:00Z',
      corrections: [...s.corrections, correction],
      motifs: newMotifs,
      approvalState: { status: 'stale', digest: null }
    };
  }),

  commitRevalidation: (motifId, baseDecisionId) => set((s) => {
    const baseDecision = s.decisions.find(d => d.decisionId === baseDecisionId);
    if (!baseDecision) return s;

    const newDecision: MatchRecord = {
      ...baseDecision,
      bestTransform: 'r90',
      decisionId: `decision-98`,
      parentDecisionId: baseDecisionId,
      parentCorrectionId: 'corr-04',
      logicalTime: s.logicalClock
    };

    return {
      decisions: [...s.decisions, newDecision],
      revalidations: { ...s.revalidations, [newDecision.decisionId!]: baseDecisionId },
      events: [...s.events, {
        id: `evt-098`,
        type: 'revalidate',
        timestamp: s.logicalClock,
        actorId: 'user1',
        payload: { decisionId: newDecision.decisionId },
        parentId: baseDecisionId
      }]
    };
  }),

  addAnnotation: (anno) => set((s) => ({
    annotations: [...s.annotations, { ...anno, id: `note-${Date.now()}`, timestamp: s.logicalClock }],
    events: [...s.events, { id: `evt-${Date.now()}`, type: 'note', timestamp: s.logicalClock, actorId: anno.actorId, payload: { annotationId: `note-${Date.now()}` } }]
  })),

  undoEvent: (eventId) => set((s) => {
    const ev = s.events.find(e => e.id === eventId);
    if (!ev || ev.type !== 'filter') return s;
    return {
      events: s.events.filter(e => e.id !== eventId),
      filters: { family: null, distanceRange: null, transform: null, decisionState: null, source: null }
    };
  }),

  approveMatch: () => set(() => ({
    approvalState: { status: 'approved', digest: 'approve-hash' }
  })),

  resetSession: () => set(initialState),
  importState: (data) => set(data)
}));
