export type SoundLayerStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface SoundLayer {
  id: string;
  name: string;
  status: SoundLayerStatus;
  volume: number; // 0 to 100
  pan: number; // -100 to 100
  effects: string[];
  order: number;
}

export type ScenarioState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface ScenarioWeaverState {
  state: ScenarioState;
  sourceLayerId: string | null;
  scenarioLayerId: string | null;
}

export interface SoundscapeSceneComposerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: SoundLayer[];
  derived: {
    totalActiveLayers: number;
    averageVolume: number;
    weaverState: ScenarioWeaverState;
  };
  history: any[]; // basic history for undo/redo
}
