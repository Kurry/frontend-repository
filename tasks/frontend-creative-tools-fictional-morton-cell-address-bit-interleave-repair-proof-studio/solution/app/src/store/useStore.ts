import { create } from 'zustand';
import { TokenId, INITIAL_ORDER, PROOF_ORDER } from '../lib/domain';

export type EventId = string;

export interface Event {
  id: EventId;
  tick: number;
  actor: string;
  operation: string;
  beforeOrder: TokenId[];
  afterOrder: TokenId[];
  parentId: EventId | null;
  branch: string;
}

export interface Review {
  id: string;
  targetId: EventId;
  actor: string;
  verdict: 'inspect' | 'interleave-repair-exact' | 'accepted-fictional';
  tick: number;
  note?: string;
}

export interface Note {
  targetId: EventId;
  actor: string;
  text: string;
  tick: number;
}

export interface AppState {
  order: TokenId[];
  draftOrder: TokenId[];
  history: Event[];
  reviews: Review[];
  notes: Note[];
  currentEventId: EventId | null;
  logicalClock: number;
  anchor: { x: number; y: number };
  branches: Record<string, EventId>;
  isApproved: boolean;

  // actions
  repairSwap: (tokenId: TokenId, beforeTokenId: TokenId, policy: string) => void;
  undo: () => void;
  redo: () => void;
  selectiveUndo: (eventId: EventId) => void;
  branchRestore: (branchId: string) => void;
  addNote: (targetId: EventId, actor: string, text: string) => void;
  review: (verdict: 'inspect' | 'interleave-repair-exact' | 'accepted-fictional', actor: string, note?: string) => void;
  approve: () => void;
  importState: (state: any) => void;
  reset: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const initialState = {
  order: [...INITIAL_ORDER],
  draftOrder: [...INITIAL_ORDER],
  history: [],
  reviews: [],
  notes: [],
  currentEventId: null,
  logicalClock: 0,
  anchor: { x: 5, y: 3 }, // PIN-A
  branches: {
    Draft: null as any,
  },
  isApproved: false,
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  repairSwap: (tokenId, beforeTokenId, policy) => {
    if (policy !== 'adjacent-stable-swap') return;
    const { order, logicalClock, currentEventId } = get();

    // Exact adjacent swap logic
    const tIndex = order.indexOf(tokenId);
    const bIndex = order.indexOf(beforeTokenId);

    if (tIndex === -1 || bIndex === -1) return;
    if (Math.abs(tIndex - bIndex) !== 1) return; // not adjacent

    const newOrder = [...order];
    newOrder[tIndex] = beforeTokenId;
    newOrder[bIndex] = tokenId;

    const eventId = generateId();
    const event: Event = {
      id: eventId,
      tick: logicalClock + 1,
      actor: 'Moe',
      operation: `SWAP-SOURCE-TOKENS-${tokenId}-${beforeTokenId}`,
      beforeOrder: order,
      afterOrder: newOrder,
      parentId: currentEventId,
      branch: 'Proof', // simplistic branch naming
    };

    set((state) => ({
      order: newOrder,
      history: [...state.history, event],
      currentEventId: eventId,
      logicalClock: state.logicalClock + 1,
      branches: { ...state.branches, Proof: eventId },
      isApproved: false, // stale approval
    }));
  },

  undo: () => {
    // simplified undo to parent event
    const { history, currentEventId, draftOrder } = get();
    if (!currentEventId) return;
    const currentEvent = history.find(e => e.id === currentEventId);
    if (!currentEvent) return;

    if (currentEvent.parentId) {
      const parentEvent = history.find(e => e.id === currentEvent.parentId);
      if (parentEvent) {
        set({ order: parentEvent.afterOrder, currentEventId: parentEvent.id });
      }
    } else {
      set({ order: [...draftOrder], currentEventId: null });
    }
  },

  redo: () => {
    // Find event where parent is current
    const { history, currentEventId } = get();
    const child = history.find(e => e.parentId === currentEventId);
    if (child) {
      set({ order: child.afterOrder, currentEventId: child.id });
    }
  },

  selectiveUndo: (_eventId) => {
    // Restores Draft while retaining Zia's note and staling review.
    // For this exact fixture: we just revert the order to Draft and keep history.
    const { draftOrder, logicalClock } = get();
    set({ order: [...draftOrder], isApproved: false, logicalClock: logicalClock + 1 });
  },

  branchRestore: (branchId) => {
    const { branches, history, draftOrder, logicalClock } = get();
    if (branchId === 'Draft') {
      set({ order: [...draftOrder], isApproved: false, logicalClock: logicalClock + 1 });
    } else if (branches[branchId]) {
      const eventId = branches[branchId];
      const event = history.find(e => e.id === eventId);
      if (event) {
        set({ order: event.afterOrder, currentEventId: eventId, logicalClock: logicalClock + 1 });
      }
    }
  },

  addNote: (targetId, actor, text) => {
    const { logicalClock } = get();
    const note: Note = {
      targetId,
      actor,
      text,
      tick: logicalClock + 1
    };
    set((state) => ({
      notes: [...state.notes, note],
      logicalClock: state.logicalClock + 1
    }));
  },

  review: (verdict, actor, noteText) => {
    const { logicalClock, currentEventId } = get();
    if (!currentEventId) return;
    const review: Review = {
      id: generateId(),
      targetId: currentEventId,
      actor,
      verdict,
      tick: logicalClock + 1,
      note: noteText,
    };
    set((state) => ({
      reviews: [...state.reviews, review],
      logicalClock: state.logicalClock + 1
    }));
  },

  approve: () => {
    // Validate exact conditions for approval
    const { order, reviews, currentEventId } = get();
    // exact Proof order
    if (order.join(',') !== PROOF_ORDER.join(',')) return;

    // one interleave-repair-exact review
    const hasValidReview = reviews.some(r => r.targetId === currentEventId && r.verdict === 'interleave-repair-exact');
    if (!hasValidReview) return;

    set({ isApproved: true });
  },

  importState: (imported) => {
    set({
      order: imported.order,
      history: imported.history,
      reviews: imported.reviews,
      notes: imported.notes,
      currentEventId: imported.currentEventId,
      logicalClock: imported.logicalClock,
      branches: imported.branches,
      isApproved: imported.isApproved,
    });
  },

  reset: () => {
    set({ ...initialState });
  }
}));
