import { useReducer, useMemo } from 'react';
import { WeavingDraftProject, ThreadingArray, TieUpMatrix, TreadlingArray, YarnColor, FIXTURE_ENDS, FIXTURE_PICKS, Shaft, Treadle, RepeatDef } from './types';
import { computeFloatValidation } from './validator';

const defaultThreading: ThreadingArray = Array(FIXTURE_ENDS).fill(null).map((_, i) => (i % 4) as Shaft);
defaultThreading[8] = 0;

const defaultTieUp: TieUpMatrix = [
  [true, true, false, false],
  [false, true, true, false],
  [false, false, true, true],
  [true, false, false, true],
];

const defaultTreadling: TreadlingArray = Array(FIXTURE_PICKS).fill(null).map((_, i) => (i % 4) as Treadle);
const defaultWarpColors: YarnColor[] = Array(FIXTURE_ENDS).fill('white');
const defaultWeftColors: YarnColor[] = Array(FIXTURE_PICKS).fill('black');

for(let i=0; i<8; i++) {
    defaultTreadling[i] = 3;
}

export const initialState: WeavingDraftProject = {
  schemaVersion: "weaving-draft-project/v1",
  dimensions: { ends: FIXTURE_ENDS, picks: FIXTURE_PICKS },
  threading: defaultThreading,
  tieUp: defaultTieUp,
  treadling: defaultTreadling,
  warpColors: defaultWarpColors,
  weftColors: defaultWeftColors,
  repeats: [],
  variants: [],
  activeVariantId: null,
  history: [],
  approvedHash: null,
  exportedAt: null,
  simulation: null
};

export type Action =
  | { type: 'SET_THREADING', index: number, shaft: Shaft | null }
  | { type: 'SET_TREADLING', index: number, treadle: Treadle | null }
  | { type: 'SET_TIE_UP', treadle: number, shaft: number, value: boolean }
  | { type: 'SET_WARP_COLOR', index: number, color: YarnColor }
  | { type: 'SET_WEFT_COLOR', index: number, color: YarnColor }
  | { type: 'ADD_REPEAT', repeat: RepeatDef }
  | { type: 'BRANCH_VARIANT', name: string }
  | { type: 'SWITCH_VARIANT', id: string }
  | { type: 'MERGE_VARIANT', id: string }
  | { type: 'SIMULATE_PICK' }
  | { type: 'SIMULATE_UNWEAVE' }
  | { type: 'SIMULATE_ERROR', errorType: 'wrong_treadle' | 'wrong_color' | 'broken_yarn' }
  | { type: 'APPLY_CORRECTION', index: number, shaft?: Shaft, treadle?: Treadle, color?: YarnColor, grid: 'threading' | 'treadling' | 'warp' | 'weft' }
  | { type: 'APPROVE_DRAFT' }
  | { type: 'IMPORT_STATE', state: WeavingDraftProject };

export function draftReducer(state: WeavingDraftProject, action: Action): WeavingDraftProject {
  switch (action.type) {
    case 'SET_THREADING': {
      const newThreading = [...state.threading];
      newThreading[action.index] = action.shaft;
      return { ...state, threading: newThreading, history: [...state.history, {action: action.type, payload: action}], approvedHash: null };
    }
    case 'SET_TREADLING': {
      const newTreadling = [...state.treadling];
      newTreadling[action.index] = action.treadle;
      return { ...state, treadling: newTreadling, history: [...state.history, {action: action.type, payload: action}], approvedHash: null };
    }
    case 'SET_TIE_UP': {
      const newTieUp = state.tieUp.map(row => [...row]);
      newTieUp[action.treadle][action.shaft] = action.value;
      return { ...state, tieUp: newTieUp, history: [...state.history, {action: action.type, payload: action}], approvedHash: null };
    }
    case 'SET_WARP_COLOR': {
      const newWarpColors = [...state.warpColors];
      newWarpColors[action.index] = action.color;
      return { ...state, warpColors: newWarpColors, history: [...state.history, {action: action.type, payload: action}], approvedHash: null };
    }
    case 'SET_WEFT_COLOR': {
      const newWeftColors = [...state.weftColors];
      newWeftColors[action.index] = action.color;
      return { ...state, weftColors: newWeftColors, history: [...state.history, {action: action.type, payload: action}], approvedHash: null };
    }
    case 'ADD_REPEAT': {
      const r = action.repeat;
      let newThreading = [...state.threading];
      let newTreadling = [...state.treadling];
      let newWarpColors = [...state.warpColors];
      let newWeftColors = [...state.weftColors];

      if (r.type === 'threading') {
        const slice = state.threading.slice(r.start, r.end + 1);
        if (r.operation === 'tile') {
          for(let i = r.end + 1, j=0; i < state.dimensions.ends; i++, j++) {
             newThreading[i] = slice[j % slice.length];
          }
        } else if (r.operation === 'mirror') {
          const rev = [...slice].reverse();
          for(let i = r.end + 1, j=0; i < r.end + 1 + rev.length && i < state.dimensions.ends; i++, j++) {
             newThreading[i] = rev[j];
          }
        }
      } else if (r.type === 'treadling') {
        const slice = state.treadling.slice(r.start, r.end + 1);
        if (r.operation === 'tile') {
          for(let i = r.end + 1, j=0; i < state.dimensions.picks; i++, j++) {
             newTreadling[i] = slice[j % slice.length];
          }
        }
      } else if (r.type === 'color') {
          // color logic
      }
      return { ...state, repeats: [...state.repeats, action.repeat], threading: newThreading, treadling: newTreadling, warpColors: newWarpColors, weftColors: newWeftColors, history: [...state.history, {action: action.type, payload: action}] };
    }
    case 'BRANCH_VARIANT': {
      const variant = {
        id: crypto.randomUUID(),
        name: action.name,
        threading: [...state.threading],
        tieUp: state.tieUp.map(r => [...r]),
        treadling: [...state.treadling],
        warpColors: [...state.warpColors],
        weftColors: [...state.weftColors],
      };
      return { ...state, variants: [...state.variants, variant] };
    }
    case 'SWITCH_VARIANT': {
      const variant = state.variants.find(v => v.id === action.id);
      if (!variant) return state;
      return {
        ...state,
        threading: [...variant.threading],
        tieUp: variant.tieUp.map(r => [...r]),
        treadling: [...variant.treadling],
        warpColors: [...variant.warpColors],
        weftColors: [...variant.weftColors],
        activeVariantId: action.id
      };
    }
    case 'MERGE_VARIANT': {
      const variant = state.variants.find(v => v.id === action.id);
      if (!variant) return state;
      // In a full version, we'd prompt for range merge, here we apply it whole
      return {
        ...state,
        threading: [...variant.threading],
        tieUp: variant.tieUp.map(r => [...r]),
        treadling: [...variant.treadling],
        warpColors: [...variant.warpColors],
        weftColors: [...variant.weftColors],
        activeVariantId: null
      };
    }
    case 'SIMULATE_PICK': {
      const cur = state.simulation ? state.simulation.currentPick : 0;
      if (cur >= state.dimensions.picks) return state;
      return { ...state, simulation: { currentPick: cur + 1, events: [...(state.simulation?.events || []), { pick: cur, event: 'pick' }] } };
    }
    case 'SIMULATE_UNWEAVE': {
       const cur = state.simulation ? state.simulation.currentPick : 0;
       if (cur <= 0) return state;
       return { ...state, simulation: { currentPick: cur - 1, events: state.simulation!.events.slice(0, -1) } };
    }
    case 'SIMULATE_ERROR': {
      const cur = state.simulation ? state.simulation.currentPick : 0;
      return { ...state, simulation: { currentPick: cur, events: [...(state.simulation?.events || []), { pick: cur, event: action.errorType }] } };
    }
    case 'APPLY_CORRECTION': {
        const newState = { ...state };
        if (action.grid === 'threading' && action.shaft !== undefined) {
             newState.threading[action.index] = action.shaft;
        } else if (action.grid === 'treadling' && action.treadle !== undefined) {
             newState.treadling[action.index] = action.treadle;
        } else if (action.grid === 'warp' && action.color) {
             newState.warpColors[action.index] = action.color;
        } else if (action.grid === 'weft' && action.color) {
             newState.weftColors[action.index] = action.color;
        }
        newState.history.push({ action: 'APPLY_CORRECTION', payload: action });
        return newState;
    }
    case 'APPROVE_DRAFT': {
      return { ...state, approvedHash: "APPROVED_" + Date.now() };
    }
    case 'IMPORT_STATE': {
      return action.state;
    }
    default:
      return state;
  }
}

export function computeDrawdown(
  ends: number, picks: number,
  threading: ThreadingArray, tieUp: TieUpMatrix, treadling: TreadlingArray,
  warpColors: YarnColor[], weftColors: YarnColor[]
) {
  const drawdown = [];
  for (let p = 0; p < picks; p++) {
    const row = [];
    const treadle = treadling[p];
    for (let e = 0; e < ends; e++) {
      const shaft = threading[e];
      if (treadle !== null && shaft !== null && tieUp[treadle][shaft]) {
        row.push(warpColors[e]);
      } else {
        row.push(weftColors[p]);
      }
    }
    drawdown.push(row);
  }
  return drawdown;
}

export function useWeavingStore() {
  const [state, dispatch] = useReducer(draftReducer, initialState);

  const drawdown = useMemo(() =>
    computeDrawdown(state.dimensions.ends, state.dimensions.picks, state.threading, state.tieUp, state.treadling, state.warpColors, state.weftColors),
    [state]
  );

  const validation = useMemo(() =>
     computeFloatValidation(drawdown, state.warpColors, state.weftColors, state.threading, state.treadling, state.tieUp, 3),
  [drawdown, state.warpColors, state.weftColors, state.threading, state.treadling, state.tieUp]);

  return { state, dispatch, drawdown, validation };
}
