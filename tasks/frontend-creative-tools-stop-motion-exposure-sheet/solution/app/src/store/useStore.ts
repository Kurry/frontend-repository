import { create } from 'zustand';
import type { ProjectState, Transform, EventType } from './types';
import { defaultState } from './fixture';

interface ProjectActions {
  setCurrentFrame: (frame: number) => void;
  setActiveTakeId: (id: string) => void;
  setOnionSkins: (prev: number, next: number) => void;
  selectRange: (id: string, multi: boolean) => void;
  selectObject: (id: string, multi: boolean) => void;

  updateRangeBounds: (id: string, startFrame: number, endFrame: number, mode: 'ripple' | 'overwrite') => void;
  splitRange: (id: string, frame: number) => void;

  updateObjectTransform: (id: string, frame: number, transform: Partial<Transform>) => void;
  updateCueFrame: (id: string, frame: number) => void;

  recordEvent: (type: EventType, frame: number, takeId: string) => void;

  forkTake: (sourceTakeId: string, name: string) => void;
  mergeTake: (targetTakeId: string, sourceTakeId: string, startFrame: number, endFrame: number) => void;
  approveCut: () => void;
  markApprovalsStale: () => void;

  importProject: (data: Partial<ProjectState>) => void;
  resetToFixture: () => void;
}

export const useStore = create<ProjectState & ProjectActions>((set) => ({
  ...defaultState,
  currentFrame: 0,
  activeTakeId: 'take-1',
  onionSkinPrev: 1,
  onionSkinNext: 1,
  selectedRangeIds: [],
  selectedObjectIds: [],

  setCurrentFrame: (frame) => set({ currentFrame: Math.max(0, Math.min(503, frame)) }),
  setActiveTakeId: (id) => set({ activeTakeId: id }),
  setOnionSkins: (prev, next) => set({ onionSkinPrev: prev, onionSkinNext: next }),

  selectRange: (id, multi) => set((state) => ({
    selectedRangeIds: multi
      ? (state.selectedRangeIds.includes(id) ? state.selectedRangeIds.filter(x => x !== id) : [...state.selectedRangeIds, id])
      : [id]
  })),

  selectObject: (id, multi) => set((state) => ({
    selectedObjectIds: multi
      ? (state.selectedObjectIds.includes(id) ? state.selectedObjectIds.filter(x => x !== id) : [...state.selectedObjectIds, id])
      : [id]
  })),

  updateRangeBounds: (id, startFrame, endFrame, mode) => set((state) => {
    const ranges = [...state.ranges];
    const idx = ranges.findIndex(r => r.id === id);
    if (idx === -1) return state;

    const oldRange = ranges[idx];
    const delta = (endFrame - startFrame) - (oldRange.endFrame - oldRange.startFrame);

    ranges[idx] = { ...oldRange, startFrame, endFrame };

    if (mode === 'ripple' && delta !== 0) {
      for (let i = 0; i < ranges.length; i++) {
        if (i !== idx && ranges[i].trackId === oldRange.trackId && ranges[i].startFrame > oldRange.startFrame) {
          ranges[i] = { ...ranges[i], startFrame: ranges[i].startFrame + delta, endFrame: ranges[i].endFrame + delta };
        }
      }
    }

    const approvals = state.approvals.map(a => ({ ...a, status: 'stale' as const }));
    return { ranges, approvals };
  }),

  splitRange: (id, frame) => set((state) => {
    const ranges = [...state.ranges];
    const idx = ranges.findIndex(r => r.id === id);
    if (idx === -1) return state;

    const oldRange = ranges[idx];
    if (frame <= oldRange.startFrame || frame > oldRange.endFrame) return state;

    const newRange = { ...oldRange, id: `range-split-${Date.now()}`, startFrame: frame };
    ranges[idx] = { ...oldRange, endFrame: frame - 1 };
    ranges.push(newRange);

    return { ranges };
  }),

  updateObjectTransform: (id, frame, transform) => set((state) => {
    const objects = [...state.objects];
    const idx = objects.findIndex(o => o.id === id);
    if (idx === -1) return state;

    const obj = { ...objects[idx], transforms: { ...objects[idx].transforms } };
    const current = obj.transforms[frame] || obj.transforms[0] || { x: 0, y: 0, rotation: 0, scale: 1, depth: 0, facing: 'front', visibility: true };
    obj.transforms[frame] = { ...current, ...transform };
    objects[idx] = obj;

    const approvals = state.approvals.map(a => ({ ...a, status: 'stale' as const }));
    return { objects, approvals };
  }),

  updateCueFrame: (id, frame) => set((state) => {
    const cues = state.cues.map(c => c.id === id ? { ...c, frame } : c);
    const approvals = state.approvals.map(a => ({ ...a, status: 'stale' as const }));
    return { cues, approvals };
  }),

  recordEvent: (type, frame, takeId) => set((state) => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type,
      frame,
      takeId,
      hash: `hash-${Date.now()}`
    };
    const approvals = state.approvals.map(a => ({ ...a, status: 'stale' as const }));
    return {
      captureEvents: [...state.captureEvents, newEvent],
      logicalClock: state.logicalClock + 1,
      approvals
    };
  }),

  forkTake: (sourceTakeId, name) => set((state) => {
    const newTake = {
      id: `take-${Date.now()}`,
      sourceTakeId,
      timestamp: Date.now(),
      name
    };
    return { takes: [...state.takes, newTake], activeTakeId: newTake.id };
  }),

  mergeTake: (targetTakeId, sourceTakeId, startFrame, endFrame) => set((state) => {
    const ranges = state.ranges.map(r => {
      if (r.takeId === sourceTakeId && r.startFrame >= startFrame && r.endFrame <= endFrame) {
        return { ...r, takeId: targetTakeId };
      }
      return r;
    });
    return { ranges };
  }),

  approveCut: () => set((state) => {
    const newApproval = {
      id: `app-${Date.now()}`,
      timestamp: Date.now(),
      cutRevision: state.approvals.length + 1,
      status: 'approved' as const,
      hash: `hash-${Date.now()}`
    };
    return { approvals: [...state.approvals, newApproval] };
  }),

  markApprovalsStale: () => set((state) => ({
    approvals: state.approvals.map(a => ({ ...a, status: 'stale' }))
  })),

  importProject: (data) => set((state) => {
    if (!data.schemaVersion || !data.shots) return state;
    return { ...state, ...data, approvals: data.approvals || state.approvals };
  }),

  resetToFixture: () => set(() => ({
    ...defaultState,
    currentFrame: 0,
    activeTakeId: 'take-1',
    onionSkinPrev: 1,
    onionSkinNext: 1,
    selectedRangeIds: [],
    selectedObjectIds: []
  }))
}));
