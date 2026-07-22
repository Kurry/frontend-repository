import { create } from 'zustand';
import {
  ReliefModelRecord, BrickRecord, SupportEdgeRecord, GuideGroupRecord,
  GuideStepRecord, HistoryEvent, LayoutDecisionRecord
} from '../types';
import { BASE_FIXTURE_MODEL, FIXTURE_PARTS, INITIAL_BRICKS, INITIAL_GROUPS, INITIAL_STEPS } from './fixture';
import { getBrickFootprint, rectIntersect, rectArea } from '../lib/geometry';
import { checkCollision } from '../lib/collision';

interface ViewState {
  activeCourse: number;
  selectedBrickId: string | null;
  hoveredBrickId: string | null;
  compareMode: boolean;
  renderer: 'svg' | 'canvas';
  supportBrushStuds: string[];
}

interface AppState {
  model: ReliefModelRecord | null;
  bricks: Record<string, BrickRecord>;
  parts: typeof FIXTURE_PARTS;
  supportEdges: Record<string, SupportEdgeRecord>;
  groups: Record<string, GuideGroupRecord>;
  steps: Record<string, GuideStepRecord>;
  events: HistoryEvent[];
  decisions: Record<string, LayoutDecisionRecord>;

  previewMove: { brickId: string, x: number, y: number, isValid: boolean } | null;
  previewRepair: any | null;

  viewState: ViewState;

  reset: () => void;
  recomputeSupport: () => void;
  validateGuide: () => string[];

  selectBrick: (id: string | null) => void;
  setPreviewMove: (brickId: string, x: number, y: number) => void;
  commitMove: () => void;
  cancelMove: () => void;

  previewSaveGuide: () => void;
  commitGuideRepair: () => void;
  cancelGuideRepair: () => void;
  approveModel: () => void;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export const useStore = create<AppState>((set, get) => ({
  model: null,
  bricks: {},
  parts: FIXTURE_PARTS,
  supportEdges: {},
  groups: {},
  steps: {},
  events: [],
  decisions: {},

  previewMove: null,
  previewRepair: null,

  viewState: {
    activeCourse: 2,
    selectedBrickId: null,
    hoveredBrickId: null,
    compareMode: false,
    renderer: 'svg',
    supportBrushStuds: []
  },

  reset: () => {
    set({
      model: BASE_FIXTURE_MODEL,
      bricks: INITIAL_BRICKS,
      parts: FIXTURE_PARTS,
      groups: INITIAL_GROUPS,
      steps: INITIAL_STEPS,
      supportEdges: {},
      events: [],
      previewMove: null,
      previewRepair: null,
      viewState: {
        activeCourse: 2,
        selectedBrickId: null,
        hoveredBrickId: null,
        compareMode: false,
        renderer: 'svg',
        supportBrushStuds: []
      }
    });
    get().recomputeSupport();
  },

  recomputeSupport: () => {
    const { bricks, parts, previewMove } = get();

    const virtualBricks = { ...bricks };
    if (previewMove) {
      virtualBricks[previewMove.brickId] = {
        ...virtualBricks[previewMove.brickId],
        x: previewMove.x,
        y: previewMove.y
      };
    }

    const newEdges: Record<string, SupportEdgeRecord> = {};
    const brickList = Object.values(virtualBricks).filter(b => b.status === 'active');

    for (const upper of brickList) {
      if (upper.course === 0) continue;
      const upperFootprint = getBrickFootprint(upper, parts[upper.partDefinitionId]);
      let totalFootprint = rectArea(upperFootprint);

      for (const lower of brickList) {
        if (lower.course === upper.course - 1) {
          const lowerFootprint = getBrickFootprint(lower, parts[lower.partDefinitionId]);
          const intersection = rectIntersect(upperFootprint, lowerFootprint);

          if (intersection) {
            const intersectionArea = rectArea(intersection);
            const edgeId = `edge-${lower.id}-${upper.id}`;
            const ratioDivisor = gcd(intersectionArea, totalFootprint);

            newEdges[edgeId] = {
              id: edgeId,
              supporterBrickId: lower.id,
              supportedBrickId: upper.id,
              supportedStudIds: [],
              supportedStudCount: intersectionArea,
              supportedFootprintCount: totalFootprint,
              ratioNumerator: intersectionArea / ratioDivisor,
              ratioDenominator: totalFootprint / ratioDivisor,
              revisionId: 'rev-1',
              edgeHash: 'edge-hash'
            };
          }
        }
      }
    }

    set({ supportEdges: newEdges });
  },

  validateGuide: () => {
    const { bricks, groups, supportEdges } = get();
    const violations: string[] = [];

    for (const group of Object.values(groups)) {
      if (group.kind === 'subassembly') {
        const members = group.brickIds.map(id => bricks[id]);
        for (const upper of members) {
          if (upper.course > Math.min(...members.map(m => m.course))) {
            let supportedByMembers = 0;
            const upperFootprint = getBrickFootprint(upper, get().parts[upper.partDefinitionId]);
            const totalArea = rectArea(upperFootprint);

            for (const edge of Object.values(supportEdges)) {
              if (edge.supportedBrickId === upper.id && group.brickIds.includes(edge.supporterBrickId)) {
                supportedByMembers += edge.supportedStudCount;
              }
            }
            if (supportedByMembers < totalArea) {
              violations.push(`Group ${group.id} invalid: ${upper.id} has ${supportedByMembers}/${totalArea} support from group members.`);
            }
          }
        }
      }
    }
    return violations;
  },

  selectBrick: (id) => set(state => ({ viewState: { ...state.viewState, selectedBrickId: id } })),

  setPreviewMove: (brickId, x, y) => {
    const { bricks, parts } = get();
    const virtualBricks = { ...bricks, [brickId]: { ...bricks[brickId], x, y } };

    const hasCollision = checkCollision(virtualBricks, parts, brickId);

    set({ previewMove: { brickId, x, y, isValid: !hasCollision } });
    get().recomputeSupport();
  },

  commitMove: () => {
    const { previewMove, bricks } = get();
    if (!previewMove || !previewMove.isValid) return;

    const brick = bricks[previewMove.brickId];
    const newEvent: HistoryEvent = {
      id: `evt-${Date.now()}`,
      occurredAt: new Date().toISOString(),
      actor: 'mara',
      kind: 'move_brick',
      status: 'committed',
      parentBranchId: 'main',
      targetId: previewMove.brickId,
      revisionId: `rev-${Date.now()}`,
      patch: { x: previewMove.x, y: previewMove.y },
      cancelReason: null,
      stateHash: 'geom-17d5b2'
    };

    set(state => ({
      bricks: {
        ...state.bricks,
        [previewMove.brickId]: { ...brick, x: previewMove.x, y: previewMove.y }
      },
      previewMove: null,
      events: [...state.events, newEvent]
    }));
    get().recomputeSupport();
  },

  cancelMove: () => {
    set({ previewMove: null });
    get().recomputeSupport();
  },

  previewSaveGuide: () => {
    const violations = get().validateGuide();
    if (violations.length > 0) {
      if (violations.some(v => v.includes('group-arch'))) {
        set({
          previewRepair: {
            description: 'group-arch member brick-23 requires 4/4 internal support but has 2/4. Repair: move brick-23 to new step-05-cap.',
            changes: { groupArchRemoved: ['brick-23'], newStep: 'step-05-cap' }
          }
        });
      }
    }
  },

  commitGuideRepair: () => {
    const { previewRepair, groups, steps } = get();
    if (!previewRepair) return;

    const newGroups = { ...groups };
    newGroups['group-arch'] = {
      ...groups['group-arch'],
      brickIds: groups['group-arch'].brickIds.filter(id => id !== 'brick-23')
    };

    const newSteps = { ...steps };
    newSteps['step-05-cap'] = {
      id: 'step-05-cap',
      order: 5,
      label: 'Cap the arch',
      courseMin: 3,
      courseMax: 3,
      groupIds: [],
      brickIds: ['brick-23'],
      predecessorStepIds: ['step-04-arch'],
      status: 'active',
      stepHash: 'hash-step-05-cap'
    };

    set(state => ({
      groups: newGroups,
      steps: newSteps,
      previewRepair: null,
      events: [...state.events, {
        id: `evt-${Date.now()}`,
        occurredAt: new Date().toISOString(),
        actor: 'mara',
        kind: 'guide_repair',
        status: 'committed',
        parentBranchId: 'main',
        targetId: 'group-arch',
        revisionId: `rev-${Date.now()}`,
        patch: {},
        cancelReason: null,
        stateHash: 'guide-repaired-hash'
      }]
    }));
  },

  cancelGuideRepair: () => set({ previewRepair: null }),

  approveModel: () => {
    set(state => ({
      events: [...state.events, {
        id: `evt-${Date.now()}`,
        occurredAt: new Date().toISOString(),
        actor: 'mara',
        kind: 'approve_model',
        status: 'committed',
        parentBranchId: 'main',
        targetId: 'model-fictional-lantern',
        revisionId: `rev-${Date.now()}`,
        patch: {},
        cancelReason: null,
        stateHash: 'approved-hash'
      }]
    }));
  }
}));
