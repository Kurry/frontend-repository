export interface DrumStep {
  id: string;
  active: boolean;
  velocity: number; // 0.0 to 1.0
}

export interface DrumTrack {
  id: string;
  instrument: string;
  steps: DrumStep[];
  muted: boolean;
  solo: boolean;
  volume: number; // 0.0 to 1.0
}

export interface DrumPattern {
  id: string;
  name: string;
  tempo: number; // BPM
  steps: number; // 16, 32, etc.
  tracks: DrumTrack[];
}

export interface PracticeBoardState {
  pattern: DrumPattern;
  isPlaying: boolean;
  currentStep: number;
}
