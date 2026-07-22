import { create } from 'zustand';
import { CostumeRecord, Status, ScenarioState, ExportArtifact, ExportArtifactSchema } from './schema';

export interface AppState {
  records: CostumeRecord[];
  history: AppState[];
  pastActions: any[];

  // Actions
  seed: () => void;
  addRecord: (record: Omit<CostumeRecord, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<CostumeRecord>) => void;
  deleteRecord: (id: string) => void;
  reorderRecords: (activeId: string, overId: string) => void;

  // Scenario Weaver
  branchScenario: (id: string) => void;
  resolveScenario: (id: string, finalStatus: Status) => void;

  // Undo
  undo: () => void;

  // Artifact
  importArtifact: (data: unknown) => { success: boolean; error?: any };
  getExportArtifact: () => ExportArtifact;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

function computeDerived(records: CostumeRecord[]) {
  const readyCount = records.filter(r => r.status === 'ready').length;
  const scenes = Array.from(new Set(records.map(r => r.scene))).sort((a, b) => a - b);
  return {
    totalLooks: records.length,
    readyCount,
    scenesImpacted: scenes
  };
}

const initialSeed: CostumeRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `seed-${i}`,
  title: `Costume Look ${i + 1}`,
  character: i % 2 === 0 ? 'Protagonist' : 'Antagonist',
  scene: (i % 10) + 1,
  status: (['empty', 'draft', 'ready', 'changed', 'archived'] as Status[])[i % 5],
  scenarioState: 'idle',
  branchParentId: null,
}));

// We'll manage the snapshot pattern for Undo by keeping track of the `records` array.
export const useStore = create<AppState>((set, get) => ({
  records: initialSeed,
  history: [],
  pastActions: [],

  seed: () => set({ records: initialSeed, history: [], pastActions: [] }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: generateId() }];
    return { records: newRecords, history: [...state.history, state] };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return { records: newRecords, history: [...state.history, state] };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return { records: newRecords, history: [...state.history, state] };
  }),

  reorderRecords: (activeId, overId) => set((state) => {
    const oldIndex = state.records.findIndex(x => x.id === activeId);
    const newIndex = state.records.findIndex(x => x.id === overId);
    if (oldIndex === -1 || newIndex === -1) return state;

    const newRecords = [...state.records];
    const [moved] = newRecords.splice(oldIndex, 1);
    newRecords.splice(newIndex, 0, moved);

    return { records: newRecords, history: [...state.history, state] };
  }),

  branchScenario: (id) => set((state) => {
    const original = state.records.find(r => r.id === id);
    if (!original) return state;

    const branchId = generateId();
    const branch: CostumeRecord = {
      ...original,
      id: branchId,
      title: `${original.title} (Scenario)`,
      status: 'changed',
      scenarioState: 'selected',
      branchParentId: id,
    };

    const originalUpdated = { ...original, scenarioState: 'changed' as ScenarioState };

    const newRecords = state.records.map(r => r.id === id ? originalUpdated : r);
    // Insert right after original
    const insertIdx = newRecords.findIndex(r => r.id === id) + 1;
    newRecords.splice(insertIdx, 0, branch);

    return { records: newRecords, history: [...state.history, state] };
  }),

  resolveScenario: (id, finalStatus) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, scenarioState: 'resolved' as ScenarioState, status: finalStatus } : r);
    return { records: newRecords, history: [...state.history, state] };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousState = state.history[state.history.length - 1];
    return {
      records: previousState.records,
      history: state.history.slice(0, -1)
    };
  }),

  importArtifact: (data) => {
    try {
      const parsed = ExportArtifactSchema.parse(data);
      set({ records: parsed.records, history: [] }); // Reset history on import
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  },

  getExportArtifact: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: computeDerived(state.records),
      history: [], // Omitted complex action history for brevity, could track derived pastActions
    };
  }
}));

export { computeDerived };
