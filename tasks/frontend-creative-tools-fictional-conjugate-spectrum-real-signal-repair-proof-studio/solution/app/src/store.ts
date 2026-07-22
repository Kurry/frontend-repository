import { create } from 'zustand';
import { Gaussian, add, sub, conj, inverseContribution } from './lib/math';
import { Note, Review, Approval, EventLog, BinId } from './lib/schema';

// Initial constants
export const INITIAL_BINS: Record<BinId, Gaussian> = {
  "BIN-K0": { r: 16, i: 0 },   // 4+0i in quarters -> 16
  "BIN-K1": { r: 8, i: 8 },    // 2+2i
  "BIN-K2": { r: 0, i: 0 },    // 0+0i
  "BIN-K3": { r: 4, i: -8 }    // 1-2i
};

export const LOCKS = {
  "BIN-K0": { r: true, i: true },
  "BIN-K1": { r: true, i: true },
  "BIN-K2": { r: true, i: true },
  "BIN-K3": { r: false, i: true },
};

export const FIXTURE_HASH = "quartz-quartet-r1-hash";

type State = {
  bins: Record<BinId, Gaussian>; // Values stored in QUARTERS to maintain exact integer math
  notes: Note[];
  reviews: Review[];
  approvals: Approval[];
  history: EventLog[];
  currentTick: number;
  selectedBin: BinId | null;
  selectedSample: number | null;
  previewBinK3: Gaussian | null;
  isCompactMode: boolean;
  replayFrame: number;

  // Actions
  moveBinK3: (realQuarter: number, imaginaryQuarter: number, previewOnly?: boolean) => void;
  cancelMove: () => void;
  confirmMove: (actor: string) => void;
  addNote: (note: Omit<Note, 'id' | 'tick'>) => void;
  addReview: (review: Omit<Review, 'id' | 'tick' | 'stateHash'>) => void;
  approve: () => void;
  selectBin: (id: BinId | null) => void;
  selectSample: (idx: number | null) => void;
  setReplayFrame: (frame: number) => void;
  undo: () => void;
  redo: () => void; // branch restore
  reset: () => void;
  setCompactMode: (isCompact: boolean) => void;

  // Getters for derived state
  getInverseSamples: (overrideBins?: Record<BinId, Gaussian>) => Gaussian[]; // Returns quarters
  getResidual: (overrideBins?: Record<BinId, Gaussian>) => Gaussian; // Returns quarters
  getSpectrumEnergy: (overrideBins?: Record<BinId, Gaussian>) => number;
  getTimeEnergy: (overrideBins?: Record<BinId, Gaussian>) => number;
  getMaxImaginaryMagnitude: (overrideBins?: Record<BinId, Gaussian>) => number;
  getStateHash: () => string;
  isApproved: () => boolean;
  getInverseDeltas: () => Gaussian[]; // Returns quarters
};

const computeStateHash = (bins: Record<BinId, Gaussian>, notes: Note[]) => {
  // Simple stable deterministic hash
  return JSON.stringify({
    bins: {
      "BIN-K0": [bins["BIN-K0"].r, bins["BIN-K0"].i],
      "BIN-K1": [bins["BIN-K1"].r, bins["BIN-K1"].i],
      "BIN-K2": [bins["BIN-K2"].r, bins["BIN-K2"].i],
      "BIN-K3": [bins["BIN-K3"].r, bins["BIN-K3"].i],
    },
    notesCount: notes.length,
    fixture: FIXTURE_HASH
  });
};

export const useStore = create<State>((set, get) => ({
  bins: INITIAL_BINS,
  notes: [],
  reviews: [],
  approvals: [],
  history: [],
  currentTick: 0,
  selectedBin: null,
  selectedSample: null,
  previewBinK3: null,
  isCompactMode: false,
  replayFrame: 0,

  moveBinK3: (r, i, previewOnly = false) => {
    // Only real is unlocked. If Imaginary changes, or real is out of bounds, invalid.
    if (i !== -8) return; // Locked at -2
    if (r < -16 || r > 16) return; // Domain -4 to 4
    if (r % 1 !== 0 || i % 1 !== 0) return; // Quantization

    // Exact conjugate target is (8, -8) -> 2-2i. Draft is (4, -8) -> 1-2i
    const target = { r, i };

    if (previewOnly) {
      set({ previewBinK3: target });
    } else {
      set({ previewBinK3: target }); // Stage it before confirm
    }
  },

  cancelMove: () => set({ previewBinK3: null, replayFrame: 0 }),

  confirmMove: (actor) => {
    const { bins, previewBinK3, currentTick, history } = get();
    if (!previewBinK3) return;

    const before = bins["BIN-K3"];

    // Only process if different
    if (before.r === previewBinK3.r && before.i === previewBinK3.i) {
       set({ previewBinK3: null });
       return;
    }

    const newBins = { ...bins, "BIN-K3": previewBinK3 };
    const hash = computeStateHash(newBins, get().notes);

    const event: EventLog = {
      id: `evt-${Date.now()}`,
      tick: currentTick + 1,
      actor,
      operation: "MOVE-BIN-K3-REAL-ONE-TO-TWO",
      binId: "BIN-K3",
      fieldId: "real",
      beforeValue: before,
      afterValue: previewBinK3,
      stateHash: hash
    };

    set({
      bins: newBins,
      previewBinK3: null,
      currentTick: currentTick + 1,
      history: [...history, event],
      replayFrame: 10,
      // invalidate reviews/approvals
      reviews: get().reviews.filter(r => r.stateHash === hash),
      approvals: get().approvals.filter(a => a.stateHash === hash)
    });
  },

  addNote: (note) => {
    set(state => ({
      notes: [...state.notes, { ...note, id: `note-${Date.now()}`, tick: state.currentTick + 1 }],
      currentTick: state.currentTick + 1
    }));
  },

  addReview: (review) => {
    set(state => ({
      reviews: [...state.reviews, { ...review, id: `rev-${Date.now()}`, tick: state.currentTick + 1, stateHash: get().getStateHash() }],
      currentTick: state.currentTick + 1
    }));
  },

  approve: () => {
    const state = get();
    const hash = state.getStateHash();
    // Validate approval conditions
    const bins = state.bins;
    if (bins["BIN-K3"].r !== 8 || bins["BIN-K3"].i !== -8) return; // Must be 2-2i
    if (state.getResidual().r !== 0 || state.getResidual().i !== 0) return;
    const hasReview = state.reviews.some(r => r.stateHash === hash && r.verdict === "conjugate-repair-exact");
    if (!hasReview) return;

    set(state => ({
      approvals: [...state.approvals, { id: `appr-${Date.now()}`, tick: state.currentTick + 1, stateHash: hash }],
      currentTick: state.currentTick + 1
    }));
  },

  selectBin: (id) => set({ selectedBin: id }),
  selectSample: (idx) => set({ selectedSample: idx }),
  setReplayFrame: (frame) => set({ replayFrame: frame }),

  undo: () => {
    // Fictional undo to Draft state
    const state = get();
    // Check if we can undo
    if (state.bins["BIN-K3"].r === 8 && state.bins["BIN-K3"].i === -8) {
      const newBins = { ...state.bins, "BIN-K3": INITIAL_BINS["BIN-K3"] };
      const event: EventLog = {
        id: `evt-undo-${Date.now()}`,
        tick: state.currentTick + 1,
        actor: "System",
        operation: "UNDO-REPAIR",
        stateHash: computeStateHash(newBins, state.notes)
      };
      set({
        bins: newBins,
        currentTick: state.currentTick + 1,
        history: [...state.history, event],
        // Leaves notes intact, stales review
      });
    }
  },

  redo: () => {
    // Restore proof
    const state = get();
    if (state.bins["BIN-K3"].r === 4 && state.bins["BIN-K3"].i === -8) {
      const newBins = { ...state.bins, "BIN-K3": { r: 8, i: -8 } };
      const event: EventLog = {
        id: `evt-redo-${Date.now()}`,
        tick: state.currentTick + 1,
        actor: "System",
        operation: "REDO-REPAIR",
        stateHash: computeStateHash(newBins, state.notes)
      };
      set({
        bins: newBins,
        currentTick: state.currentTick + 1,
        history: [...state.history, event],
      });
    }
  },

  reset: () => set({
    bins: INITIAL_BINS,
    notes: [],
    reviews: [],
    approvals: [],
    history: [],
    currentTick: 0,
    selectedBin: null,
    selectedSample: null,
    previewBinK3: null,
    isCompactMode: false,
    replayFrame: 0
  }),

  setCompactMode: (compact) => set({ isCompactMode: compact }),

  getInverseSamples: (overrideBins) => {
    const bins = overrideBins || get().bins;
    const effectiveBins = get().previewBinK3 ? { ...bins, "BIN-K3": get().previewBinK3! } : bins;
    const b0 = { r: effectiveBins["BIN-K0"].r / 4, i: effectiveBins["BIN-K0"].i / 4 }; // Quarter scale internally
    const b1 = { r: effectiveBins["BIN-K1"].r / 4, i: effectiveBins["BIN-K1"].i / 4 };
    const b2 = { r: effectiveBins["BIN-K2"].r / 4, i: effectiveBins["BIN-K2"].i / 4 };
    const b3 = { r: effectiveBins["BIN-K3"].r / 4, i: effectiveBins["BIN-K3"].i / 4 };

    const samples: Gaussian[] = [];
    for (let n = 0; n < 4; n++) {
      let sum = { r: 0, i: 0 };
      sum = add(sum, inverseContribution(b0, 0, n));
      sum = add(sum, inverseContribution(b1, 1, n));
      sum = add(sum, inverseContribution(b2, 2, n));
      sum = add(sum, inverseContribution(b3, 3, n));
      // Re-scale up to quarters for consistent output type
      samples.push({ r: Math.round(sum.r * 4), i: Math.round(sum.i * 4) });
    }
    return samples; // e.g. [7, 1, 1, 8] means 7/4, 1/4i, 1/4, 2
  },

  getResidual: (overrideBins) => {
    const bins = overrideBins || get().bins;
    const b3 = get().previewBinK3 || bins["BIN-K3"];
    const b1 = bins["BIN-K1"]; // Reference
    // X[3] - conj(X[1])
    return sub(b3, conj(b1));
  },

  getSpectrumEnergy: (overrideBins) => {
    const bins = overrideBins || get().bins;
    const effectiveBins = get().previewBinK3 ? { ...bins, "BIN-K3": get().previewBinK3! } : bins;
    // Energy in quarters: sum(|X|^2)/4. |X|^2 is r^2+i^2 in quarters, meaning 16x actual.
    // Actual energy = sum((r/4)^2 + (i/4)^2) / 4 = sum(r^2+i^2)/(16*4)
    let total = 0;
    for (const k of ["BIN-K0", "BIN-K1", "BIN-K2", "BIN-K3"] as BinId[]) {
      total += (effectiveBins[k].r * effectiveBins[k].r + effectiveBins[k].i * effectiveBins[k].i);
    }
    return total / 64; // Since we store quarters, r*r is 16x actual, divide by 64 gets actual energy.
  },

  getTimeEnergy: (overrideBins) => {
    const samples = get().getInverseSamples(overrideBins);
    let total = 0;
    for (let n = 0; n < 4; n++) {
      total += (samples[n].r * samples[n].r + samples[n].i * samples[n].i);
    }
    // samples in quarters, r*r is 16x actual. No /4 for time energy.
    return total / 16;
  },

  getMaxImaginaryMagnitude: (overrideBins) => {
    const samples = get().getInverseSamples(overrideBins);
    return Math.max(...samples.map(s => Math.abs(s.i)));
  },

  getStateHash: () => {
    return computeStateHash(get().bins, get().notes);
  },

  isApproved: () => {
    const state = get();
    return state.approvals.some(a => a.stateHash === state.getStateHash());
  },

  getInverseDeltas: () => {
    // Deltas: [+1/4, -1/4i, -1/4, +1/4i] in quarters is [+1, -1i, -1, +1i]
    return [
      { r: 1, i: 0 },
      { r: 0, i: -1 },
      { r: -1, i: 0 },
      { r: 0, i: 1 }
    ];
  }
}));
