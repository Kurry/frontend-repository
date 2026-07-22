import type { EnergyReading, HomeEnergyPeakObservatorySession } from './types';

export interface State {
  records: EnergyReading[];
  selectedId: string | null;
  history: EnergyReading[][];
}

export type Action =
  | { type: 'ADD_RECORD'; payload: EnergyReading }
  | { type: 'UPDATE_RECORD'; payload: EnergyReading }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SELECT_RECORD'; payload: string | null }
  | { type: 'MUTATE_FORECAST'; payload: { id: string; projection: number } }
  | { type: 'UNDO' }
  | { type: 'IMPORT'; payload: HomeEnergyPeakObservatorySession }
  | { type: 'CLEAR' };

export const initialState: State = {
  records: [
    { id: '1', value: 100, status: 'ready', forecastProjection: 105 },
    { id: '2', value: 200, status: 'draft', forecastProjection: 200 },
  ],
  selectedId: null,
  history: [],
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_RECORD':
      return { ...state, records: [...state.records, action.payload], history: [...state.history, state.records] };
    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map(r => r.id === action.payload.id ? action.payload : r),
        history: [...state.history, state.records]
      };
    case 'DELETE_RECORD':
      return {
        ...state,
        records: state.records.filter(r => r.id !== action.payload),
        history: [...state.history, state.records],
        selectedId: state.selectedId === action.payload ? null : state.selectedId
      };
    case 'SELECT_RECORD':
      return { ...state, selectedId: action.payload };
    case 'MUTATE_FORECAST':
      return {
        ...state,
        records: state.records.map(r => r.id === action.payload.id ? { ...r, forecastProjection: action.payload.projection, status: 'changed' } : r),
        history: [...state.history, state.records]
      };
    case 'UNDO':
      if (state.history.length === 0) return state;
      return { ...state, records: state.history[state.history.length - 1], history: state.history.slice(0, -1) };
    case 'IMPORT':
      return {
        records: action.payload.records,
        selectedId: null,
        history: action.payload.history.map(h => {
           try { return JSON.parse(h); } catch (e) { return []; }
        })
      };
    case 'CLEAR':
      return { records: [], selectedId: null, history: [] };
    default:
      return state;
  }
}
