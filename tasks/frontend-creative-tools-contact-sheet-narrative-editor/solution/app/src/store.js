import { create } from 'zustand';
import { FIXTURE_FRAMES } from './fixture.js';

export const useStore = create((set, get) => ({
  frames: FIXTURE_FRAMES,
  selectedFrameIds: [],
  compareIds: [],
  bursts: FIXTURE_FRAMES.reduce((acc, frame) => {
    if (frame.burstId) {
      if (!acc[frame.burstId]) acc[frame.burstId] = { id: frame.burstId, frameIds: [], representativeId: frame.id };
      acc[frame.burstId].frameIds.push(frame.id);
    }
    return acc;
  }, {}),

  decisions: {}, // { frameId: { rating: 0-5, flag: 'pick'|'alternate'|'reject', cullReason: string } }
  crops: {}, // { frameId: { x, y, width, height, rotation } }

  sequenceSlots: Array(12).fill(null).map((_, i) => ({ id: `slot-${i}`, frameId: null, role: null, caption: '' })),
  branches: {}, // For branching sequence versions
  activeBranchId: 'main',

  reviewState: {
    isApproved: false,
    findings: [],
    stale: false
  },

  // Actions
  toggleSelection: (frameId) => set(state => {
    const isSelected = state.selectedFrameIds.includes(frameId);
    return { selectedFrameIds: isSelected ? state.selectedFrameIds.filter(id => id !== frameId) : [...state.selectedFrameIds, frameId] };
  }),
  setSelection: (frameIds) => set({ selectedFrameIds: frameIds }),

  setCompareIds: (frameIds) => set({ compareIds: frameIds.slice(0, 4) }),

  setDecision: (frameId, decisionUpdate) => set(state => {
    const current = state.decisions[frameId] || { rating: 0, flag: null, cullReason: null };
    return {
      decisions: { ...state.decisions, [frameId]: { ...current, ...decisionUpdate } },
      reviewState: { ...state.reviewState, stale: state.reviewState.isApproved ? true : state.reviewState.stale }
    };
  }),

  setCrop: (frameId, crop) => set(state => ({
    crops: { ...state.crops, [frameId]: crop },
    reviewState: { ...state.reviewState, stale: state.reviewState.isApproved ? true : state.reviewState.stale }
  })),

  updateSequenceSlot: (slotId, update) => set(state => {
    const slots = state.sequenceSlots.map(slot => slot.id === slotId ? { ...slot, ...update } : slot);
    return {
      sequenceSlots: slots,
      reviewState: { ...state.reviewState, stale: state.reviewState.isApproved ? true : state.reviewState.stale }
    };
  }),

  setBurstRepresentative: (burstId, frameId) => set(state => ({
    bursts: { ...state.bursts, [burstId]: { ...state.bursts[burstId], representativeId: frameId } }
  })),

  approveReview: () => set(state => ({
    reviewState: { ...state.reviewState, isApproved: true, stale: false, findings: [] }
  })),

  importState: (newState) => set(newState)
}));
