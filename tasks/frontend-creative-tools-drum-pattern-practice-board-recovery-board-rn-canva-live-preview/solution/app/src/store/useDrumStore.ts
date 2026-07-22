import { create } from 'zustand';
import { DrumPattern, DrumTrack, PracticeBoardState } from '../types';

interface HistoryState {
  past: DrumPattern[];
  future: DrumPattern[];
}

interface AppState extends PracticeBoardState {
  history: HistoryState;

  // Actions
  toggleStep: (trackId: string, stepIndex: number) => void;
  setStepVelocity: (trackId: string, stepIndex: number, velocity: number) => void;
  addTrack: (instrument: string) => void;
  removeTrack: (trackId: string) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  setTempo: (tempo: number) => void;
  setSteps: (steps: number) => void;
  setVolume: (trackId: string, volume: number) => void;

  // Playback
  togglePlay: () => void;
  setCurrentStep: (step: number) => void;

  // Recovery Actions
  undo: () => void;
  redo: () => void;
  reset: () => void;
  importPattern: (pattern: DrumPattern) => void;
}

const createEmptySteps = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `step-${Date.now()}-${i}`,
    active: false,
    velocity: 0.8,
  }));
};

const DEFAULT_INSTRUMENTS = ['Kick', 'Snare', 'HiHat Closed', 'HiHat Open'];
const DEFAULT_STEPS = 16;

const defaultPattern: DrumPattern = {
  id: 'default-pattern-1',
  name: 'Basic Beat',
  tempo: 120,
  steps: DEFAULT_STEPS,
  tracks: DEFAULT_INSTRUMENTS.map((inst, index) => ({
    id: `track-${Date.now()}-${index}`,
    instrument: inst,
    steps: createEmptySteps(DEFAULT_STEPS),
    muted: false,
    solo: false,
    volume: 0.8,
  })),
};

export const useDrumStore = create<AppState>((set) => ({
  pattern: defaultPattern,
  isPlaying: false,
  currentStep: 0,
  history: { past: [], future: [] },

  undo: () =>
    set((state) => {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);
      return {
        pattern: previous,
        history: {
          past: newPast,
          future: [state.pattern, ...state.history.future],
        },
      };
    }),

  redo: () =>
    set((state) => {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      return {
        pattern: next,
        history: {
          past: [...state.history.past, state.pattern],
          future: newFuture,
        },
      };
    }),

  reset: () =>
    set((state) => ({
      pattern: defaultPattern,
      history: {
        past: [...state.history.past, state.pattern],
        future: [],
      },
    })),

  importPattern: (pattern) =>
    set((state) => ({
      pattern,
      history: {
        past: [...state.history.past, state.pattern],
        future: [],
      },
    })),

  // Save state for undo wrapper
  toggleStep: (trackId, stepIndex) =>
    set((state) => {
      const newTracks = state.pattern.tracks.map((track) => {
        if (track.id === trackId) {
          const newSteps = [...track.steps];
          newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            active: !newSteps[stepIndex].active,
          };
          return { ...track, steps: newSteps };
        }
        return track;
      });
      const newPattern = { ...state.pattern, tracks: newTracks };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  setStepVelocity: (trackId, stepIndex, velocity) =>
    set((state) => {
      const newTracks = state.pattern.tracks.map((track) => {
        if (track.id === trackId) {
          const newSteps = [...track.steps];
          newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            velocity: Math.max(0, Math.min(1, velocity)),
          };
          return { ...track, steps: newSteps };
        }
        return track;
      });
      const newPattern = { ...state.pattern, tracks: newTracks };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  addTrack: (instrument) =>
    set((state) => {
      const newTrack: DrumTrack = {
        id: `track-${Date.now()}`,
        instrument,
        steps: createEmptySteps(state.pattern.steps),
        muted: false,
        solo: false,
        volume: 0.8,
      };
      const newPattern = { ...state.pattern, tracks: [...state.pattern.tracks, newTrack] };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  removeTrack: (trackId) =>
    set((state) => {
      const newPattern = {
        ...state.pattern,
        tracks: state.pattern.tracks.filter((t) => t.id !== trackId),
      };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  toggleMute: (trackId) =>
    set((state) => {
      const newTracks = state.pattern.tracks.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      );
      const newPattern = { ...state.pattern, tracks: newTracks };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  toggleSolo: (trackId) =>
    set((state) => {
      const newTracks = state.pattern.tracks.map((track) =>
        track.id === trackId ? { ...track, solo: !track.solo } : track
      );
      const newPattern = { ...state.pattern, tracks: newTracks };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  setTempo: (tempo) =>
    set((state) => {
      const newPattern = { ...state.pattern, tempo: Math.max(20, Math.min(300, tempo)) };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  setSteps: (steps) =>
    set((state) => {
      const newTracks = state.pattern.tracks.map((track) => {
        let newSteps = [...track.steps];
        if (steps > newSteps.length) {
           newSteps = [...newSteps, ...createEmptySteps(steps - newSteps.length)];
        } else if (steps < newSteps.length) {
           newSteps = newSteps.slice(0, steps);
        }
        return { ...track, steps: newSteps };
      });
      const newPattern = { ...state.pattern, steps, tracks: newTracks };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  setVolume: (trackId, volume) =>
    set((state) => {
      const newTracks = state.pattern.tracks.map((track) =>
        track.id === trackId ? { ...track, volume: Math.max(0, Math.min(1, volume)) } : track
      );
      const newPattern = { ...state.pattern, tracks: newTracks };
      return {
        pattern: newPattern,
        history: { past: [...state.history.past, state.pattern], future: [] }
      };
    }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCurrentStep: (step) => set({ currentStep: step }),
}));
