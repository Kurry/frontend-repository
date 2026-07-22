import { create } from 'zustand'

export const PIECE_FIXTURES = Array.from({ length: 28 }, (_, i) => ({
  id: `piece-${i + 1}`,
  polygon: [
    { x: -20, y: -20 }, { x: 20, y: -20 },
    { x: 20, y: 20 }, { x: -20, y: 20 }
  ],
  mass: 150 + (i * 10),
  clayLot: `clay-lot-${(i % 3) + 1}`,
  glazeLots: i % 2 === 0 ? ['glaze-1'] : ['glaze-2', 'glaze-3'],
  firingStage: 'bisque',
  ownerCode: `OWNER-${i % 5}`
}))

export const SHELF_FIXTURES = Array.from({ length: 4 }, (_, i) => ({
  id: `shelf-${i + 1}`,
  radius: 300,
  heightBand: i,
  maxLoad: 5000,
  z: i * 150
}))

const DEFAULT_CURVE = [
  { id: 'c1', type: 'ramp', startTemp: 20, endTemp: 100, duration: 60, rate: 80, stage: 'pre-heat' },
  { id: 'c2', type: 'hold', startTemp: 100, endTemp: 100, duration: 30, rate: 0, stage: 'hold' },
  { id: 'c3', type: 'ramp', startTemp: 100, endTemp: 1000, duration: 300, rate: 180, stage: 'firing' }
]

const DEFAULT_WITNESSES = Array.from({ length: 4 }, (_, i) => ({
  id: `witness-${i + 1}`,
  shelfId: `shelf-${(i % 4) + 1}`,
  x: 0,
  y: 0,
  zone: 'mid'
}))

function validateCurve(curve) {
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].startTemp !== curve[i - 1].endTemp) return false;
  }
  return true;
}

export const useStore = create((set, get) => ({
  schemaVersion: "kiln-firing-project/v1",
  pieces: PIECE_FIXTURES.map(p => ({
    ...p, status: 'catalog', shelfId: null, x: 0, y: 0, rotation: 0
  })),
  shelves: SHELF_FIXTURES,
  witnesses: DEFAULT_WITNESSES,
  curve: DEFAULT_CURVE,
  batch: {
    state: 'idle', // idle, reserve, precheck, ramp, hold, cool, inspection, reconcile, completed, aborted
    logicalClock: 0,
    events: [],
    readings: [],
    quarantinedPieces: [],
    snapshots: []
  },
  adjacencyExceptions: [],
  viewMode: 'catalog', // catalog, load, curve, batch, results

  setViewMode: (mode) => set({ viewMode: mode }),

  placePiece: (id, shelfId, x, y, rotation) => set(state => {
    // 15 deg rotations
    const snappedRot = Math.round(rotation / 15) * 15;
    return {
      pieces: state.pieces.map(p => p.id === id ? { ...p, shelfId, x, y, rotation: snappedRot, status: 'placed' } : p)
    }
  }),

  unplacePiece: (id) => set(state => ({
    pieces: state.pieces.map(p => p.id === id ? { ...p, shelfId: null, x: 0, y: 0, rotation: 0, status: 'catalog' } : p)
  })),

  placeWitness: (id, shelfId, x, y, zone) => set(state => ({
    witnesses: state.witnesses.map(w => w.id === id ? { ...w, shelfId, x, y, zone } : w)
  })),

  updateCurveSegment: (id, updates) => set(state => {
    const newCurve = state.curve.map(c => c.id === id ? { ...c, ...updates } : c);
    return validateCurve(newCurve) ? { curve: newCurve } : state;
  }),

  addCurveSegment: (index, segment) => set(state => {
      const newCurve = [...state.curve];
      newCurve.splice(index, 0, segment);
      return validateCurve(newCurve) ? { curve: newCurve } : state;
  }),

  removeCurveSegment: (id) => set(state => {
      const newCurve = state.curve.filter(c => c.id !== id);
      return validateCurve(newCurve) ? { curve: newCurve } : state;
  }),

  startBatch: () => set(state => {
    if (state.batch.state !== 'idle') return state;
    return {
      batch: { ...state.batch, state: 'precheck', logicalClock: state.batch.logicalClock + 1, events: [...state.batch.events, {type: 'START'}] },
      pieces: state.pieces.map(p => p.shelfId ? { ...p, status: 'firing' } : p)
    }
  }),

  advanceBatch: () => set(state => {
    const sequence = ['precheck', 'ramp', 'hold', 'cool', 'inspection', 'reconcile', 'completed'];
    const idx = sequence.indexOf(state.batch.state);
    if (idx < 0 || idx >= sequence.length - 1) return state;
    const nextState = sequence[idx + 1];
    return {
      batch: { ...state.batch, state: nextState, logicalClock: state.batch.logicalClock + 1, events: [...state.batch.events, {type: `ADVANCE_TO_${nextState.toUpperCase()}`}] }
    }
  }),

  deviateBatch: (event) => set(state => ({
      batch: { ...state.batch, events: [...state.batch.events, {type: 'DEVIATION', data: event}], logicalClock: state.batch.logicalClock + 1 }
  })),

  abortBatch: () => set(state => ({
    batch: { ...state.batch, state: 'aborted', logicalClock: state.batch.logicalClock + 1, events: [...state.batch.events, {type: 'ABORT'}] },
    pieces: state.pieces.map(p => p.status === 'firing' ? { ...p, status: 'quarantine' } : p)
  })),

  quarantinePiece: (id) => set(state => ({
      pieces: state.pieces.map(p => p.id === id ? { ...p, status: 'quarantine' } : p)
  })),

  refirePiece: (id) => set(state => ({
       pieces: state.pieces.map(p => p.id === id ? { ...p, status: 'catalog' } : p)
  })),

  importSession: (data) => set(() => data),

  resetSession: () => set(state => ({
    schemaVersion: "kiln-firing-project/v1",
    pieces: PIECE_FIXTURES.map(p => ({
      ...p, status: 'catalog', shelfId: null, x: 0, y: 0, rotation: 0
    })),
    shelves: SHELF_FIXTURES,
    witnesses: DEFAULT_WITNESSES,
    curve: DEFAULT_CURVE,
    batch: {
      state: 'idle',
      logicalClock: 0,
      events: [],
      readings: [],
      quarantinedPieces: [],
      snapshots: []
    },
    adjacencyExceptions: [],
    viewMode: 'catalog',
  }))
}))
