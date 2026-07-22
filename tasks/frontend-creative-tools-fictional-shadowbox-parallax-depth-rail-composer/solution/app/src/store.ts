import { create } from 'zustand';

export interface SceneRecord {
  id: string;
  title: string;
  boardWidthUnits: number;
  boardHeightUnits: number;
  viewerOffsetMin: number;
  viewerOffsetMax: number;
  viewerOffsetStep: number;
  depthSlotCount: number;
  cutoutIds: string[];
  assemblyStepIds: string[];
  fixtureRevisionId: string;
  sceneHash: string;
}

export interface AppearanceTokenRecord {
  id: string;
  label: string;
  fillToken: string;
  strokeToken: string;
  patternToken: string;
  revisionId: string;
  tokenHash: string;
}

export interface CutoutRecord {
  id: string;
  sceneId: string;
  appearanceTokenId: string;
  appearanceRevisionId: string;
  worldXMin: number;
  worldXMax: number;
  worldYMin: number;
  worldYMax: number;
  depthSlot: number;
  allowedSlotMin: number;
  allowedSlotMax: number;
  locked: boolean;
  assemblyStepId: string;
  actorId: string;
  eventId: string;
  status: string;
  silhouetteHash: string;
}

export interface ProjectionRecord {
  id: string;
  cutoutId: string;
  viewerOffset: number;
  xMinFixed8: number;
  xMaxFixed8: number;
  yMinFixed8: number;
  yMaxFixed8: number;
  depthSlot: number;
  revisionId: string;
  projectionHash: string;
}

export interface OcclusionEdgeRecord {
  id: string;
  seriesId: string;
  frontCutoutId: string;
  backCutoutId: string;
  viewerOffset: number;
  intersectionXMinFixed8: number;
  intersectionXMaxFixed8: number;
  intersectionYMinFixed8: number;
  intersectionYMaxFixed8: number;
  areaFixed64: number;
  revisionId: string;
  edgeHash: string;
}

export interface DepthSheetRecord {
  id: string;
  depthSlot: number;
  cutoutIds: string[];
  spacerMarkerIds: string[];
  status: string;
  sheetHash: string;
}

export interface AssemblyStepRecord {
  id: string;
  order: number;
  label: string;
  depthSlot: number;
  cutoutIds: string[];
  occlusionPrerequisiteIds: string[];
  predecessorStepIds: string[];
  status: string;
  stepHash: string;
}

export interface HistoryEvent {
  id: string;
  occurredAt: string;
  actor: string;
  kind: string;
  status: string;
  parentId: string | null;
  branchId: string;
  targetId: string;
  revisionId: string;
  beforePatch: any;
  afterPatch: any;
  stateHash: string;
}

export interface DecisionRecord {
  id: string;
  status: 'working' | 'tentative' | 'rejected';
  rationale: string;
  confidence: string;
  sourceIds: string[];
  revisionId: string;
}

export interface AnnotationRecord {
  id: string;
  targetId: string;
  text: string;
  revisionId: string;
}

export interface ReviewRecord {
  id: string;
  blockerIds: string[];
  status: 'pending' | 'approved';
}

export interface ApprovalRecord {
  id: string;
  decisionId: string;
  sceneHash: string;
  status: 'approved' | 'invalidated';
}

interface State {
  scene: SceneRecord | null;
  cutouts: Record<string, CutoutRecord>;
  appearances: Record<string, AppearanceTokenRecord>;
  projections: Record<string, ProjectionRecord>;
  occlusionEdges: Record<string, OcclusionEdgeRecord>;
  depthSheets: Record<string, DepthSheetRecord>;
  assemblySteps: Record<string, AssemblyStepRecord>;
  history: HistoryEvent[];
  decisions: Record<string, DecisionRecord>;
  annotations: Record<string, AnnotationRecord>;
  reviews: Record<string, ReviewRecord>;
  approvals: Record<string, ApprovalRecord>;

  viewerOffset: number;
  selectedCutoutId: string | null;
  selectedEdgeId: string | null;
  stagedDepthMove: { cutoutId: string; oldSlot: number; newSlot: number } | null;
  renderer: 'svg' | 'canvas';
  branch: string;
  brushStop: number | null;
  brushOverlapId: string | null;

  initFixture: () => void;
  setViewerOffset: (offset: number) => void;
  selectCutout: (id: string | null) => void;
  previewDepthMove: (cutoutId: string, newSlot: number) => void;
  cancelDepthMove: () => void;
  commitDepthMove: () => void;
  setRenderer: (r: 'svg' | 'canvas') => void;
  setBranch: (b: string) => void;
  recordDecision: (decision: DecisionRecord) => void;
  addAnnotation: (annotation: AnnotationRecord) => void;
  approveScene: (approval: ApprovalRecord) => void;
  importPacket: (data: any) => void;
  resetSession: () => void;
}

export const useStore = create<State>((set, get) => ({
  scene: null,
  cutouts: {},
  appearances: {},
  projections: {},
  occlusionEdges: {},
  depthSheets: {},
  assemblySteps: {},
  history: [],
  decisions: {},
  annotations: {},
  reviews: {},
  approvals: {},

  viewerOffset: 0,
  selectedCutoutId: null,
  selectedEdgeId: null,
  stagedDepthMove: null,
  renderer: 'svg',
  branch: 'Shallow Draft',
  brushStop: null,
  brushOverlapId: null,

  initFixture: () => {
    // Generate symbolic cutouts
    const baseCutouts: Record<string, CutoutRecord> = {};
    for (let i = 1; i <= 18; i++) {
      const id = `cutout-${i.toString().padStart(2, '0')}`;
      baseCutouts[id] = {
        id,
        sceneId: 'scene-symbolic-window',
        appearanceTokenId: `token-${i % 6}`,
        appearanceRevisionId: 'r1',
        worldXMin: 100 + i * 10,
        worldXMax: 200 + i * 10,
        worldYMin: 100 + i * 10,
        worldYMax: 200 + i * 10,
        depthSlot: i % 7,
        allowedSlotMin: 0,
        allowedSlotMax: 6,
        locked: false,
        assemblyStepId: `step-${i % 7}`,
        actorId: 'actor-1',
        eventId: 'evt-001',
        status: 'active',
        silhouetteHash: 'hash',
      };
    }

    // Exact requirement overrides
    baseCutouts['cutout-07'] = {
      ...baseCutouts['cutout-07'],
      worldXMin: 300,
      worldXMax: 420,
      worldYMin: 180,
      worldYMax: 300,
      depthSlot: 2,
      allowedSlotMin: 1,
      allowedSlotMax: 4,
      assemblyStepId: 'step-03-depth-2',
      appearanceTokenId: 'paper-coral',
      appearanceRevisionId: 'r3'
    };

    baseCutouts['cutout-12'] = {
      ...baseCutouts['cutout-12'],
      worldXMin: 390,
      worldXMax: 450,
      worldYMin: 200,
      worldYMax: 280,
      depthSlot: 5,
      assemblyStepId: 'step-06-depth-5',
    };

    set({
      scene: {
        id: 'scene-symbolic-window',
        title: 'Symbolic Window',
        boardWidthUnits: 800,
        boardHeightUnits: 500,
        viewerOffsetMin: -80,
        viewerOffsetMax: 80,
        viewerOffsetStep: 5,
        depthSlotCount: 7,
        cutoutIds: Object.keys(baseCutouts),
        assemblyStepIds: ['step-0', 'step-1', 'step-2', 'step-03-depth-2', 'step-05-depth-4', 'step-06-depth-5', 'step-6'],
        fixtureRevisionId: 'r5',
        sceneHash: 'scene-hash'
      },
      cutouts: baseCutouts,
      viewerOffset: 0,
      history: [{
        id: 'evt-init',
        occurredAt: new Date().toISOString(),
        actor: 'system',
        kind: 'init',
        status: 'committed',
        parentId: null,
        branchId: 'main',
        targetId: 'scene-symbolic-window',
        revisionId: 'r1',
        beforePatch: null,
        afterPatch: null,
        stateHash: 'init'
      }]
    });
  },

  setViewerOffset: (offset) => set({ viewerOffset: offset }),
  selectCutout: (id) => set({ selectedCutoutId: id }),
  previewDepthMove: (cutoutId, newSlot) => {
    const cutout = get().cutouts[cutoutId];
    if (cutout && newSlot >= cutout.allowedSlotMin && newSlot <= cutout.allowedSlotMax) {
      set({ stagedDepthMove: { cutoutId, oldSlot: cutout.depthSlot, newSlot } });
    }
  },
  cancelDepthMove: () => set({ stagedDepthMove: null }),
  commitDepthMove: () => {
    const { stagedDepthMove, cutouts, history } = get();
    if (!stagedDepthMove) return;

    const { cutoutId, newSlot } = stagedDepthMove;
    const cutout = cutouts[cutoutId];
    if (!cutout) return;

    // Apply the depthSlot mutation
    const updatedCutout = {
      ...cutout,
      depthSlot: newSlot,
      assemblyStepId: newSlot === 4 && cutoutId === 'cutout-07' ? 'step-05-depth-4' : cutout.assemblyStepId
    };

    set({
      cutouts: { ...cutouts, [cutoutId]: updatedCutout },
      stagedDepthMove: null,
      history: [...history, {
        id: `evt-${history.length + 1}`,
        occurredAt: new Date().toISOString(),
        actor: 'user',
        kind: 'cutout.depth-updated',
        status: 'committed',
        parentId: history[history.length - 1].id,
        branchId: 'main',
        targetId: cutoutId,
        revisionId: `r${history.length + 1}`,
        beforePatch: { depthSlot: cutout.depthSlot },
        afterPatch: { depthSlot: newSlot },
        stateHash: `hash-${history.length + 1}`
      }]
    });
  },
  setRenderer: (r) => set({ renderer: r }),
  setBranch: (b) => set({ branch: b }),
  recordDecision: (decision) => set(s => ({ decisions: { ...s.decisions, [decision.id]: decision } })),
  addAnnotation: (annotation) => set(s => ({ annotations: { ...s.annotations, [annotation.id]: annotation } })),
  approveScene: (approval) => set(s => ({ approvals: { ...s.approvals, [approval.id]: approval } })),
  importPacket: (data) => set({ ...data }),
  resetSession: () => get().initFixture()
}));
